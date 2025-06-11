'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  DollarSign,
  Users,
  Zap,
  CheckCircle
} from 'lucide-react'

interface AdSetInsight {
  type: 'optimization' | 'warning' | 'opportunity' | 'success'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  metric?: string
  value?: number
  recommendation?: string
}

interface AdSetLevelInsightsProps {
  adsetId: string
  adsetName: string
  metrics: any
  targeting?: any
  onApplyRecommendation?: (recommendation: string) => void
}

export function AdSetLevelInsights({ 
  adsetId, 
  adsetName, 
  metrics,
  targeting,
  onApplyRecommendation 
}: AdSetLevelInsightsProps) {
  const [selectedInsight, setSelectedInsight] = useState<AdSetInsight | null>(null)

  // Generate AI insights based on adset performance
  const generateInsights = (): AdSetInsight[] => {
    const insights: AdSetInsight[] = []

    // Performance-based insights
    if (metrics?.roas < 1.5) {
      insights.push({
        type: 'warning',
        title: 'Low ROAS Alert',
        description: `This ad set has a ROAS of ${metrics.roas}x, which is below the profitable threshold.`,
        impact: 'high',
        metric: 'roas',
        value: metrics.roas,
        recommendation: 'Consider pausing low-performing ads or adjusting targeting'
      })
    }

    if (metrics?.ctr < 1) {
      insights.push({
        type: 'optimization',
        title: 'CTR Below Industry Average',
        description: 'Click-through rate is lower than the 1% industry benchmark.',
        impact: 'medium',
        metric: 'ctr',
        value: metrics.ctr,
        recommendation: 'Test new ad creatives or refine audience targeting'
      })
    }

    if (metrics?.spend > 100 && metrics?.conversions === 0) {
      insights.push({
        type: 'warning',
        title: 'No Conversions Despite Spend',
        description: 'This ad set has spent budget without generating conversions.',
        impact: 'high',
        recommendation: 'Review conversion tracking and landing page experience'
      })
    }

    // Targeting insights
    if (targeting?.age_max && targeting?.age_min) {
      const ageRange = targeting.age_max - targeting.age_min
      if (ageRange < 10) {
        insights.push({
          type: 'opportunity',
          title: 'Expand Age Targeting',
          description: 'Current age range might be too narrow, limiting reach.',
          impact: 'medium',
          recommendation: 'Test broader age ranges to increase potential audience'
        })
      }
    }

    // Budget insights
    if (metrics?.spend && metrics?.daily_budget) {
      const spendRate = (metrics.spend / metrics.daily_budget) * 100
      if (spendRate < 70) {
        insights.push({
          type: 'opportunity',
          title: 'Budget Underutilization',
          description: `Only ${spendRate.toFixed(0)}% of daily budget is being spent.`,
          impact: 'medium',
          recommendation: 'Expand targeting or increase bids to improve delivery'
        })
      }
    }

    // Success insights
    if (metrics?.roas > 3) {
      insights.push({
        type: 'success',
        title: 'High Performing Ad Set',
        description: `Excellent ROAS of ${metrics.roas}x - consider scaling.`,
        impact: 'high',
        recommendation: 'Increase budget by 20-30% to maximize returns'
      })
    }

    return insights
  }

  const insights = generateInsights()

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'optimization': return Zap
      case 'warning': return AlertTriangle
      case 'opportunity': return TrendingUp
      case 'success': return CheckCircle
      default: return Brain
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'optimization': return 'text-blue-600 bg-blue-100'
      case 'warning': return 'text-red-600 bg-red-100'
      case 'opportunity': return 'text-green-600 bg-green-100'
      case 'success': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return <Badge className="bg-red-100 text-red-800">High Impact</Badge>
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium Impact</Badge>
      case 'low': return <Badge className="bg-green-100 text-green-800">Low Impact</Badge>
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights: {adsetName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">ROAS</p>
              <p className="text-2xl font-bold">{metrics?.roas || 0}x</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">CTR</p>
              <p className="text-2xl font-bold">{metrics?.ctr || 0}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Spend</p>
              <p className="text-2xl font-bold">${metrics?.spend || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Conversions</p>
              <p className="text-2xl font-bold">{metrics?.conversions || 0}</p>
            </div>
          </div>

          {/* Insights List */}
          <div className="space-y-3">
            {insights.map((insight, index) => {
              const Icon = getInsightIcon(insight.type)
              return (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:shadow-md cursor-pointer transition-shadow"
                  onClick={() => setSelectedInsight(insight)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                        {insight.metric && (
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={insight.value || 0} max={100} className="w-20 h-2" />
                            <span className="text-xs text-muted-foreground">
                              {insight.value} {insight.metric}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {getImpactBadge(insight.impact)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Selected Insight Detail */}
          {selectedInsight && (
            <Alert className="mt-4">
              <Brain className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium">{selectedInsight.title}</p>
                  <p className="text-sm">{selectedInsight.description}</p>
                  {selectedInsight.recommendation && (
                    <>
                      <p className="text-sm font-medium">Recommendation:</p>
                      <p className="text-sm">{selectedInsight.recommendation}</p>
                      <Button 
                        size="sm"
                        onClick={() => onApplyRecommendation?.(selectedInsight.recommendation!)}
                      >
                        Apply Recommendation
                      </Button>
                    </>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Targeting Analysis */}
          {targeting && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Targeting Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {targeting.age_min && (
                    <div>Age Range: {targeting.age_min} - {targeting.age_max || '65+'}</div>
                  )}
                  {targeting.genders && (
                    <div>Gender: {targeting.genders.join(', ')}</div>
                  )}
                  {targeting.geo_locations?.countries && (
                    <div>Countries: {targeting.geo_locations.countries.join(', ')}</div>
                  )}
                  {targeting.interests && (
                    <div>Interests: {targeting.interests.length} targeted</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}