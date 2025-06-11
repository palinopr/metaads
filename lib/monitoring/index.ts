/**
 * Meta Ads Dashboard - Comprehensive Monitoring & Observability System
 * 
 * This module provides a complete monitoring and observability solution including:
 * - Application performance monitoring (APM)
 * - Real-time system health dashboards
 * - Distributed tracing and performance monitoring
 * - Alerting and notification systems
 * - Business metrics and KPI tracking
 * - User behavior analytics
 * - Error tracking and debugging tools
 * - Capacity planning and scaling alerts
 * - Security monitoring and threat detection
 * - SLA monitoring and reporting
 */

export * from './metrics-collector'
export * from './health-checker'
export * from './error-tracker'
export * from './alert-manager'
export * from './trace-manager'
export * from './analytics-tracker'
export * from './security-monitor'
export * from './sla-monitor'
export * from './capacity-monitor'
export * from './dashboard-aggregator'

// Core monitoring types
export interface MonitoringConfig {
  enabled: boolean
  sampleRate: number
  environment: 'development' | 'staging' | 'production'
  endpoints: {
    metrics: string
    traces: string
    logs: string
    alerts: string
  }
  integrations: {
    sentry?: { dsn: string }
    datadog?: { apiKey: string }
    slack?: { webhook: string }
    email?: { apiKey: string }
  }
}

export interface SystemMetric {
  name: string
  value: number | string
  timestamp: Date
  tags: Record<string, string>
  type: 'counter' | 'gauge' | 'histogram' | 'timer' | 'set'
  unit?: string
  description?: string
}

export interface AlertRule {
  id: string
  name: string
  condition: string
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  cooldown: number
  enabled: boolean
  channels: string[]
}

export interface TraceSpan {
  id: string
  traceId: string
  parentId?: string
  operationName: string
  startTime: number
  endTime?: number
  duration?: number
  tags: Record<string, any>
  logs: Array<{ timestamp: number; fields: Record<string, any> }>
  status: 'ok' | 'error' | 'timeout'
}

// Global monitoring instance
let monitoringInstance: MonitoringManager | null = null

export class MonitoringManager {
  private config: MonitoringConfig
  private isInitialized = false
  
  constructor(config: MonitoringConfig) {
    this.config = config
  }

  static getInstance(config?: MonitoringConfig): MonitoringManager {
    if (!monitoringInstance && config) {
      monitoringInstance = new MonitoringManager(config)
    }
    return monitoringInstance!
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log('Initializing Meta Ads Dashboard Monitoring System...')
    
    // Initialize all monitoring components
    // Implementation will be added in subsequent files
    
    this.isInitialized = true
    console.log('Monitoring system initialized successfully')
  }

  getConfig(): MonitoringConfig {
    return this.config
  }

  updateConfig(updates: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  isEnabled(): boolean {
    return this.config.enabled && this.isInitialized
  }
}

// Default configuration
export const defaultMonitoringConfig: MonitoringConfig = {
  enabled: process.env.NODE_ENV === 'production',
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: (process.env.NODE_ENV as any) || 'development',
  endpoints: {
    metrics: '/api/monitoring/metrics',
    traces: '/api/monitoring/traces',
    logs: '/api/monitoring/logs',
    alerts: '/api/monitoring/alerts'
  },
  integrations: {
    sentry: process.env.NEXT_PUBLIC_SENTRY_DSN ? { dsn: process.env.NEXT_PUBLIC_SENTRY_DSN } : undefined,
    slack: process.env.SLACK_WEBHOOK_URL ? { webhook: process.env.SLACK_WEBHOOK_URL } : undefined
  }
}