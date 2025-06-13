import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('fb_access_token')?.value
    const selectedAccount = cookieStore.get('fb_selected_account')?.value
    
    // Step 1: Check cookies
    const cookieCheck = {
      hasAccessToken: !!accessToken,
      hasSelectedAccount: !!selectedAccount,
      tokenLength: accessToken?.length || 0,
      selectedAccount: selectedAccount
    }
    
    // Step 2: If we have credentials, test them
    let apiTest = null
    if (accessToken && selectedAccount) {
      try {
        // Test with Meta API directly
        const testUrl = `https://graph.facebook.com/v19.0/${selectedAccount}?fields=id,name,currency&access_token=${accessToken}`
        const response = await fetch(testUrl)
        const data = await response.json()
        
        apiTest = {
          directTest: {
            success: response.ok,
            status: response.status,
            data: response.ok ? data : null,
            error: !response.ok ? data.error : null
          }
        }
        
        // Also test via our API endpoint
        const ourApiResponse = await fetch(`${request.nextUrl.origin}/api/meta`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            type: 'test_connection',
            adAccountId: selectedAccount,
            accessToken: accessToken
          })
        })
        
        const ourApiData = await ourApiResponse.json()
        apiTest.viaOurApi = {
          success: ourApiResponse.ok,
          status: ourApiResponse.status,
          data: ourApiData
        }
      } catch (error: any) {
        apiTest = {
          error: error.message
        }
      }
    }
    
    // Step 3: Provide recommendations
    const recommendations = []
    if (!cookieCheck.hasAccessToken) {
      recommendations.push('No access token found in cookies. Please reconnect via OAuth.')
    }
    if (!cookieCheck.hasSelectedAccount) {
      recommendations.push('No ad account selected. Please select an account.')
    }
    if (apiTest?.directTest && !apiTest.directTest.success) {
      recommendations.push('Direct API test failed. Token may be invalid or expired.')
    }
    if (apiTest?.viaOurApi && !apiTest.viaOurApi.success) {
      recommendations.push('Our API endpoint test failed. Check server logs.')
    }
    
    return NextResponse.json({
      cookies: cookieCheck,
      apiTests: apiTest,
      recommendations,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Verification error',
      message: error.message
    }, { status: 500 })
  }
}