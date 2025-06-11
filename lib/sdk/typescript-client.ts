/**
 * Meta Ads Dashboard API Client for TypeScript/JavaScript
 * 
 * A comprehensive TypeScript client for the Meta Ads Dashboard API
 * providing type-safe access to all endpoints with built-in error handling,
 * rate limiting, and retry logic.
 */

export interface ClientConfig {
  baseUrl?: string
  metaToken?: string
  claudeApiKey?: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
  debug?: boolean
}

export interface Campaign {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  objective: string
  budget_remaining?: number
  daily_budget?: number
  lifetime_budget?: number
  start_time: string
  stop_time?: string
  created_time: string
  updated_time: string
  insights?: CampaignInsights
  adsets?: AdSet[]
  account_id: string
}

export interface CampaignInsights {
  impressions: number
  clicks: number
  spend: number
  reach: number
  frequency: number
  ctr: number
  cpc: number
  cpm: number
  cpp: number
  conversions?: number
  conversion_rate?: number
  revenue?: number
  roas?: number
  actions?: Action[]
  date_start?: string
  date_stop?: string
}

export interface AdSet {
  id: string
  name: string
  campaign_id: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  daily_budget?: number
  lifetime_budget?: number
  start_time: string
  end_time?: string
  targeting?: Targeting
  insights?: AdSetInsights
  ads?: Ad[]
}

export interface Ad {
  id: string
  name: string
  adset_id: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  creative?: Creative
  insights?: AdInsights
}

export interface Targeting {
  geo_locations?: {
    countries?: string[]
    regions?: string[]
    cities?: string[]
  }
  age_min?: number
  age_max?: number
  genders?: number[]
  interests?: string[]
  behaviors?: string[]
  custom_audiences?: string[]
}

export interface AdSetInsights extends CampaignInsights {
  adset_id: string
  adset_name: string
}

export interface AdInsights extends CampaignInsights {
  ad_id: string
  ad_name: string
}

export interface Creative {
  id: string
  name: string
  title?: string
  body?: string
  image_url?: string
  video_url?: string
  call_to_action?: string
  link_url?: string
}

export interface Action {
  action_type: string
  value: number
}

export interface DemographicsData {
  age: Array<{
    range: string
    conversions: number
    revenue: number
    impressions: number
    spend: number
    percentage: number
  }>
  gender: Array<{
    type: string
    conversions: number
    revenue: number
    spend: number
    percentage: number
  }>
  region: Array<{
    city: string
    state: string
    conversions: number
    revenue: number
    spend: number
    roas: number
  }>
  device: Array<{
    platform: string
    conversions: number
    revenue: number
    spend: number
    percentage: number
  }>
}

export interface AIInsightsResponse {
  success: boolean
  data: any
  action: string
  timestamp: string
}

export interface RealtimeStats {
  websocket: {
    connections: number
    channels: string[]
  }
  alerts: {
    activeRules: number
    activeAlerts: number
  }
  streaming: {
    queries: number
    events: number
  }
  notifications: {
    sent: number
    pending: number
  }
}

export interface LogEntry {
  id: string
  timestamp: string
  level: 'debug' | 'info' | 'warning' | 'error'
  message: string
  details?: any
  source?: string
  category: string
  tags: string[]
}

export type DatePreset = 
  | 'today' 
  | 'yesterday' 
  | 'this_month' 
  | 'last_month' 
  | 'this_quarter' 
  | 'last_quarter' 
  | 'this_year' 
  | 'last_year' 
  | 'last_3d' 
  | 'last_7d' 
  | 'last_14d' 
  | 'last_28d' 
  | 'last_30d' 
  | 'last_90d'

export type AIAction = 
  | 'predictions' 
  | 'anomalies' 
  | 'recommendations' 
  | 'trends' 
  | 'competitor' 
  | 'sentiment' 
  | 'ab-test' 
  | 'performance-prediction' 
  | 'insights'

export class MetaAdsAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'MetaAdsAPIError'
  }
}

export class MetaAdsClient {
  private baseUrl: string
  private metaToken?: string
  private claudeApiKey?: string
  private timeout: number
  private retryAttempts: number
  private retryDelay: number
  private debug: boolean

