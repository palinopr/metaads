"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts'
import { 
  Search, Eye, Target, Zap, TrendingUp, TrendingDown, 
  Globe, Users, Calendar, Clock, AlertCircle, CheckCircle,
  Database, RefreshCw, Filter, Download, Share, BarChart3,
  Activity, Lightbulb, Shield, Crosshair, Brain
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface CompetitiveIntelligenceProps {
  industry: string
}

interface CompetitorIntel {
  id: string
  name: string
  domain: string
  industry: string
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
  metrics: {
    monthlyVisitors: number
    adSpend: number
    activeAds: number
    avgCPC: number
    estimatedCTR: number
    topKeywords: string[]
    adNetworks: string[]
    geoTargeting: string[]
  }
  adCreatives: {
    totalAds: number
    videoAds: number
    imageAds: number
    textAds: number
    avgAdAge: number
    topPerformingFormats: string[]
  }
  strategy: {
    primaryObjective: string
    targetAudience: string
    seasonality: boolean
    aggressiveness: 'low' | 'medium' | 'high'
    innovation: 'low' | 'medium' | 'high'
  }
  trends: {
    spendTrend: number
    volumeTrend: number
    performanceTrend: number
    threatLevel: 'low' | 'medium' | 'high' | 'critical'
  }
  lastUpdated: Date
}

export function CompetitiveIntelligence({ industry }: CompetitiveIntelligenceProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Mock competitive intelligence data
  const competitorIntel: CompetitorIntel[] = [
    {
      id: 'intel-1',
      name: 'TechDominance Corp',
      domain: 'techdominance.com',
      industry: 'Technology',
      size: 'large',
      metrics: {
        monthlyVisitors: 8500000,
        adSpend: 2400000,
        activeAds: 342,
        avgCPC: 2.15,
        estimatedCTR: 3.2,
        topKeywords: ['cloud software', 'enterprise solutions', 'digital transformation'],
        adNetworks: ['Google Ads', 'Microsoft Ads', 'Facebook Ads', 'LinkedIn Ads'],
        geoTargeting: ['United States', 'Canada', 'United Kingdom', 'Australia']
      },
      adCreatives: {
        totalAds: 342,
        videoAds: 89,
        imageAds: 167,
        textAds: 86,
        avgAdAge: 28,
        topPerformingFormats: ['Single Image', 'Video', 'Carousel']
      },
      strategy: {
        primaryObjective: 'Lead Generation',
        targetAudience: 'Enterprise Decision Makers',
        seasonality: true,
        aggressiveness: 'high',
        innovation: 'high'
      },
      trends: {
        spendTrend: 15.3,
        volumeTrend: 22.7,
        performanceTrend: 8.4,
        threatLevel: 'high'
      },
      lastUpdated: new Date()
    },
    {
      id: 'intel-2',
      name: 'MarketChallenger Inc',
      domain: 'marketchallenger.com',
      industry: 'E-commerce',
      size: 'medium',
      metrics: {
        monthlyVisitors: 3200000,
        adSpend: 890000,
        activeAds: 156,
        avgCPC: 1.75,
        estimatedCTR: 2.8,
        topKeywords: ['online shopping', 'deals', 'fast delivery'],
        adNetworks: ['Google Ads', 'Facebook Ads', 'TikTok Ads'],
        geoTargeting: ['United States', 'Canada']
      },
      adCreatives: {
        totalAds: 156,
        videoAds: 67,
        imageAds: 72,
        textAds: 17,
        avgAdAge: 18,
        topPerformingFormats: ['Video', 'Single Image', 'Collection']
      },
      strategy: {
        primaryObjective: 'Sales Conversion',
        targetAudience: 'Millennial Consumers',
        seasonality: true,
        aggressiveness: 'high',
        innovation: 'medium'
      },
      trends: {
        spendTrend: 28.9,
        volumeTrend: 34.2,
        performanceTrend: 12.1,
        threatLevel: 'critical'
      },
      lastUpdated: new Date()
    },
    {
      id: 'intel-3',
      name: 'EstablishedPlayer LLC',
      domain: 'established.com',
      industry: 'Financial Services',
      size: 'large',
      metrics: {
        monthlyVisitors: 5600000,
        adSpend: 1650000,
        activeAds: 234,
        avgCPC: 3.45,
        estimatedCTR: 1.9,
        topKeywords: ['financial planning', 'investment', 'retirement'],
        adNetworks: ['Google Ads', 'Microsoft Ads', 'LinkedIn Ads'],
        geoTargeting: ['United States', 'United Kingdom', 'Canada']
      },
      adCreatives: {
        totalAds: 234,
        videoAds: 45,
        imageAds: 134,
        textAds: 55,
        avgAdAge: 45,
        topPerformingFormats: ['Single Image', 'Text', 'Video']
      },
      strategy: {
        primaryObjective: 'Brand Awareness',
        targetAudience: 'High-Income Professionals',
        seasonality: false,
        aggressiveness: 'medium',
        innovation: 'low'
      },
      trends: {
        spendTrend: -2.1,
        volumeTrend: 5.8,
        performanceTrend: -1.2,
        threatLevel: 'low'
      },
      lastUpdated: new Date()
    }
  ]

  const getThreatLevelBadge = (level: string) => {
    switch (level) {
      case 'low': return <Badge className="bg-green-100 text-green-700">Low Threat</Badge>
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-700">Medium Threat</Badge>
      case 'high': return <Badge className="bg-orange-100 text-orange-700">High Threat</Badge>
      case 'critical': return <Badge className="bg-red-100 text-red-700">Critical Threat</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getSizeIcon = (size: string) => {
    switch (size) {
      case 'startup': return <div className="w-2 h-2 bg-gray-400 rounded-full" />
      case 'small': return <div className="w-3 h-3 bg-blue-400 rounded-full" />
      case 'medium': return <div className="w-4 h-4 bg-yellow-400 rounded-full" />
      case 'large': return <div className="w-5 h-5 bg-orange-400 rounded-full" />
      case 'enterprise': return <div className="w-6 h-6 bg-red-400 rounded-full" />
      default: return <div className="w-3 h-3 bg-gray-400 rounded-full" />
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setRefreshing(false)
  }

  const filteredCompetitors = competitorIntel.filter(comp =>
    comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comp.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comp.industry.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedCompetitorData = selectedCompetitor 
    ? competitorIntel.find(c => c.id === selectedCompetitor)
    : null

  const marketIntelligenceData = [
    { month: 'Jan', avgCPC: 1.85, avgCTR: 2.3, totalSpend: 4200000 },
    { month: 'Feb', avgCPC: 1.92, avgCTR: 2.4, totalSpend: 4550000 },
    { month: 'Mar', avgCPC: 2.05, avgCTR: 2.2, totalSpend: 4890000 },
    { month: 'Apr', avgCPC: 2.18, avgCTR: 2.5, totalSpend: 5120000 },
    { month: 'May', avgCPC: 2.31, avgCTR: 2.6, totalSpend: 5340000 },
    { month: 'Jun', avgCPC: 2.28, avgCTR: 2.7, totalSpend: 5580000 }
  ]

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Competitive Intelligence
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of competitor strategies and market positioning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search competitors by name, domain, or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
            >
              {refreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Data
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredCompetitors.length}</div>
              <div className="text-sm text-muted-foreground">Tracked Competitors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredCompetitors.reduce((sum, c) => sum + c.metrics.activeAds, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Active Ads Monitored</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(filteredCompetitors.reduce((sum, c) => sum + c.metrics.adSpend, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Combined Monthly Spend</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredCompetitors.filter(c => c.trends.threatLevel === 'high' || c.trends.threatLevel === 'critical').length}
              </div>
              <div className="text-sm text-muted-foreground">High-Threat Competitors</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="threats">Threat Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competitor Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Key Competitors</CardTitle>
                <CardDescription>Overview of main competitive threats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCompetitors.map(competitor => (
                    <div 
                      key={competitor.id} 
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setSelectedCompetitor(competitor.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getSizeIcon(competitor.size)}
                          <div>
                            <h3 className="font-semibold">{competitor.name}</h3>
                            <p className="text-sm text-muted-foreground">{competitor.domain}</p>
                          </div>
                        </div>
                        {getThreatLevelBadge(competitor.trends.threatLevel)}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Monthly Spend:</span>
                          <span className="ml-2 font-medium">{formatCurrency(competitor.metrics.adSpend)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Active Ads:</span>
                          <span className="ml-2 font-medium">{competitor.metrics.activeAds}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg CPC:</span>
                          <span className="ml-2 font-medium">{formatCurrency(competitor.metrics.avgCPC)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Est. CTR:</span>
                          <span className="ml-2 font-medium">{competitor.metrics.estimatedCTR.toFixed(1)}%</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Spend Trend:</span>
                          <div className="flex items-center gap-1">
                            {competitor.trends.spendTrend > 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span className={competitor.trends.spendTrend > 0 ? 'text-green-600' : 'text-red-600'}>
                              {competitor.trends.spendTrend > 0 ? '+' : ''}{competitor.trends.spendTrend.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Market Intelligence Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Market Intelligence Trends</CardTitle>
                <CardDescription>Aggregate market data and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={marketIntelligenceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'totalSpend' ? formatCurrency(value as number) : 
                        name === 'avgCPC' ? formatCurrency(value as number) :
                        `${value}%`,
                        name === 'avgCPC' ? 'Avg CPC' :
                        name === 'avgCTR' ? 'Avg CTR' : 'Total Spend'
                      ]}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="avgCPC" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Avg CPC"
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="avgCTR" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Avg CTR"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          {selectedCompetitorData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Detailed Analysis: {selectedCompetitorData.name}
                </CardTitle>
                <CardDescription>
                  Comprehensive competitive intelligence for {selectedCompetitorData.domain}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Traffic & Spend Metrics */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Traffic & Advertising Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded p-3">
                        <div className="text-sm text-muted-foreground">Monthly Visitors</div>
                        <div className="text-lg font-bold">{selectedCompetitorData.metrics.monthlyVisitors.toLocaleString()}</div>
                      </div>
                      <div className="border rounded p-3">
                        <div className="text-sm text-muted-foreground">Monthly Ad Spend</div>
                        <div className="text-lg font-bold">{formatCurrency(selectedCompetitorData.metrics.adSpend)}</div>
                      </div>
                      <div className="border rounded p-3">
                        <div className="text-sm text-muted-foreground">Active Ads</div>
                        <div className="text-lg font-bold">{selectedCompetitorData.metrics.activeAds}</div>
                      </div>
                      <div className="border rounded p-3">
                        <div className="text-sm text-muted-foreground">Average CPC</div>
                        <div className="text-lg font-bold">{formatCurrency(selectedCompetitorData.metrics.avgCPC)}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Top Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCompetitorData.metrics.topKeywords.map((keyword, idx) => (
                          <Badge key={idx} variant="outline">{keyword}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Ad Networks</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCompetitorData.metrics.adNetworks.map((network, idx) => (
                          <Badge key={idx} variant="secondary">{network}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Creative Analysis */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Creative Strategy</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded p-3">
                        <div className="text-sm text-muted-foreground">Total Ads</div>
                        <div className="text-lg font-bold">{selectedCompetitorData.adCreatives.totalAds}</div>
                      </div>
                      <div className="border rounded p-3">
                        <div className="text-sm text-muted-foreground">Video Ads</div>
                        <div className="text-lg font-bold">{selectedCompetitorData.adCreatives.videoAds}</div>
                      </div>
                      <div className="border rounded p-3">
                        <div className="text-sm text-muted-foreground">Image Ads</div>
                        <div className="text-lg font-bold">{selectedCompetitorData.adCreatives.imageAds}</div>
                      </div>
                      <div className="border rounded p-3">
                        <div className="text-sm text-muted-foreground">Avg Ad Age</div>
                        <div className="text-lg font-bold">{selectedCompetitorData.adCreatives.avgAdAge} days</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Top Performing Formats</h4>
                      <div className="space-y-2">
                        {selectedCompetitorData.adCreatives.topPerformingFormats.map((format, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm">{format}</span>
                            <Progress value={(3 - idx) * 30} className="w-24 h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-lg mb-4">Strategy Assessment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded p-4">
                      <h4 className="font-medium mb-2">Primary Objective</h4>
                      <Badge className="mb-2">{selectedCompetitorData.strategy.primaryObjective}</Badge>
                      <p className="text-sm text-muted-foreground">
                        Target: {selectedCompetitorData.strategy.targetAudience}
                      </p>
                    </div>
                    <div className="border rounded p-4">
                      <h4 className="font-medium mb-2">Aggressiveness</h4>
                      <Badge 
                        className={
                          selectedCompetitorData.strategy.aggressiveness === 'high' ? 'bg-red-100 text-red-700' :
                          selectedCompetitorData.strategy.aggressiveness === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }
                      >
                        {selectedCompetitorData.strategy.aggressiveness} aggressiveness
                      </Badge>
                    </div>
                    <div className="border rounded p-4">
                      <h4 className="font-medium mb-2">Innovation Level</h4>
                      <Badge 
                        className={
                          selectedCompetitorData.strategy.innovation === 'high' ? 'bg-purple-100 text-purple-700' :
                          selectedCompetitorData.strategy.innovation === 'medium' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }
                      >
                        {selectedCompetitorData.strategy.innovation} innovation
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Competitor</h3>
                <p className="text-muted-foreground">
                  Choose a competitor from the overview tab to see detailed analysis
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Patterns</CardTitle>
                <CardDescription>Common competitive strategies identified</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-yellow-600" />
                      <h4 className="font-medium">Aggressive Growth Strategy</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      High ad spend increases with focus on market share capture
                    </p>
                    <div className="text-sm">
                      <strong>Companies:</strong> TechDominance Corp, MarketChallenger Inc
                    </div>
                  </div>

                  <div className="border rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium">Defensive Positioning</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Steady spend with focus on brand protection and retention
                    </p>
                    <div className="text-sm">
                      <strong>Companies:</strong> EstablishedPlayer LLC
                    </div>
                  </div>

                  <div className="border rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Crosshair className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium">Niche Focus</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Targeted campaigns in specific market segments
                    </p>
                    <div className="text-sm">
                      <strong>Opportunity:</strong> Underserved segments available
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Strategic Insights</CardTitle>
                <CardDescription>Key learnings from competitive analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Opportunity:</strong> Video ad adoption is lower than expected. 
                      Early movers in video content could gain competitive advantage.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Threat:</strong> CPC inflation of 12% over 6 months indicates 
                      increasing competition for premium ad placements.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Insight:</strong> Mobile-first creative strategies show 
                      23% better performance than desktop-optimized campaigns.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-3">Recommended Actions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Increase video ad investment by 30%</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Test mobile-first creative formats</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Monitor MarketChallenger's aggressive expansion</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Explore underserved niche segments</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">High Priority Threats</CardTitle>
                <CardDescription>Competitors requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCompetitors
                    .filter(c => c.trends.threatLevel === 'critical' || c.trends.threatLevel === 'high')
                    .map(competitor => (
                      <div key={competitor.id} className="border-l-4 border-red-500 pl-4 p-3 bg-red-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{competitor.name}</h4>
                          {getThreatLevelBadge(competitor.trends.threatLevel)}
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Spend Growth:</span>
                            <span className="font-medium text-red-600">+{competitor.trends.spendTrend.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Volume Growth:</span>
                            <span className="font-medium text-red-600">+{competitor.trends.volumeTrend.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Performance Trend:</span>
                            <span className="font-medium text-green-600">+{competitor.trends.performanceTrend.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-red-200">
                          <p className="text-xs text-red-700">
                            <strong>Risk:</strong> Rapid expansion could capture significant market share
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Threat Assessment Matrix</CardTitle>
                <CardDescription>Comprehensive threat evaluation across all competitors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCompetitors.map(competitor => {
                    const threatScore = 
                      (competitor.trends.spendTrend > 20 ? 3 : competitor.trends.spendTrend > 10 ? 2 : 1) +
                      (competitor.trends.volumeTrend > 25 ? 3 : competitor.trends.volumeTrend > 15 ? 2 : 1) +
                      (competitor.trends.performanceTrend > 10 ? 3 : competitor.trends.performanceTrend > 5 ? 2 : 1)
                    
                    return (
                      <div key={competitor.id} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{competitor.name}</h4>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                              Threat Score: {threatScore}/9
                            </div>
                            <Progress value={(threatScore / 9) * 100} className="w-16 h-2" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="text-muted-foreground">Spend</div>
                            <div className={`font-medium ${competitor.trends.spendTrend > 20 ? 'text-red-600' : competitor.trends.spendTrend > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {competitor.trends.spendTrend > 0 ? '+' : ''}{competitor.trends.spendTrend.toFixed(1)}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground">Volume</div>
                            <div className={`font-medium ${competitor.trends.volumeTrend > 25 ? 'text-red-600' : competitor.trends.volumeTrend > 15 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {competitor.trends.volumeTrend > 0 ? '+' : ''}{competitor.trends.volumeTrend.toFixed(1)}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground">Performance</div>
                            <div className={`font-medium ${competitor.trends.performanceTrend > 10 ? 'text-red-600' : competitor.trends.performanceTrend > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {competitor.trends.performanceTrend > 0 ? '+' : ''}{competitor.trends.performanceTrend.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}