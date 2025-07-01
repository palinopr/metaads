import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { metaConnections, metaAdAccounts } from "@/db/schema"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const forceRefresh = searchParams.get('refresh') === 'true'
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // First get the Meta connection
    const connections = await db
      .select()
      .from(metaConnections)
      .where(eq(metaConnections.userId, session.user.id))
      .limit(1)
    
    const connection = connections[0]
    
    if (!connection) {
      return NextResponse.json({ error: "No Meta connection found" }, { status: 404 })
    }
    
    // Check if we have cached accounts (unless force refresh)
    if (!forceRefresh) {
      const cachedAccounts = await db
        .select({
          id: metaAdAccounts.id,
          account_id: metaAdAccounts.accountId,
          name: metaAdAccounts.name,
          currency: metaAdAccounts.currency,
          timezone_name: metaAdAccounts.timezone,
          is_selected: metaAdAccounts.isSelected
        })
        .from(metaAdAccounts)
        .where(eq(metaAdAccounts.userId, session.user.id))
      
      if (cachedAccounts.length > 0) {
        return NextResponse.json({ 
          accounts: cachedAccounts,
          cached: true,
          total: cachedAccounts.length
        })
      }
    }
    
    // Fetch all ad accounts from Meta API with pagination
    let allAccounts: any[] = []
    let nextPageUrl = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,account_id,name,currency,timezone_name,account_status&limit=100&access_token=${connection.accessToken}`
    
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
        // Use the numeric account ID (without act_ prefix) as the primary key
        const numericAccountId = account.account_id.replace('act_', '')
        
        await db.execute(sql`
          INSERT INTO meta_ad_accounts (
            id,
            account_id,
            user_id,
            connection_id,
            name,
            currency,
            timezone,
            account_status,
            is_selected,
            created_at,
            updated_at
          ) VALUES (
            ${numericAccountId},
            ${numericAccountId},
            ${session.user.id},
            ${connection.id},
            ${account.name},
            ${account.currency},
            ${account.timezone_name},
            ${account.account_status},
            false,
            ${new Date()},
            ${new Date()}
          )
          ON CONFLICT (id) 
          DO UPDATE SET
            account_id = ${numericAccountId},
            name = ${account.name},
            currency = ${account.currency},
            timezone = ${account.timezone_name},
            account_status = ${account.account_status},
            updated_at = ${new Date()}
        `)
      }
    }
    
    // Get the updated accounts from database to include selection status
    const updatedAccounts = await db.execute(sql`
      SELECT 
        id,
        account_id,
        name,
        currency,
        timezone as timezone_name,
        is_selected
      FROM meta_ad_accounts
      WHERE user_id = ${session.user.id}
      ORDER BY name
    `)
    
    // Return the accounts
    const accounts = updatedAccounts.rows.map((account: any) => ({
      id: account.id,
      account_id: account.account_id || account.id,
      name: account.name,
      currency: account.currency,
      timezone_name: account.timezone_name,
      is_selected: account.is_selected
    }))
    
    return NextResponse.json({ 
      accounts,
      cached: false,
      total: accounts.length
    })
  } catch (error) {
    console.error('Error fetching Meta ad accounts:', error)
    
    // Provide more specific error message if possible
    let errorMessage = 'Failed to fetch ad accounts'
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Log database-specific errors
      if (error.message.includes('column') || error.message.includes('relation')) {
        console.error('Database schema error detected:', error.message)
        errorMessage = 'Database schema error: ' + error.message
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}