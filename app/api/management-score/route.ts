import { NextResponse } from "next/server"
import { railwayFetch } from "@/lib/railway-fetch-fix"

// Industry benchmarks for scoring
const BENCHMARKS = {
  roas: 3.0,        // 3x ROAS is considered good
  ctr: 2.0,         // 2% CTR is industry average
  cpc: 1.0,         // $1 CPC is average
  conversionRate: 2.5, // 2.5% conversion rate
  budgetUtilization: 0.8 // 80% budget utilization
}

// Scoring weights
const WEIGHTS = {
  roas: 0.30,
  ctr: 0.20,
  cpc: 0.20,
  conversionRate: 0.20,
  budgetUtilization: 0.10
}

interface MetricData {
  spend: number
  revenue: number
  impressions: number
  clicks: number
  conversions: number
  budgetAllocated?: number
  roas?: number
  ctr?: number
  cpc?: number
  conversionRate?: number
}

interface ScoredEntity {
  id: string
  name: string
  score: number
  metrics: MetricData & {
    scores: {
      roas: number
      ctr: number
      cpc: number
      conversionRate: number
      budgetUtilization: number
    }
  }
  recommendations: string[]
  status?: string
  percentileRank?: number
  comparisonToAverage?: {
    roas: number
    ctr: number
    cpc: number
    conversionRate: number
  }
}

