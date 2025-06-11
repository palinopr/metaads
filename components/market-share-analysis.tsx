"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts'
import { 
  PieChart as PieChartIcon, BarChart3, TrendingUp, TrendingDown, 
  Target, Zap, Users, Globe, Building, Calendar, ArrowUpRight,
  ArrowDownRight, AlertTriangle, CheckCircle, Info
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface MarketShareAnalysisProps {
  totalSpend: number
  totalRevenue: number
  industry: string
}

interface MarketPlayer {
  id: string
  name: string
  marketShare: number
  adSpend: number
  revenue: number
  growth: number
  category: 'leader' | 'challenger' | 'follower' | 'niche'
  position: number
}

interface MarketSegment {
  segment: string
  size: number
  growth: number
  competition: 'low' | 'medium' | 'high'
  opportunity: number
}

export function MarketShareAnalysis({ totalSpend, totalRevenue, industry }: MarketShareAnalysisProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('12m')

  // Mock market data (in real app, this would come from market research APIs)
  const marketPlayers: MarketPlayer[] = [
    {
      id: 'leader-1',
      name: 'MarketDominator Inc',
      marketShare: 24.5,
      adSpend: 15600000,
      revenue: 156000000,
      growth: 12.3,
      category: 'leader',
      position: 1
    },
    {
      id: 'leader-2', 
      name: 'IndustryGiant Corp',
      marketShare: 18.7,
      adSpend: 11800000,
      revenue: 118000000,
      growth: 8.1,
      category: 'leader',
      position: 2
    },
    {
      id: 'challenger-1',
      name: 'RisingForce LLC',
      marketShare: 12.3,
      adSpend: 7800000,
      revenue: 78000000,
      growth: 28.7,
      category: 'challenger',
      position: 3
    },
    {
      id: 'challenger-2',
      name: 'CompetitiveTech',
      marketShare: 9.8,
      adSpend: 6200000,
      revenue: 62000000,
      growth: 15.4,
      category: 'challenger',
      position: 4
    },
    {
      id: 'your-company',
      name: 'Your Company',
      marketShare: 4.2,
      adSpend: totalSpend,
      revenue: totalRevenue,
      growth: 22.1,
      category: 'follower',
      position: 7
    },
    {
      id: 'others',
      name: 'Others',
      marketShare: 30.5,
      adSpend: 19300000,
      revenue: 193000000,
      growth: 5.2,
      category: 'niche',
      position: 8
    }
  ]

  const marketSegments: MarketSegment[] = [
    {
      segment: 'Premium/Luxury',
      size: 28.5,
      growth: 15.2,
      competition: 'high',
      opportunity: 72
    },
    {
      segment: 'Mid-Market',
      size: 42.3,
      growth: 8.7,
      competition: 'high',
      opportunity: 45
    },
    {
      segment: 'Budget/Value',
      size: 23.1,
      growth: 12.4,
      competition: 'medium',
      opportunity: 68
    },
    {
      segment: 'Niche/Specialized',
      size: 6.1,
      growth: 24.8,
      competition: 'low',
      opportunity: 89
    }
  ]

  const timeSeriesData = [
    { month: 'Jan', yourShare: 3.8, targetCompetitor: 23.2, market: 631000000 },
    { month: 'Feb', yourShare: 3.9, targetCompetitor: 23.5, market: 645000000 },
    { month: 'Mar', yourShare: 4.0, targetCompetitor: 23.8, market: 658000000 },
    { month: 'Apr', yourShare: 4.1, targetCompetitor: 24.0, market: 672000000 },
    { month: 'May', yourShare: 4.1, targetCompetitor: 24.2, market: 685000000 },
    { month: 'Jun', yourShare: 4.2, targetCompetitor: 24.5, market: 698000000 }
  ]

  const yourCompany = marketPlayers.find(p => p.id === 'your-company')!
  const marketSize = marketPlayers.reduce((sum, p) => sum + p.revenue, 0)
  
  const getCompetitionLevel = (competition: string) => {
    switch (competition) {
      case 'low': return { color: 'text-green-600', bg: 'bg-green-100', label: 'Low Competition' }
      case 'medium': return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Medium Competition' }
      case 'high': return { color: 'text-red-600', bg: 'bg-red-100', label: 'High Competition' }
      default: return { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Unknown' }
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'leader': return <Target className="h-4 w-4 text-blue-600" />
      case 'challenger': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'follower': return <Users className="h-4 w-4 text-yellow-600" />
      case 'niche': return <Building className="h-4 w-4 text-purple-600" />
      default: return <Globe className="h-4 w-4 text-gray-600" />
    }
  }

  const pieData = marketPlayers.map(player => ({
    name: player.name,
    value: player.marketShare,
    fill: player.id === 'your-company' ? '#3b82f6' : 
          player.category === 'leader' ? '#10b981' :
          player.category === 'challenger' ? '#f59e0b' :
          player.category === 'follower' ? '#8b5cf6' : '#94a3b8'
  }))

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Market Share Analysis
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of your position in the {industry} market
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{yourCompany.marketShare.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Your Market Share</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">#{yourCompany.position}</div>
              <div className="text-sm text-muted-foreground">Market Position</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(marketSize)}</div>
              <div className="text-sm text-muted-foreground">Total Market Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                {yourCompany.growth > 0 ? (
                  <>
                    <ArrowUpRight className="h-5 w-5 text-green-600" />
                    <span className="text-green-600">+{yourCompany.growth.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-5 w-5 text-red-600" />
                    <span className="text-red-600">{yourCompany.growth.toFixed(1)}%</span>
                  </>
                )}
              </div>
              <div className="text-sm text-muted-foreground">YoY Growth</div>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You're currently ranked #{yourCompany.position} in the market with {yourCompany.marketShare.toFixed(1)}% share. 
              Your growth rate of {yourCompany.growth.toFixed(1)}% is {yourCompany.growth > 15 ? 'significantly above' : yourCompany.growth > 8 ? 'above' : 'below'} market average.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Market Overview</TabsTrigger>
          <TabsTrigger value="competitors">Key Players</TabsTrigger>
          <TabsTrigger value="segments">Market Segments</TabsTrigger>
          <TabsTrigger value="trends">Trends & Growth</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Share Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Market Share Distribution</CardTitle>
                <CardDescription>Current market position of all major players</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Market Position Matrix */}
            <Card>
              <CardHeader>
                <CardTitle>Competitive Position</CardTitle>
                <CardDescription>Market share vs growth rate analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {marketPlayers.filter(p => p.id !== 'others').map(player => (
                    <div key={player.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(player.category)}
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-muted-foreground capitalize">{player.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{player.marketShare.toFixed(1)}%</div>
                        <div className={`text-sm flex items-center gap-1 ${
                          player.growth > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {player.growth > 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {player.growth > 0 ? '+' : ''}{player.growth.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Competitor Analysis</CardTitle>
              <CardDescription>In-depth view of key market players</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketPlayers.filter(p => p.id !== 'others' && p.id !== 'your-company').map(player => (
                  <div key={player.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(player.category)}
                        <div>
                          <h3 className="font-semibold text-lg">{player.name}</h3>
                          <Badge variant="outline" className="capitalize">{player.category}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">#{player.position}</div>
                        <div className="text-sm text-muted-foreground">Market Rank</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Market Share</div>
                        <div className="font-medium text-lg">{player.marketShare.toFixed(1)}%</div>
                        <Progress value={player.marketShare} className="mt-1 h-2" />
                      </div>
                      <div>
                        <div className="text-muted-foreground">Est. Revenue</div>
                        <div className="font-medium">{formatCurrency(player.revenue)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Growth Rate</div>
                        <div className={`font-medium flex items-center gap-1 ${
                          player.growth > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {player.growth > 0 ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          {player.growth > 0 ? '+' : ''}{player.growth.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Share Gap vs You:</span>
                          <span className="font-medium">
                            {(player.marketShare - yourCompany.marketShare).toFixed(1)}pp
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Est. Ad Spend:</span>
                          <span className="font-medium">{formatCurrency(player.adSpend)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Segments Analysis</CardTitle>
              <CardDescription>Opportunities across different market segments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketSegments.map((segment, idx) => {
                  const competitionLevel = getCompetitionLevel(segment.competition)
                  return (
                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{segment.segment}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={competitionLevel.bg + ' ' + competitionLevel.color}>
                            {competitionLevel.label}
                          </Badge>
                          <Badge variant="outline">
                            Opportunity: {segment.opportunity}%
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Segment Size</div>
                          <div className="font-medium text-lg">{segment.size.toFixed(1)}%</div>
                          <Progress value={segment.size} className="mt-1 h-2" />
                        </div>
                        <div>
                          <div className="text-muted-foreground">Growth Rate</div>
                          <div className="font-medium flex items-center gap-1 text-green-600">
                            <ArrowUpRight className="h-4 w-4" />
                            +{segment.growth.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Market Value</div>
                          <div className="font-medium">
                            {formatCurrency(marketSize * (segment.size / 100))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Opportunity Score:</span>
                            <div className="flex items-center gap-2">
                              <Progress value={segment.opportunity} className="w-24 h-2" />
                              <span className="font-medium">{segment.opportunity}/100</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Share Trends</CardTitle>
              <CardDescription>Historical market share evolution over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'market' ? formatCurrency(value as number) : `${value}%`,
                      name === 'yourShare' ? 'Your Share' : 
                      name === 'targetCompetitor' ? 'Top Competitor' : 'Market Size'
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="yourShare" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Your Share"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="targetCompetitor" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Top Competitor"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Growth Opportunities</CardTitle>
                <CardDescription>Strategic recommendations for market expansion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 border rounded">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Target Niche Segments</div>
                      <div className="text-sm text-muted-foreground">
                        Focus on specialized segments with lower competition but high growth potential
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded">
                    <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Aggressive Market Share Growth</div>
                      <div className="text-sm text-muted-foreground">
                        Your 22.1% growth rate positions you well to capture additional market share
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Premium Segment Entry</div>
                      <div className="text-sm text-muted-foreground">
                        High-growth premium segment offers expansion opportunities
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Competitive Threats</CardTitle>
                <CardDescription>Key risks and challenges to monitor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 border rounded">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Rising Challenger</div>
                      <div className="text-sm text-muted-foreground">
                        RisingForce LLC growing at 28.7% - potential threat to market position
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Market Leaders Consolidating</div>
                      <div className="text-sm text-muted-foreground">
                        Top 2 players control 43.2% of market - increasing competitive pressure
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Price Competition</div>
                      <div className="text-sm text-muted-foreground">
                        High competition in mid-market segment may pressure margins
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}