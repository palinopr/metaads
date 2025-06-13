'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  DollarSign, Target, Zap, Brain, ArrowUp, ArrowDown,
  PauseCircle, PlayCircle, RefreshCw, Sparkles
} from "lucide-react"

interface Campaign {
  id: string
  name: string
  status: string
  spend: number
  revenue: number
  roas: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpa: number
  daily_budget?: number
  lifetime_budget?: number
}

interface OptimizationRecommendation {
  campaignId: string
  campaignName: string
  type: 'increase_budget' | 'decrease_budget' | 'pause' | 'reactivate' | 'creative_refresh' | 'audience_expansion'
  priority: 'high' | 'medium' | 'low'
  currentBudget?: number
  recommendedBudget?: number
  expectedImpact: {
    spend: number
    revenue: number
    roas: number
  }
  reasoning: string[]
  actionItems: string[]
  confidence: number
}

interface CampaignOptimizerProps {
  campaigns: Campaign[]
  overviewData: {
    totalSpend: number
    totalRevenue: number
    overallROAS: number
    totalConversions: number
  }
}

export function CampaignOptimizer({ campaigns, overviewData }: CampaignOptimizerProps) {
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([])

  // Analyze campaigns and generate recommendations
  const analyzeCampaigns = async () => {
    setIsAnalyzing(true)
    
    try {
      // Check if Anthropic API key is configured
      const anthropicApiKey = localStorage.getItem('anthropic_api_key')
      
      if (!anthropicApiKey) {
        // Use local recommendations if no API key
        const recs = generateOptimizationRecommendations(campaigns, overviewData)
        setRecommendations(recs)
        setIsAnalyzing(false)
        return
      }

      // Call AI API for smart recommendations
      const response = await fetch('/api/ai/optimize-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaigns,
          overviewData,
          anthropicApiKey
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI recommendations')
      }

      const result = await response.json()
      
      if (result.recommendations && result.recommendations.length > 0) {
        setRecommendations(result.recommendations)
      } else {
        // Fallback to local recommendations
        const recs = generateOptimizationRecommendations(campaigns, overviewData)
        setRecommendations(recs)
      }
    } catch (error) {
      console.error('Error getting AI recommendations:', error)
      // Fallback to local recommendations
      const recs = generateOptimizationRecommendations(campaigns, overviewData)
      setRecommendations(recs)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Generate smart recommendations based on campaign performance
  const generateOptimizationRecommendations = (
    campaigns: Campaign[], 
    overview: typeof overviewData
  ): OptimizationRecommendation[] => {
    const recommendations: OptimizationRecommendation[] = []
    
    // Calculate benchmarks
    const avgROAS = overview.overallROAS
    const avgCPA = overview.totalSpend / overview.totalConversions
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.daily_budget || c.lifetime_budget || 0), 0)
    
    campaigns.forEach(campaign => {
      const budget = campaign.daily_budget || campaign.lifetime_budget || 0
      
      // High performing campaigns - increase budget
      if (campaign.roas > avgROAS * 1.5 && campaign.conversions > 10) {
        const budgetIncrease = Math.min(budget * 0.5, totalBudget * 0.1) // 50% increase or 10% of total budget
        recommendations.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'increase_budget',
          priority: 'high',
          currentBudget: budget,
          recommendedBudget: budget + budgetIncrease,
          expectedImpact: {
            spend: budgetIncrease,
            revenue: budgetIncrease * campaign.roas,
            roas: campaign.roas * 0.9 // Slightly lower ROAS expected with scale
          },
          reasoning: [
            `ROAS of ${campaign.roas.toFixed(2)}x is ${((campaign.roas / avgROAS - 1) * 100).toFixed(0)}% above account average`,
            `Generated ${campaign.conversions} conversions with strong efficiency`,
            `CPA of $${campaign.cpa.toFixed(2)} is ${((avgCPA - campaign.cpa) / avgCPA * 100).toFixed(0)}% below average`,
            'Campaign has proven scalability potential'
          ],
          actionItems: [
            `Increase daily budget from $${budget.toFixed(2)} to $${(budget + budgetIncrease).toFixed(2)}`,
            'Monitor performance closely for 3-5 days',
            'Ensure creative frequency doesn\'t exceed 2.5',
            'Consider expanding to similar audiences'
          ],
          confidence: 0.85
        })
      }
      
      // Poor performing campaigns - decrease budget or pause
      else if (campaign.roas < avgROAS * 0.5 && campaign.spend > 100) {
        const shouldPause = campaign.roas < 1 && campaign.conversions < 5
        
        if (shouldPause) {
          recommendations.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            type: 'pause',
            priority: 'high',
            currentBudget: budget,
            recommendedBudget: 0,
            expectedImpact: {
              spend: -campaign.spend,
              revenue: -campaign.revenue,
              roas: 0
            },
            reasoning: [
              `ROAS of ${campaign.roas.toFixed(2)}x is unprofitable`,
              `Only ${campaign.conversions} conversions despite $${campaign.spend.toFixed(2)} spend`,
              'Campaign is dragging down overall account performance',
              'Resources better allocated to profitable campaigns'
            ],
            actionItems: [
              'Pause campaign immediately',
              'Analyze audience and creative performance',
              'Consider complete restructure before reactivating',
              `Reallocate $${budget.toFixed(2)} daily budget to top performers`
            ],
            confidence: 0.9
          })
        } else {
          const budgetDecrease = budget * 0.3 // 30% decrease
          recommendations.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            type: 'decrease_budget',
            priority: 'medium',
            currentBudget: budget,
            recommendedBudget: budget - budgetDecrease,
            expectedImpact: {
              spend: -budgetDecrease,
              revenue: -budgetDecrease * campaign.roas,
              roas: campaign.roas * 1.1 // Slightly better ROAS with lower budget
            },
            reasoning: [
              `ROAS of ${campaign.roas.toFixed(2)}x is ${((1 - campaign.roas / avgROAS) * 100).toFixed(0)}% below average`,
              'Campaign shows potential but needs optimization',
              `Current CPA of $${campaign.cpa.toFixed(2)} is too high`,
              'Reducing budget while optimizing can improve efficiency'
            ],
            actionItems: [
              `Reduce daily budget from $${budget.toFixed(2)} to $${(budget - budgetDecrease).toFixed(2)}`,
              'Test new ad creatives',
              'Narrow audience targeting',
              'A/B test different ad formats'
            ],
            confidence: 0.75
          })
        }
      }
      
      // Creative fatigue detection
      if (campaign.ctr < 0.5 && campaign.impressions > 100000) {
        recommendations.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'creative_refresh',
          priority: 'medium',
          reasoning: [
            `CTR of ${campaign.ctr.toFixed(2)}% indicates creative fatigue`,
            `${(campaign.impressions / 1000).toFixed(0)}k impressions with declining engagement`,
            'Fresh creatives can revive campaign performance',
            'Audience may be experiencing ad blindness'
          ],
          actionItems: [
            'Upload 3-5 new creative variations',
            'Test video content if currently using static images',
            'Refresh ad copy with new angles',
            'Consider user-generated content'
          ],
          expectedImpact: {
            spend: 0,
            revenue: campaign.revenue * 0.2, // 20% potential uplift
            roas: campaign.roas * 1.2
          },
          confidence: 0.7
        })
      }
      
      // Audience expansion opportunities
      if (campaign.roas > avgROAS && campaign.frequency > 3) {
        recommendations.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'audience_expansion',
          priority: 'low',
          reasoning: [
            'High frequency indicates audience saturation',
            'Strong ROAS shows message-market fit',
            'Expanding audience can unlock new growth',
            'Similar audiences likely to convert well'
          ],
          actionItems: [
            'Create 1-3% lookalike audience',
            'Test interest expansion',
            'Add demographic variations',
            'Consider geographic expansion'
          ],
          expectedImpact: {
            spend: budget * 0.3,
            revenue: budget * 0.3 * campaign.roas * 0.8,
            roas: campaign.roas * 0.8
          },
          confidence: 0.65
        })
      }
    })
    
    // Sort by priority and expected impact
    return recommendations.sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 }
      const aScore = priorityScore[a.priority] * a.confidence * Math.abs(a.expectedImpact.revenue)
      const bScore = priorityScore[b.priority] * b.confidence * Math.abs(b.expectedImpact.revenue)
      return bScore - aScore
    })
  }

  const getRecommendationIcon = (type: OptimizationRecommendation['type']) => {
    switch (type) {
      case 'increase_budget': return <ArrowUp className="w-5 h-5 text-green-500" />
      case 'decrease_budget': return <ArrowDown className="w-5 h-5 text-orange-500" />
      case 'pause': return <PauseCircle className="w-5 h-5 text-red-500" />
      case 'reactivate': return <PlayCircle className="w-5 h-5 text-blue-500" />
      case 'creative_refresh': return <RefreshCw className="w-5 h-5 text-purple-500" />
      case 'audience_expansion': return <Target className="w-5 h-5 text-indigo-500" />
    }
  }

  const getPriorityColor = (priority: OptimizationRecommendation['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
    }
  }

  const totalPotentialRevenue = recommendations.reduce((sum, rec) => sum + rec.expectedImpact.revenue, 0)
  const totalBudgetChange = recommendations.reduce((sum, rec) => {
    if (rec.type === 'increase_budget' && rec.recommendedBudget && rec.currentBudget) {
      return sum + (rec.recommendedBudget - rec.currentBudget)
    } else if (rec.type === 'decrease_budget' && rec.recommendedBudget && rec.currentBudget) {
      return sum + (rec.recommendedBudget - rec.currentBudget)
    } else if (rec.type === 'pause' && rec.currentBudget) {
      return sum - rec.currentBudget
    }
    return sum
  }, 0)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            AI Campaign Optimizer
          </div>
          <Button 
            onClick={analyzeCampaigns}
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze All Campaigns
              </>
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          Get AI-powered budget optimization and campaign recommendations based on your performance data
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {isAnalyzing && (
          <div className="space-y-4">
            <Progress value={66} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">
              Analyzing {campaigns.length} campaigns across multiple performance dimensions...
            </p>
          </div>
        )}

        {recommendations.length > 0 && !isAnalyzing && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Recommendations</p>
                      <p className="text-2xl font-bold">{recommendations.length}</p>
                    </div>
                    <Zap className="w-8 h-8 text-purple-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Potential Revenue Impact</p>
                      <p className="text-2xl font-bold text-green-600">
                        {totalPotentialRevenue >= 0 ? '+' : ''}${Math.abs(totalPotentialRevenue).toFixed(2)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Budget Reallocation</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {totalBudgetChange >= 0 ? '+' : ''}${Math.abs(totalBudgetChange).toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations List */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All ({recommendations.length})</TabsTrigger>
                <TabsTrigger value="budget">
                  Budget ({recommendations.filter(r => r.type.includes('budget')).length})
                </TabsTrigger>
                <TabsTrigger value="creative">
                  Creative ({recommendations.filter(r => r.type === 'creative_refresh').length})
                </TabsTrigger>
                <TabsTrigger value="urgent">
                  Urgent ({recommendations.filter(r => r.priority === 'high').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-4">
                {recommendations.map((rec, index) => (
                  <RecommendationCard 
                    key={`${rec.campaignId}-${index}`} 
                    recommendation={rec}
                    getIcon={getRecommendationIcon}
                    getPriorityColor={getPriorityColor}
                  />
                ))}
              </TabsContent>

              <TabsContent value="budget" className="space-y-4 mt-4">
                {recommendations
                  .filter(r => r.type.includes('budget') || r.type === 'pause')
                  .map((rec, index) => (
                    <RecommendationCard 
                      key={`${rec.campaignId}-${index}`} 
                      recommendation={rec}
                      getIcon={getRecommendationIcon}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
              </TabsContent>

              <TabsContent value="creative" className="space-y-4 mt-4">
                {recommendations
                  .filter(r => r.type === 'creative_refresh')
                  .map((rec, index) => (
                    <RecommendationCard 
                      key={`${rec.campaignId}-${index}`} 
                      recommendation={rec}
                      getIcon={getRecommendationIcon}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
              </TabsContent>

              <TabsContent value="urgent" className="space-y-4 mt-4">
                {recommendations
                  .filter(r => r.priority === 'high')
                  .map((rec, index) => (
                    <RecommendationCard 
                      key={`${rec.campaignId}-${index}`} 
                      recommendation={rec}
                      getIcon={getRecommendationIcon}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
              </TabsContent>
            </Tabs>
          </>
        )}

        {recommendations.length === 0 && !isAnalyzing && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Click "Analyze All Campaigns" to get AI-powered optimization recommendations based on your campaign performance data.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

// Individual recommendation card component
function RecommendationCard({ 
  recommendation, 
  getIcon, 
  getPriorityColor 
}: {
  recommendation: OptimizationRecommendation
  getIcon: (type: OptimizationRecommendation['type']) => JSX.Element
  getPriorityColor: (priority: OptimizationRecommendation['priority']) => string
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {getIcon(recommendation.type)}
              <h4 className="font-semibold text-lg">{recommendation.campaignName}</h4>
              <Badge className={getPriorityColor(recommendation.priority)}>
                {recommendation.priority} priority
              </Badge>
              <Badge variant="outline" className="ml-auto">
                {(recommendation.confidence * 100).toFixed(0)}% confidence
              </Badge>
            </div>

            {/* Budget Change Display */}
            {recommendation.currentBudget !== undefined && recommendation.recommendedBudget !== undefined && (
              <div className="flex items-center gap-2 mb-3 text-sm">
                <span className="text-muted-foreground">Budget:</span>
                <span className="font-medium">${recommendation.currentBudget.toFixed(2)}</span>
                <ArrowUp className="w-4 h-4" />
                <span className="font-medium text-green-600">${recommendation.recommendedBudget.toFixed(2)}</span>
                <span className="text-muted-foreground">
                  ({recommendation.recommendedBudget > recommendation.currentBudget ? '+' : ''}
                  {((recommendation.recommendedBudget - recommendation.currentBudget) / recommendation.currentBudget * 100).toFixed(0)}%)
                </span>
              </div>
            )}

            {/* Expected Impact */}
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Spend Impact</p>
                <p className="font-medium">
                  {recommendation.expectedImpact.spend >= 0 ? '+' : ''}
                  ${Math.abs(recommendation.expectedImpact.spend).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenue Impact</p>
                <p className="font-medium text-green-600">
                  {recommendation.expectedImpact.revenue >= 0 ? '+' : ''}
                  ${Math.abs(recommendation.expectedImpact.revenue).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expected ROAS</p>
                <p className="font-medium">{recommendation.expectedImpact.roas.toFixed(2)}x</p>
              </div>
            </div>

            {/* Reasoning */}
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium mb-1">Why this recommendation:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {recommendation.reasoning.slice(0, expanded ? undefined : 2).map((reason, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="w-3 h-3 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {expanded && (
                <div>
                  <p className="text-sm font-medium mb-1 mt-3">Action items:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {recommendation.actionItems.map((action, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-purple-500 mr-2">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="mt-2"
            >
              {expanded ? 'Show less' : 'Show more'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}