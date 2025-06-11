/**
 * User Behavior Analytics & Session Tracking System
 * 
 * Comprehensive analytics system that tracks:
 * - User sessions and journeys
 * - Page views and interactions
 * - Feature usage patterns
 * - Conversion funnels
 * - User segmentation
 * - A/B test participation
 * - Performance metrics per user
 */

import { metricsCollector } from './metrics-collector'
import { traceManager } from './trace-manager'

export interface UserSession {
  id: string
  userId?: string
  anonymousId: string
  
  // Session metadata
  startTime: Date
  endTime?: Date
  duration?: number
  
  // Device and environment
  userAgent: string
  platform: string
  browser: string
  browserVersion: string
  deviceType: 'desktop' | 'tablet' | 'mobile'
  screenResolution: string
  viewport: string
  
  // Location and context
  ipAddress?: string
  country?: string
  timezone: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  
  // Session activity
  pageViews: PageView[]
  events: UserEvent[]
  
  // Performance
  performanceMetrics: SessionPerformanceMetrics
  
  // Flags
  isBot: boolean
  isReturningUser: boolean
  abTestGroups: Record<string, string>
}

export interface PageView {
  id: string
  sessionId: string
  url: string
  path: string
  title: string
  timestamp: Date
  
  // Performance
  loadTime: number
  renderTime: number
  
  // Engagement
  timeOnPage?: number
  scrollDepth: number
  exitPage: boolean
  
  // Context
  referrer?: string
  searchQuery?: string
}

export interface UserEvent {
  id: string
  sessionId: string
  userId?: string
  
  // Event details
  type: 'click' | 'form_submit' | 'error' | 'custom'
  action: string
  category: string
  label?: string
  value?: number
  
  // Context
  timestamp: Date
  url: string
  element?: string
  elementText?: string
  
  // Custom properties
  properties: Record<string, any>
}

export interface SessionPerformanceMetrics {
  // Core Web Vitals
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
  
  // Loading metrics
  domContentLoaded: number
  windowLoaded: number
  
  // Network
  connectionType?: string
  effectiveType?: string
  
  // JavaScript errors
  jsErrors: number
  networkErrors: number
}

export interface UserSegment {
  id: string
  name: string
  description: string
  criteria: {
    type: 'property' | 'event' | 'cohort' | 'behavior'
    conditions: Array<{
      property: string
      operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
      value: any
    }>
  }
  users: Set<string>
}

export interface ConversionFunnel {
  id: string
  name: string
  steps: Array<{
    name: string
    event: string
    conditions?: Record<string, any>
  }>
  conversions: Map<string, number> // step index -> count
  dropoffRates: number[]
}

export class AnalyticsTracker {
  private currentSession: UserSession | null = null
  private sessions: Map<string, UserSession> = new Map()
  private userSegments: Map<string, UserSegment> = new Map()
  private conversionFunnels: Map<string, ConversionFunnel> = new Map()
  
  private flushInterval: NodeJS.Timeout | null = null
  private sessionTimeout = 30 * 60 * 1000 // 30 minutes
  private enabled = true
  
  private pageStartTime = Date.now()
  private pageScrollDepth = 0
  private isVisible = true

  constructor(options: {
    sessionTimeout?: number
    enabled?: boolean
    flushIntervalMs?: number
  } = {}) {
    this.sessionTimeout = options.sessionTimeout ?? 30 * 60 * 1000
    this.enabled = options.enabled ?? true
    
    if (typeof window !== 'undefined') {
      this.initializeClient()
      this.setupEventListeners()
      this.startSession()
    }
    
    if (options.flushIntervalMs) {
      this.startFlushInterval(options.flushIntervalMs)
    }
  }

  // Session Management
  private startSession(): void {
    if (!this.enabled) return
    
    const sessionId = this.generateSessionId()
    const anonymousId = this.getOrCreateAnonymousId()
    
    this.currentSession = {
      id: sessionId,
      anonymousId,
      startTime: new Date(),
      userAgent: navigator.userAgent,
      platform: this.detectPlatform(),
      browser: this.detectBrowser(),
      browserVersion: this.detectBrowserVersion(),
      deviceType: this.detectDeviceType(),
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      referrer: document.referrer,
      pageViews: [],
      events: [],
      performanceMetrics: this.getInitialPerformanceMetrics(),
      isBot: this.detectBot(),
      isReturningUser: this.isReturningUser(),
      abTestGroups: this.getABTestGroups()
    }
    
    // Extract UTM parameters
    const urlParams = new URLSearchParams(window.location.search)
    this.currentSession.utmSource = urlParams.get('utm_source') || undefined
    this.currentSession.utmMedium = urlParams.get('utm_medium') || undefined
    this.currentSession.utmCampaign = urlParams.get('utm_campaign') || undefined
    
    this.sessions.set(sessionId, this.currentSession)
    
    // Track session start
    this.trackEvent({
      type: 'custom',
      action: 'session_start',
      category: 'session',
      properties: {
        sessionId,
        isReturningUser: this.currentSession.isReturningUser,
        deviceType: this.currentSession.deviceType,
        referrer: this.currentSession.referrer
      }
    })
    
    console.log('Analytics session started:', sessionId)
  }

