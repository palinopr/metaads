import { TrackedError } from './error-types'

export interface OfflineQueueItem {
  id: string
  type: 'error' | 'metric' | 'log'
  data: any
  timestamp: string
  retryCount: number
  maxRetries: number
}

export class OfflineErrorQueue {
  private static instance: OfflineErrorQueue
  private queue: OfflineQueueItem[] = []
  private isOnline: boolean = true
  private flushInterval: NodeJS.Timeout | null = null
  private readonly STORAGE_KEY = 'error_queue_offline'
  private readonly MAX_QUEUE_SIZE = 100
  private readonly FLUSH_INTERVAL = 30000 // 30 seconds

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeQueue()
    }
  }

  static getInstance(): OfflineErrorQueue {
    if (!OfflineErrorQueue.instance) {
      OfflineErrorQueue.instance = new OfflineErrorQueue()
    }
    return OfflineErrorQueue.instance
  }

  private initializeQueue() {
    // Load persisted queue from localStorage
    this.loadPersistedQueue()

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true
      this.startFlushInterval()
      this.flushQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.stopFlushInterval()
    })

    // Set initial online status
    this.isOnline = navigator.onLine

    if (this.isOnline) {
      this.startFlushInterval()
    }

    // Flush queue before page unload
    window.addEventListener('beforeunload', () => {
      this.persistQueue()
    })
  }

  enqueue(type: OfflineQueueItem['type'], data: any, maxRetries: number = 3): void {
    const item: OfflineQueueItem = {
      id: this.generateId(),
      type,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries
    }

    this.queue.push(item)

    // Maintain queue size limit
    if (this.queue.length > this.MAX_QUEUE_SIZE) {
      // Remove oldest items
      this.queue = this.queue.slice(-this.MAX_QUEUE_SIZE)
    }

    // Persist to storage immediately
    this.persistQueue()

    // Try to flush if online
    if (this.isOnline) {
      this.flushQueue()
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.queue.length === 0 || !this.isOnline) {
      return
    }

    console.log(`Flushing ${this.queue.length} items from offline queue`)\n\n    const itemsToProcess = [...this.queue]\n    const successfulItems: string[] = []\n    const failedItems: OfflineQueueItem[] = []\n\n    for (const item of itemsToProcess) {\n      try {\n        const success = await this.processItem(item)\n        \n        if (success) {\n          successfulItems.push(item.id)\n        } else {\n          // Increment retry count\n          item.retryCount++\n          \n          if (item.retryCount < item.maxRetries) {\n            failedItems.push(item)\n          } else {\n            console.warn(`Dropping item after ${item.maxRetries} failed attempts:`, item)\n          }\n        }\n      } catch (error) {\n        console.error('Error processing queue item:', error)\n        \n        item.retryCount++\n        if (item.retryCount < item.maxRetries) {\n          failedItems.push(item)\n        }\n      }\n    }\n\n    // Update queue with failed items only\n    this.queue = failedItems\n    this.persistQueue()\n\n    if (successfulItems.length > 0) {\n      console.log(`Successfully processed ${successfulItems.length} items from queue`)\n    }\n  }\n\n  private async processItem(item: OfflineQueueItem): Promise<boolean> {\n    try {\n      let endpoint: string\n      let payload: any\n\n      switch (item.type) {\n        case 'error':\n          endpoint = '/api/log-error'\n          payload = { errors: [item.data], batch: true, offline: true }\n          break\n        case 'metric':\n          endpoint = '/api/error-metrics'\n          payload = item.data\n          break\n        case 'log':\n          endpoint = '/api/logs'\n          payload = item.data\n          break\n        default:\n          console.warn('Unknown queue item type:', item.type)\n          return false\n      }\n\n      const response = await fetch(endpoint, {\n        method: 'POST',\n        headers: {\n          'Content-Type': 'application/json',\n        },\n        body: JSON.stringify(payload)\n      })\n\n      return response.ok\n    } catch (error) {\n      console.error('Failed to process queue item:', error)\n      return false\n    }\n  }\n\n  private persistQueue(): void {\n    try {\n      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue))\n    } catch (error) {\n      console.error('Failed to persist error queue:', error)\n      \n      // If localStorage is full, try to clear some space\n      try {\n        this.clearOldData()\n        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue.slice(-50)))\n      } catch (e) {\n        console.error('Failed to persist queue after cleanup:', e)\n      }\n    }\n  }\n\n  private loadPersistedQueue(): void {\n    try {\n      const persisted = localStorage.getItem(this.STORAGE_KEY)\n      if (persisted) {\n        this.queue = JSON.parse(persisted)\n        console.log(`Loaded ${this.queue.length} items from persisted queue`)\n      }\n    } catch (error) {\n      console.error('Failed to load persisted queue:', error)\n      this.queue = []\n    }\n  }\n\n  private clearOldData(): void {\n    // Clear old error logs to free up space\n    const keysToRemove: string[] = []\n    \n    for (let i = 0; i < localStorage.length; i++) {\n      const key = localStorage.key(i)\n      if (key && (key.startsWith('error_') || key.startsWith('log_'))) {\n        keysToRemove.push(key)\n      }\n    }\n    \n    keysToRemove.forEach(key => {\n      try {\n        localStorage.removeItem(key)\n      } catch (e) {\n        // Ignore errors\n      }\n    })\n  }\n\n  private startFlushInterval(): void {\n    if (this.flushInterval) return\n    \n    this.flushInterval = setInterval(() => {\n      this.flushQueue()\n    }, this.FLUSH_INTERVAL)\n  }\n\n  private stopFlushInterval(): void {\n    if (this.flushInterval) {\n      clearInterval(this.flushInterval)\n      this.flushInterval = null\n    }\n  }\n\n  private generateId(): string {\n    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {\n      const r = Math.random() * 16 | 0\n      const v = c == 'x' ? r : (r & 0x3 | 0x8)\n      return v.toString(16)\n    })\n  }\n\n  // Public methods\n  getQueueSize(): number {\n    return this.queue.length\n  }\n\n  getQueueItems(): OfflineQueueItem[] {\n    return [...this.queue]\n  }\n\n  clearQueue(): void {\n    this.queue = []\n    this.persistQueue()\n  }\n\n  forceFlush(): void {\n    if (this.isOnline) {\n      this.flushQueue()\n    }\n  }\n\n  destroy(): void {\n    this.stopFlushInterval()\n    this.persistQueue()\n  }\n}\n\n// Export singleton instance\nexport const offlineErrorQueue = OfflineErrorQueue.getInstance()"