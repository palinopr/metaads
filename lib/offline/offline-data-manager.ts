'use client'

export interface OfflineDataItem {
  id: string
  type: 'campaign' | 'insight' | 'demographic' | 'report' | 'user-action'
  data: any
  timestamp: number
  priority: 'low' | 'normal' | 'high' | 'critical'
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict'
  retryCount: number
  lastError?: string
  dependencies?: string[]
  metadata?: {
    userId?: string
    accountId?: string
    source?: string
    version?: number
  }
}

export interface SyncConflict {
  local: OfflineDataItem
  remote: any
  type: 'data_conflict' | 'version_conflict' | 'deletion_conflict'
  resolution?: 'local' | 'remote' | 'merge' | 'manual'
}

export interface SyncProgress {
  total: number
  completed: number
  failed: number
  conflicts: number
  isActive: boolean
  currentItem?: string
  estimatedTimeRemaining?: number
}

export interface OfflineConfig {
  maxStorageSize: number // in bytes
  maxRetries: number
  syncInterval: number // in milliseconds
  batchSize: number
  priorityWeights: {
    critical: number
    high: number
    normal: number
    low: number
  }
  conflictResolution: {
    default: 'local' | 'remote' | 'manual'
    byType: Partial<Record<OfflineDataItem['type'], 'local' | 'remote' | 'manual'>>
  }
}

class OfflineDataManager {
  private dbName = 'meta-ads-offline-db'
  private dbVersion = 1
  private db: IDBDatabase | null = null
  private syncQueue: Map<string, OfflineDataItem> = new Map()
  private isOnline = navigator.onLine
  private syncInProgress = false
  private config: OfflineConfig
  private listeners: Map<string, Set<Function>> = new Map()

  constructor() {
    this.config = {
      maxStorageSize: 100 * 1024 * 1024, // 100MB
      maxRetries: 3,
      syncInterval: 30000, // 30 seconds
      batchSize: 10,
      priorityWeights: {
        critical: 1000,
        high: 100,
        normal: 10,
        low: 1
      },
      conflictResolution: {
        default: 'manual',
        byType: {
          'campaign': 'manual',
          'insight': 'remote',
          'demographic': 'remote',
          'report': 'local',
          'user-action': 'local'
        }
      }
    }

    this.setupEventListeners()
    this.initializeDatabase()
  }

  // Initialize IndexedDB
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.loadSyncQueue()
        this.startPeriodicSync()
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create main data store
        if (!db.objectStoreNames.contains('offline-data')) {
          const dataStore = db.createObjectStore('offline-data', { keyPath: 'id' })
          dataStore.createIndex('type', 'type', { unique: false })
          dataStore.createIndex('timestamp', 'timestamp', { unique: false })
          dataStore.createIndex('syncStatus', 'syncStatus', { unique: false })
          dataStore.createIndex('priority', 'priority', { unique: false })
        }

