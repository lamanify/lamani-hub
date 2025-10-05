import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { differenceInDays } from 'date-fns';

interface Profile {
  user_id: string;
  tenant_id: string;
  full_name: string;
}

interface Tenant {
  id: string;
  name: string;
  subscription_status: 'inactive' | 'active' | 'trialing' | 'trial' | 'past_due' | 'suspended' | 'cancelled' | 'canceled' | 'comped';
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
  const navigate = useNavigate();
  const location = useLocation();

  const fetchTenantSubscription = async (tenantId: string, planType: string, userRole?: string) => {
    try {
      setSubscriptionLoading(true);

      // Determine if user is admin
      const isAdminUser = userRole === 'super_admin' || userRole === 'clinic_admin';

      let tenantData;
      if (isAdminUser) {
        // Admins can see all tenant fields
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', tenantId)
          .single();
        if (error) throw error;
        tenantData = data;
      } else {
        // Non-admins only see non-sensitive fields via safe function
        const { data, error } = await supabase
          .rpc('get_tenant_safe', { p_user_id: user?.id })
          .single();
        if (error) throw error;
        tenantData = data;
      }

      // Fetch subscription config
      const { data: configData, error: configError } = await supabase
        .from('subscription_config')
        .select('plan_type, trial_duration_days, grace_period_days')
        .eq('plan_type', planType)
        .single();

      if (configError) throw configError;

      setTenant(tenantData);
      setSubscriptionConfig(configData);
      setLastSubscriptionFetch(Date.now());
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const fetchProfileAndRole = async (userId: string) => {
    try {
      // Fetch role first
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError) throw roleError;

      setRole(roleData.role);

      // Fetch profile for all users (including super admins)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, tenant_id, full_name')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);

      // Fetch tenant and subscription config (pass role for security filtering)
      await fetchTenantSubscription(profileData.tenant_id, 'default', roleData.role);
    } catch (error) {
      console.error('Error fetching profile/role:', error);
      setSubscriptionLoading(false);
    }
  };

  const refreshSubscription = async () => {
    if (profile?.tenant_id && tenant?.plan_type) {
      await fetchTenantSubscription(profile.tenant_id, tenant.plan_type, role || undefined);
    }
  };

  // Calculate if in grace period
  const isInGracePeriod = 
    tenant?.subscription_status === 'past_due' &&
    tenant?.grace_period_ends_at &&
    new Date(tenant.grace_period_ends_at) > new Date();

  // Calculate trial days remaining
  const trialDaysRemaining = (() => {
    if (!tenant || tenant.subscription_status !== 'trial' || !subscriptionConfig) return 0;
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

  // Refresh subscription every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutes = 5 * 60 * 1000;
      if (Date.now() - lastSubscriptionFetch > fiveMinutes && profile?.tenant_id && tenant?.plan_type) {
        fetchTenantSubscription(profile.tenant_id, tenant.plan_type);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [lastSubscriptionFetch, profile?.tenant_id, tenant?.plan_type]);

  // Refresh subscription on route change
  useEffect(() => {
    if (profile?.tenant_id && tenant?.plan_type) {
      const threeMinutes = 3 * 60 * 1000;
      if (Date.now() - lastSubscriptionFetch > threeMinutes) {
        fetchTenantSubscription(profile.tenant_id, tenant.plan_type);
      }
    }
  }, [location.pathname]);

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfileAndRole(session.user.id);
          setLoading(false); // Set loading to false after profile/role fetch
        } else {
          setProfile(null);
          setTenant(null);
          setRole(null);
          setSubscriptionConfig(null);
          setSubscriptionLoading(false);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;

    if (authData.user) {
      await fetchProfileAndRole(authData.user.id);
      // Don't navigate here - let the Login component's useEffect handle it
      // after state is fully updated to avoid race conditions with SubscriptionGuard
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setTenant(null);
    setRole(null);
    setSubscriptionConfig(null);
    navigate('/login');
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
