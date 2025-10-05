import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

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

  // Show loading spinner while checking auth and subscription
  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check authentication first
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check super admin requirement
  if (requiresSuperAdmin && role !== 'super_admin') {
    toast({
      title: "Access Denied",
      description: "This page is only accessible to super administrators.",
      variant: "destructive"
    });
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
    toast({
      title: "Subscription Required",
      description: "Please activate your subscription to continue.",
      variant: "destructive"
    });
    return <Navigate to="/billing" replace />;
  }

  // Allow access for active and trial subscriptions
  if (status === 'active' || status === 'trial') {
    return <>{children}</>;
  }

  // Allow access during grace period for past_due
  if (status === 'past_due' && isInGracePeriod) {
    return <>{children}</>;
  }

  // Redirect to billing for other statuses
  if (status === 'past_due' && !isInGracePeriod) {
    toast({
      title: "Grace Period Expired",
      description: "Your grace period has ended. Please update your payment method.",
      variant: "destructive"
    });
    return <Navigate to="/billing" replace />;
  }

  if (status === 'suspended') {
    toast({
      title: "Account Suspended",
      description: "Your account has been suspended. Please contact support or update payment.",
      variant: "destructive"
    });
    return <Navigate to="/billing" replace />;
  }

  if (status === 'cancelled') {
    toast({
      title: "Subscription Ended",
      description: "Your subscription has ended. Reactivate to continue using LamaniHub.",
      variant: "destructive"
    });
    return <Navigate to="/billing" replace />;
  }

  // Default: redirect to billing
  toast({
    title: "Subscription Required",
    description: "Please activate your subscription to continue.",
    variant: "destructive"
  });
  return <Navigate to="/billing" replace />;
}
