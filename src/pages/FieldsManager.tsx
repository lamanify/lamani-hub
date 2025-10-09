import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Pencil,
  Archive,
  Database,
  FileText,
  Hash,
  ToggleLeft,
  Calendar,
  Mail,
  Phone,
  Link as LinkIcon,
  ArrowUpDown,
  ArrowLeft,
} from "lucide-react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EditPropertyDrawer } from "@/components/EditPropertyDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

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
  usage_count: number;
  last_seen_at: string | null;
  options: any;
  created_at: string;
  updated_at: string;
}

const dataTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  string: { label: "Text", icon: FileText, color: "bg-gray-100 text-gray-700" },
  number: { label: "Number", icon: Hash, color: "bg-blue-100 text-blue-700" },
  boolean: { label: "Yes/No", icon: ToggleLeft, color: "bg-green-100 text-green-700" },
  date: { label: "Date", icon: Calendar, color: "bg-purple-100 text-purple-700" },
  email: { label: "Email", icon: Mail, color: "bg-orange-100 text-orange-700" },
  phone: { label: "Phone", icon: Phone, color: "bg-teal-100 text-teal-700" },
  url: { label: "URL", icon: LinkIcon, color: "bg-indigo-100 text-indigo-700" },
};

export default function FieldsManager() {
  const { profile, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("sort_order");
  const [editingProperty, setEditingProperty] = useState<PropertyDefinition | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [propertyToArchive, setPropertyToArchive] = useState<PropertyDefinition | null>(null);

  const isAdmin = role === "clinic_admin" || role === "super_admin";

  // Fetch properties (real-time data - no caching)
  const { data: properties, isLoading } = useQuery({
    queryKey: ["properties", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_definitions")
        .select("*")
        .eq("entity", "lead")
        .order(sortBy as any, { ascending: sortBy === "label" });

      if (error) throw error;
      return data as PropertyDefinition[];
    },
    enabled: !!profile?.tenant_id,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
  });

  // Toggle mutations
  const toggleMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await supabase
        .from("property_definitions")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast({ title: "Field updated" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update field",
        variant: "destructive",
      });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("property_definitions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast({ title: "Field archived" });
      setArchiveDialogOpen(false);
      setPropertyToArchive(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to archive field",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (id: string, field: string, value: boolean) => {
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only admins can edit fields",
        variant: "destructive",
      });
      return;
    }
    toggleMutation.mutate({ id, field, value });
  };

  const handleArchive = () => {
    if (propertyToArchive) {
      archiveMutation.mutate(propertyToArchive.id);
    }
  };

  const filteredProperties = properties?.filter((prop) => {
    const matchesSearch = prop.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || prop.data_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
          <p className="text-muted-foreground">
            Only clinic administrators can manage custom fields.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            to="/settings"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Settings
          </Link>
          <h1 className="text-3xl font-semibold">Custom Fields</h1>
          <p className="text-muted-foreground mt-2">
            Manage fields that appear on your leads. Fields are auto-created when webhooks send new data.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="string">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Yes/No</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="url">URL</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="sort_order">Custom Order</SelectItem>
                <SelectItem value="label">Name A-Z</SelectItem>
                <SelectItem value="usage_count">Most Used</SelectItem>
                <SelectItem value="created_at">Recently Added</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredProperties && filteredProperties.length > 0 ? (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead className="text-center">Show in List</TableHead>
                    <TableHead className="text-center">Required</TableHead>
                    <TableHead className="text-center">Sensitive</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((property) => {
                    const typeConfig = dataTypeConfig[property.data_type];
                    const Icon = typeConfig?.icon || FileText;

                    return (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{property.label}</p>
                            <p className="text-sm text-muted-foreground">{property.key}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${typeConfig?.color} border-0`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {typeConfig?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {property.usage_count || 0} leads
                          </span>
                        </TableCell>
                        <TableCell>
                          {property.last_seen_at ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <span className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(property.last_seen_at), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {new Date(property.last_seen_at).toLocaleString()}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-sm text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={property.show_in_list}
                            onCheckedChange={(checked) =>
                              handleToggle(property.id, "show_in_list", checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={property.is_required}
                            onCheckedChange={(checked) =>
                              handleToggle(property.id, "is_required", checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={property.is_sensitive}
                            onCheckedChange={(checked) =>
                              handleToggle(property.id, "is_sensitive", checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingProperty(property)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPropertyToArchive(property);
                                setArchiveDialogOpen(true);
                              }}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4 p-4">
              {filteredProperties.map((property) => {
                const typeConfig = dataTypeConfig[property.data_type];
                const Icon = typeConfig?.icon || FileText;

                return (
                  <Card key={property.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{property.label}</CardTitle>
                          <CardDescription className="text-xs">{property.key}</CardDescription>
                        </div>
                        <Badge variant="outline" className={`${typeConfig?.color} border-0`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {typeConfig?.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Usage:</span>
                        <span>{property.usage_count || 0} leads</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Seen:</span>
                        <span>
                          {property.last_seen_at
                            ? formatDistanceToNow(new Date(property.last_seen_at), {
                                addSuffix: true,
                              })
                            : "Never"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm">Show in List</span>
                        <Switch
                          checked={property.show_in_list}
                          onCheckedChange={(checked) =>
                            handleToggle(property.id, "show_in_list", checked)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Required</span>
                        <Switch
                          checked={property.is_required}
                          onCheckedChange={(checked) =>
                            handleToggle(property.id, "is_required", checked)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sensitive</span>
                        <Switch
                          checked={property.is_sensitive}
                          onCheckedChange={(checked) =>
                            handleToggle(property.id, "is_sensitive", checked)
                          }
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setEditingProperty(property)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPropertyToArchive(property);
                            setArchiveDialogOpen(true);
                          }}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Database className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No custom fields yet</h2>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Custom fields will appear here when you receive webhooks or imports with new data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Drawer */}
      <EditPropertyDrawer
        property={editingProperty}
        open={!!editingProperty}
        onOpenChange={(open) => !open && setEditingProperty(null)}
        onSuccess={() => {
          setEditingProperty(null);
          queryClient.invalidateQueries({ queryKey: ["properties"] });
        }}
      />

      {/* Archive Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive field?</AlertDialogTitle>
            <AlertDialogDescription>
              This field will be hidden but data is preserved. You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
