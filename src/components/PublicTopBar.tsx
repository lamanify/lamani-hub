import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/lamanify-logo.png";

export default function PublicTopBar() {
  const { user } = useAuth();

  return (
    <header className="bg-background border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src={logo} alt="LamaniHub" className="h-8 w-auto" />
            <span className="ml-2 text-xl font-bold text-foreground">LamaniHub</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link to="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
