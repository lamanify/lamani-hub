import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Star, Users, Shield, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublicTopBar from '@/components/PublicTopBar';
import logo from "@/assets/lamanify-logo.png";
const ProductPage = () => {
  const features = [{
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Patient Management",
    description: "Complete patient records, medical history, and PDPA-compliant data storage for Malaysian healthcare providers."
  }, {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: "WhatsApp Integration",
    description: "Instant patient communication with click-to-chat functionality and automated appointment reminders."
  }, {
    icon: <Calendar className="h-8 w-8 text-primary" />,
    title: "Smart Scheduling",
    description: "Advanced appointment booking system with automated reminders and calendar synchronization."
  }, {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: "PDPA Compliant",
    description: "Secure, compliant patient data handling specifically designed for Malaysian healthcare regulations."
  }];
  const testimonials = [{
    quote: "LamaniHub transformed our patient management. We save 3 hours daily on administrative tasks.",
    author: "Dr. Sarah Ahmad",
    clinic: "Ahmad Family Clinic, Kuala Lumpur",
    rating: 5
  }, {
    quote: "The WhatsApp integration is game-changing. Our patients love the instant communication.",
    author: "Dr. Raj Patel",
    clinic: "Dental Care Centre, Penang",
    rating: 5
  }, {
    quote: "PDPA compliance made easy. Professional system that builds patient trust.",
    author: "Dr. Lim Wei Ming",
    clinic: "Specialist Clinic, Johor Bahru",
    rating: 5
  }];
  const handleStartTrial = () => {
    // This would redirect to your checkout/signup flow
    window.location.href = '/signup';
  };
  return <div className="min-h-screen bg-background">
      <PublicTopBar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary to-primary-dark text-primary-foreground py-[120px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                The Complete CRM Built for{' '}
                <span className="text-white/90">Malaysian Clinics</span>
              </h1>
              <p className="text-xl mb-8 text-white/90">
                Manage patients, appointments, and communications in one PDPA-compliant platform. 
                Trusted by healthcare providers across Malaysia.
              </p>
              
              
              
              <Button onClick={handleStartTrial} size="lg" variant="secondary" className="text-lg px-8 py-6 h-auto">
                Start Free Trial Now →
              </Button>
            </div>
            
            <div className="lg:flex justify-center hidden">
              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-lg">
                <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&h=400&fit=crop" alt="LamaniHub Dashboard Preview" className="rounded-lg shadow-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything Your Clinic Needs
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Complete patient management system designed specifically for Malaysian healthcare providers
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {features.map((feature, index) => <div key={index} className="bg-card p-8 rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>)}
          </div>

          <div className="mt-16 bg-card p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
              Complete Feature Set
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['Unlimited patient records', 'WhatsApp click-to-chat', 'Appointment scheduling', 'Automated reminders', 'PDPA compliance', 'Multi-user access', 'Custom fields & forms', 'Professional reports', 'Data export/backup', 'Priority support', 'Mobile responsive', 'Secure cloud hosting'].map((feature, index) => <div key={index} className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Professional CRM for Malaysian clinics at an affordable price
            </p>
          </div>
          
          <div className="max-w-lg mx-auto">
            <div className="bg-card rounded-lg shadow-xl p-8 text-center relative border-2 border-primary">
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-full inline-block mb-6 font-semibold">
                🎁 14-Day FREE Trial
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-4">
                LamaniHub Professional
              </h3>
              
              <div className="mb-6">
                <span className="text-5xl font-bold text-foreground">RM49</span>
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
                  <span className="text-foreground">PDPA compliance</span>
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
              
              <Button onClick={handleStartTrial} size="lg" className="w-full text-lg py-6 h-auto mb-4">
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
      <section className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Clinic Management?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join hundreds of Malaysian clinics already using LamaniHub to provide better patient care.
          </p>
          <Button onClick={handleStartTrial} size="lg" variant="secondary" className="text-xl px-8 py-6 h-auto">
            Start Your Free 14-Day Trial
          </Button>
          <p className="mt-4 text-sm text-white/75">
            No credit card required • Full access • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      
    </div>;
};
export default ProductPage;