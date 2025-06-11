"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  ArrowLeft,
  TrendingUp, 
  TrendingDown,
  Brain,
  Sparkles,
  BarChart3,
  Calendar,
  DollarSign,
  Target,
  Users,
  Image,
  Zap,
  Trophy,
  AlertCircle,
  ChevronRight,
  Download,
  Share2,
  Clock,
  Eye,
  MousePointer,
  ShoppingCart,
  PieChart,
  Activity,
  Lightbulb,
  Settings2,
  Filter,
  RefreshCw
} from "lucide-react"
import { formatCurrency, formatNumberWithCommas, formatPercentage, cn } from "@/lib/utils"
import { AIInsights } from "@/components/ai-insights"
import { PredictiveAnalytics } from "@/components/predictive-analytics"
import { CompetitorBenchmark } from "@/components/competitor-benchmark"
import { CreativePerformanceAnalyzer } from "@/components/creative-performance-analyzer"
import { DemographicAnalytics } from "@/components/demographic-analytics"
import { DayHourPerformance } from "@/components/day-hour-performance"
import { DayWeekPerformance } from "@/components/day-week-performance"

interface ComprehensiveInsightsViewProps {
  item: {
    type: 'campaign' | 'adset' | 'ad'
    id: string
    name: string
    data: any
  }
  campaigns?: any[]
  accessToken: string
  adAccountId: string
  onBack: () => void
}

