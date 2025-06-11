import { TokenManager, TokenInfo, TokenRefreshResult } from '../../../lib/auth/token-manager'
import { CryptoUtils } from '../../../lib/auth/crypto-utils'
import { SessionManager } from '../../../lib/auth/session-manager'

// Mock dependencies
jest.mock('../../../lib/auth/crypto-utils')
jest.mock('../../../lib/auth/session-manager')

const mockCryptoUtils = CryptoUtils as jest.Mocked<typeof CryptoUtils>
const mockSessionManager = SessionManager as jest.Mocked<typeof SessionManager>

describe('TokenManager', () => {
  const mockSession = {
    id: 'test-session-id',
    userId: 'test-user',
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000
  }

  const mockToken: TokenInfo = {
    accessToken: 'EAA123456789abcdef_valid_meta_token_format_test_12345',
    refreshToken: 'refresh_123',
    expiresAt: Date.now() + 3600000, // 1 hour from now
    tokenType: 'Bearer',
    scope: 'ads_read'
  }

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()
    
    // Reset localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })

    // Mock session manager
    mockSessionManager.getSession.mockReturnValue(mockSession)
    
    // Mock crypto utils
    mockCryptoUtils.hash.mockResolvedValue('hashed-key')
    mockCryptoUtils.encrypt.mockResolvedValue('encrypted-token')
    mockCryptoUtils.decrypt.mockResolvedValue(JSON.stringify(mockToken))

    // Mock navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'test-user-agent',
      configurable: true
    })

    // Mock fetch
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('saveToken', () => {
    it('should save valid token with encryption', async () => {
      const result = await TokenManager.saveToken(mockToken, true)
      
      expect(result).toBe(true)
      expect(mockCryptoUtils.hash).toHaveBeenCalledWith('test-session-id' + 'test-user-agent')
      expect(mockCryptoUtils.encrypt).toHaveBeenCalledWith(
        JSON.stringify(mockToken),
        'hashed-key'
      )
      expect(localStorage.setItem).toHaveBeenCalledWith('meta_token_info', 'encrypted-token')
    })

    it('should save token without encryption when disabled', async () => {
      const result = await TokenManager.saveToken(mockToken, false)
      
      expect(result).toBe(true)
      expect(mockCryptoUtils.encrypt).not.toHaveBeenCalled()
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'meta_token_info',
        JSON.stringify(mockToken)
      )
    })

    it('should reject invalid token format', async () => {
      const invalidToken = { ...mockToken, accessToken: 'invalid-token' }
      
      const result = await TokenManager.saveToken(invalidToken)
      
      expect(result).toBe(false)
      expect(localStorage.setItem).not.toHaveBeenCalled()
    })

    it('should handle no active session', async () => {
      mockSessionManager.getSession.mockReturnValue(null)
      
      const result = await TokenManager.saveToken(mockToken)
      
      expect(result).toBe(false)
      expect(localStorage.setItem).not.toHaveBeenCalled()
    })

    it('should set default expiry for tokens without expiry', async () => {
      const tokenWithoutExpiry = { ...mockToken }
      delete tokenWithoutExpiry.expiresAt
      
      const result = await TokenManager.saveToken(tokenWithoutExpiry)
      
      expect(result).toBe(true)
      const savedToken = JSON.parse(
        (mockCryptoUtils.encrypt as jest.Mock).mock.calls[0][0]
      )
      expect(savedToken.expiresAt).toBeGreaterThan(Date.now())
    })
  })

  describe('loadToken', () => {
    it('should load and decrypt valid token', async () => {
      ;(localStorage.getItem as jest.Mock).mockReturnValue('encrypted-token')
      
      const result = await TokenManager.loadToken(true)
      
      expect(result).toEqual(mockToken)
      expect(mockCryptoUtils.decrypt).toHaveBeenCalledWith('encrypted-token', 'hashed-key')
    })

    it('should load unencrypted token', async () => {
      ;(localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockToken))
      
      const result = await TokenManager.loadToken(false)
      
      expect(result).toEqual(mockToken)
      expect(mockCryptoUtils.decrypt).not.toHaveBeenCalled()
    })

    it('should return null when no token stored', async () => {
      ;(localStorage.getItem as jest.Mock).mockReturnValue(null)
      
      const result = await TokenManager.loadToken()
      
      expect(result).toBeNull()
    })

    it('should handle expired token with refresh', async () => {
      const expiredToken = {
        ...mockToken,
        expiresAt: Date.now() - 1000 // 1 second ago
      }
      ;(localStorage.getItem as jest.Mock).mockReturnValue('encrypted-token')
      mockCryptoUtils.decrypt.mockResolvedValue(JSON.stringify(expiredToken))
      
      // Mock successful refresh
      jest.spyOn(TokenManager, 'refreshToken').mockResolvedValue({
        success: true,
        token: mockToken
      })
      
      const result = await TokenManager.loadToken()
      
      expect(result).toEqual(mockToken)
      expect(TokenManager.refreshToken).toHaveBeenCalledWith(expiredToken.refreshToken)
    })

    it('should return null for expired token without refresh token', async () => {
      const expiredToken = {
        ...mockToken,
        expiresAt: Date.now() - 1000,
        refreshToken: undefined
      }
      ;(localStorage.getItem as jest.Mock).mockReturnValue('encrypted-token')
      mockCryptoUtils.decrypt.mockResolvedValue(JSON.stringify(expiredToken))
      
      const result = await TokenManager.loadToken()
      
      expect(result).toBeNull()
    })

    it('should fallback to plain JSON on decryption failure', async () => {
      ;(localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockToken))
      mockCryptoUtils.decrypt.mockRejectedValue(new Error('Decryption failed'))
      
      const result = await TokenManager.loadToken(true)
      
      expect(result).toEqual(mockToken)
    })
  })

  describe('validateTokenFormat', () => {
    it('should validate correct Meta token format', () => {
      const validTokens = [
        'EAA123456789abcdef_valid_meta_token_format_test_12345',
        'EAABwzLixnjYBOZB123456789',
        'abc123_def456|xyz789'
      ]
      
      validTokens.forEach(token => {
        expect(TokenManager.validateTokenFormat(token)).toBe(true)
      })
    })

    it('should reject invalid token formats', () => {
      const invalidTokens = [
        '',
        'short',
        'a'.repeat(501), // Too long
        null as any,
        undefined as any,
        123 as any,
        'invalid@token#format'
      ]
      
      invalidTokens.forEach(token => {
        expect(TokenManager.validateTokenFormat(token)).toBe(false)
      })
    })
  })

  describe('validateToken', () => {
    it('should validate token with Meta API', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)
      
      const result = await TokenManager.validateToken('valid-token', 'act_123')
      
      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith('/api/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test_connection',
          accessToken: 'valid-token',
          adAccountId: 'act_123'
        })
      })
    })

    it('should handle validation failure', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: false })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)
      
      const result = await TokenManager.validateToken('invalid-token', 'act_123')
      
      expect(result).toBe(false)
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
      
      const result = await TokenManager.validateToken('token', 'act_123')
      
      expect(result).toBe(false)
    })
  })

  describe('refreshToken', () => {
    it('should return refresh not supported for Meta tokens', async () => {
      const result = await TokenManager.refreshToken('refresh-token')
      
      expect(result).toEqual({
        success: false,
        error: 'Token refresh not supported for Meta. Please re-authenticate.',
        needsReauth: true
      })
    })

    it('should prevent multiple simultaneous refresh attempts', async () => {
      const promise1 = TokenManager.refreshToken('refresh-token')
      const promise2 = TokenManager.refreshToken('refresh-token')
      
      const [result1, result2] = await Promise.all([promise1, promise2])
      
      expect(result1).toEqual(result2)
    })
  })

  describe('getTokenStatus', () => {
    it('should return status for valid token', async () => {
      jest.spyOn(TokenManager, 'loadToken').mockResolvedValue(mockToken)
      
      const status = await TokenManager.getTokenStatus()
      
      expect(status).toEqual({
        hasToken: true,
        isValid: true,
        expiresIn: expect.any(Number),
        needsRefresh: false
      })
    })

    it('should return status for expired token', async () => {
      const expiredToken = {
        ...mockToken,
        expiresAt: Date.now() - 1000
      }
      jest.spyOn(TokenManager, 'loadToken').mockResolvedValue(expiredToken)
      
      const status = await TokenManager.getTokenStatus()
      
      expect(status).toEqual({
        hasToken: true,
        isValid: false,
        expiresIn: expect.any(Number),
        needsRefresh: true
      })
    })

    it('should return status when no token exists', async () => {
      jest.spyOn(TokenManager, 'loadToken').mockResolvedValue(null)
      
      const status = await TokenManager.getTokenStatus()
      
      expect(status).toEqual({
        hasToken: false,
        isValid: false,
        needsRefresh: false
      })
    })
  })

  describe('clearToken', () => {
    it('should clear stored token and timer', () => {
      TokenManager.clearToken()
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('meta_token_info')
    })
  })

  describe('parseOAuthError', () => {
    it('should parse Meta OAuth errors correctly', () => {
      const error = {
        code: '190',
        message: 'Invalid OAuth access token.'
      }
      
      const parsed = TokenManager.parseOAuthError(error)
      
      expect(parsed).toEqual({
        code: '190',
        message: 'Invalid OAuth access token.',
        isExpired: true,
        needsReauth: true
      })
    })

    it('should handle unknown errors', () => {
      const parsed = TokenManager.parseOAuthError({})
      
      expect(parsed).toEqual({
        code: 'unknown',
        message: 'Unknown error',
        isExpired: false,
        needsReauth: false
      })
    })

    it('should detect expired tokens by message content', () => {
      const error = {
        code: '100',
        message: 'The access token has expired'
      }
      
      const parsed = TokenManager.parseOAuthError(error)
      
      expect(parsed.isExpired).toBe(true)
      expect(parsed.needsReauth).toBe(true)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      ;(localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })
      
      const result = await TokenManager.saveToken(mockToken)
      
      expect(result).toBe(false)
    })

    it('should handle crypto errors gracefully', async () => {
      mockCryptoUtils.encrypt.mockRejectedValue(new Error('Encryption failed'))
      
      const result = await TokenManager.saveToken(mockToken, true)
      
      expect(result).toBe(false)
    })

    it('should handle JSON parsing errors', async () => {
      ;(localStorage.getItem as jest.Mock).mockReturnValue('invalid-json')
      
      const result = await TokenManager.loadToken(false)
      
      expect(result).toBeNull()
    })
  })
})

