'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Eye, 
  MousePointer, 
  Wifi, 
  WifiOff,
  Play,
  Pause,
  RotateCcw,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

// Types
interface MetricData {
  timestamp: number
  impressions: number
  clicks: number
  conversions: number
  spend: number
  ctr: number
  cpm: number
  cpc: number
  roas: number
  reachRate: number
  engagementRate: number
}

interface RealtimeMetric {
  id: string
  name: string
  value: number
  previousValue: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
  unit: string
  icon: React.ReactNode
  color: string
  priority: 'high' | 'medium' | 'low'
}

interface ConnectionState {
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  lastConnected?: Date
  reconnectAttempts: number
  latency: number
}

interface RealtimeMetricsProps {
  accountId?: string
  campaignIds?: string[]
  refreshInterval?: number
  maxDataPoints?: number
  onMetricUpdate?: (metrics: RealtimeMetric[]) => void
}

// WebSocket hook for real-time data
const useWebSocket = (url: string, options: { 
  reconnect?: boolean
  maxReconnectAttempts?: number
  reconnectInterval?: number
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    reconnectAttempts: 0,
    latency: 0
  })
  const [data, setData] = useState<any>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)
  const pingIntervalRef = useRef<NodeJS.Timeout>()
  const lastPingRef = useRef<number>(0)

  const connect = useCallback(() => {
    try {
      setConnectionState(prev => ({ ...prev, status: 'connecting' }))
      
      const ws = new WebSocket(url)
      
      ws.onopen = () => {
        console.log('WebSocket connected')
        setConnectionState({
          status: 'connected',
          lastConnected: new Date(),
          reconnectAttempts: reconnectAttemptsRef.current,
          latency: 0
        })
        reconnectAttemptsRef.current = 0
        
        // Start ping/pong for latency monitoring
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            lastPingRef.current = Date.now()
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000)
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          if (message.type === 'pong') {
            const latency = Date.now() - lastPingRef.current
            setConnectionState(prev => ({ ...prev, latency }))
            return
          }
          
          setData(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setConnectionState(prev => ({ ...prev, status: 'disconnected' }))
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
        }
        
        // Auto-reconnect if enabled
        if (options.reconnect && reconnectAttemptsRef.current < (options.maxReconnectAttempts || 5)) {
          reconnectAttemptsRef.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionState(prev => ({ ...prev, status: 'error' }))
      }

      setSocket(ws)
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      setConnectionState(prev => ({ ...prev, status: 'error' }))
    }
  }, [url, options.reconnect, options.maxReconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }
    if (socket) {
      socket.close()
    }
    reconnectAttemptsRef.current = 0
  }, [socket])

  const sendMessage = useCallback((message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    }
  }, [socket])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return { connect, disconnect, sendMessage, data, connectionState }
}

