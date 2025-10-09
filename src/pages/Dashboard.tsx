import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Clock, CheckCircle, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useEffect } from "react";

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
};

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
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Show welcome toast after login
  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem('just_logged_in');
    if (justLoggedIn === 'true') {
      sessionStorage.removeItem('just_logged_in');
      toast.success("Welcome back!");
    }
  }, []);

  // Fetch user's profile to get tenant_id
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch leads count (real-time data - no caching)
  const { data: leadsCount } = useQuery({
    queryKey: ["leads_count", profile?.tenant_id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", profile?.tenant_id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!profile?.tenant_id,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
  });

  // Fetch recent audit logs (real-time data - no caching)
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["recent_activity", profile?.tenant_id],
    queryFn: async () => {
      const { data: auditData, error } = await supabase
        .from("audit_log")
        .select("*")
        .eq("tenant_id", profile?.tenant_id)
        .order("created_at", { ascending: false })
        .limit(10);
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
  });

  const stats = [
    {
      title: "Total Leads",
      value: leadsCount?.toString() || "0",
      icon: Users,
      description: "All leads in your system",
    },
    {
      title: "New This Week",
      value: "0",
      icon: TrendingUp,
      description: "Leads added this week",
    },
    {
      title: "Pending Follow-up",
      value: "0",
      icon: Clock,
      description: "Requires attention",
    },
    {
      title: "Converted",
      value: "0",
      icon: CheckCircle,
      description: "Successfully converted",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to your LamaniHub dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold text-foreground">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest actions in your clinic</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/audit-log")}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !recentActivity || recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-4 p-3 border border-border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={ACTION_COLORS[log.action] || ""}
                        >
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          by {log.user_name || "System"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), "dd MMM yyyy, HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Here's what you can do to get started with LamaniHub
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-4 border border-border rounded-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Add Your First Lead</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Start tracking patient leads in the Leads section
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border border-border rounded-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Configure Settings</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Customize your clinic information and preferences
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border border-border rounded-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Invite Team Members</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Collaborate with your clinic staff (Coming soon)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
