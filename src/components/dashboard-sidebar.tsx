"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { 
  Home,
  BarChart3,
  Megaphone,
  Users,
  FileText,
  DollarSign,
  Settings,
  HelpCircle,
  Shield
} from "lucide-react"

const navigation = [
  { 
    name: "Ads Manager",
    items: [
      { name: "Overview", href: "/dashboard", icon: Home },
      { name: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
      { name: "Ad Sets", href: "/dashboard/adsets", icon: FileText, disabled: true },
      { name: "Ads", href: "/dashboard/ads", icon: FileText, disabled: true },
    ]
  },
  {
    name: "Analyze",
    items: [
      { name: "Reporting", href: "/dashboard/reporting", icon: BarChart3, disabled: true },
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, disabled: true },
    ]
  },
  {
    name: "Assets",
    items: [
      { name: "Audiences", href: "/dashboard/audiences", icon: Users, disabled: true },
      { name: "Images", href: "/dashboard/images", icon: FileText, disabled: true },
    ]
  },
  {
    name: "Settings",
    items: [
      { name: "Billing", href: "/dashboard/billing", icon: DollarSign, disabled: true },
      { name: "Business Settings", href: "/dashboard/settings", icon: Settings, disabled: true },
      { name: "API Debug", href: "/dashboard/debug", icon: Settings },
      { name: "Help Center", href: "/dashboard/help", icon: HelpCircle, disabled: true },
    ]
  }
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  
  // Check if user is admin
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || ["jaime@outletmedia.net"]
  const isAdmin = session?.user?.email && adminEmails.includes(session.user.email)

  return (
    <div className="w-56 bg-card border-r h-full overflow-y-auto">
      <div className="py-3">
        {navigation.map((group) => (
          <div key={group.name} className="mb-6">
            <h3 className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {group.name}
            </h3>
            <nav className="px-3">
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== "/dashboard" && pathname.startsWith(item.href))
                  
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.disabled ? "#" : item.href}
                        className={`
                          sidebar-item
                          ${item.disabled 
                            ? "text-muted-foreground/50 cursor-not-allowed" 
                            : isActive
                              ? "active"
                              : ""
                          }
                        `}
                        onClick={item.disabled ? (e) => e.preventDefault() : undefined}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>
        ))}
        
        {/* Admin Section - Only visible to admins */}
        {isAdmin && (
          <div className="mb-6 border-t pt-6">
            <h3 className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Administration
            </h3>
            <nav className="px-3">
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/dashboard/admin/agent-settings"
                    className={`
                      sidebar-item
                      ${pathname.startsWith("/dashboard/admin") ? "active" : ""}
                    `}
                  >
                    <Shield className="h-4 w-4" />
                    Admin Panel
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}