import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash,
  Users,
  Copy,
  MoreVertical,
  FileText,
  Globe,
  Code,
  UserPlus,
  ArrowUpDown,
  Download,
} from "lucide-react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type LeadStatus } from "@/components/StatusBadge";
import { ColumnPicker } from "@/components/ColumnPicker";
import { CustomFieldCell } from "@/components/CustomFieldCell";
import { CreateLeadModal } from "@/components/CreateLeadModal";
import { ImportLeadsModal } from "@/components/ImportLeadsModal";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { LeadCard } from "@/components/LeadCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { formatPhone } from "@/lib/formatPhone";
import { formatDistanceToNow } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: LeadStatus;
  source: string | null;
  created_at: string;
  custom: Record<string, any> | null;
}

interface PropertyDefinition {
  key: string;
  label: string;
  data_type: string;
  sort_order: number;
}

const sourceIcons: Record<string, any> = {
  manual: UserPlus,
  import: FileText,
  webform: Globe,
  api: Code,
};

export default function Leads() {
  const navigate = useNavigate();
  const { user, profile, tenant, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isExporting, setIsExporting] = useState(false);

  // Load selected custom columns from localStorage
  const [selectedCustomColumns, setSelectedCustomColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("leads-custom-columns");
    return saved ? JSON.parse(saved) : [];
  });

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Persist column selection
  useEffect(() => {
    localStorage.setItem("leads-custom-columns", JSON.stringify(selectedCustomColumns));
  }, [selectedCustomColumns]);

  // Fetch property definitions for custom columns
  const { data: propertyDefinitions } = useQuery({
    queryKey: ["property-definitions", tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_definitions")
        .select("key, label, data_type, sort_order")
        .eq("entity", "lead")
        .eq("show_in_list", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as PropertyDefinition[];
    },
    enabled: !!tenant?.id,
  });

  // Fetch leads with filters (real-time data - no caching)
  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads", debouncedSearch, statusFilter, sourceFilter, sortColumn, sortDirection, tenant?.id, role],
    queryFn: async () => {
      let query = supabase.from("leads").select("*").limit(50);

      // Filter by tenant_id for non-super-admins
      if (role !== 'super_admin' && tenant?.id) {
        query = query.eq("tenant_id", tenant.id);
      }

      // Apply sorting
      if (sortColumn.startsWith("custom->")) {
        // Custom field sorting (JSONB)
        const customKey = sortColumn.replace("custom->", "");
        query = query.order(`custom->>${customKey}` as any, { ascending: sortDirection === "asc" });
      } else {
        // Core field sorting
        query = query.order(sortColumn as any, { ascending: sortDirection === "asc" });
      }

      if (debouncedSearch) {
        const searchPattern = `%${debouncedSearch}%`;
        query = query.or(`name.ilike.${searchPattern},phone.ilike.${searchPattern},email.ilike.${searchPattern}`);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      if (sourceFilter !== "all") {
        query = query.eq("source", sourceFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Lead[];
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
  });

  // Delete lead mutation
  const deleteMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", leadId);
      if (error) throw error;

      // Log audit entry
      if (profile?.tenant_id) {
        await supabase.from("audit_log").insert({
          tenant_id: profile.tenant_id,
          user_id: user?.id,
          action: "lead_delete",
          resource_id: leadId,
          details: { lead_name: leadToDelete?.name },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({
        title: "Lead deleted",
        description: "The lead has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (leadToDelete) {
      deleteMutation.mutate(leadToDelete.id);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Phone number copied to clipboard",
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSourceFilter("all");
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to export leads",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke("export-leads", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      // Convert the response data to a Blob
      const csvContent = response.data;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Successfully exported ${leads?.length || 0} leads to CSV`,
      });
    } catch (error) {
      console.error("Export error:", error);

      const errorMessage = error instanceof Error ? error.message : "Failed to export leads. Please try again.";

      toast({
        title: "Export failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const hasFilters = searchTerm || statusFilter !== "all" || sourceFilter !== "all";
  const showEmpty = !isLoading && (!leads || leads.length === 0);

  // Handle column sorting
  const handleSort = (columnKey: string, isCustom: boolean = false) => {
    const newColumn = isCustom ? `custom->${columnKey}` : columnKey;
    if (sortColumn === newColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(newColumn);
      setSortDirection("asc");
    }
  };

  // Core columns (always visible)
  const coreColumns = [
    { key: "name", label: "Name", isCore: true },
    { key: "phone", label: "Phone", isCore: true },
    { key: "email", label: "Email", isCore: true },
    { key: "status", label: "Status", isCore: true },
    { key: "source", label: "Source", isCore: true },
    { key: "created_at", label: "Created", isCore: true },
  ];

  // Custom columns (from property_definitions)
  const customColumns = (propertyDefinitions || []).map((prop) => ({
    key: prop.key,
    label: prop.label,
    isCore: false,
    dataType: prop.data_type,
  }));

  // All available columns for column picker
  const allColumns = [...coreColumns, ...customColumns];

  // Visible custom columns (based on user selection)
  const visibleCustomColumns = customColumns.filter((col) => selectedCustomColumns.includes(col.key));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Leads</h1>
            <p className="text-muted-foreground mt-1">Manage your clinic's patient inquiries</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <ImportLeadsModal />
            <Button
              onClick={handleExport}
              disabled={isExporting || !leads || leads.length === 0}
              variant="outline"
              size="default"
              className="min-h-[44px] flex-1 sm:flex-initial"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export"}
            </Button>
            <CreateLeadModal />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 min-h-[44px]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] min-h-[44px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All Statuses</SelectItem>
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

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-[150px] min-h-[44px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-background">
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="import">Import</SelectItem>
                <SelectItem value="webform">Webform</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden sm:block">
              <ColumnPicker
                columns={allColumns}
                selectedColumns={selectedCustomColumns}
                onColumnsChange={setSelectedCustomColumns}
              />
            </div>
          </div>
        </div>

        {/* Mobile Card View (< md) */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            [...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
          ) : showEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border rounded-lg">
              {hasFilters ? (
                <>
                  <Search className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No leads found</h3>
                  <p className="text-muted-foreground text-center mb-6">Try adjusting your search or filters</p>
                  <Button variant="outline" onClick={clearFilters} className="min-h-[44px]">
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <Users className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No leads yet</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    Get started by adding your first patient inquiry
                  </p>
                  <CreateLeadModal
                    trigger={
                      <Button className="gap-2 min-h-[44px]">
                        <Plus className="h-4 w-4" />
                        Add Your First Lead
                      </Button>
                    }
                  />
                </>
              )}
            </div>
          ) : (
            leads?.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onView={(id) => navigate(`/leads/${id}`)} onDelete={handleDelete} />
            ))
          )}
        </div>

        {/* Desktop Table View (≥ md) - HubSpot-style horizontal scrolling */}
        <div className="hidden md:block border rounded-lg bg-white">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-24" />
                </div>
              ))}
            </div>
          ) : showEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              {hasFilters ? (
                <>
                  <Search className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No leads found</h3>
                  <p className="text-muted-foreground text-center mb-6">Try adjusting your search or filters</p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <Users className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No leads yet</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    Get started by adding your first patient inquiry
                  </p>
                  <CreateLeadModal
                    trigger={
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Your First Lead
                      </Button>
                    }
                  />
                </>
              )}
            </div>
          ) : (
            // 🎯 HubSpot-style horizontal scrolling container
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="min-w-max">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px] sticky left-0 bg-background z-10 border-r">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8 data-[state=open]:bg-accent font-semibold"
                          onClick={() => handleSort("name")}
                        >
                          Name
                          <ArrowUpDown className="ml-2 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="min-w-[160px]">Phone</TableHead>
                      <TableHead className="min-w-[220px]">Email</TableHead>
                      <TableHead className="min-w-[140px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Source</TableHead>

                      {/* Dynamic custom columns - each with proper min width */}
                      {visibleCustomColumns.map((col) => (
                        <TableHead key={col.key} className="min-w-[150px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-3 h-8 data-[state=open]:bg-accent"
                            onClick={() => handleSort(col.key, true)}
                          >
                            {col.label}
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                      ))}

                      <TableHead className="min-w-[140px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8 data-[state=open]:bg-accent"
                          onClick={() => handleSort("created_at")}
                        >
                          Created
                          <ArrowUpDown className="ml-2 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right min-w-[100px] sticky right-0 bg-background z-10 border-l">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads?.map((lead) => {
                      const SourceIcon = sourceIcons[lead.source || "manual"] || UserPlus;
                      return (
                        <TableRow
                          key={lead.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                        >
                          {/* Sticky Name column */}
                          <TableCell className="font-semibold sticky left-0 bg-background z-10 border-r">
                            <div className="truncate pr-2">{lead.name}</div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm whitespace-nowrap">{formatPhone(lead.phone)}</span>
                              <WhatsAppButton phone={lead.phone} variant="icon" size="icon" />
                            </div>
                          </TableCell>

                          <TableCell>
                            {lead.email ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-sm truncate max-w-[200px]">{lead.email}</div>
                                </TooltipTrigger>
                                <TooltipContent>{lead.email}</TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>

                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <StatusBadge status={lead.status} />
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <SourceIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm capitalize whitespace-nowrap">{lead.source || "Manual"}</span>
                            </div>
                          </TableCell>

                          {/* Dynamic custom field columns */}
                          {visibleCustomColumns.map((col) => (
                            <TableCell key={col.key}>
                              <CustomFieldCell value={lead.custom?.[col.key]} dataType={col.dataType} />
                            </TableCell>
                          ))}

                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                  {formatDistanceToNow(new Date(lead.created_at), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{new Date(lead.created_at).toLocaleString()}</TooltipContent>
                            </Tooltip>
                          </TableCell>

                          {/* Sticky Actions column */}
                          <TableCell
                            className="text-right sticky right-0 bg-background z-10 border-l"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(lead)}>
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {leadToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
