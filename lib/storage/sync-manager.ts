// Advanced data synchronization layer between storage systems
import { z } from 'zod'
import { SafeStorage } from '../storage-utils'
import { IndexedDBOptimizer } from './indexeddb-optimizer'
import { SerializationManager, SerializedData } from './compression-utils'

// Sync configuration schema
const SyncConfigSchema = z.object({
  syncInterval: z.number().min(1000), // Minimum 1 second
  batchSize: z.number().min(1).max(1000),
  maxRetries: z.number().min(0).max(10),
  conflictResolution: z.enum(['local_wins', 'remote_wins', 'timestamp', 'manual']),
  enableRealtimeSync: z.boolean(),
  syncPriority: z.enum(['performance', 'consistency', 'balanced'])
})

export type SyncConfig = z.infer<typeof SyncConfigSchema>

// Storage layers enum
export enum StorageLayer {
  MEMORY = 'memory',
  LOCAL_STORAGE = 'localStorage',
  SESSION_STORAGE = 'sessionStorage',
  INDEXED_DB = 'indexedDB',
  CACHE_API = 'cacheAPI',
  REMOTE = 'remote'
}

// Sync operation types
export enum SyncOperation {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  BATCH = 'batch'
}

// Sync status
export enum SyncStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CONFLICT = 'conflict'
}

export interface SyncRecord {
  id: string
  key: string
  operation: SyncOperation
  data?: any
  timestamp: number
  version: number
  layer: StorageLayer
  status: SyncStatus
  retryCount: number
  error?: string
  checksum?: string
  metadata?: Record<string, any>
}

export interface ConflictRecord {
  id: string
  key: string
  localData: any
  remoteData: any
  localTimestamp: number
  remoteTimestamp: number
  localVersion: number
  remoteVersion: number
  resolutionStrategy: string
  resolved: boolean
  resolution?: any
}

export interface SyncMetrics {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  conflictCount: number
  averageSyncTime: number
  lastSyncTime: number
  dataTransferred: number
  syncErrors: string[]
}