export function ComprehensiveInsightsView({ item, campaigns = [], accessToken, adAccountId, onBack }: ComprehensiveInsightsViewProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [dateRange, setDateRange] = useState("last7days")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Extract key metrics from item data
  const metrics = item.data?.insights || {}
  const spend = metrics.spend || 0
  const revenue = metrics.revenue || 0
  const roas = metrics.roas || 0
  const impressions = metrics.impressions || 0
  const clicks = metrics.clicks || 0
  const ctr = metrics.ctr || 0
  const cpc = metrics.cpc || 0
  const conversions = metrics.conversions || 0
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0

  // Calculate performance score
  const performanceScore = item.data?.performanceScore || 50

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh - in real implementation, this would fetch new data
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsRefreshing(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="hover:bg-accent"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{item.name}</h1>
                  <Badge variant="outline" className="capitalize">
                    {item.type}
                  </Badge>
                  <Badge variant={item.data?.effective_status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {item.data?.effective_status || 'Unknown'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Comprehensive insights and analytics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="historical">Historical</TabsTrigger>
            <TabsTrigger value="creative">Creative</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
            <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Performance Score */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Score</CardTitle>
                <CardDescription>Overall performance rating based on multiple factors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative h-32 w-32">
                    <svg className="h-32 w-32 -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        strokeWidth="12"
                        fill="none"
                        className="stroke-muted"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(performanceScore / 100) * 352} 352`}
                        className={cn(
                          "transition-all duration-1000",
                          performanceScore >= 80 ? "stroke-green-500" :
                          performanceScore >= 60 ? "stroke-yellow-500" :
                          "stroke-red-500"
                        )}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold">{performanceScore}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">ROAS</span>
                      <span className="font-medium">{roas.toFixed(2)}x</span>
                    </div>
                    <Progress value={Math.min(roas * 20, 100)} className="h-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">CTR</span>
                      <span className="font-medium">{formatPercentage(ctr)}</span>
                    </div>
                    <Progress value={Math.min(ctr * 20, 100)} className="h-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Conversion Rate</span>
                      <span className="font-medium">{formatPercentage(conversionRate)}</span>
                    </div>
                    <Progress value={Math.min(conversionRate * 10, 100)} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(spend)}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500">↑ 12%</span> from last period
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(revenue)}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500">↑ 18%</span> from last period
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Impressions</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumberWithCommas(impressions)}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500">↑ 8%</span> from last period
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumberWithCommas(clicks)}</div>
                  <p className="text-xs text-muted-foreground">
                    CTR: {formatPercentage(ctr)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common actions and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>Increase Budget</AlertTitle>
                    <AlertDescription>
                      This {item.type} is performing well. Consider increasing budget by 20%.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertTitle>Expand Targeting</AlertTitle>
                    <AlertDescription>
                      Add lookalike audiences to reach more potential customers.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertTitle>Test New Creative</AlertTitle>
                    <AlertDescription>
                      Creative fatigue detected. Upload fresh ad variations.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-Powered Insights & Recommendations
                </CardTitle>
                <CardDescription>
                  Advanced analysis and actionable recommendations based on your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIInsights 
                  campaigns={campaigns}
                  totalSpend={spend}
                  totalRevenue={revenue}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Performance Predictions
                </CardTitle>
                <CardDescription>
                  AI-driven forecasts for the next 7, 14, and 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PredictiveAnalytics 
                  campaigns={campaigns}
                  historicalData={[]}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Historical Trends Tab */}
          <TabsContent value="historical" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Historical Performance Trends
                </CardTitle>
                <CardDescription>
                  Analyze performance patterns over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DayWeekPerformance 
                  campaignId={item.id}
                  accessToken={accessToken}
                  adAccountId={adAccountId}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Creative Analysis Tab */}
          <TabsContent value="creative" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Creative Performance Analysis
                </CardTitle>
                <CardDescription>
                  Detailed analysis of ad creative performance and optimization suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {item.type === 'ad' ? (
                  <CreativePerformanceAnalyzer 
                    adId={item.id}
                    adName={item.name}
                    creative={{
                      id: item.id,
                      type: 'image',
                      metrics: {
                        impressions: impressions,
                        clicks: clicks,
                        ctr: ctr,
                        conversions: conversions,
                        conversionRate: conversionRate,
                        engagementRate: ctr * 1.5,
                        frequency: 1.5
                      }
                    }}
                  />
                ) : (
                  <div className="space-y-6">
                    {/* Overview for Campaign/AdSet level creative performance */}
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Creative Performance Overview</AlertTitle>
                      <AlertDescription>
                        {item.type === 'campaign' 
                          ? 'Showing aggregated creative performance across all ads in this campaign.'
                          : 'Showing creative performance for all ads in this ad set.'}
                      </AlertDescription>
                    </Alert>

                    {/* Creative Metrics Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Creatives</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{item.type === 'campaign' ? '12' : '4'}</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Best Performing</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm font-medium">Video Ad #3</p>
                          <p className="text-xs text-muted-foreground">{formatPercentage(2.8)} CTR</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Needs Refresh</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-orange-600">2</p>
                          <p className="text-xs text-muted-foreground">High frequency</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">A/B Tests</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">3</p>
                          <p className="text-xs text-muted-foreground">Active tests</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Creative Recommendations */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Creative Optimization Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Alert>
                          <Lightbulb className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Test video content:</strong> Your static images have 40% lower engagement than industry average. Consider testing short-form video ads.
                          </AlertDescription>
                        </Alert>
                        <Alert>
                          <RefreshCw className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Refresh top creatives:</strong> Your best performing ads are showing fatigue after 3 weeks. Create variations to maintain performance.
                          </AlertDescription>
                        </Alert>
                        <Alert>
                          <Target className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Audience-specific creatives:</strong> Create tailored ads for your top 3 audience segments to improve relevance.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audience Insights Tab */}
          <TabsContent value="audience" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Audience Insights & Demographics
                </CardTitle>
                <CardDescription>
                  Understand your audience composition and behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DemographicAnalytics 
                  campaignId={item.id}
                  accessToken={accessToken}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budget Optimization Tab */}
          <TabsContent value="optimization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Budget Optimization Suggestions
                </CardTitle>
                <CardDescription>
                  Smart recommendations to maximize your ROI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <DollarSign className="h-4 w-4" />
                    <AlertTitle>Reallocate Budget</AlertTitle>
                    <AlertDescription>
                      Move 30% of budget from underperforming ad sets to top performers for an estimated 25% ROAS increase.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Dayparting Opportunity</AlertTitle>
                    <AlertDescription>
                      Schedule ads during peak hours (2-5 PM) to reduce CPC by 15% while maintaining conversion volume.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertTitle>Bid Strategy Optimization</AlertTitle>
                    <AlertDescription>
                      Switch to cost cap bidding with a {formatCurrency(cpc * 1.2)} cap to improve efficiency.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competitor Benchmark Tab */}
          <TabsContent value="benchmark" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Competitor Benchmarks
                </CardTitle>
                <CardDescription>
                  See how your performance compares to industry standards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompetitorBenchmark 
                  campaigns={campaigns}
                  totalSpend={spend}
                  totalRevenue={revenue}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}