// Database Query Pattern - MetaAds Standard
// This example shows the standard patterns for database queries using Drizzle ORM

import { db } from "@/db/drizzle"
import { eq, and, desc, sql, inArray, isNull, gte } from "drizzle-orm"
import { 
  campaigns, 
  adSets,
  ads,
  metaAdAccounts, 
  metaConnections, 
  campaignInsights,
  users
} from "@/db/schema"

// 1. Simple query with error handling
export async function getUserById(userId: string) {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    
    return user || null
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

// 2. Complex join query with conditional filtering
export async function getUserCampaigns(
  userId: string, 
  options?: {
    accountId?: string
    status?: string[]
    limit?: number
    offset?: number
  }
) {
  try {
    // Build dynamic where conditions
    const conditions = [eq(campaigns.userId, userId)]
    
    if (options?.accountId) {
      conditions.push(eq(campaigns.adAccountId, options.accountId))
    }
    
    if (options?.status && options.status.length > 0) {
      conditions.push(inArray(campaigns.status, options.status))
    }

    // Execute query with joins
    const results = await db
      .select({
        campaign: campaigns,
        account: {
          id: metaAdAccounts.id,
          name: metaAdAccounts.name,
          accountId: metaAdAccounts.accountId
        },
        latestInsight: {
          impressions: campaignInsights.impressions,
          clicks: campaignInsights.clicks,
          spend: campaignInsights.spend,
          date: campaignInsights.date
        }
      })
      .from(campaigns)
      .leftJoin(metaAdAccounts, eq(campaigns.adAccountId, metaAdAccounts.id))
      .leftJoin(
        campaignInsights,
        and(
          eq(campaigns.id, campaignInsights.campaignId),
          // Subquery to get only the latest insight
          sql`${campaignInsights.date} = (
            SELECT MAX(date) 
            FROM ${campaignInsights} ci2 
            WHERE ci2.campaign_id = ${campaigns.id}
          )`
        )
      )
      .where(and(...conditions))
      .orderBy(desc(campaigns.createdAt))
      .limit(options?.limit || 50)
      .offset(options?.offset || 0)
    
    return results
    
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return []
  }
}

// 3. Transaction pattern for data consistency
export async function createCampaignWithAdSets(
  campaignData: typeof campaigns.$inferInsert,
  adSetsData: Array<typeof adSets.$inferInsert>
) {
  try {
    return await db.transaction(async (tx) => {
      // Insert campaign
      const [campaign] = await tx
        .insert(campaigns)
        .values(campaignData)
        .returning()
      
      // Insert ad sets with campaign ID
      const insertedAdSets = await tx
        .insert(adSets)
        .values(
          adSetsData.map(adSet => ({
            ...adSet,
            campaignId: campaign.id
          }))
        )
        .returning()
      
      // Log the action
      await tx.insert(activityLogs).values({
        userId: campaign.userId,
        action: 'campaign_created',
        entityId: campaign.id,
        entityType: 'campaign',
        metadata: { adSetCount: insertedAdSets.length }
      })
      
      return { campaign, adSets: insertedAdSets }
    })
  } catch (error) {
    console.error('Transaction failed:', error)
    throw new Error('Failed to create campaign')
  }
}

// 4. Aggregation query pattern
export async function getCampaignMetrics(
  campaignId: string,
  dateRange?: { start: Date; end: Date }
) {
  try {
    const conditions = [eq(campaignInsights.campaignId, campaignId)]
    
    if (dateRange) {
      conditions.push(
        and(
          gte(campaignInsights.date, dateRange.start),
          lte(campaignInsights.date, dateRange.end)
        )
      )
    }

    const [metrics] = await db
      .select({
        totalImpressions: sql<number>`COALESCE(SUM(${campaignInsights.impressions}), 0)`,
        totalClicks: sql<number>`COALESCE(SUM(${campaignInsights.clicks}), 0)`,
        totalSpend: sql<number>`COALESCE(SUM(${campaignInsights.spend}), 0)`,
        avgCtr: sql<number>`
          CASE 
            WHEN SUM(${campaignInsights.impressions}) > 0 
            THEN ROUND(SUM(${campaignInsights.clicks})::numeric / SUM(${campaignInsights.impressions}) * 100, 2)
            ELSE 0 
          END
        `,
        avgCpc: sql<number>`
          CASE 
            WHEN SUM(${campaignInsights.clicks}) > 0 
            THEN ROUND(SUM(${campaignInsights.spend})::numeric / SUM(${campaignInsights.clicks}), 2)
            ELSE 0 
          END
        `,
        daysActive: sql<number>`COUNT(DISTINCT DATE(${campaignInsights.date}))`
      })
      .from(campaignInsights)
      .where(and(...conditions))
    
    return metrics
    
  } catch (error) {
    console.error('Error calculating metrics:', error)
    return {
      totalImpressions: 0,
      totalClicks: 0,
      totalSpend: 0,
      avgCtr: 0,
      avgCpc: 0,
      daysActive: 0
    }
  }
}

// 5. Batch operations pattern
export async function batchUpdateCampaignStatus(
  campaignIds: string[],
  newStatus: string,
  userId: string
) {
  try {
    // Verify ownership first
    const ownedCampaigns = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(
        and(
          inArray(campaigns.id, campaignIds),
          eq(campaigns.userId, userId)
        )
      )
    
    const ownedIds = ownedCampaigns.map(c => c.id)
    
    if (ownedIds.length === 0) {
      return { updated: 0, skipped: campaignIds.length }
    }

    // Perform batch update
    const updated = await db
      .update(campaigns)
      .set({ 
        status: newStatus,
        updatedAt: new Date()
      })
      .where(inArray(campaigns.id, ownedIds))
      .returning({ id: campaigns.id })
    
    return {
      updated: updated.length,
      skipped: campaignIds.length - updated.length
    }
    
  } catch (error) {
    console.error('Batch update failed:', error)
    throw new Error('Failed to update campaigns')
  }
}

// 6. Complex data fetching with related entities
export async function getCampaignHierarchy(campaignId: string, userId: string) {
  try {
    // Verify campaign ownership
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.userId, userId)
        )
      )
    
    if (!campaign) {
      return null
    }

    // Fetch related data in parallel
    const [adSetsData, adsData, insightsData] = await Promise.all([
      // Get ad sets
      db
        .select()
        .from(adSets)
        .where(eq(adSets.campaignId, campaignId))
        .orderBy(desc(adSets.createdAt)),
      
      // Get ads with their ad sets
      db
        .select({
          ad: ads,
          adSetName: adSets.name
        })
        .from(ads)
        .innerJoin(adSets, eq(ads.adSetId, adSets.id))
        .where(eq(adSets.campaignId, campaignId))
        .orderBy(desc(ads.createdAt)),
      
      // Get last 7 days of insights
      db
        .select()
        .from(campaignInsights)
        .where(
          and(
            eq(campaignInsights.campaignId, campaignId),
            gte(campaignInsights.date, sql`CURRENT_DATE - INTERVAL '7 days'`)
          )
        )
        .orderBy(desc(campaignInsights.date))
    ])

    return {
      campaign,
      adSets: adSetsData,
      ads: adsData,
      insights: insightsData
    }
    
  } catch (error) {
    console.error('Error fetching campaign hierarchy:', error)
    return null
  }
}

