// Data retention policies and cleanup automation
import { z } from 'zod'
import { AgentNamespace, StorageEntry } from './unified-storage-manager'
import { SafeStorage } from '../storage-utils'
import { IndexedDBOptimizer } from './indexeddb-optimizer'

// Retention policy schema
const RetentionPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  namespace: z.nativeEnum(AgentNamespace).optional(),
  classification: z.enum(['public', 'internal', 'confidential', 'restricted']).optional(),
  tags: z.array(z.string()).optional(),
  maxAge: z.number().positive(), // Maximum age in milliseconds
  maxCount: z.number().positive().optional(), // Maximum number of entries
  maxSize: z.number().positive().optional(), // Maximum size in bytes
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  enabled: z.boolean().default(true),
  autoCleanup: z.boolean().default(true),
  backupBeforeDelete: z.boolean().default(false),
  notifyBeforeDelete: z.boolean().default(false),
  conditions: z.object({
    accessCount: z.object({
      operator: z.enum(['lt', 'lte', 'gt', 'gte', 'eq']),
      value: z.number()
    }).optional(),
    lastAccessed: z.object({
      operator: z.enum(['lt', 'lte', 'gt', 'gte']),
      value: z.number() // milliseconds ago
    }).optional(),
    customFilter: z.string().optional() // JavaScript expression
  }).optional()
})

export type RetentionPolicy = z.infer<typeof RetentionPolicySchema>

// Cleanup operation result
export interface CleanupResult {
  policyId: string
  entriesScanned: number
  entriesDeleted: number
  bytesFreed: number
  duration: number
  errors: string[]
  deletedEntries: Array<{
    key: string
    namespace: AgentNamespace
    reason: string
    size: number
  }>
}

// Cleanup schedule
export enum CleanupSchedule {
  IMMEDIATE = 'immediate',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

// Cleanup configuration
export interface CleanupConfig {
  schedule: CleanupSchedule
  interval?: number // For custom schedule (milliseconds)
  batchSize: number
  maxDuration: number // Maximum cleanup duration (milliseconds)
  concurrent: boolean
  priority: 'performance' | 'thoroughness'
}

// Notification interface
export interface RetentionNotification {
  type: 'warning' | 'deletion' | 'error'
  policyId: string
  message: string
  entries: Array<{
    key: string
    namespace: AgentNamespace
    deleteAt: number
  }>
  timestamp: number
}

export class RetentionManager {
  private policies = new Map<string, RetentionPolicy>()
  private notifications: RetentionNotification[] = []
  private cleanupHistory: CleanupResult[] = []
  private scheduledCleanups = new Map<string, NodeJS.Timeout>()
  private indexedDB: IndexedDBOptimizer | null = null
  private readonly STORAGE_KEY = '_retention_policies'
  private readonly HISTORY_KEY = '_cleanup_history'
  private readonly MAX_HISTORY_SIZE = 100

  constructor(indexedDB?: IndexedDBOptimizer) {
    this.indexedDB = indexedDB || null
    this.loadPolicies()
    this.loadHistory()
  }

  // Policy management
  addPolicy(policy: RetentionPolicy): void {
    const validated = RetentionPolicySchema.parse(policy)
    this.policies.set(validated.id, validated)
    this.savePolicies()

    if (validated.enabled && validated.autoCleanup) {
      this.scheduleCleanup(validated.id)
    }
  }

  updatePolicy(id: string, updates: Partial<RetentionPolicy>): void {
    const existing = this.policies.get(id)
    if (!existing) {
      throw new Error(`Policy ${id} not found`)
    }

    const updated = RetentionPolicySchema.parse({ ...existing, ...updates })
    this.policies.set(id, updated)
    this.savePolicies()

    // Reschedule cleanup
    this.unscheduleCleanup(id)
    if (updated.enabled && updated.autoCleanup) {
      this.scheduleCleanup(id)
    }
  }

  removePolicy(id: string): void {
    this.policies.delete(id)
    this.unscheduleCleanup(id)
    this.savePolicies()
  }

  getPolicy(id: string): RetentionPolicy | undefined {
    return this.policies.get(id)
  }

