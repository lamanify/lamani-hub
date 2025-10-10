import PublicTopBar from "@/components/PublicTopBar";
import PublicFooter from "@/components/PublicFooter";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-[hsl(220,20%,97%)]">
      <PublicTopBar />
      
      <main>
        <section className="min-h-screen flex items-center justify-center py-20 px-6">
          <div className="w-full max-w-[1100px]">
            {/* Header Section */}
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-block mb-3 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium uppercase tracking-wide">
                Get In Touch
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                We'd Love to <span className="text-primary">Hear</span> From You
              </h1>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Whether you have a question about features, trials, pricing, or anything else, our team is ready to answer all your questions.
              </p>
            </div>

            {/* Contact Info Section */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              
              {/* Email Card */}
              <div className="bg-white p-8 text-center rounded-lg border border-[#ececec] shadow-sm">
                <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10">
                  <Mail className="w-8 h-8 text-primary" strokeWidth={2} />
                </div>
                <h3 className="mt-5 text-xl font-medium text-foreground">Email Us At</h3>
                <a 
                  href="mailto:support@lamanihub.com" 
                  className="mt-2 text-base text-primary font-medium break-all inline-block hover:underline"
                >
                  support@lamanihub.com
                </a>
              </div>

              {/* Address Card */}
              <div className="bg-white p-8 text-center rounded-lg border border-[#ececec] shadow-sm">
                <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10">
                  <MapPin className="w-8 h-8 text-primary" strokeWidth={2} />
                </div>
                <h3 className="mt-5 text-xl font-medium text-foreground">Address</h3>
                <p className="mt-2 text-base text-muted-foreground leading-relaxed">
                  Level 23-1, Premier Suite,<br />
                  One Mont Kiara,<br />
                  1 Jln Kiara, Mont Kiara,<br />
                  50480 Kuala Lumpur
                </p>
              </div>

              {/* Customer Service Card */}
              <div className="bg-white p-8 text-center rounded-lg border border-[#ececec] shadow-sm">
                <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10">
                  <Phone className="w-8 h-8 text-primary" strokeWidth={2} />
                </div>
                <h3 className="mt-5 text-xl font-medium text-foreground">Customer Service</h3>
                <a 
                  href="tel:+601156706510" 
                  className="mt-2 text-base text-muted-foreground block hover:text-primary transition-colors"
                >
                  +6011-5670 6510
                </a>
              </div>

            </div>
          </div>
        </section>
      </main>
      
      <PublicFooter />
    </div>
  );
}
