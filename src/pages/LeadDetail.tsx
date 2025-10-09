import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  Pencil,
  Trash,
  Phone,
  Mail,
  User,
  Calendar,
  Check,
  X,
  Shield,
  Plus,
  Eye,
  MessageCircle,
  FileText,
  ExternalLink,
  Loader2,
  Clock,
} from "lucide-react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, type LeadStatus } from "@/components/StatusBadge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CustomFieldsSection } from "@/components/CustomFieldsSection";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneDisplay } from "@/lib/utils/phoneNormalizer";
import { EditLeadModal } from "@/components/EditLeadModal";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: LeadStatus;
  source: string | null;
  consent_given: boolean;
  consent_timestamp: string | null;
  consent_ip: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  modified_by: string | null;
  custom: Record<string, any> | null;
  creator?: { full_name: string };
  modifier?: { full_name: string };
}

interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  details: Record<string, any> | null;
  profiles?: { full_name: string };
}

// Valid lead statuses - must match your database enum
const VALID_LEAD_STATUSES = [
  'new_inquiry',
  'contacted',
  'qualified',
  'converted',
  'lost'
] as const;

const actionIcons: Record<string, any> = {
  lead_create: Plus,
  lead_update: Pencil,
  lead_delete: Trash,
  lead_view: Eye,
  lead_contact: MessageCircle,
};

