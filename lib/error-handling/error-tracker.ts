import { 
  TrackedError, 
  ErrorSeverity, 
  ErrorCategory, 
  ErrorContext,
  ErrorMetrics,
  ApplicationError
} from './error-types'
// Simple UUID generator
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export class ErrorTracker {
  private static instance: ErrorTracker
  private errors: Map<string, TrackedError> = new Map()
  private errorQueue: TrackedError[] = []
  private isOnline: boolean = true
  private sessionId: string = generateId()
  private errorListeners: ((error: TrackedError) => void)[] = []
  private metricsInterval: NodeJS.Timeout | null = null

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeClientTracking()
    }
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker()
    }
    return ErrorTracker.instance
  }

  private initializeClientTracking() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true
      this.flushErrorQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })

    // Start metrics collection
    this.startMetricsCollection()
  }

  private startMetricsCollection() {
    // Collect metrics every minute
    this.metricsInterval = setInterval(() => {
      const metrics = this.getMetrics()
      this.logMetrics(metrics)
    }, 60000)
  }

  private stopMetricsCollection() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = null
    }
  }

  track(error: Error | ApplicationError, additionalContext?: Partial<ErrorContext>): string {
    const errorId = generateId()
    const now = new Date().toISOString()

    // Determine error properties
    const isAppError = error instanceof ApplicationError
    const severity = isAppError ? error.severity : this.determineSeverity(error)
    const category = isAppError ? error.category : this.determineCategory(error)

    // Create error context
    const context: ErrorContext = {
      sessionId: this.sessionId,
      timestamp: now,
      environment: this.getEnvironment(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ...additionalContext
    }

    // Create or update tracked error
    const errorKey = this.generateErrorKey(error)
    const existingError = this.errors.get(errorKey)

    if (existingError) {
      existingError.count++
      existingError.lastOccurrence = now
    } else {
      const trackedError: TrackedError = {
        id: errorId,
        message: error.message,
        stack: error.stack,
        code: isAppError ? error.code : undefined,
        severity,
        category,
        context,
        count: 1,
        firstOccurrence: now,
        lastOccurrence: now,
        resolved: false,
        tags: this.generateTags(error)
      }

      this.errors.set(errorKey, trackedError)
      
      // Notify listeners
      this.notifyListeners(trackedError)

      // Queue for server logging
      this.queueError(trackedError)
    }

    return errorId
  }

  private generateErrorKey(error: Error): string {
    // Create a unique key based on error message and stack trace
    const stackLine = error.stack?.split('\n')[1]?.trim() || ''
    return `${error.message}::${stackLine}`
  }

  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase()
    
    if (message.includes('critical') || message.includes('fatal')) {
      return ErrorSeverity.CRITICAL
    }
    if (message.includes('error') || message.includes('failed')) {
      return ErrorSeverity.HIGH
    }
    if (message.includes('warning') || message.includes('deprecated')) {
      return ErrorSeverity.MEDIUM
    }
    
    return ErrorSeverity.LOW
  }

  private determineCategory(error: Error): ErrorCategory {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''
    
    if (message.includes('network') || message.includes('fetch') || message.includes('request')) {
      return ErrorCategory.NETWORK
    }
    if (message.includes('api') || message.includes('endpoint')) {
      return ErrorCategory.API
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION
    }
    if (message.includes('auth') || message.includes('token') || message.includes('login')) {
      return ErrorCategory.AUTHENTICATION
    }
    if (message.includes('permission') || message.includes('forbidden') || message.includes('unauthorized')) {
      return ErrorCategory.PERMISSION
    }
    if (stack.includes('react') || stack.includes('component')) {
      return ErrorCategory.UI
    }
    if (message.includes('performance') || message.includes('timeout') || message.includes('slow')) {
      return ErrorCategory.PERFORMANCE
    }
    
    return ErrorCategory.UNKNOWN
  }

  private generateTags(error: Error): string[] {
    const tags: string[] = []
    const message = error.message.toLowerCase()
    
    if (message.includes('meta')) tags.push('meta-api')
    if (message.includes('token')) tags.push('authentication')
    if (message.includes('chunk')) tags.push('code-splitting')
    if (message.includes('hydration')) tags.push('ssr')
    if (message.includes('timeout')) tags.push('performance')
    
    return tags
  }

  private getEnvironment(): 'development' | 'staging' | 'production' {
    if (typeof process !== 'undefined' && process.env.NODE_ENV) {
      return process.env.NODE_ENV as any
    }
    return 'production'
  }

  private queueError(error: TrackedError) {
    this.errorQueue.push(error)
    
    if (this.isOnline) {
      this.flushErrorQueue()
    } else {
      // Store in localStorage for persistence
      this.persistErrorQueue()
    }
  }

  private async flushErrorQueue() {
    if (this.errorQueue.length === 0) return

    const errors = [...this.errorQueue]
    this.errorQueue = []

    try {
      const response = await fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors, batch: true })
      })

      if (!response.ok) {
        // Re-queue errors if logging failed
        this.errorQueue.unshift(...errors)
        this.persistErrorQueue()
      }
    } catch (error) {
      // Re-queue errors if network failed
      this.errorQueue.unshift(...errors)
      this.persistErrorQueue()
    }
  }

  private persistErrorQueue() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('error_queue', JSON.stringify(this.errorQueue))
      } catch (e) {
        console.error('Failed to persist error queue:', e)
      }
    }
  }

  private loadPersistedErrors() {
    if (typeof localStorage !== 'undefined') {
      try {
        const persisted = localStorage.getItem('error_queue')
        if (persisted) {
          this.errorQueue = JSON.parse(persisted)
          localStorage.removeItem('error_queue')
        }
      } catch (e) {
        console.error('Failed to load persisted errors:', e)
      }
    }
  }

  addListener(listener: (error: TrackedError) => void) {
    this.errorListeners.push(listener)
  }

  removeListener(listener: (error: TrackedError) => void) {
    this.errorListeners = this.errorListeners.filter(l => l !== listener)
  }

  private notifyListeners(error: TrackedError) {
    this.errorListeners.forEach(listener => {
      try {
        listener(error)
      } catch (e) {
        console.error('Error in error listener:', e)
      }
    })
  }

  getMetrics(): ErrorMetrics {
    const errors = Array.from(this.errors.values())
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    // Calculate error rate (errors per minute)
    const recentErrors = errors.filter(e => 
      new Date(e.lastOccurrence).getTime() > oneMinuteAgo
    )

    // Group by category and severity
    const errorsByCategory = errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + error.count
      return acc
    }, {} as Record<ErrorCategory, number>)

    const errorsBySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + error.count
      return acc
    }, {} as Record<ErrorSeverity, number>)

    // Get top errors by count
    const topErrors = [...errors]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalErrors: errors.reduce((sum, e) => sum + e.count, 0),
      errorsByCategory,
      errorsBySeverity,
      errorRate: recentErrors.length,
      topErrors,
      recentErrors: recentErrors.slice(0, 10)
    }
  }

  private async logMetrics(metrics: ErrorMetrics) {
    try {
      await fetch('/api/error-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId
        })
      })
    } catch (error) {
      console.error('Failed to log error metrics:', error)
    }
  }

  resolveError(errorId: string, resolvedBy?: string) {
    const error = Array.from(this.errors.values()).find(e => e.id === errorId)
    if (error) {
      error.resolved = true
      error.resolvedAt = new Date().toISOString()
      error.resolvedBy = resolvedBy
    }
  }

  clearErrors() {
    this.errors.clear()
    this.errorQueue = []
    this.persistErrorQueue()
  }

  destroy() {
    this.stopMetricsCollection()
    this.errorListeners = []
    this.clearErrors()
  }
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance()