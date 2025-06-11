// Advanced IndexedDB optimization system for large datasets
import { z } from 'zod'

// Schema validation
const IndexedDBConfigSchema = z.object({
  databaseName: z.string(),
  version: z.number(),
  stores: z.array(z.object({
    name: z.string(),
    keyPath: z.string().optional(),
    autoIncrement: z.boolean().optional(),
    indices: z.array(z.object({
      name: z.string(),
      keyPath: z.union([z.string(), z.array(z.string())]),
      unique: z.boolean().optional(),
      multiEntry: z.boolean().optional()
    })).optional()
  }))
})

export type IndexedDBConfig = z.infer<typeof IndexedDBConfigSchema>

export interface QueryOptions {
  index?: string
  range?: IDBKeyRange
  direction?: IDBCursorDirection
  limit?: number
  offset?: number
}

export interface TransactionOptions {
  mode?: IDBTransactionMode
  durability?: 'default' | 'strict' | 'relaxed'
}

export interface BulkOperation<T> {
  operation: 'put' | 'delete' | 'add'
  data: T[]
  batchSize?: number
  onProgress?: (progress: number) => void
}

export interface IndexStats {
  storeName: string
  indexName?: string
  recordCount: number
  estimatedSize: number
  lastUpdated: Date
}

export interface QueryPerformance {
  query: string
  executionTime: number
  recordsReturned: number
  indexUsed?: string
  timestamp: Date
}

export class IndexedDBOptimizer {
  private db: IDBDatabase | null = null
  private config: IndexedDBConfig
  private queryPerformanceLog: QueryPerformance[] = []
  private readonly maxPerformanceLogSize = 1000

  constructor(config: IndexedDBConfig) {
    this.config = IndexedDBConfigSchema.parse(config)
  }

