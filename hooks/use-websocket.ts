import { useEffect, useRef, useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'update' | 'ping' | 'pong' | 'alert' | 'notification'
  channel?: string
  data?: any
  timestamp?: number
}

export interface UseWebSocketOptions {
  url?: string
  reconnect?: boolean
  reconnectInterval?: number
  reconnectAttempts?: number
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  onMessage?: (message: WebSocketMessage) => void
}

export interface WebSocketState {
  isConnected: boolean
  lastMessage: WebSocketMessage | null
  error: Error | null
  reconnectCount: number
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:3000/ws`,
    reconnect = true,
    reconnectInterval = 5000,
    reconnectAttempts = 5,
    onOpen,
    onClose,
    onError,
    onMessage
  } = options

  const { toast } = useToast()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectCountRef = useRef(0)
  const messageQueueRef = useRef<WebSocketMessage[]>([])

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastMessage: null,
    error: null,
    reconnectCount: 0
  })

  const connect = useCallback(() => {
    try {
      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close()
      }

      // Create new WebSocket connection
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setState(prev => ({
          ...prev,
          isConnected: true,
          error: null
        }))
        reconnectCountRef.current = 0

        // Process queued messages
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift()
          if (message) {
            ws.send(JSON.stringify(message))
          }
        }

        onOpen?.()
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setState(prev => ({ ...prev, isConnected: false }))
        wsRef.current = null

        // Attempt reconnection
        if (reconnect && reconnectCountRef.current < reconnectAttempts) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectCountRef.current++
            setState(prev => ({ ...prev, reconnectCount: reconnectCountRef.current }))
            connect()
          }, reconnectInterval)
        }

        onClose?.()
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setState(prev => ({
          ...prev,
          error: new Error('WebSocket connection failed')
        }))
        onError?.(error)
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setState(prev => ({ ...prev, lastMessage: message }))

          // Handle different message types
          switch (message.type) {
            case 'ping':
              sendMessage({ type: 'pong' })
              break

            case 'alert':
              handleAlert(message.data)
              break

            case 'notification':
              handleNotification(message.data)
              break

            default:
              onMessage?.(message)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setState(prev => ({
        ...prev,
        error: error as Error
      }))
    }
  }, [url, reconnect, reconnectInterval, reconnectAttempts, onOpen, onClose, onError, onMessage])

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        timestamp: message.timestamp || Date.now()
      }))
    } else {
      // Queue message for when connection is established
      messageQueueRef.current.push(message)
    }
  }, [])

  const subscribe = useCallback((channel: string) => {
    sendMessage({
      type: 'subscribe',
      channel
    })
  }, [sendMessage])

  const unsubscribe = useCallback((channel: string) => {
    sendMessage({
      type: 'unsubscribe',
      channel
    })
  }, [sendMessage])

  const handleAlert = (alert: any) => {
    const { title, message, severity } = alert

    toast({
      title,
      description: message,
      variant: severity === 'critical' || severity === 'high' ? 'destructive' : 'default'
    })
  }

  const handleNotification = (notification: any) => {
    const { title, body, icon, tag } = notification

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/icons/icon-192x192.svg',
        tag
      })
    }
  }

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected: state.isConnected,
    lastMessage: state.lastMessage,
    error: state.error,
    reconnectCount: state.reconnectCount,
    sendMessage,
    subscribe,
    unsubscribe,
    connect,
    disconnect
  }
}

// Hook for subscribing to specific channels
export function useWebSocketChannel(channel: string, handler: (data: any) => void) {
  const { isConnected, lastMessage, subscribe, unsubscribe } = useWebSocket()

  useEffect(() => {
    if (isConnected) {
      subscribe(channel)

      return () => {
        unsubscribe(channel)
      }
    }
  }, [isConnected, channel, subscribe, unsubscribe])

  useEffect(() => {
    if (lastMessage && lastMessage.channel === channel && lastMessage.type === 'update') {
      handler(lastMessage.data)
    }
  }, [lastMessage, channel, handler])

  return { isConnected }
}

// Hook for real-time campaign updates
export function useCampaignUpdates(campaignId: string, handler: (data: any) => void) {
  return useWebSocketChannel(`campaign:${campaignId}`, handler)
}

// Hook for real-time metric updates
export function useMetricUpdates(metric: string, handler: (data: any) => void) {
  return useWebSocketChannel(`metrics:${metric}`, handler)
}

// Hook for real-time alerts
export function useAlerts(handler: (alert: any) => void) {
  return useWebSocketChannel('alerts', handler)
}