export async function POST(request: Request) {
  try {
    const { accessToken, accountId, datePreset = "last_30d" } = await request.json()

    if (!accessToken || !accountId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Don't clean the token - use as-is like direct-campaigns API
    // const cleanToken = accessToken.replace(/^Bearer\s+/i, '')
    
    // Map date presets
    const datePresetMap: { [key: string]: string } = {
      'today': 'today',
      'yesterday': 'yesterday',
      'last_7d': 'last_7_d',
      'last_14d': 'last_14_d',
      'last_28d': 'last_28_d',
      'last_30d': 'last_30_d',
      'last_90d': 'last_90_d',
      'lifetime': 'maximum'
    }
    const metaDatePreset = datePresetMap[datePreset] || datePreset

    // Fetch campaigns first
    const campaignsUrl = `https://graph.facebook.com/v19.0/${accountId}/campaigns?` +
      `fields=id,name,status,objective,daily_budget,lifetime_budget,` +
      `insights.date_preset(${metaDatePreset}){spend,impressions,clicks,ctr,cpc,actions,action_values}` +
      `&limit=100&access_token=${accessToken}`

    console.log('Fetching campaigns for management score...')
    const campaignsRes = await railwayFetch(campaignsUrl)
    const campaignsData = await campaignsRes.json()

    if (campaignsData.error) {
      console.error('Campaign fetch error:', campaignsData.error)
      throw new Error(campaignsData.error.message)
    }

    // Process campaigns first
    const campaignMap = new Map<string, any>()
    campaignsData.data?.forEach((campaign: any) => {
      // Process campaign metrics
      let campaignMetrics: MetricData = {
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        budgetAllocated: parseFloat(campaign.daily_budget || campaign.lifetime_budget || "0")
      }

      if (campaign.insights?.data?.[0]) {
        const insights = campaign.insights.data[0]
        campaignMetrics.spend = parseFloat(insights.spend || "0")
        campaignMetrics.impressions = parseInt(insights.impressions || "0")
        campaignMetrics.clicks = parseInt(insights.clicks || "0")
        
        // Extract conversions and revenue
        if (insights.actions) {
          insights.actions.forEach((action: any) => {
            if (["purchase", "omni_purchase", "offsite_conversion.fb_pixel_purchase"].includes(action.action_type)) {
              campaignMetrics.conversions += parseInt(action.value || "0")
            }
          })
        }
        if (insights.action_values) {
          insights.action_values.forEach((av: any) => {
            if (["purchase", "omni_purchase", "offsite_conversion.fb_pixel_purchase"].includes(av.action_type)) {
              campaignMetrics.revenue += parseFloat(av.value || "0")
            }
          })
        }
      }

      // Calculate derived metrics
      campaignMetrics.roas = campaignMetrics.spend > 0 ? campaignMetrics.revenue / campaignMetrics.spend : 0
      campaignMetrics.ctr = campaignMetrics.impressions > 0 ? (campaignMetrics.clicks / campaignMetrics.impressions) * 100 : 0
      campaignMetrics.cpc = campaignMetrics.clicks > 0 ? campaignMetrics.spend / campaignMetrics.clicks : 0
      campaignMetrics.conversionRate = campaignMetrics.clicks > 0 ? (campaignMetrics.conversions / campaignMetrics.clicks) * 100 : 0

      campaignMap.set(campaign.id, {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        metrics: campaignMetrics,
        adsets: [],
        ads: []
      })
    })

    // Now fetch adsets for all campaigns
    const allAdsets: any[] = []
    const allAds: any[] = []
    
    console.log(`Processing ${campaignsData.data?.length || 0} campaigns for scoring...`)
    
    // For now, we'll work with campaign-level data only
    // TODO: Add separate API calls to fetch adsets and ads if needed

    // Calculate account-wide averages for comparison using campaigns
    const campaignsArray = Array.from(campaignMap.values())
    const accountAverages = calculateAverages(campaignsArray)

    // Score campaigns against each other
    const scoredCampaigns = campaignsArray.map(campaign => {
      const scoredCampaign = scoreEntity(campaign, accountAverages, campaignsArray)
      
      return {
        ...scoredCampaign,
        adsetCount: 0, // Will be populated when we add adset fetching
        adCount: 0, // Will be populated when we add ad fetching
        adsetScores: [],
        adScores: [],
        recommendations: generateCampaignRecommendations(
          scoredCampaign.score, 
          scoredCampaign.metrics, 
          [], // adsets placeholder
          []  // ads placeholder
        )
      }
    })

    // For now, return empty arrays for adsets and ads
    const scoredAdsets: any[] = []
    const scoredAds: any[] = []

    // Calculate overall account score
    const accountScore = calculateAccountScore(scoredCampaigns, scoredAdsets, scoredAds)

    // Identify top and bottom performers
    const topCampaigns = [...scoredCampaigns].sort((a, b) => b.score - a.score).slice(0, 5)
    const bottomCampaigns = [...scoredCampaigns].sort((a, b) => a.score - b.score).slice(0, 5)
    const topAdsets = [...scoredAdsets].sort((a, b) => b.score - a.score).slice(0, 5)
    const bottomAdsets = [...scoredAdsets].sort((a, b) => a.score - b.score).slice(0, 5)
    const topAds = [...scoredAds].sort((a, b) => b.score - a.score).slice(0, 5)
    const bottomAds = [...scoredAds].sort((a, b) => a.score - b.score).slice(0, 5)

    return NextResponse.json({
      account: {
        score: accountScore.score,
        totalSpend: accountScore.totalSpend,
        totalRevenue: accountScore.totalRevenue,
        overallROAS: accountScore.overallROAS,
        breakdown: accountScore.breakdown,
        recommendations: accountScore.recommendations,
        benchmarkComparison: accountScore.benchmarkComparison
      },
      campaigns: scoredCampaigns,
      adsets: scoredAdsets,
      ads: scoredAds,
      insights: {
        topPerformers: {
          campaigns: topCampaigns,
          adsets: topAdsets,
          ads: topAds
        },
        bottomPerformers: {
          campaigns: bottomCampaigns,
          adsets: bottomAdsets,
          ads: bottomAds
        },
        averages: accountAverages
      },
      datePreset
    })

  } catch (error: any) {
    console.error("Management Score Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to calculate management score" },
      { status: 500 }
    )
  }
}

