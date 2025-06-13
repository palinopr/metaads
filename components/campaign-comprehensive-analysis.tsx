"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Image as ImageIcon, 
  Video, 
  DollarSign,
  Users,
  Eye,
  MousePointer,
  Target,
  AlertCircle,
  ChevronRight,
  Filter,
  ArrowUpDown,
  RefreshCw,
  FileText
} from "lucide-react"
import { formatCurrency, formatNumberWithCommas, formatPercentage } from "@/lib/utils"
import { optimizedApiManager } from "@/lib/api-manager-optimized"

interface CampaignAnalysisProps {
  campaignId: string
  campaignName: string
  accessToken: string
  accountId: string
  datePreset: string
}

export function CampaignComprehensiveAnalysis({
  campaignId,
  campaignName,
  accessToken,
  accountId,
  datePreset
}: CampaignAnalysisProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAdset, setSelectedAdset] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'spend' | 'roas' | 'conversions'>('spend')
  const [debuggingAd, setDebuggingAd] = useState<string | null>(null)
  const [debugData, setDebugData] = useState<any>(null)
  const [scoreData, setScoreData] = useState<any>(null)
  const [loadingScore, setLoadingScore] = useState(false)

  useEffect(() => {
    fetchHierarchyData()
    // Don't fetch score data separately - calculate from hierarchy data
  }, [campaignId, datePreset])

  const fetchHierarchyData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await optimizedApiManager.request<any>(
        "/api/campaign-hierarchy",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId,
            accessToken,
            datePreset
          })
        },
        { priority: 2 }
      )

      setData(response)
      if (response.adsets?.length > 0) {
        setSelectedAdset(response.adsets[0].id)
      }
      
      // Calculate scores from the hierarchy data
      const scores = calculateLocalScores(response)
      setScoreData(scores)
      setLoadingScore(false)
    } catch (err: any) {
      setError(err.message || "Failed to load campaign analysis")
    } finally {
      setLoading(false)
    }
  }

  // Calculate scores locally from the data we already have
  const calculateLocalScores = (hierarchyData: any) => {
    if (!hierarchyData) return null
    
    const BENCHMARKS = {
      roas: 3.0,
      ctr: 2.0,
      cpc: 1.0,
      conversionRate: 2.5
    }
    
    // Score calculation for a single entity
    const scoreEntity = (entity: any, averages: any) => {
      const metrics = entity
      
      // Use industry benchmarks instead of account averages for more realistic scoring
      const BENCHMARKS = {
        roas: 3.0,  // 3x ROAS is good
        ctr: 2.0,   // 2% CTR is average
        cpc: 1.0,   // $1 CPC is average
        conversionRate: 2.5  // 2.5% conversion rate is average
      }
      
      // Calculate individual metric scores (0-100) using benchmarks
      const scores = {
        roas: scoreMetric(metrics.roas || 0, BENCHMARKS.roas, 'higher'),
        ctr: scoreMetric(metrics.ctr || 0, BENCHMARKS.ctr, 'higher'),
        cpc: scoreMetric(metrics.cpc || 0, BENCHMARKS.cpc, 'lower'),
        conversionRate: metrics.clicks > 0 ? scoreMetric((metrics.conversions / metrics.clicks) * 100, BENCHMARKS.conversionRate, 'higher') : 50
      }
      
      // Weighted total score (ROAS should be weighted much higher)
      const totalScore = 
        scores.roas * 0.50 +  // ROAS is most important
        scores.ctr * 0.20 +
        scores.cpc * 0.15 +
        scores.conversionRate * 0.15
      
      return Math.round(totalScore)
    }
    
    const scoreMetric = (value: number, benchmark: number, direction: 'higher' | 'lower'): number => {
      if (benchmark === 0) return 50
      
      if (direction === 'higher') {
        // For ROAS, CTR, Conversion Rate - higher is better
        if (value >= benchmark * 2) return 100    // 2x benchmark = 100 points
        if (value >= benchmark * 1.5) return 90   // 1.5x benchmark = 90 points
        if (value >= benchmark * 1.2) return 80   // 1.2x benchmark = 80 points
        if (value >= benchmark) return 70         // Meet benchmark = 70 points
        if (value >= benchmark * 0.8) return 60   // 80% of benchmark = 60 points
        if (value >= benchmark * 0.6) return 50   // 60% of benchmark = 50 points
        if (value >= benchmark * 0.4) return 40   // 40% of benchmark = 40 points
        if (value >= benchmark * 0.2) return 30   // 20% of benchmark = 30 points
        if (value >= benchmark * 0.1) return 20   // 10% of benchmark = 20 points
        return 10  // Less than 10% of benchmark = 10 points
      } else {
        // For CPC - lower is better
        if (value <= benchmark * 0.5) return 100  // Half benchmark = 100 points
        if (value <= benchmark * 0.7) return 90   // 70% of benchmark = 90 points
        if (value <= benchmark * 0.85) return 80  // 85% of benchmark = 80 points
        if (value <= benchmark) return 70         // Meet benchmark = 70 points
        if (value <= benchmark * 1.2) return 60   // 20% above benchmark = 60 points
        if (value <= benchmark * 1.5) return 50   // 50% above benchmark = 50 points
        if (value <= benchmark * 2) return 40     // 2x benchmark = 40 points
        if (value <= benchmark * 3) return 30     // 3x benchmark = 30 points
        if (value <= benchmark * 4) return 20     // 4x benchmark = 20 points
        return 10  // More than 4x benchmark = 10 points
      }
    }
    
    // Calculate averages from all entities
    const allEntities = [...(hierarchyData.adsets || []).flatMap(adset => adset.ads || [])]
    const activeEntities = allEntities.filter(e => e.status === 'ACTIVE' && e.spend > 0)
    
    let averages = BENCHMARKS
    if (activeEntities.length > 0) {
      const totals = activeEntities.reduce((acc, entity) => ({
        spend: acc.spend + entity.spend,
        revenue: acc.revenue + entity.revenue,
        impressions: acc.impressions + entity.impressions,
        clicks: acc.clicks + entity.clicks,
        conversions: acc.conversions + entity.conversions
      }), { spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0 })
      
      averages = {
        roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
        ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
        cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
        conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0
      }
    }
    
    // Score all ads
    const scoredAds = allEntities.map(ad => ({
      id: ad.id,
      score: scoreEntity(ad, averages),
      percentileRank: 0 // Will calculate after scoring all
    }))
    
    // Calculate percentile ranks
    scoredAds.forEach(ad => {
      const betterCount = scoredAds.filter(other => other.score > ad.score).length
      ad.percentileRank = Math.round((betterCount / scoredAds.length) * 100)
    })
    
    // Score adsets based on their ads
    const scoredAdsets = (hierarchyData.adsets || []).map((adset: any) => {
      const adsetAds = adset.ads || []
      const adScores = adsetAds.map((ad: any) => {
        const scoredAd = scoredAds.find(sa => sa.id === ad.id)
        return scoredAd ? scoredAd.score : 50
      })
      
      const adsetScore = adScores.length > 0 
        ? Math.round(adScores.reduce((sum: number, score: number) => sum + score, 0) / adScores.length)
        : scoreEntity(adset, averages)
      
      return {
        id: adset.id,
        score: adsetScore,
        percentileRank: 0
      }
    })
    
    // Calculate campaign score
    const campaignScore = scoredAdsets.length > 0
      ? Math.round(scoredAdsets.reduce((sum, adset) => sum + adset.score, 0) / scoredAdsets.length)
      : 50
    
    return {
      campaigns: [{ id: campaignId, score: campaignScore }],
      adsets: scoredAdsets,
      ads: scoredAds
    }
  }

  const debugAdCreative = async (adId: string) => {
    setDebuggingAd(adId)
    setDebugData(null)
    
    try {
      const response = await optimizedApiManager.request<any>(
        "/api/debug-creative",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adId,
            accessToken
          })
        },
        { priority: 3 }
      )
      
      setDebugData(response)
    } catch (err: any) {
      console.error("Debug creative error:", err)
      setDebugData({ error: err.message })
    }
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

  if (!data) return null

  const selectedAdsetData = data.adsets?.find((a: any) => a.id === selectedAdset)
  
  // Sort adsets based on selected criteria
  const sortedAdsets = [...(data.adsets || [])].sort((a, b) => {
    switch (sortBy) {
      case 'spend': return b.spend - a.spend
      case 'roas': return b.roas - a.roas
      case 'conversions': return b.conversions - a.conversions
      default: return 0
    }
  })

  const getPerformanceColor = (value: number, type: 'roas' | 'ctr' | 'cpc') => {
    switch (type) {
      case 'roas':
        if (value >= 3) return 'text-green-400'
        if (value >= 1.5) return 'text-yellow-400'
        return 'text-red-400'
      case 'ctr':
        if (value >= 2) return 'text-green-400'
        if (value >= 1) return 'text-yellow-400'
        return 'text-red-400'
      case 'cpc':
        if (value <= 0.5) return 'text-green-400'
        if (value <= 1) return 'text-yellow-400'
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  // Helper functions for scoring
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400"
    if (score >= 60) return "text-blue-400"
    if (score >= 40) return "text-yellow-400"
    return "text-red-400"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { text: "Excellent", color: "bg-green-500/20 text-green-300 border-green-500/30" }
    if (score >= 60) return { text: "Good", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" }
    if (score >= 40) return { text: "Fair", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" }
    return { text: "Poor", color: "bg-red-500/20 text-red-300 border-red-500/30" }
  }

  // Get current campaign score data
  const currentCampaignScore = scoreData?.campaigns?.find((c: any) => c.id === campaignId)
  const campaignRank = currentCampaignScore && scoreData?.campaigns ? 
    scoreData.campaigns.filter((c: any) => c.score > currentCampaignScore.score).length + 1 : null

  return (
    <div className="space-y-6">
      {/* Campaign Score Alert if Underperforming */}
      {currentCampaignScore && currentCampaignScore.score < 40 && (
        <Alert className="bg-red-900/20 border-red-700">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Low Performance Score: {currentCampaignScore.score}/100</AlertTitle>
          <AlertDescription>
            <div className="mt-2">
              <p className="mb-2">This campaign ranks #{campaignRank} out of {scoreData.campaigns.length} campaigns and needs immediate attention.</p>
              {currentCampaignScore.recommendations && currentCampaignScore.recommendations.length > 0 && (
                <ul className="list-disc list-inside space-y-1">
                  {currentCampaignScore.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm">{rec}</li>
                  ))}
                </ul>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Campaign Overview with Score */}
      <Card className="bg-gray-800/70 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Campaign Overview
              </CardTitle>
              <CardDescription>
                Performance across {data.campaign?.adsets || 0} ad sets and {data.campaign?.ads || 0} ads
              </CardDescription>
            </div>
            {currentCampaignScore && (
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <div className={`text-3xl font-bold ${getScoreColor(currentCampaignScore.score)}`}>
                    {currentCampaignScore.score}
                  </div>
                  <div>
                    <Badge className={`${getScoreBadge(currentCampaignScore.score).color} border`}>
                      {getScoreBadge(currentCampaignScore.score).text}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">
                      Rank #{campaignRank} of {scoreData.campaigns.length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Total Spend</p>
              <p className="text-xl font-bold">{formatCurrency(data.campaign?.spend || 0)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Revenue</p>
              <p className="text-xl font-bold">{formatCurrency(data.campaign?.revenue || 0)}</p>
              <p className={`text-sm ${getPerformanceColor(data.campaign?.roas || 0, 'roas')}`}>
                {(data.campaign?.roas || 0).toFixed(2)}x ROAS
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Conversions</p>
              <p className="text-xl font-bold">{formatNumberWithCommas(data.campaign?.conversions || 0)}</p>
              <p className="text-sm text-gray-500">
                {data.campaign?.spend > 0 
                  ? formatCurrency((data.campaign.spend / data.campaign.conversions) || 0) + ' CPA'
                  : '-'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Engagement</p>
              <p className="text-xl font-bold">{formatNumberWithCommas(data.campaign?.clicks || 0)}</p>
              <p className={`text-sm ${getPerformanceColor(data.campaign?.ctr || 0, 'ctr')}`}>
                {(data.campaign?.ctr || 0).toFixed(2)}% CTR
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Performing Ad Copy */}
      {data.creativeAnalysis?.topPerformingAds?.length > 0 && 
       data.creativeAnalysis.topPerformingAds[0].caption && (
        <Card className="bg-gradient-to-r from-green-900/20 to-green-800/20 border-green-700/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-400" />
              Best Converting Ad Copy
            </CardTitle>
            <CardDescription>
              From "{data.creativeAnalysis.topPerformingAds[0].name}" - {data.creativeAnalysis.topPerformingAds[0].roas.toFixed(2)}x ROAS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-800/50 rounded-lg border border-green-700/30">
              <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                {data.creativeAnalysis.topPerformingAds[0].caption}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className="text-gray-400">
                <Target className="w-3 h-3 inline mr-1" />
                {data.creativeAnalysis.topPerformingAds[0].conversions} conversions
              </span>
              <span className="text-gray-400">
                <DollarSign className="w-3 h-3 inline mr-1" />
                {formatCurrency(data.creativeAnalysis.topPerformingAds[0].revenue)} revenue
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Creative Performance */}
      <Card className="bg-gray-800/70 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Creative Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Performance */}
            <div className="p-4 bg-gray-700/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">Image Ads</span>
                </div>
                <Badge variant="secondary">
                  {data.creativeAnalysis?.byType.image.count || 0} ads
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Spend:</span>
                  <span>{formatCurrency(data.creativeAnalysis?.byType.image.spend || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Conversions:</span>
                  <span>{data.creativeAnalysis?.byType.image.conversions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ROAS:</span>
                  <span className={getPerformanceColor(
                    data.creativeAnalysis?.byType.image.spend > 0 
                      ? (data.creativeAnalysis.byType.image.revenue / data.creativeAnalysis.byType.image.spend)
                      : 0, 
                    'roas'
                  )}>
                    {data.creativeAnalysis?.byType.image.spend > 0 
                      ? ((data.creativeAnalysis.byType.image.revenue / data.creativeAnalysis.byType.image.spend).toFixed(2) + 'x')
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Video Performance */}
            <div className="p-4 bg-gray-700/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-400" />
                  <span className="font-medium">Video Ads</span>
                </div>
                <Badge variant="secondary">
                  {data.creativeAnalysis?.byType.video.count || 0} ads
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Spend:</span>
                  <span>{formatCurrency(data.creativeAnalysis?.byType.video.spend || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Conversions:</span>
                  <span>{data.creativeAnalysis?.byType.video.conversions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ROAS:</span>
                  <span className={getPerformanceColor(
                    data.creativeAnalysis?.byType.video.spend > 0 
                      ? (data.creativeAnalysis.byType.video.revenue / data.creativeAnalysis.byType.video.spend)
                      : 0, 
                    'roas'
                  )}>
                    {data.creativeAnalysis?.byType.video.spend > 0 
                      ? ((data.creativeAnalysis.byType.video.revenue / data.creativeAnalysis.byType.video.spend).toFixed(2) + 'x')
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Note about unknown or assumed creatives */}
          {(data.creativeAnalysis?.byType.unknown.count > 0 || data.creativeAnalysis?.assumedTypes > 0) && (
            <div className="mt-2 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <p className="text-xs text-yellow-400">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                {data.creativeAnalysis.byType.unknown.count > 0 && (
                  <>Note: {data.creativeAnalysis.byType.unknown.count} ad{data.creativeAnalysis.byType.unknown.count > 1 ? 's' : ''} could not be categorized. </>
                )}
                {data.creativeAnalysis.assumedTypes > 0 && (
                  <>{data.creativeAnalysis.assumedTypes} ad{data.creativeAnalysis.assumedTypes > 1 ? 's' : ''} assumed to be image ads based on performance data. </>
                )}
                Creative data may be limited due to API restrictions.
              </p>
            </div>
          )}

          {/* Top Performing Ads */}
          {data.creativeAnalysis?.topPerformingAds?.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-3 text-gray-300">Top Performing Ads</h4>
              <div className="space-y-2">
                {data.creativeAnalysis.topPerformingAds.slice(0, 3).map((ad: any, idx: number) => (
                  <div key={ad.id} className="p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-lg font-bold text-gray-500">#{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{ad.name}</p>
                          {ad.creativeType === 'video' ? (
                            <Video className="w-3 h-3 text-purple-400" />
                          ) : (
                            <ImageIcon className="w-3 h-3 text-blue-400" />
                          )}
                        </div>
                        <div className="bg-gray-800/50 p-2 rounded mb-2">
                          <p className="text-xs font-medium text-gray-300 mb-1">Ad Copy:</p>
                          <p className="text-xs text-gray-400 whitespace-pre-wrap">
                            {ad.caption || <span className="italic text-gray-500">No caption available</span>}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">in {ad.adsetName}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getPerformanceColor(ad.roas, 'roas')}`}>
                          {ad.roas.toFixed(2)}x
                        </p>
                        <p className="text-xs text-gray-400">{formatCurrency(ad.revenue)}</p>
                        <p className="text-xs text-gray-500">{ad.conversions} conv.</p>
                      </div>
                    </div>
                    {/* Engagement stats for top ads */}
                    <div className="mt-2 pt-2 border-t border-gray-700/50 grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Impressions</span>
                        <p className="text-gray-300">{formatNumberWithCommas(ad.impressions || 0)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Clicks</span>
                        <p className="text-gray-300">{formatNumberWithCommas(ad.clicks || 0)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">CTR</span>
                        <p className={`${getPerformanceColor(ad.ctr || 0, 'ctr')}`}>
                          {(ad.ctr || 0).toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">CPC</span>
                        <p className={`${getPerformanceColor(ad.cpc || 0, 'cpc')}`}>
                          {formatCurrency(ad.cpc || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement Analysis by Copy with Scores */}
      {(() => {
        // Group ads by caption
        const adsByCopy = new Map()
        data.adsets?.forEach((adset: any) => {
          adset.ads?.forEach((ad: any) => {
            if (ad.caption) {
              const key = ad.caption.substring(0, 50) // Use first 50 chars as key
              if (!adsByCopy.has(key)) {
                adsByCopy.set(key, { caption: ad.caption, ads: [] })
              }
              const adScore = scoreData?.ads?.find((a: any) => a.id === ad.id)
              adsByCopy.get(key).ads.push({ 
                ...ad, 
                adsetName: adset.name,
                score: adScore?.score || 0,
                percentileRank: adScore?.percentileRank || 0,
                comparisonToAverage: adScore?.comparisonToAverage || {}
              })
            }
          })
        })

        // Only show if there are ads with the same copy
        const hasMultipleAdsPerCopy = Array.from(adsByCopy.values()).some(group => group.ads.length > 1)
        
        if (hasMultipleAdsPerCopy) {
          return (
            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MousePointer className="w-5 h-5" />
                  Engagement & Score Analysis by Copy
                </CardTitle>
                <CardDescription>
                  Compare how the same copy performs across different creative formats with management scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Array.from(adsByCopy.entries()).map(([key, group]) => {
                  if (group.ads.length <= 1) return null
                  
                  return (
                    <div key={key} className="mb-6 last:mb-0">
                      <div className="mb-3 p-3 bg-gray-700/30 rounded">
                        <p className="text-sm text-gray-300 line-clamp-2">{group.caption}</p>
                      </div>
                      <div className="space-y-2">
                        {group.ads.sort((a: any, b: any) => b.score - a.score).map((ad: any) => (
                          <div key={ad.id} className="flex items-center justify-between p-2 bg-gray-700/20 rounded">
                            <div className="flex items-center gap-3">
                              {ad.creativeType === 'video' ? (
                                <Video className="w-4 h-4 text-purple-400" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-blue-400" />
                              )}
                              <div>
                                <p className="text-sm font-medium">{ad.name}</p>
                                <p className="text-xs text-gray-500">in {ad.adsetName}</p>
                                {ad.score > 0 && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs font-bold ${getScoreColor(ad.score)}`}>
                                      Score: {ad.score}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      Top {ad.percentileRank}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-5 gap-4 text-xs text-right">
                              <div>
                                <p className="text-gray-500">Impr.</p>
                                <p className="font-medium">{formatNumberWithCommas(ad.impressions || 0)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Clicks</p>
                                <p className="font-medium">{formatNumberWithCommas(ad.clicks || 0)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">CTR</p>
                                <p className={`font-medium ${getPerformanceColor(ad.ctr || 0, 'ctr')}`}>
                                  {(ad.ctr || 0).toFixed(2)}%
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">CPC</p>
                                <p className={`font-medium ${getPerformanceColor(ad.cpc || 0, 'cpc')}`}>
                                  {formatCurrency(ad.cpc || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">ROAS</p>
                                <p className={`font-medium ${getPerformanceColor(ad.roas, 'roas')}`}>
                                  {ad.roas.toFixed(2)}x
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        }
        return null
      })()}

      {/* Caption availability notice */}
      {data.adsets?.some((adset: any) => 
        adset.ads?.some((ad: any) => !ad.caption)
      ) && (
        <Card className="bg-blue-900/20 border-blue-700/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
              <div className="text-xs text-blue-300">
                <p className="font-medium mb-1">Why are some ad captions not showing?</p>
                <ul className="space-y-1 text-blue-300/80">
                  <li>• Dynamic creative ads assemble text at delivery time</li>
                  <li>• Catalog ads pull product descriptions dynamically</li>
                  <li>• Some ad formats store text in proprietary fields</li>
                  <li>• API permissions may limit creative data access</li>
                </ul>
                <p className="mt-2">Use the "Debug Creative" button to fetch additional data for specific ads.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ad Sets Comparison */}
      <Card className="bg-gray-800/70 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Ad Sets Performance</CardTitle>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md"
            >
              <option value="spend">Sort by Spend</option>
              <option value="roas">Sort by ROAS</option>
              <option value="conversions">Sort by Conversions</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedAdset || ''} onValueChange={setSelectedAdset}>
            <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 h-auto p-1 bg-gray-700/50">
              {sortedAdsets.map((adset: any) => {
                const adsetScore = scoreData?.adsets?.find((a: any) => a.id === adset.id)
                return (
                  <TabsTrigger 
                    key={adset.id} 
                    value={adset.id}
                    className="flex flex-col items-start p-3 h-auto data-[state=active]:bg-gray-600 relative"
                  >
                    {adsetScore && (
                      <div className={`absolute top-1 right-1 text-xs font-bold ${getScoreColor(adsetScore.score)}`}>
                        {adsetScore.score}
                      </div>
                    )}
                    <span className="text-xs font-medium truncate w-full pr-6">{adset.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{formatCurrency(adset.spend)}</span>
                      <span className={`text-xs ${getPerformanceColor(adset.roas, 'roas')}`}>
                        {adset.roas.toFixed(1)}x
                      </span>
                    </div>
                    {adsetScore && adsetScore.percentileRank && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        Top {adsetScore.percentileRank}%
                      </div>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {selectedAdsetData && (
              <TabsContent value={selectedAdset!} className="mt-4 space-y-4">
                {/* Ad Set Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 bg-gray-700/30 rounded-lg">
                    <p className="text-xs text-gray-400">Spend</p>
                    <p className="text-lg font-bold">{formatCurrency(selectedAdsetData.spend)}</p>
                  </div>
                  <div className="p-3 bg-gray-700/30 rounded-lg">
                    <p className="text-xs text-gray-400">Revenue</p>
                    <p className="text-lg font-bold">{formatCurrency(selectedAdsetData.revenue)}</p>
                  </div>
                  <div className="p-3 bg-gray-700/30 rounded-lg">
                    <p className="text-xs text-gray-400">Conversions</p>
                    <p className="text-lg font-bold">{selectedAdsetData.conversions}</p>
                  </div>
                  <div className="p-3 bg-gray-700/30 rounded-lg">
                    <p className="text-xs text-gray-400">ROAS</p>
                    <p className={`text-lg font-bold ${getPerformanceColor(selectedAdsetData.roas, 'roas')}`}>
                      {selectedAdsetData.roas.toFixed(2)}x
                    </p>
                  </div>
                </div>

                {/* Ads in this Ad Set */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Ads Performance ({selectedAdsetData.ads?.length || 0} ads)</h4>
                  <div className="space-y-2">
                    {(selectedAdsetData.ads || []).map((ad: any) => {
                      const adScore = scoreData?.ads?.find((a: any) => a.id === ad.id)
                      return (
                        <div key={ad.id} className="p-3 bg-gray-700/30 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {ad.creativeType === 'video' ? (
                                <Video className="w-4 h-4 text-purple-400" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-blue-400" />
                              )}
                              <p className="font-medium text-sm">{ad.name}</p>
                              <Badge 
                                variant={ad.status === 'ACTIVE' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {ad.status}
                              </Badge>
                              {adScore && (
                                <>
                                  <div className={`text-lg font-bold ${getScoreColor(adScore.score)}`}>
                                    {adScore.score}
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    #{scoreData.ads.filter((a: any) => a.score > adScore.score).length + 1} of {scoreData.ads.length} ads
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="mt-2 p-2 bg-gray-800/50 rounded">
                              <div className="flex items-start justify-between mb-1">
                                <p className="text-xs font-medium text-gray-300">Ad Copy:</p>
                                {!ad.caption && (
                                  <button
                                    onClick={() => debugAdCreative(ad.id)}
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    disabled={debuggingAd === ad.id}
                                  >
                                    {debuggingAd === ad.id ? (
                                      <>
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        Checking...
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="w-3 h-3" />
                                        Debug Creative
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 whitespace-pre-wrap line-clamp-3">
                                {ad.caption || <span className="italic text-gray-500">No caption available - check ad creative in Meta Ads Manager</span>}
                              </p>
                              {debuggingAd === ad.id && debugData && (
                                <div className="mt-2 p-2 bg-gray-900/50 rounded text-xs">
                                  {debugData.error ? (
                                    <p className="text-red-400">Error: {debugData.error}</p>
                                  ) : (
                                    <>
                                      {debugData.creativeInfo?.caption && (
                                        <div className="mb-2">
                                          <p className="text-green-400 font-medium">Found caption:</p>
                                          <p className="text-gray-300 mt-1">{debugData.creativeInfo.caption}</p>
                                        </div>
                                      )}
                                      <details className="cursor-pointer">
                                        <summary className="text-gray-400 hover:text-gray-300">View debug info</summary>
                                        <pre className="mt-1 text-gray-500 overflow-auto text-xs">
                                          {JSON.stringify(debugData.creativeInfo?.debug || {}, null, 2)}
                                        </pre>
                                      </details>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {ad.mediaUrl && (
                            <img 
                              src={ad.mediaUrl} 
                              alt="Ad preview"
                              className="w-16 h-16 object-cover rounded ml-3"
                            />
                          )}
                        </div>
                        
                        {/* Financial metrics */}
                        <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                          <div>
                            <span className="text-gray-500">Spend</span>
                            <p className="font-medium">{formatCurrency(ad.spend)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Revenue</span>
                            <p className="font-medium">{formatCurrency(ad.revenue)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Conv.</span>
                            <p className="font-medium">{ad.conversions}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">ROAS</span>
                            <p className={`font-medium ${getPerformanceColor(ad.roas, 'roas')}`}>
                              {ad.roas.toFixed(2)}x
                            </p>
                          </div>
                        </div>

                        {/* Engagement metrics */}
                        <div className="grid grid-cols-4 gap-2 text-xs p-2 bg-gray-800/30 rounded">
                          <div>
                            <span className="text-gray-500">Impressions</span>
                            <p className="font-medium">{formatNumberWithCommas(ad.impressions || 0)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Clicks</span>
                            <p className="font-medium">{formatNumberWithCommas(ad.clicks || 0)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">CTR</span>
                            <p className={`font-medium ${getPerformanceColor(ad.ctr || 0, 'ctr')}`}>
                              {(ad.ctr || 0).toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">CPC</span>
                            <p className={`font-medium ${getPerformanceColor(ad.cpc || 0, 'cpc')}`}>
                              {formatCurrency(ad.cpc || 0)}
                            </p>
                          </div>
                        </div>

                        {/* Performance bar */}
                        <div className="mt-2">
                          <Progress 
                            value={Math.min((ad.roas / 5) * 100, 100)} 
                            className="h-1"
                          />
                        </div>
                      </div>
                    )})}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}