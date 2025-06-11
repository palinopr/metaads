import { NextResponse } from "next/server"
import { claudeAPI } from "@/lib/claude-api-manager"
import { safeToFixed } from "@/lib/safe-utils"

// Helper to extract campaign context
function extractCampaignContext(campaignName: string) {
  const context = {
    eventType: "",
    city: "",
    stage: "",
    timeSlot: "",
    artist: "",
  }

  // Extract event type
  if (campaignName.includes("Reggaeton")) context.eventType = "Reggaeton"
  else if (campaignName.includes("RnB")) context.eventType = "RnB"
  else if (campaignName.includes("stand-up") || campaignName.includes("Comedy")) context.eventType = "Comedy"
  else if (campaignName.includes("Sports")) context.eventType = "Sports"

  // Extract city
  const cities = [
    "NYC",
    "New York",
    "Miami",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Brooklyn",
    "Tampa",
    "Nashville",
    "Montreal",
    "Glendale",
    "San Diego",
    "Providence",
    "San Francisco",
    "Toronto",
    "Washington DC",
    "Charlotte",
    "Orlando",
    "Philadelphia",
  ]
  for (const city of cities) {
    if (campaignName.includes(city)) {
      context.city = city
      break
    }
  }

  // Extract stage
  if (campaignName.includes("Pre-sale") || campaignName.includes("Pre-Sale")) context.stage = "Pre-sale"
  else if (campaignName.includes("Sale")) context.stage = "Main Sale"
  else if (campaignName.includes("DONE")) context.stage = "Completed"

  // Extract time
  const timeMatch = campaignName.match(/(\d{1,2}am|\d{1,2}pm|morning|night|evening)/i)
  if (timeMatch) context.timeSlot = timeMatch[0]

  // Extract artist/show name
  if (campaignName.includes("House78")) context.artist = "House78"
  else if (campaignName.includes("Chente Ydrach")) context.artist = "Chente Ydrach"

  return context
}

interface CampaignData {
  name: string
  spend: number
  revenue: number
  roas: number
  conversions: number
  ctr: number
  cpc: number
  impressions: number
  created_time: string
  daysSinceStart?: number
}

interface HistoricalDataPoint {
  date: string
  spend: number
  revenue: number
  roas: number
}

interface SimilarCampaign {
  name: string
  roas: string | number
  spend: number
  revenue: number
}