function processAdsetMetrics(adset: any): any {
  const insights = adset.insights?.data?.[0] || {}
  const metrics: MetricData = {
    spend: parseFloat(insights.spend || "0"),
    impressions: parseInt(insights.impressions || "0"),
    clicks: parseInt(insights.clicks || "0"),
    conversions: 0,
    revenue: 0,
    budgetAllocated: parseFloat(adset.daily_budget || adset.lifetime_budget || "0")
  }

  // Extract conversions and revenue
  if (insights.actions) {
    insights.actions.forEach((action: any) => {
      if (["purchase", "omni_purchase", "offsite_conversion.fb_pixel_purchase"].includes(action.action_type)) {
        metrics.conversions += parseInt(action.value || "0")
      }
    })
  }
  if (insights.action_values) {
    insights.action_values.forEach((av: any) => {
      if (["purchase", "omni_purchase", "offsite_conversion.fb_pixel_purchase"].includes(av.action_type)) {
        metrics.revenue += parseFloat(av.value || "0")
      }
    })
  }

  // Calculate derived metrics
  metrics.roas = metrics.spend > 0 ? metrics.revenue / metrics.spend : 0
  metrics.ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0
  metrics.cpc = metrics.clicks > 0 ? metrics.spend / metrics.clicks : 0
  metrics.conversionRate = metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0

  return {
    id: adset.id,
    name: adset.name,
    status: adset.status,
    metrics
  }
}

function processAdMetrics(ad: any): any {
  const insights = ad.insights?.data?.[0] || {}
  const metrics: MetricData = {
    spend: parseFloat(insights.spend || "0"),
    impressions: parseInt(insights.impressions || "0"),
    clicks: parseInt(insights.clicks || "0"),
    conversions: 0,
    revenue: 0
  }

  // Extract conversions and revenue
  if (insights.actions) {
    insights.actions.forEach((action: any) => {
      if (["purchase", "omni_purchase", "offsite_conversion.fb_pixel_purchase"].includes(action.action_type)) {
        metrics.conversions += parseInt(action.value || "0")
      }
    })
  }
  if (insights.action_values) {
    insights.action_values.forEach((av: any) => {
      if (["purchase", "omni_purchase", "offsite_conversion.fb_pixel_purchase"].includes(av.action_type)) {
        metrics.revenue += parseFloat(av.value || "0")
      }
    })
  }

  // Calculate derived metrics
  metrics.roas = metrics.spend > 0 ? metrics.revenue / metrics.spend : 0
  metrics.ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0
  metrics.cpc = metrics.clicks > 0 ? metrics.spend / metrics.clicks : 0
  metrics.conversionRate = metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0

  return {
    id: ad.id,
    name: ad.name,
    status: ad.status,
    metrics
  }
}

function calculateAverages(entities: any[]): any {
  const activeEntities = entities.filter(e => e.status === 'ACTIVE' && e.metrics.spend > 0)
  if (activeEntities.length === 0) return BENCHMARKS

  const totals = activeEntities.reduce((acc, entity) => ({
    spend: acc.spend + entity.metrics.spend,
    revenue: acc.revenue + entity.metrics.revenue,
    impressions: acc.impressions + entity.metrics.impressions,
    clicks: acc.clicks + entity.metrics.clicks,
    conversions: acc.conversions + entity.metrics.conversions
  }), { spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0 })

  return {
    roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
    ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0
  }
}

function scoreEntity(entity: any, accountAverages: any, allEntities: any[]): ScoredEntity {
  const metrics = entity.metrics
  
  // Calculate individual metric scores (0-100)
  const scores = {
    roas: scoreMetric(metrics.roas || 0, accountAverages.roas, 'higher'),
    ctr: scoreMetric(metrics.ctr || 0, accountAverages.ctr, 'higher'),
    cpc: scoreMetric(metrics.cpc || 0, accountAverages.cpc, 'lower'),
    conversionRate: scoreMetric(metrics.conversionRate || 0, accountAverages.conversionRate, 'higher'),
    budgetUtilization: metrics.budgetAllocated > 0 
      ? Math.min((metrics.spend / metrics.budgetAllocated) * 100, 100)
      : 50
  }

  // Calculate weighted total score
  const totalScore = 
    scores.roas * WEIGHTS.roas +
    scores.ctr * WEIGHTS.ctr +
    scores.cpc * WEIGHTS.cpc +
    scores.conversionRate * WEIGHTS.conversionRate +
    scores.budgetUtilization * WEIGHTS.budgetUtilization

  // Calculate percentile rank among all entities
  const activeEntities = allEntities.filter(e => e.status === 'ACTIVE' && e.metrics.spend > 0)
  const betterThanCount = activeEntities.filter(e => {
    const otherScore = calculateEntityScore(e.metrics, accountAverages)
    return otherScore < totalScore
  }).length
  const percentileRank = activeEntities.length > 0 ? (betterThanCount / activeEntities.length) * 100 : 50

  // Generate recommendations
  const recommendations = generateRecommendations(scores, metrics)

  return {
    ...entity,
    score: Math.round(totalScore),
    metrics: {
      ...metrics,
      scores
    },
    recommendations,
    percentileRank: Math.round(percentileRank),
    comparisonToAverage: {
      roas: ((metrics.roas || 0) - accountAverages.roas) / accountAverages.roas * 100,
      ctr: ((metrics.ctr || 0) - accountAverages.ctr) / accountAverages.ctr * 100,
      cpc: ((metrics.cpc || 0) - accountAverages.cpc) / accountAverages.cpc * 100,
      conversionRate: ((metrics.conversionRate || 0) - accountAverages.conversionRate) / accountAverages.conversionRate * 100
    }
  }
}

