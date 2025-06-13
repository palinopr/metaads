import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const META_API_BASE = 'https://graph.facebook.com/v19.0'

export async function POST(request: NextRequest) {
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
    
    // Test different date ranges
    const dateRanges = ['today', 'yesterday', 'last_7d', 'last_30d']
    const results: any = {}
    
    for (const datePreset of dateRanges) {
      try {
        const campaignsUrl = `${META_API_BASE}/${adAccountId}/campaigns`
        const params = new URLSearchParams({
          access_token: accessToken,
          fields: `id,name,insights.date_preset(${datePreset}){spend,impressions,clicks}`,
          limit: '10'
        })
        
        const response = await fetch(`${campaignsUrl}?${params}`)
        const data = await response.json()
        
        if (!response.ok) {
          results[datePreset] = { error: data.error?.message || 'API Error' }
          continue
        }
        
        // Calculate total spend for this date range
        let totalSpend = 0
        let campaignCount = 0
        
        if (data.data) {
          data.data.forEach((campaign: any) => {
            if (campaign.insights?.data?.[0]) {
              totalSpend += parseFloat(campaign.insights.data[0].spend || '0')
              campaignCount++
            }
          })
        }
        
        results[datePreset] = {
          totalSpend,
          campaignCount,
          campaigns: data.data?.slice(0, 3).map((c: any) => ({
            name: c.name,
            spend: c.insights?.data?.[0]?.spend || '0'
          }))
        }
      } catch (error: any) {
        results[datePreset] = { error: error.message }
      }
    }
    
    return NextResponse.json({
      results,
      timestamp: new Date().toISOString(),
      success: true
    })
    
  } catch (error: any) {
    console.error('Test date ranges error:', error)
    return NextResponse.json({
      error: 'Test failed',
      message: error.message
    }, { status: 500 })
  }
}