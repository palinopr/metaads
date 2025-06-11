'use client'

export interface CoreWebVitals {
  // Core Web Vitals
  CLS: number | null // Cumulative Layout Shift
  FID: number | null // First Input Delay
  LCP: number | null // Largest Contentful Paint
  
  // Additional metrics
  FCP: number | null // First Contentful Paint
  TTFB: number | null // Time to First Byte
  INP: number | null // Interaction to Next Paint
}

export interface PerformanceMetrics {
  // Core Web Vitals
  vitals: CoreWebVitals
  
  // Mobile-specific metrics
  connectionType: string
  deviceMemory: number
  hardwareConcurrency: number
  
  // Navigation timing
  navigationTiming: {
    domContentLoaded: number
    loadComplete: number
    redirectTime: number
    dnsTime: number
    connectTime: number
    responseTime: number
    domParseTime: number
    renderTime: number
  }
  
  // Resource timing
  resourceTiming: {
    totalResources: number
    slowResources: ResourceTiming[]
    totalTransferSize: number
    totalDecodedSize: number
  }
  
  // Memory usage
  memory: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
    pressure: 'nominal' | 'fair' | 'serious' | 'critical'
  }
  
  // User experience
  userExperience: {
    pageLoadTime: number
    timeToInteractive: number
    firstInputDelay: number
    layoutStability: number
    visualStability: number
  }
  
  // Mobile-specific issues
  mobileIssues: {
    smallTouchTargets: number
    slowAnimations: number
    oversizedImages: number
    unoptimizedFonts: number
    excessiveRedraws: number
  }
}

export interface PerformanceAlert {
  id: string
  type: 'warning' | 'error' | 'critical'
  metric: keyof CoreWebVitals | string
  value: number
  threshold: number
  message: string
  suggestions: string[]
  timestamp: number
}

export interface PerformanceThresholds {
  CLS: { good: number; needsImprovement: number }
  FID: { good: number; needsImprovement: number }
  LCP: { good: number; needsImprovement: number }
  FCP: { good: number; needsImprovement: number }
  TTFB: { good: number; needsImprovement: number }
  INP: { good: number; needsImprovement: number }
}

interface ResourceTiming {
  name: string
  duration: number
  transferSize: number
  decodedBodySize: number
  type: string
}

class MobilePerformanceMonitor {
  private vitals: CoreWebVitals = {
    CLS: null,
    FID: null,
    LCP: null,
    FCP: null,
    TTFB: null,
    INP: null
  }

  private observer: PerformanceObserver | null = null
  private listeners: Map<string, Set<Function>> = new Map()
  private alerts: PerformanceAlert[] = []
  private isMonitoring = false
  
  private thresholds: PerformanceThresholds = {
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FID: { good: 100, needsImprovement: 300 },
    LCP: { good: 2500, needsImprovement: 4000 },
    FCP: { good: 1800, needsImprovement: 3000 },
    TTFB: { good: 800, needsImprovement: 1800 },
    INP: { good: 200, needsImprovement: 500 }
  }

