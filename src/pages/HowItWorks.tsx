import PublicTopBar from '@/components/PublicTopBar';
import PublicFooter from '@/components/PublicFooter';
import { Button } from '@/components/ui/button';
import { MessageSquare, Database, Users } from 'lucide-react';

const HowItWorks = () => {
  const handleStartTrial = () => {
    window.location.href = '/signup';
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicTopBar />

      {/* Hero Section */}
      <section className="bg-card py-24 sm:py-32">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-6 text-black leading-tight">
            How <span className="text-primary">LamaniHub</span> Works
          </h1>
          <p className="text-xl mb-8 text-muted-foreground">
            Automate your clinic management in three simple steps
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-[hsl(220,20%,97%)]">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <span className="inline-block mb-3 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium uppercase tracking-wide">
              The Process
            </span>
            <h2 className="text-4xl font-bold mb-4 text-black">
              Automate Your Clinic in <span className="text-primary">3 Simple Steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            {/* Step 1 */}
            <div className="bg-card p-8 rounded-lg border border-border shadow-sm">
              <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-primary/10 text-primary text-3xl font-bold mb-5">
                1
              </div>
              <div className="flex items-center justify-center mb-4">
                <MessageSquare className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">Patient Sends a WhatsApp</h3>
              <p className="text-muted-foreground">
                A new or existing patient sends an inquiry, appointment request, or a simple question directly to your clinic's dedicated WhatsApp number.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-card p-8 rounded-lg border border-border shadow-sm">
              <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-primary/10 text-primary text-3xl font-bold mb-5">
                2
              </div>
              <div className="flex items-center justify-center mb-4">
                <Database className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">Data is Captured Automatically</h3>
              <p className="text-muted-foreground">
                LamaniHub instantly captures the patient's name, phone number, and conversation history, creating a new lead or updating an existing profile in your CRM—all without any manual data entry.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-card p-8 rounded-lg border border-border shadow-sm">
              <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-primary/10 text-primary text-3xl font-bold mb-5">
                3
              </div>
              <div className="flex items-center justify-center mb-4">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">Follow Up With Ease</h3>
              <p className="text-muted-foreground">
                Your team now has a complete, organized record. Schedule appointments, send reminders, and provide personalized follow-ups to build lasting patient relationships and grow your clinic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black">
              Why Choose <span className="text-primary">LamaniHub?</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Built specifically for Malaysian healthcare providers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[hsl(220,20%,97%)] p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-black">PDPA Compliant</h3>
              <p className="text-muted-foreground">
                Full compliance with Malaysian Personal Data Protection Act, keeping your patients' data secure and your clinic compliant.
              </p>
            </div>
            <div className="bg-[hsl(220,20%,97%)] p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-black">WhatsApp Native</h3>
              <p className="text-muted-foreground">
                Seamlessly integrate with Malaysia's most popular messaging platform for instant patient communication.
              </p>
            </div>
            <div className="bg-[hsl(220,20%,97%)] p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-black">Affordable Pricing</h3>
              <p className="text-muted-foreground">
                At just RM49/month, get all premium features without breaking the bank.
              </p>
            </div>
            <div className="bg-[hsl(220,20%,97%)] p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-black">Easy to Use</h3>
              <p className="text-muted-foreground">
                Intuitive interface designed for healthcare staff with minimal training required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold mb-4 text-white">
            Ready to Get <span className="text-primary">Started?</span>
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Start your 14-day free trial today. No credit card required.
          </p>
          <Button
            onClick={handleStartTrial}
            variant="secondary"
            size="lg"
            className="text-xl px-8 py-6 h-auto font-bold bg-white text-primary hover:bg-gray-100"
          >
            Start Your Free Trial
          </Button>
          <p className="mt-4 text-sm text-gray-400">
            Full access • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default HowItWorks;
