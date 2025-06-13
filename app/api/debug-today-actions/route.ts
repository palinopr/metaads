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
    
    // Get today's insights with all action details
    const insightsUrl = `${META_API_BASE}/${adAccountId}/insights`
    const response = await fetch(
      `${insightsUrl}?access_token=${accessToken}&fields=spend,impressions,clicks,actions,action_values,cost_per_action_type&date_preset=today`
    )
    const data = await response.json()
    
    if (!data.data?.[0]) {
      return NextResponse.json({
        error: 'No data available',
        success: false
      })
    }
    
    const insight = data.data[0]
    
    // Break down all actions by type
    const actionBreakdown: any = {}
    const actionValueBreakdown: any = {}
    
    if (insight.actions) {
      insight.actions.forEach((action: any) => {
        actionBreakdown[action.action_type] = parseInt(action.value || '0')
      })
    }
    
    if (insight.action_values) {
      insight.action_values.forEach((actionValue: any) => {
        actionValueBreakdown[actionValue.action_type] = parseFloat(actionValue.value || '0')
      })
    }
    
    // Calculate what we're currently counting as conversions
    let ourConversions = 0
    let ourRevenue = 0
    const purchaseTypes = [
      'purchase',
      'omni_purchase', 
      'offsite_conversion.fb_pixel_purchase',
      'web_in_store_purchase',
      'onsite_web_purchase',
      'onsite_web_app_purchase',
      'web_app_in_store_purchase'
    ]
    
    purchaseTypes.forEach(type => {
      if (actionBreakdown[type]) {
        ourConversions += actionBreakdown[type]
      }
      if (actionValueBreakdown[type]) {
        ourRevenue += actionValueBreakdown[type]
      }
    })
    
    // Meta's standard purchase conversion (most common)
    const standardPurchase = actionBreakdown['offsite_conversion.fb_pixel_purchase'] || 0
    const standardRevenue = actionValueBreakdown['offsite_conversion.fb_pixel_purchase'] || 0
    
    return NextResponse.json({
      summary: {
        metaUIShows: {
          conversions: 39,
          revenue: 2408.83,
          spend: 573.06,
          cpa: 14.69
        },
        ourCalculation: {
          conversions: ourConversions,
          revenue: ourRevenue,
          spend: parseFloat(insight.spend || '0'),
          cpa: ourConversions > 0 ? parseFloat(insight.spend || '0') / ourConversions : 0
        },
        likelyMetaDefault: {
          conversions: standardPurchase,
          revenue: standardRevenue,
          explanation: "Meta UI typically shows 'offsite_conversion.fb_pixel_purchase' as the default"
        }
      },
      allActions: actionBreakdown,
      allActionValues: actionValueBreakdown,
      costPerActionType: insight.cost_per_action_type,
      recommendation: "Check which specific conversion action Meta UI is displaying. It's likely showing only 'offsite_conversion.fb_pixel_purchase'",
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Debug today actions error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message
    }, { status: 500 })
  }
}