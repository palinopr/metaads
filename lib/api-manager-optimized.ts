// Optimized API Manager with advanced caching, batching, and performance features
import { toast } from "sonner"

interface RateLimiter {
  requests: number
  resetTime: number
  maxRequests: number
  windowMs: number
}

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
  etag?: string
}

interface BatchRequest {
  id: string
  endpoint: string
  options?: RequestInit
  resolve: (value: any) => void
  reject: (reason: any) => void
  priority: number
}

interface DedupeRequest {
  key: string
  promise: Promise<any>
  timestamp: number
}

// Multi-level cache implementation
class MultiLevelCache {
  private memoryCache = new Map<string, CacheEntry>()
  private indexedDBCache?: IDBDatabase
  private maxMemorySize = 50 * 1024 * 1024 // 50MB
  private currentMemorySize = 0

  async init() {
    try {
      const request = indexedDB.open('MetaAdsCache', 1)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' })
        }
      }
      
      this.indexedDBCache = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.warn('IndexedDB initialization failed, using memory cache only:', error)
    }
  }

  async get(key: string): Promise<CacheEntry | null> {
    // 1. Check memory cache first (fastest)
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry && Date.now() < memoryEntry.timestamp + memoryEntry.ttl) {
      this.updateLRU(key)
      return memoryEntry
    }

    // 2. Check IndexedDB (slower but persistent)
    if (this.indexedDBCache) {
      try {
        const transaction = this.indexedDBCache.transaction(['cache'], 'readonly')
        const store = transaction.objectStore('cache')
        const request = store.get(key)
        
        const entry = await new Promise<any>((resolve) => {
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => resolve(null)
        })
        
        if (entry && Date.now() < entry.timestamp + entry.ttl) {
          // Promote to memory cache
          this.setMemoryCache(key, entry)
          return entry
        }
      } catch (error) {
        console.warn('IndexedDB read error:', error)
      }
    }

    // 3. Check localStorage as fallback
    try {
      const stored = localStorage.getItem(`cache_${key}`)
      if (stored) {
        const entry = JSON.parse(stored)
        if (Date.now() < entry.timestamp + entry.ttl) {
          // Promote to memory cache
          this.setMemoryCache(key, entry)
          return entry
        }
      }
    } catch (error) {
      // localStorage might be full or disabled
    }

    return null
  }

  async set(key: string, data: any, ttl: number, etag?: string) {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
      etag
    }

    // 1. Always set in memory cache
    this.setMemoryCache(key, entry)

    // 2. Try to set in IndexedDB
    if (this.indexedDBCache) {
      try {
        const transaction = this.indexedDBCache.transaction(['cache'], 'readwrite')
        const store = transaction.objectStore('cache')
        await store.put({ key, ...entry })
      } catch (error) {
        console.warn('IndexedDB write error:', error)
      }
    }

    // 3. Try to set in localStorage as fallback
    try {
      const serialized = JSON.stringify(entry)
      if (serialized.length < 1024 * 1024) { // Only store if < 1MB
        localStorage.setItem(`cache_${key}`, serialized)
      }
    } catch (error) {
      // localStorage might be full
      this.cleanupLocalStorage()
    }
  }

  private setMemoryCache(key: string, entry: CacheEntry) {
    const size = JSON.stringify(entry).length
    
    // Check if we need to evict entries
    while (this.currentMemorySize + size > this.maxMemorySize && this.memoryCache.size > 0) {
      const firstKey = this.memoryCache.keys().next().value
      const firstEntry = this.memoryCache.get(firstKey)
      if (firstEntry) {
        this.currentMemorySize -= JSON.stringify(firstEntry).length
        this.memoryCache.delete(firstKey)
      }
    }

    this.memoryCache.set(key, entry)
    this.currentMemorySize += size
  }

  private updateLRU(key: string) {
    const entry = this.memoryCache.get(key)
    if (entry) {
      this.memoryCache.delete(key)
      this.memoryCache.set(key, entry)
    }
  }

  private cleanupLocalStorage() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('cache_'))
    const items = keys.map(key => ({
      key,
      size: localStorage.getItem(key)?.length || 0,
      timestamp: JSON.parse(localStorage.getItem(key) || '{}').timestamp || 0
    }))

    // Sort by timestamp (oldest first)
    items.sort((a, b) => a.timestamp - b.timestamp)

    // Remove oldest 25% of items
    const toRemove = Math.ceil(items.length * 0.25)
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(items[i].key)
    }
  }

  invalidate(pattern: string) {
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        const entry = this.memoryCache.get(key)
        if (entry) {
          this.currentMemorySize -= JSON.stringify(entry).length
        }
        this.memoryCache.delete(key)
      }
    }

    // Clear IndexedDB
    if (this.indexedDBCache) {
      const transaction = this.indexedDBCache.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      const request = store.openCursor()
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          if (cursor.key.toString().includes(pattern)) {
            cursor.delete()
          }
          cursor.continue()
        }
      }
    }

    // Clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_') && key.includes(pattern)) {
        localStorage.removeItem(key)
      }
    })
  }

  getStats() {
    return {
      memoryEntries: this.memoryCache.size,
      memorySize: this.currentMemorySize,
      maxMemorySize: this.maxMemorySize,
      utilizationPercent: (this.currentMemorySize / this.maxMemorySize) * 100
    }
  }
}

