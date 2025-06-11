'use client'

import React, { useState, useEffect } from 'react'
// import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useDeviceOptimizations, useSafeAreaInsets } from '@/hooks/use-mobile'
import { 
  ResponsiveGrid, 
  ResponsiveContainer, 
  ResponsiveCard, 
  ResponsiveStack,
  ResponsiveFlex,
  ResponsiveSection 
} from '@/components/ui/responsive-grid'
import { MobileGestureNav } from '@/components/mobile-gesture-nav'
import { MobileNavigation } from '@/components/mobile-navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { 
  MoreVertical, 
  Maximize2, 
  Minimize2, 
  Eye, 
  EyeOff,
  Filter,
  SortAsc,
  RefreshCw
} from 'lucide-react'

interface DashboardWidget {
  id: string
  title: string
  component: React.ComponentType<any>
  props?: any
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  priority?: number
  minWidth?: number
  canHide?: boolean
  canResize?: boolean
  category?: string
}

interface MobileDashboardLayoutProps {
  widgets: DashboardWidget[]
  loading?: boolean
  error?: string
  onRefresh?: () => void
  customHeader?: React.ReactNode
  enableCustomization?: boolean
}

export function MobileDashboardLayout({
  widgets,
  loading = false,
  error,
  onRefresh,
  customHeader,
  enableCustomization = true
}: MobileDashboardLayoutProps) {
  const { isMobile, isTablet, optimizations } = useDeviceOptimizations()
  const safeAreaInsets = useSafeAreaInsets()
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set())
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'priority' | 'title' | 'category'>('priority')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filter and sort widgets
  const visibleWidgets = React.useMemo(() => {
    let filtered = widgets.filter(widget => !hiddenWidgets.has(widget.id))
    
    // Sort widgets
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return (a.priority || 0) - (b.priority || 0)
        case 'title':
          return a.title.localeCompare(b.title)
        case 'category':
          return (a.category || '').localeCompare(b.category || '')
        default:
          return 0
      }
    })

    return filtered
  }, [widgets, hiddenWidgets, sortBy])

  // Responsive grid configuration
  const gridConfig = React.useMemo(() => {
    if (optimizations.shouldUseVirtualization) {
      return {
        mobile: 1,
        tablet: 1,
        desktop: 2,
        wide: 3
      }
    }
    
    return {
      mobile: 1,
      tablet: 2,
      desktop: optimizations.gridColumns,
      wide: optimizations.gridColumns + 1
    }
  }, [optimizations])

  // Handle refresh
  const handleRefresh = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await onRefresh?.()
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  // Widget size mapping
  const getWidgetSpan = (size: string, deviceType: string) => {
    if (deviceType === 'mobile') return 1 // Always full width on mobile
    
    const spanMap = {
      sm: 1,
      md: 1,
      lg: 2,
      xl: 3,
      full: gridConfig.desktop
    }
    
    return spanMap[size as keyof typeof spanMap] || 1
  }

  if (loading) {
    return (
      <MobileDashboardSkeleton 
        widgetCount={widgets.length}
        isMobile={isMobile}
      />
    )
  }

  if (error) {
    return (
      <ResponsiveSection className="min-h-screen flex items-center justify-center">
        <ResponsiveCard className="text-center max-w-md">
          <div className="text-destructive mb-4">
            <h3 className="text-lg font-semibold">Error Loading Dashboard</h3>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Retry
          </Button>
        </ResponsiveCard>
      </ResponsiveSection>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Safe area top spacing */}
      <div style={{ height: safeAreaInsets.top }} />
      
      {/* Header */}
      <ResponsiveSection paddingY="sm" background="card">
        <ResponsiveFlex justify="between" align="center">
          {customHeader || (
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {visibleWidgets.length} widget{visibleWidgets.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
          
          {enableCustomization && (
            <ResponsiveFlex gap="sm">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="touch-target"
              >
                <Filter className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="touch-target"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            </ResponsiveFlex>
          )}
        </ResponsiveFlex>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 overflow-hidden"
            >
              <ResponsiveFlex gap="sm" wrap>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-md border border-border bg-background text-sm touch-target"
                >
                  <option value="priority">Sort by Priority</option>
                  <option value="title">Sort by Title</option>
                  <option value="category">Sort by Category</option>
                </select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHiddenWidgets(new Set())}
                  className="touch-target"
                >
                  Show All
                </Button>
              </ResponsiveFlex>
            </motion.div>
          )}
        </AnimatePresence>
      </ResponsiveSection>

      {/* Main Content */}
      <ResponsiveSection paddingY="md">
        <ResponsiveGrid
          columns={gridConfig}
          gap="lg"
          adaptive={optimizations.shouldUseVirtualization}
          minItemWidth={320}
          maxItemWidth={600}
        >
          <AnimatePresence mode="popLayout">
            {visibleWidgets.map((widget, index) => {
              const isExpanded = expandedWidget === widget.id
              const Component = widget.component

              return (
                <motion.div
                  key={widget.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: index * 0.1 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: -20,
                    transition: { duration: 0.2 }
                  }}
                  className={cn(
                    isExpanded && "col-span-full row-span-full fixed inset-4 z-50",
                    !isExpanded && `col-span-${getWidgetSpan(widget.size || 'md', isMobile ? 'mobile' : 'desktop')}`
                  )}
                >
                  <ResponsiveCard
                    className={cn(
                      "relative h-full",
                      isExpanded && "shadow-2xl"
                    )}
                    hover={!isExpanded}
                    size={isExpanded ? 'lg' : 'md'}
                  >
                    {/* Widget Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-base">{widget.title}</h3>
                      
                      {enableCustomization && (
                        <ResponsiveFlex gap="sm">
                          {widget.canHide && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setHiddenWidgets(prev => new Set(prev.add(widget.id)))
                              }}
                              className="h-8 w-8 p-0 touch-target"
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {widget.canResize && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setExpandedWidget(isExpanded ? null : widget.id)
                              }}
                              className="h-8 w-8 p-0 touch-target"
                            >
                              {isExpanded ? (
                                <Minimize2 className="h-4 w-4" />
                              ) : (
                                <Maximize2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </ResponsiveFlex>
                      )}
                    </div>

                    {/* Widget Content */}
                    <div className="flex-1 overflow-hidden">
                      <React.Suspense
                        fallback={
                          <Skeleton className="w-full h-32" />
                        }
                      >
                        <Component 
                          {...widget.props}
                          isMobile={isMobile}
                          isExpanded={isExpanded}
                          optimizations={optimizations}
                        />
                      </React.Suspense>
                    </div>
                  </ResponsiveCard>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </ResponsiveGrid>

        {/* Empty state */}
        {visibleWidgets.length === 0 && (
          <ResponsiveCard className="text-center py-12">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No widgets visible</h3>
            <p className="text-muted-foreground mb-4">
              All widgets are currently hidden. Show some widgets to see your dashboard.
            </p>
            <Button
              onClick={() => setHiddenWidgets(new Set())}
              variant="outline"
            >
              Show All Widgets
            </Button>
          </ResponsiveCard>
        )}
      </ResponsiveSection>

      {/* Bottom spacing for mobile navigation */}
      {isMobile && <div className="h-32" />}
      
      {/* Navigation */}
      {isMobile ? (
        optimizations.enableGestures ? (
          <MobileGestureNav />
        ) : (
          <MobileNavigation />
        )
      ) : null}

      {/* Expanded widget backdrop */}
      <AnimatePresence>
        {expandedWidget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedWidget(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Safe area bottom spacing */}
      <div style={{ height: safeAreaInsets.bottom }} />
    </div>
  )
}

// Loading skeleton component
function MobileDashboardSkeleton({ 
  widgetCount, 
  isMobile 
}: { 
  widgetCount: number
  isMobile: boolean 
}) {
  return (
    <div className="min-h-screen bg-background">
      <ResponsiveSection paddingY="sm" background="card">
        <ResponsiveFlex justify="between" align="center">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <ResponsiveFlex gap="sm">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </ResponsiveFlex>
        </ResponsiveFlex>
      </ResponsiveSection>

      <ResponsiveSection paddingY="md">
        <ResponsiveGrid
          columns={{
            mobile: 1,
            tablet: 2,
            desktop: 3,
            wide: 4
          }}
          gap="lg"
        >
          {Array.from({ length: widgetCount }, (_, i) => (
            <ResponsiveCard key={i} className="h-64">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-full w-full" />
            </ResponsiveCard>
          ))}
        </ResponsiveGrid>
      </ResponsiveSection>

      {isMobile && <div className="h-32" />}
    </div>
  )
}