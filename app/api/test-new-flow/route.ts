import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { datePreset = 'today' } = body
    
    const cookieStore = cookies()
    const accessToken = cookieStore.get('fb_access_token')?.value
    const adAccountId = cookieStore.get('fb_selected_account')?.value
    
    if (!accessToken || !adAccountId) {
      return NextResponse.json({
        error: 'Missing credentials',
        success: false
      }, { status: 401 })
    }
    
    // Test 1: Account insights
    const accountInsightsResponse = await fetch('/api/account-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datePreset,
        accessToken,
        adAccountId
      })
    })
    const accountInsights = await accountInsightsResponse.json()
    
    // Test 2: Direct campaigns
    const campaignsResponse = await fetch('/api/direct-campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datePreset,
        accessToken,
        adAccountId
      })
    })
    const campaigns = await campaignsResponse.json()
    
    return NextResponse.json({
      success: true,
      datePreset,
      accountInsights: {
        success: accountInsights.success,
        metrics: accountInsights.metrics,
        error: accountInsights.error
      },
      campaigns: {
        success: campaigns.success,
        campaignCount: campaigns.campaigns?.length || 0,
        totalSpend: campaigns.debug?.totalSpend || 0,
        error: campaigns.error
      },
      combinedData: {
        useAccountLevel: accountInsights.success,
        totalSpend: accountInsights.success ? accountInsights.metrics?.spend : campaigns.debug?.totalSpend,
        totalRevenue: accountInsights.success ? accountInsights.metrics?.revenue : 0,
        totalConversions: accountInsights.success ? accountInsights.metrics?.conversions : 0,
        campaignList: campaigns.success ? campaigns.campaigns : []
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      message: error.message
    }, { status: 500 })
  }
}