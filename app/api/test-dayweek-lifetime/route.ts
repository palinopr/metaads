import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('fb_access_token')?.value
    const campaignId = request.nextUrl.searchParams.get('campaignId') || '120214244214850527'
    
    if (!accessToken) {
      return NextResponse.json({
        error: 'Missing access token',
        success: false
      }, { status: 401 })
    }
    
    const cleanToken = accessToken.replace(/^Bearer\s+/i, '')
    
    // First get campaign created_time
    const campaignUrl = `https://graph.facebook.com/v19.0/${campaignId}?fields=created_time,name&access_token=${cleanToken}`
    const campaignRes = await fetch(campaignUrl)
    const campaignData = await campaignRes.json()
    
    console.log('Campaign data:', campaignData)
    
    const startDate = campaignData.created_time ? 
      campaignData.created_time.split('T')[0] : 
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const endDate = new Date().toISOString().split('T')[0]
    const timeRange = JSON.stringify({ since: startDate, until: endDate })
    
    // Test different API calls
    const tests = []
    
    // Test 1: Time range without breakdown
    const test1Url = `https://graph.facebook.com/v19.0/${campaignId}/insights?fields=spend,impressions,clicks&time_range=${timeRange}&access_token=${cleanToken}`
    const test1Res = await fetch(test1Url)
    const test1Data = await test1Res.json()
    tests.push({
      test: 'Basic time_range',
      success: !test1Data.error,
      data: test1Data.error || test1Data.data?.[0]
    })
    
    // Test 2: Time range with daily increment
    const test2Url = `https://graph.facebook.com/v19.0/${campaignId}/insights?fields=spend,impressions,clicks&time_range=${timeRange}&time_increment=1&access_token=${cleanToken}`
    const test2Res = await fetch(test2Url)
    const test2Data = await test2Res.json()
    tests.push({
      test: 'Daily increment',
      success: !test2Data.error,
      recordCount: test2Data.data?.length || 0,
      error: test2Data.error
    })
    
    // Test 3: Hourly breakdown (might not work for long ranges)
    const test3Url = `https://graph.facebook.com/v19.0/${campaignId}/insights?fields=spend,impressions,clicks&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone&time_range=${timeRange}&time_increment=1&limit=100&access_token=${cleanToken}`
    const test3Res = await fetch(test3Url)
    const test3Data = await test3Res.json()
    tests.push({
      test: 'Hourly breakdown',
      success: !test3Data.error,
      recordCount: test3Data.data?.length || 0,
      error: test3Data.error
    })
    
    // Test 4: Last 30 days with hourly breakdown (fallback)
    const last30TimeRange = JSON.stringify({
      since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      until: endDate
    })
    const test4Url = `https://graph.facebook.com/v19.0/${campaignId}/insights?fields=spend,impressions,clicks&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone&time_range=${last30TimeRange}&time_increment=1&limit=1000&access_token=${cleanToken}`
    const test4Res = await fetch(test4Url)
    const test4Data = await test4Res.json()
    tests.push({
      test: 'Last 30 days hourly',
      success: !test4Data.error,
      recordCount: test4Data.data?.length || 0,
      error: test4Data.error
    })
    
    return NextResponse.json({
      campaign: {
        id: campaignId,
        name: campaignData.name,
        created_time: campaignData.created_time,
        startDate,
        endDate
      },
      tests,
      recommendation: 'For lifetime data with long date ranges, hourly breakdowns might not be available. Consider using daily aggregation or limiting to last 30-90 days for hourly data.'
    })
    
  } catch (error: any) {
    console.error('Test dayweek lifetime error:', error)
    return NextResponse.json({
      error: 'Test failed',
      message: error.message
    }, { status: 500 })
  }
}