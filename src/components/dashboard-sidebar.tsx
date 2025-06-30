"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserProfile } from "@/components/user-profile"
import { 
  LayoutDashboard, 
  Megaphone, 
  Link2, 
  BarChart3,
  Settings
} from "lucide-react"

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Connections", href: "/dashboard/connections", icon: Link2 },
  { name: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, disabled: true },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, disabled: true },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-background border-r">
      <div className="flex flex-col h-full">
        <div className="p-6">
          <h2 className="text-lg font-semibold">MetaAds</h2>
        </div>
        
        <nav className="flex-1 px-4 pb-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.disabled ? "#" : item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${item.disabled 
                        ? "text-muted-foreground cursor-not-allowed opacity-50" 
                        : isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
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
        
        <div className="p-4 border-t">
          <UserProfile />
        </div>
      </div>
    </div>
  )
}