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
    
    console.log('Starting adset analysis for lifetime data...')
    
    // First, get all campaigns
    let allCampaigns: any[] = []
    let nextUrl = `${META_API_BASE}/${adAccountId}/campaigns?access_token=${accessToken}&fields=id,name,status&limit=500`
    let campaignPageCount = 0
    
    while (nextUrl && campaignPageCount < 20) {
      const response = await fetch(nextUrl)
      const data = await response.json()
      
      if (data.data) {
        allCampaigns = allCampaigns.concat(data.data)
      }
      
      nextUrl = data.paging?.next || null
      campaignPageCount++
    }
    
    console.log(`Found ${allCampaigns.length} campaigns`)
    
    // Now get adsets for each campaign
    let totalMetrics = {
      spend: 0,
      revenue: 0,
      conversions: 0,
      impressions: 0,
      clicks: 0,
      webPurchases: 0,
      omniPurchases: 0
    }
    
    let adsetCount = 0
    let adsetWithDataCount = 0
    let campaignsProcessed = 0
    
    // Process campaigns in batches to avoid timeouts
    const batchSize = 10
    for (let i = 0; i < allCampaigns.length; i += batchSize) {
      const batch = allCampaigns.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (campaign) => {
        try {
          // Get adsets for this campaign
          const adsetsUrl = `${META_API_BASE}/${campaign.id}/adsets?access_token=${accessToken}&fields=id,name,insights{spend,impressions,clicks,actions,action_values}&limit=500`
          const adsetsResponse = await fetch(adsetsUrl)
          const adsetsData = await adsetsResponse.json()
          
          if (adsetsData.data) {
            adsetCount += adsetsData.data.length
            
            adsetsData.data.forEach((adset: any) => {
              if (adset.insights?.data?.[0]) {
                adsetWithDataCount++
                const insight = adset.insights.data[0]
                
                totalMetrics.spend += parseFloat(insight.spend || '0')
                totalMetrics.impressions += parseInt(insight.impressions || '0')
                totalMetrics.clicks += parseInt(insight.clicks || '0')
                
                // Count all purchase types
                if (insight.actions) {
                  insight.actions.forEach((action: any) => {
                    const value = parseInt(action.value || '0')
                    
                    if ([
                      'purchase',
                      'omni_purchase',
                      'offsite_conversion.fb_pixel_purchase',
                      'web_in_store_purchase',
                      'onsite_web_purchase',
                      'onsite_web_app_purchase'
                    ].includes(action.action_type)) {
                      totalMetrics.conversions += value
                      
                      if (action.action_type === 'omni_purchase') {
                        totalMetrics.omniPurchases += value
                      } else {
                        totalMetrics.webPurchases += value
                      }
                    }
                  })
                }
                
                // Sum all revenue types
                if (insight.action_values) {
                  insight.action_values.forEach((actionValue: any) => {
                    const value = parseFloat(actionValue.value || '0')
                    
                    if ([
                      'purchase',
                      'omni_purchase',
                      'offsite_conversion.fb_pixel_purchase',
                      'web_in_store_purchase',
                      'onsite_web_purchase',
                      'onsite_web_app_purchase'
                    ].includes(actionValue.action_type)) {
                      totalMetrics.revenue += value
                    }
                  })
                }
              }
            })
          }
          
          campaignsProcessed++
        } catch (error) {
          console.error(`Error processing campaign ${campaign.id}:`, error)
        }
      }))
      
      console.log(`Processed ${campaignsProcessed}/${allCampaigns.length} campaigns...`)
    }
    
    // Get account spend for comparison
    const accountUrl = `${META_API_BASE}/${adAccountId}?access_token=${accessToken}&fields=amount_spent`
    const accountResponse = await fetch(accountUrl)
    const accountData = await accountResponse.json()
    const accountSpend = parseInt(accountData.amount_spent || '0') / 100
    
    return NextResponse.json({
      summary: {
        accountSpend,
        adsetSpend: totalMetrics.spend,
        discrepancy: accountSpend - totalMetrics.spend,
        discrepancyPercent: ((accountSpend - totalMetrics.spend) / accountSpend * 100).toFixed(2) + '%'
      },
      metrics: totalMetrics,
      coverage: {
        totalCampaigns: allCampaigns.length,
        totalAdsets: adsetCount,
        adsetsWithData: adsetWithDataCount,
        coveragePercent: (adsetWithDataCount / adsetCount * 100).toFixed(2) + '%'
      },
      comparison: {
        revenueVsSpend: totalMetrics.spend > 0 ? (totalMetrics.revenue / totalMetrics.spend).toFixed(2) + 'x' : '0x',
        costPerConversion: totalMetrics.conversions > 0 ? (totalMetrics.spend / totalMetrics.conversions).toFixed(2) : '0'
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Debug adsets lifetime error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message
    }, { status: 500 })
  }
}