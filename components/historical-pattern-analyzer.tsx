'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { 
  Calendar, Clock, TrendingUp, TrendingDown, 
  Sun, Cloud, Zap, Activity, BarChart3
} from "lucide-react"
import { formatCurrency, formatPercentage } from "@/lib/utils"

interface HistoricalDataPoint {
  date: string
  dayOfWeek: number
  hour?: number
  spend: number
  revenue: number
  roas: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
}

interface Pattern {
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal'
  strength: number // 0-1
  description: string
  insights: string[]
  recommendations: string[]
}

interface HistoricalPatternAnalyzerProps {
  campaignId: string
  campaignName: string
  historicalData: HistoricalDataPoint[]
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`)

export function HistoricalPatternAnalyzer({ 
  campaignId, 
  campaignName, 
  historicalData 
}: HistoricalPatternAnalyzerProps) {
  const [selectedMetric, setSelectedMetric] = useState<'roas' | 'spend' | 'conversions'>('roas')
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Analyze patterns on mount
  useEffect(() => {
    if (historicalData && historicalData.length > 0) {
      analyzePatterns()
    }
  }, [historicalData])

  // Day of week analysis
  const dayOfWeekData = useMemo(() => {
    const grouped = DAYS.map((day, index) => {
      const dayData = historicalData.filter(d => new Date(d.date).getDay() === index)
      if (dayData.length === 0) return null

      const avgSpend = dayData.reduce((sum, d) => sum + d.spend, 0) / dayData.length
      const avgRevenue = dayData.reduce((sum, d) => sum + d.revenue, 0) / dayData.length
      const avgROAS = avgRevenue / avgSpend
      const avgConversions = dayData.reduce((sum, d) => sum + d.conversions, 0) / dayData.length

      return {
        day,
        dayIndex: index,
        spend: avgSpend,
        revenue: avgRevenue,
        roas: avgROAS,
        conversions: avgConversions,
        dataPoints: dayData.length
      }
    }).filter(Boolean)

    return grouped
  }, [historicalData])

  // Hourly patterns (if hourly data exists)
  const hourlyData = useMemo(() => {
    const hourlyPoints = historicalData.filter(d => d.hour !== undefined)
    if (hourlyPoints.length === 0) return []

    return HOURS.map((hour, index) => {
      const hourData = hourlyPoints.filter(d => d.hour === index)
      if (hourData.length === 0) return null

      const avgSpend = hourData.reduce((sum, d) => sum + d.spend, 0) / hourData.length
      const avgRevenue = hourData.reduce((sum, d) => sum + d.revenue, 0) / hourData.length
      const avgROAS = avgRevenue / avgSpend
      const avgConversions = hourData.reduce((sum, d) => sum + d.conversions, 0) / hourData.length

      return {
        hour,
        hourIndex: index,
        spend: avgSpend,
        revenue: avgRevenue,
        roas: avgROAS,
        conversions: avgConversions,
        dataPoints: hourData.length
      }
    }).filter(Boolean)
  }, [historicalData])

  // Monthly trends
  const monthlyTrends = useMemo(() => {
    const grouped = historicalData.reduce((acc, point) => {
      const month = new Date(point.date).toISOString().slice(0, 7)
      if (!acc[month]) {
        acc[month] = { spend: 0, revenue: 0, conversions: 0, count: 0 }
      }
      acc[month].spend += point.spend
      acc[month].revenue += point.revenue
      acc[month].conversions += point.conversions
      acc[month].count += 1
      return acc
    }, {} as Record<string, any>)

    return Object.entries(grouped).map(([month, data]) => ({
      month,
      spend: data.spend,
      revenue: data.revenue,
      roas: data.revenue / data.spend,
      conversions: data.conversions,
      avgDailySpend: data.spend / data.count,
      avgDailyRevenue: data.revenue / data.count
    })).sort((a, b) => a.month.localeCompare(b.month))
  }, [historicalData])

  const analyzePatterns = async () => {
    setIsAnalyzing(true)
    
    const detectedPatterns: Pattern[] = []

    // Day of Week Pattern Detection
    if (dayOfWeekData.length >= 7) {
      const roasVariance = calculateVariance(dayOfWeekData.map(d => d!.roas))
      const bestDay = dayOfWeekData.reduce((best, day) => 
        day!.roas > best!.roas ? day : best
      )
      const worstDay = dayOfWeekData.reduce((worst, day) => 
        day!.roas < worst!.roas ? day : worst
      )

      if (roasVariance > 0.2) {
        detectedPatterns.push({
          type: 'weekly',
          strength: Math.min(roasVariance, 1),
          description: `Strong weekly pattern detected`,
          insights: [
            `Best performance on ${bestDay!.day} (${bestDay!.roas.toFixed(2)}x ROAS)`,
            `Worst performance on ${worstDay!.day} (${worstDay!.roas.toFixed(2)}x ROAS)`,
            `${((bestDay!.roas - worstDay!.roas) / worstDay!.roas * 100).toFixed(0)}% variance between best and worst days`
          ],
          recommendations: [
            `Increase budget on ${bestDay!.day} by 30-50%`,
            `Reduce budget on ${worstDay!.day} by 20-30%`,
            `Test new creatives on low-performing days`
          ]
        })
      }
    }

    // Hourly Pattern Detection
    if (hourlyData.length >= 12) {
      const hourlyROAS = hourlyData.map(h => h!.roas)
      const peakHours = hourlyData
        .filter(h => h!.roas > average(hourlyROAS) * 1.2)
        .map(h => h!.hourIndex)
      
      if (peakHours.length > 0) {
        detectedPatterns.push({
          type: 'daily',
          strength: 0.8,
          description: `Clear hourly performance patterns`,
          insights: [
            `Peak performance hours: ${peakHours.map(h => `${h}:00`).join(', ')}`,
            `${peakHours.length} hours show 20%+ above average ROAS`,
            `Best hour: ${hourlyData.reduce((best, h) => h!.roas > best!.roas ? h : best)!.hour}`
          ],
          recommendations: [
            `Concentrate 60% of budget during peak hours`,
            `Implement dayparting to optimize hourly spending`,
            `Reduce bids during low-performance hours`
          ]
        })
      }
    }

    // Monthly Trend Detection
    if (monthlyTrends.length >= 3) {
      const recentTrend = monthlyTrends.slice(-3)
      const trendDirection = recentTrend[2].roas > recentTrend[0].roas ? 'improving' : 'declining'
      const trendStrength = Math.abs(recentTrend[2].roas - recentTrend[0].roas) / recentTrend[0].roas

      detectedPatterns.push({
        type: 'monthly',
        strength: Math.min(trendStrength, 1),
        description: `Performance is ${trendDirection}`,
        insights: [
          `ROAS ${trendDirection} by ${(trendStrength * 100).toFixed(0)}% over last 3 months`,
          `Current month ROAS: ${recentTrend[2].roas.toFixed(2)}x`,
          `Average daily spend: $${recentTrend[2].avgDailySpend.toFixed(2)}`
        ],
        recommendations: trendDirection === 'improving' ? [
          `Continue current strategy`,
          `Test scaling budget by 20-30%`,
          `Document successful tactics`
        ] : [
          `Review recent changes`,
          `Refresh creative assets`,
          `Analyze competitor activity`
        ]
      })
    }

    setPatterns(detectedPatterns)
    setIsAnalyzing(false)
  }

  const calculateVariance = (values: number[]) => {
    const mean = average(values)
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
    return Math.sqrt(average(squaredDiffs)) / mean
  }

  const average = (values: number[]) => 
    values.reduce((sum, v) => sum + v, 0) / values.length

  const getPatternStrengthColor = (strength: number) => {
    if (strength > 0.7) return 'text-green-600'
    if (strength > 0.4) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Historical Pattern Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Analyzing {historicalData.length} data points for {campaignName}
          </p>
        </div>
        <Select value={selectedMetric} onValueChange={(v: any) => setSelectedMetric(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="roas">ROAS</SelectItem>
            <SelectItem value="spend">Spend</SelectItem>
            <SelectItem value="conversions">Conversions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Detected Patterns */}
      {patterns.length > 0 && (
        <div className="grid gap-4">
          {patterns.map((pattern, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {pattern.type === 'daily' && <Clock className="w-4 h-4" />}
                    {pattern.type === 'weekly' && <Calendar className="w-4 h-4" />}
                    {pattern.type === 'monthly' && <TrendingUp className="w-4 h-4" />}
                    {pattern.description}
                  </CardTitle>
                  <Badge className={getPatternStrengthColor(pattern.strength)}>
                    {(pattern.strength * 100).toFixed(0)}% strength
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Key Insights</h4>
                    <ul className="space-y-1">
                      {pattern.insights.map((insight, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Recommendations</h4>
                    <ul className="space-y-1">
                      {pattern.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start">
                          <span className="text-blue-500 mr-2">→</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Visualization Tabs */}
      <Tabs defaultValue="weekly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="weekly">Weekly Patterns</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Patterns</TabsTrigger>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="heatmap">Performance Heatmap</TabsTrigger>
        </TabsList>

        {/* Weekly Patterns */}
        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>Day of Week Performance</CardTitle>
              <CardDescription>Average {selectedMetric} by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => 
                      selectedMetric === 'spend' ? formatCurrency(value) :
                      selectedMetric === 'roas' ? `${value.toFixed(2)}x` :
                      value.toFixed(0)
                    } />
                    <Bar 
                      dataKey={selectedMetric} 
                      fill="#8884d8"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hourly Patterns */}
        <TabsContent value="hourly">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Performance Patterns</CardTitle>
              <CardDescription>Average {selectedMetric} by hour of day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {hourlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => 
                        selectedMetric === 'spend' ? formatCurrency(value) :
                        selectedMetric === 'roas' ? `${value.toFixed(2)}x` :
                        value.toFixed(0)
                      } />
                      <Area 
                        type="monotone" 
                        dataKey={selectedMetric} 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No hourly data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Trends */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance Trends</CardTitle>
              <CardDescription>Performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => 
                      selectedMetric === 'spend' ? formatCurrency(value) :
                      selectedMetric === 'roas' ? `${value.toFixed(2)}x` :
                      value.toFixed(0)
                    } />
                    <Line 
                      type="monotone" 
                      dataKey={selectedMetric === 'spend' ? 'avgDailySpend' : selectedMetric}
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Heatmap */}
        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle>Performance Heatmap</CardTitle>
              <CardDescription>ROAS by day and hour (if available)</CardDescription>
            </CardHeader>
            <CardContent>
              {hourlyData.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-25 gap-1 text-xs">
                    <div></div>
                    {Array.from({ length: 24 }, (_, i) => (
                      <div key={i} className="text-center text-muted-foreground">
                        {i}
                      </div>
                    ))}
                  </div>
                  {DAYS.map((day, dayIndex) => (
                    <div key={day} className="grid grid-cols-25 gap-1">
                      <div className="text-xs text-muted-foreground pr-2">{day.slice(0, 3)}</div>
                      {Array.from({ length: 24 }, (_, hourIndex) => {
                        // This would need real hour/day data
                        const value = Math.random() * 4 // Placeholder
                        return (
                          <div
                            key={hourIndex}
                            className="aspect-square rounded-sm"
                            style={{
                              backgroundColor: `rgba(34, 197, 94, ${Math.min(value / 4, 1)})`,
                            }}
                            title={`${day} ${hourIndex}:00 - ROAS: ${value.toFixed(2)}x`}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Hourly data not available for heatmap visualization
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}