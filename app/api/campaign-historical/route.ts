import { NextResponse } from "next/server"
import { railwayFetch } from "@/lib/railway-fetch-fix"

export async function POST(request: Request) {
  try {
    const { campaignId, accessToken, datePreset } = await request.json()

    if (!campaignId || !accessToken) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Clean the access token
    const cleanToken = accessToken.replace(/^Bearer\s+/i, '')

    // For historical data, we need daily breakdown
    // Use time_increment=1 to get daily data
    let url: string
    
    if (datePreset === 'lifetime') {
      // For lifetime, first get campaign created_time
      const campaignUrl = `https://graph.facebook.com/v19.0/${campaignId}?fields=created_time&access_token=${cleanToken}`
      const campaignRes = await railwayFetch(campaignUrl)
      const campaignData = await campaignRes.json()
      
      const startDate = campaignData.created_time 
        ? new Date(campaignData.created_time).toISOString().split('T')[0]
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default to 90 days ago
      
      const endDate = new Date().toISOString().split('T')[0]
      
      url = `https://graph.facebook.com/v19.0/${campaignId}/insights?` +
        `fields=spend,impressions,clicks,ctr,cpc,actions,action_values,conversions,cost_per_conversion` +
        `&time_range=${JSON.stringify({ since: startDate, until: endDate })}` +
        `&time_increment=1` +
        `&limit=1000` +
        `&access_token=${cleanToken}`
    } else {
      // Map date presets
      const datePresetMap: { [key: string]: string } = {
        'today': 'today',
        'yesterday': 'yesterday',
        'last_7d': 'last_7_d',
        'last_14d': 'last_14_d',
        'last_28d': 'last_28_d',
        'last_30d': 'last_30_d',
        'last_90d': 'last_90_d',
        'this_month': 'this_month',
        'last_month': 'last_month'
      }
      
      const metaDatePreset = datePresetMap[datePreset] || datePreset
      
      url = `https://graph.facebook.com/v19.0/${campaignId}/insights?` +
        `fields=spend,impressions,clicks,ctr,cpc,actions,action_values,conversions,cost_per_conversion` +
        `&date_preset=${metaDatePreset}` +
        `&time_increment=1` +
        `&limit=1000` +
        `&access_token=${cleanToken}`
    }

    const response = await railwayFetch(url)
    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    // Process the data into the format expected by predictions
    const historicalData = (data.data || []).map((day: any) => {
      let revenue = 0
      let conversions = 0

      // Count only Facebook Pixel purchases
      if (day.action_values) {
        day.action_values.forEach((av: any) => {
          if (av.action_type === "offsite_conversion.fb_pixel_purchase") {
            revenue += parseFloat(av.value || "0")
          }
        })
      }

      if (day.actions) {
        day.actions.forEach((a: any) => {
          if (a.action_type === "offsite_conversion.fb_pixel_purchase") {
            conversions += parseInt(a.value || "0", 10)
          }
        })
      }

      const spend = parseFloat(day.spend || "0")

      return {
        date: day.date_start,
        spend,
        revenue,
        roas: spend > 0 ? revenue / spend : 0,
        conversions,
        impressions: parseInt(day.impressions || "0", 10),
        clicks: parseInt(day.clicks || "0", 10),
        ctr: parseFloat(day.ctr || "0"),
        cpc: parseFloat(day.cpc || "0")
      }
    })

    return NextResponse.json({ 
      historicalData,
      count: historicalData.length 
    })

  } catch (error: any) {
    console.error("Campaign Historical Data Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch historical data" },
      { status: 500 }
    )
  }
}