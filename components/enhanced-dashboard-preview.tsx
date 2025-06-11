"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardGrid } from "@/components/ui/card"
import { Skeleton, SkeletonCard, SkeletonChart } from "@/components/ui/loading-skeleton"
import { BarChart3, TrendingUp, DollarSign, Users, Eye, MousePointer } from "lucide-react"
import { cn } from "@/lib/utils"

// Sample data for demonstration
const dashboardMetrics = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    icon: DollarSign,
    color: "text-green-600",
  },
  {
    title: "Active Campaigns",
    value: "12",
    change: "+180.1%",
    icon: BarChart3,
    color: "text-blue-600",
  },
  {
    title: "Total Reach",
    value: "2.4M",
    change: "+19%",
    icon: Eye,
    color: "text-purple-600",
  },
  {
    title: "Click Rate",
    value: "3.2%",
    change: "+201%",
    icon: MousePointer,
    color: "text-orange-600",
  },
  {
    title: "Conversions",
    value: "1,234",
    change: "+15%",
    icon: TrendingUp,
    color: "text-indigo-600",
  },
  {
    title: "Active Users",
    value: "+573",
    change: "+201%",
    icon: Users,
    color: "text-pink-600",
  },
]

interface MetricCardProps {
  title: string
  value: string
  change: string
  icon: React.ElementType
  color: string
  className?: string
}

function MetricCard({ title, value, change, icon: Icon, color, className }: MetricCardProps) {
  return (
    <Card className={cn("card-hover", className)} variant="interactive">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", color)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          <span className={cn(
            "font-medium",
            change.startsWith("+") ? "text-green-600" : "text-red-600"
          )}>
            {change}
          </span>{" "}
          from last month
        </p>
      </CardContent>
    </Card>
  )
}

interface EnhancedDashboardPreviewProps {
  loading?: boolean
}

export function EnhancedDashboardPreview({ loading = false }: EnhancedDashboardPreviewProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton height={32} width="30%" />
          <Skeleton height={20} width="50%" />
        </div>

        {/* Metrics Grid */}
        <CardGrid cols={3} gap="md">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} showAvatar={false} lines={2} />
          ))}
        </CardGrid>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart type="bar" />
          <SkeletonChart type="line" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="heading-responsive font-bold">Meta Ads Dashboard</h1>
        <p className="text-muted-foreground text-responsive">
          Welcome back! Here's what's happening with your campaigns today.
        </p>
      </div>

      {/* Metrics Grid */}
      <CardGrid cols={3} gap="md">
        {dashboardMetrics.map((metric, index) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            icon={metric.icon}
            color={metric.color}
            className={`fade-in`}
            style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}
          />
        ))}
      </CardGrid>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated" className="fade-in" style={{ animationDelay: "0.6s" } as React.CSSProperties}>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Chart would render here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="fade-in" style={{ animationDelay: "0.7s" } as React.CSSProperties}>
          <CardHeader>
            <CardTitle>Conversion Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Chart would render here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card variant="glass" className="fade-in" style={{ animationDelay: "0.8s" } as React.CSSProperties}>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Campaign update {i + 1}</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}