import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const cookieStore = cookies()
    const accessToken = body.accessToken || cookieStore.get('fb_access_token')?.value
    const adAccountId = body.adAccountId || cookieStore.get('fb_selected_account')?.value
    
    if (!accessToken || !adAccountId) {
      return NextResponse.json({
        error: 'Missing credentials',
        hasToken: !!accessToken,
        hasAccountId: !!adAccountId
      }, { status: 400 })
    }
    
    // Try a simple API call
    const url = `https://graph.facebook.com/v19.0/${adAccountId}?fields=id,name&access_token=${accessToken}`
    
    console.log('Attempting fetch to:', url.split('access_token=')[0] + 'access_token=***')
    
    try {
      const response = await fetch(url)
      const data = await response.json()
      
      return NextResponse.json({
        success: response.ok,
        status: response.status,
        data: response.ok ? data : null,
        error: !response.ok ? data.error : null,
        debug: {
          url: url.split('access_token=')[0],
          method: 'GET',
          timestamp: new Date().toISOString()
        }
      })
    } catch (fetchError: any) {
      return NextResponse.json({
        success: false,
        fetchError: {
          message: fetchError.message,
          cause: fetchError.cause,
          stack: fetchError.stack?.split('\n').slice(0, 5),
          type: fetchError.constructor.name
        },
        debug: {
          url: url.split('access_token=')[0],
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Request processing failed',
      message: error.message,
      type: error.constructor.name
    }, { status: 500 })
  }
}