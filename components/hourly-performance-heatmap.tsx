"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Loader2, 
  AlertCircle, 
  CalendarDays, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Download,
  Info,
  Sun,
  Moon
} from "lucide-react"

interface HourlyPerformanceData {
  date: string
  dayOfWeek: number // 0 (Sun) - 6 (Sat)
  hour: number // 0-23
  spend: number
  revenue: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  roas: number
}

interface HourlyPerformanceHeatmapProps {
  data?: HourlyPerformanceData[]
  isLoading?: boolean
  error?: string | null
  onRefresh?: () => void
  dateRange?: string
  className?: string
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const HOURS = Array.from({ length: 24 }, (_, i) => i)

type HeatmapMetric = "roas" | "revenue" | "conversions" | "spend" | "ctr" | "cpc" | "impressions" | "clicks"

const METRIC_CONFIG = {
  roas: { label: "ROAS", color: "green", format: (val: number) => `${val.toFixed(2)}x`, higherIsBetter: true },
  revenue: { label: "Revenue", color: "green", format: (val: number) => `$${val.toLocaleString()}`, higherIsBetter: true },
  conversions: { label: "Conversions", color: "green", format: (val: number) => val.toLocaleString(), higherIsBetter: true },
  spend: { label: "Spend", color: "orange", format: (val: number) => `$${val.toLocaleString()}`, higherIsBetter: false },
  ctr: { label: "CTR", color: "blue", format: (val: number) => `${(val * 100).toFixed(2)}%`, higherIsBetter: true },
  cpc: { label: "CPC", color: "orange", format: (val: number) => `$${val.toFixed(2)}`, higherIsBetter: false },
  impressions: { label: "Impressions", color: "purple", format: (val: number) => val.toLocaleString(), higherIsBetter: true },
  clicks: { label: "Clicks", color: "blue", format: (val: number) => val.toLocaleString(), higherIsBetter: true },
}

export function HourlyPerformanceHeatmap({ 
  data = [], 
  isLoading = false, 
  error = null,
  onRefresh,
  dateRange = "Last 30 days",
  className 
}: HourlyPerformanceHeatmapProps) {
  const [selectedMetric, setSelectedMetric] = useState<HeatmapMetric>("roas")
  const [viewMode, setViewMode] = useState<"performance" | "volume">("performance")

  // Aggregate data into a 7x24 matrix
  const aggregatedData: number[][] = Array(7).fill(null).map(() => Array(24).fill(0))
  const counts: number[][] = Array(7).fill(null).map(() => Array(24).fill(0))

  data.forEach((point) => {
    const value = point[selectedMetric]
    if (typeof value === "number" && !isNaN(value)) {
      aggregatedData[point.dayOfWeek][point.hour] += value
      counts[point.dayOfWeek][point.hour] += 1
    }
  })

  // Calculate heatmap values (average for rates, sum for counts)
  const heatmapData = aggregatedData.map((dayRow, dayIndex) =>
    dayRow.map((sum, hourIndex) => {
      const count = counts[dayIndex][hourIndex]
      if (count === 0) return 0
      
      // For rates (ROAS, CTR, CPC), use average; for counts/amounts, use sum
      const isRate = ["roas", "ctr", "cpc"].includes(selectedMetric)
      return isRate ? sum / count : sum
    })
  )

  // Get color for heatmap cell
  const getCellColor = (value: number, metric: HeatmapMetric): string => {
    if (value === 0) return "bg-slate-700 opacity-50"

    const flatData = heatmapData.flat().filter(v => v > 0)
    if (flatData.length === 0) return "bg-slate-600"

    const maxVal = Math.max(...flatData)
    const minVal = Math.min(...flatData)
    
    if (maxVal === minVal) return "bg-slate-600"

    const intensity = (value - minVal) / (maxVal - minVal)
    const config = METRIC_CONFIG[metric]
    
    // Color mapping based on metric type
    switch (config.color) {
      case "green":
        return `hsl(120, ${60 + intensity * 20}%, ${85 - intensity * 45}%)`
      case "orange":
        return `hsl(30, ${60 + intensity * 20}%, ${85 - intensity * 45}%)`
      case "blue":
        return `hsl(220, ${60 + intensity * 20}%, ${85 - intensity * 45}%)`
      case "purple":
        return `hsl(270, ${60 + intensity * 20}%, ${85 - intensity * 45}%)`
      default:
        return `hsl(200, ${60 + intensity * 20}%, ${85 - intensity * 45}%)`
    }
  }

  // Generate insights
  const getInsights = () => {
    if (data.length === 0) return { peak: null, low: null, patterns: [] }

    let peakValue = Number.NEGATIVE_INFINITY
    let lowValue = Number.POSITIVE_INFINITY
    let peakTime = ""
    let lowTime = ""

    const config = METRIC_CONFIG[selectedMetric]

    heatmapData.forEach((dayRow, dayIdx) => {
      dayRow.forEach((value, hourIdx) => {
        if (counts[dayIdx][hourIdx] > 0 && value > 0) {
          if (config.higherIsBetter) {
            if (value > peakValue) {
              peakValue = value
              peakTime = `${DAYS[dayIdx]} at ${hourIdx}:00-${hourIdx + 1}:00`
            }
            if (value < lowValue) {
              lowValue = value
              lowTime = `${DAYS[dayIdx]} at ${hourIdx}:00-${hourIdx + 1}:00`
            }
          } else {
            if (value < peakValue || peakValue === Number.NEGATIVE_INFINITY) {
              peakValue = value
              peakTime = `${DAYS[dayIdx]} at ${hourIdx}:00-${hourIdx + 1}:00`
            }
            if (value > lowValue || lowValue === Number.POSITIVE_INFINITY) {
              lowValue = value
              lowTime = `${DAYS[dayIdx]} at ${hourIdx}:00-${hourIdx + 1}:00`
            }
          }
        }
      })
    })

    // Generate patterns
    const patterns: string[] = []
    
    // Weekend vs weekday analysis
    const weekendData = [0, 6].flatMap(day => heatmapData[day].filter((_, hour) => counts[day][hour] > 0))
    const weekdayData = [1, 2, 3, 4, 5].flatMap(day => heatmapData[day].filter((_, hour) => counts[day][hour] > 0))
    
    if (weekendData.length > 0 && weekdayData.length > 0) {
      const weekendAvg = weekendData.reduce((a, b) => a + b, 0) / weekendData.length
      const weekdayAvg = weekdayData.reduce((a, b) => a + b, 0) / weekdayData.length
      
      if (Math.abs(weekendAvg - weekdayAvg) / Math.max(weekendAvg, weekdayAvg) > 0.2) {
        const better = config.higherIsBetter ? 
          (weekendAvg > weekdayAvg ? "weekends" : "weekdays") :
          (weekendAvg < weekdayAvg ? "weekends" : "weekdays")
        patterns.push(`${better === "weekends" ? "Weekends" : "Weekdays"} show significantly better ${config.label.toLowerCase()} performance`)
      }
    }

    // Day/night analysis
    const dayHours = [9, 10, 11, 12, 13, 14, 15, 16, 17] // 9 AM - 5 PM
    const nightHours = [20, 21, 22, 23, 0, 1, 2, 3, 4, 5] // 8 PM - 5 AM
    
    const dayData = DAYS.flatMap((_, dayIdx) => 
      dayHours.map(hour => heatmapData[dayIdx][hour]).filter((_, idx) => counts[dayIdx][dayHours[idx]] > 0)
    )
    const nightData = DAYS.flatMap((_, dayIdx) => 
      nightHours.map(hour => heatmapData[dayIdx][hour]).filter((_, idx) => counts[dayIdx][nightHours[idx]] > 0)
    )

    if (dayData.length > 0 && nightData.length > 0) {
      const dayAvg = dayData.reduce((a, b) => a + b, 0) / dayData.length
      const nightAvg = nightData.reduce((a, b) => a + b, 0) / nightData.length
      
      if (Math.abs(dayAvg - nightAvg) / Math.max(dayAvg, nightAvg) > 0.3) {
        const better = config.higherIsBetter ? 
          (dayAvg > nightAvg ? "daytime" : "nighttime") :
          (dayAvg < nightAvg ? "daytime" : "nighttime")
        patterns.push(`${better === "daytime" ? "Daytime" : "Nighttime"} hours (${better === "daytime" ? "9 AM-5 PM" : "8 PM-5 AM"}) perform notably better`)
      }
    }

    return {
      peak: peakTime ? `${peakTime} (${config.format(peakValue)})` : null,
      low: lowTime ? `${lowTime} (${config.format(lowValue)})` : null,
      patterns
    }
  }

  const insights = getInsights()

  // Export functionality
  const handleExport = () => {
    const csvData = [
      ["Day", "Hour", ...Object.keys(METRIC_CONFIG).map(k => METRIC_CONFIG[k as HeatmapMetric].label)],
      ...DAYS.flatMap((day, dayIdx) =>
        HOURS.map(hour => [
          day,
          `${hour}:00-${hour + 1}:00`,
          ...Object.keys(METRIC_CONFIG).map(metric => {
            const value = heatmapData[dayIdx][hour]
            const count = counts[dayIdx][hour]
            return count > 0 ? value.toString() : "0"
          })
        ])
      )
    ]

    const csvContent = csvData.map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `hourly-performance-heatmap-${selectedMetric}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8 min-h-[400px]">
          <Loader2 className="animate-spin h-8 w-8 text-primary mr-3" />
          <span className="text-muted-foreground">Loading hourly performance data...</span>
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

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Hourly Performance Heatmap
          </CardTitle>
          <CardDescription>Performance patterns by day of week and hour of day</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No performance data available for the selected period.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Hourly Performance Heatmap
            </CardTitle>
            <CardDescription>
              Performance patterns by day of week and hour of day • {dateRange}
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={selectedMetric} onValueChange={(val) => setSelectedMetric(val as HeatmapMetric)}>
              <SelectTrigger className="w-full sm:w-[140px]">
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
            <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Heatmap */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-25 gap-px bg-border p-1 rounded-lg">
              {/* Header row */}
              <div className="bg-muted text-muted-foreground text-xs font-medium p-2 rounded-sm flex items-center justify-center">
                Day/Hour
              </div>
              {HOURS.map((hour) => (
                <div key={hour} className="bg-muted text-muted-foreground text-xs font-medium p-2 rounded-sm text-center">
                  {hour.toString().padStart(2, "0")}
                </div>
              ))}
              
              {/* Data rows */}
              {DAYS.map((day, dayIndex) => (
                <div key={`row-${day}`} className="contents">
                  <div className="bg-muted text-muted-foreground text-xs font-medium p-2 rounded-sm flex items-center justify-center">
                    {day}
                  </div>
                  {HOURS.map((hour) => {
                    const value = heatmapData[dayIndex][hour]
                    const count = counts[dayIndex][hour]
                    const config = METRIC_CONFIG[selectedMetric]
                    
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className="relative p-2 rounded-sm text-xs font-medium text-center transition-all hover:scale-105 hover:z-10 hover:shadow-lg cursor-pointer"
                        style={{ backgroundColor: getCellColor(value, selectedMetric) }}
                        title={`${day} ${hour}:00-${hour + 1}:00\n${config.label}: ${count > 0 ? config.format(value) : "No data"}`}
                      >
                        {count > 0 ? (
                          <span className="text-slate-900 font-semibold">
                            {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : 
                             value >= 1 ? value.toFixed(1) : 
                             value.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-700 opacity-50 rounded"></div>
            <span>No data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getCellColor(1, selectedMetric) }}></div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getCellColor(100, selectedMetric) }}></div>
            <span>High</span>
          </div>
        </div>

        {/* Insights */}
        {(insights.peak || insights.low || insights.patterns.length > 0) && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Key Insights
            </h4>
            
            <div className="grid gap-3 sm:grid-cols-2">
              {insights.peak && (
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {METRIC_CONFIG[selectedMetric].higherIsBetter ? "Peak Performance" : "Most Efficient"}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">{insights.peak}</p>
                  </div>
                </div>
              )}
              
              {insights.low && (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      {METRIC_CONFIG[selectedMetric].higherIsBetter ? "Lowest Performance" : "Highest Cost"}
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300">{insights.low}</p>
                  </div>
                </div>
              )}
            </div>

            {insights.patterns.length > 0 && (
              <div className="space-y-2">
                {insights.patterns.map((pattern, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    {pattern.includes("daytime") || pattern.includes("Daytime") ? (
                      <Sun className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Moon className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className="text-sm text-blue-800 dark:text-blue-200">{pattern}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}