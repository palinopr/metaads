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
    
    // Get account timezone first
    const accountUrl = `${META_API_BASE}/${adAccountId}`
    const accountResponse = await fetch(
      `${accountUrl}?access_token=${accessToken}&fields=timezone_name,timezone_offset_hours_utc,account_id,name`
    )
    const accountData = await accountResponse.json()
    
    // Method 1: Account insights with date_preset=today (what we use now)
    const insightsUrl = `${META_API_BASE}/${adAccountId}/insights`
    const todayResponse = await fetch(
      `${insightsUrl}?access_token=${accessToken}&fields=spend,impressions,clicks,actions,action_values&date_preset=today`
    )
    const todayData = await todayResponse.json()
    
    // Method 2: With specific time_range for today in account timezone
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1)
    
    const timeRangeResponse = await fetch(
      `${insightsUrl}?access_token=${accessToken}&fields=spend&time_range=${JSON.stringify({
        since: todayStart.toISOString().split('T')[0],
        until: todayEnd.toISOString().split('T')[0]
      })}`
    )
    const timeRangeData = await timeRangeResponse.json()
    
    // Method 3: Get all active campaigns for today
    const campaignsUrl = `${META_API_BASE}/${adAccountId}/campaigns`
    const campaignsResponse = await fetch(
      `${campaignsUrl}?access_token=${accessToken}&fields=insights.date_preset(today){spend}&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]&limit=500`
    )
    const campaignsData = await campaignsResponse.json()
    
    let campaignSum = 0
    if (campaignsData.data) {
      campaignsData.data.forEach((campaign: any) => {
        if (campaign.insights?.data?.[0]?.spend) {
          campaignSum += parseFloat(campaign.insights.data[0].spend)
        }
      })
    }
    
    const ourValue = parseFloat(todayData.data?.[0]?.spend || '0')
    const metaUIValue = 573.06
    const difference = ourValue - metaUIValue
    const percentDiff = ((difference / metaUIValue) * 100).toFixed(2)
    
    return NextResponse.json({
      comparison: {
        metaUIShows: metaUIValue,
        ourDashboardShows: ourValue,
        difference: difference.toFixed(2),
        percentageDifference: `${percentDiff}%`,
        withinAcceptableRange: Math.abs(difference) < 5
      },
      allMethods: {
        accountInsightsToday: parseFloat(todayData.data?.[0]?.spend || '0'),
        accountInsightsTimeRange: parseFloat(timeRangeData.data?.[0]?.spend || '0'),
        activeCampaignsSum: campaignSum
      },
      timezone: {
        accountTimezone: accountData.timezone_name,
        serverTime: new Date().toISOString(),
        accountId: accountData.account_id
      },
      rawData: {
        todayInsights: todayData.data?.[0],
        totalCampaigns: campaignsData.data?.length || 0
      },
      recommendation: Math.abs(difference) < 5 
        ? "Values are within acceptable range. Small differences are normal due to real-time updates."
        : "Consider checking timezone settings or API data freshness.",
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Compare realtime spend error:', error)
    return NextResponse.json({
      error: 'Comparison failed',
      message: error.message
    }, { status: 500 })
  }
}