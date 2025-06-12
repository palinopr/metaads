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
        success: false,
        error: 'No access token provided'
      }, { status: 401 })
    }

    // Test the token with a simple API call
    const testUrl = adAccountId 
      ? `https://graph.facebook.com/v19.0/${adAccountId}?access_token=${token}`
      : `https://graph.facebook.com/v19.0/me?access_token=${token}`

    const response = await fetch(testUrl)
    const data = await response.json()

    if (data.error) {
      return NextResponse.json({
        success: false,
        error: data.error.message || 'Token validation failed',
        errorCode: data.error.code
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Token is valid',
      data: data
    })

  } catch (error: any) {
    console.error('Test meta API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}