function scoreMetric(value: number, average: number, direction: 'higher' | 'lower'): number {
  if (average === 0) return 50
  
  const ratio = value / average
  let score: number
  
  if (direction === 'higher') {
    // For metrics where higher is better (ROAS, CTR, Conversion Rate)
    if (ratio >= 2) score = 100
    else if (ratio >= 1.5) score = 90
    else if (ratio >= 1.2) score = 80
    else if (ratio >= 1) score = 70
    else if (ratio >= 0.8) score = 60
    else if (ratio >= 0.6) score = 40
    else if (ratio >= 0.4) score = 20
    else score = 10
  } else {
    // For metrics where lower is better (CPC)
    if (ratio <= 0.5) score = 100
    else if (ratio <= 0.7) score = 90
    else if (ratio <= 0.85) score = 80
    else if (ratio <= 1) score = 70
    else if (ratio <= 1.2) score = 60
    else if (ratio <= 1.5) score = 40
    else if (ratio <= 2) score = 20
    else score = 10
  }
  
  return score
}

function calculateEntityScore(metrics: any, averages: any): number {
  const scores = {
    roas: scoreMetric(metrics.roas || 0, averages.roas, 'higher'),
    ctr: scoreMetric(metrics.ctr || 0, averages.ctr, 'higher'),
    cpc: scoreMetric(metrics.cpc || 0, averages.cpc, 'lower'),
    conversionRate: scoreMetric(metrics.conversionRate || 0, averages.conversionRate, 'higher'),
    budgetUtilization: 50
  }

  return scores.roas * WEIGHTS.roas +
    scores.ctr * WEIGHTS.ctr +
    scores.cpc * WEIGHTS.cpc +
    scores.conversionRate * WEIGHTS.conversionRate +
    scores.budgetUtilization * WEIGHTS.budgetUtilization
}

function aggregateMetrics(entities: any[]): any {
  const totals = entities.reduce((acc, entity) => ({
    spend: acc.spend + (entity.metrics?.spend || 0),
    revenue: acc.revenue + (entity.metrics?.revenue || 0),
    impressions: acc.impressions + (entity.metrics?.impressions || 0),
    clicks: acc.clicks + (entity.metrics?.clicks || 0),
    conversions: acc.conversions + (entity.metrics?.conversions || 0),
    budgetAllocated: acc.budgetAllocated + (entity.metrics?.budgetAllocated || 0)
  }), { spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0, budgetAllocated: 0 })

  return {
    ...totals,
    roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
    ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0
  }
}

function generateRecommendations(scores: any, metrics: any): string[] {
  const recommendations: string[] = []

  // ROAS recommendations
  if (scores.roas < 50) {
    if (metrics.roas < 1) {
      recommendations.push("Critical: Campaign is not profitable. Consider pausing and restructuring targeting.")
    } else {
      recommendations.push("Improve ROAS by refining audience targeting and testing new creatives.")
    }
  }

  // CTR recommendations
  if (scores.ctr < 50) {
    recommendations.push("Low CTR indicates poor ad relevance. Test new ad copy and visuals.")
  }

  // CPC recommendations
  if (scores.cpc < 50) {
    recommendations.push("High CPC detected. Consider adjusting bidding strategy or improving Quality Score.")
  }

  // Conversion rate recommendations
  if (scores.conversionRate < 50) {
    recommendations.push("Low conversion rate. Review landing page experience and offer relevance.")
  }

  // Budget utilization recommendations
  if (scores.budgetUtilization < 30) {
    recommendations.push("Low budget utilization. Consider increasing bids or expanding targeting.")
  } else if (scores.budgetUtilization > 95) {
    recommendations.push("Budget fully utilized. Consider increasing budget for scaling.")
  }

  return recommendations
}

