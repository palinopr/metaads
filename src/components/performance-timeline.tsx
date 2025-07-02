"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, TrendingUp, TrendingDown } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PerformanceTimelineProps {
  campaignId: string
  dateRange?: {
    start: string
    end: string
  }
}

interface TimeSeriesData {
  date: string
  impressions: number
  clicks: number
  spend: number
  conversions: number
  ctr: number
  cpc: number
  cpm: number
}

export function PerformanceTimeline({ campaignId, dateRange }: PerformanceTimelineProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TimeSeriesData[]>([])
  const [metrics, setMetrics] = useState<string[]>(["impressions", "clicks"])
  const [aggregation, setAggregation] = useState<"daily" | "weekly" | "monthly">("daily")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchPerformanceData()
  }, [campaignId, dateRange, aggregation])

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      setError("")

      const params = new URLSearchParams({
        ...(dateRange?.start && { startDate: dateRange.start }),
        ...(dateRange?.end && { endDate: dateRange.end }),
        aggregation,
        includeTimeSeries: "true"
      })

      const response = await fetch(`/api/campaigns/${campaignId}/insights?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch performance data")
      }

      // Transform the data for the chart
      const timeSeriesData = result.timeSeries || []
      setData(timeSeriesData.map((item: any) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        impressions: item.impressions || 0,
        clicks: item.clicks || 0,
        spend: item.spend / 100 || 0,
        conversions: item.conversions || 0,
        ctr: item.ctr / 100 || 0,
        cpc: item.clicks > 0 ? (item.spend / item.clicks / 100) : 0,
        cpm: item.impressions > 0 ? (item.spend / item.impressions * 1000 / 100) : 0
      })))
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const metricConfig = {
    impressions: { color: "#3B82F6", label: "Impressions", format: (v: number) => v.toLocaleString() },
    clicks: { color: "#8B5CF6", label: "Clicks", format: (v: number) => v.toLocaleString() },
    spend: { color: "#EC4899", label: "Spend", format: (v: number) => `$${v.toFixed(2)}` },
    conversions: { color: "#10B981", label: "Conversions", format: (v: number) => v.toLocaleString() },
    ctr: { color: "#F59E0B", label: "CTR %", format: (v: number) => `${v.toFixed(2)}%` },
    cpc: { color: "#EF4444", label: "CPC", format: (v: number) => `$${v.toFixed(2)}` },
    cpm: { color: "#6366F1", label: "CPM", format: (v: number) => `$${v.toFixed(2)}` }
  }

  const availableMetrics = Object.keys(metricConfig)

  const toggleMetric = (metric: string) => {
    setMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPerformanceData}
            className="mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Calculate trend for selected metrics
  const calculateTrend = (metric: string) => {
    if (data.length < 2) return 0
    const recent = data[data.length - 1][metric as keyof TimeSeriesData] as number
    const previous = data[data.length - 2][metric as keyof TimeSeriesData] as number
    return previous !== 0 ? ((recent - previous) / previous) * 100 : 0
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {availableMetrics.map(metric => (
            <Button
              key={metric}
              variant={metrics.includes(metric) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleMetric(metric)}
            >
              {metricConfig[metric as keyof typeof metricConfig].label}
            </Button>
          ))}
        </div>
        <Select value={aggregation} onValueChange={(value: any) => setAggregation(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map(metric => {
          const config = metricConfig[metric as keyof typeof metricConfig]
          const trend = calculateTrend(metric)
          const latestValue = data.length > 0 ? data[data.length - 1][metric as keyof TimeSeriesData] as number : 0
          
          return (
            <Card key={metric}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{config.format(latestValue)}</div>
                <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {Math.abs(trend).toFixed(1)}% vs previous
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Over Time</CardTitle>
          <CardDescription>
            Track your selected metrics over the date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  const config = metricConfig[name as keyof typeof metricConfig]
                  return config ? config.format(value) : value
                }}
              />
              <Legend />
              {metrics.map(metric => (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={metricConfig[metric as keyof typeof metricConfig].color}
                  name={metricConfig[metric as keyof typeof metricConfig].label}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Volume Chart */}
      {(metrics.includes("impressions") || metrics.includes("clicks")) && (
        <Card>
          <CardHeader>
            <CardTitle>Volume Trends</CardTitle>
            <CardDescription>
              Impressions and clicks volume over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {metrics.includes("impressions") && (
                  <Area
                    type="monotone"
                    dataKey="impressions"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                    name="Impressions"
                  />
                )}
                {metrics.includes("clicks") && (
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.3}
                    name="Clicks"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPerformanceData}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>
    </div>
  )
}