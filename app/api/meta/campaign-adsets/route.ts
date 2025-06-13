import { NextResponse } from "next/server"
import { railwayFetch } from "@/lib/railway-fetch-fix"

export async function POST(request: Request) {
  try {
    const { campaignId, accessToken, datePreset = 'last_7d' } = await request.json()

    if (!campaignId || !accessToken) {
      return NextResponse.json(
        { error: "Missing required parameters: campaignId or accessToken" },
        { status: 400 }
      )
    }

    // Map date presets
    const datePresetMap: { [key: string]: string } = {
      'last_14d': 'last_14_d',
      'last_28d': 'last_28_d',
      'last_30d': 'last_30_d',
      'last_90d': 'last_90_d',
      'last_7d': 'last_7_d'
    }
    
    const metaDatePreset = datePresetMap[datePreset] || datePreset
    const isLifetime = datePreset === 'lifetime'

    // Build URL for adsets
    let fieldsParam = ''
    if (isLifetime) {
      fieldsParam = 'id,name,status,effective_status,targeting,insights{spend,impressions,clicks,ctr,cpc,actions,action_values}'
    } else {
      fieldsParam = `id,name,status,effective_status,targeting,insights.date_preset(${metaDatePreset}){spend,impressions,clicks,ctr,cpc,actions,action_values}`
    }

    const url = `https://graph.facebook.com/v19.0/${campaignId}/adsets`
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: fieldsParam,
      limit: '500'
    })

    const response = await railwayFetch(`${url}?${params}`)
    const data = await response.json()

    if (!response.ok) {
      console.error('Meta API Error:', data.error)
      return NextResponse.json({
        error: 'Meta API error',
        details: data.error,
        success: false
      }, { status: response.status })
    }

    // Process adsets
    const adSets = (data.data || []).map((adSet: any) => {
      let spend = 0, revenue = 0, conversions = 0, impressions = 0, clicks = 0, ctr = 0, cpc = 0

      if (adSet.insights?.data?.[0]) {
        const insight = adSet.insights.data[0]
        spend = parseFloat(insight.spend || '0')
        impressions = parseInt(insight.impressions || '0')
        clicks = parseInt(insight.clicks || '0')
        ctr = parseFloat(insight.ctr || '0')
        cpc = parseFloat(insight.cpc || '0')

        // Count Facebook Pixel purchases only
        if (insight.actions) {
          insight.actions.forEach((action: any) => {
            if (action.action_type === 'offsite_conversion.fb_pixel_purchase') {
              conversions += parseInt(action.value || '0')
            }
          })
        }

        if (insight.action_values) {
          insight.action_values.forEach((actionValue: any) => {
            if (actionValue.action_type === 'offsite_conversion.fb_pixel_purchase') {
              revenue += parseFloat(actionValue.value || '0')
            }
          })
        }
      }

      return {
        id: adSet.id,
        name: adSet.name,
        status: adSet.status,
        effective_status: adSet.effective_status,
        targeting: adSet.targeting,
        spend,
        revenue,
        roas: spend > 0 ? revenue / spend : 0,
        conversions,
        impressions,
        clicks,
        ctr,
        cpc,
        cpa: conversions > 0 ? spend / conversions : 0
      }
    })

    return NextResponse.json({
      adSets,
      success: true,
      campaignId
    })

  } catch (error: any) {
    console.error('Campaign adsets route error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message,
      success: false
    }, { status: 500 })
  }
}