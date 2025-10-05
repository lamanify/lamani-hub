import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users } from "lucide-react";

export default function Leads() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Leads</h1>
            <p className="text-muted-foreground mt-2">
              Manage and track your patient leads
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <Users className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No leads yet
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Start tracking your patient leads by adding your first lead. 
              You'll be able to manage follow-ups and track conversions.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Lead
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
