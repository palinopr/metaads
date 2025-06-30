"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home,
  BarChart3,
  Megaphone,
  Users,
  FileText,
  DollarSign,
  Settings,
  HelpCircle
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

  return (
    <div className="w-64 bg-gray-50 border-r h-full overflow-y-auto">
      <div className="py-4">
        {navigation.map((group) => (
          <div key={group.name} className="mb-6">
            <h3 className="px-6 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                          flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors
                          ${item.disabled 
                            ? "text-gray-400 cursor-not-allowed opacity-50" 
                            : isActive
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700 hover:bg-gray-100"
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
      </div>
    </div>
  )
}