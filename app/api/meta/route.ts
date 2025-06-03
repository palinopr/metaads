import { NextResponse, type NextRequest } from "next/server"

const META_API_VERSION = "v19.0"

// Helper to fetch from Meta API
async function fetchMeta(url: string, accessToken: string) {
  const response = await fetch(`${url}&access_token=${accessToken}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store", // Ensure fresh data
  })
  if (!response.ok) {
    const errorData = await response.json()
    console.error(`Meta API Error for URL ${url.split("&access_token")[0]}:`, errorData.error || errorData)
    throw new Error(errorData.error?.message || `Meta API request failed with status ${response.status}`)
  }
  return response.json()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      accessToken,
      adAccountId,
      type, // 'overview', 'campaign_details', 'historical_campaign_data'
      campaignId,
      datePreset = "last_30d", // Default for overview and campaign details if not specified
      // timeRange, // For custom date range in future {since: 'YYYY-MM-DD', until: 'YYYY-MM-DD'}
    } = body

    if (!accessToken || !adAccountId) {
      return NextResponse.json({ error: "Access Token and Ad Account ID are required." }, { status: 400 })
    }

    if (type === "overview") {
      const todayInsightsFields = "spend,actions"
      const todayInsightsUrl = `https://graph.facebook.com/${META_API_VERSION}/${adAccountId}/insights?fields=${todayInsightsFields}&date_preset=today`
      const todayData = await fetchMeta(todayInsightsUrl, accessToken)

      const activeCampaignsUrl = `https://graph.facebook.com/${META_API_VERSION}/${adAccountId}/campaigns?fields=id&filtering=[{'field':'effective_status','operator':'IN','value':['ACTIVE']}]&limit=500`
      const activeCampaignsData = await fetchMeta(activeCampaignsUrl, accessToken)
      const activeCampaignsCount = activeCampaignsData.data?.length || 0

      // Fetch campaign list with their insights for the specified datePreset (overall summary for the period)
      const campaignListSummaryFields =
        "name,created_time,effective_status,insights.date_preset(" +
        datePreset +
        "){spend,impressions,clicks,ctr,cpc,actions,action_values,frequency}"
      const campaignsSummaryUrl = `https://graph.facebook.com/${META_API_VERSION}/${adAccountId}/campaigns?fields=${campaignListSummaryFields}&limit=100`
      const campaignsSummaryData = await fetchMeta(campaignsSummaryUrl, accessToken)

      // Sort campaigns by created_time (newest first)
      if (campaignsSummaryData.data && Array.isArray(campaignsSummaryData.data)) {
        campaignsSummaryData.data.sort((a: any, b: any) => {
          const dateA = a.created_time ? new Date(a.created_time).getTime() : 0
          const dateB = b.created_time ? new Date(b.created_time).getTime() : 0
          return dateB - dateA
        })
      }

      return NextResponse.json({
        todayData: todayData.data?.[0] || {},
        activeCampaignsCount,
        campaigns: campaignsSummaryData.data || [], // These are summary insights for the period
      })
    } else if (type === "campaign_details" && campaignId) {
      // Ad sets for the campaign (summary for the period)
      const adSetFields =
        "name,status,insights.date_preset(" + datePreset + "){spend,impressions,clicks,actions,action_values}"
      const adSetsUrl = `https://graph.facebook.com/${META_API_VERSION}/${campaignId}/adsets?fields=${adSetFields}&limit=50`
      const adSetsData = await fetchMeta(adSetsUrl, accessToken)

      // Hourly insights for today (or a narrow recent range)
      const hourlyInsightFields = "spend,impressions,clicks,actions"
      const hourlyInsightsUrl = `https://graph.facebook.com/${META_API_VERSION}/${campaignId}/insights?fields=${hourlyInsightFields}&time_increment=1&date_preset=today` // time_increment=1 means hourly for date_preset=today
      const hourlyData = await fetchMeta(hourlyInsightsUrl, accessToken)

      return NextResponse.json({
        adSets: adSetsData.data || [],
        hourlyData: hourlyData.data || [],
      })
    } else if (type === "historical_campaign_data" && campaignId) {
      // Fetch daily historical data for a specific campaign over the datePreset
      const historicalFields = "spend,impressions,clicks,ctr,cpc,actions,action_values"
      const historicalDataUrl = `https://graph.facebook.com/${META_API_VERSION}/${campaignId}/insights?fields=${historicalFields}&date_preset=${datePreset}&time_increment=1` // time_increment=1 means daily here
      const historicalData = await fetchMeta(historicalDataUrl, accessToken)
      return NextResponse.json({
        historicalData: historicalData.data || [],
      })
    } else {
      return NextResponse.json({ error: "Invalid request type or missing parameters." }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Error in Meta API proxy:", error)
    return NextResponse.json({ error: error.message || "Internal server error in API proxy" }, { status: 500 })
  }
}
