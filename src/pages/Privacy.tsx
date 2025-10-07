import { Link } from "react-router-dom";
import PublicTopBar from "@/components/PublicTopBar";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <PublicTopBar />
      
      <div className="container mx-auto px-6 py-12 max-w-4xl">

        <div className="space-y-6">
          <h1 className="text-4xl font-semibold text-foreground">Privacy Policy</h1>
          
          <p className="text-muted-foreground">Last updated: October 2025</p>

          <div className="space-y-8 mt-8">
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">Introduction</h2>
              <p className="text-foreground/80 leading-relaxed">
                LamaniHub is committed to protecting your privacy and ensuring the security of your data. 
                This Privacy Policy explains how we collect, use, and safeguard your information in compliance 
                with the Personal Data Protection Act 2010 (PDPA) of Malaysia.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">Data Collection</h2>
              <p className="text-foreground/80 leading-relaxed">
                We collect information that you provide directly to us, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/80 ml-4">
                <li>Clinic and business information</li>
                <li>User account details (name, email, password)</li>
                <li>Lead and patient contact information</li>
                <li>Usage data and analytics</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">Data Usage</h2>
              <p className="text-foreground/80 leading-relaxed">
                Your data is used to provide and improve our services, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/80 ml-4">
                <li>Managing your clinic's lead information</li>
                <li>Providing customer support</li>
                <li>Sending service-related communications</li>
                <li>Improving our platform and user experience</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">Data Security</h2>
              <p className="text-foreground/80 leading-relaxed">
                We implement industry-standard security measures to protect your data from unauthorized access, 
                disclosure, alteration, or destruction. All data is encrypted in transit and at rest.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">Your Rights</h2>
              <p className="text-foreground/80 leading-relaxed">
                Under the PDPA, you have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/80 ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent for data processing</li>
                <li>Lodge a complaint with relevant authorities</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">Data Protection Officer</h2>
              <p className="text-foreground/80 leading-relaxed">
                Each clinic using LamaniHub is responsible for appointing their own Data Protection Officer (DPO) 
                as required by the PDPA. Your clinic's DPO contact information can be configured in the Settings page.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Clinic administrators can update DPO contact information by navigating to{" "}
                  <Link to="/settings" className="text-primary hover:underline">Settings → Clinic Information</Link>
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">Contact Us</h2>
              <p className="text-foreground/80 leading-relaxed">
                If you have any questions about this Privacy Policy or wish to exercise your rights, 
                please contact us at privacy@lamanihub.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
