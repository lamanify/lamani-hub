import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const LOGO_URL = "https://www.lamanify.com/wp-content/uploads/2025/10/LamaniHub.webp";

export default function PublicTopBar() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setIsOpen(false);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <header className="bg-background border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src={LOGO_URL} alt="LamaniHub" className="h-8 w-auto" />
            <span className="ml-2 text-xl font-bold text-foreground">LamaniHub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("features")}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("compliance")}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Compliance
            </button>
            <Link to="/help" className="text-muted-foreground hover:text-primary transition-colors">
              Help Center
            </Link>
            <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
              Login
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/signup">Start Free Trial</Link>
              </Button>
            )}
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
                <button
                  onClick={() => scrollToSection("features")}
                  className="text-left text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection("pricing")}
                  className="text-left text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  Pricing
                </button>
                <button
                  onClick={() => scrollToSection("compliance")}
                  className="text-left text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  Compliance
                </button>
                <Link
                  to="/help"
                  className="text-muted-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Help Center
                </Link>
                <Link
                  to="/login"
                  className="text-muted-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <div className="pt-4 border-t">
                  {user ? (
                    <Button asChild className="w-full">
                      <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                        Back to Dashboard
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link to="/signup" onClick={() => setIsOpen(false)}>
                        Start Free Trial
                      </Link>
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
