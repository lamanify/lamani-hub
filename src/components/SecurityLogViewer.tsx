import { useQuery } from "@tanstack/react-query";
import { Shield, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const SECURITY_ACTIONS = [
  "login",
  "logout",
  "password_changed",
  "api_key_regenerated",
  "session_revoked",
  "failed_login",
];

const ACTION_ICONS: Record<string, { icon: any; color: string; label: string }> = {
  login: { icon: Shield, color: "text-green-600", label: "Login" },
  logout: { icon: Shield, color: "text-gray-600", label: "Logout" },
  password_changed: { icon: Shield, color: "text-blue-600", label: "Password Changed" },
  api_key_regenerated: { icon: AlertTriangle, color: "text-yellow-600", label: "API Key Regenerated" },
  session_revoked: { icon: AlertTriangle, color: "text-red-600", label: "Session Revoked" },
  failed_login: { icon: AlertTriangle, color: "text-red-600", label: "Failed Login" },
};

export function SecurityLogViewer() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["security-log"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .eq("user_id", user.id)
        .in("action", SECURITY_ACTIONS)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Security Activity</CardTitle>
        <CardDescription>
          Last 10 security-related events on your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !logs || logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No security events found
          </p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              const action = ACTION_ICONS[log.action] || {
                icon: Shield,
                color: "text-gray-600",
                label: log.action,
              };
              const Icon = action.icon;

              const details = log.details as any;
              
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 rounded-full bg-muted ${action.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{action.label}</span>
                      {details?.ip && (
                        <Badge variant="outline" className="text-xs">
                          {details.ip}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), "dd MMM yyyy HH:mm:ss")}
                    </p>
                    {details?.user_agent && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {details.user_agent}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
