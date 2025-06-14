'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, TrendingDown, AlertTriangle, Activity,
  DollarSign, Clock, Brain, Zap, Target, BarChart3,
  ArrowUp, ArrowDown, RefreshCw, Settings, Eye
} from "lucide-react"
import { formatCurrency, formatNumberWithCommas, formatPercentage } from "@/lib/utils"

interface Campaign {
  id: string
  name: string
  status: string
  daily_budget?: number
  lifetime_budget?: number
  spend: number
  revenue: number
  roas: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpa: number
  // Today's metrics
  todaySpend?: number
  todayRevenue?: number
  todayROAS?: number
  todayConversions?: number
  // Yesterday comparison
  yesterdaySpend?: number
  yesterdayROAS?: number
}

interface HourlyPerformance {
  hour: number
  spend: number
  revenue: number
  roas: number
  conversions: number
}

interface BudgetCommandCenterProps {
  campaigns: Campaign[]
  overviewData: {
    totalSpend: number
    totalRevenue: number
    overallROAS: number
    totalConversions: number
    todaySpend?: number
    todayRevenue?: number
  }
}

export function BudgetCommandCenter({ campaigns, overviewData }: BudgetCommandCenterProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month'>('today')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hourlyData, setHourlyData] = useState<HourlyPerformance[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])

  // Calculate key metrics
  const metrics = useMemo(() => {
    const currentHour = new Date().getHours()
    const todaySpend = campaigns.reduce((sum, c) => sum + (c.todaySpend || 0), 0)
    const todayRevenue = campaigns.reduce((sum, c) => sum + (c.todayRevenue || 0), 0)
    const todayBudget = campaigns.reduce((sum, c) => sum + (Number(c.daily_budget) || 0), 0)
    const spendPace = todayBudget > 0 ? (todaySpend / todayBudget) * 100 : 0
    const expectedPace = (currentHour / 24) * 100
    const paceStatus = spendPace > expectedPace * 1.2 ? 'overpacing' : 
                      spendPace < expectedPace * 0.8 ? 'underpacing' : 'on-track'

    // High/Low performers
    const highPerformers = campaigns.filter(c => c.roas > overviewData.overallROAS * 1.5)
    const lowPerformers = campaigns.filter(c => c.roas < overviewData.overallROAS * 0.5 && c.spend > 100)
    
    // Budget opportunities
    const underutilized = campaigns.filter(c => {
      const budget = Number(c.daily_budget) || 0
      const spend = c.todaySpend || 0
      return budget > 0 && (spend / budget) < 0.5 && currentHour > 12
    })

    return {
      todaySpend,
      todayRevenue,
      todayBudget,
      todayROAS: todaySpend > 0 ? todayRevenue / todaySpend : 0,
      spendPace,
      expectedPace,
      paceStatus,
      highPerformers,
      lowPerformers,
      underutilized,
      projectedEndOfDaySpend: currentHour > 0 ? (todaySpend / currentHour) * 24 : 0,
      remainingBudget: todayBudget - todaySpend,
      remainingHours: 24 - currentHour
    }
  }, [campaigns, overviewData])

  // Generate hourly performance data
  useEffect(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      spend: Math.random() * 1000 + 500,
      revenue: Math.random() * 3000 + 1000,
      roas: 2 + Math.random() * 2,
      conversions: Math.floor(Math.random() * 20 + 5)
    }))
    setHourlyData(hours)
  }, [])

  // Analyze all campaigns
  const analyzeAllCampaigns = async () => {
    setIsAnalyzing(true)
    
    try {
      const anthropicApiKey = localStorage.getItem('anthropic_api_key')
      
      if (!anthropicApiKey) {
        // Generate local recommendations
        const recs = generateLocalRecommendations()
        setRecommendations(recs)
      } else {
        // Call AI API
        const response = await fetch('/api/ai/bulk-optimization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaigns,
            metrics,
            overviewData,
            anthropicApiKey
          })
        })

        if (response.ok) {
          const result = await response.json()
          setRecommendations(result.recommendations || [])
        } else {
          setRecommendations(generateLocalRecommendations())
        }
      }
    } catch (error) {
      console.error('Error analyzing campaigns:', error)
      setRecommendations(generateLocalRecommendations())
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateLocalRecommendations = () => {
    const recs = []
    
    // High performer recommendations
    metrics.highPerformers.forEach(campaign => {
      const budget = Number(campaign.daily_budget) || 0
      if (budget > 0 && campaign.todaySpend && campaign.todaySpend / budget < 0.8) {
        recs.push({
          type: 'opportunity',
          priority: 'high',
          campaign: campaign.name,
          action: `Increase budget by 30% (to $${(budget * 1.3).toFixed(2)})`,
          reason: `ROAS of ${campaign.roas.toFixed(2)}x with underutilized budget`,
          impact: `+$${(budget * 0.3 * campaign.roas).toFixed(2)} potential revenue`
        })
      }
    })

    // Low performer recommendations
    metrics.lowPerformers.forEach(campaign => {
      recs.push({
        type: 'risk',
        priority: 'high',
        campaign: campaign.name,
        action: campaign.roas < 1 ? 'Pause campaign' : 'Reduce budget by 50%',
        reason: `ROAS of ${campaign.roas.toFixed(2)}x is below profitable threshold`,
        impact: `Save $${(campaign.todaySpend || campaign.spend * 0.04).toFixed(2)} daily`
      })
    })

    // Pacing recommendations
    if (metrics.paceStatus === 'overpacing') {
      recs.push({
        type: 'warning',
        priority: 'medium',
        campaign: 'Account Level',
        action: 'Reduce budgets for low-performing campaigns',
        reason: `Spending ${metrics.spendPace.toFixed(0)}% of budget at ${metrics.expectedPace.toFixed(0)}% of day`,
        impact: 'Prevent budget exhaustion'
      })
    }

    return recs
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overpacing': return 'text-red-500'
      case 'underpacing': return 'text-yellow-500'
      case 'on-track': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'risk': return <TrendingDown className="w-5 h-5 text-red-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      default: return <Activity className="w-5 h-5 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Budget Command Center</h2>
          <p className="text-muted-foreground">Real-time budget optimization and monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={analyzeAllCampaigns}
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            {isAnalyzing ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Analyze All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Today's Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Spend</span>
                <span className="text-sm font-bold">{formatCurrency(metrics.todaySpend)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Revenue</span>
                <span className="text-sm font-bold text-green-600">{formatCurrency(metrics.todayRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">ROAS</span>
                <span className="text-sm font-bold">{metrics.todayROAS.toFixed(2)}x</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Pacing */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Budget Pacing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${getStatusColor(metrics.paceStatus)}`}>
                  {metrics.paceStatus.charAt(0).toUpperCase() + metrics.paceStatus.slice(1).replace('-', ' ')}
                </span>
                <Badge variant="outline" className="text-xs">
                  {metrics.spendPace.toFixed(0)}% spent
                </Badge>
              </div>
              <Progress value={metrics.spendPace} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Expected: {metrics.expectedPace.toFixed(0)}% | Remaining: {formatCurrency(metrics.remainingBudget)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">High Performers</span>
                <Badge variant="default" className="bg-green-500">
                  {metrics.highPerformers.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Underutilized</span>
                <Badge variant="default" className="bg-yellow-500">
                  {metrics.underutilized.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">At Risk</span>
                <Badge variant="default" className="bg-red-500">
                  {metrics.lowPerformers.length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projections */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">End of Day Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Projected Spend</span>
                <span className="text-sm font-bold">{formatCurrency(metrics.projectedEndOfDaySpend)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Hours Remaining</span>
                <span className="text-sm font-bold">{metrics.remainingHours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Avg Hourly</span>
                <span className="text-sm font-bold">
                  {formatCurrency(metrics.remainingHours > 0 ? metrics.remainingBudget / metrics.remainingHours : 0)}/hr
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Performance Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hourly Performance Heatmap</CardTitle>
                <CardDescription>ROAS by hour (darker = better)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-12 gap-1">
                  {hourlyData.slice(0, 12).map((hour) => (
                    <div
                      key={hour.hour}
                      className="aspect-square rounded flex items-center justify-center text-xs font-medium"
                      style={{
                        backgroundColor: `rgba(34, 197, 94, ${Math.min(hour.roas / 4, 1)})`,
                        color: hour.roas > 2 ? 'white' : 'black'
                      }}
                    >
                      {hour.hour}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-12 gap-1 mt-1">
                  {hourlyData.slice(12).map((hour) => (
                    <div
                      key={hour.hour}
                      className="aspect-square rounded flex items-center justify-center text-xs font-medium"
                      style={{
                        backgroundColor: `rgba(34, 197, 94, ${Math.min(hour.roas / 4, 1)})`,
                        color: hour.roas > 2 ? 'white' : 'black'
                      }}
                    >
                      {hour.hour}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
                <CardDescription>One-click optimizations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <ArrowUp className="w-4 h-4 mr-2 text-green-500" />
                  Boost top 3 performers by 20%
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <ArrowDown className="w-4 h-4 mr-2 text-red-500" />
                  Reduce underperformers by 30%
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Target className="w-4 h-4 mr-2 text-blue-500" />
                  Redistribute budget to high ROAS
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                  Apply AI recommendations
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Budget Performance</CardTitle>
              <CardDescription>Real-time campaign budget utilization and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.slice(0, 10).map((campaign) => {
                  const budget = Number(campaign.daily_budget) || 0
                  const spend = campaign.todaySpend || 0
                  const utilization = budget > 0 ? (spend / budget) * 100 : 0
                  
                  return (
                    <div key={campaign.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(spend)} / {formatCurrency(budget)} • ROAS: {campaign.roas.toFixed(2)}x
                          </p>
                        </div>
                        <Badge 
                          variant={utilization > 80 ? "destructive" : utilization > 50 ? "default" : "secondary"}
                        >
                          {utilization.toFixed(0)}% used
                        </Badge>
                      </div>
                      <Progress value={utilization} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hourly Analysis Tab */}
        <TabsContent value="hourly">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Performance Breakdown</CardTitle>
              <CardDescription>Detailed metrics by hour</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Hour</th>
                      <th className="text-right py-2">Spend</th>
                      <th className="text-right py-2">Revenue</th>
                      <th className="text-right py-2">ROAS</th>
                      <th className="text-right py-2">Conversions</th>
                      <th className="text-right py-2">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hourlyData.map((hour) => (
                      <tr key={hour.hour} className="border-b">
                        <td className="py-2">{hour.hour}:00</td>
                        <td className="text-right">{formatCurrency(hour.spend)}</td>
                        <td className="text-right">{formatCurrency(hour.revenue)}</td>
                        <td className="text-right">
                          <span className={hour.roas > 2.5 ? 'text-green-600 font-medium' : ''}>
                            {hour.roas.toFixed(2)}x
                          </span>
                        </td>
                        <td className="text-right">{hour.conversions}</td>
                        <td className="text-right">
                          <Badge variant={hour.roas > 3 ? "default" : "secondary"}>
                            {hour.roas > 3 ? 'High' : hour.roas > 2 ? 'Good' : 'Low'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          <div className="space-y-4">
            {recommendations.length === 0 && !isAnalyzing ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Click "Analyze All" to get AI-powered recommendations
                  </p>
                </CardContent>
              </Card>
            ) : (
              recommendations.map((rec, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {getRecommendationIcon(rec.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{rec.campaign}</h4>
                          <Badge className={
                            rec.priority === 'high' ? 'bg-red-500' :
                            rec.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }>
                            {rec.priority} priority
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">{rec.action}</p>
                        <p className="text-xs text-muted-foreground mb-2">{rec.reason}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{rec.impact}</span>
                          <Button size="sm" variant="outline">
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}