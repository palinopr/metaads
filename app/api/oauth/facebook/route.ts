import { NextRequest, NextResponse } from 'next/server'

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/facebook/callback'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'login') {
    // Redirect to Facebook OAuth
    const scopes = [
      'ads_read',
      'ads_management', 
      'business_management',
      'read_insights'
    ].join(',')

    const facebookAuthUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth')
    facebookAuthUrl.searchParams.set('client_id', FACEBOOK_APP_ID || '')
    facebookAuthUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    facebookAuthUrl.searchParams.set('scope', scopes)
    facebookAuthUrl.searchParams.set('response_type', 'code')
    facebookAuthUrl.searchParams.set('state', Math.random().toString(36).substring(7))

    return NextResponse.redirect(facebookAuthUrl.toString())
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}