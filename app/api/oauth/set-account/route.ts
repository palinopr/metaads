import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json()
    
    if (!accountId) {
      return NextResponse.json({ 
        error: 'Account ID is required' 
      }, { status: 400 })
    }

    const cookieStore = cookies()
    const accessToken = cookieStore.get('fb_access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Not authenticated. Please connect with Facebook first.' 
      }, { status: 401 })
    }

    // Store the selected account
    const response = NextResponse.json({
      success: true,
      message: 'Account selected successfully',
      redirectUrl: '/dashboard'
    })

    // Set the selected account in a cookie
    response.cookies.set('fb_selected_account', accountId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 60, // 60 days
    })

    return response

  } catch (error: any) {
    console.error('Set account error:', error)
    return NextResponse.json({
      error: 'Failed to set account',
      details: error.message
    }, { status: 500 })
  }
}