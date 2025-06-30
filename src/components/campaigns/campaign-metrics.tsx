"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  format?: "currency" | "number" | "percentage"
  icon?: React.ReactNode
}

export function MetricCard({ title, value, change, format = "number", icon }: MetricCardProps) {
  const formatValue = () => {
    switch (format) {
      case "currency":
        return `$${typeof value === "number" ? value.toFixed(2) : value}`
      case "percentage":
        return `${value}%`
      default:
        return typeof value === "number" ? value.toLocaleString() : value
    }
  }

  const getTrendIcon = () => {
    if (change === undefined || change === 0) return <Minus className="h-4 w-4 text-muted-foreground" />
    return change > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  }

  const getTrendColor = () => {
    if (change === undefined || change === 0) return "text-muted-foreground"
    return change > 0 ? "text-green-500" : "text-red-500"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue()}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${getTrendColor()} mt-1`}>
            {getTrendIcon()}
            <span className="ml-1">{Math.abs(change)}% from last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface CampaignMetricsProps {
  metrics: {
    totalSpend: number
    totalImpressions: number
    totalClicks: number
    averageCTR: number
    averageCPC: number
    activeCampaigns: number
  }
  previousMetrics?: {
    totalSpend: number
    totalImpressions: number
    totalClicks: number
    averageCTR: number
    averageCPC: number
    activeCampaigns: number
  }
}

export function CampaignMetrics({ metrics, previousMetrics }: CampaignMetricsProps) {
  const calculateChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) return undefined
    return ((current - previous) / previous) * 100
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Total Spend"
        value={metrics.totalSpend}
        format="currency"
        change={calculateChange(metrics.totalSpend, previousMetrics?.totalSpend)}
      />
      <MetricCard
        title="Impressions"
        value={metrics.totalImpressions}
        change={calculateChange(metrics.totalImpressions, previousMetrics?.totalImpressions)}
      />
      <MetricCard
        title="Clicks"
        value={metrics.totalClicks}
        change={calculateChange(metrics.totalClicks, previousMetrics?.totalClicks)}
      />
      <MetricCard
        title="Average CTR"
        value={metrics.averageCTR.toFixed(2)}
        format="percentage"
        change={calculateChange(metrics.averageCTR, previousMetrics?.averageCTR)}
      />
      <MetricCard
        title="Average CPC"
        value={metrics.averageCPC}
        format="currency"
        change={calculateChange(metrics.averageCPC, previousMetrics?.averageCPC)}
      />
      <MetricCard
        title="Active Campaigns"
        value={metrics.activeCampaigns}
        change={calculateChange(metrics.activeCampaigns, previousMetrics?.activeCampaigns)}
      />
    </div>
  )
}