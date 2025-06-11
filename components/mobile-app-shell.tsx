'use client'

import React, { useState, useEffect, Suspense } from 'react'
// import { motion, AnimatePresence } from 'framer-motion'
import { useDeviceOptimizations, useSafeAreaInsets } from '@/hooks/use-mobile'
import { useAccessibility } from '@/hooks/use-accessibility'
import { useOffline } from '@/hooks/use-offline'
import { usePerformance } from '@/hooks/use-performance'
import { MobileGestureNav } from '@/components/mobile-gesture-nav'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface MobileAppShellProps {
  children: React.ReactNode
  enablePreloading?: boolean
  enableInstantLoading?: boolean
}

export function MobileAppShell({ 
  children, 
  enablePreloading = true,
  enableInstantLoading = true 
}: MobileAppShellProps) {
  const { isMobile, optimizations } = useDeviceOptimizations()
  const safeAreaInsets = useSafeAreaInsets()
  const { announce } = useAccessibility()
  const { isOnline, syncProgress } = useOffline()
  const { score } = usePerformance()
  const [isAppReady, setIsAppReady] = useState(false)
  const [showSplash, setShowSplash] = useState(enableInstantLoading)

  // App initialization
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Preload critical resources
        if (enablePreloading) {
          await preloadCriticalResources()
        }

        // Wait for minimum splash time
        await new Promise(resolve => setTimeout(resolve, 800))

        setIsAppReady(true)
        setShowSplash(false)

        // Announce app ready for screen readers
        announce('Meta Ads Dashboard loaded successfully')
      } catch (error) {
        console.error('App initialization failed:', error)
        setIsAppReady(true)
        setShowSplash(false)
        announce('App loaded with some issues')
      }
    }

    initializeApp()
  }, [enablePreloading, announce])

  // Network status announcements
  useEffect(() => {
    if (!isOnline) {
      announce('You are now offline. Some features may be limited.')
    } else {
      announce('You are back online.')
    }
  }, [isOnline, announce])

  if (!isMobile) {
    return <>{children}</>
  }

  return (
    <div 
      className={cn(
        "mobile-app-shell min-h-screen bg-background",
        "flex flex-col overflow-hidden"
      )}
      style={{
        paddingTop: safeAreaInsets.top,
        paddingBottom: safeAreaInsets.bottom,
        paddingLeft: safeAreaInsets.left,
        paddingRight: safeAreaInsets.right
      }}
    >
      {/* App Shell Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 bg-background flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-8"
              >
                <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xl">M</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Meta Ads</h1>
                <p className="text-muted-foreground">Dashboard Pro</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="w-32 h-1 bg-muted rounded-full mx-auto overflow-hidden"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="h-full bg-primary rounded-full"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Bar */}
      {isAppReady && (
        <div className="flex-shrink-0 bg-card border-b border-border px-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isOnline ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-muted-foreground">
                {isOnline ? 'Online' : 'Offline'}
              </span>
              {syncProgress && syncProgress.total > 0 && (
                <span className="text-muted-foreground">
                  Sync: {syncProgress.completed}/{syncProgress.total}
                </span>
              )}
            </div>
            
            {score && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Performance:</span>
                <span className={cn(
                  "font-medium",
                  score.overall >= 90 ? "text-green-600" :
                  score.overall >= 70 ? "text-yellow-600" : "text-red-600"
                )}>
                  {score.overall}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {isAppReady ? (
            <motion.div
              key="app-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full overflow-auto"
            >
              <Suspense fallback={<AppShellSkeleton />}>
                {children}
              </Suspense>
            </motion.div>
          ) : (
            <motion.div
              key="app-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center"
            >
              <AppShellSkeleton />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      {isAppReady && optimizations.enableGestures && (
        <MobileGestureNav />
      )}

      {/* Performance optimizations */}
      {optimizations.shouldReduceAnimations && (
        <style>{`
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        `}</style>
      )}
    </div>
  )
}

// App loading skeleton
function AppShellSkeleton() {
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-20" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-square">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ))}
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// Preload critical resources
async function preloadCriticalResources(): Promise<void> {
  const criticalResources = [
    '/api/health',
    '/icons/icon-192x192.svg',
    // Add other critical resources
  ]

  const preloadPromises = criticalResources.map(async (url) => {
    try {
      if (url.startsWith('/api/')) {
        await fetch(url)
      } else {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = url
        link.as = 'image'
        document.head.appendChild(link)
      }
    } catch (error) {
      console.warn(`Failed to preload ${url}:`, error)
    }
  })

  await Promise.allSettled(preloadPromises)
}

// Camera integration (basic implementation)
export function useCameraCapture() {
  const [isSupported, setIsSupported] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    setIsSupported('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)
  }, [])

  const startCamera = async (): Promise<MediaStream | null> => {
    if (!isSupported) return null

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera
        audio: false
      })
      setStream(mediaStream)
      return mediaStream
    } catch (error) {
      console.error('Camera access failed:', error)
      return null
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const capturePhoto = (videoElement: HTMLVideoElement): string | null => {
    if (!videoElement) return null

    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(videoElement, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.8)
  }

  return {
    isSupported,
    startCamera,
    stopCamera,
    capturePhoto,
    stream
  }
}

// Location services (basic implementation)
export function useLocationServices() {
  const [isSupported, setIsSupported] = useState(false)
  const [location, setLocation] = useState<GeolocationPosition | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsSupported('geolocation' in navigator)
  }, [])

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!isSupported) {
        reject(new Error('Geolocation not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position)
          setError(null)
          resolve(position)
        },
        (error) => {
          setError(error.message)
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  return {
    isSupported,
    location,
    error,
    getCurrentLocation
  }
}