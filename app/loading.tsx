"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3,
  RefreshCw
} from "lucide-react"

export default function Loading() {
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          return 0
        }
        const diff = Math.random() * 10
        return Math.min(oldProgress + diff, 100)
      })
    }, 200)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>

        {/* Loading State with Animation */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Loading Meta Ads Dashboard</h2>
          <p className="text-muted-foreground mb-4">
            Fetching your campaign data and insights...
          </p>
          <div className="max-w-xs mx-auto">
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Dashboard Skeleton */}
        <div className="space-y-6">
          {/* Tabs Skeleton */}
          <div className="flex space-x-1 bg-muted rounded-lg p-1">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Skeleton */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Chart Skeleton */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table Skeleton */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-40" />
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-8 w-8 rounded" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full Width Table Skeleton */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
                
                {/* Table Header */}
                <div className="grid grid-cols-8 gap-4 pb-2 border-b">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
                
                {/* Table Rows */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-8 gap-4 py-2">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading Tips */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>💡 Tip: You can use the search bar to quickly find specific campaigns</p>
        </div>
      </div>
    </div>
  )
}