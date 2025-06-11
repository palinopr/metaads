"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CalendarDays, Clock, TrendingUp, TrendingDown, Zap } from "lucide-react"
import { formatCurrency, formatNumberWithCommas } from "@/lib/utils"

interface DayHourDataPoint {
  date: string
  dayOfWeek: number // 0 (Sun) - 6 (Sat)
  hour: number // 0-23
  spend: number
  revenue: number
  conversions: number
  roas: number
  impressions: number
  clicks: number
}

interface DayHourPerformanceProps {
  campaignId: string
  accessToken: string
  adAccountId: string
  datePreset?: string
}

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const hours = Array.from({ length: 24 }, (_, i) => i) // 0-23

type HeatmapMetric = "roas" | "revenue" | "conversions" | "spend"

export function DayHourPerformance({ campaignId, accessToken, adAccountId, datePreset = "last_30d" }: DayHourPerformanceProps) {
  const [data, setData] = useState<DayHourDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<HeatmapMetric>("roas")

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/meta/day-hour-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, accessToken, datePreset }),
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || "Failed to fetch day/hour performance data")
      }
      const result = await response.json()
      setData(result.dayHourData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [campaignId, accessToken, datePreset])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const aggregatedData: number[][] = Array(7)
    .fill(null)
    .map(() => Array(24).fill(0))
  const counts: number[][] = Array(7)
    .fill(null)
    .map(() => Array(24).fill(0))

  data.forEach((point) => {
    const value = point[selectedMetric]
    aggregatedData[point.dayOfWeek][point.hour] += value
    counts[point.dayOfWeek][point.hour] += 1
  })

  const heatmapData = aggregatedData.map((dayRow, dayIndex) =>
    dayRow.map((sum, hourIndex) => {
      const count = counts[dayIndex][hourIndex]
      if (count === 0) return 0
      // For ROAS and other ratios, average them. For sums (spend, revenue, conversions), use sum.
      return selectedMetric === "roas" || selectedMetric === "ctr" || selectedMetric === "cpc" ? sum / count : sum
    }),
  )

  const getCellColor = (value: number, metric: HeatmapMetric) => {
    if (value === 0 && counts.flat().reduce((a, b) => a + b, 0) > 0) return "bg-gray-700 opacity-50" // No data for this slot

    let maxVal = 0
    heatmapData.forEach((row) => row.forEach((cellVal) => (maxVal = Math.max(maxVal, cellVal))))
    if (maxVal === 0) return "bg-gray-600"

    const intensity = Math.min(1, value / (maxVal * 0.8)) // Cap intensity to avoid extreme contrast for outliers
    if (intensity < 0.01) return "bg-gray-600" // Very low values

    if (metric === "spend") {
      // For spend, higher is not necessarily "better"
      return `hsl(0, 70%, ${90 - intensity * 50}%)` // Reddish scale
    }
    // For ROAS, Revenue, Conversions - green scale
    return `hsl(120, 60%, ${90 - intensity * 50}%)` // Greenish scale
  }

  const getInsights = () => {
    if (!data.length) return { bestDayHour: null, worstDayHour: null, patterns: [] }

    let bestPerf = Number.NEGATIVE_INFINITY,
      worstPerf = Number.POSITIVE_INFINITY
    let bestDay = -1,
      bestHour = -1,
      worstDay = -1,
      worstHour = -1

    heatmapData.forEach((dayRow, dayIdx) => {
      dayRow.forEach((val, hourIdx) => {
        if (counts[dayIdx][hourIdx] > 0) {
          // Only consider slots with data
          if (selectedMetric === "spend") {
            // For spend, lower is "better" in terms of efficiency
            if (val < worstPerf) {
              worstPerf = val
              worstDay = dayIdx
              worstHour = hourIdx
            } // "Worst" spend = highest
            if (val > bestPerf && val > 0) {
              bestPerf = val
              bestDay = dayIdx
              bestHour = hourIdx
            } // "Best" spend = lowest non-zero
          } else {
            // For ROAS, revenue, conversions - higher is better
            if (val > bestPerf) {
              bestPerf = val
              bestDay = dayIdx
              bestHour = hourIdx
            }
            if (val < worstPerf) {
              worstPerf = val
              worstDay = dayIdx
              worstHour = hourIdx
            }
          }
        }
      })
    })

    // Adjust logic for "best" spend to be lowest, "worst" spend to be highest
    if (selectedMetric === "spend") {
      ;[bestPerf, worstPerf] = [worstPerf, bestPerf] // Swap
      ;[bestDay, worstDay] = [worstDay, bestDay]
      ;[bestHour, worstHour] = [worstHour, bestHour]
    }

    const patterns: string[] = []
    // Example pattern: Check if Fridays are significantly better
    const fridayAvg =
      heatmapData[5].reduce((sum, val, idx) => (counts[5][idx] > 0 ? sum + val / counts[5][idx] : sum), 0) /
      heatmapData[5].filter((_, idx) => counts[5][idx] > 0).length
    const overallAvg =
      heatmapData.flat().reduce((sum, val, idx) => {
        const day = Math.floor(idx / 24)
        const hour = idx % 24
        return counts[day][hour] > 0 ? sum + val / counts[day][hour] : sum
      }, 0) / heatmapData.flat().filter((_, idx) => counts[Math.floor(idx / 24)][idx % 24] > 0).length

    if (fridayAvg > overallAvg * 1.5 && selectedMetric !== "spend")
      patterns.push(`Fridays perform ~${(fridayAvg / overallAvg).toFixed(1)}x better than average.`)
    if (fridayAvg < overallAvg * 0.7 && selectedMetric === "spend")
      patterns.push(`Fridays have ~${(overallAvg / fridayAvg).toFixed(1)}x lower spend than average.`)

    return {
      bestDayHour:
        bestDay !== -1
          ? `${days[bestDay]} at ${bestHour}:00-${bestHour + 1}:00 (${formatMetric(bestPerf, selectedMetric)})`
          : "N/A",
      worstDayHour:
        worstDay !== -1
          ? `${days[worstDay]} at ${worstHour}:00-${worstHour + 1}:00 (${formatMetric(worstPerf, selectedMetric)})`
          : "N/A",
      patterns,
    }
  }

  const formatMetric = (value: number, metric: HeatmapMetric) => {
    if (metric === "roas") return `${value.toFixed(2)}x`
    if (metric === "revenue" || metric === "spend") return formatCurrency(value)
    return formatNumberWithCommas(Math.round(value))
  }

  const insights = getInsights()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[300px]">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
        <span className="ml-3 text-gray-400">Loading Day & Hour Performance...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}{" "}
          <button onClick={fetchData} className="ml-2 text-xs underline">
            Retry
          </button>
        </AlertDescription>
      </Alert>
    )
  }
  if (!data.length) {
    return (
      <Card className="bg-gray-800/70 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="mr-2 h-5 w-5 text-blue-400" /> Day & Hour Performance
          </CardTitle>
          <CardDescription>Performance breakdown by day of the week and hour of the day.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-10 text-gray-500">
          <Clock className="mx-auto h-10 w-10 mb-3" />
          No hourly performance data available for the selected period.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800/70 border-gray-700">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-400" /> Day & Hour Performance
            </CardTitle>
            <CardDescription>
              Heatmap of campaign performance by day of week and hour. ({selectedMetric.toUpperCase()})
            </CardDescription>
          </div>
          <Select value={selectedMetric} onValueChange={(val) => setSelectedMetric(val as HeatmapMetric)}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-700 border-gray-600 text-xs">
              <SelectValue placeholder="Select Metric" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="roas" className="text-xs">
                ROAS
              </SelectItem>
              <SelectItem value="revenue" className="text-xs">
                Revenue
              </SelectItem>
              <SelectItem value="conversions" className="text-xs">
                Conversions
              </SelectItem>
              <SelectItem value="spend" className="text-xs">
                Spend
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="p-1.5 border border-gray-700 bg-gray-750 text-xs w-[50px]">Day/Hr</th>
                {hours.map((hour) => (
                  <th key={hour} className="p-1.5 border border-gray-700 bg-gray-750 text-xs min-w-[30px]">
                    {String(hour).padStart(2, "0")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, dayIndex) => (
                <tr key={day}>
                  <td className="p-1.5 border border-gray-700 bg-gray-750 text-xs font-semibold">{day}</td>
                  {hours.map((hour, hourIndex) => (
                    <td
                      key={`${day}-${hour}`}
                      title={`${day} ${hour}:00 - ${formatMetric(heatmapData[dayIndex][hourIndex], selectedMetric)}`}
                      className={`p-1.5 border border-gray-700 text-center text-xs h-10 ${getCellColor(heatmapData[dayIndex][hourIndex], selectedMetric)}`}
                    >
                      {counts[dayIndex][hourIndex] > 0
                        ? formatMetric(heatmapData[dayIndex][hourIndex], selectedMetric)
                        : "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 space-y-3 text-sm">
          <h4 className="font-semibold text-md mb-2 flex items-center">
            <Zap className="mr-2 h-5 w-5 text-yellow-400" />
            Quick Insights:
          </h4>
          {insights.bestDayHour !== "N/A" && (
            <div className="flex items-center gap-2 p-2 bg-green-900/30 rounded-md">
              <TrendingUp className="h-5 w-5 text-green-400 flex-shrink-0" />
              <div>
                <strong>Best Performing Time ({selectedMetric}):</strong> {insights.bestDayHour}.
                {selectedMetric !== "spend" && (
                  <span className="text-xs text-gray-400 ml-1">Consider increasing budget or focus here.</span>
                )}
                {selectedMetric === "spend" && (
                  <span className="text-xs text-gray-400 ml-1">This is the lowest spend period.</span>
                )}
              </div>
            </div>
          )}
          {insights.worstDayHour !== "N/A" && (
            <div className="flex items-center gap-2 p-2 bg-red-900/30 rounded-md">
              <TrendingDown className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div>
                <strong>Worst Performing Time ({selectedMetric}):</strong> {insights.worstDayHour}.
                {selectedMetric !== "spend" && (
                  <span className="text-xs text-gray-400 ml-1">
                    Consider pausing or reducing budget during these times.
                  </span>
                )}
                {selectedMetric === "spend" && (
                  <span className="text-xs text-gray-400 ml-1">This is the highest spend period.</span>
                )}
              </div>
            </div>
          )}
          {insights.patterns.map((pattern, idx) => (
            <p key={idx} className="text-gray-300 p-2 bg-blue-900/30 rounded-md">
              {pattern}
            </p>
          ))}
          {insights.bestDayHour === "N/A" && insights.worstDayHour === "N/A" && insights.patterns.length === 0 && (
            <p className="text-gray-500">
              Not enough distinct data to generate specific insights for "{selectedMetric}".
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
