// Unified storage management layer for all agents
import { z } from 'zod'
import { SafeStorage } from '../storage-utils'
import { IndexedDBOptimizer, IndexedDBFactory } from './indexeddb-optimizer'
import { StorageSyncManager, SyncManagerFactory, StorageLayer } from './sync-manager'
import { EncryptionManager, EncryptionContext } from './encryption-manager'
import { MigrationManager } from './migration-manager'
import { CompressionManager, CompressionAlgorithm } from './compression-utils'

// Storage configuration schema
const StorageConfigSchema = z.object({
  encryption: z.object({
    enabled: z.boolean().default(true),
    algorithm: z.enum(['AES-GCM', 'AES-CBC']).default('AES-GCM'),
    keyRotationInterval: z.number().default(30 * 24 * 60 * 60 * 1000) // 30 days
  }).default({}),
  compression: z.object({
    enabled: z.boolean().default(true),
    algorithm: z.nativeEnum(CompressionAlgorithm).default(CompressionAlgorithm.LZ77),
    threshold: z.number().default(1024) // 1KB
  }).default({}),
  sync: z.object({
    enabled: z.boolean().default(true),
    interval: z.number().default(30000), // 30 seconds
    conflictResolution: z.enum(['local_wins', 'remote_wins', 'timestamp']).default('timestamp')
  }).default({}),
  retention: z.object({
    enabled: z.boolean().default(true),
    defaultTTL: z.number().default(30 * 24 * 60 * 60 * 1000), // 30 days
    cleanupInterval: z.number().default(24 * 60 * 60 * 1000) // 24 hours
  }).default({}),
  quota: z.object({
    enabled: z.boolean().default(true),
    maxLocalStorage: z.number().default(10 * 1024 * 1024), // 10MB
    maxIndexedDB: z.number().default(100 * 1024 * 1024), // 100MB
    maxMemory: z.number().default(50 * 1024 * 1024) // 50MB
  }).default({})
})

export type StorageConfig = z.infer<typeof StorageConfigSchema>

// Agent storage namespace
export enum AgentNamespace {
  AUTH = 'auth',
  PERFORMANCE = 'performance',
  DATA_PIPELINE = 'data_pipeline',
  AI_INSIGHTS = 'ai_insights',
  MULTI_ACCOUNT = 'multi_account',
  AUTOMATION = 'automation',
  REALTIME = 'realtime',
  CREATIVE = 'creative',
  COMPETITOR = 'competitor',
  MONITORING = 'monitoring',
  SHARED = 'shared'
}

// Storage operation types
export enum StorageOperation {
  GET = 'get',
  SET = 'set',
  DELETE = 'delete',
  CLEAR = 'clear',
  QUERY = 'query',
  BATCH = 'batch'
}

// Storage metrics
export interface StorageMetrics {
  namespace: AgentNamespace
  operations: {
    total: number
    successful: number
    failed: number
    byType: Record<StorageOperation, number>
  }
  performance: {
    averageLatency: number
    cacheHitRate: number
    compressionRatio: number
  }
  storage: {
    used: number
    quota: number
    distribution: Record<StorageLayer, number>
  }
  encryption: {
    encrypted: number
    unencrypted: number
    keyRotations: number
  }
}

// Storage entry metadata
export interface StorageEntry<T = any> {
  key: string
  data: T
  namespace: AgentNamespace
  classification: 'public' | 'internal' | 'confidential' | 'restricted'
  ttl?: number
  tags?: string[]
  version: number
  created: number
  updated: number
  accessed: number
  accessCount: number
  encrypted: boolean
  compressed: boolean
  checksum: string
}

// Query options
export interface QueryOptions {
  namespace?: AgentNamespace
  tags?: string[]
  classification?: string[]
  dateRange?: {
    start: number
    end: number
  }
  limit?: number
  offset?: number
  sortBy?: 'created' | 'updated' | 'accessed' | 'accessCount'
  sortOrder?: 'asc' | 'desc'
}

export class UnifiedStorageManager {
  private config: StorageConfig
  private indexedDB: IndexedDBOptimizer | null = null
  private syncManager: StorageSyncManager | null = null
  private encryptionManager: EncryptionManager | null = null
  private migrationManager: MigrationManager | null = null
  private compressionManager = new CompressionManager()
  