export class StorageSyncManager {
  private config: SyncConfig
  private indexedDB: IndexedDBOptimizer | null = null
  private serializer = new SerializationManager()
  private syncQueue: Map<string, SyncRecord> = new Map()
  private conflicts: Map<string, ConflictRecord> = new Map()
  private metrics: SyncMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    conflictCount: 0,
    averageSyncTime: 0,
    lastSyncTime: 0,
    dataTransferred: 0,
    syncErrors: []
  }
  private syncTimer?: NodeJS.Timeout
  private eventListeners: Map<string, Function[]> = new Map()

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = SyncConfigSchema.parse({
      syncInterval: 30000, // 30 seconds
      batchSize: 100,
      maxRetries: 3,
      conflictResolution: 'timestamp',
      enableRealtimeSync: true,
      syncPriority: 'balanced',
      ...config
    })
  }

  // Initialize sync manager
  async initialize(indexedDB?: IndexedDBOptimizer): Promise<void> {
    this.indexedDB = indexedDB || null
    
    // Load pending sync operations
    await this.loadPendingOperations()
    
    // Start sync timer if realtime sync is enabled
    if (this.config.enableRealtimeSync) {
      this.startSyncTimer()
    }

    // Setup storage event listeners
    this.setupStorageListeners()
  }

  // Add data to sync queue
  async queueSync(
    key: string,
    data: any,
    operation: SyncOperation,
    targetLayers: StorageLayer[] = [StorageLayer.INDEXED_DB, StorageLayer.LOCAL_STORAGE]
  ): Promise<string> {
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const syncRecord: SyncRecord = {
      id,
      key,
      operation,
      data,
      timestamp: Date.now(),
      version: await this.getNextVersion(key),
      layer: targetLayers[0], // Primary layer
      status: SyncStatus.PENDING,
      retryCount: 0,
      checksum: await this.calculateChecksum(data)
    }

    this.syncQueue.set(id, syncRecord)
    
    // Trigger immediate sync for high priority operations
    if (this.config.syncPriority === 'performance') {
      setImmediate(() => this.processSync(syncRecord, targetLayers))
    }

    this.emit('queueUpdated', { operation: 'add', record: syncRecord })
    return id
  }

  // Process individual sync operation
  private async processSync(record: SyncRecord, targetLayers: StorageLayer[]): Promise<void> {
    const startTime = Date.now()
    record.status = SyncStatus.IN_PROGRESS

    try {
      for (const layer of targetLayers) {
        await this.syncToLayer(record, layer)
      }

      record.status = SyncStatus.COMPLETED
      this.metrics.successfulOperations++
      this.syncQueue.delete(record.id)
      
    } catch (error) {
      record.status = SyncStatus.FAILED
      record.error = error instanceof Error ? error.message : 'Unknown error'
      record.retryCount++
      
      this.metrics.failedOperations++
      this.metrics.syncErrors.push(record.error)

      // Retry if under limit
      if (record.retryCount < this.config.maxRetries) {
        record.status = SyncStatus.PENDING
        setTimeout(() => this.processSync(record, targetLayers), 
          Math.pow(2, record.retryCount) * 1000) // Exponential backoff
      }
    }

    const syncTime = Date.now() - startTime
    this.updateMetrics(syncTime)
    this.emit('syncCompleted', { record, syncTime })
  }

  // Sync to specific storage layer
  private async syncToLayer(record: SyncRecord, layer: StorageLayer): Promise<void> {
    switch (layer) {
      case StorageLayer.LOCAL_STORAGE:
        await this.syncToLocalStorage(record)
        break
      case StorageLayer.SESSION_STORAGE:
        await this.syncToSessionStorage(record)
        break
      case StorageLayer.INDEXED_DB:
        await this.syncToIndexedDB(record)
        break
      case StorageLayer.CACHE_API:
        await this.syncToCacheAPI(record)
        break
      case StorageLayer.MEMORY:
        await this.syncToMemory(record)
        break
      default:
        throw new Error(`Unsupported storage layer: ${layer}`)
    }
  }

  private async syncToLocalStorage(record: SyncRecord): Promise<void> {
    const serialized = await this.serializer.serialize(record.data)
    
    switch (record.operation) {
      case SyncOperation.CREATE:
      case SyncOperation.UPDATE:
        SafeStorage.setItem(record.key, serialized)
        break
      case SyncOperation.DELETE:
        SafeStorage.removeItem(record.key)
        break
    }
  }

  private async syncToSessionStorage(record: SyncRecord): Promise<void> {
    const serialized = await this.serializer.serialize(record.data)
    
    switch (record.operation) {
      case SyncOperation.CREATE:
      case SyncOperation.UPDATE:
        SafeStorage.setItem(record.key, serialized, { useSession: true })
        break
      case SyncOperation.DELETE:
        SafeStorage.removeItem(record.key, true)
        break
    }
  }

  private async syncToIndexedDB(record: SyncRecord): Promise<void> {
    if (!this.indexedDB) {
      throw new Error('IndexedDB not initialized')
    }

    switch (record.operation) {
      case SyncOperation.CREATE:
      case SyncOperation.UPDATE:
        await this.indexedDB.put('cache', {
          key: record.key,
          data: record.data,
          timestamp: record.timestamp,
          version: record.version,
          checksum: record.checksum
        })
        break
      case SyncOperation.DELETE:
        await this.indexedDB.delete('cache', record.key)
        break
    }
  }

  private async syncToCacheAPI(record: SyncRecord): Promise<void> {
    if (!('caches' in window)) {
      throw new Error('Cache API not supported')
    }

    const cache = await caches.open('meta-ads-sync')
    const url = `/sync-cache/${record.key}`

    switch (record.operation) {
      case SyncOperation.CREATE:
      case SyncOperation.UPDATE:
        const response = new Response(JSON.stringify(record.data), {
          headers: {
            'Content-Type': 'application/json',
            'X-Sync-Timestamp': record.timestamp.toString(),
            'X-Sync-Version': record.version.toString()
          }
        })
        await cache.put(url, response)
        break
      case SyncOperation.DELETE:
        await cache.delete(url)
        break
    }
  }

  private async syncToMemory(record: SyncRecord): Promise<void> {
    // Simple in-memory cache implementation
    const memoryCache = (globalThis as any).__syncMemoryCache || new Map()
    ;(globalThis as any).__syncMemoryCache = memoryCache

    switch (record.operation) {
      case SyncOperation.CREATE:
      case SyncOperation.UPDATE:
        memoryCache.set(record.key, {
          data: record.data,
          timestamp: record.timestamp,
          version: record.version
        })
        break
      case SyncOperation.DELETE:
        memoryCache.delete(record.key)
        break
    }
  }

  // Detect and handle conflicts
  async detectConflicts(key: string, newData: any, newTimestamp: number): Promise<ConflictRecord | null> {
    const existingData = await this.getFromAllLayers(key)
    
    for (const [layer, data] of existingData.entries()) {
      if (data && data.timestamp !== newTimestamp) {
        const conflict: ConflictRecord = {
          id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          key,
          localData: data.data,
          remoteData: newData,
          localTimestamp: data.timestamp,
          remoteTimestamp: newTimestamp,
          localVersion: data.version,
          remoteVersion: await this.getNextVersion(key),
          resolutionStrategy: this.config.conflictResolution,
          resolved: false
        }

        this.conflicts.set(conflict.id, conflict)
        this.metrics.conflictCount++
        
        // Auto-resolve based on strategy
        await this.resolveConflict(conflict.id)
        return conflict
      }
    }

    return null
  }

  // Resolve conflicts based on strategy
  async resolveConflict(conflictId: string): Promise<void> {
    const conflict = this.conflicts.get(conflictId)
    if (!conflict || conflict.resolved) return

    let resolution: any

    switch (conflict.resolutionStrategy) {
      case 'local_wins':
        resolution = conflict.localData
        break
      case 'remote_wins':
        resolution = conflict.remoteData
        break
      case 'timestamp':
        resolution = conflict.localTimestamp > conflict.remoteTimestamp 
          ? conflict.localData 
          : conflict.remoteData
        break
      case 'manual':
        // Emit event for manual resolution
        this.emit('conflictDetected', conflict)
        return
    }

    conflict.resolution = resolution
    conflict.resolved = true

    // Apply resolution to all layers
    await this.queueSync(conflict.key, resolution, SyncOperation.UPDATE)
    this.emit('conflictResolved', conflict)
  }

  // Get data from all storage layers
  private async getFromAllLayers(key: string): Promise<Map<StorageLayer, any>> {
    const results = new Map<StorageLayer, any>()

    // Local Storage
    try {
      const localData = SafeStorage.getItem(key)
      if (localData) results.set(StorageLayer.LOCAL_STORAGE, localData)
    } catch (e) { /* ignore */ }

    // Session Storage
    try {
      const sessionData = SafeStorage.getItem(key, true)
      if (sessionData) results.set(StorageLayer.SESSION_STORAGE, sessionData)
    } catch (e) { /* ignore */ }

    // IndexedDB
    if (this.indexedDB) {
      try {
        const indexedData = await this.indexedDB.get('cache', key)
        if (indexedData) results.set(StorageLayer.INDEXED_DB, indexedData)
      } catch (e) { /* ignore */ }
    }

    // Cache API
    if ('caches' in window) {
      try {
        const cache = await caches.open('meta-ads-sync')
        const response = await cache.match(`/sync-cache/${key}`)
        if (response) {
          const data = await response.json()
          results.set(StorageLayer.CACHE_API, {
            data,
            timestamp: parseInt(response.headers.get('X-Sync-Timestamp') || '0'),
            version: parseInt(response.headers.get('X-Sync-Version') || '1')
          })
        }
      } catch (e) { /* ignore */ }
    }

    return results
  }

  // Batch sync operations
  async batchSync(): Promise<void> {
    const pendingOperations = Array.from(this.syncQueue.values())
      .filter(record => record.status === SyncStatus.PENDING)
      .slice(0, this.config.batchSize)

    if (pendingOperations.length === 0) return

    const startTime = Date.now()
    const results = await Promise.allSettled(
      pendingOperations.map(record => 
        this.processSync(record, [StorageLayer.INDEXED_DB, StorageLayer.LOCAL_STORAGE])
      )
    )

    const batchTime = Date.now() - startTime
    this.updateMetrics(batchTime / results.length)

    this.emit('batchSyncCompleted', { 
      operations: pendingOperations.length, 
      time: batchTime 
    })
  }

  // Start automatic sync timer
  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }

    this.syncTimer = setInterval(() => {
      this.batchSync().catch(error => {
        console.error('Batch sync failed:', error)
        this.metrics.syncErrors.push(error.message)
      })
    }, this.config.syncInterval)
  }

  // Stop sync timer
  stopSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = undefined
    }
  }

  // Setup storage event listeners
  private setupStorageListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key && event.newValue) {
          this.emit('storageChanged', {
            key: event.key,
            oldValue: event.oldValue,
            newValue: event.newValue,
            layer: StorageLayer.LOCAL_STORAGE
          })
        }
      })
    }
  }

  // Load pending operations from storage
  private async loadPendingOperations(): Promise<void> {
    const pendingOps = SafeStorage.getItem<SyncRecord[]>('_sync_pending') || []
    
    for (const op of pendingOps) {
      this.syncQueue.set(op.id, op)
    }
  }

  // Save pending operations to storage
  private async savePendingOperations(): Promise<void> {
    const pendingOps = Array.from(this.syncQueue.values())
      .filter(record => record.status === SyncStatus.PENDING)
    
    SafeStorage.setItem('_sync_pending', pendingOps)
  }

  // Utility methods
  private async getNextVersion(key: string): Promise<number> {
    const versions = SafeStorage.getItem<Record<string, number>>('_sync_versions') || {}
    const currentVersion = versions[key] || 0
    const nextVersion = currentVersion + 1
    
    versions[key] = nextVersion
    SafeStorage.setItem('_sync_versions', versions)
    
    return nextVersion
  }

  private async calculateChecksum(data: any): Promise<string> {
    const serialized = JSON.stringify(data)
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(serialized)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  private updateMetrics(syncTime: number): void {
    this.metrics.totalOperations++
    this.metrics.lastSyncTime = Date.now()
    
    // Update average sync time
    this.metrics.averageSyncTime = (
      (this.metrics.averageSyncTime * (this.metrics.totalOperations - 1)) + syncTime
    ) / this.metrics.totalOperations

    // Keep error log manageable
    if (this.metrics.syncErrors.length > 100) {
      this.metrics.syncErrors = this.metrics.syncErrors.slice(-50)
    }
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Event listener error for ${event}:`, error)
        }
      })
    }
  }

  // Public API methods
  async sync(key: string, data: any, targetLayers?: StorageLayer[]): Promise<string> {
    return this.queueSync(key, data, SyncOperation.UPDATE, targetLayers)
  }

  async create(key: string, data: any, targetLayers?: StorageLayer[]): Promise<string> {
    return this.queueSync(key, data, SyncOperation.CREATE, targetLayers)
  }

  async delete(key: string, targetLayers?: StorageLayer[]): Promise<string> {
    return this.queueSync(key, null, SyncOperation.DELETE, targetLayers)
  }

  getMetrics(): SyncMetrics {
    return { ...this.metrics }
  }

  getPendingOperations(): SyncRecord[] {
    return Array.from(this.syncQueue.values())
      .filter(record => record.status === SyncStatus.PENDING)
  }

  getConflicts(): ConflictRecord[] {
    return Array.from(this.conflicts.values())
      .filter(conflict => !conflict.resolved)
  }

  async clearQueue(): Promise<void> {
    this.syncQueue.clear()
    SafeStorage.removeItem('_sync_pending')
  }

  async destroy(): Promise<void> {
    this.stopSync()
    await this.savePendingOperations()
    this.eventListeners.clear()
  }
}

// Factory for creating sync manager instances
export class SyncManagerFactory {
  private static instances = new Map<string, StorageSyncManager>()

  static create(
    name: string,
    config?: Partial<SyncConfig>,
    indexedDB?: IndexedDBOptimizer
  ): StorageSyncManager {
    if (!this.instances.has(name)) {
      const manager = new StorageSyncManager(config)
      manager.initialize(indexedDB)
      this.instances.set(name, manager)
    }
    return this.instances.get(name)!
  }

  static async destroy(name: string): Promise<void> {
    const manager = this.instances.get(name)
    if (manager) {
      await manager.destroy()
      this.instances.delete(name)
    }
  }

  static async destroyAll(): Promise<void> {
    const promises = Array.from(this.instances.keys()).map(name => this.destroy(name))
    await Promise.all(promises)
  }
}