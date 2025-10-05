import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { normalizePhone, isValidMalaysianPhone } from "@/lib/utils/phoneNormalizer";

const leadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().refine(isValidMalaysianPhone, "Invalid Malaysian phone number"),
  email: z.string().email("Invalid email address"),
  source: z.string().min(1, "Please select a source"),
  status: z.string().min(1, "Please select a status"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string | null;
  status: string;
  custom: Record<string, any> | null;
}

interface EditLeadModalProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditLeadModal({ lead, open, onOpenChange, onSuccess }: EditLeadModalProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    values: {
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      source: lead.source || "manual",
      status: lead.status,
      notes: lead.custom?.notes || "",
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (values: LeadFormValues) => {
      if (!profile?.tenant_id) {
        throw new Error("Tenant information not found");
      }

      // Normalize phone number
      const normalizedPhone = normalizePhone(values.phone);

      // Check for duplicates (excluding current lead)
      const { data: existingLeads } = await supabase
        .from("leads")
        .select("id")
        .eq("tenant_id", profile.tenant_id)
        .neq("id", lead.id)
        .or(`phone.eq.${normalizedPhone},email.eq.${values.email}`);

      if (existingLeads && existingLeads.length > 0) {
        throw new Error("A lead with this phone number or email already exists");
      }

      // Detect changes for audit log
      const changes: Record<string, { old: any; new: any }> = {};
      if (lead.name !== values.name) changes.name = { old: lead.name, new: values.name };
      if (lead.phone !== normalizedPhone)
        changes.phone = { old: lead.phone, new: normalizedPhone };
      if (lead.email !== values.email) changes.email = { old: lead.email, new: values.email };
      if (lead.source !== values.source)
        changes.source = { old: lead.source, new: values.source };
      if (lead.status !== values.status)
        changes.status = { old: lead.status, new: values.status };
      if ((lead.custom?.notes || "") !== values.notes)
        changes.notes = { old: lead.custom?.notes, new: values.notes };

      // Update lead
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          name: values.name,
          phone: normalizedPhone,
          email: values.email,
          source: values.source,
          status: values.status as any,
          modified_by: user?.id,
          updated_at: new Date().toISOString(),
          custom: values.notes ? { notes: values.notes } : {},
        })
        .eq("id", lead.id);

      if (updateError) throw updateError;

      // Log audit entry if there are changes
      if (Object.keys(changes).length > 0) {
        await supabase.from("audit_log").insert({
          tenant_id: profile.tenant_id,
          user_id: user?.id,
          action: "lead_update",
          resource_id: lead.id,
          details: { changes },
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Lead updated",
        description: "The lead has been successfully updated.",
      });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description:
          error.message || "Unable to update lead. Please check your connection and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: LeadFormValues) => {
    updateLeadMutation.mutate(values);
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing while submitting
    if (updateLeadMutation.isPending) return;
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
          <DialogDescription>Update the lead information</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Ahmad bin Abdullah"
                      {...field}
                      disabled={updateLeadMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Field */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="e.g., 012-345 6789"
                      {...field}
                      disabled={updateLeadMutation.isPending}
                      onBlur={(e) => {
                        try {
                          const normalized = normalizePhone(e.target.value);
                          form.setValue("phone", normalized);
                        } catch {
                          // Let validation handle the error
                        }
                        field.onBlur();
                      }}
                    />
                  </FormControl>
                  <FormDescription>Will be normalized to +60 format</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="e.g., patient@example.com"
                      {...field}
                      disabled={updateLeadMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Source Field */}
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How did they find you? *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={updateLeadMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="walk-in">Walk-in</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="social-media">Social Media</SelectItem>
                      <SelectItem value="google-search">Google Search</SelectItem>
                      <SelectItem value="advertisement">Advertisement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Field */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={updateLeadMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="new_inquiry">New Inquiry</SelectItem>
                      <SelectItem value="contact_attempted">Contact Attempted</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="appointment_scheduled">Appointment Scheduled</SelectItem>
                      <SelectItem value="consultation_complete">Consultation Complete</SelectItem>
                      <SelectItem value="treatment_in_progress">Treatment In Progress</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="disqualified">Disqualified</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any relevant information about this inquiry..."
                      rows={3}
                      maxLength={500}
                      {...field}
                      disabled={updateLeadMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>{field.value?.length || 0}/500 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer Buttons */}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={updateLeadMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateLeadMutation.isPending || !form.formState.isValid}
                className="gap-2"
              >
                {updateLeadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