export async function POST(request: Request) {
  try {
    const {
      campaign,
      historicalData,
      similarCampaigns,
    } = (await request.json()) as {
      campaign: CampaignData
      historicalData?: HistoricalDataPoint[]
      similarCampaigns?: SimilarCampaign[]
    }

    // Check if Claude API is available
    if (!claudeAPI.isAvailable()) {
      console.log("Claude API not available, using fallback analysis")
      return NextResponse.json({
        fullAnalysis: generateFallbackAnalysis(campaign),
        context: extractCampaignContext(campaign.name),
        benchmarks: {},
        similarCampaignsCount: 0,
        generatedAt: new Date().toISOString(),
        usingFallback: true
      })
    }

    // Extract context from campaign name
    const context = extractCampaignContext(campaign.name)

    // Find truly similar campaigns (same event type and city)
    const relevantComparisons =
      similarCampaigns?.filter((c: SimilarCampaign) => {
        const cContext = extractCampaignContext(c.name)
        return (
          cContext.eventType === context.eventType &&
          (cContext.city === context.city || cContext.eventType === context.eventType)
        )
      }) || []

    // Calculate performance benchmarks
    const benchmarks = {
      avgROAS:
        relevantComparisons.length > 0
          ? relevantComparisons.reduce(
              (sum: number, c: SimilarCampaign) => sum + Number.parseFloat(String(c.roas)),
              0,
            ) / relevantComparisons.length
          : 0,
      avgSpend:
        relevantComparisons.length > 0
          ? relevantComparisons.reduce((sum: number, c: SimilarCampaign) => sum + c.spend, 0) /
            relevantComparisons.length
          : 0,
      avgRevenue:
        relevantComparisons.length > 0
          ? relevantComparisons.reduce((sum: number, c: SimilarCampaign) => sum + c.revenue, 0) /
            relevantComparisons.length
          : 0,
    }

    // Build a SHORTER prompt for Claude (to reduce token usage)
    const prompt = `Analyze this Meta Ads campaign briefly:

CAMPAIGN: ${campaign.name}
- Spend: $${safeToFixed(campaign.spend, 2)}
- Revenue: $${safeToFixed(campaign.revenue, 2)}
- ROAS: ${campaign.roas}x
- CTR: ${campaign.ctr}%
- CPC: $${campaign.cpc}

${relevantComparisons.length > 0 ? `BENCHMARK (${relevantComparisons.length} similar): Avg ROAS ${safeToFixed(benchmarks.avgROAS, 2)}x` : ''}

Provide:
1. Why is ROAS ${campaign.roas}x? (1-2 sentences)
2. Budget action for next 48h (specific % or $)
3. One key optimization (creative/audience)
4. Revenue potential estimate

Be concise. Use bullet points.`

    // Use the rate-limited Claude API with caching
    const aiResponse = await claudeAPI.analyze(prompt, {
      priority: campaign.roas < 3 ? 1 : 0, // Higher priority for underperforming campaigns
      useCache: true,
      ttl: 3600000 // 1 hour cache
    })

    const analysisResult = {
      fullAnalysis: aiResponse,
      context,
      benchmarks,
      similarCampaignsCount: relevantComparisons.length,
      generatedAt: new Date().toISOString(),
      queueStatus: claudeAPI.getQueueStatus()
    }

    return NextResponse.json(analysisResult)
  } catch (error: any) {
    console.error("AI Analysis Error:", error)

    // Return fallback analysis
    const requestData = await request.json().catch(() => ({ campaign: { roas: 0, ctr: 0 } }))
    
    return NextResponse.json({
      fullAnalysis: generateFallbackAnalysis(requestData.campaign || { roas: 0, ctr: 0 }),
      error: error.message,
      context: extractCampaignContext(requestData.campaign?.name || ""),
      benchmarks: {},
      similarCampaignsCount: 0,
      generatedAt: new Date().toISOString(),
      usingFallback: true,
      queueStatus: claudeAPI.getQueueStatus()
    })
  }
}

// Enhanced fallback analysis
function generateFallbackAnalysis(campaign: CampaignData | { roas: number | string; ctr: number | string }): string {
  const roas = Number.parseFloat(String(campaign.roas || 0))
  const ctr = Number.parseFloat(String(campaign.ctr || 0))

  let analysis = `## Quick Performance Analysis\n\n`

  // ROAS-based recommendations
  if (roas > 10) {
    analysis += `**🚀 Exceptional (${safeToFixed(roas, 2)}x ROAS)**\n`
    analysis += `- Scale budget by 50-100%\n`
    analysis += `- Monitor frequency to prevent fatigue\n\n`
  } else if (roas >= 7) {
    analysis += `**✅ Strong (${safeToFixed(roas, 2)}x ROAS)**\n`
    analysis += `- Increase budget by 20-30%\n`
    analysis += `- Test similar audiences\n\n`
  } else if (roas >= 3) {
    analysis += `**👍 Moderate (${safeToFixed(roas, 2)}x ROAS)**\n`
    analysis += `- Refresh creatives\n`
    analysis += `- Tighten targeting\n\n`
  } else {
    analysis += `**🔴 Needs Optimization (${safeToFixed(roas, 2)}x ROAS)**\n`
    analysis += `- Pause underperformers\n`
    analysis += `- Review offer & landing page\n\n`
  }

  // CTR insights
  if (ctr < 1) {
    analysis += `**Creative Issues (${safeToFixed(ctr, 2)}% CTR)**\n`
    analysis += `- Test new hooks & formats\n`
  } else if (ctr > 3) {
    analysis += `**Strong Engagement (${safeToFixed(ctr, 2)}% CTR)**\n`
    analysis += `- Maintain current creative strategy\n`
  }

  return analysis
}