import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

const propertySchema = z.object({
  label: z.string().min(1, "Label is required"),
  data_type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  show_in_list: z.boolean(),
  show_in_form: z.boolean(),
  is_required: z.boolean(),
  is_sensitive: z.boolean(),
  sort_order: z.number().min(0),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

interface PropertyDefinition {
  id: string;
  key: string;
  label: string;
  data_type: string;
  description: string | null;
  show_in_list: boolean;
  show_in_form: boolean;
  is_required: boolean;
  is_sensitive: boolean;
  sort_order: number;
}

interface EditPropertyDrawerProps {
  property: PropertyDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditPropertyDrawer({
  property,
  open,
  onOpenChange,
  onSuccess,
}: EditPropertyDrawerProps) {
  const { toast } = useToast();

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    values: property
      ? {
          label: property.label,
          data_type: property.data_type,
          description: property.description || "",
          show_in_list: property.show_in_list,
          show_in_form: property.show_in_form,
          is_required: property.is_required,
          is_sensitive: property.is_sensitive,
          sort_order: property.sort_order,
        }
      : undefined,
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async (values: PropertyFormValues) => {
      if (!property) return;

      const { error } = await supabase
        .from("property_definitions")
        .update({
          label: values.label,
          data_type: values.data_type,
          description: values.description || null,
          show_in_list: values.show_in_list,
          show_in_form: values.show_in_form,
          is_required: values.is_required,
          is_sensitive: values.is_sensitive,
          sort_order: values.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", property.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Field updated",
        description: "The field has been successfully updated.",
      });
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update field. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: PropertyFormValues) => {
    updatePropertyMutation.mutate(values);
  };

  if (!property) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Field</SheetTitle>
          <SheetDescription>Update field properties and visibility settings</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-6">
            {/* Label */}
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label *</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={updatePropertyMutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Key (read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Key</label>
              <Input value={property.key} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Internal identifier (cannot be changed)
              </p>
            </div>

            {/* Type */}
            <FormField
              control={form.control}
              name="data_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={updatePropertyMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="string">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Yes/No</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Help text for this field..."
                      rows={3}
                      disabled={updatePropertyMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description shown when editing leads
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sort Order */}
            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      disabled={updatePropertyMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Lower numbers appear first in lists and forms
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Visibility Toggles */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">Visibility Settings</h3>

              <FormField
                control={form.control}
                name="show_in_list"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Show in List</FormLabel>
                      <FormDescription>Display in leads table</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={updatePropertyMutation.isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="show_in_form"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Show in Form</FormLabel>
                      <FormDescription>Display when creating/editing leads</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={updatePropertyMutation.isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_required"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Required</FormLabel>
                      <FormDescription>Make this field mandatory</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={updatePropertyMutation.isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_sensitive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4 border-orange-200 bg-orange-50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Sensitive (PDPA)</FormLabel>
                      <FormDescription className="text-xs">
                        Mark as sensitive for data protection compliance
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={updatePropertyMutation.isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updatePropertyMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatePropertyMutation.isPending}>
                {updatePropertyMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
