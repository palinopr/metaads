"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts'
import { 
  Trophy, TrendingUp, TrendingDown, AlertCircle, 
  CheckCircle, XCircle, Target, Zap, Users, Eye, 
  Search, Radar as RadarIcon, Clock, BarChart3, TrendingUpDown
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface CompetitorBenchmarkProps {
  campaigns: any[]
  totalSpend: number
  totalRevenue: number
}

interface CompetitorData {
  id: string
  name: string
  industry: string
  metrics: {
    roas: number
    ctr: number
    cpc: number
    cpa: number
    adSpend: number
    estimatedRevenue: number
    marketShare: number
  }
  recentChanges: {
    metric: string
    change: number
    timeframe: string
  }[]
  isTracked: boolean
  lastUpdated: Date
}

interface Metric {
  name: string
  yourValue: number
  industryAvg: number
  topPerformers: number
  percentile: number
}

export function CompetitorBenchmark({ campaigns, totalSpend, totalRevenue }: CompetitorBenchmarkProps) {
  // Mock competitor data (in real app, this would come from competitive intelligence APIs)
  const competitors: CompetitorData[] = [
    {
      id: 'comp-1',
      name: 'MarketLeader Corp',
      industry: 'E-commerce',
      metrics: {
        roas: 4.2,
        ctr: 2.8,
        cpc: 0.95,
        cpa: 28,
        adSpend: 2500000,
        estimatedRevenue: 10500000,
        marketShare: 18.5
      },
      recentChanges: [
        { metric: 'ROAS', change: 0.3, timeframe: '7d' },
        { metric: 'CPC', change: -0.15, timeframe: '7d' }
      ],
      isTracked: true,
      lastUpdated: new Date()
    },
    {
      id: 'comp-2',
      name: 'AggressiveGrowth Inc',
      industry: 'E-commerce',
      metrics: {
        roas: 3.1,
        ctr: 3.2,
        cpc: 1.25,
        cpa: 42,
        adSpend: 1800000,
        estimatedRevenue: 5580000,
        marketShare: 12.3
      },
      recentChanges: [
        { metric: 'Ad Spend', change: 25, timeframe: '30d' },
        { metric: 'CTR', change: 0.4, timeframe: '7d' }
      ],
      isTracked: true,
      lastUpdated: new Date()
    },
    {
      id: 'comp-3',
      name: 'ValueBrand Solutions',
      industry: 'E-commerce',
      metrics: {
        roas: 2.8,
        ctr: 1.9,
        cpc: 0.75,
        cpa: 35,
        adSpend: 950000,
        estimatedRevenue: 2660000,
        marketShare: 8.7
      },
      recentChanges: [
        { metric: 'Market Share', change: -1.2, timeframe: '30d' }
      ],
      isTracked: false,
      lastUpdated: new Date()
    }
  ]

  // Calculate your metrics
  const avgROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const avgCTR = campaigns.reduce((sum, c) => sum + (c.insights?.ctr || 0), 0) / (campaigns.length || 1)
  const avgCPC = campaigns.reduce((sum, c) => sum + (c.insights?.cpc || 0), 0) / (campaigns.length || 1)
  const avgCPA = campaigns.reduce((sum, c) => sum + (c.insights?.cpa || 0), 0) / (campaigns.length || 1)
  const avgFrequency = campaigns.reduce((sum, c) => sum + (c.insights?.frequency || 0), 0) / (campaigns.length || 1)

  // Industry benchmarks (these would come from a real benchmark database)
  const benchmarks: Metric[] = [
    {
      name: 'ROAS',
      yourValue: avgROAS,
      industryAvg: 2.0,
      topPerformers: 4.0,
      percentile: calculatePercentile(avgROAS, 2.0, 4.0)
    },
    {
      name: 'CTR',
      yourValue: avgCTR,
      industryAvg: 1.2,
      topPerformers: 2.5,
      percentile: calculatePercentile(avgCTR, 1.2, 2.5)
    },
    {
      name: 'CPC',
      yourValue: avgCPC,
      industryAvg: 1.5,
      topPerformers: 0.8,
      percentile: calculatePercentile(avgCPC, 1.5, 0.8, true) // Lower is better
    },
    {
      name: 'CPA',
      yourValue: avgCPA,
      industryAvg: 50,
      topPerformers: 25,
      percentile: calculatePercentile(avgCPA, 50, 25, true) // Lower is better
    },
    {
      name: 'Frequency',
      yourValue: avgFrequency,
      industryAvg: 2.5,
      topPerformers: 1.8,
      percentile: calculatePercentile(avgFrequency, 2.5, 1.8, true) // Lower is better
    }
  ]

  function calculatePercentile(value: number, avg: number, top: number, lowerIsBetter = false): number {
    if (lowerIsBetter) {
      if (value <= top) return 90
      if (value <= avg) return 50 + ((avg - value) / (avg - top)) * 40
      return Math.max(0, 50 - ((value - avg) / avg) * 50)
    } else {
      if (value >= top) return 90
      if (value >= avg) return 50 + ((value - avg) / (top - avg)) * 40
      return Math.max(0, (value / avg) * 50)
    }
  }

  const overallPercentile = benchmarks.reduce((sum, b) => sum + b.percentile, 0) / benchmarks.length

  const getPerformanceLevel = (percentile: number) => {
    if (percentile >= 80) return { label: 'Top Performer', color: 'text-green-600', icon: Trophy }
    if (percentile >= 60) return { label: 'Above Average', color: 'text-blue-600', icon: TrendingUp }
    if (percentile >= 40) return { label: 'Average', color: 'text-yellow-600', icon: Target }
    return { label: 'Below Average', color: 'text-red-600', icon: TrendingDown }
  }

  const performance = getPerformanceLevel(overallPercentile)
  const PerformanceIcon = performance.icon

  // Prepare data for radar chart
  const radarData = benchmarks.map(b => ({
    metric: b.name,
    You: b.percentile,
    'Industry Avg': 50,
    'Top 10%': 90
  }))

  // Prepare data for bar chart
  const comparisonData = benchmarks.map(b => ({
    metric: b.name,
    You: b.yourValue,
    'Industry Avg': b.industryAvg,
    'Top Performers': b.topPerformers
  }))

  return (
    <div className="space-y-6">
      {/* Competitor Tracking Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Competitor Tracking
          </CardTitle>
          <CardDescription>
            Real-time monitoring of key competitors in your industry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {competitors.map(competitor => (
              <div key={competitor.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{competitor.name}</h3>
                    <p className="text-sm text-muted-foreground">{competitor.industry}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {competitor.isTracked && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <RadarIcon className="h-3 w-3 mr-1" />
                        Tracked
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      {competitor.metrics.marketShare.toFixed(1)}% share
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">ROAS:</span>
                    <span className="ml-2 font-medium">{competitor.metrics.roas.toFixed(1)}x</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CTR:</span>
                    <span className="ml-2 font-medium">{competitor.metrics.ctr.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CPC:</span>
                    <span className="ml-2 font-medium">{formatCurrency(competitor.metrics.cpc)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CPA:</span>
                    <span className="ml-2 font-medium">{formatCurrency(competitor.metrics.cpa)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Recent Changes
                  </h4>
                  {competitor.recentChanges.map((change, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{change.metric}</span>
                      <div className="flex items-center gap-1">
                        {change.change > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className={change.change > 0 ? 'text-green-600' : 'text-red-600'}>
                          {change.change > 0 ? '+' : ''}{change.change}% ({change.timeframe})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Est. Monthly Spend: {formatCurrency(competitor.metrics.adSpend)}</span>
                    <span>Updated: {competitor.lastUpdated.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Alert className="mt-6">
            <Search className="h-4 w-4" />
            <AlertDescription>
              <strong>Competitive Intelligence:</strong> Data sourced from public ad libraries, 
              third-party tools, and market research. Competitor metrics are estimates based on available data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Overall Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Competitor Benchmarking
          </CardTitle>
          <CardDescription>
            How your campaigns compare to industry standards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <PerformanceIcon className={`h-8 w-8 ${performance.color}`} />
              <h3 className={`text-3xl font-bold ${performance.color}`}>
                {performance.label}
              </h3>
            </div>
            <p className="text-muted-foreground">
              You're in the top {100 - Math.round(overallPercentile)}% of advertisers
            </p>
            <Progress value={overallPercentile} className="mt-4 h-3" />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Key Insight:</strong> Your performance is {overallPercentile >= 50 ? 'above' : 'below'} industry average. 
              {overallPercentile >= 80 && ' You\'re outperforming 80% of competitors!'}
              {overallPercentile < 40 && ' There\'s significant room for improvement.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Individual Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Metric</CardTitle>
            <CardDescription>
              Your percentile ranking for each key metric
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {benchmarks.map(metric => {
                const isGood = metric.percentile >= 60
                const Icon = isGood ? CheckCircle : metric.percentile >= 40 ? AlertCircle : XCircle
                const color = isGood ? 'text-green-500' : metric.percentile >= 40 ? 'text-yellow-500' : 'text-red-500'
                
                return (
                  <div key={metric.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${color}`} />
                        <span className="font-medium">{metric.name}</span>
                      </div>
                      <div className="text-sm text-right">
                        <div className="font-medium">
                          {metric.name === 'ROAS' ? `${metric.yourValue.toFixed(2)}x` :
                           metric.name === 'CTR' ? `${metric.yourValue.toFixed(2)}%` :
                           metric.name === 'CPC' || metric.name === 'CPA' ? formatCurrency(metric.yourValue) :
                           metric.yourValue.toFixed(2)}
                        </div>
                        <div className="text-muted-foreground">
                          Top {100 - Math.round(metric.percentile)}%
                        </div>
                      </div>
                    </div>
                    <Progress value={metric.percentile} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Bottom 10%</span>
                      <span>Avg: {
                        metric.name === 'ROAS' ? `${metric.industryAvg}x` :
                        metric.name === 'CTR' ? `${metric.industryAvg}%` :
                        metric.name === 'CPC' || metric.name === 'CPA' ? formatCurrency(metric.industryAvg) :
                        metric.industryAvg
                      }</span>
                      <span>Top 10%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Visual comparison of your metrics vs benchmarks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar 
                  name="You" 
                  dataKey="You" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6} 
                />
                <Radar 
                  name="Industry Avg" 
                  dataKey="Industry Avg" 
                  stroke="#94a3b8" 
                  fill="#94a3b8" 
                  fillOpacity={0.3} 
                />
                <Radar 
                  name="Top 10%" 
                  dataKey="Top 10%" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.2} 
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Improvement Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Improvement Opportunities</CardTitle>
          <CardDescription>
            Specific actions to match or exceed top performers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {benchmarks
              .filter(b => b.percentile < 60)
              .sort((a, b) => a.percentile - b.percentile)
              .map(metric => {
                const gap = metric.name === 'ROAS' || metric.name === 'CTR' 
                  ? ((metric.topPerformers - metric.yourValue) / metric.yourValue * 100).toFixed(0)
                  : ((metric.yourValue - metric.topPerformers) / metric.yourValue * 100).toFixed(0)
                
                return (
                  <div key={metric.name} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Improve {metric.name}
                      </h4>
                      <Badge variant="outline">
                        {gap}% gap to close
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Current: {
                        metric.name === 'ROAS' ? `${metric.yourValue.toFixed(2)}x` :
                        metric.name === 'CTR' ? `${metric.yourValue.toFixed(2)}%` :
                        formatCurrency(metric.yourValue)
                      } → Target: {
                        metric.name === 'ROAS' ? `${metric.topPerformers}x` :
                        metric.name === 'CTR' ? `${metric.topPerformers}%` :
                        formatCurrency(metric.topPerformers)
                      }
                    </p>
                    <div className="text-sm space-y-1">
                      {metric.name === 'CTR' && (
                        <>
                          <p>• Test new ad creative with stronger hooks</p>
                          <p>• Refine audience targeting for relevance</p>
                          <p>• A/B test different ad formats</p>
                        </>
                      )}
                      {metric.name === 'CPC' && (
                        <>
                          <p>• Improve Quality Score with relevant ads</p>
                          <p>• Test automatic vs manual bidding</p>
                          <p>• Optimize for less competitive times</p>
                        </>
                      )}
                      {metric.name === 'ROAS' && (
                        <>
                          <p>• Focus budget on top-performing campaigns</p>
                          <p>• Improve landing page conversion rate</p>
                          <p>• Test higher-margin products/services</p>
                        </>
                      )}
                      {metric.name === 'CPA' && (
                        <>
                          <p>• Optimize conversion funnel</p>
                          <p>• Test different offer structures</p>
                          <p>• Implement retargeting campaigns</p>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            
            {benchmarks.filter(b => b.percentile < 60).length === 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Excellent! You're performing above average in all key metrics. 
                  Focus on maintaining this performance while testing incremental improvements.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Industry Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Comparison</CardTitle>
          <CardDescription>
            Your metrics vs industry average and top performers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  const metric = comparisonData.find(d => d.You === value || d['Industry Avg'] === value || d['Top Performers'] === value)?.metric
                  if (metric === 'ROAS') return value.toFixed(2) + 'x'
                  if (metric === 'CTR') return value.toFixed(2) + '%'
                  if (metric === 'CPC' || metric === 'CPA') return formatCurrency(value)
                  return value.toFixed(2)
                }}
              />
              <Legend />
              <Bar dataKey="You" fill="#3b82f6" />
              <Bar dataKey="Industry Avg" fill="#94a3b8" />
              <Bar dataKey="Top Performers" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}