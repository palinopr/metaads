"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'

export interface RealtimeMessage {
  type: 'campaign_update' | 'performance_alert' | 'spend_update' | 'conversion' | 'system_alert'
  data: any
  timestamp: string
}

interface RealtimeContextType {
  connected: boolean
  lastMessage: RealtimeMessage | null
  messages: RealtimeMessage[]
  subscribe: (type: string, callback: (data: any) => void) => () => void
}

const RealtimeContext = createContext<RealtimeContextType>({
  connected: false,
  lastMessage: null,
  messages: [],
  subscribe: () => () => {},
})

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(true) // Simulated connection
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null)
  const [messages, setMessages] = useState<RealtimeMessage[]>([])
  const subscribers = useRef<Map<string, Set<(data: any) => void>>>(new Map())
  const simulationInterval = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Simulate real-time updates
    const simulateUpdates = () => {
      const types: RealtimeMessage['type'][] = ['spend_update', 'conversion', 'performance_alert', 'campaign_update']
      const randomType = types[Math.floor(Math.random() * types.length)]
      
      let message: RealtimeMessage

      switch (randomType) {
        case 'spend_update':
          message = {
            type: 'spend_update',
            data: {
              campaignId: `campaign_${Math.floor(Math.random() * 10)}`,
              campaignName: 'Sample Campaign',
              spend: Math.random() * 100,
              dailyBudget: 500,
            },
            timestamp: new Date().toISOString()
          }
          break
        case 'conversion':
          message = {
            type: 'conversion',
            data: {
              campaignId: `campaign_${Math.floor(Math.random() * 10)}`,
              campaignName: 'Sample Campaign',
              value: Math.random() * 200,
              conversionType: 'purchase',
            },
            timestamp: new Date().toISOString()
          }
          break
        case 'performance_alert':
          const alerts = [
            'High CTR detected',
            'Low ROAS warning',
            'Budget nearly exhausted',
            'Conversion rate spike'
          ]
          message = {
            type: 'performance_alert',
            data: {
              campaignId: `campaign_${Math.floor(Math.random() * 10)}`,
              alert: alerts[Math.floor(Math.random() * alerts.length)],
              value: `${(Math.random() * 10).toFixed(2)}%`,
            },
            timestamp: new Date().toISOString()
          }
          break
        default:
          message = {
            type: 'campaign_update',
            data: {
              campaignId: `campaign_${Math.floor(Math.random() * 10)}`,
              campaignName: 'Sample Campaign',
              status: Math.random() > 0.5 ? 'ACTIVE' : 'PAUSED',
            },
            timestamp: new Date().toISOString()
          }
      }

      setLastMessage(message)
      setMessages(prev => [message, ...prev].slice(0, 100))

      // Notify subscribers
      const typeSubscribers = subscribers.current.get(message.type)
      if (typeSubscribers) {
        typeSubscribers.forEach(callback => callback(message.data))
      }
      
      const globalSubscribers = subscribers.current.get('*')
      if (globalSubscribers) {
        globalSubscribers.forEach(callback => callback(message))
      }
    }

    // Start simulation after a delay
    const startDelay = setTimeout(() => {
      simulateUpdates() // Initial update
      // Continue updates every 5-15 seconds
      simulationInterval.current = setInterval(() => {
        if (Math.random() > 0.3) { // 70% chance of update
          simulateUpdates()
        }
      }, Math.random() * 10000 + 5000)
    }, 3000)

    return () => {
      clearTimeout(startDelay)
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current)
      }
    }
  }, [])

  const subscribe = useCallback((type: string, callback: (data: any) => void) => {
    if (!subscribers.current.has(type)) {
      subscribers.current.set(type, new Set())
    }
    subscribers.current.get(type)!.add(callback)

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
    <RealtimeContext.Provider value={{ connected, lastMessage, messages, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export const useRealtime = () => useContext(RealtimeContext)