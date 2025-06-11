"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  BarChart3, 
  Calendar,
  Target,
  Zap,
  AlertCircle,
  RefreshCw,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { CredentialManager } from "@/lib/credential-manager"

interface PatternInsight {
  id: string
  type: 'performance' | 'timing' | 'audience' | 'creative'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  trend: 'positive' | 'negative' | 'neutral'
  confidence: number
  actionable: boolean
}

export default function PatternAnalysisPage() {
  const [insights, setInsights] = useState<PatternInsight[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasCredentials, setHasCredentials] = useState(false)

  useEffect(() => {
    const checkCredentials = async () => {
      // Check if user has valid credentials
      const credentials = await CredentialManager.load()
      setHasCredentials(!!credentials?.accessToken && !!credentials?.adAccountId)

      // Generate sample insights for demo
      if (credentials?.accessToken) {
        generateSampleInsights()
      }
    }
    checkCredentials()
  }, [])

  const generateSampleInsights = () => {
    const sampleInsights: PatternInsight[] = [
      {
        id: '1',
        type: 'performance',
        title: 'Conversion Rate Peak Detected',
        description: 'Campaigns show 35% higher conversion rates between 2-4 PM on weekdays.',
        impact: 'high',
        trend: 'positive',
        confidence: 87,
        actionable: true
      },
      {
        id: '2',
        type: 'timing',
        title: 'Weekend Performance Drop',
        description: 'Ad performance decreases by 22% on weekends compared to weekdays.',
        impact: 'medium',
        trend: 'negative',
        confidence: 92,
        actionable: true
      },
      {
        id: '3',
        type: 'audience',
        title: 'Mobile Audience Growth',
        description: 'Mobile traffic has increased 45% in the last 30 days, showing higher engagement rates.',
        impact: 'high',
        trend: 'positive',
        confidence: 95,
        actionable: true
      },
      {
        id: '4',
        type: 'creative',
        title: 'Video Ad Performance',
        description: 'Video ads are outperforming image ads by 28% in click-through rates.',
        impact: 'medium',
        trend: 'positive',
        confidence: 78,
        actionable: true
      },
      {
        id: '5',
        type: 'performance',
        title: 'Budget Allocation Opportunity',
        description: 'Campaign ABC shows 3x ROAS compared to others - consider increasing budget allocation.',
        impact: 'high',
        trend: 'positive',
        confidence: 89,
        actionable: true
      }
    ]
    setInsights(sampleInsights)
  }

  const analyzePatterns = async () => {
    if (!hasCredentials) {
      setError('Please configure your Meta API credentials first.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call for pattern analysis
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real implementation, this would call the Meta API
      // and use AI to analyze patterns in the data
      generateSampleInsights()
      
    } catch (err: any) {
      setError('Failed to analyze patterns. Please try again.')
      console.error('Pattern analysis error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <Target className="h-5 w-5" />
      case 'timing': return <Calendar className="h-5 w-5" />
      case 'audience': return <TrendingUp className="h-5 w-5" />
      case 'creative': return <Zap className="h-5 w-5" />
      default: return <Brain className="h-5 w-5" />
    }
  }

  const filterInsightsByType = (type: string) => {
    if (type === 'all') return insights
    return insights.filter(insight => insight.type === type)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Brain className="h-8 w-8 text-primary" />
                Pattern Analysis
              </h1>
              <p className="text-muted-foreground">
                AI-powered insights to optimize your Meta ad campaigns
              </p>
            </div>
          </div>
          <Button 
            onClick={analyzePatterns} 
            disabled={isLoading || !hasCredentials}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyze Patterns
              </>
            )}
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* No Credentials Warning */}
        {!hasCredentials && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please configure your Meta API credentials in the{" "}
              <Link href="/" className="font-medium underline">
                main dashboard
              </Link>{" "}
              to start analyzing patterns.
            </AlertDescription>
          </Alert>
        )}

        {/* Insights Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Insights</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="timing">Timing</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="creative">Creative</TabsTrigger>
          </TabsList>

          {['all', 'performance', 'timing', 'audience', 'creative'].map(type => (
            <TabsContent key={type} value={type} className="space-y-4">
              {filterInsightsByType(type).length > 0 ? (
                <div className="grid gap-4">
                  {filterInsightsByType(type).map(insight => (
                    <Card key={insight.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              {getTypeIcon(insight.type)}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{insight.title}</CardTitle>
                              <CardDescription className="mt-1">
                                {insight.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(insight.trend)}
                            <Badge 
                              variant="outline" 
                              className={getImpactColor(insight.impact)}
                            >
                              {insight.impact.toUpperCase()} IMPACT
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-muted-foreground">
                              Confidence: {insight.confidence}%
                            </div>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${insight.confidence}%` }}
                              />
                            </div>
                          </div>
                          {insight.actionable && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              Actionable
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Patterns Found</h3>
                    <p className="text-muted-foreground mb-4">
                      {hasCredentials 
                        ? "Click 'Analyze Patterns' to discover insights from your campaign data."
                        : "Connect your Meta account to start discovering patterns in your ad performance."
                      }
                    </p>
                    {hasCredentials && (
                      <Button onClick={analyzePatterns} disabled={isLoading}>
                        <Brain className="h-4 w-4 mr-2" />
                        Start Analysis
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}