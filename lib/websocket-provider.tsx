"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'

export interface WebSocketMessage {
  type: 'campaign_update' | 'performance_alert' | 'spend_update' | 'conversion' | 'system_alert'
  data: any
  timestamp: string
}

interface WebSocketContextType {
  connected: boolean
  lastMessage: WebSocketMessage | null
  sendMessage: (message: any) => void
  subscribe: (type: string, callback: (data: any) => void) => () => void
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  lastMessage: null,
  sendMessage: () => {},
  subscribe: () => () => {},
})

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout>()
  const subscribers = useRef<Map<string, Set<(data: any) => void>>>(new Map())

  const connect = useCallback(() => {
    try {
      // Use the current host for WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/ws`
      
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        setConnected(true)
        toast.success('Real-time updates connected')
        console.log('WebSocket connected')
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
          
          // Notify subscribers
          const typeSubscribers = subscribers.current.get(message.type)
          if (typeSubscribers) {
            typeSubscribers.forEach(callback => callback(message.data))
          }
          
          // Global subscribers
          const globalSubscribers = subscribers.current.get('*')
          if (globalSubscribers) {
            globalSubscribers.forEach(callback => callback(message))
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        toast.error('Real-time connection error')
      }

      ws.current.onclose = () => {
        setConnected(false)
        ws.current = null
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeout.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...')
          connect()
        }, 5000)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [connect])

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  const subscribe = useCallback((type: string, callback: (data: any) => void) => {
    if (!subscribers.current.has(type)) {
      subscribers.current.set(type, new Set())
    }
    subscribers.current.get(type)!.add(callback)

    // Return unsubscribe function
    return () => {
      const typeSubscribers = subscribers.current.get(type)
      if (typeSubscribers) {
        typeSubscribers.delete(callback)
        if (typeSubscribers.size === 0) {
          subscribers.current.delete(type)
        }
      }
    }
  }, [])

  return (
    <WebSocketContext.Provider value={{ connected, lastMessage, sendMessage, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => useContext(WebSocketContext)