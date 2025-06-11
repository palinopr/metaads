// localStorage usage optimization and quota management
import { z } from 'zod'
import { AgentNamespace } from './unified-storage-manager'
import { SafeStorage } from '../storage-utils'

// Quota configuration schema
const QuotaConfigSchema = z.object({
  globalLimit: z.number().positive().default(10 * 1024 * 1024), // 10MB default
  warningThreshold: z.number().min(0).max(1).default(0.8), // 80%
  criticalThreshold: z.number().min(0).max(1).default(0.95), // 95%
  namespaceQuotas: z.record(z.nativeEnum(AgentNamespace), z.number().positive()).optional(),
  cleanupStrategy: z.enum(['lru', 'size', 'age', 'priority']).default('lru'),
  autoCleanup: z.boolean().default(true),
  compressionThreshold: z.number().positive().default(1024), // 1KB
  enforceQuotas: z.boolean().default(true)
})

export type QuotaConfig = z.infer<typeof QuotaConfigSchema>

// Usage statistics
export interface UsageStats {
  namespace: AgentNamespace
  totalSize: number
  itemCount: number
  averageItemSize: number
  oldestItem: number
  newestItem: number
  totalAccesses: number
  lastAccessed: number
  compressionRatio: number
  priority: number
}

// Quota status
export interface QuotaStatus {
  globalUsage: {
    used: number
    limit: number
    percentage: number
    available: number
  }
  namespaceUsage: Record<AgentNamespace, {
    used: number
    limit?: number
    percentage: number
    itemCount: number
    priority: number
  }>
  status: 'normal' | 'warning' | 'critical' | 'exceeded'
  warnings: string[]
  recommendations: string[]
}

// Cleanup strategy
export interface CleanupStrategy {
  type: 'lru' | 'size' | 'age' | 'priority'
  targetBytes: number
  maxItems?: number
  preserveNamespaces?: AgentNamespace[]
  dryRun?: boolean
}

// Cleanup result
export interface CleanupResult {
  bytesFreed: number
  itemsRemoved: number
  namespacesAffected: AgentNamespace[]
  duration: number
  errors: string[]
  removedItems: Array<{
    key: string
    namespace: AgentNamespace
    size: number
    reason: string
  }>
}

export class QuotaManager {
  private config: QuotaConfig
  private usageCache = new Map<AgentNamespace, UsageStats>()
  private lastCleanup = 0
  private readonly USAGE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly STORAGE_KEY = '_quota_config'
  private readonly STATS_KEY = '_quota_stats'

  constructor(config: Partial<QuotaConfig> = {}) {
    this.config = QuotaConfigSchema.parse(config)
    this.loadConfig()
  }

  // Quota checking and enforcement
  checkQuota(namespace: AgentNamespace, additionalSize: number = 0): {
    allowed: boolean
    reason?: string
    currentUsage: number
    limit: number
  } {
    const status = this.getQuotaStatus()
    const namespaceUsage = status.namespaceUsage[namespace]
    
    // Check global quota
    if (status.globalUsage.used + additionalSize > status.globalUsage.limit) {
      return {
        allowed: false,
        reason: 'Global storage quota exceeded',
        currentUsage: status.globalUsage.used,
        limit: status.globalUsage.limit
      }
    }

    // Check namespace quota if defined
    const namespaceLimit = this.config.namespaceQuotas?.[namespace]
    if (namespaceLimit && namespaceUsage.used + additionalSize > namespaceLimit) {
      return {
        allowed: false,
        reason: `Namespace ${namespace} quota exceeded`,
        currentUsage: namespaceUsage.used,
        limit: namespaceLimit
      }
    }

    return {
      allowed: true,
      currentUsage: namespaceUsage?.used || 0,
      limit: namespaceLimit || status.globalUsage.limit
    }
  }

  enforceQuota(namespace: AgentNamespace, requiredBytes: number): Promise<boolean> {
    if (!this.config.enforceQuotas) {
      return Promise.resolve(true)
    }

    const check = this.checkQuota(namespace, requiredBytes)
    if (check.allowed) {
      return Promise.resolve(true)
    }

    if (!this.config.autoCleanup) {
      return Promise.resolve(false)
    }

    // Attempt cleanup to make space
    return this.freeSpace(requiredBytes, {
      preserveNamespaces: [namespace] // Don't cleanup the requesting namespace
    })
  }

