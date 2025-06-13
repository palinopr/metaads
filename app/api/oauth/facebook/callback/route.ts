import { NextRequest, NextResponse } from 'next/server'
import { getOAuthConfig } from '@/lib/oauth-config'

export async function GET(request: NextRequest) {
  // Get OAuth configuration
  const config = getOAuthConfig()
  const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, REDIRECT_URI } = config
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  const appUrl = 'https://metaads-production.up.railway.app'

  if (error) {
    console.error('Facebook OAuth error:', error)
    return NextResponse.redirect(new URL('/?error=oauth_failed', appUrl))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', appUrl))
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: FACEBOOK_APP_ID || '',
        client_secret: FACEBOOK_APP_SECRET || '',
        redirect_uri: REDIRECT_URI,
        code: code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData.error)
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', appUrl))
    }

    // Get user's ad accounts with pagination
    let allAccounts = []
    let nextPage = `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&limit=200&access_token=${tokenData.access_token}`
    let pageCount = 0
    
    // Fetch all pages of ad accounts
    while (nextPage) {
      console.log(`Fetching page ${pageCount + 1} of ad accounts...`)
      const adAccountsResponse = await fetch(nextPage)
      const adAccountsData = await adAccountsResponse.json()
      
      if (adAccountsData.data) {
        allAccounts = [...allAccounts, ...adAccountsData.data]
        console.log(`Page ${pageCount + 1}: Found ${adAccountsData.data.length} accounts, total so far: ${allAccounts.length}`)
      }
      
      // Check for next page
      nextPage = adAccountsData.paging?.next || null
      pageCount++
      
      // Safety limit to prevent infinite loops
      if (allAccounts.length > 1000 || pageCount > 20) {
        console.log('Reached limit, stopping pagination')
        break
      }
    }
    
    console.log(`Fetched total of ${allAccounts.length} ad accounts across ${pageCount} pages`)

    // Store token and account info in session/cookie
    // Use the correct app URL for redirect
    const appUrl = 'https://metaads-production.up.railway.app'
    const response = NextResponse.redirect(new URL('/setup-complete', appUrl))
    
    // Set secure HTTP-only cookies
    response.cookies.set('fb_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 60, // 60 days
    })

    if (allAccounts.length > 0) {
      response.cookies.set('fb_ad_accounts', JSON.stringify(allAccounts), {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 60, // 60 days
      })
    }

    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/?error=callback_failed', appUrl))
  }
}