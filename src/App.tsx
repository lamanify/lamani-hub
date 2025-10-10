import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkError } from "@/components/NetworkError";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Product from "./pages/Product";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import Admin from "./pages/Admin";
import AdminTenantDetail from "./pages/AdminTenantDetail";
import AuditLog from "./pages/AuditLog";
import Privacy from "./pages/Privacy";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import LeadDetail from "./pages/LeadDetail";
import FieldsManager from "./pages/FieldsManager";
import Onboarding from "./pages/Onboarding";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 0,
      gcTime: 0,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <NetworkError />
        <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/product" element={<Product />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={
              <SubscriptionGuard requiresSubscription={false}>
                <Onboarding />
              </SubscriptionGuard>
            } />
            
            {/* Protected Routes - Require Active Subscription */}
            <Route path="/dashboard" element={
              <SubscriptionGuard requiresSubscription={true}>
                <Dashboard />
              </SubscriptionGuard>
            } />
            <Route path="/leads" element={
              <SubscriptionGuard requiresSubscription={true}>
                <Leads />
              </SubscriptionGuard>
            } />
            <Route path="/leads/:id" element={
              <SubscriptionGuard requiresSubscription={true}>
                <LeadDetail />
              </SubscriptionGuard>
            } />
            <Route path="/settings" element={
              <SubscriptionGuard requiresSubscription={true}>
                <Settings />
              </SubscriptionGuard>
            } />
            <Route path="/settings/fields" element={
              <SubscriptionGuard requiresSubscription={true}>
                <FieldsManager />
              </SubscriptionGuard>
            } />
            
            {/* Billing - Protected but no subscription required */}
            <Route path="/billing" element={
              <SubscriptionGuard requiresSubscription={false}>
                <Billing />
              </SubscriptionGuard>
            } />

            {/* Activity Log - Admin Only */}
            <Route path="/audit-log" element={
              <SubscriptionGuard requiresSubscription={true}>
                <AuditLog />
              </SubscriptionGuard>
            } />

            {/* Admin - Super Admin Only */}
            <Route path="/admin" element={
              <SubscriptionGuard requiresSubscription={false} requiresSuperAdmin={true}>
                <Admin />
              </SubscriptionGuard>
            } />
            <Route path="/admin/tenants/:id" element={
              <SubscriptionGuard requiresSubscription={false} requiresSuperAdmin={true}>
                <AdminTenantDetail />
              </SubscriptionGuard>
            } />
            
            {/* Catch-all Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
