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

  const handleSignup = async (data: SignupFormData) => {
    setLoading(true);

    try {
      // Call edge function to create tenant and user
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/signup-with-tenant`, {
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
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Signup failed');
      }

      // Now log in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (signInError) throw signInError;

      toast.success("Account created successfully! Welcome to LamaniHub.");
      navigate("/dashboard");

    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle specific error messages
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        toast.error("This email is already registered");
      } else if (error.message.includes("password") || error.message.includes("Password")) {
        toast.error("Password does not meet requirements");
      } else if (error.message.includes("terms") || error.message.includes("Terms")) {
        toast.error("You must accept the terms and conditions");
      } else {
        toast.error("Unable to connect, please try again");
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
                        <Input placeholder="Your Clinic Name" {...field} />
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
                        <Input type="email" placeholder="you@clinic.com" {...field} />
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
