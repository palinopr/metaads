// Session management with automatic timeout and renewal
import { CryptoUtils } from './crypto-utils'

export interface Session {
  id: string
  userId: string
  createdAt: number
  lastActivity: number
  expiresAt: number
  refreshToken?: string
  csrfToken: string
}

export interface SessionConfig {
  sessionTimeout: number // in milliseconds
  activityTimeout: number // in milliseconds
  enableAutoRenew: boolean
  maxSessionDuration: number // in milliseconds
}

export class SessionManager {
  private static readonly SESSION_KEY = 'meta_ads_session'
  private static readonly SESSION_ID_KEY = 'meta_ads_session_id'
  private static readonly CSRF_TOKEN_KEY = 'meta_ads_csrf_token'
  
  private static readonly DEFAULT_CONFIG: SessionConfig = {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    activityTimeout: 30 * 60 * 1000, // 30 minutes of inactivity
    enableAutoRenew: true,
    maxSessionDuration: 7 * 24 * 60 * 60 * 1000 // 7 days max
  }
  
  private static config: SessionConfig = { ...this.DEFAULT_CONFIG }
  private static activityTimer: NodeJS.Timeout | null = null
  private static renewalTimer: NodeJS.Timeout | null = null
  private static activityListeners: Set<() => void> = new Set()
  
  // Initialize session manager with custom config
  static initialize(config?: Partial<SessionConfig>) {
    if (config) {
      this.config = { ...this.DEFAULT_CONFIG, ...config }
    }
    
    // Set up activity tracking
    if (typeof window !== 'undefined') {
      this.setupActivityTracking()
      this.setupSessionCheck()
    }
  }
  
  // Create a new session
  static async createSession(userId: string, refreshToken?: string): Promise<Session> {
    const sessionId = CryptoUtils.generateSecureToken()
    const csrfToken = CryptoUtils.generateSecureToken(16)
    const now = Date.now()
    
    const session: Session = {
      id: sessionId,
      userId,
      createdAt: now,
      lastActivity: now,
      expiresAt: now + this.config.sessionTimeout,
      refreshToken,
      csrfToken
    }
    
    // Store session
    this.saveSession(session)
    
    // Start auto-renewal if enabled
    if (this.config.enableAutoRenew) {
      this.scheduleRenewal(session)
    }
    
    return session
  }
  
  // Get current session
  static getSession(): Session | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY)
      if (!sessionData) return null
      
      const session = JSON.parse(sessionData) as Session
      
      // Check if session is expired
      if (this.isSessionExpired(session)) {
        this.clearSession()
        return null
      }
      
      // Check for inactivity timeout
      if (this.isInactive(session)) {
        this.clearSession()
        return null
      }
      
      return session
    } catch (error) {
      console.error('Error loading session:', error)
      return null
    }
  }
  
  // Update session activity
  static updateActivity() {
    const session = this.getSession()
    if (!session) return
    
    session.lastActivity = Date.now()
    this.saveSession(session)
    
    // Notify listeners
    this.activityListeners.forEach(listener => listener())
  }
  
  // Renew session
  static async renewSession(): Promise<Session | null> {
    const session = this.getSession()
    if (!session) return null
    
    const now = Date.now()
    const sessionAge = now - session.createdAt
    
    // Check if session has exceeded max duration
    if (sessionAge > this.config.maxSessionDuration) {
      this.clearSession()
      return null
    }
    
    // Extend session
    session.expiresAt = now + this.config.sessionTimeout
    session.lastActivity = now
    
    // Generate new CSRF token for security
    session.csrfToken = CryptoUtils.generateSecureToken(16)
    
    this.saveSession(session)
    
    // Reschedule renewal
    if (this.config.enableAutoRenew) {
      this.scheduleRenewal(session)
    }
    
    return session
  }
  
  // Clear session
  static clearSession() {
    localStorage.removeItem(this.SESSION_KEY)
    localStorage.removeItem(this.SESSION_ID_KEY)
    localStorage.removeItem(this.CSRF_TOKEN_KEY)
    
    // Clear timers
    if (this.activityTimer) {
      clearInterval(this.activityTimer)
      this.activityTimer = null
    }
    
    if (this.renewalTimer) {
      clearTimeout(this.renewalTimer)
      this.renewalTimer = null
    }
  }
  
  // Get CSRF token
  static getCSRFToken(): string | null {
    const session = this.getSession()
    return session?.csrfToken || null
  }
  
  // Validate CSRF token
  static validateCSRFToken(token: string): boolean {
    const session = this.getSession()
    if (!session) return false
    
    return session.csrfToken === token
  }
  
  // Add activity listener
  static addActivityListener(listener: () => void) {
    this.activityListeners.add(listener)
  }
  
  // Remove activity listener
  static removeActivityListener(listener: () => void) {
    this.activityListeners.delete(listener)
  }
  
  // Private methods
  
  private static saveSession(session: Session) {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session))
    localStorage.setItem(this.SESSION_ID_KEY, session.id)
    localStorage.setItem(this.CSRF_TOKEN_KEY, session.csrfToken)
  }
  
  private static isSessionExpired(session: Session): boolean {
    return Date.now() > session.expiresAt
  }
  
  private static isInactive(session: Session): boolean {
    const inactiveTime = Date.now() - session.lastActivity
    return inactiveTime > this.config.activityTimeout
  }
  
  private static setupActivityTracking() {
    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    
    const throttledUpdate = this.throttle(() => {
      this.updateActivity()
    }, 60000) // Update at most once per minute
    
    events.forEach(event => {
      window.addEventListener(event, throttledUpdate, { passive: true })
    })
    
    // Check session periodically
    this.activityTimer = setInterval(() => {
      const session = this.getSession()
      if (!session) {
        if (this.activityTimer) {
          clearInterval(this.activityTimer)
          this.activityTimer = null
        }
      }
    }, 60000) // Check every minute
  }
  
  private static setupSessionCheck() {
    // Check session on visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const session = this.getSession()
        if (session && this.isInactive(session)) {
          this.clearSession()
          // Trigger re-authentication
          window.dispatchEvent(new CustomEvent('session-expired'))
        }
      }
    })
    
    // Check session on focus
    window.addEventListener('focus', () => {
      const session = this.getSession()
      if (session && this.isInactive(session)) {
        this.clearSession()
        // Trigger re-authentication
        window.dispatchEvent(new CustomEvent('session-expired'))
      }
    })
  }
  
  private static scheduleRenewal(session: Session) {
    if (this.renewalTimer) {
      clearTimeout(this.renewalTimer)
    }
    
    // Schedule renewal for 5 minutes before expiry
    const renewalTime = session.expiresAt - Date.now() - (5 * 60 * 1000)
    
    if (renewalTime > 0) {
      this.renewalTimer = setTimeout(() => {
        this.renewSession()
      }, renewalTime)
    }
  }
  
  private static throttle(func: Function, wait: number) {
    let timeout: NodeJS.Timeout | null = null
    let lastCall = 0
    
    return function(this: any, ...args: any[]) {
      const now = Date.now()
      const remaining = wait - (now - lastCall)
      
      if (remaining <= 0) {
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        
        lastCall = now
        func.apply(this, args)
      } else if (!timeout) {
        timeout = setTimeout(() => {
          lastCall = Date.now()
          timeout = null
          func.apply(this, args)
        }, remaining)
      }
    }
  }
}