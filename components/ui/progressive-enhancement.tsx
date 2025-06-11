"use client"

import * as React from "react"
// // import { motion, AnimatePresence } from "framer-motion"

// Progressive Enhancement Hook
export function useProgressiveEnhancement() {
  const [isClient, setIsClient] = React.useState(false)
  const [isOnline, setIsOnline] = React.useState(true)
  const [connectionType, setConnectionType] = React.useState<string>("unknown")

  React.useEffect(() => {
    setIsClient(true)
    setIsOnline(navigator.onLine)

    // Network connection type detection
    if ("connection" in navigator) {
      const connection = (navigator as any).connection
      setConnectionType(connection?.effectiveType || "unknown")
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return { isClient, isOnline, connectionType }
}

// Feature Detection Hook
export function useFeatureDetection() {
  const [features, setFeatures] = React.useState({
    webp: false,
    avif: false,
    intersection: false,
    webgl: false,
    touch: false,
    serviceWorker: false,
    webShare: false,
  })

  React.useEffect(() => {
    const detectFeatures = async () => {
      // WebP support
      const webpSupport = await new Promise((resolve) => {
        const webP = new Image()
        webP.onload = webP.onerror = () => resolve(webP.height === 2)
        webP.src = "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA"
      })

      // AVIF support
      const avifSupport = await new Promise((resolve) => {
        const avif = new Image()
        avif.onload = avif.onerror = () => resolve(avif.height === 2)
        avif.src = "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A="
      })

      setFeatures({
        webp: !!webpSupport,
        avif: !!avifSupport,
        intersection: typeof IntersectionObserver !== "undefined",
        webgl: !!document.createElement("canvas").getContext("webgl"),
        touch: "ontouchstart" in window,
        serviceWorker: "serviceWorker" in navigator,
        webShare: "share" in navigator,
      })
    }

    detectFeatures()
  }, [])

  return features
}

// Connection-aware Component Renderer
interface ConnectionAwareProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  minConnection?: "slow-2g" | "2g" | "3g" | "4g"
}

export function ConnectionAware({ 
  children, 
  fallback, 
  minConnection = "2g" 
}: ConnectionAwareProps) {
  const { connectionType, isOnline } = useProgressiveEnhancement()

  const connectionOrder = ["slow-2g", "2g", "3g", "4g"]
  const currentIndex = connectionOrder.indexOf(connectionType)
  const minIndex = connectionOrder.indexOf(minConnection)

  const shouldRender = isOnline && currentIndex >= minIndex

  return shouldRender ? <>{children}</> : <>{fallback}</>
}

// Lazy Image with Progressive Enhancement
interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  placeholder?: string
  quality?: "low" | "medium" | "high"
  lazy?: boolean
}

export function ProgressiveImage({
  src,
  alt,
  placeholder,
  quality = "medium",
  lazy = true,
  className,
  ...props
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [shouldLoad, setShouldLoad] = React.useState(!lazy)
  const { connectionType } = useProgressiveEnhancement()
  const features = useFeatureDetection()
  const imgRef = React.useRef<HTMLImageElement>(null)

  // Choose optimal format based on support
  const getOptimalSrc = (baseSrc: string) => {
    if (features.avif && quality === "high") {
      return baseSrc.replace(/\.(jpg|jpeg|png)$/i, ".avif")
    }
    if (features.webp) {
      return baseSrc.replace(/\.(jpg|jpeg|png)$/i, ".webp")
    }
    return baseSrc
  }

  // Adjust quality based on connection
  const getQualitySrc = (baseSrc: string) => {
    const qualityMap = {
      "slow-2g": "low",
      "2g": "low",
      "3g": "medium",
      "4g": "high",
    }
    
    const targetQuality = qualityMap[connectionType as keyof typeof qualityMap] || quality
    
    if (targetQuality === "low") {
      return baseSrc.replace(/(\.[^.]+)$/, "_low$1")
    }
    if (targetQuality === "medium") {
      return baseSrc.replace(/(\.[^.]+)$/, "_medium$1")
    }
    return baseSrc
  }

  React.useEffect(() => {
    if (!lazy || !features.intersection) {
      setShouldLoad(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, features.intersection])

  const optimizedSrc = getOptimalSrc(getQualitySrc(src))

  return (
    <div className="relative overflow-hidden">
      {placeholder && !isLoaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
        />
      )}
      
      <img
        ref={imgRef}
        src={shouldLoad ? optimizedSrc : undefined}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        onLoad={() => setIsLoaded(true)}
        loading={lazy ? "lazy" : "eager"}
        {...props}
      />
    </div>
  )
}

// Adaptive UI Component
interface AdaptiveUIProps {
  children: React.ReactNode
  mobileComponent?: React.ReactNode
  desktopComponent?: React.ReactNode
  tabletComponent?: React.ReactNode
}

export function AdaptiveUI({
  children,
  mobileComponent,
  desktopComponent,
  tabletComponent,
}: AdaptiveUIProps) {
  const [viewport, setViewport] = React.useState<"mobile" | "tablet" | "desktop">("desktop")
  const features = useFeatureDetection()

  React.useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth
      if (width < 768) {
        setViewport("mobile")
      } else if (width < 1024) {
        setViewport("tablet")
      } else {
        setViewport("desktop")
      }
    }

    updateViewport()
    window.addEventListener("resize", updateViewport)
    return () => window.removeEventListener("resize", updateViewport)
  }, [])

  // Use touch-optimized components on touch devices
  if (features.touch && viewport === "mobile" && mobileComponent) {
    return <>{mobileComponent}</>
  }

  if (viewport === "tablet" && tabletComponent) {
    return <>{tabletComponent}</>
  }

  if (viewport === "desktop" && desktopComponent) {
    return <>{desktopComponent}</>
  }

  return <>{children}</>
}

