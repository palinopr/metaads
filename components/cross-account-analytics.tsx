'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  TrendingUp, TrendingDown, DollarSign, Target, Activity,
  BarChart3, PieChart, Calendar, Filter, Zap, AlertTriangle,
  CheckCircle, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart
} from 'recharts'
import { useMultiAccountStore } from '@/lib/multi-account-store'

interface AnalyticsFilters {
  timeframe: '7d' | '30d' | '90d' | '1y'
  metric: 'roas' | 'ctr' | 'cpc' | 'conversions' | 'revenue' | 'spend'
  groupBy: 'account' | 'group' | 'label' | 'time'
  showTrends: boolean
  showOutliers: boolean
  minRoas: number
}

interface CorrelationData {
  spendVsRevenue: number
  ctrVsConversions: number
  cpcVsRoas: number
  impressionsVsClicks: number
}

interface PredictiveInsight {
  id: string
  type: 'opportunity' | 'warning' | 'trend'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  accounts: string[]
  metric: string
  value: number
  change: number
}

export function CrossAccountAnalytics() {
  const {
    accounts,
    accountGroups,
    getAccountsByGroup,
    getAccountsByLabel,
    getConsolidatedMetrics
  } = useMultiAccountStore()

  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeframe: '30d',
    metric: 'roas',
    groupBy: 'account',
    showTrends: true,
    showOutliers: false,
    minRoas: 0
  })

  const [selectedView, setSelectedView] = useState<'overview' | 'correlation' | 'segmentation' | 'predictions'>('overview')

  // Calculate analytics data based on filters
  const analyticsData = useMemo(() => {
    const filteredAccounts = accounts.filter(acc => 
      (acc.metrics?.roas || 0) >= filters.minRoas
    )

    const baseData = filteredAccounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      spend: acc.metrics?.spend || 0,
      revenue: acc.metrics?.revenue || 0,
      roas: acc.metrics?.roas || 0,
      ctr: acc.metrics?.ctr || 0,
      cpc: acc.metrics?.cpc || 0,
      conversions: acc.metrics?.conversions || 0,
      impressions: acc.metrics?.impressions || 0,
      clicks: acc.metrics?.clicks || 0,
      groups: acc.groups,
      labels: acc.labels
    }))

    return baseData
  }, [accounts, filters])

  // Generate time series data
  const timeSeriesData = useMemo(() => {
    const days = filters.timeframe === '7d' ? 7 : filters.timeframe === '30d' ? 30 : filters.timeframe === '90d' ? 90 : 365
    const data = []
    
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (days - i))
      
      data.push({
        date: date.toISOString().split('T')[0],
        spend: Math.floor(Math.random() * 10000) + 5000,
        revenue: Math.floor(Math.random() * 30000) + 15000,
        conversions: Math.floor(Math.random() * 200) + 50,
        roas: 2 + Math.random() * 3,
        ctr: 1 + Math.random() * 3,
        cpc: 0.5 + Math.random() * 2
      })
    }
    
    return data
  }, [filters.timeframe])

  // Calculate correlations
  const correlationData: CorrelationData = useMemo(() => {
    const validAccounts = analyticsData.filter(acc => acc.spend > 0 && acc.revenue > 0)
    
    if (validAccounts.length < 2) {
      return { spendVsRevenue: 0, ctrVsConversions: 0, cpcVsRoas: 0, impressionsVsClicks: 0 }
    }

    // Simple correlation calculation (Pearson correlation coefficient)
    const calculateCorrelation = (x: number[], y: number[]) => {
      const n = x.length
      const sumX = x.reduce((a, b) => a + b, 0)
      const sumY = y.reduce((a, b) => a + b, 0)
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
      const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
      const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)
      
      const numerator = n * sumXY - sumX * sumY
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
      
      return denominator === 0 ? 0 : numerator / denominator
    }

    return {
      spendVsRevenue: calculateCorrelation(
        validAccounts.map(acc => acc.spend),
        validAccounts.map(acc => acc.revenue)
      ),
      ctrVsConversions: calculateCorrelation(
        validAccounts.map(acc => acc.ctr),
        validAccounts.map(acc => acc.conversions)
      ),
      cpcVsRoas: calculateCorrelation(
        validAccounts.map(acc => acc.cpc),
        validAccounts.map(acc => acc.roas)
      ),
      impressionsVsClicks: calculateCorrelation(
        validAccounts.map(acc => acc.impressions),
        validAccounts.map(acc => acc.clicks)
      )
    }
  }, [analyticsData])

  // Generate predictive insights
  const predictiveInsights: PredictiveInsight[] = useMemo(() => {
    const insights: PredictiveInsight[] = []

    // High ROAS opportunity
    const highRoasAccounts = analyticsData.filter(acc => acc.roas > 4)
    if (highRoasAccounts.length > 0) {
      insights.push({
        id: '1',
        type: 'opportunity',
        title: 'Scale High-Performing Accounts',
        description: `${highRoasAccounts.length} accounts showing ROAS > 4x. Consider increasing budget allocation.`,
        impact: 'high',
        accounts: highRoasAccounts.map(acc => acc.id),
        metric: 'roas',
        value: Math.max(...highRoasAccounts.map(acc => acc.roas)),
        change: 15
      })
    }

    // Low CTR warning
    const lowCtrAccounts = analyticsData.filter(acc => acc.ctr < 1)
    if (lowCtrAccounts.length > 0) {
      insights.push({
        id: '2',
        type: 'warning',
        title: 'Low CTR Alert',
        description: `${lowCtrAccounts.length} accounts have CTR below 1%. Review ad creative and targeting.`,
        impact: 'medium',
        accounts: lowCtrAccounts.map(acc => acc.id),
        metric: 'ctr',
        value: Math.min(...lowCtrAccounts.map(acc => acc.ctr)),
        change: -25
      })
    }

    // Budget efficiency trend
    const totalSpend = analyticsData.reduce((sum, acc) => sum + acc.spend, 0)
    const totalRevenue = analyticsData.reduce((sum, acc) => sum + acc.revenue, 0)
    if (totalSpend > 0) {
      const portfolioRoas = totalRevenue / totalSpend
      insights.push({
        id: '3',
        type: 'trend',
        title: 'Portfolio ROAS Trend',
        description: `Overall portfolio ROAS is ${portfolioRoas.toFixed(2)}x. ${portfolioRoas > 3 ? 'Strong' : 'Moderate'} performance across accounts.`,
        impact: portfolioRoas > 3 ? 'high' : 'medium',
        accounts: analyticsData.map(acc => acc.id),
        metric: 'roas',
        value: portfolioRoas,
        change: Math.random() > 0.5 ? 8 : -3
      })
    }

    return insights
  }, [analyticsData])

  // Group data by selected dimension
  const groupedData = useMemo(() => {
    switch (filters.groupBy) {
      case 'group':
        return accountGroups.map(group => {
          const groupAccounts = getAccountsByGroup(group.id)
          const spend = groupAccounts.reduce((sum, acc) => sum + (acc.metrics?.spend || 0), 0)
          const revenue = groupAccounts.reduce((sum, acc) => sum + (acc.metrics?.revenue || 0), 0)
          return {
            name: group.name,
            spend,
            revenue,
            roas: spend > 0 ? revenue / spend : 0,
            accounts: groupAccounts.length
          }
        })
      case 'label':
        const allLabels = Array.from(new Set(accounts.flatMap(acc => acc.labels)))
        return allLabels.map(label => {
          const labelAccounts = getAccountsByLabel(label)
          const spend = labelAccounts.reduce((sum, acc) => sum + (acc.metrics?.spend || 0), 0)
          const revenue = labelAccounts.reduce((sum, acc) => sum + (acc.metrics?.revenue || 0), 0)
          return {
            name: label,
            spend,
            revenue,
            roas: spend > 0 ? revenue / spend : 0,
            accounts: labelAccounts.length
          }
        })
      default:
        return analyticsData.map(acc => ({
          name: acc.name,
          spend: acc.spend,
          revenue: acc.revenue,
          roas: acc.roas,
          ctr: acc.ctr,
          cpc: acc.cpc,
          conversions: acc.conversions
        }))
    }
  }, [filters.groupBy, analyticsData, accountGroups, getAccountsByGroup, getAccountsByLabel, accounts])

  const chartColors = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Cross-Account Analytics</h2>
          <p className="text-muted-foreground">Advanced analytics and insights across your portfolio</p>
        </div>
      </div>

      {/* Analytics Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Analytics Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Timeframe</Label>
              <Select value={filters.timeframe} onValueChange={(v) => setFilters({...filters, timeframe: v as any})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Primary Metric</Label>
              <Select value={filters.metric} onValueChange={(v) => setFilters({...filters, metric: v as any})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roas">ROAS</SelectItem>
                  <SelectItem value="ctr">CTR</SelectItem>
                  <SelectItem value="cpc">CPC</SelectItem>
                  <SelectItem value="conversions">Conversions</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="spend">Spend</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Group By</Label>
              <Select value={filters.groupBy} onValueChange={(v) => setFilters({...filters, groupBy: v as any})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="label">Label</SelectItem>
                  <SelectItem value="time">Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Min ROAS: {filters.minRoas}</Label>
              <Slider
                value={[filters.minRoas]}
                onValueChange={([value]) => setFilters({...filters, minRoas: value})}
                max={10}
                min={0}
                step={0.1}
                className="mt-2"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="trends"
                checked={filters.showTrends}
                onCheckedChange={(checked) => setFilters({...filters, showTrends: checked})}
              />
              <Label htmlFor="trends">Show Trends</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="outliers"
                checked={filters.showOutliers}
                onCheckedChange={(checked) => setFilters({...filters, showOutliers: checked})}
              />
              <Label htmlFor="outliers">Highlight Outliers</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="correlation">Correlations</TabsTrigger>
          <TabsTrigger value="segmentation">Segmentation</TabsTrigger>
          <TabsTrigger value="predictions">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends - {filters.timeframe}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="spend" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Line yAxisId="right" type="monotone" dataKey="roas" stroke="#3b82f6" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance by Group/Account */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance by {filters.groupBy}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={groupedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={filters.metric} fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>ROAS Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={analyticsData}>
                    <CartesianGrid />
                    <XAxis dataKey="spend" name="Spend" />
                    <YAxis dataKey="roas" name="ROAS" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={analyticsData} fill="#3b82f6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Spend vs Revenue</p>
                  <p className="text-2xl font-bold">{(correlationData.spendVsRevenue * 100).toFixed(1)}%</p>
                  <div className="flex items-center justify-center mt-2">
                    {correlationData.spendVsRevenue > 0.7 ? (
                      <Badge variant="default" className="bg-green-500">Strong</Badge>
                    ) : correlationData.spendVsRevenue > 0.3 ? (
                      <Badge variant="secondary">Moderate</Badge>
                    ) : (
                      <Badge variant="destructive">Weak</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">CTR vs Conversions</p>
                  <p className="text-2xl font-bold">{(correlationData.ctrVsConversions * 100).toFixed(1)}%</p>
                  <div className="flex items-center justify-center mt-2">
                    {correlationData.ctrVsConversions > 0.7 ? (
                      <Badge variant="default" className="bg-green-500">Strong</Badge>
                    ) : correlationData.ctrVsConversions > 0.3 ? (
                      <Badge variant="secondary">Moderate</Badge>
                    ) : (
                      <Badge variant="destructive">Weak</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">CPC vs ROAS</p>
                  <p className="text-2xl font-bold">{(correlationData.cpcVsRoas * 100).toFixed(1)}%</p>
                  <div className="flex items-center justify-center mt-2">
                    {Math.abs(correlationData.cpcVsRoas) > 0.7 ? (
                      <Badge variant="default" className="bg-green-500">Strong</Badge>
                    ) : Math.abs(correlationData.cpcVsRoas) > 0.3 ? (
                      <Badge variant="secondary">Moderate</Badge>
                    ) : (
                      <Badge variant="destructive">Weak</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Impressions vs Clicks</p>
                  <p className="text-2xl font-bold">{(correlationData.impressionsVsClicks * 100).toFixed(1)}%</p>
                  <div className="flex items-center justify-center mt-2">
                    {correlationData.impressionsVsClicks > 0.7 ? (
                      <Badge variant="default" className="bg-green-500">Strong</Badge>
                    ) : correlationData.impressionsVsClicks > 0.3 ? (
                      <Badge variant="secondary">Moderate</Badge>
                    ) : (
                      <Badge variant="destructive">Weak</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Spend vs Revenue Correlation</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={analyticsData}>
                    <CartesianGrid />
                    <XAxis dataKey="spend" name="Spend ($)" />
                    <YAxis dataKey="revenue" name="Revenue ($)" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={analyticsData} fill="#10b981" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>CPC vs ROAS Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={analyticsData}>
                    <CartesianGrid />
                    <XAxis dataKey="cpc" name="CPC ($)" />
                    <YAxis dataKey="roas" name="ROAS" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={analyticsData} fill="#ef4444" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="segmentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Radar Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={analyticsData.slice(0, 5)}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis />
                  {analyticsData.slice(0, 5).map((account, index) => (
                    <Radar
                      key={account.id}
                      name={account.name}
                      dataKey="roas"
                      stroke={chartColors[index]}
                      fill={chartColors[index]}
                      fillOpacity={0.3}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">High Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyticsData
                    .filter(acc => acc.roas > 3)
                    .sort((a, b) => b.roas - a.roas)
                    .slice(0, 5)
                    .map(acc => (
                      <div key={acc.id} className="flex justify-between">
                        <span className="text-sm">{acc.name}</span>
                        <Badge variant="default" className="bg-green-500">
                          {acc.roas.toFixed(2)}x
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-600">Average Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyticsData
                    .filter(acc => acc.roas >= 1.5 && acc.roas <= 3)
                    .sort((a, b) => b.roas - a.roas)
                    .slice(0, 5)
                    .map(acc => (
                      <div key={acc.id} className="flex justify-between">
                        <span className="text-sm">{acc.name}</span>
                        <Badge variant="secondary">
                          {acc.roas.toFixed(2)}x
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Underperformers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyticsData
                    .filter(acc => acc.roas < 1.5)
                    .sort((a, b) => a.roas - b.roas)
                    .slice(0, 5)
                    .map(acc => (
                      <div key={acc.id} className="flex justify-between">
                        <span className="text-sm">{acc.name}</span>
                        <Badge variant="destructive">
                          {acc.roas.toFixed(2)}x
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <div className="space-y-4">
            {predictiveInsights.map(insight => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {insight.type === 'opportunity' && <TrendingUp className="h-5 w-5 text-green-500" />}
                      {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                      {insight.type === 'trend' && <Activity className="h-5 w-5 text-blue-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={insight.impact === 'high' ? 'default' : insight.impact === 'medium' ? 'secondary' : 'outline'}
                          >
                            {insight.impact} impact
                          </Badge>
                          <div className="flex items-center gap-1 text-sm">
                            {insight.change > 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-green-500" />
                            ) : insight.change < 0 ? (
                              <ArrowDownRight className="h-4 w-4 text-red-500" />
                            ) : (
                              <Minus className="h-4 w-4 text-gray-500" />
                            )}
                            <span className={insight.change > 0 ? 'text-green-600' : insight.change < 0 ? 'text-red-600' : 'text-gray-600'}>
                              {Math.abs(insight.change)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Affected accounts:</span>
                        <span className="text-sm font-medium">{insight.accounts.length}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}