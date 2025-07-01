"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowUpIcon, ArrowDownIcon, ActivityIcon, WifiIcon, WifiOffIcon } from "lucide-react"
import { useCampaignStream } from "@/lib/hooks/use-campaign-stream"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface PerformanceMonitorProps {
  campaignId: string
  budget?: number
  className?: string
}

interface Metric {
  label: string
  value: string | number
  change?: number
  format?: 'number' | 'currency' | 'percent'
}

export function PerformanceMonitor({ campaignId, budget, className }: PerformanceMonitorProps) {
  const [previousMetrics, setPreviousMetrics] = useState<any>(null)
  const { isConnected, metrics, lastUpdate, error } = useCampaignStream(campaignId)
  
  // Calculate changes from previous metrics
  const calculateChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  // Update previous metrics when new data arrives
  useEffect(() => {
    if (metrics && (!previousMetrics || lastUpdate)) {
      setPreviousMetrics(metrics)
    }
  }, [metrics, lastUpdate])

  const metricsData: Metric[] = metrics ? [
    {
      label: "Impressions",
      value: metrics.impressions.toLocaleString(),
      change: previousMetrics ? calculateChange(metrics.impressions, previousMetrics.impressions) : 0,
      format: 'number'
    },
    {
      label: "Clicks",
      value: metrics.clicks.toLocaleString(),
      change: previousMetrics ? calculateChange(metrics.clicks, previousMetrics.clicks) : 0,
      format: 'number'
    },
    {
      label: "CTR",
      value: `${metrics.ctr.toFixed(2)}%`,
      change: previousMetrics ? calculateChange(metrics.ctr, previousMetrics.ctr) : 0,
      format: 'percent'
    },
    {
      label: "Spend",
      value: formatCurrency(metrics.spend),
      change: previousMetrics ? calculateChange(metrics.spend, previousMetrics.spend) : 0,
      format: 'currency'
    },
    {
      label: "CPC",
      value: formatCurrency(metrics.cpc),
      change: previousMetrics ? calculateChange(metrics.cpc, previousMetrics.cpc) : 0,
      format: 'currency'
    },
    {
      label: "CPM",
      value: formatCurrency(metrics.cpm),
      change: previousMetrics ? calculateChange(metrics.cpm, previousMetrics.cpm) : 0,
      format: 'currency'
    },
    {
      label: "Conversions",
      value: metrics.conversions.toLocaleString(),
      change: previousMetrics ? calculateChange(metrics.conversions, previousMetrics.conversions) : 0,
      format: 'number'
    },
    {
      label: "ROAS",
      value: `${metrics.roas.toFixed(2)}x`,
      change: previousMetrics ? calculateChange(metrics.roas, previousMetrics.roas) : 0,
      format: 'number'
    }
  ] : []

  const spendPercentage = budget && metrics ? (metrics.spend / budget) * 100 : 0

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Performance Monitor</CardTitle>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="gap-1">
                <WifiIcon className="h-3 w-3" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <WifiOffIcon className="h-3 w-3" />
                Offline
              </Badge>
            )}
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                Updated {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mt-2 text-sm text-destructive">
            {error.message}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Budget Progress */}
        {budget && metrics && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Budget Utilization</span>
              <span className="font-medium">{spendPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={spendPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(metrics.spend)} spent</span>
              <span>{formatCurrency(budget)} total</span>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        {metrics ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {metricsData.map((metric) => (
              <div key={metric.label} className="space-y-1">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold">{metric.value}</span>
                  {metric.change !== undefined && metric.change !== 0 && (
                    <div className={cn(
                      "flex items-center text-xs",
                      metric.change > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {metric.change > 0 ? (
                        <ArrowUpIcon className="h-3 w-3" />
                      ) : (
                        <ArrowDownIcon className="h-3 w-3" />
                      )}
                      <span>{Math.abs(metric.change).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center">
            <div className="text-center">
              <ActivityIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                {isConnected ? "Waiting for data..." : "Connecting..."}
              </p>
            </div>
          </div>
        )}

        {/* Real-time indicator */}
        {isConnected && (
          <div className="absolute right-2 top-2 h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}