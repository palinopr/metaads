import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { eq, and, desc } from "drizzle-orm"
import { campaigns, campaignInsights, metaAdAccounts, metaConnections } from "@/db/schema"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: campaignId } = await params
    const { searchParams } = new URL(request.url)
    const syncWithMeta = searchParams.get('sync') === 'true'
    const datePreset = searchParams.get('date_preset') || 'last_30d'

    // Get campaign from database
    const campaign = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.userId, session.user.id)
        )
      )
      .limit(1)

    if (campaign.length === 0) {
      // Try to fetch by metaId if campaignId looks like a Meta ID
      if (/^\d+$/.test(campaignId)) {
        const campaignByMetaId = await db
          .select()
          .from(campaigns)
          .where(
            and(
              eq(campaigns.metaId, campaignId),
              eq(campaigns.userId, session.user.id)
            )
          )
          .limit(1)
        
        if (campaignByMetaId.length > 0) {
          const result = campaignByMetaId[0]
          
          // Get latest insights
          const insights = await db
            .select()
            .from(campaignInsights)
            .where(eq(campaignInsights.campaignId, result.id))
            .orderBy(desc(campaignInsights.date))
            .limit(1)
          
          return NextResponse.json({
            ...result,
            insights: insights[0] || null
          })
        }
      }
      
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const result = campaign[0]

    // If sync is requested and campaign has metaId, fetch fresh data from Meta
    if (syncWithMeta && result.metaId) {
      const adAccount = await db
        .select({
          accessToken: metaConnections.accessToken,
          accountId: metaAdAccounts.accountId
        })
        .from(metaAdAccounts)
        .innerJoin(metaConnections, eq(metaAdAccounts.connectionId, metaConnections.id))
        .where(eq(metaAdAccounts.id, result.adAccountId))
        .limit(1)

      if (adAccount.length > 0 && adAccount[0].accessToken) {
        try {
          const campaignUrl = `https://graph.facebook.com/v18.0/${result.metaId}?fields=id,name,status,effective_status,objective,created_time,daily_budget,lifetime_budget,insights.date_preset(${datePreset}){impressions,clicks,spend,ctr,cpm,conversions}&access_token=${adAccount[0].accessToken}`
          
          const response = await fetch(campaignUrl)
          const metaData = await response.json()
          
          if (metaData && !metaData.error) {
            // Update campaign in database
            await db
              .update(campaigns)
              .set({
                name: metaData.name,
                status: metaData.effective_status || metaData.status,
                budgetAmount: metaData.daily_budget 
                  ? parseInt(metaData.daily_budget) 
                  : metaData.lifetime_budget 
                  ? parseInt(metaData.lifetime_budget)
                  : result.budgetAmount,
                syncedAt: new Date()
              })
              .where(eq(campaigns.id, result.id))
            
            // Store insights if available
            if (metaData.insights?.data?.[0]) {
              const insights = metaData.insights.data[0]
              await db.insert(campaignInsights).values({
                campaignId: result.id,
                date: new Date(),
                impressions: parseInt(insights.impressions || 0),
                clicks: parseInt(insights.clicks || 0),
                spend: Math.round(parseFloat(insights.spend || 0) * 100),
                ctr: Math.round(parseFloat(insights.ctr || 0) * 10000),
                cpm: Math.round(parseFloat(insights.cpm || 0) * 100),
                conversions: parseInt(insights.conversions || 0)
              }).onConflictDoNothing()
            }
          }
        } catch (error) {
          console.error('Error syncing campaign:', error)
        }
      }
    }

    // Get latest insights
    const insights = await db
      .select()
      .from(campaignInsights)
      .where(eq(campaignInsights.campaignId, result.id))
      .orderBy(desc(campaignInsights.date))
      .limit(1)

    return NextResponse.json({
      ...result,
      insights: insights[0] || null
    })
  } catch (error) {
    console.error('Error fetching campaign details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}