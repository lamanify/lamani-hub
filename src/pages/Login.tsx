import { useCallback, useMemo, lazy } from "react";
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
import { Loader2 } from "lucide-react";
const LOGO_URL = "https://www.lamanify.com/wp-content/uploads/2025/10/LamaniHub.webp";

// Lazy load ForgotPasswordDialog for better performance
const ForgotPasswordDialog = lazy(() => import("@/components/ForgotPasswordDialog"));
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional()
});
type LoginFormData = z.infer<typeof loginSchema>;
export default function Login() {
  const navigate = useNavigate();
  const {
    user,
    login
  } = useAuth();

  // Optimized form configuration with onBlur validation
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    // Only validate on blur for better UX
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    }
  });
  const {
    handleSubmit,
    formState: {
      isSubmitting
    }
  } = form;

  // Smart auto-redirect logic
  useMemo(() => {
    if (user) {
      // Set login success flag for dashboard toast
      sessionStorage.setItem("just_logged_in", "true");
      navigate("/dashboard", {
        replace: true
      });
    }
  }, [user, navigate]);

  // Optimized login handler with immediate navigation
  const handleLogin = useCallback(async (data: LoginFormData) => {
    try {
      await login(data.email.trim(), data.password);
      // Navigation happens via the useMemo above when user state updates
    } catch (error: any) {
      const mappedError = mapSupabaseAuthError(error, "signin");
      if (mappedError.field) {
        form.setError(mappedError.field, {
          type: "server",
          message: mappedError.message
        });
      } else {
        toast.error(mappedError.message);
      }
    }
  }, [login, form]);

  // Memoized forgot password handler
  const handleForgotPassword = useCallback(() => {
    // Dynamically import and show forgot password dialog
    import("@/components/ForgotPasswordDialog").then(module => {
      // Handle forgotten password logic here
      toast.info("Password reset functionality will be available shortly.");
    });
  }, []);
  return <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src={LOGO_URL} alt="Lamanify" className="mx-auto h-12 w-auto mb-4" loading="eager" // Ensure logo loads immediately
        />
          <h1 className="text-2xl font-bold text-gray-900">Sign in to your account</h1>
          <p className="mt-2 text-sm text-gray-600">Welcome back! Please sign in to continue.</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center">Sign In</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
                <FormField control={form.control} name="email" render={({
                field
              }) => <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="Enter your email" autoComplete="email" autoFocus // Focus on email field for better UX
                  disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="password" render={({
                field
              }) => <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Enter your password" autoComplete="current-password" disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <div className="flex items-center justify-between">
                  <FormField control={form.control} name="rememberMe" render={({
                  field
                }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal cursor-pointer">Remember me</FormLabel>
                        </div>
                      </FormItem>} />

                  <button type="button" onClick={handleForgotPassword} className="text-sm text-primary hover:underline" disabled={isSubmitting}>
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2" disabled={isSubmitting}>
                  {isSubmitting ? <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </> : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/signup" className="font-medium text-primary hover:text-primary/90 hover:underline">
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}