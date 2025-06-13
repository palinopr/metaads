import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('fb_access_token')?.value
    const adAccountId = cookieStore.get('fb_selected_account')?.value
    
    // Test 1: Check credentials
    const credentialsCheck = {
      hasAccessToken: !!accessToken,
      accessTokenLength: accessToken?.length || 0,
      hasAdAccountId: !!adAccountId,
      adAccountId: adAccountId || 'none'
    }
    
    // Test 2: Check environment
    const envCheck = {
      nodeVersion: process.version,
      platform: process.platform,
      isProduction: process.env.NODE_ENV === 'production',
      isRailway: !!process.env.RAILWAY_ENVIRONMENT,
      railwayEnv: process.env.RAILWAY_ENVIRONMENT || 'none'
    }
    
    // Test 3: Test Meta API connectivity
    let metaApiCheck = {
      success: false,
      error: null as any,
      responseStatus: 0
    }
    
    if (accessToken) {
      try {
        const testUrl = `https://graph.facebook.com/v19.0/me?access_token=${accessToken}`
        const response = await fetch(testUrl)
        metaApiCheck.success = response.ok
        metaApiCheck.responseStatus = response.status
        
        if (!response.ok) {
          const errorData = await response.json()
          metaApiCheck.error = errorData.error
        }
      } catch (error: any) {
        metaApiCheck.error = {
          message: error.message,
          cause: error.cause,
          type: error.constructor.name
        }
      }
    }
    
    // Test 4: Test basic fetch
    let fetchTest = {
      success: false,
      error: null as any
    }
    
    try {
      const response = await fetch('https://graph.facebook.com/v19.0/')
      fetchTest.success = response.ok
    } catch (error: any) {
      fetchTest.error = {
        message: error.message,
        cause: error.cause,
        type: error.constructor.name
      }
    }
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        credentials: credentialsCheck,
        environment: envCheck,
        metaApi: metaApiCheck,
        basicFetch: fetchTest
      },
      recommendations: {
        credentialIssue: !credentialsCheck.hasAccessToken ? 'No access token found in cookies' : null,
        metaApiIssue: !metaApiCheck.success ? 'Meta API connection failed - check token validity' : null,
        fetchIssue: !fetchTest.success ? 'Basic fetch failed - possible network/firewall issue' : null
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}