import PublicTopBar from "@/components/PublicTopBar";
import PublicFooter from "@/components/PublicFooter";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <PublicTopBar />
      
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">Terms of Service</h1>
          <p className="text-xl text-muted-foreground mb-8 text-center">
            This page is coming soon.
          </p>
          <div className="prose prose-gray max-w-none mb-8">
            <p className="text-muted-foreground">
              We're currently preparing our comprehensive Terms of Service documentation. 
              This will include information about:
            </p>
            <ul className="text-muted-foreground">
              <li>Service usage guidelines</li>
              <li>User responsibilities</li>
              <li>Data handling and privacy</li>
              <li>Subscription terms</li>
              <li>Liability and warranties</li>
            </ul>
            <p className="text-muted-foreground">
              For any immediate questions about our terms, please contact us at hello@lamanihub.com
            </p>
          </div>
          <div className="text-center">
            <Button asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
}
