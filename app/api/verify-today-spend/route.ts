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
    
    // Get today's spend using account-level insights with date_preset=today
    const insightsUrl = `${META_API_BASE}/${adAccountId}/insights`
    const response = await fetch(
      `${insightsUrl}?access_token=${accessToken}&fields=spend,impressions,clicks,actions,action_values&date_preset=today`
    )
    const data = await response.json()
    
    const todaySpend = parseFloat(data.data?.[0]?.spend || '0')
    
    return NextResponse.json({
      success: true,
      todaySpend,
      expectedMetaUIValue: 508.65,
      matches: Math.abs(todaySpend - 508.65) < 0.01,
      rawData: data.data?.[0],
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Verify today spend error:', error)
    return NextResponse.json({
      error: 'Verification failed',
      message: error.message
    }, { status: 500 })
  }
}