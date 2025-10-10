import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
const LOGO_URL = "https://www.lamanify.com/wp-content/uploads/2025/10/LamaniHub.webp";
export default function PublicTopBar() {
  const {
    user
  } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  return <header className="bg-background border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src={LOGO_URL} alt="LamaniHub" className="h-8 w-auto" />
            
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link to="/help" className="text-muted-foreground hover:text-primary transition-colors">
              User Guide
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
              About
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? <Button asChild>
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button> : <>
                <Button asChild variant="outline">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Start Free Today</Link>
                </Button>
              </>}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-4 mt-6">
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors py-2" onClick={() => setIsOpen(false)}>
                  Home
                </Link>
                <Link to="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors py-2" onClick={() => setIsOpen(false)}>
                  How It Works
                </Link>
                <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors py-2" onClick={() => setIsOpen(false)}>
                  Pricing
                </Link>
                <Link to="/help" className="text-muted-foreground hover:text-primary transition-colors py-2" onClick={() => setIsOpen(false)}>
                  User Guide
                </Link>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors py-2" onClick={() => setIsOpen(false)}>
                  About
                </Link>
                <div className="pt-4 border-t space-y-2">
                  {user ? <Button asChild className="w-full">
                      <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                        Back to Dashboard
                      </Link>
                    </Button> : <>
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/login" onClick={() => setIsOpen(false)}>
                          Log in
                        </Link>
                      </Button>
                      <Button asChild className="w-full">
                        <Link to="/signup" onClick={() => setIsOpen(false)}>
                          Start Free Today
                        </Link>
                      </Button>
                    </>}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>;
}