import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { sql } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get selected ad account with token
    const result = await db.execute(sql`
      SELECT 
        ma.account_id,
        ma.name as account_name,
        mc.access_token
      FROM meta_ad_accounts ma
      JOIN meta_connections mc ON ma.connection_id = mc.id
      WHERE ma.user_id = ${session.user.id}
      AND ma.is_selected = true
      LIMIT 1
    `)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ 
        campaigns: [],
        error: "No ad account selected"
      })
    }
    
    const account = result.rows[0]
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '50'
    
    try {
      // Fetch campaigns from Meta API
      console.log(`[Campaigns] Fetching campaigns for account ${account.account_id}`)
      
      const campaignsUrl = `https://graph.facebook.com/v18.0/act_${account.account_id}/campaigns?fields=id,name,status,objective,created_time,updated_time,daily_budget,lifetime_budget,budget_remaining,effective_status,insights{impressions,clicks,spend,ctr,cpm,reach}&limit=${limit}&access_token=${account.access_token}`
      
      const response = await fetch(campaignsUrl)
      const data = await response.json()
      
      if (data.error) {
        console.error('[Campaigns] Meta API error:', data.error)
        return NextResponse.json({
          campaigns: [],
          error: data.error.message,
          debug: {
            error_type: data.error.type,
            error_code: data.error.code,
            fbtrace_id: data.error.fbtrace_id
          }
        })
      }
      
      // Transform campaigns data
      const campaigns = (data.data || []).map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        effective_status: campaign.effective_status,
        objective: campaign.objective,
        created_time: campaign.created_time,
        updated_time: campaign.updated_time,
        daily_budget: campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : null,
        lifetime_budget: campaign.lifetime_budget ? parseFloat(campaign.lifetime_budget) / 100 : null,
        budget_remaining: campaign.budget_remaining ? parseFloat(campaign.budget_remaining) / 100 : null,
        metrics: campaign.insights?.data?.[0] ? {
          impressions: parseInt(campaign.insights.data[0].impressions || 0),
          clicks: parseInt(campaign.insights.data[0].clicks || 0),
          spend: parseFloat(campaign.insights.data[0].spend || 0),
          ctr: parseFloat(campaign.insights.data[0].ctr || 0),
          cpm: parseFloat(campaign.insights.data[0].cpm || 0),
          reach: parseInt(campaign.insights.data[0].reach || 0)
        } : null
      }))
      
      // Get summary stats
      const summary = {
        total_campaigns: campaigns.length,
        active_campaigns: campaigns.filter((c: any) => c.effective_status === 'ACTIVE').length,
        paused_campaigns: campaigns.filter((c: any) => c.effective_status === 'PAUSED').length,
        total_spend: campaigns.reduce((sum: number, c: any) => sum + (c.metrics?.spend || 0), 0),
        total_impressions: campaigns.reduce((sum: number, c: any) => sum + (c.metrics?.impressions || 0), 0),
        total_clicks: campaigns.reduce((sum: number, c: any) => sum + (c.metrics?.clicks || 0), 0)
      }
      
      return NextResponse.json({
        campaigns,
        summary,
        account: {
          id: account.account_id,
          name: account.account_name
        },
        pagination: {
          has_next: !!data.paging?.next,
          has_previous: !!data.paging?.previous,
          cursors: data.paging?.cursors
        }
      })
      
    } catch (error: any) {
      console.error('[Campaigns] Error:', error)
      return NextResponse.json({
        campaigns: [],
        error: "Failed to fetch campaigns",
        debug: error.message
      })
    }
    
  } catch (error) {
    console.error('Error in campaigns endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}