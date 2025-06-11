// Rate Limiter for Meta API calls
import { z } from 'zod'

// Rate limit configuration
export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  maxBurst?: number
  retryAfter?: number
}

// Default Meta API rate limits
export const META_API_LIMITS = {
  // Standard tier limits
  standard: {
    maxRequests: 200,
    windowMs: 60 * 60 * 1000, // 1 hour
    maxBurst: 40, // Max burst within 1 minute
  },
  // Development tier limits
  development: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    maxBurst: 20,
  },
  // Business tier limits
  business: {
    maxRequests: 1000,
    windowMs: 60 * 60 * 1000, // 1 hour
    maxBurst: 100,
  }
}

// Request metadata
interface RequestMetadata {
  timestamp: number
  endpoint: string
  weight: number // Some endpoints count as multiple requests
}

export class RateLimiter {
  private requests: RequestMetadata[] = []
  private config: RateLimitConfig
  private retryQueue: Map<string, { 
    resolve: (value: any) => void
    reject: (reason?: any) => void
    executor: () => Promise<any>
    retryCount: number
  }> = new Map()

  constructor(config: RateLimitConfig = META_API_LIMITS.standard) {
    this.config = config
  }

  // Check if request can be made
  canMakeRequest(weight: number = 1): boolean {
    this.cleanupOldRequests()
    
    const currentRequests = this.requests.reduce((sum, req) => sum + req.weight, 0)
    
    // Check window limit
    if (currentRequests + weight > this.config.maxRequests) {
      return false
    }
    
    // Check burst limit
    if (this.config.maxBurst) {
      const oneMinuteAgo = Date.now() - 60000
      const recentRequests = this.requests
        .filter(req => req.timestamp > oneMinuteAgo)
        .reduce((sum, req) => sum + req.weight, 0)
      
      if (recentRequests + weight > this.config.maxBurst) {
        return false
      }
    }
    
    return true
  }

  // Record a request
  recordRequest(endpoint: string, weight: number = 1): void {
    this.requests.push({
      timestamp: Date.now(),
      endpoint,
      weight
    })
  }

  // Get time until next available request
  getTimeUntilNextRequest(): number {
    this.cleanupOldRequests()
    
    if (this.canMakeRequest()) {
      return 0
    }
    
    // Find the oldest request that would free up space
    const oldestRequest = this.requests[0]
    if (!oldestRequest) {
      return 0
    }
    
    const timeUntilExpiry = (oldestRequest.timestamp + this.config.windowMs) - Date.now()
    return Math.max(0, timeUntilExpiry)
  }

  // Execute request with rate limiting
  async execute<T>(
    endpoint: string,
    executor: () => Promise<T>,
    options: {
      weight?: number
      priority?: number
      retryAttempts?: number
    } = {}
  ): Promise<T> {
    const { weight = 1, retryAttempts = 3 } = options
    
    // Check if we can make the request immediately
    if (this.canMakeRequest(weight)) {
      this.recordRequest(endpoint, weight)
      
      try {
        return await executor()
      } catch (error: any) {
        // Check if it's a rate limit error
        if (this.isRateLimitError(error)) {
          return this.handleRateLimitError(endpoint, executor, error, retryAttempts)
        }
        throw error
      }
    }
    
    // Queue the request
    return this.queueRequest(endpoint, executor, weight, retryAttempts)
  }

  // Queue request for later execution
  private queueRequest<T>(
    endpoint: string,
    executor: () => Promise<T>,
    weight: number,
    retryAttempts: number
  ): Promise<T> {
    const delay = this.getTimeUntilNextRequest()
    
    return new Promise((resolve, reject) => {
      const key = `${endpoint}-${Date.now()}`
      this.retryQueue.set(key, {
        resolve,
        reject,
        executor,
        retryCount: 0
      })
      
      setTimeout(async () => {
        try {
          const result = await this.execute(endpoint, executor, { weight, retryAttempts })
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.retryQueue.delete(key)
        }
      }, delay)
    })
  }

