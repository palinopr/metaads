import { NextResponse, type NextRequest } from "next/server"

const META_API_VERSION = "v19.0"

// Helper to fetch from Meta API
async function fetchMeta(url: string, accessToken: string) {
  const response = await fetch(`${url}&access_token=${accessToken}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
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
      type, // 'overview', 'campaign_details'
      campaignId, // for 'campaign_details'
      datePreset = "last_30d", // Default date preset for campaign list
    } = body

    if (!accessToken || !adAccountId) {
      return NextResponse.json({ error: "Access Token and Ad Account ID are required." }, { status: 400 })
    }

    if (type === "overview") {
      // Fetch today's account-level insights
      const todayInsightsFields = "spend,actions" // actions for conversions
      const todayInsightsUrl = `https://graph.facebook.com/${META_API_VERSION}/${adAccountId}/insights?fields=${todayInsightsFields}&date_preset=today`
      const todayData = await fetchMeta(todayInsightsUrl, accessToken)

      // Fetch active campaigns count (can also get status in campaign list)
      const activeCampaignsUrl = `https://graph.facebook.com/${META_API_VERSION}/${adAccountId}/campaigns?fields=id&filtering=[{'field':'effective_status','operator':'IN','value':['ACTIVE']}]&limit=500` // limit for counting
      const activeCampaignsData = await fetchMeta(activeCampaignsUrl, accessToken)
      const activeCampaignsCount = activeCampaignsData.data?.length || 0

      // Fetch campaign list with their insights for the specified datePreset
      const campaignListFields =
        "name,created_time,effective_status,insights.date_preset(" +
        datePreset +
        "){spend,impressions,clicks,ctr,cpc,actions,action_values,frequency}"
      const campaignsUrl = `https://graph.facebook.com/${META_API_VERSION}/${adAccountId}/campaigns?fields=${campaignListFields}&limit=100` // Add pagination if more campaigns
      const campaignsData = await fetchMeta(campaignsUrl, accessToken)

      // Sort campaigns by created_time (newest first)
      if (campaignsData.data && Array.isArray(campaignsData.data)) {
        campaignsData.data.sort((a: any, b: any) => {
          const dateA = a.created_time ? new Date(a.created_time).getTime() : 0
          const dateB = b.created_time ? new Date(b.created_time).getTime() : 0
          return dateB - dateA
        })
      }

      return NextResponse.json({
        todayData: todayData.data?.[0] || {},
        activeCampaignsCount,
        campaigns: campaignsData.data || [],
      })
    } else if (type === "campaign_details" && campaignId) {
      // Fetch ad sets for the campaign
      const adSetFields =
        "name,status,insights.date_preset(" + datePreset + "){spend,impressions,clicks,actions,action_values}"
      const adSetsUrl = `https://graph.facebook.com/${META_API_VERSION}/${campaignId}/adsets?fields=${adSetFields}&limit=50`
      const adSetsData = await fetchMeta(adSetsUrl, accessToken)

      // Fetch hourly insights for the campaign (e.g., for today or yesterday)
      // Note: Hourly data can be very large. Use a narrow date range.
      const hourlyInsightFields = "spend,impressions,clicks,actions"
      const hourlyInsightsUrl = `https://graph.facebook.com/${META_API_VERSION}/${campaignId}/insights?fields=${hourlyInsightFields}&time_increment=1&date_preset=today` // or 'yesterday'
      const hourlyData = await fetchMeta(hourlyInsightsUrl, accessToken)

      return NextResponse.json({
        adSets: adSetsData.data || [],
        hourlyData: hourlyData.data || [],
      })
    } else {
      return NextResponse.json({ error: "Invalid request type or missing campaignId." }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Error in Meta API proxy:", error)
    return NextResponse.json({ error: error.message || "Internal server error in API proxy" }, { status: 500 })
  }
}
