"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Target, Shield, AlertTriangle, TrendingUp, CheckCircle, 
  XCircle, Lightbulb, Zap, Users, BarChart3, Calendar,
  ArrowUpRight, ArrowDownRight, Plus, Download, Filter
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface SWOTAnalysisProps {
  campaigns: any[]
  totalSpend: number
  totalRevenue: number
  industry: string
}

interface SWOTItem {
  id: string
  category: 'strength' | 'weakness' | 'opportunity' | 'threat'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  urgency: 'low' | 'medium' | 'high'
  confidence: number
  relatedMetrics: string[]
  actionItems: string[]
  lastUpdated: Date
}

interface StrategicRecommendation {
  id: string
  type: 'leverage_strength' | 'address_weakness' | 'capitalize_opportunity' | 'mitigate_threat'
  title: string
  description: string
  priority: number
  estimatedImpact: string
  timeframe: string
  resources: string[]
  relatedSWOT: string[]
}

export function SWOTAnalysis({ campaigns, totalSpend, totalRevenue, industry }: SWOTAnalysisProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState('current')

  // Calculate key metrics
  const avgROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const avgCTR = campaigns.reduce((sum, c) => sum + (c.insights?.ctr || 0), 0) / (campaigns.length || 1)
  const avgCPC = campaigns.reduce((sum, c) => sum + (c.insights?.cpc || 0), 0) / (campaigns.length || 1)

  // Mock SWOT data based on performance
  const swotItems: SWOTItem[] = [
    // Strengths
    {
      id: 'strength-1',
      category: 'strength',
      title: 'High ROAS Performance',
      description: 'Your ROAS of ' + avgROAS.toFixed(2) + 'x significantly exceeds industry average, indicating efficient ad spend allocation and strong conversion optimization.',
      impact: 'high',
      urgency: 'low',
      confidence: 92,
      relatedMetrics: ['ROAS', 'Conversion Rate', 'Revenue'],
      actionItems: [
        'Scale successful campaigns with proven ROAS',
        'Identify and replicate high-performing campaign elements',
        'Increase budget allocation to top-performing ad sets'
      ],
      lastUpdated: new Date()
    },
    {
      id: 'strength-2',
      category: 'strength',
      title: 'Diverse Campaign Portfolio',
      description: 'Strong presence across multiple advertising platforms and campaign types, reducing dependency risk and maximizing audience reach.',
      impact: 'medium',
      urgency: 'low',
      confidence: 87,
      relatedMetrics: ['Platform Diversity', 'Audience Reach'],
      actionItems: [
        'Maintain balanced platform investment',
        'Cross-pollinate successful strategies between platforms',
        'Continue testing new platform opportunities'
      ],
      lastUpdated: new Date()
    },
    {
      id: 'strength-3',
      category: 'strength',
      title: 'Creative Performance',
      description: 'Video and carousel ad formats showing superior engagement rates compared to static image ads, indicating strong creative capabilities.',
      impact: 'medium',
      urgency: 'low',
      confidence: 84,
      relatedMetrics: ['Engagement Rate', 'CTR', 'Creative Performance'],
      actionItems: [
        'Expand video content production',
        'Invest in interactive ad formats',
        'Develop creative testing frameworks'
      ],
      lastUpdated: new Date()
    },

    // Weaknesses
    {
      id: 'weakness-1',
      category: 'weakness',
      title: 'High Customer Acquisition Cost',
      description: 'CPA is 23% above industry benchmark, suggesting inefficiencies in targeting or conversion funnel optimization.',
      impact: 'high',
      urgency: 'high',
      confidence: 89,
      relatedMetrics: ['CPA', 'Conversion Rate', 'Funnel Performance'],
      actionItems: [
        'Audit and optimize conversion funnels',
        'Refine audience targeting parameters',
        'A/B test landing page variations',
        'Implement marketing automation workflows'
      ],
      lastUpdated: new Date()
    },
    {
      id: 'weakness-2',
      category: 'weakness',
      title: 'Limited Mobile Optimization',
      description: 'Mobile conversion rates are 35% lower than desktop, indicating suboptimal mobile user experience and ad creative.',
      impact: 'high',
      urgency: 'high',
      confidence: 91,
      relatedMetrics: ['Mobile Conversion Rate', 'Mobile CTR'],
      actionItems: [
        'Redesign mobile landing pages',
        'Create mobile-first ad creatives',
        'Implement accelerated mobile pages (AMP)',
        'Optimize mobile checkout process'
      ],
      lastUpdated: new Date()
    },
    {
      id: 'weakness-3',
      category: 'weakness',
      title: 'Seasonal Performance Volatility',
      description: 'Campaign performance shows high variance during seasonal periods, lacking consistent optimization strategies for different seasons.',
      impact: 'medium',
      urgency: 'medium',
      confidence: 76,
      relatedMetrics: ['Seasonal Performance', 'Revenue Consistency'],
      actionItems: [
        'Develop seasonal campaign strategies',
        'Create seasonal creative calendars',
        'Implement automated bid adjustments',
        'Build seasonal forecasting models'
      ],
      lastUpdated: new Date()
    },

    // Opportunities
    {
      id: 'opportunity-1',
      category: 'opportunity',
      title: 'AI-Powered Automation',
      description: 'Low adoption of AI and machine learning tools presents opportunity for significant efficiency gains and performance improvements.',
      impact: 'critical',
      urgency: 'high',
      confidence: 94,
      relatedMetrics: ['Automation Rate', 'Efficiency Metrics'],
      actionItems: [
        'Implement smart bidding strategies',
        'Deploy automated creative testing',
        'Integrate predictive analytics',
        'Adopt AI-powered audience targeting'
      ],
      lastUpdated: new Date()
    },
    {
      id: 'opportunity-2',
      category: 'opportunity',
      title: 'Emerging Platform Growth',
      description: 'TikTok and emerging platforms showing rapid user growth with lower competition and cost-effective advertising opportunities.',
      impact: 'high',
      urgency: 'medium',
      confidence: 82,
      relatedMetrics: ['Platform Growth', 'Competition Level'],
      actionItems: [
        'Launch pilot campaigns on TikTok',
        'Test emerging platform advertising',
        'Develop platform-specific content strategies',
        'Monitor new platform beta opportunities'
      ],
      lastUpdated: new Date()
    },
    {
      id: 'opportunity-3',
      category: 'opportunity',
      title: 'First-Party Data Utilization',
      description: 'Untapped potential in leveraging first-party customer data for improved targeting and personalization in privacy-first environment.',
      impact: 'high',
      urgency: 'high',
      confidence: 88,
      relatedMetrics: ['Data Quality', 'Personalization Rate'],
      actionItems: [
        'Implement customer data platform',
        'Create personalized ad experiences',
        'Develop lookalike audiences from first-party data',
        'Build retargeting segments based on behavior'
      ],
      lastUpdated: new Date()
    },

    // Threats
    {
      id: 'threat-1',
      category: 'threat',
      title: 'Increasing Competition',
      description: 'Competitor ad spend increased 45% in the last quarter, driving up costs and reducing market share availability.',
      impact: 'high',
      urgency: 'high',
      confidence: 93,
      relatedMetrics: ['Market Share', 'CPC Inflation', 'Competition Index'],
      actionItems: [
        'Strengthen unique value propositions',
        'Increase creative differentiation',
        'Explore niche market opportunities',
        'Improve campaign efficiency to maintain profitability'
      ],
      lastUpdated: new Date()
    },
    {
      id: 'threat-2',
      category: 'threat',
      title: 'Privacy Regulation Changes',
      description: 'Ongoing privacy regulations and platform policy changes threatening attribution accuracy and targeting capabilities.',
      impact: 'critical',
      urgency: 'medium',
      confidence: 96,
      relatedMetrics: ['Attribution Accuracy', 'Targeting Precision'],
      actionItems: [
        'Implement server-side tracking',
        'Develop privacy-compliant attribution models',
        'Invest in contextual advertising capabilities',
        'Build first-party data collection strategies'
      ],
      lastUpdated: new Date()
    },
    {
      id: 'threat-3',
      category: 'threat',
      title: 'Economic Uncertainty',
      description: 'Economic volatility affecting consumer spending patterns and potentially reducing advertising effectiveness and ROI.',
      impact: 'medium',
      urgency: 'medium',
      confidence: 71,
      relatedMetrics: ['Consumer Spending', 'ROI Trends'],
      actionItems: [
        'Focus on performance-driven campaigns',
        'Adjust messaging for value-conscious consumers',
        'Diversify target demographics',
        'Implement flexible budget allocation strategies'
      ],
      lastUpdated: new Date()
    }
  ]

  const strategicRecommendations: StrategicRecommendation[] = [
    {
      id: 'rec-1',
      type: 'capitalize_opportunity',
      title: 'AI-First Campaign Optimization',
      description: 'Implement comprehensive AI automation across all campaigns to capitalize on efficiency opportunities while maintaining performance standards.',
      priority: 1,
      estimatedImpact: '+25% efficiency, +15% ROAS',
      timeframe: '3-6 months',
      resources: ['AI tools investment', 'Team training', 'Data infrastructure'],
      relatedSWOT: ['opportunity-1', 'strength-1']
    },
    {
      id: 'rec-2',
      type: 'address_weakness',
      title: 'Mobile Experience Overhaul',
      description: 'Comprehensive mobile optimization initiative to address conversion rate gaps and capitalize on mobile traffic growth.',
      priority: 2,
      estimatedImpact: '+40% mobile conversions',
      timeframe: '2-4 months',
      resources: ['UX/UI design', 'Development team', 'Mobile testing tools'],
      relatedSWOT: ['weakness-2', 'opportunity-2']
    },
    {
      id: 'rec-3',
      type: 'mitigate_threat',
      title: 'Privacy-First Attribution Strategy',
      description: 'Develop robust attribution and tracking capabilities that maintain effectiveness in privacy-constrained environment.',
      priority: 3,
      estimatedImpact: 'Maintained attribution accuracy',
      timeframe: '4-8 months',
      resources: ['Analytics team', 'Technical implementation', 'Compliance review'],
      relatedSWOT: ['threat-2', 'opportunity-3']
    }
  ]

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'weakness': return <XCircle className="h-5 w-5 text-red-600" />
      case 'opportunity': return <TrendingUp className="h-5 w-5 text-blue-600" />
      case 'threat': return <AlertTriangle className="h-5 w-5 text-orange-600" />
      default: return <Target className="h-5 w-5 text-gray-600" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength': return 'border-green-200 bg-green-50'
      case 'weakness': return 'border-red-200 bg-red-50'
      case 'opportunity': return 'border-blue-200 bg-blue-50'
      case 'threat': return 'border-orange-200 bg-orange-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-100 text-red-700'
      case 'high': return 'bg-orange-100 text-orange-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredItems = selectedCategory 
    ? swotItems.filter(item => item.category === selectedCategory)
    : swotItems

  const categoryCounts = {
    strength: swotItems.filter(item => item.category === 'strength').length,
    weakness: swotItems.filter(item => item.category === 'weakness').length,
    opportunity: swotItems.filter(item => item.category === 'opportunity').length,
    threat: swotItems.filter(item => item.category === 'threat').length
  }

  const overallScore = {
    strengths: swotItems.filter(item => item.category === 'strength').reduce((sum, item) => sum + item.confidence, 0) / categoryCounts.strength,
    weaknesses: 100 - (swotItems.filter(item => item.category === 'weakness').reduce((sum, item) => sum + item.confidence, 0) / categoryCounts.weakness),
    opportunities: swotItems.filter(item => item.category === 'opportunity').reduce((sum, item) => sum + item.confidence, 0) / categoryCounts.opportunity,
    threats: 100 - (swotItems.filter(item => item.category === 'threat').reduce((sum, item) => sum + item.confidence, 0) / categoryCounts.threat)
  }

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            SWOT Analysis
          </CardTitle>
          <CardDescription>
            Strategic analysis of Strengths, Weaknesses, Opportunities, and Threats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div 
              className={`text-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedCategory === 'strength' ? 'border-green-500 bg-green-50' : 'border-green-200 hover:border-green-300'
              }`}
              onClick={() => setSelectedCategory(selectedCategory === 'strength' ? null : 'strength')}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="text-2xl font-bold text-green-600">{categoryCounts.strength}</div>
              </div>
              <div className="text-sm text-muted-foreground">Strengths</div>
              <Progress value={overallScore.strengths} className="mt-2 h-2" />
            </div>
            <div 
              className={`text-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedCategory === 'weakness' ? 'border-red-500 bg-red-50' : 'border-red-200 hover:border-red-300'
              }`}
              onClick={() => setSelectedCategory(selectedCategory === 'weakness' ? null : 'weakness')}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div className="text-2xl font-bold text-red-600">{categoryCounts.weakness}</div>
              </div>
              <div className="text-sm text-muted-foreground">Weaknesses</div>
              <Progress value={overallScore.weaknesses} className="mt-2 h-2" />
            </div>
            <div 
              className={`text-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedCategory === 'opportunity' ? 'border-blue-500 bg-blue-50' : 'border-blue-200 hover:border-blue-300'
              }`}
              onClick={() => setSelectedCategory(selectedCategory === 'opportunity' ? null : 'opportunity')}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div className="text-2xl font-bold text-blue-600">{categoryCounts.opportunity}</div>
              </div>
              <div className="text-sm text-muted-foreground">Opportunities</div>
              <Progress value={overallScore.opportunities} className="mt-2 h-2" />
            </div>
            <div 
              className={`text-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedCategory === 'threat' ? 'border-orange-500 bg-orange-50' : 'border-orange-200 hover:border-orange-300'
              }`}
              onClick={() => setSelectedCategory(selectedCategory === 'threat' ? null : 'threat')}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div className="text-2xl font-bold text-orange-600">{categoryCounts.threat}</div>
              </div>
              <div className="text-sm text-muted-foreground">Threats</div>
              <Progress value={overallScore.threats} className="mt-2 h-2" />
            </div>
          </div>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>Strategic Position:</strong> Your strongest areas are ROAS performance and creative capabilities. 
              Priority focus should be on mobile optimization and AI automation to maximize competitive advantage.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">SWOT Analysis</TabsTrigger>
          <TabsTrigger value="matrix">Strategic Matrix</TabsTrigger>
          <TabsTrigger value="recommendations">Action Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          <div className="space-y-4">
            {filteredItems.map(item => (
              <Card key={item.id} className={`${getCategoryColor(item.category)} border-l-4`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getCategoryIcon(item.category)}
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg capitalize">{item.title}</h3>
                          <Badge variant="outline" className="capitalize">
                            {item.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getImpactColor(item.impact)}>
                            {item.impact} impact
                          </Badge>
                          <Badge variant="secondary">
                            {item.confidence}% confidence
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm leading-relaxed">{item.description}</p>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Impact:</span>
                          <Progress value={item.impact === 'critical' ? 100 : item.impact === 'high' ? 75 : item.impact === 'medium' ? 50 : 25} className="w-16 h-2" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Urgency:</span>
                          <Progress value={item.urgency === 'high' ? 100 : item.urgency === 'medium' ? 50 : 25} className="w-16 h-2" />
                        </div>
                      </div>

                      {item.relatedMetrics.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium">Related Metrics:</span>
                          <div className="flex flex-wrap gap-2">
                            {item.relatedMetrics.map(metric => (
                              <Badge key={metric} variant="outline" className="text-xs">
                                {metric}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <span className="text-sm font-medium">Recommended Actions:</span>
                        <ul className="space-y-1">
                          {item.actionItems.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                              </div>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {selectedCategory && filteredItems.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No items in this category</h3>
                  <p className="text-muted-foreground">
                    Click on different categories to explore your SWOT analysis
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths vs Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-600">Leverage Strengths for Opportunities</CardTitle>
                <CardDescription>How to use your strengths to capitalize on opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded p-3 bg-green-50">
                    <h4 className="font-medium mb-2">High ROAS + AI Automation</h4>
                    <p className="text-sm text-muted-foreground">
                      Use proven ROAS performance to confidently invest in AI automation tools, 
                      expecting similar efficiency gains across automated campaigns.
                    </p>
                  </div>
                  <div className="border rounded p-3 bg-green-50">
                    <h4 className="font-medium mb-2">Creative Skills + Emerging Platforms</h4>
                    <p className="text-sm text-muted-foreground">
                      Leverage strong creative performance to early-adopt emerging platforms 
                      where creative quality provides competitive advantage.
                    </p>
                  </div>
                  <div className="border rounded p-3 bg-green-50">
                    <h4 className="font-medium mb-2">Platform Diversity + First-Party Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Use multi-platform presence to build comprehensive first-party data 
                      collection across touchpoints.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weaknesses vs Threats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-600">Address Critical Vulnerabilities</CardTitle>
                <CardDescription>Weaknesses that could be exploited by threats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded p-3 bg-red-50">
                    <h4 className="font-medium mb-2">High CPA + Increased Competition</h4>
                    <p className="text-sm text-muted-foreground">
                      Rising competition could worsen already high acquisition costs. 
                      Urgent optimization needed to maintain profitability.
                    </p>
                    <Badge className="bg-red-100 text-red-700 mt-2">Critical Priority</Badge>
                  </div>
                  <div className="border rounded p-3 bg-red-50">
                    <h4 className="font-medium mb-2">Mobile Issues + Privacy Changes</h4>
                    <p className="text-sm text-muted-foreground">
                      Poor mobile performance combined with attribution limitations 
                      could severely impact campaign effectiveness.
                    </p>
                    <Badge className="bg-red-100 text-red-700 mt-2">High Priority</Badge>
                  </div>
                  <div className="border rounded p-3 bg-red-50">
                    <h4 className="font-medium mb-2">Seasonal Volatility + Economic Uncertainty</h4>
                    <p className="text-sm text-muted-foreground">
                      Economic instability could amplify seasonal performance issues, 
                      requiring more robust forecasting and flexible strategies.
                    </p>
                    <Badge className="bg-orange-100 text-orange-700 mt-2">Medium Priority</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strategic Positioning Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Strategic Position Summary</CardTitle>
              <CardDescription>Overall strategic assessment and positioning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-green-600">Competitive Advantages</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Performance Efficiency</span>
                      <div className="flex items-center gap-2">
                        <Progress value={85} className="w-24 h-2" />
                        <span className="text-green-600">Strong</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Creative Quality</span>
                      <div className="flex items-center gap-2">
                        <Progress value={78} className="w-24 h-2" />
                        <span className="text-green-600">Good</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Platform Diversification</span>
                      <div className="flex items-center gap-2">
                        <Progress value={72} className="w-24 h-2" />
                        <span className="text-blue-600">Average</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-red-600">Areas for Improvement</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Mobile Experience</span>
                      <div className="flex items-center gap-2">
                        <Progress value={35} className="w-24 h-2" />
                        <span className="text-red-600">Needs Work</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Cost Efficiency</span>
                      <div className="flex items-center gap-2">
                        <Progress value={45} className="w-24 h-2" />
                        <span className="text-orange-600">Below Average</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Automation Adoption</span>
                      <div className="flex items-center gap-2">
                        <Progress value={28} className="w-24 h-2" />
                        <span className="text-red-600">Low</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Strategic Action Plan</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Plan
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Action
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {strategicRecommendations
              .sort((a, b) => a.priority - b.priority)
              .map(rec => (
                <Card key={rec.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-blue-600">#{rec.priority}</span>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{rec.title}</h3>
                            <Badge variant="outline" className="capitalize mt-1">
                              {rec.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600">{rec.estimatedImpact}</div>
                            <div className="text-xs text-muted-foreground">{rec.timeframe}</div>
                          </div>
                        </div>

                        <p className="text-sm leading-relaxed">{rec.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Required Resources:</h4>
                            <ul className="space-y-1">
                              {rec.resources.map((resource, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                  <span>{resource}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Related SWOT Items:</h4>
                            <div className="flex flex-wrap gap-1">
                              {rec.relatedSWOT.map(swotId => {
                                const item = swotItems.find(i => i.id === swotId)
                                return item ? (
                                  <Badge key={swotId} variant="outline" className="text-xs capitalize">
                                    {item.category}: {item.title.split(' ').slice(0, 2).join(' ')}
                                  </Badge>
                                ) : null
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Timeline: {rec.timeframe}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                            <Button size="sm">
                              Start Implementation
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                Implementation Success Factors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Critical Success Factors:</h4>
                  <ul className="space-y-1">
                    <li>• Executive buy-in for strategic initiatives</li>
                    <li>• Cross-functional team collaboration</li>
                    <li>• Adequate budget allocation</li>
                    <li>• Regular progress monitoring</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Risk Mitigation:</h4>
                  <ul className="space-y-1">
                    <li>• Pilot testing before full rollout</li>
                    <li>• Backup plans for critical initiatives</li>
                    <li>• Regular competitive monitoring</li>
                    <li>• Flexible resource reallocation</li>
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