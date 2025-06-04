"use client"

// components/day-week-performance.tsx
import { useState, useEffect } from "react"
import { Calendar, TrendingUp, DollarSign } from "lucide-react"

interface HourlyDataPoint {
  dayOfWeek: string
  hour: number
  spend: number
  revenue: number
  roas: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
}

interface DayWeekPerformanceProps {
  campaignId: string
  campaignName: string
  accessToken: string
  datePreset: string
}

export function DayWeekPerformance({ campaignId, campaignName, accessToken, datePreset }: DayWeekPerformanceProps) {
  const [heatmapData, setHeatmapData] = useState<HourlyDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [insights, setInsights] = useState<any>(null)

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const hours = Array.from({ length: 24 }, (_, i) => i)

  useEffect(() => {
    if (campaignId && accessToken && datePreset) {
      // Added datePreset to dependency array and check
      fetchDayWeekData()
    }
  }, [campaignId, accessToken, datePreset]) // Added datePreset to dependency array

  const fetchDayWeekData = async () => {
    setIsLoading(true)
    setError(null)
    setInsights(null) // Reset insights on new fetch

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
      setHeatmapData(data.heatmapData || []) // Ensure heatmapData is an array
      setInsights(data.insights)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const createHeatmapMatrix = () => {
    const matrix: any = {}
    daysOfWeek.forEach((day) => {
      matrix[day] = {}
      hours.forEach((hour) => {
        matrix[day][hour] = { roas: 0, spend: 0, revenue: 0, conversions: 0 }
      })
    })

    if (Array.isArray(heatmapData)) {
      // Ensure heatmapData is an array before processing
      heatmapData.forEach((point) => {
        if (matrix[point.dayOfWeek] && typeof matrix[point.dayOfWeek][point.hour] !== "undefined") {
          // Check if hour exists
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
    if (roas === 0 || typeof roas !== "number" || isNaN(roas)) return "bg-gray-800" // Handle NaN/undefined roas
    if (roas < 1) return "bg-red-900"
    if (roas < 3) return "bg-red-700"
    if (roas < 5) return "bg-yellow-700"
    if (roas < 10) return "bg-green-700"
    if (roas < 20) return "bg-green-800"
    return "bg-green-900"
  }

  const formatHour = (hour: number) => {
    if (hour === 0) return "12am"
    if (hour < 12) return `${hour}am`
    if (hour === 12) return "12pm"
    return `${hour - 12}pm`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-400">Analyzing performance patterns...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 rounded-lg p-4 border border-red-700">
        <p className="text-red-400">Failed to load performance data: {error}</p>
      </div>
    )
  }

  const heatmapMatrix = createHeatmapMatrix()

  return (
    <div className="space-y-6 p-4 bg-gray-900 text-white rounded-lg">
      {" "}
      {/* Added padding and background */}
      {/* Performance Heatmap */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          Performance Heatmap (ROAS by Day/Hour)
        </h3>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Hour labels */}
            <div className="flex items-center mb-2">
              <div className="w-24 shrink-0"></div> {/* Added shrink-0 */}
              {hours.map((hour) => (
                <div key={hour} className="flex-1 text-center text-xs text-gray-400 min-w-[30px]">
                  {" "}
                  {/* Added min-w */}
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Heatmap rows */}
            {daysOfWeek.map((day) => (
              <div key={day} className="flex items-center mb-1">
                <div className="w-24 text-sm font-medium text-gray-300 shrink-0">{day}</div> {/* Added shrink-0 */}
                {hours.map((hour) => {
                  const data = heatmapMatrix[day]?.[hour] || { roas: 0, spend: 0, revenue: 0, conversions: 0 } // Added fallback
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={`flex-1 h-8 mx-0.5 rounded ${getHeatmapColor(data.roas)} relative group cursor-pointer min-w-[30px]`} // Added min-w
                      title={`${day} ${formatHour(hour)}: ${data.roas?.toFixed(2) || "0.00"}x ROAS, $${data.spend?.toFixed(0) || "0"} spend`}
                    >
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-950 border border-gray-700 rounded shadow-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        {" "}
                        {/* Darker tooltip */}
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

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          {" "}
          {/* Added flex-wrap and gap-y */}
          <span className="text-gray-400">ROAS Scale:</span>
          {[
            { color: "bg-gray-800", label: "0x" },
            { color: "bg-red-900", label: "<1x" },
            { color: "bg-red-700", label: "1-3x" }, // Adjusted legend
            { color: "bg-yellow-700", label: "3-5x" }, // Adjusted legend
            { color: "bg-green-700", label: "5-10x" },
            { color: "bg-green-800", label: "10-20x" }, // Adjusted legend
            { color: "bg-green-900", label: ">20x" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <div className={`w-3 h-3 ${item.color} rounded-sm`}></div> {/* Smaller legend squares */}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      {insights && (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-700/50">
          {" "}
          {/* Adjusted opacity */}
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Performance Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 text-green-400">🎯 Best Times to Run Ads</h4>
              {insights.bestTimes?.length > 0 ? (
                <div className="space-y-2">
                  {insights.bestTimes.slice(0, 5).map((time: any, index: number) => (
                    <div key={`best-${index}`} className="flex items-center justify-between text-sm">
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
                <p className="text-sm text-gray-500">Not enough data for best times.</p>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-3 text-red-400">⚠️ Times to Avoid/Reduce</h4>
              {insights.worstTimes?.length > 0 ? (
                <div className="space-y-2">
                  {insights.worstTimes.slice(0, 5).map((time: any, index: number) => (
                    <div key={`worst-${index}`} className="flex items-center justify-between text-sm">
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
                <p className="text-sm text-gray-500">Not enough data for worst times.</p>
              )}
            </div>
          </div>
          <div className="mt-6">
            <h4 className="font-medium mb-3">📊 Day of Week Performance</h4>
            {insights.dayPerformance?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {" "}
                {/* Responsive grid */}
                {insights.dayPerformance.map((day: any) => (
                  <div key={day.day} className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400">{day.day.slice(0, 3)}</div>
                    <div
                      className={`text-lg font-bold ${day.avgRoas > 10 ? "text-green-400" : day.avgRoas > 3 ? "text-yellow-400" : day.avgRoas > 0 ? "text-red-400" : "text-gray-500"}`}
                    >
                      {" "}
                      {/* Adjusted colors */}
                      {day.avgRoas?.toFixed(1) || "0.0"}x
                    </div>
                    <div className="text-xs text-gray-400">${day.totalSpend?.toFixed(0) || "0"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Not enough data for day performance.</p>
            )}
          </div>
          <div className="mt-6 space-y-3">
            <h4 className="font-medium">💡 Recommendations</h4>
            {insights.recommendations?.length > 0 ? (
              insights.recommendations.map((rec: string, index: number) => (
                <div key={`rec-${index}`} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-400 shrink-0">•</span> {/* Added shrink-0 */}
                  <span className="text-gray-300">{rec}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No specific recommendations at this time.</p>
            )}
          </div>
        </div>
      )}
      {insights &&
        (insights.bestDayTime || insights.worstDayTime) && ( // Check if data exists
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              Budget Optimization Strategy
            </h3>

            <div className="space-y-4">
              {insights.bestDayTime && (
                <div className="p-4 bg-green-900/30 rounded-lg border border-green-700/50">
                  {" "}
                  {/* Adjusted opacity */}
                  <h4 className="font-medium text-green-400 mb-2">Consider Increasing Budget During:</h4>
                  <p className="text-sm text-gray-300">
                    {`${insights.bestDayTime.day}s ${formatHour(insights.bestDayTime.hour)} - ${formatHour((insights.bestDayTime.hour + 2) % 24)}`}
                    - Historical ROAS: {insights.bestDayTime.roas?.toFixed(1) || "0.0"}x
                  </p>
                </div>
              )}

              {insights.worstDayTime && (
                <div className="p-4 bg-red-900/30 rounded-lg border border-red-700/50">
                  {" "}
                  {/* Adjusted opacity */}
                  <h4 className="font-medium text-red-400 mb-2">Consider Reducing/Pausing During:</h4>
                  <p className="text-sm text-gray-300">
                    {`${insights.worstDayTime.day}s ${formatHour(insights.worstDayTime.hour)} - ${formatHour((insights.worstDayTime.hour + 2) % 24)}`}
                    - Historical ROAS: {insights.worstDayTime.roas?.toFixed(1) || "0.0"}x
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  )
}
