// Enhanced Meta API Client v2 with Complete Data Pipeline
import { z } from 'zod'
import { MetaAPIClient, processInsights } from './meta-api-client'
import { MetaAPIEnhanced } from './meta-api-enhanced'
import { CacheManager, getCacheManager, Cacheable } from './data-pipeline/cache-manager'
import { RateLimiter, getRateLimiter, RateLimit } from './data-pipeline/rate-limiter'
import { DataValidator, DataTransformer, DataSanitizer } from './data-pipeline/data-validator'
import { BatchProcessor, BatchBuilder, MetaBatchExecutor } from './data-pipeline/batch-processor'

// Export all base functionality
export * from './meta-api-client'
export * from './meta-api-enhanced'

// Configuration for enhanced client
export interface EnhancedClientConfig {
  accessToken: string
  adAccountId: string
  debug?: boolean
  cacheEnabled?: boolean
  cacheTTL?: number
  rateLimitTier?: 'development' | 'standard' | 'business'
  batchingEnabled?: boolean
  validationEnabled?: boolean
}

// Enhanced metrics with additional fields
export interface EnhancedCampaignMetrics {
  // Basic metrics
  id: string
  name: string
  status: string
  objective: string
  
  // Financial metrics
  spend: number
  revenue: number
  profit: number
  roas: number
  cpa: number
  
  // Performance metrics
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  conversionRate: number
  
  // Timing metrics
  frequency: number
  reach: number
  
  // Calculated fields
  costPerThousandImpressions: number
  revenuePerThousandImpressions: number
  
  // Metadata
  lastUpdated: Date
  dataQuality: 'high' | 'medium' | 'low'
}

// Data pipeline statistics
export interface PipelineStats {
  cacheHitRate: number
  apiCallsSaved: number
  rateLimitStatus: {
    currentUsage: number
    maxAllowed: number
    resetTime: Date
  }
  validationErrors: number
  batchEfficiency: number
}

export class MetaAPIEnhancedV2 extends MetaAPIEnhanced {
  private cache: CacheManager
  private rateLimiter: RateLimiter
  private batchProcessor: BatchProcessor
  private config: EnhancedClientConfig
  private stats: PipelineStats = {
    cacheHitRate: 0,
    apiCallsSaved: 0,
    rateLimitStatus: {
      currentUsage: 0,
      maxAllowed: 200,
      resetTime: new Date()
    },
    validationErrors: 0,
    batchEfficiency: 0
  }

  constructor(config: EnhancedClientConfig) {
    super(config.accessToken, config.adAccountId, config.debug)
    
    this.config = config
    this.cache = getCacheManager({
      defaultTTL: config.cacheTTL || 5 * 60 * 1000, // 5 minutes default
      persistToLocalStorage: config.cacheEnabled !== false
    })
    
    this.rateLimiter = getRateLimiter(config.rateLimitTier || 'standard')
    this.batchProcessor = new BatchProcessor()
  }

  // Override fetchWithRetry to add caching and rate limiting
  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<any> {
    // Generate cache key
    const cacheKey = this.cache.generateKey({ url, options })
    
    // Check cache first if enabled
    if (this.config.cacheEnabled !== false) {
      const cached = this.cache.get(cacheKey)
      if (cached) {
        this.stats.apiCallsSaved++
        this.updateCacheStats()
        return cached
      }
    }
    
    // Execute with rate limiting
    const endpoint = this.extractEndpoint(url)
    const result = await this.rateLimiter.execute(
      endpoint,
      () => super.fetchWithRetry(url, options, retries),
      { weight: 1 }
    )
    
    // Cache successful results
    if (this.config.cacheEnabled !== false && result) {
      this.cache.set(cacheKey, result, this.config.cacheTTL)
    }
    
    // Update rate limit stats
    this.updateRateLimitStats()
    
    return result
  }

