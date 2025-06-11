'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCampaignUpdates } from '@/hooks/use-websocket'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingDown, 
  TrendingUp,
  Zap,
  AlertCircle,
  RefreshCw,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PerformanceMetric {
  current: number
  previous: number
  change: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  threshold?: {
    excellent: number
    good: number
    warning: number
    critical: number
  }
}

interface CampaignPerformance {
  id: string
  name: string
  status: 'active' | 'paused' | 'error'
  metrics: {
    roas: PerformanceMetric
    ctr: PerformanceMetric
    cpc: PerformanceMetric
    conversionRate: PerformanceMetric
    impressionShare: PerformanceMetric
  }
  alerts: Alert[]
  lastUpdate: Date
  healthScore: number
}

interface Alert {
  id: string
  type: 'performance' | 'budget' | 'delivery' | 'quality'
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  timestamp: Date
  action?: {
    label: string
    handler: () => void
  }
}

export function LivePerformanceMonitor({ campaignId }: { campaignId?: string }) {
  const [campaigns, setCampaigns] = useState<Map<string, CampaignPerformance>>(new Map())
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(campaignId || null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5000) // 5 seconds

  // Subscribe to campaign updates
  const { isConnected } = useCampaignUpdates(
    selectedCampaign || 'all',
    useCallback((data: any) => {
      updateCampaignPerformance(data)
    }, [])
  )

  const updateCampaignPerformance = (data: any) => {
    setCampaigns(prev => {
      const updated = new Map(prev)
      const campaign = updated.get(data.campaignId) || createDefaultCampaign(data.campaignId, data.name)
      
      // Update metrics
      if (data.metrics) {
        Object.keys(data.metrics).forEach(key => {
          if (campaign.metrics[key as keyof typeof campaign.metrics]) {
            const metric = campaign.metrics[key as keyof typeof campaign.metrics]
            metric.previous = metric.current
            metric.current = data.metrics[key]
            metric.change = calculateChange(metric.current, metric.previous)
            metric.status = getMetricStatus(key, metric.current, metric.threshold)
          }
        })
      }

      // Update alerts
      if (data.alerts) {
        campaign.alerts = data.alerts.map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp)
        }))
      }

      // Calculate health score
      campaign.healthScore = calculateHealthScore(campaign)
      campaign.lastUpdate = new Date()

      updated.set(data.campaignId, campaign)
      return updated
    })
  }

  const createDefaultCampaign = (id: string, name: string): CampaignPerformance => ({
    id,
    name,
    status: 'active',
    metrics: {
      roas: {
        current: 0,
        previous: 0,
        change: 0,
        status: 'warning',
        threshold: { excellent: 4, good: 2.5, warning: 1.5, critical: 1 }
      },
      ctr: {
        current: 0,
        previous: 0,
        change: 0,
        status: 'warning',
        threshold: { excellent: 2, good: 1.5, warning: 1, critical: 0.5 }
      },
      cpc: {
        current: 0,
        previous: 0,
        change: 0,
        status: 'warning',
        threshold: { excellent: 0.5, good: 1, warning: 2, critical: 3 }
      },
      conversionRate: {
        current: 0,
        previous: 0,
        change: 0,
        status: 'warning',
        threshold: { excellent: 5, good: 3, warning: 2, critical: 1 }
      },
      impressionShare: {
        current: 0,
        previous: 0,
        change: 0,
        status: 'warning',
        threshold: { excellent: 80, good: 60, warning: 40, critical: 20 }
      }
    },
    alerts: [],
    lastUpdate: new Date(),
    healthScore: 50
  })

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const getMetricStatus = (
    metric: string, 
    value: number, 
    threshold?: PerformanceMetric['threshold']
  ): PerformanceMetric['status'] => {
    if (!threshold) return 'good'

    // For metrics where lower is better (like CPC)
    if (metric === 'cpc') {
      if (value <= threshold.excellent) return 'excellent'
      if (value <= threshold.good) return 'good'
      if (value <= threshold.warning) return 'warning'
      return 'critical'
    }

    // For metrics where higher is better
    if (value >= threshold.excellent) return 'excellent'
    if (value >= threshold.good) return 'good'
    if (value >= threshold.warning) return 'warning'
    return 'critical'
  }

  const calculateHealthScore = (campaign: CampaignPerformance): number => {
    const metricScores = Object.values(campaign.metrics).map(metric => {
      switch (metric.status) {
        case 'excellent': return 100
        case 'good': return 75
        case 'warning': return 50
        case 'critical': return 25
      }
    })

    const avgScore = metricScores.reduce((a, b) => a + b, 0) / metricScores.length

    // Reduce score based on alerts
    const alertPenalty = campaign.alerts.reduce((penalty, alert) => {
      switch (alert.severity) {
        case 'critical': return penalty + 20
        case 'error': return penalty + 15
        case 'warning': return penalty + 10
        default: return penalty + 5
      }
    }, 0)

    return Math.max(0, Math.min(100, avgScore - alertPenalty))
  }

  const getHealthColor = (score: number): string => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-500'
  }

  const getStatusIcon = (status: PerformanceMetric['status']) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'good':
        return <Activity className="h-4 w-4 text-blue-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const formatMetricValue = (key: string, value: number): string => {
    switch (key) {
      case 'roas':
        return `${value.toFixed(2)}x`
      case 'ctr':
      case 'conversionRate':
      case 'impressionShare':
        return `${value.toFixed(2)}%`
      case 'cpc':
        return `$${value.toFixed(2)}`
      default:
        return value.toFixed(2)
    }
  }

  const getMetricLabel = (key: string): string => {
    const labels: Record<string, string> = {
      roas: 'ROAS',
      ctr: 'CTR',
      cpc: 'CPC',
      conversionRate: 'Conv. Rate',
      impressionShare: 'Imp. Share'
    }
    return labels[key] || key
  }

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // In a real implementation, this would trigger a data fetch
      console.log('Auto-refreshing performance data...')
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  const currentCampaign = selectedCampaign ? campaigns.get(selectedCampaign) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Performance Monitor</h2>
          <p className="text-muted-foreground">Real-time campaign performance tracking</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? 'Live' : 'Disconnected'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(autoRefresh && 'bg-secondary')}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', autoRefresh && 'animate-spin')} />
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Campaign Selector */}
      {campaigns.size > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.from(campaigns.values()).map(campaign => (
                <Button
                  key={campaign.id}
                  variant={selectedCampaign === campaign.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCampaign(campaign.id)}
                  className="relative"
                >
                  {campaign.name}
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      'ml-2 h-5 px-1',
                      getHealthColor(campaign.healthScore)
                    )}
                  >
                    {campaign.healthScore}%
                  </Badge>
                  {campaign.alerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Performance Dashboard */}
      {currentCampaign ? (
        <>
          {/* Overall Health */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Health Score</CardTitle>
              <CardDescription>
                {currentCampaign.name} - Last updated: {currentCampaign.lastUpdate.toLocaleTimeString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className={cn('h-8 w-8', getHealthColor(currentCampaign.healthScore))} />
                    <span className={cn('text-3xl font-bold', getHealthColor(currentCampaign.healthScore))}>
                      {currentCampaign.healthScore}%
                    </span>
                  </div>
                  <Badge variant={currentCampaign.status === 'active' ? 'default' : 'secondary'}>
                    {currentCampaign.status}
                  </Badge>
                </div>
                <Progress value={currentCampaign.healthScore} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
              <CardDescription>Real-time metric tracking with threshold monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(currentCampaign.metrics).map(([key, metric]) => (
                  <Card key={key} className="relative overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{getMetricLabel(key)}</CardTitle>
                        {getStatusIcon(metric.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-2xl font-bold">
                          {formatMetricValue(key, metric.current)}
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          {metric.change !== 0 && (
                            <>
                              {metric.change > 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                              )}
                              <span className={metric.change > 0 ? 'text-green-500' : 'text-red-500'}>
                                {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                              </span>
                            </>
                          )}
                          <span className="text-muted-foreground">vs previous</span>
                        </div>
                        {metric.threshold && (
                          <Progress 
                            value={key === 'cpc' 
                              ? Math.max(0, 100 - (metric.current / metric.threshold.critical) * 100)
                              : (metric.current / metric.threshold.excellent) * 100
                            } 
                            className="h-1"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          {currentCampaign.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>{currentCampaign.alerts.length} alerts require attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentCampaign.alerts.map(alert => (
                    <Alert key={alert.id} variant={alert.severity === 'critical' || alert.severity === 'error' ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{alert.type}</AlertTitle>
                      <AlertDescription className="flex items-center justify-between">
                        <span>{alert.message}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                          {alert.action && (
                            <Button size="sm" variant="outline" onClick={alert.action.handler}>
                              {alert.action.label}
                            </Button>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Recommendations</CardTitle>
              <CardDescription>Real-time optimization suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="immediate" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="immediate">Immediate Actions</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                </TabsList>
                
                <TabsContent value="immediate" className="space-y-2">
                  <div className="space-y-2">
                    {currentCampaign.healthScore < 60 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Performance Alert</AlertTitle>
                        <AlertDescription>
                          Campaign health is below optimal. Consider adjusting bid strategy or targeting.
                        </AlertDescription>
                      </Alert>
                    )}
                    {currentCampaign.metrics.cpc.status === 'critical' && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>High CPC Detected</AlertTitle>
                        <AlertDescription>
                          Cost per click is above threshold. Review keyword competitiveness and quality score.
                        </AlertDescription>
                      </Alert>
                    )}
                    {currentCampaign.metrics.ctr.status === 'warning' && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Low CTR Warning</AlertTitle>
                        <AlertDescription>
                          Click-through rate is declining. Consider refreshing ad creative or copy.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="scheduled" className="space-y-2">
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Scheduled Optimization</AlertTitle>
                    <AlertDescription>
                      Budget reallocation scheduled for tomorrow 9:00 AM based on performance trends.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
                
                <TabsContent value="monitoring" className="space-y-2">
                  <Alert>
                    <BarChart3 className="h-4 w-4" />
                    <AlertTitle>Performance Monitoring</AlertTitle>
                    <AlertDescription>
                      Tracking conversion rate improvements from recent landing page updates.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No campaigns selected for monitoring</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}