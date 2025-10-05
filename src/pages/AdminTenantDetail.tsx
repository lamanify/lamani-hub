import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Calendar,
  CreditCard,
} from "lucide-react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { StatusBadge } from "@/components/StatusBadge";
import { formatPhone } from "@/lib/formatPhone";

interface Tenant {
  id: string;
  name: string;
  subscription_status: string;
  created_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_current_period_end: string | null;
  dpo_name: string | null;
  dpo_email: string | null;
  dpo_phone: string | null;
  api_key: string | null;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  details: any;
  user_id: string;
  profiles: {
    full_name: string;
  } | null;
}

export default function AdminTenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showApiKey, setShowApiKey] = useState(false);

  // Fetch tenant details
  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ["admin-tenant", id],
    queryFn: async () => {
      if (!id) throw new Error("No tenant ID");
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Tenant;
    },
    enabled: !!id,
  });

  // Fetch tenant leads (read-only)
  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ["admin-tenant-leads", id],
    queryFn: async () => {
      if (!id) throw new Error("No tenant ID");
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, phone, email, status, created_at")
        .eq("tenant_id", id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!id,
  });

  // Fetch audit log
  const { data: auditLog, isLoading: auditLoading } = useQuery({
    queryKey: ["admin-tenant-audit", id],
    queryFn: async () => {
      if (!id) throw new Error("No tenant ID");
      const { data, error } = await supabase
        .from("audit_log")
        .select(`
          id,
          action,
          created_at,
          details,
          user_id
        `)
        .eq("tenant_id", id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch user names separately
      const auditWithProfiles = await Promise.all(
        (data || []).map(async (entry) => {
          if (!entry.user_id) {
            return { ...entry, profiles: null };
          }
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", entry.user_id)
            .single();

          return {
            ...entry,
            profiles: profile,
          };
        })
      );

      return auditWithProfiles as AuditLog[];
    },
    enabled: !!id,
  });

  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case "trial":
        return <Badge className="bg-blue-500">Trial</Badge>;
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "past_due":
        return <Badge className="bg-orange-500">Past Due</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCopyApiKey = () => {
    if (tenant?.api_key) {
      navigator.clipboard.writeText(tenant.api_key);
      toast.success("API key copied to clipboard");
    }
  };

  const handleCopyStripeId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Stripe ID copied to clipboard");
  };

  const handleViewInStripe = (stripeCustomerId: string) => {
    const isTestMode = stripeCustomerId.startsWith("cus_test");
    const stripeUrl = `https://dashboard.stripe.com${
      isTestMode ? "/test" : ""
    }/customers/${stripeCustomerId}`;
    window.open(stripeUrl, "_blank");
  };

  if (tenantLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!tenant) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Tenant Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The tenant you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/admin")}>Back to Admin Portal</Button>
        </div>
      </DashboardLayout>
    );
  }

  const hasDpo = tenant.dpo_name && tenant.dpo_email && tenant.dpo_phone;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Portal
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold">{tenant.name}</h1>
            {getSubscriptionBadge(tenant.subscription_status)}
          </div>
          <p className="text-muted-foreground">
            Tenant ID: {tenant.id}
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subscription Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Information
              </CardTitle>
              <CardDescription>Billing and subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">
                  {getSubscriptionBadge(tenant.subscription_status)}
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {format(new Date(tenant.created_at), "PPP")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(tenant.created_at), { addSuffix: true })}
                </p>
              </div>

              {tenant.subscription_current_period_end && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current Period Ends
                    </p>
                    <p className="font-medium">
                      {format(new Date(tenant.subscription_current_period_end), "PPP")}
                    </p>
                  </div>
                </>
              )}

              {tenant.stripe_customer_id && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Stripe Customer ID
                    </p>
                    <div className="flex gap-2">
                      <code className="flex-1 px-3 py-2 bg-muted rounded text-xs font-mono">
                        {tenant.stripe_customer_id}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyStripeId(tenant.stripe_customer_id!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {tenant.stripe_subscription_id && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Stripe Subscription ID
                    </p>
                    <div className="flex gap-2">
                      <code className="flex-1 px-3 py-2 bg-muted rounded text-xs font-mono">
                        {tenant.stripe_subscription_id}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleCopyStripeId(tenant.stripe_subscription_id!)
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {tenant.stripe_customer_id && (
                <>
                  <Separator />
                  <Button
                    variant="outline"
                    onClick={() => handleViewInStripe(tenant.stripe_customer_id!)}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View in Stripe Dashboard
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* DPO Information */}
          <Card>
            <CardHeader>
              <CardTitle>DPO Information</CardTitle>
              <CardDescription>Data Protection Officer details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasDpo && (
                <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-900 dark:text-orange-100">
                    DPO information not configured
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <p className="text-sm text-muted-foreground">DPO Name</p>
                <p className="font-medium">
                  {tenant.dpo_name || (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">DPO Email</p>
                <p className="font-medium">
                  {tenant.dpo_email || (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">DPO Phone</p>
                <p className="font-medium">
                  {tenant.dpo_phone ? (
                    formatPhone(tenant.dpo_phone)
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </p>
              </div>

              {hasDpo && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">PDPA Compliant</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* API Access */}
          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>API key and integration details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">API Key</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <code className="block px-3 py-2 bg-muted rounded text-xs font-mono break-all">
                      {showApiKey
                        ? tenant.api_key || "Not generated"
                        : "••••••••••••••••••••••••••••••••"}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyApiKey}
                    disabled={!tenant.api_key}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This is sensitive information. Only share with the tenant.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Leads Section */}
        <Card>
          <CardHeader>
            <CardTitle>Leads ({leads?.length || 0})</CardTitle>
            <CardDescription>
              Recent patient inquiries (read-only, showing latest 50)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !leads || leads.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No leads yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatPhone(lead.phone)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {lead.email}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={lead.status as any} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(lead.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Audit Log Section */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Log</CardTitle>
            <CardDescription>
              Recent activity (showing latest 50 events)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {auditLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !auditLog || auditLog.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No audit entries yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {auditLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">
                          {entry.profiles?.full_name || "System"}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {entry.action.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                      {entry.details && Object.keys(entry.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            View details
                          </summary>
                          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(entry.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
