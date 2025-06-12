// Simple Service Worker for Meta Ads Dashboard
const SW_VERSION = '4.0.0'
const CACHE_NAME = `meta-ads-v${SW_VERSION}`

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v' + SW_VERSION)
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(['/']))
      .then(() => self.skipWaiting())
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v' + SW_VERSION)
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - simple network-first strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone))
        }
        return response
      })
      .catch(() => {
        return caches.match(event.request)
      })
  )
})