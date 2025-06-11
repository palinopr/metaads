'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Shield, CheckCircle, X } from 'lucide-react'

interface CSPViolation {
  blockedURI: string
  columnNumber: number
  disposition: string
  documentURI: string
  effectiveDirective: string
  lineNumber: number
  originalPolicy: string
  referrer: string
  sample: string
  sourceFile: string
  statusCode: number
  violatedDirective: string
  timestamp: number
}

interface ServiceWorkerError {
  message: string
  filename?: string
  lineno?: number
  colno?: number
  timestamp: number
}

export function CSPMonitor() {
  const [violations, setViolations] = useState<CSPViolation[]>([])
  const [swErrors, setSwErrors] = useState<ServiceWorkerError[]>([])
  const [swStatus, setSwStatus] = useState<{
    supported: boolean
    registered: boolean
    active: boolean
    scope?: string
  }>({
    supported: false,
    registered: false,
    active: false
  })
  const [storageStatus, setStorageStatus] = useState<{
    localStorage: boolean
    sessionStorage: boolean
    errors: string[]
  }>({
    localStorage: false,
    sessionStorage: false,
    errors: []
  })

  useEffect(() => {
    // Monitor CSP violations
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      const violation: CSPViolation = {
        blockedURI: event.blockedURI,
        columnNumber: event.columnNumber,
        disposition: event.disposition,
        documentURI: event.documentURI,
        effectiveDirective: event.effectiveDirective,
        lineNumber: event.lineNumber,
        originalPolicy: event.originalPolicy,
        referrer: event.referrer,
        sample: event.sample,
        sourceFile: event.sourceFile,
        statusCode: event.statusCode,
        violatedDirective: event.violatedDirective,
        timestamp: Date.now()
      }
      
      setViolations(prev => [violation, ...prev.slice(0, 19)]) // Keep last 20
      console.warn('CSP Violation:', violation)
    }

    // Monitor service worker errors
    const handleSWError = (event: ErrorEvent) => {
      if (event.filename?.includes('sw.js') || event.message?.includes('Service Worker')) {
        const error: ServiceWorkerError = {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: Date.now()
        }
        
        setSwErrors(prev => [error, ...prev.slice(0, 9)]) // Keep last 10
        console.error('Service Worker Error:', error)
      }
    }

    // Check service worker status
    const checkSWStatus = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          setSwStatus({
            supported: true,
            registered: !!registration,
            active: !!registration?.active,
            scope: registration?.scope
          })
        } catch (error) {
          console.error('Failed to check service worker status:', error)
        }
      }
    }

    // Check storage status
    const checkStorageStatus = () => {
      const errors: string[] = []
      let localStorage = false
      let sessionStorage = false

      try {
        const testKey = '__test__'
        window.localStorage.setItem(testKey, 'test')
        window.localStorage.removeItem(testKey)
        localStorage = true
      } catch (error) {
        errors.push(`localStorage: ${error instanceof Error ? error.message : 'Access denied'}`)
      }

      try {
        const testKey = '__test__'
        window.sessionStorage.setItem(testKey, 'test')
        window.sessionStorage.removeItem(testKey)
        sessionStorage = true
      } catch (error) {
        errors.push(`sessionStorage: ${error instanceof Error ? error.message : 'Access denied'}`)
      }

      setStorageStatus({ localStorage, sessionStorage, errors })
    }

    // Add event listeners
    document.addEventListener('securitypolicyviolation', handleCSPViolation)
    window.addEventListener('error', handleSWError)

    // Initial checks
    checkSWStatus()
    checkStorageStatus()

    // Periodic checks
    const interval = setInterval(() => {
      checkSWStatus()
      checkStorageStatus()
    }, 30000) // Every 30 seconds

    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation)
      window.removeEventListener('error', handleSWError)
      clearInterval(interval)
    }
  }, [])

  const clearViolations = () => setViolations([])
  const clearSWErrors = () => setSwErrors([])

  if (process.env.NODE_ENV === 'production') {
    return null // Hide in production
  }

  return (
    <div className="space-y-4">
      {/* Service Worker Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Service Worker Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              {swStatus.supported ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Supported</span>
            </div>
            <div className="flex items-center gap-2">
              {swStatus.registered ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Registered</span>
            </div>
            <div className="flex items-center gap-2">
              {swStatus.active ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Active</span>
            </div>
            <div className="flex items-center gap-2">
              {storageStatus.localStorage && storageStatus.sessionStorage ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-sm">Storage</span>
            </div>
          </div>
          
          {swStatus.scope && (
            <p className="text-xs text-muted-foreground mt-2">
              Scope: {swStatus.scope}
            </p>
          )}
          
          {storageStatus.errors.length > 0 && (
            <div className="mt-2">
              {storageStatus.errors.map((error, index) => (
                <Alert key={index} variant="destructive" className="mt-1">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSP Violations */}
      {violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                CSP Violations ({violations.length})
              </div>
              <Button variant="outline" size="sm" onClick={clearViolations}>
                Clear
              </Button>
            </CardTitle>
            <CardDescription>
              Content Security Policy violations detected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {violations.map((violation, index) => (
                <div key={index} className="border rounded p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="destructive" className="text-xs">
                      {violation.effectiveDirective}
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(violation.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    <div>Blocked: {violation.blockedURI || 'inline'}</div>
                    {violation.sourceFile && (
                      <div>Source: {violation.sourceFile}:{violation.lineNumber}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Worker Errors */}
      {swErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Service Worker Errors ({swErrors.length})
              </div>
              <Button variant="outline" size="sm" onClick={clearSWErrors}>
                Clear
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {swErrors.map((error, index) => (
                <div key={index} className="border rounded p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="destructive" className="text-xs">
                      SW Error
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    <div>{error.message}</div>
                    {error.filename && (
                      <div>{error.filename}:{error.lineno}:{error.colno}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}