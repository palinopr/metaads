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
    
    // Get ALL campaigns with pagination
    let allCampaigns: any[] = []
    let nextUrl = `${META_API_BASE}/${adAccountId}/campaigns?access_token=${accessToken}&fields=id,name,status,effective_status,insights{spend}&limit=100`
    
    while (nextUrl) {
      const response = await fetch(nextUrl)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'API Error')
      }
      
      if (data.data) {
        allCampaigns = allCampaigns.concat(data.data)
      }
      
      nextUrl = data.paging?.next || null
    }
    
    // Process all campaigns
    const campaignsWithSpend = allCampaigns
      .map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        effective_status: c.effective_status,
        spend: parseFloat(c.insights?.data?.[0]?.spend || '0')
      }))
      .filter(c => c.spend > 0)
      .sort((a, b) => b.spend - a.spend)
    
    const totalFromCampaigns = campaignsWithSpend.reduce((sum, c) => sum + c.spend, 0)
    
    return NextResponse.json({
      summary: {
        totalCampaigns: allCampaigns.length,
        campaignsWithSpend: campaignsWithSpend.length,
        totalSpend: totalFromCampaigns,
        metaWebShows: 23963.01,
        discrepancy: totalFromCampaigns - 23963.01
      },
      topCampaigns: campaignsWithSpend.slice(0, 10),
      allCampaignsWithSpend: campaignsWithSpend,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Debug all campaigns error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message
    }, { status: 500 })
  }
}