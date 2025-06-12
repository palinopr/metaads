import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('fb_access_token')?.value
    const adAccounts = cookieStore.get('fb_ad_accounts')?.value

    if (!accessToken) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No access token found'
      })
    }

    // Validate token with Facebook
    const response = await fetch(
      `https://graph.facebook.com/v19.0/me?access_token=${accessToken}`
    )
    
    if (!response.ok) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'Invalid or expired token'
      })
    }

    const userData = await response.json()
    const parsedAdAccounts = adAccounts ? JSON.parse(adAccounts) : []

    return NextResponse.json({
      authenticated: true,
      user: userData,
      adAccounts: parsedAdAccounts,
      token: accessToken // Only return for authenticated requests
    })
  } catch (error) {
    console.error('OAuth status error:', error)
    return NextResponse.json({ 
      authenticated: false,
      message: 'Error checking authentication status'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  // Logout - clear cookies
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
  
  response.cookies.delete('fb_access_token')
  response.cookies.delete('fb_ad_accounts')
  
  return response
}