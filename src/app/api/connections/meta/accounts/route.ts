import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { sql } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const forceRefresh = searchParams.get('refresh') === 'true'
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // First get the Meta connection
    const connectionResult = await db.execute(sql`
      SELECT id, access_token
      FROM meta_connections
      WHERE user_id = ${session.user.id}
      LIMIT 1
    `)
    
    const connection = connectionResult.rows[0]
    
    if (!connection) {
      return NextResponse.json({ error: "No Meta connection found" }, { status: 404 })
    }
    
    // Check if we have cached accounts (unless force refresh)
    if (!forceRefresh) {
      const cachedAccounts = await db.execute(sql`
        SELECT 
          account_id,
          name,
          currency,
          timezone_name,
          is_selected
        FROM meta_ad_accounts
        WHERE user_id = ${session.user.id}
        AND is_active = true
        ORDER BY name
      `)
      
      if (cachedAccounts.rows.length > 0) {
        return NextResponse.json({ 
          accounts: cachedAccounts.rows,
          cached: true,
          total: cachedAccounts.rows.length
        })
      }
    }
    
    // Fetch all ad accounts from Meta API with pagination
    let allAccounts: any[] = []
    let nextPageUrl = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,account_id,name,currency,timezone_name,account_status&limit=100&access_token=${connection.access_token}`
    
    // Fetch all pages of ad accounts
    while (nextPageUrl) {
      const response = await fetch(nextPageUrl)
      const data = await response.json()
      
      if (!response.ok || data.error) {
        console.error('Meta API error:', data.error)
        return NextResponse.json(
          { error: data.error?.message || "Failed to fetch ad accounts" },
          { status: 400 }
        )
      }
      
      // Add accounts from this page
      if (data.data && data.data.length > 0) {
        allAccounts = [...allAccounts, ...data.data]
      }
      
      // Check for next page
      nextPageUrl = data.paging?.next || null
    }
    
    console.log(`Fetched ${allAccounts.length} total ad accounts`)
    
    // Filter active accounts only (account_status: 1 = ACTIVE)
    const activeAccounts = allAccounts.filter(
      (account: any) => account.account_status === 1
    )
    
    console.log(`Found ${activeAccounts.length} active ad accounts`)
    
    // Store accounts in database
    if (activeAccounts.length > 0) {
      for (const account of activeAccounts) {
        await db.execute(sql`
          INSERT INTO meta_ad_accounts (
            user_id,
            connection_id,
            account_id,
            name,
            currency,
            timezone_name,
            is_active,
            created_at,
            updated_at
          ) VALUES (
            ${session.user.id},
            ${connection.id},
            ${account.account_id},
            ${account.name},
            ${account.currency},
            ${account.timezone_name},
            true,
            ${new Date()},
            ${new Date()}
          )
          ON CONFLICT (user_id, account_id) 
          DO UPDATE SET
            name = ${account.name},
            currency = ${account.currency},
            timezone_name = ${account.timezone_name},
            is_active = true,
            updated_at = ${new Date()}
        `)
      }
    }
    
    // Return the accounts
    const accounts = activeAccounts.map((account: any) => ({
      account_id: account.account_id,
      name: account.name,
      currency: account.currency,
      timezone_name: account.timezone_name,
      is_selected: false
    }))
    
    return NextResponse.json({ 
      accounts,
      cached: false,
      total: accounts.length
    })
  } catch (error) {
    console.error('Error fetching Meta ad accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ad accounts' },
      { status: 500 }
    )
  }
}