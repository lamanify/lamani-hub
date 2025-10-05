import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Clock, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Total Leads",
      value: "0",
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
