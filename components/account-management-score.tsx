"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Target,
  Activity,
  DollarSign,
  MousePointer,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Info,
  Zap,
  AlertTriangle
} from "lucide-react"
import { formatCurrency, formatNumberWithCommas, formatPercentage } from "@/lib/utils"
import { optimizedApiManager } from "@/lib/api-manager-optimized"

interface AccountManagementScoreProps {
  accessToken: string
  accountId: string
  datePreset: string
  campaigns?: any[]
  overviewData?: any
}

interface ScoreData {
  account: {
    score: number
    totalSpend: number
    totalRevenue: number
    overallROAS: number
    breakdown: {
      roas: number
      ctr: number
      cpc: number
      conversionRate: number
      budgetUtilization: number
    }
    recommendations: string[]
    benchmarkComparison: {
      roas: number
      ctr: number
      cpc: number
      conversionRate: number
    }
  }
  campaigns: any[]
  adsets: any[]
  ads: any[]
  insights: {
    topPerformers: {
      campaigns: any[]
      adsets: any[]
      ads: any[]
    }
    bottomPerformers: {
      campaigns: any[]
      adsets: any[]
      ads: any[]
    }
    averages: any
  }
}

export function AccountManagementScore({
  accessToken,
  accountId,
  datePreset,
  campaigns = [],
  overviewData
}: AccountManagementScoreProps) {
  const [scoreData, setScoreData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCampaigns, setExpandedCampaigns] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [showAllCampaigns, setShowAllCampaigns] = useState(false)

  useEffect(() => {
    if (campaigns && campaigns.length > 0) {
      calculateScoresLocally()
    } else {
      fetchScoreData()
    }
  }, [accessToken, accountId, datePreset, campaigns])

  const calculateScoresLocally = () => {
    setLoading(true)
    setError(null)
    
    try {
      const BENCHMARKS = {
        roas: 3.0,
        ctr: 2.0,
        cpc: 1.0,
        conversionRate: 2.5
      }
      
      const WEIGHTS = {
        roas: 0.30,
        ctr: 0.20,
        cpc: 0.20,
        conversionRate: 0.20,
        budgetUtilization: 0.10
      }
      
      // Score calculation helper
      const scoreMetric = (value: number, benchmark: number, direction: 'higher' | 'lower'): number => {
        if (benchmark === 0) return 50
        const ratio = value / benchmark
        
        if (direction === 'higher') {
          if (ratio >= 2) return 100
          if (ratio >= 1.5) return 90
          if (ratio >= 1.2) return 80
          if (ratio >= 1) return 70
          if (ratio >= 0.8) return 60
          if (ratio >= 0.6) return 40
          return 20
        } else {
          if (ratio <= 0.5) return 100
          if (ratio <= 0.7) return 90
          if (ratio <= 0.85) return 80
          if (ratio <= 1) return 70
          if (ratio <= 1.2) return 60
          if (ratio <= 1.5) return 40
          return 20
        }
      }
      
      // Score each campaign
      const scoredCampaigns = campaigns.map(campaign => {
        const roas = campaign.roas || 0
        const ctr = campaign.ctr || 0
        const cpc = campaign.cpc || 0
        const conversionRate = campaign.clicks > 0 ? (campaign.conversions / campaign.clicks) * 100 : 0
        const budgetUtilization = 80 // Default for now
        
        const scores = {
          roas: scoreMetric(roas, BENCHMARKS.roas, 'higher'),
          ctr: scoreMetric(ctr, BENCHMARKS.ctr, 'higher'),
          cpc: scoreMetric(cpc, BENCHMARKS.cpc, 'lower'),
          conversionRate: scoreMetric(conversionRate, BENCHMARKS.conversionRate, 'higher'),
          budgetUtilization
        }
        
        const totalScore = 
          scores.roas * WEIGHTS.roas +
          scores.ctr * WEIGHTS.ctr +
          scores.cpc * WEIGHTS.cpc +
          scores.conversionRate * WEIGHTS.conversionRate +
          scores.budgetUtilization * WEIGHTS.budgetUtilization
        
        const recommendations: string[] = []
        if (scores.roas < 50) {
          if (roas < 1) {
            recommendations.push("Critical: Campaign is not profitable. Consider pausing and restructuring targeting.")
          } else {
            recommendations.push("Improve ROAS by refining audience targeting and testing new creatives.")
          }
        }
        if (scores.ctr < 50) {
          recommendations.push("Low CTR indicates poor ad relevance. Test new ad copy and visuals.")
        }
        if (scores.cpc < 50) {
          recommendations.push("High CPC detected. Consider adjusting bidding strategy or improving Quality Score.")
        }
        
        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          score: Math.round(totalScore),
          metrics: {
            spend: campaign.spend || 0,
            revenue: campaign.revenue || 0,
            roas,
            ctr,
            cpc,
            conversionRate,
            conversions: campaign.conversions || 0,
            impressions: campaign.impressions || 0,
            clicks: campaign.clicks || 0,
            scores
          },
          recommendations,
          adsetCount: campaign.adsets_count || 0,
          adCount: 0,
          adsetScores: [],
          adScores: []
        }
      })
      
      // Calculate account score
      const accountScore = overviewData ? {
        roas: scoreMetric(overviewData.overallROAS, BENCHMARKS.roas, 'higher'),
        ctr: scoreMetric(overviewData.avgCTR, BENCHMARKS.ctr, 'higher'),
        cpc: scoreMetric(overviewData.avgCPC, BENCHMARKS.cpc, 'lower'),
        conversionRate: scoreMetric(
          overviewData.totalClicks > 0 ? (overviewData.totalConversions / overviewData.totalClicks) * 100 : 0,
          BENCHMARKS.conversionRate, 
          'higher'
        ),
        budgetUtilization: 80
      } : {
        roas: 50,
        ctr: 50,
        cpc: 50,
        conversionRate: 50,
        budgetUtilization: 50
      }
      
      const totalAccountScore = 
        accountScore.roas * WEIGHTS.roas +
        accountScore.ctr * WEIGHTS.ctr +
        accountScore.cpc * WEIGHTS.cpc +
        accountScore.conversionRate * WEIGHTS.conversionRate +
        accountScore.budgetUtilization * WEIGHTS.budgetUtilization
      
      const accountRecommendations: string[] = []
      if (totalAccountScore < 50) {
        accountRecommendations.push("Account performance below average. Comprehensive optimization needed.")
      }
      if (overviewData?.overallROAS < BENCHMARKS.roas) {
        accountRecommendations.push(`Account ROAS (${overviewData.overallROAS.toFixed(2)}x) below benchmark (${BENCHMARKS.roas}x).`)
      }
      
      // Sort campaigns for top/bottom performers
      const sortedCampaigns = [...scoredCampaigns].sort((a, b) => b.score - a.score)
      
      // Create the score data structure
      const data: ScoreData = {
        account: {
          score: Math.round(totalAccountScore),
          totalSpend: overviewData?.totalSpend || 0,
          totalRevenue: overviewData?.totalRevenue || 0,
          overallROAS: overviewData?.overallROAS || 0,
          breakdown: accountScore,
          recommendations: accountRecommendations,
          benchmarkComparison: {
            roas: ((overviewData?.overallROAS || 0) - BENCHMARKS.roas) / BENCHMARKS.roas * 100,
            ctr: ((overviewData?.avgCTR || 0) - BENCHMARKS.ctr) / BENCHMARKS.ctr * 100,
            cpc: ((overviewData?.avgCPC || 0) - BENCHMARKS.cpc) / BENCHMARKS.cpc * 100,
            conversionRate: ((overviewData?.totalClicks > 0 ? (overviewData.totalConversions / overviewData.totalClicks) * 100 : 0) - BENCHMARKS.conversionRate) / BENCHMARKS.conversionRate * 100
          }
        },
        campaigns: scoredCampaigns,
        adsets: [],
        ads: [],
        insights: {
          topPerformers: {
            campaigns: sortedCampaigns.slice(0, 5),
            adsets: [],
            ads: []
          },
          bottomPerformers: {
            campaigns: sortedCampaigns.slice(-5).reverse(),
            adsets: [],
            ads: []
          },
          averages: {
            roas: overviewData?.overallROAS || 0,
            ctr: overviewData?.avgCTR || 0,
            cpc: overviewData?.avgCPC || 0,
            conversionRate: overviewData?.totalClicks > 0 ? (overviewData.totalConversions / overviewData.totalClicks) * 100 : 0
          }
        },
        datePreset
      }
      
      setScoreData(data)
    } catch (err: any) {
      console.error("Failed to calculate scores:", err)
      setError("Failed to calculate management scores")
    } finally {
      setLoading(false)
    }
  }
  
  const fetchScoreData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await optimizedApiManager.request<ScoreData>(
        "/api/management-score",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken,
            accountId,
            datePreset
          })
        },
        { priority: 2 }
      )

      setScoreData(response)
    } catch (err: any) {
      setError(err.message || "Failed to calculate management score")
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400"
    if (score >= 60) return "text-blue-400"
    if (score >= 40) return "text-yellow-400"
    return "text-red-400"
  }

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-900/70 to-green-800/70"
    if (score >= 60) return "from-blue-900/70 to-blue-800/70"
    if (score >= 40) return "from-yellow-900/70 to-yellow-800/70"
    return "from-red-900/70 to-red-800/70"
  }

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    if (score >= 40) return "outline"
    return "destructive"
  }

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 75) return "text-green-400"
    if (percentile >= 50) return "text-blue-400"
    if (percentile >= 25) return "text-yellow-400"
    return "text-red-400"
  }

  const toggleCampaignExpansion = (campaignId: string) => {
    setExpandedCampaigns(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-700">
        <CardContent className="py-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!scoreData) return null

  const displayedCampaigns = showAllCampaigns 
    ? scoreData.campaigns 
    : scoreData.campaigns.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Account Health Score */}
      <Card className={`bg-gradient-to-br ${getScoreGradient(scoreData.account.score)} border-gray-700`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Account Management Score
              </CardTitle>
              <CardDescription className="mt-1">
                Overall health score for ${formatNumberWithCommas(Math.round(scoreData.account.totalSpend / 1000))}K spend across {scoreData.campaigns.length} campaigns
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchScoreData}
              className="bg-gray-800/50"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-5xl font-bold">
                {scoreData.account.score}
                <span className="text-2xl text-gray-400">/100</span>
              </div>
              <p className="text-sm text-gray-300 mt-1">
                {scoreData.account.score >= 80 ? "Excellent Performance" :
                 scoreData.account.score >= 60 ? "Good Performance" :
                 scoreData.account.score >= 40 ? "Needs Improvement" :
                 "Critical - Immediate Action Required"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Overall ROAS</p>
              <p className={`text-2xl font-bold ${getScoreColor(scoreData.account.breakdown.roas)}`}>
                {scoreData.account.overallROAS.toFixed(2)}x
              </p>
              <p className="text-xs text-gray-500">
                {scoreData.account.benchmarkComparison.roas > 0 ? '+' : ''}
                {scoreData.account.benchmarkComparison.roas.toFixed(1)}% vs benchmark
              </p>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">ROAS Performance (30%)</span>
                <span className="text-sm font-medium">{scoreData.account.breakdown.roas}/100</span>
              </div>
              <Progress value={scoreData.account.breakdown.roas} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">CTR Performance (20%)</span>
                <span className="text-sm font-medium">{scoreData.account.breakdown.ctr}/100</span>
              </div>
              <Progress value={scoreData.account.breakdown.ctr} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">CPC Efficiency (20%)</span>
                <span className="text-sm font-medium">{scoreData.account.breakdown.cpc}/100</span>
              </div>
              <Progress value={scoreData.account.breakdown.cpc} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Conversion Rate (20%)</span>
                <span className="text-sm font-medium">{scoreData.account.breakdown.conversionRate}/100</span>
              </div>
              <Progress value={scoreData.account.breakdown.conversionRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Budget Utilization (10%)</span>
                <span className="text-sm font-medium">{scoreData.account.breakdown.budgetUtilization}/100</span>
              </div>
              <Progress value={scoreData.account.breakdown.budgetUtilization} className="h-2" />
            </div>
          </div>

          {/* Account Recommendations */}
          {scoreData.account.recommendations.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Account-Level Recommendations
              </h4>
              <ul className="space-y-1">
                {scoreData.account.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance vs Benchmarks */}
      <Card className="bg-gray-800/70 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg">Performance vs Industry Benchmarks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">ROAS</p>
              <p className={`text-2xl font-bold ${
                scoreData.account.benchmarkComparison.roas > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {scoreData.account.benchmarkComparison.roas > 0 ? '+' : ''}
                {scoreData.account.benchmarkComparison.roas.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">vs 3.0x benchmark</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">CTR</p>
              <p className={`text-2xl font-bold ${
                scoreData.account.benchmarkComparison.ctr > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {scoreData.account.benchmarkComparison.ctr > 0 ? '+' : ''}
                {scoreData.account.benchmarkComparison.ctr.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">vs 2.0% benchmark</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">CPC</p>
              <p className={`text-2xl font-bold ${
                scoreData.account.benchmarkComparison.cpc < 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {scoreData.account.benchmarkComparison.cpc > 0 ? '+' : ''}
                {scoreData.account.benchmarkComparison.cpc.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">vs $1.00 benchmark</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Conv. Rate</p>
              <p className={`text-2xl font-bold ${
                scoreData.account.benchmarkComparison.conversionRate > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {scoreData.account.benchmarkComparison.conversionRate > 0 ? '+' : ''}
                {scoreData.account.benchmarkComparison.conversionRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">vs 2.5% benchmark</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns, Adsets, and Ads Analysis */}
      <Card className="bg-gray-800/70 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg">Detailed Performance Analysis</CardTitle>
          <CardDescription>
            Campaign scores are aggregated from their adsets and ads performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-gray-700/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="underperformers">Needs Attention</TabsTrigger>
              <TabsTrigger value="topperformers">Top Performers</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-3">Entity Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Campaigns</span>
                      <span className="font-medium">{scoreData.campaigns.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Ad Sets</span>
                      <span className="font-medium">{scoreData.adsets.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Ads</span>
                      <span className="font-medium">{scoreData.ads.length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-3">Score Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Excellent (80+)</span>
                      <span className="font-medium text-green-400">
                        {scoreData.campaigns.filter(c => c.score >= 80).length} campaigns
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Good (60-79)</span>
                      <span className="font-medium text-blue-400">
                        {scoreData.campaigns.filter(c => c.score >= 60 && c.score < 80).length} campaigns
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Poor (&lt;60)</span>
                      <span className="font-medium text-red-400">
                        {scoreData.campaigns.filter(c => c.score < 60).length} campaigns
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-3">Account Averages</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Avg ROAS</span>
                      <span className="font-medium">{scoreData.insights.averages.roas.toFixed(2)}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Avg CTR</span>
                      <span className="font-medium">{scoreData.insights.averages.ctr.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Avg CPC</span>
                      <span className="font-medium">{formatCurrency(scoreData.insights.averages.cpc)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-2">
              <div className="mb-2 text-sm text-gray-400">
                Showing {displayedCampaigns.length} of {scoreData.campaigns.length} campaigns
              </div>
              
              {displayedCampaigns.map((campaign) => (
                <div key={campaign.id} className="border border-gray-700 rounded-lg">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-700/30"
                    onClick={() => toggleCampaignExpansion(campaign.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`text-2xl font-bold ${getScoreColor(campaign.score)}`}>
                          {campaign.score}
                        </div>
                        <div>
                          <h4 className="font-medium">{campaign.name}</h4>
                          <p className="text-xs text-gray-400">
                            {campaign.adsetCount} ad sets • {campaign.adCount} ads
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={getScoreBadgeVariant(campaign.score)}>
                          {campaign.score >= 80 ? "Excellent" :
                           campaign.score >= 60 ? "Good" :
                           campaign.score >= 40 ? "Fair" :
                           "Poor"}
                        </Badge>
                        {expandedCampaigns.includes(campaign.id) ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                        }
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-xs">
                      <div>
                        <span className="text-gray-400">Spend</span>
                        <p className="font-medium">{formatCurrency(campaign.metrics.spend)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">ROAS</span>
                        <p className={`font-medium ${getScoreColor(campaign.metrics.scores.roas)}`}>
                          {campaign.metrics.roas.toFixed(2)}x
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">CTR</span>
                        <p className={`font-medium ${getScoreColor(campaign.metrics.scores.ctr)}`}>
                          {campaign.metrics.ctr.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">CPC</span>
                        <p className={`font-medium ${getScoreColor(campaign.metrics.scores.cpc)}`}>
                          {formatCurrency(campaign.metrics.cpc)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {expandedCampaigns.includes(campaign.id) && (
                    <div className="border-t border-gray-700 p-4 bg-gray-800/30">
                      {/* Score Breakdown */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium mb-2">Score Breakdown</h5>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                          <div className="bg-gray-700/50 p-2 rounded">
                            <span className="text-gray-400">ROAS</span>
                            <p className="font-medium">{campaign.metrics.scores.roas}/100</p>
                          </div>
                          <div className="bg-gray-700/50 p-2 rounded">
                            <span className="text-gray-400">CTR</span>
                            <p className="font-medium">{campaign.metrics.scores.ctr}/100</p>
                          </div>
                          <div className="bg-gray-700/50 p-2 rounded">
                            <span className="text-gray-400">CPC</span>
                            <p className="font-medium">{campaign.metrics.scores.cpc}/100</p>
                          </div>
                          <div className="bg-gray-700/50 p-2 rounded">
                            <span className="text-gray-400">Conv Rate</span>
                            <p className="font-medium">{campaign.metrics.scores.conversionRate}/100</p>
                          </div>
                          <div className="bg-gray-700/50 p-2 rounded">
                            <span className="text-gray-400">Budget Use</span>
                            <p className="font-medium">{campaign.metrics.scores.budgetUtilization}/100</p>
                          </div>
                        </div>
                      </div>

                      {/* Recommendations */}
                      {campaign.recommendations.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                            Recommendations
                          </h5>
                          <ul className="space-y-1">
                            {campaign.recommendations.map((rec: string, idx: number) => (
                              <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                                <span className="text-yellow-400 mt-0.5">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Adset Scores */}
                      {campaign.adsetScores.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium mb-2">Ad Set Scores</h5>
                          <div className="space-y-1">
                            {campaign.adsetScores.map((adset: any) => (
                              <div key={adset.id} className="flex items-center justify-between text-xs bg-gray-700/30 p-2 rounded">
                                <span className="text-gray-300">{adset.name}</span>
                                <span className={`font-medium ${getScoreColor(adset.score)}`}>
                                  Score: {adset.score}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ad Scores Summary */}
                      {campaign.adScores.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-2">Ad Performance Summary</h5>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-gray-700/30 p-2 rounded text-center">
                              <p className="text-gray-400">Best Ad</p>
                              <p className="font-medium text-green-400">
                                {Math.max(...campaign.adScores.map((a: any) => a.score))}
                              </p>
                            </div>
                            <div className="bg-gray-700/30 p-2 rounded text-center">
                              <p className="text-gray-400">Average</p>
                              <p className="font-medium">
                                {Math.round(campaign.adScores.reduce((sum: number, a: any) => sum + a.score, 0) / campaign.adScores.length)}
                              </p>
                            </div>
                            <div className="bg-gray-700/30 p-2 rounded text-center">
                              <p className="text-gray-400">Worst Ad</p>
                              <p className="font-medium text-red-400">
                                {Math.min(...campaign.adScores.map((a: any) => a.score))}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {!showAllCampaigns && scoreData.campaigns.length > 5 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAllCampaigns(true)}
                >
                  Show All {scoreData.campaigns.length} Campaigns
                </Button>
              )}
            </TabsContent>

            {/* Underperformers Tab */}
            <TabsContent value="underperformers" className="space-y-4">
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-300">Critical Attention Required</h4>
                    <p className="text-sm text-red-300/80 mt-1">
                      These campaigns, ad sets, and ads are significantly underperforming and need immediate optimization.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Campaigns */}
              <div>
                <h4 className="text-sm font-medium mb-3">Worst Performing Campaigns</h4>
                <div className="space-y-2">
                  {scoreData.insights.bottomPerformers.campaigns.map((campaign) => (
                    <div key={campaign.id} className="bg-gray-700/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-gray-400">Score: {campaign.score}/100</p>
                        </div>
                        <Badge variant="destructive">Critical</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">ROAS</span>
                          <p className="font-medium text-red-400">{campaign.metrics.roas.toFixed(2)}x</p>
                        </div>
                        <div>
                          <span className="text-gray-400">CTR</span>
                          <p className="font-medium">{campaign.metrics.ctr.toFixed(2)}%</p>
                        </div>
                        <div>
                          <span className="text-gray-400">CPC</span>
                          <p className="font-medium">{formatCurrency(campaign.metrics.cpc)}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Spend</span>
                          <p className="font-medium">{formatCurrency(campaign.metrics.spend)}</p>
                        </div>
                      </div>
                      {campaign.recommendations.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <p className="text-xs text-yellow-400">{campaign.recommendations[0]}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Ad Sets */}
              <div>
                <h4 className="text-sm font-medium mb-3">Worst Performing Ad Sets</h4>
                <div className="space-y-2">
                  {scoreData.insights.bottomPerformers.adsets.slice(0, 3).map((adset) => (
                    <div key={adset.id} className="bg-gray-700/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{adset.name}</p>
                          <p className="text-xs text-gray-400">
                            Campaign: {adset.campaignName} • Score: {adset.score}/100
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">ROAS</p>
                          <p className="font-medium text-red-400">{adset.metrics.roas.toFixed(2)}x</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Ads */}
              <div>
                <h4 className="text-sm font-medium mb-3">Worst Performing Ads</h4>
                <div className="space-y-2">
                  {scoreData.insights.bottomPerformers.ads.slice(0, 3).map((ad) => (
                    <div key={ad.id} className="bg-gray-700/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{ad.name}</p>
                          <p className="text-xs text-gray-400">
                            Percentile: Bottom {100 - ad.percentileRank}% • Score: {ad.score}/100
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">vs Account Avg</p>
                          <p className="font-medium text-red-400">
                            {ad.comparisonToAverage.roas.toFixed(0)}% ROAS
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Top Performers Tab */}
            <TabsContent value="topperformers" className="space-y-4">
              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-300">Top Performers to Replicate</h4>
                    <p className="text-sm text-green-300/80 mt-1">
                      Study these high-performing campaigns, ad sets, and ads to replicate their success across your account.
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Campaigns */}
              <div>
                <h4 className="text-sm font-medium mb-3">Best Performing Campaigns</h4>
                <div className="space-y-2">
                  {scoreData.insights.topPerformers.campaigns.map((campaign) => (
                    <div key={campaign.id} className="bg-gray-700/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-gray-400">Score: {campaign.score}/100</p>
                        </div>
                        <Badge variant="default">Excellent</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">ROAS</span>
                          <p className="font-medium text-green-400">{campaign.metrics.roas.toFixed(2)}x</p>
                        </div>
                        <div>
                          <span className="text-gray-400">CTR</span>
                          <p className="font-medium text-green-400">{campaign.metrics.ctr.toFixed(2)}%</p>
                        </div>
                        <div>
                          <span className="text-gray-400">CPC</span>
                          <p className="font-medium text-green-400">{formatCurrency(campaign.metrics.cpc)}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Revenue</span>
                          <p className="font-medium">{formatCurrency(campaign.metrics.revenue)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Ad Sets */}
              <div>
                <h4 className="text-sm font-medium mb-3">Best Performing Ad Sets</h4>
                <div className="space-y-2">
                  {scoreData.insights.topPerformers.adsets.slice(0, 3).map((adset) => (
                    <div key={adset.id} className="bg-gray-700/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{adset.name}</p>
                          <p className="text-xs text-gray-400">
                            Campaign: {adset.campaignName} • Score: {adset.score}/100
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">ROAS</p>
                          <p className="font-medium text-green-400">{adset.metrics.roas.toFixed(2)}x</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Ads */}
              <div>
                <h4 className="text-sm font-medium mb-3">Best Performing Ads</h4>
                <div className="space-y-2">
                  {scoreData.insights.topPerformers.ads.slice(0, 3).map((ad) => (
                    <div key={ad.id} className="bg-gray-700/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{ad.name}</p>
                          <p className="text-xs text-gray-400">
                            Percentile: Top {ad.percentileRank}% • Score: {ad.score}/100
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">vs Account Avg</p>
                          <p className="font-medium text-green-400">
                            +{ad.comparisonToAverage.roas.toFixed(0)}% ROAS
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}