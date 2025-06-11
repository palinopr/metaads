"use client"

import React from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Dashboard metrics skeleton
export function DashboardMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="bg-gray-800/70 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Skeleton className="h-3 w-20 bg-gray-700" />
              <Skeleton className="h-4 w-4 bg-gray-700" />
            </div>
            <Skeleton className="h-8 w-24 mb-1 bg-gray-600" />
            <Skeleton className="h-3 w-16 bg-gray-700" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Campaign list skeleton
export function CampaignListSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-48 bg-gray-700" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32 bg-gray-700" />
          <Skeleton className="h-8 w-40 bg-gray-700" />
        </div>
      </div>
      
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="bg-gray-800/70 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-5 w-64 bg-gray-600" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16 bg-gray-700" />
                <Skeleton className="h-6 w-16 rounded-full bg-gray-700" />
                <Skeleton className="h-4 w-4 bg-gray-700" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j}>
                  <Skeleton className="h-3 w-12 mb-1 bg-gray-700" />
                  <Skeleton className="h-4 w-16 bg-gray-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Chart skeleton
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card className="bg-gray-700/50 border-gray-600/70">
      <CardHeader>
        <Skeleton className="h-5 w-48 bg-gray-600" />
        <Skeleton className="h-3 w-32 bg-gray-700" />
      </CardHeader>
      <CardContent style={{ height }}>
        <div className="relative w-full h-full bg-gray-800/50 rounded-lg overflow-hidden">
          {/* Animated chart skeleton */}
          <div className="absolute inset-4">
            {/* Y-axis */}
            <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-2 w-6 bg-gray-600" />
              ))}
            </div>
            
            {/* X-axis */}
            <div className="absolute bottom-0 left-8 right-0 h-8 flex justify-between items-end">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-2 w-6 bg-gray-600" />
              ))}
            </div>
            
            {/* Chart area with animated wave */}
            <div className="absolute left-8 right-0 top-0 bottom-8 overflow-hidden">
              <svg className="w-full h-full">
                <defs>
                  <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(75, 85, 99, 0.1)" />
                    <stop offset="50%" stopColor="rgba(107, 114, 128, 0.3)" />
                    <stop offset="100%" stopColor="rgba(75, 85, 99, 0.1)" />
                    <animateTransform
                      attributeName="gradientTransform"
                      type="translate"
                      values="-100 0;100 0;-100 0"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 80 Q 50 60 100 70 T 200 65 T 300 75 T 400 60 T 500 80"
                  stroke="url(#shimmer)"
                  strokeWidth="2"
                  fill="none"
                  className="opacity-60"
                />
                <path
                  d="M 0 90 Q 60 70 120 80 T 240 75 T 360 85 T 480 70 T 600 90"
                  stroke="url(#shimmer)"
                  strokeWidth="2"
                  fill="none"
                  className="opacity-40"
                />
              </svg>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number, columns?: number }) {
  return (
    <Card className="bg-gray-700/50 border-gray-600/70">
      <CardHeader>
        <Skeleton className="h-5 w-32 bg-gray-600" />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="text-left py-2 px-2">
                    <Skeleton className="h-3 w-16 bg-gray-600" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-gray-600/50">
                  {Array.from({ length: columns }).map((_, j) => (
                    <td key={j} className="py-2 px-2">
                      <Skeleton className="h-4 w-full bg-gray-700" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// Performance monitor skeleton
export function PerformanceMonitorSkeleton() {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-5 w-5 bg-gray-600" />
              <Skeleton className="h-6 w-40 bg-gray-600" />
            </div>
            <Skeleton className="h-4 w-64 bg-gray-700" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-12 bg-gray-700" />
            <Skeleton className="h-8 w-16 bg-gray-700" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Web Vitals */}
        <div>
          <Skeleton className="h-4 w-32 mb-3 bg-gray-600" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg bg-gray-700/30 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-3 w-24 bg-gray-600" />
                  <Skeleton className="h-4 w-4 bg-gray-600" />
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <Skeleton className="h-8 w-16 bg-gray-500" />
                  <Skeleton className="h-3 w-12 bg-gray-700" />
                </div>
                <Skeleton className="h-1 w-full bg-gray-600" />
              </div>
            ))}
          </div>
        </div>

        {/* Cache Performance */}
        <div>
          <Skeleton className="h-4 w-36 mb-3 bg-gray-600" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg bg-gray-700/30 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-3 w-20 bg-gray-600" />
                  <Skeleton className="h-4 w-4 bg-gray-600" />
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <Skeleton className="h-8 w-12 bg-gray-500" />
                  <Skeleton className="h-3 w-16 bg-gray-700" />
                </div>
                <Skeleton className="h-1 w-full bg-gray-600" />
              </div>
            ))}
          </div>
        </div>

        {/* API Performance */}
        <div>
          <Skeleton className="h-4 w-32 mb-3 bg-gray-600" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg bg-gray-700/30 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-3 w-24 bg-gray-600" />
                  <Skeleton className="h-4 w-4 bg-gray-600" />
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <Skeleton className="h-8 w-10 bg-gray-500" />
                  <Skeleton className="h-3 w-14 bg-gray-700" />
                </div>
                <Skeleton className="h-1 w-full bg-gray-600" />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <Skeleton className="h-3 w-32 bg-gray-700" />
          <Skeleton className="h-8 w-24 bg-gray-700" />
        </div>
      </CardContent>
    </Card>
  )
}

