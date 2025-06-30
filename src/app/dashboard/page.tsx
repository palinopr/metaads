import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Welcome back!</CardTitle>
            <CardDescription>
              {session.user?.email || "User"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>You're successfully logged in with Facebook.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>
              Manage your ad campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>No campaigns yet.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>
              View your performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Analytics coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}