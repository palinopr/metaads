import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Debug Campaign Request Body:', JSON.stringify(body, null, 2))
    
    const { campaignId, accessToken, adAccountId, type, datePreset } = body
    
    if (!campaignId || !accessToken) {
      return NextResponse.json({
        error: 'Missing required parameters',
        received: { campaignId, accessToken: accessToken ? 'provided' : 'missing', adAccountId, type, datePreset }
      }, { status: 400 })
    }
    
    // Test direct Meta API call
    const insightsUrl = `https://graph.facebook.com/v19.0/${campaignId}/insights`
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: 'spend,impressions,clicks,ctr,cpc,actions,action_values,conversions,cost_per_conversion'
    })
    
    console.log('Making request to:', `${insightsUrl}?${params.toString().replace(accessToken, 'TOKEN_HIDDEN')}`)
    
    const response = await fetch(`${insightsUrl}?${params}`)
    const data = await response.json()
    
    console.log('Meta API Response Status:', response.status)
    console.log('Meta API Response:', JSON.stringify(data, null, 2))
    
    return NextResponse.json({
      debug: true,
      requestData: {
        campaignId,
        accessToken: accessToken ? 'provided' : 'missing',
        adAccountId,
        type,
        datePreset
      },
      metaApiStatus: response.status,
      metaApiResponse: data,
      success: response.ok
    })
    
  } catch (error: any) {
    console.error('Debug Campaign Error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}