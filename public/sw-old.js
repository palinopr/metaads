// Service Worker for Meta Ads Dashboard
const SW_VERSION = '1.0.1'
const CACHE_NAME = `meta-ads-v${SW_VERSION}`
const API_CACHE = `meta-ads-api-v${SW_VERSION}`
const IMAGE_CACHE = `meta-ads-img-v${SW_VERSION}`

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/globals.css',
]

// Cache TTL settings (in milliseconds)
const CACHE_TTL = {
  api: {
    campaigns: 15 * 60 * 1000,      // 15 minutes
    analytics: 30 * 60 * 1000,      // 30 minutes
    historical: 24 * 60 * 60 * 1000, // 24 hours
    account: 60 * 60 * 1000,        // 1 hour
  },
  static: 7 * 24 * 60 * 60 * 1000   // 7 days
}

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Precaching critical assets')
        // Filter out chrome-extension URLs before caching
        const assetsToCache = PRECACHE_ASSETS.filter(url => !url.startsWith('chrome-extension://'))
        return cache.addAll(assetsToCache)
      })
      .catch(error => {
        console.error('Precaching failed:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.startsWith('meta-ads-') && cacheName !== CACHE_NAME && 
              cacheName !== API_CACHE && cacheName !== IMAGE_CACHE) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      // Take control of all clients
      return self.clients.claim()
    })
  )
})

// Fetch event - implement cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  try {
    // Skip requests we shouldn't handle
    if (shouldSkipRequest(request)) {
      return
    }
    
    const url = new URL(request.url)
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
      return
    }
    
    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(handleAPIRequest(request))
      return
    }
    
    // Handle image requests
    if (request.destination === 'image') {
      event.respondWith(handleImageRequest(request))
      return
    }
    
    // Handle navigation requests (HTML)
    if (request.mode === 'navigate') {
      event.respondWith(handleNavigationRequest(request))
      return
    }
    
    // Handle other static assets
    event.respondWith(handleStaticRequest(request))
  } catch (error) {
    console.error('Service Worker fetch event error:', error)
    // Don't respond to let the browser handle naturally
  }
})

// Check if we should skip handling a request
function shouldSkipRequest(request) {
  const url = request.url
  
  // Skip chrome-extension URLs
  if (url.startsWith('chrome-extension://')) {
    return true
  }
  
  // Skip moz-extension URLs (Firefox)
  if (url.startsWith('moz-extension://')) {
    return true
  }
  
  // Skip safari-extension URLs (Safari)
  if (url.startsWith('safari-extension://')) {
    return true
  }
  
  // Skip browser-specific protocols
  if (url.startsWith('about:') || url.startsWith('moz:') || url.startsWith('chrome:')) {
    return true
  }
  
  // Skip data URLs
  if (url.startsWith('data:')) {
    return true
  }
  
  // Skip blob URLs (let browser handle them)
  if (url.startsWith('blob:')) {
    return true
  }
  
  return false
}

