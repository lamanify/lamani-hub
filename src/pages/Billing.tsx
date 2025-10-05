import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock,
  Loader2,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";

export default function Billing() {
  const { 
    tenant, 
    session,
    trialDaysRemaining, 
    graceDaysRemaining,
    subscriptionConfig,
    subscriptionLoading,
    refreshSubscription
  } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle success/cancel callbacks from Stripe
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      toast.success('Subscription activated! Welcome to LamaniHub.');
      navigate('/billing', { replace: true });
      refreshSubscription();
    }
    if (params.get('canceled') === 'true') {
      toast.info('Checkout was cancelled. You can try again anytime.');
      navigate('/billing', { replace: true });
    }
  }, [location.search, navigate, refreshSubscription]);

  const handleStartCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { data: { session: userSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !userSession) {
        toast.error('Please log in to subscribe');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        headers: {
          Authorization: `Bearer ${userSession.access_token}`,
        },
      });

      if (error) {
        console.error('Checkout error:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No checkout URL returned');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Failed to start checkout:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const { data: { session: userSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !userSession) {
        toast.error('Please log in to manage billing');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        headers: {
          Authorization: `Bearer ${userSession.access_token}`,
        },
      });

      if (error) {
        console.error('Portal error:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No portal URL returned');
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      toast.error('Unable to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const getStatusAlert = () => {
    if (!tenant) return null;

    switch (tenant.subscription_status) {
      case 'past_due':
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Failed</AlertTitle>
            <AlertDescription>
              Your payment failed. You have <strong>{graceDaysRemaining} days</strong> remaining in your grace period.
              Please update your payment method to avoid service interruption.
            </AlertDescription>
          </Alert>
        );
      case 'suspended':
        return (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Account Suspended</AlertTitle>
            <AlertDescription>
              Your account has been suspended due to payment issues. Update your payment method to restore access.
            </AlertDescription>
          </Alert>
        );
      case 'cancelled':
        return (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Subscription Cancelled</AlertTitle>
            <AlertDescription>
              Your subscription has been cancelled. Reactivate your subscription to continue using LamaniHub.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  const renderSubscriptionContent = () => {
    if (subscriptionLoading || !tenant) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    switch (tenant.subscription_status) {
      case 'trial':
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground">Free Trial Active</h3>
                <p className="text-muted-foreground mt-2">
                  You have <span className="font-semibold text-foreground">{trialDaysRemaining} days</span> remaining in your trial
                </p>
              </div>
            </div>

            <div className="space-y-3 py-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Unlimited leads</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">All CRM features</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">PDPA compliance tools</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Email support</span>
              </div>
            </div>

            <div className="text-center py-4 border-t">
              <p className="text-lg font-medium text-foreground">
                After trial: <span className="text-primary">RM 299/month</span>
              </p>
            </div>

            <Button 
              onClick={handleStartCheckout} 
              disabled={checkoutLoading}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting checkout...
                </>
              ) : (
                'Start Subscription'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              No credit card required during trial
            </p>
          </div>
        );

      case 'active':
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground">Subscription Active</h3>
                <p className="text-muted-foreground mt-2">
                  Your subscription is in good standing
                </p>
              </div>
            </div>

            <div className="space-y-4 py-6">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium text-foreground">LamaniHub CRM Monthly</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium text-foreground">RM 299.00 per month</span>
              </div>
              {tenant.subscription_current_period_end && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Next billing date</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(tenant.subscription_current_period_end), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
            </div>

            <Button 
              onClick={handleManageBilling} 
              disabled={portalLoading}
              className="w-full"
              size="lg"
            >
              {portalLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening portal...
                </>
              ) : (
                <>
                  Manage Billing
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Update payment method, view invoices, or cancel subscription
            </p>
          </div>
        );

      case 'past_due':
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground">Payment Failed</h3>
                <p className="text-muted-foreground mt-2">
                  Your last payment could not be processed
                </p>
              </div>
            </div>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Action Required</AlertTitle>
              <AlertDescription>
                Your account will be suspended in <strong>{graceDaysRemaining} days</strong> if payment is not updated
              </AlertDescription>
            </Alert>

            <div className="space-y-4 py-6">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount due</span>
                <span className="font-medium text-foreground">RM 299.00</span>
              </div>
              {tenant.grace_period_ends_at && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Grace period ends</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(tenant.grace_period_ends_at), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
            </div>

            <Button 
              onClick={handleManageBilling} 
              disabled={portalLoading}
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="lg"
            >
              {portalLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening portal...
                </>
              ) : (
                'Update Payment Method'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Need help? Contact support at support@lamanihub.com
            </p>
          </div>
        );

      case 'suspended':
      case 'cancelled':
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <XCircle className="h-8 w-8 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground">
                  Subscription {tenant.subscription_status === 'suspended' ? 'Suspended' : 'Cancelled'}
                </h3>
                <p className="text-muted-foreground mt-2">
                  Your subscription has been {tenant.subscription_status === 'suspended' ? 'suspended' : 'cancelled'}
                </p>
              </div>
            </div>

            <div className="space-y-4 py-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Your Data is Safe</AlertTitle>
                <AlertDescription>
                  Your data will be preserved for 30 days. Reactivate anytime to restore full access.
                </AlertDescription>
              </Alert>
            </div>

            <Button 
              onClick={handleStartCheckout} 
              disabled={checkoutLoading}
              className="w-full"
              size="lg"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting checkout...
                </>
              ) : (
                'Reactivate Subscription'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              RM 299/month • Cancel anytime
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Unknown subscription status</p>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Status Alert */}
        {getStatusAlert()}

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your LamaniHub subscription and payment methods
          </p>
        </div>

        {/* Subscription Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              {tenant?.subscription_status === 'trial' && 'You are currently on the free trial'}
              {tenant?.subscription_status === 'active' && 'You are subscribed to LamaniHub CRM'}
              {tenant?.subscription_status === 'past_due' && 'Payment issue detected'}
              {(tenant?.subscription_status === 'suspended' || tenant?.subscription_status === 'cancelled') && 
                'Your subscription is inactive'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderSubscriptionContent()}
          </CardContent>
        </Card>

        {/* Payment Method Card (for active subscriptions) */}
        {tenant?.subscription_status === 'active' && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>
                Manage your payment methods and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4 text-center">
                  View and update your payment methods through the billing portal
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      Open Billing Portal
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
