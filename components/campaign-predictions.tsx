"use client"
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
import { TrendingUp, TrendingDown, AlertTriangle, Target, Users, Zap, Sparkles, Brain } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatNumberWithCommas } from "@/lib/utils"

interface HistoricalDataPoint {
  date: string
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
  historicalData: HistoricalDataPoint[]
  currentMetrics: {
    spend: number
    revenue: number
    roas: string | number
    conversions: number
  }
}

export function CampaignPredictions({ campaignName, historicalData, currentMetrics }: CampaignPredictionsProps) {
  const calculatePredictions = (): PredictionDataPoint[] => {
    if (!historicalData || !Array.isArray(historicalData) || historicalData.length < 7) return []

    // Ensure all data points are valid
    const validHistoricalData = historicalData.filter(point => 
      point && 
      typeof point.spend !== 'undefined' && 
      typeof point.revenue !== 'undefined' &&
      !isNaN(Number(point.spend)) &&
      !isNaN(Number(point.revenue))
    )

    if (validHistoricalData.length < 7) return []

    const recentData = validHistoricalData.slice(-Math.min(30, validHistoricalData.length))
    if (recentData.length < 2) return []

    let totalSpendGrowth = 0
    let spendGrowthCount = 0
    let totalRevenueGrowth = 0
    let revenueGrowthCount = 0

    for (let i = 1; i < recentData.length; i++) {
      if (recentData[i - 1].spend > 0) {
        totalSpendGrowth += (recentData[i].spend - recentData[i - 1].spend) / recentData[i - 1].spend
        spendGrowthCount++
      }
      if (recentData[i - 1].revenue > 0) {
        totalRevenueGrowth += (recentData[i].revenue - recentData[i - 1].revenue) / recentData[i - 1].revenue
        revenueGrowthCount++
      }
    }

    const avgSpendGrowthRate = spendGrowthCount > 0 ? totalSpendGrowth / spendGrowthCount : 0.01
    const avgRevenueGrowthRate =
      revenueGrowthCount > 0 ? totalRevenueGrowth / revenueGrowthCount : avgSpendGrowthRate * 1.05

    const lastActualDay = recentData[recentData.length - 1]
    const predictions: PredictionDataPoint[] = []
    let prevDayMetrics = {
      spend: lastActualDay.spend || 0,
      revenue: lastActualDay.revenue || 0,
      conversions: lastActualDay.conversions || 0,
    }

    for (let i = 1; i <= 7; i++) {
      const date = new Date(lastActualDay.date)
      date.setDate(date.getDate() + i)

      const predictedSpend = prevDayMetrics.spend * (1 + avgSpendGrowthRate)
      const predictedRevenue = prevDayMetrics.revenue * (1 + avgRevenueGrowthRate)
      const predictedConversions = prevDayMetrics.conversions * (1 + avgSpendGrowthRate * 0.95)
      const confidence = 0.9 - i * 0.05

      predictions.push({
        date: date.toISOString().split("T")[0],
        spend: Math.max(0, predictedSpend),
        revenue: Math.max(0, predictedRevenue),
        roas: predictedSpend > 0 ? predictedRevenue / predictedSpend : 0,
        conversions: Math.max(0, Math.round(predictedConversions)),
        confidence,
        spendUpper: Math.max(0, predictedSpend * (1 + (1 - confidence) * 0.3)),
        spendLower: Math.max(0, predictedSpend * (1 - (1 - confidence) * 0.3)),
        revenueUpper: Math.max(0, predictedRevenue * (1 + (1 - confidence) * 0.4)),
        revenueLower: Math.max(0, predictedRevenue * (1 - (1 - confidence) * 0.4)),
        type: "prediction",
      })
      prevDayMetrics = { spend: predictedSpend, revenue: predictedRevenue, conversions: predictedConversions }
    }
    return predictions
  }

  const predictions = calculatePredictions()
  
  // Ensure historical data is valid before using it
  const validHistoricalData = (historicalData || []).filter(point => 
    point && 
    typeof point.spend !== 'undefined' && 
    typeof point.revenue !== 'undefined'
  ).map(point => ({
    ...point,
    spend: Number(point.spend) || 0,
    revenue: Number(point.revenue) || 0,
    roas: Number(point.roas) || 0,
    conversions: Number(point.conversions) || 0,
    type: "historical" as const
  }))
  
  const chartData = [...validHistoricalData.slice(-14), ...predictions]

  const totalPredictedSpend = predictions.reduce((sum, p) => sum + p.spend, 0)
  const totalPredictedRevenue = predictions.reduce((sum, p) => sum + p.revenue, 0)
  const totalPredictedConversions = predictions.reduce((sum, p) => sum + p.conversions, 0)
  const avgPredictedROAS = totalPredictedSpend > 0 ? totalPredictedRevenue / totalPredictedSpend : 0

  const currentRoasNum =
    typeof currentMetrics.roas === "string" ? Number.parseFloat(currentMetrics.roas) : currentMetrics.roas
  const trend = predictions.length > 0 && avgPredictedROAS > currentRoasNum ? "up" : "down"
  const peakRoasDay =
    predictions.length > 0
      ? predictions.findIndex((p) => p.roas === Math.max(...predictions.map((pr) => pr.roas))) + 1
      : 0

  if (!historicalData || !Array.isArray(historicalData) || validHistoricalData.length < 7) {
    return (
      <Card className="bg-gray-800/70 border-gray-700/80">
        <CardContent className="py-10 text-center text-gray-400">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-yellow-500" />
          <p>Not enough historical data (minimum 7 days required) to generate predictions.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {[
          {
            title: "Next 7D Spend",
            value: formatCurrency(totalPredictedSpend),
            subtitle: "Projected total",
            icon: <Target className="w-4 h-4 text-blue-300" />,
            gradient: "from-blue-900/70 to-blue-800/70 border-blue-700/60",
          },
          {
            title: "Next 7D Revenue",
            value: formatCurrency(totalPredictedRevenue),
            subtitle: `${avgPredictedROAS.toFixed(2)}x Avg ROAS`,
            icon:
              trend === "up" ? (
                <TrendingUp className="w-4 h-4 text-green-300" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-300" />
              ),
            gradient: "from-green-900/70 to-green-800/70 border-green-700/60",
          },
          {
            title: "Next 7D Conversions",
            value: formatNumberWithCommas(totalPredictedConversions),
            subtitle: "Projected total",
            icon: <Users className="w-4 h-4 text-purple-300" />,
            gradient: "from-purple-900/70 to-purple-800/70 border-purple-700/60",
          },
          {
            title: "Peak ROAS Day",
            value: peakRoasDay > 0 ? `Day ${peakRoasDay}` : "N/A",
            subtitle: "Best predicted ROAS",
            icon: <Zap className="w-4 h-4 text-yellow-300" />,
            gradient: "from-yellow-900/70 to-yellow-800/70 border-yellow-700/60",
          },
        ].map((metric) => (
          <div key={metric.title} className={`bg-gradient-to-br ${metric.gradient} rounded-lg p-3 border shadow-lg`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-gray-200 opacity-90">{metric.title}</span>
              <span className="text-gray-200 opacity-80">{metric.icon}</span>
            </div>
            <div className="text-xl font-bold">{metric.value}</div>
            <div className="text-gray-300 opacity-80 mt-0.5">{metric.subtitle}</div>
          </div>
        ))}
      </div>

      <Card className="bg-gray-800/60 rounded-lg p-3 md:p-4 border border-gray-700/80 shadow-xl">
        <CardHeader className="p-2 md:p-0 mb-2 md:mb-0">
          <CardTitle className="text-base md:text-lg">7-Day Performance Forecast</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="predSpendGradientChart" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="predRevenueGradientChart" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 114, 128, 0.2)" />
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }
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
                formatter={(value: number, name: string) => [
                  name.includes("Spend") || name.includes("Revenue")
                    ? formatCurrency(value)
                    : name.includes("ROAS")
                      ? `${value.toFixed(2)}x`
                      : formatNumberWithCommas(value),
                  name,
                ]}
              />
              <Legend wrapperStyle={{ fontSize: "10px", color: "#D1D5DB", paddingTop: "10px" }} />

              <Line
                yAxisId="left"
                type="monotone"
                dataKey="spend"
                stroke="#3B82F6"
                strokeWidth={1.5}
                dot={{ r: 1.5 }}
                activeDot={{ r: 3 }}
                name="Hist. Spend"
                data={chartData.filter((d) => d.type === "historical")}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={1.5}
                dot={{ r: 1.5 }}
                activeDot={{ r: 3 }}
                name="Hist. Revenue"
                data={chartData.filter((d) => d.type === "historical")}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="roas"
                stroke="#FBBF24"
                strokeWidth={1.5}
                dot={{ r: 1.5 }}
                activeDot={{ r: 3 }}
                name="Hist. ROAS"
                data={chartData.filter((d) => d.type === "historical")}
              />

              <Line
                yAxisId="left"
                type="monotone"
                dataKey="spend"
                stroke="#3B82F6"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                name="Pred. Spend"
                data={chartData.filter((d) => d.type === "prediction")}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                name="Pred. Revenue"
                data={chartData.filter((d) => d.type === "prediction")}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="roas"
                stroke="#FBBF24"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                name="Pred. ROAS"
                data={chartData.filter((d) => d.type === "prediction")}
              />

              <Area
                yAxisId="left"
                dataKey="spendUpper"
                stroke={false}
                fill="url(#predSpendGradientChart)"
                fillOpacity={0.05} // Use fillOpacity on Area itself
                name="Spend CI Upper"
                data={chartData.filter((d) => d.type === "prediction")}
              />
              <Area
                yAxisId="left"
                dataKey="spendLower"
                stroke={false}
                fill="url(#predSpendGradientChart)"
                fillOpacity={0.05}
                name="Spend CI Lower"
                data={chartData.filter((d) => d.type === "prediction")}
              />
              <Area
                yAxisId="left"
                dataKey="revenueUpper"
                stroke={false}
                fill="url(#predRevenueGradientChart)"
                fillOpacity={0.05}
                name="Revenue CI Upper"
                data={chartData.filter((d) => d.type === "prediction")}
              />
              <Area
                yAxisId="left"
                dataKey="revenueLower"
                stroke={false}
                fill="url(#predRevenueGradientChart)"
                fillOpacity={0.05}
                name="Revenue CI Lower"
                data={chartData.filter((d) => d.type === "prediction")}
              />

              {historicalData.length > 0 && (
                <ReferenceLine
                  x={historicalData[historicalData.length - 1]?.date}
                  stroke="#F59E0B"
                  strokeDasharray="2 2"
                  label={{ value: "Today", position: "insideBottomRight", fill: "#F59E0B", fontSize: 10 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-700/60 shadow-lg">
        <CardHeader className="p-0 mb-2">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-300" />
            AI-Powered Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-2 text-xs">
          {avgPredictedROAS > currentRoasNum * 1.15 && (
            <div className="flex items-start gap-2 p-2 bg-green-900/30 rounded-md border border-green-700/50">
              <TrendingUp className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-green-300">Strong Growth Expected</div>
                <div className="text-gray-300">
                  ROAS trending up towards {avgPredictedROAS.toFixed(2)}x. Consider increasing budget by ~15-25% to
                  capture momentum if CPA remains stable.
                </div>
              </div>
            </div>
          )}
          {avgPredictedROAS < currentRoasNum * 0.85 && (
            <div className="flex items-start gap-2 p-2 bg-yellow-900/30 rounded-md border border-yellow-700/50">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
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
            currentMetrics.spend > 0 && // Ensure currentMetrics.spend is valid
            historicalData.length > 0 && // Ensure historicalData is not empty
            predictions[3].spend > (currentMetrics.spend / (historicalData.length || 1)) * 1.5 * 4 && (
              <div className="flex items-start gap-2 p-2 bg-red-900/30 rounded-md border border-red-700/50">
                <Target className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-red-300">Budget Pacing Alert</div>
                  <div className="text-gray-300">
                    Projected spend for the next few days is significantly higher than recent daily average. Ensure this
                    aligns with your budget strategy.
                  </div>
                </div>
              </div>
            )}
          <div className="flex items-start gap-2 p-2 bg-indigo-900/30 rounded-md border border-indigo-700/50">
            <Brain className="w-3.5 h-3.5 text-indigo-300 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-indigo-300">Similar Campaign Benchmark (Illustrative)</div>
              <div className="text-gray-300">
                {campaignName.toLowerCase().includes("nyc")
                  ? `NYC events typically peak around ${formatCurrency(15000)} revenue. Your 7-day projection is ${formatCurrency(totalPredictedRevenue)}.`
                  : campaignName.toLowerCase().includes("miami")
                    ? `Miami campaigns often average 3.5x ROAS. Your 7-day projected ROAS is ${avgPredictedROAS.toFixed(1)}x.`
                    : `Campaigns of this type often see ROAS stabilize around ${(currentRoasNum * 1.1).toFixed(1)}x after the initial phase. Your projection is ${avgPredictedROAS.toFixed(1)}x.`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
