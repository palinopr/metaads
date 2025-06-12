// Optimized Meta API client with caching and rate limiting
import { apiManager } from './api-manager'

interface MetaAPIConfig {
  accessToken?: string
  adAccountId?: string
}

export class OptimizedMetaAPI {
  private config: MetaAPIConfig
  private baseURL = 'https://graph.facebook.com/v18.0'

  constructor(config: MetaAPIConfig = {}) {
    this.config = {
      accessToken: config.accessToken || process.env.NEXT_PUBLIC_META_ACCESS_TOKEN,
      adAccountId: config.adAccountId || process.env.NEXT_PUBLIC_META_AD_ACCOUNT_ID
    }
  }

  private getEndpoint(path: string): string {
    const params = new URLSearchParams({
      access_token: this.config.accessToken || '',
      fields: this.getFieldsForEndpoint(path)
    })
    return `${this.baseURL}/${path}?${params}`
  }

  private getFieldsForEndpoint(path: string): string {
    if (path.includes('campaigns')) {
      return 'id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time,insights{impressions,clicks,spend,conversions,ctr,cpc,cpm}'
    }
    if (path.includes('adsets')) {
      return 'id,name,status,daily_budget,lifetime_budget,targeting,created_time,updated_time'
    }
    if (path.includes('ads')) {
      return 'id,name,status,creative,created_time,updated_time'
    }
    return 'id,name'
  }

  async getCampaigns(options?: { 
    limit?: number
    forceRefresh?: boolean 
  }) {
    if (!this.config.accessToken || !this.config.adAccountId) {
      throw new Error('Missing Meta API credentials')
    }

    const endpoint = this.getEndpoint(`act_${this.config.adAccountId}/campaigns`)
    
    try {
      const data = await apiManager.request(endpoint, undefined, {
        ttl: 300000, // Cache for 5 minutes
        forceRefresh: options?.forceRefresh
      })
      
      return data.data || []
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
      throw error
    }
  }

  async getCampaignInsights(campaignId: string, options?: {
    dateRange?: { since: string, until: string }
    forceRefresh?: boolean
  }) {
    const params = new URLSearchParams({
      access_token: this.config.accessToken || '',
      fields: 'impressions,clicks,spend,conversions,ctr,cpc,cpm,frequency',
      level: 'campaign',
      ...options?.dateRange
    })

    const endpoint = `${this.baseURL}/${campaignId}/insights?${params}`
    
    return apiManager.request(endpoint, undefined, {
      ttl: 600000, // Cache for 10 minutes
      forceRefresh: options?.forceRefresh
    })
  }

  async batchGetCampaignData(campaignIds: string[]) {
    // Batch multiple campaign requests
    const requests = campaignIds.map(id => ({
      endpoint: this.getEndpoint(`${id}`),
      cacheOptions: { ttl: 600000 }
    }))

    return apiManager.batchRequest(requests)
  }

  async getAccountOverview() {
    if (!this.config.adAccountId) {
      throw new Error('Missing ad account ID')
    }

    const endpoint = this.getEndpoint(`act_${this.config.adAccountId}`)
    
    return apiManager.request(endpoint, undefined, {
      ttl: 3600000 // Cache for 1 hour
    })
  }

  // Get rate limit status
  getRateLimitStatus() {
    return apiManager.getRateLimitStatus()
  }

  // Clear cache
  clearCache(endpoint?: string) {
    apiManager.clearCache(endpoint)
  }
}

// Export singleton instance
export const metaAPI = new OptimizedMetaAPI()