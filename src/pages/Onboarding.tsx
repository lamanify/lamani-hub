import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Database, MessageSquare, Upload, Shield, Clock } from 'lucide-react';

const steps = [
  {
    title: 'Welcome to LamaniHub CRM',
    description: 'Your 14-day free trial has started!',
    icon: CheckCircle,
    content: (
      <div className="space-y-4">
        <p className="text-lg">
          Thank you for choosing LamaniHub - the CRM built specifically for Malaysian healthcare providers.
        </p>
        <div className="bg-primary/10 p-4 rounded-lg">
          <p className="font-semibold text-primary">🎉 Your trial is now active</p>
          <p className="text-sm text-muted-foreground mt-1">
            Full access to all features for 14 days - no credit card required
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Key Features',
    description: 'Everything you need to manage patient relationships',
    icon: Database,
    content: (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Database className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold">Centralized Patient Management</h4>
            <p className="text-sm text-muted-foreground">
              Store and manage all patient data, contact info, and custom fields in one place
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MessageSquare className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold">WhatsApp Integration</h4>
            <p className="text-sm text-muted-foreground">
              Click-to-WhatsApp from any lead for instant patient communication
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Upload className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold">Easy Import</h4>
            <p className="text-sm text-muted-foreground">
              Import existing contacts from spreadsheets with smart validation
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold">PDPA Compliant</h4>
            <p className="text-sm text-muted-foreground">
              Built-in consent tracking and audit trails for Malaysian regulations
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Get Started',
    description: 'Quick tips to maximize your trial',
    icon: Clock,
    content: (
      <div className="space-y-4">
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              1
            </div>
            <p className="font-medium">Add your first lead manually or import from CSV</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              2
            </div>
            <p className="font-medium">Try the WhatsApp integration with a test patient</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              3
            </div>
            <p className="font-medium">Explore custom fields in Settings to match your workflow</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              4
            </div>
            <p className="font-medium">Set up your clinic's API key for external integrations</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Need help? Check our documentation or contact support anytime.
        </p>
      </div>
    ),
  },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { tenant, trialDaysRemaining } = useAuth();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <StepIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
          {tenant && trialDaysRemaining !== null && (
            <div className="mt-4 inline-block px-4 py-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-full">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                <Clock className="inline h-4 w-4 mr-1" />
                {trialDaysRemaining} days remaining in your trial
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-6">{currentStepData.content}</div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-primary'
                      : index < currentStep
                      ? 'w-2 bg-primary/50'
                      : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
              <Button onClick={handleNext}>
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
