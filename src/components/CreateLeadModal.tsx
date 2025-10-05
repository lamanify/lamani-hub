import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { normalizePhone, isValidMalaysianPhone } from "@/lib/utils/phoneNormalizer";
import { Link } from "react-router-dom";

const leadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().refine(isValidMalaysianPhone, "Invalid Malaysian phone number"),
  email: z.string().email("Invalid email address"),
  source: z.string().min(1, "Please select a source"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
  consentConfirmed: z.boolean().refine((val) => val === true, "Consent confirmation is required for PDPA compliance"),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface CreateLeadModalProps {
  trigger?: React.ReactNode;
}

export function CreateLeadModal({ trigger }: CreateLeadModalProps) {
  const [open, setOpen] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      source: "manual",
      notes: "",
      consentConfirmed: false,
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (values: LeadFormValues) => {
      if (!profile?.tenant_id) {
        throw new Error("Tenant information not found");
      }

      // Normalize phone number
      const normalizedPhone = normalizePhone(values.phone);

      // Check for duplicates
      const { data: existingLeads } = await supabase
        .from("leads")
        .select("id, name, phone, email")
        .eq("tenant_id", profile.tenant_id)
        .or(`phone.eq.${normalizedPhone},email.eq.${values.email}`);

      if (existingLeads && existingLeads.length > 0) {
        throw new Error("A lead with this phone number or email already exists");
      }

      // Get user IP (placeholder for now)
      const consentIp = "unknown"; // In production, get from request headers

      // Insert lead
      const { data: lead, error: insertError } = await supabase
        .from("leads")
        .insert({
          tenant_id: profile.tenant_id,
          name: values.name,
          phone: normalizedPhone,
          email: values.email,
          source: values.source,
          status: "new_inquiry",
          consent_given: true,
          consent_timestamp: new Date().toISOString(),
          consent_ip: consentIp,
          created_by: user?.id,
          custom: values.notes ? { notes: values.notes } : {},
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Log audit entry
      await supabase.from("audit_log").insert({
        tenant_id: profile.tenant_id,
        user_id: user?.id,
        action: "lead_create",
        resource_id: lead.id,
        details: {
          name: lead.name,
          source: lead.source,
          method: "manual",
        },
      });

      return lead;
    },
    onSuccess: () => {
      // Invalidate and refetch leads query
      queryClient.invalidateQueries({ queryKey: ["leads"] });

      // Show success toast
      toast({
        title: "Lead created",
        description: "The lead has been successfully added to your clinic.",
      });

      // Reset form and close modal
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Unable to create lead. Please check your connection and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: LeadFormValues) => {
    createLeadMutation.mutate(values);
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing while submitting
    if (createLeadMutation.isPending) return;
    
    setOpen(newOpen);
    
    // Reset form when closing
    if (!newOpen) {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Create a new patient inquiry for your clinic
          </DialogDescription>
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
                      disabled={createLeadMutation.isPending}
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
                      disabled={createLeadMutation.isPending}
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
                  <FormDescription>
                    Will be normalized to +60 format
                  </FormDescription>
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
                      disabled={createLeadMutation.isPending}
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
                    defaultValue={field.value}
                    disabled={createLeadMutation.isPending}
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
                      disabled={createLeadMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Consent Checkbox */}
            <FormField
              control={form.control}
              name="consentConfirmed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/50">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={createLeadMutation.isPending}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal cursor-pointer">
                      I confirm that consent was obtained from this patient to store and
                      process their personal data.
                    </FormLabel>
                    <FormDescription>
                      <Link
                        to="/privacy"
                        target="_blank"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        View Privacy Policy
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Footer Buttons */}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={createLeadMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLeadMutation.isPending || !form.formState.isValid}
                className="gap-2"
              >
                {createLeadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Lead
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
