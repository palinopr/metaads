// Meta Graph API Client with proper error handling and debugging
import { z } from 'zod'

// Environment configuration
const META_API_VERSION = 'v19.0'
const META_API_BASE_URL = 'https://graph.facebook.com'

// Validation schemas
const AccessTokenSchema = z.string().min(1)
const AdAccountIdSchema = z.string().regex(/^act_\d+$/, 'Ad Account ID must start with "act_" followed by numbers')

// Error types
export class MetaAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public type?: string,
    public fbTraceId?: string,
    public isTokenExpired?: boolean
  ) {
    super(message)
    this.name = 'MetaAPIError'
  }
}

export class TokenExpiredError extends MetaAPIError {
  constructor(message: string = 'Access token has expired') {
    super(message, 'OAuthException', 'OAuthException', undefined, true)
    this.name = 'TokenExpiredError'
  }
}

// Helper to format access token (Meta doesn't use Bearer prefix)
export function formatAccessToken(token: string): string {
  const trimmedToken = token.trim()
  // Remove Bearer prefix if present (Meta API doesn't use it)
  if (trimmedToken.toLowerCase().startsWith('bearer ')) {
    return trimmedToken.substring(7).trim()
  }
  return trimmedToken
}

// Helper to validate and format ad account ID
export function formatAdAccountId(accountId: string): string {
  const trimmedId = accountId.trim()
  if (!trimmedId.startsWith('act_')) {
    return `act_${trimmedId}`
  }
  return trimmedId
}

// Debug logger
export function debugLog(message: string, data?: any) {
  if (typeof window !== 'undefined' && window.localStorage.getItem('debug') === 'true') {
    console.log(`[Meta API] ${message}`, data || '')
  }
}

// Main API client
export class MetaAPIClient {
  private accessToken: string
  private adAccountId: string
  private debug: boolean

  constructor(accessToken: string, adAccountId: string, debug = false) {
    // Validate inputs
    const validatedToken = AccessTokenSchema.parse(accessToken)
    const validatedAccountId = AdAccountIdSchema.parse(formatAdAccountId(adAccountId))

    this.accessToken = formatAccessToken(validatedToken)
    this.adAccountId = validatedAccountId
    this.debug = debug
  }

  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<any> {
    // Parse the URL to extract endpoint and params
    let urlObj: URL
    try {
      urlObj = new URL(url)
    } catch (error) {
      console.error('Invalid URL provided to fetchWithRetry:', url)
      throw new Error(`Invalid URL: ${url}`)
    }
    
    // Extract the pathname which looks like /v19.0/act_123/campaigns
    const pathname = urlObj.pathname
    
    // Find the version pattern (e.g., /v19.0/) and extract everything after it
    const versionMatch = pathname.match(/\/v\d+\.\d+\/(.*)/)
    const endpoint = versionMatch ? versionMatch[1] : pathname.replace(/^\//, '')
    
    // Validate endpoint
    if (!endpoint || endpoint === '') {
      console.error('Empty endpoint extracted from URL:', {
        url,
        pathname: urlObj.pathname,
        versionMatch,
        endpoint
      })
      throw new Error('Invalid endpoint extracted from URL')
    }
    
    // Convert search params to object
    const params: Record<string, string> = {}
    urlObj.searchParams.forEach((value, key) => {
      if (key !== 'access_token') {
        params[key] = value
      }
    })
    
    for (let i = 0; i < retries; i++) {
      try {
        debugLog(`Proxying request to: ${endpoint}`)
        
        // Use our proxy API route
        // In server context, we need to use absolute URL
        const apiUrl = typeof window === 'undefined' 
          ? `http://localhost:${process.env.PORT || 3000}/api/meta`
          : '/api/meta'
          
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint,
            params,
            accessToken: this.accessToken
          })
        })

        const data = await response.json()

        if (!response.ok) {
          const error = data.error || {}
          
          // Check if token is expired
          const isTokenExpired = error.code === 190 || 
                                error.type === 'OAuthException' ||
                                (error.message && error.message.toLowerCase().includes('expired')) ||
                                (error.message && error.message.toLowerCase().includes('invalid'))
          
          if (isTokenExpired) {
            throw new TokenExpiredError(error.message || 'Access token has expired')
          }
          
          throw new MetaAPIError(
            error.message || `HTTP ${response.status}`,
            error.code?.toString(),
            error.type,
            error.fbtrace_id,
            isTokenExpired
          )
        }

