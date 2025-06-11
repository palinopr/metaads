// Cache management utilities for offline support

export interface CacheConfig {
  name: string
  version: string
  ttl: number // Time to live in milliseconds
}

export interface CachedResponse {
  data: any
  timestamp: number
  headers?: Record<string, string>
}

// Cache configurations
export const CACHE_CONFIGS = {
  api: {
    name: 'meta-ads-api',
    version: '1.0.0',
    ttl: 15 * 60 * 1000, // 15 minutes default
  },
  static: {
    name: 'meta-ads-static',
    version: '1.0.0',
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  images: {
    name: 'meta-ads-images',
    version: '1.0.0',
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
}

// TTL configurations for different data types
export const DATA_TTL = {
  campaigns: 15 * 60 * 1000,         // 15 minutes
  analytics: 30 * 60 * 1000,         // 30 minutes
  historical: 24 * 60 * 60 * 1000,   // 24 hours
  account: 60 * 60 * 1000,           // 1 hour
  insights: 5 * 60 * 1000,           // 5 minutes
}

export class CacheManager {
  private static instance: CacheManager
  
  private constructor() {}
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  // Get cache name with version
  private getCacheName(config: CacheConfig): string {
    return `${config.name}-v${config.version}`
  }

  // Store response in cache
  async cacheResponse(
    request: Request | string,
    response: Response,
    ttl?: number
  ): Promise<void> {
    try {
      const cache = await caches.open(this.getCacheName(CACHE_CONFIGS.api))
      
      // Add cache metadata
      const headers = new Headers(response.headers)
      headers.set('sw-cache-time', new Date().toISOString())
      headers.set('sw-cache-ttl', String(ttl || DATA_TTL.campaigns))
      
      const cachedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
      })
      
      await cache.put(request, cachedResponse)
    } catch (error) {
      console.error('Failed to cache response:', error)
    }
  }

  // Get cached response
  async getCachedResponse(request: Request | string): Promise<Response | null> {
    try {
      const cache = await caches.open(this.getCacheName(CACHE_CONFIGS.api))
      const response = await cache.match(request)
      
      if (!response) {
        return null
      }
      
      // Check if cache is still valid
      const cacheTime = response.headers.get('sw-cache-time')
      const cacheTTL = response.headers.get('sw-cache-ttl')
      
      if (cacheTime && cacheTTL) {
        const age = Date.now() - new Date(cacheTime).getTime()
        if (age > parseInt(cacheTTL)) {
          // Cache expired, delete it
          await cache.delete(request)
          return null
        }
      }
      
      return response
    } catch (error) {
      console.error('Failed to get cached response:', error)
      return null
    }
  }

  // Clear expired cache entries
  async clearExpiredCache(): Promise<void> {
    try {
      const cacheNames = await caches.keys()
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName)
        const requests = await cache.keys()
        
        for (const request of requests) {
          const response = await cache.match(request)
          if (response) {
            const cacheTime = response.headers.get('sw-cache-time')
            const cacheTTL = response.headers.get('sw-cache-ttl')
            
            if (cacheTime && cacheTTL) {
              const age = Date.now() - new Date(cacheTime).getTime()
              if (age > parseInt(cacheTTL)) {
                await cache.delete(request)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error)
    }
  }

  // Get cache size
  async getCacheSize(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      }
    }
    return { used: 0, quota: 0 }
  }

  // Clear all caches
  async clearAllCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
    } catch (error) {
      console.error('Failed to clear caches:', error)
    }
  }

  // Cache with metadata (for complex data)
  async cacheData(key: string, data: any, ttl?: number): Promise<void> {
    const cacheData: CachedResponse = {
      data,
      timestamp: Date.now(),
    }
    
    const blob = new Blob([JSON.stringify(cacheData)], { type: 'application/json' })
    const response = new Response(blob)
    
    const cache = await caches.open(this.getCacheName(CACHE_CONFIGS.api))
    const request = new Request(`/cache/${key}`)
    
    await this.cacheResponse(request, response, ttl)
  }

  // Get cached data
  async getCachedData<T = any>(key: string): Promise<T | null> {
    const request = new Request(`/cache/${key}`)
    const response = await this.getCachedResponse(request)
    
    if (!response) {
      return null
    }
    
    try {
      const cacheData: CachedResponse = await response.json()
      return cacheData.data as T
    } catch (error) {
      console.error('Failed to parse cached data:', error)
      return null
    }
  }

  // Prefetch and cache URLs
  async prefetchUrls(urls: string[]): Promise<void> {
    const cache = await caches.open(this.getCacheName(CACHE_CONFIGS.static))
    
    const promises = urls.map(async (url) => {
      try {
        const response = await fetch(url)
        if (response.ok) {
          await cache.put(url, response)
        }
      } catch (error) {
        console.error(`Failed to prefetch ${url}:`, error)
      }
    })
    
    await Promise.all(promises)
  }

  // Get cache statistics
  async getCacheStats(): Promise<{
    caches: Array<{ name: string; count: number; size?: number }>
    totalSize: { used: number; quota: number }
  }> {
    const cacheNames = await caches.keys()
    const stats = []
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const requests = await cache.keys()
      stats.push({
        name: cacheName,
        count: requests.length,
      })
    }
    
    const totalSize = await this.getCacheSize()
    
    return { caches: stats, totalSize }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance()