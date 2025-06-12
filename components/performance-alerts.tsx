'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Bell, 
  BellOff, 
  Settings,
  Plus,
  Edit2,
  Trash2,
  Clock,
  TrendingDown,
  TrendingUp,
  Target,
  Activity,
  Users,
  DollarSign,
  Eye,
  MousePointer,
  Zap,
  Mail,
  MessageSquare,
  Webhook,
  Save,
  X,
  Filter,
  SortAsc,
  SortDesc,
  Search,
  Play,
  Pause
} from 'lucide-react'

// Types
interface AlertThreshold {
  id: string
  name: string
  description: string
  metric: string
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'between'
  value: number
  maxValue?: number // For 'between' operator
  severity: 'low' | 'medium' | 'high' | 'critical'
  isActive: boolean
  conditions: AlertCondition[]
  notifications: NotificationChannel[]
  cooldownPeriod: number // minutes
  createdAt: Date
  updatedAt: Date
  lastTriggered?: Date
  triggerCount: number
}

interface AlertCondition {
  id: string
  field: string
  operator: string
  value: any
}

interface NotificationChannel {
  id: string
  type: 'email' | 'slack' | 'webhook' | 'push'
  config: Record<string, any>
  isActive: boolean
}

interface ActiveAlert {
  id: string
  thresholdId: string
  thresholdName: string
  metric: string
  currentValue: number
  thresholdValue: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  triggeredAt: Date
  acknowledgedAt?: Date
  acknowledgedBy?: string
  resolvedAt?: Date
  status: 'active' | 'acknowledged' | 'resolved'
  campaignId?: string
  campaignName?: string
  adsetId?: string
  adsetName?: string
}

interface MetricValue {
  metric: string
  value: number
  timestamp: Date
  campaignId?: string
  adsetId?: string
}

interface PerformanceAlertsProps {
  accountId?: string
  campaignIds?: string[]
  onAlertTriggered?: (alert: ActiveAlert) => void
  onAlertResolved?: (alert: ActiveAlert) => void
}

// Predefined metric configurations
const METRIC_CONFIGS = {
  spend: { name: 'Spend', unit: '$', icon: <DollarSign className="h-4 w-4" />, color: 'red' },
  impressions: { name: 'Impressions', unit: '', icon: <Eye className="h-4 w-4" />, color: 'blue' },
  clicks: { name: 'Clicks', unit: '', icon: <MousePointer className="h-4 w-4" />, color: 'green' },
  conversions: { name: 'Conversions', unit: '', icon: <Zap className="h-4 w-4" />, color: 'purple' },
  ctr: { name: 'CTR', unit: '%', icon: <Activity className="h-4 w-4" />, color: 'orange' },
  cpm: { name: 'CPM', unit: '$', icon: <Target className="h-4 w-4" />, color: 'indigo' },
  cpc: { name: 'CPC', unit: '$', icon: <Target className="h-4 w-4" />, color: 'pink' },
  roas: { name: 'ROAS', unit: 'x', icon: <TrendingUp className="h-4 w-4" />, color: 'emerald' }
}

