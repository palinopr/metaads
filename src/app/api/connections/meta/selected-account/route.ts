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
    
    // Get selected ad account
    const result = await db.execute(sql`
      SELECT 
        ma.account_id,
        ma.name,
        ma.currency,
        ma.timezone_name,
        mc.access_token
      FROM meta_ad_accounts ma
      JOIN meta_connections mc ON ma.connection_id = mc.id
      WHERE ma.user_id = ${session.user.id}
      AND ma.is_selected = true
      LIMIT 1
    `)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ account: null })
    }
    
    const account = result.rows[0]
    
    // Fetch current account stats from Meta API
    try {
      const insightsUrl = `https://graph.facebook.com/v18.0/act_${account.account_id}/insights?fields=impressions,clicks,spend,ctr,cpm&date_preset=last_30d&access_token=${account.access_token}`
      
      const response = await fetch(insightsUrl)
      const data = await response.json()
      
      let stats = {
        impressions: 0,
        clicks: 0,
        spend: 0,
        ctr: 0,
        cpm: 0
      }
      
      if (data.data && data.data.length > 0) {
        const insights = data.data[0]
        stats = {
          impressions: parseInt(insights.impressions || 0),
          clicks: parseInt(insights.clicks || 0),
          spend: parseFloat(insights.spend || 0),
          ctr: parseFloat(insights.ctr || 0),
          cpm: parseFloat(insights.cpm || 0)
        }
      }
      
      return NextResponse.json({ 
        account: {
          account_id: account.account_id,
          name: account.name,
          currency: account.currency,
          timezone_name: account.timezone_name,
          stats
        }
      })
    } catch (error) {
      // Return account without stats if API call fails
      return NextResponse.json({ 
        account: {
          account_id: account.account_id,
          name: account.name,
          currency: account.currency,
          timezone_name: account.timezone_name,
          stats: null
        }
      })
    }
  } catch (error) {
    console.error('Error fetching selected account:', error)
    return NextResponse.json(
      { error: 'Failed to fetch selected account' },
      { status: 500 }
    )
  }
}