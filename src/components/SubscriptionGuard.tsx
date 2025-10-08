import { ReactNode, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

type ToastMessage = {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
} | null;

interface SubscriptionGuardProps {
  children: ReactNode;
  requiresSubscription?: boolean;
  requiresSuperAdmin?: boolean;
}

export default function SubscriptionGuard({ 
  children, 
  requiresSubscription = true,
  requiresSuperAdmin = false 
}: SubscriptionGuardProps) {
  const { user, tenant, role, loading, subscriptionLoading, isInGracePeriod } = useAuth();
  const location = useLocation();
  const [toastMessage, setToastMessage] = useState<ToastMessage>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const hasShownToast = useRef(false);

  // Handle toast notifications after render
  useEffect(() => {
    if (toastMessage && !hasShownToast.current) {
      toast({
        title: toastMessage.title,
        description: toastMessage.description,
        variant: toastMessage.variant || 'destructive'
      });
      hasShownToast.current = true;
    }
  }, [toastMessage]);

  // Reset toast flag when location changes
  useEffect(() => {
    hasShownToast.current = false;
    setToastMessage(null);
    setLoadingTimeout(false);
  }, [location.pathname]);

  // Add timeout for loading states to prevent infinite spinner
  useEffect(() => {
    if (loading || subscriptionLoading) {
      console.log('[SubscriptionGuard] Loading...', { loading, subscriptionLoading });
      
      const timer = setTimeout(() => {
        console.error('[SubscriptionGuard] Loading timeout - taking too long');
        setLoadingTimeout(true);
      }, 5000); // 5 second timeout

      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading, subscriptionLoading]);

  // Check session verification cache - valid for full browser session
  const sessionVerified = sessionStorage.getItem('sub_verified');
  if (sessionVerified && !loadingTimeout) {
    try {
      const { tenant_id } = JSON.parse(sessionVerified);
      
      // No expiry check - valid until browser closes or manual logout
      if (tenant?.id === tenant_id) {
        console.log('[SubscriptionGuard] Using session verification cache (no expiry)');
        return <>{children}</>;
      }
    } catch (e) {
      console.warn('[SubscriptionGuard] Failed to parse session cache:', e);
      sessionStorage.removeItem('sub_verified');
    }
  }

  // If subscription is not required, skip all loading checks
  if (!requiresSubscription && !requiresSuperAdmin) {
    // Render immediately, redirect if not authenticated
    if (!user && !loading) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <>{children}</>;
  }

  // Show loading skeleton while authentication is in progress
  if ((loading || (subscriptionLoading && requiresSubscription)) && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  // If loading timed out, show error UI with retry option
  if (loadingTimeout) {
    console.warn('[SubscriptionGuard] Loading timed out');
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Connection Issue</h2>
            <p className="text-muted-foreground">
              We're having trouble loading your account. This might be due to a slow connection or temporary issue.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition"
            >
              Retry
            </button>
            <button
              onClick={() => setLoadingTimeout(false)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition"
            >
              Continue Anyway (Limited Mode)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check authentication first
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check super admin requirement
  if (requiresSuperAdmin && role !== 'super_admin') {
    if (!toastMessage) {
      setToastMessage({
        title: "Access Denied",
        description: "This page is only accessible to super administrators.",
        variant: "destructive"
      });
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Super admins bypass all subscription checks
  if (role === 'super_admin') {
    return <>{children}</>;
  }

  // If subscription is not required (e.g., billing page), allow access
  if (!requiresSubscription) {
    return <>{children}</>;
  }

  // Check subscription status
  const status = tenant?.subscription_status;

  if (!status || !tenant) {
    if (!toastMessage) {
      setToastMessage({
        title: "Subscription Required",
        description: "Please activate your subscription to continue.",
        variant: "destructive"
      });
    }
    return <Navigate to="/billing" replace />;
  }

  // Allow access for active subscriptions (active, trial, trialing, comped)
  if (status === 'active' || status === 'trial' || status === 'trialing' || status === 'comped') {
    // Cache session verification for full browser session (no expiry)
    try {
      sessionStorage.setItem('sub_verified', JSON.stringify({
        tenant_id: tenant.id
      }));
    } catch (e) {
      console.warn('[SubscriptionGuard] Failed to cache session verification:', e);
    }
    return <>{children}</>;
  }

  // Allow access during grace period for past_due
  if (status === 'past_due' && isInGracePeriod) {
    return <>{children}</>;
  }

  // Redirect to billing for other statuses
  if (status === 'past_due' && !isInGracePeriod) {
    sessionStorage.removeItem('sub_verified'); // Clear cache on billing redirect
    if (!toastMessage) {
      setToastMessage({
        title: "Grace Period Expired",
        description: "Your grace period has ended. Please update your payment method.",
        variant: "destructive"
      });
    }
    return <Navigate to="/billing" replace />;
  }

  if (status === 'suspended') {
    sessionStorage.removeItem('sub_verified'); // Clear cache
    if (!toastMessage) {
      setToastMessage({
        title: "Account Suspended",
        description: "Your account has been suspended. Please contact support or update payment.",
        variant: "destructive"
      });
    }
    return <Navigate to="/billing" replace />;
  }

  if (status === 'cancelled' || status === 'canceled') {
    sessionStorage.removeItem('sub_verified'); // Clear cache
    if (!toastMessage) {
      setToastMessage({
        title: "Subscription Ended",
        description: "Your subscription has ended. Reactivate to continue using LamaniHub.",
        variant: "destructive"
      });
    }
    return <Navigate to="/billing" replace />;
  }

  if (status === 'inactive') {
    sessionStorage.removeItem('sub_verified'); // Clear cache
    if (!toastMessage) {
      setToastMessage({
        title: "Subscription Required",
        description: "Please activate your subscription to access LamaniHub.",
        variant: "destructive"
      });
    }
    return <Navigate to="/billing" replace />;
  }

  // Default: redirect to billing
  sessionStorage.removeItem('sub_verified'); // Clear cache
  if (!toastMessage) {
    setToastMessage({
      title: "Subscription Required",
      description: "Please activate your subscription to continue.",
      variant: "destructive"
    });
  }
  return <Navigate to="/billing" replace />;
}
