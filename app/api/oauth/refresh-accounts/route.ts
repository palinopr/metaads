import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('fb_access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    // Get all ad accounts with pagination
    let allAccounts = []
    let nextPage = `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&limit=200&access_token=${accessToken}`
    let pageCount = 0
    
    while (nextPage) {
      const adAccountsResponse = await fetch(nextPage)
      const adAccountsData = await adAccountsResponse.json()
      
      if (adAccountsData.error) {
        return NextResponse.json({ 
          error: adAccountsData.error.message 
        }, { status: 400 })
      }
      
      if (adAccountsData.data) {
        allAccounts = [...allAccounts, ...adAccountsData.data]
      }
      
      nextPage = adAccountsData.paging?.next || null
      pageCount++
      
      if (allAccounts.length > 1000 || pageCount > 20) break
    }

    // Update the cookie with all accounts
    const response = NextResponse.json({
      success: true,
      totalAccounts: allAccounts.length,
      pages: pageCount,
      accounts: allAccounts
    })

    response.cookies.set('fb_ad_accounts', JSON.stringify(allAccounts), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 60, // 60 days
    })

    return response

  } catch (error: any) {
    console.error('Refresh accounts error:', error)
    return NextResponse.json({
      error: 'Failed to refresh accounts',
      details: error.message
    }, { status: 500 })
  }
}