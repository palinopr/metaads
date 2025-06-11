"use client"

/**
 * Real-time Monitoring Dashboard
 * 
 * Comprehensive monitoring dashboard that provides real-time insights into:
 * - System health and performance
 * - Business metrics and KPIs
 * - Error tracking and debugging
 * - User behavior analytics
 * - API performance and reliability
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Users,
  Zap,
  Database,
  Shield,
  Clock,
  Eye,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'

interface DashboardData {
  systemHealth: {
    overall: 'healthy' | 'degraded' | 'unhealthy'
    services: Array<{
      name: string
      status: 'healthy' | 'degraded' | 'unhealthy'
      responseTime: number
      uptime: number
      lastCheck: Date
    }>
  }
  performance: {
    score: number
    metrics: {
      fcp: number
      lcp: number
      fid: number
      cls: number
      ttfb: number
    }
    trends: Array<{ timestamp: number; score: number }>
  }
  business: {
    revenue: {
      total: number
      change: number
      trend: Array<{ timestamp: number; value: number }>
    }
    campaigns: {
      active: number
      performance: Array<{
        id: string
        name: string
        spend: number
        revenue: number
        roas: number
        status: string
      }>
    }
    users: {
      active: number
      sessions: number
      bounceRate: number
    }
  }
  errors: {
    rate: number
    critical: number
    resolved: number
    recent: Array<{
      id: string
      message: string
      count: number
      severity: 'low' | 'medium' | 'high' | 'critical'
      timestamp: Date
    }>
  }
  alerts: Array<{
    id: string
    title: string
    description: string
    severity: 'info' | 'warning' | 'error' | 'critical'
    timestamp: Date
    acknowledged: boolean
  }>
}

export function RealTimeMonitoringDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5000)

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/dashboard')
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      
      const dashboardData = await response.json()
      setData(dashboardData)
      setError(null)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err.message)
      console.error('Dashboard data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchDashboardData, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchDashboardData])

  const healthColor = useMemo(() => {
    if (!data) return 'gray'
    switch (data.systemHealth.overall) {
      case 'healthy': return 'green'
      case 'degraded': return 'yellow'
      case 'unhealthy': return 'red'
      default: return 'gray'
    }
  }, [data?.systemHealth.overall])

  const activeAlerts = useMemo(() => 
    data?.alerts.filter(alert => !alert.acknowledged) || [], 
    [data?.alerts]
  )

  const criticalErrors = useMemo(() =>
    data?.errors.recent.filter(error => error.severity === 'critical') || [],
    [data?.errors.recent]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading monitoring dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load monitoring data: {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDashboardData}
            className="ml-4"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-time Monitoring</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge 
            variant={healthColor === 'green' ? 'default' : 
                    healthColor === 'yellow' ? 'secondary' : 'destructive'}
            className="text-sm"
          >
            <div className={`w-2 h-2 rounded-full mr-2 bg-${healthColor}-500`} />
            {data.systemHealth.overall.toUpperCase()}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Live' : 'Paused'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {activeAlerts.length > 0 && (
        <Alert variant={activeAlerts.some(a => a.severity === 'critical') ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Active Alerts ({activeAlerts.length})</div>
            <div className="space-y-1">
              {activeAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="text-sm">
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="mr-2">
                    {alert.severity}
                  </Badge>
                  {alert.title}
                </div>
              ))}
              {activeAlerts.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{activeAlerts.length - 3} more alerts
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="System Health"
          value={data.systemHealth.overall}
          icon={<Shield className="w-4 h-4" />}
          trend={data.systemHealth.services.filter(s => s.status === 'healthy').length / data.systemHealth.services.length * 100}
          format="status"
        />
        
        <MetricCard
          title="Performance Score"
          value={data.performance.score}
          icon={<Zap className="w-4 h-4" />}
          trend={data.performance.trends.length > 1 ? 
            data.performance.trends[data.performance.trends.length - 1].score - 
            data.performance.trends[data.performance.trends.length - 2].score : 0}
          format="score"
        />
        
        <MetricCard
          title="Revenue (24h)"
          value={data.business.revenue.total}
          icon={<TrendingUp className="w-4 h-4" />}
          trend={data.business.revenue.change}
          format="currency"
        />
        
        <MetricCard
          title="Error Rate"
          value={data.errors.rate}
          icon={<AlertTriangle className="w-4 h-4" />}
          trend={-5} // Mock trend
          format="percentage"
          inverse
        />
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab data={data} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceTab data={data.performance} />
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <BusinessTab data={data.business} />
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <ErrorsTab data={data.errors} />
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-4">
          <InfrastructureTab data={data.systemHealth} />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Metric Card Component
interface MetricCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  trend?: number
  format?: 'number' | 'currency' | 'percentage' | 'score' | 'status'
  inverse?: boolean
}

function MetricCard({ title, value, icon, trend, format = 'number', inverse = false }: MetricCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
      case 'percentage':
        return `${val.toFixed(1)}%`
      case 'score':
        return `${val}/100`
      default:
        return val.toLocaleString()
    }
  }

  const getTrendColor = () => {
    if (trend === undefined) return 'text-muted-foreground'
    const isPositive = inverse ? trend < 0 : trend > 0
    return isPositive ? 'text-green-500' : trend === 0 ? 'text-muted-foreground' : 'text-red-500'
  }

  const getTrendIcon = () => {
    if (trend === undefined) return null
    if (trend === 0) return null
    const isUp = trend > 0
    return isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          {trend !== undefined && (
            <div className={`flex items-center text-xs ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="ml-1">
                {Math.abs(trend).toFixed(1)}% vs last period
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Tab Components
function OverviewTab({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.systemHealth.services.map(service => (
              <div key={service.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    service.status === 'healthy' ? 'bg-green-500' :
                    service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium">{service.name}</span>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div>{service.responseTime}ms</div>
                  <div>{service.uptime.toFixed(1)}% uptime</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>All systems operational</span>
              <span className="text-muted-foreground ml-auto">2 min ago</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-blue-500" />
              <span>Performance metrics updated</span>
              <span className="text-muted-foreground ml-auto">5 min ago</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-purple-500" />
              <span>Active users: {data.business.users.active}</span>
              <span className="text-muted-foreground ml-auto">Live</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PerformanceTab({ data }: { data: DashboardData['performance'] }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value) => [`${value}/100`, 'Performance Score']}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Core Web Vitals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">FCP</span>
              <span className="text-sm font-medium">{data.metrics.fcp}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">LCP</span>
              <span className="text-sm font-medium">{data.metrics.lcp}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">FID</span>
              <span className="text-sm font-medium">{data.metrics.fid}ms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Loading Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">TTFB</span>
              <span className="text-sm font-medium">{data.metrics.ttfb}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">CLS</span>
              <span className="text-sm font-medium">{data.metrics.cls}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold">{data.score}</div>
              <div className="text-sm text-muted-foreground">/ 100</div>
              <Progress value={data.score} className="mt-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function BusinessTab({ data }: { data: DashboardData['business'] }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.revenue.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value) => [
                    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value), 
                    'Revenue'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Active Users</span>
              <span className="text-2xl font-bold">{data.users.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Sessions</span>
              <span className="text-2xl font-bold">{data.users.sessions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Bounce Rate</span>
              <span className="text-2xl font-bold">{data.users.bounceRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.campaigns.performance.map(campaign => (
              <div key={campaign.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div>
                  <div className="font-medium">{campaign.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Spend: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(campaign.spend)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(campaign.revenue)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ROAS: {campaign.roas.toFixed(2)}x
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ErrorsTab({ data }: { data: DashboardData['errors'] }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.rate.toFixed(2)}%</div>
            <Progress value={data.rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Critical Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{data.critical}</div>
            <div className="text-sm text-muted-foreground">Needs attention</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resolved Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{data.resolved}</div>
            <div className="text-sm text-muted-foreground">Issues fixed</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recent.map(error => (
              <div key={error.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    error.severity === 'critical' ? 'destructive' :
                    error.severity === 'high' ? 'secondary' : 'outline'
                  }>
                    {error.severity}
                  </Badge>
                  <span className="font-medium">{error.message}</span>
                  <span className="text-sm text-muted-foreground">({error.count}x)</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {error.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InfrastructureTab({ data }: { data: DashboardData['systemHealth'] }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {data.services.map(service => (
              <div key={service.name} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{service.name}</h3>
                  <Badge variant={
                    service.status === 'healthy' ? 'default' :
                    service.status === 'degraded' ? 'secondary' : 'destructive'
                  }>
                    {service.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Response Time: {service.responseTime}ms</div>
                  <div>Uptime: {service.uptime.toFixed(3)}%</div>
                  <div>Last Check: {service.lastCheck.toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Security Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Security monitoring features will be implemented in the next phase
          </div>
        </CardContent>
      </Card>
    </div>
  )
}