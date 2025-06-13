'use client'

import React, { useState } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { formatNumberWithCommas, safeToFixed, formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, DollarSign, Target, MousePointer, Eye } from "lucide-react"

interface HistoricalDataPoint {
  date: string
  spend: number
  revenue: number
  roas: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
}

interface EnhancedPerformanceChartsProps {
  data: HistoricalDataPoint[]
  campaignName: string
}

export function EnhancedPerformanceCharts({ data, campaignName }: EnhancedPerformanceChartsProps) {
  const [selectedMetric, setSelectedMetric] = useState<'profitability' | 'efficiency' | 'volume'>('profitability')

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No historical data available
      </div>
    )
  }

  // Process data for better visualization
  const processedData = data.map(point => {
    const roas = Number(point.roas) || 0
    const spend = Number(point.spend) || 0
    const revenue = Number(point.revenue) || 0
    const ctr = Number(point.ctr) || 0
    const cpc = Number(point.cpc) || 0
    const conversions = Number(point.conversions) || 0
    const impressions = Number(point.impressions) || 0
    const clicks = Number(point.clicks) || 0
    
    return {
      ...point,
      date: point.date,
      spend,
      revenue,
      roas,
      conversions,
      impressions,
      clicks,
      ctr,
      cpc,
      // Calculated metrics for better visualization
      profit: revenue - spend,
      profitMargin: spend > 0 ? ((revenue - spend) / revenue) * 100 : 0,
      efficiency: spend > 0 ? (conversions / spend) * 100 : 0, // Conversions per $100 spent
      roasNormalized: Math.min(roas * 100, 1000), // Scale ROAS for better chart comparison
      costEfficiency: cpc > 0 ? (1 / cpc) * 100 : 0, // Inverse of CPC for "efficiency"
      engagementRate: impressions > 0 ? (clicks / impressions) * 10000 : 0 // CTR * 100 for scaling
    }
  })

  // Calculate benchmarks and trends
  const avgROAS = processedData.reduce((sum, point) => sum + point.roas, 0) / processedData.length
  const totalSpend = processedData.reduce((sum, point) => sum + point.spend, 0)
  const totalRevenue = processedData.reduce((sum, point) => sum + point.revenue, 0)
  const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0

  // Find best and worst performing days
  const bestROASDay = processedData.reduce((best, current) => 
    current.roas > best.roas ? current : best, processedData[0])
  const worstROASDay = processedData.reduce((worst, current) => 
    current.roas < worst.roas ? current : worst, processedData[0])

  // Debug log to see what data we have
  console.log('Enhanced Charts - Sample data points:', {
    totalDataPoints: processedData.length,
    sampleData: processedData.slice(0, 3),
    avgROAS,
    bestROASDay: { date: bestROASDay?.date, roas: bestROASDay?.roas },
    dataFields: Object.keys(processedData[0] || {})
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-800 p-3 border border-gray-600 rounded-lg shadow-lg">
          <p className="text-gray-300 text-sm font-medium mb-2">
            {new Date(label).toLocaleDateString('en', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
          <div className="space-y-1 text-xs">
            <p className="flex justify-between">
              <span className="text-gray-400">ROAS:</span>
              <span className={`font-bold ${data.roas >= 3 ? 'text-green-400' : data.roas >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                {data.roas.toFixed(2)}x
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-400">Spend:</span>
              <span className="text-blue-400">{formatCurrency(data.spend)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-400">Revenue:</span>
              <span className="text-green-400">{formatCurrency(data.revenue)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-400">Profit:</span>
              <span className={data.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                {formatCurrency(data.profit)}
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-400">Conversions:</span>
              <span className="text-purple-400">{data.conversions}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-400">CTR:</span>
              <span className="text-orange-400">{data.ctr.toFixed(2)}%</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-400">CPC:</span>
              <span className="text-cyan-400">{formatCurrency(data.cpc)}</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-700/30 border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Best ROAS Day</span>
            </div>
            <p className="text-lg font-bold text-green-400">{bestROASDay.roas.toFixed(2)}x</p>
            <p className="text-xs text-gray-500">{new Date(bestROASDay.date).toLocaleDateString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-700/30 border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Avg ROAS</span>
            </div>
            <p className="text-lg font-bold text-blue-400">{avgROAS.toFixed(2)}x</p>
            <p className="text-xs text-gray-500">Period average</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-700/30 border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Total Profit</span>
            </div>
            <p className={`text-lg font-bold ${totalRevenue - totalSpend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(totalRevenue - totalSpend)}
            </p>
            <p className="text-xs text-gray-500">{((totalRevenue - totalSpend) / totalSpend * 100).toFixed(1)}% margin</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-700/30 border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-gray-400">Profitable Days</span>
            </div>
            <p className="text-lg font-bold text-orange-400">
              {processedData.filter(d => d.roas > 1).length}
            </p>
            <p className="text-xs text-gray-500">of {processedData.length} days</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Tabs */}
      <Tabs value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
        <TabsList className="grid w-full grid-cols-3 bg-gray-700/50">
          <TabsTrigger value="profitability">Profitability Focus</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency Metrics</TabsTrigger>
          <TabsTrigger value="volume">Volume & Engagement</TabsTrigger>
        </TabsList>

        {/* Profitability Chart */}
        <TabsContent value="profitability">
          <Card className="bg-gray-700/50 border-gray-600/70">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                ROAS & Profitability Trend
              </CardTitle>
              <p className="text-xs text-gray-400">
                Green area = Profitable days (ROAS > 1.0x), Red area = Loss days
              </p>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 114, 128, 0.2)" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickFormatter={(date) => new Date(date).toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                    })}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={1} stroke="#EF4444" strokeDasharray="2 2" label="Break-even" />
                  <ReferenceLine y={3} stroke="#10B981" strokeDasharray="2 2" label="Good ROAS" />
                  <Area
                    type="monotone"
                    dataKey="roas"
                    stroke="#10B981"
                    fill="url(#roasGradient)"
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="roasGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Efficiency Chart */}
        <TabsContent value="efficiency">
          <Card className="bg-gray-700/50 border-gray-600/70">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" />
                Cost Efficiency & CTR Performance
              </CardTitle>
              <p className="text-xs text-gray-400">
                Lower CPC and higher CTR indicate better ad efficiency
              </p>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 114, 128, 0.2)" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickFormatter={(date) => new Date(date).toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                    })}
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#3B82F6" 
                    fontSize={10}
                    label={{ value: 'CTR (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#F59E0B" 
                    fontSize={10}
                    label={{ value: 'CPC ($)', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="ctr"
                    stroke="#3B82F6"
                    name="CTR (%)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#3B82F6' }}
                    connectNulls={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cpc"
                    stroke="#F59E0B"
                    name="CPC ($)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#F59E0B' }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Volume Chart */}
        <TabsContent value="volume">
          <Card className="bg-gray-700/50 border-gray-600/70">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MousePointer className="w-4 h-4 text-purple-400" />
                Volume & Engagement Metrics
              </CardTitle>
              <p className="text-xs text-gray-400">
                Daily spend vs conversions and engagement volume
              </p>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 114, 128, 0.2)" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickFormatter={(date) => new Date(date).toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                    })}
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#8B5CF6" 
                    fontSize={10}
                    label={{ value: 'Conversions', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#06B6D4" 
                    fontSize={10}
                    label={{ value: 'Clicks', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="conversions"
                    fill="#8B5CF6"
                    name="Conversions"
                    opacity={0.8}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="clicks"
                    stroke="#06B6D4"
                    name="Clicks"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#06B6D4' }}
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ROAS Performance Insights */}
      <Card className="bg-gray-700/50 border-gray-600/70">
        <CardHeader>
          <CardTitle className="text-base">ROAS Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-green-900/20 border border-green-700/50 rounded">
              <h4 className="font-medium text-green-300 mb-2">Best Performing Days</h4>
              {processedData
                .filter(d => d.roas >= 3)
                .sort((a, b) => b.roas - a.roas)
                .slice(0, 3)
                .map((day, idx) => (
                  <p key={idx} className="text-xs text-green-200">
                    {new Date(day.date).toLocaleDateString()} - {day.roas.toFixed(2)}x ROAS
                  </p>
                ))}
              {processedData.filter(d => d.roas >= 3).length === 0 && (
                <p className="text-xs text-gray-400">No days with ROAS ≥ 3.0x</p>
              )}
            </div>
            
            <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded">
              <h4 className="font-medium text-yellow-300 mb-2">Break-even Days</h4>
              {processedData
                .filter(d => d.roas >= 1 && d.roas < 2)
                .length > 0 ? (
                  <p className="text-xs text-yellow-200">
                    {processedData.filter(d => d.roas >= 1 && d.roas < 2).length} days with 1-2x ROAS
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">No break-even days</p>
                )}
              <p className="text-xs text-yellow-200 mt-1">
                Avg ROAS: {avgROAS.toFixed(2)}x
              </p>
            </div>
            
            <div className="p-3 bg-red-900/20 border border-red-700/50 rounded">
              <h4 className="font-medium text-red-300 mb-2">Loss Days (ROAS &lt; 1.0x)</h4>
              {processedData
                .filter(d => d.roas < 1)
                .sort((a, b) => a.roas - b.roas)
                .slice(0, 3)
                .map((day, idx) => (
                  <p key={idx} className="text-xs text-red-200">
                    {new Date(day.date).toLocaleDateString()} - {day.roas.toFixed(2)}x ROAS
                  </p>
                ))}
              {processedData.filter(d => d.roas < 1).length === 0 && (
                <p className="text-xs text-gray-400">No loss days! 🎉</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}