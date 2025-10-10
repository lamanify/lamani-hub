import { Link } from 'react-router-dom';
import { CheckCircle, Users, Shield, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublicTopBar from '@/components/PublicTopBar';
import PublicFooter from '@/components/PublicFooter';

const ProductPage = () => {
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
            The Complete CRM Built for <span className="text-primary">Malaysian Clinics</span>
          </h1>
          <p className="text-xl mb-8 text-muted-foreground">
            Manage patients, appointments, and communications in one PDPA-compliant platform. Trusted by healthcare providers across Malaysia.
          </p>
          <Button
            onClick={handleStartTrial}
            variant="outline"
            size="lg"
            className="text-lg px-8 py-6 h-auto font-bold"
          >
            Start Free Trial Now →
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required • Full access • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[hsl(220,20%,97%)]">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="inline-block mb-3 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium uppercase tracking-wide">
              Features
            </span>
            <h2 className="text-4xl font-bold mb-4 text-black">
              Everything Your <span className="text-primary">Clinic Needs</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              A complete patient management system designed specifically for Malaysian healthcare providers to save time and increase efficiency.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Patient Management */}
            <div className="bg-card p-8 rounded-lg border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-5">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary">
                    <Users className="h-7 w-7" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-black">Patient Management</h3>
                  <p className="text-muted-foreground">
                    Complete patient records, medical history, and PDPA-compliant data storage for Malaysian healthcare providers.
                  </p>
                </div>
              </div>
            </div>

            {/* WhatsApp Integration */}
            <div className="bg-card p-8 rounded-lg border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-5">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-black">WhatsApp Integration</h3>
                  <p className="text-muted-foreground">
                    Instant patient communication with click-to-chat functionality and automated appointment reminders.
                  </p>
                </div>
              </div>
            </div>

            {/* Smart Scheduling */}
            <div className="bg-card p-8 rounded-lg border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-5">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-7 w-7" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-black">Smart Scheduling</h3>
                  <p className="text-muted-foreground">
                    Advanced appointment booking system with automated reminders and calendar synchronization.
                  </p>
                </div>
              </div>
            </div>

            {/* PDPA Compliant */}
            <div className="bg-card p-8 rounded-lg border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-5">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary">
                    <Shield className="h-7 w-7" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-black">PDPA Compliant</h3>
                  <p className="text-muted-foreground">
                    Secure, compliant patient data handling specifically designed for Malaysian healthcare regulations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <span className="inline-block mb-3 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium uppercase tracking-wide">
              How It Works
            </span>
            <h2 className="text-4xl font-bold mb-4 text-black">
              Automate Your Clinic in <span className="text-primary">3 Simple Steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            {/* Step 1 */}
            <div className="p-8">
              <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-primary/10 text-primary text-3xl font-bold mb-5">
                1
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">Patient Sends a WhatsApp</h3>
              <p className="text-muted-foreground">
                A new or existing patient sends an inquiry, appointment request, or a simple question directly to your clinic's dedicated WhatsApp number.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8">
              <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-primary/10 text-primary text-3xl font-bold mb-5">
                2
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">Data is Captured Automatically</h3>
              <p className="text-muted-foreground">
                LamaniHub instantly captures the patient's name, phone number, and conversation history, creating a new lead or updating an existing profile in your CRM—all without any manual data entry.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8">
              <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-primary/10 text-primary text-3xl font-bold mb-5">
                3
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">Follow Up With Ease</h3>
              <p className="text-muted-foreground">
                Your team now has a complete, organized record. Schedule appointments, send reminders, and provide personalized follow-ups to build lasting patient relationships and grow your clinic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-[hsl(220,20%,97%)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="inline-block mb-3 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium uppercase tracking-wide">
              Pricing
            </span>
            <h2 className="text-4xl font-bold mb-4 text-black">
              Simple, <span className="text-primary">Transparent</span> Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Professional CRM for Malaysian clinics at an affordable price. One plan, all features, no surprises.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-card rounded-lg shadow-lg p-8 text-center relative border-2 border-primary">
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-full inline-block mb-6 font-semibold text-sm">
                🎁 14-Day FREE Trial
              </div>

              <h3 className="text-2xl font-bold text-black mb-4">
                LamaniHub Professional
              </h3>

              <div className="mb-6">
                <span className="text-5xl font-extrabold text-black">RM49</span>
                <span className="text-xl text-muted-foreground">/month per clinic</span>
              </div>

              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground">Unlimited patient records</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground">WhatsApp integration</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground">Appointment scheduling</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground">PDPA compliance tools</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground">Multi-user access</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-foreground">Priority support</span>
                </li>
              </ul>

              <Button
                onClick={handleStartTrial}
                size="lg"
                className="w-full text-lg py-6 h-auto mb-4 font-bold"
              >
                Start Free Trial
              </Button>

              <p className="text-sm text-muted-foreground">
                No credit card required • Cancel anytime during trial
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-black py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold mb-4 text-white">
            Ready to Transform Your <span className="text-primary">Clinic Management?</span>
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Join hundreds of Malaysian clinics already using LamaniHub to provide better patient care and grow their practice.
          </p>
          <Button
            onClick={handleStartTrial}
            variant="secondary"
            size="lg"
            className="text-xl px-8 py-6 h-auto font-bold bg-white text-primary hover:bg-gray-100"
          >
            Start Your Free 14-Day Trial
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

export default ProductPage;