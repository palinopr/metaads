/**
 * Enhanced Meta API Client with Error Recovery and Retry Logic
 */

import { MetaAPIClient, MetaAPIError, TokenExpiredError, formatAccessToken } from './meta-api-client'
import { 
  PerformanceTimer, 
  fetchWithRetry, 
  RateLimitTracker,
  validateAccessToken,
  createFallbackCampaign 
} from './meta-debug-utils'

export interface EnhancedCampaign {
  id: string
  name: string
  status: string
  objective?: string
  insights?: any
  adsets?: any[]
  adsets_count: number
  metrics: {
    spend: number
    impressions: number
    clicks: number
    ctr: number
    cpc: number
    cpm: number
    conversions: number
    revenue: number
    roas: number
    cpa: number
  }
  _metadata: {
    fetchTime: number
    hasInsights: boolean
    hasAdSets: boolean
    errors: string[]
    isFallback?: boolean
  }
}

export class EnhancedMetaAPIClient extends MetaAPIClient {
  private timer: PerformanceTimer
  private rateLimiter: RateLimitTracker
  private debugMode: boolean
  private token: string
  private accountId: string

  constructor(accessToken: string, adAccountId: string, debugMode = false) {
    super(accessToken, adAccountId, debugMode)
    this.timer = new PerformanceTimer()
    this.rateLimiter = new RateLimitTracker()
    this.debugMode = debugMode
    this.token = formatAccessToken(accessToken)
    this.accountId = adAccountId
  }

  /**
   * Fetch campaigns with enhanced error handling and metrics processing
   */
  async getEnhancedCampaigns(datePreset = 'last_30d'): Promise<EnhancedCampaign[]> {
    this.timer.start('getEnhancedCampaigns')
    
    try {
      // Validate token before making requests
      if (this.debugMode) {
        const tokenValidation = await validateAccessToken(this.token)
        if (!tokenValidation.isValid) {
          throw new TokenExpiredError(tokenValidation.error || 'Invalid access token')
        }
      }

      // Fetch campaigns with retry logic
      const campaigns = await fetchWithRetry(
        () => this.getCampaigns(datePreset),
        3,
        1000,
        2
      )

      // Process each campaign
      const enhancedCampaigns: EnhancedCampaign[] = []
      
      for (const campaign of campaigns) {
        const enhancedCampaign = await this.processCampaign(campaign)
        enhancedCampaigns.push(enhancedCampaign)
      }

      this.timer.end('getEnhancedCampaigns')
      
      if (this.debugMode) {
        console.log('Performance Report:', this.timer.getReport())
      }

      return enhancedCampaigns
    } catch (error) {
      this.timer.end('getEnhancedCampaigns')
      throw error
    }
  }

