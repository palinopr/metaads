'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  pushNotificationManager, 
  NotificationPayload, 
  NotificationPreferences 
} from '@/lib/push-notifications'

interface UsePushNotificationsReturn {
  // State
  isSupported: boolean
  isInitialized: boolean
  isSubscribed: boolean
  permission: NotificationPermission
  isLoading: boolean
  error: string | null
  preferences: NotificationPreferences | null

  // Actions
  initialize: () => Promise<boolean>
  requestPermission: () => Promise<boolean>
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  showNotification: (payload: NotificationPayload) => Promise<void>
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void
  
  // Campaign notifications
  notifyCampaignUpdate: (campaignName: string, status: string, details?: string) => Promise<void>
  notifyPerformanceAlert: (metric: string, value: number, threshold: number, campaignName?: string) => Promise<void>
  notifyAutomation: (ruleName: string, action: string, result: string) => Promise<void>
  
  // Utility
  clearNotifications: (tag?: string) => Promise<void>
  testNotification: () => Promise<void>
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)

  // Check support on mount
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
      setIsSupported(supported)
      
      if (supported) {
        setPermission(Notification.permission)
        setPreferences(pushNotificationManager.getPreferences())
      }
    }

    checkSupport()
  }, [])

  // Initialize push notifications
  const initialize = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported on this device')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const success = await pushNotificationManager.initialize()
      setIsInitialized(success)
      setIsSubscribed(pushNotificationManager.isSubscribed())
      
      if (!success) {
        setError('Failed to initialize push notifications')
      }
      
      return success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !isInitialized) {
      setError('Push notifications not initialized')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const granted = await pushNotificationManager.requestPermission()
      setPermission(Notification.permission)
      setIsSubscribed(pushNotificationManager.isSubscribed())
      
      if (!granted) {
        setError('Notification permission denied')
      }
      
      return granted
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Permission request failed'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, isInitialized])

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (permission !== 'granted') {
      const granted = await requestPermission()
      if (!granted) return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const subscription = await pushNotificationManager.subscribe()
      const success = subscription !== null
      setIsSubscribed(success)
      
      if (!success) {
        setError('Failed to subscribe to push notifications')
      }
      
      return success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Subscription failed'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [permission, requestPermission])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const success = await pushNotificationManager.unsubscribe()
      setIsSubscribed(!success)
      
      if (!success) {
        setError('Failed to unsubscribe from push notifications')
      }
      
      return success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unsubscription failed'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Show notification
  const showNotification = useCallback(async (payload: NotificationPayload): Promise<void> => {
    if (permission !== 'granted') {
      setError('Notification permission not granted')
      return
    }

    try {
      await pushNotificationManager.showNotification(payload)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to show notification'
      setError(errorMessage)
    }
  }, [permission])

  // Update preferences
  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>): void => {
    try {
      pushNotificationManager.updatePreferences(newPreferences)
      setPreferences(pushNotificationManager.getPreferences())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences'
      setError(errorMessage)
    }
  }, [])

  // Campaign update notification
  const notifyCampaignUpdate = useCallback(async (
    campaignName: string, 
    status: string, 
    details?: string
  ): Promise<void> => {
    try {
      await pushNotificationManager.notifyCampaignStatusChange(campaignName, status, details)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send campaign notification'
      setError(errorMessage)
    }
  }, [])

  // Performance alert notification
  const notifyPerformanceAlert = useCallback(async (
    metric: string,
    value: number,
    threshold: number,
    campaignName?: string
  ): Promise<void> => {
    try {
      await pushNotificationManager.notifyPerformanceAlert(metric, value, threshold, campaignName)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send performance alert'
      setError(errorMessage)
    }
  }, [])

  // Automation notification
  const notifyAutomation = useCallback(async (
    ruleName: string,
    action: string,
    result: string
  ): Promise<void> => {
    try {
      await pushNotificationManager.notifyAutomationTriggered(ruleName, action, result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send automation notification'
      setError(errorMessage)
    }
  }, [])

  // Clear notifications
  const clearNotifications = useCallback(async (tag?: string): Promise<void> => {
    try {
      await pushNotificationManager.clearNotifications(tag)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear notifications'
      setError(errorMessage)
    }
  }, [])

  // Test notification
  const testNotification = useCallback(async (): Promise<void> => {
    const testPayload: NotificationPayload = {
      title: 'Meta Ads Dashboard',
      body: 'Push notifications are working correctly!',
      icon: '/icons/icon-192x192.svg',
      category: 'system',
      priority: 'normal',
      tag: 'test-notification',
      data: {
        test: true,
        timestamp: Date.now()
      },
      actions: [
        { action: 'dismiss', title: 'Got it!' }
      ]
    }

    await showNotification(testPayload)
  }, [showNotification])

  return {
    // State
    isSupported,
    isInitialized,
    isSubscribed,
    permission,
    isLoading,
    error,
    preferences,

    // Actions
    initialize,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    updatePreferences,

    // Campaign notifications
    notifyCampaignUpdate,
    notifyPerformanceAlert,
    notifyAutomation,

    // Utility
    clearNotifications,
    testNotification
  }
}

// Hook for simplified notification preferences management
export function useNotificationPreferences() {
  const { preferences, updatePreferences } = usePushNotifications()

  const toggleCategory = useCallback((category: keyof NotificationPreferences['categories']) => {
    if (preferences) {
      updatePreferences({
        categories: {
          ...preferences.categories,
          [category]: !preferences.categories[category]
        }
      })
    }
  }, [preferences, updatePreferences])

  const toggleQuietHours = useCallback(() => {
    if (preferences) {
      updatePreferences({
        quietHours: {
          ...preferences.quietHours,
          enabled: !preferences.quietHours.enabled
        }
      })
    }
  }, [preferences, updatePreferences])

  const setQuietHours = useCallback((start: string, end: string) => {
    if (preferences) {
      updatePreferences({
        quietHours: {
          ...preferences.quietHours,
          start,
          end
        }
      })
    }
  }, [preferences, updatePreferences])

  const setFrequency = useCallback((
    category: keyof NotificationPreferences['frequency'],
    frequency: NotificationPreferences['frequency'][keyof NotificationPreferences['frequency']]
  ) => {
    if (preferences) {
      updatePreferences({
        frequency: {
          ...preferences.frequency,
          [category]: frequency
        }
      })
    }
  }, [preferences, updatePreferences])

  return {
    preferences,
    toggleCategory,
    toggleQuietHours,
    setQuietHours,
    setFrequency,
    updatePreferences
  }
}