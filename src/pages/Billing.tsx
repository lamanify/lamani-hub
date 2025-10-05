import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Billing() {
  const { tenant, graceDaysRemaining } = useAuth();

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

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Status Alert */}
        {getStatusAlert()}

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Billing</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription and billing information
          </p>
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              You are currently on the free trial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-foreground">Up to 50 leads</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-foreground">Basic lead tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-foreground">PDPA compliance tools</span>
              </div>
            </div>

            <Button>Upgrade Plan</Button>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>
              Add a payment method for when your trial ends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                No payment method on file
              </p>
              <Button variant="outline">Add Payment Method</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
