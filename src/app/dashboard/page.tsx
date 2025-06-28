import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard-header";
import { CampaignsList } from "@/components/campaigns-list";
import { MetricsOverview } from "@/components/metrics-overview";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      
      <main className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricsOverview />
        </div>
        
        <div className="grid gap-4 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>
                Manage and monitor your Meta advertising campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CampaignsList />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}