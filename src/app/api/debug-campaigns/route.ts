import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { sql } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" })
    }
    
    // Check Meta connections
    let connections = []
    let adAccounts = []
    let selectedAccount = null
    
    try {
      const connResult = await db.execute(sql`
        SELECT id, user_id, expires_at, created_at
        FROM meta_connections
        WHERE user_id = ${session.user.id}
      `)
      connections = connResult.rows
    } catch (e) {
      console.error("Error fetching connections:", e)
    }
    
    try {
      const accountsResult = await db.execute(sql`
        SELECT id, name, currency, is_selected
        FROM meta_ad_accounts
        WHERE user_id = ${session.user.id}
      `)
      adAccounts = accountsResult.rows
      selectedAccount = accountsResult.rows.find(a => a.is_selected)
    } catch (e) {
      console.error("Error fetching ad accounts:", e)
    }
    
    // Try to fetch campaigns from Meta if we have a selected account
    let metaCampaigns = null
    if (selectedAccount && connections.length > 0) {
      try {
        const tokenResult = await db.execute(sql`
          SELECT mc.access_token
          FROM meta_connections mc
          JOIN meta_ad_accounts ma ON ma.connection_id = mc.id
          WHERE ma.id = ${selectedAccount.id}
          LIMIT 1
        `)
        
        if (tokenResult.rows.length > 0) {
          const token = tokenResult.rows[0].access_token
          const response = await fetch(
            `https://graph.facebook.com/v18.0/act_${selectedAccount.id}/campaigns?fields=id,name,status&limit=10&access_token=${token}`
          )
          metaCampaigns = await response.json()
        }
      } catch (e) {
        console.error("Error fetching Meta campaigns:", e)
      }
    }
    
    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
      },
      metaConnections: {
        count: connections.length,
        hasValidConnection: connections.length > 0,
        connections: connections.map(c => ({
          id: c.id,
          expiresAt: c.expires_at,
          createdAt: c.created_at
        }))
      },
      adAccounts: {
        count: adAccounts.length,
        hasSelected: !!selectedAccount,
        selected: selectedAccount,
        all: adAccounts
      },
      metaCampaigns: metaCampaigns,
      debug: {
        timestamp: new Date().toISOString(),
        help: "Visit /dashboard/connections to connect Meta account"
      }
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json({ 
      error: "Debug endpoint error",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
}