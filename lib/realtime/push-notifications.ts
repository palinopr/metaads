import { EventEmitter } from 'events'

export interface PushNotification {
  id: string
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  data?: Record<string, any>
  actions?: NotificationAction[]
  timestamp: Date
  priority: 'low' | 'normal' | 'high' | 'urgent'
  category: 'campaign' | 'budget' | 'performance' | 'system' | 'collaboration'
  requireInteraction?: boolean
  silent?: boolean
  vibrate?: number[]
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface NotificationSubscription {
  userId: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  campaigns?: string[]
  categories?: string[]
  enabled: boolean
  preferences: NotificationPreferences
}

export interface NotificationPreferences {
  enableBrowser: boolean
  enableEmail: boolean
  enableSMS: boolean
  enableWebhook: boolean
  quietHours?: {
    start: string // HH:mm format
    end: string // HH:mm format
    timezone: string
  }
  categories: {
    campaign: boolean
    budget: boolean
    performance: boolean
    system: boolean
    collaboration: boolean
  }
  priorities: {
    low: boolean
    normal: boolean
    high: boolean
    urgent: boolean
  }
  frequency: 'immediate' | 'hourly' | 'daily'
  webhookUrl?: string
}

class NotificationQueue {
  private queue: PushNotification[] = []
  private processing = false
  private batchSize = 10
  private batchInterval = 1000 // 1 second

  constructor(private processor: (notifications: PushNotification[]) => Promise<void>) {}

  add(notification: PushNotification) {
    this.queue.push(notification)
    if (!this.processing) {
      this.process()
    }
  }

  private async process() {
    this.processing = true

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize)
      try {
        await this.processor(batch)
      } catch (error) {
        console.error('Failed to process notification batch:', error)
        // Re-queue failed notifications
        this.queue.unshift(...batch)
        break
      }
      
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.batchInterval))
      }
    }

    this.processing = false
  }

  size(): number {
    return this.queue.length
  }

  clear() {
    this.queue = []
  }
}

export class PushNotificationService extends EventEmitter {
  private subscriptions: Map<string, NotificationSubscription> = new Map()
  private notificationHistory: Map<string, PushNotification[]> = new Map()
  private queue: NotificationQueue
  private rateLimits: Map<string, number> = new Map()

  constructor() {
    super()
    this.queue = new NotificationQueue(this.processBatch.bind(this))
    this.initializeServiceWorker()
  }

