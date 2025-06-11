// Enhanced credential management with security features
import { CryptoUtils } from './crypto-utils'
import { SessionManager } from './session-manager'
import { TokenManager, TokenInfo } from './token-manager'
import { z } from 'zod'

// Validation schemas
const AccessTokenSchema = z.string().min(50).max(500)
const AdAccountIdSchema = z.string().regex(/^act_\d+$/, 'Ad Account ID must start with "act_" followed by numbers')

export interface SecureCredentials {
  accessToken: string
  adAccountId: string
  refreshToken?: string
  expiresAt?: number
  lastValidated?: number
  encryptionEnabled?: boolean
}

export interface ValidationResult {
  isValid: boolean
  error?: string
  details?: {
    tokenFormat: boolean
    accountFormat: boolean
    apiConnection: boolean
    accountInfo?: any
  }
  needsRefresh?: boolean
}

export class SecureCredentialManager {
  private static readonly CREDS_KEY = 'meta_secure_creds'
  private static readonly VALIDATION_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private static readonly MAX_RETRY_ATTEMPTS = 3
  
  // Initialize the credential manager
  static async initialize() {
    // Initialize session manager
    SessionManager.initialize({
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      activityTimeout: 30 * 60 * 1000, // 30 minutes
      enableAutoRenew: true,
      maxSessionDuration: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    
    // Check for existing credentials on startup
    const creds = await this.load()
    if (creds && creds.expiresAt) {
      const tokenInfo: TokenInfo = {
        accessToken: creds.accessToken,
        refreshToken: creds.refreshToken,
        expiresAt: creds.expiresAt
      }
      await TokenManager.saveToken(tokenInfo, creds.encryptionEnabled !== false)
    }
  }
  
  // Save credentials securely
  static async save(
    credentials: SecureCredentials, 
    validated: boolean = false,
    encrypt: boolean = true
  ): Promise<boolean> {
    try {
      // Clean and validate inputs
      const cleanToken = credentials.accessToken.trim()
      const cleanAccountId = this.formatAdAccountId(credentials.adAccountId.trim())
      
      // Validate formats
      try {
        AccessTokenSchema.parse(cleanToken)
        AdAccountIdSchema.parse(cleanAccountId)
      } catch (validationError) {
        console.error('Credential validation failed:', validationError)
        return false
      }
      
      // Create or get session
      let session = SessionManager.getSession()
      if (!session) {
        session = await SessionManager.createSession(cleanAccountId, credentials.refreshToken)
      }
      
      // Prepare credentials object
      const credsToSave: SecureCredentials = {
        accessToken: cleanToken,
        adAccountId: cleanAccountId,
        refreshToken: credentials.refreshToken,
        expiresAt: credentials.expiresAt || Date.now() + (60 * 24 * 60 * 60 * 1000), // 60 days default
        lastValidated: validated ? Date.now() : credentials.lastValidated,
        encryptionEnabled: encrypt
      }
      
      // Save token to token manager
      const tokenInfo: TokenInfo = {
        accessToken: cleanToken,
        refreshToken: credentials.refreshToken,
        expiresAt: credsToSave.expiresAt
      }
      
      const tokenSaved = await TokenManager.saveToken(tokenInfo, encrypt)
      if (!tokenSaved) {
        console.error('Failed to save token to TokenManager')
        return false
      }
      
      // Save credentials
      let dataToStore: string
      
      if (encrypt && session.id) {
        // Encrypt sensitive data
        const encryptionKey = await CryptoUtils.hash(session.id + cleanAccountId)
        const sensitiveData = {
          accessToken: credsToSave.accessToken,
          refreshToken: credsToSave.refreshToken
        }
        const encryptedData = await CryptoUtils.encrypt(JSON.stringify(sensitiveData), encryptionKey)
        
        dataToStore = JSON.stringify({
          ...credsToSave,
          accessToken: '[ENCRYPTED]',
          refreshToken: '[ENCRYPTED]',
          encryptedData
        })
      } else {
        dataToStore = JSON.stringify(credsToSave)
      }
      
      localStorage.setItem(this.CREDS_KEY, dataToStore)
      
      // Verify save was successful
      const saved = await this.load()
      return saved !== null && saved.adAccountId === cleanAccountId
      
    } catch (error) {
      console.error('Failed to save credentials:', error)
      return false
    }
  }
  
  // Load credentials securely
  static async load(): Promise<SecureCredentials | null> {
    try {
      const session = SessionManager.getSession()
      if (!session) {
        console.warn('No active session found')
        return null
      }
      
      const storedData = localStorage.getItem(this.CREDS_KEY)
      if (!storedData) return null
      
      const parsedData = JSON.parse(storedData)
      
      // Handle encrypted credentials
      if (parsedData.encryptedData && parsedData.encryptionEnabled !== false) {
        try {
          const encryptionKey = await CryptoUtils.hash(session.id + parsedData.adAccountId)
          const decrypted = await CryptoUtils.decrypt(parsedData.encryptedData, encryptionKey)
          const sensitiveData = JSON.parse(decrypted)
          
          return {
            ...parsedData,
            accessToken: sensitiveData.accessToken,
            refreshToken: sensitiveData.refreshToken
          }
        } catch (decryptError) {
          console.error('Failed to decrypt credentials:', decryptError)
          // Clear corrupted data
          this.clear()
          return null
        }
      }
      
      // Load token from TokenManager for consistency
      const tokenInfo = await TokenManager.loadToken(parsedData.encryptionEnabled !== false)
      if (tokenInfo) {
        parsedData.accessToken = tokenInfo.accessToken
        parsedData.refreshToken = tokenInfo.refreshToken
        parsedData.expiresAt = tokenInfo.expiresAt
      }
      
      return parsedData
      
    } catch (error) {
      console.error('Failed to load credentials:', error)
      return null
    }
  }
  
  // Validate credentials with retry logic
  static async validate(
    credentials: SecureCredentials,
    forceRevalidate: boolean = false
  ): Promise<ValidationResult> {
    // Check validation cache
    if (!forceRevalidate && credentials.lastValidated) {
      const cacheAge = Date.now() - credentials.lastValidated
      if (cacheAge < this.VALIDATION_CACHE_DURATION) {
        return {
          isValid: true,
          details: {
            tokenFormat: true,
            accountFormat: true,
            apiConnection: true
          }
        }
      }
    }
    
    // First validate format
    const formatValidation = this.validateFormat(credentials)
    if (!formatValidation.isValid) {
      return formatValidation
    }
    
    // Check token expiry
    const tokenStatus = await TokenManager.getTokenStatus()
    if (tokenStatus.needsRefresh) {
      return {
        isValid: false,
        error: 'Token needs refresh',
        needsRefresh: true,
        details: {
          tokenFormat: true,
          accountFormat: true,
          apiConnection: false
        }
      }
    }
    
    // Test API connection with retry
    let lastError: string | undefined
    
    for (let attempt = 0; attempt < this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const isValid = await TokenManager.validateToken(
          credentials.accessToken,
          credentials.adAccountId
        )
        
        if (isValid) {
          // Update last validated timestamp
          await this.save({
            ...credentials,
            lastValidated: Date.now()
          }, true, credentials.encryptionEnabled !== false)
          
          return {
            isValid: true,
            details: {
              tokenFormat: true,
              accountFormat: true,
              apiConnection: true
            }
          }
        } else {
          lastError = 'Invalid credentials'
        }
      } catch (error: any) {
        lastError = error.message || 'Connection failed'
        
        // Parse OAuth errors
        const oauthError = TokenManager.parseOAuthError(error)
        if (oauthError.needsReauth) {
          return {
            isValid: false,
            error: oauthError.message,
            needsRefresh: true,
            details: {
              tokenFormat: true,
              accountFormat: true,
              apiConnection: false
            }
          }
        }
        
        // Retry with exponential backoff
        if (attempt < this.MAX_RETRY_ATTEMPTS - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    return {
      isValid: false,
      error: lastError || 'Validation failed after multiple attempts',
      details: {
        tokenFormat: true,
        accountFormat: true,
        apiConnection: false
      }
    }
  }
  
  // Format validation
  private static validateFormat(credentials: SecureCredentials): ValidationResult {
    const errors: string[] = []
    
    // Validate token format
    if (!TokenManager.validateTokenFormat(credentials.accessToken)) {
      errors.push('Invalid access token format')
    }
    
    // Validate account ID format
    try {
      AdAccountIdSchema.parse(credentials.adAccountId)
    } catch {
      errors.push('Invalid ad account ID format')
    }
    
    if (errors.length > 0) {
      return {
        isValid: false,
        error: errors.join(', '),
        details: {
          tokenFormat: errors.some(e => e.includes('token')),
          accountFormat: errors.some(e => e.includes('account')),
          apiConnection: false
        }
      }
    }
    
    return {
      isValid: true,
      details: {
        tokenFormat: true,
        accountFormat: true,
        apiConnection: false // Not tested yet
      }
    }
  }
  
  // Format ad account ID
  private static formatAdAccountId(accountId: string): string {
    const trimmed = accountId.trim()
    return trimmed.startsWith('act_') ? trimmed : `act_${trimmed}`
  }
  
  // Clear all credentials and session
  static async clear() {
    localStorage.removeItem(this.CREDS_KEY)
    TokenManager.clearToken()
    SessionManager.clearSession()
  }
  
  // Get debug information (sanitized)
  static async getDebugInfo(): Promise<any> {
    const creds = await this.load()
    const session = SessionManager.getSession()
    const tokenStatus = await TokenManager.getTokenStatus()
    
    return {
      hasCredentials: !!creds,
      hasSession: !!session,
      sessionId: session?.id ? `${session.id.substring(0, 8)}...` : 'none',
      tokenStatus: {
        hasToken: tokenStatus.hasToken,
        isValid: tokenStatus.isValid,
        needsRefresh: tokenStatus.needsRefresh,
        expiresIn: tokenStatus.expiresIn ? `${Math.floor(tokenStatus.expiresIn / 1000 / 60)} minutes` : 'unknown'
      },
      accountId: creds?.adAccountId || 'none',
      encryptionEnabled: creds?.encryptionEnabled !== false,
      lastValidated: creds?.lastValidated ? new Date(creds.lastValidated).toISOString() : 'never'
    }
  }
  
  // Export/Import for backup (encrypted)
  static async exportCredentials(password: string): Promise<string | null> {
    try {
      const creds = await this.load()
      if (!creds) return null
      
      const encrypted = await CryptoUtils.encrypt(JSON.stringify(creds), password)
      return encrypted
    } catch (error) {
      console.error('Failed to export credentials:', error)
      return null
    }
  }
  
  static async importCredentials(encryptedData: string, password: string): Promise<boolean> {
    try {
      const decrypted = await CryptoUtils.decrypt(encryptedData, password)
      const creds = JSON.parse(decrypted) as SecureCredentials
      
      return await this.save(creds, false, true)
    } catch (error) {
      console.error('Failed to import credentials:', error)
      return false
    }
  }
}