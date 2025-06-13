'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
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
  frequency?: number
}

interface OptimizationRecommendation {
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

interface SingleCampaignOptimizerProps {
  campaign: Campaign
  accountAvgROAS: number
  accountAvgCPA: number
  totalAccountBudget: number
}

export function SingleCampaignOptimizer({ 
  campaign, 
  accountAvgROAS,
  accountAvgCPA,
  totalAccountBudget
}: SingleCampaignOptimizerProps) {
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Analyze single campaign
  const analyzeCampaign = async () => {
    setIsAnalyzing(true)
    
    try {
      // Check if Anthropic API key is configured
      const anthropicApiKey = localStorage.getItem('anthropic_api_key')
      
      if (!anthropicApiKey) {
        // Use local recommendations if no API key
        const recs = generateLocalRecommendations()
        setRecommendations(recs)
        setIsAnalyzing(false)
        return
      }

      // Call AI API for smart recommendations
      const response = await fetch('/api/ai/optimize-single-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign,
          accountMetrics: {
            avgROAS: accountAvgROAS,
            avgCPA: accountAvgCPA,
            totalBudget: totalAccountBudget
          },
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
        const recs = generateLocalRecommendations()
        setRecommendations(recs)
      }
    } catch (error) {
      console.error('Error getting AI recommendations:', error)
      // Fallback to local recommendations
      const recs = generateLocalRecommendations()
      setRecommendations(recs)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Generate smart recommendations based on campaign performance
  const generateLocalRecommendations = (): OptimizationRecommendation[] => {
    const recommendations: OptimizationRecommendation[] = []
    const budget = campaign.daily_budget || campaign.lifetime_budget || 0
    
    // High performing campaign - increase budget
    if (campaign.roas > accountAvgROAS * 1.5 && campaign.conversions > 10) {
      const budgetIncrease = Math.min(budget * 0.5, totalAccountBudget * 0.1)
      recommendations.push({
        type: 'increase_budget',
        priority: 'high',
        currentBudget: budget,
        recommendedBudget: budget + budgetIncrease,
        expectedImpact: {
          spend: budgetIncrease,
          revenue: budgetIncrease * campaign.roas,
          roas: campaign.roas * 0.9
        },
        reasoning: [
          `ROAS of ${campaign.roas.toFixed(2)}x is ${((campaign.roas / accountAvgROAS - 1) * 100).toFixed(0)}% above account average`,
          `Generated ${campaign.conversions} conversions with strong efficiency`,
          `CPA of $${campaign.cpa.toFixed(2)} is ${((accountAvgCPA - campaign.cpa) / accountAvgCPA * 100).toFixed(0)}% below average`,
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
    
    // Poor performing campaign - decrease budget or pause
    else if (campaign.roas < accountAvgROAS * 0.5 && campaign.spend > 100) {
      const shouldPause = campaign.roas < 1 && campaign.conversions < 5
      
      if (shouldPause) {
        recommendations.push({
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
        const budgetDecrease = budget * 0.3
        recommendations.push({
          type: 'decrease_budget',
          priority: 'medium',
          currentBudget: budget,
          recommendedBudget: budget - budgetDecrease,
          expectedImpact: {
            spend: -budgetDecrease,
            revenue: -budgetDecrease * campaign.roas,
            roas: campaign.roas * 1.1
          },
          reasoning: [
            `ROAS of ${campaign.roas.toFixed(2)}x is ${((1 - campaign.roas / accountAvgROAS) * 100).toFixed(0)}% below average`,
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
          revenue: campaign.revenue * 0.2,
          roas: campaign.roas * 1.2
        },
        confidence: 0.7
      })
    }
    
    // Audience expansion opportunities
    if (campaign.roas > accountAvgROAS && campaign.frequency && campaign.frequency > 3) {
      recommendations.push({
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
    
    return recommendations
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

  return (
    <Card className="w-full bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            AI Optimization Analysis
          </div>
          <Button 
            onClick={analyzeCampaign}
            disabled={isAnalyzing}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Campaign
              </>
            )}
          </Button>
        </CardTitle>
        <CardDescription className="text-xs">
          Get AI-powered recommendations to optimize this campaign's performance
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isAnalyzing && (
          <div className="space-y-3">
            <Progress value={66} className="w-full h-2" />
            <p className="text-center text-xs text-gray-400">
              Analyzing campaign performance metrics...
            </p>
          </div>
        )}

        {recommendations.length > 0 && !isAnalyzing && (
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="bg-gray-700/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {getRecommendationIcon(rec.type)}
                  <Badge className={`${getPriorityColor(rec.priority)} text-xs`}>
                    {rec.priority} priority
                  </Badge>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {(rec.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                </div>

                {/* Budget Change Display */}
                {rec.currentBudget !== undefined && rec.recommendedBudget !== undefined && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">Budget:</span>
                    <span className="font-medium">${rec.currentBudget.toFixed(2)}</span>
                    <ArrowUp className="w-3 h-3" />
                    <span className="font-medium text-green-400">${rec.recommendedBudget.toFixed(2)}</span>
                    <span className="text-gray-400">
                      ({rec.recommendedBudget > rec.currentBudget ? '+' : ''}
                      {((rec.recommendedBudget - rec.currentBudget) / rec.currentBudget * 100).toFixed(0)}%)
                    </span>
                  </div>
                )}

                {/* Expected Impact */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-800/50 rounded p-2">
                    <p className="text-gray-400">Spend Impact</p>
                    <p className="font-medium">
                      {rec.expectedImpact.spend >= 0 ? '+' : ''}
                      ${Math.abs(rec.expectedImpact.spend).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2">
                    <p className="text-gray-400">Revenue Impact</p>
                    <p className="font-medium text-green-400">
                      {rec.expectedImpact.revenue >= 0 ? '+' : ''}
                      ${Math.abs(rec.expectedImpact.revenue).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2">
                    <p className="text-gray-400">Expected ROAS</p>
                    <p className="font-medium">{rec.expectedImpact.roas.toFixed(2)}x</p>
                  </div>
                </div>

                {/* Key Reasoning */}
                <div className="text-xs space-y-1">
                  <p className="font-medium text-gray-300">Key Insights:</p>
                  <ul className="space-y-0.5">
                    {rec.reasoning.slice(0, 2).map((reason, i) => (
                      <li key={i} className="flex items-start text-gray-400">
                        <CheckCircle className="w-3 h-3 mr-1 mt-0.5 text-green-500 flex-shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Items */}
                <div className="text-xs space-y-1">
                  <p className="font-medium text-gray-300">Recommended Actions:</p>
                  <ul className="space-y-0.5">
                    {rec.actionItems.slice(0, 2).map((action, i) => (
                      <li key={i} className="flex items-start text-gray-400">
                        <span className="text-purple-400 mr-1">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {recommendations.length === 0 && !isAnalyzing && (
          <Alert className="bg-gray-700/30 border-gray-600">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Click "Analyze Campaign" to get AI-powered optimization recommendations for this campaign.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}