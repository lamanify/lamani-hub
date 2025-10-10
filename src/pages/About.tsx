import PublicTopBar from "@/components/PublicTopBar";
import { Link } from "react-router-dom";
import { Plus, Shield, DollarSign, MapPin } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <PublicTopBar />
      
      <main>
        {/* Hero Section */}
        <header className="bg-background py-20 sm:py-28">
          <div className="container mx-auto px-6 text-center max-w-[1100px]">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Empowering Malaysian <span className="text-primary">Healthcare</span>, One <span className="text-primary">Clinic</span> at a Time
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground leading-relaxed">
              LamaniHub was born from a simple idea: to provide Malaysian healthcare clinics with a CRM that is powerful, affordable, and incredibly easy to use. We handle the technology, so you can focus on what matters most—your patients.
            </p>
          </div>
        </header>

        {/* Our Story Section */}
        <section className="bg-[hsl(220,20%,97%)] py-20 sm:py-24">
          <div className="container mx-auto px-6 max-w-[1100px]">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block mb-3 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium uppercase tracking-wide">
                The LamaniHub Journey
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                From a <span className="text-primary">Shared Struggle</span> to a <span className="text-primary">Simple Solution</span>
              </h2>
              <div className="mt-8 space-y-6 text-muted-foreground text-left leading-relaxed">
                <p>
                  As the team behind <strong><a href="https://www.lamanify.com" className="text-primary hover:underline">Lamanify</a></strong>, we've had the privilege of partnering with over 100 healthcare providers across Malaysia. In countless conversations with passionate clinic owners, we saw a recurring theme: a silent struggle hidden behind their dedication to patient care. We saw notebooks filled with scribbled names, spreadsheets bursting at the seams, and the constant, frantic switching between patient records and WhatsApp chats.
                </p>
                <p>
                  We realized that in Malaysia, <strong>WhatsApp is where relationships are built</strong>. It's where appointments are confirmed, questions are answered, and trust is earned. But it was also a black hole for data. Every crucial detail, every follow-up promise, and every new inquiry was at risk of being lost in a sea of notifications, or required hours of painstaking manual data entry just to keep up.
                </p>
                <p>
                  We knew that clinic owners and their dedicated admins didn't lack the will; they lacked the time. Their days are meant for healing and helping, not for copying and pasting conversation logs. The potential for growth was being capped not by a lack of patients, but by the overwhelming task of managing them.
                </p>
                <p className="font-medium text-foreground">
                  That's why we created LamaniHub. It was born from a single, obsessive question: <em>"What if we could make the technology do the work?"</em> We envisioned a CRM so seamless it could automatically capture those vital WhatsApp conversations and log them where they belong—in a secure, organized patient database.
                </p>
                <p>
                  LamaniHub is more than just software; it's our answer to that shared struggle. It's our commitment to giving you back your most valuable asset: <strong>your time</strong>. It's about empowering you to build stronger patient relationships, never miss a follow-up, and focus on the heart of your practice, confident that your data is working for you, not against you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-20 sm:py-24">
          <div className="container mx-auto px-6 max-w-[1100px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div className="text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-medium text-foreground">
                  Our <span className="text-primary">Mission</span>
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  To simplify clinic management for every healthcare provider in Malaysia with a secure, compliant, and user-friendly CRM that feels as familiar as a spreadsheet, but is infinitely more powerful.
                </p>
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-medium text-foreground">
                  Our <span className="text-primary">Vision</span>
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  To be the leading healthcare CRM in Southeast Asia, building a connected digital ecosystem that enhances patient care, streamlines operations, and supports the growth of local clinics.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="bg-[hsl(220,20%,97%)] py-20 sm:py-24">
          <div className="container mx-auto px-6 max-w-[1100px]">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-block mb-3 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium uppercase tracking-wide">
                Our Core Beliefs
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                The <span className="text-primary">Principles</span> That Guide Us
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Our values are the foundation of our product and our promise to you. They ensure we always build with purpose and integrity.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {/* Value 1: Simplicity */}
              <div className="text-center p-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <h3 className="mt-5 text-xl font-medium text-foreground">Simplicity First</h3>
                <p className="mt-2 text-sm text-muted-foreground">We build intuitive tools that require minimal training, empowering your team to get started in minutes.</p>
              </div>
              {/* Value 2: Security */}
              <div className="text-center p-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="mt-5 text-xl font-medium text-foreground">PDPA-Compliant Security</h3>
                <p className="mt-2 text-sm text-muted-foreground">Your patient data is protected with enterprise-grade security and a commitment to PDPA compliance.</p>
              </div>
              {/* Value 3: Affordability */}
              <div className="text-center p-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <h3 className="mt-5 text-xl font-medium text-foreground">Fair & Transparent Pricing</h3>
                <p className="mt-2 text-sm text-muted-foreground">No hidden fees, no long-term contracts. Just one simple, affordable monthly price for unlimited growth.</p>
              </div>
              {/* Value 4: Local Focus */}
              <div className="text-center p-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="mt-5 text-xl font-medium text-foreground">Built for Malaysia</h3>
                <p className="mt-2 text-sm text-muted-foreground">From WhatsApp integration to local payment support, every feature is designed for the Malaysian market.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-black py-20 sm:py-24">
          <div className="container mx-auto px-6 text-center max-w-[1100px]">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Ready to <span className="text-primary">Simplify</span> Your Clinic's <span className="text-primary">Workflow?</span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-gray-300">
              Join dozens of clinics across Malaysia who trust LamaniHub to manage their patient relationships. Get started today with a risk-free trial.
            </p>
            <div className="mt-8">
              <Link 
                to="/signup" 
                className="inline-block bg-primary text-white rounded-md px-6 py-3 font-medium transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                Get Started for Free
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