// Request batcher for combining multiple requests
class RequestBatcher {
  private batchQueue: BatchRequest[] = []
  private batchTimeout: NodeJS.Timeout | null = null
  private batchSize = 10
  private batchDelay = 50 // ms

  async batch(
    endpoint: string,
    options?: RequestInit,
    priority: number = 1
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = `${endpoint}_${Date.now()}_${Math.random()}`
      this.batchQueue.push({
        id,
        endpoint,
        options,
        resolve,
        reject,
        priority
      })

      // Sort by priority
      this.batchQueue.sort((a, b) => b.priority - a.priority)

      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout)
      }

      // Execute immediately if batch is full
      if (this.batchQueue.length >= this.batchSize) {
        this.executeBatch()
      } else {
        // Otherwise wait for more requests
        this.batchTimeout = setTimeout(() => {
          this.executeBatch()
        }, this.batchDelay)
      }
    })
  }

  private async executeBatch() {
    if (this.batchQueue.length === 0) return

    const batch = this.batchQueue.splice(0, this.batchSize)
    this.batchTimeout = null

    // Group requests by endpoint for potential optimization
    const grouped = batch.reduce((acc, req) => {
      const key = req.endpoint
      if (!acc[key]) acc[key] = []
      acc[key].push(req)
      return acc
    }, {} as Record<string, BatchRequest[]>)

    // Execute grouped requests
    for (const [endpoint, requests] of Object.entries(grouped)) {
      // If multiple requests to same endpoint, consider combining
      if (requests.length > 1 && this.canCombineRequests(requests)) {
        await this.executeCombinedRequest(endpoint, requests)
      } else {
        // Execute individually in parallel
        await Promise.all(
          requests.map(req => this.executeSingleRequest(req))
        )
      }
    }

    // Continue processing if more requests are queued
    if (this.batchQueue.length > 0) {
      this.executeBatch()
    }
  }

  private canCombineRequests(requests: BatchRequest[]): boolean {
    // Check if all requests have the same method and similar body structure
    const firstMethod = requests[0].options?.method || 'GET'
    return requests.every(req => (req.options?.method || 'GET') === firstMethod)
  }

  private async executeCombinedRequest(endpoint: string, requests: BatchRequest[]) {
    try {
      // For now, execute individually
      // In a real implementation, you might combine these into a single batch API call
      await Promise.all(requests.map(req => this.executeSingleRequest(req)))
    } catch (error) {
      requests.forEach(req => req.reject(error))
    }
  }

  private async executeSingleRequest(request: BatchRequest) {
    try {
      const response = await fetch(request.endpoint, request.options)
      const data = await response.json()
      request.resolve(data)
    } catch (error) {
      request.reject(error)
    }
  }
}

// Request deduplicator to prevent duplicate in-flight requests
class RequestDeduplicator {
  private inFlightRequests = new Map<string, DedupeRequest>()
  private maxAge = 100 // ms

  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Clean up old requests
    this.cleanup()

