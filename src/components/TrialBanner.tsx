import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function TrialBanner() {
  const { tenant, subscriptionConfig, trialDaysRemaining } = useAuth();

  if (!tenant || tenant.subscription_status !== 'trial') {
    return null;
  }

  const isBeta = tenant.plan_type === 'beta';
  const trialDuration = subscriptionConfig?.trial_duration_days || 14;

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