// Integration tests for token lifecycle
describe('TokenManager Integration Tests', () => {
  beforeEach(() => {
    // Use real localStorage for integration tests
    Object.defineProperty(window, 'localStorage', {
      value: {
        store: {},
        getItem: function(key: string) {
          return this.store[key] || null
        },
        setItem: function(key: string, value: string) {
          this.store[key] = value
        },
        removeItem: function(key: string) {
          delete this.store[key]
        },
        clear: function() {
          this.store = {}
        }
      },
      writable: true
    })
  })

  it('should complete full token lifecycle', async () => {
    const mockSession = {
      id: 'test-session',
      userId: 'test-user',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000
    }
    
    mockSessionManager.getSession.mockReturnValue(mockSession)
    mockCryptoUtils.hash.mockResolvedValue('test-hash')
    mockCryptoUtils.encrypt.mockResolvedValue('encrypted-data')
    mockCryptoUtils.decrypt.mockImplementation(async (data) => {
      if (data === 'encrypted-data') {
        return JSON.stringify({
          accessToken: 'EAA123456789abcdef_valid_meta_token_format_test_12345',
          expiresAt: Date.now() + 3600000
        })
      }
      throw new Error('Invalid data')
    })
    
    // Save token
    const saveResult = await TokenManager.saveToken({
      accessToken: 'EAA123456789abcdef_valid_meta_token_format_test_12345',
      expiresAt: Date.now() + 3600000
    })
    expect(saveResult).toBe(true)
    
    // Load token
    const loadedToken = await TokenManager.loadToken()
    expect(loadedToken).toBeTruthy()
    expect(loadedToken?.accessToken).toBe('EAA123456789abcdef_valid_meta_token_format_test_12345')
    
    // Check status
    const status = await TokenManager.getTokenStatus()
    expect(status.hasToken).toBe(true)
    expect(status.isValid).toBe(true)
    
    // Clear token
    TokenManager.clearToken()
    
    // Verify cleared
    const clearedToken = await TokenManager.loadToken()
    expect(clearedToken).toBeNull()
  })
})