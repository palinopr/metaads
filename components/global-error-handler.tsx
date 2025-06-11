"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { errorTracker } from '@/lib/error-handling/error-tracker'
import { ApplicationError, ErrorCategory, ErrorSeverity, NetworkError } from '@/lib/error-handling/error-types'
import { ErrorRecovery, RecoveryStrategies } from '@/lib/error-handling/error-recovery'\nimport { notificationSystem } from '@/lib/error-handling/notification-system'\nimport { debugUtils } from '@/lib/error-handling/debug-utils'
import { useToast } from '@/components/ui/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react'

interface ErrorNotification {
  id: string
  message: string
  severity: ErrorSeverity
  timestamp: Date
}

export function GlobalErrorHandler() {
  const router = useRouter()
  const { toast } = useToast()
  const [isOffline, setIsOffline] = useState(false)
  const [errorNotifications, setErrorNotifications] = useState<ErrorNotification[]>([])
  const [debugMode, setDebugMode] = useState(false)

  useEffect(() => {
    // Check debug mode from localStorage
    setDebugMode(localStorage.getItem('debug_mode') === 'true')

    // Initialize error tracking listeners
    errorTracker.addListener((error) => {
      // Handle critical errors with notifications
      if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
        const notification: ErrorNotification = {
          id: error.id,
          message: error.message,
          severity: error.severity,
          timestamp: new Date()
        }
        
        setErrorNotifications(prev => [...prev, notification])
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
          setErrorNotifications(prev => prev.filter(n => n.id !== error.id))
        }, 10000)
      }

      // Show toast for user-facing errors
      if (error.category === ErrorCategory.VALIDATION || 
          error.category === ErrorCategory.PERMISSION) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        })
      }
    })

    // Handle unhandled promise rejections
    const handleUnhandledRejection = async (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      
      // Track the error
      errorTracker.track(error, {
        action: 'unhandled_rejection',
        metadata: { promise: true }
      })

      // Prevent default behavior (crashing)
      event.preventDefault()
    }

    // Handle global errors
    const handleError = async (event: ErrorEvent) => {
      console.error('Global error:', event.error)
      
      const error = event.error || new Error(event.message)
      
      // Track the error
      errorTracker.track(error, {
        action: 'global_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      })

      // Prevent default behavior
      event.preventDefault()
      
      // Handle specific error types with recovery
      if (event.message?.includes('Loading chunk')) {
        console.log('Chunk loading error detected, attempting recovery...')
        
        try {
          await ErrorRecovery.withRetry(
            async () => {
              // Try to reload the failed chunk
              const response = await fetch(window.location.href)
              if (!response.ok) throw new Error('Failed to reload')
            },
            {
              maxRetries: 3,
              initialDelay: 1000,
              onFailure: () => {
                // If retry fails, reload the page
                window.location.reload()
              }
            }
          )
        } catch (error) {
          console.error('Chunk recovery failed:', error)
        }
      }
    }

    // Handle network status
    const handleOnline = () => {
      setIsOffline(false)
      toast({
        title: "Connection Restored",
        description: "You're back online. Syncing data...",
      })
    }

    const handleOffline = () => {
      setIsOffline(true)
      toast({
        title: "Connection Lost",
        description: "You're offline. Changes will be saved locally.",
        variant: "destructive"
      })
    }

    // Handle beforeunload to save state
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Save application state
      const state = {
        timestamp: new Date().toISOString(),
        pathname: window.location.pathname,
        scrollPosition: window.scrollY,
        formData: collectFormData(),
        sessionId: errorTracker['sessionId']
      }
      
      try {
        localStorage.setItem('app_state_backup', JSON.stringify(state))
      } catch (error) {
        console.error('Failed to save state:', error)
      }
    }

    // Handle visibility change for performance monitoring
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, pause non-critical operations
        errorTracker['stopMetricsCollection']()
      } else {
        // Page is visible, resume operations
        errorTracker['startMetricsCollection']()
      }
    }

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Check initial online status
    setIsOffline(!navigator.onLine)

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [router, toast])

  // Helper function to collect form data
  function collectFormData(): Record<string, any> {
    const formData: Record<string, any> = {}
    
    try {
      // Collect all form inputs
      document.querySelectorAll('input, textarea, select').forEach((element) => {
        const input = element as HTMLInputElement
        if (input.name && input.value) {
          formData[input.name] = input.value
        }
      })
    } catch (error) {
      console.error('Failed to collect form data:', error)
    }
    
    return formData
  }

  // Render offline indicator and error notifications
  return (
    <>
      {/* Offline Indicator */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">You're offline - changes will be saved locally</span>
          </div>
        </div>
      )}

      {/* Error Notifications */}
      {errorNotifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
          {errorNotifications.map((notification) => (
            <Alert
              key={notification.id}
              variant={notification.severity === ErrorSeverity.CRITICAL ? "destructive" : "default"}
              className="animate-in slide-in-from-right"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {notification.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Debug Mode Indicator */}
      {debugMode && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            Debug Mode
          </div>
        </div>
      )}
    </>
  )
}