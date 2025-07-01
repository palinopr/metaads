import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { eq, and, between, desc, sql } from "drizzle-orm"
import { campaigns, demographicInsights, metaAdAccounts, metaConnections } from "@/db/schema"

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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const metric = searchParams.get('metric') || 'impressions' // impressions, clicks, spend, conversions
    const sync = searchParams.get('sync') === 'true'
    const adSetId = searchParams.get('adSetId')
    const adId = searchParams.get('adId')

    // Verify campaign ownership
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
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // If sync is requested, trigger the insights endpoint with breakdown
    if (sync && campaign[0].metaId) {
      const adAccount = await db
        .select({
          accessToken: metaConnections.accessToken,
          accountId: metaAdAccounts.accountId
        })
        .from(metaAdAccounts)
        .innerJoin(metaConnections, eq(metaAdAccounts.connectionId, metaConnections.id))
        .where(eq(metaAdAccounts.id, campaign[0].adAccountId))
        .limit(1)

      if (adAccount.length > 0 && adAccount[0].accessToken) {
        try {
          // Fetch gender breakdown data from Meta
          const insightsUrl = `https://graph.facebook.com/v18.0/${campaign[0].metaId}/insights`
          const params = new URLSearchParams({
            access_token: adAccount[0].accessToken,
            fields: 'impressions,clicks,spend,ctr,cpm,conversions,reach,frequency,actions,video_views',
            breakdowns: 'gender,age',
            time_range: JSON.stringify({
              since: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              until: endDate || new Date().toISOString().split('T')[0]
            }),
            time_increment: '1'
          })

          const response = await fetch(`${insightsUrl}?${params}`)
          const data = await response.json()

          if (data.data && data.data.length > 0) {
            // Store demographic insights
            for (const insight of data.data) {
              const demographicData = {
                campaignId: campaign[0].id,
                date: new Date(insight.date_start),
                gender: insight.gender || 'unknown',
                ageRange: insight.age || null,
                impressions: parseInt(insight.impressions || 0),
                clicks: parseInt(insight.clicks || 0),
                spend: Math.round(parseFloat(insight.spend || 0) * 100),
                conversions: parseInt(insight.conversions || 0),
                reach: parseInt(insight.reach || 0),
                frequency: insight.frequency ? Math.round(parseFloat(insight.frequency) * 100) : null,
                ctr: insight.ctr ? Math.round(parseFloat(insight.ctr) * 10000) : null,
                cpc: insight.clicks > 0 ? Math.round((parseFloat(insight.spend) * 100) / parseInt(insight.clicks)) : null,
                cpm: insight.cpm ? Math.round(parseFloat(insight.cpm) * 100) : null,
                costPerConversion: insight.conversions > 0 ? Math.round((parseFloat(insight.spend) * 100) / parseInt(insight.conversions)) : null,
                videoViews: parseInt(insight.video_views || 0),
                actions: insight.actions || null,
              }

              await db
                .insert(demographicInsights)
                .values(demographicData)
                .onConflictDoNothing()
            }
          }
        } catch (error) {
          console.error('Error syncing demographic insights:', error)
        }
      }
    }

    // Build date filter
    let filters = [eq(demographicInsights.campaignId, campaignId)]
    
    if (adSetId) {
      filters.push(eq(demographicInsights.adSetId, adSetId))
    }
    
    if (adId) {
      filters.push(eq(demographicInsights.adId, adId))
    }
    
    if (startDate && endDate) {
      filters.push(between(demographicInsights.date, new Date(startDate), new Date(endDate)))
    }
    
    const dateFilter = and(...filters)!

    // Get demographic insights grouped by gender
    const genderData = await db
      .select({
        gender: demographicInsights.gender,
        impressions: sql<number>`SUM(${demographicInsights.impressions})`,
        clicks: sql<number>`SUM(${demographicInsights.clicks})`,
        spend: sql<number>`SUM(${demographicInsights.spend})`,
        conversions: sql<number>`SUM(${demographicInsights.conversions})`,
        reach: sql<number>`SUM(${demographicInsights.reach})`,
        videoViews: sql<number>`SUM(${demographicInsights.videoViews})`,
      })
      .from(demographicInsights)
      .where(dateFilter)
      .groupBy(demographicInsights.gender)

    // Get demographic insights grouped by age
    const ageData = await db
      .select({
        ageRange: demographicInsights.ageRange,
        impressions: sql<number>`SUM(${demographicInsights.impressions})`,
        clicks: sql<number>`SUM(${demographicInsights.clicks})`,
        spend: sql<number>`SUM(${demographicInsights.spend})`,
        conversions: sql<number>`SUM(${demographicInsights.conversions})`,
      })
      .from(demographicInsights)
      .where(dateFilter)
      .groupBy(demographicInsights.ageRange)

    // Get time series data by gender
    const timeSeriesData = await db
      .select({
        date: demographicInsights.date,
        gender: demographicInsights.gender,
        impressions: sql<number>`SUM(${demographicInsights.impressions})`,
        clicks: sql<number>`SUM(${demographicInsights.clicks})`,
        spend: sql<number>`SUM(${demographicInsights.spend})`,
      })
      .from(demographicInsights)
      .where(dateFilter)
      .groupBy(demographicInsights.date, demographicInsights.gender)
      .orderBy(demographicInsights.date)

    // Calculate gender metrics
    const genderMetrics = genderData.map(g => {
      const ctr = g.impressions > 0 ? ((g.clicks / g.impressions) * 100).toFixed(2) : '0'
      const cpc = g.clicks > 0 ? (g.spend / g.clicks / 100).toFixed(2) : '0'
      const cpm = g.impressions > 0 ? ((g.spend / g.impressions) * 1000 / 100).toFixed(2) : '0'
      const conversionRate = g.clicks > 0 ? ((g.conversions / g.clicks) * 100).toFixed(2) : '0'
      
      return {
        gender: g.gender,
        impressions: g.impressions,
        clicks: g.clicks,
        spend: (g.spend / 100).toFixed(2),
        conversions: g.conversions,
        reach: g.reach,
        videoViews: g.videoViews,
        ctr,
        cpc,
        cpm,
        conversionRate
      }
    })

    // Calculate total metrics
    const totals = genderData.reduce((acc, g) => {
      acc.impressions += g.impressions
      acc.clicks += g.clicks
      acc.spend += g.spend
      acc.conversions += g.conversions
      acc.reach += g.reach || 0
      acc.videoViews += g.videoViews || 0
      return acc
    }, {
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      reach: 0,
      videoViews: 0
    })

    // Calculate gender distribution percentages
    const genderDistribution = genderMetrics.map(g => ({
      ...g,
      impressionsPercentage: totals.impressions > 0 ? ((parseInt(g.impressions.toString()) / totals.impressions) * 100).toFixed(1) : '0',
      clicksPercentage: totals.clicks > 0 ? ((parseInt(g.clicks.toString()) / totals.clicks) * 100).toFixed(1) : '0',
      spendPercentage: totals.spend > 0 ? ((parseFloat(g.spend) * 100 / totals.spend) * 100).toFixed(1) : '0',
      conversionsPercentage: totals.conversions > 0 ? ((parseInt(g.conversions.toString()) / totals.conversions) * 100).toFixed(1) : '0'
    }))

    return NextResponse.json({
      campaign: {
        id: campaign[0].id,
        name: campaign[0].name,
        status: campaign[0].status
      },
      demographics: {
        gender: genderDistribution,
        age: ageData.map(a => ({
          ageRange: a.ageRange || 'unknown',
          impressions: a.impressions,
          clicks: a.clicks,
          spend: (a.spend / 100).toFixed(2),
          conversions: a.conversions,
          ctr: a.impressions > 0 ? ((a.clicks / a.impressions) * 100).toFixed(2) : '0',
          conversionRate: a.clicks > 0 ? ((a.conversions / a.clicks) * 100).toFixed(2) : '0'
        })),
        timeSeries: timeSeriesData.map(t => ({
          date: t.date,
          gender: t.gender,
          [metric]: metric === 'spend' ? ((t as any)[metric] / 100).toFixed(2) : (t as any)[metric]
        }))
      },
      totals: {
        impressions: totals.impressions,
        clicks: totals.clicks,
        spend: (totals.spend / 100).toFixed(2),
        conversions: totals.conversions,
        reach: totals.reach,
        videoViews: totals.videoViews,
        ctr: totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : '0',
        cpc: totals.clicks > 0 ? (totals.spend / totals.clicks / 100).toFixed(2) : '0',
        cpm: totals.impressions > 0 ? ((totals.spend / totals.impressions) * 1000 / 100).toFixed(2) : '0'
      },
      dateRange: {
        start: startDate,
        end: endDate
      }
    })
  } catch (error) {
    console.error('Error fetching demographic insights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}