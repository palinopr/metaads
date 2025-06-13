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
    
    // 1. Get account-level spend
    const accountUrl = `${META_API_BASE}/${adAccountId}`
    const accountResponse = await fetch(`${accountUrl}?access_token=${accessToken}&fields=amount_spent,currency`)
    const accountData = await accountResponse.json()
    const lifetimeSpendCents = parseInt(accountData.amount_spent || '0')
    const lifetimeSpend = lifetimeSpendCents / 100
    
    // 2. Try to get lifetime insights with large date range
    const insightsUrl = `${META_API_BASE}/${adAccountId}/insights`
    const timeRange = {
      since: '2014-01-01',
      until: new Date().toISOString().split('T')[0]
    }
    
    const insightsResponse = await fetch(
      `${insightsUrl}?access_token=${accessToken}&fields=spend,impressions,clicks,actions,action_values,website_purchase_roas&time_range=${JSON.stringify(timeRange)}`
    )
    const insightsData = await insightsResponse.json()
    
    // 3. Get all campaigns to see total coverage
    let allCampaigns: any[] = []
    let nextUrl = `${META_API_BASE}/${adAccountId}/campaigns?access_token=${accessToken}&fields=id,name,insights{spend,impressions,clicks,actions,action_values}&limit=500`
    let pageCount = 0
    
    while (nextUrl && pageCount < 20) {
      const response = await fetch(nextUrl)
      const data = await response.json()
      
      if (data.data) {
        allCampaigns = allCampaigns.concat(data.data)
      }
      
      nextUrl = data.paging?.next || null
      pageCount++
    }
    
    // 4. Calculate metrics from all sources
    let campaignMetrics = {
      spend: 0,
      impressions: 0,
      clicks: 0,
      purchases: 0,
      webPurchases: 0,
      omniPurchases: 0,
      offlineConversions: 0,
      revenue: 0,
      webRevenue: 0,
      omniRevenue: 0
    }
    
    // Sum up all campaigns
    allCampaigns.forEach(campaign => {
      if (campaign.insights?.data?.[0]) {
        const insight = campaign.insights.data[0]
        campaignMetrics.spend += parseFloat(insight.spend || '0')
        campaignMetrics.impressions += parseInt(insight.impressions || '0')
        campaignMetrics.clicks += parseInt(insight.clicks || '0')
        
        // Count all purchase types
        if (insight.actions) {
          insight.actions.forEach((action: any) => {
            const value = parseInt(action.value || '0')
            
            switch (action.action_type) {
              case 'purchase':
                campaignMetrics.purchases += value
                break
              case 'omni_purchase':
                campaignMetrics.omniPurchases += value
                break
              case 'offsite_conversion.fb_pixel_purchase':
                campaignMetrics.webPurchases += value
                break
              case 'web_in_store_purchase':
              case 'onsite_web_purchase':
              case 'onsite_web_app_purchase':
                campaignMetrics.webPurchases += value
                break
            }
          })
        }
        
        // Sum all revenue types
        if (insight.action_values) {
          insight.action_values.forEach((actionValue: any) => {
            const value = parseFloat(actionValue.value || '0')
            
            switch (actionValue.action_type) {
              case 'purchase':
                campaignMetrics.revenue += value
                break
              case 'omni_purchase':
                campaignMetrics.omniRevenue += value
                break
              case 'offsite_conversion.fb_pixel_purchase':
                campaignMetrics.webRevenue += value
                break
              case 'web_in_store_purchase':
              case 'onsite_web_purchase':
              case 'onsite_web_app_purchase':
                campaignMetrics.webRevenue += value
                break
            }
          })
        }
      }
    })
    
    // Parse account insights if available
    let accountInsights: any = null
    if (insightsData.data?.[0]) {
      const insight = insightsData.data[0]
      accountInsights = {
        spend: parseFloat(insight.spend || '0'),
        impressions: parseInt(insight.impressions || '0'),
        clicks: parseInt(insight.clicks || '0'),
        actions: insight.actions || [],
        actionValues: insight.action_values || []
      }
    }
    
    return NextResponse.json({
      summary: {
        accountLevelSpend: lifetimeSpend,
        campaignSum: campaignMetrics.spend,
        discrepancy: lifetimeSpend - campaignMetrics.spend,
        discrepancyPercent: ((lifetimeSpend - campaignMetrics.spend) / lifetimeSpend * 100).toFixed(2) + '%'
      },
      metrics: {
        fromCampaigns: campaignMetrics,
        fromAccountInsights: accountInsights
      },
      campaigns: {
        total: allCampaigns.length,
        withInsights: allCampaigns.filter(c => c.insights?.data?.[0]).length,
        pagesScanned: pageCount
      },
      purchases: {
        totalPurchases: campaignMetrics.purchases,
        webPurchases: campaignMetrics.webPurchases,
        omniPurchases: campaignMetrics.omniPurchases,
        totalConversions: campaignMetrics.purchases + campaignMetrics.webPurchases + campaignMetrics.omniPurchases
      },
      revenue: {
        totalRevenue: campaignMetrics.revenue,
        webRevenue: campaignMetrics.webRevenue,
        omniRevenue: campaignMetrics.omniRevenue,
        combinedRevenue: campaignMetrics.revenue + campaignMetrics.webRevenue + campaignMetrics.omniRevenue
      },
      timeRange,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Debug lifetime metrics error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message
    }, { status: 500 })
  }
}