"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent 
} from "@/components/ui/chart"
import {
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Download,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine
} from "recharts"

interface TrendDataPoint {
  date: string
  spend: number
  revenue: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  roas: number
  timestamp: number
}

interface PerformanceTrendsProps {
  data?: TrendDataPoint[]
  isLoading?: boolean
  error?: string | null
  onRefresh?: () => void
  dateRange?: string
  className?: string
  compareWithPrevious?: boolean
}

type TrendMetric = "spend" | "revenue" | "conversions" | "roas" | "ctr" | "cpc" | "impressions" | "clicks"
type ChartType = "line" | "area" | "bar"
type TimeGranularity = "daily" | "weekly" | "monthly"

const METRIC_CONFIG = {
  spend: { 
    label: "Spend", 
    color: "#ef4444", 
    format: (val: number) => `$${val.toLocaleString()}`,
    prefix: "$"
  },
  revenue: { 
    label: "Revenue", 
    color: "#22c55e", 
    format: (val: number) => `$${val.toLocaleString()}`,
    prefix: "$"
  },
  conversions: { 
    label: "Conversions", 
    color: "#3b82f6", 
    format: (val: number) => val.toLocaleString(),
    prefix: ""
  },
  roas: { 
    label: "ROAS", 
    color: "#8b5cf6", 
    format: (val: number) => `${val.toFixed(2)}x`,
    prefix: ""
  },
  ctr: { 
    label: "CTR", 
    color: "#06b6d4", 
    format: (val: number) => `${(val * 100).toFixed(2)}%`,
    prefix: ""
  },
  cpc: { 
    label: "CPC", 
    color: "#f59e0b", 
    format: (val: number) => `$${val.toFixed(2)}`,
    prefix: "$"
  },
  impressions: { 
    label: "Impressions", 
    color: "#84cc16", 
    format: (val: number) => val.toLocaleString(),
    prefix: ""
  },
  clicks: { 
    label: "Clicks", 
    color: "#ec4899", 
    format: (val: number) => val.toLocaleString(),
    prefix: ""
  }
}

