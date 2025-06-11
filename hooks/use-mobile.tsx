import * as React from "react"

// Enhanced breakpoint system
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  wide: 1920
} as const

type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'wide'
type DeviceCapabilities = {
  hasTouch: boolean
  hasGyroscope: boolean
  hasCamera: boolean
  hasGeolocation: boolean
  isStandalone: boolean
  supportsNotifications: boolean
  supportsServiceWorker: boolean
  networkConnection: string
  deviceMemory: number
  hardwareConcurrency: number
}

type ResponsiveState = {
  deviceType: DeviceType
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isWide: boolean
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
  pixelRatio: number
  capabilities: DeviceCapabilities
}

// Enhanced mobile detection hook
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.mobile - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.mobile)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < BREAKPOINTS.mobile)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Enhanced responsive hook with device capabilities
export function useResponsive(): ResponsiveState {
  const [state, setState] = React.useState<ResponsiveState>(() => ({
    deviceType: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isWide: false,
    width: 1024,
    height: 768,
    orientation: 'landscape',
    pixelRatio: 1,
    capabilities: {
      hasTouch: false,
      hasGyroscope: false,
      hasCamera: false,
      hasGeolocation: false,
      isStandalone: false,
      supportsNotifications: false,
      supportsServiceWorker: false,
      networkConnection: 'unknown',
      deviceMemory: 4,
      hardwareConcurrency: 4
    }
  }))

  React.useEffect(() => {
    const updateState = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const orientation = width > height ? 'landscape' : 'portrait'
      const pixelRatio = window.devicePixelRatio || 1

      // Determine device type
      let deviceType: DeviceType = 'desktop'
      if (width < BREAKPOINTS.mobile) deviceType = 'mobile'
      else if (width < BREAKPOINTS.tablet) deviceType = 'tablet'
      else if (width < BREAKPOINTS.desktop) deviceType = 'desktop'
      else deviceType = 'wide'

      // Detect device capabilities
      const capabilities: DeviceCapabilities = {
        hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        hasGyroscope: 'DeviceOrientationEvent' in window,
        hasCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        hasGeolocation: 'geolocation' in navigator,
        isStandalone: window.matchMedia('(display-mode: standalone)').matches,
        supportsNotifications: 'Notification' in window,
        supportsServiceWorker: 'serviceWorker' in navigator,
        networkConnection: (navigator as any).connection?.effectiveType || 'unknown',
        deviceMemory: (navigator as any).deviceMemory || 4,
        hardwareConcurrency: navigator.hardwareConcurrency || 4
      }

      setState({
        deviceType,
        isMobile: deviceType === 'mobile',
        isTablet: deviceType === 'tablet',
        isDesktop: deviceType === 'desktop',
        isWide: deviceType === 'wide',
        width,
        height,
        orientation,
        pixelRatio,
        capabilities
      })
    }

    // Initial update
    updateState()

    // Listen for resize events
    const resizeHandler = () => updateState()
    window.addEventListener('resize', resizeHandler)
    window.addEventListener('orientationchange', resizeHandler)

    // Listen for connection changes
    const connectionHandler = () => updateState()
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', connectionHandler)
    }

    return () => {
      window.removeEventListener('resize', resizeHandler)
      window.removeEventListener('orientationchange', resizeHandler)
      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener('change', connectionHandler)
      }
    }
  }, [])

  return state
}

// Device-specific optimization hook
export function useDeviceOptimizations() {
  const responsive = useResponsive()
  
  const optimizations = React.useMemo(() => {
    const { deviceType, capabilities } = responsive
    
    return {
      // Performance optimizations
      shouldUseVirtualization: deviceType === 'mobile' || capabilities.deviceMemory < 4,
      shouldLazyLoadImages: deviceType === 'mobile' || capabilities.networkConnection === 'slow-2g',
      shouldReduceAnimations: deviceType === 'mobile' && capabilities.hardwareConcurrency < 4,
      shouldUseLowQualityImages: capabilities.networkConnection === 'slow-2g',
      
      // UI optimizations
      touchTargetSize: deviceType === 'mobile' ? 48 : 32,
      gridColumns: deviceType === 'mobile' ? 1 : deviceType === 'tablet' ? 2 : 3,
      modalSize: deviceType === 'mobile' ? 'full' : 'default',
      
      // Feature enablement
      enableGestures: capabilities.hasTouch,
      enableCameraCapture: capabilities.hasCamera,
      enablePushNotifications: capabilities.supportsNotifications,
      enableOfflineMode: capabilities.supportsServiceWorker,
      
      // Layout preferences
      preferBottomNavigation: deviceType === 'mobile',
      preferSideNavigation: deviceType !== 'mobile',
      enablePullToRefresh: deviceType === 'mobile',
      
      // Data loading strategies
      prefetchStrategy: deviceType === 'mobile' ? 'minimal' : 'aggressive',
      cacheStrategy: capabilities.deviceMemory > 8 ? 'extensive' : 'conservative',
      backgroundSyncEnabled: capabilities.supportsServiceWorker && deviceType === 'mobile'
    }
  }, [responsive])
  
  return { ...responsive, optimizations }
}

// Viewport detection hook
export function useViewportSize() {
  const [size, setSize] = React.useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  }))

  React.useEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', updateSize)
    window.addEventListener('orientationchange', updateSize)
    
    return () => {
      window.removeEventListener('resize', updateSize)
      window.removeEventListener('orientationchange', updateSize)
    }
  }, [])

  return size
}

// Safe area insets hook for mobile devices
export function useSafeAreaInsets() {
  const [insets, setInsets] = React.useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  })

  React.useEffect(() => {
    const updateInsets = () => {
      const style = getComputedStyle(document.documentElement)
      setInsets({
        top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
        right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0,
        bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
        left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0
      })
    }

    updateInsets()
    window.addEventListener('resize', updateInsets)
    window.addEventListener('orientationchange', updateInsets)
    
    return () => {
      window.removeEventListener('resize', updateInsets)
      window.removeEventListener('orientationchange', updateInsets)
    }
  }, [])

  return insets
}

// Network status hook
export function useNetworkStatus() {
  const [status, setStatus] = React.useState(() => ({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    effectiveType: (navigator as any).connection?.effectiveType || 'unknown',
    downlink: (navigator as any).connection?.downlink || 0,
    rtt: (navigator as any).connection?.rtt || 0,
    saveData: (navigator as any).connection?.saveData || false
  }))

  React.useEffect(() => {
    const updateStatus = () => {
      setStatus({
        isOnline: navigator.onLine,
        effectiveType: (navigator as any).connection?.effectiveType || 'unknown',
        downlink: (navigator as any).connection?.downlink || 0,
        rtt: (navigator as any).connection?.rtt || 0,
        saveData: (navigator as any).connection?.saveData || false
      })
    }

    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', updateStatus)
    }

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener('change', updateStatus)
      }
    }
  }, [])

  return status
}
