"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { ModeToggle } from "@/components/mode-toggle"
import { MobileNavigation } from "@/components/mobile-navigation"
import { MountainIcon, LayoutDashboard, Info, FileText, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
// import { motion } from "framer-motion"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Reports", href: "/reports", icon: FileText },
  { title: "Analytics", href: "/pattern-analysis", icon: TrendingUp },
  { title: "About", href: "/about", icon: Info },
]

export default function Header() {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container-responsive flex h-14 md:h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2 group">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <MountainIcon className="h-6 w-6 md:h-7 md:w-7 text-primary" />
          </motion.div>
          <span className="font-bold text-lg md:text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            MetaPro
          </span>
        </Link>

        {/* Desktop Navigation */}
        {!isMobile && (
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <NavigationMenuItem key={item.href}>
                    <Link href={item.href} legacyBehavior passHref>
                      <NavigationMenuLink
                        className={cn(
                          navigationMenuTriggerStyle(),
                          "transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.title}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )
              })}
            </NavigationMenuList>
          </NavigationMenu>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          <MobileNavigation />
        </div>
      </div>
    </motion.header>
  )
}