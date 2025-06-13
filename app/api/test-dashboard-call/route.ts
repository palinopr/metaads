import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const oauthToken = cookieStore.get('fb_access_token')?.value
    const oauthAccount = cookieStore.get('fb_selected_account')?.value
    
    console.log('Test dashboard call - OAuth credentials:', {
      hasToken: !!oauthToken,
      tokenLength: oauthToken?.length,
      account: oauthAccount
    })
    
    // Simulate exactly what the dashboard does
    const apiUrl = `${request.nextUrl.origin}/api/meta`
    
    const payload = {
      type: "overview",
      datePreset: "last_7d",
      accessToken: oauthToken,
      adAccountId: oauthAccount
    }
    
    console.log('Sending to /api/meta:', payload)
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify(payload)
    })
    
    const responseText = await response.text()
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      data = { rawResponse: responseText }
    }
    
    console.log('Response from /api/meta:', {
      status: response.status,
      ok: response.ok,
      dataKeys: data ? Object.keys(data) : null
    })
    
    return NextResponse.json({
      request: {
        url: apiUrl,
        payload,
        hasOAuthCredentials: !!oauthToken && !!oauthAccount
      },
      response: {
        status: response.status,
        ok: response.ok,
        data: data
      }
    })
    
  } catch (error: any) {
    console.error('Test dashboard call error:', error)
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}