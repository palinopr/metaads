"use client"

import React, { useState, useEffect } from 'react'
import { useRealtime } from '@/lib/realtime-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Activity, 
  TrendingUp, 
  DollarSign, 
  AlertCircle,
  Zap,
  WifiIcon
} from "lucide-react"
import { formatCurrency } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'spend_update' | 'conversion' | 'performance_alert' | 'campaign_update'
  message: string
  value?: string
  timestamp: string
  severity?: 'info' | 'success' | 'warning' | 'error'
}

export function RealTimeMonitor() {
  const { connected, subscribe } = useRealtime()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [metrics, setMetrics] = useState({
    realtimeSpend: 0,
    realtimeConversions: 0,
    alerts: 0,
    lastUpdate: new Date().toISOString()
  })

  useEffect(() => {
    // Subscribe to all message types
    const unsubscribe = subscribe('*', (message) => {
      const newActivity: ActivityItem = {
        id: `${Date.now()}-${Math.random()}`,
        type: message.type,
        message: formatMessage(message),
        value: formatValue(message),
        timestamp: message.timestamp || new Date().toISOString(),
        severity: getSeverity(message)
      }

      setActivities(prev => [newActivity, ...prev].slice(0, 50)) // Keep last 50 activities

      // Update metrics based on message type
      if (message.type === 'spend_update') {
        setMetrics(prev => ({
          ...prev,
          realtimeSpend: prev.realtimeSpend + (message.data.spend || 0),
          lastUpdate: message.timestamp
        }))
      } else if (message.type === 'conversion') {
        setMetrics(prev => ({
          ...prev,
          realtimeConversions: prev.realtimeConversions + 1,
          lastUpdate: message.timestamp
        }))
      } else if (message.type === 'performance_alert') {
        setMetrics(prev => ({
          ...prev,
          alerts: prev.alerts + 1,
          lastUpdate: message.timestamp
        }))
      }
    })

    return unsubscribe
  }, [subscribe])

  const formatMessage = (message: any): string => {
    switch (message.type) {
      case 'spend_update':
        return `Campaign spend updated`
      case 'conversion':
        return `New conversion recorded`
      case 'performance_alert':
        return message.data.alert || 'Performance alert'
      case 'campaign_update':
        return `Campaign "${message.data.campaignName}" updated`
      default:
        return 'System update'
    }
  }

  const formatValue = (message: any): string | undefined => {
    switch (message.type) {
      case 'spend_update':
        return formatCurrency(message.data.spend || 0)
      case 'conversion':
        return formatCurrency(message.data.value || 0)
      case 'performance_alert':
        return message.data.value
      default:
        return undefined
    }
  }

  const getSeverity = (message: any): 'info' | 'success' | 'warning' | 'error' => {
    if (message.type === 'conversion') return 'success'
    if (message.type === 'performance_alert') return 'warning'
    if (message.type === 'spend_update' && message.data.spend > 100) return 'warning'
    return 'info'
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'spend_update':
        return <DollarSign className="h-4 w-4" />
      case 'conversion':
        return <TrendingUp className="h-4 w-4" />
      case 'performance_alert':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'success':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'error':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      default:
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
    }
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Real-Time Monitor</CardTitle>
            <Badge variant={connected ? "default" : "secondary"} className="flex items-center gap-1">
              <WifiIcon className="h-3 w-3" />
              {connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Live Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.realtimeSpend)}</div>
            <p className="text-xs text-muted-foreground">This session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Live Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.realtimeConversions}</div>
            <p className="text-xs text-muted-foreground">This session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.alerts}</div>
            <p className="text-xs text-muted-foreground">This session</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Live Activity Feed</CardTitle>
          <CardDescription>Real-time campaign updates and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {activities.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <p>Waiting for real-time updates...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-all ${getSeverityColor(activity.severity)}`}
                  >
                    <div className="mt-0.5">{getIcon(activity.type)}</div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.message}</p>
                      {activity.value && (
                        <p className="text-sm font-semibold mt-0.5">{activity.value}</p>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
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