export default function PerformanceAlerts({ 
  accountId,
  campaignIds,
  onAlertTriggered,
  onAlertResolved
}: PerformanceAlertsProps) {
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([])
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [selectedTab, setSelectedTab] = useState('alerts')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingThreshold, setEditingThreshold] = useState<AlertThreshold | null>(null)
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'severity' | 'created' | 'triggered'>('severity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')

  const monitoringIntervalRef = useRef<NodeJS.Timeout>()
  const notificationQueueRef = useRef<ActiveAlert[]>([])

  // Mock data for demonstration
  const generateMockMetricValue = useCallback((): MetricValue => {
    const metrics = Object.keys(METRIC_CONFIGS)
    const metric = metrics[Math.floor(Math.random() * metrics.length)]
    
    let value: number
    switch (metric) {
      case 'spend':
        value = Math.random() * 1000 + 100
        break
      case 'impressions':
        value = Math.floor(Math.random() * 10000) + 1000
        break
      case 'clicks':
        value = Math.floor(Math.random() * 500) + 50
        break
      case 'conversions':
        value = Math.floor(Math.random() * 50) + 5
        break
      case 'ctr':
        value = Math.random() * 5 + 1
        break
      case 'cpm':
        value = Math.random() * 20 + 5
        break
      case 'cpc':
        value = Math.random() * 5 + 0.5
        break
      case 'roas':
        value = Math.random() * 4 + 1
        break
      default:
        value = Math.random() * 100
    }

    return {
      metric,
      value,
      timestamp: new Date(),
      campaignId: campaignIds?.[0],
      adsetId: `adset_${Math.floor(Math.random() * 1000)}`
    }
  }, [campaignIds])

  // Default thresholds
  const initializeDefaultThresholds = useCallback(() => {
    const defaultThresholds: AlertThreshold[] = [
      {
        id: 'high-spend',
        name: 'High Daily Spend',
        description: 'Alert when daily spend exceeds budget threshold',
        metric: 'spend',
        operator: 'greater_than',
        value: 500,
        severity: 'high',
        isActive: true,
        conditions: [],
        notifications: [
          {
            id: 'email-1',
            type: 'email',
            config: { recipients: ['manager@company.com'] },
            isActive: true
          }
        ],
        cooldownPeriod: 60,
        createdAt: new Date(),
        updatedAt: new Date(),
        triggerCount: 0
      },
      {
        id: 'low-ctr',
        name: 'Low Click-Through Rate',
        description: 'Alert when CTR drops below acceptable threshold',
        metric: 'ctr',
        operator: 'less_than',
        value: 1.0,
        severity: 'medium',
        isActive: true,
        conditions: [],
        notifications: [],
        cooldownPeriod: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
        triggerCount: 0
      },
      {
        id: 'low-roas',
        name: 'Low Return on Ad Spend',
        description: 'Alert when ROAS falls below profitability threshold',
        metric: 'roas',
        operator: 'less_than',
        value: 2.0,
        severity: 'critical',
        isActive: true,
        conditions: [],
        notifications: [],
        cooldownPeriod: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
        triggerCount: 0
      }
    ]

    setThresholds(defaultThresholds)
  }, [])

  useEffect(() => {
    initializeDefaultThresholds()
  }, [initializeDefaultThresholds])

  // Alert evaluation logic
  const evaluateThreshold = useCallback((threshold: AlertThreshold, metricValue: MetricValue): boolean => {
    if (!threshold.isActive || threshold.metric !== metricValue.metric) {
      return false
    }

    const { operator, value, maxValue } = threshold
    const currentValue = metricValue.value

    switch (operator) {
      case 'greater_than':
        return currentValue > value
      case 'less_than':
        return currentValue < value
      case 'equals':
        return Math.abs(currentValue - value) < 0.01
      case 'not_equals':
        return Math.abs(currentValue - value) >= 0.01
      case 'between':
        return maxValue ? (currentValue >= value && currentValue <= maxValue) : false
      default:
        return false
    }
  }, [])

  // Create alert from threshold
  const createAlert = useCallback((threshold: AlertThreshold, metricValue: MetricValue): ActiveAlert => {
    const alert: ActiveAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      thresholdId: threshold.id,
      thresholdName: threshold.name,
      metric: threshold.metric,
      currentValue: metricValue.value,
      thresholdValue: threshold.value,
      severity: threshold.severity,
      message: generateAlertMessage(threshold, metricValue),
      triggeredAt: new Date(),
      status: 'active',
      campaignId: metricValue.campaignId,
      campaignName: `Campaign ${metricValue.campaignId}`,
      adsetId: metricValue.adsetId,
      adsetName: `AdSet ${metricValue.adsetId}`
    }

    return alert
  }, [])

  const generateAlertMessage = (threshold: AlertThreshold, metricValue: MetricValue): string => {
    const metricConfig = METRIC_CONFIGS[threshold.metric as keyof typeof METRIC_CONFIGS]
    const currentValueStr = `${metricConfig.unit === '$' ? '$' : ''}${metricValue.value.toFixed(2)}${metricConfig.unit && metricConfig.unit !== '$' ? metricConfig.unit : ''}`
    const thresholdValueStr = `${metricConfig.unit === '$' ? '$' : ''}${threshold.value.toFixed(2)}${metricConfig.unit && metricConfig.unit !== '$' ? metricConfig.unit : ''}`

    switch (threshold.operator) {
      case 'greater_than':
        return `${metricConfig.name} (${currentValueStr}) exceeded threshold of ${thresholdValueStr}`
      case 'less_than':
        return `${metricConfig.name} (${currentValueStr}) fell below threshold of ${thresholdValueStr}`
      case 'equals':
        return `${metricConfig.name} (${currentValueStr}) equals threshold of ${thresholdValueStr}`
      default:
        return `${metricConfig.name} threshold condition met: ${currentValueStr}`
    }
  }

  // Monitor metrics and trigger alerts
  const monitorMetrics = useCallback(() => {
    const metricValue = generateMockMetricValue()
    
    // Check all thresholds
    thresholds.forEach(threshold => {
      if (evaluateThreshold(threshold, metricValue)) {
        // Check cooldown period
        const now = new Date()
        if (threshold.lastTriggered) {
          const timeSinceLastTrigger = now.getTime() - threshold.lastTriggered.getTime()
          const cooldownMs = threshold.cooldownPeriod * 60 * 1000
          if (timeSinceLastTrigger < cooldownMs) {
            return // Still in cooldown
          }
        }

        // Create and trigger alert
        const alert = createAlert(threshold, metricValue)
        
        setActiveAlerts(prev => [alert, ...prev])
        notificationQueueRef.current.push(alert)
        
        // Update threshold stats
        setThresholds(prev => prev.map(t => 
          t.id === threshold.id 
            ? { ...t, lastTriggered: now, triggerCount: t.triggerCount + 1 }
            : t
        ))

        onAlertTriggered?.(alert)
        
        // Send notifications
        sendNotifications(alert, threshold.notifications)
      }
    })
  }, [thresholds, evaluateThreshold, createAlert, generateMockMetricValue, onAlertTriggered])

  // Send notifications
  const sendNotifications = useCallback(async (alert: ActiveAlert, channels: NotificationChannel[]) => {
    for (const channel of channels.filter(c => c.isActive)) {
      try {
        switch (channel.type) {
          case 'email':
            console.log(`Sending email notification for alert: ${alert.message}`)
            // Implement email sending logic
            break
          case 'slack':
            console.log(`Sending Slack notification for alert: ${alert.message}`)
            // Implement Slack webhook logic
            break
          case 'webhook':
            console.log(`Sending webhook notification for alert: ${alert.message}`)
            // Implement webhook logic
            break
          case 'push':
            console.log(`Sending push notification for alert: ${alert.message}`)
            // Implement push notification logic
            break
        }
      } catch (error) {
        console.error(`Failed to send ${channel.type} notification:`, error)
      }
    }
  }, [])

  // Start/stop monitoring
  const toggleMonitoring = useCallback(() => {
    if (isMonitoring) {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current)
      }
      setIsMonitoring(false)
    } else {
      monitoringIntervalRef.current = setInterval(monitorMetrics, 10000) // Check every 10 seconds
      setIsMonitoring(true)
    }
  }, [isMonitoring, monitorMetrics])

  // Alert actions
  const acknowledgeAlert = useCallback((alertId: string) => {
    setActiveAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'acknowledged', acknowledgedAt: new Date(), acknowledgedBy: 'Current User' }
        : alert
    ))
  }, [])

  const resolveAlert = useCallback((alertId: string) => {
    setActiveAlerts(prev => prev.map(alert => {
      if (alert.id === alertId) {
        const resolvedAlert = { ...alert, status: 'resolved' as const, resolvedAt: new Date() }
        onAlertResolved?.(resolvedAlert)
        return resolvedAlert
      }
      return alert
    }))
  }, [onAlertResolved])

  // Threshold management
  const createThreshold = useCallback((threshold: Omit<AlertThreshold, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>) => {
    const newThreshold: AlertThreshold = {
      ...threshold,
      id: `threshold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      triggerCount: 0
    }
    setThresholds(prev => [...prev, newThreshold])
    setShowCreateDialog(false)
  }, [])

  const updateThreshold = useCallback((id: string, updates: Partial<AlertThreshold>) => {
    setThresholds(prev => prev.map(threshold => 
      threshold.id === id 
        ? { ...threshold, ...updates, updatedAt: new Date() }
        : threshold
    ))
    setEditingThreshold(null)
  }, [])

  const deleteThreshold = useCallback((id: string) => {
    setThresholds(prev => prev.filter(threshold => threshold.id !== id))
  }, [])

  // Filtered and sorted data
  const filteredAlerts = useMemo(() => {
    let filtered = activeAlerts

    if (filterSeverity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === filterSeverity)
    }

    if (searchQuery) {
      filtered = filtered.filter(alert => 
        alert.thresholdName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [activeAlerts, filterSeverity, searchQuery])

  const sortedThresholds = useMemo(() => {
    let sorted = [...thresholds]

    if (searchQuery) {
      sorted = sorted.filter(threshold => 
        threshold.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        threshold.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    sorted.sort((a, b) => {
      let aValue: any = a[sortBy]
      let bValue: any = b[sortBy]

      if (sortBy === 'severity') {
        const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 }
        aValue = severityOrder[a.severity]
        bValue = severityOrder[b.severity]
      } else if (sortBy === 'created') {
        aValue = a.createdAt.getTime()
        bValue = b.createdAt.getTime()
      } else if (sortBy === 'triggered') {
        aValue = a.lastTriggered?.getTime() || 0
        bValue = b.lastTriggered?.getTime() || 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return sorted
  }, [thresholds, sortBy, sortOrder, searchQuery])

  // Cleanup
  useEffect(() => {
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current)
      }
    }
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <AlertCircle className="h-4 w-4" />
      case 'medium': return <AlertTriangle className="h-4 w-4" />
      case 'high': return <AlertTriangle className="h-4 w-4" />
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const renderThresholdForm = (threshold?: AlertThreshold) => {
    const [formData, setFormData] = useState({
      name: threshold?.name || '',
      description: threshold?.description || '',
      metric: threshold?.metric || 'spend',
      operator: threshold?.operator || 'greater_than',
      value: threshold?.value || 0,
      maxValue: threshold?.maxValue || 0,
      severity: threshold?.severity || 'medium',
      isActive: threshold?.isActive ?? true,
      cooldownPeriod: threshold?.cooldownPeriod || 30
    })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      
      if (threshold) {
        updateThreshold(threshold.id, formData)
      } else {
        createThreshold({
          ...formData,
          conditions: [],
          notifications: []
        })
      }
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Alert Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="metric">Metric</Label>
            <Select value={formData.metric} onValueChange={(value) => setFormData({ ...formData, metric: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METRIC_CONFIGS).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {config.icon}
                      {config.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="operator">Condition</Label>
            <Select value={formData.operator} onValueChange={(value) => setFormData({ ...formData, operator: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="greater_than">Greater than</SelectItem>
                <SelectItem value="less_than">Less than</SelectItem>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="not_equals">Not equals</SelectItem>
                <SelectItem value="between">Between</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="value">Threshold Value</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          {formData.operator === 'between' && (
            <div>
              <Label htmlFor="maxValue">Max Value</Label>
              <Input
                id="maxValue"
                type="number"
                step="0.01"
                value={formData.maxValue}
                onChange={(e) => setFormData({ ...formData, maxValue: parseFloat(e.target.value) || 0 })}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="severity">Severity</Label>
            <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cooldown">Cooldown (minutes)</Label>
            <Input
              id="cooldown"
              type="number"
              value={formData.cooldownPeriod}
              onChange={(e) => setFormData({ ...formData, cooldownPeriod: parseInt(e.target.value) || 30 })}
              min="1"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="active">Active</Label>
        </div>

        <DialogFooter>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            {threshold ? 'Update' : 'Create'} Alert
          </Button>
        </DialogFooter>
      </form>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Alerts</h2>
          <p className="text-muted-foreground">
            Monitor thresholds and get notified of performance issues
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-sm text-muted-foreground">
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}
            </span>
          </div>
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            size="sm"
            onClick={toggleMonitoring}
          >
            {isMonitoring ? (
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{activeAlerts.filter(a => a.status === 'active').length}</div>
                <div className="text-sm text-muted-foreground">Active Alerts</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{thresholds.filter(t => t.isActive).length}</div>
                <div className="text-sm text-muted-foreground">Active Thresholds</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{thresholds.reduce((sum, t) => sum + t.triggerCount, 0)}</div>
                <div className="text-sm text-muted-foreground">Total Triggers</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{activeAlerts.filter(a => a.status === 'resolved').length}</div>
                <div className="text-sm text-muted-foreground">Resolved Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="alerts">Active Alerts ({filteredAlerts.length})</TabsTrigger>
          <TabsTrigger value="thresholds">Alert Thresholds ({thresholds.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          {/* Alerts List */}
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                  <h3 className="text-lg font-medium">No Active Alerts</h3>
                  <p className="text-muted-foreground">All systems are performing within thresholds</p>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map((alert) => (
                <Card key={alert.id} className={`border-l-4 ${alert.severity === 'critical' ? 'border-l-red-500' : alert.severity === 'high' ? 'border-l-orange-500' : alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getSeverityIcon(alert.severity)}
                          <h3 className="font-medium">{alert.thresholdName}</h3>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={`${alert.status === 'active' ? 'text-red-600' : alert.status === 'acknowledged' ? 'text-yellow-600' : 'text-green-600'}`}>
                            {alert.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {alert.triggeredAt.toLocaleString()}
                          </span>
                          {alert.campaignName && (
                            <span>Campaign: {alert.campaignName}</span>
                          )}
                        </div>
                        
                        {alert.acknowledgedAt && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Acknowledged by {alert.acknowledgedBy} at {alert.acknowledgedAt.toLocaleString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {alert.status !== 'resolved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="thresholds" className="space-y-4">
          {/* Threshold Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="severity">Severity</SelectItem>
                    <SelectItem value="created">Created</SelectItem>
                    <SelectItem value="triggered">Last Triggered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <Input
                  placeholder="Search thresholds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Alert Threshold</DialogTitle>
                  <DialogDescription>
                    Set up a new performance alert threshold
                  </DialogDescription>
                </DialogHeader>
                {renderThresholdForm()}
              </DialogContent>
            </Dialog>
          </div>

          {/* Thresholds List */}
          <div className="space-y-3">
            {sortedThresholds.map((threshold) => {
              const metricConfig = METRIC_CONFIGS[threshold.metric as keyof typeof METRIC_CONFIGS]
              
              return (
                <Card key={threshold.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {metricConfig?.icon}
                          <h3 className="font-medium">{threshold.name}</h3>
                          <Badge className={getSeverityColor(threshold.severity)}>
                            {threshold.severity.toUpperCase()}
                          </Badge>
                          {!threshold.isActive && (
                            <Badge variant="outline" className="text-gray-500">
                              INACTIVE
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {threshold.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {metricConfig?.name} {threshold.operator.replace('_', ' ')} {threshold.value}{metricConfig?.unit}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bell className="h-3 w-3" />
                            {threshold.triggerCount} triggers
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {threshold.cooldownPeriod}min cooldown
                          </span>
                        </div>
                        
                        {threshold.lastTriggered && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Last triggered: {threshold.lastTriggered.toLocaleString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={threshold.isActive}
                          onCheckedChange={(checked) => updateThreshold(threshold.id, { isActive: checked })}
                        />
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingThreshold(threshold)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Alert Threshold</DialogTitle>
                              <DialogDescription>
                                Update the alert threshold configuration
                              </DialogDescription>
                            </DialogHeader>
                            {renderThresholdForm(threshold)}
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteThreshold(threshold.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}