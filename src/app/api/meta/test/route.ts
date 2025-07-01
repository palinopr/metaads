import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { sql } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get Meta connection
    const connectionResult = await db.execute(sql`
      SELECT id, access_token, meta_user_id
      FROM meta_connections
      WHERE user_id = ${session.user.id}
      LIMIT 1
    `)
    
    // Check selected ad account
    const selectedAccountResult = await db.execute(sql`
      SELECT id, account_id, name, is_selected
      FROM meta_ad_accounts
      WHERE user_id = ${session.user.id} AND is_selected = true
      LIMIT 1
    `)
    
    if (connectionResult.rows.length === 0) {
      return NextResponse.json({ 
        error: "No Meta connection found",
        suggestion: "Please connect your Meta account first"
      })
    }
    
    const connection = connectionResult.rows[0]
    const accessToken = connection.access_token
    
    const results = {
      connection: {
        hasConnection: true,
        metaUserId: connection.meta_user_id
      },
      selectedAccount: selectedAccountResult.rows.length > 0 ? {
        id: selectedAccountResult.rows[0].id,
        accountId: selectedAccountResult.rows[0].account_id,
        name: selectedAccountResult.rows[0].name
      } : null,
      tests: {} as any,
      errors: [] as any[],
      summary: {} as any
    }
    
    // Test 1: Verify token and get user info
    try {
      console.log("Testing Meta user info...")
      const userResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${accessToken}`
      )
      const userData = await userResponse.json()
      
      if (userData.error) {
        results.errors.push({
          test: "user_info",
          error: userData.error
        })
      } else {
        results.tests.userInfo = {
          success: true,
          data: userData
        }
      }
    } catch (error: any) {
      results.errors.push({
        test: "user_info",
        error: error.message
      })
    }
    
    // Test 2: Get ad accounts with detailed info
    try {
      console.log("Testing ad accounts fetch...")
      const accountsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,account_id,name,currency,timezone_name,account_status,amount_spent,balance,business_name,is_personal,disable_reason,capabilities&limit=10&access_token=${accessToken}`
      )
      const accountsData = await accountsResponse.json()
      
      if (accountsData.error) {
        results.errors.push({
          test: "ad_accounts",
          error: accountsData.error
        })
      } else {
        results.tests.adAccounts = {
          success: true,
          count: accountsData.data?.length || 0,
          accounts: accountsData.data?.map((acc: any) => ({
            account_id: acc.account_id,
            name: acc.name,
            currency: acc.currency,
            status: acc.account_status === 1 ? "ACTIVE" : "INACTIVE",
            amount_spent: acc.amount_spent,
            business_name: acc.business_name,
            capabilities: acc.capabilities
          }))
        }
      }
    } catch (error: any) {
      results.errors.push({
        test: "ad_accounts",
        error: error.message
      })
    }
    
    // Test 3: Get insights for the first active ad account
    if (results.tests.adAccounts?.accounts?.length > 0) {
      const firstAccount = results.tests.adAccounts.accounts[0]
      
      try {
        console.log(`Testing insights for account ${firstAccount.account_id}...`)
        
        // Try different API versions and endpoints
        const insightsUrls = [
          // Standard insights endpoint
          `https://graph.facebook.com/v18.0/act_${firstAccount.account_id}/insights?fields=impressions,clicks,spend,ctr,cpm,reach,frequency&date_preset=last_30d&access_token=${accessToken}`,
          // With time increment
          `https://graph.facebook.com/v18.0/act_${firstAccount.account_id}/insights?fields=impressions,clicks,spend&date_preset=last_7d&time_increment=1&access_token=${accessToken}`,
          // Basic fields only
          `https://graph.facebook.com/v18.0/act_${firstAccount.account_id}/insights?fields=spend,impressions&date_preset=lifetime&access_token=${accessToken}`
        ]
        
        let insightsData = null
        let successfulUrl = null
        
        for (const url of insightsUrls) {
          try {
            const response = await fetch(url)
            const data = await response.json()
            
            if (!data.error && data.data) {
              insightsData = data
              successfulUrl = url.split('?')[1].split('&access_token')[0]
              break
            }
          } catch (e) {
            continue
          }
        }
        
        if (insightsData) {
          results.tests.insights = {
            success: true,
            query: successfulUrl,
            data: insightsData.data
          }
        } else {
          results.tests.insights = {
            success: false,
            message: "No insights data available"
          }
        }
      } catch (error: any) {
        results.errors.push({
          test: "insights",
          error: error.message
        })
      }
    }
    
    // Test 4: Check permissions
    try {
      console.log("Testing permissions...")
      const permissionsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`
      )
      const permissionsData = await permissionsResponse.json()
      
      if (permissionsData.error) {
        results.errors.push({
          test: "permissions",
          error: permissionsData.error
        })
      } else {
        results.tests.permissions = {
          success: true,
          granted: permissionsData.data?.filter((p: any) => p.status === "granted").map((p: any) => p.permission),
          declined: permissionsData.data?.filter((p: any) => p.status === "declined").map((p: any) => p.permission)
        }
      }
    } catch (error: any) {
      results.errors.push({
        test: "permissions",
        error: error.message
      })
    }
    
    // Test 5: Get business accounts
    try {
      console.log("Testing business accounts...")
      const businessResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/businesses?fields=id,name,created_time&access_token=${accessToken}`
      )
      const businessData = await businessResponse.json()
      
      if (!businessData.error && businessData.data) {
        results.tests.businesses = {
          success: true,
          count: businessData.data.length,
          businesses: businessData.data
        }
      }
    } catch (error: any) {
      // This is optional, so we don't add to errors
      results.tests.businesses = {
        success: false,
        message: "No business access"
      }
    }
    
    // Summary
    results.summary = {
      hasValidToken: results.tests.userInfo?.success || false,
      hasAdAccounts: results.tests.adAccounts?.count > 0,
      hasSelectedAccount: !!results.selectedAccount,
      hasInsightsAccess: results.tests.insights?.success || false,
      totalErrors: results.errors.length,
      requiredPermissions: [
        "ads_management",
        "ads_read",
        "business_management"
      ],
      grantedPermissions: results.tests.permissions?.granted || []
    }
    
    return NextResponse.json(results)
  } catch (error) {
    console.error('Meta API test error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test Meta API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}