  // Usage analysis
  getQuotaStatus(): QuotaStatus {
    const globalUsage = this.calculateGlobalUsage()
    const namespaceUsage = this.calculateNamespaceUsage()
    
    const globalPercentage = (globalUsage.used / globalUsage.limit) * 100
    
    let status: QuotaStatus['status'] = 'normal'
    const warnings: string[] = []
    const recommendations: string[] = []

    if (globalPercentage >= this.config.criticalThreshold * 100) {
      status = 'critical'
      warnings.push(`Storage usage is critical (${globalPercentage.toFixed(1)}%)`)
      recommendations.push('Immediate cleanup required')
    } else if (globalPercentage >= this.config.warningThreshold * 100) {
      status = 'warning'
      warnings.push(`Storage usage is high (${globalPercentage.toFixed(1)}%)`)
      recommendations.push('Consider running cleanup operations')
    }

    // Check for namespaces exceeding their quotas
    for (const [namespace, usage] of Object.entries(namespaceUsage)) {
      const limit = this.config.namespaceQuotas?.[namespace as AgentNamespace]
      if (limit && usage.used > limit) {
        status = 'exceeded'
        warnings.push(`Namespace ${namespace} exceeded quota`)
        recommendations.push(`Cleanup ${namespace} namespace`)
      }
    }

    return {
      globalUsage,
      namespaceUsage,
      status,
      warnings,
      recommendations
    }
  }

  private calculateGlobalUsage() {
    const storageInfo = SafeStorage.getStorageInfo()
    return {
      used: storageInfo.used,
      limit: this.config.globalLimit,
      percentage: (storageInfo.used / this.config.globalLimit) * 100,
      available: this.config.globalLimit - storageInfo.used
    }
  }

  private calculateNamespaceUsage(): Record<AgentNamespace, QuotaStatus['namespaceUsage'][AgentNamespace]> {
    const usage: Record<AgentNamespace, QuotaStatus['namespaceUsage'][AgentNamespace]> = {} as any
    
    for (const namespace of Object.values(AgentNamespace)) {
      const stats = this.getUsageStats(namespace)
      const limit = this.config.namespaceQuotas?.[namespace]
      
      usage[namespace] = {
        used: stats.totalSize,
        limit,
        percentage: limit ? (stats.totalSize / limit) * 100 : 0,
        itemCount: stats.itemCount,
        priority: stats.priority
      }
    }

    return usage
  }

  getUsageStats(namespace: AgentNamespace, forceRefresh = false): UsageStats {
    // Check cache first
    if (!forceRefresh && this.usageCache.has(namespace)) {
      const cached = this.usageCache.get(namespace)!
      if (Date.now() - cached.lastAccessed < this.USAGE_CACHE_TTL) {
        return cached
      }
    }

    // Calculate fresh stats
    const stats = this.calculateUsageStats(namespace)
    this.usageCache.set(namespace, stats)
    return stats
  }

  private calculateUsageStats(namespace: AgentNamespace): UsageStats {
    const keys = SafeStorage.getKeys()
    const namespacePrefix = `${namespace}:`
    const namespaceKeys = keys.filter(key => key.startsWith(namespacePrefix))

    let totalSize = 0
    let totalAccesses = 0
    let oldestItem = Date.now()
    let newestItem = 0
    let compressedSize = 0
    let uncompressedSize = 0

    for (const key of namespaceKeys) {
      try {
        const item = SafeStorage.getItem(key)
        if (item) {
          const itemSize = JSON.stringify(item).length * 2 // UTF-16 estimate
          totalSize += itemSize

          // Try to extract metadata if it's a storage entry
          if (typeof item === 'object' && item !== null) {
            const entry = item as any
            if (entry.created) {
              oldestItem = Math.min(oldestItem, entry.created)
              newestItem = Math.max(newestItem, entry.created)
            }
            if (entry.accessCount) {
              totalAccesses += entry.accessCount
            }
            if (entry.compressed && entry.data) {
              compressedSize += JSON.stringify(entry.data).length * 2
              uncompressedSize += itemSize
            }
          }
        }
      } catch (error) {
        // Skip corrupted items
      }
    }

    const compressionRatio = uncompressedSize > 0 ? compressedSize / uncompressedSize : 1
    const priority = this.calculateNamespacePriority(namespace, totalAccesses, totalSize)

    return {
      namespace,
      totalSize,
      itemCount: namespaceKeys.length,
      averageItemSize: namespaceKeys.length > 0 ? totalSize / namespaceKeys.length : 0,
      oldestItem: oldestItem === Date.now() ? 0 : oldestItem,
      newestItem,
      totalAccesses,
      lastAccessed: Date.now(),
      compressionRatio,
      priority
    }
  }