const actionLabels: Record<string, string> = {
  lead_create: "created this lead",
  lead_update: "updated this lead",
  lead_delete: "deleted this lead",
  lead_view: "viewed this lead",
  lead_contact: "contacted via WhatsApp",
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  // Fetch custom field definitions
  const { data: propertyDefinitions = [] } = useQuery({
    queryKey: ["property-definitions", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_definitions")
        .select("*")
        .eq("entity", "lead")
        .eq("show_in_form", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.tenant_id,
  });

  // Fetch lead details (real-time data - no caching)
  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id!)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Lead not found");

      // Fetch creator and modifier separately
      let creator = null;
      let modifier = null;

      if (data.created_by) {
        const { data: creatorData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", data.created_by)
          .single();
        creator = creatorData;
      }

      if (data.modified_by) {
        const { data: modifierData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", data.modified_by)
          .single();
        modifier = modifierData;
      }

      return { ...data, creator, modifier } as Lead;
    },
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
  });

  // Fetch audit logs (real-time data - no caching)
  const { data: auditLogs } = useQuery({
    queryKey: ["audit", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .eq("resource_id", id!)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const logsWithProfiles = await Promise.all(
        (data || []).map(async (log) => {
          if (log.user_id) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", log.user_id)
              .single();
            return { ...log, profiles: profileData };
          }
          return { ...log, profiles: null };
        })
      );

      return logsWithProfiles as AuditLog[];
    },
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("leads").delete().eq("id", id!);

      if (error) throw error;

      // Log audit entry
      if (profile?.tenant_id) {
        await supabase.from("audit_log").insert({
          tenant_id: profile.tenant_id,
          user_id: user?.id,
          action: "lead_delete",
          resource_id: id!,
          details: {
            name: lead?.name,
            phone: lead?.phone,
            email: lead?.email,
          },
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Lead deleted",
        description: "The lead has been successfully deleted.",
      });
      navigate("/leads");
    },
    onError: (error: any) => {
      console.error('[LeadDetail] Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Status change mutation with improved error handling
  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      // Validate status before sending to database
      if (!VALID_LEAD_STATUSES.includes(newStatus as any)) {
        throw new Error(`Invalid status: ${newStatus}`);
      }

      const oldStatus = lead?.status;
      console.log(`[LeadDetail] Updating status from ${oldStatus} to ${newStatus}`);

      // Update with proper error handling and return updated data
      const { data, error } = await supabase
        .from("leads")
        .update({
          status: newStatus as LeadStatus,
          modified_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id!)
        .select()
        .single();

      if (error) {
        console.error('[LeadDetail] Status update error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No rows updated - check if lead exists and you have permission');
      }

      console.log('[LeadDetail] Status updated successfully:', data);

      // Log audit entry
      if (profile?.tenant_id) {
        const { error: auditError } = await supabase.from("audit_log").insert({
          tenant_id: profile.tenant_id,
          user_id: user?.id,
          action: "lead_update",
          resource_id: id!,
          details: {
            field: "status",
            old_value: oldStatus,
            new_value: newStatus,
          },
        });

        if (auditError) {
          console.warn('[LeadDetail] Audit log error:', auditError);
          // Don't throw here - status update succeeded
        }
      }

      return data;
    },
    onMutate: async (newStatus) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["lead", id] });
      
      const previousLead = queryClient.getQueryData(["lead", id]);
      
      queryClient.setQueryData(["lead", id], (old: any) => ({
        ...old,
        status: newStatus,
        updated_at: new Date().toISOString(),
        modified_by: user?.id,
      }));

      return { previousLead };
    },
    onSuccess: (data, newStatus) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      queryClient.invalidateQueries({ queryKey: ["audit", id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      
      toast({
        title: "Status updated",
        description: `Status changed to ${newStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      });
      setStatusChanging(false);
    },
    onError: (error: any, newStatus, context) => {
      // Rollback optimistic update
      if (context?.previousLead) {
        queryClient.setQueryData(["lead", id], context.previousLead);
      }

      console.error('[LeadDetail] Status mutation error:', error);
      
      // Show detailed error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update status. Please try again.';

      toast({
        title: "Error updating status",
        description: errorMessage,
        variant: "destructive",
      });
      setStatusChanging(false);
    },
  });

  const handleStatusChange = (newStatus: string) => {
    setStatusChanging(true);
    statusMutation.mutate(newStatus);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-2xl font-semibold mb-4">Lead not found</h2>
          <p className="text-muted-foreground mb-6">
            The lead you're looking for doesn't exist or has been deleted.
          </p>
          <Button asChild>
            <Link to="/leads">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Leads
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const notes = lead.custom?.notes || "";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link to="/leads">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Leads
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold">{lead.name}</h1>
              <StatusBadge status={lead.status} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setEditModalOpen(true)} className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-2"
            >
              <Trash className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{lead.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-medium">{formatPhoneDisplay(lead.phone)}</p>
                      <WhatsAppButton
                        phone={lead.phone}
                        variant="default"
                        size="sm"
                        message={`Hi ${lead.name}, I'm reaching out from ${
                          tenant?.name || "our clinic"
                        } regarding your inquiry. How can we help you?`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(lead.phone)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${lead.email}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {lead.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Source</p>
                    <Badge variant="secondary" className="mt-1 capitalize">
                      {lead.source || "Manual"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Select
                      value={lead.status}
                      onValueChange={handleStatusChange}
                      disabled={statusChanging || statusMutation.isPending}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="new_inquiry">New Inquiry</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    {(statusChanging || statusMutation.isPending) && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Updating...
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                      {lead.creator && ` by ${lead.creator.full_name}`}
                    </p>
                    {lead.updated_at !== lead.created_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last updated{" "}
                        {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}
                        {lead.modifier && ` by ${lead.modifier.full_name}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Fields Section */}
        <CustomFieldsSection
          leadId={id!}
          customFields={lead.custom}
          propertyDefinitions={propertyDefinitions}
        />

        {/* PDPA Consent Information */}
        <Card>
          <CardHeader>
            <CardTitle>Data Protection Compliance</CardTitle>
            <CardDescription>PDPA consent information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {lead.consent_given ? (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-600">Consent obtained</span>
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-destructive" />
                  <span className="font-medium text-destructive">Consent not confirmed</span>
                </>
              )}
            </div>

            {lead.consent_given && lead.consent_timestamp && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Timestamp:</span>
                  <span className="font-medium">
                    {format(new Date(lead.consent_timestamp), "dd MMM yyyy 'at' HH:mm")}
                  </span>
                </div>
                {lead.consent_ip && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground ml-6">IP Address:</span>
                    <span className="font-mono text-xs">{lead.consent_ip}</span>
                  </div>
                )}
              </div>
            )}

            <Separator />

            <Link
              to="/privacy"
              target="_blank"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              View Privacy Policy
              <ExternalLink className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {notes ? (
              <p className="text-sm whitespace-pre-wrap">{notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No notes added yet</p>
            )}
          </CardContent>
        </Card>

        {/* Audit Trail */}
        {auditLogs && auditLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>Timeline of all actions performed on this lead</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.map((log) => {
                  const ActionIcon = actionIcons[log.action] || FileText;
                  const actionLabel = actionLabels[log.action] || log.action;
                  const userName = log.profiles?.full_name || "Someone";

                  return (
                    <div key={log.id} className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <ActionIcon className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">{userName}</span> {actionLabel}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <details className="text-xs text-muted-foreground">
                            <summary className="cursor-pointer hover:text-foreground">
                              View details
                            </summary>
                            <pre className="mt-2 rounded bg-muted p-2 text-xs overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      <EditLeadModal
        lead={lead}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["lead", id] });
          queryClient.invalidateQueries({ queryKey: ["audit", id] });
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{lead.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
