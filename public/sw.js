// Optimized Service Worker for Meta Ads Dashboard
const SW_VERSION = '2.0.0'
const CACHE_NAME = `meta-ads-v${SW_VERSION}`
const API_CACHE = `meta-ads-api-v${SW_VERSION}`
const IMAGE_CACHE = `meta-ads-img-v${SW_VERSION}`
const STATIC_CACHE = `meta-ads-static-v${SW_VERSION}`

// Cache configuration
const CACHE_CONFIG = {
  // Cache TTL settings (in milliseconds)
  ttl: {
    api: {
      campaigns: 5 * 60 * 1000,       // 5 minutes
      insights: 10 * 60 * 1000,       // 10 minutes  
      demographics: 30 * 60 * 1000,   // 30 minutes
      historical: 24 * 60 * 60 * 1000,// 24 hours
      account: 60 * 60 * 1000,        // 1 hour
      default: 5 * 60 * 1000          // 5 minutes
    },
    static: 7 * 24 * 60 * 60 * 1000, // 7 days
    images: 30 * 24 * 60 * 60 * 1000 // 30 days
  },
  // Max cache sizes
  maxSize: {
    api: 50 * 1024 * 1024,      // 50MB
    images: 100 * 1024 * 1024,  // 100MB
    static: 50 * 1024 * 1024    // 50MB
  },
  // Strategies
  strategies: {
    api: 'network-first',
    static: 'cache-first',
    images: 'cache-first',
    navigation: 'network-first'
  }
}

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/globals.css',
  // Add critical JS bundles
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/framework.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages/_app.js',
  '/_next/static/chunks/pages/index.js'
]

// Utility functions
const getCacheName = (url) => {
  if (url.includes('/api/')) return API_CACHE
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) return IMAGE_CACHE
  return STATIC_CACHE
}

const getCacheTTL = (url) => {
  if (url.includes('/api/meta/campaigns')) return CACHE_CONFIG.ttl.api.campaigns
  if (url.includes('/api/meta/insights')) return CACHE_CONFIG.ttl.api.insights
  if (url.includes('/api/meta/demographics')) return CACHE_CONFIG.ttl.api.demographics
  if (url.includes('/api/meta/historical')) return CACHE_CONFIG.ttl.api.historical
  if (url.includes('/api/meta/account')) return CACHE_CONFIG.ttl.api.account
  if (url.includes('/api/')) return CACHE_CONFIG.ttl.api.default
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) return CACHE_CONFIG.ttl.images
  return CACHE_CONFIG.ttl.static
}

const shouldSkipRequest = (request) => {
  const url = request.url
  
  // Skip non-http(s) URLs
  if (!url.startsWith('http://') && !url.startsWith('https://')) return true
  
  // Skip chrome extensions
  if (url.includes('chrome-extension://')) return true
  
  // Skip browser extensions
  if (url.includes('-extension://')) return true
  
  // Skip data and blob URLs
  if (url.startsWith('data:') || url.startsWith('blob:')) return true
  
  // Skip WebSocket connections
  if (url.startsWith('ws://') || url.startsWith('wss://')) return true
  
  return false
}

// Cache size management
class CacheManager {
  static async ensureCacheSize(cacheName, maxSize) {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()
    let totalSize = 0
    const sizes = []

    // Estimate cache size
    for (const request of keys) {
      const response = await cache.match(request)
      if (response) {
        const blob = await response.blob()
        sizes.push({ request, size: blob.size, timestamp: response.headers.get('sw-cache-time') })
        totalSize += blob.size
      }
    }

    // If over limit, remove oldest entries
    if (totalSize > maxSize) {
      sizes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      
      while (totalSize > maxSize * 0.8 && sizes.length > 0) { // Keep 20% buffer
        const oldest = sizes.shift()
        if (oldest) {
          await cache.delete(oldest.request)
          totalSize -= oldest.size
        }
      }
    }
  }

