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
  ScatterChart, Scatter, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts'
import { 
  Target, Lightbulb, TrendingUp, Zap, Eye, Users, Globe,
  Calendar, DollarSign, ArrowUpRight, Star, Filter, Search,
  Brain, Rocket, CheckCircle, AlertTriangle, Clock, BarChart3
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface MarketOpportunityIdentificationProps {
  industry: string
  totalSpend: number
  totalRevenue: number
}

interface MarketOpportunity {
  id: string
  name: string
  category: 'platform' | 'audience' | 'geographic' | 'product' | 'technology' | 'seasonal'
  description: string
  marketSize: number
  growthRate: number
  competitionLevel: 'low' | 'medium' | 'high'
  difficultyScore: number
  opportunityScore: number
  timeToMarket: string
  investmentRequired: number
  estimatedROI: number
  keyMetrics: {
    audience: number
    cac: number
    ltv: number
    penetration: number
  }
  barriers: string[]
  advantages: string[]
  nextSteps: string[]
  timeline: { phase: string; duration: string; milestone: string }[]
}

interface CompetitiveGap {
  id: string
  area: string
  description: string
  gapSize: number
  difficulty: number
  timeToCapture: string
  requiredInvestment: number
  competitors: string[]
  advantages: string[]
}

export function MarketOpportunityIdentification({ industry, totalSpend, totalRevenue }: MarketOpportunityIdentificationProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('score')

  // Mock market opportunities data
  const marketOpportunities: MarketOpportunity[] = [
    {
      id: 'opp-1',
      name: 'TikTok Advertising Expansion',
      category: 'platform',
      description: 'Untapped potential in TikTok advertising with 67% lower CPC than established platforms and rapidly growing user base in target demographics.',
      marketSize: 2400000,
      growthRate: 127,
      competitionLevel: 'low',
      difficultyScore: 25,
      opportunityScore: 94,
      timeToMarket: '2-3 months',
      investmentRequired: 45000,
      estimatedROI: 340,
      keyMetrics: {
        audience: 850000,
        cac: 28,
        ltv: 185,
        penetration: 3.2
      },
      barriers: [
        'Learning curve for platform-specific content',
        'Different audience behavior patterns',
        'Limited historical data for optimization'
      ],
      advantages: [
        'Low competition from established players',
        'High organic reach potential',
        'Advanced targeting capabilities',
        'Strong video content capabilities'
      ],
      nextSteps: [
        'Set up TikTok business account and pixel',
        'Create 3-5 test video creatives',
        'Launch pilot campaign with $5K budget',
        'Analyze performance and scale successful ads'
      ],
      timeline: [
        { phase: 'Setup & Planning', duration: '2 weeks', milestone: 'Account setup and creative production' },
        { phase: 'Pilot Campaign', duration: '4 weeks', milestone: '3 ad variations tested with initial optimization' },
        { phase: 'Scale & Optimize', duration: '6 weeks', milestone: 'Successful campaigns scaled to full budget' }
      ]
    },
    {
      id: 'opp-2',
      name: 'AI-Powered Personalization',
      category: 'technology',
      description: 'Implementation of advanced AI personalization technology to deliver dynamic, personalized ad experiences resulting in 45% higher conversion rates.',
      marketSize: 1800000,
      growthRate: 89,
      competitionLevel: 'medium',
      difficultyScore: 65,
      opportunityScore: 87,
      timeToMarket: '4-6 months',
      investmentRequired: 125000,
      estimatedROI: 285,
      keyMetrics: {
        audience: 650000,
        cac: 42,
        ltv: 240,
        penetration: 12.8
      },
      barriers: [
        'High initial technology investment',
        'Need for data science expertise',
        'Integration complexity with existing systems',
        'Privacy compliance requirements'
      ],
      advantages: [
        'Significant competitive differentiation',
        'Scalable across all campaigns',
        'Improves with more data over time',
        'Multiple revenue optimization opportunities'
      ],
      nextSteps: [
        'Evaluate AI personalization platforms',
        'Pilot test with subset of campaigns',
        'Integrate with existing data sources',
        'Train team on new optimization strategies'
      ],
      timeline: [
        { phase: 'Technology Selection', duration: '3 weeks', milestone: 'Platform selected and contracts signed' },
        { phase: 'Integration & Setup', duration: '8 weeks', milestone: 'Full integration with existing systems' },
        { phase: 'Testing & Optimization', duration: '6 weeks', milestone: 'Proven performance improvement across campaigns' }
      ]
    },
    {
      id: 'opp-3',
      name: 'Connected TV (CTV) Advertising',
      category: 'platform',
      description: 'Expansion into Connected TV advertising to reach cord-cutting demographics with premium video content and advanced targeting capabilities.',
      marketSize: 3200000,
      growthRate: 156,
      competitionLevel: 'medium',
      difficultyScore: 45,
      opportunityScore: 82,
      timeToMarket: '3-4 months',
      investmentRequired: 85000,
      estimatedROI: 225,
      keyMetrics: {
        audience: 1200000,
        cac: 65,
        ltv: 320,
        penetration: 8.4
      },
      barriers: [
        'Higher creative production costs',
        'Limited attribution compared to digital',
        'Minimum spend requirements',
        'Complex buying process'
      ],
      advantages: [
        'Premium brand positioning',
        'Less ad fatigue than digital platforms',
        'High-quality audience engagement',
        'Complementary to existing digital strategy'
      ],
      nextSteps: [
        'Partner with CTV platform or agency',
        'Develop video creative for TV format',
        'Set up attribution and measurement',
        'Launch pilot campaigns in key markets'
      ],
      timeline: [
        { phase: 'Partnership & Planning', duration: '4 weeks', milestone: 'Platform partnerships established' },
        { phase: 'Creative Development', duration: '3 weeks', milestone: 'TV-format video creatives produced' },
        { phase: 'Campaign Launch', duration: '6 weeks', milestone: 'Full campaign deployment and optimization' }
      ]
    },
    {
      id: 'opp-4',
      name: 'Gen Z Audience Expansion',
      category: 'audience',
      description: 'Targeting Gen Z consumers (18-25) who show 89% higher engagement rates but represent only 12% of current audience reach.',
      marketSize: 1600000,
      growthRate: 78,
      competitionLevel: 'high',
      difficultyScore: 55,
      opportunityScore: 76,
      timeToMarket: '2-3 months',
      investmentRequired: 35000,
      estimatedROI: 195,
      keyMetrics: {
        audience: 420000,
        cac: 35,
        ltv: 165,
        penetration: 12.1
      },
      barriers: [
        'Different communication preferences',
        'Platform fragmentation',
        'Higher churn rates',
        'Price sensitivity'
      ],
      advantages: [
        'High lifetime value potential',
        'Strong social sharing behavior',
        'Early adopter characteristics',
        'Mobile-first behavior aligns with strategy'
      ],
      nextSteps: [
        'Research Gen Z media consumption patterns',
        'Develop age-appropriate messaging and creative',
        'Test campaigns on platforms popular with Gen Z',
        'Implement attribution for longer customer journeys'
      ],
      timeline: [
        { phase: 'Research & Strategy', duration: '3 weeks', milestone: 'Gen Z marketing strategy developed' },
        { phase: 'Creative Development', duration: '2 weeks', milestone: 'Age-appropriate creative assets produced' },
        { phase: 'Campaign Testing', duration: '8 weeks', milestone: 'Optimized campaigns across key platforms' }
      ]
    },
    {
      id: 'opp-5',
      name: 'International Market Entry',
      category: 'geographic',
      description: 'Expansion into Canadian and UK markets where competition is 34% lower and similar customer profiles show strong demand indicators.',
      marketSize: 5600000,
      growthRate: 43,
      competitionLevel: 'medium',
      difficultyScore: 75,
      opportunityScore: 71,
      timeToMarket: '6-9 months',
      investmentRequired: 195000,
      estimatedROI: 165,
      keyMetrics: {
        audience: 2100000,
        cac: 52,
        ltv: 195,
        penetration: 2.8
      },
      barriers: [
        'Regulatory compliance requirements',
        'Currency exchange considerations',
        'Local market knowledge needed',
        'Different consumer behavior patterns'
      ],
      advantages: [
        'Large untapped market size',
        'Similar language and culture (English markets)',
        'Established advertising platforms available',
        'Strong economic indicators'
      ],
      nextSteps: [
        'Conduct market research in target countries',
        'Establish legal and tax compliance',
        'Localize advertising creative and messaging',
        'Set up region-specific tracking and attribution'
      ],
      timeline: [
        { phase: 'Market Research', duration: '4 weeks', milestone: 'Market opportunity validated' },
        { phase: 'Legal & Compliance', duration: '8 weeks', milestone: 'Legal framework established' },
        { phase: 'Campaign Launch', duration: '12 weeks', milestone: 'Full market entry with localized campaigns' }
      ]
    }
  ]

  const competitiveGaps: CompetitiveGap[] = [
    {
      id: 'gap-1',
      area: 'Mobile Video Creative',
      description: 'Competitors are underutilizing mobile-optimized video formats, creating opportunity for 40% higher engagement rates.',
      gapSize: 67,
      difficulty: 25,
      timeToCapture: '1-2 months',
      requiredInvestment: 25000,
      competitors: ['TechLeader Corp', 'EstablishedBrand LLC'],
      advantages: ['Existing video production capabilities', 'Mobile-first strategy alignment']
    },
    {
      id: 'gap-2',
      area: 'Voice Search Optimization',
      description: 'Voice search advertising is largely ignored by competitors despite 23% year-over-year growth in voice commerce.',
      gapSize: 84,
      difficulty: 55,
      timeToCapture: '3-4 months',
      requiredInvestment: 45000,
      competitors: ['MarketChallenger Inc', 'ValueBrand Solutions'],
      advantages: ['Technical infrastructure', 'Early mover advantage potential']
    },
    {
      id: 'gap-3',
      area: 'Micro-Influencer Partnerships',
      description: 'Systematic micro-influencer campaign approach could capture audience engagement that competitors are missing.',
      gapSize: 56,
      difficulty: 35,
      timeToCapture: '2-3 months',
      requiredInvestment: 35000,
      competitors: ['All major competitors'],
      advantages: ['Community-building focus', 'Authentic engagement approach']
    }
  ]

  const getOpportunityColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-700 border-green-200'
    if (score >= 70) return 'bg-blue-100 text-blue-700 border-blue-200'
    if (score >= 55) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'high': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'platform': return <Globe className="h-4 w-4" />
      case 'audience': return <Users className="h-4 w-4" />
      case 'geographic': return <Target className="h-4 w-4" />
      case 'product': return <Rocket className="h-4 w-4" />
      case 'technology': return <Brain className="h-4 w-4" />
      case 'seasonal': return <Calendar className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  const filteredOpportunities = marketOpportunities.filter(opp => 
    filterCategory === 'all' || opp.category === filterCategory
  ).sort((a, b) => {
    switch (sortBy) {
      case 'score': return b.opportunityScore - a.opportunityScore
      case 'roi': return b.estimatedROI - a.estimatedROI
      case 'market-size': return b.marketSize - a.marketSize
      case 'growth': return b.growthRate - a.growthRate
      default: return 0
    }
  })

  const selectedOpportunityData = selectedOpportunity 
    ? marketOpportunities.find(opp => opp.id === selectedOpportunity)
    : null

  // Create bubble chart data for opportunity mapping
  const bubbleData = marketOpportunities.map(opp => ({
    x: opp.difficultyScore,
    y: opp.opportunityScore,
    z: opp.marketSize / 100000, // Scale for bubble size
    name: opp.name,
    category: opp.category,
    roi: opp.estimatedROI
  }))

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Market Opportunity Identification
          </CardTitle>
          <CardDescription>
            Discover and evaluate untapped market opportunities for strategic growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="platform">Platform</SelectItem>
                <SelectItem value="audience">Audience</SelectItem>
                <SelectItem value="geographic">Geographic</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="seasonal">Seasonal</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Opportunity Score</SelectItem>
                <SelectItem value="roi">Estimated ROI</SelectItem>
                <SelectItem value="market-size">Market Size</SelectItem>
                <SelectItem value="growth">Growth Rate</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{marketOpportunities.length}</div>
              <div className="text-sm text-muted-foreground">Identified Opportunities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(marketOpportunities.reduce((sum, opp) => sum + opp.marketSize, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Total Market Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {marketOpportunities.filter(opp => opp.opportunityScore >= 80).length}
              </div>
              <div className="text-sm text-muted-foreground">High-Potential Opportunities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(marketOpportunities.reduce((sum, opp) => sum + opp.estimatedROI, 0) / marketOpportunities.length).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Average Est. ROI</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="opportunities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="mapping">Opportunity Map</TabsTrigger>
          <TabsTrigger value="gaps">Competitive Gaps</TabsTrigger>
          <TabsTrigger value="prioritization">Prioritization</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Opportunity List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Market Opportunities</h3>
              {filteredOpportunities.map(opportunity => (
                <Card 
                  key={opportunity.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedOpportunity === opportunity.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedOpportunity(opportunity.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(opportunity.category)}
                        <div>
                          <h4 className="font-medium">{opportunity.name}</h4>
                          <Badge variant="outline" className="capitalize mt-1">
                            {opportunity.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getOpportunityColor(opportunity.opportunityScore)}>
                          {opportunity.opportunityScore}/100
                        </Badge>
                        <Badge className={getCompetitionColor(opportunity.competitionLevel)}>
                          {opportunity.competitionLevel} competition
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {opportunity.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Market Size:</span>
                        <span className="ml-2 font-medium">{formatCurrency(opportunity.marketSize)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Growth Rate:</span>
                        <span className="ml-2 font-medium text-green-600">+{opportunity.growthRate}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Est. ROI:</span>
                        <span className="ml-2 font-medium text-blue-600">{opportunity.estimatedROI}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Time to Market:</span>
                        <span className="ml-2 font-medium">{opportunity.timeToMarket}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Investment: {formatCurrency(opportunity.investmentRequired)}
                        </span>
                        <span className="text-muted-foreground">
                          Difficulty: {opportunity.difficultyScore}/100
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Opportunity Detail */}
            {selectedOpportunityData ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Opportunity Analysis: {selectedOpportunityData.name}</h3>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedOpportunityData.keyMetrics.audience.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Target Audience</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(selectedOpportunityData.keyMetrics.cac)}
                        </div>
                        <div className="text-sm text-muted-foreground">Est. CAC</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatCurrency(selectedOpportunityData.keyMetrics.ltv)}
                        </div>
                        <div className="text-sm text-muted-foreground">Est. LTV</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedOpportunityData.keyMetrics.penetration.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Market Penetration</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Implementation Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedOpportunityData.timeline.map((phase, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-blue-600">{idx + 1}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{phase.phase}</h4>
                            <p className="text-sm text-muted-foreground">{phase.milestone}</p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {phase.duration}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base text-green-600">Advantages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedOpportunityData.advantages.map((advantage, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{advantage}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base text-orange-600">Barriers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedOpportunityData.barriers.map((barrier, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span>{barrier}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedOpportunityData.nextSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-blue-600">{idx + 1}</span>
                          </div>
                          <span className="text-sm">{step}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select an Opportunity</h3>
                  <p className="text-muted-foreground">
                    Click on any opportunity to see detailed analysis and implementation plan
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="mapping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Opportunity Mapping Matrix</CardTitle>
              <CardDescription>
                Opportunities plotted by difficulty vs potential score (bubble size = market size)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={bubbleData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Difficulty Score" 
                    domain={[0, 100]}
                    label={{ value: 'Difficulty Score (0 = Easy, 100 = Hard)', position: 'bottom' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Opportunity Score" 
                    domain={[0, 100]}
                    label={{ value: 'Opportunity Score', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      name === 'z' ? `$${(value as number * 100000).toLocaleString()}` :
                      name === 'roi' ? `${value}%` : value,
                      name === 'x' ? 'Difficulty' :
                      name === 'y' ? 'Opportunity Score' :
                      name === 'z' ? 'Market Size' :
                      name === 'roi' ? 'Est. ROI' : name
                    ]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.name || ''}
                  />
                  <Scatter dataKey="z" fill="#3b82f6" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <Alert>
                  <Star className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Sweet Spot:</strong> Top-left quadrant shows high opportunity, low difficulty - 
                    these are your prime targets for immediate action.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Long-term:</strong> Top-right quadrant represents high-value opportunities 
                    that require significant investment and planning.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Gap Analysis</CardTitle>
              <CardDescription>
                Market gaps where competitors are underperforming or absent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitiveGaps.map(gap => (
                  <Card key={gap.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{gap.area}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{gap.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{gap.gapSize}%</div>
                          <div className="text-xs text-muted-foreground">Gap Size</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Difficulty:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={gap.difficulty} className="flex-1 h-2" />
                            <span className="text-sm font-medium">{gap.difficulty}/100</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Investment:</span>
                          <div className="text-sm font-medium mt-1">{formatCurrency(gap.requiredInvestment)}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Time to Capture:</span>
                          <div className="text-sm font-medium mt-1">{gap.timeToCapture}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Underperforming Competitors:</h4>
                          <div className="flex flex-wrap gap-1">
                            {gap.competitors.map(competitor => (
                              <Badge key={competitor} variant="outline" className="text-xs">
                                {competitor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Your Advantages:</h4>
                          <ul className="space-y-1">
                            {gap.advantages.map((advantage, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-xs">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span>{advantage}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prioritization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Opportunity Prioritization Framework</CardTitle>
              <CardDescription>
                Strategic ranking based on multiple factors including ROI, feasibility, and strategic alignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketOpportunities
                  .sort((a, b) => {
                    // Weighted scoring: 40% opportunity score, 30% ROI, 20% inverse difficulty, 10% market size
                    const scoreA = (a.opportunityScore * 0.4) + (a.estimatedROI / 10 * 0.3) + ((100 - a.difficultyScore) * 0.2) + (a.marketSize / 100000 * 0.1)
                    const scoreB = (b.opportunityScore * 0.4) + (b.estimatedROI / 10 * 0.3) + ((100 - b.difficultyScore) * 0.2) + (b.marketSize / 100000 * 0.1)
                    return scoreB - scoreA
                  })
                  .map((opportunity, index) => (
                    <Card key={opportunity.id} className={`${index < 3 ? 'border-l-4 border-l-green-500' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold">{opportunity.name}</h3>
                              {index < 3 && (
                                <Badge className="bg-green-100 text-green-700">
                                  Priority
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">ROI:</span>
                                <span className="ml-2 font-medium text-green-600">{opportunity.estimatedROI}%</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Score:</span>
                                <span className="ml-2 font-medium">{opportunity.opportunityScore}/100</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Difficulty:</span>
                                <span className="ml-2 font-medium">{opportunity.difficultyScore}/100</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Investment:</span>
                                <span className="ml-2 font-medium">{formatCurrency(opportunity.investmentRequired)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Wins (0-3 months)</CardTitle>
                <CardDescription>Low difficulty, high impact opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketOpportunities
                    .filter(opp => opp.difficultyScore <= 40 && opp.opportunityScore >= 70)
                    .map(opp => (
                      <div key={opp.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <h4 className="font-medium">{opp.name}</h4>
                          <p className="text-sm text-muted-foreground">{opp.timeToMarket}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700">
                          {opp.estimatedROI}% ROI
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Strategic Investments (6+ months)</CardTitle>
                <CardDescription>High difficulty, high reward opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketOpportunities
                    .filter(opp => opp.difficultyScore >= 60 && opp.opportunityScore >= 80)
                    .map(opp => (
                      <div key={opp.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <h4 className="font-medium">{opp.name}</h4>
                          <p className="text-sm text-muted-foreground">{opp.timeToMarket}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700">
                          {formatCurrency(opp.marketSize)} market
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}