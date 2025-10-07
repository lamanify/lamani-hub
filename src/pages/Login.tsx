import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { mapSupabaseAuthError } from "@/utils/authErrors";
import ForgotPasswordDialog from "@/components/ForgotPasswordDialog";
import { Loader2 } from "lucide-react";
import logo from "@/assets/lamanify-logo.png";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading, login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const hasRedirectedRef = useRef(false);
  const isNavigatingRef = useRef(false);
  const navigationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousUserIdRef = useRef<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true
    }
  });

  // Complete auth state reset on mount
  useEffect(() => {
    const initAuth = async () => {
      // Full sign out to reset Supabase client state
      await supabase.auth.signOut({ scope: 'local' });
      
      // Clear all Supabase-related keys from both localStorage and sessionStorage
      ['localStorage', 'sessionStorage'].forEach(storageType => {
        const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
        const keys = Object.keys(storage);
        keys.forEach(key => {
          if (key.includes('supabase')) {
            storage.removeItem(key);
          }
        });
      });
      
      // Get fresh session state (recommended over refreshSession)
      await supabase.auth.getSession();
    };

    initAuth();
    
    // Reset redirect flag on unmount
    return () => {
      hasRedirectedRef.current = false;
    };
  }, []);

  // Navigation guard with enhanced stability check and logging
  useEffect(() => {
    console.log("[Login Navigation Guard]", {
      authLoading,
      userId: user?.id,
      role,
      hasRedirected: hasRedirectedRef.current,
      isNavigating: isNavigatingRef.current,
      previousUserId: previousUserIdRef.current,
      timestamp: new Date().toISOString()
    });

    // Clear any existing navigation timer
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }

    // Early return conditions
    if (authLoading || !user || hasRedirectedRef.current || isNavigatingRef.current) {
      return;
    }

    // Check for user ID stability (same user for consecutive renders)
    const currentUserId = user.id;
    if (previousUserIdRef.current !== currentUserId) {
      console.log("[Login] User ID changed, waiting for stability", {
        previous: previousUserIdRef.current,
        current: currentUserId
      });
      previousUserIdRef.current = currentUserId;
      return;
    }

    // User is stable, proceed with navigation after delay
    console.log("[Login] Auth stable, scheduling navigation");
    isNavigatingRef.current = true;
    
    navigationTimerRef.current = setTimeout(() => {
      console.log("[Login] Executing navigation to /dashboard");
      hasRedirectedRef.current = true;
      navigate("/dashboard");
    }, 300);

    // Cleanup
    return () => {
      if (navigationTimerRef.current) {
        console.log("[Login] Cleanup: clearing navigation timer");
        clearTimeout(navigationTimerRef.current);
        navigationTimerRef.current = null;
      }
    };
  }, [user, authLoading, navigate, role]);

  // Reset refs on unmount
  useEffect(() => {
    return () => {
      hasRedirectedRef.current = false;
      isNavigatingRef.current = false;
      previousUserIdRef.current = null;
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
    };
  }, []);

  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    
    // Clear any existing form errors
    form.clearErrors();

    try {
      await login(data.email.trim(), data.password);
      toast.success("Login successful!");
      // Navigation is handled by the AuthContext after successful login
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Use the auth error mapping utility
      const mappedError = mapSupabaseAuthError(error, 'signin');
      
      if (mappedError.field) {
        // Set the error on the specific form field
        form.setError(mappedError.field, {
          type: 'server',
          message: mappedError.message
        });
      } else {
        // Show general error as toast for non-field errors
        toast.error(mappedError.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link to="/">
            <img src={logo} alt="LamaniHub" className="h-12 mx-auto" />
          </Link>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@clinic.com"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <button
                          type="button"
                          onClick={() => setForgotPasswordOpen(true)}
                          className="text-sm text-primary hover:underline"
                          disabled={isSubmitting}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          Remember me
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        <ForgotPasswordDialog
          open={forgotPasswordOpen}
          onOpenChange={setForgotPasswordOpen}
        />
      </div>
    </div>
  );
}