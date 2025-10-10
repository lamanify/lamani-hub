import PublicTopBar from "@/components/PublicTopBar";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <PublicTopBar />
      
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About LamaniHub</h1>
          <p className="text-xl text-muted-foreground mb-8">
            This page is coming soon.
          </p>
          <p className="text-muted-foreground mb-8">
            We're working on bringing you more information about LamaniHub, 
            the purpose-built CRM for Malaysian healthcare clinics.
          </p>
          <Button asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </main>
      
      <footer className="border-t border-border py-8 mt-20">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 LamaniHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