  // Initialize database with optimized configuration
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.databaseName, this.config.version)

      request.onerror = () => reject(new Error(`Failed to open database: ${request.error?.message}`))
      
      request.onsuccess = () => {
        this.db = request.result
        this.setupErrorHandling()
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        this.createStores(db)
      }
    })
  }

  private setupErrorHandling(): void {
    if (this.db) {
      this.db.onerror = (event) => {
        console.error('IndexedDB error:', event)
      }

      this.db.onversionchange = () => {
        console.warn('Database version changed, closing connection')
        this.db?.close()
        this.db = null
      }
    }
  }

  private createStores(db: IDBDatabase): void {
    this.config.stores.forEach(storeConfig => {
      // Create object store
      const store = db.createObjectStore(storeConfig.name, {
        keyPath: storeConfig.keyPath,
        autoIncrement: storeConfig.autoIncrement
      })

      // Create indices for optimization
      storeConfig.indices?.forEach(indexConfig => {
        store.createIndex(indexConfig.name, indexConfig.keyPath, {
          unique: indexConfig.unique || false,
          multiEntry: indexConfig.multiEntry || false
        })
      })
    })
  }

  // Optimized bulk operations with batching
  async bulkOperation<T>(storeName: string, operation: BulkOperation<T>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const batchSize = operation.batchSize || 1000
    const totalItems = operation.data.length
    let processed = 0

    for (let i = 0; i < totalItems; i += batchSize) {
      const batch = operation.data.slice(i, i + batchSize)
      
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)

        transaction.oncomplete = () => {
          processed += batch.length
          operation.onProgress?.(processed / totalItems)
          resolve()
        }

        transaction.onerror = () => reject(transaction.error)

        batch.forEach(item => {
          switch (operation.operation) {
            case 'put':
              store.put(item)
              break
            case 'add':
              store.add(item)
              break
            case 'delete':
              store.delete(item as any)
              break
          }
        })
      })

      // Yield control to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }

  // Optimized query with performance tracking
  async query<T>(
    storeName: string,
    options: QueryOptions = {}
  ): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized')

    const startTime = performance.now()
    const queryId = `${storeName}_${Date.now()}`

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      
      let source: IDBObjectStore | IDBIndex = store
      let indexUsed: string | undefined

      if (options.index) {
        source = store.index(options.index)
        indexUsed = options.index
      }

      const request = options.range 
        ? source.openCursor(options.range, options.direction)
        : source.openCursor(null, options.direction)

      const results: T[] = []
      let skipped = 0
      let collected = 0

      request.onsuccess = () => {
        const cursor = request.result

        if (cursor) {
          // Handle offset
          if (options.offset && skipped < options.offset) {
            skipped++
            cursor.continue()
            return
          }

          // Handle limit
          if (options.limit && collected >= options.limit) {
            this.logQueryPerformance(queryId, startTime, results.length, indexUsed)
            resolve(results)
            return
          }

          results.push(cursor.value)
          collected++
          cursor.continue()
        } else {
          this.logQueryPerformance(queryId, startTime, results.length, indexUsed)
          resolve(results)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  // Optimized count operation
  async count(storeName: string, options: Pick<QueryOptions, 'index' | 'range'> = {}): Promise<number> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      
      let source: IDBObjectStore | IDBIndex = store

      if (options.index) {
        source = store.index(options.index)
      }

      const request = options.range 
        ? source.count(options.range)
        : source.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Get single record with caching
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Put single record
  async put<T>(storeName: string, data: T, key?: IDBValidKey): Promise<IDBValidKey> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = key ? store.put(data, key) : store.put(data)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Delete record
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Clear store
  async clear(storeName: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Get database statistics
  async getStats(): Promise<IndexStats[]> {
    if (!this.db) throw new Error('Database not initialized')

    const stats: IndexStats[] = []

    for (const storeConfig of this.config.stores) {
      const recordCount = await this.count(storeConfig.name)
      
      stats.push({
        storeName: storeConfig.name,
        recordCount,
        estimatedSize: recordCount * 1024, // Rough estimate
        lastUpdated: new Date()
      })

      // Stats for indices
      if (storeConfig.indices) {
        for (const indexConfig of storeConfig.indices) {
          stats.push({
            storeName: storeConfig.name,
            indexName: indexConfig.name,
            recordCount,
            estimatedSize: recordCount * 100, // Index overhead estimate
            lastUpdated: new Date()
          })
        }
      }
    }

    return stats
  }

  // Optimize database performance
  async optimize(): Promise<void> {
    if (!this.db) return

    // Compact database by recreating it
    const backupData = await this.exportData()
    await this.close()
    await this.deleteDatabase()
    await this.initialize()
    await this.importData(backupData)
  }

  // Export all data for backup
  async exportData(): Promise<Record<string, any[]>> {
    if (!this.db) throw new Error('Database not initialized')

    const data: Record<string, any[]> = {}

    for (const storeConfig of this.config.stores) {
      data[storeConfig.name] = await this.query(storeConfig.name)
    }

    return data
  }

  // Import data from backup
  async importData(data: Record<string, any[]>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    for (const [storeName, records] of Object.entries(data)) {
      if (records.length > 0) {
        await this.bulkOperation(storeName, {
          operation: 'put',
          data: records,
          batchSize: 1000
        })
      }
    }
  }

  // Log query performance
  private logQueryPerformance(
    query: string,
    startTime: number,
    recordsReturned: number,
    indexUsed?: string
  ): void {
    const performance: QueryPerformance = {
      query,
      executionTime: Date.now() - startTime,
      recordsReturned,
      indexUsed,
      timestamp: new Date()
    }

    this.queryPerformanceLog.push(performance)

    // Keep log size manageable
    if (this.queryPerformanceLog.length > this.maxPerformanceLogSize) {
      this.queryPerformanceLog.shift()
    }
  }

  // Get performance analytics
  getPerformanceAnalytics(): {
    averageQueryTime: number
    slowQueries: QueryPerformance[]
    indexUsage: Record<string, number>
    totalQueries: number
  } {
    if (this.queryPerformanceLog.length === 0) {
      return {
        averageQueryTime: 0,
        slowQueries: [],
        indexUsage: {},
        totalQueries: 0
      }
    }

    const totalTime = this.queryPerformanceLog.reduce((sum, log) => sum + log.executionTime, 0)
    const averageQueryTime = totalTime / this.queryPerformanceLog.length

    const slowQueries = this.queryPerformanceLog
      .filter(log => log.executionTime > averageQueryTime * 2)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10)

    const indexUsage: Record<string, number> = {}
    this.queryPerformanceLog.forEach(log => {
      if (log.indexUsed) {
        indexUsage[log.indexUsed] = (indexUsage[log.indexUsed] || 0) + 1
      }
    })

    return {
      averageQueryTime,
      slowQueries,
      indexUsage,
      totalQueries: this.queryPerformanceLog.length
    }
  }

  // Close database connection
  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  // Delete database
  async deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.config.databaseName)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Check if database is healthy
  async healthCheck(): Promise<{
    healthy: boolean
    issues: string[]
    stats: IndexStats[]
  }> {
    const issues: string[] = []
    let healthy = true

    try {
      if (!this.db) {
        issues.push('Database not initialized')
        healthy = false
      }

      const stats = await this.getStats()
      
      // Check for performance issues
      const performanceAnalytics = this.getPerformanceAnalytics()
      if (performanceAnalytics.averageQueryTime > 100) {
        issues.push(`Average query time is high: ${performanceAnalytics.averageQueryTime}ms`)
        healthy = false
      }

      // Check for unused indices
      for (const [index, usage] of Object.entries(performanceAnalytics.indexUsage)) {
        if (usage < 10 && performanceAnalytics.totalQueries > 100) {
          issues.push(`Index "${index}" is underutilized`)
        }
      }

      return { healthy, issues, stats }
    } catch (error) {
      return {
        healthy: false,
        issues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        stats: []
      }
    }
  }
}