  private performanceEntries: PerformanceEntry[] = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupPerformanceObserver()
      this.startMonitoring()
    }
  }

  // Start performance monitoring
  startMonitoring(): void {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    this.measureInitialMetrics()
    this.setupWebVitalsObserver()
    this.setupMemoryMonitoring()
    this.setupMobileSpecificChecks()
    
    // Report metrics periodically
    setInterval(() => {
      this.reportMetrics()
    }, 30000) // Every 30 seconds
  }

  // Stop monitoring
  stopMonitoring(): void {
    this.isMonitoring = false
    this.observer?.disconnect()
  }

  // Get current performance metrics
  getCurrentMetrics(): PerformanceMetrics {
    return {
      vitals: { ...this.vitals },
      connectionType: this.getConnectionType(),
      deviceMemory: (navigator as any).deviceMemory || 4,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      navigationTiming: this.getNavigationTiming(),
      resourceTiming: this.getResourceTiming(),
      memory: this.getMemoryUsage(),
      userExperience: this.getUserExperienceMetrics(),
      mobileIssues: this.getMobileIssues()
    }
  }

  // Get performance alerts
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts]
  }

  // Clear alerts
  clearAlerts(): void {
    this.alerts = []
    this.emit('alerts-cleared')
  }

  // Add event listener
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  // Remove event listener
  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback)
  }

  // Measure page load performance
  measurePageLoad(): Promise<number> {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve(performance.now())
      } else {
        window.addEventListener('load', () => {
          resolve(performance.now())
        }, { once: true })
      }
    })
  }

  // Measure interaction delay
  measureInteractionDelay(callback: () => void): Promise<number> {
    return new Promise((resolve) => {
      const startTime = performance.now()
      requestAnimationFrame(() => {
        callback()
        requestAnimationFrame(() => {
          const delay = performance.now() - startTime
          resolve(delay)
        })
      })
    })
  }

  // Get performance score
  getPerformanceScore(): {
    overall: number
    vitals: number
    mobile: number
    details: Record<string, number>
  } {
    const scores = {
      CLS: this.scoreMetric('CLS', this.vitals.CLS),
      FID: this.scoreMetric('FID', this.vitals.FID),
      LCP: this.scoreMetric('LCP', this.vitals.LCP),
      FCP: this.scoreMetric('FCP', this.vitals.FCP),
      TTFB: this.scoreMetric('TTFB', this.vitals.TTFB),
      INP: this.scoreMetric('INP', this.vitals.INP)
    }

    const vitalsScore = Object.values(scores)
      .filter(score => score !== null)
      .reduce((sum, score) => sum + score!, 0) / 
      Object.values(scores).filter(score => score !== null).length

    const mobileScore = this.getMobilePerformanceScore()
    const overallScore = (vitalsScore + mobileScore) / 2

    return {
      overall: Math.round(overallScore),
      vitals: Math.round(vitalsScore),
      mobile: Math.round(mobileScore),
      details: scores as Record<string, number>
    }
  }

  // Private methods
  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return

    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.performanceEntries.push(entry)
        this.processPerformanceEntry(entry)
      }
    })

    // Observe different entry types
    try {
      this.observer.observe({ entryTypes: ['navigation', 'resource', 'paint', 'layout-shift', 'first-input'] })
    } catch (error) {
      console.warn('Some performance entry types not supported:', error)
    }
  }

  private setupWebVitalsObserver(): void {
    // LCP Observer
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
      this.vitals.LCP = lastEntry.startTime
      this.checkThreshold('LCP', lastEntry.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // FID Observer
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fidEntry = entry as PerformanceEntry & { processingStart: number; startTime: number }
        this.vitals.FID = fidEntry.processingStart - fidEntry.startTime
        this.checkThreshold('FID', this.vitals.FID)
      }
    }).observe({ entryTypes: ['first-input'] })

    // CLS Observer
    let clsValue = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const clsEntry = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }
        if (!clsEntry.hadRecentInput) {
          clsValue += clsEntry.value
        }
      }
      this.vitals.CLS = clsValue
      this.checkThreshold('CLS', clsValue)
    }).observe({ entryTypes: ['layout-shift'] })

    // FCP Observer
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.vitals.FCP = entry.startTime
          this.checkThreshold('FCP', entry.startTime)
        }
      }
    }).observe({ entryTypes: ['paint'] })
  }

  private measureInitialMetrics(): void {
    // TTFB from Navigation Timing
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navTiming) {
      this.vitals.TTFB = navTiming.responseStart - navTiming.requestStart
      this.checkThreshold('TTFB', this.vitals.TTFB)
    }
  }

  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memoryInfo = (performance as any).memory
        const usage = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit
        
        if (usage > 0.9) {
          this.createAlert('critical', 'memory', usage * 100, 90, 
            'Memory usage is critically high', [
              'Consider reducing memory usage',
              'Clear unused references',
              'Optimize data structures'
            ])
        }
      }, 10000) // Check every 10 seconds
    }
  }

  private setupMobileSpecificChecks(): void {
    // Check for mobile performance issues periodically
    setTimeout(() => {
      this.checkMobileIssues()
    }, 5000) // After initial load

    // Check on interaction
    document.addEventListener('touchstart', () => {
      setTimeout(() => this.checkMobileIssues(), 1000)
    }, { passive: true })
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.processNavigationEntry(entry as PerformanceNavigationTiming)
        break
      case 'resource':
        this.processResourceEntry(entry as PerformanceResourceTiming)
        break
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    const timing = this.getNavigationTiming()
    
    // Check for slow navigation
    if (timing.loadComplete > 5000) {
      this.createAlert('warning', 'loadTime', timing.loadComplete, 5000,
        'Page load time is slow', [
          'Optimize critical resources',
          'Reduce bundle size',
          'Enable compression'
        ])
    }
  }

  private processResourceEntry(entry: PerformanceResourceTiming): void {
    // Check for slow resources
    if (entry.duration > 1000) {
      this.createAlert('warning', 'slowResource', entry.duration, 1000,
        `Slow resource: ${entry.name}`, [
          'Optimize resource size',
          'Use CDN',
          'Enable caching'
        ])
    }

    // Check for large resources
    if (entry.transferSize > 1000000) { // 1MB
      this.createAlert('warning', 'largeResource', entry.transferSize, 1000000,
        `Large resource: ${entry.name}`, [
          'Compress resource',
          'Use modern formats',
          'Implement lazy loading'
        ])
    }
  }

  private checkThreshold(metric: keyof PerformanceThresholds, value: number): void {
    const threshold = this.thresholds[metric]
    if (!threshold) return

    if (value > threshold.needsImprovement) {
      this.createAlert('error', metric, value, threshold.needsImprovement,
        `${metric} is poor`, this.getSuggestions(metric))
    } else if (value > threshold.good) {
      this.createAlert('warning', metric, value, threshold.good,
        `${metric} needs improvement`, this.getSuggestions(metric))
    }
  }

  private getSuggestions(metric: string): string[] {
    const suggestions: Record<string, string[]> = {
      CLS: [
        'Add size attributes to images and videos',
        'Reserve space for dynamic content',
        'Avoid inserting content above existing content'
      ],
      FID: [
        'Reduce JavaScript execution time',
        'Split long tasks',
        'Use web workers for heavy computation'
      ],
      LCP: [
        'Optimize images and videos',
        'Preload critical resources',
        'Remove unused CSS and JavaScript'
      ],
      FCP: [
        'Eliminate render-blocking resources',
        'Minify CSS and JavaScript',
        'Use efficient cache policies'
      ],
      TTFB: [
        'Optimize server response time',
        'Use CDN',
        'Enable compression'
      ],
      INP: [
        'Optimize event handlers',
        'Use passive event listeners',
        'Debounce frequent interactions'
      ]
    }

    return suggestions[metric] || ['Optimize performance']
  }

  private createAlert(
    type: PerformanceAlert['type'],
    metric: string,
    value: number,
    threshold: number,
    message: string,
    suggestions: string[]
  ): void {
    const alert: PerformanceAlert = {
      id: `${metric}-${Date.now()}`,
      type,
      metric,
      value,
      threshold,
      message,
      suggestions,
      timestamp: Date.now()
    }

    this.alerts.push(alert)
    this.emit('alert-created', alert)

    // Limit alerts to prevent memory issues
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-30)
    }
  }

  private checkMobileIssues(): void {
    // Check touch target sizes
    const touchTargets = document.querySelectorAll('button, a, input, [role="button"]')
    let smallTargets = 0

    touchTargets.forEach(target => {
      const rect = target.getBoundingClientRect()
      if (rect.width < 44 || rect.height < 44) {
        smallTargets++
      }
    })

    if (smallTargets > 0) {
      this.createAlert('warning', 'touchTargets', smallTargets, 0,
        `${smallTargets} touch targets are too small`, [
          'Increase touch target size to at least 44px',
          'Add more padding to interactive elements',
          'Use touch-target CSS class'
        ])
    }
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection
    return connection?.effectiveType || 'unknown'
  }

  private getNavigationTiming(): PerformanceMetrics['navigationTiming'] {
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    if (!navTiming) {
      return {
        domContentLoaded: 0,
        loadComplete: 0,
        redirectTime: 0,
        dnsTime: 0,
        connectTime: 0,
        responseTime: 0,
        domParseTime: 0,
        renderTime: 0
      }
    }

    return {
      domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.navigationStart,
      loadComplete: navTiming.loadEventEnd - navTiming.navigationStart,
      redirectTime: navTiming.redirectEnd - navTiming.redirectStart,
      dnsTime: navTiming.domainLookupEnd - navTiming.domainLookupStart,
      connectTime: navTiming.connectEnd - navTiming.connectStart,
      responseTime: navTiming.responseEnd - navTiming.responseStart,
      domParseTime: navTiming.domComplete - navTiming.domLoading,
      renderTime: navTiming.domContentLoadedEventStart - navTiming.domLoading
    }
  }

  private getResourceTiming(): PerformanceMetrics['resourceTiming'] {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    const slowResources = resources
      .filter(resource => resource.duration > 1000)
      .map(resource => ({
        name: resource.name,
        duration: resource.duration,
        transferSize: resource.transferSize,
        decodedBodySize: resource.decodedBodySize,
        type: this.getResourceType(resource.name)
      }))

    const totalTransferSize = resources.reduce((sum, resource) => sum + resource.transferSize, 0)
    const totalDecodedSize = resources.reduce((sum, resource) => sum + resource.decodedBodySize, 0)

    return {
      totalResources: resources.length,
      slowResources,
      totalTransferSize,
      totalDecodedSize
    }
  }

  private getResourceType(url: string): string {
    if (url.match(/\.(js|jsx|ts|tsx)$/)) return 'script'
    if (url.match(/\.(css|scss|sass)$/)) return 'stylesheet'
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font'
    return 'other'
  }

  private getMemoryUsage(): PerformanceMetrics['memory'] {
    const memoryInfo = (performance as any).memory

    if (!memoryInfo) {
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        pressure: 'nominal'
      }
    }

    const usage = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit
    let pressure: 'nominal' | 'fair' | 'serious' | 'critical' = 'nominal'

    if (usage > 0.9) pressure = 'critical'
    else if (usage > 0.7) pressure = 'serious'
    else if (usage > 0.5) pressure = 'fair'

    return {
      usedJSHeapSize: memoryInfo.usedJSHeapSize,
      totalJSHeapSize: memoryInfo.totalJSHeapSize,
      jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
      pressure
    }
  }

  private getUserExperienceMetrics(): PerformanceMetrics['userExperience'] {
    return {
      pageLoadTime: this.getNavigationTiming().loadComplete,
      timeToInteractive: this.vitals.LCP || 0,
      firstInputDelay: this.vitals.FID || 0,
      layoutStability: this.vitals.CLS || 0,
      visualStability: this.vitals.LCP ? (this.vitals.LCP < 2500 ? 1 : 0) : 0
    }
  }

  private getMobileIssues(): PerformanceMetrics['mobileIssues'] {
    return {
      smallTouchTargets: this.countSmallTouchTargets(),
      slowAnimations: this.countSlowAnimations(),
      oversizedImages: this.countOversizedImages(),
      unoptimizedFonts: this.countUnoptimizedFonts(),
      excessiveRedraws: 0 // Would need more complex tracking
    }
  }

  private countSmallTouchTargets(): number {
    const touchTargets = document.querySelectorAll('button, a, input, [role="button"]')
    let count = 0

    touchTargets.forEach(target => {
      const rect = target.getBoundingClientRect()
      if (rect.width < 44 || rect.height < 44) count++
    })

    return count
  }

  private countSlowAnimations(): number {
    // This would require monitoring animation performance
    return 0
  }

  private countOversizedImages(): number {
    const images = document.querySelectorAll('img')
    let count = 0

    images.forEach(img => {
      if (img.naturalWidth > img.clientWidth * 2) count++
    })

    return count
  }

  private countUnoptimizedFonts(): number {
    // This would require analyzing font loading
    return 0
  }

  private getMobilePerformanceScore(): number {
    const issues = this.getMobileIssues()
    const totalIssues = Object.values(issues).reduce((sum, count) => sum + count, 0)
    
    // Score based on number of issues (fewer issues = higher score)
    return Math.max(0, 100 - (totalIssues * 10))
  }

  private scoreMetric(metric: keyof PerformanceThresholds, value: number | null): number | null {
    if (value === null) return null

    const threshold = this.thresholds[metric]
    if (!threshold) return null

    if (value <= threshold.good) return 90
    if (value <= threshold.needsImprovement) return 50
    return 25
  }

  private reportMetrics(): void {
    const metrics = this.getCurrentMetrics()
    this.emit('metrics-updated', metrics)

    // Send to analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_metrics', {
        custom_map: {
          'metric_1': 'CLS',
          'metric_2': 'FID',
          'metric_3': 'LCP'
        },
        'metric_1': metrics.vitals.CLS,
        'metric_2': metrics.vitals.FID,
        'metric_3': metrics.vitals.LCP
      })
    }
  }

  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('Error in performance monitor event listener:', error)
      }
    })
  }
}

// Export singleton instance
export const mobilePerformanceMonitor = new MobilePerformanceMonitor()