  private endSession(): void {
    if (!this.currentSession) return
    
    this.currentSession.endTime = new Date()
    this.currentSession.duration = this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()
    
    // Track session end
    this.trackEvent({
      type: 'custom',
      action: 'session_end',
      category: 'session',
      properties: {
        duration: this.currentSession.duration,
        pageViews: this.currentSession.pageViews.length,
        events: this.currentSession.events.length
      }
    })
    
    this.flushSession()
    this.currentSession = null
  }

  // Event Tracking
  trackPageView(url?: string, title?: string): void {
    if (!this.enabled || !this.currentSession) return
    
    const pageView: PageView = {
      id: this.generateId(),
      sessionId: this.currentSession.id,
      url: url || window.location.href,
      path: window.location.pathname,
      title: title || document.title,
      timestamp: new Date(),
      loadTime: Date.now() - this.pageStartTime,
      renderTime: this.getRenderTime(),
      scrollDepth: 0,
      exitPage: false
    }
    
    this.currentSession.pageViews.push(pageView)
    
    // Update performance metrics
    this.updatePerformanceMetrics()
    
    // Track as metric
    metricsCollector.increment('analytics.page_view', 1, {
      path: pageView.path,
      sessionId: this.currentSession.id
    })
    
    // Reset page tracking
    this.pageStartTime = Date.now()
    this.pageScrollDepth = 0
    
    console.log('Page view tracked:', pageView.path)
  }

  trackEvent(event: Omit<UserEvent, 'id' | 'sessionId' | 'timestamp' | 'url'>): void {
    if (!this.enabled || !this.currentSession) return
    
    const userEvent: UserEvent = {
      id: this.generateId(),
      sessionId: this.currentSession.id,
      userId: this.currentSession.userId,
      timestamp: new Date(),
      url: window.location.href,
      ...event
    }
    
    this.currentSession.events.push(userEvent)
    
    // Track as metric
    metricsCollector.increment('analytics.event', 1, {
      type: event.type,
      action: event.action,
      category: event.category
    })
    
    // Check conversion funnels
    this.checkConversionFunnels(userEvent)
    
    console.log('Event tracked:', event.action)
  }

  trackClick(element: HTMLElement, properties: Record<string, any> = {}): void {
    this.trackEvent({
      type: 'click',
      action: 'click',
      category: 'interaction',
      element: this.getElementSelector(element),
      elementText: element.textContent?.substring(0, 100),
      properties: {
        ...properties,
        elementTag: element.tagName.toLowerCase(),
        elementId: element.id,
        elementClass: element.className
      }
    })
  }

  trackFormSubmit(form: HTMLFormElement, properties: Record<string, any> = {}): void {
    const formData = new FormData(form)
    const fields = Array.from(formData.keys())
    
    this.trackEvent({
      type: 'form_submit',
      action: 'form_submit',
      category: 'conversion',
      element: this.getElementSelector(form),
      properties: {
        ...properties,
        formId: form.id,
        formAction: form.action,
        formMethod: form.method,
        fieldCount: fields.length,
        fields: fields.join(',')
      }
    })
  }

  trackError(error: Error, context: Record<string, any> = {}): void {
    if (!this.currentSession) return
    
    this.currentSession.performanceMetrics.jsErrors++
    
    this.trackEvent({
      type: 'error',
      action: 'javascript_error',
      category: 'error',
      label: error.message,
      properties: {
        ...context,
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorStack: error.stack?.substring(0, 500)
      }
    })
  }

  // User Identification
  identify(userId: string, traits: Record<string, any> = {}): void {
    if (!this.currentSession) return
    
    this.currentSession.userId = userId
    
    this.trackEvent({
      type: 'custom',
      action: 'user_identified',
      category: 'user',
      properties: {
        userId,
        ...traits
      }
    })
    
    // Update user segments
    this.updateUserSegments(userId, traits)
  }

  // A/B Testing
  getABTestGroup(testName: string): string | null {
    if (!this.currentSession) return null
    return this.currentSession.abTestGroups[testName] || null
  }