  private calculateNamespacePriority(
    namespace: AgentNamespace,
    totalAccesses: number,
    totalSize: number
  ): number {
    // Priority scoring (higher = more important)
    const priorityWeights = {
      [AgentNamespace.AUTH]: 100,
      [AgentNamespace.MULTI_ACCOUNT]: 90,
      [AgentNamespace.AUTOMATION]: 80,
      [AgentNamespace.AI_INSIGHTS]: 70,
      [AgentNamespace.DATA_PIPELINE]: 60,
      [AgentNamespace.PERFORMANCE]: 50,
      [AgentNamespace.REALTIME]: 40,
      [AgentNamespace.CREATIVE]: 35,
      [AgentNamespace.COMPETITOR]: 30,
      [AgentNamespace.MONITORING]: 25,
      [AgentNamespace.SHARED]: 20
    }

    const basePriority = priorityWeights[namespace] || 10
    const accessScore = Math.min(totalAccesses / 100, 1) * 20 // Max 20 points for access frequency
    const sizeScore = Math.max(0, 20 - (totalSize / (1024 * 1024)) * 5) // Penalty for large size

    return basePriority + accessScore + sizeScore
  }

  // Cleanup operations
  async cleanup(strategy: Partial<CleanupStrategy> = {}): Promise<CleanupResult> {
    const cleanupStrategy: CleanupStrategy = {
      type: this.config.cleanupStrategy,
      targetBytes: this.calculateCleanupTarget(),
      preserveNamespaces: [],
      dryRun: false,
      ...strategy
    }

    const startTime = Date.now()
    const result: CleanupResult = {
      bytesFreed: 0,
      itemsRemoved: 0,
      namespacesAffected: [],
      duration: 0,
      errors: [],
      removedItems: []
    }

    try {
      const itemsToRemove = this.selectItemsForCleanup(cleanupStrategy)
      
      for (const item of itemsToRemove) {
        if (result.bytesFreed >= cleanupStrategy.targetBytes) {
          break
        }

        try {
          if (!cleanupStrategy.dryRun) {
            SafeStorage.removeItem(item.key)
          }

          result.bytesFreed += item.size
          result.itemsRemoved++
          result.removedItems.push(item)

          if (!result.namespacesAffected.includes(item.namespace)) {
            result.namespacesAffected.push(item.namespace)
          }
        } catch (error) {
          result.errors.push(`Failed to remove ${item.key}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`)
        }
      }

      // Clear usage cache for affected namespaces
      for (const namespace of result.namespacesAffected) {
        this.usageCache.delete(namespace)
      }

      this.lastCleanup = Date.now()
      result.duration = Date.now() - startTime

    } catch (error) {
      result.errors.push(`Cleanup failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`)
      result.duration = Date.now() - startTime
    }

    return result
  }

  private calculateCleanupTarget(): number {
    const globalUsage = this.calculateGlobalUsage()
    const excessBytes = globalUsage.used - (globalUsage.limit * this.config.warningThreshold)
    return Math.max(excessBytes, globalUsage.limit * 0.1) // At least 10% of limit
  }

  private selectItemsForCleanup(strategy: CleanupStrategy): Array<{
    key: string
    namespace: AgentNamespace
    size: number
    reason: string
  }> {
    const keys = SafeStorage.getKeys()
    const items: Array<{
      key: string
      namespace: AgentNamespace
      size: number
      priority: number
      lastAccessed: number
      created: number
      accessCount: number
    }> = []

    // Collect item metadata
    for (const key of keys) {
      try {
        const namespace = key.split(':')[0] as AgentNamespace
        
        // Skip preserved namespaces
        if (strategy.preserveNamespaces?.includes(namespace)) {
          continue
        }

        const item = SafeStorage.getItem(key)
        if (item) {
          const size = JSON.stringify(item).length * 2
          const metadata = typeof item === 'object' && item !== null ? item as any : {}
          
          items.push({
            key,
            namespace,
            size,
            priority: this.calculateNamespacePriority(namespace, metadata.accessCount || 0, size),
            lastAccessed: metadata.accessed || metadata.updated || Date.now(),
            created: metadata.created || Date.now(),
            accessCount: metadata.accessCount || 0
          })
        }
      } catch (error) {
        // Skip corrupted items
      }
    }

    // Sort items based on cleanup strategy
    switch (strategy.type) {
      case 'lru':
        items.sort((a, b) => a.lastAccessed - b.lastAccessed)
        break
      case 'size':
        items.sort((a, b) => b.size - a.size)
        break
      case 'age':
        items.sort((a, b) => a.created - b.created)
        break
      case 'priority':
        items.sort((a, b) => a.priority - b.priority)
        break
    }

    // Convert to cleanup format
    return items.map(item => ({
      key: item.key,
      namespace: item.namespace,
      size: item.size,
      reason: `Cleanup strategy: ${strategy.type}`
    }))
  }

