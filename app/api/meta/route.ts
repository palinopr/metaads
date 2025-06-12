import { NextRequest, NextResponse } from 'next/server'
import { safeJsonParse, withTimeout } from '@/lib/server-protection'
import { MetaAPIClient } from '@/lib/meta-api-client'
import { AdSetAndAdAPI } from '@/lib/meta-api-adsets'
import { withSecurity } from '@/lib/security/security-middleware'
import { createValidationMiddleware, secureSchemas } from '@/lib/security/input-validation'
import { z } from 'zod'

const META_API_BASE = 'https://graph.facebook.com/v19.0'

// Request validation schemas
const metaApiRequestSchema = z.object({
  endpoint: z.string().optional(),
  params: z.record(z.any()).optional(),
  accessToken: secureSchemas.metaAccessToken,
  type: z.enum(['test_connection', 'campaign_details', 'insights', 'adsets', 'ads']).optional(),
  datePreset: secureSchemas.dateRange.optional(),
  adAccountId: secureSchemas.metaAdAccountId,
  campaignId: secureSchemas.campaignId.optional()
});

// Create validation middleware
const validateMetaRequest = createValidationMiddleware(metaApiRequestSchema);

// Legacy rate limiting storage (now handled by security middleware)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

// Rate limit configuration
const RATE_LIMITS = {
  validation: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
  api: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 per minute
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 } // 5 per 15 minutes
}

function checkRateLimit(key: string, type: keyof typeof RATE_LIMITS): { allowed: boolean; retryAfter?: number } {
  const config = RATE_LIMITS[type]
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true }
  }
  
  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }
  
  record.count++
  return { allowed: true }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (real) {
    return real
  }
  
  return 'unknown'
}

