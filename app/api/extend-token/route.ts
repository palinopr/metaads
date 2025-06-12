import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { shortLivedToken } = await request.json()
    
    if (!shortLivedToken) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }
    
    // Exchange short-lived token for long-lived token
    const url = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
    url.searchParams.append('grant_type', 'fb_exchange_token')
    url.searchParams.append('client_id', '1349075236218599') // Your App ID
    url.searchParams.append('client_secret', process.env.FACEBOOK_APP_SECRET || 'YOUR_APP_SECRET_HERE')
    url.searchParams.append('fb_exchange_token', shortLivedToken)
    
    const response = await fetch(url.toString())
    const data = await response.json()
    
    if (data.access_token) {
      return NextResponse.json({
        success: true,
        longLivedToken: data.access_token,
        expiresIn: data.expires_in, // Usually 5184000 seconds (60 days)
        expiresInDays: Math.floor(data.expires_in / 86400)
      })
    } else {
      return NextResponse.json({
        error: 'Failed to extend token',
        details: data
      }, { status: 400 })
    }
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to extend token',
      message: error.message
    }, { status: 500 })
  }
}