  // Get campaigns with enhanced data pipeline
  async getCampaignsEnhanced(datePreset = 'last_30d'): Promise<EnhancedCampaignMetrics[]> {
    const cacheKey = this.cache.generateKey({
      method: 'getCampaignsEnhanced',
      datePreset,
      accountId: this.adAccountId
    })
    
    // Try cache first
    const cached = this.cache.get<EnhancedCampaignMetrics[]>(cacheKey)
    if (cached) {
      this.stats.apiCallsSaved++
      return cached
    }
    
    // Fetch fresh data
    const campaigns = await this.getCampaigns(datePreset)
    
    // Transform and validate data
    const enhanced = await this.transformCampaigns(campaigns, datePreset)
    
    // Cache results
    this.cache.set(cacheKey, enhanced, this.config.cacheTTL)
    
    return enhanced
  }

  // Batch fetch multiple campaigns with insights
  async batchFetchCampaigns(
    campaignIds: string[],
    datePreset = 'last_30d'
  ): Promise<Map<string, EnhancedCampaignMetrics>> {
    if (!this.config.batchingEnabled) {
      // Fall back to sequential fetching
      const results = new Map<string, EnhancedCampaignMetrics>()
      for (const id of campaignIds) {
        const data = await this.getCampaignCompleteHistory(id)
        const enhanced = await this.transformSingleCampaign(data.campaign, data.history)
        results.set(id, enhanced)
      }
      return results
    }
    
    // Build batch requests
    const builder = new BatchBuilder()
    campaignIds.forEach(id => {
      builder.addCampaignInsights(id, { datePreset })
    })
    
    const batchItems = builder.build()
    const executor = new MetaBatchExecutor(this.accessToken)
    
    // Process batch
    const results = await this.batchProcessor.process(
      batch => executor.execute(batch)
    )
    
    // Transform results
    const enhancedResults = new Map<string, EnhancedCampaignMetrics>()
    
    for (const [key, result] of results) {
      if (result.success && result.data) {
        const campaignId = key.replace('campaign_insights_', '')
        const transformed = await this.transformInsightsData(result.data, campaignId)
        if (transformed) {
          enhancedResults.set(campaignId, transformed)
        }
      }
    }
    
    // Update batch efficiency
    this.stats.batchEfficiency = enhancedResults.size / campaignIds.length
    
    return enhancedResults
  }

  // Real-time data sync with change detection
  async syncCampaignData(
    campaignId: string,
    lastSyncTime?: Date
  ): Promise<{
    data: EnhancedCampaignMetrics
    hasChanges: boolean
    changes?: string[]
  }> {
    // Get current data
    const current = await this.getCampaignEnhancedMetrics(campaignId)
    
    // Check for changes if we have a last sync time
    if (lastSyncTime) {
      const cacheKey = `sync_${campaignId}_${lastSyncTime.getTime()}`
      const previous = this.cache.get<EnhancedCampaignMetrics>(cacheKey)
      
      if (previous) {
        const changes = this.detectChanges(previous, current)
        return {
          data: current,
          hasChanges: changes.length > 0,
          changes
        }
      }
    }
    
    // Cache for future comparisons
    const newCacheKey = `sync_${campaignId}_${Date.now()}`
    this.cache.set(newCacheKey, current, 24 * 60 * 60 * 1000) // 24 hours
    
    return { data: current, hasChanges: true }
  }

  // Get enhanced metrics for a single campaign
  private async getCampaignEnhancedMetrics(campaignId: string): Promise<EnhancedCampaignMetrics> {
    const data = await this.getCampaignCompleteHistory(campaignId)
    return this.transformSingleCampaign(data.campaign, data.history)
  }

  // Transform campaigns to enhanced format
  private async transformCampaigns(
    campaigns: any[],
    datePreset: string
  ): Promise<EnhancedCampaignMetrics[]> {
    const enhanced: EnhancedCampaignMetrics[] = []
    
    for (const campaign of campaigns) {
      try {
        // Validate data if enabled
        if (this.config.validationEnabled !== false) {
          const validation = DataValidator.validateCampaign(campaign)
          if (!validation.success) {
            this.stats.validationErrors++
            console.warn(`Validation failed for campaign ${campaign.id}:`, validation.errors)
            continue
          }
        }
        
        // Transform to enhanced metrics
        const metrics = await this.transformSingleCampaign(campaign, [])
        enhanced.push(metrics)
      } catch (error) {
        console.error(`Failed to transform campaign ${campaign.id}:`, error)
      }
    }
    
    return enhanced
  }

