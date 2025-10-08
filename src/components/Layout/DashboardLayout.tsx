import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Settings, CreditCard, LogOut, Menu, Shield, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import logo from "@/assets/lamanify-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import TrialBanner from "../TrialBanner";
import PastDueBanner from "../PastDueBanner";

interface DashboardLayoutProps {
  children: ReactNode;
}

const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/leads": "Leads",
    "/settings": "Settings",
    "/billing": "Billing",
    "/audit-log": "Activity Log",
    "/admin": "Admin Portal",
  };
  return routes[pathname] || "Dashboard";
};

const getBreadcrumbs = (pathname: string) => {
  if (pathname === "/dashboard") return [{ label: "Dashboard", href: "/dashboard" }];
  
  const paths = pathname.split("/").filter(Boolean);
  const breadcrumbs = [{ label: "Dashboard", href: "/dashboard" }];
  
  paths.forEach((path, index) => {
    const href = `/${paths.slice(0, index + 1).join("/")}`;
    const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");
    breadcrumbs.push({ label, href });
  });
  
  return breadcrumbs;
};

const SidebarContent = () => {
  const location = useLocation();
  const { logout, role, profile } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Leads", href: "/leads", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Billing", href: "/billing", icon: CreditCard },
  ];

  const adminNavigation = [
    ...(role === "clinic_admin" || role === "super_admin"
      ? [{ name: "Activity Log", href: "/audit-log", icon: FileText }]
      : []),
    ...(role === "super_admin"
      ? [{ name: "Admin Portal", href: "/admin", icon: Shield }]
      : []),
  ];

  const getUserInitial = () => {
    return profile?.full_name?.charAt(0).toUpperCase() || "U";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-border">
        <Link to="/dashboard" className="flex items-center">
          <img src={logo} alt="LamaniHub" className="h-8" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-semibold text-sm relative",
                isActive
                  ? "bg-primary/10 text-primary before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-r"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Admin Section */}
        {adminNavigation.length > 0 && (
          <div className="pt-4 mt-4 border-t border-border space-y-1">
            {adminNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-semibold text-sm relative",
                    isActive
                      ? "bg-primary/10 text-primary before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-r"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {getUserInitial()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{profile?.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={async (e) => {
            e.preventDefault();
            console.log('[DashboardLayout] Logout button clicked');
            await logout();
          }}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { role, tenant, profile, user, logout, trialDaysRemaining } = useAuth();

  const pageTitle = getPageTitle(location.pathname);
  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <div className="min-h-screen flex w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 bg-white border-r border-border flex-col">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-border flex items-center px-4 lg:px-6">
          {/* Left: Mobile Menu + Breadcrumbs */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden flex-shrink-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            {/* Breadcrumbs - Hidden on mobile */}
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center">
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage className="font-semibold">{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.href}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>

            {/* Page Title - Mobile only */}
            <h1 className="md:hidden text-lg font-semibold truncate">{pageTitle}</h1>
          </div>

          {/* Right: Badges + User Dropdown */}
          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
            {/* Clinic Name Badge */}
            {tenant?.name && (
              <Badge variant="outline" className="hidden sm:flex">
                {tenant.name}
              </Badge>
            )}

            {/* Trial Badge */}
            {tenant?.subscription_status === "trial" && trialDaysRemaining !== null && (
              <Badge variant="secondary" className="hidden sm:flex">
                Trial: {trialDaysRemaining} days
              </Badge>
            )}

            {/* Super Admin Badge */}
            {role === "super_admin" && (
              <Badge className="hidden sm:flex bg-destructive text-destructive-foreground">
                Super Admin
              </Badge>
            )}

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-2 pr-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {profile?.full_name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold">{profile?.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Status Banners */}
        <div className="bg-white">
          <TrialBanner />
          <PastDueBanner />
        </div>

        {/* Page Content */}
        <main className="flex-1 bg-[#FAFAFA] overflow-auto">
          <div className="max-w-7xl mx-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
