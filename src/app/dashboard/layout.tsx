import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserProfile } from "@/components/user-profile"
import { 
  LayoutDashboard, 
  Megaphone, 
  Link2, 
  BarChart3,
  Settings
} from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Connections", href: "/dashboard/connections", icon: Link2 },
    { name: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, disabled: true },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, disabled: true },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-background border-r">
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h2 className="text-lg font-semibold">MetaAds</h2>
          </div>
          
          <nav className="flex-1 px-4 pb-4">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.disabled ? "#" : item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md
                      ${item.disabled 
                        ? "text-muted-foreground cursor-not-allowed opacity-50" 
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      }
                    `}
                    onClick={item.disabled ? (e) => e.preventDefault() : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t">
            <UserProfile />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <main>{children}</main>
      </div>
    </div>
  )
}