"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface APIEvent {
  id: string
  timestamp: Date
  type: 'request' | 'response' | 'error'
  method: string
  url: string
  status?: number
  duration?: number
  error?: string
  details?: any
}

export function APIMonitor() {
  const [events, setEvents] = useState<APIEvent[]>([])
  const [isMinimized, setIsMinimized] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return

    setIsVisible(true)

    // Intercept fetch
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const [resource, config] = args
      const url = typeof resource === 'string' ? resource : resource.url
      const method = config?.method || 'GET'
      
      // Only monitor Meta API calls
      if (!url.includes('graph.facebook.com') && !url.includes('/api/meta-test') && !url.includes('/api/simple-meta')) {
        return originalFetch(...args)
      }

      const eventId = Date.now().toString()
      const startTime = Date.now()

      // Log request
      addEvent({
        id: eventId,
        timestamp: new Date(),
        type: 'request',
        method,
        url: url.split('access_token=')[0] + '...' // Hide token
      })

      try {
        const response = await originalFetch(...args)
        const duration = Date.now() - startTime

        // Log response
        addEvent({
          id: eventId + '-response',
          timestamp: new Date(),
          type: response.ok ? 'response' : 'error',
          method,
          url: url.split('access_token=')[0] + '...',
          status: response.status,
          duration
        })

        if (!response.ok) {
          const clonedResponse = response.clone()
          try {
            const errorData = await clonedResponse.json()
            addEvent({
              id: eventId + '-error-detail',
              timestamp: new Date(),
              type: 'error',
              method,
              url: url.split('access_token=')[0] + '...',
              error: errorData.error?.message || `HTTP ${response.status}`,
              details: errorData
            })
          } catch {}
        }

        return response
      } catch (error) {
        const duration = Date.now() - startTime
        
        addEvent({
          id: eventId + '-error',
          timestamp: new Date(),
          type: 'error',
          method,
          url: url.split('access_token=')[0] + '...',
          duration,
          error: error instanceof Error ? error.message : 'Network error'
        })

        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  const addEvent = (event: APIEvent) => {
    setEvents(prev => [...prev.slice(-19), event]) // Keep last 20 events
  }

  const clearEvents = () => {
    setEvents([])
  }

  const getStatusColor = (status?: number) => {
    if (!status) return 'default'
    if (status >= 200 && status < 300) return 'default'
    if (status >= 400 && status < 500) return 'destructive'
    return 'destructive'
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    })
  }

  if (!isVisible) return null

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          size="sm"
          variant="outline"
          className="bg-background"
        >
          API Monitor ({events.filter(e => e.type === 'error').length} errors)
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">API Monitor</CardTitle>
            <div className="flex gap-1">
              <Button
                onClick={clearEvents}
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
              <Button
                onClick={() => setIsMinimized(true)}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-64 w-full">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No API activity yet</p>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {formatTime(event.timestamp)}
                      </span>
                      <Badge variant="outline" className="text-xs py-0">
                        {event.method}
                      </Badge>
                      {event.status && (
                        <Badge variant={getStatusColor(event.status)} className="text-xs py-0">
                          {event.status}
                        </Badge>
                      )}
                      {event.duration && (
                        <span className="text-muted-foreground">
                          {event.duration}ms
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground break-all">
                      {event.url}
                    </div>
                    {event.error && (
                      <Alert className="mt-1 py-1 px-2">
                        <AlertDescription className="text-xs">
                          {event.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}