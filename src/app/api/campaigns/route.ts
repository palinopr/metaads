import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { sql, eq, and, desc } from "drizzle-orm"
import { campaigns, metaAdAccounts, metaConnections, campaignInsights, users } from "@/db/schema"
import { z } from "zod"

// Validation schemas
const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  objective: z.enum(["SALES", "TRAFFIC", "AWARENESS", "ENGAGEMENT"]),
  budgetType: z.enum(["DAILY", "LIFETIME"]),
  budgetAmount: z.number().positive(),
  spendCap: z.number().positive().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  adAccountId: z.string(),
  targeting: z.object({}).optional(),
  placements: z.array(z.string()).optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const adAccountId = searchParams.get('adAccountId')
    const includeInsights = searchParams.get('includeInsights') === 'true'
    const syncWithMeta = searchParams.get('sync') === 'true'
    
    // Get selected ad account with token
    let accountData: any = null
    try {
      const accountQuery = adAccountId
        ? db
            .select({
              account_id: sql`COALESCE(${metaAdAccounts.accountId}, ${metaAdAccounts.id})`,
              account_name: metaAdAccounts.name,
              access_token: metaConnections.accessToken
            })
            .from(metaAdAccounts)
            .innerJoin(metaConnections, eq(metaAdAccounts.connectionId, metaConnections.id))
            .where(
              and(
                eq(metaAdAccounts.userId, session.user.id),
                eq(metaAdAccounts.id, adAccountId)
              )
            )
            .limit(1)
        : db
            .select({
              account_id: sql`COALESCE(${metaAdAccounts.accountId}, ${metaAdAccounts.id})`,
              account_name: metaAdAccounts.name,
              access_token: metaConnections.accessToken
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
      
      const result = await accountQuery
      accountData = result[0]
    } catch (dbError) {
      console.error('[Campaigns] Database connection error:', dbError)
      // Continue with empty result, tables might not exist
    }
    
    if (!accountData) {
      return NextResponse.json({ 
        campaigns: [],
        error: "No ad account selected"
      })
    }
    
    const account = accountData
    
    // Check if account_id looks like a UUID (wrong format)
    const isValidMetaAccountId = account.account_id && /^\d+$/.test(account.account_id)
    
    if (!isValidMetaAccountId) {
      console.error('[Campaigns] Invalid Meta account ID format:', account.account_id)
      return NextResponse.json({ 
        campaigns: [],
        error: "Invalid ad account ID format. Please reconnect your Meta account.",
        debug: {
          accountId: account.account_id,
          accountName: account.account_name,
          help: "Visit /dashboard/connections to reconnect your Meta account"
        }
      })
    }
    
    // First, get campaigns from local database
    let localCampaigns: any[] = []
    try {
      localCampaigns = await db
        .select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.userId, session.user.id),
            eq(campaigns.adAccountId, account.account_id as string)
          )
        )
        .orderBy(desc(campaigns.createdAt))
    } catch (dbError) {
      console.error('[Campaigns] Database error:', dbError)
      // Tables might not exist yet, continue with empty local campaigns
    }
    
    // If sync is requested, fetch from Meta API and update local DB
    if (syncWithMeta && account.access_token) {
      const limit = searchParams.get('limit') || '50'
      const datePreset = searchParams.get('date_preset') || 'last_30d'
      
      console.log(`[Campaigns] Syncing campaigns for account ${account.account_id}`)
      
      const campaignsUrl = `https://graph.facebook.com/v18.0/act_${account.account_id}/campaigns?fields=id,name,status,objective,created_time,updated_time,daily_budget,lifetime_budget,budget_remaining,effective_status,insights.date_preset(${datePreset}){impressions,clicks,spend,ctr,cpm,reach}&limit=${limit}&access_token=${account.access_token}`
      
      const response = await fetch(campaignsUrl)
      const data = await response.json()
      
      if (data.error) {
        console.error('[Campaigns] Meta API error:', data.error)
        // Return local campaigns even if Meta sync fails
        return NextResponse.json({
          campaigns: localCampaigns,
          error: `Meta sync failed: ${data.error.message}`,
          syncError: true,
          debug: {
            error_type: data.error.type,
            error_code: data.error.code,
            fbtrace_id: data.error.fbtrace_id
          }
        })
      }
      
      // Sync Meta campaigns to local DB (only if tables exist)
      if (data.data && data.data.length > 0) {
        try {
          for (const metaCampaign of data.data) {
            const existingCampaign = localCampaigns.find(c => c.metaId === metaCampaign.id)
            
            const campaignData = {
              metaId: metaCampaign.id,
              adAccountId: account.account_id as string,
              userId: session.user.id,
              name: metaCampaign.name,
              status: metaCampaign.effective_status || metaCampaign.status,
              objective: metaCampaign.objective,
              budgetType: metaCampaign.daily_budget ? 'DAILY' : 'LIFETIME',
              budgetAmount: metaCampaign.daily_budget 
                ? parseInt(metaCampaign.daily_budget) 
                : metaCampaign.lifetime_budget 
                ? parseInt(metaCampaign.lifetime_budget)
                : 0,
              syncedAt: new Date(),
            }
            
            if (existingCampaign) {
              // Update existing campaign
              await db
                .update(campaigns)
                .set(campaignData)
                .where(eq(campaigns.id, existingCampaign.id))
            } else {
              // Insert new campaign
              await db.insert(campaigns).values(campaignData)
            }
            
            // Store insights if available
            if (metaCampaign.insights?.data?.[0]) {
              const insights = metaCampaign.insights.data[0]
              await db.insert(campaignInsights).values({
                campaignId: existingCampaign?.id || metaCampaign.id,
                date: new Date(),
                impressions: parseInt(insights.impressions || 0),
                clicks: parseInt(insights.clicks || 0),
                spend: Math.round(parseFloat(insights.spend || 0) * 100), // Convert to cents
                ctr: Math.round(parseFloat(insights.ctr || 0) * 10000),
                cpm: Math.round(parseFloat(insights.cpm || 0) * 100),
              }).onConflictDoNothing()
            }
          }
        } catch (syncError) {
          console.error('[Campaigns] Sync to DB error:', syncError)
          // Continue without local sync
        }
        
        // Refresh local campaigns after sync
        try {
          const updatedCampaigns = await db
            .select()
            .from(campaigns)
            .where(
              and(
                eq(campaigns.userId, session.user.id),
                eq(campaigns.adAccountId, account.account_id as string)
              )
            )
            .orderBy(desc(campaigns.createdAt))
          
          localCampaigns = updatedCampaigns
        } catch (refreshError) {
          console.error('[Campaigns] Refresh error:', refreshError)
        }
        
        return NextResponse.json({
          campaigns: localCampaigns,
          syncedAt: new Date().toISOString(),
          account: {
            id: account.account_id,
            name: account.account_name
          }
        })
      }
    }
    
    // Get insights if requested
    let campaignWithInsights = localCampaigns
    if (includeInsights && localCampaigns.length > 0) {
      try {
        // Fetch all insights in a single query instead of N+1 queries
        const campaignIds = localCampaigns.map(c => c.id)
        const allInsights = await db
          .select()
          .from(campaignInsights)
          .where(sql`${campaignInsights.campaignId} IN ${campaignIds}`)
          .orderBy(desc(campaignInsights.date))
        
        // Group insights by campaign ID and get the latest for each
        const insightsMap = new Map()
        allInsights.forEach(insight => {
          if (!insightsMap.has(insight.campaignId) || 
              insight.date > insightsMap.get(insight.campaignId).date) {
            insightsMap.set(insight.campaignId, insight)
          }
        })
        
        // Map insights back to campaigns
        campaignWithInsights = localCampaigns.map(campaign => ({
          ...campaign,
          insights: insightsMap.get(campaign.id) || null
        }))
      } catch (insightsError) {
        console.error('[Campaigns] Insights error:', insightsError)
        // Continue without insights
      }
    }
    
    // Calculate summary stats including insights data
    const summary = {
      total_campaigns: campaignWithInsights.length,
      active_campaigns: campaignWithInsights.filter(c => c.status === 'ACTIVE').length,
      paused_campaigns: campaignWithInsights.filter(c => c.status === 'PAUSED').length,
      total_budget: campaignWithInsights.reduce((sum, c) => sum + (c.budgetAmount || 0), 0) / 100,
      total_spend: campaignWithInsights.reduce((sum, c) => sum + (c.insights?.spend || 0), 0) / 100,
      total_impressions: campaignWithInsights.reduce((sum, c) => sum + (c.insights?.impressions || 0), 0),
      total_clicks: campaignWithInsights.reduce((sum, c) => sum + (c.insights?.clicks || 0), 0),
    }
    
    // Add caching headers for non-sync requests
    const response = NextResponse.json({
      campaigns: campaignWithInsights,
      summary,
      account: {
        id: account.account_id,
        name: account.account_name
      }
    })
    
    // Cache for 5 minutes if not syncing
    if (!syncWithMeta) {
      response.headers.set('Cache-Control', 'private, max-age=300')
    }
    
    return response
    
  } catch (error) {
    console.error('Error in campaigns endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Validate request body
    const validatedData = createCampaignSchema.parse(body)
    
    // Verify user has access to the ad account
    const adAccount = await db
      .select()
      .from(metaAdAccounts)
      .where(
        and(
          eq(metaAdAccounts.id, validatedData.adAccountId),
          eq(metaAdAccounts.userId, session.user.id)
        )
      )
      .limit(1)
    
    if (adAccount.length === 0) {
      return NextResponse.json(
        { error: 'Invalid ad account' },
        { status: 403 }
      )
    }
    
    // Create campaign in local database first
    const newCampaign = await db.insert(campaigns).values({
      adAccountId: validatedData.adAccountId,
      userId: session.user.id,
      name: validatedData.name,
      status: 'ACTIVE',
      objective: validatedData.objective,
      budgetType: validatedData.budgetType,
      budgetAmount: Math.round(validatedData.budgetAmount * 100), // Convert to cents
      spendCap: validatedData.spendCap ? Math.round(validatedData.spendCap * 100) : null,
      startTime: validatedData.startTime ? new Date(validatedData.startTime) : null,
      endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
    }).returning()
    
    // TODO: Create campaign in Meta Ads API
    // This would involve:
    // 1. Getting the access token for the ad account
    // 2. Making a POST request to Meta Graph API
    // 3. Updating the local campaign with the Meta campaign ID
    
    return NextResponse.json({ 
      success: true,
      campaign: newCampaign[0],
      campaignId: newCampaign[0].id
    })
  } catch (error) {
    console.error('Campaign creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}

// Update campaign
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('id')
    
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID required' },
        { status: 400 }
      )
    }
    
    const body = await req.json()
    const { name, status, budgetAmount, spendCap, endTime } = body
    
    // Verify ownership
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
    
    // Update campaign
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (status !== undefined) updateData.status = status
    if (budgetAmount !== undefined) updateData.budgetAmount = Math.round(budgetAmount * 100)
    if (spendCap !== undefined) updateData.spendCap = Math.round(spendCap * 100)
    if (endTime !== undefined) updateData.endTime = new Date(endTime)
    updateData.updatedAt = new Date()
    
    const updatedCampaign = await db
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, campaignId))
      .returning()
    
    // TODO: Update campaign in Meta Ads API if it has a metaId
    
    return NextResponse.json({
      success: true,
      campaign: updatedCampaign[0]
    })
  } catch (error) {
    console.error('Campaign update error:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

// Delete campaign
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('id')
    
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID required' },
        { status: 400 }
      )
    }
    
    // Verify ownership and delete
    const deletedCampaign = await db
      .delete(campaigns)
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.userId, session.user.id)
        )
      )
      .returning()
    
    if (deletedCampaign.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }
    
    // TODO: Delete or archive campaign in Meta Ads API if it has a metaId
    
    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    })
  } catch (error) {
    console.error('Campaign deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}