// Offline Indicator
export function OfflineIndicator() {
  const { isOnline } = useProgressiveEnhancement()

  return (
    <div>
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-center py-2 text-sm font-medium">
          You are currently offline. Some features may not be available.
        </div>
      )}
    </div>
  )
}

// Performance Monitor
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState({
    fcp: 0,
    lcp: 0,
    cls: 0,
    fid: 0,
  })

  React.useEffect(() => {
    if (typeof window === "undefined" || !("performance" in window)) return

    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const fcpEntry = list.getEntries().find(entry => entry.name === "first-contentful-paint")
      if (fcpEntry) {
        setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }))
      }
    })
    fcpObserver.observe({ entryTypes: ["paint"] })

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }))
    })
    lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })

    // Cumulative Layout Shift
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
          setMetrics(prev => ({ ...prev, cls: clsValue }))
        }
      }
    })
    clsObserver.observe({ entryTypes: ["layout-shift"] })

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }))
      }
    })
    fidObserver.observe({ entryTypes: ["first-input"] })

    return () => {
      fcpObserver.disconnect()
      lcpObserver.disconnect()
      clsObserver.disconnect()
      fidObserver.disconnect()
    }
  }, [])

  return metrics
}

// Critical Resource Preloader
interface CriticalResourcesProps {
  fonts?: string[]
  images?: string[]
  scripts?: string[]
  styles?: string[]
}

export function CriticalResources({
  fonts = [],
  images = [],
  scripts = [],
  styles = [],
}: CriticalResourcesProps) {
  const { isClient, connectionType } = useProgressiveEnhancement()

  React.useEffect(() => {
    if (!isClient || connectionType === "slow-2g") return

    // Preload critical fonts
    fonts.forEach(font => {
      const link = document.createElement("link")
      link.rel = "preload"
      link.href = font
      link.as = "font"
      link.type = "font/woff2"
      link.crossOrigin = "anonymous"
      document.head.appendChild(link)
    })

    // Preload critical images
    if (connectionType !== "2g") {
      images.forEach(image => {
        const link = document.createElement("link")
        link.rel = "preload"
        link.href = image
        link.as = "image"
        document.head.appendChild(link)
      })
    }

    // Preload critical scripts
    if (connectionType === "4g") {
      scripts.forEach(script => {
        const link = document.createElement("link")
        link.rel = "preload"
        link.href = script
        link.as = "script"
        document.head.appendChild(link)
      })
    }

    // Preload critical styles
    styles.forEach(style => {
      const link = document.createElement("link")
      link.rel = "preload"
      link.href = style
      link.as = "style"
      document.head.appendChild(link)
    })
  }, [isClient, connectionType, fonts, images, scripts, styles])

  return null
}

// Service Worker Registration
export function useServiceWorker(swPath = "/sw.js") {
  const [registration, setRegistration] = React.useState<ServiceWorkerRegistration | null>(null)
  const [isSupported, setIsSupported] = React.useState(false)
  const features = useFeatureDetection()

  React.useEffect(() => {
    setIsSupported(features.serviceWorker)

    if (!features.serviceWorker) return

    navigator.serviceWorker
      .register(swPath)
      .then((registration) => {
        setRegistration(registration)
        console.log("SW registered: ", registration)
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError)
      })

    return () => {
      if (registration) {
        registration.unregister()
      }
    }
  }, [features.serviceWorker, swPath])

  return { registration, isSupported }
}