        // Create conflicts store
        if (!db.objectStoreNames.contains('sync-conflicts')) {
          const conflictsStore = db.createObjectStore('sync-conflicts', { keyPath: 'id' })
          conflictsStore.createIndex('type', 'type', { unique: false })
          conflictsStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Create metadata store
        if (!db.objectStoreNames.contains('sync-metadata')) {
          db.createObjectStore('sync-metadata', { keyPath: 'key' })
        }
      }
    })
  }

  // Store data for offline use
  async storeData(item: Omit<OfflineDataItem, 'id' | 'timestamp' | 'syncStatus' | 'retryCount'>): Promise<string> {
    const id = `${item.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const dataItem: OfflineDataItem = {
      id,
      timestamp: Date.now(),
      syncStatus: 'pending',
      retryCount: 0,
      ...item
    }

    // Store in IndexedDB
    await this.saveToIndexedDB('offline-data', dataItem)
    
    // Add to sync queue
    this.syncQueue.set(id, dataItem)
    
    // Trigger sync if online
    if (this.isOnline) {
      this.triggerSync()
    }

    this.emit('data-stored', dataItem)
    return id
  }

  // Retrieve data (with fallback to offline)
  async getData(
    type: OfflineDataItem['type'],
    query?: any,
    useCache = true
  ): Promise<OfflineDataItem[]> {
    try {
      // Try online first if available
      if (this.isOnline && !useCache) {
        const onlineData = await this.fetchFromAPI(type, query)
        // Update local cache
        for (const item of onlineData) {
          await this.storeData({
            type,
            data: item,
            priority: 'normal'
          })
        }
        return onlineData.map(data => ({
          id: `${type}-${Date.now()}`,
          type,
          data,
          timestamp: Date.now(),
          syncStatus: 'synced' as const,
          retryCount: 0,
          priority: 'normal' as const
        }))
      }

      // Fallback to offline data
      const offlineData = await this.getFromIndexedDB('offline-data', type)
      this.emit('data-retrieved', { type, count: offlineData.length, source: 'offline' })
      return offlineData
    } catch (error) {
      console.error('Error retrieving data:', error)
      return []
    }
  }

  // Update existing data
  async updateData(id: string, updates: Partial<OfflineDataItem>): Promise<boolean> {
    try {
      const existing = await this.getFromIndexedDB('offline-data', undefined, id)
      if (!existing.length) return false

      const updated = {
        ...existing[0],
        ...updates,
        timestamp: Date.now(),
        syncStatus: 'pending' as const,
        retryCount: 0
      }

      await this.saveToIndexedDB('offline-data', updated)
      this.syncQueue.set(id, updated)
      
      if (this.isOnline) {
        this.triggerSync()
      }

      this.emit('data-updated', updated)
      return true
    } catch (error) {
      console.error('Error updating data:', error)
      return false
    }
  }

  // Delete data
  async deleteData(id: string): Promise<boolean> {
    try {
      await this.deleteFromIndexedDB('offline-data', id)
      this.syncQueue.delete(id)
      this.emit('data-deleted', id)
      return true
    } catch (error) {
      console.error('Error deleting data:', error)
      return false
    }
  }

  // Manual sync trigger
  async sync(force = false): Promise<SyncProgress> {
    if (this.syncInProgress && !force) {
      return this.getSyncProgress()
    }

    this.syncInProgress = true
    this.emit('sync-started')

    const progress: SyncProgress = {
      total: this.syncQueue.size,
      completed: 0,
      failed: 0,
      conflicts: 0,
      isActive: true
    }

    try {
      // Get items sorted by priority
      const sortedItems = this.getSortedSyncItems()
      
      // Process in batches
      for (let i = 0; i < sortedItems.length; i += this.config.batchSize) {
        const batch = sortedItems.slice(i, i + this.config.batchSize)
        
        await Promise.allSettled(
          batch.map(async (item) => {
            progress.currentItem = item.id
            this.emit('sync-progress', progress)
            
            try {
              await this.syncItem(item)
              progress.completed++
            } catch (error) {
              progress.failed++
              await this.handleSyncError(item, error)
            }
          })
        )
      }

      // Handle conflicts
      const conflicts = await this.getConflicts()
      progress.conflicts = conflicts.length
      
      for (const conflict of conflicts) {
        await this.resolveConflict(conflict)
      }

    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      this.syncInProgress = false
      progress.isActive = false
      this.emit('sync-completed', progress)
    }

    return progress
  }

  // Get sync progress
  getSyncProgress(): SyncProgress {
    const pending = Array.from(this.syncQueue.values())
      .filter(item => item.syncStatus === 'pending' || item.syncStatus === 'failed')

    return {
      total: this.syncQueue.size,
      completed: this.syncQueue.size - pending.length,
      failed: pending.filter(item => item.syncStatus === 'failed').length,
      conflicts: 0, // Would need to query conflicts store
      isActive: this.syncInProgress
    }
  }

  // Get offline storage status
  async getStorageStatus(): Promise<{
    used: number
    available: number
    percentage: number
    itemCount: number
  }> {
    try {
      const estimate = await navigator.storage?.estimate?.() || { usage: 0, quota: this.config.maxStorageSize }
      const itemCount = this.syncQueue.size

      return {
        used: estimate.usage || 0,
        available: estimate.quota || this.config.maxStorageSize,
        percentage: ((estimate.usage || 0) / (estimate.quota || this.config.maxStorageSize)) * 100,
        itemCount
      }
    } catch (error) {
      return {
        used: 0,
        available: this.config.maxStorageSize,
        percentage: 0,
        itemCount: 0
      }
    }
  }

  // Clear offline data
  async clearOfflineData(type?: OfflineDataItem['type']): Promise<void> {
    try {
      if (type) {
        // Clear specific type
        const items = await this.getFromIndexedDB('offline-data', type)
        for (const item of items) {
          await this.deleteFromIndexedDB('offline-data', item.id)
          this.syncQueue.delete(item.id)
        }
      } else {
        // Clear all
        await this.clearIndexedDB('offline-data')
        this.syncQueue.clear()
      }
      
      this.emit('data-cleared', type)
    } catch (error) {
      console.error('Error clearing offline data:', error)
    }
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback)
  }

  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('Error in event listener:', error)
      }
    })
  }

  // Private methods
  private setupEventListeners(): void {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true
      this.emit('online')
      this.triggerSync()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.emit('offline')
    })

    // Page visibility for background sync
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.triggerSync()
      }
    })
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const pendingItems = await this.getFromIndexedDB('offline-data')
      for (const item of pendingItems) {
        if (item.syncStatus === 'pending' || item.syncStatus === 'failed') {
          this.syncQueue.set(item.id, item)
        }
      }
    } catch (error) {
      console.error('Error loading sync queue:', error)
    }
  }

  private startPeriodicSync(): void {
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress && this.syncQueue.size > 0) {
        this.triggerSync()
      }
    }, this.config.syncInterval)
  }

  private triggerSync(): void {
    // Debounce sync calls
    setTimeout(() => {
      if (!this.syncInProgress) {
        this.sync()
      }
    }, 1000)
  }

  private getSortedSyncItems(): OfflineDataItem[] {
    return Array.from(this.syncQueue.values())
      .filter(item => item.syncStatus === 'pending' || item.syncStatus === 'failed')
      .sort((a, b) => {
        // Sort by priority weight, then by timestamp
        const weightA = this.config.priorityWeights[a.priority]
        const weightB = this.config.priorityWeights[b.priority]
        
        if (weightA !== weightB) {
          return weightB - weightA // Higher weight first
        }
        
        return a.timestamp - b.timestamp // Older first
      })
  }

  private async syncItem(item: OfflineDataItem): Promise<void> {
    try {
      // Update status
      item.syncStatus = 'syncing'
      await this.saveToIndexedDB('offline-data', item)

      // Sync to server
      const response = await this.sendToAPI(item)
      
      // Handle response
      if (response.success) {
        item.syncStatus = 'synced'
        this.syncQueue.delete(item.id)
      } else if (response.conflict) {
        await this.handleConflict(item, response.remoteData)
      } else {
        throw new Error(response.error || 'Sync failed')
      }

      await this.saveToIndexedDB('offline-data', item)
    } catch (error) {
      throw error
    }
  }

  private async handleSyncError(item: OfflineDataItem, error: any): Promise<void> {
    item.retryCount++
    item.lastError = error.message
    
    if (item.retryCount >= this.config.maxRetries) {
      item.syncStatus = 'failed'
    } else {
      item.syncStatus = 'pending'
    }
    
    await this.saveToIndexedDB('offline-data', item)
  }

  private async handleConflict(local: OfflineDataItem, remote: any): Promise<void> {
    const conflict: SyncConflict = {
      local,
      remote,
      type: 'data_conflict'
    }

    // Auto-resolve based on configuration
    const resolution = this.config.conflictResolution.byType[local.type] || 
                      this.config.conflictResolution.default

    if (resolution !== 'manual') {
      conflict.resolution = resolution
      await this.resolveConflict(conflict)
    } else {
      // Store for manual resolution
      await this.saveToIndexedDB('sync-conflicts', {
        id: `conflict-${local.id}`,
        ...conflict,
        timestamp: Date.now()
      })
    }
  }

  private async resolveConflict(conflict: SyncConflict): Promise<void> {
    switch (conflict.resolution) {
      case 'local':
        // Keep local version
        await this.sendToAPI(conflict.local, true) // Force update
        break
      case 'remote':
        // Use remote version
        conflict.local.data = conflict.remote
        conflict.local.syncStatus = 'synced'
        await this.saveToIndexedDB('offline-data', conflict.local)
        break
      case 'merge':
        // Merge data (implementation depends on data structure)
        const merged = this.mergeData(conflict.local.data, conflict.remote)
        conflict.local.data = merged
        await this.sendToAPI(conflict.local, true)
        break
    }
  }

  private mergeData(local: any, remote: any): any {
    // Simple merge strategy - can be enhanced based on data structure
    return {
      ...remote,
      ...local,
      mergedAt: Date.now()
    }
  }

  private async getConflicts(): Promise<SyncConflict[]> {
    return this.getFromIndexedDB('sync-conflicts')
  }

  // IndexedDB helper methods
  private async saveToIndexedDB(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'))
      
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async getFromIndexedDB(
    storeName: string, 
    type?: string, 
    id?: string
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'))
      
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      
      if (id) {
        const request = store.get(id)
        request.onsuccess = () => resolve(request.result ? [request.result] : [])
        request.onerror = () => reject(request.error)
      } else if (type) {
        const index = store.index('type')
        const request = index.getAll(type)
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      } else {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      }
    })
  }

  private async deleteFromIndexedDB(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'))
      
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async clearIndexedDB(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'))
      
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // API helper methods
  private async fetchFromAPI(type: string, query?: any): Promise<any[]> {
    const response = await fetch(`/api/${type}${query ? `?${new URLSearchParams(query)}` : ''}`)
    if (!response.ok) throw new Error(`API fetch failed: ${response.statusText}`)
    return response.json()
  }

  private async sendToAPI(item: OfflineDataItem, force = false): Promise<{
    success: boolean
    conflict?: boolean
    remoteData?: any
    error?: string
  }> {
    try {
      const response = await fetch(`/api/${item.type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(force && { 'X-Force-Update': 'true' })
        },
        body: JSON.stringify(item)
      })

      const result = await response.json()
      
      if (response.status === 409) {
        return {
          success: false,
          conflict: true,
          remoteData: result.data
        }
      }

      return {
        success: response.ok,
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const offlineDataManager = new OfflineDataManager()