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

// Cache never expires - valid until logout
const CACHE_TTL = Infinity;

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

  // Only refresh subscription on explicit events (login, billing action, manual refresh)
  const shouldRefreshSubscription = (reason: 'login' | 'billing_action' | 'manual_refresh') => {
    console.log(`[AuthContext] Subscription refresh triggered: ${reason}`);
    return true;
  };

  const fetchTenantSubscription = async (tenantId: string, planType: string, userRole?: string) => {
    const fetchStartTime = Date.now();

    try {
      setSubscriptionLoading(true);
      console.log("[AuthContext] fetchTenantSubscription starting for tenant:", tenantId);

      // Check session storage cache (permanent - no expiry)
      const cacheKey = `subscription_permanent_${tenantId}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        try {
          const { data } = JSON.parse(cached);
          performanceMetrics.cacheHits++;
          console.log('[AuthContext] CACHE HIT - Using permanent cache (valid until logout)');

          setTenant(data.tenant);
          setSubscriptionConfig(data.config);
          setLastSubscriptionFetch(Date.now());
          setSubscriptionLoading(false);
          return; // Use cached data
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

      // Cache the result in session storage (no expiry - permanent until logout)
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: { tenant: tenantData, config: configResult.data },
          }),
        );
        console.log('[AuthContext] Data cached permanently (valid until logout)');
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
      console.log("[AuthContext] fetchProfileAndRole starting for user:", userId);

      // Validate session exists (non-blocking check)
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession || currentSession.user.id !== userId) {
          console.warn("[AuthContext] Session mismatch or expired during profile fetch");
          throw new Error("Session validation failed");
        }
        console.log("[AuthContext] Session validated successfully");
      } catch (sessionError) {
        console.error("[AuthContext] Session validation error:", sessionError);
        throw sessionError;
      }

      // Fetch role and profile in parallel with 10s timeout for each
      console.log("[AuthContext] Fetching profile with role in single query...");

      // Check localStorage cache first
      const cachedRole = localStorage.getItem(`user_role_${userId}`);
      if (cachedRole) {
        console.log("[AuthContext] Using cached role:", cachedRole);
      }

      // Single JOIN query with exponential backoff retry
      let attempt = 0;
      const maxAttempts = 3;
      const delays = [0, 2000, 4000]; // 0s, 2s, 4s

      let profileData: any = null;
      let roleData: any = null;

      while (attempt < maxAttempts) {
        try {
          if (attempt > 0) {
            console.log(`[AuthContext] Retry attempt ${attempt + 1}/${maxAttempts} after ${delays[attempt]}ms`);
            await new Promise(resolve => setTimeout(resolve, delays[attempt]));
          }

          // Fetch profile and role in single query using JOIN
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select(`
              user_id,
              tenant_id,
              full_name,
              user_roles (role)
            `)
            .eq("user_id", userId)
            .single();

          if (profileError) throw profileError;

          profileData = {
            user_id: profile.user_id,
            tenant_id: profile.tenant_id,
            full_name: profile.full_name,
          };

          const userRole = (profile as any).user_roles?.[0]?.role || cachedRole || 'clinic_user';
          roleData = { role: userRole };

          // Cache role in localStorage
          localStorage.setItem(`user_role_${userId}`, userRole);

          console.log("[AuthContext] Profile and role fetched successfully:", { role: roleData.role, profile: profileData });
          break;
        } catch (error) {
          attempt++;
          console.error(`[AuthContext] Fetch attempt ${attempt} failed:`, error);

          if (attempt >= maxAttempts) {
            // Final fallback: use cached role or assume clinic_user
            if (cachedRole) {
              console.warn("[AuthContext] All attempts failed, using cached role:", cachedRole);
              roleData = { role: cachedRole };
              // Still need profile data - this is critical
              throw new Error("Failed to fetch profile after all retries");
            } else {
              console.error("[AuthContext] All attempts failed with no cache available");
              throw error;
            }
          }
        }
      }

      setRole(roleData.role);
      setProfile(profileData);

      // Super admins don't need subscription data - skip tenant fetch to prevent infinite loops
      if (roleData.role === "super_admin") {
        console.log("[AuthContext] User is super_admin, skipping tenant fetch");
        setTenant(null);
        setSubscriptionConfig(null);
        return;
      }

      // Fetch subscription only once on login
      if (!tenant) {
        console.log("[AuthContext] Fetching subscription on login...");
        await fetchTenantSubscription(profileData.tenant_id, "default", roleData.role);
      }

      console.log("[AuthContext] fetchProfileAndRole completed successfully (non-blocking)");
    } catch (error) {
      console.error("[AuthContext] fetchProfileAndRole failed:", error);
      setLoading(false); // Ensure loading state is cleared on error
      throw error; // Re-throw to let caller handle it
    } finally {
      fetchingProfileRef.current = null; // Always clear the flag
    }
  };

  const refreshSubscription = async () => {
    console.log('[AuthContext] Manual subscription refresh requested');
    
    // Clear all caches on manual refresh
    sessionStorage.removeItem("sub_verified");
    if (profile?.tenant_id) {
      sessionStorage.removeItem(`subscription_permanent_${profile.tenant_id}`);
    }

    // Super admins don't have subscriptions to refresh
    if (role === "super_admin") {
      return;
    }

    if (profile?.tenant_id) {
      await fetchTenantSubscription(profile.tenant_id, tenant?.plan_type || "default", role || undefined);
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

  // Real-time subscription updates via Supabase Realtime
  useEffect(() => {
    if (!profile?.tenant_id || role === "super_admin") return;

    console.log('[AuthContext] Setting up real-time subscription listener');

    const channel = supabase
      .channel('tenant-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tenants',
          filter: `id=eq.${profile.tenant_id}`
        },
        (payload) => {
          console.log('[AuthContext] Tenant updated via webhook:', payload.new);
          setTenant(payload.new as any);
          
          // Update permanent cache
          const cacheKey = `subscription_permanent_${profile.tenant_id}`;
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify({
              data: { tenant: payload.new, config: subscriptionConfig }
            }));
          } catch (e) {
            console.warn('[AuthContext] Failed to update cache:', e);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[AuthContext] Cleaning up real-time subscription listener');
      supabase.removeChannel(channel);
    };
  }, [profile?.tenant_id, role, subscriptionConfig]);

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
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AuthContext] Auth state changed:", event);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // CRITICAL: Use setTimeout to defer profile fetch and prevent deadlock
        // This breaks the synchronous chain and allows auth state to stabilize
        setTimeout(() => {
          fetchProfileAndRole(session.user.id)
            .catch((error) => {
              console.error("[AuthContext] Failed to fetch profile/role in auth state change:", error);
              // Reset states on error
              setProfile(null);
              setTenant(null);
              setRole(null);
              setSubscriptionConfig(null);
              setSubscriptionLoading(false);
            })
            .finally(() => {
              console.log("[AuthContext] Setting loading to false");
              setLoading(false);
            });
        }, 0);
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
    console.log("[AuthContext] Login attempt starting...");
    
    // Clear all stale caches before login
    sessionStorage.clear();
    if (user?.id) {
      localStorage.removeItem(`user_role_${user.id}`);
    }
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error("[AuthContext] Login failed:", authError);
      throw authError;
    }

    console.log("[AuthContext] Login successful, user:", authData.user?.id);

    if (authData.user) {
      // Add small delay to allow auth state to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("[AuthContext] Auth state stabilized");
      // onAuthStateChange will trigger fetchProfileAndRole with setTimeout
    }
  };

  const logout = async () => {
    try {
      console.log("[AuthContext] Logout initiated");

      // Clear all caches and reset performance metrics
      sessionStorage.clear();
      if (user?.id) {
        localStorage.removeItem(`user_role_${user.id}`);
      }
      performanceMetrics.cacheHits = 0;
      performanceMetrics.cacheMisses = 0;
      performanceMetrics.fetchDurations = [];

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
