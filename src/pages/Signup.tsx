import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/lamanify-logo.png";

const signupSchema = z.object({
  clinicName: z.string().min(2, "Clinic name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms and conditions")
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
      termsAccepted: false
    }
  });

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

  // Create a timeout wrapper for network requests
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      })
    ]);
  };

  // Fallback direct signup method using Supabase Auth
  const fallbackSignup = async (data: SignupFormData): Promise<void> => {
    console.log('Using fallback signup method...');
    
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          clinic_name: data.clinicName,
          full_name: data.clinicName,
          role: 'clinic_admin',
        }
      }
    });

    if (error) {
      throw error;
    }

    // Check if user was created and sign them in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (signInError) {
      // If sign-in fails, the user might need to confirm their email
      if (signInError.message.includes('Email not confirmed')) {
        toast.success("Account created! Please check your email to confirm your account.");
        return;
      }
      throw signInError;
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setLoading(true);
    let attemptedEdgeFunction = false;

    try {
      // First try the edge function approach with timeout
      try {
        attemptedEdgeFunction = true;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        const response = await withTimeout(
          fetch(`${supabaseUrl}/functions/v1/signup-with-tenant`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey
            },
            body: JSON.stringify({
              clinicName: data.clinicName,
              email: data.email,
              password: data.password,
              termsAccepted: data.termsAccepted
            })
          }),
          15000 // 15 second timeout for edge function
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Signup failed');
        }

        // Now log in the user
        const { error: signInError } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password
          }),
          10000 // 10 second timeout for sign-in
        );

        if (signInError) throw signInError;

        toast.success("Account created successfully! Welcome to LamaniHub.");
        navigate("/dashboard");
        
      } catch (edgeError: any) {
        console.log('Edge function signup failed:', edgeError);
        
        // If edge function fails or times out, use fallback method
        if (edgeError.message === 'Request timeout' || 
            edgeError.message.includes('timeout') ||
            edgeError.message.includes('network') ||
            edgeError.message.includes('Failed to fetch')) {
          
          console.log('Network issue detected, using fallback signup...');
          await withTimeout(fallbackSignup(data), 20000); // 20 second timeout for fallback
          
          toast.success("Account created successfully! Welcome to LamaniHub.");
          navigate("/dashboard");
        } else {
          throw edgeError; // Re-throw non-network errors
        }
      }

    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle specific error messages with helpful guidance
      if (error.message === 'Request timeout') {
        toast.error("Signup is taking longer than expected. Please check your internet connection and try again.", {
          duration: 6000
        });
      } else if (error.message.includes("already registered") || error.message.includes("already exists") || error.message.includes("User already registered")) {
        toast.error("This email is already registered. Try signing in instead.");
      } else if (error.message.includes("password") || error.message.includes("Password")) {
        toast.error("Password does not meet requirements. Please check the password rules.");
      } else if (error.message.includes("email") || error.message.includes("Email")) {
        toast.error("Please enter a valid email address.");
      } else if (error.message.includes("terms") || error.message.includes("Terms")) {
        toast.error("You must accept the terms and conditions to continue.");
      } else if (error.message.includes("clinic") || error.message.includes("Clinic")) {
        toast.error("Please enter a valid clinic name.");
      } else if (error.message.includes("network") || error.message.includes("Failed to fetch")) {
        toast.error("Network error. Please check your internet connection and try again.");
      } else if (attemptedEdgeFunction && error.message.includes('Edge function')) {
        toast.error("Service temporarily unavailable. Please try again in a few moments.");
      } else {
        // Generic error with helpful message
        toast.error("Unable to create account. Please check your details and try again.", {
          description: "If the problem persists, please contact support.",
          duration: 6000
        });
      }
    } finally {
      setLoading(false);
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

        {/* Signup Card */}
        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Get started with LamaniHub today</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-4">
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
                            className={`h-full rounded-full transition-all ${
                              passwordStrength === "weak"
                                ? "w-1/3 bg-destructive"
                                : passwordStrength === "medium"
                                ? "w-2/3 bg-yellow-500"
                                : "w-full bg-green-500"
                            }`}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">
                          {passwordStrength}
                        </span>
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
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={loading}
                        />
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

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Creating account..." : "Create Account"}
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
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}