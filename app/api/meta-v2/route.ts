// Enhanced Meta API Route v2 with Data Pipeline
import { NextRequest, NextResponse } from 'next/server'
import { MetaAPIEnhancedV2 } from '@/lib/meta-api-enhanced-v2'
import { z } from 'zod'

// Request validation schemas
const BaseRequestSchema = z.object({
  accessToken: z.string().min(1),
  adAccountId: z.string().regex(/^act_\d+$/),
  type: z.string()
})

const OverviewRequestSchema = BaseRequestSchema.extend({
  type: z.literal('overview'),
  datePreset: z.string().optional().default('last_30d'),
  useCache: z.boolean().optional().default(true),
  includePipelineStats: z.boolean().optional().default(false)
})

const BatchRequestSchema = BaseRequestSchema.extend({
  type: z.literal('batch'),
  campaignIds: z.array(z.string()),
  datePreset: z.string().optional().default('last_30d')
})

const SyncRequestSchema = BaseRequestSchema.extend({
  type: z.literal('sync'),
  campaignId: z.string(),
  lastSyncTime: z.string().optional()
})

const ConsistencyCheckSchema = BaseRequestSchema.extend({
  type: z.literal('consistency_check'),
  campaignIds: z.array(z.string())
})

const ExportRequestSchema = BaseRequestSchema.extend({
  type: z.literal('export'),
  campaignIds: z.array(z.string()),
  format: z.enum(['json', 'csv']).optional().default('json')
})

const HistoricalRequestSchema = BaseRequestSchema.extend({
  type: z.literal('historical'),
  campaignId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  aggregation: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily')
})