  /**
   * Process a single campaign with enhanced metrics
   */
  private async processCampaign(campaign: any): Promise<EnhancedCampaign> {
    const startTime = Date.now()
    const errors: string[] = []
    
    // Initialize metrics with defaults
    let metrics = {
      spend: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      conversions: 0,
      revenue: 0,
      roas: 0,
      cpa: 0
    }

    let hasInsights = false
    let hasAdSets = false

    // Process insights if available
    if (campaign.insights?.data?.[0]) {
      try {
        const insights = campaign.insights.data[0]
        hasInsights = true

        // Basic metrics
        metrics.spend = parseFloat(insights.spend || '0')
        metrics.impressions = parseInt(insights.impressions || '0')
        metrics.clicks = parseInt(insights.clicks || '0')
        metrics.ctr = parseFloat(insights.ctr || '0')
        metrics.cpc = parseFloat(insights.cpc || '0')
        metrics.cpm = parseFloat(insights.cpm || '0')

        // Process conversions and revenue
        if (insights.actions) {
          insights.actions.forEach((action: any) => {
            if (['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'].includes(action.action_type)) {
              metrics.conversions += parseInt(action.value || '0')
            }
          })
        }

        if (insights.action_values) {
          insights.action_values.forEach((actionValue: any) => {
            if (['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'].includes(actionValue.action_type)) {
              metrics.revenue += parseFloat(actionValue.value || '0')
            }
          })
        }

        // Calculate derived metrics
        metrics.roas = metrics.spend > 0 ? metrics.revenue / metrics.spend : 0
        metrics.cpa = metrics.conversions > 0 ? metrics.spend / metrics.conversions : 0

        // Handle purchase_roas if available
        if (insights.purchase_roas?.[0]) {
          const roasValue = parseFloat(insights.purchase_roas[0].value || '0')
          if (roasValue > 0) {
            metrics.roas = roasValue
          }
        }
      } catch (error: any) {
        errors.push(`Failed to process insights: ${error.message}`)
      }
    } else {
      errors.push('No insights data available')
    }

    // Fetch ad sets with error recovery
    let adSets: any[] = []
    let adSetsCount = 0

    if (campaign.id) {
      try {
        // Check rate limiting
        if (this.rateLimiter.shouldThrottle('adsets')) {
          const waitTime = this.rateLimiter.getWaitTime('adsets')
          if (waitTime > 0) {
            console.log(`Rate limit reached, waiting ${waitTime}ms...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
          }
        }

        this.rateLimiter.recordRequest('adsets')
        
        // Import AdSetAndAdAPI dynamically to avoid circular dependency
        const { AdSetAndAdAPI } = await import('./meta-api-adsets')
        const adSetClient = new AdSetAndAdAPI(this.token, this.accountId, this.debugMode)
        
        adSets = await fetchWithRetry(
          () => adSetClient.getAdSetsForCampaign(campaign.id),
          2,
          500,
          1.5
        )
        
        adSetsCount = adSets.length
        hasAdSets = true
      } catch (error: any) {
        errors.push(`Failed to fetch ad sets: ${error.message}`)
        // Try alternative method if available
        if (campaign.adsets_count !== undefined) {
          adSetsCount = campaign.adsets_count
        }
      }
    }

    // Build enhanced campaign object
    const enhancedCampaign: EnhancedCampaign = {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      objective: campaign.objective,
      insights: campaign.insights,
      adsets: adSets,
      adsets_count: adSetsCount,
      metrics,
      _metadata: {
        fetchTime: Date.now() - startTime,
        hasInsights,
        hasAdSets,
        errors,
        isFallback: campaign._isFallback
      }
    }

    return enhancedCampaign
  }

  /**
   * Get campaigns with fallback data on error
   */
  async getCampaignsWithFallback(datePreset = 'last_30d'): Promise<EnhancedCampaign[]> {
    try {
      return await this.getEnhancedCampaigns(datePreset)
    } catch (error: any) {
      console.error('Failed to fetch campaigns, using fallback:', error)
      
      // Try to get at least campaign list without insights
      try {
        const basicUrl = this.buildUrl(`${this.accountId}/campaigns`, {
          fields: 'id,name,status,objective',
          limit: 50
        })
        
        const response = await this.fetchWithRetry(basicUrl)
        const campaigns = response.data || []
        
        // Convert to enhanced campaigns with fallback data
        return campaigns.map((campaign: any) => {
          const fallback = createFallbackCampaign(campaign.id, campaign.name)
          return this.processCampaign({
            ...fallback,
            ...campaign
          })
        })
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        throw new MetaAPIError(
          'Failed to fetch campaigns with all recovery attempts',
          'FETCH_FAILED',
          'APIError'
        )
      }
    }
  }

  /**
   * Test the full integration flow
   */
  async testFullFlow(datePreset = 'last_30d'): Promise<{
    success: boolean
    campaigns: EnhancedCampaign[]
    report: any
  }> {
    const report = {
      timestamp: new Date().toISOString(),
      datePreset,
      steps: [] as any[],
      errors: [] as string[],
      warnings: [] as string[],
      performance: {} as any
    }

    try {
      // Step 1: Validate connection
      this.timer.start('validateConnection')
      const accountInfo = await this.getAccountInfo()
      this.timer.end('validateConnection')
      
      report.steps.push({
        step: 'Account Validation',
        success: true,
        data: accountInfo
      })

      // Step 2: Fetch campaigns
      this.timer.start('fetchCampaigns')
      const campaigns = await this.getEnhancedCampaigns(datePreset)
      this.timer.end('fetchCampaigns')
      
      report.steps.push({
        step: 'Fetch Campaigns',
        success: true,
        count: campaigns.length
      })

      // Step 3: Analyze results
      const analysis = {
        totalCampaigns: campaigns.length,
        campaignsWithData: campaigns.filter(c => c._metadata.hasInsights).length,
        campaignsWithAdSets: campaigns.filter(c => c._metadata.hasAdSets).length,
        totalSpend: campaigns.reduce((sum, c) => sum + c.metrics.spend, 0),
        totalConversions: campaigns.reduce((sum, c) => sum + c.metrics.conversions, 0),
        totalRevenue: campaigns.reduce((sum, c) => sum + c.metrics.revenue, 0),
        averageRoas: campaigns.length > 0 
          ? campaigns.reduce((sum, c) => sum + c.metrics.roas, 0) / campaigns.length 
          : 0
      }

      report.steps.push({
        step: 'Data Analysis',
        success: true,
        analysis
      })

      // Collect all errors and warnings
      campaigns.forEach(campaign => {
        if (campaign._metadata.errors.length > 0) {
          report.errors.push(...campaign._metadata.errors.map(e => `${campaign.name}: ${e}`))
        }
      })

      // Performance summary
      report.performance = this.timer.getReport()

      return {
        success: true,
        campaigns,
        report
      }
    } catch (error: any) {
      report.errors.push(error.message)
      
      return {
        success: false,
        campaigns: [],
        report
      }
    }
  }

  /**
   * Get basic account info for validation
   */
  private async getAccountInfo(): Promise<any> {
    const url = this.buildUrl(this.accountId, {
      fields: 'id,name,account_status,currency,timezone_name'
    })
    
    return await this.fetchWithRetry(url)
  }
}