import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const META_API_BASE = 'https://graph.facebook.com/v19.0'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { datePreset = 'lifetime' } = body
    
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
    
    console.log('Fetching account insights for:', { adAccountId, datePreset })
    
    // For lifetime, get account-level data
    if (datePreset === 'lifetime') {
      // Get account info with amount_spent
      const accountUrl = `${META_API_BASE}/${adAccountId}`
      const accountParams = new URLSearchParams({
        access_token: accessToken,
        fields: 'id,name,currency,amount_spent,balance'
      })
      
      const accountResponse = await fetch(`${accountUrl}?${accountParams}`)
      const accountData = await accountResponse.json()
      
      if (!accountResponse.ok) {
        throw new Error(accountData.error?.message || 'Failed to fetch account data')
      }
      
      // amount_spent is in cents
      const lifetimeSpend = parseInt(accountData.amount_spent || '0') / 100
      
      // Also get account-level insights for other metrics
      const insightsUrl = `${META_API_BASE}/${adAccountId}/insights`
      const insightsParams = new URLSearchParams({
        access_token: accessToken,
        fields: 'impressions,clicks,actions,action_values'
      })
      
      const insightsResponse = await fetch(`${insightsUrl}?${insightsParams}`)
      const insightsData = await insightsResponse.json()
      
      let revenue = 0
      let conversions = 0
      let impressions = 0
      let clicks = 0
      
      if (insightsData.data?.[0]) {
        const insight = insightsData.data[0]
        impressions = parseInt(insight.impressions || '0')
        clicks = parseInt(insight.clicks || '0')
        
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
      
      return NextResponse.json({
        success: true,
        accountLevel: true,
        datePreset: 'lifetime',
        metrics: {
          spend: lifetimeSpend,
          revenue,
          conversions,
          impressions,
          clicks,
          roas: lifetimeSpend > 0 ? revenue / lifetimeSpend : 0,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          cpc: clicks > 0 ? lifetimeSpend / clicks : 0,
          cpa: conversions > 0 ? lifetimeSpend / conversions : 0
        },
        accountInfo: {
          id: accountData.id,
          name: accountData.name,
          currency: accountData.currency,
          amountSpentCents: accountData.amount_spent
        }
      })
    } else {
      // For other date ranges, use insights API with date_preset
      const insightsUrl = `${META_API_BASE}/${adAccountId}/insights`
      
      // Map date presets to Meta API format
      const datePresetMap: { [key: string]: string } = {
        'last_14d': 'last_14_d',
        'last_28d': 'last_28_d',
        'last_30d': 'last_30_d',
        'last_90d': 'last_90_d',
        'last_7d': 'last_7_d'
      }
      
      const metaDatePreset = datePresetMap[datePreset] || datePreset
      
      const params = new URLSearchParams({
        access_token: accessToken,
        fields: 'spend,impressions,clicks,actions,action_values',
        date_preset: metaDatePreset
      })
      
      const response = await fetch(`${insightsUrl}?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch insights')
      }
      
      let spend = 0
      let revenue = 0
      let conversions = 0
      let impressions = 0
      let clicks = 0
      
      if (data.data?.[0]) {
        const insight = data.data[0]
        spend = parseFloat(insight.spend || '0')
        impressions = parseInt(insight.impressions || '0')
        clicks = parseInt(insight.clicks || '0')
        
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
      
      return NextResponse.json({
        success: true,
        accountLevel: true,
        datePreset,
        metrics: {
          spend,
          revenue,
          conversions,
          impressions,
          clicks,
          roas: spend > 0 ? revenue / spend : 0,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          cpc: clicks > 0 ? spend / clicks : 0,
          cpa: conversions > 0 ? spend / conversions : 0
        }
      })
    }
    
  } catch (error: any) {
    console.error('Account insights error:', error)
    return NextResponse.json({
      error: 'Failed to fetch account insights',
      message: error.message
    }, { status: 500 })
  }
}