// Demographics skeleton
export function DemographicsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Age breakdown */}
        <Card className="bg-gray-700/50 border-gray-600/70">
          <CardHeader>
            <Skeleton className="h-5 w-32 bg-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16 bg-gray-600" />
                  <div className="flex items-center gap-2 flex-1 mx-4">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <Skeleton 
                        className="h-2 bg-gray-500 rounded-full" 
                        style={{ width: `${Math.random() * 80 + 20}%` }}
                      />
                    </div>
                    <Skeleton className="h-4 w-12 bg-gray-600" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gender breakdown */}
        <Card className="bg-gray-700/50 border-gray-600/70">
          <CardHeader>
            <Skeleton className="h-5 w-24 bg-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-12 bg-gray-600" />
                  <div className="flex items-center gap-2 flex-1 mx-4">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <Skeleton 
                        className="h-2 bg-gray-500 rounded-full" 
                        style={{ width: `${Math.random() * 60 + 30}%` }}
                      />
                    </div>
                    <Skeleton className="h-4 w-12 bg-gray-600" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location breakdown */}
      <Card className="bg-gray-700/50 border-gray-600/70">
        <CardHeader>
          <Skeleton className="h-5 w-28 bg-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-3">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20 bg-gray-600" />
                    <div className="flex items-center gap-2 flex-1 mx-4">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <Skeleton 
                          className="h-2 bg-gray-500 rounded-full" 
                          style={{ width: `${Math.random() * 70 + 10}%` }}
                        />
                      </div>
                      <Skeleton className="h-4 w-8 bg-gray-600" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Day/Week performance skeleton
export function DayWeekPerformanceSkeleton() {
  return (
    <div className="space-y-4">
      {/* Day of week chart */}
      <ChartSkeleton height={250} />
      
      {/* Hour of day chart */}
      <ChartSkeleton height={200} />
      
      {/* Performance summary */}
      <Card className="bg-gray-700/50 border-gray-600/70">
        <CardHeader>
          <Skeleton className="h-5 w-40 bg-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-3 w-16 mx-auto mb-2 bg-gray-600" />
                <Skeleton className="h-6 w-12 mx-auto mb-1 bg-gray-500" />
                <Skeleton className="h-3 w-20 mx-auto bg-gray-700" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// AI Analysis skeleton
export function AIAnalysisSkeleton() {
  return (
    <Card className="bg-gray-700/50 border-gray-600/70">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 bg-gray-600" />
          <Skeleton className="h-5 w-32 bg-gray-600" />
        </div>
        <Skeleton className="h-3 w-48 bg-gray-700" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analysis sections */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-40 bg-gray-600" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-full bg-gray-700" />
              <Skeleton className="h-3 w-4/5 bg-gray-700" />
              <Skeleton className="h-3 w-3/5 bg-gray-700" />
            </div>
          </div>
        ))}
        
        {/* Recommendations */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-gray-600" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-3 w-3 bg-gray-600 rounded-full mt-1" />
                <Skeleton className="h-3 w-4/5 bg-gray-700" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Progressive loader wrapper
interface ProgressiveLoaderProps {
  children: React.ReactNode
  skeleton: React.ReactNode
  loading: boolean
  delay?: number
}

export function ProgressiveLoader({ 
  children, 
  skeleton, 
  loading, 
  delay = 200 
}: ProgressiveLoaderProps) {
  const [showSkeleton, setShowSkeleton] = React.useState(false)

  React.useEffect(() => {
    let timeout: NodeJS.Timeout

    if (loading) {
      timeout = setTimeout(() => {
        setShowSkeleton(true)
      }, delay)
    } else {
      setShowSkeleton(false)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [loading, delay])

  if (loading && showSkeleton) {
    return <>{skeleton}</>
  }

  if (loading && !showSkeleton) {
    return null // Don't show anything during the delay
  }

  return <>{children}</>
}