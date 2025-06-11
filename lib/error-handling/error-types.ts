// Error types and severity levels for comprehensive error tracking

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  API = 'api',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  UI = 'ui',
  PERFORMANCE = 'performance',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  userId?: string
  sessionId?: string
  component?: string
  action?: string
  url?: string
  userAgent?: string
  timestamp: string
  environment: 'development' | 'staging' | 'production'
  metadata?: Record<string, any>
}

export interface TrackedError {
  id: string
  message: string
  stack?: string
  code?: string
  severity: ErrorSeverity
  category: ErrorCategory
  context: ErrorContext
  count: number
  firstOccurrence: string
  lastOccurrence: string
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  tags?: string[]
}

export interface ErrorMetrics {
  totalErrors: number
  errorsByCategory: Record<ErrorCategory, number>
  errorsBySeverity: Record<ErrorSeverity, number>
  errorRate: number // errors per minute
  topErrors: TrackedError[]
  recentErrors: TrackedError[]
}

export interface ErrorRecoveryStrategy {
  maxRetries: number
  retryDelay: number
  backoffMultiplier: number
  shouldRetry: (error: Error, attemptNumber: number) => boolean
  onRetry?: (error: Error, attemptNumber: number) => void
  onMaxRetriesExceeded?: (error: Error) => void
}

export class ApplicationError extends Error {
  public readonly severity: ErrorSeverity
  public readonly category: ErrorCategory
  public readonly code?: string
  public readonly context?: Partial<ErrorContext>
  public readonly recoverable: boolean

  constructor(
    message: string,
    options: {
      severity?: ErrorSeverity
      category?: ErrorCategory
      code?: string
      context?: Partial<ErrorContext>
      recoverable?: boolean
      cause?: Error
    } = {}
  ) {
    super(message)
    this.name = 'ApplicationError'
    this.severity = options.severity || ErrorSeverity.MEDIUM
    this.category = options.category || ErrorCategory.UNKNOWN
    this.code = options.code
    this.context = options.context
    this.recoverable = options.recoverable ?? true
    
    if (options.cause) {
      this.cause = options.cause
    }

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplicationError)
    }
  }
}

// Specific error types
export class NetworkError extends ApplicationError {
  constructor(message: string, options?: Partial<ApplicationError>) {
    super(message, {
      ...options,
      category: ErrorCategory.NETWORK,
      severity: options?.severity || ErrorSeverity.MEDIUM
    })
    this.name = 'NetworkError'
  }
}

export class APIError extends ApplicationError {
  public readonly statusCode?: number
  public readonly endpoint?: string

  constructor(
    message: string,
    statusCode?: number,
    endpoint?: string,
    options?: Partial<ApplicationError>
  ) {
    super(message, {
      ...options,
      category: ErrorCategory.API,
      severity: statusCode && statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM
    })
    this.name = 'APIError'
    this.statusCode = statusCode
    this.endpoint = endpoint
  }
}

export class ValidationError extends ApplicationError {
  public readonly field?: string
  public readonly value?: any

  constructor(
    message: string,
    field?: string,
    value?: any,
    options?: Partial<ApplicationError>
  ) {
    super(message, {
      ...options,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      recoverable: true
    })
    this.name = 'ValidationError'
    this.field = field
    this.value = value
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string, options?: Partial<ApplicationError>) {
    super(message, {
      ...options,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      recoverable: true
    })
    this.name = 'AuthenticationError'
  }
}

export class PermissionError extends ApplicationError {
  public readonly resource?: string
  public readonly action?: string

  constructor(
    message: string,
    resource?: string,
    action?: string,
    options?: Partial<ApplicationError>
  ) {
    super(message, {
      ...options,
      category: ErrorCategory.PERMISSION,
      severity: ErrorSeverity.MEDIUM,
      recoverable: false
    })
    this.name = 'PermissionError'
    this.resource = resource
    this.action = action
  }
}