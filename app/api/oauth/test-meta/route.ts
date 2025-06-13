import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { useOAuth = false } = body
    
    let accessToken = body.accessToken
    let adAccountId = body.adAccountId
    
    // If useOAuth is true, get from cookies
    if (useOAuth) {
      const cookieStore = cookies()
      accessToken = cookieStore.get('fb_access_token')?.value
      adAccountId = cookieStore.get('fb_selected_account')?.value
    }
    
    if (!accessToken || !adAccountId) {
      return NextResponse.json({
        success: false,
        error: 'Missing credentials',
        details: {
          hasToken: !!accessToken,
          hasAccount: !!adAccountId,
          useOAuth
        }
      }, { status: 400 })
    }
    
    // Test the Meta API directly
    console.log('Testing Meta API with:', {
      tokenLength: accessToken.length,
      accountId: adAccountId
    })
    
    // Make a simple test request
    const testUrl = `https://graph.facebook.com/v19.0/${adAccountId}/campaigns?limit=1&fields=id,name&access_token=${accessToken}`
    
    const response = await fetch(testUrl)
    const data = await response.json()
    
    if (!response.ok) {
      console.error('Meta API test failed:', data)
      return NextResponse.json({
        success: false,
        error: 'Meta API test failed',
        metaError: data.error,
        status: response.status
      }, { status: response.status })
    }
    
    // Now test our internal API
    const internalResponse = await fetch(`${request.nextUrl.origin}/api/meta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        type: 'overview',
        datePreset: 'last_7d',
        accessToken,
        adAccountId
      })
    })
    
    const internalData = await internalResponse.json()
    
    return NextResponse.json({
      success: true,
      directMetaTest: {
        success: true,
        campaignsFound: data.data?.length || 0,
        firstCampaign: data.data?.[0]
      },
      internalApiTest: {
        success: internalResponse.ok,
        status: internalResponse.status,
        data: internalResponse.ok ? internalData : null,
        error: !internalResponse.ok ? internalData : null
      }
    })
    
  } catch (error: any) {
    console.error('Test Meta error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      message: error.message
    }, { status: 500 })
  }
}