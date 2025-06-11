// Storage performance analytics and monitoring system
import { z } from 'zod'
import { AgentNamespace, StorageOperation } from './unified-storage-manager'
import { SafeStorage } from '../storage-utils'

// Performance metric types
export interface PerformanceMetric {
  timestamp: number
  operation: StorageOperation
  namespace: AgentNamespace
  key: string
  duration: number
  size: number
  success: boolean
  error?: string
  cacheHit?: boolean
  compressionRatio?: number
  encryptionTime?: number
}

export interface AggregatedMetrics {
  totalOperations: number
  successRate: number
  averageLatency: number
  medianLatency: number
  p95Latency: number
  p99Latency: number
  throughput: number // operations per second
  errorRate: number
  cacheHitRate: number
  compressionSavings: number
  storageEfficiency: number
}

export interface NamespaceMetrics extends AggregatedMetrics {
  namespace: AgentNamespace
  operationBreakdown: Record<StorageOperation, AggregatedMetrics>
  hotKeys: Array<{
    key: string
    accessCount: number
    totalLatency: number
    averageLatency: number
  }>
  errors: Array<{
    error: string
    count: number
    lastOccurrence: number
  }>
}

export interface SystemMetrics {
  overall: AggregatedMetrics
  byNamespace: Record<AgentNamespace, NamespaceMetrics>
  quotaUsage: {
    localStorage: { used: number; limit: number; percentage: number }
    sessionStorage: { used: number; limit: number; percentage: number }
    indexedDB: { used: number; limit: number; percentage: number }
    memory: { used: number; limit: number; percentage: number }
  }
  health: {
    score: number // 0-100
    issues: string[]
    recommendations: string[]
  }
  trends: {
    latencyTrend: 'improving' | 'stable' | 'degrading'
    throughputTrend: 'improving' | 'stable' | 'degrading'
    errorTrend: 'improving' | 'stable' | 'degrading'
  }
}

// Alert configuration
const AlertConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  condition: z.object({
    metric: z.enum(['latency', 'errorRate', 'throughput', 'cacheHitRate', 'quotaUsage']),
    operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq']),
    threshold: z.number(),
    duration: z.number().optional() // Time window in ms
  }),
  namespace: z.nativeEnum(AgentNamespace).optional(),
  cooldown: z.number().default(5 * 60 * 1000), // 5 minutes
  actions: z.array(z.enum(['log', 'notify', 'cleanup', 'backup'])).default(['log'])
})

export type AlertConfig = z.infer<typeof AlertConfigSchema>

export interface Alert {
  id: string
  config: AlertConfig
  triggered: number
  resolved?: number
  message: string
  value: number
  metadata?: Record<string, any>
}

