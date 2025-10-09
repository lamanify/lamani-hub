import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Monitor, Smartphone, Tablet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { format } from "date-fns";

interface Session {
  id: string;
  user_agent: string;
  ip: string;
  created_at: string;
  last_active: string;
  is_current: boolean;
}

function getDeviceIcon(userAgent: string) {
  if (userAgent.includes("Mobile")) return Smartphone;
  if (userAgent.includes("Tablet")) return Tablet;
  return Monitor;
}

function getDeviceType(userAgent: string): string {
  if (userAgent.includes("Mobile")) return "Mobile";
  if (userAgent.includes("Tablet")) return "Tablet";
  return "Desktop";
}

export function ActiveSessionsManager() {
  const queryClient = useQueryClient();
  const [revokeSessionId, setRevokeSessionId] = useState<string | null>(null);

  // Fetch active sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["active-sessions"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      // Get audit log entries for login events in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .eq("action", "login")
        .eq("user_id", session.user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Map to session objects
      return data?.map((log, index) => {
        const details = log.details as any;
        return {
          id: log.id,
          user_agent: details?.user_agent || "Unknown",
          ip: details?.ip || "Unknown",
          created_at: log.created_at,
          last_active: log.created_at,
          is_current: index === 0, // Most recent is current
        };
      }) || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Revoke session mutation
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      // In a production app, you'd call an edge function to revoke the specific session
      // For now, we'll just log the revocation
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", user?.id)
        .single();
      
      if (user && profile) {
        await supabase.from("audit_log").insert({
          tenant_id: profile.tenant_id,
          user_id: user.id,
          action: "session_revoked",
          resource_id: sessionId,
          details: { timestamp: new Date().toISOString() },
        });
      }

      // If it's the current session, sign out
      const session = sessions?.find(s => s.id === sessionId);
      if (session?.is_current) {
        await supabase.auth.signOut();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-sessions"] });
      toast.success("Session revoked successfully");
      setRevokeSessionId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to revoke session");
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage devices and locations where you're signed in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !sessions || sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No active sessions found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => {
                  const DeviceIcon = getDeviceIcon(session.user_agent);
                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{getDeviceType(session.user_agent)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{session.ip}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(session.last_active), "dd MMM yyyy HH:mm")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {session.is_current ? (
                          <Badge variant="default">Current</Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRevokeSessionId(session.id)}
                          disabled={revokeSessionMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!revokeSessionId}
        onOpenChange={() => setRevokeSessionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign out this device. If it's your current session, you'll be logged out immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeSessionId && revokeSessionMutation.mutate(revokeSessionId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
