import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Copy, 
  RefreshCw, 
  ExternalLink,
  CheckCircle,
  Database,
  ChevronRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { PhoneInput } from "@/components/PhoneInput";
import { Link } from "react-router-dom";
import { normalizePhone, isValidMalaysianPhone } from "@/lib/utils/phoneNormalizer";

// Form schemas
const profileSchema = z.object({
  clinicName: z.string().min(2, "Clinic name must be at least 2 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
});

const dpoSchema = z.object({
  dpo_name: z.string().min(2, "DPO name must be at least 2 characters"),
  dpo_email: z.string().email("Valid email required"),
  dpo_phone: z.string().refine(
    (val) => isValidMalaysianPhone(val),
    "Valid Malaysian phone required"
  ),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type DpoFormValues = z.infer<typeof dpoSchema>;

export default function Settings() {
  const { user, profile, tenant, role } = useAuth();
  const queryClient = useQueryClient();
  const [showApiKey, setShowApiKey] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);

  const isAdmin = role === "clinic_admin" || role === "super_admin";

  // Fetch tenant details
  const { data: tenantData, isLoading: tenantLoading } = useQuery({
    queryKey: ["tenant", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error("No tenant ID");
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenant.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.id,
  });

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      clinicName: tenantData?.name || "",
      fullName: profile?.full_name || "",
    },
    values: {
      clinicName: tenantData?.name || "",
      fullName: profile?.full_name || "",
    },
  });

  // DPO form
  const dpoForm = useForm<DpoFormValues>({
    resolver: zodResolver(dpoSchema),
    defaultValues: {
      dpo_name: tenantData?.dpo_name || "",
      dpo_email: tenantData?.dpo_email || "",
      dpo_phone: tenantData?.dpo_phone || "",
    },
    values: {
      dpo_name: tenantData?.dpo_name || "",
      dpo_email: tenantData?.dpo_email || "",
      dpo_phone: tenantData?.dpo_phone || "",
    },
  });

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      // Update tenant name
      const { error: tenantError } = await supabase
        .from("tenants")
        .update({ 
          name: data.clinicName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tenant?.id);

      if (tenantError) throw tenantError;

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: data.fullName })
        .eq("user_id", user?.id);

      if (profileError) throw profileError;

      // Audit log
      await supabase.from("audit_log").insert({
        tenant_id: tenant?.id,
        user_id: user?.id,
        action: "settings_updated",
        resource_id: tenant?.id,
        details: { 
          clinic_name: data.clinicName,
          full_name: data.fullName,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Settings saved successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save settings");
    },
  });

  // Save DPO mutation
  const saveDpoMutation = useMutation({
    mutationFn: async (data: DpoFormValues) => {
      const normalizedPhone = normalizePhone(data.dpo_phone);

      const { error } = await supabase
        .from("tenants")
        .update({
          dpo_name: data.dpo_name,
          dpo_email: data.dpo_email,
          dpo_phone: normalizedPhone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tenant?.id);

      if (error) throw error;

      // Audit log
      await supabase.from("audit_log").insert({
        tenant_id: tenant?.id,
        user_id: user?.id,
        action: "dpo_updated",
        resource_id: tenant?.id,
        details: { dpo_name: data.dpo_name },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
      toast.success("DPO information saved");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save DPO information");
    },
  });

  // Regenerate API key mutation (using secure edge function)
  const regenerateApiKeyMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('regenerate-api-key', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to regenerate API key');

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
      
      // Show success with grace period warning
      toast.success(
        `API key regenerated! Old key (ending ${data.old_key_last_4}) remains valid for ${data.grace_period_minutes} minutes.`,
        { duration: 10000 }
      );
      
      setRegenerateDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to regenerate API key");
    },
  });

  const handleCopyApiKey = () => {
    if (tenantData?.api_key) {
      navigator.clipboard.writeText(tenantData.api_key);
      toast.success("API key copied to clipboard");
    }
  };

  const getSubscriptionBadge = () => {
    const status = tenantData?.subscription_status;
    if (status === "active") {
      return <Badge className="bg-green-500">Active</Badge>;
    }
    if (status === "trial") {
      return <Badge variant="secondary">Trial</Badge>;
    }
    if (status === "past_due") {
      return <Badge variant="destructive">Past Due</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (tenantLoading || !tenantData) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your clinic settings and compliance information
          </p>
        </div>

        {/* Custom Fields Link */}
        <Card className="hover:border-primary transition-colors cursor-pointer">
          <Link to="/settings/fields">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Custom Fields</CardTitle>
                    <CardDescription>
                      Manage fields that appear on your leads
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Clinic Profile</TabsTrigger>
            <TabsTrigger value="pdpa">PDPA Compliance</TabsTrigger>
            <TabsTrigger value="api">API Access</TabsTrigger>
          </TabsList>

          {/* Tab 1: Clinic Profile */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Clinic Information</CardTitle>
                <CardDescription>
                  Basic information about your clinic
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Created on</p>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(tenantData.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subscription Status</p>
                    <div className="mt-1">{getSubscriptionBadge()}</div>
                  </div>
                </div>

                <form
                  onSubmit={profileForm.handleSubmit((data) =>
                    saveProfileMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Clinic Name</Label>
                    <Input
                      id="clinicName"
                      {...profileForm.register("clinicName")}
                      placeholder="Your Clinic Name"
                      disabled={!isAdmin}
                    />
                    {profileForm.formState.errors.clinicName && (
                      <p className="text-sm text-destructive">
                        {profileForm.formState.errors.clinicName.message}
                      </p>
                    )}
                  </div>

                  {!isAdmin && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Only administrators can edit clinic settings
                      </AlertDescription>
                    </Alert>
                  )}

                  {isAdmin && (
                    <Button
                      type="submit"
                      disabled={saveProfileMutation.isPending}
                    >
                      {saveProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>
                  Your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form
                  onSubmit={profileForm.handleSubmit((data) =>
                    saveProfileMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      {...profileForm.register("fullName")}
                      placeholder="Your Full Name"
                    />
                    {profileForm.formState.errors.fullName && (
                      <p className="text-sm text-destructive">
                        {profileForm.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div>
                      <Badge variant="outline" className="capitalize">
                        {role?.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={saveProfileMutation.isPending}
                  >
                    {saveProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: PDPA Compliance */}
          <TabsContent value="pdpa" className="space-y-6">
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <strong className="text-yellow-900 dark:text-yellow-100">
                  PDPA 2024 Compliance Requirement
                </strong>
                <p className="mt-1 text-yellow-800 dark:text-yellow-200">
                  Malaysian businesses must designate a Data Protection Officer (DPO) by June 1, 2025.
                  This information will be included in privacy notices and data breach notifications.
                </p>
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Data Protection Officer (DPO)</CardTitle>
                <CardDescription>
                  Designate your DPO for PDPA compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={dpoForm.handleSubmit((data) =>
                    saveDpoMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="dpo_name">Data Protection Officer Name</Label>
                    <Input
                      id="dpo_name"
                      {...dpoForm.register("dpo_name")}
                      placeholder="e.g., Dr. Ahmad bin Abdullah"
                      disabled={!isAdmin}
                    />
                    {dpoForm.formState.errors.dpo_name && (
                      <p className="text-sm text-destructive">
                        {dpoForm.formState.errors.dpo_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dpo_email">DPO Email Address</Label>
                    <Input
                      id="dpo_email"
                      type="email"
                      {...dpoForm.register("dpo_email")}
                      placeholder="e.g., dpo@clinic.com"
                      disabled={!isAdmin}
                    />
                    {dpoForm.formState.errors.dpo_email && (
                      <p className="text-sm text-destructive">
                        {dpoForm.formState.errors.dpo_email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dpo_phone">DPO Phone Number</Label>
                    <PhoneInput
                      id="dpo_phone"
                      value={dpoForm.watch("dpo_phone")}
                      onChange={(value) => dpoForm.setValue("dpo_phone", value)}
                      disabled={!isAdmin}
                    />
                    {dpoForm.formState.errors.dpo_phone && (
                      <p className="text-sm text-destructive">
                        {dpoForm.formState.errors.dpo_phone.message}
                      </p>
                    )}
                  </div>

                  {!isAdmin && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Only administrators can edit DPO information
                      </AlertDescription>
                    </Alert>
                  )}

                  {isAdmin && (
                    <Button
                      type="submit"
                      disabled={saveDpoMutation.isPending}
                    >
                      {saveDpoMutation.isPending ? "Saving..." : "Save DPO Information"}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Retention Policy</CardTitle>
                <CardDescription>
                  Automatic data deletion settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">7 Years Retention Period</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Patient data will be automatically deleted after 7 years (PDPA requirement)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Right to be Forgotten</CardTitle>
                <CardDescription>
                  Patient data deletion requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Patients can request data deletion under PDPA. Contact support to process deletion requests.
                </p>
                <Button variant="outline" asChild>
                  <a href="mailto:support@lamanihub.com">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Contact Support
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: API Access */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Key</CardTitle>
                <CardDescription>
                  Use this key to integrate LamaniHub with your website or automation tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Your API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={
                          showApiKey
                            ? tenantData.api_key || ""
                            : "••••••••••••••••••••••••••••••••"
                        }
                        readOnly
                        className="pr-10 font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyApiKey}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep this key secret. Anyone with this key can create leads in your account.
                  </p>
                </div>

                {isAdmin && (
                  <>
                    <div className="pt-4 border-t">
                      <Button
                        variant="destructive"
                        onClick={() => setRegenerateDialogOpen(true)}
                        disabled={regenerateApiKeyMutation.isPending}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate API Key
                      </Button>
                    </div>

                    <AlertDialog
                      open={regenerateDialogOpen}
                      onOpenChange={setRegenerateDialogOpen}
                    >
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will invalidate your current API key. Any integrations using the old key will stop working. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => regenerateApiKeyMutation.mutate()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Regenerate
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}

                {!isAdmin && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Only administrators can regenerate the API key
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Integration</CardTitle>
                <CardDescription>
                  Connect LamaniHub with your website or automation tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use the API to automatically create leads from your website forms, WordPress, n8n, Zapier, and more.
                </p>

                <div className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
                  <code className="text-xs">
                    curl -X POST {import.meta.env.VITE_SUPABASE_URL}/functions/v1/lead-intake \<br />
                    &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                    &nbsp;&nbsp;-H "x-api-key: YOUR_API_KEY" \<br />
                    &nbsp;&nbsp;-d '{`{`}<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;"name": "Patient Name",<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;"phone": "0123456789",<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;"email": "patient@example.com",<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;"consent": true<br />
                    &nbsp;&nbsp;{`}`}'
                  </code>
                </div>

                <Button variant="outline" asChild>
                  <a
                    href="https://docs.lovable.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View API Documentation
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