// Handle API requests - Network first, fall back to cache
async function handleAPIRequest(request) {
  // Skip extension URLs and let browser handle
  if (shouldSkipRequest(request)) {
    return fetch(request)
  }
  
  try {
    const cache = await caches.open(API_CACHE)
    
    try {
      // Try network first
      const networkResponse = await fetch(request, {
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
      })
      
      // Cache successful responses
      if (networkResponse.ok) {
        // Clone the response before caching
        const responseToCache = networkResponse.clone()
        
        // Add timestamp to cached response
        const headers = new Headers(responseToCache.headers)
        headers.set('sw-cache-time', new Date().toISOString())
        
        const body = await responseToCache.text()
        const cachedResponse = new Response(body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        })
        
        // Cache the response with error handling
        try {
          await cache.put(request, cachedResponse)
        } catch (cacheError) {
          console.warn('Failed to cache API response:', request.url, cacheError)
        }
      }
      
      return networkResponse
    } catch (networkError) {
      console.log('Network request failed, checking cache:', networkError.message)
      
      // Try cache
      const cachedResponse = await cache.match(request)
      
      if (cachedResponse) {
        // Check if cache is still valid
        const cacheTime = cachedResponse.headers.get('sw-cache-time')
        if (cacheTime && isCacheValid(request.url, cacheTime)) {
          console.log('Serving from cache:', request.url)
          return cachedResponse
        }
      }
      
      // Return offline response
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'No internet connection and no cached data available',
          cached: false,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    console.error('Service Worker API handler error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Service Worker Error', 
        message: 'Failed to handle API request',
        details: error.message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle image requests - Cache first
async function handleImageRequest(request) {
  // Skip extension URLs and let browser handle
  if (shouldSkipRequest(request)) {
    return fetch(request)
  }
  
  try {
    const cache = await caches.open(IMAGE_CACHE)
    
    // Check cache first
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    try {
      // Fetch from network with timeout
      const networkResponse = await fetch(request, {
        signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined
      })
      
      // Cache successful responses
      if (networkResponse.ok && networkResponse.status < 400) {
        try {
          await cache.put(request, networkResponse.clone())
        } catch (cacheError) {
          console.warn('Failed to cache image:', request.url, cacheError)
        }
      }
      
      return networkResponse
    } catch (networkError) {
      console.log('Failed to fetch image:', request.url, networkError.message)
      
      // Return a placeholder response for images
      return new Response(
        JSON.stringify({ error: 'Image not available offline' }), 
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    console.error('Service Worker image handler error:', error)
    return new Response('', { status: 500 })
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
    })
    return networkResponse
  } catch (error) {
    console.log('Navigation request failed, checking cache:', error.message)
    
    try {
      // Check if we have the page in cache
      const cache = await caches.open(CACHE_NAME)
      const cachedResponse = await cache.match(request)
      
      if (cachedResponse) {
        return cachedResponse
      }
      
      // Try to serve the offline page
      const offlineResponse = await cache.match('/offline')
      if (offlineResponse) {
        return offlineResponse
      }
      
      // Try to serve the root page as fallback
      const rootResponse = await cache.match('/')
      if (rootResponse) {
        return rootResponse
      }
      
      // Final fallback
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Offline - Meta Ads Dashboard</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-message { max-width: 400px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>You're offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
        </html>
      `, { 
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      })
    } catch (cacheError) {
      console.error('Cache error in navigation handler:', cacheError)
      return new Response('Service temporarily unavailable', { status: 503 })
    }
  }
}

// Handle static assets - Cache first
async function handleStaticRequest(request) {
  // Skip extension URLs and let browser handle
  if (shouldSkipRequest(request)) {
    return fetch(request)
  }
  
  try {
    const cache = await caches.open(CACHE_NAME)
    
    // Check cache first
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    try {
      // Fetch from network with timeout
      const networkResponse = await fetch(request, {
        signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined
      })
      
      // Cache successful responses
      if (networkResponse.ok && networkResponse.status < 400) {
        try {
          await cache.put(request, networkResponse.clone())
        } catch (cacheError) {
          console.warn('Failed to cache static asset:', request.url, cacheError)
        }
      }
      
      return networkResponse
    } catch (networkError) {
      console.log('Failed to fetch static asset:', request.url, networkError.message)
      
      return new Response(
        JSON.stringify({ 
          error: 'Resource not available offline',
          url: request.url,
          timestamp: new Date().toISOString()
        }), 
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    console.error('Service Worker static handler error:', error)
    return new Response('Service error', { status: 500 })
  }
}

// Check if cache is still valid
function isCacheValid(url, cacheTime) {
  const cacheDate = new Date(cacheTime)
  const now = new Date()
  const age = now - cacheDate
  
  // Determine TTL based on URL
  if (url.includes('/api/meta/campaigns')) {
    return age < CACHE_TTL.api.campaigns
  } else if (url.includes('/api/meta/analytics')) {
    return age < CACHE_TTL.api.analytics
  } else if (url.includes('/api/meta/historical')) {
    return age < CACHE_TTL.api.historical
  } else if (url.includes('/api/meta/account')) {
    return age < CACHE_TTL.api.account
  }
  
  // Default API cache time
  return age < CACHE_TTL.api.campaigns
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-meta-data') {
    event.waitUntil(syncMetaData())
  }
})

// Sync Meta data when online
async function syncMetaData() {
  console.log('Background sync: Syncing Meta data...')
  
  // Get all cached API requests
  const cache = await caches.open(API_CACHE)
  const requests = await cache.keys()
  
  // Refresh cached data
  for (const request of requests) {
    try {
      const response = await fetch(request)
      if (response.ok) {
        const headers = new Headers(response.headers)
        headers.set('sw-cache-time', new Date().toISOString())
        
        const cachedResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: headers
        })
        
        // Check if URL is not a chrome-extension before caching
        if (!request.url.startsWith('chrome-extension://')) {
          try {
            await cache.put(request, cachedResponse)
          } catch (error) {
            console.error('Failed to cache in sync:', request.url, error)
          }
        }
      }
    } catch (error) {
      console.error('Sync failed for:', request.url, error)
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