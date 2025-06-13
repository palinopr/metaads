import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { railwayFetch } from '@/lib/railway-fetch-fix'

const META_API_BASE = 'https://graph.facebook.com/v19.0'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { datePreset = 'last_7d' } = body
    
    // Get credentials
    let accessToken = body.accessToken
    let adAccountId = body.adAccountId
    
    if (!accessToken || !adAccountId) {
      const cookieStore = cookies()
      accessToken = accessToken || cookieStore.get('fb_access_token')?.value
      adAccountId = adAccountId || cookieStore.get('fb_selected_account')?.value
    }
    
    if (!accessToken || !adAccountId) {
      return NextResponse.json({
        error: 'Missing credentials',
        success: false
      }, { status: 401 })
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
    
    // Build URL
    const campaignsUrl = `${META_API_BASE}/${adAccountId}/campaigns`
    let fieldsParam = ''
    
    if (isLifetime) {
      fieldsParam = 'id,name,status,effective_status,objective,created_time,updated_time,daily_budget,lifetime_budget,insights{spend,impressions,clicks,ctr,cpc,actions,action_values}'
    } else {
      fieldsParam = `id,name,status,effective_status,objective,created_time,updated_time,daily_budget,lifetime_budget,insights.date_preset(${metaDatePreset}){spend,impressions,clicks,ctr,cpc,actions,action_values}`
    }
    
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: fieldsParam,
      limit: '500'
    })
    
    // Fetch campaigns
    const response = await railwayFetch(`${campaignsUrl}?${params}`)
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json({
        error: 'Meta API error',
        details: data.error,
        success: false
      }, { status: response.status })
    }
    
    // Process campaigns
    const campaigns = (data.data || []).map((campaign: any) => {
      let spend = 0, revenue = 0, conversions = 0, impressions = 0, clicks = 0, ctr = 0, cpc = 0
      
      if (campaign.insights?.data?.[0]) {
        const insight = campaign.insights.data[0]
        spend = parseFloat(insight.spend || '0')
        impressions = parseInt(insight.impressions || '0')
        clicks = parseInt(insight.clicks || '0')
        ctr = parseFloat(insight.ctr || '0')
        cpc = parseFloat(insight.cpc || '0')
        
        // Only count Facebook Pixel purchases
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
        ...campaign,
        spend,
        revenue,
        conversions,
        impressions,
        clicks,
        ctr,
        cpc,
        roas: spend > 0 ? revenue / spend : 0,
        cpa: conversions > 0 ? spend / conversions : 0,
        adsets_count: 0
      }
    })
    
    return NextResponse.json({
      campaigns,
      success: true,
      debug: {
        campaignCount: campaigns.length,
        datePreset,
        totalSpend: campaigns.reduce((sum: number, c: any) => sum + c.spend, 0)
      }
    })
    
  } catch (error: any) {
    console.error('Direct campaigns route error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message,
      success: false
    }, { status: 500 })
  }
}