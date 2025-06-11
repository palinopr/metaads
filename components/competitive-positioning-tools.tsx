"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts'
import { 
  Target, Crosshair, Shield, Zap, TrendingUp, Users, Globe,
  Star, Award, AlertTriangle, CheckCircle, ArrowUpRight,
  BarChart3, Brain, Lightbulb, Filter, Download, Settings
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface CompetitivePositioningToolsProps {
  campaigns: any[]
  totalSpend: number
  totalRevenue: number
  industry: string
}

interface CompetitorPosition {
  id: string
  name: string
  domain: string
  marketShare: number
  brandStrength: number
  performanceScore: number
  innovationIndex: number
  customerSatisfaction: number
  pricingPosition: 'premium' | 'mid-market' | 'value' | 'budget'
  differentiators: string[]
  weaknesses: string[]
  quadrant: 'leader' | 'challenger' | 'follower' | 'niche'
}

interface PositioningAttribute {
  attribute: string
  importance: number
  yourScore: number
  competitorScores: { [key: string]: number }
  industryAverage: number
  improvement: number
}

interface PositioningStrategy {
  id: string
  name: string
  description: string
  targetQuadrant: string
  keyActions: string[]
  estimatedTimeframe: string
  successMetrics: string[]
  riskLevel: 'low' | 'medium' | 'high'
  resourceRequirements: string[]
}

export function CompetitivePositioningTools({ campaigns, totalSpend, totalRevenue, industry }: CompetitivePositioningToolsProps) {
  const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null)
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState('overview')

  // Calculate your performance metrics
  const avgROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const avgCTR = campaigns.reduce((sum, c) => sum + (c.insights?.ctr || 0), 0) / (campaigns.length || 1)

  // Mock competitor positioning data
  const competitors: CompetitorPosition[] = [
    {
      id: 'comp-1',
      name: 'MarketLeader Corp',
      domain: 'marketleader.com',
      marketShare: 24.5,
      brandStrength: 92,
      performanceScore: 87,
      innovationIndex: 78,
      customerSatisfaction: 89,
      pricingPosition: 'premium',
      differentiators: ['Brand recognition', 'Enterprise features', 'Global presence', 'R&D investment'],
      weaknesses: ['High pricing', 'Slow innovation cycles', 'Complex onboarding'],
      quadrant: 'leader'
    },
    {
      id: 'comp-2',
      name: 'TechChallenger Inc',
      domain: 'techchallenger.com',
      marketShare: 18.3,
      brandStrength: 76,
      performanceScore: 91,
      innovationIndex: 94,
      customerSatisfaction: 82,
      pricingPosition: 'mid-market',
      differentiators: ['Cutting-edge technology', 'Fast implementation', 'AI features', 'Mobile-first'],
      weaknesses: ['Limited brand awareness', 'Smaller support team', 'Feature complexity'],
      quadrant: 'challenger'
    },
    {
      id: 'comp-3',
      name: 'EstablishedPlayer LLC',
      domain: 'established.com',
      marketShare: 15.7,
      brandStrength: 84,
      performanceScore: 72,
      innovationIndex: 58,
      customerSatisfaction: 75,
      pricingPosition: 'premium',
      differentiators: ['Industry expertise', 'Compliance features', 'Stable platform', 'Enterprise focus'],
      weaknesses: ['Outdated interface', 'Limited customization', 'Slow feature releases'],
      quadrant: 'follower'
    },
    {
      id: 'your-company',
      name: 'Your Company',
      domain: 'yourcompany.com',
      marketShare: 8.2,
      brandStrength: 65,
      performanceScore: 79,
      innovationIndex: 73,
      customerSatisfaction: 84,
      pricingPosition: 'mid-market',
      differentiators: ['Personalized service', 'Flexible pricing', 'Quick adaptation', 'Strong ROI'],
      weaknesses: ['Limited market presence', 'Smaller feature set', 'Resource constraints'],
      quadrant: 'challenger'
    }
  ]

  const positioningAttributes: PositioningAttribute[] = [
    {
      attribute: 'Brand Recognition',
      importance: 85,
      yourScore: 65,
      competitorScores: {
        'MarketLeader Corp': 92,
        'TechChallenger Inc': 76,
        'EstablishedPlayer LLC': 84
      },
      industryAverage: 79,
      improvement: 12
    },
    {
      attribute: 'Product Innovation',
      importance: 92,
      yourScore: 73,
      competitorScores: {
        'MarketLeader Corp': 78,
        'TechChallenger Inc': 94,
        'EstablishedPlayer LLC': 58
      },
      industryAverage: 76,
      improvement: 18
    },
    {
      attribute: 'Customer Support',
      importance: 88,
      yourScore: 84,
      competitorScores: {
        'MarketLeader Corp': 85,
        'TechChallenger Inc': 78,
        'EstablishedPlayer LLC': 82
      },
      industryAverage: 82,
      improvement: 8
    },
    {
      attribute: 'Pricing Competitiveness',
      importance: 76,
      yourScore: 87,
      competitorScores: {
        'MarketLeader Corp': 62,
        'TechChallenger Inc': 79,
        'EstablishedPlayer LLC': 58
      },
      industryAverage: 72,
      improvement: 5
    },
    {
      attribute: 'Market Presence',
      importance: 82,
      yourScore: 58,
      competitorScores: {
        'MarketLeader Corp': 95,
        'TechChallenger Inc': 72,
        'EstablishedPlayer LLC': 88
      },
      industryAverage: 78,
      improvement: 25
    },
    {
      attribute: 'Platform Reliability',
      importance: 94,
      yourScore: 89,
      competitorScores: {
        'MarketLeader Corp': 91,
        'TechChallenger Inc': 86,
        'EstablishedPlayer LLC': 93
      },
      industryAverage: 90,
      improvement: 3
    }
  ]

  const positioningStrategies: PositioningStrategy[] = [
    {
      id: 'strategy-1',
      name: 'Innovation Leader Positioning',
      description: 'Position as the most innovative solution in the market by emphasizing cutting-edge AI features and rapid feature development.',
      targetQuadrant: 'challenger',
      keyActions: [
        'Accelerate AI feature development and marketing',
        'Publish thought leadership content on innovation',
        'Partner with tech influencers and early adopters',
        'Create innovation-focused case studies',
        'Launch beta programs for latest features'
      ],
      estimatedTimeframe: '6-12 months',
      successMetrics: ['Innovation index improvement to 85+', 'Tech media mentions increase 200%', 'Early adopter acquisition up 150%'],
      riskLevel: 'medium',
      resourceRequirements: ['Increased R&D budget', 'Marketing team expansion', 'Technical content creation']
    },
    {
      id: 'strategy-2',
      name: 'Value Champion Positioning',
      description: 'Emphasize superior ROI and cost-effectiveness while maintaining quality, targeting price-conscious customers.',
      targetQuadrant: 'challenger',
      keyActions: [
        'Develop ROI calculator and comparison tools',
        'Create cost-benefit case studies',
        'Implement competitive pricing analysis',
        'Launch value-focused marketing campaigns',
        'Optimize onboarding for quick wins'
      ],
      estimatedTimeframe: '3-6 months',
      successMetrics: ['Price competitiveness score above 90', 'Cost-per-acquisition decrease 30%', 'Customer ROI stories increase'],
      riskLevel: 'low',
      resourceRequirements: ['Pricing strategy analysis', 'Marketing campaign budget', 'Customer success resources']
    },
    {
      id: 'strategy-3',
      name: 'Niche Expert Positioning',
      description: 'Focus on specific industry verticals or use cases where you can become the recognized specialist and thought leader.',
      targetQuadrant: 'niche',
      keyActions: [
        'Identify 2-3 target verticals for specialization',
        'Develop industry-specific features and content',
        'Build vertical-focused sales and marketing teams',
        'Create specialized partner networks',
        'Establish domain expertise through content and events'
      ],
      estimatedTimeframe: '9-18 months',
      successMetrics: ['Market share in target verticals 25%+', 'Industry association recognition', 'Vertical-specific revenue growth 300%'],
      riskLevel: 'high',
      resourceRequirements: ['Specialized team hiring', 'Vertical market research', 'Industry partnership development']
    }
  ]

  const getQuadrantColor = (quadrant: string) => {
    switch (quadrant) {
      case 'leader': return 'bg-green-100 text-green-700'
      case 'challenger': return 'bg-blue-100 text-blue-700'
      case 'follower': return 'bg-yellow-100 text-yellow-700'
      case 'niche': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getQuadrantIcon = (quadrant: string) => {
    switch (quadrant) {
      case 'leader': return <Award className="h-4 w-4" />
      case 'challenger': return <Zap className="h-4 w-4" />
      case 'follower': return <Users className="h-4 w-4" />
      case 'niche': return <Target className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'high': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Prepare radar chart data
  const radarData = positioningAttributes.map(attr => ({
    attribute: attr.attribute,
    'Your Score': attr.yourScore,
    'Industry Average': attr.industryAverage,
    'Top Competitor': Math.max(...Object.values(attr.competitorScores))
  }))

  // Prepare positioning quadrant data
  const quadrantData = competitors.map(comp => ({
    x: comp.performanceScore,
    y: comp.brandStrength,
    name: comp.name,
    marketShare: comp.marketShare,
    quadrant: comp.quadrant,
    isYou: comp.id === 'your-company'
  }))

  const yourCompany = competitors.find(c => c.id === 'your-company')!

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crosshair className="h-5 w-5" />
            Competitive Positioning Tools
          </CardTitle>
          <CardDescription>
            Strategic analysis and positioning recommendations to optimize your competitive advantage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{yourCompany.marketShare.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Market Share</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                {getQuadrantIcon(yourCompany.quadrant)}
                <Badge className={getQuadrantColor(yourCompany.quadrant)}>
                  {yourCompany.quadrant}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">Current Position</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{yourCompany.performanceScore}</div>
              <div className="text-sm text-muted-foreground">Performance Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{yourCompany.customerSatisfaction}</div>
              <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
            </div>
          </div>

          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>Current Position:</strong> You're positioned as a {yourCompany.quadrant} with strong 
              customer satisfaction but opportunity to improve market presence and brand recognition.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs defaultValue="positioning" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="positioning">Position Analysis</TabsTrigger>
          <TabsTrigger value="attributes">Attribute Comparison</TabsTrigger>
          <TabsTrigger value="strategies">Positioning Strategies</TabsTrigger>
          <TabsTrigger value="monitoring">Competitive Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="positioning" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competitive Positioning Matrix */}
            <Card>
              <CardHeader>
                <CardTitle>Competitive Positioning Matrix</CardTitle>
                <CardDescription>Market position based on performance vs brand strength</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart data={quadrantData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Performance Score" 
                      domain={[50, 100]}
                      label={{ value: 'Performance Score', position: 'bottom' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Brand Strength" 
                      domain={[50, 100]}
                      label={{ value: 'Brand Strength', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => [
                        value,
                        name === 'marketShare' ? 'Market Share %' : name
                      ]}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.name || ''}
                    />
                    <Scatter dataKey="marketShare" fill="#3b82f6">
                      {quadrantData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.isYou ? '#ef4444' : '#3b82f6'} 
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span>Competitors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span>Your Position</span>
                  </div>
                  <div className="text-muted-foreground">Size = Market Share</div>
                  <div className="text-muted-foreground">Goal: Top-right quadrant</div>
                </div>
              </CardContent>
            </Card>

            {/* Competitor Profiles */}
            <Card>
              <CardHeader>
                <CardTitle>Competitor Profiles</CardTitle>
                <CardDescription>Detailed analysis of key competitors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {competitors.filter(c => c.id !== 'your-company').map(competitor => (
                    <div key={competitor.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{competitor.name}</h3>
                          <Badge className={getQuadrantColor(competitor.quadrant)} variant="outline">
                            {competitor.quadrant}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{competitor.marketShare.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">Market Share</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Performance:</span>
                          <span className="ml-2 font-medium">{competitor.performanceScore}/100</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Brand:</span>
                          <span className="ml-2 font-medium">{competitor.brandStrength}/100</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Innovation:</span>
                          <span className="ml-2 font-medium">{competitor.innovationIndex}/100</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Satisfaction:</span>
                          <span className="ml-2 font-medium">{competitor.customerSatisfaction}/100</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <h4 className="text-sm font-medium text-green-600">Strengths</h4>
                          <div className="flex flex-wrap gap-1">
                            {competitor.differentiators.slice(0, 3).map(diff => (
                              <Badge key={diff} variant="outline" className="text-xs">
                                {diff}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-red-600">Weaknesses</h4>
                          <div className="flex flex-wrap gap-1">
                            {competitor.weaknesses.slice(0, 3).map(weakness => (
                              <Badge key={weakness} variant="outline" className="text-xs">
                                {weakness}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attributes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Multi-Attribute Comparison</CardTitle>
                <CardDescription>Your performance across key positioning attributes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="attribute" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar 
                      name="Your Score" 
                      dataKey="Your Score" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.6} 
                    />
                    <Radar 
                      name="Industry Average" 
                      dataKey="Industry Average" 
                      stroke="#94a3b8" 
                      fill="#94a3b8" 
                      fillOpacity={0.3} 
                    />
                    <Radar 
                      name="Top Competitor" 
                      dataKey="Top Competitor" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.2} 
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Attribute Details */}
            <Card>
              <CardHeader>
                <CardTitle>Attribute Analysis</CardTitle>
                <CardDescription>Detailed breakdown of positioning attributes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {positioningAttributes
                    .sort((a, b) => (b.importance * (100 - b.yourScore)) - (a.importance * (100 - a.yourScore)))
                    .map(attr => (
                      <div key={attr.attribute} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">{attr.attribute}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Importance: {attr.importance}%
                            </Badge>
                            <Badge 
                              className={
                                attr.yourScore >= attr.industryAverage ? 
                                'bg-green-100 text-green-700' : 
                                'bg-red-100 text-red-700'
                              }
                            >
                              {attr.yourScore}/100
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Your Score</span>
                            <span className="font-medium">{attr.yourScore}/100</span>
                          </div>
                          <Progress value={attr.yourScore} className="h-2" />
                          
                          <div className="flex items-center justify-between text-sm">
                            <span>Industry Average</span>
                            <span className="font-medium">{attr.industryAverage}/100</span>
                          </div>
                          <Progress value={attr.industryAverage} className="h-2 opacity-50" />
                          
                          <div className="text-xs text-muted-foreground">
                            Gap to close: {Math.max(0, attr.industryAverage - attr.yourScore)} points
                            {attr.improvement > 0 && (
                              <span className="text-green-600 ml-2">
                                (+{attr.improvement} improvement potential)
                              </span>
                            )}
                          </div>
                        </div>

                        {attr.yourScore < attr.industryAverage && (
                          <Alert className="mt-3">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              <strong>Action needed:</strong> This attribute is below industry average 
                              and has high importance for competitive positioning.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Positioning Strategy Options</h2>
            {positioningStrategies.map(strategy => (
              <Card key={strategy.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{strategy.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getQuadrantColor(strategy.targetQuadrant)}>
                        Target: {strategy.targetQuadrant}
                      </Badge>
                      <Badge className={getRiskColor(strategy.riskLevel)}>
                        {strategy.riskLevel} risk
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Key Actions</h4>
                      <ul className="space-y-2">
                        {strategy.keyActions.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-medium text-blue-600">{idx + 1}</span>
                            </div>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Success Metrics</h4>
                        <ul className="space-y-1">
                          {strategy.successMetrics.map((metric, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span>{metric}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Resource Requirements</h4>
                        <div className="flex flex-wrap gap-1">
                          {strategy.resourceRequirements.map(resource => (
                            <Badge key={resource} variant="outline" className="text-xs">
                              {resource}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Estimated timeframe: {strategy.estimatedTimeframe}
                    </div>
                    <Button variant="outline">
                      Develop Strategy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Position Tracking</CardTitle>
                <CardDescription>Monitor changes in competitive positioning over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={[
                      { month: 'Jan', yourScore: 76, marketLeader: 89, challenger: 82 },
                      { month: 'Feb', yourScore: 77, marketLeader: 89, challenger: 84 },
                      { month: 'Mar', yourScore: 79, marketLeader: 90, challenger: 85 },
                      { month: 'Apr', yourScore: 79, marketLeader: 91, challenger: 87 },
                      { month: 'May', yourScore: 81, marketLeader: 91, challenger: 88 },
                      { month: 'Jun', yourScore: 83, marketLeader: 92, challenger: 89 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[70, 95]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="yourScore" stroke="#3b82f6" strokeWidth={3} name="Your Position" />
                    <Line type="monotone" dataKey="marketLeader" stroke="#10b981" strokeWidth={2} name="Market Leader" />
                    <Line type="monotone" dataKey="challenger" stroke="#f59e0b" strokeWidth={2} name="Top Challenger" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Positioning Alerts</CardTitle>
                <CardDescription>Key competitive position changes to monitor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Positive Trend:</strong> Your customer satisfaction score increased 
                      6 points over the last quarter, now leading the market.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Competitive Threat:</strong> TechChallenger Inc launched new AI features, 
                      potentially impacting your innovation positioning.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Opportunity:</strong> EstablishedPlayer LLC showing weakness in 
                      customer satisfaction - opportunity to capture their customers.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">Position Monitoring KPIs</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Brand Recognition</span>
                      <div className="flex items-center gap-2">
                        <Progress value={65} className="w-24 h-2" />
                        <span className="text-sm font-medium">65%</span>
                        <ArrowUpRight className="h-3 w-3 text-green-600" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Market Share</span>
                      <div className="flex items-center gap-2">
                        <Progress value={82} className="w-24 h-2" />
                        <span className="text-sm font-medium">8.2%</span>
                        <ArrowUpRight className="h-3 w-3 text-green-600" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Innovation Index</span>
                      <div className="flex items-center gap-2">
                        <Progress value={73} className="w-24 h-2" />
                        <span className="text-sm font-medium">73/100</span>
                        <ArrowUpRight className="h-3 w-3 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Competitive Intelligence Summary</CardTitle>
              <CardDescription>Strategic recommendations based on competitive analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-green-600">Maintain Advantages</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Star className="h-3 w-3 text-green-600" />
                      <span>Customer satisfaction leadership</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-3 w-3 text-green-600" />
                      <span>Pricing competitiveness</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-3 w-3 text-green-600" />
                      <span>Platform reliability</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-orange-600">Address Gaps</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-orange-600" />
                      <span>Brand recognition deficit</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-orange-600" />
                      <span>Limited market presence</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-orange-600" />
                      <span>Innovation perception gap</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-blue-600">Strategic Moves</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-blue-600" />
                      <span>Increase innovation marketing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-blue-600" />
                      <span>Expand market presence</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-blue-600" />
                      <span>Build thought leadership</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}