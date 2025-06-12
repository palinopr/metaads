// Secure Meta API Client with enhanced authentication
import { z } from 'zod'
import { SecureCredentialManager } from './auth/secure-credential-manager'
import { TokenManager } from './auth/token-manager'
import { AuthRateLimiters } from './auth/rate-limiter'
import { SessionManager } from './auth/session-manager'

// Environment configuration
const META_API_VERSION = 'v19.0'
const META_API_BASE_URL = 'https://graph.facebook.com'

// Enhanced error types with more details
export class MetaAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public type?: string,
    public fbTraceId?: string,
    public isTokenExpired?: boolean,
    public isRateLimited?: boolean,
    public retryAfter?: number
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

export class RateLimitError extends MetaAPIError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 'RATE_LIMIT', 'RateLimitError', undefined, false, true, retryAfter)
    this.name = 'RateLimitError'
  }
}

// Secure Meta API Client
export class SecureMetaAPIClient {
  private accessToken: string
  private adAccountId: string
  private sessionId: string | null = null
  private csrfToken: string | null = null
  
  constructor(accessToken: string, adAccountId: string) {
    this.accessToken = this.formatAccessToken(accessToken)
    this.adAccountId = this.formatAdAccountId(adAccountId)
    
    // Get session info
    const session = SessionManager.getSession()
    if (session) {
      this.sessionId = session.id
      this.csrfToken = session.csrfToken
    }
  }
  
  // Create client from stored credentials
  static async createFromStorage(): Promise<SecureMetaAPIClient | null> {
    try {
      const credentials = await SecureCredentialManager.load()
      if (!credentials) {
        console.error('No stored credentials found')
        return null
      }
      
      // Validate credentials before creating client
      const validation = await SecureCredentialManager.validate(credentials)
      if (!validation.isValid) {
        console.error('Stored credentials are invalid:', validation.error)
        
        if (validation.needsRefresh) {
          // Dispatch event for token refresh
          window.dispatchEvent(new CustomEvent('token-expired', {
            detail: { reason: 'validation_failed' }
          }))
        }
        
        return null
      }
      
      return new SecureMetaAPIClient(credentials.accessToken, credentials.adAccountId)
    } catch (error) {
      console.error('Failed to create client from storage:', error)
      return null
    }
  }
  
  // Format access token
  private formatAccessToken(token: string): string {
    const trimmed = token.trim()
    // Remove Bearer prefix if present
    if (trimmed.toLowerCase().startsWith('bearer ')) {
      return trimmed.substring(7).trim()
    }
    return trimmed
  }
  
  // Format ad account ID
  private formatAdAccountId(accountId: string): string {
    const trimmed = accountId.trim()
    return trimmed.startsWith('act_') ? trimmed : `act_${trimmed}`
  }
  
  // Enhanced fetch with security features
  protected async secureFetch(
    url: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<any> {
    // Check rate limits
    const rateLimiter = AuthRateLimiters.getApiLimiter()
    const rateLimit = await rateLimiter.checkLimit(this.adAccountId)
    
    if (!rateLimit.allowed) {
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }
    
    // Update session activity
    SessionManager.updateActivity()
    
    // Parse URL for proxy endpoint
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const versionMatch = pathname.match(/\/v\d+\.\d+\/(.*)/)
    const endpoint = versionMatch ? versionMatch[1] : pathname.replace(/^\//, '')
    
    // Convert search params
    const params: Record<string, string> = {}
    urlObj.searchParams.forEach((value, key) => {
      if (key !== 'access_token') {
        params[key] = value
      }
    })
    
    // Retry logic with exponential backoff
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Use proxy API route
        const apiUrl = typeof window === 'undefined' 
          ? `http://localhost:${process.env.PORT || 3000}/api/meta`
          : '/api/meta'
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }
        
        // Add CSRF token if available
        if (this.csrfToken) {
          headers['X-CSRF-Token'] = this.csrfToken
        }
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            endpoint,
            params,
            accessToken: this.accessToken,
            sessionId: this.sessionId
          }),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          const error = data.error || {}
          
          // Check for token expiry
          const isTokenExpired = 
            error.code === 190 || 
            error.code === 102 ||
            error.type === 'OAuthException' ||
            (error.message && (
              error.message.toLowerCase().includes('expired') ||
              error.message.toLowerCase().includes('invalid') ||
              error.message.toLowerCase().includes('malformed')
            ))
          
