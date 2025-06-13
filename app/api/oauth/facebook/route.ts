import { NextRequest, NextResponse } from 'next/server'
import { getOAuthConfig } from '@/lib/oauth-config'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // Get OAuth configuration
  const config = getOAuthConfig()
  const { FACEBOOK_APP_ID, APP_URL, REDIRECT_URI } = config

  console.log('OAuth Debug:', {
    FACEBOOK_APP_ID: FACEBOOK_APP_ID ? 'Set' : 'Missing',
    APP_URL,
    REDIRECT_URI
  })

  if (action === 'login') {
    if (!FACEBOOK_APP_ID) {
      return NextResponse.json({ 
        error: 'Facebook App ID not configured.' 
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