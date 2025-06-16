import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { campaignId, accessToken, adAccountId } = await request.json()

    if (!campaignId || !accessToken || !adAccountId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Construct the Meta API URL for fetching ad sets
    const url = `https://graph.facebook.com/v18.0/${campaignId}/adsets`
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: [
        "id",
        "name", 
        "status",
        "effective_status",
        "daily_budget",
        "lifetime_budget",
        "bid_amount",
        "targeting",
        "insights{spend,impressions,clicks,ctr,conversions,purchase_roas,actions}"
      ].join(","),
      limit: "100"
    })

    const response = await fetch(`${url}?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Meta API Error:", error)
      return NextResponse.json(
        { error: error.error?.message || "Failed to fetch ad sets" },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Process ad sets with insights
    const adsets = (data.data || []).map((adset: any) => {
      const insights = adset.insights?.data?.[0] || {}
      const actions = insights.actions || []
      
      // Calculate revenue from purchase actions
      const purchaseAction = actions.find((a: any) => 
        a.action_type === "purchase" || 
        a.action_type === "omni_purchase"
      )
      const conversions = purchaseAction ? parseFloat(purchaseAction.value) : 0
      
      // Calculate revenue (using purchase_roas if available)
      const spend = parseFloat(insights.spend || 0)
      const roas = parseFloat(insights.purchase_roas?.[0]?.value || 0)
      const revenue = roas > 0 ? spend * roas : conversions * 50 // Default $50 per conversion

      return {
        id: adset.id,
        name: adset.name,
        status: adset.status,
        effective_status: adset.effective_status,
        daily_budget: adset.daily_budget ? parseFloat(adset.daily_budget) / 100 : undefined,
        lifetime_budget: adset.lifetime_budget ? parseFloat(adset.lifetime_budget) / 100 : undefined,
        bid_amount: adset.bid_amount ? parseFloat(adset.bid_amount) / 100 : undefined,
        targeting: adset.targeting,
        insights: {
          spend: spend,
          impressions: parseInt(insights.impressions || 0),
          clicks: parseInt(insights.clicks || 0),
          ctr: parseFloat(insights.ctr || 0),
          conversions: conversions,
          revenue: revenue,
        }
      }
    })

    return NextResponse.json({
      success: true,
      adsets: adsets,
      paging: data.paging
    })

  } catch (error: any) {
    console.error("Campaign details API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}