  // Transform single campaign
  private async transformSingleCampaign(
    campaign: any,
    history: any[]
  ): Promise<EnhancedCampaignMetrics> {
    // Process insights
    const insights = campaign.insights?.data?.[0] || {}
    const processed = processInsights(insights)
    
    // Calculate additional metrics
    const spend = processed.spend || 0
    const revenue = processed.revenue || 0
    const impressions = processed.impressions || 0
    const clicks = processed.clicks || 0
    const conversions = processed.conversions || 0
    
    return {
      id: campaign.id,
      name: campaign.name,
      status: DataSanitizer.sanitizeStatus(campaign.status, campaign.effective_status),
      objective: campaign.objective || 'UNKNOWN',
      
      // Financial metrics
      spend,
      revenue,
      profit: revenue - spend,
      roas: processed.roas || 0,
      cpa: processed.cpa || 0,
      
      // Performance metrics
      impressions,
      clicks,
      conversions,
      ctr: processed.ctr || 0,
      cpc: processed.cpc || 0,
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      
      // Timing metrics
      frequency: processed.frequency || 0,
      reach: processed.reach || 0,
      
      // Calculated fields
      costPerThousandImpressions: impressions > 0 ? (spend / impressions) * 1000 : 0,
      revenuePerThousandImpressions: impressions > 0 ? (revenue / impressions) * 1000 : 0,
      
      // Metadata
      lastUpdated: new Date(),
      dataQuality: this.assessDataQuality(campaign, insights)
    }
  }

  // Transform insights data from batch
  private async transformInsightsData(
    insightsData: any,
    campaignId: string
  ): Promise<EnhancedCampaignMetrics | null> {
    try {
      const insights = insightsData.data?.[0] || insightsData
      const processed = processInsights(insights)
      
      // We need campaign info, so fetch it separately (or from cache)
      const campaignCacheKey = this.cache.generateKey({ campaignId, type: 'campaign' })
      let campaign = this.cache.get(campaignCacheKey)
      
      if (!campaign) {
        campaign = await this.fetchWithRetry(this.buildUrl(campaignId, {
          fields: 'id,name,status,objective,effective_status'
        }))
        this.cache.set(campaignCacheKey, campaign, 60 * 60 * 1000) // 1 hour
      }
      
      return this.transformSingleCampaign(campaign, [])
    } catch (error) {
      console.error(`Failed to transform insights for campaign ${campaignId}:`, error)
      return null
    }
  }

  // Assess data quality
  private assessDataQuality(campaign: any, insights: any): 'high' | 'medium' | 'low' {
    let score = 0
    const checks = [
      campaign.id,
      campaign.name,
      campaign.status,
      insights.spend !== undefined,
      insights.impressions !== undefined,
      insights.clicks !== undefined,
      insights.actions !== undefined,
      insights.action_values !== undefined
    ]
    
    score = checks.filter(Boolean).length
    
    if (score >= 7) return 'high'
    if (score >= 5) return 'medium'
    return 'low'
  }

  // Detect changes between two data points
  private detectChanges(
    previous: EnhancedCampaignMetrics,
    current: EnhancedCampaignMetrics
  ): string[] {
    const changes: string[] = []
    const threshold = 0.01 // 1% change threshold
    
    // Check numeric fields for significant changes
    const numericFields: (keyof EnhancedCampaignMetrics)[] = [
      'spend', 'revenue', 'impressions', 'clicks', 'conversions', 'roas', 'ctr', 'cpc'
    ]
    
    for (const field of numericFields) {
      const prev = previous[field] as number
      const curr = current[field] as number
      
      if (Math.abs(curr - prev) / (prev || 1) > threshold) {
        changes.push(`${field}: ${prev} → ${curr}`)
      }
    }
    
    // Check status changes
    if (previous.status !== current.status) {
      changes.push(`status: ${previous.status} → ${current.status}`)
    }
    
    return changes
  }

  // Extract endpoint from URL
  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      return pathParts[pathParts.length - 1] || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  // Update cache statistics
  private updateCacheStats(): void {
    const cacheStats = this.cache.getStats()
    this.stats.cacheHitRate = cacheStats.hitRate
  }