export function PerformanceTrends({
  data = [],
  isLoading = false,
  error = null,
  onRefresh,
  dateRange = "Last 30 days",
  className,
  compareWithPrevious = false
}: PerformanceTrendsProps) {
  const [selectedMetric, setSelectedMetric] = useState<TrendMetric>("roas")
  const [chartType, setChartType] = useState<ChartType>("line")
  const [granularity, setGranularity] = useState<TimeGranularity>("daily")
  const [showTrendLine, setShowTrendLine] = useState(true)

  // Process and aggregate data based on granularity
  const processedData = useMemo(() => {
    if (!data.length) return []

    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    if (granularity === "daily") {
      return sortedData.map(item => ({
        ...item,
        displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }))
    }

    // Aggregate by week or month
    const aggregated: { [key: string]: TrendDataPoint & { count: number } } = {}
    
    sortedData.forEach(item => {
      const date = new Date(item.date)
      let key: string
      
      if (granularity === "weekly") {
        const startOfWeek = new Date(date)
        startOfWeek.setDate(date.getDate() - date.getDay())
        key = startOfWeek.toISOString().split('T')[0]
      } else {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      }

      if (!aggregated[key]) {
        aggregated[key] = { ...item, count: 0, date: key }
      }

      // Sum absolute values, average rates
      aggregated[key].spend += item.spend
      aggregated[key].revenue += item.revenue
      aggregated[key].conversions += item.conversions
      aggregated[key].impressions += item.impressions
      aggregated[key].clicks += item.clicks
      aggregated[key].ctr += item.ctr
      aggregated[key].cpc += item.cpc
      aggregated[key].roas += item.roas
      aggregated[key].count += 1
    })

    // Average the rates
    return Object.values(aggregated).map(item => ({
      ...item,
      ctr: item.ctr / item.count,
      cpc: item.cpc / item.count,
      roas: item.roas / item.count,
      displayDate: granularity === "weekly" 
        ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : new Date(item.date + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data, granularity])

  // Calculate trend analysis
  const trendAnalysis = useMemo(() => {
    if (processedData.length < 2) return null

    const values = processedData.map(d => d[selectedMetric])
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length

    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100
    const isImproving = percentChange > 0

    // Calculate trend line data
    const n = processedData.length
    const sumX = processedData.reduce((sum, _, i) => sum + i, 0)
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = processedData.reduce((sum, _, i) => sum + i * values[i], 0)
    const sumXX = processedData.reduce((sum, _, i) => sum + i * i, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    const trendData = processedData.map((_, i) => intercept + slope * i)

    // Volatility (coefficient of variation)
    const mean = sumY / n
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n
    const volatility = Math.sqrt(variance) / mean

    return {
      percentChange,
      isImproving,
      slope,
      trendData,
      volatility: volatility * 100,
      currentValue: values[values.length - 1],
      previousValue: values[values.length - 2] || 0
    }
  }, [processedData, selectedMetric])

  // Export functionality
  const handleExport = () => {
    if (!processedData.length) return

    const csvData = [
      ["Date", ...Object.keys(METRIC_CONFIG).map(k => METRIC_CONFIG[k as TrendMetric].label)],
      ...processedData.map(item => [
        item.displayDate,
        ...Object.keys(METRIC_CONFIG).map(metric => item[metric as TrendMetric].toString())
      ])
    ]

    const csvContent = csvData.map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `performance-trends-${selectedMetric}-${granularity}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderChart = () => {
    const config = METRIC_CONFIG[selectedMetric]
    const chartConfig = {
      [selectedMetric]: {
        label: config.label,
        color: config.color,
      },
      trend: {
        label: "Trend",
        color: "#64748b",
      }
    }

    const chartData = processedData.map((item, index) => ({
      ...item,
      trend: showTrendLine && trendAnalysis ? trendAnalysis.trendData[index] : undefined
    }))

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case "area":
        return (
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="displayDate" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (config.prefix === "$" && value >= 1000) {
                    return `$${(value / 1000).toFixed(1)}k`
                  }
                  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(1)
                }}
              />
              <ChartTooltip 
                content={<ChartTooltipContent 
                  formatter={(value: any) => [config.format(value), config.label]}
                />} 
              />
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke={config.color}
                fill={config.color}
                fillOpacity={0.3}
                strokeWidth={2}
              />
              {showTrendLine && trendAnalysis && (
                <Line
                  type="monotone"
                  dataKey="trend"
                  stroke="#64748b"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </AreaChart>
          </ChartContainer>
        )

      case "bar":
        return (
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="displayDate" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (config.prefix === "$" && value >= 1000) {
                    return `$${(value / 1000).toFixed(1)}k`
                  }
                  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(1)
                }}
              />
              <ChartTooltip 
                content={<ChartTooltipContent 
                  formatter={(value: any) => [config.format(value), config.label]}
                />} 
              />
              <Bar
                dataKey={selectedMetric}
                fill={config.color}
                opacity={0.8}
                radius={[2, 2, 0, 0]}
              />
              {showTrendLine && trendAnalysis && (
                <Line
                  type="monotone"
                  dataKey="trend"
                  stroke="#64748b"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </BarChart>
          </ChartContainer>
        )

      default: // line
        return (
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="displayDate" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (config.prefix === "$" && value >= 1000) {
                    return `$${(value / 1000).toFixed(1)}k`
                  }
                  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(1)
                }}
              />
              <ChartTooltip 
                content={<ChartTooltipContent 
                  formatter={(value: any) => [config.format(value), config.label]}
                />} 
              />
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke={config.color}
                strokeWidth={3}
                dot={{ fill: config.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: config.color, strokeWidth: 2 }}
              />
              {showTrendLine && trendAnalysis && (
                <Line
                  type="monotone"
                  dataKey="trend"
                  stroke="#64748b"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ChartContainer>
        )
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8 min-h-[400px]">
          <Loader2 className="animate-spin h-8 w-8 text-primary mr-3" />
          <span className="text-muted-foreground">Loading performance trends...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh} className="ml-2">
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!processedData.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Performance Trends
          </CardTitle>
          <CardDescription>Track performance metrics over time</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No trend data available for the selected period.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Performance Trends
            </CardTitle>
            <CardDescription>
              Track {METRIC_CONFIG[selectedMetric].label.toLowerCase()} performance over time • {dateRange}
            </CardDescription>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <Select value={selectedMetric} onValueChange={(val) => setSelectedMetric(val as TrendMetric)}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METRIC_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={granularity} onValueChange={(val) => setGranularity(val as TimeGranularity)}>
              <SelectTrigger className="w-full sm:w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={chartType} onValueChange={(val) => setChartType(val as ChartType)}>
              <SelectTrigger className="w-full sm:w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="area">Area</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Trend Summary */}
        {trendAnalysis && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              {Math.abs(trendAnalysis.percentChange) < 5 ? (
                <Minus className="h-5 w-5 text-muted-foreground" />
              ) : trendAnalysis.isImproving ? (
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="text-sm font-medium">Trend</p>
                <p className={`text-lg font-bold ${
                  Math.abs(trendAnalysis.percentChange) < 5 ? "text-muted-foreground" :
                  trendAnalysis.isImproving ? "text-green-600" : "text-red-600"
                }`}>
                  {trendAnalysis.percentChange > 0 ? "+" : ""}{trendAnalysis.percentChange.toFixed(1)}%
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Current</p>
                <p className="text-lg font-bold">
                  {METRIC_CONFIG[selectedMetric].format(trendAnalysis.currentValue)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Activity className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Volatility</p>
                <p className="text-lg font-bold">{trendAnalysis.volatility.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {METRIC_CONFIG[selectedMetric].label} Trend
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTrendLine(!showTrendLine)}
              className="text-xs"
            >
              {showTrendLine ? "Hide" : "Show"} Trend Line
            </Button>
          </div>
          
          {renderChart()}
        </div>

        {/* Additional Insights */}
        {trendAnalysis && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Performance Summary
              </h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Period Change:</span>
                  <span className={`ml-2 font-medium ${
                    trendAnalysis.isImproving ? "text-green-600" : "text-red-600"
                  }`}>
                    {trendAnalysis.percentChange > 0 ? "+" : ""}{trendAnalysis.percentChange.toFixed(2)}%
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Trend Direction:</span>
                  <span className="ml-2 font-medium">
                    {Math.abs(trendAnalysis.percentChange) < 5 ? "Stable" :
                     trendAnalysis.isImproving ? "Improving" : "Declining"}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Data Points:</span>
                  <span className="ml-2 font-medium">{processedData.length}</span>
                </p>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Statistics
              </h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Volatility:</span>
                  <span className="ml-2 font-medium">
                    {trendAnalysis.volatility < 10 ? "Low" :
                     trendAnalysis.volatility < 25 ? "Medium" : "High"} ({trendAnalysis.volatility.toFixed(1)}%)
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Period:</span>
                  <span className="ml-2 font-medium capitalize">{granularity}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Chart Type:</span>
                  <span className="ml-2 font-medium capitalize">{chartType}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}