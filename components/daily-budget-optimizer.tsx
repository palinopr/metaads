'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, TrendingDown, AlertTriangle, 
  DollarSign, Zap, Brain, ArrowUp, ArrowDown,
  PauseCircle, Clock, Activity
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
  // Today's performance
  todaySpend?: number
  todayRevenue?: number
  todayROAS?: number
  todayConversions?: number
  todayImpressions?: number
  todayCTR?: number
  // Yesterday's performance for comparison
  yesterdayROAS?: number
  yesterdaySpend?: number
  yesterdayConversions?: number
}

interface DailyRecommendation {
  action: 'increase' | 'decrease' | 'maintain' | 'pause'
  urgency: 'immediate' | 'monitor' | 'optional'
  currentBudget: number
  recommendedBudget: number
  percentageChange: number
  reasoning: string[]
  expectedTodayImpact: {
    additionalSpend: number
    additionalRevenue: number
    confidenceLevel: number
  }
  timeOfDay: string
}

interface DailyBudgetOptimizerProps {
  campaign: Campaign
  accountAvgROAS: number
  currentHour: number
}

export function DailyBudgetOptimizer({ 
  campaign, 
  accountAvgROAS,
  currentHour
}: DailyBudgetOptimizerProps) {
  const [recommendation, setRecommendation] = useState<DailyRecommendation | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Get current time context
  const getTimeContext = () => {
    if (currentHour < 12) return 'morning'
    if (currentHour < 17) return 'afternoon'
    if (currentHour < 20) return 'evening'
    return 'night'
  }

  // Calculate remaining hours in the day
  const remainingHours = 24 - currentHour
  const percentDayRemaining = (remainingHours / 24) * 100

  // Analyze today's performance
  const analyzeTodayPerformance = async () => {
    setIsAnalyzing(true)
    
    try {
      const anthropicApiKey = localStorage.getItem('anthropic_api_key')
      
      if (!anthropicApiKey) {
        // Use local analysis
        const rec = generateLocalDailyRecommendation()
        setRecommendation(rec)
        setIsAnalyzing(false)
        return
      }

      // Call AI API for real-time analysis
      const response = await fetch('/api/ai/daily-budget-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign,
          accountAvgROAS,
          currentHour,
          percentDayRemaining,
          anthropicApiKey
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI recommendations')
      }

      const result = await response.json()
      
      if (result.recommendation) {
        setRecommendation(result.recommendation)
      } else {
        const rec = generateLocalDailyRecommendation()
        setRecommendation(rec)
      }
    } catch (error) {
      console.error('Error getting daily optimization:', error)
      const rec = generateLocalDailyRecommendation()
      setRecommendation(rec)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateLocalDailyRecommendation = (): DailyRecommendation => {
    const budget = Number(campaign.daily_budget) || 100
    const todayROAS = Number(campaign.todayROAS) || Number(campaign.roas) || 0
    const todaySpend = Number(campaign.todaySpend) || Number(campaign.spend) || 0
    const spendPace = todaySpend / budget
    const expectedFullDaySpend = (todaySpend / (currentHour / 24))
    
    // Calculate performance indicators
    const isOverpacing = spendPace > (currentHour / 24) * 1.2
    const isUnderpacing = spendPace < (currentHour / 24) * 0.8
    const isHighPerforming = todayROAS > accountAvgROAS * 1.5
    const isLowPerforming = todayROAS < accountAvgROAS * 0.7
    
    let action: DailyRecommendation['action'] = 'maintain'
    let urgency: DailyRecommendation['urgency'] = 'monitor'
    let recommendedBudget = budget
    let reasoning: string[] = []

    // High performing + underpacing = increase budget NOW
    if (isHighPerforming && isUnderpacing && remainingHours > 4) {
      action = 'increase'
      urgency = 'immediate'
      recommendedBudget = Math.min(budget * 1.5, budget + (budget - todaySpend))
      reasoning = [
        `TODAY'S ROAS: ${todayROAS.toFixed(2)}x (${((todayROAS / accountAvgROAS - 1) * 100).toFixed(0)}% above average)`,
        `Only spent $${todaySpend.toFixed(2)} of $${budget.toFixed(2)} budget (${(spendPace * 100).toFixed(0)}% at ${currentHour}:00)`,
        `${remainingHours} hours left to capture more conversions`,
        `At current pace, will only spend $${expectedFullDaySpend.toFixed(2)} today`
      ]
    }
    // Low performing + overpacing = decrease budget NOW
    else if (isLowPerforming && isOverpacing) {
      action = 'decrease'
      urgency = 'immediate'
      recommendedBudget = Math.max(todaySpend + (remainingHours * (todaySpend / currentHour) * 0.5), budget * 0.5)
      reasoning = [
        `TODAY'S ROAS: ${todayROAS.toFixed(2)}x (${((1 - todayROAS / accountAvgROAS) * 100).toFixed(0)}% below average)`,
        `Already spent $${todaySpend.toFixed(2)} of $${budget.toFixed(2)} (${(spendPace * 100).toFixed(0)}% at ${currentHour}:00)`,
        `On track to overspend by $${(expectedFullDaySpend - budget).toFixed(2)}`,
        `Reducing budget protects profitability for remaining ${remainingHours} hours`
      ]
    }
    // Very low performing = pause
    else if (todayROAS < 1 && todaySpend > budget * 0.5) {
      action = 'pause'
      urgency = 'immediate'
      recommendedBudget = 0
      reasoning = [
        `TODAY'S ROAS: ${todayROAS.toFixed(2)}x - UNPROFITABLE`,
        `Already spent $${todaySpend.toFixed(2)} with poor returns`,
        `Pause now to prevent further losses`,
        `Review creative and targeting before reactivating`
      ]
    }
    // High performing but already at pace
    else if (isHighPerforming && !isUnderpacing) {
      action = 'maintain'
      urgency = 'optional'
      recommendedBudget = budget * 1.2
      reasoning = [
        `Strong performance at ${todayROAS.toFixed(2)}x ROAS`,
        `Spending on track at $${todaySpend.toFixed(2)} (${(spendPace * 100).toFixed(0)}%)`,
        `Optional: Small increase could yield more results`,
        `Monitor hourly performance`
      ]
    }
    else {
      action = 'maintain'
      urgency = 'monitor'
      reasoning = [
        `Performance steady at ${todayROAS.toFixed(2)}x ROAS`,
        `Spending pace normal: $${todaySpend.toFixed(2)} of $${budget.toFixed(2)}`,
        `No immediate action needed`,
        `Check again in 2-3 hours`
      ]
    }

    const percentageChange = ((recommendedBudget - budget) / budget) * 100
    const additionalSpend = Math.max(0, recommendedBudget - budget) * (remainingHours / 24)
    const additionalRevenue = additionalSpend * todayROAS

    return {
      action,
      urgency,
      currentBudget: budget,
      recommendedBudget,
      percentageChange,
      reasoning,
      expectedTodayImpact: {
        additionalSpend,
        additionalRevenue,
        confidenceLevel: isHighPerforming ? 0.85 : 0.7
      },
      timeOfDay: `${currentHour}:00 ${getTimeContext()}`
    }
  }

  const getActionColor = (action: DailyRecommendation['action']) => {
    switch (action) {
      case 'increase': return 'text-green-500'
      case 'decrease': return 'text-orange-500'
      case 'pause': return 'text-red-500'
      case 'maintain': return 'text-blue-500'
    }
  }

  const getUrgencyBadge = (urgency: DailyRecommendation['urgency']) => {
    switch (urgency) {
      case 'immediate': return { color: 'bg-red-100 text-red-800', text: 'ACT NOW' }
      case 'monitor': return { color: 'bg-yellow-100 text-yellow-800', text: 'MONITOR' }
      case 'optional': return { color: 'bg-blue-100 text-blue-800', text: 'OPTIONAL' }
    }
  }

  const getActionIcon = (action: DailyRecommendation['action']) => {
    switch (action) {
      case 'increase': return <ArrowUp className="w-6 h-6 text-green-500" />
      case 'decrease': return <ArrowDown className="w-6 h-6 text-orange-500" />
      case 'pause': return <PauseCircle className="w-6 h-6 text-red-500" />
      case 'maintain': return <Activity className="w-6 h-6 text-blue-500" />
    }
  }

  return (
    <Card className="w-full bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            Today's Budget Optimization
          </div>
          <Button 
            onClick={analyzeTodayPerformance}
            disabled={isAnalyzing}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isAnalyzing ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Get Today's Action
              </>
            )}
          </Button>
        </CardTitle>
        <CardDescription className="text-xs">
          Real-time budget recommendations based on today's performance
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Day Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Day Progress</span>
            <span className="text-gray-300">{currentHour}:00 - {percentDayRemaining.toFixed(0)}% remaining</span>
          </div>
          <Progress value={100 - percentDayRemaining} className="h-2" />
        </div>

        {/* Today's Performance Summary */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-700/50 rounded p-2">
            <p className="text-gray-400">Today's ROAS</p>
            <p className="font-bold text-lg">{(Number(campaign.todayROAS) || Number(campaign.roas) || 0).toFixed(2)}x</p>
          </div>
          <div className="bg-gray-700/50 rounded p-2">
            <p className="text-gray-400">Budget Spent</p>
            <p className="font-bold text-lg">
              ${(Number(campaign.todaySpend) || 0).toFixed(2)}
              <span className="text-xs text-gray-400 ml-1">
                / ${(Number(campaign.daily_budget) || 0).toFixed(2)}
              </span>
            </p>
          </div>
        </div>

        {recommendation && !isAnalyzing && (
          <div className="space-y-4">
            {/* Main Recommendation */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getActionIcon(recommendation.action)}
                  <div>
                    <h4 className="font-semibold text-lg capitalize">
                      {recommendation.action === 'maintain' ? 'Maintain Budget' : 
                       recommendation.action === 'increase' ? 'Increase Budget' :
                       recommendation.action === 'decrease' ? 'Decrease Budget' :
                       'Pause Campaign'}
                    </h4>
                    <p className="text-xs text-gray-400">As of {recommendation.timeOfDay}</p>
                  </div>
                </div>
                <Badge className={getUrgencyBadge(recommendation.urgency).color}>
                  {getUrgencyBadge(recommendation.urgency).text}
                </Badge>
              </div>

              {/* Budget Change */}
              {recommendation.action !== 'maintain' && recommendation.action !== 'pause' && (
                <div className="flex items-center gap-2 mb-3 text-sm bg-gray-800/50 rounded p-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">${recommendation.currentBudget.toFixed(2)}</span>
                  <ArrowUp className={`w-4 h-4 ${getActionColor(recommendation.action)}`} />
                  <span className={`font-bold ${getActionColor(recommendation.action)}`}>
                    ${recommendation.recommendedBudget.toFixed(2)}
                  </span>
                  <span className="text-gray-400 ml-2">
                    ({recommendation.percentageChange > 0 ? '+' : ''}{recommendation.percentageChange.toFixed(0)}%)
                  </span>
                </div>
              )}

              {/* Expected Impact */}
              {recommendation.expectedTodayImpact.additionalSpend > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-800/50 rounded p-2 text-center">
                    <p className="text-xs text-gray-400">Additional Spend Today</p>
                    <p className="font-medium text-yellow-400">
                      +${recommendation.expectedTodayImpact.additionalSpend.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2 text-center">
                    <p className="text-xs text-gray-400">Expected Revenue</p>
                    <p className="font-medium text-green-400">
                      +${recommendation.expectedTodayImpact.additionalRevenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Reasoning */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-300 mb-2">Why this recommendation:</p>
                {recommendation.reasoning.map((reason, i) => (
                  <div key={i} className="flex items-start text-xs text-gray-400">
                    <span className="text-purple-400 mr-2 mt-0.5">•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              {/* Confidence Level */}
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-gray-400">Confidence Level</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={recommendation.expectedTodayImpact.confidenceLevel * 100} 
                    className="w-20 h-2" 
                  />
                  <span className="font-medium">
                    {(recommendation.expectedTodayImpact.confidenceLevel * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            {recommendation.action !== 'maintain' && (
              <Button 
                className={`w-full ${
                  recommendation.urgency === 'immediate' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {recommendation.action === 'increase' && `Apply +${recommendation.percentageChange.toFixed(0)}% Budget Increase`}
                {recommendation.action === 'decrease' && `Apply ${recommendation.percentageChange.toFixed(0)}% Budget Decrease`}
                {recommendation.action === 'pause' && 'Pause Campaign Now'}
              </Button>
            )}
          </div>
        )}

        {!recommendation && !isAnalyzing && (
          <Alert className="bg-gray-700/30 border-gray-600">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Click "Get Today's Action" for real-time budget optimization based on current performance.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}