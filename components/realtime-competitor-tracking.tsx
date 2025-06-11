'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMetricUpdates } from '@/hooks/use-websocket'
import { 
  TrendingUp, 
  TrendingDown, 
  Eye,
  DollarSign,
  Target,
  AlertTriangle,
  BarChart3,
  Search,
  Zap,
  Activity
} from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Bar, BarChart } from 'recharts'
import { cn } from '@/lib/utils'

interface CompetitorData {
  id: string
  name: string
  domain: string
  industry: string
  estimatedAdSpend: number
  activeAds: number
  adNetworks: string[]
  topKeywords: string[]
  averageCPC: number
  marketShare: number
  lastUpdate: Date
  trends: {
    spendChange: number
    adVolumeChange: number
    keywordChange: number
  }
  adPerformance: {
    impressionShare: number
    clickThroughRate: number
    conversionRate: number
  }
}

interface CompetitorAlert {
  id: string
  competitorId: string
  type: 'new_ad' | 'budget_increase' | 'keyword_bid' | 'performance_change'
  severity: 'info' | 'warning' | 'high'
  message: string
  timestamp: Date
  data?: Record<string, any>
}

interface MarketInsight {
  id: string
  title: string
  description: string
  category: 'opportunity' | 'threat' | 'trend'
  impact: 'low' | 'medium' | 'high'
  timestamp: Date
  recommendedActions: string[]
}

