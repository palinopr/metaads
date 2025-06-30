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
    
    // Try multiple approaches to fetch account stats
    let stats = null
    let debugInfo = {
      attempts: [] as any[],
      finalStatus: "no_data"
    }
    
    // Attempt 1: Standard insights with date preset
    try {
      console.log(`[Selected Account] Fetching insights for account ${account.account_id}`)
      
      const attempts = [
        {
          name: "last_30d",
          url: `https://graph.facebook.com/v18.0/act_${account.account_id}/insights?fields=impressions,clicks,spend,ctr,cpm&date_preset=last_30d&access_token=${account.access_token}`
        },
        {
          name: "last_7d", 
          url: `https://graph.facebook.com/v18.0/act_${account.account_id}/insights?fields=impressions,clicks,spend&date_preset=last_7d&access_token=${account.access_token}`
        },
        {
          name: "lifetime",
          url: `https://graph.facebook.com/v18.0/act_${account.account_id}/insights?fields=spend,impressions&date_preset=lifetime&access_token=${account.access_token}`
        }
      ]
      
      for (const attempt of attempts) {
        try {
          const response = await fetch(attempt.url)
          const data = await response.json()
          
          debugInfo.attempts.push({
            name: attempt.name,
            status: response.status,
            hasData: !!(data.data && data.data.length > 0),
            error: data.error
          })
          
          if (data.data && data.data.length > 0) {
            const insights = data.data[0]
            stats = {
              impressions: parseInt(insights.impressions || 0),
              clicks: parseInt(insights.clicks || 0),
              spend: parseFloat(insights.spend || 0),
              ctr: parseFloat(insights.ctr || 0),
              cpm: parseFloat(insights.cpm || 0)
            }
            debugInfo.finalStatus = "success"
            break
          }
        } catch (e: any) {
          debugInfo.attempts.push({
            name: attempt.name,
            error: e.message
          })
        }
      }
    } catch (error: any) {
      console.error('[Selected Account] Insights error:', error)
      debugInfo.finalStatus = "error"
      debugInfo.error = error.message
    }
    
    // If no stats, try to get basic account info
    if (!stats) {
      try {
        const accountUrl = `https://graph.facebook.com/v18.0/act_${account.account_id}?fields=id,name,currency,amount_spent,balance&access_token=${account.access_token}`
        const response = await fetch(accountUrl)
        const data = await response.json()
        
        if (data && !data.error) {
          // At least show lifetime spend if available
          stats = {
            impressions: 0,
            clicks: 0,
            spend: parseFloat(data.amount_spent || 0) / 100, // Convert from cents
            ctr: 0,
            cpm: 0
          }
          debugInfo.finalStatus = "partial"
        }
      } catch (e: any) {
        console.error('[Selected Account] Account info error:', e)
      }
    }
    
    console.log('[Selected Account] Debug info:', debugInfo)
    
    return NextResponse.json({ 
      account: {
        account_id: account.account_id,
        name: account.name,
        currency: account.currency,
        timezone_name: account.timezone_name,
        stats,
        debug: process.env.NODE_ENV === 'development' ? debugInfo : undefined
      }
    })
  } catch (error) {
    console.error('Error fetching selected account:', error)
    return NextResponse.json(
      { error: 'Failed to fetch selected account' },
      { status: 500 }
    )
  }
}