// 7. Optimized query for frequently accessed data
export async function getUserDashboardData(userId: string) {
  try {
    // Use a single query with multiple CTEs for efficiency
    const result = await db.execute(sql`
      WITH user_accounts AS (
        SELECT 
          ma.id,
          ma.account_id,
          ma.name,
          ma.currency
        FROM ${metaAdAccounts} ma
        WHERE ma.user_id = ${userId}
          AND ma.is_active = true
      ),
      recent_campaigns AS (
        SELECT 
          c.*,
          ua.name as account_name
        FROM ${campaigns} c
        INNER JOIN user_accounts ua ON c.ad_account_id = ua.id
        WHERE c.user_id = ${userId}
        ORDER BY c.created_at DESC
        LIMIT 10
      ),
      today_metrics AS (
        SELECT 
          ci.campaign_id,
          SUM(ci.impressions) as impressions,
          SUM(ci.clicks) as clicks,
          SUM(ci.spend) as spend
        FROM ${campaignInsights} ci
        INNER JOIN recent_campaigns rc ON ci.campaign_id = rc.id
        WHERE ci.date = CURRENT_DATE
        GROUP BY ci.campaign_id
      )
      SELECT 
        json_build_object(
          'accounts', COALESCE(json_agg(DISTINCT ua.*), '[]'::json),
          'recentCampaigns', COALESCE(json_agg(DISTINCT rc.*), '[]'::json),
          'todayMetrics', COALESCE(json_agg(DISTINCT tm.*), '[]'::json)
        ) as data
      FROM user_accounts ua
      CROSS JOIN recent_campaigns rc
      LEFT JOIN today_metrics tm ON tm.campaign_id = rc.id
    `)
    
    return result.rows[0]?.data || { accounts: [], recentCampaigns: [], todayMetrics: [] }
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return { accounts: [], recentCampaigns: [], todayMetrics: [] }
  }
}

// 8. Soft delete pattern
export async function softDeleteCampaign(campaignId: string, userId: string) {
  try {
    const [deleted] = await db
      .update(campaigns)
      .set({ 
        deletedAt: new Date(),
        status: 'DELETED'
      })
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.userId, userId),
          isNull(campaigns.deletedAt) // Don't delete already deleted
        )
      )
      .returning()
    
    return deleted || null
    
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return null
  }
}