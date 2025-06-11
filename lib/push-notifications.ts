'use client'

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  data?: any
  actions?: NotificationAction[]
  timestamp?: number
  priority?: 'low' | 'normal' | 'high' | 'critical'
  category?: 'campaign' | 'performance' | 'alert' | 'system' | 'automation'
  silent?: boolean
  requireInteraction?: boolean
  vibrate?: number[]
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface PushSubscriptionInfo {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  userId?: string
  deviceId?: string
  userAgent?: string
  createdAt: Date
  lastUsed: Date
}

export interface NotificationPreferences {
  enabled: boolean
  categories: {
    campaign: boolean
    performance: boolean
    alert: boolean
    system: boolean
    automation: boolean
  }
  quietHours: {
    enabled: boolean
    start: string // HH:MM format
    end: string   // HH:MM format
    timezone?: string
  }
  frequency: {
    campaign: 'immediate' | 'hourly' | 'daily'
    performance: 'immediate' | 'hourly' | 'daily'
    alert: 'immediate' | 'never'
  }
  sound: boolean
  vibration: boolean
  grouping: boolean
}

class PushNotificationManager {
  private vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
  private registration: ServiceWorkerRegistration | null = null
  private subscription: PushSubscription | null = null
  private preferences: NotificationPreferences | null = null

