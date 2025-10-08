import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Search, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const ACTION_COLORS: Record<string, string> = {
  lead_create: "bg-green-100 text-green-800 border-green-200",
  lead_update: "bg-blue-100 text-blue-800 border-blue-200",
  lead_delete: "bg-red-100 text-red-800 border-red-200",
  lead_view: "bg-gray-100 text-gray-800 border-gray-200",
  lead_export: "bg-orange-100 text-orange-800 border-orange-200",
  leads_import: "bg-purple-100 text-purple-800 border-purple-200",
  login: "bg-blue-100 text-blue-800 border-blue-200",
  logout: "bg-gray-100 text-gray-800 border-gray-200",
  dpo_updated: "bg-indigo-100 text-indigo-800 border-indigo-200",
  api_key_regenerated: "bg-yellow-100 text-yellow-800 border-yellow-200",
  super_admin_view: "bg-pink-100 text-pink-800 border-pink-200",
};

const ACTION_LABELS: Record<string, string> = {
  lead_create: "Lead Created",
  lead_update: "Lead Updated",
  lead_delete: "Lead Deleted",
  lead_view: "Lead Viewed",
  lead_export: "Export",
  leads_import: "Import",
  login: "Login",
  logout: "Logout",
  dpo_updated: "DPO Updated",
  api_key_regenerated: "API Key Regenerated",
  super_admin_view: "Admin View",
};

export default function AuditLog() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("7");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const itemsPerPage = 50;

  // Fetch user's profile to get tenant_id
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("tenant_id, full_name")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch audit logs (real-time data - no caching)
  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit_log", profile?.tenant_id, debouncedSearch, actionFilter, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from("audit_log")
        .select("*")
        .eq("tenant_id", profile?.tenant_id)
        .order("created_at", { ascending: false });

      // Date filter
      if (dateFilter !== "all") {
        const days = parseInt(dateFilter);
        const date = new Date();
        date.setDate(date.getDate() - days);
        query = query.gte("created_at", date.toISOString());
      }

      // Action filter
      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      // Search filter
      if (debouncedSearch) {
        query = query.or(`action.ilike.%${debouncedSearch}%,details::text.ilike.%${debouncedSearch}%`);
      }

      const { data: auditData, error } = await query;
      if (error) throw error;

      // Fetch user profiles for all unique user_ids
      const userIds = [...new Set(auditData?.map(log => log.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        // Map profiles to logs
        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]));
        return auditData?.map(log => ({
          ...log,
          user_name: log.user_id ? profileMap.get(log.user_id) || "Unknown" : "System"
        }));
      }

      return auditData?.map(log => ({ ...log, user_name: "System" }));
    },
    enabled: !!profile?.tenant_id,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  // Get unique actions for filter
  const uniqueActions = Array.from(new Set(logs?.map(log => log.action) || []));

  // Pagination
  const totalPages = Math.ceil((logs?.length || 0) / itemsPerPage);
  const paginatedLogs = logs?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export to CSV
  const handleExport = async () => {
    if (!logs || logs.length === 0) {
      toast.error("No data to export");
      return;
    }

    const csv = [
      ["Timestamp", "User", "Action", "Resource ID", "Details"],
      ...logs.map(log => [
        format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
        log.user_name || "System",
        log.action,
        log.resource_id || "",
        JSON.stringify(log.details || {}),
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Audit log exported successfully");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold">Activity Log</h1>
          <p className="text-muted-foreground mt-2">
            Track all system activities and user actions for PDPA compliance
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Date Range */}
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>

              {/* Action Filter */}
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {ACTION_LABELS[action] || action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Export */}
              <Button onClick={handleExport} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !paginatedLogs || paginatedLogs.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No activity logs found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.created_at), "dd MMM yyyy HH:mm")}
                        </TableCell>
                        <TableCell>{log.user_name || "System"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={ACTION_COLORS[log.action] || ""}
                          >
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {log.resource_id ? log.resource_id.slice(0, 8) + "..." : "-"}
                        </TableCell>
                        <TableCell>
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  View
                                  <ChevronDown className="h-4 w-4 ml-1" />
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-2">
                                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-w-md">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </CollapsibleContent>
                            </Collapsible>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 border-t">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          const pageNum = i + 1;
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setCurrentPage(pageNum)}
                                isActive={currentPage === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
