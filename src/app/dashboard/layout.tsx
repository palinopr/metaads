import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { DateRangeProvider } from "@/contexts/date-range-context"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  return (
    <DateRangeProvider>
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <div className="flex flex-1">
          <DashboardSidebar />
          {/* Main content */}
          <div className="flex-1 bg-background">
            <main>{children}</main>
          </div>
        </div>
      </div>
    </DateRangeProvider>
  )
}