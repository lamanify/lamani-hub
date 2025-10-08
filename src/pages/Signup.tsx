import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Database, MessageSquare, Shield, Clock, FileCheck, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mapSupabaseAuthError } from "@/utils/authErrors";
import logo from "@/assets/lamanify-logo.png";

const signupSchema = z.object({
  clinicName: z.string().min(2, "Clinic name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  termsAccepted: z.boolean().refine((val) => val === true, "You must accept the terms and conditions"),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak");

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      clinicName: "",
      email: "",
      password: "",
      termsAccepted: false,
    },
  });

  // Aggressive Supabase auth reset on page mount
  useEffect(() => {
    // Fully clear all possible Supabase auth state!
    (async () => {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (err) {}
      ["localStorage", "sessionStorage"].forEach((storageName) => {
        try {
          const storage = window[storageName];
          for (const key in storage) {
            if (key.includes("supabase")) storage.removeItem(key);
          }
        } catch (err) {}
      });
      // Remove Supabase cookies if any
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        if (name.startsWith("sb-")) {
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
        }
      });
    })();
  }, []);

  // Password strength calculation
  const calculatePasswordStrength = (password: string): "weak" | "medium" | "strong" => {
    if (password.length < 8) return "weak";
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    if (strength <= 2) return "weak";
    if (strength === 3) return "medium";
    return "strong";
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("password", value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  // Timeout wrapper for network requests
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), timeoutMs);
      }),
    ]);
  };

  const fallbackSignup = async (data: SignupFormData): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        data: {
          clinic_name: data.clinicName,
          full_name: data.clinicName,
          role: "clinic_admin",
        },
      },
    });
    if (error) throw error;

    // Try to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email.trim(),
      password: data.password,
    });

    if (signInError) {
      if (signInError.message.includes("Email not confirmed")) {
        toast.success("Account created! Please check your email to confirm your account.");
        return;
      }
      throw signInError;
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setLoading(true);
    form.clearErrors();

    try {
      // Call edge function first
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const response = await withTimeout(
          fetch(`${supabaseUrl}/functions/v1/signup-with-tenant`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseKey,
            },
            body: JSON.stringify({
              clinicName: data.clinicName,
              email: data.email.trim(),
              password: data.password,
              termsAccepted: data.termsAccepted,
            }),
          }),
          15000,
        );
        const result = await response.json();

        if (!response.ok) {
          // Edge function error
          const mappedError = mapSupabaseAuthError(new Error(result.error || "Signup failed"), "signup");
          if (mappedError.field) {
            form.setError(mappedError.field, {
              type: "server",
              message: mappedError.message,
            });
          } else {
            toast.error(mappedError.message);
          }
          return;
        }

        // Now log in the user
        const { error: signInError } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: data.email.trim(),
            password: data.password,
          }),
          10000,
        );
        if (signInError) {
          const mappedError = mapSupabaseAuthError(signInError, "signin");
          if (mappedError.field) {
            form.setError(mappedError.field, {
              type: "server",
              message: mappedError.message,
            });
          } else {
            toast.error(mappedError.message);
          }
          return;
        }

        toast.success("Account created successfully! Welcome to LamaniHub.");
        navigate("/onboarding");
      } catch (edgeError: any) {
        console.log("Edge function error:", edgeError.message);

        // If timeout, the signup might have actually succeeded - try to login to verify
        if (
          edgeError.message === "Request timeout" ||
          edgeError.message.toLowerCase().includes("timeout")
        ) {
          console.log("Edge function timeout - attempting login to verify signup status");
          try {
            const { error: loginError } = await supabase.auth.signInWithPassword({
              email: data.email.trim(),
              password: data.password,
            });

            if (!loginError) {
              // Login succeeded - signup was successful!
              console.log("Login successful - signup completed despite timeout");
              toast.success("Account created successfully! Welcome to LamaniHub.");
              navigate("/onboarding");
              return;
            } else {
              console.log("Login failed after timeout:", loginError.message);
              throw new Error("Signup status unclear. Please try logging in or contact support.");
            }
          } catch (loginAttemptError: any) {
            console.error("Login verification failed:", loginAttemptError);
            throw new Error("Signup status unclear. Please try logging in or contact support.");
          }
        }

        // For true network failures, use fallback
        if (
          edgeError.message.toLowerCase().includes("network") ||
          edgeError.message.includes("Failed to fetch")
        ) {
          console.log("Network error - using fallback signup");
          await withTimeout(fallbackSignup(data), 20000);
          toast.success("Account created successfully! Welcome to LamaniHub.");
          navigate("/onboarding");
        } else {
          throw edgeError;
        }
      }
    } catch (error: any) {
      const mappedError = mapSupabaseAuthError(error, "signup");
      if (mappedError.field) {
        form.setError(mappedError.field, {
          type: "server",
          message: mappedError.message,
        });
      } else {
        if (error.message === "Request timeout") {
          toast.error("Signup is taking longer than expected. Please check your internet connection and try again.", {
            duration: 6000,
          });
        } else if (error.message.toLowerCase().includes("network") || error.message.includes("Failed to fetch")) {
          toast.error("Network error. Please check your internet connection and try again.");
        } else {
          toast.error(mappedError.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: Database,
      title: "Centralized Patient Management",
      description: "Consolidate all patient data, medical histories, and contact information in one secure platform",
    },
    {
      icon: MessageSquare,
      title: "Malaysian Healthcare Focused",
      description: "Built specifically for Malaysian clinics with local phone formatting",
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Integration",
      description: "Direct click-to-WhatsApp communication for seamless patient engagement",
    },
    { icon: Clock, title: "14-Day Free Trial", description: "Full access without credit card required" },
    {
      icon: Shield,
      title: "PDPA Compliant",
      description: "Secure audit trails, consent management, and data protection for Malaysian healthcare standards",
    },
    {
      icon: Upload,
      title: "Easy Migration",
      description: "Import your existing contacts from spreadsheets with smart validation",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* LEFT SECTION */}
      <div className="lg:w-1/2 bg-gray-50 p-8 lg:p-12 flex flex-col justify-center">
        <div className="max-w-xl mx-auto">
          <Link to="/" className="inline-block mb-8">
            <img src={logo} alt="LamaniHub" className="h-10" />
          </Link>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">Transform Your Healthcare Practice</h1>
          <p className="text-lg text-muted-foreground mb-12">
            Join Malaysian clinics already streamlining their patient relationships with LamaniHub
          </p>
          <div className="space-y-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* RIGHT SECTION */}
      <div className="lg:w-1/2 bg-background p-8 lg:p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Start Your Free Trial</h2>
            <p className="text-muted-foreground">No credit card required • 14 days full access</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-5">
              <FormField
                control={form.control}
                name="clinicName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Clinic Name" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@clinic.com" {...field} disabled={loading} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={loading}
                        onChange={(e) => {
                          field.onChange(e);
                          handlePasswordChange(e);
                        }}
                      />
                    </FormControl>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all 
                          ${passwordStrength === "weak" ? "w-1/3 bg-destructive" : passwordStrength === "medium" ? "w-2/3 bg-yellow-500" : "w-full bg-green-500"}`}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">{passwordStrength}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Must be 8+ characters with uppercase letter and number
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={loading} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        I agree to the{" "}
                        <Link to="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>{" "}
                        and Terms of Service
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Creating account..." : "Start Free Trial"}
              </Button>
              {loading && (
                <p className="text-xs text-muted-foreground text-center">
                  This may take a few moments. Please don't refresh the page.
                </p>
              )}
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in here instead
            </Link>
          </div>
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>PDPA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                <span>Powered by Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
