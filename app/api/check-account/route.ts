import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { accessToken, adAccountId } = await request.json()
    
    if (!accessToken || !adAccountId) {
      return NextResponse.json(
        { error: 'Missing credentials' },
        { status: 400 }
      )
    }

    // First, check if the user has access to this specific account
    const checkUrl = `https://graph.facebook.com/v19.0/${adAccountId}?access_token=${accessToken}&fields=id,name,account_status,currency`
    
    console.log('Checking account access for:', adAccountId)
    
    const response = await fetch(checkUrl)
    const data = await response.json()
    
    if (!response.ok) {
      // If 403, check what accounts the user DOES have access to
      if (response.status === 403 || response.status === 400) {
        const accountsUrl = `https://graph.facebook.com/v19.0/me/adaccounts?access_token=${accessToken}&limit=100&fields=id,name,account_status`
        const accountsResponse = await fetch(accountsUrl)
        const accountsData = await accountsResponse.json()
        
        if (accountsResponse.ok && accountsData.data) {
          const accountIds = accountsData.data.map((acc: any) => acc.id)
          const hasAccess = accountIds.includes(adAccountId)
          
          return NextResponse.json({
            error: 'Access denied to this account',
            requestedAccount: adAccountId,
            hasAccess,
            availableAccounts: accountsData.data.map((acc: any) => ({
              id: acc.id,
              name: acc.name,
              status: acc.account_status
            })),
            totalAccounts: accountIds.length,
            metaError: data.error
          }, { status: 403 })
        }
      }
      
      return NextResponse.json({
        error: 'Failed to access account',
        details: data.error,
        status: response.status
      }, { status: response.status })
    }
    
    // Success - account is accessible
    return NextResponse.json({
      success: true,
      account: {
        id: data.id,
        name: data.name,
        status: data.account_status,
        currency: data.currency
      }
    })
    
  } catch (error: any) {
    console.error('Check account error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}