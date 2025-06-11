'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  mobilePerformanceMonitor, 
  PerformanceMetrics, 
  PerformanceAlert, 
  CoreWebVitals 
} from '@/lib/performance/mobile-performance-monitor'

interface UsePerformanceReturn {
  // Current metrics
  metrics: PerformanceMetrics | null
  vitals: CoreWebVitals
  
  // Performance score
  score: {
    overall: number
    vitals: number
    mobile: number
    details: Record<string, number>
  } | null
  
  // Alerts
  alerts: PerformanceAlert[]
  criticalAlerts: PerformanceAlert[]
  
  // State
  isMonitoring: boolean
  lastUpdated: Date | null
  
  // Actions
  startMonitoring: () => void
  stopMonitoring: () => void
  clearAlerts: () => void
  measurePageLoad: () => Promise<number>
  measureInteractionDelay: (callback: () => void) => Promise<number>
  
  // Utils
  getVitalStatus: (vital: keyof CoreWebVitals) => 'good' | 'needs-improvement' | 'poor' | 'unknown'
  formatMetric: (metric: string, value: number | null) => string
}

export function usePerformance(): UsePerformanceReturn {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Initialize monitoring
  useEffect(() => {
    const handleMetricsUpdate = (newMetrics: PerformanceMetrics) => {
      setMetrics(newMetrics)
      setLastUpdated(new Date())
    }

    const handleAlertCreated = (alert: PerformanceAlert) => {
      setAlerts(prev => [...prev, alert])
    }

    const handleAlertsCleared = () => {
      setAlerts([])
    }

    // Subscribe to events
    mobilePerformanceMonitor.on('metrics-updated', handleMetricsUpdate)
    mobilePerformanceMonitor.on('alert-created', handleAlertCreated)
    mobilePerformanceMonitor.on('alerts-cleared', handleAlertsCleared)

    // Start monitoring by default
    startMonitoring()

    // Get initial metrics
    setMetrics(mobilePerformanceMonitor.getCurrentMetrics())
    setAlerts(mobilePerformanceMonitor.getAlerts())

    return () => {
      mobilePerformanceMonitor.off('metrics-updated', handleMetricsUpdate)
      mobilePerformanceMonitor.off('alert-created', handleAlertCreated)
      mobilePerformanceMonitor.off('alerts-cleared', handleAlertsCleared)
    }
  }, [])

  // Start monitoring
  const startMonitoring = useCallback(() => {
    mobilePerformanceMonitor.startMonitoring()
    setIsMonitoring(true)
  }, [])

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    mobilePerformanceMonitor.stopMonitoring()
    setIsMonitoring(false)
  }, [])

  // Clear alerts
  const clearAlerts = useCallback(() => {
    mobilePerformanceMonitor.clearAlerts()
  }, [])

  // Measure page load
  const measurePageLoad = useCallback(() => {
    return mobilePerformanceMonitor.measurePageLoad()
  }, [])

  // Measure interaction delay
  const measureInteractionDelay = useCallback((callback: () => void) => {
    return mobilePerformanceMonitor.measureInteractionDelay(callback)
  }, [])

  // Get vital status
  const getVitalStatus = useCallback((vital: keyof CoreWebVitals): 'good' | 'needs-improvement' | 'poor' | 'unknown' => {
    const value = metrics?.vitals[vital]
    if (value === null || value === undefined) return 'unknown'

    const thresholds = {
      CLS: { good: 0.1, needsImprovement: 0.25 },
      FID: { good: 100, needsImprovement: 300 },
      LCP: { good: 2500, needsImprovement: 4000 },
      FCP: { good: 1800, needsImprovement: 3000 },
      TTFB: { good: 800, needsImprovement: 1800 },
      INP: { good: 200, needsImprovement: 500 }
    }

    const threshold = thresholds[vital]
    if (!threshold) return 'unknown'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.needsImprovement) return 'needs-improvement'
    return 'poor'
  }, [metrics])

  // Format metric for display
  const formatMetric = useCallback((metric: string, value: number | null): string => {
    if (value === null || value === undefined) return 'N/A'

    switch (metric) {
      case 'CLS':
        return value.toFixed(3)
      case 'FID':
      case 'LCP':
      case 'FCP':
      case 'TTFB':
      case 'INP':
        return `${Math.round(value)}ms`
      default:
        return value.toString()
    }
  }, [])

  // Get performance score
  const score = metrics ? mobilePerformanceMonitor.getPerformanceScore() : null

  // Filter critical alerts
  const criticalAlerts = alerts.filter(alert => alert.type === 'critical')

  return {
    // Current metrics
    metrics,
    vitals: metrics?.vitals || {
      CLS: null,
      FID: null,
      LCP: null,
      FCP: null,
      TTFB: null,
      INP: null
    },
    
    // Performance score
    score,
    
    // Alerts
    alerts,
    criticalAlerts,
    
    // State
    isMonitoring,
    lastUpdated,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    clearAlerts,
    measurePageLoad,
    measureInteractionDelay,
    
    // Utils
    getVitalStatus,
    formatMetric
  }
}

// Hook for monitoring specific performance events
export function usePerformanceTracking() {
  const { measureInteractionDelay } = usePerformance()

  const trackInteraction = useCallback(async (
    name: string,
    callback: () => void
  ): Promise<number> => {
    const delay = await measureInteractionDelay(callback)
    
    // Log to analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'interaction_delay', {
        'interaction_name': name,
        'delay_ms': delay
      })
    }
    
    return delay
  }, [measureInteractionDelay])

  const trackNavigation = useCallback((route: string) => {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      
      if (typeof gtag !== 'undefined') {
        gtag('event', 'navigation_timing', {
          'route': route,
          'duration_ms': duration
        })
      }
      
      return duration
    }
  }, [])

  return {
    trackInteraction,
    trackNavigation
  }
}

// Hook for performance budgets
export function usePerformanceBudget() {
  const { metrics } = usePerformance()
  
  const budgets = {
    totalJavaScript: 300 * 1024, // 300KB
    totalCSS: 100 * 1024, // 100KB
    totalImages: 1 * 1024 * 1024, // 1MB
    loadTime: 3000, // 3 seconds
    memoryUsage: 50 * 1024 * 1024 // 50MB
  }

  const budgetStatus = {
    javascript: {
      used: 0,
      budget: budgets.totalJavaScript,
      exceeded: false
    },
    css: {
      used: 0,
      budget: budgets.totalCSS,
      exceeded: false
    },
    images: {
      used: 0,
      budget: budgets.totalImages,
      exceeded: false
    },
    loadTime: {
      used: metrics?.navigationTiming.loadComplete || 0,
      budget: budgets.loadTime,
      exceeded: (metrics?.navigationTiming.loadComplete || 0) > budgets.loadTime
    },
    memory: {
      used: metrics?.memory.usedJSHeapSize || 0,
      budget: budgets.memoryUsage,
      exceeded: (metrics?.memory.usedJSHeapSize || 0) > budgets.memoryUsage
    }
  }

  const totalBudgetExceeded = Object.values(budgetStatus)
    .filter(status => status.exceeded).length

  return {
    budgets,
    budgetStatus,
    totalBudgetExceeded,
    isWithinBudget: totalBudgetExceeded === 0
  }
}