  setABTestGroup(testName: string, group: string): void {
    if (!this.currentSession) return
    
    this.currentSession.abTestGroups[testName] = group
    
    this.trackEvent({
      type: 'custom',
      action: 'ab_test_assigned',
      category: 'experiment',
      properties: {
        testName,
        group
      }
    })
  }

  // Conversion Funnels
  createFunnel(funnel: Omit<ConversionFunnel, 'conversions' | 'dropoffRates'>): void {
    const newFunnel: ConversionFunnel = {
      ...funnel,
      conversions: new Map(),
      dropoffRates: new Array(funnel.steps.length).fill(0)
    }
    
    this.conversionFunnels.set(funnel.id, newFunnel)
  }

  private checkConversionFunnels(event: UserEvent): void {
    for (const funnel of this.conversionFunnels.values()) {
      const stepIndex = funnel.steps.findIndex(step => {
        if (step.event !== event.action) return false
        
        // Check conditions if specified
        if (step.conditions) {
          for (const [key, value] of Object.entries(step.conditions)) {
            if (event.properties[key] !== value) return false
          }
        }
        
        return true
      })
      
      if (stepIndex >= 0) {
        const currentCount = funnel.conversions.get(stepIndex.toString()) || 0
        funnel.conversions.set(stepIndex.toString(), currentCount + 1)
      }
    }
  }

  // User Segmentation
  createSegment(segment: Omit<UserSegment, 'users'>): void {
    const newSegment: UserSegment = {
      ...segment,
      users: new Set()
    }
    
    this.userSegments.set(segment.id, newSegment)
  }

  private updateUserSegments(userId: string, traits: Record<string, any>): void {
    for (const segment of this.userSegments.values()) {
      const matches = this.checkSegmentCriteria(segment, userId, traits)
      if (matches) {
        segment.users.add(userId)
      } else {
        segment.users.delete(userId)
      }
    }
  }

