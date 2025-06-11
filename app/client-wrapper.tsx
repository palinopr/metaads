'use client'

import { Component, ReactNode, useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'

// Client-side error handler
function ClientErrorHandler() {
  useEffect(() => {
    // Catch unhandled errors
    const handleError = (event: ErrorEvent) => {
      console.error('Unhandled error:', event.error)
      
      // Log to server for debugging
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'client_error',
          error: event.error?.toString() || event.message,
          stack: event.error?.stack,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {})
      
      event.preventDefault()
    }

    // Catch unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      // Log to server for debugging
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'promise_rejection',
          error: event.reason?.toString() || 'Unknown error',
          stack: event.reason?.stack,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {})
      
      event.preventDefault()
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return null
}

export function ClientWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <ClientErrorHandler />
      {children}
      <Toaster position="top-right" />
    </>
  )
}