"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ScatterChart, Scatter, ReferenceLine
} from 'recharts'
import { 
  TrendingUp, TrendingDown, BarChart3, Activity, Zap, 
  Calendar, Globe, Users, Target, AlertTriangle, CheckCircle,
  Lightbulb, ArrowUpRight, ArrowDownRight, Info, Clock,
  Brain, Rocket, Eye, Filter, Download
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface MarketTrendAnalysisProps {
  industry: string
  totalSpend: number
  totalRevenue: number
}

interface MarketTrend {
  id: string
  name: string
  category: 'platform' | 'technology' | 'behavior' | 'regulation' | 'economic'
  impact: 'low' | 'medium' | 'high' | 'critical'
  timeline: 'immediate' | 'short-term' | 'medium-term' | 'long-term'
  direction: 'up' | 'down' | 'stable' | 'volatile'
  confidence: number
  description: string
  implications: string[]
  dataPoints: { date: string; value: number; benchmark: number }[]
  relatedMetrics: string[]
}

interface MarketForecast {
  metric: string
  current: number
  forecast3m: number
  forecast6m: number
  forecast12m: number
  confidence: number
  factors: string[]
}

export function MarketTrendAnalysis({ industry, totalSpend, totalRevenue }: MarketTrendAnalysisProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTimeframe, setSelectedTimeframe] = useState('12m')
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null)

  // Mock market trends data
  const marketTrends: MarketTrend[] = [
    {
      id: 'trend-1',
      name: 'Mobile-First Advertising Shift',
      category: 'technology',
      impact: 'critical',
      timeline: 'immediate',
      direction: 'up',
      confidence: 92,
      description: 'Dramatic shift towards mobile-optimized ad formats and strategies as mobile usage dominates digital engagement.',
      implications: [
        'Desktop campaigns becoming less effective',
        'Vertical video formats gaining traction',
        'Mobile app install campaigns growing 45%',
        'Cross-device attribution becoming crucial'
      ],
      dataPoints: [
        { date: '2024-01', value: 65, benchmark: 60 },
        { date: '2024-02', value: 68, benchmark: 61 },
        { date: '2024-03', value: 72, benchmark: 62 },
        { date: '2024-04', value: 75, benchmark: 63 },
        { date: '2024-05', value: 78, benchmark: 64 },
        { date: '2024-06', value: 82, benchmark: 65 }
      ],
      relatedMetrics: ['Mobile CTR', 'App Installs', 'Mobile Conversion Rate']
    },
    {
      id: 'trend-2',
      name: 'AI-Powered Ad Automation',
      category: 'technology',
      impact: 'high',
      timeline: 'short-term',
      direction: 'up',
      confidence: 87,
      description: 'Rapid adoption of AI and machine learning for ad optimization, creative generation, and audience targeting.',
      implications: [
        'Manual campaign management becoming obsolete',
        'Creative testing cycles accelerating',
        'Hyper-personalized ad experiences',
        'Reduced need for traditional media buyers'
      ],
      dataPoints: [
        { date: '2024-01', value: 28, benchmark: 25 },
        { date: '2024-02', value: 32, benchmark: 27 },
        { date: '2024-03', value: 38, benchmark: 29 },
        { date: '2024-04', value: 45, benchmark: 31 },
        { date: '2024-05', value: 52, benchmark: 33 },
        { date: '2024-06', value: 58, benchmark: 35 }
      ],
      relatedMetrics: ['Automation Rate', 'AI Campaign Performance', 'Cost Efficiency']
    },
    {
      id: 'trend-3',
      name: 'Privacy-First Advertising',
      category: 'regulation',
      impact: 'critical',
      timeline: 'medium-term',
      direction: 'up',
      confidence: 95,
      description: 'Shift towards privacy-compliant advertising methods due to regulatory changes and platform policies.',
      implications: [
        'Third-party cookie deprecation impact',
        'First-party data becomes premium',
        'Contextual advertising revival',
        'Server-side tracking implementation'
      ],
      dataPoints: [
        { date: '2024-01', value: 42, benchmark: 40 },
        { date: '2024-02', value: 46, benchmark: 43 },
        { date: '2024-03', value: 51, benchmark: 46 },
        { date: '2024-04', value: 55, benchmark: 49 },
        { date: '2024-05', value: 60, benchmark: 52 },
        { date: '2024-06', value: 65, benchmark: 55 }
      ],
      relatedMetrics: ['First-Party Data Usage', 'Privacy Compliance Score', 'Attribution Accuracy']
    },
    {
      id: 'trend-4',
      name: 'Social Commerce Integration',
      category: 'platform',
      impact: 'high',
      timeline: 'immediate',
      direction: 'up',
      confidence: 89,
      description: 'Direct purchasing capabilities within social media platforms, blending content and commerce.',
      implications: [
        'Shortened customer journey',
        'Influencer marketing ROI improvement',
        'Platform dependency increase',
        'New attribution challenges'
      ],
      dataPoints: [
        { date: '2024-01', value: 34, benchmark: 30 },
        { date: '2024-02', value: 39, benchmark: 33 },
        { date: '2024-03', value: 44, benchmark: 36 },
        { date: '2024-04', value: 50, benchmark: 39 },
        { date: '2024-05', value: 56, benchmark: 42 },
        { date: '2024-06', value: 62, benchmark: 45 }
      ],
      relatedMetrics: ['Social Commerce Revenue', 'Platform Purchase Rate', 'Social ROI']
    },
    {
      id: 'trend-5',
      name: 'Economic Uncertainty Impact',
      category: 'economic',
      impact: 'medium',
      timeline: 'short-term',
      direction: 'volatile',
      confidence: 78,
      description: 'Economic conditions affecting advertising spend allocation and consumer behavior patterns.',
      implications: [
        'Budget optimization becoming critical',
        'Performance marketing preference',
        'Brand advertising reduction',
        'Consumer price sensitivity increase'
      ],
      dataPoints: [
        { date: '2024-01', value: 68, benchmark: 70 },
        { date: '2024-02', value: 65, benchmark: 69 },
        { date: '2024-03', value: 62, benchmark: 68 },
        { date: '2024-04', value: 59, benchmark: 67 },
        { date: '2024-05', value: 61, benchmark: 66 },
        { date: '2024-06', value: 64, benchmark: 65 }
      ],
      relatedMetrics: ['Ad Spend Growth', 'Consumer Confidence', 'Performance Focus']
    }
  ]

  const marketForecasts: MarketForecast[] = [
    {
      metric: 'Average CPC',
      current: 1.25,
      forecast3m: 1.32,
      forecast6m: 1.41,
      forecast12m: 1.55,
      confidence: 85,
      factors: ['Increased competition', 'Platform algorithm changes', 'Seasonal demand']
    },
    {
      metric: 'Mobile Ad Share',
      current: 78,
      forecast3m: 82,
      forecast6m: 86,
      forecast12m: 91,
      confidence: 92,
      factors: ['Mobile usage growth', 'Platform mobile optimization', 'Consumer behavior shift']
    },
    {
      metric: 'Video Ad Adoption',
      current: 45,
      forecast3m: 52,
      forecast6m: 61,
      forecast12m: 72,
      confidence: 88,
      factors: ['Platform algorithm preference', 'Engagement rate superiority', 'Creative tool advancement']
    },
    {
      metric: 'AI Automation Rate',
      current: 35,
      forecast3m: 42,
      forecast6m: 51,
      forecast12m: 68,
      confidence: 79,
      factors: ['Technology maturation', 'Cost reduction', 'Performance improvement']
    }
  ]

  const getTrendImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getTrendDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'stable': return <Activity className="h-4 w-4 text-blue-600" />
      case 'volatile': return <Zap className="h-4 w-4 text-yellow-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredTrends = marketTrends.filter(trend => 
    selectedCategory === 'all' || trend.category === selectedCategory
  )

  const selectedTrendData = selectedTrend 
    ? marketTrends.find(t => t.id === selectedTrend)
    : null

  const overallTrendScore = marketTrends.reduce((sum, trend) => {
    const weight = trend.impact === 'critical' ? 4 : trend.impact === 'high' ? 3 : trend.impact === 'medium' ? 2 : 1
    return sum + (trend.confidence * weight)
  }, 0) / marketTrends.reduce((sum, trend) => {
    const weight = trend.impact === 'critical' ? 4 : trend.impact === 'high' ? 3 : trend.impact === 'medium' ? 2 : 1
    return sum + weight
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Trend Analysis
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of market trends and their impact on your advertising strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="platform">Platform Trends</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="behavior">Behavior</SelectItem>
                <SelectItem value="regulation">Regulation</SelectItem>
                <SelectItem value="economic">Economic</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="12m">12 Months</SelectItem>
                <SelectItem value="24m">24 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{overallTrendScore.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Trend Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {marketTrends.filter(t => t.impact === 'critical' || t.impact === 'high').length}
              </div>
              <div className="text-sm text-muted-foreground">High Impact Trends</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {marketTrends.filter(t => t.direction === 'up').length}
              </div>
              <div className="text-sm text-muted-foreground">Growing Trends</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {marketTrends.filter(t => t.timeline === 'immediate').length}
              </div>
              <div className="text-sm text-muted-foreground">Immediate Impact</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          <TabsTrigger value="analysis">Deep Analysis</TabsTrigger>
          <TabsTrigger value="strategy">Strategic Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Key Market Trends</h3>
              {filteredTrends.map(trend => (
                <Card 
                  key={trend.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedTrend === trend.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedTrend(trend.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTrendDirectionIcon(trend.direction)}
                        <h4 className="font-medium">{trend.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTrendImpactColor(trend.impact)} variant="outline">
                          {trend.impact} impact
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {trend.category}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {trend.description}
                    </p>

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Confidence Level</span>
                      <span className="text-sm font-medium">{trend.confidence}%</span>
                    </div>
                    <Progress value={trend.confidence} className="h-2 mb-3" />

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">Timeline: {trend.timeline}</span>
                      <span>{trend.dataPoints.length} data points</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Trend Detail */}
            {selectedTrendData ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Trend Analysis: {selectedTrendData.name}</h3>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Trend Data</CardTitle>
                    <CardDescription>Historical progression and benchmark comparison</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={selectedTrendData.dataPoints}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          name="Trend Value"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="benchmark" 
                          stroke="#94a3b8" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Industry Benchmark"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Key Implications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedTrendData.implications.map((implication, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                          </div>
                          <span>{implication}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Related Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedTrendData.relatedMetrics.map(metric => (
                        <Badge key={metric} variant="outline">{metric}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Trend</h3>
                  <p className="text-muted-foreground">
                    Click on any trend to see detailed analysis and implications
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="forecasts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Forecasts</CardTitle>
                <CardDescription>Projected changes in key advertising metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {marketForecasts.map(forecast => (
                    <div key={forecast.metric} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{forecast.metric}</h4>
                        <Badge variant="outline">
                          {forecast.confidence}% confidence
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div className="text-center">
                          <div className="text-muted-foreground">Current</div>
                          <div className="font-medium">
                            {forecast.metric.includes('Share') || forecast.metric.includes('Rate') || forecast.metric.includes('Adoption') 
                              ? `${forecast.current}%` 
                              : formatCurrency(forecast.current)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">3M</div>
                          <div className="font-medium">
                            {forecast.metric.includes('Share') || forecast.metric.includes('Rate') || forecast.metric.includes('Adoption')
                              ? `${forecast.forecast3m}%` 
                              : formatCurrency(forecast.forecast3m)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">6M</div>
                          <div className="font-medium">
                            {forecast.metric.includes('Share') || forecast.metric.includes('Rate') || forecast.metric.includes('Adoption')
                              ? `${forecast.forecast6m}%` 
                              : formatCurrency(forecast.forecast6m)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">12M</div>
                          <div className="font-medium">
                            {forecast.metric.includes('Share') || forecast.metric.includes('Rate') || forecast.metric.includes('Adoption')
                              ? `${forecast.forecast12m}%` 
                              : formatCurrency(forecast.forecast12m)}
                          </div>
                        </div>
                      </div>

                      <Progress value={forecast.confidence} className="h-2" />

                      <div className="text-xs text-muted-foreground">
                        <strong>Key Factors:</strong> {forecast.factors.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forecast Visualization</CardTitle>
                <CardDescription>Projected trends for the next 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={[
                      { month: 'Current', cpc: 1.25, mobile: 78, video: 45, ai: 35 },
                      { month: '3M', cpc: 1.32, mobile: 82, video: 52, ai: 42 },
                      { month: '6M', cpc: 1.41, mobile: 86, video: 61, ai: 51 },
                      { month: '12M', cpc: 1.55, mobile: 91, video: 72, ai: 68 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'cpc' ? formatCurrency(value as number) : `${value}%`,
                        name === 'cpc' ? 'Avg CPC' :
                        name === 'mobile' ? 'Mobile Share' :
                        name === 'video' ? 'Video Adoption' : 'AI Automation'
                      ]}
                    />
                    <Legend />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="mobile" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Mobile Share %"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="video" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Video Adoption %"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="ai" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="AI Automation %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trend Correlation Analysis</CardTitle>
                <CardDescription>How different trends influence each other</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Brain className="h-4 w-4" />
                    <AlertDescription>
                      <strong>High Correlation:</strong> Mobile-first advertising and social commerce 
                      integration show 87% correlation, suggesting synchronized growth patterns.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Inverse Relationship:</strong> Economic uncertainty inversely correlates 
                      with AI automation adoption (-0.65), as budgets tighten automation investment.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Reinforcing Trends:</strong> Privacy-first advertising is accelerating 
                      AI automation adoption as brands seek efficiency in constrained environments.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
                <CardDescription>Potential risks and mitigation strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <h4 className="font-medium text-red-600">High Risk</h4>
                    </div>
                    <p className="text-sm mb-2">
                      <strong>Privacy Regulation Changes:</strong> Sudden platform policy shifts could 
                      disrupt current attribution models.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mitigation: Diversify tracking methods, invest in first-party data collection
                    </p>
                  </div>

                  <div className="border rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <h4 className="font-medium text-yellow-600">Medium Risk</h4>
                    </div>
                    <p className="text-sm mb-2">
                      <strong>Platform Algorithm Dependency:</strong> Over-reliance on automated 
                      optimization could reduce strategic control.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mitigation: Maintain hybrid approach, develop internal expertise
                    </p>
                  </div>

                  <div className="border rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium text-green-600">Low Risk</h4>
                    </div>
                    <p className="text-sm mb-2">
                      <strong>Mobile Transition:</strong> Well-established trend with clear 
                      adaptation strategies and tools available.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Opportunity: Early mobile optimization can provide competitive advantage
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strategy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Recommendations</CardTitle>
              <CardDescription>Action plan based on market trend analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3 text-green-600">Immediate Actions (0-3 months)</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Rocket className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Accelerate Mobile Optimization</p>
                          <p className="text-muted-foreground">Redesign all campaigns for mobile-first experience</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Rocket className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Implement AI-Powered Testing</p>
                          <p className="text-muted-foreground">Deploy automated A/B testing for creative optimization</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Rocket className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Privacy Compliance Audit</p>
                          <p className="text-muted-foreground">Review and update data collection practices</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3 text-blue-600">Medium-term Strategy (3-12 months)</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Social Commerce Integration</p>
                          <p className="text-muted-foreground">Develop in-platform purchasing capabilities</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">First-Party Data Strategy</p>
                          <p className="text-muted-foreground">Build comprehensive customer data platform</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Video Content Investment</p>
                          <p className="text-muted-foreground">Scale video production for all platforms</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Success Metrics:</strong> Track mobile conversion rates (+25%), 
                    AI automation efficiency (+40%), and first-party data collection growth (+60%) 
                    to measure trend adaptation success.
                  </AlertDescription>
                </Alert>

                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Implementation Timeline
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Mobile optimization completion</span>
                      <span className="text-muted-foreground">Month 2</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI automation deployment</span>
                      <span className="text-muted-foreground">Month 3</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Social commerce pilot</span>
                      <span className="text-muted-foreground">Month 6</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Full strategy implementation</span>
                      <span className="text-muted-foreground">Month 12</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}