export default function RealtimeMetrics({ 
  accountId,
  campaignIds,
  refreshInterval = 5000,
  maxDataPoints = 50,
  onMetricUpdate
}: RealtimeMetricsProps) {
  const [isActive, setIsActive] = useState(false)
  const [historicalData, setHistoricalData] = useState<MetricData[]>([])
  const [currentMetrics, setCurrentMetrics] = useState<RealtimeMetric[]>([])
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['impressions', 'clicks', 'spend', 'conversions'])
  const [viewMode, setViewMode] = useState<'grid' | 'chart' | 'compact'>('grid')
  const intervalRef = useRef<NodeJS.Timeout>()

  // WebSocket connection for real-time updates
  const { connect, disconnect, sendMessage, data, connectionState } = useWebSocket(
    process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080/realtime',
    {
      reconnect: true,
      maxReconnectAttempts: 5,
      reconnectInterval: 5000
    }
  )

  // Generate mock data for demonstration
  const generateMockData = useCallback((): MetricData => {
    const now = Date.now()
    const baseData = {
      timestamp: now,
      impressions: Math.floor(Math.random() * 10000) + 5000,
      clicks: Math.floor(Math.random() * 500) + 100,
      conversions: Math.floor(Math.random() * 50) + 10,
      spend: Math.random() * 1000 + 200,
      ctr: 0,
      cpm: 0,
      cpc: 0,
      roas: 0,
      reachRate: Math.random() * 30 + 60,
      engagementRate: Math.random() * 10 + 5
    }

    // Calculate derived metrics
    baseData.ctr = (baseData.clicks / baseData.impressions) * 100
    baseData.cpm = (baseData.spend / baseData.impressions) * 1000
    baseData.cpc = baseData.spend / baseData.clicks
    baseData.roas = (baseData.conversions * 50) / baseData.spend // Assuming $50 per conversion

    return baseData
  }, [])

  // Convert data to metrics
  const convertToMetrics = useCallback((current: MetricData, previous?: MetricData): RealtimeMetric[] => {
    const calculateChange = (curr: number, prev: number) => {
      if (prev === 0) return 0
      return ((curr - prev) / prev) * 100
    }

    const getTrend = (change: number): 'up' | 'down' | 'stable' => {
      if (Math.abs(change) < 1) return 'stable'
      return change > 0 ? 'up' : 'down'
    }

    const metrics: RealtimeMetric[] = [
      {
        id: 'impressions',
        name: 'Impressions',
        value: current.impressions,
        previousValue: previous?.impressions || 0,
        change: current.impressions - (previous?.impressions || 0),
        changePercent: calculateChange(current.impressions, previous?.impressions || 0),
        trend: getTrend(calculateChange(current.impressions, previous?.impressions || 0)),
        unit: '',
        icon: <Eye className="h-4 w-4" />,
        color: 'blue',
        priority: 'high'
      },
      {
        id: 'clicks',
        name: 'Clicks',
        value: current.clicks,
        previousValue: previous?.clicks || 0,
        change: current.clicks - (previous?.clicks || 0),
        changePercent: calculateChange(current.clicks, previous?.clicks || 0),
        trend: getTrend(calculateChange(current.clicks, previous?.clicks || 0)),
        unit: '',
        icon: <MousePointer className="h-4 w-4" />,
        color: 'green',
        priority: 'high'
      },
      {
        id: 'conversions',
        name: 'Conversions',
        value: current.conversions,
        previousValue: previous?.conversions || 0,
        change: current.conversions - (previous?.conversions || 0),
        changePercent: calculateChange(current.conversions, previous?.conversions || 0),
        trend: getTrend(calculateChange(current.conversions, previous?.conversions || 0)),
        unit: '',
        icon: <Zap className="h-4 w-4" />,
        color: 'purple',
        priority: 'high'
      },
      {
        id: 'spend',
        name: 'Spend',
        value: current.spend,
        previousValue: previous?.spend || 0,
        change: current.spend - (previous?.spend || 0),
        changePercent: calculateChange(current.spend, previous?.spend || 0),
        trend: getTrend(calculateChange(current.spend, previous?.spend || 0)),
        unit: '$',
        icon: <DollarSign className="h-4 w-4" />,
        color: 'red',
        priority: 'high'
      },
      {
        id: 'ctr',
        name: 'CTR',
        value: current.ctr,
        previousValue: previous?.ctr || 0,
        change: current.ctr - (previous?.ctr || 0),
        changePercent: calculateChange(current.ctr, previous?.ctr || 0),
        trend: getTrend(calculateChange(current.ctr, previous?.ctr || 0)),
        unit: '%',
        icon: <Activity className="h-4 w-4" />,
        color: 'orange',
        priority: 'medium'
      },
      {
        id: 'roas',
        name: 'ROAS',
        value: current.roas,
        previousValue: previous?.roas || 0,
        change: current.roas - (previous?.roas || 0),
        changePercent: calculateChange(current.roas, previous?.roas || 0),
        trend: getTrend(calculateChange(current.roas, previous?.roas || 0)),
        unit: 'x',
        icon: <TrendingUp className="h-4 w-4" />,
        color: 'indigo',
        priority: 'high'
      }
    ]

    return metrics
  }, [])

  // Update metrics from WebSocket or polling
  const updateMetrics = useCallback(() => {
    const newData = generateMockData()
    const previousData = historicalData[historicalData.length - 1]

    // Add to historical data
    setHistoricalData(prev => {
      const updated = [...prev, newData]
      return updated.slice(-maxDataPoints)
    })

    // Update current metrics
    const metrics = convertToMetrics(newData, previousData)
    setCurrentMetrics(metrics)
    onMetricUpdate?.(metrics)

    // Send subscription message via WebSocket
    if (connectionState.status === 'connected') {
      sendMessage({
        type: 'subscribe',
        accountId,
        campaignIds,
        metrics: selectedMetrics
      })
    }
  }, [historicalData, maxDataPoints, convertToMetrics, generateMockData, onMetricUpdate, connectionState.status, sendMessage, accountId, campaignIds, selectedMetrics])

  // Handle WebSocket data
  useEffect(() => {
    if (data && data.type === 'metrics') {
      const metrics = convertToMetrics(data.current, data.previous)
      setCurrentMetrics(metrics)
      onMetricUpdate?.(metrics)

      // Add to historical data
      setHistoricalData(prev => {
        const updated = [...prev, data.current]
        return updated.slice(-maxDataPoints)
      })
    }
  }, [data, convertToMetrics, onMetricUpdate, maxDataPoints])

  // Start/stop monitoring
  const toggleMonitoring = useCallback(() => {
    if (isActive) {
      // Stop monitoring
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      disconnect()
      setIsActive(false)
    } else {
      // Start monitoring
      connect()
      intervalRef.current = setInterval(updateMetrics, refreshInterval)
      setIsActive(true)
      updateMetrics() // Initial update
    }
  }, [isActive, connect, disconnect, updateMetrics, refreshInterval])

  // Clear historical data
  const clearData = useCallback(() => {
    setHistoricalData([])
    setCurrentMetrics([])
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      disconnect()
    }
  }, [disconnect])

  // Filtered metrics for display
  const displayMetrics = useMemo(() => {
    return currentMetrics.filter(metric => selectedMetrics.includes(metric.id))
  }, [currentMetrics, selectedMetrics])

  // Chart data preparation
  const chartData = useMemo(() => {
    return historicalData.map(data => ({
      timestamp: new Date(data.timestamp).toLocaleTimeString(),
      ...selectedMetrics.reduce((acc, metricId) => {
        acc[metricId] = data[metricId as keyof MetricData] as number
        return acc
      }, {} as Record<string, number>)
    }))
  }, [historicalData, selectedMetrics])

  const renderConnectionStatus = () => (
    <div className="flex items-center gap-2">
      {connectionState.status === 'connected' ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-600">Connected</span>
          {connectionState.latency > 0 && (
            <Badge variant="outline" className="text-xs">
              {connectionState.latency}ms
            </Badge>
          )}
        </>
      ) : connectionState.status === 'connecting' ? (
        <>
          <div className="h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-yellow-600">Connecting...</span>
        </>
      ) : connectionState.status === 'error' ? (
        <>
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600">Connection Error</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Disconnected</span>
        </>
      )}
    </div>
  )

  const renderMetricCard = (metric: RealtimeMetric) => (
    <Card key={metric.id} className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {metric.icon}
          {metric.name}
        </CardTitle>
        <div className="flex items-center gap-1">
          {metric.trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : metric.trend === 'down' ? (
            <TrendingDown className="h-4 w-4 text-red-500" />
          ) : (
            <div className="h-4 w-4" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {metric.unit === '$' ? '$' : ''}
          {metric.value.toLocaleString(undefined, { 
            maximumFractionDigits: metric.unit === '%' ? 2 : 0 
          })}
          {metric.unit && metric.unit !== '$' ? metric.unit : ''}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={`${
            metric.changePercent > 0 ? 'text-green-600' : 
            metric.changePercent < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {metric.changePercent > 0 ? '+' : ''}
            {metric.changePercent.toFixed(1)}%
          </span>
          <span>vs previous</span>
        </div>
        <Progress 
          value={Math.min(Math.abs(metric.changePercent), 100)} 
          className="mt-2 h-1"
        />
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Real-time Metrics</h2>
          <p className="text-muted-foreground">
            Live performance data with WebSocket updates
          </p>
        </div>
        <div className="flex items-center gap-4">
          {renderConnectionStatus()}
          <div className="flex items-center gap-2">
            <Button
              variant={isActive ? "destructive" : "default"}
              size="sm"
              onClick={toggleMonitoring}
            >
              {isActive ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={clearData}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="monitoring-toggle">Real-time Monitoring</Label>
            <Switch
              id="monitoring-toggle"
              checked={isActive}
              onCheckedChange={toggleMonitoring}
            />
          </div>
          
          <Separator />
          
          <div>
            <Label className="text-sm font-medium">Display Metrics</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {[
                { id: 'impressions', name: 'Impressions' },
                { id: 'clicks', name: 'Clicks' },
                { id: 'conversions', name: 'Conversions' },
                { id: 'spend', name: 'Spend' },
                { id: 'ctr', name: 'CTR' },
                { id: 'roas', name: 'ROAS' }
              ].map((metric) => (
                <div key={metric.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={metric.id}
                    checked={selectedMetrics.includes(metric.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMetrics(prev => [...prev, metric.id])
                      } else {
                        setSelectedMetrics(prev => prev.filter(id => id !== metric.id))
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={metric.id} className="text-sm">
                    {metric.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium">View Mode</Label>
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="mt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="grid">Grid</TabsTrigger>
                <TabsTrigger value="chart">Chart</TabsTrigger>
                <TabsTrigger value="compact">Compact</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Status Indicators */}
      {isActive && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live Updates Active</span>
          </div>
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {refreshInterval / 1000}s interval
          </Badge>
          <Badge variant="outline">
            {historicalData.length} / {maxDataPoints} data points
          </Badge>
        </div>
      )}

      {/* Metrics Display */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayMetrics.map(renderMetricCard)}
          </div>
        </TabsContent>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Historical Trends</CardTitle>
              <CardDescription>
                Real-time metric trends over the last {maxDataPoints} data points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    {selectedMetrics.map((metricId, index) => (
                      <Line
                        key={metricId}
                        type="monotone"
                        dataKey={metricId}
                        stroke={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compact">
          <Card>
            <CardHeader>
              <CardTitle>Compact View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayMetrics.map((metric) => (
                  <div key={metric.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {metric.icon}
                      <div>
                        <div className="font-medium">{metric.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {metric.unit === '$' ? '$' : ''}
                          {metric.value.toLocaleString()}
                          {metric.unit && metric.unit !== '$' ? metric.unit : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        metric.changePercent > 0 ? 'text-green-600' : 
                        metric.changePercent < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {metric.changePercent > 0 ? '+' : ''}
                        {metric.changePercent.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {metric.trend === 'up' ? 'Trending Up' : 
                         metric.trend === 'down' ? 'Trending Down' : 'Stable'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}