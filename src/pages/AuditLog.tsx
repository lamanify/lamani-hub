import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuditLog() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Activity Log</h1>
          <p className="text-muted-foreground mt-2">
            Track all system activities and user actions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Audit Trail</CardTitle>
            <CardDescription>
              View detailed logs of all activities in your clinic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Activity log functionality coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
