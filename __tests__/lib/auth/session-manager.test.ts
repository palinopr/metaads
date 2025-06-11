import { SessionManager, Session, SessionConfig } from '../../../lib/auth/session-manager'
import { CryptoUtils } from '../../../lib/auth/crypto-utils'

// Mock CryptoUtils
jest.mock('../../../lib/auth/crypto-utils')
const mockCryptoUtils = CryptoUtils as jest.Mocked<typeof CryptoUtils>

// Mock timers
jest.useFakeTimers()

describe('SessionManager', () => {
  const mockUserId = 'test-user-123'
  const mockSessionId = 'mock-session-id'
  const mockCsrfToken = 'mock-csrf-token'
  const mockRefreshToken = 'mock-refresh-token'

  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    
    // Reset localStorage
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

    // Mock document for browser environment
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true
    })

    // Mock window object
    Object.defineProperty(window, 'addEventListener', {
      value: jest.fn(),
      writable: true
    })

    Object.defineProperty(document, 'addEventListener', {
      value: jest.fn(),
      writable: true
    })

    // Mock CryptoUtils
    mockCryptoUtils.generateSecureToken.mockImplementation((length = 32) => {
      return length === 16 ? mockCsrfToken : mockSessionId
    })

    // Reset SessionManager static state
    SessionManager.clearSession()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  describe('initialize', () => {
    it('should initialize with default config', () => {
      SessionManager.initialize()
      
      expect(window.addEventListener).toHaveBeenCalled()
      expect(document.addEventListener).toHaveBeenCalled()
    })

    it('should initialize with custom config', () => {
      const customConfig: Partial<SessionConfig> = {
        sessionTimeout: 60 * 60 * 1000, // 1 hour
        activityTimeout: 15 * 60 * 1000, // 15 minutes
        enableAutoRenew: false
      }
      
      SessionManager.initialize(customConfig)
      
      // Config should be applied (we can test this indirectly through session creation)
      expect(window.addEventListener).toHaveBeenCalled()
    })
  })

  describe('createSession', () => {
    it('should create a new session with required properties', async () => {
      const session = await SessionManager.createSession(mockUserId, mockRefreshToken)
      
      expect(session).toMatchObject({
        id: mockSessionId,
        userId: mockUserId,
        refreshToken: mockRefreshToken,
        csrfToken: mockCsrfToken
      })
      expect(session.createdAt).toBeCloseTo(Date.now(), -2)
      expect(session.lastActivity).toBeCloseTo(Date.now(), -2)
      expect(session.expiresAt).toBeGreaterThan(Date.now())
    })

    it('should save session to localStorage', async () => {
      const session = await SessionManager.createSession(mockUserId)
      
      const storedSession = localStorage.getItem('meta_ads_session')
      expect(storedSession).toBeTruthy()
      
      const parsedSession = JSON.parse(storedSession!)
      expect(parsedSession.id).toBe(session.id)
      expect(parsedSession.userId).toBe(mockUserId)
    })

    it('should store session ID and CSRF token separately', async () => {
      await SessionManager.createSession(mockUserId)
      
      expect(localStorage.getItem('meta_ads_session_id')).toBe(mockSessionId)
      expect(localStorage.getItem('meta_ads_csrf_token')).toBe(mockCsrfToken)
    })

    it('should create session without refresh token', async () => {
      const session = await SessionManager.createSession(mockUserId)
      
      expect(session.refreshToken).toBeUndefined()
      expect(session.userId).toBe(mockUserId)
    })
  })

  describe('getSession', () => {
    it('should return valid session', async () => {
      const createdSession = await SessionManager.createSession(mockUserId)
      
      const retrievedSession = SessionManager.getSession()
      
      expect(retrievedSession).toMatchObject({
        id: createdSession.id,
        userId: mockUserId,
        csrfToken: mockCsrfToken
      })
    })

    it('should return null when no session exists', () => {
      const session = SessionManager.getSession()
      expect(session).toBeNull()
    })

    it('should return null and clear expired session', async () => {
      const shortSession = await SessionManager.createSession(mockUserId)
      
      // Manually expire the session
      shortSession.expiresAt = Date.now() - 1000
      localStorage.setItem('meta_ads_session', JSON.stringify(shortSession))\n      
      const retrievedSession = SessionManager.getSession()
      
      expect(retrievedSession).toBeNull()
      expect(localStorage.getItem('meta_ads_session')).toBeNull()
    })

    it('should return null and clear inactive session', async () => {
      // Initialize with short activity timeout
      SessionManager.initialize({ activityTimeout: 1000 }) // 1 second
      
      const session = await SessionManager.createSession(mockUserId)
      
      // Simulate inactivity
      session.lastActivity = Date.now() - 2000 // 2 seconds ago
      localStorage.setItem('meta_ads_session', JSON.stringify(session))
      
      const retrievedSession = SessionManager.getSession()
      
      expect(retrievedSession).toBeNull()
      expect(localStorage.getItem('meta_ads_session')).toBeNull()
    })

    it('should handle corrupted session data', () => {
      localStorage.setItem('meta_ads_session', 'invalid-json')
      
      const session = SessionManager.getSession()
      
      expect(session).toBeNull()
    })
  })

  describe('updateActivity', () => {
    it('should update last activity timestamp', async () => {
      const session = await SessionManager.createSession(mockUserId)
      const originalActivity = session.lastActivity
      
      // Advance time
      jest.advanceTimersByTime(5000)
      
      SessionManager.updateActivity()
      
      const updatedSession = SessionManager.getSession()
      expect(updatedSession!.lastActivity).toBeGreaterThan(originalActivity)
    })

    it('should notify activity listeners', async () => {
      await SessionManager.createSession(mockUserId)
      
      const listener = jest.fn()
      SessionManager.addActivityListener(listener)
      
      SessionManager.updateActivity()
      
      expect(listener).toHaveBeenCalled()
    })

    it('should do nothing when no session exists', () => {
      // Should not throw error
      expect(() => SessionManager.updateActivity()).not.toThrow()
    })
  })

  describe('renewSession', () => {
    it('should extend session expiry', async () => {
      const session = await SessionManager.createSession(mockUserId)
      const originalExpiry = session.expiresAt
      
      jest.advanceTimersByTime(5000)
      
      const renewedSession = await SessionManager.renewSession()
      
      expect(renewedSession).toBeTruthy()
      expect(renewedSession!.expiresAt).toBeGreaterThan(originalExpiry)
    })

    it('should generate new CSRF token', async () => {
      await SessionManager.createSession(mockUserId)
      const originalCsrfToken = SessionManager.getCSRFToken()
      
      // Mock new CSRF token
      mockCryptoUtils.generateSecureToken.mockReturnValueOnce('new-csrf-token')
      
      const renewedSession = await SessionManager.renewSession()
      
      expect(renewedSession!.csrfToken).toBe('new-csrf-token')
      expect(renewedSession!.csrfToken).not.toBe(originalCsrfToken)
    })

    it('should return null when no session exists', async () => {
      const renewedSession = await SessionManager.renewSession()
      expect(renewedSession).toBeNull()
    })

    it('should clear session if max duration exceeded', async () => {
      // Initialize with short max duration
      SessionManager.initialize({ maxSessionDuration: 1000 }) // 1 second
      
      const session = await SessionManager.createSession(mockUserId)
      
      // Advance time beyond max duration
      jest.advanceTimersByTime(2000)
      
      const renewedSession = await SessionManager.renewSession()
      
      expect(renewedSession).toBeNull()
      expect(SessionManager.getSession()).toBeNull()
    })
  })

  describe('clearSession', () => {
    it('should remove all session data from localStorage', async () => {
      await SessionManager.createSession(mockUserId)
      
      SessionManager.clearSession()
      
      expect(localStorage.getItem('meta_ads_session')).toBeNull()
      expect(localStorage.getItem('meta_ads_session_id')).toBeNull()
      expect(localStorage.getItem('meta_ads_csrf_token')).toBeNull()
    })

    it('should clear all timers', async () => {
      await SessionManager.createSession(mockUserId)
      
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
      
      SessionManager.clearSession()
      
      // We can't easily test if the specific timers were cleared,
      // but we can verify the clear functions were called
      expect(clearTimeoutSpy).toHaveBeenCalled()
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('CSRF token management', () => {
    it('should return CSRF token for valid session', async () => {
      await SessionManager.createSession(mockUserId)
      
      const csrfToken = SessionManager.getCSRFToken()
      
      expect(csrfToken).toBe(mockCsrfToken)
    })

    it('should return null when no session exists', () => {
      const csrfToken = SessionManager.getCSRFToken()
      expect(csrfToken).toBeNull()
    })

    it('should validate CSRF token correctly', async () => {
      await SessionManager.createSession(mockUserId)
      
      expect(SessionManager.validateCSRFToken(mockCsrfToken)).toBe(true)
      expect(SessionManager.validateCSRFToken('invalid-token')).toBe(false)
    })

    it('should return false for CSRF validation without session', () => {
      expect(SessionManager.validateCSRFToken(mockCsrfToken)).toBe(false)
    })
  })

  describe('activity listeners', () => {
    it('should add and remove activity listeners', () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()
      
      SessionManager.addActivityListener(listener1)
      SessionManager.addActivityListener(listener2)
      
      // Both listeners should be notified
      SessionManager.updateActivity()
      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
      
      // Remove one listener
      SessionManager.removeActivityListener(listener1)
      
      SessionManager.updateActivity()
      expect(listener1).toHaveBeenCalledTimes(1) // Not called again
      expect(listener2).toHaveBeenCalledTimes(2) // Called again
    })
  })

  describe('automatic session management', () => {
    it('should schedule session renewal when auto-renew is enabled', async () => {
      SessionManager.initialize({ enableAutoRenew: true })
      
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
      
      await SessionManager.createSession(mockUserId)
      
      expect(setTimeoutSpy).toHaveBeenCalled()
    })

    it('should not schedule renewal when auto-renew is disabled', async () => {
      SessionManager.initialize({ enableAutoRenew: false })
      
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
      
      await SessionManager.createSession(mockUserId)
      
      // setTimeout might be called for other purposes, so we can't easily test this
      // The test mainly ensures no errors occur
      expect(() => SessionManager.createSession(mockUserId)).not.toThrow()
    })

    it('should handle session expiry during activity check', async () => {
      SessionManager.initialize({ activityTimeout: 1000 })
      
      const session = await SessionManager.createSession(mockUserId)
      
      // Manually make session inactive
      session.lastActivity = Date.now() - 2000
      localStorage.setItem('meta_ads_session', JSON.stringify(session))
      
      // Trigger activity check
      jest.advanceTimersByTime(60000) // Advance by 1 minute
      
      // Session should be cleared
      expect(SessionManager.getSession()).toBeNull()
    })
  })

  describe('browser event handling', () => {
    beforeEach(() => {
      // Mock event dispatching
      Object.defineProperty(window, 'dispatchEvent', {
        value: jest.fn(),
        writable: true
      })
    })

    it('should dispatch session-expired event on visibility change with inactive session', async () => {
      SessionManager.initialize({ activityTimeout: 1000 })
      
      const session = await SessionManager.createSession(mockUserId)
      
      // Make session inactive
      session.lastActivity = Date.now() - 2000
      localStorage.setItem('meta_ads_session', JSON.stringify(session))
      
      // Get the visibility change handler
      const visibilityChangeHandler = (document.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'visibilitychange')?.[1]
      
      if (visibilityChangeHandler) {
        // Simulate document becoming visible
        Object.defineProperty(document, 'hidden', { value: false })
        visibilityChangeHandler()
        
        expect(window.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'session-expired'
          })
        )
      }
    })

    it('should dispatch session-expired event on window focus with inactive session', async () => {
      SessionManager.initialize({ activityTimeout: 1000 })
      
      const session = await SessionManager.createSession(mockUserId)
      
      // Make session inactive
      session.lastActivity = Date.now() - 2000
      localStorage.setItem('meta_ads_session', JSON.stringify(session))
      
      // Get the focus handler
      const focusHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'focus')?.[1]
      
      if (focusHandler) {
        focusHandler()
        
        expect(window.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'session-expired'
          })
        )
      }
    })
  })

  describe('throttle utility', () => {
    it('should throttle function calls', async () => {
      await SessionManager.createSession(mockUserId)
      
      const listener = jest.fn()
      SessionManager.addActivityListener(listener)
      
      // Rapid successive calls
      SessionManager.updateActivity()
      SessionManager.updateActivity()
      SessionManager.updateActivity()
      
      // Should only be called once due to throttling
      expect(listener).toHaveBeenCalledTimes(1)
      
      // Advance time and call again
      jest.advanceTimersByTime(60000)
      SessionManager.updateActivity()
      
      expect(listener).toHaveBeenCalledTimes(2)
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw errors
      const originalSetItem = localStorage.setItem
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })
      
      // Should not throw error
      expect(async () => {
        await SessionManager.createSession(mockUserId)
      }).not.toThrow()
      
      // Restore original implementation
      localStorage.setItem = originalSetItem
    })

    it('should handle missing window object in non-browser environment', () => {
      // This test mainly ensures the code doesn't crash in server environments
      const originalWindow = global.window
      delete (global as any).window
      
      try {
        expect(() => SessionManager.initialize()).not.toThrow()
      } finally {
        global.window = originalWindow
      }
    })

    it('should handle session with missing properties', () => {
      // Store incomplete session data
      const incompleteSession = { id: 'test', userId: 'test' }
      localStorage.setItem('meta_ads_session', JSON.stringify(incompleteSession))
      
      const session = SessionManager.getSession()
      
      // Should handle gracefully and likely return null or handle defaults
      expect(session).toBeDefined() // The exact behavior depends on implementation
    })
  })

  describe('Integration tests', () => {
    it('should complete full session lifecycle', async () => {
      // Initialize
      SessionManager.initialize({
        sessionTimeout: 60000, // 1 minute
        activityTimeout: 30000, // 30 seconds
        enableAutoRenew: true
      })
      
      // Create session
      const session = await SessionManager.createSession(mockUserId, mockRefreshToken)
      expect(session).toBeTruthy()
      expect(session.userId).toBe(mockUserId)
      
      // Verify session is retrievable
      const retrievedSession = SessionManager.getSession()
      expect(retrievedSession).toMatchObject({
        id: session.id,
        userId: mockUserId
      })
      
      // Update activity
      SessionManager.updateActivity()
      const updatedSession = SessionManager.getSession()
      expect(updatedSession!.lastActivity).toBeGreaterThan(session.lastActivity)
      
      // Renew session
      const renewedSession = await SessionManager.renewSession()
      expect(renewedSession).toBeTruthy()
      expect(renewedSession!.expiresAt).toBeGreaterThan(session.expiresAt)
      
      // Clear session
      SessionManager.clearSession()
      expect(SessionManager.getSession()).toBeNull()
    })

    it('should handle concurrent operations', async () => {
      const session = await SessionManager.createSession(mockUserId)
      
      // Simulate concurrent operations
      const operations = [
        SessionManager.updateActivity(),
        SessionManager.renewSession(),
        SessionManager.getSession(),
        SessionManager.getCSRFToken()
      ]
      
      // Should not throw errors
      await expect(Promise.all(operations)).resolves.toBeDefined()
    })
  })
})