// Factory for creating optimized IndexedDB instances
export class IndexedDBFactory {
  private static instances = new Map<string, IndexedDBOptimizer>()

  static async createMetaAdsDB(): Promise<IndexedDBOptimizer> {
    const config: IndexedDBConfig = {
      databaseName: 'meta-ads-dashboard',
      version: 1,
      stores: [
        {
          name: 'campaigns',
          keyPath: 'id',
          indices: [
            { name: 'status', keyPath: 'status' },
            { name: 'objective', keyPath: 'objective' },
            { name: 'account_id', keyPath: 'account_id' },
            { name: 'created_time', keyPath: 'created_time' },
            { name: 'updated_time', keyPath: 'updated_time' }
          ]
        },
        {
          name: 'insights',
          keyPath: 'id',
          indices: [
            { name: 'campaign_id', keyPath: 'campaign_id' },
            { name: 'date_start', keyPath: 'date_start' },
            { name: 'date_stop', keyPath: 'date_stop' },
            { name: 'spend', keyPath: 'spend' },
            { name: 'impressions', keyPath: 'impressions' }
          ]
        },
        {
          name: 'cache',
          keyPath: 'key',
          indices: [
            { name: 'timestamp', keyPath: 'timestamp' },
            { name: 'category', keyPath: 'category' },
            { name: 'expires', keyPath: 'expires' }
          ]
        },
        {
          name: 'user_preferences',
          keyPath: 'userId'
        },
        {
          name: 'audit_logs',
          keyPath: 'id',
          autoIncrement: true,
          indices: [
            { name: 'timestamp', keyPath: 'timestamp' },
            { name: 'action', keyPath: 'action' },
            { name: 'user_id', keyPath: 'user_id' }
          ]
        }
      ]
    }

    const key = config.databaseName
    if (!this.instances.has(key)) {
      const db = new IndexedDBOptimizer(config)
      await db.initialize()
      this.instances.set(key, db)
    }

    return this.instances.get(key)!
  }

  static async cleanup(): Promise<void> {
    for (const [key, db] of this.instances.entries()) {
      await db.close()
      this.instances.delete(key)
    }
  }
}