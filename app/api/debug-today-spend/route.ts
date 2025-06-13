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
    
    // First get account timezone
    const accountUrl = `${META_API_BASE}/${adAccountId}`
    const accountResponse = await fetch(
      `${accountUrl}?access_token=${accessToken}&fields=timezone_name,timezone_offset_hours_utc`
    )
    const accountData = await accountResponse.json()
    
    console.log('Account timezone:', accountData.timezone_name)
    
    // Get today's date in account timezone
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    // Method 1: Account insights with specific date
    const insightsUrl1 = `${META_API_BASE}/${adAccountId}/insights`
    const insights1Response = await fetch(
      `${insightsUrl1}?access_token=${accessToken}&fields=spend,impressions,clicks,actions,action_values&time_range=${JSON.stringify({since: todayStr, until: todayStr})}`
    )
    const insights1Data = await insights1Response.json()
    
    // Method 2: Account insights with date_preset=today
    const insights2Response = await fetch(
      `${insightsUrl1}?access_token=${accessToken}&fields=spend,impressions,clicks,actions,action_values&date_preset=today`
    )
    const insights2Data = await insights2Response.json()
    
    // Method 3: Campaign level with today
    const campaignsUrl = `${META_API_BASE}/${adAccountId}/campaigns`
    const campaignsResponse = await fetch(
      `${campaignsUrl}?access_token=${accessToken}&fields=insights.date_preset(today){spend}&limit=500`
    )
    const campaignsData = await campaignsResponse.json()
    
    let campaignSpend = 0
    if (campaignsData.data) {
      campaignsData.data.forEach((campaign: any) => {
        if (campaign.insights?.data?.[0]?.spend) {
          campaignSpend += parseFloat(campaign.insights.data[0].spend)
        }
      })
    }
    
    // Method 4: Active campaigns only
    const activeCampaignsResponse = await fetch(
      `${campaignsUrl}?access_token=${accessToken}&fields=insights.date_preset(today){spend}&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]&limit=500`
    )
    const activeCampaignsData = await activeCampaignsResponse.json()
    
    let activeSpend = 0
    if (activeCampaignsData.data) {
      activeCampaignsData.data.forEach((campaign: any) => {
        if (campaign.insights?.data?.[0]?.spend) {
          activeSpend += parseFloat(campaign.insights.data[0].spend)
        }
      })
    }
    
    // Method 5: Adset level for today
    let adsetSpend = 0
    let adsetCount = 0
    
    // Get active campaigns first
    const activeCampaigns = campaignsData.data?.filter((c: any) => 
      c.status === 'ACTIVE' || c.effective_status === 'ACTIVE'
    ) || []
    
    // Get adsets for active campaigns
    for (const campaign of activeCampaigns.slice(0, 10)) { // Limit to 10 for speed
      try {
        const adsetsUrl = `${META_API_BASE}/${campaign.id}/adsets`
        const adsetsResponse = await fetch(
          `${adsetsUrl}?access_token=${accessToken}&fields=insights.date_preset(today){spend}&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]&limit=100`
        )
        const adsetsData = await adsetsResponse.json()
        
        if (adsetsData.data) {
          adsetsData.data.forEach((adset: any) => {
            adsetCount++
            if (adset.insights?.data?.[0]?.spend) {
              adsetSpend += parseFloat(adset.insights.data[0].spend)
            }
          })
        }
      } catch (error) {
        console.error(`Error fetching adsets for campaign ${campaign.id}:`, error)
      }
    }
    
    return NextResponse.json({
      timezone: {
        name: accountData.timezone_name,
        offset: accountData.timezone_offset_hours_utc,
        currentTime: new Date().toISOString(),
        todayDate: todayStr
      },
      spendComparison: {
        metaUIShows: 508.65,
        accountInsightsTimeRange: parseFloat(insights1Data.data?.[0]?.spend || '0'),
        accountInsightsToday: parseFloat(insights2Data.data?.[0]?.spend || '0'),
        campaignSum: campaignSpend,
        activeCampaignsOnly: activeSpend,
        adsetSum: adsetSpend,
        yourDashboardShows: 562.64
      },
      details: {
        accountInsightsData: insights2Data.data?.[0],
        totalCampaigns: campaignsData.data?.length || 0,
        activeCampaigns: activeCampaigns.length,
        adsetsChecked: adsetCount
      },
      recommendations: {
        mostAccurate: 'accountInsightsToday',
        explanation: 'Use account-level insights with date_preset=today for exact match with Meta UI'
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Debug today spend error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message
    }, { status: 500 })
  }
}