export class StoragePerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private alerts = new Map<string, AlertConfig>()
  private activeAlerts = new Map<string, Alert>()
  private lastAlertTime = new Map<string, number>()
  
  private readonly MAX_METRICS = 10000
  private readonly STORAGE_KEY = '_performance_metrics'
  private readonly ALERTS_KEY = '_performance_alerts'
  private readonly BATCH_SIZE = 100
  
  private metricsBuffer: PerformanceMetric[] = []
  private flushTimer?: NodeJS.Timeout
  private analysisTimer?: NodeJS.Timeout

  constructor() {
    this.loadMetrics()
    this.loadAlerts()
    this.startPeriodicAnalysis()
  }

  // Metric recording
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now()
    }

    this.metricsBuffer.push(fullMetric)

    // Flush buffer when it reaches batch size
    if (this.metricsBuffer.length >= this.BATCH_SIZE) {
      this.flushMetrics()
    }
  }

  recordOperation(
    operation: StorageOperation,
    namespace: AgentNamespace,
    key: string,
    startTime: number,
    success: boolean,
    options: {
      size?: number
      error?: string
      cacheHit?: boolean
      compressionRatio?: number
      encryptionTime?: number
    } = {}
  ): void {
    this.recordMetric({
      operation,
      namespace,
      key,
      duration: Date.now() - startTime,
      size: options.size || 0,
      success,
      error: options.error,
      cacheHit: options.cacheHit,
      compressionRatio: options.compressionRatio,
      encryptionTime: options.encryptionTime
    })
  }

  private flushMetrics(): void {
    if (this.metricsBuffer.length === 0) return

    // Add to main metrics array
    this.metrics.push(...this.metricsBuffer)
    this.metricsBuffer = []

    // Trim metrics if exceeding limit
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }

    // Schedule delayed save to avoid frequent I/O
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
    }
    
    this.flushTimer = setTimeout(() => {
      this.saveMetrics()
    }, 5000) // Save after 5 seconds of inactivity
  }

  // Analytics and aggregation
  getSystemMetrics(timeWindow?: number): SystemMetrics {
    const now = Date.now()
    const windowStart = timeWindow ? now - timeWindow : 0
    
    const filteredMetrics = this.metrics.filter(m => m.timestamp >= windowStart)
    
    // Calculate overall metrics
    const overall = this.calculateAggregatedMetrics(filteredMetrics)
    
    // Calculate per-namespace metrics
    const byNamespace: Record<AgentNamespace, NamespaceMetrics> = {} as any
    
    for (const namespace of Object.values(AgentNamespace)) {
      const namespaceMetrics = filteredMetrics.filter(m => m.namespace === namespace)
      if (namespaceMetrics.length > 0) {
        byNamespace[namespace] = this.calculateNamespaceMetrics(namespace, namespaceMetrics)
      }
    }

    // Calculate quota usage
    const quotaUsage = this.calculateQuotaUsage()

    // Calculate health score
    const health = this.calculateHealthScore(overall, quotaUsage)

    // Calculate trends
    const trends = this.calculateTrends(filteredMetrics)

    return {
      overall,
      byNamespace,
      quotaUsage,
      health,
      trends
    }
  }

  private calculateAggregatedMetrics(metrics: PerformanceMetric[]): AggregatedMetrics {
    if (metrics.length === 0) {
      return {
        totalOperations: 0,
        successRate: 0,
        averageLatency: 0,
        medianLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        throughput: 0,
        errorRate: 0,
        cacheHitRate: 0,
        compressionSavings: 0,
        storageEfficiency: 0
      }
    }

    const totalOperations = metrics.length
    const successfulOperations = metrics.filter(m => m.success).length
    const successRate = successfulOperations / totalOperations

    // Latency calculations
    const latencies = metrics.map(m => m.duration).sort((a, b) => a - b)
    const averageLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
    const medianLatency = latencies[Math.floor(latencies.length / 2)]
    const p95Latency = latencies[Math.floor(latencies.length * 0.95)]
    const p99Latency = latencies[Math.floor(latencies.length * 0.99)]

    // Throughput (operations per second)
    const timeSpan = metrics[metrics.length - 1].timestamp - metrics[0].timestamp
    const throughput = timeSpan > 0 ? (totalOperations / timeSpan) * 1000 : 0

    // Error rate
    const errorRate = 1 - successRate

    // Cache hit rate
    const cacheMetrics = metrics.filter(m => m.cacheHit !== undefined)
    const cacheHitRate = cacheMetrics.length > 0 
      ? cacheMetrics.filter(m => m.cacheHit).length / cacheMetrics.length 
      : 0

    // Compression savings
    const compressionMetrics = metrics.filter(m => m.compressionRatio !== undefined)
    const compressionSavings = compressionMetrics.length > 0
      ? compressionMetrics.reduce((sum, m) => sum + (m.compressionRatio! - 1), 0) / compressionMetrics.length
      : 0

    // Storage efficiency (inverse of average size per operation)
    const totalSize = metrics.reduce((sum, m) => sum + m.size, 0)
    const storageEfficiency = totalSize > 0 ? totalOperations / totalSize : 0

    return {
      totalOperations,
      successRate,
      averageLatency,
      medianLatency,
      p95Latency,
      p99Latency,
      throughput,
      errorRate,
      cacheHitRate,
      compressionSavings,
      storageEfficiency
    }
  }

  private calculateNamespaceMetrics(
    namespace: AgentNamespace,
    metrics: PerformanceMetric[]
  ): NamespaceMetrics {
    const base = this.calculateAggregatedMetrics(metrics)

    // Operation breakdown
    const operationBreakdown: Record<StorageOperation, AggregatedMetrics> = {} as any
    for (const operation of Object.values(StorageOperation)) {
      const opMetrics = metrics.filter(m => m.operation === operation)
      operationBreakdown[operation] = this.calculateAggregatedMetrics(opMetrics)
    }

    // Hot keys analysis
    const keyStats = new Map<string, { count: number; totalLatency: number }>()
    for (const metric of metrics) {
      const existing = keyStats.get(metric.key) || { count: 0, totalLatency: 0 }
      existing.count++
      existing.totalLatency += metric.duration
      keyStats.set(metric.key, existing)
    }

    const hotKeys = Array.from(keyStats.entries())
      .map(([key, stats]) => ({
        key,
        accessCount: stats.count,
        totalLatency: stats.totalLatency,
        averageLatency: stats.totalLatency / stats.count
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10) // Top 10 hot keys

    // Error analysis
    const errorStats = new Map<string, { count: number; lastOccurrence: number }>()
    for (const metric of metrics.filter(m => !m.success && m.error)) {
      const error = metric.error!
      const existing = errorStats.get(error) || { count: 0, lastOccurrence: 0 }
      existing.count++
      existing.lastOccurrence = Math.max(existing.lastOccurrence, metric.timestamp)
      errorStats.set(error, existing)
    }

    const errors = Array.from(errorStats.entries())
      .map(([error, stats]) => ({
        error,
        count: stats.count,
        lastOccurrence: stats.lastOccurrence
      }))
      .sort((a, b) => b.count - a.count)

    return {
      namespace,
      ...base,
      operationBreakdown,
      hotKeys,
      errors
    }
  }

  private calculateQuotaUsage() {
    const localStorageInfo = SafeStorage.getStorageInfo()
    const sessionStorageInfo = SafeStorage.getStorageInfo(true)

    // Estimate IndexedDB usage (would need actual implementation)
    const indexedDBEstimate = { used: 0, quota: 100 * 1024 * 1024 } // 100MB default

    // Memory usage estimation
    const memoryEstimate = { used: 0, quota: 50 * 1024 * 1024 } // 50MB default

    return {
      localStorage: {
        used: localStorageInfo.used,
        limit: localStorageInfo.total || 10 * 1024 * 1024, // 10MB default
        percentage: localStorageInfo.total 
          ? (localStorageInfo.used / localStorageInfo.total) * 100 
          : 0
      },
      sessionStorage: {
        used: sessionStorageInfo.used,
        limit: sessionStorageInfo.total || 5 * 1024 * 1024, // 5MB default
        percentage: sessionStorageInfo.total 
          ? (sessionStorageInfo.used / sessionStorageInfo.total) * 100 
          : 0
      },
      indexedDB: {
        used: indexedDBEstimate.used,
        limit: indexedDBEstimate.quota,
        percentage: (indexedDBEstimate.used / indexedDBEstimate.quota) * 100
      },
      memory: {
        used: memoryEstimate.used,
        limit: memoryEstimate.quota,
        percentage: (memoryEstimate.used / memoryEstimate.quota) * 100
      }
    }
  }

  private calculateHealthScore(
    metrics: AggregatedMetrics,
    quotaUsage: SystemMetrics['quotaUsage']
  ): SystemMetrics['health'] {
    let score = 100
    const issues: string[] = []
    const recommendations: string[] = []

    // Deduct points for high error rate
    if (metrics.errorRate > 0.1) { // 10% error rate
      score -= 30
      issues.push('High error rate detected')
      recommendations.push('Investigate and fix error sources')
    } else if (metrics.errorRate > 0.05) { // 5% error rate
      score -= 15
      issues.push('Moderate error rate detected')
    }

    // Deduct points for high latency
    if (metrics.p95Latency > 1000) { // 1 second
      score -= 25
      issues.push('High latency detected')
      recommendations.push('Optimize storage operations and consider caching')
    } else if (metrics.p95Latency > 500) { // 500ms
      score -= 10
      issues.push('Moderate latency detected')
    }

    // Deduct points for low cache hit rate
    if (metrics.cacheHitRate < 0.7) { // 70% cache hit rate
      score -= 20
      issues.push('Low cache hit rate')
      recommendations.push('Review caching strategy and TTL settings')
    }

    // Deduct points for high quota usage
    const maxQuotaUsage = Math.max(
      quotaUsage.localStorage.percentage,
      quotaUsage.sessionStorage.percentage,
      quotaUsage.indexedDB.percentage
    )

    if (maxQuotaUsage > 90) {
      score -= 30
      issues.push('Storage quota near limit')
      recommendations.push('Run cleanup operations and review retention policies')
    } else if (maxQuotaUsage > 75) {
      score -= 15
      issues.push('High storage usage')
      recommendations.push('Consider cleanup operations')
    }

    // Deduct points for low throughput
    if (metrics.throughput < 10) { // 10 ops/sec
      score -= 15
      issues.push('Low throughput detected')
      recommendations.push('Consider batch operations and performance optimization')
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    }
  }

  private calculateTrends(metrics: PerformanceMetric[]): SystemMetrics['trends'] {
    if (metrics.length < 100) {
      return {
        latencyTrend: 'stable',
        throughputTrend: 'stable',
        errorTrend: 'stable'
      }
    }

    // Split metrics into two halves for trend comparison
    const mid = Math.floor(metrics.length / 2)
    const firstHalf = metrics.slice(0, mid)
    const secondHalf = metrics.slice(mid)

    const firstMetrics = this.calculateAggregatedMetrics(firstHalf)
    const secondMetrics = this.calculateAggregatedMetrics(secondHalf)

    // Calculate trend directions
    const latencyChange = (secondMetrics.averageLatency - firstMetrics.averageLatency) / firstMetrics.averageLatency
    const throughputChange = (secondMetrics.throughput - firstMetrics.throughput) / firstMetrics.throughput
    const errorChange = (secondMetrics.errorRate - firstMetrics.errorRate) / (firstMetrics.errorRate || 0.01)

    const getTrend = (change: number): 'improving' | 'stable' | 'degrading' => {
      if (Math.abs(change) < 0.1) return 'stable' // Less than 10% change
      return change < 0 ? 'improving' : 'degrading'
    }

    return {
      latencyTrend: getTrend(latencyChange),
      throughputTrend: getTrend(-throughputChange), // Higher throughput is better
      errorTrend: getTrend(errorChange)
    }
  }

  // Alert management
  addAlert(config: AlertConfig): void {
    const validated = AlertConfigSchema.parse(config)
    this.alerts.set(validated.id, validated)
    this.saveAlerts()
  }

  removeAlert(id: string): void {
    this.alerts.delete(id)
    this.activeAlerts.delete(id)
    this.lastAlertTime.delete(id)
    this.saveAlerts()
  }

  getAlerts(): AlertConfig[] {
    return Array.from(this.alerts.values())
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
  }

  private checkAlerts(systemMetrics: SystemMetrics): void {
    const now = Date.now()

    for (const [alertId, config] of this.alerts.entries()) {
      if (!config.enabled) continue

      // Check cooldown
      const lastAlert = this.lastAlertTime.get(alertId)
      if (lastAlert && now - lastAlert < config.cooldown) continue

      // Get relevant metrics
      const metrics = config.namespace 
        ? systemMetrics.byNamespace[config.namespace]
        : systemMetrics.overall

      if (!metrics) continue

      // Check condition
      const value = this.getMetricValue(metrics, config.condition.metric)
      const conditionMet = this.evaluateCondition(value, config.condition.operator, config.condition.threshold)

      if (conditionMet) {
        this.triggerAlert(alertId, config, value, systemMetrics)
      } else {
        // Resolve alert if it was active
        const activeAlert = this.activeAlerts.get(alertId)
        if (activeAlert) {
          activeAlert.resolved = now
          this.activeAlerts.delete(alertId)
        }
      }
    }
  }

  private getMetricValue(metrics: AggregatedMetrics | NamespaceMetrics, metric: string): number {
    switch (metric) {
      case 'latency': return metrics.averageLatency
      case 'errorRate': return metrics.errorRate
      case 'throughput': return metrics.throughput
      case 'cacheHitRate': return metrics.cacheHitRate
      default: return 0
    }
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold
      case 'gte': return value >= threshold
      case 'lt': return value < threshold
      case 'lte': return value <= threshold
      case 'eq': return value === threshold
      default: return false
    }
  }

  private triggerAlert(
    alertId: string,
    config: AlertConfig,
    value: number,
    systemMetrics: SystemMetrics
  ): void {
    const now = Date.now()
    
    const alert: Alert = {
      id: `${alertId}_${now}`,
      config,
      triggered: now,
      message: this.generateAlertMessage(config, value),
      value,
      metadata: {
        systemHealth: systemMetrics.health.score,
        namespace: config.namespace
      }
    }

    this.activeAlerts.set(alertId, alert)
    this.lastAlertTime.set(alertId, now)

    // Execute alert actions
    this.executeAlertActions(alert, config.actions)
  }

  private generateAlertMessage(config: AlertConfig, value: number): string {
    const metricNames = {
      latency: 'Average Latency',
      errorRate: 'Error Rate',
      throughput: 'Throughput',
      cacheHitRate: 'Cache Hit Rate',
      quotaUsage: 'Quota Usage'
    }

    const metricName = metricNames[config.condition.metric as keyof typeof metricNames] || config.condition.metric
    const namespaceText = config.namespace ? ` in ${config.namespace}` : ''
    
    return `${metricName}${namespaceText} is ${value.toFixed(2)} (threshold: ${config.condition.threshold})`
  }

  private executeAlertActions(alert: Alert, actions: string[]): void {
    for (const action of actions) {
      switch (action) {
        case 'log':
          console.warn(`Storage Alert: ${alert.message}`)
          break
        case 'notify':
          // Could integrate with notification system
          this.notifyUser(alert)
          break
        case 'cleanup':
          // Could trigger automatic cleanup
          this.triggerCleanup(alert)
          break
        case 'backup':
          // Could trigger emergency backup
          this.triggerBackup(alert)
          break
      }
    }
  }

  private notifyUser(alert: Alert): void {
    // Placeholder for user notification system integration
    console.log('User notification:', alert.message)
  }

  private triggerCleanup(alert: Alert): void {
    // Placeholder for automatic cleanup trigger
    console.log('Triggering cleanup due to alert:', alert.message)
  }

  private triggerBackup(alert: Alert): void {
    // Placeholder for backup trigger
    console.log('Triggering backup due to alert:', alert.message)
  }

  // Periodic analysis
  private startPeriodicAnalysis(): void {
    this.analysisTimer = setInterval(() => {
      try {
        this.flushMetrics()
        
        const systemMetrics = this.getSystemMetrics(60 * 60 * 1000) // Last hour
        this.checkAlerts(systemMetrics)
        
        // Log health score periodically
        if (systemMetrics.health.score < 80) {
          console.warn(`Storage health score: ${systemMetrics.health.score}/100`)
          if (systemMetrics.health.issues.length > 0) {
            console.warn('Issues:', systemMetrics.health.issues)
          }
        }
      } catch (error) {
        console.error('Error in periodic analysis:', error)
      }
    }, 60000) // Every minute
  }

  // Data management
  getMetricsSummary(timeWindow?: number): {
    totalMetrics: number
    timeRange: { start: number; end: number }
    namespaceDistribution: Record<AgentNamespace, number>
    operationDistribution: Record<StorageOperation, number>
  } {
    const now = Date.now()
    const windowStart = timeWindow ? now - timeWindow : 0
    const filteredMetrics = this.metrics.filter(m => m.timestamp >= windowStart)

    const namespaceDistribution: Record<AgentNamespace, number> = {} as any
    const operationDistribution: Record<StorageOperation, number> = {} as any

    for (const metric of filteredMetrics) {
      namespaceDistribution[metric.namespace] = (namespaceDistribution[metric.namespace] || 0) + 1
      operationDistribution[metric.operation] = (operationDistribution[metric.operation] || 0) + 1
    }

    return {
      totalMetrics: filteredMetrics.length,
      timeRange: {
        start: filteredMetrics.length > 0 ? filteredMetrics[0].timestamp : now,
        end: filteredMetrics.length > 0 ? filteredMetrics[filteredMetrics.length - 1].timestamp : now
      },
      namespaceDistribution,
      operationDistribution
    }
  }

  clearMetrics(olderThan?: number): number {
    const cutoff = olderThan || (Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days
    const initialLength = this.metrics.length
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
    this.saveMetrics()
    return initialLength - this.metrics.length
  }

  exportMetrics(timeWindow?: number): Blob {
    const now = Date.now()
    const windowStart = timeWindow ? now - timeWindow : 0
    const filteredMetrics = this.metrics.filter(m => m.timestamp >= windowStart)
    
    const data = {
      exportTimestamp: now,
      timeWindow,
      metrics: filteredMetrics,
      summary: this.getMetricsSummary(timeWindow),
      systemMetrics: this.getSystemMetrics(timeWindow)
    }

    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  }

  // Persistence
  private loadMetrics(): void {
    try {
      const stored = SafeStorage.getItem<PerformanceMetric[]>(this.STORAGE_KEY)
      if (stored && Array.isArray(stored)) {
        this.metrics = stored
      }
    } catch (error) {
      console.warn('Failed to load performance metrics:', error)
    }
  }

  private saveMetrics(): void {
    try {
      SafeStorage.setItem(this.STORAGE_KEY, this.metrics)
    } catch (error) {
      console.warn('Failed to save performance metrics:', error)
    }
  }

  private loadAlerts(): void {
    try {
      const stored = SafeStorage.getItem<AlertConfig[]>(this.ALERTS_KEY)
      if (stored && Array.isArray(stored)) {
        for (const config of stored) {
          this.alerts.set(config.id, config)
        }
      }
    } catch (error) {
      console.warn('Failed to load alert configs:', error)
    }
  }

  private saveAlerts(): void {
    try {
      const configs = Array.from(this.alerts.values())
      SafeStorage.setItem(this.ALERTS_KEY, configs)
    } catch (error) {
      console.warn('Failed to save alert configs:', error)
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
    }
    
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer)
    }

    // Final flush
    this.flushMetrics()
  }
}

