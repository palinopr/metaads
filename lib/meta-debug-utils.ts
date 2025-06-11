/**
 * Meta Ads API Debugging Utilities
 * Provides comprehensive logging and validation for Meta Ads integration
 */

import { z } from 'zod'

// Validation schemas
export const MetricsSchema = z.object({
  spend: z.string().or(z.number()).transform(val => parseFloat(String(val))),
  impressions: z.string().or(z.number()).transform(val => parseInt(String(val))),
  clicks: z.string().or(z.number()).transform(val => parseInt(String(val))),
  ctr: z.string().or(z.number()).optional(),
  cpm: z.string().or(z.number()).optional(),
  cpc: z.string().or(z.number()).optional(),
})

export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  objective: z.string().optional(),
  insights: z.object({
    data: z.array(MetricsSchema).optional()
  }).optional()
})

// Performance timing utility
export class PerformanceTimer {
  private timers: Map<string, number> = new Map()
  private logs: Array<{ operation: string, duration: number, timestamp: string }> = []

  start(operation: string): void {
    this.timers.set(operation, Date.now())
    console.log(`[TIMER] Started: ${operation}`)
  }

  end(operation: string): number {
    const startTime = this.timers.get(operation)
    if (!startTime) {
      console.warn(`[TIMER] No start time found for: ${operation}`)
      return 0
    }

    const duration = Date.now() - startTime
    this.timers.delete(operation)
    
    const log = {
      operation,
      duration,
      timestamp: new Date().toISOString()
    }
    
    this.logs.push(log)
    console.log(`[TIMER] Completed: ${operation} (${duration}ms)`)
    
    return duration
  }

  getReport(): Array<{ operation: string, duration: number, timestamp: string }> {
    return [...this.logs]
  }

  getTotalTime(): number {
    return this.logs.reduce((total, log) => total + log.duration, 0)
  }
}

// Campaign structure logger
export function logCampaignStructure(campaign: any, detailed = false): void {
  console.log('\n=== Campaign Structure ===')
  console.log(`ID: ${campaign.id}`)
  console.log(`Name: ${campaign.name}`)
  console.log(`Status: ${campaign.status}`)
  console.log(`Objective: ${campaign.objective || 'N/A'}`)
  
  if (campaign.insights?.data?.[0]) {
    const insights = campaign.insights.data[0]
    console.log('\n--- Insights ---')
    console.log(`Spend: $${insights.spend || 0}`)
    console.log(`Impressions: ${insights.impressions || 0}`)
    console.log(`Clicks: ${insights.clicks || 0}`)
    console.log(`CTR: ${insights.ctr || 0}%`)
    console.log(`CPM: $${insights.cpm || 0}`)
    console.log(`CPC: $${insights.cpc || 0}`)
    
    if (insights.actions && detailed) {
      console.log('\n--- Actions ---')
      insights.actions.forEach((action: any) => {
        console.log(`${action.action_type}: ${action.value}`)
      })
    }
    
    if (insights.action_values && detailed) {
      console.log('\n--- Action Values ---')
      insights.action_values.forEach((actionValue: any) => {
        console.log(`${actionValue.action_type}: $${actionValue.value}`)
      })
    }
  } else {
    console.log('\n--- No Insights Available ---')
  }
  
  if (campaign.adsets) {
    console.log(`\n--- Ad Sets (${campaign.adsets.length}) ---`)
    campaign.adsets.forEach((adset: any, index: number) => {
      console.log(`${index + 1}. ${adset.name} (${adset.id}) - Status: ${adset.status}`)
    })
  }
  
  console.log('========================\n')
}

// Data integrity validator
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  metrics: {
    totalCampaigns: number
    campaignsWithInsights: number
    campaignsWithoutInsights: number
    totalSpend: number
    totalImpressions: number
    totalClicks: number
  }
}

