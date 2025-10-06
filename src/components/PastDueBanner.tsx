import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function PastDueBanner() {
  const { tenant, graceDaysRemaining } = useAuth();
  const navigate = useNavigate();

  // Only show for past_due status
  if (tenant?.subscription_status !== 'past_due') {
    return null;
  }

  const daysLeft = graceDaysRemaining || 0;
  const isUrgent = daysLeft <= 2;
  const isCritical = daysLeft <= 1;

  const getUrgencyMessage = () => {
    if (isCritical) {
      return `Critical: Your account will be suspended in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Update your payment method immediately.`;
    }
    if (isUrgent) {
      return `Urgent: Your payment failed. Please update your payment method within ${daysLeft} days to avoid suspension.`;
    }
    return `Payment Failed: Your subscription payment couldn't be processed. You have ${daysLeft} days to update your payment method.`;
  };

  return (
    <Alert 
      variant="destructive" 
      className={`border-l-4 ${
        isCritical 
          ? 'border-l-red-600 bg-red-50 dark:bg-red-950/20' 
          : isUrgent 
          ? 'border-l-orange-600 bg-orange-50 dark:bg-orange-950/20'
          : 'border-l-yellow-600 bg-yellow-50 dark:bg-yellow-950/20'
      }`}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className="flex-1">{getUrgencyMessage()}</span>
        <Button
          size="sm"
          variant={isCritical ? "destructive" : "default"}
          onClick={() => navigate('/billing')}
        >
          Update Payment
        </Button>
      </AlertDescription>
    </Alert>
  );
}
