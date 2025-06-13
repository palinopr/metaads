import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const META_API_BASE = 'https://graph.facebook.com/v19.0'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { datePreset = 'last_7d' } = body
    
    console.log('Direct Meta API Request:', {
      datePreset,
      body: { ...body, accessToken: body.accessToken ? '***' : undefined }
    })
    
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
      fields: `id,name,status,effective_status,objective,created_time,updated_time,daily_budget,lifetime_budget,insights.date_preset(${datePreset}){spend,impressions,clicks,ctr,cpc,actions,action_values,conversions,cost_per_conversion,frequency,reach}`,
      limit: '100'
    })
    
    console.log('Direct Meta API call:', {
      url: campaignsUrl,
      datePreset,
      fieldsPreset: `insights.date_preset(${datePreset})`,
      adAccountId,
      timestamp: new Date().toISOString()
    })
    
    let response
    try {
      response = await fetch(`${campaignsUrl}?${params}`)
    } catch (fetchError: any) {
      console.error('Network error calling Meta API:', fetchError)
      return NextResponse.json({
        error: 'Network error',
        message: fetchError.message,
        success: false
      }, { status: 500 })
    }
    let data
    try {
      data = await response.json()
    } catch (jsonError) {
      console.error('Failed to parse Meta API response as JSON')
      return NextResponse.json({
        error: 'Invalid response from Meta API',
        status: response.status,
        statusText: response.statusText,
        success: false
      }, { status: 500 })
    }
    
    if (!response.ok) {
      console.error('Direct Meta API error:', {
        status: response.status,
        error: data.error,
        datePreset,
        url: campaignsUrl
      })
      
      // Check if it's a date preset error
      if (data.error?.message?.includes('date_preset')) {
        return NextResponse.json({
          error: 'Invalid date preset',
          details: `The date preset "${datePreset}" may not be supported. Error: ${data.error.message}`,
          validPresets: ['today', 'yesterday', 'last_7d', 'last_14d', 'last_28d', 'last_30d', 'last_90d', 'lifetime'],
          success: false
        }, { status: 400 })
      }
      
      return NextResponse.json({
        error: 'Meta API error',
        details: data.error,
        datePreset,
        success: false
      }, { status: response.status })
    }
    
    // Log the response for debugging
    console.log('Meta API response:', {
      datePreset,
      campaignCount: data.data?.length || 0,
      firstCampaign: data.data?.[0] ? {
        name: data.data[0].name,
        hasInsights: !!data.data[0].insights,
        insightData: data.data[0].insights?.data?.[0]
      } : null
    })
    
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
    
    // Calculate total spend for debugging
    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0)
    
    console.log('Direct Meta API summary:', {
      datePreset,
      totalCampaigns: campaigns.length,
      totalSpend,
      campaignsWithSpend: campaigns.filter(c => c.spend > 0).length,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({
      campaigns,
      success: true,
      debug: {
        campaignCount: campaigns.length,
        rawDataLength: data.data?.length || 0,
        datePreset,
        totalSpend
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