  // Default notification preferences
  private defaultPreferences: NotificationPreferences = {
    enabled: true,
    categories: {
      campaign: true,
      performance: true,
      alert: true,
      system: false,
      automation: true
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    frequency: {
      campaign: 'immediate',
      performance: 'hourly',
      alert: 'immediate'
    },
    sound: true,
    vibration: true,
    grouping: true
  }

  constructor() {
    this.loadPreferences()
  }

  // Initialize push notifications
  async initialize(): Promise<boolean> {
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service workers not supported')
        return false
      }

      // Check if push messaging is supported
      if (!('PushManager' in window)) {
        console.warn('Push messaging not supported')
        return false
      }

      // Get service worker registration
      this.registration = await navigator.serviceWorker.ready
      
      // Check current subscription
      this.subscription = await this.registration.pushManager.getSubscription()

      // Set up message listener
      this.setupMessageListener()

      return true
    } catch (error) {
      console.error('Failed to initialize push notifications:', error)
      return false
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        await this.subscribe()
        return true
      } else {
        console.warn('Notification permission denied')
        return false
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  // Check current permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscription | null> {
    try {
      if (!this.registration || !this.vapidPublicKey) {
        throw new Error('Service worker or VAPID key not available')
      }

      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      })

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription)

      return this.subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe()
        await this.removeSubscriptionFromServer()
        this.subscription = null
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  // Check if user is subscribed
  isSubscribed(): boolean {
    return this.subscription !== null
  }

  // Send local notification
  async showNotification(payload: NotificationPayload): Promise<void> {
    try {
      // Check if notifications should be shown
      if (!this.shouldShowNotification(payload)) {
        return
      }

      const options: NotificationOptions = {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.svg',
        badge: payload.badge || '/icons/icon-96x96.svg',
        image: payload.image,
        tag: payload.tag,
        data: {
          ...payload.data,
          timestamp: payload.timestamp || Date.now(),
          category: payload.category || 'system'
        },
        actions: payload.actions,
        silent: payload.silent || false,
        requireInteraction: payload.requireInteraction || payload.priority === 'critical',
        vibrate: this.getVibrationPattern(payload.priority)
      }

      if (this.registration) {
        await this.registration.showNotification(payload.title, options)
      } else {
        new Notification(payload.title, options)
      }

      // Track notification
      this.trackNotification(payload)
    } catch (error) {
      console.error('Failed to show notification:', error)
    }
  }

  // Schedule notification
  async scheduleNotification(payload: NotificationPayload, delay: number): Promise<void> {
    setTimeout(() => {
      this.showNotification(payload)
    }, delay)
  }

  // Batch notifications
  async showBatchNotification(
    notifications: NotificationPayload[],
    groupTitle: string
  ): Promise<void> {
    if (!this.preferences?.grouping || notifications.length === 1) {
      // Show individual notifications
      for (const notification of notifications) {
        await this.showNotification(notification)
      }
      return
    }

    // Create grouped notification
    const groupPayload: NotificationPayload = {
      title: groupTitle,
      body: `${notifications.length} new updates`,
      tag: 'grouped-notifications',
      data: {
        notifications,
        grouped: true
      },
      actions: [
        { action: 'view-all', title: 'View All' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    }

    await this.showNotification(groupPayload)
  }

  // Clear notifications
  async clearNotifications(tag?: string): Promise<void> {
    try {
      if (this.registration) {
        const notifications = await this.registration.getNotifications({ tag })
        notifications.forEach(notification => notification.close())
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    }
  }

  // Update preferences
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = {
      ...this.defaultPreferences,
      ...this.preferences,
      ...preferences
    }
    this.savePreferences()
  }

  // Get current preferences
  getPreferences(): NotificationPreferences {
    return this.preferences || this.defaultPreferences
  }

  // Campaign-specific notifications
  async notifyCampaignStatusChange(
    campaignName: string,
    status: string,
    details?: string
  ): Promise<void> {
    const payload: NotificationPayload = {
      title: `Campaign Update: ${campaignName}`,
      body: details || `Status changed to ${status}`,
      category: 'campaign',
      priority: 'normal',
      icon: '/icons/campaign-icon.svg',
      tag: `campaign-${campaignName}`,
      data: {
        campaignName,
        status,
        url: '/campaigns'
      },
      actions: [
        { action: 'view-campaign', title: 'View Campaign' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    }

    await this.showNotification(payload)
  }

  // Performance alert notifications
  async notifyPerformanceAlert(
    metric: string,
    value: number,
    threshold: number,
    campaignName?: string
  ): Promise<void> {
    const isPositive = value > threshold
    const payload: NotificationPayload = {
      title: `Performance ${isPositive ? 'Opportunity' : 'Alert'}`,
      body: campaignName 
        ? `${campaignName}: ${metric} is ${value}` 
        : `${metric} is ${value}`,
      category: 'performance',
      priority: isPositive ? 'normal' : 'high',
      icon: isPositive ? '/icons/trending-up.svg' : '/icons/alert-triangle.svg',
      tag: `performance-${metric}`,
      data: {
        metric,
        value,
        threshold,
        campaignName,
        url: '/analytics'
      },
      actions: [
        { action: 'view-analytics', title: 'View Analytics' },
        { action: 'optimize', title: 'Optimize' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    }

    await this.showNotification(payload)
  }

  // Automation notifications
  async notifyAutomationTriggered(
    ruleName: string,
    action: string,
    result: string
  ): Promise<void> {
    const payload: NotificationPayload = {
      title: `Automation: ${ruleName}`,
      body: `${action} - ${result}`,
      category: 'automation',
      priority: 'normal',
      icon: '/icons/automation-icon.svg',
      tag: `automation-${ruleName}`,
      data: {
        ruleName,
        action,
        result,
        url: '/automation'
      },
      actions: [
        { action: 'view-automation', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    }

    await this.showNotification(payload)
  }

  // Private methods
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const subscriptionInfo: PushSubscriptionInfo = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        },
        deviceId: this.getDeviceId(),
        userAgent: navigator.userAgent,
        createdAt: new Date(),
        lastUsed: new Date()
      }

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionInfo)
      })
    } catch (error) {
      console.error('Failed to send subscription to server:', error)
    }
  }

  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceId: this.getDeviceId()
        })
      })
    } catch (error) {
      console.error('Failed to remove subscription from server:', error)
    }
  }

  private setupMessageListener(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'NOTIFICATION_CLICKED') {
          this.handleNotificationClick(event.data)
        }
      })
    }
  }

  private handleNotificationClick(data: any): void {
    const { action, notification } = data
    
    switch (action) {
      case 'view-campaign':
        window.open('/campaigns', '_blank')
        break
      case 'view-analytics':
        window.open('/analytics', '_blank')
        break
      case 'view-automation':
        window.open('/automation', '_blank')
        break
      case 'optimize':
        window.open('/optimization', '_blank')
        break
      default:
        if (notification.data?.url) {
          window.open(notification.data.url, '_blank')
        }
    }
  }

  private shouldShowNotification(payload: NotificationPayload): boolean {
    if (!this.preferences?.enabled) return false
    
    const category = payload.category || 'system'
    if (!this.preferences.categories[category]) return false

    // Check quiet hours
    if (this.preferences.quietHours.enabled && this.isQuietHours()) {
      return payload.priority === 'critical'
    }

    return true
  }

  private isQuietHours(): boolean {
    if (!this.preferences?.quietHours.enabled) return false

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const { start, end } = this.preferences.quietHours
    
    if (start <= end) {
      return currentTime >= start && currentTime <= end
    } else {
      return currentTime >= start || currentTime <= end
    }
  }

  private getVibrationPattern(priority?: string): number[] {
    if (!this.preferences?.vibration) return []
    
    switch (priority) {
      case 'critical':
        return [200, 100, 200, 100, 200]
      case 'high':
        return [100, 50, 100]
      case 'normal':
        return [100]
      default:
        return [50]
    }
  }

  private trackNotification(payload: NotificationPayload): void {
    // Track notification for analytics
    try {
      const event = {
        type: 'notification_shown',
        category: payload.category,
        priority: payload.priority,
        timestamp: Date.now()
      }
      
      // Send to analytics service
      fetch('/api/analytics/notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }).catch(() => {}) // Silent fail
    } catch (error) {
      // Silent fail for tracking
    }
  }

  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem('notification-preferences')
      if (stored) {
        this.preferences = { ...this.defaultPreferences, ...JSON.parse(stored) }
      } else {
        this.preferences = this.defaultPreferences
      }
    } catch (error) {
      this.preferences = this.defaultPreferences
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem('notification-preferences', JSON.stringify(this.preferences))
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
    }
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('device-id')
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('device-id', deviceId)
    }
    return deviceId
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }
}

// Export singleton instance
export const pushNotificationManager = new PushNotificationManager()