  private metrics = new Map<AgentNamespace, StorageMetrics>()
  private initialized = false
  private cleanupTimer?: NodeJS.Timeout

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = StorageConfigSchema.parse(config)
  }

  // Initialize storage manager
  async initialize(masterPassword?: string): Promise<void> {
    if (this.initialized) return

    try {
      // Initialize IndexedDB only in browser environment
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        this.indexedDB = await IndexedDBFactory.createMetaAdsDB()
      }

      // Initialize encryption if enabled
      if (this.config.encryption.enabled && masterPassword) {
        this.encryptionManager = new EncryptionManager()
        await this.encryptionManager.initialize(masterPassword)
      }

      // Initialize sync manager
      if (this.config.sync.enabled) {
        this.syncManager = SyncManagerFactory.create('unified', {
          syncInterval: this.config.sync.interval,
          conflictResolution: this.config.sync.conflictResolution,
          enableRealtimeSync: true
        }, this.indexedDB)
      }

      // Initialize migration manager
      this.migrationManager = new MigrationManager()
      await this.setupMigrations()

      // Initialize metrics for all namespaces
      this.initializeMetrics()

      // Start cleanup timer
      this.startCleanupTimer()

      this.initialized = true
    } catch (error) {
      throw new Error(`Failed to initialize storage manager: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Agent-specific storage interface
  getAgentStorage(namespace: AgentNamespace): AgentStorageInterface {
    if (!this.initialized) {
      throw new Error('Storage manager not initialized')
    }

    return new AgentStorageInterface(this, namespace)
  }

  // Core storage operations
  async get<T = any>(
    namespace: AgentNamespace,
    key: string,
    options: { decrypt?: boolean; decompress?: boolean } = {}
  ): Promise<T | null> {
    const startTime = performance.now()
    const fullKey = this.buildKey(namespace, key)

    try {
      // Try IndexedDB first
      let entry: StorageEntry<T> | null = null
      
      if (this.indexedDB) {
        entry = await this.indexedDB.get('cache', fullKey)
      }

      // Fallback to localStorage
      if (!entry) {
        const data = SafeStorage.getItem<StorageEntry<T>>(fullKey)
        if (data) {
          entry = data
        }
      }

      if (!entry) {
        this.recordMetric(namespace, StorageOperation.GET, false, performance.now() - startTime)
        return null
      }

      // Check TTL
      if (entry.ttl && Date.now() > entry.created + entry.ttl) {
        await this.delete(namespace, key)
        this.recordMetric(namespace, StorageOperation.GET, false, performance.now() - startTime)
        return null
      }

      // Update access metadata
      entry.accessed = Date.now()
      entry.accessCount++

      let data = entry.data

      // Decrypt if needed
      if (entry.encrypted && options.decrypt !== false && this.encryptionManager) {
        data = await this.encryptionManager.decrypt(data)
      }

      // Decompress if needed
      if (entry.compressed && options.decompress !== false) {
        data = await this.compressionManager.decompress(data)
      }

      this.recordMetric(namespace, StorageOperation.GET, true, performance.now() - startTime)
      return data
    } catch (error) {
      this.recordMetric(namespace, StorageOperation.GET, false, performance.now() - startTime)
      throw error
    }
  }

  async set<T = any>(
    namespace: AgentNamespace,
    key: string,
    data: T,
    options: {
      ttl?: number
      classification?: 'public' | 'internal' | 'confidential' | 'restricted'
      tags?: string[]
      encrypt?: boolean
      compress?: boolean
      sync?: boolean
    } = {}
  ): Promise<void> {
    const startTime = performance.now()
    const fullKey = this.buildKey(namespace, key)

    try {
      let processedData = data

      // Compress if enabled and beneficial
      if (this.shouldCompress(data, options.compress)) {
        const compressed = await this.compressionManager.compress(data)
        if (compressed.compressionRatio > 1.1) {
          processedData = compressed as T
        }
      }

      // Encrypt if enabled
      let encrypted = false
      if (this.shouldEncrypt(options.classification, options.encrypt)) {
        const context: EncryptionContext = {
          purpose: `${namespace}_storage`,
          classification: options.classification || 'internal',
          retention: options.ttl || this.config.retention.defaultTTL
        }
        processedData = await this.encryptionManager!.encrypt(processedData, context) as T
        encrypted = true
      }

      // Create storage entry
      const entry: StorageEntry<T> = {
        key: fullKey,
        data: processedData,
        namespace,
        classification: options.classification || 'internal',
        ttl: options.ttl,
        tags: options.tags || [],
        version: 1,
        created: Date.now(),
        updated: Date.now(),
        accessed: Date.now(),
        accessCount: 0,
        encrypted,
        compressed: processedData !== data,
        checksum: await this.calculateChecksum(data)
      }

      // Check quota before storing
      await this.checkQuota(namespace, entry)

      // Store in IndexedDB
      if (this.indexedDB) {
        await this.indexedDB.put('cache', entry)
      }

      // Store in localStorage as backup
      SafeStorage.setItem(fullKey, entry, { expiresIn: options.ttl })

      // Sync if enabled
      if (options.sync !== false && this.syncManager) {
        await this.syncManager.sync(fullKey, entry, [StorageLayer.INDEXED_DB, StorageLayer.LOCAL_STORAGE])
      }

      this.recordMetric(namespace, StorageOperation.SET, true, performance.now() - startTime)
    } catch (error) {
      this.recordMetric(namespace, StorageOperation.SET, false, performance.now() - startTime)
      throw error
    }
  }

  async delete(namespace: AgentNamespace, key: string): Promise<boolean> {
    const startTime = performance.now()
    const fullKey = this.buildKey(namespace, key)

    try {
      let deleted = false

      // Delete from IndexedDB
      if (this.indexedDB) {
        await this.indexedDB.delete('cache', fullKey)
        deleted = true
      }

      // Delete from localStorage
      if (SafeStorage.removeItem(fullKey)) {
        deleted = true
      }

      // Sync deletion
      if (this.syncManager) {
        await this.syncManager.delete(fullKey)
      }

      this.recordMetric(namespace, StorageOperation.DELETE, deleted, performance.now() - startTime)
      return deleted
    } catch (error) {
      this.recordMetric(namespace, StorageOperation.DELETE, false, performance.now() - startTime)
      throw error
    }
  }

  async clear(namespace: AgentNamespace): Promise<void> {
    const startTime = performance.now()

    try {
      // Clear namespace data from IndexedDB
      if (this.indexedDB) {
        const entries = await this.indexedDB.query<StorageEntry>('cache', {
          index: 'namespace',
          range: IDBKeyRange.only(namespace)
        })

        for (const entry of entries) {
          await this.indexedDB.delete('cache', entry.key)
        }
      }

      // Clear namespace data from localStorage
      const keys = SafeStorage.getKeys()
      const namespacePrefix = `${namespace}:`
      
      for (const key of keys) {
        if (key.startsWith(namespacePrefix)) {
          SafeStorage.removeItem(key)
        }
      }

      this.recordMetric(namespace, StorageOperation.CLEAR, true, performance.now() - startTime)
    } catch (error) {
      this.recordMetric(namespace, StorageOperation.CLEAR, false, performance.now() - startTime)
      throw error
    }
  }

  async query<T = any>(options: QueryOptions): Promise<StorageEntry<T>[]> {
    const startTime = performance.now()

    try {
      let results: StorageEntry<T>[] = []

      if (this.indexedDB) {
        // Query IndexedDB with filters
        results = await this.indexedDB.query<StorageEntry<T>>('cache', {
          limit: options.limit,
          offset: options.offset
        })
      } else {
        // Fallback to localStorage scan
        const keys = SafeStorage.getKeys()
        for (const key of keys) {
          const entry = SafeStorage.getItem<StorageEntry<T>>(key)
          if (entry) {
            results.push(entry)
          }
        }
      }

      // Apply filters
      results = this.applyQueryFilters(results, options)

      this.recordMetric(options.namespace || AgentNamespace.SHARED, StorageOperation.QUERY, true, performance.now() - startTime)
      return results
    } catch (error) {
      this.recordMetric(options.namespace || AgentNamespace.SHARED, StorageOperation.QUERY, false, performance.now() - startTime)
      throw error
    }
  }

  // Batch operations
  async batch(
    namespace: AgentNamespace,
    operations: Array<{
      operation: 'get' | 'set' | 'delete'
      key: string
      data?: any
      options?: any
    }>
  ): Promise<Array<{ success: boolean; result?: any; error?: string }>> {
    const startTime = performance.now()
    const results: Array<{ success: boolean; result?: any; error?: string }> = []

    for (const op of operations) {
      try {
        switch (op.operation) {
          case 'get':
            const result = await this.get(namespace, op.key, op.options)
            results.push({ success: true, result })
            break
          case 'set':
            await this.set(namespace, op.key, op.data, op.options)
            results.push({ success: true })
            break
          case 'delete':
            const deleted = await this.delete(namespace, op.key)
            results.push({ success: deleted })
            break
        }
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    this.recordMetric(namespace, StorageOperation.BATCH, true, performance.now() - startTime)
    return results
  }

  // Utility methods
  private buildKey(namespace: AgentNamespace, key: string): string {
    return `${namespace}:${key}`
  }

  private shouldCompress(data: any, forceCompress?: boolean): boolean {
    if (!this.config.compression.enabled) return false
    if (forceCompress === false) return false
    if (forceCompress === true) return true

    const size = JSON.stringify(data).length
    return size >= this.config.compression.threshold
  }

  private shouldEncrypt(classification?: string, forceEncrypt?: boolean): boolean {
    if (!this.config.encryption.enabled || !this.encryptionManager) return false
    if (forceEncrypt === false) return false
    if (forceEncrypt === true) return true

    return classification === 'confidential' || classification === 'restricted'
  }

  private async calculateChecksum(data: any): Promise<string> {
    const serialized = JSON.stringify(data)
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(serialized)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  private async checkQuota(namespace: AgentNamespace, entry: StorageEntry): Promise<void> {
    if (!this.config.quota.enabled) return

    const metrics = this.getMetrics(namespace)
    const entrySize = JSON.stringify(entry).length

    if (metrics.storage.used + entrySize > this.config.quota.maxLocalStorage) {
      // Attempt cleanup
      await this.cleanupNamespace(namespace)
      
      // Check again
      const updatedMetrics = this.getMetrics(namespace)
      if (updatedMetrics.storage.used + entrySize > this.config.quota.maxLocalStorage) {
        throw new Error(`Storage quota exceeded for namespace ${namespace}`)
      }
    }
  }

  private applyQueryFilters<T>(results: StorageEntry<T>[], options: QueryOptions): StorageEntry<T>[] {
    let filtered = results

    if (options.namespace) {
      filtered = filtered.filter(entry => entry.namespace === options.namespace)
    }

    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(entry => 
        options.tags!.some(tag => entry.tags?.includes(tag))
      )
    }

    if (options.classification && options.classification.length > 0) {
      filtered = filtered.filter(entry => 
        options.classification!.includes(entry.classification)
      )
    }

    if (options.dateRange) {
      filtered = filtered.filter(entry => 
        entry.created >= options.dateRange!.start &&
        entry.created <= options.dateRange!.end
      )
    }

    // Sort results
    if (options.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[options.sortBy!]
        const bValue = b[options.sortBy!]
        const multiplier = options.sortOrder === 'desc' ? -1 : 1
        return (aValue - bValue) * multiplier
      })
    }

    // Apply pagination
    if (options.offset || options.limit) {
      const start = options.offset || 0
      const end = options.limit ? start + options.limit : undefined
      filtered = filtered.slice(start, end)
    }

    return filtered
  }

  // Metrics and monitoring
  private initializeMetrics(): void {
    for (const namespace of Object.values(AgentNamespace)) {
      this.metrics.set(namespace, {
        namespace,
        operations: {
          total: 0,
          successful: 0,
          failed: 0,
          byType: {} as Record<StorageOperation, number>
        },
        performance: {
          averageLatency: 0,
          cacheHitRate: 0,
          compressionRatio: 0
        },
        storage: {
          used: 0,
          quota: 0,
          distribution: {} as Record<StorageLayer, number>
        },
        encryption: {
          encrypted: 0,
          unencrypted: 0,
          keyRotations: 0
        }
      })
    }
  }

  private recordMetric(
    namespace: AgentNamespace,
    operation: StorageOperation,
    success: boolean,
    latency: number
  ): void {
    const metric = this.metrics.get(namespace)!
    
    metric.operations.total++
    if (success) metric.operations.successful++
    else metric.operations.failed++
    
    metric.operations.byType[operation] = (metric.operations.byType[operation] || 0) + 1
    
    // Update average latency
    metric.performance.averageLatency = (
      (metric.performance.averageLatency * (metric.operations.total - 1)) + latency
    ) / metric.operations.total
  }

  getMetrics(namespace?: AgentNamespace): StorageMetrics | Map<AgentNamespace, StorageMetrics> {
    if (namespace) {
      return this.metrics.get(namespace)!
    }
    return new Map(this.metrics)
  }

  // Cleanup and maintenance
  private startCleanupTimer(): void {
    if (this.config.retention.enabled) {
      this.cleanupTimer = setInterval(async () => {
        await this.performCleanup()
      }, this.config.retention.cleanupInterval)
    }
  }

  private async performCleanup(): Promise<void> {
    for (const namespace of Object.values(AgentNamespace)) {
      await this.cleanupNamespace(namespace)
    }

    // Cleanup encryption keys
    if (this.encryptionManager) {
      await this.encryptionManager.cleanupExpiredKeys()
    }
  }

  private async cleanupNamespace(namespace: AgentNamespace): Promise<number> {
    const entries = await this.query({ namespace })
    const now = Date.now()
    let cleaned = 0

    for (const entry of entries) {
      if (entry.ttl && now > entry.created + entry.ttl) {
        await this.delete(namespace, entry.key.split(':')[1])
        cleaned++
      }
    }

    return cleaned
  }

  async destroy(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    if (this.indexedDB) {
      await this.indexedDB.close()
    }

    if (this.syncManager) {
      await this.syncManager.destroy()
    }

    this.initialized = false
  }

  // Migration setup
  private async setupMigrations(): Promise<void> {
    if (!this.migrationManager) return

    // Register common migrations
    // Add more migrations as needed
  }

  // Health check
  async healthCheck(): Promise<{
    healthy: boolean
    issues: string[]
    metrics: Record<string, any>
  }> {
    const issues: string[] = []
    let healthy = true

    if (!this.initialized) {
      issues.push('Storage manager not initialized')
      healthy = false
    }

    // Check individual components
    if (this.indexedDB) {
      const dbHealth = await this.indexedDB.healthCheck()
      if (!dbHealth.healthy) {
        issues.push(...dbHealth.issues.map(issue => `IndexedDB: ${issue}`))
        healthy = false
      }
    }

    if (this.encryptionManager) {
      const encHealth = await this.encryptionManager.healthCheck()
      if (!encHealth.healthy) {
        issues.push(...encHealth.issues.map(issue => `Encryption: ${issue}`))
        healthy = false
      }
    }

    return {
      healthy,
      issues,
      metrics: {
        namespaces: Object.fromEntries(this.metrics),
        storage: {
          indexedDB: this.indexedDB ? await this.indexedDB.getStats() : null,
          localStorage: SafeStorage.getStorageInfo(),
          sessionStorage: SafeStorage.getStorageInfo(true)
        }
      }
    }
  }
}

// Agent-specific storage interface
export class AgentStorageInterface {
  constructor(
    private manager: UnifiedStorageManager,
    private namespace: AgentNamespace
  ) {}

  async get<T = any>(key: string, options?: { decrypt?: boolean; decompress?: boolean }): Promise<T | null> {
    return this.manager.get<T>(this.namespace, key, options)
  }

  async set<T = any>(
    key: string,
    data: T,
    options?: {
      ttl?: number
      classification?: 'public' | 'internal' | 'confidential' | 'restricted'
      tags?: string[]
      encrypt?: boolean
      compress?: boolean
      sync?: boolean
    }
  ): Promise<void> {
    return this.manager.set(this.namespace, key, data, options)
  }

  async delete(key: string): Promise<boolean> {
    return this.manager.delete(this.namespace, key)
  }

  async clear(): Promise<void> {
    return this.manager.clear(this.namespace)
  }

  async query<T = any>(options?: Omit<QueryOptions, 'namespace'>): Promise<StorageEntry<T>[]> {
    return this.manager.query<T>({ ...options, namespace: this.namespace })
  }

  async batch(operations: Array<{
    operation: 'get' | 'set' | 'delete'
    key: string
    data?: any
    options?: any
  }>): Promise<Array<{ success: boolean; result?: any; error?: string }>> {
    return this.manager.batch(this.namespace, operations)
  }

  getMetrics(): StorageMetrics {
    return this.manager.getMetrics(this.namespace) as StorageMetrics
  }
}

// Factory for creating storage manager
export class StorageManagerFactory {
  private static instance: UnifiedStorageManager | null = null

  static async create(config?: Partial<StorageConfig>, masterPassword?: string): Promise<UnifiedStorageManager> {
    if (!this.instance) {
      this.instance = new UnifiedStorageManager(config)
      await this.instance.initialize(masterPassword)
    }
    return this.instance
  }

  static getInstance(): UnifiedStorageManager | null {
    return this.instance
  }

  static async destroy(): Promise<void> {
    if (this.instance) {
      await this.instance.destroy()
      this.instance = null
    }
  }
}