export function RealtimeCompetitorTracking() {
  const [competitors, setCompetitors] = useState<Map<string, CompetitorData>>(new Map())
  const [alerts, setAlerts] = useState<CompetitorAlert[]>([])
  const [insights, setInsights] = useState<MarketInsight[]>([])
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null)
  const [marketTrends, setMarketTrends] = useState<Array<{
    date: string
    totalSpend: number
    avgCPC: number
    adVolume: number
  }>>([])

  // Subscribe to competitor updates
  useMetricUpdates('competitor', useCallback((data: any) => {
    updateCompetitorData(data)
  }, []))

  useMetricUpdates('market', useCallback((data: any) => {
    updateMarketData(data)
  }, []))

  const updateCompetitorData = (data: any) => {
    setCompetitors(prev => {
      const updated = new Map(prev)
      const existing = updated.get(data.competitorId) || createDefaultCompetitor(data.competitorId, data.name)
      
      const updatedCompetitor: CompetitorData = {
        ...existing,
        ...data,
        lastUpdate: new Date()
      }
      
      updated.set(data.competitorId, updatedCompetitor)
      return updated
    })

    // Generate alerts for significant changes
    if (data.trends) {
      generateCompetitorAlerts(data)
    }
  }

  const updateMarketData = (data: any) => {
    setMarketTrends(prev => {
      const newTrend = {
        date: new Date().toISOString().split('T')[0],
        totalSpend: data.totalSpend || 0,
        avgCPC: data.avgCPC || 0,
        adVolume: data.adVolume || 0
      }
      
      const updated = [...prev, newTrend].slice(-30) // Keep last 30 days
      return updated
    })

    // Generate market insights
    generateMarketInsights(data)
  }

  const createDefaultCompetitor = (id: string, name: string): CompetitorData => ({
    id,
    name,
    domain: `${name.toLowerCase().replace(/\s+/g, '')}.com`,
    industry: 'Digital Marketing',
    estimatedAdSpend: 0,
    activeAds: 0,
    adNetworks: ['Google Ads', 'Facebook'],
    topKeywords: [],
    averageCPC: 0,
    marketShare: 0,
    lastUpdate: new Date(),
    trends: {
      spendChange: 0,
      adVolumeChange: 0,
      keywordChange: 0
    },
    adPerformance: {
      impressionShare: 0,
      clickThroughRate: 0,
      conversionRate: 0
    }
  })

  const generateCompetitorAlerts = (data: any) => {
    const alerts: CompetitorAlert[] = []

    if (data.trends?.spendChange > 25) {
      alerts.push({
        id: `alert_${Date.now()}_1`,
        competitorId: data.competitorId,
        type: 'budget_increase',
        severity: 'high',
        message: `${data.name} increased ad spend by ${data.trends.spendChange}%`,
        timestamp: new Date(),
        data: { change: data.trends.spendChange }
      })
    }

    if (data.trends?.adVolumeChange > 50) {
      alerts.push({
        id: `alert_${Date.now()}_2`,
        competitorId: data.competitorId,
        type: 'new_ad',
        severity: 'warning',
        message: `${data.name} launched ${data.trends.adVolumeChange}% more ads`,
        timestamp: new Date(),
        data: { change: data.trends.adVolumeChange }
      })
    }

    setAlerts(prev => [...alerts, ...prev].slice(0, 50))
  }

  const generateMarketInsights = (data: any) => {
    const insights: MarketInsight[] = []

    if (data.cpcTrend && data.cpcTrend < -10) {
      insights.push({
        id: `insight_${Date.now()}_1`,
        title: 'CPC Costs Declining',
        description: `Market average CPC has decreased by ${Math.abs(data.cpcTrend)}% - opportunity to increase bids`,
        category: 'opportunity',
        impact: 'medium',
        timestamp: new Date(),
        recommendedActions: [
          'Consider increasing bid strategies',
          'Expand keyword targeting',
          'Launch new campaigns while costs are low'
        ]
      })
    }

    if (data.competitorActivity && data.competitorActivity > 30) {
      insights.push({
        id: `insight_${Date.now()}_2`,
        title: 'Increased Competitor Activity',
        description: `${data.competitorActivity}% increase in competitor ad launches detected`,
        category: 'threat',
        impact: 'high',
        timestamp: new Date(),
        recommendedActions: [
          'Review competitor ad copy and strategies',
          'Adjust bidding to maintain position',
          'Consider defensive campaigns'
        ]
      })
    }

    setInsights(prev => [...insights, ...prev].slice(0, 20))
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toFixed(0)
  }

  const getTrendIcon = (change: number) => {
    if (change > 5) return <TrendingUp className="h-4 w-4 text-red-500" />
    if (change < -5) return <TrendingDown className="h-4 w-4 text-green-500" />
    return <Activity className="h-4 w-4 text-gray-500" />
  }

  const getInsightColor = (category: MarketInsight['category']): string => {
    switch (category) {
      case 'opportunity': return 'text-green-500'
      case 'threat': return 'text-red-500'
      case 'trend': return 'text-blue-500'
    }
  }

  const getImpactColor = (impact: MarketInsight['impact']): string => {
    switch (impact) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
    }
  }

  const currentCompetitor = selectedCompetitor ? competitors.get(selectedCompetitor) : null
  const totalMarketSpend = Array.from(competitors.values()).reduce((sum, c) => sum + c.estimatedAdSpend, 0)
  const topCompetitors = Array.from(competitors.values())
    .sort((a, b) => b.estimatedAdSpend - a.estimatedAdSpend)
    .slice(0, 5)

  // Initialize with sample data
  useEffect(() => {
    const sampleCompetitors = [
      {
        id: 'comp1',
        name: 'AdTech Solutions',
        estimatedAdSpend: 150000,
        activeAds: 245,
        averageCPC: 2.45,
        marketShare: 15.2,
        trends: { spendChange: 12, adVolumeChange: 8, keywordChange: 3 },
        adPerformance: { impressionShare: 23.5, clickThroughRate: 3.2, conversionRate: 4.1 }
      },
      {
        id: 'comp2',
        name: 'Digital Marketing Pro',
        estimatedAdSpend: 220000,
        activeAds: 189,
        averageCPC: 3.12,
        marketShare: 22.1,
        trends: { spendChange: -5, adVolumeChange: 15, keywordChange: -2 },
        adPerformance: { impressionShare: 31.2, clickThroughRate: 2.8, conversionRate: 5.3 }
      },
      {
        id: 'comp3',
        name: 'Growth Analytics',
        estimatedAdSpend: 95000,
        activeAds: 156,
        averageCPC: 1.89,
        marketShare: 9.5,
        trends: { spendChange: 28, adVolumeChange: 35, keywordChange: 12 },
        adPerformance: { impressionShare: 18.7, clickThroughRate: 4.1, conversionRate: 3.8 }
      }
    ]

    sampleCompetitors.forEach(comp => {
      updateCompetitorData(comp)
    })
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Competitor Intelligence</h2>
          <p className="text-muted-foreground">Real-time competitor tracking and market analysis</p>
        </div>
        <Button variant="outline">
          <Search className="h-4 w-4 mr-2" />
          Add Competitor
        </Button>
      </div>

      {/* Market Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMarketSpend)}</div>
            <p className="text-xs text-muted-foreground">Total competitor spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Competitors</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{competitors.size}</div>
            <p className="text-xs text-muted-foreground">Being monitored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">Recent notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground">Actionable insights</p>
          </CardContent>
        </Card>
      </div>

      {/* Competitor Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>Top Competitors</CardTitle>
          <CardDescription>Ranked by estimated ad spend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCompetitors.map((competitor, index) => (
              <div
                key={competitor.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors",
                  selectedCompetitor === competitor.id ? "border-primary bg-secondary/50" : "hover:bg-secondary/25"
                )}
                onClick={() => setSelectedCompetitor(competitor.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {index + 1}
                  </div>
                  
                  <div>
                    <h3 className="font-medium">{competitor.name}</h3>
                    <p className="text-sm text-muted-foreground">{competitor.domain}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(competitor.estimatedAdSpend)}</p>
                    <p className="text-xs text-muted-foreground">Monthly spend</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium">{competitor.activeAds}</p>
                    <p className="text-xs text-muted-foreground">Active ads</p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(competitor.trends.spendChange)}
                      <span className={cn(
                        'text-sm font-medium',
                        competitor.trends.spendChange > 0 ? 'text-red-500' : 'text-green-500'
                      )}>
                        {competitor.trends.spendChange > 0 ? '+' : ''}{competitor.trends.spendChange}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Spend change</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium">{competitor.marketShare.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Market share</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed View */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="alerts">Recent Alerts</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          {currentCompetitor && <TabsTrigger value="competitor">Competitor Detail</TabsTrigger>}
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Spending Trends</CardTitle>
              <CardDescription>30-day competitor spending analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={marketTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'totalSpend' ? formatCurrency(value) : value,
                        name
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalSpend"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Total Spend"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Alerts</CardTitle>
              <CardDescription>Real-time notifications about competitor activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start space-x-3 p-3 rounded-lg",
                      alert.severity === 'high' ? 'bg-red-50 border border-red-200' :
                      alert.severity === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-blue-50 border border-blue-200'
                    )}
                  >
                    <AlertTriangle className={cn(
                      'h-5 w-5 mt-0.5',
                      alert.severity === 'high' ? 'text-red-500' :
                      alert.severity === 'warning' ? 'text-yellow-500' :
                      'text-blue-500'
                    )} />
                    
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                        <span>{alert.timestamp.toLocaleString()}</span>
                        <Badge variant="outline" className="text-xs">
                          {alert.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Insights</CardTitle>
              <CardDescription>AI-powered competitive intelligence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map(insight => (
                  <Card key={insight.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{insight.title}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getImpactColor(insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                          <Badge variant="outline" className={getInsightColor(insight.category)}>
                            {insight.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Recommended Actions:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {insight.recommendedActions.map((action, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span>•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {currentCompetitor && (
          <TabsContent value="competitor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{currentCompetitor.name} - Detailed Analysis</CardTitle>
                <CardDescription>In-depth competitor performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium">Spending Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Estimated Monthly Spend:</span>
                        <span className="font-medium">{formatCurrency(currentCompetitor.estimatedAdSpend)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average CPC:</span>
                        <span className="font-medium">${currentCompetitor.averageCPC.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Market Share:</span>
                        <span className="font-medium">{currentCompetitor.marketShare.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Performance Metrics</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Impression Share:</span>
                          <span>{currentCompetitor.adPerformance.impressionShare.toFixed(1)}%</span>
                        </div>
                        <Progress value={currentCompetitor.adPerformance.impressionShare} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>CTR:</span>
                          <span>{currentCompetitor.adPerformance.clickThroughRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={currentCompetitor.adPerformance.clickThroughRate * 10} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Conversion Rate:</span>
                          <span>{currentCompetitor.adPerformance.conversionRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={currentCompetitor.adPerformance.conversionRate * 10} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}