import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const META_API_BASE = 'https://graph.facebook.com/v19.0'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('fb_access_token')?.value
    const adAccountId = cookieStore.get('fb_selected_account')?.value
    
    if (!accessToken || !adAccountId) {
      return NextResponse.json({
        error: 'Missing credentials',
        success: false
      }, { status: 401 })
    }
    
    // Test last_7_d date preset
    const url = `${META_API_BASE}/${adAccountId}/campaigns`
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: 'id,name,status,insights.date_preset(last_7_d){spend,impressions,clicks,actions,action_values}',
      limit: '5'
    })
    
    console.log('Testing URL:', `${url}?${params}`)
    
    const response = await fetch(`${url}?${params}`)
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json({
        error: 'Meta API error',
        status: response.status,
        details: data.error,
        url: url,
        datePreset: 'last_7_d'
      }, { status: response.status })
    }
    
    // Process first campaign to check data
    let testCampaign = null
    if (data.data?.[0]) {
      const campaign = data.data[0]
      let conversions = 0
      let revenue = 0
      
      if (campaign.insights?.data?.[0]) {
        const insight = campaign.insights.data[0]
        
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
        
        testCampaign = {
          name: campaign.name,
          spend: parseFloat(insight.spend || '0'),
          conversions,
          revenue,
          hasInsights: true,
          rawActions: insight.actions
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      campaignCount: data.data?.length || 0,
      testCampaign,
      rawResponse: data
    })
    
  } catch (error: any) {
    console.error('Test last7d error:', error)
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}