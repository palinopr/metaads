"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Area, AreaChart
} from 'recharts'
import { 
  BarChart3, TrendingUp, TrendingDown, Target, Award, 
  Building, Globe, Users, Calendar, Info, AlertTriangle,
  CheckCircle, Filter, Download, RefreshCw, Zap, Trophy
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface IndustryBenchmarkingProps {
  campaigns: any[]
  totalSpend: number
  totalRevenue: number
  industry?: string
}

interface IndustryBenchmark {
  industry: string
  metrics: {
    avgROAS: number
    avgCTR: number
    avgCPC: number
    avgCPA: number
    avgFrequency: number
    avgCPM: number
    conversionRate: number
    bounceRate: number
  }
  percentiles: {
    p25: Partial<IndustryBenchmark['metrics']>
    p50: Partial<IndustryBenchmark['metrics']>
    p75: Partial<IndustryBenchmark['metrics']>
    p90: Partial<IndustryBenchmark['metrics']>
  }
  trends: {
    quarterlyGrowth: number
    yearlyGrowth: number
    seasonality: number[]
  }
  competitiveness: 'low' | 'medium' | 'high' | 'very-high'
  averageSpend: number
  topPlayers: number
}

export function IndustryBenchmarking({ campaigns, totalSpend, totalRevenue, industry = 'E-commerce' }: IndustryBenchmarkingProps) {
  const [selectedIndustry, setSelectedIndustry] = useState(industry)
  const [selectedMetric, setSelectedMetric] = useState('roas')
  const [selectedTimeframe, setSelectedTimeframe] = useState('12m')

  // Calculate user metrics
  const avgROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const avgCTR = campaigns.reduce((sum, c) => sum + (c.insights?.ctr || 0), 0) / (campaigns.length || 1)
  const avgCPC = campaigns.reduce((sum, c) => sum + (c.insights?.cpc || 0), 0) / (campaigns.length || 1)
  const avgCPA = campaigns.reduce((sum, c) => sum + (c.insights?.cpa || 0), 0) / (campaigns.length || 1)
  const avgFrequency = campaigns.reduce((sum, c) => sum + (c.insights?.frequency || 0), 0) / (campaigns.length || 1)

  // Mock industry benchmark data
  const industryBenchmarks: Record<string, IndustryBenchmark> = {
    'E-commerce': {
      industry: 'E-commerce',
      metrics: {
        avgROAS: 3.2,
        avgCTR: 1.8,
        avgCPC: 1.25,
        avgCPA: 45,
        avgFrequency: 2.1,
        avgCPM: 12.50,
        conversionRate: 2.4,
        bounceRate: 45.2
      },
      percentiles: {
        p25: { avgROAS: 2.1, avgCTR: 1.2, avgCPC: 0.85, avgCPA: 65 },
        p50: { avgROAS: 3.2, avgCTR: 1.8, avgCPC: 1.25, avgCPA: 45 },
        p75: { avgROAS: 4.8, avgCTR: 2.6, avgCPC: 1.85, avgCPA: 28 },
        p90: { avgROAS: 6.5, avgCTR: 3.8, avgCPC: 2.45, avgCPA: 18 }
      },
      trends: {
        quarterlyGrowth: 8.3,
        yearlyGrowth: 24.7,
        seasonality: [85, 92, 98, 105, 110, 115, 108, 102, 95, 88, 125, 142]
      },
      competitiveness: 'very-high',
      averageSpend: 125000,
      topPlayers: 450
    },
    'SaaS': {
      industry: 'SaaS',
      metrics: {
        avgROAS: 4.8,
        avgCTR: 2.4,
        avgCPC: 3.45,
        avgCPA: 125,
        avgFrequency: 1.8,
        avgCPM: 18.75,
        conversionRate: 3.2,
        bounceRate: 38.5
      },
      percentiles: {
        p25: { avgROAS: 2.8, avgCTR: 1.6, avgCPC: 2.15, avgCPA: 185 },
        p50: { avgROAS: 4.8, avgCTR: 2.4, avgCPC: 3.45, avgCPA: 125 },
        p75: { avgROAS: 7.2, avgCTR: 3.4, avgCPC: 4.85, avgCPA: 85 },
        p90: { avgROAS: 9.8, avgCTR: 4.8, avgCPC: 6.25, avgCPA: 55 }
      },
      trends: {
        quarterlyGrowth: 12.4,
        yearlyGrowth: 34.2,
        seasonality: [95, 98, 102, 108, 112, 105, 92, 88, 105, 115, 118, 122]
      },
      competitiveness: 'high',
      averageSpend: 85000,
      topPlayers: 280
    },
    'Financial Services': {
      industry: 'Financial Services',
      metrics: {
        avgROAS: 2.8,
        avgCTR: 1.4,
        avgCPC: 4.25,
        avgCPA: 180,
        avgFrequency: 2.8,
        avgCPM: 22.50,
        conversionRate: 1.8,
        bounceRate: 52.3
      },
      percentiles: {
        p25: { avgROAS: 1.8, avgCTR: 0.9, avgCPC: 2.85, avgCPA: 245 },
        p50: { avgROAS: 2.8, avgCTR: 1.4, avgCPC: 4.25, avgCPA: 180 },
        p75: { avgROAS: 4.2, avgCTR: 2.1, avgCPC: 5.85, avgCPA: 125 },
        p90: { avgROAS: 5.8, avgCTR: 3.2, avgCPC: 7.45, avgCPA: 85 }
      },
      trends: {
        quarterlyGrowth: 5.8,
        yearlyGrowth: 18.3,
        seasonality: [102, 105, 108, 98, 92, 88, 85, 89, 95, 108, 115, 125]
      },
      competitiveness: 'very-high',
      averageSpend: 195000,
      topPlayers: 120
    }
  }

  const currentBenchmark = industryBenchmarks[selectedIndustry]
  
  const userMetrics = {
    avgROAS,
    avgCTR,
    avgCPC,
    avgCPA,
    avgFrequency,
    conversionRate: 2.1, // Mock value
    bounceRate: 42.8, // Mock value
    avgCPM: 11.25 // Mock value
  }

  const calculatePercentile = (userValue: number, benchmarkMetric: string, isLowerBetter = false) => {
    const percentiles = currentBenchmark.percentiles
    const p25 = percentiles.p25[benchmarkMetric as keyof typeof percentiles.p25] || 0
    const p50 = percentiles.p50[benchmarkMetric as keyof typeof percentiles.p50] || 0
    const p75 = percentiles.p75[benchmarkMetric as keyof typeof percentiles.p75] || 0
    const p90 = percentiles.p90[benchmarkMetric as keyof typeof percentiles.p90] || 0

    if (isLowerBetter) {
      if (userValue <= p25) return 90
      if (userValue <= p50) return 75
      if (userValue <= p75) return 50
      if (userValue <= p90) return 25
      return 10
    } else {
      if (userValue >= p90) return 90
      if (userValue >= p75) return 75
      if (userValue >= p50) return 50
      if (userValue >= p25) return 25
      return 10
    }
  }

  const metricPercentiles = {
    roas: calculatePercentile(userMetrics.avgROAS, 'avgROAS'),
    ctr: calculatePercentile(userMetrics.avgCTR, 'avgCTR'),
    cpc: calculatePercentile(userMetrics.avgCPC, 'avgCPC', true),
    cpa: calculatePercentile(userMetrics.avgCPA, 'avgCPA', true)
  }

  const overallScore = Object.values(metricPercentiles).reduce((sum, p) => sum + p, 0) / Object.keys(metricPercentiles).length

  const getPerformanceLevel = (percentile: number) => {
    if (percentile >= 75) return { label: 'Top Quartile', color: 'text-green-600', bg: 'bg-green-100' }
    if (percentile >= 50) return { label: 'Above Average', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (percentile >= 25) return { label: 'Below Average', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { label: 'Bottom Quartile', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const getCompetitivenessColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'very-high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const radarData = [
    { metric: 'ROAS', value: metricPercentiles.roas, industry: 50 },
    { metric: 'CTR', value: metricPercentiles.ctr, industry: 50 },
    { metric: 'CPC', value: metricPercentiles.cpc, industry: 50 },
    { metric: 'CPA', value: metricPercentiles.cpa, industry: 50 },
  ]

  const seasonalityData = currentBenchmark.trends.seasonality.map((value, index) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index],
    seasonality: value,
    baseline: 100
  }))

  const crossIndustryData = Object.entries(industryBenchmarks).map(([key, benchmark]) => ({
    industry: key,
    avgROAS: benchmark.metrics.avgROAS,
    avgCTR: benchmark.metrics.avgCTR,
    avgCPC: benchmark.metrics.avgCPC,
    competitiveness: benchmark.competitiveness,
    averageSpend: benchmark.averageSpend
  }))

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Industry Benchmarking
          </CardTitle>
          <CardDescription>
            Compare your performance against industry standards and best practices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Industry" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(industryBenchmarks).map(industry => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="12m">12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{overallScore.toFixed(0)}th</div>
              <div className="text-sm text-muted-foreground">Overall Percentile</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{currentBenchmark.topPlayers}</div>
              <div className="text-sm text-muted-foreground">Active Competitors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(currentBenchmark.averageSpend)}</div>
              <div className="text-sm text-muted-foreground">Avg Monthly Spend</div>
            </div>
            <div className="text-center">
              <Badge className={getCompetitivenessColor(currentBenchmark.competitiveness)}>
                {currentBenchmark.competitiveness.replace('-', ' ')} Competition
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="trends">Industry Trends</TabsTrigger>
          <TabsTrigger value="comparison">Cross-Industry</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Performance vs Industry</CardTitle>
                <CardDescription>Your metrics compared to {selectedIndustry} benchmarks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar 
                      name="Your Performance" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.6} 
                    />
                    <Radar 
                      name="Industry Average" 
                      dataKey="industry" 
                      stroke="#94a3b8" 
                      fill="#94a3b8" 
                      fillOpacity={0.3} 
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Metrics Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics Summary</CardTitle>
                <CardDescription>Your position in the {selectedIndustry} industry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { key: 'roas', label: 'ROAS', userValue: userMetrics.avgROAS, industryValue: currentBenchmark.metrics.avgROAS, format: 'ratio' },
                    { key: 'ctr', label: 'CTR', userValue: userMetrics.avgCTR, industryValue: currentBenchmark.metrics.avgCTR, format: 'percentage' },
                    { key: 'cpc', label: 'CPC', userValue: userMetrics.avgCPC, industryValue: currentBenchmark.metrics.avgCPC, format: 'currency' },
                    { key: 'cpa', label: 'CPA', userValue: userMetrics.avgCPA, industryValue: currentBenchmark.metrics.avgCPA, format: 'currency' }
                  ].map(metric => {
                    const percentile = metricPercentiles[metric.key as keyof typeof metricPercentiles]
                    const performance = getPerformanceLevel(percentile)
                    
                    return (
                      <div key={metric.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{metric.label}</span>
                          <Badge className={performance.bg + ' ' + performance.color}>
                            {performance.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>
                            Your: {
                              metric.format === 'ratio' ? `${metric.userValue.toFixed(2)}x` :
                              metric.format === 'percentage' ? `${metric.userValue.toFixed(2)}%` :
                              formatCurrency(metric.userValue)
                            }
                          </span>
                          <span className="text-muted-foreground">
                            Industry: {
                              metric.format === 'ratio' ? `${metric.industryValue.toFixed(2)}x` :
                              metric.format === 'percentage' ? `${metric.industryValue.toFixed(2)}%` :
                              formatCurrency(metric.industryValue)
                            }
                          </span>
                        </div>
                        <Progress value={percentile} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {percentile}th percentile
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Strategic recommendations based on industry benchmarks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-green-600">Strengths</h4>
                  {Object.entries(metricPercentiles)
                    .filter(([_, percentile]) => percentile >= 50)
                    .map(([metric, percentile]) => (
                      <div key={metric} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>
                          {metric.toUpperCase()} performance is in the top {100 - percentile}% of your industry
                        </span>
                      </div>
                    ))}
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-orange-600">Areas for Improvement</h4>
                  {Object.entries(metricPercentiles)
                    .filter(([_, percentile]) => percentile < 50)
                    .map(([metric, percentile]) => (
                      <div key={metric} className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span>
                          {metric.toUpperCase()} needs improvement - currently bottom {percentile}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Percentile Analysis</CardTitle>
              <CardDescription>Your position across all key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { metric: 'avgROAS', label: 'Return on Ad Spend (ROAS)', userValue: userMetrics.avgROAS, format: 'ratio', lowerBetter: false },
                  { metric: 'avgCTR', label: 'Click-Through Rate (CTR)', userValue: userMetrics.avgCTR, format: 'percentage', lowerBetter: false },
                  { metric: 'avgCPC', label: 'Cost Per Click (CPC)', userValue: userMetrics.avgCPC, format: 'currency', lowerBetter: true },
                  { metric: 'avgCPA', label: 'Cost Per Acquisition (CPA)', userValue: userMetrics.avgCPA, format: 'currency', lowerBetter: true },
                  { metric: 'conversionRate', label: 'Conversion Rate', userValue: userMetrics.conversionRate, format: 'percentage', lowerBetter: false },
                  { metric: 'bounceRate', label: 'Bounce Rate', userValue: userMetrics.bounceRate, format: 'percentage', lowerBetter: true }
                ].map(item => {
                  const percentile = calculatePercentile(item.userValue, item.metric, item.lowerBetter)
                  const industryValue = currentBenchmark.metrics[item.metric as keyof typeof currentBenchmark.metrics]
                  const p25 = currentBenchmark.percentiles.p25[item.metric as keyof typeof currentBenchmark.percentiles.p25] || 0
                  const p75 = currentBenchmark.percentiles.p75[item.metric as keyof typeof currentBenchmark.percentiles.p75] || 0
                  const p90 = currentBenchmark.percentiles.p90[item.metric as keyof typeof currentBenchmark.percentiles.p90] || 0

                  return (
                    <div key={item.metric} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{item.label}</h3>
                        <Badge className={getPerformanceLevel(percentile).bg + ' ' + getPerformanceLevel(percentile).color}>
                          {percentile}th percentile
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <div className="text-muted-foreground">Your Value</div>
                          <div className="font-medium text-lg">
                            {item.format === 'ratio' ? `${item.userValue.toFixed(2)}x` :
                             item.format === 'percentage' ? `${item.userValue.toFixed(1)}%` :
                             formatCurrency(item.userValue)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Industry Avg</div>
                          <div className="font-medium">
                            {item.format === 'ratio' ? `${industryValue.toFixed(2)}x` :
                             item.format === 'percentage' ? `${industryValue.toFixed(1)}%` :
                             formatCurrency(industryValue)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">75th Percentile</div>
                          <div className="font-medium">
                            {item.format === 'ratio' ? `${p75.toFixed(2)}x` :
                             item.format === 'percentage' ? `${p75.toFixed(1)}%` :
                             formatCurrency(p75)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">90th Percentile</div>
                          <div className="font-medium">
                            {item.format === 'ratio' ? `${p90.toFixed(2)}x` :
                             item.format === 'percentage' ? `${p90.toFixed(1)}%` :
                             formatCurrency(p90)}
                          </div>
                        </div>
                      </div>

                      <Progress value={percentile} className="h-3" />
                      
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>25th percentile</span>
                        <span>50th percentile</span>
                        <span>75th percentile</span>
                        <span>90th percentile</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Seasonal Trends</CardTitle>
                <CardDescription>Industry performance patterns throughout the year</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={seasonalityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, 'Seasonality Index']} />
                    <Area 
                      type="monotone" 
                      dataKey="seasonality" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.6} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="baseline" 
                      stroke="#94a3b8" 
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>Industry growth patterns and forecasts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Quarterly Growth</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-600">
                          +{currentBenchmark.trends.quarterlyGrowth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Progress value={currentBenchmark.trends.quarterlyGrowth} className="h-2" />
                  </div>

                  <div className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Yearly Growth</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-600">
                          +{currentBenchmark.trends.yearlyGrowth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Progress value={currentBenchmark.trends.yearlyGrowth} className="h-2" />
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Industry Insight:</strong> {selectedIndustry} shows strong growth momentum with 
                      peak performance in {seasonalityData.reduce((max, curr) => 
                        curr.seasonality > max.seasonality ? curr : max
                      ).month}.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <h4 className="font-medium">Key Trends</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Mobile-first strategies driving growth</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span>Video content adoption increasing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        <span>Personalization improving conversion rates</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Industry Comparison</CardTitle>
              <CardDescription>How different industries compare across key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={crossIndustryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="industry" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'averageSpend' ? formatCurrency(value as number) :
                      name === 'avgCPC' ? formatCurrency(value as number) :
                      name === 'avgROAS' ? `${value}x` :
                      `${value}%`,
                      name === 'avgROAS' ? 'Avg ROAS' :
                      name === 'avgCTR' ? 'Avg CTR' :
                      name === 'avgCPC' ? 'Avg CPC' :
                      'Avg Monthly Spend'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="avgROAS" fill="#3b82f6" name="Avg ROAS" />
                  <Bar dataKey="avgCTR" fill="#10b981" name="Avg CTR" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(industryBenchmarks).map(([key, benchmark]) => (
              <Card key={key} className={key === selectedIndustry ? 'ring-2 ring-blue-500' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {key}
                    {key === selectedIndustry && (
                      <Badge className="bg-blue-100 text-blue-700">Current</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Industry overview and key metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg ROAS:</span>
                      <span className="font-medium">{benchmark.metrics.avgROAS.toFixed(1)}x</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg CPC:</span>
                      <span className="font-medium">{formatCurrency(benchmark.metrics.avgCPC)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Competition:</span>
                      <Badge className={getCompetitivenessColor(benchmark.competitiveness)}>
                        {benchmark.competitiveness.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Spend:</span>
                      <span className="font-medium">{formatCurrency(benchmark.averageSpend)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Growth:</span>
                      <span className="font-medium text-green-600">
                        +{benchmark.trends.yearlyGrowth.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}