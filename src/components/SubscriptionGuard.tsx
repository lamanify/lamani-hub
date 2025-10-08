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

  // Check session verification cache first (30-minute duration)
  const sessionVerified = sessionStorage.getItem('sub_verified');
  if (sessionVerified && !loadingTimeout) {
    try {
      const { timestamp, status, tenant_id } = JSON.parse(sessionVerified);
      const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
      
      // Verify cache is fresh and belongs to current tenant
      if (Date.now() - timestamp < CACHE_DURATION && tenant?.id === tenant_id) {
        console.log('[SubscriptionGuard] Using session verification cache, skipping all checks');
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

  // Render children immediately - no loading spinner
  // Auth checks run in background and will redirect if needed
  if ((loading || (subscriptionLoading && requiresSubscription)) && !loadingTimeout) {
    return <>{children}</>;
  }

  // If loading timed out, allow access with warning
  if (loadingTimeout) {
    console.warn('[SubscriptionGuard] Loading timed out - allowing access');
    
    if (!toastMessage) {
      setToastMessage({
        title: "Slow Connection Detected",
        description: "Some features may load slowly. Try refreshing if issues persist.",
        variant: "default"
      });
    }
    
    // Allow access anyway - better UX than blocking
    return <>{children}</>;
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
    // Cache session verification for 30 minutes
    try {
      sessionStorage.setItem('sub_verified', JSON.stringify({
        timestamp: Date.now(),
        status,
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