  getAllPolicies(): RetentionPolicy[] {
    return Array.from(this.policies.values())
  }

  getActivePolicies(): RetentionPolicy[] {
    return this.getAllPolicies().filter(policy => policy.enabled)
  }

  // Cleanup execution
  async executeCleanup(
    policyId?: string,
    config: Partial<CleanupConfig> = {}
  ): Promise<CleanupResult[]> {
    const policiesToExecute = policyId 
      ? [this.getPolicy(policyId)].filter(Boolean) as RetentionPolicy[]
      : this.getActivePolicies()

    if (policiesToExecute.length === 0) {
      return []
    }

    const cleanupConfig: CleanupConfig = {
      schedule: CleanupSchedule.IMMEDIATE,
      batchSize: 100,
      maxDuration: 30000, // 30 seconds
      concurrent: false,
      priority: 'performance',
      ...config
    }

    const results: CleanupResult[] = []

    if (cleanupConfig.concurrent) {
      const promises = policiesToExecute.map(policy => 
        this.executeCleanupForPolicy(policy, cleanupConfig)
      )
      results.push(...await Promise.all(promises))
    } else {
      for (const policy of policiesToExecute) {
        const result = await this.executeCleanupForPolicy(policy, cleanupConfig)
        results.push(result)
      }
    }

    // Save cleanup history
    this.cleanupHistory.push(...results)
    this.trimHistory()
    this.saveHistory()

    return results
  }

