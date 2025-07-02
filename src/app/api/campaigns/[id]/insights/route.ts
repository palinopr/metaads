import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { eq, and, between, desc, sql } from "drizzle-orm"
import { campaigns, campaignInsights, metaAdAccounts, metaConnections, demographicInsights } from "@/db/schema"

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
    const granularity = searchParams.get('granularity') || 'day' // day, week, month
    const sync = searchParams.get('sync') === 'true'
    const breakdown = searchParams.get('breakdown') // gender, age, gender_age
    const includeTimeSeries = searchParams.get('includeTimeSeries') === 'true'
    const aggregation = searchParams.get('aggregation') || 'daily'

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

    // If sync is requested and campaign has metaId, fetch from Meta
    if (sync && campaign[0].metaId) {
      const adAccount = await db
        .select({
          accessToken: metaConnections.accessToken
        })
        .from(metaAdAccounts)
        .innerJoin(metaConnections, eq(metaAdAccounts.connectionId, metaConnections.id))
        .where(eq(metaAdAccounts.id, campaign[0].adAccountId))
        .limit(1)

      if (adAccount.length > 0 && adAccount[0].accessToken) {
        try {
          const insightsUrl = `https://graph.facebook.com/v18.0/${campaign[0].metaId}/insights`
          const params = new URLSearchParams({
            access_token: adAccount[0].accessToken,
            fields: 'impressions,clicks,spend,ctr,cpm,conversions,reach,frequency,actions,cost_per_action_type,video_views,video_avg_time_watched',
            time_range: JSON.stringify({
              since: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              until: endDate || new Date().toISOString().split('T')[0]
            }),
            time_increment: granularity === 'day' ? '1' : granularity === 'week' ? '7' : '30'
          })
          
          // Add breakdown if requested
          if (breakdown) {
            if (breakdown === 'gender_age') {
              params.append('breakdowns', 'gender,age')
            } else {
              params.append('breakdowns', breakdown)
            }
          }

          const response = await fetch(`${insightsUrl}?${params}`)
          const data = await response.json()

          if (data.data && data.data.length > 0) {
            // Store insights in database
            if (breakdown) {
              // Store demographic insights
              for (const insight of data.data) {
                const demographicData = {
                  campaignId: campaign[0].id,
                  date: new Date(insight.date_start),
                  gender: insight.gender || 'unknown',
                  ageRange: insight.age || null,
                  impressions: parseInt(insight.impressions || 0),
                  clicks: parseInt(insight.clicks || 0),
                  spend: Math.round(parseFloat(insight.spend || 0) * 100), // Convert to cents
                  conversions: parseInt(insight.conversions || 0),
                  reach: parseInt(insight.reach || 0),
                  frequency: insight.frequency ? Math.round(parseFloat(insight.frequency) * 100) : null,
                  ctr: insight.ctr ? Math.round(parseFloat(insight.ctr) * 10000) : null,
                  cpc: insight.clicks > 0 ? Math.round((parseFloat(insight.spend) * 100) / parseInt(insight.clicks)) : null,
                  cpm: insight.cpm ? Math.round(parseFloat(insight.cpm) * 100) : null,
                  costPerConversion: insight.conversions > 0 ? Math.round((parseFloat(insight.spend) * 100) / parseInt(insight.conversions)) : null,
                  videoViews: parseInt(insight.video_views || 0),
                  videoAvgTimeWatched: parseInt(insight.video_avg_time_watched || 0),
                  actions: insight.actions || null,
                }

                await db
                  .insert(demographicInsights)
                  .values(demographicData)
                  .onConflictDoNothing() // Use constraint to prevent duplicates
              }
            } else {
              // Store regular insights (aggregated)
              for (const insight of data.data) {
                const insightData = {
                  campaignId: campaign[0].id,
                  date: new Date(insight.date_start),
                  impressions: parseInt(insight.impressions || 0),
                  clicks: parseInt(insight.clicks || 0),
                  spend: Math.round(parseFloat(insight.spend || 0) * 100), // Convert to cents
                  ctr: Math.round(parseFloat(insight.ctr || 0) * 10000),
                  cpm: Math.round(parseFloat(insight.cpm || 0) * 100),
                  conversions: parseInt(insight.conversions || 0),
                }

                await db
                  .insert(campaignInsights)
                  .values(insightData)
                  .onConflictDoUpdate({
                    target: [campaignInsights.campaignId, campaignInsights.date],
                    set: insightData
                  })
              }
            }
          }
        } catch (error) {
          console.error('Error syncing insights from Meta:', error)
        }
      }
    }

    // Build date filter
    let dateFilter: any
    let demographicDateFilter: any
    
    if (startDate && endDate) {
      dateFilter = and(
        eq(campaignInsights.campaignId, campaignId),
        between(campaignInsights.date, new Date(startDate), new Date(endDate))
      )!
      demographicDateFilter = and(
        eq(demographicInsights.campaignId, campaignId),
        between(demographicInsights.date, new Date(startDate), new Date(endDate))
      )!
    } else {
      dateFilter = eq(campaignInsights.campaignId, campaignId)
      demographicDateFilter = eq(demographicInsights.campaignId, campaignId)
    }

    // Get insights from database
    let insights: any[]
    let demographicData: any[] = []
    
    if (breakdown) {
      // Get demographic insights
      demographicData = await db
        .select()
        .from(demographicInsights)
        .where(demographicDateFilter)
        .orderBy(desc(demographicInsights.date), demographicInsights.gender)
      
      // Aggregate demographic data by date for summary
      insights = await db
        .select({
          campaignId: demographicInsights.campaignId,
          date: demographicInsights.date,
          impressions: sql<number>`SUM(${demographicInsights.impressions})`,
          clicks: sql<number>`SUM(${demographicInsights.clicks})`,
          spend: sql<number>`SUM(${demographicInsights.spend})`,
          conversions: sql<number>`SUM(${demographicInsights.conversions})`,
          reach: sql<number>`SUM(${demographicInsights.reach})`,
        })
        .from(demographicInsights)
        .where(demographicDateFilter)
        .groupBy(demographicInsights.campaignId, demographicInsights.date)
        .orderBy(desc(demographicInsights.date))
    } else {
      insights = await db
        .select()
        .from(campaignInsights)
        .where(dateFilter)
        .orderBy(desc(campaignInsights.date))
    }

    // Calculate aggregated metrics
    const aggregated = insights.reduce((acc, insight) => {
      acc.totalImpressions += insight.impressions
      acc.totalClicks += insight.clicks
      acc.totalSpend += insight.spend
      acc.totalConversions += insight.conversions || 0
      return acc
    }, {
      totalImpressions: 0,
      totalClicks: 0,
      totalSpend: 0,
      totalConversions: 0
    })

    // Calculate derived metrics
    const avgCtr = aggregated.totalImpressions > 0 
      ? (aggregated.totalClicks / aggregated.totalImpressions) * 100 
      : 0
    const avgCpc = aggregated.totalClicks > 0 
      ? aggregated.totalSpend / aggregated.totalClicks / 100 
      : 0
    const avgCpm = aggregated.totalImpressions > 0 
      ? (aggregated.totalSpend / aggregated.totalImpressions) * 1000 / 100 
      : 0

    const response: any = {
      campaign: {
        id: campaign[0].id,
        name: campaign[0].name,
        status: campaign[0].status
      },
      insights: insights.map(i => ({
        ...i,
        spend: i.spend / 100, // Convert back to dollars
        ctr: i.ctr ? i.ctr / 10000 : 0,
        cpm: i.cpm ? i.cpm / 100 : 0,
        cpc: i.clicks > 0 ? i.spend / i.clicks / 100 : 0
      })),
      summary: {
        ...aggregated,
        totalSpend: aggregated.totalSpend / 100,
        avgCtr: avgCtr.toFixed(2),
        avgCpc: avgCpc.toFixed(2),
        avgCpm: avgCpm.toFixed(2),
        roas: aggregated.totalSpend > 0 ? (aggregated.totalConversions * 50 / (aggregated.totalSpend / 100)).toFixed(2) : 0 // Assuming $50 per conversion
      },
      dateRange: {
        start: startDate || insights[insights.length - 1]?.date,
        end: endDate || insights[0]?.date
      }
    }
    
    // Add demographic breakdown if requested
    if (breakdown && demographicData.length > 0) {
      // Group demographic data by gender
      const genderBreakdown = demographicData.reduce((acc, demo) => {
        if (!acc[demo.gender]) {
          acc[demo.gender] = {
            impressions: 0,
            clicks: 0,
            spend: 0,
            conversions: 0,
            reach: 0,
            dataPoints: []
          }
        }
        
        acc[demo.gender].impressions += demo.impressions
        acc[demo.gender].clicks += demo.clicks
        acc[demo.gender].spend += demo.spend
        acc[demo.gender].conversions += demo.conversions || 0
        acc[demo.gender].reach += demo.reach || 0
        acc[demo.gender].dataPoints.push({
          date: demo.date,
          impressions: demo.impressions,
          clicks: demo.clicks,
          spend: demo.spend / 100,
          ctr: demo.ctr ? demo.ctr / 10000 : 0,
          cpm: demo.cpm ? demo.cpm / 100 : 0,
          ageRange: demo.ageRange
        })
        
        return acc
      }, {} as Record<string, any>)
      
      // Calculate metrics for each gender
      Object.keys(genderBreakdown).forEach(gender => {
        const data = genderBreakdown[gender]
        data.ctr = data.impressions > 0 ? ((data.clicks / data.impressions) * 100).toFixed(2) : 0
        data.cpc = data.clicks > 0 ? (data.spend / data.clicks / 100).toFixed(2) : 0
        data.cpm = data.impressions > 0 ? ((data.spend / data.impressions) * 1000 / 100).toFixed(2) : 0
        data.spend = data.spend / 100 // Convert to dollars
      })
      
      response.demographics = {
        breakdown: breakdown,
        data: genderBreakdown
      }
    }
    
    // Add time series data if requested
    if (includeTimeSeries) {
      // If no insights data, return empty array
      if (insights.length === 0) {
        response.timeSeries = []
      } else {
        // Format insights as time series
        response.timeSeries = insights.map(i => ({
          date: i.date,
          impressions: i.impressions,
          clicks: i.clicks,
          spend: i.spend / 100,
          conversions: i.conversions || 0,
          ctr: i.ctr ? i.ctr / 10000 : 0,
          cpc: i.clicks > 0 ? i.spend / i.clicks / 100 : 0,
          cpm: i.impressions > 0 ? (i.spend / i.impressions) * 1000 / 100 : 0
        }))
      }
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching campaign insights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Store new insights
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: campaignId } = await params
    const body = await request.json()

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

    // Validate and store insights
    const { date, impressions, clicks, spend, conversions, revenue } = body

    const insightData = {
      campaignId,
      date: new Date(date),
      impressions: parseInt(impressions || 0),
      clicks: parseInt(clicks || 0),
      spend: Math.round(parseFloat(spend || 0) * 100), // Convert to cents
      conversions: parseInt(conversions || 0),
      revenue: revenue ? Math.round(parseFloat(revenue) * 100) : 0,
      ctr: impressions > 0 ? Math.round((clicks / impressions) * 100 * 10000) : null,
      cpc: clicks > 0 ? Math.round((parseFloat(spend) * 100) / clicks) : null,
      cpm: impressions > 0 ? Math.round((parseFloat(spend) * 1000 / impressions) * 100) : null,
      roas: spend > 0 && revenue ? Math.round((revenue / parseFloat(spend)) * 100) : null
    }

    const newInsight = await db
      .insert(campaignInsights)
      .values(insightData)
      .returning()

    return NextResponse.json({
      success: true,
      insight: {
        ...newInsight[0],
        spend: newInsight[0].spend / 100,
        revenue: newInsight[0].revenue / 100,
        ctr: newInsight[0].ctr ? newInsight[0].ctr / 10000 : null,
        cpc: newInsight[0].cpc ? newInsight[0].cpc / 100 : null,
        cpm: newInsight[0].cpm ? newInsight[0].cpm / 100 : null,
        roas: newInsight[0].roas ? newInsight[0].roas / 100 : null
      }
    })
  } catch (error) {
    console.error('Error storing campaign insights:', error)
    return NextResponse.json(
      { error: 'Failed to store insights' },
      { status: 500 }
    )
  }
}