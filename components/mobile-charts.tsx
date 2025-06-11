'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
// import { motion, PanInfo } from 'framer-motion'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { cn } from '@/lib/utils'
import { useDeviceOptimizations, useViewportSize } from '@/hooks/use-mobile'
import { useGestures, usePinchToZoom } from '@/hooks/use-gestures'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  TrendingUp, 
  TrendingDown,
  MoreHorizontal,
  Eye,
  Download
} from 'lucide-react'

interface MobileChartProps {
  data: any[]
  type: 'line' | 'area' | 'bar' | 'pie'
  title?: string
  subtitle?: string
  xKey?: string
  yKey?: string
  categories?: string[]
  colors?: string[]
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  enableZoom?: boolean
  enablePan?: boolean
  responsive?: boolean
  loading?: boolean
  error?: string
  onDataPointClick?: (data: any) => void
  onZoomChange?: (zoom: number) => void
}

interface TouchTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  coordinate?: { x: number; y: number }
}

const defaultColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
]

// Custom tooltip for mobile
function TouchTooltip({ active, payload, label, coordinate }: TouchTooltipProps) {
  if (!active || !payload?.length || !coordinate) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute z-50 bg-popover border border-border rounded-lg shadow-lg p-3 min-w-32"
      style={{
        left: coordinate.x - 60,
        top: coordinate.y - 80,
        transform: 'translateX(-50%)'
      }}
    >
      <div className="text-sm font-medium text-popover-foreground mb-1">
        {label}
      </div>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value}</span>
        </div>
      ))}
    </motion.div>
  )
}

