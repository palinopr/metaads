import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserProfile } from "@/components/user-profile"
import { BarChart3, MousePointer, Eye, ArrowRight } from "lucide-react"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/dashboard/campaigns">
            View Campaigns
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {session.user?.name || "User"}!</CardTitle>
              <CardDescription>
                Here's an overview of your Facebook Ads performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Active Campaigns</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Total Impressions</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <MousePointer className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Total Clicks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Get started with your Facebook advertising
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/campaigns">Create Campaign</Link>
              </Button>
              <Button variant="outline" disabled>
                View Analytics
              </Button>
              <Button variant="outline" disabled>
                Manage Audiences
              </Button>
              <Button variant="outline" disabled>
                Account Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <UserProfile />
        </div>
      </div>
    </div>
  )
}