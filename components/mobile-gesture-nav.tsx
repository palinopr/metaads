'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
// import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  Home,
  BarChart3,
  Settings,
  FileText,
  Activity,
  Users,
  TrendingUp,
  Zap,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSwipeNavigation, usePullToRefresh } from '@/hooks/use-gestures'
import { useDeviceOptimizations } from '@/hooks/use-mobile'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  color: string
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Home, color: "from-blue-500 to-blue-600" },
  { title: "Analytics", href: "/analytics", icon: BarChart3, color: "from-green-500 to-green-600" },
  { title: "Reports", href: "/reports", icon: FileText, color: "from-purple-500 to-purple-600" },
  { title: "Pattern Analysis", href: "/pattern-analysis", icon: TrendingUp, color: "from-orange-500 to-orange-600" },
  { title: "Demographics", href: "/demographics", icon: Users, color: "from-pink-500 to-pink-600" },
  { title: "Automation", href: "/automation", icon: Zap, color: "from-yellow-500 to-yellow-600" },
  { title: "Performance", href: "/performance", icon: Activity, color: "from-red-500 to-red-600" },
  { title: "Settings", href: "/settings", icon: Settings, color: "from-gray-500 to-gray-600" },
]

export function MobileGestureNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const navRef = useRef<HTMLDivElement>(null)
  const { isMobile, optimizations } = useDeviceOptimizations()

  // Find current nav index
  useEffect(() => {
    const index = navItems.findIndex(item => item.href === pathname)
    if (index !== -1) setCurrentIndex(index)
  }, [pathname])

  // Gesture navigation
  useSwipeNavigation(
    navRef,
    () => {
      // Swipe left - next page
      if (currentIndex < navItems.length - 1) {
        const nextItem = navItems[currentIndex + 1]
        router.push(nextItem.href)
      }
    },
    () => {
      // Swipe right - previous page
      if (currentIndex > 0) {
        const prevItem = navItems[currentIndex - 1]
        router.push(prevItem.href)
      }
    },
    () => setIsOpen(true), // Swipe up - open menu
    () => setIsOpen(false) // Swipe down - close menu
  )

  // Pull to refresh
  const { isPulling, pullProgress } = usePullToRefresh(
    navRef,
    () => {
      window.location.reload()
    }
  )

  const handlePanEnd = (event: any, info: PanInfo) => {
    setIsDragging(false)
    
    const threshold = 100
    const velocity = info.velocity.x
    
    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      if (info.offset.x > 0 && currentIndex > 0) {
        // Swipe right - previous
        const prevItem = navItems[currentIndex - 1]
        router.push(prevItem.href)
      } else if (info.offset.x < 0 && currentIndex < navItems.length - 1) {
        // Swipe left - next
        const nextItem = navItems[currentIndex + 1]
        router.push(nextItem.href)
      }
    }
  }

  const navigateToIndex = (index: number) => {
    setCurrentIndex(index)
    router.push(navItems[index].href)
    setIsOpen(false)
  }

  if (!isMobile) return null

  return (
    <>
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {isPulling && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center h-16 bg-primary/10 backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: pullProgress * 360 }}
              className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
            />
            <span className="ml-2 text-sm text-primary">
              {pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile navigation container */}
      <div ref={navRef} className="fixed inset-0 z-40 pointer-events-none">
        {/* Bottom navigation bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border pointer-events-auto safe-bottom"
          initial={false}
          animate={{
            y: isOpen ? 100 : 0,
          }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Current page indicator */}
          <div className="flex items-center justify-between px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => currentIndex > 0 && navigateToIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="touch-target"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <motion.div
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r text-white"
              style={{
                background: `linear-gradient(135deg, ${navItems[currentIndex]?.color || 'from-gray-500 to-gray-600'})`
              }}
              layoutId="current-nav"
            >
              {navItems[currentIndex] && (
                <>
                  <navItems[currentIndex].icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{navItems[currentIndex].title}</span>
                </>
              )}
            </motion.div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => currentIndex < navItems.length - 1 && navigateToIndex(currentIndex + 1)}
              disabled={currentIndex === navItems.length - 1}
              className="touch-target"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Menu toggle */}
          <div className="flex justify-center pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="touch-target"
            >
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </motion.div>
            </Button>
          </div>

          {/* Page dots indicator */}
          <div className="flex justify-center space-x-2 pb-4">
            {navItems.map((_, index) => (
              <motion.button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors touch-target",
                  index === currentIndex ? "bg-primary" : "bg-muted"
                )}
                onClick={() => navigateToIndex(index)}
                whileTap={{ scale: 1.2 }}
              />
            ))}
          </div>
        </motion.div>

        {/* Expandable menu */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
              />

              {/* Menu content */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 bg-background border-t border-border rounded-t-3xl pointer-events-auto safe-bottom"
                style={{ maxHeight: '80vh' }}
              >
                {/* Handle */}
                <div className="flex justify-center py-3">
                  <div className="w-12 h-1 bg-muted rounded-full" />
                </div>

                {/* Menu items */}
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-2 gap-4">
                    {navItems.map((item, index) => {
                      const isActive = index === currentIndex
                      const Icon = item.icon

                      return (
                        <motion.button
                          key={item.href}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ 
                            opacity: 1, 
                            y: 0,
                            transition: { delay: index * 0.05 }
                          }}
                          exit={{ opacity: 0, y: 20 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigateToIndex(index)}
                          className={cn(
                            "relative p-6 rounded-2xl text-left transition-all duration-200 touch-target",
                            "bg-gradient-to-br from-card to-card/50 border border-border",
                            "hover:shadow-lg hover:scale-105",
                            isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                          )}
                        >
                          {/* Background gradient */}
                          <div 
                            className={cn(
                              "absolute inset-0 rounded-2xl opacity-10 bg-gradient-to-br",
                              item.color
                            )}
                          />
                          
                          {/* Content */}
                          <div className="relative z-10">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br",
                              item.color
                            )}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            
                            <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                            
                            {isActive && (
                              <motion.div
                                layoutId="active-indicator"
                                className="w-2 h-2 bg-primary rounded-full"
                              />
                            )}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Quick actions */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h4>
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsOpen(false)
                          // Add refresh logic
                        }}
                        className="flex-1 touch-target"
                      >
                        Refresh Data
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsOpen(false)
                          router.push('/settings')
                        }}
                        className="flex-1 touch-target"
                      >
                        Settings
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Gesture hint overlay */}
        {optimizations.enableGestures && (
          <div className="absolute top-4 left-4 right-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isDragging ? 0.7 : 0 }}
              className="text-center text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded-lg p-2"
            >
              Swipe left/right to navigate • Swipe up for menu
            </motion.div>
          </div>
        )}
      </div>

      {/* Swipeable page container */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handlePanEnd}
        className="fixed inset-0 pointer-events-none z-10"
      />
    </>
  )
}