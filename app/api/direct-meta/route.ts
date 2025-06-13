import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const META_API_BASE = 'https://graph.facebook.com/v19.0'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get credentials from body or cookies
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
    
    // Directly call Meta API
    const campaignsUrl = `${META_API_BASE}/${adAccountId}/campaigns`
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: 'id,name,status,effective_status,objective,created_time,updated_time,daily_budget,lifetime_budget,insights.date_preset(last_7d){spend,impressions,clicks,ctr,cpc,actions,action_values,conversions,cost_per_conversion,frequency,reach}',
      limit: '100'
    })
    
    console.log('Direct Meta API call to:', campaignsUrl)
    
    const response = await fetch(`${campaignsUrl}?${params}`)
    const data = await response.json()
    
    if (!response.ok) {
      console.error('Direct Meta API error:', data)
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
        
        // Calculate conversions and revenue
        if (insight.actions) {
          insight.actions.forEach((action: any) => {
            if (['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'].includes(action.action_type)) {
              conversions += parseInt(action.value || '0')
            }
          })
        }
        
        if (insight.action_values) {
          insight.action_values.forEach((actionValue: any) => {
            if (['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'].includes(actionValue.action_type)) {
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
        adsets: [],
        adsets_count: 0
      }
    })
    
    return NextResponse.json({
      campaigns,
      success: true,
      debug: {
        campaignCount: campaigns.length,
        rawDataLength: data.data?.length || 0
      }
    })
    
  } catch (error: any) {
    console.error('Direct Meta route error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message,
      success: false
    }, { status: 500 })
  }
}