  constructor(config: ClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://api.metaads.com'
    this.metaToken = config.metaToken
    this.claudeApiKey = config.claudeApiKey
    this.timeout = config.timeout || 30000
    this.retryAttempts = config.retryAttempts || 3
    this.retryDelay = config.retryDelay || 1000
    this.debug = config.debug || false
  }

  private log(message: string, data?: any) {
    if (this.debug) {
      console.log(`[MetaAdsClient] ${message}`, data || '')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (requiresAuth && this.metaToken) {
      headers['Authorization'] = `Bearer ${this.metaToken}`
    }

    if (this.claudeApiKey && endpoint.includes('ai-insights')) {
      headers['X-Claude-API-Key'] = this.claudeApiKey
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.timeout)
    }

    this.log(`${options.method || 'GET'} ${endpoint}`, requestOptions.body)

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, requestOptions)
        const data = await response.json()

        if (!response.ok) {
          throw new MetaAdsAPIError(
            data.error || data.message || `HTTP ${response.status}`,
            response.status,
            data.code,
            data.details
          )
        }

        this.log(`Response (${response.status})`, data)
        return data as T
      } catch (error) {
        if (attempt === this.retryAttempts) {
          if (error instanceof MetaAdsAPIError) {
            throw error
          }
          throw new MetaAdsAPIError(
            error instanceof Error ? error.message : 'Unknown error',
            0,
            'NETWORK_ERROR',
            error
          )
        }

        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1)
        this.log(`Retry ${attempt} in ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw new MetaAdsAPIError('Max retries exceeded')
  }

  /**
   * Health Check
   */
  async healthCheck() {
    return this.request<{
      status: string
      memory: any
      uptime: number
      timestamp: string
    }>('/api/health', { method: 'GET' }, false)
  }

  /**
   * Test Meta API connection
   */
  async testConnection(adAccountId: string, accessToken?: string) {
    const token = accessToken || this.metaToken
    if (!token) {
      throw new MetaAdsAPIError('Meta access token is required')
    }

    return this.request<{
      success: boolean
      accountInfo?: {
        id: string
        name: string
        status: string
        currency: string
        timezone: string
      }
      error?: string
    }>('/api/meta', {
      method: 'POST',
      body: JSON.stringify({
        type: 'test_connection',
        adAccountId,
        accessToken: token
      })
    }, false)
  }

  /**
   * Get campaigns overview
   */
  async getCampaigns(
    adAccountId: string, 
    datePreset: DatePreset = 'last_30d',
    accessToken?: string
  ) {
    const token = accessToken || this.metaToken
    if (!token) {
      throw new MetaAdsAPIError('Meta access token is required')
    }

    return this.request<{
      campaigns: Campaign[]
      success: boolean
    }>('/api/meta', {
      method: 'POST',
      body: JSON.stringify({
        type: 'overview',
        adAccountId,
        accessToken: token,
        datePreset
      })
    }, false)
  }

  /**
   * Get campaign details
   */
  async getCampaignDetails(
    campaignId: string,
    adAccountId: string,
    datePreset: DatePreset = 'last_30d',
    accessToken?: string
  ) {
    const token = accessToken || this.metaToken
    if (!token) {
      throw new MetaAdsAPIError('Meta access token is required')
    }

    return this.request<{
      historicalDailyData: any[]
      todayHourlyData: any[]
      adSets: AdSet[]
      success: boolean
    }>('/api/meta', {
      method: 'POST',
      body: JSON.stringify({
        type: 'campaign_details',
        campaignId,
        adAccountId,
        accessToken: token,
        datePreset
      })
    }, false)
  }

  /**
   * Get demographic analytics
   */
  async getDemographics(
    campaignId: string,
    datePreset: DatePreset = 'last_30d',
    accessToken?: string
  ) {
    const token = accessToken || this.metaToken
    if (!token) {
      throw new MetaAdsAPIError('Meta access token is required')
    }

    return this.request<DemographicsData>('/api/meta/demographics', {
      method: 'POST',
      body: JSON.stringify({
        campaignId,
        accessToken: token,
        datePreset
      })
    }, false)
  }

  /**
   * Get AI insights
   */
  async getAIInsights(
    campaigns: Campaign[],
    action: AIAction,
    params: any = {},
    claudeApiKey?: string
  ) {
    const key = claudeApiKey || this.claudeApiKey
    if (!key) {
      throw new MetaAdsAPIError('Claude API key is required for AI insights')
    }

    return this.request<AIInsightsResponse>('/api/ai-insights', {
      method: 'POST',
      body: JSON.stringify({
        campaigns,
        action,
        params,
        claudeApiKey: key
      })
    }, false)
  }

  /**
   * Get real-time system status
   */
  async getRealtimeStatus(demo = false) {
    const params = demo ? '?demo=true' : ''
    return this.request<{
      status: string
      uptime: number
      timestamp: string
      stats: RealtimeStats
    }>(`/api/realtime${params}`, { method: 'GET' }, false)
  }

  /**
   * Submit real-time data
   */
  async submitRealtimeData(action: string, data: any) {
    return this.request<{ success: boolean }>('/api/realtime', {
      method: 'POST',
      body: JSON.stringify({ action, data })
    }, false)
  }

  /**
   * Get error metrics
   */
  async getErrorMetrics(period = '24h', category?: string) {
    const params = new URLSearchParams({ period })
    if (category) params.append('category', category)
    
    return this.request<{
      totalErrors: number
      errorRate: number
      errorsByCategory: { [key: string]: number }
      errorsBySeverity: { [key: string]: number }
      sessions: number
      timeRange: {
        start: string
        end: string
      }
    }>(`/api/error-metrics?${params}`, { method: 'GET' }, false)
  }

  /**
   * Submit error metrics
   */
  async submitErrorMetrics(metrics: {
    totalErrors: number
    errorRate: number
    errorsByCategory?: { [key: string]: number }
    errorsBySeverity?: { [key: string]: number }
  }, sessionId: string) {
    return this.request<{ success: boolean }>('/api/error-metrics', {
      method: 'POST',
      body: JSON.stringify({
        metrics,
        timestamp: new Date().toISOString(),
        sessionId
      })
    }, false)
  }

  /**
   * Create log stream
   */
  createLogStream(options: {
    source?: string
    level?: 'debug' | 'info' | 'warning' | 'error'
    category?: string
  } = {}) {
    const params = new URLSearchParams()
    if (options.source) params.append('source', options.source)
    if (options.level) params.append('level', options.level)
    if (options.category) params.append('category', options.category)

    const url = `${this.baseUrl}/api/logs/stream?${params}`
    return new EventSource(url)
  }

  /**
   * Submit log entry
   */
  async submitLog(
    level: 'debug' | 'info' | 'warning' | 'error',
    message: string,
    details?: any,
    source?: string
  ) {
    return this.request<{ success: boolean; log: LogEntry }>('/api/logs/stream', {
      method: 'POST',
      body: JSON.stringify({
        level,
        message,
        details,
        source
      })
    }, false)
  }

  /**
   * WebSocket connection helper
   */
  createWebSocket() {
    const wsUrl = this.baseUrl.replace(/^https?/, 'wss').replace(/^http/, 'ws')
    return new WebSocket(`${wsUrl}/ws`)
  }

  // Convenience methods for common AI actions

  async getPredictions(campaign: Campaign, timeframe = '30d', scenario = 'moderate') {
    return this.getAIInsights([], 'predictions', {
      campaign,
      timeframe,
      scenario
    })
  }

  async getOptimizationRecommendations(campaigns: Campaign[]) {
    return this.getAIInsights(campaigns, 'recommendations')
  }

  async detectAnomalies(campaigns: Campaign[], lookbackDays = 30) {
    return this.getAIInsights(campaigns, 'anomalies', { lookbackDays })
  }

  async analyzeTrends(campaigns: Campaign[], metrics?: string[]) {
    return this.getAIInsights(campaigns, 'trends', { metrics })
  }

  async analyzeCompetitors(campaigns: Campaign[], industry = 'ecommerce') {
    return this.getAIInsights(campaigns, 'competitor', { industry })
  }

  async analyzeSentiment(adCopy: string) {
    return this.getAIInsights([], 'sentiment', { adCopy })
  }

  async analyzeABTest(variantA: any, variantB: any, confidenceLevel = 0.95) {
    return this.getAIInsights([], 'ab-test', {
      variantA,
      variantB,
      confidenceLevel
    })
  }
}

// Default export
export default MetaAdsClient

// Named exports for convenience
export {
  MetaAdsClient as Client,
  MetaAdsAPIError as APIError
}