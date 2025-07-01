import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { eq, and } from "drizzle-orm"
import { metaAdAccounts, metaConnections } from "@/db/schema"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const datePreset = searchParams.get('date_preset') || 'last_30d'
    
    // Get selected ad account with token - simpler query like overview
    const accountData = await db
      .select({
        id: metaAdAccounts.id,
        accountId: metaAdAccounts.accountId,
        name: metaAdAccounts.name,
        accessToken: metaConnections.accessToken
      })
      .from(metaAdAccounts)
      .innerJoin(metaConnections, eq(metaAdAccounts.connectionId, metaConnections.id))
      .where(
        and(
          eq(metaAdAccounts.userId, session.user.id),
          eq(metaAdAccounts.isSelected, true)
        )
      )
      .limit(1)
    
    if (!accountData[0]) {
      return NextResponse.json({ 
        campaigns: [],
        error: "No ad account selected"
      })
    }
    
    const account = accountData[0]
    
    // Fetch campaigns directly from Meta API (like overview does for insights)
    try {
      const campaignsUrl = `https://graph.facebook.com/v18.0/act_${account.accountId}/campaigns?fields=id,name,status,effective_status,objective,created_time,daily_budget,lifetime_budget,insights.date_preset(${datePreset}){impressions,clicks,spend,ctr,cpm}&limit=50&access_token=${account.accessToken}`
      
      console.log('[Campaigns Simple] Fetching from Meta:', {
        accountId: account.accountId,
        datePreset
      })
      
      const response = await fetch(campaignsUrl)
      const data = await response.json()
      
      if (data.error) {
        console.error('[Campaigns Simple] Meta API error:', data.error)
        
        // Try fallback without insights
        const fallbackUrl = `https://graph.facebook.com/v18.0/act_${account.accountId}/campaigns?fields=id,name,status,effective_status,objective,created_time,daily_budget,lifetime_budget&limit=50&access_token=${account.accessToken}`
        const fallbackResponse = await fetch(fallbackUrl)
        const fallbackData = await fallbackResponse.json()
        
        if (fallbackData.error) {
          return NextResponse.json({
            campaigns: [],
            error: `Meta API error: ${fallbackData.error.message}`,
            debug: fallbackData.error
          })
        }
        
        // Return campaigns without insights
        const campaigns = (fallbackData.data || []).map((campaign: any) => ({
          id: campaign.id,
          name: campaign.name,
          status: campaign.effective_status || campaign.status,
          objective: campaign.objective,
          created_time: campaign.created_time,
          budgetAmount: campaign.daily_budget || campaign.lifetime_budget || 0,
          budgetType: campaign.daily_budget ? 'DAILY' : 'LIFETIME'
        }))
        
        return NextResponse.json({
          campaigns,
          summary: {
            total_campaigns: campaigns.length,
            active_campaigns: campaigns.filter((c: any) => c.status === 'ACTIVE').length,
            total_spend: 0,
            total_impressions: 0,
            total_clicks: 0
          }
        })
      }
      
      // Process campaigns with insights
      const campaigns = (data.data || []).map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.effective_status || campaign.status,
        effective_status: campaign.effective_status,
        objective: campaign.objective,
        created_time: campaign.created_time,
        budgetAmount: campaign.daily_budget || campaign.lifetime_budget || 0,
        budgetType: campaign.daily_budget ? 'DAILY' : 'LIFETIME',
        insights: campaign.insights?.data?.[0] ? {
          impressions: parseInt(campaign.insights.data[0].impressions || 0),
          clicks: parseInt(campaign.insights.data[0].clicks || 0),
          spend: Math.round(parseFloat(campaign.insights.data[0].spend || 0) * 100), // Convert to cents
          ctr: Math.round(parseFloat(campaign.insights.data[0].ctr || 0) * 10000),
          cpm: Math.round(parseFloat(campaign.insights.data[0].cpm || 0) * 100)
        } : null
      }))
      
      // Calculate summary
      const summary = {
        total_campaigns: campaigns.length,
        active_campaigns: campaigns.filter((c: any) => c.status === 'ACTIVE').length,
        total_spend: campaigns.reduce((sum: number, c: any) => sum + (c.insights?.spend || 0), 0) / 100,
        total_impressions: campaigns.reduce((sum: number, c: any) => sum + (c.insights?.impressions || 0), 0),
        total_clicks: campaigns.reduce((sum: number, c: any) => sum + (c.insights?.clicks || 0), 0)
      }
      
      return NextResponse.json({
        campaigns,
        summary,
        account: {
          id: account.accountId,
          name: account.name
        }
      })
      
    } catch (error: any) {
      console.error('[Campaigns Simple] Fetch error:', error)
      return NextResponse.json({
        campaigns: [],
        error: 'Failed to fetch campaigns',
        details: error.message
      })
    }
    
  } catch (error) {
    console.error('[Campaigns Simple] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}