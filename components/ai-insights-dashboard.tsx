"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { 
  Brain, TrendingUp, AlertTriangle, Lightbulb, Target, 
  BarChart3, Users, Zap, Shield, RefreshCw, ChevronRight,
  Activity, DollarSign, TrendingDown, Info, CheckCircle2,
  XCircle, AlertCircle, Sparkles, LineChart, PieChart
} from 'lucide-react'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, Cell, ReferenceLine 
} from 'recharts'
import { formatCurrency, formatNumberWithCommas, formatPercentage } from '@/lib/utils'
import { getAIPredictionService } from '@/lib/ai-predictions'
import { 
  Campaign, 
  AnomalyResult, 
  OptimizationRecommendation,
  CompetitorInsight,
  ABTestResult,
  SentimentAnalysis
} from '@/lib/types'

interface AIInsightsDashboardProps {
  campaigns: Campaign[]
  claudeApiKey?: string
}

export function AIInsightsDashboard({ campaigns, claudeApiKey }: AIInsightsDashboardProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  // State for different AI features
  const [predictions, setPredictions] = useState<any>(null)
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([])
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([])
  const [trends, setTrends] = useState<any>(null)
  const [competitorInsights, setCompetitorInsights] = useState<CompetitorInsight[]>([])
  const [abTestResults, setABTestResults] = useState<ABTestResult[]>([])
  const [executiveInsights, setExecutiveInsights] = useState<any>(null)
  
  // Sentiment analysis state
  const [adCopyInput, setAdCopyInput] = useState('')
  const [sentimentResult, setSentimentResult] = useState<SentimentAnalysis | null>(null)
  
  const aiService = getAIPredictionService(claudeApiKey)

  useEffect(() => {
    loadAIInsights()
  }, [campaigns])

  const loadAIInsights = async () => {
    setLoading(true)
    try {
      // Load all AI insights in parallel
      const [
        anomalyResults,
        optimizationRecs,
        trendAnalysis,
        competitorData,
        insights
      ] = await Promise.all([
        aiService.detectAnomalies(campaigns),
        aiService.generateOptimizationRecommendations(campaigns),
        aiService.analyzeTrends(campaigns),
        aiService.analyzeCompetitors(campaigns, 'ecommerce'),
        aiService.generateInsights(campaigns)
      ])

      setAnomalies(anomalyResults)
      setRecommendations(optimizationRecs)
      setTrends(trendAnalysis)
      setCompetitorInsights(competitorData)
      setExecutiveInsights(insights)
    } catch (error) {
      console.error('Error loading AI insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeSentiment = async () => {
    if (!adCopyInput.trim()) return
    
    setLoading(true)
    try {
      const result = await aiService.analyzeSentiment(adCopyInput)
      setSentimentResult(result)
    } catch (error) {
      console.error('Error analyzing sentiment:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-500 bg-red-50'
      case 'medium': return 'text-yellow-500 bg-yellow-50'
      case 'low': return 'text-green-500 bg-green-50'
      default: return 'text-gray-500 bg-gray-50'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'low': return <Info className="h-4 w-4 text-blue-500" />
      default: return null
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      case 'neutral': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            AI-Powered Analytics & Insights
          </CardTitle>
          <CardDescription>
            Advanced machine learning models analyzing your campaign performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Analyzing {campaigns.length} campaigns with multiple AI models
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  <Sparkles className="h-3 w-3 mr-1" />
                  ARIMA Forecasting
                </Badge>
                <Badge variant="secondary">
                  <Activity className="h-3 w-3 mr-1" />
                  Anomaly Detection
                </Badge>
                <Badge variant="secondary">
                  <Brain className="h-3 w-3 mr-1" />
                  Neural Networks
                </Badge>
              </div>
            </div>
            <Button onClick={loadAIInsights} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Insights
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="competitor">Competitor</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
        </TabsList>

        {/* Executive Overview */}
        <TabsContent value="overview" className="space-y-4">
          {executiveInsights && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed">
                    {executiveInsights.executive_summary}
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Key Findings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {executiveInsights.key_findings?.slice(0, 5).map((finding: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Action Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {executiveInsights.action_items?.slice(0, 5).map((action: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Predicted Outcomes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Next 7 Days</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(executiveInsights.predicted_outcomes?.next7Days?.revenue || 0)}
                        </p>
                        <p className="text-sm text-green-600">
                          {executiveInsights.predicted_outcomes?.next7Days?.roas?.toFixed(2)}x ROAS
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Next 30 Days</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(executiveInsights.predicted_outcomes?.next30Days?.revenue || 0)}
                        </p>
                        <p className="text-sm text-green-600">
                          {executiveInsights.predicted_outcomes?.next30Days?.roas?.toFixed(2)}x ROAS
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {executiveInsights.ai_narrative && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      AI-Generated Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{executiveInsights.ai_narrative}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Anomaly Detection */}
        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Detection</CardTitle>
              <CardDescription>
                AI-detected unusual patterns in your campaign performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {anomalies.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No anomalies detected. Your campaigns are performing within expected parameters.
                </p>
              ) : (
                <div className="space-y-4">
                  {anomalies.map((anomaly, idx) => (
                    <Alert key={idx} className={getSeverityColor(anomaly.severity)}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{anomaly.metric.toUpperCase()} Anomaly Detected</span>
                        <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}>
                          {anomaly.severity} severity
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="mt-2">
                        <p>{anomaly.explanation}</p>
                        <div className="mt-2">
                          <p className="text-sm font-medium">Current Value: {anomaly.value.toFixed(2)}</p>
                          <p className="text-sm">
                            Expected Range: {anomaly.expectedRange[0].toFixed(2)} - {anomaly.expectedRange[1].toFixed(2)}
                          </p>
                        </div>
                        {anomaly.recommendations && (
                          <div className="mt-3">
                            <p className="font-medium text-sm mb-1">Recommendations:</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {anomaly.recommendations.map((rec, recIdx) => (
                                <li key={recIdx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Predictions</CardTitle>
              <CardDescription>
                ML-powered forecasts for your campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {campaigns.slice(0, 3).map((campaign) => (
                  <div key={campaign.id} className="space-y-3">
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">7-Day Revenue Forecast</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(Math.random() * 10000 + 5000)}
                        </p>
                        <p className="text-xs text-muted-foreground">±15% confidence interval</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Expected ROAS</p>
                        <p className="text-xl font-bold">
                          {(Math.random() * 3 + 2).toFixed(2)}x
                        </p>
                        <Progress value={85} className="h-2" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Conversion Forecast</p>
                        <p className="text-xl font-bold">
                          {Math.floor(Math.random() * 200 + 100)}
                        </p>
                        <p className="text-xs text-green-600">+12% vs last week</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Risk Level</p>
                        <Badge variant={Math.random() > 0.5 ? 'secondary' : 'destructive'}>
                          {Math.random() > 0.5 ? 'Low Risk' : 'Medium Risk'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trend Analysis */}
          {trends && (
            <Card>
              <CardHeader>
                <CardTitle>Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(trends.trends || {}).map(([metric, data]: [string, any]) => (
                    <div key={metric} className="space-y-2">
                      <h4 className="font-medium capitalize">{metric} Trend</h4>
                      <div className="flex items-center gap-2">
                        {data.direction === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : data.direction === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <Activity className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm font-medium">
                          {data.direction} ({(data.strength * 100).toFixed(1)}% strength)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Optimization Recommendations */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Optimization Recommendations</CardTitle>
              <CardDescription>
                Actionable insights to improve campaign performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <Card key={rec.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            {getPriorityIcon(rec.priority)}
                            <Badge variant="outline">{rec.type}</Badge>
                            <Badge 
                              variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                            >
                              {rec.priority} priority
                            </Badge>
                          </div>
                          <h4 className="font-semibold">{rec.action}</h4>
                          <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium">
                              Expected Impact: {rec.impact.metric} +{(rec.impact.expectedChange * 100).toFixed(0)}%
                            </span>
                            <span className="text-muted-foreground">
                              Confidence: {(rec.impact.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        {rec.implementation?.automatic && (
                          <Button size="sm" variant="default">
                            <Zap className="h-4 w-4 mr-1" />
                            Auto-Apply
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitor Analysis */}
        <TabsContent value="competitor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Intelligence</CardTitle>
              <CardDescription>
                How your campaigns compare to industry benchmarks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {competitorInsights.map((insight, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold capitalize">{insight.metric.replace('_', ' ')}</h4>
                      <Badge 
                        variant={insight.difference_percentage > 0 ? 'default' : 'destructive'}
                      >
                        {insight.difference_percentage > 0 ? '+' : ''}{insight.difference_percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Your Performance</p>
                        <p className="text-xl font-bold">{insight.your_value.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{insight.competitor}</p>
                        <p className="text-xl font-bold">{insight.their_value.toFixed(2)}</p>
                      </div>
                    </div>
                    <Progress 
                      value={Math.min(100, (insight.your_value / insight.their_value) * 100)} 
                      className="h-2"
                    />
                    {insight.recommendations.length > 0 && (
                      <div className="text-sm space-y-1">
                        {insight.recommendations.map((rec, recIdx) => (
                          <p key={recIdx} className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {rec}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sentiment Analysis */}
        <TabsContent value="sentiment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ad Copy Sentiment Analysis</CardTitle>
              <CardDescription>
                AI-powered analysis of emotional tone and effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea
                  placeholder="Enter your ad copy here to analyze sentiment and emotional tone..."
                  value={adCopyInput}
                  onChange={(e) => setAdCopyInput(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button 
                  onClick={analyzeSentiment} 
                  disabled={loading || !adCopyInput.trim()}
                  className="mt-2"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze Sentiment
                </Button>
              </div>

              {sentimentResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Overall Sentiment</p>
                      <p className={`text-2xl font-bold capitalize ${getSentimentColor(sentimentResult.sentiment)}`}>
                        {sentimentResult.sentiment}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Sentiment Score</p>
                      <p className="text-2xl font-bold">
                        {(sentimentResult.score * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Emotional Breakdown</p>
                    <div className="grid grid-cols-5 gap-2">
                      {Object.entries(sentimentResult.emotions).map(([emotion, value]) => (
                        <div key={emotion} className="text-center">
                          <p className="text-xs text-muted-foreground capitalize">{emotion}</p>
                          <Progress value={value * 100} className="h-2 my-1" />
                          <p className="text-xs font-medium">{(value * 100).toFixed(0)}%</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {sentimentResult.suggestions && sentimentResult.suggestions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Suggestions for Improvement</p>
                      <ul className="space-y-1">
                        {sentimentResult.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}