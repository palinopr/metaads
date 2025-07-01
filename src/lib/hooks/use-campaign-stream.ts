import { useEffect, useState, useCallback, useRef } from 'react'

export interface CampaignMetrics {
  impressions: number
  clicks: number
  spend: number
  ctr: number
  cpm: number
  cpc: number
  conversions: number
  roas: number
}

export interface StreamUpdate {
  type: 'connected' | 'realtime_update' | 'cached_update' | 'heartbeat' | 'error'
  campaignId?: string
  metrics?: CampaignMetrics
  lastUpdated?: Date
  timestamp: string
  message?: string
}

interface UseCampaignStreamOptions {
  enabled?: boolean
  onUpdate?: (update: StreamUpdate) => void
  onError?: (error: Error) => void
}

export function useCampaignStream(
  campaignId: string | null,
  options: UseCampaignStreamOptions = {}
) {
  const { enabled = true, onUpdate, onError } = options
  const [isConnected, setIsConnected] = useState(false)
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const connect = useCallback(() => {
    if (!campaignId || !enabled) return

    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      // Create new EventSource connection
      const eventSource = new EventSource(`/api/campaigns/${campaignId}/stream`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('[CampaignStream] Connected')
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
      }

      eventSource.onmessage = (event) => {
        try {
          const update: StreamUpdate = JSON.parse(event.data)
          
          switch (update.type) {
            case 'connected':
              console.log('[CampaignStream] Connection established')
              break
              
            case 'realtime_update':
            case 'cached_update':
              if (update.metrics) {
                setMetrics(update.metrics)
                setLastUpdate(new Date(update.timestamp))
              }
              break
              
            case 'error':
              console.error('[CampaignStream] Server error:', update.message)
              setError(new Error(update.message || 'Unknown error'))
              break
          }

          // Call custom update handler
          if (onUpdate) {
            onUpdate(update)
          }
        } catch (err) {
          console.error('[CampaignStream] Failed to parse message:', err)
        }
      }

      eventSource.onerror = (err) => {
        console.error('[CampaignStream] Connection error:', err)
        setIsConnected(false)
        setError(new Error('Connection lost'))
        
        if (onError) {
          onError(new Error('Connection lost'))
        }

        // Attempt to reconnect with exponential backoff
        const attempts = reconnectAttemptsRef.current
        if (attempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, attempts), 30000)
          console.log(`[CampaignStream] Reconnecting in ${delay}ms...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        }
      }
    } catch (err) {
      console.error('[CampaignStream] Failed to connect:', err)
      setError(err as Error)
      if (onError) {
        onError(err as Error)
      }
    }
  }, [campaignId, enabled, onUpdate, onError])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setIsConnected(false)
    reconnectAttemptsRef.current = 0
  }, [])

  useEffect(() => {
    if (enabled && campaignId) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [campaignId, enabled, connect, disconnect])

  return {
    isConnected,
    metrics,
    lastUpdate,
    error,
    reconnect: connect,
    disconnect
  }
}