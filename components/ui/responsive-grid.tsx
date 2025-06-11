'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useDeviceOptimizations } from '@/hooks/use-mobile'

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
    wide?: number
  }
  adaptive?: boolean
  minItemWidth?: number
  maxItemWidth?: number
}

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: boolean
  safeArea?: boolean
}

interface ResponsiveCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  clickable?: boolean
  size?: 'sm' | 'md' | 'lg'
  orientation?: 'auto' | 'horizontal' | 'vertical'
}

const gapMap = {
  none: 'gap-0',
  sm: 'gap-2 md:gap-3',
  md: 'gap-3 md:gap-4',
  lg: 'gap-4 md:gap-6',
  xl: 'gap-6 md:gap-8'
}

export function ResponsiveGrid({
  children,
  className,
  gap = 'md',
  columns = { mobile: 1, tablet: 2, desktop: 3, wide: 4 },
  adaptive = false,
  minItemWidth = 280,
  maxItemWidth = 400
}: ResponsiveGridProps) {
  const { deviceType, optimizations } = useDeviceOptimizations()

  // Adaptive grid based on device performance
  const adaptiveColumns = React.useMemo(() => {
    if (!adaptive) return columns

    const baseColumns = { ...columns }
    
    // Reduce columns on low-performance devices
    if (optimizations.shouldUseVirtualization) {
      baseColumns.mobile = Math.max(1, (baseColumns.mobile || 1) - 1)
      baseColumns.tablet = Math.max(1, (baseColumns.tablet || 2) - 1)
    }
    
    return baseColumns
  }, [columns, adaptive, optimizations.shouldUseVirtualization])

  // Generate CSS Grid template
  const gridTemplate = React.useMemo(() => {
    const { mobile = 1, tablet = 2, desktop = 3, wide = 4 } = adaptiveColumns
    
    if (adaptive && minItemWidth && maxItemWidth) {
      return {
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, ${maxItemWidth}px))`
      }
    }
    
    return {}
  }, [adaptiveColumns, adaptive, minItemWidth, maxItemWidth])

  const gridClasses = React.useMemo(() => {
    const { mobile = 1, tablet = 2, desktop = 3, wide = 4 } = adaptiveColumns
    
    if (adaptive) {
      return cn(
        'grid justify-center',
        gapMap[gap]
      )
    }
    
    return cn(
      'grid',
      gapMap[gap],
      // Mobile columns
      mobile === 1 && 'grid-cols-1',
      mobile === 2 && 'grid-cols-2',
      mobile === 3 && 'grid-cols-3',
      mobile === 4 && 'grid-cols-4',
      // Tablet columns
      tablet === 1 && 'md:grid-cols-1',
      tablet === 2 && 'md:grid-cols-2',
      tablet === 3 && 'md:grid-cols-3',
      tablet === 4 && 'md:grid-cols-4',
      tablet === 5 && 'md:grid-cols-5',
      tablet === 6 && 'md:grid-cols-6',
      // Desktop columns
      desktop === 1 && 'lg:grid-cols-1',
      desktop === 2 && 'lg:grid-cols-2',
      desktop === 3 && 'lg:grid-cols-3',
      desktop === 4 && 'lg:grid-cols-4',
      desktop === 5 && 'lg:grid-cols-5',
      desktop === 6 && 'lg:grid-cols-6',
      // Wide screen columns
      wide === 1 && 'xl:grid-cols-1',
      wide === 2 && 'xl:grid-cols-2',
      wide === 3 && 'xl:grid-cols-3',
      wide === 4 && 'xl:grid-cols-4',
      wide === 5 && 'xl:grid-cols-5',
      wide === 6 && 'xl:grid-cols-6',
      wide === 7 && 'xl:grid-cols-7',
      wide === 8 && 'xl:grid-cols-8'
    )
  }, [adaptiveColumns, adaptive, gap])

  return (
    <div 
      className={cn(gridClasses, className)}
      style={gridTemplate}
    >
      {children}
    </div>
  )
}

export function ResponsiveContainer({
  children,
  className,
  size = 'lg',
  padding = true,
  safeArea = false
}: ResponsiveContainerProps) {
  const sizeMap = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[1400px]',
    full: 'max-w-full'
  }

  return (
    <div className={cn(
      'mx-auto w-full',
      sizeMap[size],
      padding && 'px-4 sm:px-6 lg:px-8',
      safeArea && 'safe-left safe-right',
      className
    )}>
      {children}
    </div>
  )
}

export function ResponsiveCard({
  children,
  className,
  hover = false,
  clickable = false,
  size = 'md',
  orientation = 'auto'
}: ResponsiveCardProps) {
  const { isMobile, optimizations } = useDeviceOptimizations()

  const sizeMap = {
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }

  const orientationClasses = React.useMemo(() => {
    if (orientation === 'horizontal') return 'flex-row'
    if (orientation === 'vertical') return 'flex-col'
    return isMobile ? 'flex-col' : 'flex-row'
  }, [orientation, isMobile])

  return (
    <div className={cn(
      'bg-card text-card-foreground rounded-lg border border-border',
      'transition-all duration-200',
      sizeMap[size],
      hover && 'hover:shadow-lg hover:border-border/80',
      clickable && 'cursor-pointer hover:bg-accent/5',
      optimizations.enableGestures && clickable && 'active:scale-95',
      !optimizations.shouldReduceAnimations && 'transform',
      className
    )}>
      {orientation !== 'auto' ? (
        <div className={cn('flex', orientationClasses, 'gap-4')}>
          {children}
        </div>
      ) : children}
    </div>
  )
}

// Stack component for vertical layouts
interface ResponsiveStackProps {
  children: React.ReactNode
  className?: string
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
}

export function ResponsiveStack({
  children,
  className,
  gap = 'md',
  align = 'stretch',
  justify = 'start'
}: ResponsiveStackProps) {
  const gapClasses = {
    none: 'space-y-0',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }

  return (
    <div className={cn(
      'flex flex-col',
      gapClasses[gap],
      alignClasses[align],
      justifyClasses[justify],
      className
    )}>
      {children}
    </div>
  )
}

// Flex component for horizontal layouts
interface ResponsiveFlexProps {
  children: React.ReactNode
  className?: string
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  direction?: 'row' | 'col' | 'auto'
}

export function ResponsiveFlex({
  children,
  className,
  gap = 'md',
  align = 'center',
  justify = 'start',
  wrap = false,
  direction = 'auto'
}: ResponsiveFlexProps) {
  const { isMobile } = useDeviceOptimizations()

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline'
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }

  const directionClasses = React.useMemo(() => {
    if (direction === 'row') return 'flex-row'
    if (direction === 'col') return 'flex-col'
    return isMobile ? 'flex-col sm:flex-row' : 'flex-row'
  }, [direction, isMobile])

  return (
    <div className={cn(
      'flex',
      directionClasses,
      gapClasses[gap],
      alignClasses[align],
      justifyClasses[justify],
      wrap && 'flex-wrap',
      className
    )}>
      {children}
    </div>
  )
}

// Masonry layout for dynamic content
interface ResponsiveMasonryProps {
  children: React.ReactNode
  className?: string
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: number
}

export function ResponsiveMasonry({
  children,
  className,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 16
}: ResponsiveMasonryProps) {
  const { deviceType } = useDeviceOptimizations()
  
  const columnCount = React.useMemo(() => {
    switch (deviceType) {
      case 'mobile':
        return columns.mobile || 1
      case 'tablet':
        return columns.tablet || 2
      default:
        return columns.desktop || 3
    }
  }, [deviceType, columns])

  return (
    <div
      className={cn('columns-1', className)}
      style={{
        columnCount,
        columnGap: gap,
        columnFill: 'balance'
      }}
    >
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className="break-inside-avoid"
          style={{ marginBottom: gap }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

// Responsive section wrapper
interface ResponsiveSectionProps {
  children: React.ReactNode
  className?: string
  paddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  background?: 'default' | 'muted' | 'card'
  fullWidth?: boolean
}

export function ResponsiveSection({
  children,
  className,
  paddingY = 'lg',
  background = 'default',
  fullWidth = false
}: ResponsiveSectionProps) {
  const paddingMap = {
    none: 'py-0',
    sm: 'py-4 sm:py-6',
    md: 'py-6 sm:py-8',
    lg: 'py-8 sm:py-12',
    xl: 'py-12 sm:py-16'
  }

  const backgroundMap = {
    default: 'bg-background',
    muted: 'bg-muted/30',
    card: 'bg-card'
  }

  return (
    <section className={cn(
      backgroundMap[background],
      paddingMap[paddingY],
      className
    )}>
      {fullWidth ? children : (
        <ResponsiveContainer>
          {children}
        </ResponsiveContainer>
      )}
    </section>
  )
}