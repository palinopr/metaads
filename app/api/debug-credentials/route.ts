import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    // Get OAuth credentials from cookies
    const oauthToken = cookieStore.get('fb_access_token')?.value
    const oauthAccount = cookieStore.get('fb_selected_account')?.value
    
    // Get credentials from localStorage (via request if needed)
    const localStorageCheck = {
      message: "Check localStorage in browser console with: localStorage.getItem('meta_access_token')"
    }
    
    // Test a simple Meta API call if we have credentials
    let metaApiTest = null
    if (oauthToken && oauthAccount) {
      try {
        const url = `https://graph.facebook.com/v19.0/me?access_token=${oauthToken}`
        const response = await fetch(url)
        const data = await response.json()
        
        metaApiTest = {
          userTest: {
            success: response.ok,
            data: response.ok ? data : null,
            error: !response.ok ? data.error : null
          }
        }
        
        // Also test the ad account
        if (response.ok) {
          const accountUrl = `https://graph.facebook.com/v19.0/${oauthAccount}?fields=id,name,currency&access_token=${oauthToken}`
          const accountResponse = await fetch(accountUrl)
          const accountData = await accountResponse.json()
          
          metaApiTest.accountTest = {
            success: accountResponse.ok,
            data: accountResponse.ok ? accountData : null,
            error: !accountResponse.ok ? accountData.error : null,
            accountId: oauthAccount
          }
        }
      } catch (error: any) {
        metaApiTest = { error: error.message }
      }
    }
    
    return NextResponse.json({
      oauth: {
        hasToken: !!oauthToken,
        tokenLength: oauthToken?.length || 0,
        tokenPreview: oauthToken ? `${oauthToken.substring(0, 20)}...` : null,
        selectedAccount: oauthAccount,
        accountFormat: {
          hasActPrefix: oauthAccount?.startsWith('act_'),
          raw: oauthAccount
        }
      },
      localStorage: localStorageCheck,
      metaApiTest,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug error',
      message: error.message
    }, { status: 500 })
  }
}