  static async getCacheStats() {
    const cacheNames = [API_CACHE, IMAGE_CACHE, STATIC_CACHE]
    const stats = {}

    for (const name of cacheNames) {
      const cache = await caches.open(name)
      const keys = await cache.keys()
      let size = 0

      for (const request of keys) {
        const response = await cache.match(request)
        if (response) {
          const blob = await response.blob()
          size += blob.size
        }
      }

      stats[name] = {
        entries: keys.length,
        size: size,
        sizeInMB: (size / 1024 / 1024).toFixed(2)
      }
    }

    return stats
  }
}

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Precaching critical assets')
        // Filter out invalid URLs and cache valid ones individually
        const validAssets = PRECACHE_ASSETS.filter(url => !shouldSkipRequest({ url }))
        
        return Promise.allSettled(
          validAssets.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[SW] Failed to cache ${url}:`, err)
            })
          )
        )
      })
      .then(() => {
        console.log('[SW] Precaching complete')
        // Skip waiting to activate immediately
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old version caches
          if (cacheName.startsWith('meta-ads-') && 
              cacheName !== CACHE_NAME && 
              cacheName !== API_CACHE && 
              cacheName !== IMAGE_CACHE &&
              cacheName !== STATIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[SW] Claiming all clients')
      return self.clients.claim()
    })
  )
})

// Fetch strategies
const strategies = {
  // Network first, fallback to cache
  networkFirst: async (request, cacheName, ttl) => {
    try {
      const networkResponse = await fetch(request)
      
      if (networkResponse.ok) {
        const responseToCache = networkResponse.clone()
        const cache = await caches.open(cacheName)
        
        // Add cache metadata
        const headers = new Headers(responseToCache.headers)
        headers.set('sw-cache-time', new Date().toISOString())
        
        const cachedResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        })
        
        cache.put(request, cachedResponse).catch(err => {
          console.warn('[SW] Cache put failed:', err)
        })
        
        // Manage cache size
        CacheManager.ensureCacheSize(cacheName, CACHE_CONFIG.maxSize.api)
      }
      
      return networkResponse
    } catch (error) {
      // Network failed, try cache
      const cache = await caches.open(cacheName)
      const cachedResponse = await cache.match(request)
      
      if (cachedResponse) {
        const cacheTime = cachedResponse.headers.get('sw-cache-time')
        const age = cacheTime ? Date.now() - new Date(cacheTime).getTime() : Infinity
        
        if (age < ttl) {
          console.log('[SW] Serving from cache (offline):', request.url)
          return cachedResponse
        }
      }
      
      // Return offline response
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'No internet connection',
          cached: false 
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  },

  // Cache first, fallback to network
  cacheFirst: async (request, cacheName, ttl) => {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      const cacheTime = cachedResponse.headers.get('sw-cache-time')
      const age = cacheTime ? Date.now() - new Date(cacheTime).getTime() : Infinity
      
      if (age < ttl) {
        // Update cache in background
        strategies.backgroundUpdate(request, cacheName)
        return cachedResponse
      }
    }
    
    // Cache miss or expired, fetch from network
    try {
      const networkResponse = await fetch(request)
      
      if (networkResponse.ok) {
        const responseToCache = networkResponse.clone()
        
        // Add cache metadata
        const headers = new Headers(responseToCache.headers)
        headers.set('sw-cache-time', new Date().toISOString())
        
        const cachedResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        })
        
        await cache.put(request, cachedResponse)
        
        // Manage cache size
        const maxSize = cacheName === IMAGE_CACHE ? 
          CACHE_CONFIG.maxSize.images : CACHE_CONFIG.maxSize.static
        CacheManager.ensureCacheSize(cacheName, maxSize)
      }
      
      return networkResponse
    } catch (error) {
      if (cachedResponse) {
        console.log('[SW] Serving stale cache due to network error')
        return cachedResponse
      }
      throw error
    }
  },

  // Background update for cache-first strategy
  backgroundUpdate: async (request, cacheName) => {
    try {
      const networkResponse = await fetch(request)
      
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName)
        const responseToCache = networkResponse.clone()
        
        // Add cache metadata
        const headers = new Headers(responseToCache.headers)
        headers.set('sw-cache-time', new Date().toISOString())
        
        const cachedResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        })
        
        await cache.put(request, cachedResponse)
        
        // Notify clients of update
        const clients = await self.clients.matchAll()
        clients.forEach(client => {
          client.postMessage({
            type: 'CACHE_UPDATED',
            url: request.url,
            timestamp: new Date().toISOString()
          })
        })
      }
    } catch (error) {
      // Silently fail background updates
      console.log('[SW] Background update failed:', error)
    }
  }
}

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // Skip requests we shouldn't handle
  if (shouldSkipRequest(request)) {
    return
  }
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  const url = new URL(request.url)
  
  // Determine cache strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      strategies.networkFirst(request, API_CACHE, getCacheTTL(request.url))
    )
  } else if (request.destination === 'image') {
    event.respondWith(
      strategies.cacheFirst(request, IMAGE_CACHE, getCacheTTL(request.url))
    )
  } else if (request.mode === 'navigate') {
    event.respondWith(
      strategies.networkFirst(request, STATIC_CACHE, CACHE_CONFIG.ttl.static)
    )
  } else {
    event.respondWith(
      strategies.cacheFirst(request, STATIC_CACHE, getCacheTTL(request.url))
    )
  }
})

// Message handler
self.addEventListener('message', async (event) => {
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'GET_CACHE_STATS':
      const stats = await CacheManager.getCacheStats()
      event.ports[0].postMessage({ type: 'CACHE_STATS', stats })
      break
      
    case 'CLEAR_CACHE':
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      event.ports[0].postMessage({ type: 'CACHE_CLEARED' })
      break
      
    case 'PREFETCH':
      const { urls } = event.data
      const cache = await caches.open(STATIC_CACHE)
      await Promise.allSettled(
        urls.map(url => cache.add(url).catch(() => {}))
      )
      break
  }
})

// Background sync
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-meta-data') {
    event.waitUntil(syncMetaData())
  }
})

// Sync Meta data when online
async function syncMetaData() {
  console.log('[SW] Background sync: Syncing Meta data...')
  
  const cache = await caches.open(API_CACHE)
  const requests = await cache.keys()
  
  // Only sync API requests
  const apiRequests = requests.filter(req => req.url.includes('/api/'))
  
  for (const request of apiRequests) {
    try {
      const response = await fetch(request)
      if (response.ok) {
        const headers = new Headers(response.headers)
        headers.set('sw-cache-time', new Date().toISOString())
        
        const cachedResponse = new Response(await response.text(), {
          status: response.status,
          statusText: response.statusText,
          headers: headers
        })
        
        await cache.put(request, cachedResponse)
      }
    } catch (error) {
      console.log('[SW] Sync failed for:', request.url)
    }
  }
  
  // Notify clients
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      timestamp: new Date().toISOString()
    })
  })
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'meta-data-sync') {
    event.waitUntil(syncMetaData())
  }
})

console.log('[SW] Service worker loaded successfully')