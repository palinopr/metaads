import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testType = 'overview' } = body
    
    const cookieStore = cookies()
    const accessToken = cookieStore.get('fb_access_token')?.value
    const adAccountId = cookieStore.get('fb_selected_account')?.value
    
    console.log('Debug Meta Call - Starting with:', {
      hasToken: !!accessToken,
      tokenLength: accessToken?.length,
      adAccountId,
      testType
    })
    
    if (!accessToken || !adAccountId) {
      return NextResponse.json({
        error: 'Missing credentials',
        hasToken: !!accessToken,
        hasAccount: !!adAccountId
      }, { status: 400 })
    }
    
    // Log the exact request we're making
    const requestBody = {
      type: testType,
      datePreset: 'last_7d',
      accessToken,
      adAccountId
    }
    
    console.log('Sending to /api/meta:', {
      bodyKeys: Object.keys(requestBody),
      type: requestBody.type,
      hasToken: !!requestBody.accessToken,
      tokenLength: requestBody.accessToken.length,
      accountId: requestBody.adAccountId
    })
    
    const apiUrl = `${request.nextUrl.origin}/api/meta`
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify(requestBody)
    })
    
    const responseText = await response.text()
    console.log('Response status:', response.status)
    console.log('Response text preview:', responseText.substring(0, 500))
    
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = { rawText: responseText }
    }
    
    return NextResponse.json({
      request: {
        url: apiUrl,
        body: {
          ...requestBody,
          accessToken: requestBody.accessToken.substring(0, 20) + '...'
        }
      },
      response: {
        status: response.status,
        ok: response.ok,
        data: responseData
      },
      debug: {
        timestamp: new Date().toISOString(),
        headers: Object.fromEntries(response.headers.entries())
      }
    })
    
  } catch (error: any) {
    console.error('Debug meta call error:', error)
    return NextResponse.json({
      error: 'Debug test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}