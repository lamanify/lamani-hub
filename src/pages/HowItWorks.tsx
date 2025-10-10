import PublicTopBar from '@/components/PublicTopBar';
import PublicFooter from '@/components/PublicFooter';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

const HowItWorks = () => {
  const handleStartTrial = () => {
    window.location.href = '/signup';
  };
  
  return <div className="min-h-screen bg-background">
      <PublicTopBar />

      {/* Hero Section */}
      <section className="bg-card py-24 sm:py-32">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-6 text-black leading-tight">
            From <span className="text-primary">WhatsApp Chat</span> to Patient Record, <span className="text-primary">Automatically.</span>
          </h1>
          <p className="text-xl mb-8 text-muted-foreground">
            Discover how LamaniHub eliminates manual data entry and transforms your patient communication into an efficient, automated workflow.
          </p>
        </div>
      </section>

      {/* Step-by-Step Process Section */}
      <section className="py-20 bg-[hsl(220,20%,97%)]">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-16">
            <span className="inline-block mb-3 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium uppercase tracking-wide">
              The Process
            </span>
            <h2 className="text-4xl font-bold mb-4 text-black">
              Your Clinic's New <span className="text-primary">Automated Workflow</span>
            </h2>
          </div>
          
          <div className="flex flex-col items-center space-y-8">
            {/* Step 1 Card */}
            <div className="bg-card p-8 rounded-lg shadow-lg text-left w-full border border-border">
              <span className="text-lg font-semibold text-primary">Step 1</span>
              <h3 className="text-3xl font-bold mt-2 mb-4 text-black">A Patient Contacts You on WhatsApp</h3>
              <p className="text-muted-foreground leading-relaxed">
                It all starts with a simple message. A new patient inquires about your services, or an existing one asks to book an appointment. They use the communication tool they know and trust—WhatsApp—to connect directly with your clinic.
              </p>
            </div>

            {/* Arrow Down */}
            <div className="text-muted">
              <ArrowDown className="w-10 h-10" />
            </div>

            {/* Step 2 Card */}
            <div className="bg-card p-8 rounded-lg shadow-lg text-left w-full border border-border">
              <span className="text-lg font-semibold text-primary">Step 2</span>
              <h3 className="text-3xl font-bold mt-2 mb-4 text-black">LamaniHub Captures the Data Instantly</h3>
              <p className="text-muted-foreground leading-relaxed">
                This is where the magic happens. Without you lifting a finger, LamaniHub's integration detects the new conversation. It automatically captures the patient's name and phone number, creating a new, detailed profile in your CRM. The entire chat history is logged for future reference.
              </p>
            </div>

            {/* Arrow Down */}
            <div className="text-muted">
              <ArrowDown className="w-10 h-10" />
            </div>

            {/* Step 3 Card */}
            <div className="bg-card p-8 rounded-lg shadow-lg text-left w-full border border-border">
              <span className="text-lg font-semibold text-primary">Step 3</span>
              <h3 className="text-3xl font-bold mt-2 mb-4 text-black">You Follow Up with Confidence</h3>
              <p className="text-muted-foreground leading-relaxed">
                Now, your team has a complete and organized record. You can easily schedule appointments, send automated reminders, and add notes for personalized follow-ups. Every patient feels valued, and no lead ever falls through the cracks again.
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
          <Button onClick={handleStartTrial} variant="secondary" size="lg" className="text-xl px-8 py-6 h-auto font-bold bg-white text-primary hover:bg-gray-100">
            Start Your Free Trial
          </Button>
          <p className="mt-4 text-sm text-gray-400">
            Full access • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>;
};
export default HowItWorks;