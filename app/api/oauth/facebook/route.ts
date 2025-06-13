import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // Access environment variables at runtime
  const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID
  const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`
  const REDIRECT_URI = `${APP_URL}/api/oauth/facebook/callback`

  console.log('OAuth Debug:', {
    FACEBOOK_APP_ID: FACEBOOK_APP_ID ? 'Set' : 'Missing',
    APP_URL,
    REDIRECT_URI
  })

  if (action === 'login') {
    if (!FACEBOOK_APP_ID) {
      return NextResponse.json({ 
        error: 'Facebook App ID not configured. Please set FACEBOOK_APP_ID environment variable.' 
      }, { status: 500 })
    }

    // Redirect to Facebook OAuth
    const scopes = [
      'ads_read',
      'ads_management', 
      'business_management',
      'read_insights'
    ].join(',')

    const facebookAuthUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth')
    facebookAuthUrl.searchParams.set('client_id', FACEBOOK_APP_ID)
    facebookAuthUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    facebookAuthUrl.searchParams.set('scope', scopes)
    facebookAuthUrl.searchParams.set('response_type', 'code')
    facebookAuthUrl.searchParams.set('state', Math.random().toString(36).substring(7))

    return NextResponse.redirect(facebookAuthUrl.toString())
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}