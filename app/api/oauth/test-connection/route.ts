import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('fb_access_token')?.value
    const selectedAccount = cookieStore.get('fb_selected_account')?.value

    if (!accessToken) {
      return NextResponse.json({ 
        success: false,
        error: 'No access token found in cookies',
        authenticated: false
      })
    }

    if (!selectedAccount) {
      return NextResponse.json({ 
        success: false,
        error: 'No account selected',
        authenticated: true,
        hasToken: true
      })
    }

    // Test the credentials with Facebook API
    const testUrl = `https://graph.facebook.com/v19.0/${selectedAccount}?fields=id,name,currency,timezone_name&access_token=${accessToken}`
    
    console.log('Testing OAuth connection:', {
      accountId: selectedAccount,
      tokenPreview: accessToken.substring(0, 20) + '...',
      testUrl: testUrl.replace(accessToken, 'TOKEN_HIDDEN')
    })

    const response = await fetch(testUrl)
    const data = await response.json()

    if (data.error) {
      return NextResponse.json({
        success: false,
        error: data.error.message,
        errorType: data.error.type,
        errorCode: data.error.code,
        accountId: selectedAccount,
        authenticated: true
      })
    }

    return NextResponse.json({
      success: true,
      message: 'OAuth connection is working',
      account: data,
      credentials: {
        hasToken: true,
        accountId: selectedAccount,
        accountName: data.name
      }
    })

  } catch (error: any) {
    console.error('OAuth test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message
    }, { status: 500 })
  }
}