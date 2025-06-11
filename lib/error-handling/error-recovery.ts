import { ApplicationError, ErrorCategory, ErrorSeverity } from './error-types'
import { errorTracker } from './error-tracker'

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryCondition?: (error: Error, attemptNumber: number) => boolean
  onRetry?: (error: Error, attemptNumber: number) => void
  onSuccess?: (result: any, attemptNumber: number) => void
  onFailure?: (error: Error, attempts: number) => void
}

export class ErrorRecovery {
  private static defaultOptions: RetryOptions = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryCondition: (error) => {
      // Default: retry on network errors and 5xx status codes
      if (error instanceof ApplicationError) {
        return error.recoverable && error.category === ErrorCategory.NETWORK
      }
      return error.message.toLowerCase().includes('network') ||
             error.message.toLowerCase().includes('fetch')
    }
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const config = { ...this.defaultOptions, ...options }
    let lastError: Error | null = null
    let delay = config.initialDelay!

    for (let attempt = 1; attempt <= config.maxRetries!; attempt++) {
      try {
        const result = await operation()
        
        if (config.onSuccess && attempt > 1) {
          config.onSuccess(result, attempt)
        }
        
        return result
      } catch (error) {
        lastError = error as Error
        
        // Track the error
        errorTracker.track(lastError, {
          action: 'retry_attempt',
          metadata: { attempt, maxRetries: config.maxRetries }
        })

        // Check if we should retry
        const shouldRetry = config.retryCondition
          ? config.retryCondition(lastError, attempt)
          : true

        if (!shouldRetry || attempt === config.maxRetries) {
          if (config.onFailure) {
            config.onFailure(lastError, attempt)
          }
          throw lastError
        }

        // Call retry callback
        if (config.onRetry) {
          config.onRetry(lastError, attempt)
        }

        // Wait before retrying
        await this.delay(delay)
        
        // Calculate next delay with exponential backoff
        delay = Math.min(
          delay * config.backoffMultiplier!,
          config.maxDelay!
        )
      }
    }

    throw lastError!
  }

  static async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T> | T,
    options: {
      onFallback?: (error: Error) => void
      retryPrimary?: RetryOptions
    } = {}
  ): Promise<T> {
    try {
      // Try primary operation with optional retry
      if (options.retryPrimary) {
        return await this.withRetry(primary, options.retryPrimary)
      }
      return await primary()
    } catch (error) {
      // Track fallback usage
      errorTracker.track(error as Error, {
        action: 'fallback_triggered',
        metadata: { fallbackReason: (error as Error).message }
      })

      if (options.onFallback) {
        options.onFallback(error as Error)
      }

      // Use fallback
      return await fallback()
    }
  }

  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    timeoutError?: Error
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          const error = timeoutError || new ApplicationError(
            `Operation timed out after ${timeoutMs}ms`,
            {
              category: ErrorCategory.PERFORMANCE,
              severity: ErrorSeverity.HIGH,
              recoverable: true
            }
          )
          errorTracker.track(error)
          reject(error)
        }, timeoutMs)
      })
    ])
  }

  static async withCircuitBreaker<T>(
    operation: () => Promise<T>,
    options: {
      failureThreshold?: number
      resetTimeout?: number
      onOpen?: () => void
      onClose?: () => void
      onHalfOpen?: () => void
    } = {}
  ): Promise<T> {
    const config = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      ...options
    }

    const breaker = CircuitBreaker.getInstance(operation.name || 'anonymous')
    
    if (breaker.isOpen()) {
      throw new ApplicationError(
        'Circuit breaker is open',
        {
          category: ErrorCategory.SYSTEM,
          severity: ErrorSeverity.HIGH,
          recoverable: false
        }
      )
    }

    try {
      const result = await operation()
      breaker.recordSuccess()
      return result
    } catch (error) {
      breaker.recordFailure()
      
      if (breaker.getFailureCount() >= config.failureThreshold) {
        breaker.open()
        if (config.onOpen) config.onOpen()
        
        // Schedule automatic half-open
        setTimeout(() => {
          breaker.halfOpen()
          if (config.onHalfOpen) config.onHalfOpen()
        }, config.resetTimeout)
      }
      
      throw error
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Circuit Breaker implementation
class CircuitBreaker {
  private static instances = new Map<string, CircuitBreaker>()
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private failureCount = 0
  private successCount = 0
  private lastFailureTime?: number

  static getInstance(name: string): CircuitBreaker {
    if (!this.instances.has(name)) {
      this.instances.set(name, new CircuitBreaker())
    }
    return this.instances.get(name)!
  }

  isOpen(): boolean {
    return this.state === 'open'
  }

  open(): void {
    this.state = 'open'
    this.lastFailureTime = Date.now()
  }

  halfOpen(): void {
    this.state = 'half-open'
    this.failureCount = 0
  }

  close(): void {
    this.state = 'closed'
    this.failureCount = 0
    this.successCount = 0
  }

  recordSuccess(): void {
    this.successCount++
    if (this.state === 'half-open') {
      this.close()
    }
  }

  recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()
  }

  getFailureCount(): number {
    return this.failureCount
  }
}

// Recovery strategies for specific error types
export class RecoveryStrategies {
  static async handleNetworkError<T>(
    operation: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    return ErrorRecovery.withRetry(operation, {
      maxRetries: 5,
      initialDelay: 2000,
      retryCondition: (error) => {
        const message = error.message.toLowerCase()
        return message.includes('network') || 
               message.includes('fetch') ||
               message.includes('offline')
      },
      ...options
    })
  }

  static async handleAPIError<T>(
    operation: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    return ErrorRecovery.withRetry(operation, {
      maxRetries: 3,
      initialDelay: 1000,
      retryCondition: (error) => {
        if (error instanceof ApplicationError && error.category === ErrorCategory.API) {
          const apiError = error as any
          // Retry on 5xx errors and specific 4xx errors
          return apiError.statusCode >= 500 || 
                 apiError.statusCode === 429 || // Rate limit
                 apiError.statusCode === 408    // Timeout
        }
        return false
      },
      ...options
    })
  }

  static async handleAuthError<T>(
    operation: () => Promise<T>,
    refreshToken: () => Promise<void>,
    options?: RetryOptions
  ): Promise<T> {
    return ErrorRecovery.withRetry(operation, {
      maxRetries: 2,
      retryCondition: (error, attempt) => {
        if (error instanceof ApplicationError && 
            error.category === ErrorCategory.AUTHENTICATION &&
            attempt === 1) {
          // Try to refresh token on first retry
          return true
        }
        return false
      },
      onRetry: async (error, attempt) => {
        if (attempt === 1) {
          // Refresh token before retrying
          await refreshToken()
        }
      },
      ...options
    })
  }
}