function generateCampaignRecommendations(score: number, metrics: any, adsets: any[], ads: any[]): string[] {
  const recommendations: string[] = []

  if (score < 40) {
    recommendations.push("Campaign requires immediate attention. Review all underperforming components.")
  }

  // Check for underperforming adsets
  const poorAdsets = adsets.filter(a => a.score < 40)
  if (poorAdsets.length > 0) {
    recommendations.push(`${poorAdsets.length} ad set(s) underperforming. Consider pausing or optimizing.`)
  }

  // Check for underperforming ads
  const poorAds = ads.filter(a => a.score < 40)
  if (poorAds.length > 0) {
    recommendations.push(`${poorAds.length} ad(s) underperforming. Refresh creative or pause low performers.`)
  }

  // High-level strategic recommendations
  if (metrics.roas < 1.5) {
    recommendations.push("Focus on improving profitability through better targeting and creative optimization.")
  }

  return recommendations
}

function calculateAccountScore(campaigns: any[], adsets: any[], ads: any[]): any {
  // Calculate total metrics
  const totalMetrics = aggregateMetrics([...adsets, ...ads])
  
  // Calculate scores for account-level metrics
  const accountScores = {
    roas: scoreMetric(totalMetrics.roas, BENCHMARKS.roas, 'higher'),
    ctr: scoreMetric(totalMetrics.ctr, BENCHMARKS.ctr, 'higher'),
    cpc: scoreMetric(totalMetrics.cpc, BENCHMARKS.cpc, 'lower'),
    conversionRate: scoreMetric(totalMetrics.conversionRate, BENCHMARKS.conversionRate, 'higher'),
    budgetUtilization: totalMetrics.budgetAllocated > 0 
      ? Math.min((totalMetrics.spend / totalMetrics.budgetAllocated) * 100, 100)
      : 50
  }

  const totalScore = 
    accountScores.roas * WEIGHTS.roas +
    accountScores.ctr * WEIGHTS.ctr +
    accountScores.cpc * WEIGHTS.cpc +
    accountScores.conversionRate * WEIGHTS.conversionRate +
    accountScores.budgetUtilization * WEIGHTS.budgetUtilization

  // Generate account-level recommendations
  const recommendations: string[] = []
  
  if (totalScore < 50) {
    recommendations.push("Account performance below average. Comprehensive optimization needed.")
  }
  
  if (totalMetrics.roas < BENCHMARKS.roas) {
    recommendations.push(`Account ROAS (${totalMetrics.roas.toFixed(2)}x) below benchmark (${BENCHMARKS.roas}x).`)
  }

  // Identify biggest opportunities
  const campaignsByScore = [...campaigns].sort((a, b) => a.score - b.score)
  if (campaignsByScore.length > 0 && campaignsByScore[0].score < 40) {
    recommendations.push(`Focus on improving lowest scoring campaign: "${campaignsByScore[0].name}"`)
  }

  return {
    score: Math.round(totalScore),
    totalSpend: totalMetrics.spend,
    totalRevenue: totalMetrics.revenue,
    overallROAS: totalMetrics.roas,
    breakdown: accountScores,
    recommendations,
    benchmarkComparison: {
      roas: ((totalMetrics.roas - BENCHMARKS.roas) / BENCHMARKS.roas * 100),
      ctr: ((totalMetrics.ctr - BENCHMARKS.ctr) / BENCHMARKS.ctr * 100),
      cpc: ((totalMetrics.cpc - BENCHMARKS.cpc) / BENCHMARKS.cpc * 100),
      conversionRate: ((totalMetrics.conversionRate - BENCHMARKS.conversionRate) / BENCHMARKS.conversionRate * 100)
    }
  }
}