  async freeSpace(requiredBytes: number, options: {
    preserveNamespaces?: AgentNamespace[]
    maxIterations?: number
  } = {}): Promise<boolean> {
    const { preserveNamespaces = [], maxIterations = 3 } = options
    let iteration = 0
    let totalFreed = 0

    while (totalFreed < requiredBytes && iteration < maxIterations) {
      const cleanupResult = await this.cleanup({
        targetBytes: requiredBytes - totalFreed,
        preserveNamespaces,
        type: this.config.cleanupStrategy
      })

      totalFreed += cleanupResult.bytesFreed
      iteration++

      if (cleanupResult.bytesFreed === 0) {
        // No more items to cleanup
        break
      }
    }

    return totalFreed >= requiredBytes
  }

  // Optimization suggestions
  getOptimizationSuggestions(): Array<{
    type: 'compression' | 'cleanup' | 'quota' | 'migration'
    priority: 'low' | 'medium' | 'high'
    description: string
    estimatedSavings?: number
    action: string
  }> {
    const suggestions: Array<{
      type: 'compression' | 'cleanup' | 'quota' | 'migration'
      priority: 'low' | 'medium' | 'high'
      description: string
      estimatedSavings?: number
      action: string
    }> = []

    const status = this.getQuotaStatus()

    // High usage warnings
    if (status.globalUsage.percentage > 80) {
      suggestions.push({
        type: 'cleanup',
        priority: 'high',
        description: 'Storage usage is critically high',
        estimatedSavings: status.globalUsage.used * 0.2,
        action: 'Run immediate cleanup operation'
      })
    }

    // Compression opportunities
    for (const namespace of Object.values(AgentNamespace)) {
      const stats = this.getUsageStats(namespace)
      if (stats.averageItemSize > this.config.compressionThreshold && stats.compressionRatio > 0.7) {
        suggestions.push({
          type: 'compression',
          priority: 'medium',
          description: `${namespace} namespace has large uncompressed items`,
          estimatedSavings: stats.totalSize * (1 - stats.compressionRatio),
          action: `Enable compression for ${namespace} namespace`
        })
      }
    }

    // Quota adjustments
    if (Object.keys(this.config.namespaceQuotas || {}).length === 0) {
      suggestions.push({
        type: 'quota',
        priority: 'low',
        description: 'No namespace-specific quotas configured',
        action: 'Configure namespace quotas for better resource management'
      })
    }

    // Migration to IndexedDB for large data
    for (const namespace of Object.values(AgentNamespace)) {
      const stats = this.getUsageStats(namespace)
      if (stats.totalSize > 1024 * 1024) { // 1MB
        suggestions.push({
          type: 'migration',
          priority: 'medium',
          description: `${namespace} namespace has large data that could benefit from IndexedDB`,
          action: `Consider migrating ${namespace} data to IndexedDB`
        })
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  // Configuration management
  updateConfig(updates: Partial<QuotaConfig>): void {
    this.config = QuotaConfigSchema.parse({ ...this.config, ...updates })
    this.saveConfig()
    
    // Clear cache to force recalculation
    this.usageCache.clear()
  }

  getConfig(): QuotaConfig {
    return { ...this.config }
  }

  // Monitoring and reporting
  generateReport(timeWindow?: number): {
    summary: QuotaStatus
    usageByNamespace: Record<AgentNamespace, UsageStats>
    trends: {
      usageGrowth: number // bytes per day
      accessPattern: Record<AgentNamespace, number>
    }
    recommendations: ReturnType<typeof this.getOptimizationSuggestions>
  } {
    const summary = this.getQuotaStatus()
    const usageByNamespace: Record<AgentNamespace, UsageStats> = {} as any
    
    for (const namespace of Object.values(AgentNamespace)) {
      usageByNamespace[namespace] = this.getUsageStats(namespace, true)
    }

    // Calculate trends (simplified - would need historical data for accuracy)
    const totalSize = Object.values(usageByNamespace).reduce((sum, stats) => sum + stats.totalSize, 0)
    const totalAccesses = Object.values(usageByNamespace).reduce((sum, stats) => sum + stats.totalAccesses, 0)
    
    const trends = {
      usageGrowth: totalSize / 30, // Rough estimate: current size / 30 days
      accessPattern: Object.fromEntries(
        Object.entries(usageByNamespace).map(([ns, stats]) => [
          ns,
          totalAccesses > 0 ? stats.totalAccesses / totalAccesses : 0
        ])
      ) as Record<AgentNamespace, number>
    }

    const recommendations = this.getOptimizationSuggestions()

    return {
      summary,
      usageByNamespace,
      trends,
      recommendations
    }
  }

  // Automated maintenance
  scheduleAutomaticCleanup(interval: number = 24 * 60 * 60 * 1000): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        const status = this.getQuotaStatus()
        
        if (status.status === 'warning' || status.status === 'critical') {
          await this.cleanup()
        }
      } catch (error) {
        console.error('Automatic cleanup failed:', error)
      }
    }, interval)
  }

  // Persistence
  private loadConfig(): void {
    try {
      const stored = SafeStorage.getItem<QuotaConfig>(this.STORAGE_KEY)
      if (stored) {
        this.config = QuotaConfigSchema.parse({ ...this.config, ...stored })
      }
    } catch (error) {
      console.warn('Failed to load quota config:', error)
    }
  }

  private saveConfig(): void {
    try {
      SafeStorage.setItem(this.STORAGE_KEY, this.config)
    } catch (error) {
      console.warn('Failed to save quota config:', error)
    }
  }

  // Health check
  healthCheck(): {
    healthy: boolean
    issues: string[]
    metrics: {
      globalUsage: number
      namespacesOverQuota: number
      lastCleanup: number
      cacheHitRate: number
    }
  } {
    const status = this.getQuotaStatus()
    const issues: string[] = []
    let healthy = true

    if (status.status === 'critical' || status.status === 'exceeded') {
      healthy = false
      issues.push(...status.warnings)
    }

    const namespacesOverQuota = Object.values(status.namespaceUsage)
      .filter(usage => usage.limit && usage.used > usage.limit).length

    if (namespacesOverQuota > 0) {
      healthy = false
      issues.push(`${namespacesOverQuota} namespaces over quota`)
    }

    const timeSinceLastCleanup = Date.now() - this.lastCleanup
    if (timeSinceLastCleanup > 7 * 24 * 60 * 60 * 1000) { // 7 days
      issues.push('No recent cleanup operations')
    }

    const cacheHitRate = this.usageCache.size / Object.values(AgentNamespace).length

    return {
      healthy,
      issues,
      metrics: {
        globalUsage: status.globalUsage.percentage,
        namespacesOverQuota,
        lastCleanup: this.lastCleanup,
        cacheHitRate
      }
    }
  }
}

// Default quota configurations
export const DEFAULT_NAMESPACE_QUOTAS: Record<AgentNamespace, number> = {
  [AgentNamespace.AUTH]: 1 * 1024 * 1024, // 1MB
  [AgentNamespace.MULTI_ACCOUNT]: 3 * 1024 * 1024, // 3MB
  [AgentNamespace.AUTOMATION]: 2 * 1024 * 1024, // 2MB
  [AgentNamespace.AI_INSIGHTS]: 2 * 1024 * 1024, // 2MB
  [AgentNamespace.DATA_PIPELINE]: 1 * 1024 * 1024, // 1MB
  [AgentNamespace.PERFORMANCE]: 0.5 * 1024 * 1024, // 500KB
  [AgentNamespace.REALTIME]: 0.5 * 1024 * 1024, // 500KB
  [AgentNamespace.CREATIVE]: 1 * 1024 * 1024, // 1MB
  [AgentNamespace.COMPETITOR]: 1 * 1024 * 1024, // 1MB
  [AgentNamespace.MONITORING]: 0.5 * 1024 * 1024, // 500KB
  [AgentNamespace.SHARED]: 0.5 * 1024 * 1024 // 500KB
}