import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

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
  created_time: string // Assuming this is passed for daysSinceStart calculation
  daysSinceStart?: number // This might be pre-calculated or calculated from created_time
}

interface HistoricalDataPoint {
  date: string
  spend: number
  revenue: number
  roas: number
}

interface SimilarCampaign {
  name: string
  roas: string | number // Can be string or number
  spend: number
  revenue: number
}

export async function POST(request: Request) {
  try {
    const {
      campaign,
      historicalData,
      similarCampaigns,
      // allCampaigns // Not used in this version of the prompt construction
    } = (await request.json()) as {
      campaign: CampaignData
      historicalData?: HistoricalDataPoint[]
      similarCampaigns?: SimilarCampaign[]
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
        ) // Second condition allows broader match if city is different but event type is same
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

    // Build the prompt for Claude
    const prompt = `You are an expert Meta Ads analyst specializing in event marketing. Analyze this campaign and provide specific, actionable insights.

CAMPAIGN DETAILS:
- Name: ${campaign.name}
- Type: ${context.eventType || "Unknown"} event
- Location: ${context.city || "Unknown"}
- Stage: ${context.stage || "Unknown"}
- Time: ${context.timeSlot || "Not specified"}

CURRENT PERFORMANCE:
- Spend: $${campaign.spend.toFixed(2)}
- Revenue: $${campaign.revenue.toFixed(2)}
- ROAS: ${campaign.roas}x
- Conversions: ${campaign.conversions}
- CTR: ${campaign.ctr}%
- CPC: $${campaign.cpc}
- Impressions: ${campaign.impressions.toLocaleString()}
- Campaign Age: ${campaign.daysSinceStart || Math.floor((Date.now() - new Date(campaign.created_time).getTime()) / (1000 * 60 * 60 * 24)) || "Unknown"} days

${
  relevantComparisons.length > 0
    ? `
SIMILAR ${context.eventType.toUpperCase()} CAMPAIGNS BENCHMARK (${relevantComparisons.length} campaigns):
- Average ROAS: ${benchmarks.avgROAS.toFixed(2)}x
- Average Spend: $${benchmarks.avgSpend.toFixed(2)}
- Average Revenue: $${benchmarks.avgRevenue.toFixed(2)}

TOP PERFORMERS (up to 3):
${relevantComparisons
  .sort(
    (a: SimilarCampaign, b: SimilarCampaign) => Number.parseFloat(String(b.roas)) - Number.parseFloat(String(a.roas)),
  )
  .slice(0, 3)
  .map(
    (c: SimilarCampaign) =>
      `- ${c.name}: ${Number.parseFloat(String(c.roas)).toFixed(2)}x ROAS, $${c.revenue.toFixed(2)} revenue`,
  )
  .join("\n")}
`
    : "No directly comparable campaigns found for detailed benchmark."
}

${
  historicalData && historicalData.length > 0
    ? `
RECENT TREND (Last ${Math.min(7, historicalData.length)} days):
${historicalData
  .slice(-7)
  .map(
    (d: HistoricalDataPoint) =>
      `- ${new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: $${d.spend.toFixed(2)} spend, $${d.revenue.toFixed(2)} revenue, ${d.roas.toFixed(2)}x ROAS`,
  )
  .join("\n")}
`
    : "No detailed historical trend data provided for the last 7 days."
}

Based on this data, provide:

1. **Performance Analysis**: Why is this campaign performing at ${campaign.roas}x ROAS? Be specific about what's working or not working. Consider its performance relative to benchmarks if available.

2. **Immediate Actions** (Next 24-48 hours):
   - Specific budget recommendation (e.g., increase/decrease by X% or to $X/day). Justify it.
   - Creative recommendations based on the CTR and event type.
   - Targeting adjustments if applicable (e.g., if performance is poor or benchmarks suggest issues).

3. **Strategic Recommendations** (Next 7 days):
   - Optimal budget allocation strategy (e.g., front-load, steady, ramp-up).
   - Best days/times to push budget based on event type and location, if known.
   - Audience expansion or refinement suggestions (e.g., lookalikes, interest targeting).

4. **Context-Specific Insights**:
   - How does this ${context.eventType} event in ${context.city || "this market"} compare to typical performance for such events/locations?
   - What unique factors about ${context.city || "this market"} (e.g., competition, audience behavior) should be considered?
   ${context.stage === "Pre-sale" ? "- Pre-sale specific strategies to maximize main sale success (e.g., urgency creation, early bird offers)." : ""}

5. **Revenue Projection & ROAS Goal**:
   - Based on current trajectory and similar campaigns (if available), what's a realistic revenue potential for the remainder of the campaign or a typical full cycle?
   - What ROAS should be the target for this campaign at maturity, considering its context?

Format your response with clear Markdown headers (e.g., ## Header) and bullet points. Be specific with numbers and percentages. Prioritize actionable advice.`

    // Call Claude API
    const message = await anthropic.messages.create({
      model: "claude-3-opus-20240229", // or claude-3-sonnet-20240229 for faster/cheaper
      max_tokens: 2000, // Increased for potentially longer analysis
      temperature: 0.7,
      system:
        "You are an expert digital marketing analyst with deep expertise in Meta Ads, event marketing, and data-driven optimization. Provide specific, actionable insights based on real data patterns. Use Markdown for formatting.",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    // Extract the response
    const aiResponse = message.content[0].type === "text" ? message.content[0].text : "Unable to generate analysis"

    const analysisResult = {
      fullAnalysis: aiResponse,
      context,
      benchmarks,
      similarCampaignsCount: relevantComparisons.length,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(analysisResult)
  } catch (error: any) {
    console.error("AI Analysis Error:", error)

    // Fallback analysis using the request data directly
    const requestData = await request.json().catch(() => ({ campaign: { roas: 0, ctr: 0 } })) // Attempt to get campaign data for fallback

    return NextResponse.json({
      fullAnalysis: generateFallbackAnalysis(requestData.campaign || { roas: 0, ctr: 0 }), // Pass campaign data to fallback
      error: `AI analysis temporarily unavailable. Error: ${error.message}`,
      context: extractCampaignContext(requestData.campaign?.name || ""),
      benchmarks: {},
      similarCampaignsCount: 0,
      generatedAt: new Date().toISOString(),
    })
  }
}

// Fallback analysis if Claude API fails
function generateFallbackAnalysis(campaign: CampaignData | { roas: number | string; ctr: number | string }): string {
  const roas = Number.parseFloat(String(campaign.roas || 0)) // Ensure campaign.roas is treated as string or number
  const ctr = Number.parseFloat(String(campaign.ctr || 0))

  let analysis = `## Fallback Campaign Performance Analysis\n\n`
  analysis += `*Note: AI analysis is temporarily unavailable. This is a simplified rule-based assessment.*\n\n`

  // ROAS-based recommendations
  if (roas > 10) {
    analysis += `### 🚀 Exceptional Performance (${roas.toFixed(2)}x ROAS)\n`
    analysis += `- This campaign is performing excellently based on ROAS.\n`
    analysis += `- Consider scaling budget by 50-100% if other metrics (like CPA, volume) are also strong.\n`
    analysis += `- Monitor ad frequency closely to avoid audience fatigue with increased spend.\n\n`
  } else if (roas >= 7) {
    analysis += `### ✅ Strong Performance (${roas.toFixed(2)}x ROAS)\n`
    analysis += `- Campaign is highly profitable and stable.\n`
    analysis += `- Gradual budget increases (e.g., 20-30%) are recommended if sustainable.\n`
    analysis += `- Explore testing new, similar audiences to expand reach without diluting performance.\n\n`
  } else if (roas >= 3) {
    analysis += `### 👍 Moderate Performance (${roas.toFixed(2)}x ROAS)\n`
    analysis += `- Campaign is profitable but likely has room for improvement.\n`
    analysis += `- Review and refresh ad creatives, especially those with declining CTR or high frequency.\n`
    analysis += `- Analyze audience segments; consider tightening targeting if some segments underperform.\n\n`
  } else {
    analysis += `### 🔴 Needs Optimization (${roas.toFixed(2)}x ROAS)\n`
    analysis += `- Campaign is underperforming or not profitable.\n`
    analysis += `- Pause lowest-performing ad sets or ads immediately.\n`
    analysis += `- Conduct a thorough review of the offer, landing page experience, and audience-creative match.\n`
    analysis += `- Consider restructuring the campaign or testing entirely new angles.\n\n`
  }

  // CTR-based recommendations
  if (ctr < 1) {
    analysis += `### Creative & Engagement Recommendations\n`
    analysis += `- CTR is low (${ctr.toFixed(2)}%). This suggests creatives may not be engaging or relevant enough.\n`
    analysis += `- Test video content if currently using static images, or vice-versa.\n`
    analysis += `- Improve ad copy with stronger hooks, clear value propositions, and compelling calls-to-action.\n\n`
  } else if (ctr > 3) {
    analysis += `### Creative & Engagement Recommendations\n`
    analysis += `- CTR is strong (${ctr.toFixed(2)}%), indicating good creative-audience resonance.\n`
    analysis += `- Maintain what's working and consider A/B testing minor variations to further optimize.\n\n`
  }

  return analysis
}
