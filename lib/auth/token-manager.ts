// Token management with automatic refresh and retry logic
import { CryptoUtils } from './crypto-utils'
import { SessionManager } from './session-manager'

export interface TokenInfo {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  tokenType?: string
  scope?: string
}

export interface TokenRefreshResult {
  success: boolean
  token?: TokenInfo
  error?: string
  needsReauth?: boolean
}

export class TokenManager {
  private static readonly TOKEN_KEY = 'meta_token_info'
  private static readonly REFRESH_WINDOW = 5 * 60 * 1000 // 5 minutes before expiry
  private static refreshTimer: NodeJS.Timeout | null = null
  private static refreshPromise: Promise<TokenRefreshResult> | null = null
  
  // Token validation regex patterns
  private static readonly TOKEN_PATTERNS = {
    meta: /^(EAA[A-Za-z0-9]+|[A-Za-z0-9_\-|]+)$/,
    minLength: 50,
    maxLength: 500
  }
  
  // Save token with encryption
  static async saveToken(token: TokenInfo, encrypt: boolean = true): Promise<boolean> {
    try {
      const session = SessionManager.getSession()
      if (!session) {
        console.error('No active session found')
        return false
      }
      
      // Validate token format
      if (!this.validateTokenFormat(token.accessToken)) {
        console.error('Invalid token format')
        return false
      }
      
      // Set expiry if not provided (default 60 days for Meta tokens)
      if (!token.expiresAt) {
        token.expiresAt = Date.now() + (60 * 24 * 60 * 60 * 1000)
      }
      
      let dataToStore: string
      
      if (encrypt && session.id) {
        // Encrypt token using session ID as part of the key
        const encryptionKey = await CryptoUtils.hash(session.id + navigator.userAgent)
        dataToStore = await CryptoUtils.encrypt(JSON.stringify(token), encryptionKey)
      } else {
        dataToStore = JSON.stringify(token)
      }
      
      localStorage.setItem(this.TOKEN_KEY, dataToStore)
      
      // Schedule automatic refresh if token has expiry
      if (token.expiresAt) {
        this.scheduleRefresh(token)
      }
      
      return true
    } catch (error) {
      console.error('Failed to save token:', error)
      return false
    }
  }
  