// Client cache for connection reuse
const clientCache = new Map<string, { client: MetaAPIEnhancedV2; timestamp: number }>()
const CLIENT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getOrCreateClient(accessToken: string, adAccountId: string): MetaAPIEnhancedV2 {
  const cacheKey = `${adAccountId}_${accessToken.slice(-8)}`
  const cached = clientCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL) {
    return cached.client
  }
  
  const client = new MetaAPIEnhancedV2({
    accessToken,
    adAccountId,
    debug: process.env.NODE_ENV === 'development',
    cacheEnabled: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    rateLimitTier: 'standard',
    batchingEnabled: true,
    validationEnabled: true
  })
  
  clientCache.set(cacheKey, { client, timestamp: Date.now() })
  
  // Clean up old clients
  if (clientCache.size > 10) {
    const sortedEntries = Array.from(clientCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    // Remove oldest entries
    for (let i = 0; i < 5; i++) {
      const [key, value] = sortedEntries[i]
      value.client.destroy()
      clientCache.delete(key)
    }
  }
  
  return client
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate base request
    const baseValidation = BaseRequestSchema.safeParse(body)
    if (!baseValidation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: baseValidation.error.errors },
        { status: 400 }
      )
    }

    const { type, accessToken, adAccountId } = baseValidation.data

    // Handle different request types
    switch (type) {
      case 'overview': {
        const validation = OverviewRequestSchema.safeParse(body)
        if (!validation.success) {
          return NextResponse.json(
            { error: 'Invalid overview request', details: validation.error.errors },
            { status: 400 }
          )
        }

        const { datePreset, useCache, includePipelineStats } = validation.data
        const client = getOrCreateClient(accessToken, adAccountId)
        
        try {
          // Clear cache if requested
          if (!useCache) {
            client.clearCache()
          }
          
          // Fetch enhanced campaign data
          const campaigns = await client.getCampaignsEnhanced(datePreset)
          
          // Calculate overview metrics
          const overview = campaigns.reduce((acc, campaign) => {
            if (campaign.status === 'ACTIVE') {
              acc.activeCampaigns++
            }
            
            acc.totalSpend += campaign.spend
            acc.totalRevenue += campaign.revenue
            acc.totalConversions += campaign.conversions
            acc.totalImpressions += campaign.impressions
            acc.totalClicks += campaign.clicks
            
            return acc
          }, {
            activeCampaigns: 0,
            totalSpend: 0,
            totalRevenue: 0,
            totalConversions: 0,
            totalImpressions: 0,
            totalClicks: 0
          })
          
          // Calculate derived metrics
          const overallROAS = overview.totalSpend > 0 ? overview.totalRevenue / overview.totalSpend : 0
          const avgCTR = overview.totalImpressions > 0 ? (overview.totalClicks / overview.totalImpressions) * 100 : 0
          const avgCPC = overview.totalClicks > 0 ? overview.totalSpend / overview.totalClicks : 0
          const avgCPA = overview.totalConversions > 0 ? overview.totalSpend / overview.totalConversions : 0
          
          const response: any = {
            success: true,
            campaigns: campaigns.map(c => ({
              ...c,
              // Add compatibility fields for dashboard
              insights: {
                data: [{
                  spend: c.spend.toString(),
                  impressions: c.impressions.toString(),
                  clicks: c.clicks.toString(),
                  ctr: c.ctr.toString(),
                  cpc: c.cpc.toString(),
                  actions: [],
                  action_values: []
                }]
              }
            })),
            overview: {
              ...overview,
              overallROAS,
              avgCTR,
              avgCPC,
              avgCPA
            }
          }
          
          if (includePipelineStats) {
            response.pipelineStats = client.getPipelineStats()
          }
          
          return NextResponse.json(response)
          
        } catch (error: any) {
          console.error('Error fetching overview:', error)
          
          // Handle token errors
          if (error.isTokenExpired || error.message?.toLowerCase().includes('token')) {
            return NextResponse.json(
              { error: 'Invalid or expired access token', success: false },
              { status: 401 }
            )
          }
          
          return NextResponse.json(
            { error: error.message || 'Failed to fetch campaigns', success: false },
            { status: 500 }
          )
        }
      }

      case 'batch': {
        const validation = BatchRequestSchema.safeParse(body)
        if (!validation.success) {
          return NextResponse.json(
            { error: 'Invalid batch request', details: validation.error.errors },
            { status: 400 }
          )
        }

        const { campaignIds, datePreset } = validation.data
        const client = getOrCreateClient(accessToken, adAccountId)
        
        try {
          const results = await client.batchFetchCampaigns(campaignIds, datePreset)
          
          return NextResponse.json({
            success: true,
            campaigns: Object.fromEntries(results),
            pipelineStats: client.getPipelineStats()
          })
        } catch (error: any) {
          return NextResponse.json(
            { error: error.message || 'Batch fetch failed', success: false },
            { status: 500 }
          )
        }
      }

      case 'sync': {
        const validation = SyncRequestSchema.safeParse(body)
        if (!validation.success) {
          return NextResponse.json(
            { error: 'Invalid sync request', details: validation.error.errors },
            { status: 400 }
          )
        }

        const { campaignId, lastSyncTime } = validation.data
        const client = getOrCreateClient(accessToken, adAccountId)
        
        try {
          const result = await client.syncCampaignData(
            campaignId,
            lastSyncTime ? new Date(lastSyncTime) : undefined
          )
          
          return NextResponse.json({
            success: true,
            ...result
          })
        } catch (error: any) {
          return NextResponse.json(
            { error: error.message || 'Sync failed', success: false },
            { status: 500 }
          )
        }
      }

      case 'consistency_check': {
        const validation = ConsistencyCheckSchema.safeParse(body)
        if (!validation.success) {
          return NextResponse.json(
            { error: 'Invalid consistency check request', details: validation.error.errors },
            { status: 400 }
          )
        }

        const { campaignIds } = validation.data
        const client = getOrCreateClient(accessToken, adAccountId)
        
        try {
          const result = await client.performConsistencyCheck(campaignIds)
          
          return NextResponse.json({
            success: true,
            ...result
          })
        } catch (error: any) {
          return NextResponse.json(
            { error: error.message || 'Consistency check failed', success: false },
            { status: 500 }
          )
        }
      }

      case 'export': {
        const validation = ExportRequestSchema.safeParse(body)
        if (!validation.success) {
          return NextResponse.json(
            { error: 'Invalid export request', details: validation.error.errors },
            { status: 400 }
          )
        }

        const { campaignIds, format } = validation.data
        const client = getOrCreateClient(accessToken, adAccountId)
        
        try {
          const exportData = await client.exportCampaignData(campaignIds, format)
          
          const headers: HeadersInit = {
            'Content-Type': format === 'csv' ? 'text/csv' : 'application/json',
            'Content-Disposition': `attachment; filename=campaigns-export-${new Date().toISOString().split('T')[0]}.${format}`
          }
          
          return new NextResponse(exportData, { 
            status: 200,
            headers 
          })
        } catch (error: any) {
          return NextResponse.json(
            { error: error.message || 'Export failed', success: false },
            { status: 500 }
          )
        }
      }

      case 'historical': {
        const validation = HistoricalRequestSchema.safeParse(body)
        if (!validation.success) {
          return NextResponse.json(
            { error: 'Invalid historical request', details: validation.error.errors },
            { status: 400 }
          )
        }

        const { campaignId, startDate, endDate, aggregation } = validation.data
        const client = getOrCreateClient(accessToken, adAccountId)
        
        try {
          const data = await client.getHistoricalDataRange(
            campaignId,
            new Date(startDate),
            new Date(endDate),
            aggregation
          )
          
          return NextResponse.json({
            success: true,
            data,
            count: data.length
          })
        } catch (error: any) {
          return NextResponse.json(
            { error: error.message || 'Historical data fetch failed', success: false },
            { status: 500 }
          )
        }
      }

      default:
        return NextResponse.json(
          { error: `Unknown request type: ${type}` },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  const stats = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeClients: clientCache.size,
    clients: Array.from(clientCache.entries()).map(([key, value]) => ({
      key: key.substring(0, 10) + '...',
      age: Date.now() - value.timestamp,
      stats: value.client.getPipelineStats()
    }))
  }
  
  return NextResponse.json(stats)
}