  // Update rate limit statistics
  private updateRateLimitStats(): void {
    const rlStats = this.rateLimiter.getUsageStats()
    this.stats.rateLimitStatus = {
      currentUsage: rlStats.currentRequests,
      maxAllowed: rlStats.maxRequests,
      resetTime: new Date(Date.now() + rlStats.timeUntilReset)
    }
  }

  // Get pipeline statistics
  getPipelineStats(): PipelineStats {
    this.updateCacheStats()
    this.updateRateLimitStats()
    return { ...this.stats }
  }

  // Clear cache
  clearCache(pattern?: string | RegExp): void {
    if (pattern) {
      this.cache.invalidatePattern(pattern)
    } else {
      this.cache.clear()
    }
  }

  // Export data functionality
  async exportCampaignData(
    campaignIds: string[],
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const data = await this.batchFetchCampaigns(campaignIds)
    
    if (format === 'json') {
      return JSON.stringify(Array.from(data.values()), null, 2)
    }
    
    // CSV format
    const campaigns = Array.from(data.values())
    if (campaigns.length === 0) return ''
    
    const headers = Object.keys(campaigns[0]).filter(k => typeof campaigns[0][k as keyof EnhancedCampaignMetrics] !== 'object')
    const csvHeaders = headers.join(',')
    
    const csvRows = campaigns.map(campaign => {
      return headers.map(header => {
        const value = campaign[header as keyof EnhancedCampaignMetrics]
        return typeof value === 'string' ? `"${value}"` : value
      }).join(',')
    })
    
    return [csvHeaders, ...csvRows].join('\n')
  }

  // Historical data management
  async getHistoricalDataRange(
    campaignId: string,
    startDate: Date,
    endDate: Date,
    aggregation: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<any[]> {
    const timeIncrement = aggregation === 'daily' ? '1' : 
                         aggregation === 'weekly' ? '7' :
                         'monthly'
    
    const url = this.buildUrl(`${campaignId}/insights`, {
      fields: 'spend,impressions,clicks,ctr,cpc,actions,action_values,conversions,cost_per_conversion',
      time_increment: timeIncrement,
      time_range: JSON.stringify({
        since: startDate.toISOString().split('T')[0],
        until: endDate.toISOString().split('T')[0]
      }),
      limit: 1000
    })
    
    const data = await this.fetchWithRetry(url)
    return data.data || []
  }

  // Data consistency check
  async performConsistencyCheck(campaignIds: string[]): Promise<{
    consistent: boolean
    issues: Array<{
      campaignId: string
      issue: string
      severity: 'high' | 'medium' | 'low'
    }>
  }> {
    const issues: Array<{
      campaignId: string
      issue: string
      severity: 'high' | 'medium' | 'low'
    }> = []
    
    for (const campaignId of campaignIds) {
      try {
        const campaign = await this.getCampaignEnhancedMetrics(campaignId)
        
        // Check for data anomalies
        if (campaign.spend > 0 && campaign.impressions === 0) {
          issues.push({
            campaignId,
            issue: 'Spend recorded with zero impressions',
            severity: 'high'
          })
        }
        
        if (campaign.clicks > campaign.impressions) {
          issues.push({
            campaignId,
            issue: 'Clicks exceed impressions',
            severity: 'high'
          })
        }
        
        if (campaign.conversions > campaign.clicks) {
          issues.push({
            campaignId,
            issue: 'Conversions exceed clicks',
            severity: 'medium'
          })
        }
        
        if (campaign.ctr > 100) {
          issues.push({
            campaignId,
            issue: 'CTR exceeds 100%',
            severity: 'high'
          })
        }
        
        if (campaign.dataQuality === 'low') {
          issues.push({
            campaignId,
            issue: 'Low data quality detected',
            severity: 'low'
          })
        }
      } catch (error) {
        issues.push({
          campaignId,
          issue: `Failed to fetch campaign data: ${error}`,
          severity: 'high'
        })
      }
    }
    
    return {
      consistent: issues.length === 0,
      issues
    }
  }

  // Cleanup method
  destroy(): void {
    this.cache.destroy()
    this.rateLimiter.reset()
  }
}