          if (isTokenExpired) {
            // Clear invalid token
            await SecureCredentialManager.clear()
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('token-expired', {
              detail: { reason: 'api_error', error }
            }))
            
            throw new TokenExpiredError(error.message || 'Access token has expired')
          }
          
          // Check for rate limiting
          if (error.code === 32 || error.code === 613 || error.type === 'OAuthException') {
            throw new RateLimitError(error.message || 'API rate limit exceeded')
          }
          
          throw new MetaAPIError(
            error.message || `HTTP ${response.status}`,
            error.code?.toString(),
            error.type,
            error.fbtrace_id
          )
        }
        
        return data
        
      } catch (error) {
        lastError = error as Error
        
        // Don't retry on auth errors
        if (error instanceof TokenExpiredError || error instanceof RateLimitError) {
          throw error
        }
        
        // Log retry attempt
        console.warn(`API request attempt ${attempt + 1} failed:`, error)
        
        // Don't retry on last attempt
        if (attempt === retries - 1) {
          throw error
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError || new Error('Request failed after all retries')
  }
  
  // Build URL with parameters
  protected buildUrl(path: string, params: Record<string, any> = {}): string {
    const url = new URL(`${META_API_BASE_URL}/${META_API_VERSION}/${path}`)
    
    // Add access token
    url.searchParams.append('access_token', this.accessToken)
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
    
    return url.toString()
  }
  
  // Test connection with enhanced error handling
  async testConnection(): Promise<{
    success: boolean
    accountInfo?: any
    error?: string
    needsReauth?: boolean
  }> {
    try {
      const url = this.buildUrl(this.adAccountId, {
        fields: 'id,name,currency,timezone_name,account_status,spend_cap,amount_spent'
      })
      
      const data = await this.secureFetch(url)
      
      return {
        success: true,
        accountInfo: data
      }
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return {
          success: false,
          error: error.message,
          needsReauth: true
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  // Get campaigns with automatic retry and error recovery
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
    
    try {
      const data = await this.secureFetch(url)
      return data.data || []
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        // Try to recover with stored credentials
        const recovered = await this.recoverFromTokenError()
        if (recovered) {
          // Retry the request
          const data = await this.secureFetch(url)
          return data.data || []
        }
      }
      throw error
    }
  }
  
  // Recover from token error
  private async recoverFromTokenError(): Promise<boolean> {
    try {
      // Try to reload credentials
      const credentials = await SecureCredentialManager.load()
      if (credentials && credentials.accessToken !== this.accessToken) {
        // Update token
        this.accessToken = this.formatAccessToken(credentials.accessToken)
        return true
      }
    } catch (error) {
      console.error('Failed to recover from token error:', error)
    }
    return false
  }
  
  // Get campaign insights with caching
  async getCampaignInsights(
    campaignId: string, 
    dateRange?: { since: string, until: string }
  ): Promise<any> {
    const params: any = {
      fields: 'spend,impressions,clicks,ctr,cpc,actions,action_values,conversions,cost_per_conversion,frequency,reach'
    }
    
    if (dateRange) {
      params.time_range = JSON.stringify(dateRange)
    } else {
      params.date_preset = 'last_30d'
    }
    
    const url = this.buildUrl(`${campaignId}/insights`, params)
    const data = await this.secureFetch(url)
    return data.data?.[0] || null
  }
  
  // Batch request support
  async batchRequest(requests: Array<{ method: string; relative_url: string }>): Promise<any[]> {
    const url = this.buildUrl('', {
      batch: JSON.stringify(requests)
    })
    
    const data = await this.secureFetch(url, { method: 'POST' })
    return data
  }
  
  // Get account spending limit status
  async getSpendingStatus(): Promise<{
    spendCap?: number
    amountSpent: number
    percentUsed: number
    daysRemaining?: number
  }> {
    const url = this.buildUrl(this.adAccountId, {
      fields: 'spend_cap,amount_spent,min_daily_budget'
    })
    
    const data = await this.secureFetch(url)
    
    const spendCap = data.spend_cap ? parseFloat(data.spend_cap) : undefined
    const amountSpent = parseFloat(data.amount_spent || '0') / 100 // Convert from cents
    
    return {
      spendCap: spendCap ? spendCap / 100 : undefined,
      amountSpent,
      percentUsed: spendCap ? (amountSpent / (spendCap / 100)) * 100 : 0,
      daysRemaining: spendCap ? Math.floor((spendCap / 100 - amountSpent) / (amountSpent / 30)) : undefined
    }
  }
}