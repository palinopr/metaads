'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWebSocket, useMetricUpdates, useAlerts } from '@/hooks/use-websocket'
import { Activity, TrendingUp, TrendingDown, AlertCircle, DollarSign, Users, Eye, MousePointer } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

interface RealtimeMetric {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  timestamp: number
}

interface RealtimeMetrics {
  spend: RealtimeMetric
  impressions: RealtimeMetric
  clicks: RealtimeMetric
  conversions: RealtimeMetric
  ctr: RealtimeMetric
  cpc: RealtimeMetric
  roas: RealtimeMetric
  activeCampaigns: number
}

interface ChartDataPoint {
  time: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
}

export function RealtimeDashboard() {
  const { isConnected } = useWebSocket()
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    spend: { value: 0, change: 0, trend: 'stable', timestamp: Date.now() },
    impressions: { value: 0, change: 0, trend: 'stable', timestamp: Date.now() },
    clicks: { value: 0, change: 0, trend: 'stable', timestamp: Date.now() },
    conversions: { value: 0, change: 0, trend: 'stable', timestamp: Date.now() },
    ctr: { value: 0, change: 0, trend: 'stable', timestamp: Date.now() },
    cpc: { value: 0, change: 0, trend: 'stable', timestamp: Date.now() },
    roas: { value: 0, change: 0, trend: 'stable', timestamp: Date.now() },
    activeCampaigns: 0
  })

  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [alerts, setAlerts] = useState<any[]>([])

  // Subscribe to metric updates
  useMetricUpdates('spend', useCallback((data: any) => {
    setMetrics(prev => ({
      ...prev,
      spend: {
        value: data.value,
        change: data.change,
        trend: data.change > 0 ? 'up' : data.change < 0 ? 'down' : 'stable',
        timestamp: Date.now()
      }
    }))
  }, []))

  useMetricUpdates('impressions', useCallback((data: any) => {
    setMetrics(prev => ({
      ...prev,
      impressions: {
        value: data.value,
        change: data.change,
        trend: data.change > 0 ? 'up' : data.change < 0 ? 'down' : 'stable',
        timestamp: Date.now()
      }
    }))
  }, []))

  useMetricUpdates('clicks', useCallback((data: any) => {
    setMetrics(prev => ({
      ...prev,
      clicks: {
        value: data.value,
        change: data.change,
        trend: data.change > 0 ? 'up' : data.change < 0 ? 'down' : 'stable',
        timestamp: Date.now()
      }
    }))
  }, []))

  useMetricUpdates('conversions', useCallback((data: any) => {
    setMetrics(prev => ({
      ...prev,
      conversions: {
        value: data.value,
        change: data.change,
        trend: data.change > 0 ? 'up' : data.change < 0 ? 'down' : 'stable',
        timestamp: Date.now()
      }
    }))
  }, []))

  useMetricUpdates('performance', useCallback((data: any) => {
    setMetrics(prev => ({
      ...prev,
      ctr: {
        value: data.ctr,
        change: data.ctrChange,
        trend: data.ctrChange > 0 ? 'up' : data.ctrChange < 0 ? 'down' : 'stable',
        timestamp: Date.now()
      },
      cpc: {
        value: data.cpc,
        change: data.cpcChange,
        trend: data.cpcChange > 0 ? 'up' : data.cpcChange < 0 ? 'down' : 'stable',
        timestamp: Date.now()
      },
      roas: {
        value: data.roas,
        change: data.roasChange,
        trend: data.roasChange > 0 ? 'up' : data.roasChange < 0 ? 'down' : 'stable',
        timestamp: Date.now()
      }
    }))
  }, []))

  // Subscribe to alerts
  useAlerts(useCallback((alert: any) => {
    setAlerts(prev => [alert, ...prev.slice(0, 9)])
  }, []))

  // Update chart data
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
      
      setChartData(prev => {
        const newData = [...prev, {
          time: timeStr,
          spend: metrics.spend.value,
          impressions: metrics.impressions.value,
          clicks: metrics.clicks.value,
          conversions: metrics.conversions.value
        }]
        
        // Keep only last 20 data points
        return newData.slice(-20)
      })
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [metrics])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toFixed(0)
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num)
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(2)}%`
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Real-time Dashboard</h2>
        <Badge variant={isConnected ? 'default' : 'destructive'}>
          {isConnected ? 'Live' : 'Disconnected'}
        </Badge>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.spend.value)}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {getTrendIcon(metrics.spend.trend)}
              <span className={metrics.spend.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                {metrics.spend.change >= 0 ? '+' : ''}{formatPercentage(metrics.spend.change)}
              </span>
              <span>from last hour</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.impressions.value)}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {getTrendIcon(metrics.impressions.trend)}
              <span className={metrics.impressions.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                {metrics.impressions.change >= 0 ? '+' : ''}{formatPercentage(metrics.impressions.change)}
              </span>
              <span>from last hour</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.clicks.value)}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {getTrendIcon(metrics.clicks.trend)}
              <span className={metrics.clicks.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                {metrics.clicks.change >= 0 ? '+' : ''}{formatPercentage(metrics.clicks.change)}
              </span>
              <span>from last hour</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.conversions.value)}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {getTrendIcon(metrics.conversions.trend)}
              <span className={metrics.conversions.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                {metrics.conversions.change >= 0 ? '+' : ''}{formatPercentage(metrics.conversions.change)}
              </span>
              <span>from last hour</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CTR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatPercentage(metrics.ctr.value)}</div>
            <Progress value={metrics.ctr.value * 10} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CPC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(metrics.cpc.value)}</div>
            <Progress value={Math.min(metrics.cpc.value * 20, 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ROAS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{metrics.roas.value.toFixed(2)}x</div>
            <Progress value={Math.min(metrics.roas.value * 25, 100)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Real-time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Live Performance Metrics</CardTitle>
          <CardDescription>Real-time updates every 5 seconds</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="spend" className="space-y-4">
            <TabsList>
              <TabsTrigger value="spend">Spend</TabsTrigger>
              <TabsTrigger value="impressions">Impressions</TabsTrigger>
              <TabsTrigger value="clicks">Clicks</TabsTrigger>
              <TabsTrigger value="conversions">Conversions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="spend" className="space-y-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Line
                      type="monotone"
                      dataKey="spend"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="impressions" className="space-y-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatNumber(value)} />
                    <Line
                      type="monotone"
                      dataKey="impressions"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="clicks" className="space-y-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatNumber(value)} />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      stroke="#ffc658"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="conversions" className="space-y-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatNumber(value)} />
                    <Line
                      type="monotone"
                      dataKey="conversions"
                      stroke="#ff7c7c"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-secondary"
                >
                  <AlertCircle className={`h-4 w-4 ${
                    alert.severity === 'critical' || alert.severity === 'high' 
                      ? 'text-red-500' 
                      : 'text-yellow-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                  </div>
                  <Badge variant={
                    alert.severity === 'critical' || alert.severity === 'high' 
                      ? 'destructive' 
                      : 'secondary'
                  }>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}