import { NextResponse, type NextRequest } from "next/server"

const META_API_VERSION = "v19.0"
const DATE_PRESET = "last_30d" // Or "lifetime", "last_7d", "yesterday", etc.

interface CampaignData {
  id: string
  name: string
  created_time: string
  // We will fetch insights separately
}

interface CampaignInsight {
  spend?: string
  impressions?: string
  clicks?: string
  ctr?: string
  cpc?: string
  actions?: Array<{ action_type: string; value: string }>
  action_values?: Array<{ action_type: string; value: string }>
  // Add other insight fields you might need
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken, adAccountId } = body

    if (!accessToken || !adAccountId) {
      return NextResponse.json(
        { error: "Access Token and Ad Account ID are required in the request body." },
        { status: 400 },
      )
    }

    // 1. Fetch basic campaign info (ID, name, created_time)
    const campaignFields = "name,created_time"
    const campaignsApiUrl = `https://graph.facebook.com/${META_API_VERSION}/${adAccountId}/campaigns?fields=${campaignFields}&access_token=${accessToken}`

    const campaignsResponse = await fetch(campaignsApiUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })

    if (!campaignsResponse.ok) {
      const errorData = await campaignsResponse.json()
      return NextResponse.json(
        { error: "Failed to fetch campaign list from Meta API", details: errorData.error || errorData },
        { status: campaignsResponse.status },
      )
    }

    const campaignsResult = await campaignsResponse.json()
    const rawCampaigns: CampaignData[] = campaignsResult.data || []

    if (!rawCampaigns.length) {
      return NextResponse.json({ data: [] }) // No campaigns found
    }

    // 2. Fetch insights for each campaign
    const insightFields = "spend,impressions,clicks,ctr,cpc,actions,action_values"
    const enrichedCampaigns = await Promise.all(
      rawCampaigns.map(async (campaign) => {
        const insightsApiUrl = `https://graph.facebook.com/${META_API_VERSION}/${campaign.id}/insights?fields=${insightFields}&date_preset=${DATE_PRESET}&access_token=${accessToken}`
        try {
          const insightsResponse = await fetch(insightsApiUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          })
          if (!insightsResponse.ok) {
            console.warn(`Failed to fetch insights for campaign ${campaign.id}: ${insightsResponse.statusText}`)
            return { ...campaign, insights: { data: [{}] } } // Return campaign with empty insights on error
          }
          const insightsResult = await insightsResponse.json()
          return { ...campaign, insights: insightsResult }
        } catch (insightsError) {
          console.warn(`Error fetching insights for campaign ${campaign.id}:`, insightsError)
          return { ...campaign, insights: { data: [{}] } } // Return campaign with empty insights on error
        }
      }),
    )

    // Sort campaigns by created_time (newest first) after enrichment
    enrichedCampaigns.sort((a, b) => {
      const dateA = a.created_time ? new Date(a.created_time).getTime() : 0
      const dateB = b.created_time ? new Date(b.created_time).getTime() : 0
      return dateB - dateA
    })

    return NextResponse.json({ data: enrichedCampaigns })
  } catch (error: any) {
    console.error("Error in Meta API proxy:", error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error in API proxy", details: error.message }, { status: 500 })
  }
}