  private async initializeServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        console.log('Service Worker ready for push notifications')
        this.emit('service-worker-ready', registration)
      } catch (error) {
        console.error('Service Worker initialization failed:', error)
      }
    }
  }

  public async subscribe(userId: string, subscription: Partial<NotificationSubscription>): Promise<void> {
    const fullSubscription: NotificationSubscription = {
      userId,
      endpoint: subscription.endpoint || '',
      keys: subscription.keys || { p256dh: '', auth: '' },
      campaigns: subscription.campaigns || [],
      categories: subscription.categories || ['campaign', 'budget', 'performance'],
      enabled: subscription.enabled !== false,
      preferences: {
        enableBrowser: true,
        enableEmail: false,
        enableSMS: false,
        enableWebhook: false,
        categories: {
          campaign: true,
          budget: true,
          performance: true,
          system: false,
          collaboration: true
        },
        priorities: {
          low: false,
          normal: true,
          high: true,
          urgent: true
        },
        frequency: 'immediate',
        ...subscription.preferences
      }
    }

    this.subscriptions.set(userId, fullSubscription)
    this.emit('user-subscribed', { userId, subscription: fullSubscription })
  }

  public unsubscribe(userId: string): void {
    this.subscriptions.delete(userId)
    this.notificationHistory.delete(userId)
    this.emit('user-unsubscribed', { userId })
  }

  public updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): void {
    const subscription = this.subscriptions.get(userId)
    if (subscription) {
      subscription.preferences = { ...subscription.preferences, ...preferences }
      this.subscriptions.set(userId, subscription)
      this.emit('preferences-updated', { userId, preferences })
    }
  }

  public async sendNotification(notification: Omit<PushNotification, 'id' | 'timestamp'>): Promise<void> {
    const fullNotification: PushNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    // Filter recipients based on preferences
    const recipients = this.getEligibleRecipients(fullNotification)
    
    if (recipients.length === 0) {
      console.log('No eligible recipients for notification:', notification.title)
      return
    }

    // Apply rate limiting
    const rateLimitKey = `${notification.category}:${notification.priority}`
    if (this.isRateLimited(rateLimitKey)) {
      console.log('Notification rate limited:', rateLimitKey)
      return
    }

    // Queue for processing
    this.queue.add(fullNotification)
    
    // Store in history
    recipients.forEach(userId => {
      if (!this.notificationHistory.has(userId)) {
        this.notificationHistory.set(userId, [])
      }
      const history = this.notificationHistory.get(userId)!
      history.push(fullNotification)
      
      // Keep only last 100 notifications per user
      if (history.length > 100) {
        history.shift()
      }
    })

    this.emit('notification-queued', { notification: fullNotification, recipients })
  }

  private getEligibleRecipients(notification: PushNotification): string[] {
    const recipients: string[] = []

    this.subscriptions.forEach((subscription, userId) => {
      if (!subscription.enabled) return

      // Check category preferences
      if (!subscription.preferences.categories[notification.category]) return

      // Check priority preferences
      if (!subscription.preferences.priorities[notification.priority]) return

      // Check quiet hours
      if (this.isInQuietHours(subscription.preferences.quietHours)) return

      // Check campaign filter
      if (notification.data?.campaignId && subscription.campaigns && subscription.campaigns.length > 0) {
        if (!subscription.campaigns.includes(notification.data.campaignId)) return
      }

      recipients.push(userId)
    })

    return recipients
  }

  private isInQuietHours(quietHours?: NotificationPreferences['quietHours']): boolean {
    if (!quietHours) return false

    const now = new Date()
    const userTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: quietHours.timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    }).format(now)

    const currentTime = userTime.replace(':', '')
    const startTime = quietHours.start.replace(':', '')
    const endTime = quietHours.end.replace(':', '')

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime
    }
  }

  private isRateLimited(key: string): boolean {
    const now = Date.now()
    const lastSent = this.rateLimits.get(key) || 0
    
    // Rate limit: max 1 notification per category/priority per minute
    const minInterval = 60000 // 1 minute
    
    if (now - lastSent < minInterval) {
      return true
    }

    this.rateLimits.set(key, now)
    return false
  }

  private async processBatch(notifications: PushNotification[]): Promise<void> {
    const promises = notifications.map(notification => this.processNotification(notification))
    await Promise.allSettled(promises)
  }

  private async processNotification(notification: PushNotification): Promise<void> {
    const recipients = this.getEligibleRecipients(notification)

    await Promise.allSettled([
      this.sendBrowserNotifications(notification, recipients),
      this.sendEmailNotifications(notification, recipients),
      this.sendSMSNotifications(notification, recipients),
      this.sendWebhookNotifications(notification, recipients)
    ])

    this.emit('notification-sent', { notification, recipients })
  }

  private async sendBrowserNotifications(notification: PushNotification, recipients: string[]): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    const eligibleRecipients = recipients.filter(userId => {
      const subscription = this.subscriptions.get(userId)
      return subscription?.preferences.enableBrowser && subscription.endpoint
    })

    if (eligibleRecipients.length === 0) return

    // Check permission
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return
    }

    // Send browser notifications
    eligibleRecipients.forEach(userId => {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/icons/icon-192x192.svg',
          badge: notification.badge || '/icons/icon-72x72.svg',
          image: notification.image,
          tag: notification.tag || notification.id,
          data: notification.data,
          requireInteraction: notification.requireInteraction,
          silent: notification.silent,
          vibrate: notification.vibrate
        })

        browserNotification.onclick = () => {
          this.emit('notification-clicked', { notification, userId })
          browserNotification.close()
        }

        browserNotification.onclose = () => {
          this.emit('notification-closed', { notification, userId })
        }
      } catch (error) {
        console.error('Failed to send browser notification:', error)
      }
    })
  }

  private async sendEmailNotifications(notification: PushNotification, recipients: string[]): Promise<void> {
    const eligibleRecipients = recipients.filter(userId => {
      const subscription = this.subscriptions.get(userId)
      return subscription?.preferences.enableEmail
    })

    if (eligibleRecipients.length === 0) return

    // Email notifications would be handled by a separate email service
    this.emit('email-notifications-requested', {
      notification,
      recipients: eligibleRecipients
    })
  }

  private async sendSMSNotifications(notification: PushNotification, recipients: string[]): Promise<void> {
    const eligibleRecipients = recipients.filter(userId => {
      const subscription = this.subscriptions.get(userId)
      return subscription?.preferences.enableSMS && notification.priority === 'urgent'
    })

    if (eligibleRecipients.length === 0) return

    // SMS notifications would be handled by a separate SMS service
    this.emit('sms-notifications-requested', {
      notification,
      recipients: eligibleRecipients
    })
  }

  private async sendWebhookNotifications(notification: PushNotification, recipients: string[]): Promise<void> {
    const eligibleRecipients = recipients.filter(userId => {
      const subscription = this.subscriptions.get(userId)
      return subscription?.preferences.enableWebhook && subscription.preferences.webhookUrl
    })

    if (eligibleRecipients.length === 0) return

    const webhookPromises = eligibleRecipients.map(async userId => {
      const subscription = this.subscriptions.get(userId)!
      const webhookUrl = subscription.preferences.webhookUrl!

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            notification,
            userId,
            timestamp: new Date().toISOString()
          })
        })

        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.status}`)
        }

        this.emit('webhook-sent', { notification, userId, webhookUrl })
      } catch (error) {
        console.error('Webhook notification failed:', error)
        this.emit('webhook-failed', { notification, userId, webhookUrl, error })
      }
    })

    await Promise.allSettled(webhookPromises)
  }

  // Campaign-specific notification methods
  public async notifyBudgetAlert(campaignId: string, campaignName: string, budgetData: any): Promise<void> {
    await this.sendNotification({
      title: 'Budget Alert',
      body: `Campaign "${campaignName}" has consumed ${budgetData.percentage}% of its budget`,
      category: 'budget',
      priority: budgetData.percentage > 90 ? 'urgent' : 'high',
      icon: '/icons/budget-alert.svg',
      data: { campaignId, type: 'budget', ...budgetData }
    })
  }

  public async notifyPerformanceChange(campaignId: string, campaignName: string, metrics: any): Promise<void> {
    const isPositive = metrics.change > 0
    await this.sendNotification({
      title: `Performance ${isPositive ? 'Improvement' : 'Decline'}`,
      body: `Campaign "${campaignName}" ${metrics.metric} ${isPositive ? 'increased' : 'decreased'} by ${Math.abs(metrics.change)}%`,
      category: 'performance',
      priority: Math.abs(metrics.change) > 25 ? 'high' : 'normal',
      icon: isPositive ? '/icons/performance-up.svg' : '/icons/performance-down.svg',
      data: { campaignId, type: 'performance', ...metrics }
    })
  }

  public async notifyABTestSignificance(testId: string, testName: string, results: any): Promise<void> {
    await this.sendNotification({
      title: 'A/B Test Results',
      body: `Test "${testName}" has reached statistical significance with ${results.confidence}% confidence`,
      category: 'campaign',
      priority: 'high',
      icon: '/icons/ab-test.svg',
      data: { testId, type: 'ab_test', ...results }
    })
  }

  public async notifySystemAlert(title: string, message: string, priority: PushNotification['priority'] = 'normal'): Promise<void> {
    await this.sendNotification({
      title,
      body: message,
      category: 'system',
      priority,
      icon: '/icons/system-alert.svg',
      data: { type: 'system' }
    })
  }

  // Utility methods
  public getNotificationHistory(userId: string): PushNotification[] {
    return this.notificationHistory.get(userId) || []
  }

  public getSubscription(userId: string): NotificationSubscription | undefined {
    return this.subscriptions.get(userId)
  }

  public getStats(): {
    totalSubscriptions: number
    activeSubscriptions: number
    notificationsSent: number
    queueSize: number
  } {
    const activeSubscriptions = Array.from(this.subscriptions.values()).filter(s => s.enabled).length
    const totalNotifications = Array.from(this.notificationHistory.values())
      .reduce((sum, history) => sum + history.length, 0)

    return {
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions,
      notificationsSent: totalNotifications,
      queueSize: this.queue.size()
    }
  }

  public clearHistory(userId?: string): void {
    if (userId) {
      this.notificationHistory.delete(userId)
    } else {
      this.notificationHistory.clear()
    }
  }

  public shutdown(): void {
    this.queue.clear()
    this.subscriptions.clear()
    this.notificationHistory.clear()
    this.rateLimits.clear()
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService()