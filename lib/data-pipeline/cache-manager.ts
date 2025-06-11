// Cache Manager for Meta Ads Data Pipeline
import { z } from 'zod'

// Cache entry schema
const CacheEntrySchema = z.object({
  key: z.string(),
  data: z.any(),
  timestamp: z.number(),
  ttl: z.number(), // Time to live in milliseconds
  etag: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export type CacheEntry = z.infer<typeof CacheEntrySchema>

// Cache statistics
export interface CacheStats {
  hits: number
  misses: number
  evictions: number
  size: number
  hitRate: number
}

// Cache configuration
export interface CacheConfig {
  maxSize: number // Maximum cache size in bytes
  defaultTTL: number // Default TTL in milliseconds
  cleanupInterval: number // Cleanup interval in milliseconds
  persistToLocalStorage: boolean
  compressionEnabled: boolean
}

// Default configuration
const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 50 * 1024 * 1024, // 50MB
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000, // 1 minute
  persistToLocalStorage: true,
  compressionEnabled: true
}

export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    hitRate: 0
  }
  private config: CacheConfig
  private cleanupTimer?: NodeJS.Timeout
  private storageKey = 'meta-ads-cache'

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initialize()
  }

  private initialize() {
    // Load from localStorage if enabled
    if (this.config.persistToLocalStorage && typeof window !== 'undefined') {
      this.loadFromStorage()
    }

    // Start cleanup timer
    this.startCleanupTimer()
  }

  private startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        // Validate and restore cache entries
        data.forEach((entry: any) => {
          try {
            const validEntry = CacheEntrySchema.parse(entry)
            if (!this.isExpired(validEntry)) {
              this.cache.set(validEntry.key, validEntry)
            }
          } catch (e) {
            // Skip invalid entries
          }
        })
        this.updateSize()
      }
    } catch (e) {
      console.warn('Failed to load cache from storage:', e)
    }
  }

  private saveToStorage() {
    if (!this.config.persistToLocalStorage || typeof window === 'undefined') {
      return
    }

    try {
      const entries = Array.from(this.cache.values())
      localStorage.setItem(this.storageKey, JSON.stringify(entries))
    } catch (e) {
      console.warn('Failed to save cache to storage:', e)
      // If storage is full, clear old entries
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        this.evictOldest()
        this.saveToStorage()
      }
    }
  }

  // Generate cache key with versioning
  generateKey(params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key]
        return acc
      }, {} as Record<string, any>)
    
    return btoa(JSON.stringify(sorted))
  }

  // Set cache entry
  set(key: string, data: any, ttl?: number, metadata?: Record<string, any>): void {
    const entry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      metadata
    }

    // Check if we need to evict entries
    const dataSize = this.estimateSize(data)
    if (this.stats.size + dataSize > this.config.maxSize) {
      this.evictToMakeSpace(dataSize)
    }

    this.cache.set(key, entry)
    this.stats.size += dataSize
    this.saveToStorage()
  }

  // Get cache entry
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    if (this.isExpired(entry)) {
      this.delete(key)
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    this.stats.hits++
    this.updateHitRate()
    return entry.data as T
  }

  // Get or set cache entry
  async getOrSet<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
    metadata?: Record<string, any>
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    this.set(key, data, ttl, metadata)
    return data
  }

  // Invalidate cache entries by pattern
  invalidatePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    let count = 0

    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key)) {
        this.delete(key)
        count++
      }
    }

    return count
  }

  // Delete specific entry
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (entry) {
      this.stats.size -= this.estimateSize(entry.data)
      this.cache.delete(key)
      this.saveToStorage()
      return true
    }
    return false
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0
    }
    if (this.config.persistToLocalStorage && typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey)
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats }
  }

  // Get all keys
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  // Check if entry is expired
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  // Cleanup expired entries
  private cleanup(): void {
    let cleaned = 0
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.delete(key)
        cleaned++
      }
    }
    if (cleaned > 0) {
      console.log(`Cache cleanup: removed ${cleaned} expired entries`)
    }
  }

  // Evict oldest entries to make space
  private evictToMakeSpace(requiredSize: number): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)

    let freedSpace = 0
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSize) break
      freedSpace += this.estimateSize(entry.data)
      this.delete(key)
      this.stats.evictions++
    }
  }

  // Evict oldest entry
  private evictOldest(): void {
    const oldest = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
    
    if (oldest) {
      this.delete(oldest[0])
      this.stats.evictions++
    }
  }

  // Estimate size of data in bytes
  private estimateSize(data: any): number {
    if (data === null || data === undefined) return 0
    
    const str = JSON.stringify(data)
    // Rough estimate: 1 character = 2 bytes in UTF-16
    return str.length * 2
  }

  // Update cache size
  private updateSize(): void {
    this.stats.size = 0
    for (const entry of this.cache.values()) {
      this.stats.size += this.estimateSize(entry.data)
    }
  }

  // Update hit rate
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  // Destroy cache manager
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.clear()
  }
}

// Singleton instance
let cacheInstance: CacheManager | null = null

export function getCacheManager(config?: Partial<CacheConfig>): CacheManager {
  if (!cacheInstance) {
    cacheInstance = new CacheManager(config)
  }
  return cacheInstance
}

// Cache decorators
export function Cacheable(ttl?: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const cache = getCacheManager()
      const key = cache.generateKey({
        class: target.constructor.name,
        method: propertyName,
        args
      })
      
      return cache.getOrSet(key, () => method.apply(this, args), ttl)
    }
    
    return descriptor
  }
}

export function InvalidateCache(pattern?: string | RegExp) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args)
      const cache = getCacheManager()
      
      if (pattern) {
        cache.invalidatePattern(pattern)
      } else {
        // Invalidate related to this class/method
        const classPattern = new RegExp(`"class":"${target.constructor.name}"`)
        cache.invalidatePattern(classPattern)
      }
      
      return result
    }
    
    return descriptor
  }
}