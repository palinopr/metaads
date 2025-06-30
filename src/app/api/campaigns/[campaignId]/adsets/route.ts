import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { sql } from "drizzle-orm"

export async function GET(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const campaignId = params.campaignId
    const { searchParams } = new URL(request.url)
    const datePreset = searchParams.get('date_preset') || 'last_30d'
    const limit = searchParams.get('limit') || '50'
    
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
        adSets: [],
        error: "No ad account selected"
      })
    }
    
    const account = result.rows[0]
    
    try {
      // First get campaign info
      console.log(`[AdSets] Fetching campaign info for ${campaignId}`)
      const campaignUrl = `https://graph.facebook.com/v18.0/${campaignId}?fields=name&access_token=${account.access_token}`
      const campaignResponse = await fetch(campaignUrl)
      const campaignData = await campaignResponse.json()
      
      // Fetch ad sets from Meta API
      console.log(`[AdSets] Fetching ad sets for campaign ${campaignId}`)
      
      const adSetsUrl = `https://graph.facebook.com/v18.0/${campaignId}/adsets?fields=id,name,status,campaign_id,created_time,updated_time,daily_budget,lifetime_budget,budget_remaining,effective_status,optimization_goal,billing_event,bid_amount,targeting,insights.date_preset(${datePreset}){impressions,clicks,spend,ctr,cpm,conversions,cost_per_conversion}&limit=${limit}&access_token=${account.access_token}`
      
      const response = await fetch(adSetsUrl)
      const data = await response.json()
      
      if (data.error) {
        console.error('[AdSets] Meta API error:', data.error)
        return NextResponse.json({
          adSets: [],
          error: data.error.message,
          debug: {
            error_type: data.error.type,
            error_code: data.error.code,
            fbtrace_id: data.error.fbtrace_id
          }
        })
      }
      
      // Transform ad sets data
      const adSets = (data.data || []).map((adSet: any) => ({
        id: adSet.id,
        name: adSet.name,
        status: adSet.status,
        effective_status: adSet.effective_status,
        campaign_id: adSet.campaign_id,
        created_time: adSet.created_time,
        updated_time: adSet.updated_time,
        daily_budget: adSet.daily_budget ? parseFloat(adSet.daily_budget) / 100 : null,
        lifetime_budget: adSet.lifetime_budget ? parseFloat(adSet.lifetime_budget) / 100 : null,
        budget_remaining: adSet.budget_remaining ? parseFloat(adSet.budget_remaining) / 100 : null,
        optimization_goal: adSet.optimization_goal,
        billing_event: adSet.billing_event,
        bid_amount: adSet.bid_amount ? parseFloat(adSet.bid_amount) / 100 : null,
        targeting: adSet.targeting,
        metrics: adSet.insights?.data?.[0] ? {
          impressions: parseInt(adSet.insights.data[0].impressions || 0),
          clicks: parseInt(adSet.insights.data[0].clicks || 0),
          spend: parseFloat(adSet.insights.data[0].spend || 0),
          ctr: parseFloat(adSet.insights.data[0].ctr || 0),
          cpm: parseFloat(adSet.insights.data[0].cpm || 0),
          conversions: parseInt(adSet.insights.data[0].conversions || 0),
          cost_per_conversion: parseFloat(adSet.insights.data[0].cost_per_conversion || 0)
        } : null
      }))
      
      // Get summary stats
      const summary = {
        total_adsets: adSets.length,
        active_adsets: adSets.filter((a: any) => a.effective_status === 'ACTIVE').length,
        paused_adsets: adSets.filter((a: any) => a.effective_status === 'PAUSED').length,
        total_spend: adSets.reduce((sum: number, a: any) => sum + (a.metrics?.spend || 0), 0),
        total_impressions: adSets.reduce((sum: number, a: any) => sum + (a.metrics?.impressions || 0), 0),
        total_clicks: adSets.reduce((sum: number, a: any) => sum + (a.metrics?.clicks || 0), 0),
        total_conversions: adSets.reduce((sum: number, a: any) => sum + (a.metrics?.conversions || 0), 0)
      }
      
      return NextResponse.json({
        adSets,
        summary,
        campaignName: campaignData.name || "",
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
      console.error('[AdSets] Error:', error)
      return NextResponse.json({
        adSets: [],
        error: "Failed to fetch ad sets",
        debug: error.message
      })
    }
    
  } catch (error) {
    console.error('Error in ad sets endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}