  private checkSegmentCriteria(segment: UserSegment, userId: string, traits: Record<string, any>): boolean {
    // Simplified segment matching logic
    return segment.criteria.conditions.every(condition => {
      const value = traits[condition.property]
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value
        case 'contains':
          return String(value).includes(String(condition.value))
        case 'greater_than':
          return Number(value) > Number(condition.value)
        case 'less_than':
          return Number(value) < Number(condition.value)
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(value)
        case 'not_in':
          return Array.isArray(condition.value) && !condition.value.includes(value)
        default:
          return false
      }
    })
  }

  // Client-side initialization
  private initializeClient(): void {
    // Set up performance observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry)
        }
      })
      
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input'] })
    }
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden
      if (this.isVisible) {
        this.pageStartTime = Date.now()
      }
    })
  }

  private setupEventListeners(): void {
    // Auto-track page views on navigation
    window.addEventListener('popstate', () => {
      this.trackPageView()
    })
    
    // Track scroll depth
    window.addEventListener('scroll', this.throttle(() => {
      const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
      this.pageScrollDepth = Math.max(this.pageScrollDepth, scrollDepth)
    }, 100))
    
    // Auto-track clicks on interactive elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (this.isTrackableElement(target)) {
        this.trackClick(target)
      }
    })
    
    // Auto-track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement
      this.trackFormSubmit(form)
    })
    
    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.updateCurrentPageView()
      this.endSession()
    })
    
    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })
    
    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(String(event.reason)), {
        type: 'unhandled_promise_rejection'
      })
    })
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private generateSessionId(): string {
    return 'session_' + this.generateId()
  }

  private getOrCreateAnonymousId(): string {
    const key = 'meta_ads_anonymous_id'
    let id = localStorage.getItem(key)
    
    if (!id) {
      id = 'anon_' + this.generateId()
      localStorage.setItem(key, id)
    }
    
    return id
  }

  private detectPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('win')) return 'Windows'
    if (userAgent.includes('mac')) return 'macOS'
    if (userAgent.includes('linux')) return 'Linux'
    if (userAgent.includes('android')) return 'Android'
    if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) return 'iOS'
    return 'Unknown'
  }

  private detectBrowser(): string {
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('chrome')) return 'Chrome'
    if (userAgent.includes('firefox')) return 'Firefox'
    if (userAgent.includes('safari')) return 'Safari'
    if (userAgent.includes('edge')) return 'Edge'
    if (userAgent.includes('opera')) return 'Opera'
    return 'Unknown'
  }

  private detectBrowserVersion(): string {
    // Simplified version detection
    return 'Unknown'
  }

  private detectDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    if (window.innerWidth < 768) return 'mobile'
    if (window.innerWidth < 1024) return 'tablet'
    return 'desktop'
  }

  private detectBot(): boolean {
    const userAgent = navigator.userAgent.toLowerCase()
    const botKeywords = ['bot', 'crawler', 'spider', 'scraper']
    return botKeywords.some(keyword => userAgent.includes(keyword))
  }

  private isReturningUser(): boolean {
    return localStorage.getItem('meta_ads_returning_user') === 'true'
  }

  private getABTestGroups(): Record<string, string> {
    const stored = localStorage.getItem('meta_ads_ab_tests')
    return stored ? JSON.parse(stored) : {}
  }

  private getInitialPerformanceMetrics(): SessionPerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    return {
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
      windowLoaded: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      jsErrors: 0,
      networkErrors: 0
    }
  }

  private updatePerformanceMetrics(): void {
    if (!this.currentSession) return
    
    // Update with latest Core Web Vitals
    const metrics = this.currentSession.performanceMetrics
    
    // FCP (First Contentful Paint)
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0]
    if (fcpEntry) metrics.fcp = fcpEntry.startTime
    
    // Connection info
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      metrics.connectionType = connection.type
      metrics.effectiveType = connection.effectiveType
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    if (!this.currentSession) return
    
    const metrics = this.currentSession.performanceMetrics
    
    switch (entry.entryType) {
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          metrics.fcp = entry.startTime
        }
        break
      
      case 'largest-contentful-paint':
        metrics.lcp = entry.startTime
        break
      
      case 'first-input':
        metrics.fid = (entry as any).processingStart - entry.startTime
        break
    }
  }

  private getRenderTime(): number {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return navigation ? navigation.domContentLoadedEventEnd - navigation.navigationStart : 0
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`
    if (element.className) return `.${element.className.split(' ')[0]}`
    return element.tagName.toLowerCase()
  }

  private isTrackableElement(element: HTMLElement): boolean {
    const trackableTags = ['a', 'button', 'input', 'select', 'textarea']
    const trackableTypes = ['button', 'submit', 'checkbox', 'radio']
    
    return trackableTags.includes(element.tagName.toLowerCase()) ||
           (element.tagName.toLowerCase() === 'input' && trackableTypes.includes((element as HTMLInputElement).type)) ||
           element.getAttribute('data-track') === 'true'
  }

  private updateCurrentPageView(): void {
    if (!this.currentSession || this.currentSession.pageViews.length === 0) return
    
    const currentPageView = this.currentSession.pageViews[this.currentSession.pageViews.length - 1]
    currentPageView.timeOnPage = Date.now() - this.pageStartTime
    currentPageView.scrollDepth = this.pageScrollDepth
    currentPageView.exitPage = true
  }

  private throttle(func: Function, wait: number): Function {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  private startFlushInterval(intervalMs: number): void {
    this.flushInterval = setInterval(() => {
      this.flushSession()
    }, intervalMs)
  }

  private async flushSession(): Promise<void> {
    if (!this.currentSession) return
    
    try {
      await fetch('/api/monitoring/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: this.currentSession,
          timestamp: new Date()
        })
      })
    } catch (error) {
      console.error('Failed to flush analytics session:', error)
    }
  }

  // Public API
  getCurrentSession(): UserSession | null {
    return this.currentSession
  }

  getSegments(): UserSegment[] {
    return Array.from(this.userSegments.values())
  }

  getFunnels(): ConversionFunnel[] {
    return Array.from(this.conversionFunnels.values())
  }

  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
  }

  destroy(): void {
    this.endSession()
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
  }
}

// Global analytics instance
export const analyticsTracker = new AnalyticsTracker({
  flushIntervalMs: 30000 // Flush every 30 seconds
})

// React hook for analytics
import { useEffect, useCallback } from 'react'

export function useAnalytics(componentName: string) {
  useEffect(() => {
    analyticsTracker.trackEvent({
      type: 'custom',
      action: 'component_view',
      category: 'engagement',
      label: componentName
    })
  }, [componentName])

  const trackInteraction = useCallback((action: string, properties?: Record<string, any>) => {
    analyticsTracker.trackEvent({
      type: 'custom',
      action,
      category: 'interaction',
      label: componentName,
      properties: {
        component: componentName,
        ...properties
      }
    })
  }, [componentName])

  const trackConversion = useCallback((action: string, value?: number, properties?: Record<string, any>) => {
    analyticsTracker.trackEvent({
      type: 'custom',
      action,
      category: 'conversion',
      label: componentName,
      value,
      properties: {
        component: componentName,
        ...properties
      }
    })
  }, [componentName])

  return { trackInteraction, trackConversion }
}