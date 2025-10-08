import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { differenceInDays } from "date-fns";

interface Profile {
  user_id: string;
  tenant_id: string;
  full_name: string;
}

interface Tenant {
  id: string;
  name: string;
  subscription_status:
    | "inactive"
    | "active"
    | "trialing"
    | "trial"
    | "past_due"
    | "suspended"
    | "cancelled"
    | "canceled"
    | "comped";
  plan_type: string;
  plan_code?: string;
  created_at: string;
  grace_period_ends_at: string | null;
  subscription_current_period_end: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  is_comped?: boolean;
  comp_reason?: string | null;
  comp_expires_at?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  billing_email?: string | null;
  seat_limit?: number | null;
}

interface SubscriptionConfig {
  plan_type: string;
  trial_duration_days: number;
  grace_period_days: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  tenant: Tenant | null;
  role: string | null;
  loading: boolean;
  subscriptionLoading: boolean;
  subscriptionConfig: SubscriptionConfig | null;
  isInGracePeriod: boolean;
  trialDaysRemaining: number;
  graceDaysRemaining: number;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Performance monitoring
interface PerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  fetchDurations: number[];
}

const performanceMetrics: PerformanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  fetchDurations: [],
};

// Utility function to generate randomized cache duration
const getRandomizedCacheDuration = (status: string): number => {
  const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  if (["active", "comped"].includes(status)) {
    // 2-6 hours randomized to prevent thundering herd
    return random(2 * 60 * 60 * 1000, 6 * 60 * 60 * 1000);
  } else if (["trial", "trialing"].includes(status)) {
    // 15-30 minutes randomized
    return random(15 * 60 * 1000, 30 * 60 * 1000);
  } else if (["past_due", "suspended"].includes(status)) {
    // 2-10 minutes randomized
    return random(2 * 60 * 1000, 10 * 60 * 1000);
  } else {
    // 5-15 minutes default randomized
    return random(5 * 60 * 1000, 15 * 60 * 1000);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionConfig, setSubscriptionConfig] = useState<SubscriptionConfig | null>(null);
  const [lastSubscriptionFetch, setLastSubscriptionFetch] = useState<number>(0);
  const fetchingProfileRef = useRef<string | null>(null);
  const backgroundFetchRef = useRef<Promise<any> | null>(null);
  const lastSubscriptionCheck = useRef<number>(0);
  const lastNavigationTime = useRef<number>(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Debounced subscription checking - minimum 30s between checks
  const shouldCheckSubscription = (): boolean => {
    const now = Date.now();
    const timeSinceLastCheck = now - lastSubscriptionCheck.current;
    const minimumInterval = 30 * 1000; // 30 seconds

    if (timeSinceLastCheck >= minimumInterval) {
      lastSubscriptionCheck.current = now;
      return true;
    }
    return false;
  };

  // Navigation debouncing to prevent cache thrashing
  const shouldRefreshOnNavigation = (): boolean => {
    const now = Date.now();
    const timeSinceLastNav = now - lastNavigationTime.current;
    const debounceInterval = 5 * 1000; // 5 seconds

    if (timeSinceLastNav >= debounceInterval) {
      lastNavigationTime.current = now;
      return true;
    }
    return false;
  };

  const fetchTenantSubscription = async (tenantId: string, planType: string, userRole?: string) => {
    const fetchStartTime = Date.now();

    try {
      setSubscriptionLoading(true);
      console.log("[AuthContext] fetchTenantSubscription starting for tenant:", tenantId);

      // Check session storage cache with randomized duration
      const cacheKey = `subscription_${tenantId}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        try {
          const { data, timestamp, status } = JSON.parse(cached);
          const cacheDuration = getRandomizedCacheDuration(status);

          if (Date.now() - timestamp < cacheDuration) {
            performanceMetrics.cacheHits++;
            console.log(
              `[AuthContext] CACHE HIT - Using cached subscription data (${status}, ${Math.round(cacheDuration / 1000)}s TTL)`,
            );
            console.log(
              `[AuthContext] Performance - Cache hits: ${performanceMetrics.cacheHits}, misses: ${performanceMetrics.cacheMisses}`,
            );

            setTenant(data.tenant);
            setSubscriptionConfig(data.config);
            setLastSubscriptionFetch(Date.now());
            setSubscriptionLoading(false);
            return; // Use cached data
          } else {
            console.log(`[AuthContext] Cache expired for status: ${status}`);
          }
        } catch (e) {
          console.warn("[AuthContext] Failed to parse cached subscription:", e);
        }
      }

      performanceMetrics.cacheMisses++;
      console.log(`[AuthContext] CACHE MISS - Fetching fresh data`);
      console.log(
        `[AuthContext] Performance - Cache hits: ${performanceMetrics.cacheHits}, misses: ${performanceMetrics.cacheMisses}`,
      );

      // Determine if user is admin
      const isAdminUser = userRole === "super_admin" || userRole === "clinic_admin";
      console.log("[AuthContext] User is admin:", isAdminUser);

      // Background fetch completion tracking with 10s timeout
      const createTimeoutWithTracking = (name: string, timeoutMs: number = 10000) =>
        new Promise((_, reject) =>
          setTimeout(() => {
            console.error(`[AuthContext] ${name} query TIMEOUT after ${timeoutMs}ms`);
            const duration = Date.now() - fetchStartTime;
            performanceMetrics.fetchDurations.push(duration);
            if (performanceMetrics.fetchDurations.length > 100) {
              performanceMetrics.fetchDurations = performanceMetrics.fetchDurations.slice(-50); // Keep last 50
            }
            reject(new Error(`${name} query timeout after ${timeoutMs}ms`));
          }, timeoutMs),
        );

      let tenantData;
      if (isAdminUser) {
        // Admins can see all tenant fields - with 10s timeout protection
        console.log("[AuthContext] Fetching tenant data (admin path)...");
        const tenantPromise = supabase.from("tenants").select("*").eq("id", tenantId).single();

        const result = (await Promise.race([tenantPromise, createTimeoutWithTracking("Tenant (admin)", 10000)])) as any;
        if (result.error) throw result.error;
        tenantData = result.data;
        console.log("[AuthContext] Tenant data fetched (admin path)");
      } else {
        // Non-admins only see non-sensitive fields via safe function - with 10s timeout protection
        console.log("[AuthContext] Fetching tenant data (non-admin path)...");
        const rpcPromise = supabase.rpc("get_tenant_safe", { p_user_id: user?.id }).single();

        const result = (await Promise.race([rpcPromise, createTimeoutWithTracking("Tenant (RPC)", 10000)])) as any;
        if (result.error) throw result.error;
        tenantData = result.data;
        console.log("[AuthContext] Tenant data fetched (non-admin path)");
      }

      // Fetch subscription config - with 10s timeout protection
      console.log("[AuthContext] Fetching subscription config...");
      const configPromise = supabase
        .from("subscription_config")
        .select("plan_type, trial_duration_days, grace_period_days")
        .eq("plan_type", planType)
        .single();

      const configResult = (await Promise.race([
        configPromise,
        createTimeoutWithTracking("Subscription config", 10000),
      ])) as any;
      if (configResult.error) throw configResult.error;

      const fetchDuration = Date.now() - fetchStartTime;
      performanceMetrics.fetchDurations.push(fetchDuration);
      if (performanceMetrics.fetchDurations.length > 100) {
        performanceMetrics.fetchDurations = performanceMetrics.fetchDurations.slice(-50);
      }

      const avgDuration =
        performanceMetrics.fetchDurations.reduce((a, b) => a + b, 0) / performanceMetrics.fetchDurations.length;
      console.log(`[AuthContext] Fetch completed in ${fetchDuration}ms (avg: ${Math.round(avgDuration)}ms)`);

      setTenant(tenantData);
      setSubscriptionConfig(configResult.data);
      setLastSubscriptionFetch(Date.now());

      // Cache the result in session storage with randomized expiry
      try {
        const cacheDuration = getRandomizedCacheDuration(tenantData.subscription_status);
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: { tenant: tenantData, config: configResult.data },
            timestamp: Date.now(),
            status: tenantData.subscription_status,
            cacheDuration: cacheDuration,
          }),
        );
        console.log(`[AuthContext] Data cached with ${Math.round(cacheDuration / 1000)}s TTL`);
      } catch (e) {
        console.warn("[AuthContext] Failed to cache subscription data:", e);
      }

      console.log("[AuthContext] fetchTenantSubscription completed successfully");
    } catch (error) {
      const fetchDuration = Date.now() - fetchStartTime;
      console.error(`[AuthContext] Error fetching subscription after ${fetchDuration}ms:`, error);
      // Set fallback values to allow app to continue
      setTenant(null);
      setSubscriptionConfig(null);
    } finally {
      // CRITICAL: Always set loading to false
      console.log("[AuthContext] Setting subscriptionLoading to false");
      setSubscriptionLoading(false);
    }
  };

  const fetchProfileAndRole = async (userId: string) => {
    // Prevent duplicate concurrent calls for the same user
    if (fetchingProfileRef.current === userId) {
      console.log("[AuthContext] Already fetching profile for user:", userId);
      return;
    }

    try {
      fetchingProfileRef.current = userId;
      setSubscriptionLoading(true);
      console.log("[AuthContext] fetchProfileAndRole starting for user:", userId);

      // Check current session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("[AuthContext] Current session:", session?.user?.id);

      // Fetch role and profile in parallel with 10s timeout for each
      console.log("[AuthContext] Fetching role and profile in parallel...");

      const rolePromise = supabase.from("user_roles").select("role").eq("user_id", userId).single();

      const profilePromise = supabase
        .from("profiles")
        .select("user_id, tenant_id, full_name")
        .eq("user_id", userId)
        .single();

      const createTimeout = (name: string) =>
        new Promise((_, reject) =>
          setTimeout(() => {
            console.error(`[AuthContext] ${name} query TIMEOUT after 10 seconds`);
            reject(new Error(`${name} query timeout`));
          }, 10000),
        );

      // Run both queries in parallel
      const [roleResult, profileResult] = await Promise.all([
        Promise.race([rolePromise, createTimeout("Role")]),
        Promise.race([profilePromise, createTimeout("Profile")]),
      ]);

      const { data: roleData, error: roleError } = roleResult as any;
      const { data: profileData, error: profileError } = profileResult as any;

      if (roleError) {
        console.error("[AuthContext] Error fetching role:", roleError);
        throw roleError;
      }

      if (profileError) {
        console.error("[AuthContext] Error fetching profile:", profileError);
        throw profileError;
      }

      console.log("[AuthContext] Role and profile fetched:", { role: roleData?.role, profile: profileData });
      setRole(roleData.role);
      setProfile(profileData);

      // Super admins don't need subscription data - skip tenant fetch to prevent infinite loops
      if (roleData.role === "super_admin") {
        console.log("[AuthContext] User is super_admin, skipping tenant fetch");
        setTenant(null);
        setSubscriptionConfig(null);
        setSubscriptionLoading(false);
        return;
      }

      // Start background tenant fetch if subscription check is due
      if (shouldCheckSubscription()) {
        console.log("[AuthContext] Starting background tenant subscription fetch...");
        backgroundFetchRef.current = fetchTenantSubscription(profileData.tenant_id, "default", roleData.role);

        // Set a 10-second timeout for background fetch completion
        setTimeout(async () => {
          if (backgroundFetchRef.current) {
            try {
              await backgroundFetchRef.current;
              console.log("[AuthContext] Background fetch completed within timeout");
            } catch (error) {
              console.warn("[AuthContext] Background fetch timeout or error:", error);
            } finally {
              backgroundFetchRef.current = null;
            }
          }
        }, 10000);
      } else {
        console.log("[AuthContext] Skipping subscription check due to debouncing (last check was recent)");
        setSubscriptionLoading(false);
      }

      console.log("[AuthContext] fetchProfileAndRole completed successfully");
    } catch (error) {
      console.error("[AuthContext] fetchProfileAndRole failed:", error);
      setSubscriptionLoading(false);
      setLoading(false); // Ensure loading state is cleared on error
      throw error; // Re-throw to let caller handle it
    } finally {
      fetchingProfileRef.current = null; // Always clear the flag
    }
  };

  const refreshSubscription = async () => {
    // Clear all caches on manual refresh
    sessionStorage.removeItem("sub_verified");
    if (profile?.tenant_id) {
      sessionStorage.removeItem(`subscription_${profile.tenant_id}`);
    }

    // Reset debounce timers on manual refresh
    lastSubscriptionCheck.current = 0;
    lastNavigationTime.current = 0;

    // Super admins don't have subscriptions to refresh
    if (role === "super_admin") {
      return;
    }

    if (profile?.tenant_id && tenant?.plan_type) {
      await fetchTenantSubscription(profile.tenant_id, tenant.plan_type, role || undefined);
    }
  };

  // Calculate if in grace period
  const isInGracePeriod =
    tenant?.subscription_status === "past_due" &&
    tenant?.grace_period_ends_at &&
    new Date(tenant.grace_period_ends_at) > new Date();

  // Calculate trial days remaining
  const trialDaysRemaining = (() => {
    if (!tenant || tenant.subscription_status !== "trial" || !subscriptionConfig) return 0;
    const createdAt = new Date(tenant.created_at);
    const expiryDate = new Date(createdAt);
    expiryDate.setDate(expiryDate.getDate() + subscriptionConfig.trial_duration_days);
    return Math.max(0, differenceInDays(expiryDate, new Date()));
  })();

  // Calculate grace period days remaining
  const graceDaysRemaining = (() => {
    if (!tenant?.grace_period_ends_at || !isInGracePeriod) return 0;
    return Math.max(0, differenceInDays(new Date(tenant.grace_period_ends_at), new Date()));
  })();

  // Optimized subscription refresh with debouncing - check every 2 minutes but respect debouncing
  useEffect(() => {
    // Super admins don't need subscription refresh timers
    if (role === "super_admin" || !profile?.tenant_id || !tenant?.plan_type) {
      return;
    }

    const interval = setInterval(
      () => {
        if (shouldCheckSubscription()) {
          console.log("[AuthContext] Periodic subscription check triggered");
          fetchTenantSubscription(profile.tenant_id, tenant.plan_type, role || undefined);
        }
      },
      2 * 60 * 1000,
    ); // Check every 2 minutes (but debounced to 30s minimum)

    return () => clearInterval(interval);
  }, [profile?.tenant_id, tenant?.plan_type, role]);

  // Navigation-based refresh with debouncing
  useEffect(() => {
    if (shouldRefreshOnNavigation() && profile?.tenant_id && tenant?.plan_type && role !== "super_admin") {
      console.log("[AuthContext] Navigation-triggered subscription check");
      if (shouldCheckSubscription()) {
        fetchTenantSubscription(profile.tenant_id, tenant.plan_type, role || undefined);
      }
    }
  }, [location.pathname, profile?.tenant_id, tenant?.plan_type, role]);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfileAndRole(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
        setSubscriptionLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AuthContext] Auth state changed:", event);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          await fetchProfileAndRole(session.user.id);
        } catch (error) {
          console.error("[AuthContext] Failed to fetch profile/role in auth state change:", error);
          // Reset states on error
          setProfile(null);
          setTenant(null);
          setRole(null);
          setSubscriptionConfig(null);
          setSubscriptionLoading(false);
        } finally {
          // Always set loading to false immediately - no setTimeout to prevent race conditions
          console.log("[AuthContext] Setting loading to false");
          setLoading(false);
        }
      } else {
        setProfile(null);
        setTenant(null);
        setRole(null);
        setSubscriptionConfig(null);
        setSubscriptionLoading(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;

    if (authData.user) {
      // Non-blocking: Start fetching profile/subscription in background
      fetchProfileAndRole(authData.user.id).catch((err) => {
        console.error("[AuthContext] Background profile fetch failed:", err);
      });
      // Login component navigates immediately - SubscriptionGuard handles loading states
    }
  };

  const logout = async () => {
    try {
      console.log("[AuthContext] Logout initiated");

      // Clear all caches and reset performance metrics
      sessionStorage.clear();
      performanceMetrics.cacheHits = 0;
      performanceMetrics.cacheMisses = 0;
      performanceMetrics.fetchDurations = [];

      // Clear debounce timers
      lastSubscriptionCheck.current = 0;
      lastNavigationTime.current = 0;

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear all state
      setUser(null);
      setSession(null);
      setProfile(null);
      setTenant(null);
      setRole(null);
      setSubscriptionConfig(null);
      setLoading(false);
      setSubscriptionLoading(false);

      console.log("[AuthContext] Logout completed");

      // Navigate to login
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("[AuthContext] Logout error:", error);
      // Even if there's an error, navigate to login
      navigate("/login", { replace: true });
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        tenant,
        role,
        loading,
        subscriptionLoading,
        subscriptionConfig,
        isInGracePeriod,
        trialDaysRemaining,
        graceDaysRemaining,
        login,
        logout,
        resetPassword,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