    // Check for existing in-flight request
    const existing = this.inFlightRequests.get(key)
    if (existing && Date.now() - existing.timestamp < this.maxAge) {
      console.log(`Deduplicating request: ${key}`)
      return existing.promise as Promise<T>
    }

    // Create new request
    const promise = requestFn().finally(() => {
      this.inFlightRequests.delete(key)
    })

    this.inFlightRequests.set(key, {
      key,
      promise,
      timestamp: Date.now()
    })

    return promise
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, request] of this.inFlightRequests.entries()) {
      if (now - request.timestamp > this.maxAge) {
        this.inFlightRequests.delete(key)
      }
    }
  }

  getStats() {
    return {
      inFlightCount: this.inFlightRequests.size,
      requests: Array.from(this.inFlightRequests.keys())
    }
  }
}

// Performance monitor
class PerformanceMonitor {
  private metrics: {
    apiCalls: { endpoint: string; duration: number; timestamp: number; success: boolean }[]
    cacheHits: number
    cacheMisses: number
  } = {
    apiCalls: [],
    cacheHits: 0,
    cacheMisses: 0
  }

  recordApiCall(endpoint: string, duration: number, success: boolean) {
    this.metrics.apiCalls.push({
      endpoint,
      duration,
      timestamp: Date.now(),
      success
    })

    // Keep only last 100 calls
    if (this.metrics.apiCalls.length > 100) {
      this.metrics.apiCalls = this.metrics.apiCalls.slice(-100)
    }
  }

  recordCacheHit() {
    this.metrics.cacheHits++
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++
  }

  getStats() {
    const recentCalls = this.metrics.apiCalls.filter(
      call => Date.now() - call.timestamp < 60000 // Last minute
    )

    const avgDuration = recentCalls.length > 0
      ? recentCalls.reduce((sum, call) => sum + call.duration, 0) / recentCalls.length
      : 0

    const successRate = recentCalls.length > 0
      ? (recentCalls.filter(call => call.success).length / recentCalls.length) * 100
      : 100

    const cacheHitRate = this.metrics.cacheHits + this.metrics.cacheMisses > 0
      ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100
      : 0

    return {
      avgResponseTime: Math.round(avgDuration),
      successRate: Math.round(successRate),
      cacheHitRate: Math.round(cacheHitRate),
      totalCalls: this.metrics.apiCalls.length,
      recentCallsPerMinute: recentCalls.length
    }
  }
}

// Main optimized API Manager
export class OptimizedAPIManager {
  private static instance: OptimizedAPIManager
  private cache = new MultiLevelCache()
  private batcher = new RequestBatcher()
  private deduplicator = new RequestDeduplicator()
  private performanceMonitor = new PerformanceMonitor()
  private initialized = false
  
  private rateLimiter: RateLimiter = {
    requests: 0,
    resetTime: Date.now() + 60000,
    maxRequests: parseInt(process.env.NEXT_PUBLIC_API_RATE_LIMIT || '50'),
    windowMs: 60000 // 1 minute
  }

  private cacheTTL = {
    campaigns: 5 * 60 * 1000,      // 5 minutes
    insights: 10 * 60 * 1000,      // 10 minutes
    demographics: 30 * 60 * 1000,  // 30 minutes
    account: 60 * 60 * 1000,       // 1 hour
    default: 5 * 60 * 1000         // 5 minutes
  }

  private constructor() {
    this.init()
  }

  private async init() {
    await this.cache.init()
    this.initialized = true
    
    // Start performance reporting
    if (typeof window !== 'undefined') {
      setInterval(() => {
        const stats = this.getPerformanceStats()
        console.log('API Performance:', stats)
      }, 30000) // Every 30 seconds
    }
  }

  static getInstance(): OptimizedAPIManager {
    if (!OptimizedAPIManager.instance) {
      OptimizedAPIManager.instance = new OptimizedAPIManager()
    }
    return OptimizedAPIManager.instance
  }

