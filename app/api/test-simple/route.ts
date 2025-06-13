import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('fb_access_token')?.value
    const adAccountId = cookieStore.get('fb_selected_account')?.value
    
    if (!accessToken || !adAccountId) {
      return NextResponse.json({
        error: 'Missing credentials',
        hasToken: !!accessToken,
        hasAccount: !!adAccountId
      })
    }
    
    // Test 1: User info
    const userUrl = `https://graph.facebook.com/v19.0/me?access_token=${accessToken}`
    const userResponse = await fetch(userUrl)
    const userData = await userResponse.json()
    
    // Test 2: Account info
    const accountUrl = `https://graph.facebook.com/v19.0/${adAccountId}?fields=id,name,currency&access_token=${accessToken}`
    const accountResponse = await fetch(accountUrl)
    const accountData = await accountResponse.json()
    
    // Test 3: Simple campaigns query
    const campaignsUrl = `https://graph.facebook.com/v19.0/${adAccountId}/campaigns?limit=1&fields=id,name&access_token=${accessToken}`
    const campaignsResponse = await fetch(campaignsUrl)
    const campaignsData = await campaignsResponse.json()
    
    return NextResponse.json({
      credentials: {
        tokenLength: accessToken.length,
        accountId: adAccountId
      },
      tests: {
        user: {
          success: userResponse.ok,
          status: userResponse.status,
          data: userData
        },
        account: {
          success: accountResponse.ok,
          status: accountResponse.status,
          data: accountData
        },
        campaigns: {
          success: campaignsResponse.ok,
          status: campaignsResponse.status,
          data: campaignsData
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}