  private async executeCleanupForPolicy(
    policy: RetentionPolicy,
    config: CleanupConfig
  ): Promise<CleanupResult> {
    const startTime = Date.now()
    const result: CleanupResult = {
      policyId: policy.id,
      entriesScanned: 0,
      entriesDeleted: 0,
      bytesFreed: 0,
      duration: 0,
      errors: [],
      deletedEntries: []
    }

    try {
      // Get entries to scan
      const entries = await this.getEntriesForPolicy(policy)
      result.entriesScanned = entries.length

      // Apply retention rules
      const entriesToDelete = await this.filterEntriesForDeletion(entries, policy)

      // Delete entries in batches
      const batches = this.createBatches(entriesToDelete, config.batchSize)
      
      for (const batch of batches) {
        // Check time limit
        if (Date.now() - startTime > config.maxDuration) {
          result.errors.push('Cleanup terminated due to time limit')
          break
        }

        await this.deleteBatch(batch, policy, result)
      }

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    result.duration = Date.now() - startTime
    return result
  }

  private async getEntriesForPolicy(policy: RetentionPolicy): Promise<StorageEntry[]> {
    const entries: StorageEntry[] = []

    // Query IndexedDB
    if (this.indexedDB) {
      try {
        const dbEntries = await this.indexedDB.query<StorageEntry>('cache')
        entries.push(...dbEntries)
      } catch (error) {
        console.warn('Failed to query IndexedDB for retention:', error)
      }
    }

    // Scan localStorage
    const keys = SafeStorage.getKeys()
    for (const key of keys) {
      try {
        const entry = SafeStorage.getItem<StorageEntry>(key)
        if (entry && this.entryMatchesPolicy(entry, policy)) {
          entries.push(entry)
        }
      } catch (error) {
        // Skip invalid entries
      }
    }

    return entries.filter(entry => this.entryMatchesPolicy(entry, policy))
  }

  private entryMatchesPolicy(entry: StorageEntry, policy: RetentionPolicy): boolean {
    // Check namespace
    if (policy.namespace && entry.namespace !== policy.namespace) {
      return false
    }

    // Check classification
    if (policy.classification && entry.classification !== policy.classification) {
      return false
    }

    // Check tags
    if (policy.tags && policy.tags.length > 0) {
      const hasMatchingTag = policy.tags.some(tag => entry.tags?.includes(tag))
      if (!hasMatchingTag) {
        return false
      }
    }

    return true
  }

  private async filterEntriesForDeletion(
    entries: StorageEntry[],
    policy: RetentionPolicy
  ): Promise<StorageEntry[]> {
    const now = Date.now()
    const toDelete: StorageEntry[] = []

    // Sort entries by age, access count, size as needed
    const sortedEntries = [...entries].sort((a, b) => {
      if (policy.maxCount) {
        // For count-based retention, sort by access patterns
        return (b.accessed + b.accessCount * 1000) - (a.accessed + a.accessCount * 1000)
      }
      return a.created - b.created // Oldest first for age-based retention
    })

    for (const entry of sortedEntries) {
      let shouldDelete = false
      let reason = ''

      // Check age
      const age = now - entry.created
      if (age > policy.maxAge) {
        shouldDelete = true
        reason = `Exceeds max age (${Math.round(age / (24 * 60 * 60 * 1000))} days)`
      }

      // Check count limit
      if (policy.maxCount && toDelete.length >= policy.maxCount) {
        const remainingEntries = sortedEntries.slice(policy.maxCount)
        if (remainingEntries.includes(entry)) {
          shouldDelete = true
          reason = `Exceeds max count (${policy.maxCount})`
        }
      }

      // Check size limit
      if (policy.maxSize) {
        const currentSize = this.calculateTotalSize(entries)
        const entrySize = this.calculateEntrySize(entry)
        if (currentSize > policy.maxSize) {
          shouldDelete = true
          reason = `Exceeds max size (${Math.round(policy.maxSize / 1024)}KB)`
        }
      }

      // Apply custom conditions
      if (policy.conditions && !shouldDelete) {
        shouldDelete = this.evaluateConditions(entry, policy.conditions, now)
        if (shouldDelete) {
          reason = 'Custom condition matched'
        }
      }

      if (shouldDelete) {
        // Check if backup is required
        if (policy.backupBeforeDelete) {
          await this.backupEntry(entry)
        }

        // Check if notification is required
        if (policy.notifyBeforeDelete) {
          this.addNotification({
            type: 'deletion',
            policyId: policy.id,
            message: `Entry ${entry.key} will be deleted: ${reason}`,
            entries: [{ 
              key: entry.key, 
              namespace: entry.namespace, 
              deleteAt: now 
            }],
            timestamp: now
          })
        }

        toDelete.push(entry)
      }
    }

    return toDelete
  }

  private evaluateConditions(
    entry: StorageEntry,
    conditions: NonNullable<RetentionPolicy['conditions']>,
    now: number
  ): boolean {
    // Access count condition
    if (conditions.accessCount) {
      const { operator, value } = conditions.accessCount
      const accessCount = entry.accessCount
      
      switch (operator) {
        case 'lt': if (!(accessCount < value)) return false; break
        case 'lte': if (!(accessCount <= value)) return false; break
        case 'gt': if (!(accessCount > value)) return false; break
        case 'gte': if (!(accessCount >= value)) return false; break
        case 'eq': if (!(accessCount === value)) return false; break
      }
    }

    // Last accessed condition
    if (conditions.lastAccessed) {
      const { operator, value } = conditions.lastAccessed
      const timeSinceAccess = now - entry.accessed
      
      switch (operator) {
        case 'lt': if (!(timeSinceAccess < value)) return false; break
        case 'lte': if (!(timeSinceAccess <= value)) return false; break
        case 'gt': if (!(timeSinceAccess > value)) return false; break
        case 'gte': if (!(timeSinceAccess >= value)) return false; break
      }
    }

    // Custom filter (JavaScript expression)
    if (conditions.customFilter) {
      try {
        const func = new Function('entry', 'now', `return ${conditions.customFilter}`)
        return func(entry, now)
      } catch (error) {
        console.warn('Custom filter evaluation failed:', error)
        return false
      }
    }

    return true
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  private async deleteBatch(
    entries: StorageEntry[],
    policy: RetentionPolicy,
    result: CleanupResult
  ): Promise<void> {
    for (const entry of entries) {
      try {
        const entrySize = this.calculateEntrySize(entry)
        
        // Delete from IndexedDB
        if (this.indexedDB) {
          await this.indexedDB.delete('cache', entry.key)
        }

        // Delete from localStorage
        SafeStorage.removeItem(entry.key)

        result.entriesDeleted++
        result.bytesFreed += entrySize
        result.deletedEntries.push({
          key: entry.key,
          namespace: entry.namespace,
          reason: `Deleted by policy ${policy.id}`,
          size: entrySize
        })

      } catch (error) {
        result.errors.push(`Failed to delete ${entry.key}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`)
      }
    }
  }

  private calculateEntrySize(entry: StorageEntry): number {
    return JSON.stringify(entry).length * 2 // Rough estimate (UTF-16)
  }

  private calculateTotalSize(entries: StorageEntry[]): number {
    return entries.reduce((total, entry) => total + this.calculateEntrySize(entry), 0)
  }

  private async backupEntry(entry: StorageEntry): Promise<void> {
    // Simple backup to localStorage with special prefix
    const backupKey = `_backup_${Date.now()}_${entry.key}`
    SafeStorage.setItem(backupKey, entry, { 
      expiresIn: 30 * 24 * 60 * 60 * 1000 // 30 days
    })
  }

  // Scheduling
  private scheduleCleanup(policyId: string): void {
    const policy = this.policies.get(policyId)
    if (!policy) return

    // For now, schedule daily cleanup at 2 AM
    const now = new Date()
    const nextRun = new Date()
    nextRun.setHours(2, 0, 0, 0)
    
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1)
    }

    const timeUntilRun = nextRun.getTime() - now.getTime()
    
    const timer = setTimeout(async () => {
      await this.executeCleanup(policyId)
      // Reschedule for next day
      this.scheduleCleanup(policyId)
    }, timeUntilRun)

    this.scheduledCleanups.set(policyId, timer)
  }