  // Load token with decryption
  static async loadToken(decrypt: boolean = true): Promise<TokenInfo | null> {
    try {
      const session = SessionManager.getSession()
      if (!session) {
        console.error('No active session found')
        return null
      }
      
      const storedData = localStorage.getItem(this.TOKEN_KEY)
      if (!storedData) return null
      
      let tokenData: TokenInfo
      
      try {
        if (decrypt && session.id) {
          // Decrypt token
          const encryptionKey = await CryptoUtils.hash(session.id + navigator.userAgent)
          const decrypted = await CryptoUtils.decrypt(storedData, encryptionKey)
          tokenData = JSON.parse(decrypted)
        } else {
          tokenData = JSON.parse(storedData)
        }
      } catch (parseError) {
        // If decryption fails, try parsing as plain JSON (backward compatibility)
        try {
          tokenData = JSON.parse(storedData)
        } catch {
          console.error('Failed to parse token data')
          return null
        }
      }
      
      // Check if token is expired
      if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
        console.warn('Token has expired')
        // Attempt refresh if we have a refresh token
        if (tokenData.refreshToken) {
          const refreshResult = await this.refreshToken(tokenData.refreshToken)
          if (refreshResult.success && refreshResult.token) {
            return refreshResult.token
          }
        }
        return null
      }
      
      return tokenData
    } catch (error) {
      console.error('Failed to load token:', error)
      return null
    }
  }
  
  // Validate token format
  static validateTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false
    
    const trimmed = token.trim()
    
    // Check length
    if (trimmed.length < this.TOKEN_PATTERNS.minLength || 
        trimmed.length > this.TOKEN_PATTERNS.maxLength) {
      return false
    }
    
    // Check pattern
    return this.TOKEN_PATTERNS.meta.test(trimmed)
  }
  
  // Test token validity with Meta API
  static async validateToken(token: string, adAccountId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/meta-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'test_connection',
          accessToken: token,
          adAccountId: adAccountId
        })
      })
      
      const result = await response.json()
      return result.success === true
    } catch (error) {
      console.error('Token validation error:', error)
      return false
    }
  }
  
  // Refresh token with retry logic
  static async refreshToken(
    refreshToken: string, 
    retries: number = 3
  ): Promise<TokenRefreshResult> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise
    }
    
    this.refreshPromise = this.performRefresh(refreshToken, retries)
    
    try {
      const result = await this.refreshPromise
      return result
    } finally {
      this.refreshPromise = null
    }
  }
  
  // Perform the actual refresh
  private static async performRefresh(
    refreshToken: string,
    retries: number
  ): Promise<TokenRefreshResult> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // For Meta, we don't have a refresh endpoint, so we'll need to 
        // trigger re-authentication. In a real implementation, you would
        // call Meta's OAuth refresh endpoint here.
        
        // This is a placeholder - Meta long-lived tokens don't refresh
        // automatically. Users need to re-authenticate.
        console.warn('Meta tokens cannot be refreshed automatically. User needs to re-authenticate.')
        
        return {
          success: false,
          error: 'Token refresh not supported for Meta. Please re-authenticate.',
          needsReauth: true
        }
        
      } catch (error) {
        console.error(`Refresh attempt ${attempt + 1} failed:`, error)
        
        if (attempt < retries - 1) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    return {
      success: false,
      error: 'Failed to refresh token after multiple attempts',
      needsReauth: true
    }
  }
  
  // Schedule automatic token refresh
  private static scheduleRefresh(token: TokenInfo) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }
    
    if (!token.expiresAt || !token.refreshToken) return
    
    const timeUntilExpiry = token.expiresAt - Date.now()
    const refreshTime = timeUntilExpiry - this.REFRESH_WINDOW
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(async () => {
        console.log('Attempting automatic token refresh...')
        const result = await this.refreshToken(token.refreshToken!)
        
        if (result.needsReauth) {
          // Dispatch event to trigger re-authentication
          window.dispatchEvent(new CustomEvent('token-expired', {
            detail: { reason: 'refresh_failed' }
          }))
        }
      }, refreshTime)
    }
  }
  
  // Clear stored token
  static clearToken() {
    localStorage.removeItem(this.TOKEN_KEY)
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }
  
  // Get token expiry status
  static async getTokenStatus(): Promise<{
    hasToken: boolean
    isValid: boolean
    expiresIn?: number
    needsRefresh: boolean
  }> {
    const token = await this.loadToken()
    
    if (!token) {
      return {
        hasToken: false,
        isValid: false,
        needsRefresh: false
      }
    }
    
    const now = Date.now()
    const expiresIn = token.expiresAt ? token.expiresAt - now : undefined
    const needsRefresh = expiresIn ? expiresIn < this.REFRESH_WINDOW : false
    
    return {
      hasToken: true,
      isValid: !token.expiresAt || now < token.expiresAt,
      expiresIn,
      needsRefresh
    }
  }
  
  // Parse Meta OAuth error response
  static parseOAuthError(error: any): {
    code: string
    message: string
    isExpired: boolean
    needsReauth: boolean
  } {
    const errorCode = error?.code?.toString() || 'unknown'
    const errorMessage = error?.message || 'Unknown error'
    
    // Common Meta OAuth error codes
    const expiredCodes = ['190', '102', '2500']
    const isExpired = expiredCodes.includes(errorCode) || 
                     errorMessage.toLowerCase().includes('expired') ||
                     errorMessage.toLowerCase().includes('invalid')
    
    return {
      code: errorCode,
      message: errorMessage,
      isExpired,
      needsReauth: isExpired
    }
  }
}