export function validateCampaignData(campaigns: any[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  let totalCampaigns = 0
  let campaignsWithInsights = 0
  let campaignsWithoutInsights = 0
  let totalSpend = 0
  let totalImpressions = 0
  let totalClicks = 0

  if (!Array.isArray(campaigns)) {
    errors.push('Campaigns data is not an array')
    return {
      isValid: false,
      errors,
      warnings,
      metrics: {
        totalCampaigns: 0,
        campaignsWithInsights: 0,
        campaignsWithoutInsights: 0,
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0
      }
    }
  }

  campaigns.forEach((campaign, index) => {
    totalCampaigns++
    
    // Validate basic structure
    try {
      CampaignSchema.parse(campaign)
    } catch (error) {
      errors.push(`Campaign at index ${index} has invalid structure: ${error}`)
    }

    // Check for insights
    if (campaign.insights?.data?.[0]) {
      campaignsWithInsights++
      const insights = campaign.insights.data[0]
      
      // Accumulate metrics
      totalSpend += parseFloat(insights.spend || '0')
      totalImpressions += parseInt(insights.impressions || '0')
      totalClicks += parseInt(insights.clicks || '0')
      
      // Validate metric consistency
      if (parseFloat(insights.spend || '0') > 0 && parseInt(insights.impressions || '0') === 0) {
        warnings.push(`Campaign "${campaign.name}" has spend but no impressions`)
      }
      
      if (parseInt(insights.clicks || '0') > parseInt(insights.impressions || '0')) {
        errors.push(`Campaign "${campaign.name}" has more clicks than impressions`)
      }
    } else {
      campaignsWithoutInsights++
      if (campaign.status === 'ACTIVE') {
        warnings.push(`Active campaign "${campaign.name}" has no insights data`)
      }
    }

    // Check ad sets
    if (campaign.adsets_count !== undefined && campaign.adsets_count !== campaign.adsets?.length) {
      warnings.push(`Campaign "${campaign.name}" adsets_count (${campaign.adsets_count}) doesn't match actual ad sets (${campaign.adsets?.length || 0})`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      totalCampaigns,
      campaignsWithInsights,
      campaignsWithoutInsights,
      totalSpend,
      totalImpressions,
      totalClicks
    }
  }
}

// Error recovery helpers
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
  backoffMultiplier = 2
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[RETRY] Attempt ${attempt}/${maxRetries}`)
      return await fetchFn()
    } catch (error: any) {
      lastError = error
      console.error(`[RETRY] Attempt ${attempt} failed:`, error.message)
      
      // Check if error is retryable
      if (isRetryableError(error)) {
        if (attempt < maxRetries) {
          const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1)
          console.log(`[RETRY] Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } else {
        // Non-retryable error, throw immediately
        throw error
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded')
}

function isRetryableError(error: any): boolean {
  // Rate limiting errors
  if (error.code === 17 || error.code === 4) {
    return true
  }
  
  // Network errors
  if (error.message?.includes('fetch failed') || 
      error.message?.includes('network') ||
      error.message?.includes('timeout')) {
    return true
  }
  
  // Temporary Meta API errors
  if (error.code === 1 || error.code === 2) {
    return true
  }
  
  return false
}

// Fallback data structure generator
export function createFallbackCampaign(campaignId: string, campaignName: string): any {
  return {
    id: campaignId,
    name: campaignName,
    status: 'UNKNOWN',
    objective: 'UNKNOWN',
    insights: {
      data: [{
        spend: '0',
        impressions: '0',
        clicks: '0',
        ctr: '0',
        cpm: '0',
        cpc: '0',
        actions: [],
        action_values: []
      }]
    },
    adsets: [],
    adsets_count: 0,
    _isFallback: true
  }
}

// Access token validator
export async function validateAccessToken(token: string): Promise<{
  isValid: boolean
  error?: string
  tokenInfo?: any
}> {
  try {
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim()
    
    // Call Meta's debug_token endpoint
    const response = await fetch(
      `https://graph.facebook.com/v19.0/debug_token?input_token=${cleanToken}&access_token=${cleanToken}`
    )
    
    const data = await response.json()
    
    if (!response.ok || data.error) {
      return {
        isValid: false,
        error: data.error?.message || 'Invalid token'
      }
    }
    
    const tokenData = data.data
    
    // Check if token is valid
    if (!tokenData.is_valid) {
      return {
        isValid: false,
        error: 'Token is not valid'
      }
    }
    
    // Check if token has required permissions
    const requiredPermissions = ['ads_management', 'ads_read']
    const hasPermissions = requiredPermissions.every(perm => 
      tokenData.scopes?.includes(perm)
    )
    
    if (!hasPermissions) {
      return {
        isValid: false,
        error: `Missing required permissions: ${requiredPermissions.join(', ')}`
      }
    }
    
    return {
      isValid: true,
      tokenInfo: {
        appId: tokenData.app_id,
        userId: tokenData.user_id,
        expiresAt: tokenData.expires_at,
        scopes: tokenData.scopes
      }
    }
  } catch (error: any) {
    return {
      isValid: false,
      error: `Failed to validate token: ${error.message}`
    }
  }
}

// Rate limit tracker
export class RateLimitTracker {
  private requestCounts: Map<string, number[]> = new Map()
  private readonly windowMs = 60000 // 1 minute window
  
  recordRequest(endpoint: string): void {
    const now = Date.now()
    const requests = this.requestCounts.get(endpoint) || []
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs)
    
    // Add current request
    validRequests.push(now)
    this.requestCounts.set(endpoint, validRequests)
  }
  
  getRequestCount(endpoint: string): number {
    const now = Date.now()
    const requests = this.requestCounts.get(endpoint) || []
    return requests.filter(time => now - time < this.windowMs).length
  }
  
  shouldThrottle(endpoint: string, maxRequests = 200): boolean {
    return this.getRequestCount(endpoint) >= maxRequests
  }
  
  getWaitTime(endpoint: string, maxRequests = 200): number {
    const requests = this.requestCounts.get(endpoint) || []
    if (requests.length < maxRequests) return 0
    
    const oldestRequest = Math.min(...requests)
    const waitTime = this.windowMs - (Date.now() - oldestRequest)
    return Math.max(0, waitTime)
  }
}