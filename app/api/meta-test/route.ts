import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken, adAccountId } = body

    // Try to get token from cookies if not provided
    let token = accessToken
    if (!token) {
      const cookieStore = cookies()
      token = cookieStore.get('fb_access_token')?.value
    }

    if (!token) {
      return NextResponse.json({
        valid: false,
        error: 'No access token provided'
      }, { status: 401 })
    }

    // Test token validity
    const response = await fetch(
      `https://graph.facebook.com/v19.0/me?access_token=${token}`
    )
    
    const data = await response.json()

    if (data.error) {
      return NextResponse.json({
        valid: false,
        error: data.error.message || 'Invalid token',
        errorType: data.error.type,
        errorCode: data.error.code
      })
    }

    // If ad account ID provided, test access to it
    if (adAccountId) {
      const adAccountResponse = await fetch(
        `https://graph.facebook.com/v19.0/${adAccountId}?fields=id,name,account_status&access_token=${token}`
      )
      
      const adAccountData = await adAccountResponse.json()
      
      if (adAccountData.error) {
        return NextResponse.json({
          valid: false,
          error: `Cannot access ad account: ${adAccountData.error.message}`,
          errorType: adAccountData.error.type,
          errorCode: adAccountData.error.code
        })
      }

      return NextResponse.json({
        valid: true,
        user: data,
        adAccount: adAccountData
      })
    }

    return NextResponse.json({
      valid: true,
      user: data
    })

  } catch (error: any) {
    console.error('Meta test error:', error)
    return NextResponse.json({
      valid: false,
      error: 'Network error or invalid response'
    }, { status: 500 })
  }
}