  private unscheduleCleanup(policyId: string): void {
    const timer = this.scheduledCleanups.get(policyId)
    if (timer) {
      clearTimeout(timer)
      this.scheduledCleanups.delete(policyId)
    }
  }

  // Notifications
  private addNotification(notification: RetentionNotification): void {
    this.notifications.push(notification)
    
    // Keep notifications manageable
    if (this.notifications.length > 1000) {
      this.notifications = this.notifications.slice(-500)
    }
  }

  getNotifications(type?: RetentionNotification['type']): RetentionNotification[] {
    if (type) {
      return this.notifications.filter(n => n.type === type)
    }
    return [...this.notifications]
  }

  clearNotifications(olderThan?: number): number {
    const cutoff = olderThan || (Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days
    const initialLength = this.notifications.length
    this.notifications = this.notifications.filter(n => n.timestamp > cutoff)
    return initialLength - this.notifications.length
  }

  // History management
  getCleanupHistory(limit?: number): CleanupResult[] {
    const history = [...this.cleanupHistory].reverse() // Most recent first
    return limit ? history.slice(0, limit) : history
  }

  private trimHistory(): void {
    if (this.cleanupHistory.length > this.MAX_HISTORY_SIZE) {
      this.cleanupHistory = this.cleanupHistory.slice(-this.MAX_HISTORY_SIZE)
    }
  }

  // Persistence
  private loadPolicies(): void {
    try {
      const stored = SafeStorage.getItem<RetentionPolicy[]>(this.STORAGE_KEY)
      if (stored && Array.isArray(stored)) {
        for (const policy of stored) {
          this.policies.set(policy.id, policy)
        }
      }
    } catch (error) {
      console.warn('Failed to load retention policies:', error)
    }
  }

  private savePolicies(): void {
    try {
      const policies = Array.from(this.policies.values())
      SafeStorage.setItem(this.STORAGE_KEY, policies)
    } catch (error) {
      console.warn('Failed to save retention policies:', error)
    }
  }

  private loadHistory(): void {
    try {
      const stored = SafeStorage.getItem<CleanupResult[]>(this.HISTORY_KEY)
      if (stored && Array.isArray(stored)) {
        this.cleanupHistory = stored
      }
    } catch (error) {
      console.warn('Failed to load cleanup history:', error)
    }
  }

  private saveHistory(): void {
    try {
      SafeStorage.setItem(this.HISTORY_KEY, this.cleanupHistory)
    } catch (error) {
      console.warn('Failed to save cleanup history:', error)
    }
  }

  // Statistics and monitoring
  getStatistics(): {
    policies: {
      total: number
      active: number
      byNamespace: Record<string, number>
    }
    cleanup: {
      totalRuns: number
      totalDeleted: number
      totalBytesFreed: number
      averageDuration: number
      lastRun?: number
    }
    notifications: {
      total: number
      byType: Record<string, number>
      unread: number
    }
  } {
    const policies = this.getAllPolicies()
    const activePolicies = this.getActivePolicies()
    
    const byNamespace: Record<string, number> = {}
    for (const policy of policies) {
      if (policy.namespace) {
        byNamespace[policy.namespace] = (byNamespace[policy.namespace] || 0) + 1
      }
    }

    const totalDeleted = this.cleanupHistory.reduce((sum, result) => sum + result.entriesDeleted, 0)
    const totalBytesFreed = this.cleanupHistory.reduce((sum, result) => sum + result.bytesFreed, 0)
    const totalDuration = this.cleanupHistory.reduce((sum, result) => sum + result.duration, 0)
    const averageDuration = this.cleanupHistory.length > 0 ? totalDuration / this.cleanupHistory.length : 0

    const notificationsByType: Record<string, number> = {}
    for (const notification of this.notifications) {
      notificationsByType[notification.type] = (notificationsByType[notification.type] || 0) + 1
    }

    const lastRun = this.cleanupHistory.length > 0 
      ? Math.max(...this.cleanupHistory.map(r => r.duration))
      : undefined

    return {
      policies: {
        total: policies.length,
        active: activePolicies.length,
        byNamespace
      },
      cleanup: {
        totalRuns: this.cleanupHistory.length,
        totalDeleted,
        totalBytesFreed,
        averageDuration,
        lastRun
      },
      notifications: {
        total: this.notifications.length,
        byType: notificationsByType,
        unread: this.notifications.filter(n => n.type === 'warning').length
      }
    }
  }

  // Cleanup all
  async destroy(): Promise<void> {
    // Clear all scheduled cleanups
    for (const timer of this.scheduledCleanups.values()) {
      clearTimeout(timer)
    }
    this.scheduledCleanups.clear()

    // Save final state
    this.savePolicies()
    this.saveHistory()
  }
}

// Predefined policies for common scenarios
export class CommonRetentionPolicies {
  // Cache data retention (7 days)
  static createCachePolicy(): RetentionPolicy {
    return {
      id: 'cache_retention',
      name: 'Cache Data Retention',
      description: 'Remove cache data older than 7 days',
      classification: 'internal',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      priority: 'medium',
      autoCleanup: true,
      backupBeforeDelete: false
    }
  }