  private checkRateLimit() {
    const now = Date.now()
    
    // Reset if window has passed
    if (now > this.rateLimiter.resetTime) {
      this.rateLimiter.requests = 0
      this.rateLimiter.resetTime = now + this.rateLimiter.windowMs
    }
    
    // Check if limit exceeded
    if (this.rateLimiter.requests >= this.rateLimiter.maxRequests) {
      const waitTime = this.rateLimiter.resetTime - now
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`)
    }
    
    this.rateLimiter.requests++
  }

  private getCacheTTL(endpoint: string): number {
    if (endpoint.includes('campaigns')) return this.cacheTTL.campaigns
    if (endpoint.includes('insights')) return this.cacheTTL.insights
    if (endpoint.includes('demographics')) return this.cacheTTL.demographics
    if (endpoint.includes('account')) return this.cacheTTL.account
    return this.cacheTTL.default
  }

  async request<T = any>(
    endpoint: string, 
    options?: RequestInit,
    cacheOptions?: { 
      ttl?: number, 
      forceRefresh?: boolean,
      priority?: number,
      batch?: boolean 
    }
  ): Promise<T> {
    // Wait for initialization
    while (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const cacheKey = `${endpoint}_${JSON.stringify(options?.body || {})}`
    const cacheTTL = cacheOptions?.ttl || this.getCacheTTL(endpoint)
    
    // Check cache first (unless force refresh)
    if (!cacheOptions?.forceRefresh) {
      const cached = await this.cache.get(cacheKey)
      if (cached) {
        console.log(`Cache hit for ${endpoint}`)
        this.performanceMonitor.recordCacheHit()
        return cached.data
      }
    }
    
    this.performanceMonitor.recordCacheMiss()

    // Use deduplicator to prevent duplicate requests
    return this.deduplicator.dedupe(cacheKey, async () => {
      const startTime = performance.now()
      
      try {
        // Check rate limit
        this.checkRateLimit()
        
        let data: T
        
        // Use batcher if requested
        if (cacheOptions?.batch) {
          data = await this.batcher.batch(
            endpoint,
            options,
            cacheOptions.priority || 1
          )
        } else {
          // Make direct request
          console.log(`API request to ${endpoint}`)
          const response = await fetch(endpoint, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...options?.headers
            }
          })
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`)
          }
          
          data = await response.json()
        }
        
        const duration = performance.now() - startTime
        this.performanceMonitor.recordApiCall(endpoint, duration, true)
        
        // Cache the successful response
        await this.cache.set(cacheKey, data, cacheTTL)
        
        return data
      } catch (error) {
        const duration = performance.now() - startTime
        this.performanceMonitor.recordApiCall(endpoint, duration, false)
        console.error(`API request failed for ${endpoint}:`, error)
        throw error
      }
    })
  }

  // Prefetch data in the background
  async prefetch(
    requests: Array<{
      endpoint: string
      options?: RequestInit
      ttl?: number
    }>
  ) {
    // Execute prefetch requests with low priority
    const promises = requests.map(req => 
      this.request(req.endpoint, req.options, {
        ttl: req.ttl,
        priority: 0,
        batch: true
      }).catch(err => {
        console.warn('Prefetch failed:', err)
        return null
      })
    )
    
    await Promise.all(promises)
  }

  // Clear cache for specific endpoint or all
  clearCache(endpoint?: string) {
    if (endpoint) {
      this.cache.invalidate(endpoint)
    } else {
      this.cache.invalidate('')
    }
  }

  // Get current rate limit status
  getRateLimitStatus() {
    const now = Date.now()
    const remaining = Math.max(0, this.rateLimiter.maxRequests - this.rateLimiter.requests)
    const resetIn = Math.max(0, this.rateLimiter.resetTime - now)
    
    return {
      remaining,
      resetIn: Math.ceil(resetIn / 1000),
      total: this.rateLimiter.maxRequests
    }
  }

  // Get performance statistics
  getPerformanceStats() {
    return {
      ...this.performanceMonitor.getStats(),
      cache: this.cache.getStats(),
      deduplicator: this.deduplicator.getStats(),
      rateLimit: this.getRateLimitStatus()
    }
  }
}

// Export singleton instance
export const optimizedApiManager = OptimizedAPIManager.getInstance()