// Common alert configurations
export class CommonAlerts {
  static createHighLatencyAlert(): AlertConfig {
    return {
      id: 'high_latency',
      name: 'High Latency Alert',
      description: 'Triggers when average latency exceeds 500ms',
      severity: 'high',
      condition: {
        metric: 'latency',
        operator: 'gt',
        threshold: 500
      },
      cooldown: 10 * 60 * 1000, // 10 minutes
      actions: ['log', 'notify']
    }
  }

  static createHighErrorRateAlert(): AlertConfig {
    return {
      id: 'high_error_rate',
      name: 'High Error Rate Alert',
      description: 'Triggers when error rate exceeds 10%',
      severity: 'critical',
      condition: {
        metric: 'errorRate',
        operator: 'gt',
        threshold: 0.1
      },
      cooldown: 5 * 60 * 1000, // 5 minutes
      actions: ['log', 'notify', 'backup']
    }
  }

  static createLowCacheHitRateAlert(): AlertConfig {
    return {
      id: 'low_cache_hit_rate',
      name: 'Low Cache Hit Rate Alert',
      description: 'Triggers when cache hit rate falls below 70%',
      severity: 'medium',
      condition: {
        metric: 'cacheHitRate',
        operator: 'lt',
        threshold: 0.7
      },
      cooldown: 30 * 60 * 1000, // 30 minutes
      actions: ['log']
    }
  }

  static createLowThroughputAlert(): AlertConfig {
    return {
      id: 'low_throughput',
      name: 'Low Throughput Alert',
      description: 'Triggers when throughput falls below 5 ops/sec',
      severity: 'medium',
      condition: {
        metric: 'throughput',
        operator: 'lt',
        threshold: 5
      },
      cooldown: 15 * 60 * 1000, // 15 minutes
      actions: ['log', 'cleanup']
    }
  }
}