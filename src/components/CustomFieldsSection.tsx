import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomFieldCell } from "@/components/CustomFieldCell";
import { Pencil, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomFieldInput } from "@/components/CustomFieldInput";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface PropertyDefinition {
  id: string;
  key: string;
  label: string;
  data_type: string;
  description: string | null;
  is_required: boolean;
  is_sensitive: boolean;
  show_in_form: boolean;
  sort_order: number;
}

interface CustomFieldsSectionProps {
  leadId: string;
  customFields: Record<string, any> | null;
  propertyDefinitions: PropertyDefinition[];
}

export function CustomFieldsSection({
  leadId,
  customFields,
  propertyDefinitions,
}: CustomFieldsSectionProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const visibleFields = propertyDefinitions.filter((f) => f.show_in_form);

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { data: currentLead } = await supabase
        .from("leads")
        .select("custom")
        .eq("id", leadId)
        .single();

      const currentCustom = (currentLead?.custom as Record<string, any>) || {};
      const updatedCustom = {
        ...currentCustom,
        ...updates,
      };

      const { error } = await supabase
        .from("leads")
        .update({
          custom: updatedCustom,
          modified_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", leadId);

      if (error) throw error;

      // Log audit
      if (profile?.tenant_id) {
        await supabase.from("audit_log").insert({
          tenant_id: profile.tenant_id,
          user_id: user?.id,
          action: "lead_update",
          resource_id: leadId,
          details: {
            field: "custom",
            changes: updates,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      toast({
        title: "Custom fields updated",
        description: "Changes saved successfully",
      });
      setEditOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update custom fields",
        variant: "destructive",
      });
    },
  });

  const handleOpenEdit = () => {
    setFieldValues(customFields || {});
    setErrors({});
    setEditOpen(true);
  };

  const handleChange = (key: string, value: any) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateFields = () => {
    const newErrors: Record<string, string> = {};

    for (const field of visibleFields) {
      const value = fieldValues[field.key];

      if (field.is_required && !value) {
        newErrors[field.key] = `${field.label} is required`;
      }

      if (field.data_type === "email" && value) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[field.key] = "Invalid email format";
        }
      }

      if (field.data_type === "url" && value) {
        if (!/^https?:\/\/.+/.test(value)) {
          newErrors[field.key] = "Invalid URL format";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateFields()) return;
    updateMutation.mutate(fieldValues);
  };

  if (visibleFields.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Custom Fields</CardTitle>
            <Button onClick={handleOpenEdit} size="sm" variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {visibleFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No custom fields for this lead</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {visibleFields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    {field.label}
                    {field.is_required && <span className="text-destructive">*</span>}
                    {field.is_sensitive && <Lock className="w-3 h-3 text-orange-500" />}
                  </label>
                  <CustomFieldCell
                    value={customFields?.[field.key]}
                    dataType={field.data_type}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Custom Fields</DialogTitle>
            <DialogDescription>Update custom field values for this lead</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {visibleFields.map((field) => (
              <CustomFieldInput
                key={field.key}
                field={field}
                value={fieldValues[field.key]}
                onChange={handleChange}
                error={errors[field.key]}
              />
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