// Mobile-optimized line chart
function MobileLineChart({ 
  data, 
  xKey = 'name', 
  yKey = 'value',
  categories = [yKey],
  colors = defaultColors,
  showGrid = true,
  height = 300,
  onDataPointClick
}: Omit<MobileChartProps, 'type'>) {
  const { isMobile } = useDeviceOptimizations()
  const [activePoint, setActivePoint] = useState<any>(null)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{
          top: 10,
          right: isMobile ? 10 : 30,
          left: isMobile ? -20 : 0,
          bottom: 10
        }}
      >
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))"
            opacity={0.3}
          />
        )}
        <XAxis 
          dataKey={xKey}
          tick={{ fontSize: isMobile ? 10 : 12 }}
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          tick={{ fontSize: isMobile ? 10 : 12 }}
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          axisLine={false}
          width={isMobile ? 40 : 60}
        />
        <Tooltip
          content={({ active, payload, label, coordinate }) => (
            <TouchTooltip 
              active={active}
              payload={payload}
              label={label}
              coordinate={coordinate}
            />
          )}
        />
        {categories.map((category, index) => (
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            stroke={colors[index % colors.length]}
            strokeWidth={isMobile ? 3 : 2}
            dot={{
              fill: colors[index % colors.length],
              strokeWidth: 0,
              r: isMobile ? 6 : 4
            }}
            activeDot={{
              r: isMobile ? 8 : 6,
              stroke: colors[index % colors.length],
              strokeWidth: 2,
              fill: 'white'
            }}
            onClick={onDataPointClick}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

// Mobile-optimized area chart
function MobileAreaChart({
  data,
  xKey = 'name',
  yKey = 'value',
  categories = [yKey],
  colors = defaultColors,
  showGrid = true,
  height = 300
}: Omit<MobileChartProps, 'type'>) {
  const { isMobile } = useDeviceOptimizations()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: isMobile ? 10 : 30,
          left: isMobile ? -20 : 0,
          bottom: 10
        }}
      >
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))"
            opacity={0.3}
          />
        )}
        <XAxis 
          dataKey={xKey}
          tick={{ fontSize: isMobile ? 10 : 12 }}
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          tick={{ fontSize: isMobile ? 10 : 12 }}
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          axisLine={false}
          width={isMobile ? 40 : 60}
        />
        <Tooltip
          content={({ active, payload, label, coordinate }) => (
            <TouchTooltip 
              active={active}
              payload={payload}
              label={label}
              coordinate={coordinate}
            />
          )}
        />
        {categories.map((category, index) => (
          <Area
            key={category}
            type="monotone"
            dataKey={category}
            stroke={colors[index % colors.length]}
            fill={colors[index % colors.length]}
            fillOpacity={0.3}
            strokeWidth={isMobile ? 3 : 2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Mobile-optimized bar chart
function MobileBarChart({
  data,
  xKey = 'name',
  yKey = 'value',
  categories = [yKey],
  colors = defaultColors,
  showGrid = true,
  height = 300
}: Omit<MobileChartProps, 'type'>) {
  const { isMobile } = useDeviceOptimizations()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{
          top: 10,
          right: isMobile ? 10 : 30,
          left: isMobile ? -20 : 0,
          bottom: 10
        }}
      >
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))"
            opacity={0.3}
          />
        )}
        <XAxis 
          dataKey={xKey}
          tick={{ fontSize: isMobile ? 10 : 12 }}
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          tick={{ fontSize: isMobile ? 10 : 12 }}
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          axisLine={false}
          width={isMobile ? 40 : 60}
        />
        <Tooltip
          content={({ active, payload, label, coordinate }) => (
            <TouchTooltip 
              active={active}
              payload={payload}
              label={label}
              coordinate={coordinate}
            />
          )}
        />
        {categories.map((category, index) => (
          <Bar
            key={category}
            dataKey={category}
            fill={colors[index % colors.length]}
            radius={isMobile ? [4, 4, 0, 0] : [2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

// Mobile-optimized pie chart
function MobilePieChart({
  data,
  height = 300,
  colors = defaultColors,
  onDataPointClick
}: Omit<MobileChartProps, 'type' | 'xKey' | 'yKey'>) {
  const { isMobile } = useDeviceOptimizations()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={isMobile ? 40 : 60}
          outerRadius={isMobile ? 80 : 100}
          paddingAngle={2}
          dataKey="value"
          onMouseEnter={(_, index) => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(null)}
          onClick={onDataPointClick}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              stroke={activeIndex === index ? 'white' : 'none'}
              strokeWidth={activeIndex === index ? 2 : 0}
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const data = payload[0]
            return (
              <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                <div className="text-sm font-medium text-popover-foreground">
                  {data.payload.name}: {data.value}
                </div>
              </div>
            )
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Main mobile chart component with gesture support
export function MobileChart({
  data,
  type,
  title,
  subtitle,
  xKey,
  yKey,
  categories,
  colors = defaultColors,
  height = 300,
  showLegend = false,
  showGrid = true,
  enableZoom = true,
  enablePan = false,
  responsive = true,
  loading = false,
  error,
  onDataPointClick,
  onZoomChange
}: MobileChartProps) {
  const { isMobile, optimizations } = useDeviceOptimizations()
  const viewportSize = useViewportSize()
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  // Pinch to zoom
  const { scale } = usePinchToZoom(
    chartRef,
    enableZoom ? (newScale) => {
      setZoom(newScale)
      onZoomChange?.(newScale)
    } : undefined
  )

  // Pan gestures
  useGestures(chartRef, {
    onPan: enablePan ? (event) => {
      setPan(prev => ({
        x: prev.x + (event.deltaX || 0),
        y: prev.y + (event.deltaY || 0)
      }))
    } : undefined,
    onDoubleTap: () => {
      if (enableZoom) {
        setZoom(1)
        setPan({ x: 0, y: 0 })
        onZoomChange?.(1)
      }
    }
  })

  // Responsive height
  const responsiveHeight = useMemo(() => {
    if (!responsive) return height
    
    if (isExpanded) {
      return Math.min(viewportSize.height * 0.8, 600)
    }
    
    if (isMobile) {
      return Math.min(height, viewportSize.height * 0.4)
    }
    
    return height
  }, [responsive, isExpanded, isMobile, height, viewportSize.height])

  // Chart controls
  const chartControls = (
    <div className="flex items-center gap-2">
      {enableZoom && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newZoom = Math.min(zoom * 1.2, 3)
              setZoom(newZoom)
              onZoomChange?.(newZoom)
            }}
            className="h-8 w-8 p-0 touch-target"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newZoom = Math.max(zoom / 1.2, 0.5)
              setZoom(newZoom)
              onZoomChange?.(newZoom)
            }}
            className="h-8 w-8 p-0 touch-target"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setZoom(1)
              setPan({ x: 0, y: 0 })
              onZoomChange?.(1)
            }}
            className="h-8 w-8 p-0 touch-target"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-8 w-8 p-0 touch-target"
      >
        <Maximize2 className="h-3 w-3" />
      </Button>
    </div>
  )

  // Trend indicator
  const trendIndicator = useMemo(() => {
    if (!data.length || data.length < 2) return null
    
    const firstValue = data[0][yKey || 'value']
    const lastValue = data[data.length - 1][yKey || 'value']
    const change = ((lastValue - firstValue) / firstValue) * 100
    
    return (
      <div className={cn(
        "flex items-center gap-1 text-xs",
        change >= 0 ? "text-green-600" : "text-red-600"
      )}>
        {change >= 0 ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        <span>{Math.abs(change).toFixed(1)}%</span>
      </div>
    )
  }, [data, yKey])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-muted rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="bg-muted rounded animate-pulse"
            style={{ height: responsiveHeight }}
          />
        </CardContent>
      </Card>
    )
  }

  if (error || !data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title}
            <Badge variant="destructive">Error</Badge>
          </CardTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {error || 'No data available'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(isExpanded && "fixed inset-4 z-50")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-base">
              {title}
              {trendIndicator}
            </CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {chartControls}
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={chartRef}
          className="relative overflow-hidden touch-pan-y"
          style={{
            height: responsiveHeight,
            transform: `scale(${enableZoom ? zoom * scale : 1}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center center'
          }}
        >
          {type === 'line' && (
            <MobileLineChart
              data={data}
              xKey={xKey}
              yKey={yKey}
              categories={categories}
              colors={colors}
              showGrid={showGrid}
              height={responsiveHeight}
              onDataPointClick={onDataPointClick}
            />
          )}
          {type === 'area' && (
            <MobileAreaChart
              data={data}
              xKey={xKey}
              yKey={yKey}
              categories={categories}
              colors={colors}
              showGrid={showGrid}
              height={responsiveHeight}
            />
          )}
          {type === 'bar' && (
            <MobileBarChart
              data={data}
              xKey={xKey}
              yKey={yKey}
              categories={categories}
              colors={colors}
              showGrid={showGrid}
              height={responsiveHeight}
            />
          )}
          {type === 'pie' && (
            <MobilePieChart
              data={data}
              colors={colors}
              height={responsiveHeight}
              onDataPointClick={onDataPointClick}
            />
          )}
          
          {/* Gesture hint for mobile */}
          {isMobile && (enableZoom || enablePan) && (
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded px-2 py-1">
              {enableZoom && enablePan ? 'Pinch to zoom, drag to pan' :
               enableZoom ? 'Pinch to zoom' :
               'Drag to pan'}
            </div>
          )}
        </div>

        {/* Legend for mobile */}
        {showLegend && categories && categories.length > 1 && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
            {categories.map((category, index) => (
              <div key={category} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-sm capitalize">{category}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Expanded backdrop */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        />
      )}
    </Card>
  )
}