import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Users } from "lucide-react";
import logo from "@/assets/lamanify-logo.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo / Brand */}
          <div className="inline-block mb-4">
            <img src={logo} alt="LamaniHub" className="h-16 lg:h-20 mx-auto" />
          </div>

          {/* Tagline */}
          <h2 className="text-2xl lg:text-3xl text-foreground/90 max-w-3xl mx-auto">
            Lead Management for Malaysian Healthcare Clinics
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional CRM designed for healthcare professionals. Track leads, manage patient consents, 
            and stay PDPA compliant—all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button asChild size="lg" className="min-w-[200px]">
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[200px]">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16 lg:py-24">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-3xl font-semibold text-center mb-12 text-foreground">
            Built for Healthcare Excellence
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                <Users className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-semibold text-foreground">Lead Tracking</h4>
              <p className="text-muted-foreground">
                Organize and track patient leads efficiently with our intuitive CRM system.
              </p>
            </div>

            <div className="text-center space-y-4 p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                <Shield className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-semibold text-foreground">PDPA Compliant</h4>
              <p className="text-muted-foreground">
                Built-in consent management ensures your clinic stays compliant with Malaysian regulations.
              </p>
            </div>

            <div className="text-center space-y-4 p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                <Heart className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-semibold text-foreground">Patient Care</h4>
              <p className="text-muted-foreground">
                Focus on what matters—providing excellent patient care while we handle the admin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 LamaniHub. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
