"use client"

import React from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Target, Users, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatNumberWithCommas } from "@/lib/utils"

interface HistoricalDataPoint {
  date: string
  spend: number
  revenue: number
  roas: number
  conversions: number
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

export function CampaignPredictionsSafe({ campaignName, historicalData, currentMetrics }: CampaignPredictionsProps) {
  try {
    // Validate and clean data
    if (!historicalData || !Array.isArray(historicalData)) {
      throw new Error("Invalid historical data")
    }

    const validData = historicalData.filter(point => {
      return point && 
        point.date &&
        typeof point.spend === 'number' && !isNaN(point.spend) &&
        typeof point.revenue === 'number' && !isNaN(point.revenue)
    })

    if (validData.length < 7) {
      return (
        <Card className="bg-gray-800/70 border-gray-700/80">
          <CardContent className="py-10 text-center text-gray-400">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-yellow-500" />
            <p>Not enough historical data (minimum 7 days required) to generate predictions.</p>
            <p className="text-xs mt-2">Available data points: {validData.length}</p>
          </CardContent>
        </Card>
      )
    }

    // Calculate simple predictions based on averages
    const recentDays = validData.slice(-7)
    const avgDailySpend = recentDays.reduce((sum, d) => sum + d.spend, 0) / recentDays.length
    const avgDailyRevenue = recentDays.reduce((sum, d) => sum + d.revenue, 0) / recentDays.length
    const avgDailyConversions = recentDays.reduce((sum, d) => sum + d.conversions, 0) / recentDays.length
    
    // Simple 7-day projections
    const projectedSpend = avgDailySpend * 7
    const projectedRevenue = avgDailyRevenue * 7
    const projectedConversions = Math.round(avgDailyConversions * 7)
    const projectedROAS = projectedSpend > 0 ? projectedRevenue / projectedSpend : 0

    const currentRoasNum = typeof currentMetrics.roas === "string" 
      ? parseFloat(currentMetrics.roas) 
      : currentMetrics.roas
    const trend = projectedROAS > currentRoasNum ? "up" : "down"

    return (
      <div className="space-y-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {[
            {
              title: "Next 7D Spend",
              value: formatCurrency(projectedSpend),
              subtitle: "Based on 7-day avg",
              icon: <Target className="w-4 h-4 text-blue-300" />,
              gradient: "from-blue-900/70 to-blue-800/70 border-blue-700/60",
            },
            {
              title: "Next 7D Revenue",
              value: formatCurrency(projectedRevenue),
              subtitle: `${projectedROAS.toFixed(2)}x Projected ROAS`,
              icon: trend === "up" ? (
                <TrendingUp className="w-4 h-4 text-green-300" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-300" />
              ),
              gradient: "from-green-900/70 to-green-800/70 border-green-700/60",
            },
            {
              title: "Next 7D Conversions",
              value: formatNumberWithCommas(projectedConversions),
              subtitle: "Projected total",
              icon: <Users className="w-4 h-4 text-purple-300" />,
              gradient: "from-purple-900/70 to-purple-800/70 border-purple-700/60",
            },
            {
              title: "Trend",
              value: trend === "up" ? "Improving" : "Declining",
              subtitle: "vs current ROAS",
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
            <CardTitle className="text-base md:text-lg">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3 text-sm text-gray-300">
              <p>
                Based on the last 7 days of data, your campaign is averaging{" "}
                <span className="text-white font-semibold">{formatCurrency(avgDailySpend)}</span> in daily spend
                with <span className="text-white font-semibold">{formatCurrency(avgDailyRevenue)}</span> in daily revenue.
              </p>
              <p>
                If current trends continue, you can expect approximately{" "}
                <span className="text-white font-semibold">{projectedConversions}</span> conversions
                over the next week with a projected ROAS of{" "}
                <span className="text-white font-semibold">{projectedROAS.toFixed(2)}x</span>.
              </p>
              {trend === "up" ? (
                <p className="text-green-400">
                  📈 Performance is trending upward compared to your current ROAS.
                </p>
              ) : (
                <p className="text-yellow-400">
                  📊 Performance may decline compared to your current ROAS. Consider optimization.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error("Predictions error:", error)
    return (
      <Card className="bg-gray-800/70 border-gray-700/80">
        <CardContent className="py-10 text-center text-gray-400">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-500" />
          <p>Unable to generate predictions at this time.</p>
          <p className="text-xs mt-2">Please try refreshing the page.</p>
        </CardContent>
      </Card>
    )
  }
}