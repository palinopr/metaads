import {
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { TrendingUp, TrendingDown, AlertTriangle, Target } from "lucide-react"
import { formatCurrency, formatNumberWithCommas } from "@/lib/utils" // Assuming you have these

interface HistoricalDataPoint {
  date: string // YYYY-MM-DD
  spend: number
  revenue: number
  roas: number
  conversions: number
}

interface PredictionDataPoint extends HistoricalDataPoint {
  type: "historical" | "prediction"
  confidence?: number
  spendUpper?: number
  spendLower?: number
  revenueUpper?: number
  revenueLower?: number
}

interface CampaignPredictionsProps {
  campaignName: string
  historicalData: HistoricalDataPoint[] // Expects already processed historical data
  currentMetrics: {
    // Overall metrics for the selected period
    spend: number
    revenue: number
    roas: number
    conversions: number
  }
}

export function CampaignPredictions({ campaignName, historicalData, currentMetrics }: CampaignPredictionsProps) {
  // Calculate growth rate and predictions
  const calculatePredictions = (): PredictionDataPoint[] => {
    if (!historicalData || historicalData.length < 7) return []

    // Use last 7 to 30 days for growth rate calculation
    const recentData = historicalData.slice(-Math.min(30, historicalData.length))
    if (recentData.length < 2) return [] // Need at least 2 points for growth

    let totalSpendGrowth = 0
    let spendGrowthCount = 0
    let totalRevenueGrowth = 0
    let revenueGrowthCount = 0
    let totalConversionsGrowth = 0
    let conversionsGrowthCount = 0

    for (let i = 1; i < recentData.length; i++) {
      if (recentData[i - 1].spend > 0) {
        const dailySpendGrowth = (recentData[i].spend - recentData[i - 1].spend) / recentData[i - 1].spend
        totalSpendGrowth += dailySpendGrowth
        spendGrowthCount++
      }
      if (recentData[i - 1].revenue > 0) {
        // Avoid division by zero for revenue growth
        const dailyRevenueGrowth = (recentData[i].revenue - recentData[i - 1].revenue) / recentData[i - 1].revenue
        totalRevenueGrowth += dailyRevenueGrowth
        revenueGrowthCount++
      }
      if (recentData[i - 1].conversions > 0) {
        const dailyConversionsGrowth =
          (recentData[i].conversions - recentData[i - 1].conversions) / recentData[i - 1].conversions
        totalConversionsGrowth += dailyConversionsGrowth
        conversionsGrowthCount++
      }
    }

    const avgSpendGrowthRate = spendGrowthCount > 0 ? totalSpendGrowth / spendGrowthCount : 0.01 // Default 1% growth if no data
    const avgRevenueGrowthRate =
      revenueGrowthCount > 0 ? totalRevenueGrowth / revenueGrowthCount : avgSpendGrowthRate * 1.05 // Slightly more optimistic for revenue
    const avgConversionsGrowthRate =
      conversionsGrowthCount > 0 ? totalConversionsGrowth / conversionsGrowthCount : avgSpendGrowthRate * 0.95 // Slightly less for conversions

    const lastActualDay = recentData[recentData.length - 1]

    const predictions: PredictionDataPoint[] = []
    let prevDayMetrics = {
      spend: lastActualDay.spend || 0,
      revenue: lastActualDay.revenue || 0,
      conversions: lastActualDay.conversions || 0,
    }

    for (let i = 1; i <= 7; i++) {
      const date = new Date(lastActualDay.date) // Start from the day after the last historical data point
      date.setDate(date.getDate() + i)

      const predictedSpend = prevDayMetrics.spend * (1 + avgSpendGrowthRate)
      const predictedRevenue = prevDayMetrics.revenue * (1 + avgRevenueGrowthRate)
      const predictedConversions = prevDayMetrics.conversions * (1 + avgConversionsGrowthRate)

      const confidence = 0.9 - i * 0.05 // Confidence decreases over time

      predictions.push({
        date: date.toISOString().split("T")[0],
        spend: Math.max(0, predictedSpend), // Ensure non-negative
        revenue: Math.max(0, predictedRevenue),
        roas: predictedSpend > 0 ? predictedRevenue / predictedSpend : 0,
        conversions: Math.max(0, Math.round(predictedConversions)),
        confidence,
        spendUpper: Math.max(0, predictedSpend * (1 + (1 - confidence) * 0.3)), // Wider confidence bands
        spendLower: Math.max(0, predictedSpend * (1 - (1 - confidence) * 0.3)),
        revenueUpper: Math.max(0, predictedRevenue * (1 + (1 - confidence) * 0.4)),
        revenueLower: Math.max(0, predictedRevenue * (1 - (1 - confidence) * 0.4)),
        type: "prediction",
      })

      prevDayMetrics = {
        spend: predictedSpend,
        revenue: predictedRevenue,
        conversions: predictedConversions,
      }
    }

    return predictions
  }

  const predictions = calculatePredictions()

  const chartData = [
    ...historicalData.slice(-14).map((d) => ({ ...d, type: "historical" as const })), // Take last 14 days of history
    ...predictions,
  ]

  const totalPredictedSpend = predictions.reduce((sum, p) => sum + p.spend, 0)
  const totalPredictedRevenue = predictions.reduce((sum, p) => sum + p.revenue, 0)
  const totalPredictedConversions = predictions.reduce((sum, p) => sum + p.conversions, 0)
  const avgPredictedROAS = totalPredictedSpend > 0 ? totalPredictedRevenue / totalPredictedSpend : 0

  const currentRoasIsValid = currentMetrics && typeof currentMetrics.roas === "number" && !isNaN(currentMetrics.roas)
  const trend =
    predictions.length > 0 && currentRoasIsValid && predictions[predictions.length - 1].roas > currentMetrics.roas
      ? "up"
      : "down"
  const peakRoasDay =
    predictions.length > 0
      ? predictions.findIndex((p) => p.roas === Math.max(...predictions.map((pr) => pr.roas))) + 1
      : 0

  if (historicalData.length < 7) {
    return (
      <div className="text-center py-10 text-gray-400">
        <AlertTriangle className="mx-auto h-10 w-10 mb-2 text-yellow-500" />
        Not enough historical data (minimum 7 days required) to generate predictions for this period.
      </div>
    )
  }

  return (
    <div className="space-y-6 text-white">
      {/* Prediction Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-900/70 to-blue-800/70 rounded-lg p-4 border border-blue-700/60 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-200">Next 7D Spend</span>
            <Target className="w-4 h-4 text-blue-300" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalPredictedSpend)}</div>
          <div className="text-xs text-blue-300 mt-1">Projected total</div>
        </div>

        <div className="bg-gradient-to-br from-green-900/70 to-green-800/70 rounded-lg p-4 border border-green-700/60 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-200">Next 7D Revenue</span>
            {trend === "up" ? (
              <TrendingUp className="w-4 h-4 text-green-300" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-300" />
            )}
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalPredictedRevenue)}</div>
          <div className="text-xs text-green-300 mt-1">{avgPredictedROAS.toFixed(2)}x Avg ROAS</div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/70 to-purple-800/70 rounded-lg p-4 border border-purple-700/60 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-200">Next 7D Conversions</span>
            <Target className="w-4 h-4 text-purple-300" />
          </div>
          <div className="text-2xl font-bold">{formatNumberWithCommas(totalPredictedConversions)}</div>
          <div className="text-xs text-purple-300 mt-1">Projected total</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/70 to-yellow-800/70 rounded-lg p-4 border border-yellow-700/60 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-yellow-200">Peak ROAS Day</span>
            <AlertTriangle className="w-4 h-4 text-yellow-300" />
          </div>
          <div className="text-lg font-bold">{peakRoasDay > 0 ? `Day ${peakRoasDay}` : "N/A"}</div>
          <div className="text-xs text-yellow-300 mt-1">Best predicted ROAS</div>
        </div>
      </div>

      {/* Prediction Chart */}
      <div className="bg-gray-800/60 rounded-lg p-4 md:p-6 border border-gray-700/80 shadow-xl">
        <h4 className="text-lg font-semibold mb-4 text-gray-100">7-Day Performance Forecast</h4>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="predSpendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="predRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 114, 128, 0.2)" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            />
            <YAxis
              yAxisId="left"
              stroke="#818CF8"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `$${formatNumberWithCommas(value, 0)}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#FBBF24"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `${value.toFixed(1)}x`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(31, 41, 55, 0.9)",
                border: "1px solid #4B5563",
                borderRadius: "0.375rem",
                color: "#F3F4F6",
              }}
              itemStyle={{ color: "#D1D5DB" }}
              labelStyle={{ color: "#E5E7EB", fontWeight: "bold" }}
              labelFormatter={(value) =>
                `Date: ${new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              }
              formatter={(value: number, name: string, props: any) => {
                const formattedValue =
                  name.includes("Spend") || name.includes("Revenue")
                    ? formatCurrency(value)
                    : name.includes("ROAS")
                      ? `${value.toFixed(2)}x`
                      : formatNumberWithCommas(value)
                return [formattedValue, name]
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", color: "#D1D5DB", paddingTop: "10px" }} />

            {/* Historical Data Lines */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="spend"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              name="Hist. Spend"
              data={chartData.filter((d) => d.type === "historical")}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              name="Hist. Revenue"
              data={chartData.filter((d) => d.type === "historical")}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="roas"
              stroke="#FBBF24"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              name="Hist. ROAS"
              data={chartData.filter((d) => d.type === "historical")}
            />

            {/* Predicted Data Lines */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="spend"
              stroke="#3B82F6"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
              name="Pred. Spend"
              data={chartData.filter((d) => d.type === "prediction")}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="#10B981"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
              name="Pred. Revenue"
              data={chartData.filter((d) => d.type === "prediction")}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="roas"
              stroke="#FBBF24"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
              name="Pred. ROAS"
              data={chartData.filter((d) => d.type === "prediction")}
            />

            {/* Confidence Intervals for Spend */}
            <Area
              yAxisId="left"
              dataKey="spendUpper"
              stroke={false}
              fill="#3B82F6"
              fillOpacity={0.1}
              name="Spend CI Upper"
              data={chartData.filter((d) => d.type === "prediction")}
            />
            <Area
              yAxisId="left"
              dataKey="spendLower"
              stroke={false}
              fill="#3B82F6"
              fillOpacity={0.1}
              name="Spend CI Lower"
              data={chartData.filter((d) => d.type === "prediction")}
            />

            {/* Confidence Intervals for Revenue */}
            <Area
              yAxisId="left"
              dataKey="revenueUpper"
              stroke={false}
              fill="#10B981"
              fillOpacity={0.1}
              name="Revenue CI Upper"
              data={chartData.filter((d) => d.type === "prediction")}
            />
            <Area
              yAxisId="left"
              dataKey="revenueLower"
              stroke={false}
              fill="#10B981"
              fillOpacity={0.1}
              name="Revenue CI Lower"
              data={chartData.filter((d) => d.type === "prediction")}
            />

            <ReferenceLine
              x={historicalData[historicalData.length - 1]?.date}
              stroke="#F59E0B"
              strokeDasharray="2 2"
              label={{ value: "Today", position: "insideBottomRight", fill: "#F59E0B", fontSize: 10 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-6 border border-purple-700/60 shadow-lg">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-100">
          <span>🤖</span> AI-Powered Insights & Recommendations
        </h4>
        <div className="space-y-3 text-sm">
          {currentRoasIsValid && avgPredictedROAS > currentMetrics.roas * 1.15 && (
            <div className="flex items-start gap-3 p-3 bg-green-900/30 rounded-md border border-green-700/50">
              <TrendingUp className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-green-300">Strong Growth Expected</div>
                <div className="text-gray-300">
                  ROAS trending up towards {avgPredictedROAS.toFixed(2)}x. Consider increasing budget by ~15-25% to
                  capture momentum if CPA remains stable.
                </div>
              </div>
            </div>
          )}

          {currentRoasIsValid && avgPredictedROAS < currentMetrics.roas * 0.85 && (
            <div className="flex items-start gap-3 p-3 bg-yellow-900/30 rounded-md border border-yellow-700/50">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-yellow-300">Potential Performance Decline</div>
                <div className="text-gray-300">
                  ROAS may drop towards {avgPredictedROAS.toFixed(2)}x. Monitor closely. If trend continues for 2-3
                  days, refresh creatives and review audience targeting.
                </div>
              </div>
            </div>
          )}

          {predictions.length > 3 &&
            predictions[3].spend > (currentMetrics.spend / (historicalData.length || 1)) * 1.5 * 4 && (
              <div className="flex items-start gap-3 p-3 bg-red-900/30 rounded-md border border-red-700/50">
                <Target className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-red-300">Budget Pacing Alert</div>
                  <div className="text-gray-300">
                    Projected spend for the next few days is significantly higher than recent daily average. Ensure this
                    aligns with your budget strategy.
                  </div>
                </div>
              </div>
            )}

          <div className="flex items-start gap-3 p-3 bg-indigo-900/30 rounded-md border border-indigo-700/50">
            <span className="text-lg mt-0.5">💡</span>
            <div>
              <div className="font-medium text-indigo-300">Similar Campaign Benchmark (Illustrative)</div>
              <div className="text-gray-300">
                {campaignName.toLowerCase().includes("nyc")
                  ? `NYC events typically peak around $15K revenue. Your 7-day projection is ${formatCurrency(totalPredictedRevenue)}.`
                  : campaignName.toLowerCase().includes("miami")
                    ? `Miami campaigns often average 3.5x ROAS. Your 7-day projected ROAS is ${avgPredictedROAS.toFixed(1)}x.`
                    : `Campaigns of this type often see ROAS stabilize around ${(currentMetrics.roas * 1.1).toFixed(1)}x after the initial phase. Your projection is ${avgPredictedROAS.toFixed(1)}x.`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
