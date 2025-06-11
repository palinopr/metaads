'use client'

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        // Check if we're in a secure context
        if (!window.isSecureContext && location.protocol !== 'http:' && location.hostname !== 'localhost') {
          console.warn('Service Worker requires a secure context (HTTPS)')
          return
        }

        // Register the service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none' // Always check for updates
        })
        
        console.log('Service Worker registered successfully:', registration.scope)
        
        // Check for updates every 5 minutes
        const updateInterval = setInterval(() => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(error => {
              console.warn('Service Worker update check failed:', error)
            })
          }
        }, 5 * 60 * 1000)
        
        // Clean up interval when page unloads
        window.addEventListener('beforeunload', () => {
          clearInterval(updateInterval)
        })
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          
          if (newWorker) {
            console.log('New service worker found, installing...')
            
            newWorker.addEventListener('statechange', () => {
              console.log('Service worker state changed:', newWorker.state)
              
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('New service worker available')
                  
                  // Show update notification (less intrusive)
                  try {
                    if ('Notification' in window && Notification.permission === 'granted') {
                      new Notification('Update Available', {
                        body: 'A new version of the app is available. Refresh to update.',
                        icon: '/icons/icon-96x96.svg',
                        tag: 'app-update'
                      })
                    } else {
                      // Fallback to console message
                      console.log('New version available. Refresh to update.')
                    }
                  } catch (error) {
                    console.warn('Failed to show update notification:', error)
                  }
                } else {
                  // First install
                  console.log('Service worker installed for the first time')
                }
              }
            })
            
            newWorker.addEventListener('error', (error) => {
              console.error('Service worker error during installation:', error)
            })
          }
        })
        
        // Handle controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service worker controller changed')
          // Only reload if we're not in the middle of an installation
          if (!registration.installing) {
            window.location.reload()
          }
        })
        
        // Handle messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('Message from service worker:', event.data)
          
          switch (event.data.type) {
            case 'CACHE_UPDATED':
              console.log('Cache updated:', event.data.cacheName)
              break
            case 'SYNC_COMPLETE':
              console.log('Background sync completed:', event.data.timestamp)
              break
            case 'OFFLINE':
              console.log('App is now offline')
              break
            case 'ONLINE':
              console.log('App is now online')
              break
            default:
              console.log('Unknown message type:', event.data.type)
          }
        })
        
        // Handle registration errors
        registration.addEventListener('error', (error) => {
          console.error('Service worker registration error:', error)
        })
        
        // Check initial state
        if (registration.active) {
          console.log('Service worker is active and ready')
        }
        
        if (registration.waiting) {
          console.log('Service worker update is waiting')
        }
        
        if (registration.installing) {
          console.log('Service worker is installing')
        }
        
      } catch (error) {
        console.error('Service Worker registration failed:', error)
        
        // Try to provide helpful error messages
        if (error instanceof TypeError) {
          console.error('This might be a network or CORS issue')
        } else if (error instanceof SecurityError) {
          console.error('Service worker blocked by security policy (CSP?)')
        }
      }
    })
  } else {
    console.log('Service Workers are not supported in this browser')
  }
}

// Unregister service worker (for debugging)
export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      await registration.unregister()
    }
  }
}

// Check if service worker is supported
export function isServiceWorkerSupported() {
  return 'serviceWorker' in navigator
}

// Get service worker status
export async function getServiceWorkerStatus() {
  if (!isServiceWorkerSupported()) {
    return { supported: false, status: 'not-supported' }
  }
  
  const registration = await navigator.serviceWorker.getRegistration()
  
  if (!registration) {
    return { supported: true, status: 'not-registered' }
  }
  
  return {
    supported: true,
    status: 'active',
    scope: registration.scope,
    updateAvailable: registration.waiting !== null,
  }
}