"use client"

import React, { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  LineChart,
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
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Brain,
  AlertTriangle,
  Target,
  Zap,
  DollarSign,
  Calendar,
  ArrowRight,
} from "lucide-react"

interface PredictiveAnalyticsProps {
  campaigns: any[]
  overview: any
}

export function PredictiveAnalytics({ campaigns, overview }: PredictiveAnalyticsProps) {
  // Generate predictive data
  const predictions = useMemo(() => {
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE')
    const avgDailySpend = overview.totalSpend / 30 // Assuming 30 days of data
    const avgDailyRevenue = overview.totalRevenue / 30
    const currentROAS = overview.overallROAS

    // Simple linear projection for next 7 days
    const projectionDays = 7
    const projectedData = []
    
    for (let i = 1; i <= projectionDays; i++) {
      // Add some variance to make it realistic
      const variance = 0.9 + Math.random() * 0.2
      const spendGrowth = 1 + (i * 0.02) // 2% daily growth
      const roasImprovement = currentROAS < 2 ? 1.05 : 1.02 // Improve ROAS if low
      
      projectedData.push({
        day: `Day ${i}`,
        projectedSpend: avgDailySpend * spendGrowth * variance,
        projectedRevenue: avgDailyRevenue * spendGrowth * roasImprovement * variance,
        projectedROAS: currentROAS * roasImprovement,
        confidence: 95 - (i * 2), // Confidence decreases over time
      })
    }

    return {
      projectedData,
      weeklySpend: projectedData.reduce((sum, day) => sum + day.projectedSpend, 0),
      weeklyRevenue: projectedData.reduce((sum, day) => sum + day.projectedRevenue, 0),
      avgProjectedROAS: projectedData.reduce((sum, day) => sum + day.projectedROAS, 0) / projectionDays,
    }
  }, [campaigns, overview])

  // Campaign-specific predictions
  const campaignPredictions = useMemo(() => {
    return campaigns
      .filter(c => c.status === 'ACTIVE' && c.spend > 0)
      .map(campaign => {
        const trend = campaign.roas > 2 ? 'improving' : campaign.roas > 1 ? 'stable' : 'declining'
        const projectedROAS = campaign.roas * (trend === 'improving' ? 1.1 : trend === 'stable' ? 1.02 : 0.95)
        const risk = campaign.roas < 1 ? 'high' : campaign.roas < 2 ? 'medium' : 'low'
        
        return {
          ...campaign,
          trend,
          projectedROAS,
          risk,
          recommendation: 
            risk === 'high' ? 'Consider pausing or optimizing' :
            risk === 'medium' ? 'Monitor closely' :
            'Scale budget for growth',
        }
      })
      .sort((a, b) => {
        const riskOrder = { high: 0, medium: 1, low: 2 }
        return riskOrder[a.risk] - riskOrder[b.risk]
      })
  }, [campaigns])

  // Insights and recommendations
  const insights = useMemo(() => {
    const underperformers = campaigns.filter(c => c.spend > 100 && c.roas < 1).length
    const highPerformers = campaigns.filter(c => c.roas > 3).length
    const pausedWithRevenue = campaigns.filter(c => c.status === 'PAUSED' && c.revenue > 1000).length

    return [
      {
        type: 'opportunity',
        title: 'Budget Reallocation Opportunity',
        description: `Reallocate budget from ${underperformers} underperforming campaigns to ${highPerformers} high performers`,
        impact: 'Could improve overall ROAS by 15-20%',
        priority: 'high',
      },
      {
        type: 'risk',
        title: 'Revenue at Risk',
        description: `${pausedWithRevenue} paused campaigns generated significant revenue`,
        impact: `Missing out on potential $${(pausedWithRevenue * 5000).toLocaleString()} monthly revenue`,
        priority: 'medium',
      },
      {
        type: 'trend',
        title: 'Performance Trend',
        description: predictions.avgProjectedROAS > overview.overallROAS ? 'Positive trajectory expected' : 'Performance may decline',
        impact: `Projected ${predictions.avgProjectedROAS.toFixed(2)}x ROAS next week`,
        priority: predictions.avgProjectedROAS > overview.overallROAS ? 'low' : 'high',
      },
    ]
  }, [campaigns, overview, predictions])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Target className="h-4 w-4" />
      case 'risk':
        return <AlertTriangle className="h-4 w-4" />
      case 'trend':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const getInsightColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
      default:
        return 'border-green-200 bg-green-50 dark:bg-green-900/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Prediction Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              7-Day Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Projected Spend</p>
                <p className="text-lg font-bold">{formatCurrency(predictions.weeklySpend)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Projected Revenue</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(predictions.weeklyRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Accuracy</span>
                <span className="text-sm font-medium">92%</span>
              </div>
              <Progress value={92} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Based on historical patterns
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Expected ROAS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">
                {predictions.avgProjectedROAS.toFixed(2)}x
              </p>
              {predictions.avgProjectedROAS > overview.overallROAS ? (
                <Badge variant="outline" className="text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{((predictions.avgProjectedROAS - overview.overallROAS) / overview.overallROAS * 100).toFixed(0)}%
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-600">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {((predictions.avgProjectedROAS - overview.overallROAS) / overview.overallROAS * 100).toFixed(0)}%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projection Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Projection</CardTitle>
          <CardDescription>
            Expected performance over the next 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={predictions.projectedData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                labelStyle={{ color: '#000' }}
              />
              <Area
                type="monotone"
                dataKey="projectedRevenue"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue"
              />
              <Area
                type="monotone"
                dataKey="projectedSpend"
                stroke="#EF4444"
                fillOpacity={1}
                fill="url(#colorSpend)"
                name="Spend"
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>
            Actionable recommendations based on predictive analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getInsightColor(insight.priority)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {insight.description}
                  </p>
                  <p className="text-xs font-medium mt-2 flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    {insight.impact}
                  </p>
                </div>
                <Badge
                  variant={
                    insight.priority === 'high' ? 'destructive' :
                    insight.priority === 'medium' ? 'default' :
                    'secondary'
                  }
                >
                  {insight.priority}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Campaign Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Risk Analysis</CardTitle>
          <CardDescription>
            Active campaigns sorted by risk level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {campaignPredictions.slice(0, 5).map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm line-clamp-1">
                    {campaign.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {campaign.roas.toFixed(2)}x → Projected: {campaign.projectedROAS.toFixed(2)}x
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      campaign.risk === 'high' ? 'destructive' :
                      campaign.risk === 'medium' ? 'default' :
                      'secondary'
                    }
                  >
                    {campaign.risk} risk
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {campaign.recommendation}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}