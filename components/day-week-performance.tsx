"use client"

import { useState, useEffect, useCallback } from "react" // Added useCallback
import { Calendar, TrendingUp, DollarSign, Loader2 } from "lucide-react" // Added Loader2

interface HourlyDataPoint {
  dayOfWeek: string
  hour: number
  spend: number
  revenue: number
  roas: number
  conversions: number
  impressions?: number // Optional as not used in heatmap directly
  clicks?: number // Optional
  ctr?: number // Optional
}

interface DayWeekPerformanceProps {
  campaignId: string
  campaignName: string // Used for context, can be optional if not displayed
  accessToken: string
  datePreset: string
}

export function DayWeekPerformance({ campaignId, campaignName, accessToken, datePreset }: DayWeekPerformanceProps) {
  const [heatmapData, setHeatmapData] = useState<HourlyDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [insights, setInsights] = useState<any>(null) // Consider defining a type for insights

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const fetchDayWeekData = useCallback(async () => {
    // Added useCallback
    if (!campaignId || !accessToken || !datePreset) {
      setError("Missing required parameters for fetching day/week data.")
      return
    }
    setIsLoading(true)
    setError(null)
    setInsights(null)

    try {
      const response = await fetch("/api/meta/day-week-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, accessToken, datePreset }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch day/week data" }))
        throw new Error(errorData.message || "Failed to fetch day/week data")
      }

      const data = await response.json()
      setHeatmapData(data.heatmapData || [])
      setInsights(data.insights)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [campaignId, accessToken, datePreset]) // Added dependencies

  useEffect(() => {
    fetchDayWeekData()
  }, [fetchDayWeekData]) // Use memoized function

  const createHeatmapMatrix = () => {
    const matrix: any = {}
    daysOfWeek.forEach((day) => {
      matrix[day] = {}
      hours.forEach((hour) => {
        matrix[day][hour] = { roas: 0, spend: 0, revenue: 0, conversions: 0 }
      })
    })

    if (Array.isArray(heatmapData)) {
      heatmapData.forEach((point) => {
        if (matrix[point.dayOfWeek] && typeof matrix[point.dayOfWeek][point.hour] !== "undefined") {
          matrix[point.dayOfWeek][point.hour] = {
            roas: point.roas,
            spend: point.spend,
            revenue: point.revenue,
            conversions: point.conversions,
          }
        }
      })
    }
    return matrix
  }

  const getHeatmapColor = (roas: number) => {
    if (roas === 0 || typeof roas !== "number" || isNaN(roas)) return "bg-gray-800 hover:bg-gray-700"
    if (roas < 1) return "bg-red-900 hover:bg-red-800"
    if (roas < 3) return "bg-red-700 hover:bg-red-600"
    if (roas < 5) return "bg-yellow-700 hover:bg-yellow-600"
    if (roas < 10) return "bg-green-700 hover:bg-green-600"
    if (roas < 20) return "bg-green-800 hover:bg-green-700"
    return "bg-green-900 hover:bg-green-800"
  }

  const formatHour = (hour: number) => {
    if (hour === 0) return "12am"
    if (hour < 12) return `${hour}am`
    if (hour === 12) return "12pm"
    return `${hour - 12}pm`
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
        <Loader2 className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 text-blue-500" />
        <span className="ml-2 mt-3 text-gray-400 text-sm">Analyzing performance patterns...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 rounded-lg p-4 border border-red-700/50 text-sm">
        <p className="text-red-400">Failed to load performance data: {error}</p>
        <button onClick={fetchDayWeekData} className="mt-1 text-xs text-blue-400 hover:underline">
          Try again
        </button>
      </div>
    )
  }

  const heatmapMatrix = createHeatmapMatrix()

  return (
    <div className="space-y-6 p-3 md:p-4 bg-gray-800/50 text-white rounded-lg border border-gray-700/80">
      <div className="bg-gray-800/70 rounded-lg p-4 md:p-6 border border-gray-700">
        <h3 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
          Performance Heatmap (ROAS by Day/Hour)
        </h3>
        <div className="overflow-x-auto">
          <div className="min-w-[700px] md:min-w-[800px]">
            <div className="flex items-center mb-1.5">
              <div className="w-20 md:w-24 shrink-0"></div>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center text-[10px] md:text-xs text-gray-400 min-w-[24px] md:min-w-[30px]"
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>
            {daysOfWeek.map((day) => (
              <div key={day} className="flex items-center mb-0.5 md:mb-1">
                <div className="w-20 md:w-24 text-xs md:text-sm font-medium text-gray-300 shrink-0">
                  {day.slice(0, 3)}
                </div>
                {hours.map((hour) => {
                  const data = heatmapMatrix[day]?.[hour] || { roas: 0, spend: 0, revenue: 0, conversions: 0 }
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={`flex-1 h-6 md:h-8 mx-px md:mx-0.5 rounded-sm ${getHeatmapColor(data.roas)} relative group cursor-pointer min-w-[24px] md:min-w-[30px] transition-colors duration-150`}
                    >
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 p-1.5 bg-gray-950 border border-gray-600 rounded shadow-lg text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        <div className="font-semibold">
                          {day} {formatHour(hour)}
                        </div>
                        <div>ROAS: {data.roas?.toFixed(2) || "N/A"}x</div>
                        <div>Spend: ${data.spend?.toFixed(0) || "N/A"}</div>
                        <div>Revenue: ${data.revenue?.toFixed(0) || "N/A"}</div>
                        <div>Conv: {data.conversions || "N/A"}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] md:text-xs">
          <span className="text-gray-400">ROAS Scale:</span>
          {[
            { color: "bg-gray-800", label: "0x" },
            { color: "bg-red-900", label: "<1x" },
            { color: "bg-red-700", label: "1-3x" },
            { color: "bg-yellow-700", label: "3-5x" },
            { color: "bg-green-700", label: "5-10x" },
            { color: "bg-green-800", label: "10-20x" },
            { color: "bg-green-900", label: ">20x" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <div className={`w-2.5 h-2.5 ${item.color} rounded-sm`}></div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {insights && (
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-lg p-4 md:p-6 border border-blue-700/60">
          <h3 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
            Performance Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-xs md:text-sm">
            <div>
              <h4 className="font-medium mb-2 text-green-300">🎯 Best Times to Run Ads</h4>
              {insights.bestTimes?.length > 0 ? (
                <div className="space-y-1.5">
                  {insights.bestTimes.slice(0, 3).map((time: any, index: number) => (
                    <div key={`best-${index}`} className="flex items-center justify-between">
                      <span>
                        {time.day} {formatHour(time.hour)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">{time.roas?.toFixed(1) || "0.0"}x ROAS</span>
                        <span className="text-gray-400">${time.spend?.toFixed(0) || "0"} spend</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Not enough data for best times.</p>
              )}
            </div>
            <div>
              <h4 className="font-medium mb-2 text-red-300">⚠️ Times to Avoid/Reduce</h4>
              {insights.worstTimes?.length > 0 ? (
                <div className="space-y-1.5">
                  {insights.worstTimes.slice(0, 3).map((time: any, index: number) => (
                    <div key={`worst-${index}`} className="flex items-center justify-between">
                      <span>
                        {time.day} {formatHour(time.hour)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400">{time.roas?.toFixed(1) || "0.0"}x ROAS</span>
                        <span className="text-gray-400">${time.spend?.toFixed(0) || "0"} spend</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Not enough data for worst times.</p>
              )}
            </div>
          </div>

          {insights.dayPerformance?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2 text-sm md:text-base">📊 Day of Week Performance</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 md:gap-2">
                {insights.dayPerformance.map((day: any) => (
                  <div key={day.day} className="bg-gray-800/70 rounded-md p-2 text-center text-xs">
                    <div className="text-gray-400">{day.day.slice(0, 3)}</div>
                    <div
                      className={`text-sm md:text-base font-bold ${day.avgRoas > 5 ? "text-green-400" : day.avgRoas > 2 ? "text-yellow-400" : day.avgRoas > 0 ? "text-red-400" : "text-gray-500"}`}
                    >
                      {day.avgRoas?.toFixed(1) || "0.0"}x
                    </div>
                    <div className="text-gray-400">${day.totalSpend?.toFixed(0) || "0"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights.recommendations?.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-sm md:text-base">💡 Recommendations</h4>
              {insights.recommendations.map((rec: string, index: number) => (
                <div key={`rec-${index}`} className="flex items-start gap-1.5 text-xs md:text-sm">
                  <span className="text-blue-400 shrink-0 mt-0.5">•</span>
                  <span className="text-gray-300">{rec}</span>
                </div>
              ))}
            </div>
          )}

          {(insights.bestDayTime || insights.worstDayTime) && (
            <div className="mt-4 bg-gray-800/70 rounded-lg p-3 md:p-4 border border-gray-700">
              <h4 className="text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                Budget Optimization Strategy
              </h4>
              <div className="space-y-2 text-xs md:text-sm">
                {insights.bestDayTime && (
                  <div className="p-2 bg-green-900/40 rounded-md border border-green-700/60">
                    <h5 className="font-medium text-green-300 mb-1">Consider Increasing Budget During:</h5>
                    <p className="text-gray-300">
                      {`${insights.bestDayTime.day}s ${formatHour(insights.bestDayTime.hour)} - ${formatHour((insights.bestDayTime.hour + 2) % 24)}`}
                      - Hist. ROAS: {insights.bestDayTime.roas?.toFixed(1) || "0.0"}x
                    </p>
                  </div>
                )}
                {insights.worstDayTime && (
                  <div className="p-2 bg-red-900/40 rounded-md border border-red-700/60">
                    <h5 className="font-medium text-red-300 mb-1">Consider Reducing/Pausing During:</h5>
                    <p className="text-gray-300">
                      {`${insights.worstDayTime.day}s ${formatHour(insights.worstDayTime.hour)} - ${formatHour((insights.worstDayTime.hour + 2) % 24)}`}
                      - Hist. ROAS: {insights.worstDayTime.roas?.toFixed(1) || "0.0"}x
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
