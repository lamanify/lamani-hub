import PublicTopBar from '@/components/PublicTopBar';
import PublicFooter from '@/components/PublicFooter';
import { Button } from '@/components/ui/button';
import { MessageSquare, Database, Users } from 'lucide-react';
const HowItWorks = () => {
  const handleStartTrial = () => {
    window.location.href = '/signup';
  };
  return <div className="min-h-screen bg-background">
      <PublicTopBar />

      {/* Hero Section */}
      

      {/* How It Works Section */}
      

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