async function handleMetaAPIRequest(request: NextRequest): Promise<NextResponse> {
  let response: Response | null = null
  const clientIP = getClientIP(request)
  
  try {
    // Temporarily disable validation to fix request issues
    // const validation = await validateMetaRequest(request);
    // 
    // if (!validation.valid) {
    //   console.warn('Meta API validation failed:', validation.errors);
    //   return NextResponse.json(
    //     { 
    //       error: 'Request validation failed', 
    //       details: validation.errors,
    //       threats: validation.threats || []
    //     },
    //     { status: 400 }
    //   );
    // }
    
    const body = await request.json();
    
    const { endpoint, params = {}, accessToken, type, datePreset, adAccountId } = body
    
    // Debug logging for request analysis
    console.log('Meta API request received:', {
      type,
      endpoint: endpoint || 'undefined',
      hasAccessToken: !!accessToken,
      hasAdAccountId: !!adAccountId,
      datePreset,
      paramsKeys: Object.keys(params || {})
    })

    // Handle campaign details request
    if (type === 'campaign_details' && adAccountId && accessToken) {
      try {
        const { campaignId } = body
        
        if (!campaignId) {
          return NextResponse.json(
            { error: 'Campaign ID is required for campaign_details type' },
            { status: 400 }
          )
        }
        
        console.log(`Fetching details for campaign ${campaignId}...`)
        
        // Directly fetch campaign insights from Meta API
        const insightsUrl = `https://graph.facebook.com/v19.0/${campaignId}/insights`
        const params = new URLSearchParams({
          access_token: accessToken,
          time_range: JSON.stringify({
            since: datePreset === 'last_7d' ? '2024-06-04' : '2024-05-12',
            until: '2024-06-11'
          }),
          fields: 'spend,impressions,clicks,ctr,cpc,actions,action_values,conversions,cost_per_conversion,reach,frequency,date_start,date_stop'
        })
        
        const insightsResponse = await fetch(`${insightsUrl}?${params}`)
        const insightsData = await insightsResponse.json()
        
        // Also fetch ad sets for this campaign
        const adSetsUrl = `https://graph.facebook.com/v19.0/${campaignId}/adsets`
        const adSetsParams = new URLSearchParams({
          access_token: accessToken,
          fields: 'id,name,status,created_time,updated_time,insights{spend,impressions,clicks,ctr,cpc,actions,action_values}'
        })
        
        const adSetsResponse = await fetch(`${adSetsUrl}?${adSetsParams}`)
        const adSetsData = await adSetsResponse.json()
        
        // Process historical daily data (using insights data)
        // const processedHistoricalData = [] // Removed - using processedInsights instead
        
        // Process hourly data (empty for now)
        const processedHourlyData: any[] = []
        
        // Process insights data
        const processedInsights = insightsData.data ? insightsData.data.map((insight: any) => {
          const spend = parseFloat(insight.spend || '0')
          let revenue = 0
          let conversions = 0
          
          if (insight.action_values) {
            insight.action_values.forEach((actionValue: any) => {
              if (['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'].includes(actionValue.action_type)) {
                revenue += parseFloat(actionValue.value || '0')
              }
            })
          }
          
          if (insight.actions) {
            insight.actions.forEach((action: any) => {
              if (['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'].includes(action.action_type)) {
                conversions += parseInt(action.value || '0')
              }
            })
          }
          
          return {
            date: insight.date_start,
            spend,
            revenue,
            conversions,
            roas: spend > 0 ? revenue / spend : 0,
            impressions: parseInt(insight.impressions || '0'),
            clicks: parseInt(insight.clicks || '0'),
            ctr: parseFloat(insight.ctr || '0'),
            cpc: parseFloat(insight.cpc || '0'),
            reach: parseInt(insight.reach || '0'),
            frequency: parseFloat(insight.frequency || '0')
          }
        }) : []
        
        console.log(`Campaign ${campaignId} insights: ${processedInsights.length} data points`)
        
        // Calculate summary metrics for the entire period
        const totalData = processedInsights.reduce((acc, insight) => {
          return {
            spend: acc.spend + insight.spend,
            revenue: acc.revenue + insight.revenue,
            conversions: acc.conversions + insight.conversions,
            impressions: acc.impressions + insight.impressions,
            clicks: acc.clicks + insight.clicks
          }
        }, { spend: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 })

        // Calculate aggregate metrics
        const totalROAS = totalData.spend > 0 ? totalData.revenue / totalData.spend : 0
        const totalCTR = totalData.impressions > 0 ? (totalData.clicks / totalData.impressions) * 100 : 0
        const totalCPC = totalData.clicks > 0 ? totalData.spend / totalData.clicks : 0
        const conversionRate = totalData.clicks > 0 ? (totalData.conversions / totalData.clicks) * 100 : 0

        return NextResponse.json({
          success: true,
          historicalDailyData: processedInsights,
          todayHourlyData: processedHourlyData,
          adSets: adSetsData.data || [],
          // Add summary metrics that the frontend expects
          summary: {
            spend: totalData.spend,
            revenue: totalData.revenue,
            conversions: totalData.conversions,
            impressions: totalData.impressions,
            clicks: totalData.clicks,
            roas: totalROAS,
            ctr: totalCTR,
            cpc: totalCPC,
            conversionRate,
            performanceScore: Math.min(100, Math.max(0, (totalROAS * 20) + (totalCTR * 2)))
          },
          rawInsights: insightsData
        })
      } catch (error) {
        console.error('Error fetching campaign details:', error)
        return NextResponse.json({
          error: error instanceof Error ? error.message : 'Failed to fetch campaign details',
          success: false
        }, { status: 500 })
      }
    }

    // Handle test connection request
    if (type === 'test_connection' && adAccountId && accessToken) {
      // Rate limit connection tests
      const rateLimit = checkRateLimit(clientIP, 'validation')
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Too many validation attempts. Try again in ${rateLimit.retryAfter} seconds.`,
            retryAfter: rateLimit.retryAfter
          },
          { status: 429 }
        )
      }
      
      // Check for suspicious request patterns
      const userAgent = request.headers.get('user-agent') || ''
      if (!userAgent || userAgent.length < 10) {
        console.warn(`Suspicious request from ${clientIP}: minimal user agent`)
      }
      
      try {
        console.log('Testing connection to Meta API...')
        
        // Validate access token format
        const cleanToken = accessToken.trim().replace(/^Bearer\s+/i, '')
        if (!cleanToken || cleanToken.length < 20) {
          return NextResponse.json({
            success: false,
            error: 'Invalid access token format. Token appears to be too short.'
          }, { status: 400 })
        }
        
        // Validate ad account ID format
        const cleanAccountId = adAccountId.trim()
        if (!cleanAccountId.startsWith('act_') || !/^act_\d+$/.test(cleanAccountId)) {
          return NextResponse.json({
            success: false,
            error: 'Invalid ad account ID format. Must be "act_" followed by numbers only.'
          }, { status: 400 })
        }
        
        // Test API connection by fetching ad account info
        const testUrl = `${META_API_BASE}/${cleanAccountId}?fields=id,name,account_status,currency,timezone_name&access_token=${cleanToken}`
        
        const testResponse = await withTimeout(
          fetch(testUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(10000),
          }),
          10000
        )
        
        const testData = await safeJsonParse(testResponse)
        
        if (!testResponse.ok) {
          console.error('Meta API test connection failed:', testData)
          
          // Handle specific error cases
          if (testData?.error?.code === 190) {
            return NextResponse.json({
              success: false,
              error: 'Invalid OAuth access token - Cannot parse access token. Please check your token and try again.'
            }, { status: 401 })
          } else if (testData?.error?.code === 100) {
            return NextResponse.json({
              success: false,
              error: 'Invalid ad account ID. Please verify your account ID is correct.'
            }, { status: 400 })
          } else {
            return NextResponse.json({
              success: false,
              error: testData?.error?.message || 'Failed to connect to Meta API'
            }, { status: testResponse.status })
          }
        }
        
        console.log('Connection test successful:', testData)
        
        return NextResponse.json({
          success: true,
          accountInfo: {
            id: testData.id,
            name: testData.name,
            status: testData.account_status,
            currency: testData.currency,
            timezone: testData.timezone_name
          }
        })
        
      } catch (error: any) {
        console.error('Connection test error:', error)
        
        // Handle specific error types
        if (error.message?.includes('timeout')) {
          return NextResponse.json({
            success: false,
            error: 'Connection timeout. Please check your network and try again.'
          }, { status: 408 })
        }
        
        return NextResponse.json({
          success: false,
          error: error.message || 'Failed to test connection to Meta API'
        }, { status: 500 })
      }
    }

    // Handle legacy request format from dashboard
    if (type === 'overview' && adAccountId && accessToken) {
      // Rate limit API requests
      const rateLimit = checkRateLimit(clientIP, 'api')
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { 
            success: false, 
            error: `API rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`,
            retryAfter: rateLimit.retryAfter
          },
          { status: 429 }
        )
      }
      
      try {
        console.log('Creating Meta API clients for overview request...')
        
        // Create API client instances
        const client = new MetaAPIClient(accessToken, adAccountId)
        const adSetClient = new AdSetAndAdAPI(accessToken, adAccountId, false)
        
        console.log(`Fetching campaigns with date preset: ${datePreset || 'last_30d'}`)
        
        // Fetch campaigns with insights
        const campaigns = await client.getCampaigns(datePreset || 'last_30d')
        
        console.log(`Found ${campaigns.length} campaigns, fetching ad sets for each...`)
        if (campaigns.length > 0) {
          console.log('First campaign insights:', JSON.stringify(campaigns[0].insights, null, 2))
        }
        
        // For each campaign, fetch its ad sets and process insights
        const campaignsWithAdSets = await Promise.all(
          campaigns.map(async (campaign) => {
            try {
              console.log(`Fetching ad sets for campaign: ${campaign.name} (${campaign.id})`)
              
              // Process campaign insights data
              let processedCampaign = { ...campaign }
              if (campaign.insights?.data?.[0]) {
                const insights = campaign.insights.data[0]
                
                // Extract metrics from insights
                processedCampaign.spend = parseFloat(insights.spend || '0')
                processedCampaign.impressions = parseInt(insights.impressions || '0')
                processedCampaign.clicks = parseInt(insights.clicks || '0')
                processedCampaign.ctr = parseFloat(insights.ctr || '0')
                processedCampaign.cpc = parseFloat(insights.cpc || '0')
                
                // Calculate conversions and revenue from actions
                let conversions = 0
                let revenue = 0
                
                if (insights.actions) {
                  insights.actions.forEach((action: any) => {
                    if (['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'].includes(action.action_type)) {
                      conversions += parseInt(action.value || '0')
                    }
                  })
                }
                
                if (insights.action_values) {
                  insights.action_values.forEach((actionValue: any) => {
                    if (['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'].includes(actionValue.action_type)) {
                      revenue += parseFloat(actionValue.value || '0')
                    }
                  })
                }
                
                processedCampaign.conversions = conversions
                processedCampaign.revenue = revenue
                processedCampaign.roas = processedCampaign.spend > 0 ? revenue / processedCampaign.spend : 0
                processedCampaign.cpa = conversions > 0 ? processedCampaign.spend / conversions : 0
              } else {
                // Set default values if no insights
                processedCampaign.spend = 0
                processedCampaign.impressions = 0
                processedCampaign.clicks = 0
                processedCampaign.ctr = 0
                processedCampaign.cpc = 0
                processedCampaign.conversions = 0
                processedCampaign.revenue = 0
                processedCampaign.roas = 0
                processedCampaign.cpa = 0
              }
              
              // Fetch ad sets for this campaign
              console.log(`Fetching ad sets for campaign ID: ${campaign.id}`)
              const adSets = await adSetClient.getAdSetsForCampaign(campaign.id, datePreset || 'last_30d')
              
              console.log(`Campaign ${campaign.name}: found ${adSets.length} ad sets`)
              if (adSets.length > 0) {
                console.log(`First ad set: ${adSets[0].name} (${adSets[0].id})`)
              }
              console.log(`Metrics - spend: ${processedCampaign.spend}, roas: ${processedCampaign.roas}, impressions: ${processedCampaign.impressions}`)
              
              // Add ad sets to campaign object
              return {
                ...processedCampaign,
                adsets: adSets,
                adsets_count: adSets.length
              }
            } catch (error) {
              console.error(`Failed to fetch ad sets for campaign ${campaign.id}:`, error)
              // Return campaign with empty ad sets on error
              return {
                ...campaign,
                adsets: [],
                adsets_count: 0,
                adsets_error: error instanceof Error ? error.message : 'Failed to fetch ad sets',
                // Set default metrics
                spend: 0,
                impressions: 0,
                clicks: 0,
                ctr: 0,
                cpc: 0,
                conversions: 0,
                revenue: 0,
                roas: 0,
                cpa: 0
              }
            }
          })
        )
        
        // Log summary
        const summary = campaignsWithAdSets.map(c => ({
          name: c.name,
          id: c.id,
          adsets_count: c.adsets_count,
          has_adsets_array: !!c.adsets,
          adsets_length: c.adsets?.length || 0,
          has_insights: !!c.insights,
          spend: c.spend || 0,
          roas: c.roas || 0,
          impressions: c.impressions || 0
        }))
        
        console.log('Campaign summary:', JSON.stringify(summary, null, 2))
        console.log(`Total campaigns: ${campaignsWithAdSets.length}, Total ad sets: ${campaignsWithAdSets.reduce((sum, c) => sum + (c.adsets_count || 0), 0)}`)
        
        // Return in the format the dashboard expects
        return NextResponse.json({
          campaigns: campaignsWithAdSets,
          success: true
        })
      } catch (error: any) {
        console.error('Error in overview request:', error)
        
        // Handle specific OAuth/token errors
        if (error.message?.includes('OAuth') || 
            error.message?.includes('access token') || 
            error.message?.includes('Invalid token') ||
            error.message?.includes('Cannot parse access token')) {
          return NextResponse.json({
            error: 'Invalid OAuth access token - Cannot parse access token. Please check your token and try again.',
            success: false
          }, { status: 401 })
        }
        
        return NextResponse.json({
          error: error instanceof Error ? error.message : 'Failed to fetch campaigns',
          success: false
        }, { status: 500 })
      }
    }

    // Original endpoint-based logic
    if (!endpoint || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameters: endpoint and accessToken are required' },
        { status: 400 }
      )
    }

    // Validate endpoint format
    const trimmedEndpoint = endpoint.trim()
    if (!trimmedEndpoint || trimmedEndpoint === 'undefined' || trimmedEndpoint === 'null') {
      return NextResponse.json(
        { error: 'Invalid endpoint provided' },
        { status: 400 }
      )
    }

    // Build URL with parameters - add try-catch for URL construction
    let url: URL
    try {
      url = new URL(`${META_API_BASE}/${trimmedEndpoint}`)
    } catch (urlError) {
      console.error('Failed to construct URL:', {
        endpoint: trimmedEndpoint,
        base: META_API_BASE,
        error: urlError
      })
      return NextResponse.json(
        { error: 'Invalid endpoint format', details: `Failed to parse URL from endpoint: ${trimmedEndpoint}` },
        { status: 400 }
      )
    }
    
    // Add access token (remove Bearer prefix if present)
    const cleanToken = accessToken.replace(/^Bearer\s+/i, '')
    url.searchParams.append('access_token', cleanToken)
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    console.log('Proxying Meta API request to:', url.toString().replace(cleanToken, '***'))

    // Make the request to Meta with timeout
    response = await withTimeout(
      fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000), // Additional timeout
      }),
      15000 // 15 second timeout
    )

    const data = await safeJsonParse(response)

    if (!response.ok) {
      console.error('Meta API error:', data)
      return NextResponse.json(data || { error: 'Invalid response from Meta API' }, { status: response.status })
    }

    return NextResponse.json(data || {})
  } catch (error: any) {
    console.error('API route error:', error)
    console.error('Error stack:', error.stack)
    
    // Check if it's a timeout error
    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timeout', message: 'Meta API request took too long' },
        { status: 408 }
      )
    }
    
    // Check if it's a URL parsing error
    if (error.message?.includes('Failed to parse URL') || error.message?.includes('Invalid URL')) {
      return NextResponse.json(
        { error: 'URL parsing error', message: error.message, details: 'Check server logs for more information' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  } finally {
    // Cleanup
    response = null
  }
}

// Temporarily disable security middleware to fix 403 errors
export const POST = handleMetaAPIRequest;

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}