        debugLog('Success:', data)
        return data

      } catch (error) {
        debugLog(`Attempt ${i + 1} failed:`, error)
        
        if (i === retries - 1) throw error
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, i), 10000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  protected buildUrl(path: string, params: Record<string, any> = {}): string {
    // Validate path
    if (!path || path.trim() === '') {
      console.error('Empty path provided to buildUrl')
      throw new Error('Path is required for building URL')
    }
    
    const trimmedPath = path.trim()
    let url: URL
    
    try {
      url = new URL(`${META_API_BASE_URL}/${META_API_VERSION}/${trimmedPath}`)
    } catch (error) {
      console.error('Failed to construct URL in buildUrl:', {
        path: trimmedPath,
        base: `${META_API_BASE_URL}/${META_API_VERSION}`,
        error
      })
      throw new Error(`Failed to build URL with path: ${trimmedPath}`)
    }
    
    // Add access token (already cleaned in formatAccessToken)
    url.searchParams.append('access_token', this.accessToken)
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    debugLog(`Built URL: ${url.toString().replace(this.accessToken, '***')}`)
    return url.toString()
  }

  // Test connection and get account info
  async testConnection(): Promise<{
    success: boolean
    accountInfo?: any
    error?: string
  }> {
    try {
      const url = this.buildUrl(this.adAccountId, {
        fields: 'id,name,currency,timezone_name,spend_cap,amount_spent'
      })

      const data = await this.fetchWithRetry(url)
      
      return {
        success: true,
        accountInfo: data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get campaigns with insights
  async getCampaigns(datePreset = 'last_30d'): Promise<any[]> {
    const fields = [
      'id',
      'name',
      'status',
      'effective_status',
      'objective',
      'created_time',
      'updated_time',
      'daily_budget',
      'lifetime_budget',
      `insights.date_preset(${datePreset}){spend,impressions,clicks,ctr,cpc,actions,action_values,conversions,cost_per_conversion,frequency,reach}`
    ].join(',')

    const url = this.buildUrl(`${this.adAccountId}/campaigns`, {
      fields,
      limit: 100
    })

    const data = await this.fetchWithRetry(url)
    return data.data || []
  }

  // Get today's data for a campaign
  async getCampaignTodayData(campaignId: string): Promise<any> {
    const today = new Date().toISOString().split('T')[0]
    
    const url = this.buildUrl(`${campaignId}/insights`, {
      fields: 'spend,impressions,clicks,actions,action_values',
      time_range: JSON.stringify({ since: today, until: today })
    })

    const data = await this.fetchWithRetry(url)
    return data.data?.[0] || null
  }

  // Get campaign insights with custom date range
  async getCampaignInsights(campaignId: string, dateRange?: { since: string, until: string }): Promise<any> {
    const params: any = {
      fields: 'spend,impressions,clicks,ctr,cpc,actions,action_values,conversions,cost_per_conversion,frequency,reach'
    }

    if (dateRange) {
      params.time_range = JSON.stringify(dateRange)
    } else {
      params.date_preset = 'last_30d'
    }

    const url = this.buildUrl(`${campaignId}/insights`, params)
    const data = await this.fetchWithRetry(url)
    return data.data?.[0] || null
  }

  // Get hourly data for today
  async getHourlyData(campaignId: string): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0]
    
    const url = this.buildUrl(`${campaignId}/insights`, {
      fields: 'spend,impressions,clicks,actions,action_values,ctr,cpc',
      time_increment: 'hourly',
      time_range: JSON.stringify({ since: today, until: today })
    })

    const data = await this.fetchWithRetry(url)
    return data.data || []
  }

  // Get historical data
  async getHistoricalData(
    campaignId: string,
    datePreset = 'last_30d'
  ): Promise<any[]> {
    const url = this.buildUrl(`${campaignId}/insights`, {
      fields: 'spend,impressions,clicks,ctr,cpc,actions,action_values,frequency',
      date_preset: datePreset,
      time_increment: '1' // Daily breakdown
    })

    const data = await this.fetchWithRetry(url)
    return data.data || []
  }

  // Get ad sets for a campaign
  async getAdSets(campaignId: string, datePreset = 'last_30d'): Promise<any[]> {
    const fields = [
      'id',
      'name',
      'status',
      'targeting',
      'daily_budget',
      'lifetime_budget',
      `insights.date_preset(${datePreset}){spend,impressions,clicks,actions,action_values}`
    ].join(',')

    const url = this.buildUrl(`${campaignId}/adsets`, {
      fields,
      limit: 50
    })

    const data = await this.fetchWithRetry(url)
    return data.data || []
  }
}

// Export helper functions
export function processInsights(insights: any): any {
  if (!insights) return null

  const spend = parseFloat(insights.spend || '0')
  const impressions = parseInt(insights.impressions || '0')
  const clicks = parseInt(insights.clicks || '0')
  const ctr = parseFloat(insights.ctr || '0')
  const cpc = parseFloat(insights.cpc || '0')
  const frequency = parseFloat(insights.frequency || '0')

  // Calculate conversions and revenue
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

  const roas = spend > 0 ? revenue / spend : 0
  const cpa = conversions > 0 ? spend / conversions : 0

  return {
    spend,
    impressions,
    clicks,
    ctr,
    cpc,
    frequency,
    conversions,
    revenue,
    roas,
    cpa
  }
}