  // Handle rate limit error from API
  private async handleRateLimitError<T>(
    endpoint: string,
    executor: () => Promise<T>,
    error: any,
    retryAttempts: number
  ): Promise<T> {
    const retryAfter = this.extractRetryAfter(error) || this.config.retryAfter || 60000
    
    console.warn(`Rate limit hit for ${endpoint}. Retrying after ${retryAfter}ms`)
    
    await this.sleep(retryAfter)
    
    // Retry with decremented attempts
    if (retryAttempts > 0) {
      return this.execute(endpoint, executor, { retryAttempts: retryAttempts - 1 })
    }
    
    throw error
  }

  // Check if error is rate limit related
  private isRateLimitError(error: any): boolean {
    if (!error) return false
    
    // Check for common rate limit indicators
    const errorMessage = error.message?.toLowerCase() || ''
    const statusCode = error.status || error.response?.status
    
    return (
      statusCode === 429 ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      error.code === 32 || // Meta API rate limit code
      error.code === 613 // Meta API rate limit code
    )
  }

  // Extract retry-after header from error
  private extractRetryAfter(error: any): number | null {
    const retryAfter = error.response?.headers?.['retry-after'] || 
                      error.headers?.['x-business-use-case-usage'] ||
                      error.headers?.['x-app-usage']
    
    if (retryAfter) {
      // Parse Meta's usage headers
      try {
        const usage = JSON.parse(retryAfter)
        if (usage.call_count && usage.total_time) {
          // Calculate based on usage
          const percentUsed = Math.max(
            usage.call_count / 100,
            usage.total_time / 100
          )
          if (percentUsed > 0.8) {
            // If over 80% used, wait proportionally
            return Math.ceil((percentUsed - 0.8) * 300000) // Up to 1 minute
          }
        }
      } catch (e) {
        // If it's a number, use it directly (seconds)
        const seconds = parseInt(retryAfter)
        if (!isNaN(seconds)) {
          return seconds * 1000
        }
      }
    }
    
    return null
  }

  // Clean up old requests outside the window
  private cleanupOldRequests(): void {
    const cutoff = Date.now() - this.config.windowMs
    this.requests = this.requests.filter(req => req.timestamp > cutoff)
  }

  // Sleep utility
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Get current usage statistics
  getUsageStats(): {
    currentRequests: number
    maxRequests: number
    percentUsed: number
    requestsInLastMinute: number
    timeUntilReset: number
  } {
    this.cleanupOldRequests()
    
    const currentRequests = this.requests.reduce((sum, req) => sum + req.weight, 0)
    const oneMinuteAgo = Date.now() - 60000
    const requestsInLastMinute = this.requests
      .filter(req => req.timestamp > oneMinuteAgo)
      .reduce((sum, req) => sum + req.weight, 0)
    
    const oldestRequest = this.requests[0]
    const timeUntilReset = oldestRequest 
      ? Math.max(0, (oldestRequest.timestamp + this.config.windowMs) - Date.now())
      : 0
    
    return {
      currentRequests,
      maxRequests: this.config.maxRequests,
      percentUsed: (currentRequests / this.config.maxRequests) * 100,
      requestsInLastMinute,
      timeUntilReset
    }
  }

  // Update configuration
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config }
  }

  // Clear all tracking
  reset(): void {
    this.requests = []
    this.retryQueue.clear()
  }
}

// Singleton instances for different tiers
const rateLimiters = new Map<string, RateLimiter>()

export function getRateLimiter(tier: keyof typeof META_API_LIMITS = 'standard'): RateLimiter {
  if (!rateLimiters.has(tier)) {
    rateLimiters.set(tier, new RateLimiter(META_API_LIMITS[tier]))
  }
  return rateLimiters.get(tier)!
}

// Rate limit decorator
export function RateLimit(tier: keyof typeof META_API_LIMITS = 'standard', weight: number = 1) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const rateLimiter = getRateLimiter(tier)
      const endpoint = `${target.constructor.name}.${propertyName}`
      
      return rateLimiter.execute(
        endpoint,
        () => method.apply(this, args),
        { weight }
      )
    }
    
    return descriptor
  }
}