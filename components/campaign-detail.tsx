"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, ReferenceLine, Brush
} from 'recharts'
import { 
  TrendingUp, TrendingDown, DollarSign, Target, Activity,
  Calendar, AlertCircle, Download, ArrowLeft, Zap,
  TrendingUp as TrendUp, TrendingDown as TrendDown,
  Minus, Sparkles
} from 'lucide-react'
import { formatCurrency, formatNumberWithCommas, formatPercentage } from '@/lib/utils'
import { MetaAPIEnhanced, CampaignHistoricalData } from '@/lib/meta-api-enhanced'
import { CampaignPredictiveMini } from '@/components/campaign-predictive-mini'

interface CampaignDetailProps {
  campaignId: string
  accessToken: string
  adAccountId: string
  onBack: () => void
}

export function CampaignDetail({ campaignId, accessToken, adAccountId, onBack }: CampaignDetailProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [campaign, setCampaign] = useState<any>(null)
  const [history, setHistory] = useState<CampaignHistoricalData[]>([])
  const [budget, setBudget] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [timeRange, setTimeRange] = useState('all')
  const [metric, setMetric] = useState('revenue')

  useEffect(() => {
    fetchCampaignData()
  }, [campaignId])

  const fetchCampaignData = async () => {
    setIsLoading(true)
    try {
      const client = new MetaAPIEnhanced(accessToken, adAccountId)
      const data = await client.getCampaignCompleteHistory(campaignId)
      
      setCampaign(data.campaign)
      setHistory(data.history)
      setBudget(data.budget)
      setMetrics(data.metrics)
    } catch (error) {
      console.error('Failed to fetch campaign data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFilteredData = () => {
    if (timeRange === 'all') return history
    
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    return history.slice(-days)
  }

  const filteredData = getFilteredData()

  const downloadCSV = () => {
    const headers = ['Date', 'Spend', 'Revenue', 'ROAS', 'Conversions', 'CPA', 'Impressions', 'Clicks', 'CTR', 'CPC']
    const rows = history.map(day => [
      day.date,
      day.spend.toFixed(2),
      day.revenue.toFixed(2),
      day.roas.toFixed(2),
      day.conversions,
      day.cpa.toFixed(2),
      day.impressions,
      day.clicks,
      day.ctr.toFixed(2),
      day.cpc.toFixed(2)
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${campaign?.name || 'campaign'}-data.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading campaign data...</p>
        </div>
      </div>
    )
  }

  const totalSpend = history.reduce((sum, day) => sum + day.spend, 0)
  const totalRevenue = history.reduce((sum, day) => sum + day.revenue, 0)
  const totalConversions = history.reduce((sum, day) => sum + day.conversions, 0)
  const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{campaign?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={campaign?.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {campaign?.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Created {new Date(campaign?.created_time).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={downloadCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Predictive Analytics */}
      {campaign && history.length > 0 && (
        <div className="mb-6">
          <CampaignPredictiveMini 
            campaign={{
              ...campaign,
              insights: {
                spend: totalSpend,
                revenue: totalRevenue,
                roas: overallROAS,
                conversions: totalConversions
              },
              daysRunning: history.length,
              lifetimeROAS: overallROAS
            }} 
          />
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics?.avgDailySpend || 0)}/day avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <div className="flex items-center text-xs">
              {overallROAS >= 1 ? (
                <TrendUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={overallROAS >= 1 ? 'text-green-500' : 'text-red-500'}>
                {overallROAS.toFixed(2)}x ROAS
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumberWithCommas(totalConversions)}</div>
            <p className="text-xs text-muted-foreground">
              {totalConversions > 0 ? formatCurrency(totalSpend / totalConversions) : '$0'} CPA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-2xl font-bold">
              {metrics?.trend === 'improving' && <TrendUp className="h-5 w-5 text-green-500 mr-2" />}
              {metrics?.trend === 'declining' && <TrendDown className="h-5 w-5 text-red-500 mr-2" />}
              {metrics?.trend === 'stable' && <Minus className="h-5 w-5 text-yellow-500 mr-2" />}
              <span className="capitalize">{metrics?.trend}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.weekOverWeekGrowth > 0 ? '+' : ''}{metrics?.weekOverWeekGrowth.toFixed(1)}% WoW
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Tracking */}
      {budget && (budget.dailyBudget || budget.lifetimeBudget) && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
            <CardDescription>
              Campaign budget tracking and projections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget Type</span>
                <span className="font-medium">
                  {budget.dailyBudget ? 'Daily' : 'Lifetime'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Budget Amount</span>
                <span className="font-medium">
                  {formatCurrency(budget.dailyBudget || budget.lifetimeBudget || 0)}
                  {budget.dailyBudget ? '/day' : ' total'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Spent</span>
                <span className="font-medium">{formatCurrency(budget.totalSpent)}</span>
              </div>
              {budget.lifetimeBudget && (
                <>
                  <Progress 
                    value={(budget.totalSpent / budget.lifetimeBudget) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{((budget.totalSpent / budget.lifetimeBudget) * 100).toFixed(1)}% used</span>
                    <span>{formatCurrency(budget.remainingBudget)} remaining</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm">
                <span>Burn Rate</span>
                <span className="font-medium">{formatCurrency(budget.burnRate)}/day</span>
              </div>
              {budget.projectedEndDate && (
                <div className="flex justify-between text-sm">
                  <span>Projected End Date</span>
                  <span className="font-medium">
                    {budget.projectedEndDate.toLocaleDateString()} ({budget.daysRemaining} days)
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Spend Over Time</CardTitle>
              <CardDescription>
                Daily performance tracking with ROAS indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'ROAS') return value.toFixed(2) + 'x'
                      return formatCurrency(value)
                    }}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                    name="Revenue"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="spend"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.3}
                    name="Spend"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="roas"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="ROAS"
                  />
                  <ReferenceLine yAxisId="right" y={1} stroke="#666" strokeDasharray="3 3" />
                  <Brush dataKey="date" height={30} stroke="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversions & CPA Trend</CardTitle>
              <CardDescription>
                Conversion volume and cost efficiency over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'CPA') return formatCurrency(value)
                      return value
                    }}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="conversions"
                    fill="#8b5cf6"
                    name="Conversions"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cpa"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    name="CPA"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CTR & CPC Analysis</CardTitle>
              <CardDescription>
                Click-through rate and cost per click trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'CTR') return value.toFixed(2) + '%'
                      return formatCurrency(value)
                    }}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="ctr"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="CTR"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cpc"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="CPC"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impressions & Clicks</CardTitle>
              <CardDescription>
                Reach and engagement metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => formatNumberWithCommas(value)}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="impressions"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    name="Impressions"
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.5}
                    name="Clicks"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Best/Worst Days */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics?.bestDay && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                Best Performing Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {new Date(metrics.bestDay.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ROAS</span>
                  <span className="font-medium text-green-500">
                    {metrics.bestDay.roas.toFixed(2)}x
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-medium">
                    {formatCurrency(metrics.bestDay.revenue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spend</span>
                  <span className="font-medium">
                    {formatCurrency(metrics.bestDay.spend)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {metrics?.worstDay && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Worst Performing Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {new Date(metrics.worstDay.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ROAS</span>
                  <span className="font-medium text-red-500">
                    {metrics.worstDay.roas.toFixed(2)}x
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-medium">
                    {formatCurrency(metrics.worstDay.revenue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spend</span>
                  <span className="font-medium">
                    {formatCurrency(metrics.worstDay.spend)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}