// Rate limiting for authentication endpoints
export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean // Don't count successful requests
  keyGenerator?: (req: any) => string // Custom key generator
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

export class RateLimiter {
  private store: Map<string, { count: number; resetAt: number }> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null
  
  constructor(private config: RateLimitConfig) {
    // Start cleanup interval
    this.startCleanup()
  }
  
  // Check if request is allowed
  async checkLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now()
    const record = this.store.get(key)
    
    // If no record or window expired, create new
    if (!record || now > record.resetAt) {
      const resetAt = now + this.config.windowMs
      this.store.set(key, { count: 1, resetAt })
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt
      }
    }
    
    // Check if limit exceeded
    if (record.count >= this.config.maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000)
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetAt,
        retryAfter
      }
    }
    
    // Increment counter
    record.count++
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count,
      resetAt: record.resetAt
    }
  }
  
  // Reset limit for a key
  resetLimit(key: string) {
    this.store.delete(key)
  }
  
  // Clear all limits
  clearAll() {
    this.store.clear()
  }
  
  // Cleanup expired entries
  private cleanup() {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.store.forEach((record, key) => {
      if (now > record.resetAt) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.store.delete(key))
  }
  
  // Start cleanup interval
  private startCleanup() {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }
  
  // Stop cleanup interval
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// Pre-configured rate limiters for different auth operations
export class AuthRateLimiters {
  private static limiters: Map<string, RateLimiter> = new Map()
  
  // Get or create a rate limiter for login attempts
  static getLoginLimiter(): RateLimiter {
    const key = 'login'
    
    if (!this.limiters.has(key)) {
      this.limiters.set(key, new RateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // 5 attempts per 15 minutes
      }))
    }
    
    return this.limiters.get(key)!
  }
  
  // Get or create a rate limiter for token validation
  static getValidationLimiter(): RateLimiter {
    const key = 'validation'
    
    if (!this.limiters.has(key)) {
      this.limiters.set(key, new RateLimiter({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10, // 10 validations per minute
      }))
    }
    
    return this.limiters.get(key)!
  }
  
  // Get or create a rate limiter for API requests
  static getApiLimiter(): RateLimiter {
    const key = 'api'
    
    if (!this.limiters.has(key)) {
      this.limiters.set(key, new RateLimiter({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 60, // 60 requests per minute
      }))
    }
    
    return this.limiters.get(key)!
  }
  
  // Get or create a rate limiter for token refresh
  static getRefreshLimiter(): RateLimiter {
    const key = 'refresh'
    
    if (!this.limiters.has(key)) {
      this.limiters.set(key, new RateLimiter({
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 5, // 5 refresh attempts per hour
      }))
    }
    
    return this.limiters.get(key)!
  }
  
  // Destroy all limiters
  static destroyAll() {
    this.limiters.forEach(limiter => limiter.destroy())
    this.limiters.clear()
  }
}

// Client-side rate limiting hook
export function useRateLimit(
  limiterType: 'login' | 'validation' | 'api' | 'refresh',
  key?: string
): (customKey?: string) => Promise<RateLimitResult> {
  let limiter: RateLimiter
  
  switch (limiterType) {
    case 'login':
      limiter = AuthRateLimiters.getLoginLimiter()
      break
    case 'validation':
      limiter = AuthRateLimiters.getValidationLimiter()
      break
    case 'api':
      limiter = AuthRateLimiters.getApiLimiter()
      break
    case 'refresh':
      limiter = AuthRateLimiters.getRefreshLimiter()
      break
  }
  
  return async (customKey?: string) => {
    const rateLimitKey = customKey || key || 'default'
    return limiter.checkLimit(rateLimitKey)
  }
}