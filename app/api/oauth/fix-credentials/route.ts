import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken, adAccountId } = body

    if (!accessToken || !adAccountId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required credentials'
      }, { status: 400 })
    }

    // Validate the credentials first
    const testUrl = `https://graph.facebook.com/v19.0/${adAccountId}?fields=id,name,currency&access_token=${accessToken}`
    const testResponse = await fetch(testUrl)
    const testData = await testResponse.json()

    if (!testResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials',
        details: testData.error
      }, { status: 400 })
    }

    // Set cookies with proper options
    const response = NextResponse.json({
      success: true,
      message: 'Credentials fixed successfully',
      account: testData
    })

    // Set cookies with the correct options for production
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    }

    response.cookies.set('fb_access_token', accessToken, cookieOptions)
    response.cookies.set('fb_selected_account', adAccountId, cookieOptions)

    return response
  } catch (error: any) {
    console.error('Fix credentials error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fix credentials',
      message: error.message
    }, { status: 500 })
  }
}