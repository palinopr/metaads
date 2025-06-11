"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
// import { motion, AnimatePresence } from "framer-motion"
import {
  Menu,
  X,
  Home,
  BarChart3,
  Settings,
  FileText,
  Activity,
  Users,
  TrendingUp,
  Zap,
  Info,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Reports", href: "/reports", icon: FileText },
  { title: "Pattern Analysis", href: "/pattern-analysis", icon: TrendingUp },
  { title: "Demographics", href: "/demographics", icon: Users },
  { title: "Automation", href: "/automation", icon: Zap },
  { title: "Performance", href: "/performance", icon: Activity },
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "About", href: "/about", icon: Info },
]

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false)
    }
  }, [isMobile])

  useEffect(() => {
    // Close menu on route change
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    // Prevent body scroll when menu is open
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const menuVariants = {
    closed: {
      x: "100%",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
      },
    },
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
      },
    },
  }

  const overlayVariants = {
    closed: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
    open: {
      opacity: 1,
      transition: { duration: 0.2 },
    },
  }

  const itemVariants = {
    closed: {
      x: 50,
      opacity: 0,
    },
    open: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: i * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    }),
  }

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="md:hidden touch-target"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={overlayVariants}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              aria-hidden="true"
            />

            {/* Menu Panel */}
            <motion.nav
              initial="closed"
              animate="open"
              exit="closed"
              variants={menuVariants}
              className="fixed right-0 top-0 h-full w-[85%] max-w-sm bg-background border-l border-border shadow-xl z-50 md:hidden overflow-y-auto"
              aria-label="Mobile navigation"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="touch-target"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation Items */}
              <div className="p-4 space-y-2">
                {navItems.map((item, i) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <motion.div
                      key={item.href}
                      custom={i}
                      initial="closed"
                      animate="open"
                      exit="closed"
                      variants={itemVariants}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 touch-target",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </div>
                        {item.badge && (
                          <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform",
                          isActive && "rotate-90"
                        )} />
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
                <p className="text-xs text-muted-foreground text-center">
                  Meta Ads Dashboard Pro
                </p>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}