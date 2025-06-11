"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain, TrendingUp, TrendingDown, AlertTriangle, Zap, 
  DollarSign, Target, Lightbulb, ArrowRight, ChevronRight,
  AlertCircle, CheckCircle, XCircle, Info, Sparkles,
  Rocket, PiggyBank, Users, Clock, BarChart3
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface Campaign {
  id: string
  name: string
  insights?: any
  performanceScore: number
  lifetimeROAS: number
  daysRunning: number
}

interface AIInsightsProps {
  campaigns: Campaign[]
  totalSpend: number
  totalRevenue: number
  accountInfo?: any
}

interface Insight {
  id: string
  type: 'success' | 'warning' | 'danger' | 'opportunity'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  action: string
  potentialGain?: number
  confidence: number
}

interface Recommendation {
  campaignId: string
  campaignName: string
  action: 'scale' | 'optimize' | 'pause' | 'restructure'
  reason: string
  expectedImpact: string
  steps: string[]
  urgency: 'immediate' | 'soon' | 'consider'
}

export function AIInsights({ campaigns, totalSpend, totalRevenue, accountInfo }: AIInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null)

  useEffect(() => {
    generateInsights()
  }, [campaigns])

  const generateInsights = () => {
    setLoading(true)
    
    const newInsights: Insight[] = []
    const newRecommendations: Recommendation[] = []

    // Overall account performance insight
    const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
    
    if (overallROAS < 1) {
      newInsights.push({
        id: 'overall-loss',
        type: 'danger',
        priority: 'high',
        title: 'Portfolio Operating at Loss',
        description: `Your overall ROAS is ${overallROAS.toFixed(2)}x, meaning you're losing ${formatCurrency((totalSpend - totalRevenue))} across all campaigns.`,
        impact: 'Critical impact on profitability',
        action: 'Pause underperforming campaigns immediately',
        confidence: 100
      })
    } else if (overallROAS > 3) {
      newInsights.push({
        id: 'overall-success',
        type: 'success',
        priority: 'high',
        title: 'Exceptional Portfolio Performance',
        description: `Your portfolio is generating ${overallROAS.toFixed(2)}x ROAS - well above industry average of 2.0x.`,
        impact: `${formatCurrency(totalRevenue - totalSpend)} in profit`,
        action: 'Scale winning campaigns aggressively',
        potentialGain: totalRevenue * 0.3, // 30% potential increase
        confidence: 95
      })
    }

    // Campaign-specific insights
    campaigns.forEach(campaign => {
      if (!campaign.insights) return

      const roas = campaign.lifetimeROAS
      const spend = campaign.insights.spend
      const ctr = campaign.insights.ctr
      const cpa = campaign.insights.cpa
      const frequency = campaign.insights.frequency

      // Scaling opportunity
      if (roas > 2.5 && spend < totalSpend * 0.2) {
        newInsights.push({
          id: `scale-${campaign.id}`,
          type: 'opportunity',
          priority: 'high',
          title: `Scaling Opportunity: ${campaign.name}`,
          description: `This campaign has ${roas.toFixed(2)}x ROAS but only ${((spend/totalSpend)*100).toFixed(1)}% of budget.`,
          impact: `Could generate additional ${formatCurrency(spend * (roas - 1))} profit`,
          action: 'Increase budget by 50-100%',
          potentialGain: spend * (roas - 1),
          confidence: 85
        })

        newRecommendations.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          action: 'scale',
          reason: 'High ROAS with low budget share',
          expectedImpact: `+${formatCurrency(spend * (roas - 1))} additional profit`,
          steps: [
            'Increase daily budget by 50% initially',
            'Monitor performance for 3-5 days',
            'If ROAS holds, increase another 50%',
            'Consider duplicating to new audiences'
          ],
          urgency: 'immediate'
        })
      }

      // Frequency warning
      if (frequency > 3.5) {
        newInsights.push({
          id: `frequency-${campaign.id}`,
          type: 'warning',
          priority: 'medium',
          title: `Ad Fatigue Risk: ${campaign.name}`,
          description: `Frequency is ${frequency.toFixed(2)} - audiences seeing ads too often.`,
          impact: 'CTR likely to decline, CPA to increase',
          action: 'Refresh creative or expand audience',
          confidence: 90
        })
      }

      // Low CTR issue
      if (ctr < 0.9) {
        newInsights.push({
          id: `ctr-${campaign.id}`,
          type: 'warning',
          priority: 'medium',
          title: `Poor Engagement: ${campaign.name}`,
          description: `CTR is only ${ctr.toFixed(2)}% - below Meta's recommended 1%+.`,
          impact: 'Higher costs and lower reach',
          action: 'Test new creative angles and copy',
          confidence: 95
        })

        newRecommendations.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          action: 'optimize',
          reason: 'CTR below platform benchmarks',
          expectedImpact: '20-30% reduction in CPC',
          steps: [
            'Analyze top performing ad creative',
            'Create 3-5 variations with stronger hooks',
            'Test video vs static images',
            'Refine audience targeting'
          ],
          urgency: 'soon'
        })
      }

      // Underperforming campaign
      if (roas < 0.8 && campaign.daysRunning > 14) {
        newInsights.push({
          id: `underperform-${campaign.id}`,
          type: 'danger',
          priority: 'high',
          title: `Losing Money: ${campaign.name}`,
          description: `Only ${roas.toFixed(2)}x ROAS after ${campaign.daysRunning} days.`,
          impact: `Lost ${formatCurrency(spend - (spend * roas))} so far`,
          action: 'Pause or significantly restructure',
          confidence: 98
        })

        newRecommendations.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          action: 'pause',
          reason: 'Consistent underperformance',
          expectedImpact: `Save ${formatCurrency(spend / campaign.daysRunning)} per day`,
          steps: [
            'Pause campaign immediately',
            'Analyze conversion funnel for issues',
            'Review landing page performance',
            'Consider complete restructure before relaunch'
          ],
          urgency: 'immediate'
        })
      }
    })

    // Day of week insights
    const dayPatterns = analyzeDayPatterns(campaigns)
    if (dayPatterns.bestDay && dayPatterns.worstDay) {
      newInsights.push({
        id: 'day-pattern',
        type: 'opportunity',
        priority: 'medium',
        title: 'Weekly Performance Pattern Detected',
        description: `${dayPatterns.bestDay} performs ${dayPatterns.difference}% better than ${dayPatterns.worstDay}.`,
        impact: 'Optimize budget distribution by day',
        action: 'Implement dayparting strategy',
        potentialGain: totalSpend * 0.15,
        confidence: 80
      })
    }

    setInsights(newInsights)
    setRecommendations(newRecommendations)
    setLoading(false)
  }

  const analyzeDayPatterns = (campaigns: Campaign[]) => {
    // This would analyze historical data to find patterns
    // For demo, returning sample data
    return {
      bestDay: 'Tuesday',
      worstDay: 'Sunday',
      difference: 35
    }
  }

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'danger': return <XCircle className="h-5 w-5 text-red-500" />
      case 'opportunity': return <Sparkles className="h-5 w-5 text-blue-500" />
    }
  }

  const getActionIcon = (action: Recommendation['action']) => {
    switch (action) {
      case 'scale': return <Rocket className="h-4 w-4" />
      case 'optimize': return <Zap className="h-4 w-4" />
      case 'pause': return <AlertCircle className="h-4 w-4" />
      case 'restructure': return <BarChart3 className="h-4 w-4" />
    }
  }

  const getUrgencyColor = (urgency: Recommendation['urgency']) => {
    switch (urgency) {
      case 'immediate': return 'destructive'
      case 'soon': return 'default'
      case 'consider': return 'secondary'
    }
  }

  const totalPotentialGain = insights
    .filter(i => i.potentialGain)
    .reduce((sum, i) => sum + (i.potentialGain || 0), 0)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Brain className="h-12 w-12 animate-pulse mx-auto mb-4" />
              <p className="text-muted-foreground">Analyzing your campaigns...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Insights & Recommendations
          </CardTitle>
          <CardDescription>
            Intelligent analysis of your campaign performance with actionable recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Insights</p>
              <p className="text-2xl font-bold">{insights.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Critical Issues</p>
              <p className="text-2xl font-bold text-red-500">
                {insights.filter(i => i.type === 'danger').length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Opportunities</p>
              <p className="text-2xl font-bold text-blue-500">
                {insights.filter(i => i.type === 'opportunity').length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Potential Gain</p>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(totalPotentialGain)}
              </p>
            </div>
          </div>

          <Alert className="mb-4">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>Quick Win:</strong> Implementing top 3 recommendations could increase revenue by {formatPercentage(totalPotentialGain / totalRevenue * 100)}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Insights and Recommendations Tabs */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="insights">Insights ({insights.length})</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations ({recommendations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {/* Priority Insights */}
          <div className="space-y-4">
            {insights
              .sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 }
                return priorityOrder[a.priority] - priorityOrder[b.priority]
              })
              .map(insight => (
                <Card 
                  key={insight.id}
                  className={`cursor-pointer transition-all ${
                    selectedInsight === insight.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedInsight(
                    selectedInsight === insight.id ? null : insight.id
                  )}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="space-y-1">
                          <CardTitle className="text-base">{insight.title}</CardTitle>
                          <CardDescription>{insight.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          insight.priority === 'high' ? 'destructive' :
                          insight.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {insight.priority}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {insight.confidence}% confidence
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  {selectedInsight === insight.id && (
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Impact</p>
                            <p className="text-sm text-muted-foreground">{insight.impact}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Zap className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Recommended Action</p>
                            <p className="text-sm text-muted-foreground">{insight.action}</p>
                          </div>
                        </div>
                        {insight.potentialGain && (
                          <div className="flex items-start gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Potential Gain</p>
                              <p className="text-sm text-green-600 font-medium">
                                +{formatCurrency(insight.potentialGain)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.map(rec => (
            <Card key={rec.campaignId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getActionIcon(rec.action)}
                    <div>
                      <CardTitle className="text-base capitalize">
                        {rec.action}: {rec.campaignName}
                      </CardTitle>
                      <CardDescription>{rec.reason}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={getUrgencyColor(rec.urgency)}>
                    {rec.urgency}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Expected Impact:</span>
                    <span className="text-green-600">{rec.expectedImpact}</span>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Action Steps:</p>
                    <ol className="space-y-1">
                      {rec.steps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="font-medium">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <Button className="w-full" variant="outline">
                    <ChevronRight className="h-4 w-4 mr-2" />
                    View Campaign Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}