  // Temporary data retention (24 hours)
  static createTempPolicy(): RetentionPolicy {
    return {
      id: 'temp_retention',
      name: 'Temporary Data Retention',
      description: 'Remove temporary data older than 24 hours',
      tags: ['temp', 'temporary'],
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      priority: 'high',
      autoCleanup: true,
      backupBeforeDelete: false
    }
  }

  // User session retention (30 days)
  static createSessionPolicy(): RetentionPolicy {
    return {
      id: 'session_retention',
      name: 'User Session Retention',
      description: 'Remove user session data older than 30 days',
      namespace: AgentNamespace.AUTH,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      priority: 'medium',
      autoCleanup: true,
      backupBeforeDelete: true
    }
  }

  // Analytics data retention (90 days)
  static createAnalyticsPolicy(): RetentionPolicy {
    return {
      id: 'analytics_retention',
      name: 'Analytics Data Retention',
      description: 'Remove analytics data older than 90 days',
      namespace: AgentNamespace.PERFORMANCE,
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      priority: 'low',
      autoCleanup: true,
      backupBeforeDelete: true
    }
  }

  // Unused data cleanup (based on access patterns)
  static createUnusedDataPolicy(): RetentionPolicy {
    return {
      id: 'unused_data_cleanup',
      name: 'Unused Data Cleanup',
      description: 'Remove data that hasnt been accessed in 60 days',
      maxAge: 60 * 24 * 60 * 60 * 1000, // 60 days
      priority: 'medium',
      autoCleanup: true,
      conditions: {
        lastAccessed: {
          operator: 'gt',
          value: 60 * 24 * 60 * 60 * 1000 // 60 days
        },
        accessCount: {
          operator: 'lt',
          value: 5
        }
      }
    }
  }
}