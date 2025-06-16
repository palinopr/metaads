import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { adSetId, accessToken } = await request.json()

    if (!adSetId || !accessToken) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Construct the Meta API URL for fetching ads
    const url = `https://graph.facebook.com/v18.0/${adSetId}/ads`
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: [
        "id",
        "name",
        "status", 
        "effective_status",
        "creative{id,name,thumbnail_url,image_url,video_id,body,title,call_to_action_type,object_story_spec}",
        "insights{spend,impressions,clicks,ctr,conversions,purchase_roas,actions,cost_per_action_type}"
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
        { error: error.error?.message || "Failed to fetch ads" },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Process ads with insights and creative data
    const ads = (data.data || []).map((ad: any) => {
      const insights = ad.insights?.data?.[0] || {}
      const actions = insights.actions || []
      const creative = ad.creative || {}
      
      // Calculate conversions from purchase actions
      const purchaseAction = actions.find((a: any) => 
        a.action_type === "purchase" || 
        a.action_type === "omni_purchase"
      )
      const conversions = purchaseAction ? parseFloat(purchaseAction.value) : 0
      
      // Calculate revenue
      const spend = parseFloat(insights.spend || 0)
      const roas = parseFloat(insights.purchase_roas?.[0]?.value || 0)
      const revenue = roas > 0 ? spend * roas : conversions * 50 // Default $50 per conversion

      // Process creative data
      const processedCreative = {
        id: creative.id,
        name: creative.name,
        thumbnail_url: creative.thumbnail_url,
        image_url: creative.image_url,
        video_id: creative.video_id,
        video_url: creative.video_id ? `https://www.facebook.com/video.php?v=${creative.video_id}` : undefined,
        body: creative.body,
        title: creative.title,
        call_to_action_type: creative.call_to_action_type,
        link_url: creative.object_story_spec?.link_data?.link || undefined,
      }

      return {
        id: ad.id,
        name: ad.name,
        status: ad.status,
        effective_status: ad.effective_status,
        creative: processedCreative,
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
      ads: ads,
      paging: data.paging
    })

  } catch (error: any) {
    console.error("Ad set details API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}