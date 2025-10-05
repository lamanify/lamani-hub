import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function TrialBanner() {
  const { tenant, subscriptionConfig, trialDaysRemaining } = useAuth();

  if (!tenant) return null;

  const status = tenant.subscription_status;
  const showBanner = status === 'trial' || status === 'trialing' || status === 'inactive' || status === 'comped';
  
  if (!showBanner) return null;

  const isBeta = tenant.plan_type === 'beta';
  const trialDuration = subscriptionConfig?.trial_duration_days || 14;

  // Comp'd account banner
  if (status === 'comped') {
    const daysRemaining = tenant.comp_expires_at 
      ? Math.max(0, Math.ceil((new Date(tenant.comp_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

    return (
      <div className="bg-purple-50 border-b border-purple-200 px-6 py-3">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
            <p className="text-sm text-purple-800">
              <strong>Complimentary Access</strong>
              {daysRemaining !== null && (
                <span className="ml-2">
                  {daysRemaining > 0 
                    ? `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining` 
                    : 'Expires today'}
                  {tenant.comp_reason && ` • ${tenant.comp_reason}`}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Inactive account banner
  if (status === 'inactive') {
    return (
      <div className="bg-red-50 border-b border-red-200 px-6 py-3">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">
              <strong>Subscription Required</strong>
              <span className="ml-2">Please activate your subscription to access all features.</span>
            </p>
          </div>
          <Button size="sm" variant="outline" asChild className="flex-shrink-0 border-red-300 hover:bg-red-100">
            <Link to="/billing">Activate Now</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Trial banner (existing)

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            <strong>
              {isBeta ? 'Beta Trial' : 'Trial'}: {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} remaining
            </strong>
            <span className="ml-2">
              {isBeta 
                ? `You have ${trialDuration} days of beta access. Upgrade to continue after your trial ends.`
                : 'Upgrade to continue using LamaniHub after your trial ends.'}
            </span>
          </p>
        </div>
        <Button size="sm" variant="outline" asChild className="flex-shrink-0">
          <Link to="/billing">Upgrade Now</Link>
        </Button>
      </div>
    </div>
  );
}
