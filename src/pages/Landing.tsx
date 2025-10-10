import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, ShieldCheck, Settings, Upload, CreditCard, Smile } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PublicTopBar from "@/components/PublicTopBar";
const LOGO_URL = "https://www.lamanify.com/wp-content/uploads/2025/10/LamaniHub.webp";
export default function Landing() {
  const {
    user
  } = useAuth();
  return <div className="min-h-screen bg-background">
      <PublicTopBar />
      
      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-28 text-center">
          <div className="container mx-auto px-6">
            <h1 className="text-4xl leading-tight mb-4 text-center font-bold md:text-6xl">
              Stop Juggling Spreadsheets. <br className="hidden md:block" /> 
              Start <span className="text-primary">Growing Your Clinic.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              LamaniHub is the purpose-built, cloud-based CRM for Malaysian healthcare clinics. 
              Effortlessly manage patient contacts, communications, and consent while staying PDPA compliant.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/signup">Start Your 14-Day Free Trial</Link>
              </Button>
              {user && <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  
                </Button>}
            </div>
            <p className="text-sm text-muted-foreground mt-3">No credit card required.</p>
            <div className="mt-16">
              <img src="https://placehold.co/1200x600/e8e8e8/333?text=LamaniHub+Dashboard+Mockup" alt="LamaniHub Dashboard" className="w-full h-auto max-w-5xl mx-auto rounded-lg shadow-2xl" />
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-20 bg-secondary/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-primary font-semibold mb-2">BUILT FOR YOU</p>
              <h2 className="text-3xl md:text-4xl font-bold">Focus on Patient Care, Not Paperwork.</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
                LamaniHub is packed with features designed to organize your clinic, automate your workflow, and grow your revenue.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature Card 1: Contact Management */}
              <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow border">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Contact Management</h3>
                <p className="text-muted-foreground">
                  Centralize patient contacts with +60 number standardization, consent capture, and simple lead tracking.
                </p>
              </div>
              
              {/* Feature Card 2: PDPA Compliance */}
              <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow border">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">PDPA Compliance</h3>
                <p className="text-muted-foreground">
                  Built-in consent logs and secure audit trails ensure your clinic's data management is safe and legal.
                </p>
              </div>
              
              {/* Feature Card 3: Automation */}
              <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow border">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground mb-4">
                  <Settings className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">WhatsApp Automation</h3>
                <p className="text-muted-foreground">
                  Schedule follow-up reminders and patient outreach via WhatsApp, with all communications logged automatically.
                </p>
              </div>
              
              {/* Feature Card 4: Easy Import/Export */}
              <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow border">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground mb-4">
                  <Upload className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Easy Data Import</h3>
                <p className="text-muted-foreground">
                  Seamlessly move your clinic's patient data from Excel or CSV files into a secure, cloud-based system.
                </p>
              </div>
              
              {/* Feature Card 5: Subscription Billing */}
              <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow border">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground mb-4">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Subscription Billing</h3>
                <p className="text-muted-foreground">
                  Integrates with Stripe for effortless clinic onboarding, subscription management, and secure payments.
                </p>
              </div>
              
              {/* Feature Card 6: User-Friendly */}
              <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow border">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground mb-4">
                  <Smile className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Intuitive & User-Friendly</h3>
                <p className="text-muted-foreground">
                  A clean interface designed for a smooth transition from spreadsheets, minimizing the learning curve for your team.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Section */}
        <section id="compliance" className="py-20">
          <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left order-2 md:order-1">
              <img src="https://placehold.co/500x500/e8e8e8/333?text=PDPA+Compliant" alt="PDPA Compliance" className="mx-auto rounded-lg shadow-xl" />
            </div>
            <div className="order-1 md:order-2">
              <p className="text-primary font-semibold mb-2">BUILT FOR MALAYSIA</p>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">PDPA Compliant by Design.</h3>
              <p className="text-muted-foreground mb-6">
                LamaniHub is built from the ground up with Malaysian healthcare regulations in mind. 
                Securely manage patient data with built-in consent logs and audit trails, ensuring your clinic 
                operates safely and legally under the Personal Data Protection Act (PDPA).
              </p>
              <Link to="/privacy" className="text-primary font-semibold hover:underline">
                Learn more about our security features →
              </Link>
            </div>
          </div>
        </section>
        
        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-secondary/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <p className="text-primary font-semibold mb-2">SIMPLE & TRANSPARENT</p>
              <h2 className="text-3xl md:text-4xl font-bold">One Plan. All Features.</h2>
              <p className="text-muted-foreground mt-4">
                No hidden fees, no complicated tiers. Get full access to everything LamaniHub has to offer 
                with one simple monthly subscription.
              </p>
            </div>
            <div className="max-w-md mx-auto bg-card rounded-lg shadow-xl border">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-center mb-2">Clinic Growth Plan</h3>
                <div className="flex justify-center items-baseline my-8">
                  <span className="text-5xl font-extrabold">RM49</span>
                  <span className="text-xl font-semibold text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground text-center text-sm mb-8">Billed monthly. Cancel anytime.</p>
                
                <ul className="space-y-4 text-foreground">
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Unlimited Patient Contacts
                  </li>
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    PDPA Compliant Data Storage
                  </li>
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    WhatsApp Automation
                  </li>
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Easy Data Import & Export
                  </li>
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Stripe Subscription Billing
                  </li>
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Full Customer Support
                  </li>
                </ul>
              </div>
              <div className="p-8 bg-secondary/50 rounded-b-lg">
                <Button asChild className="w-full" size="lg">
                  <Link to="/signup">Start 14-Day Free Trial</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-black text-white py-20">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold mb-4">Start Your 14-Day Free Trial Today</h2>
              <p className="text-gray-400 mb-6">
                Take the first step towards a more organized, compliant, and profitable clinic. 
                Sign up for your free 14-day trial—no credit card required. Get instant access to all features 
                and see how LamaniHub can transform your patient management overnight.
              </p>
              <ul className="space-y-4 text-gray-300 mb-8 inline-block text-left">
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg> 
                  Never lose a patient follow-up again.
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg> 
                  Save hours on administrative tasks.
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg> 
                  Increase patient retention and revenue.
                </li>
              </ul>
              <div className="mt-4">
                <Button asChild size="lg">
                  <Link to="/signup">Start Free Trial</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[hsl(220,20%,97%)] text-gray-600 pt-16 pb-8">
        <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <img src={LOGO_URL} alt="LamaniHub Logo" className="h-12 mb-4" />
            <p className="text-sm">
              The all-in-one CRM designed to help Malaysian healthcare clinics grow, get organized, and stay compliant.
            </p>
          </div>
          
          {/* Product */}
          <div>
            <h4 className="font-semibold text-black mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-black transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-black transition-colors">Pricing</a></li>
              <li><a href="#compliance" className="hover:text-black transition-colors">PDPA Compliance</a></li>
              <li><Link to="/product" className="hover:text-black transition-colors">Security</Link></li>
              <li><Link to="/help" className="hover:text-black transition-colors">Help Center</Link></li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h4 className="font-semibold text-black mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-black transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-black transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-black transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-black mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>hello@lamanihub.com</li>
              <li>+60 3 1234 5678</li>
              <li>Kuala Lumpur, Malaysia</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-6 mt-12 pt-8 border-t border-gray-400 text-center text-sm">
          <p>&copy; 2025 LamaniHub. All Rights Reserved.</p>
        </div>
      </footer>
    </div>;
}