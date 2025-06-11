'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAlerts } from '@/hooks/use-websocket'
import { 
  Bell, 
  BellOff, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  CheckCircle,
  Settings,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Clock,
  TrendingUp,
  DollarSign,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { alertsEngine, AlertRule, Alert as AlertType } from '@/lib/realtime/alerts-engine'

interface AlertRuleFormData {
  name: string
  description: string
  metric: string
  condition: string
  threshold: number
  timeWindow?: number
  severity: string
  cooldown?: number
}

export function RealtimeAlertsCenter() {
  const [alerts, setAlerts] = useState<AlertType[]>([])
  const [rules, setRules] = useState<AlertRule[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null)
  const [showRuleDialog, setShowRuleDialog] = useState(false)

  // Subscribe to real-time alerts
  useAlerts(useCallback((alert: any) => {
    setAlerts(prev => [alert, ...prev.slice(0, 49)]) // Keep last 50 alerts
    
    // Play sound if enabled
    if (soundEnabled && (alert.severity === 'critical' || alert.severity === 'error')) {
      playAlertSound()
    }
    
    // Show browser notification if enabled
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      showBrowserNotification(alert)
    }
  }, [soundEnabled, notificationsEnabled]))

  useEffect(() => {
    // Load existing alerts and rules
    setAlerts(alertsEngine.getActiveAlerts())
    setRules(alertsEngine.getRules())

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const playAlertSound = () => {
    const audio = new Audio('/sounds/alert.mp3')
    audio.play().catch(e => console.error('Failed to play alert sound:', e))
  }

  const showBrowserNotification = (alert: AlertType) => {
    const icon = getSeverityIcon(alert.severity)
    new Notification(alert.ruleName, {
      body: alert.message,
      icon: '/icons/icon-192x192.svg',
      tag: alert.id,
      requireInteraction: alert.severity === 'critical'
    })
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'error': return 'destructive'
      case 'warning': return 'secondary'
      default: return 'default'
    }
  }

  const getMetricIcon = (metric: string) => {
    if (metric.includes('budget') || metric.includes('spend')) return <DollarSign className="h-4 w-4" />
    if (metric.includes('performance') || metric.includes('roas')) return <TrendingUp className="h-4 w-4" />
    return <Zap className="h-4 w-4" />
  }

  const acknowledgeAlert = (alertId: string) => {
    alertsEngine.acknowledgeAlert(alertId)
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ))
  }

  const toggleRule = (ruleId: string, enabled: boolean) => {
    alertsEngine.updateRule(ruleId, { enabled })
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled } : rule
    ))
  }

  const deleteRule = (ruleId: string) => {
    alertsEngine.deleteRule(ruleId)
    setRules(prev => prev.filter(rule => rule.id !== ruleId))
  }

  const saveRule = (formData: AlertRuleFormData) => {
    const rule: AlertRule = {
      id: editingRule?.id || `rule_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      enabled: true,
      metric: formData.metric,
      condition: formData.condition as AlertRule['condition'],
      threshold: formData.threshold,
      timeWindow: formData.timeWindow,
      severity: formData.severity as AlertRule['severity'],
      cooldown: formData.cooldown,
      actions: [
        { type: 'notification', config: { title: formData.name } }
      ]
    }

    if (editingRule) {
      alertsEngine.updateRule(rule.id, rule)
    } else {
      alertsEngine.addRule(rule)
    }

    setRules(alertsEngine.getRules())
    setShowRuleDialog(false)
    setEditingRule(null)
  }

  const activeAlerts = alerts.filter(alert => !alert.resolvedAt)
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical')
  const warningAlerts = activeAlerts.filter(alert => alert.severity === 'warning' || alert.severity === 'error')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alerts Center</h2>
          <p className="text-muted-foreground">Real-time monitoring and alerting</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
            <Label htmlFor="notifications" className="flex items-center space-x-1">
              {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              <span>Notifications</span>
            </Label>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowRuleDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Rule
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {criticalAlerts.length} critical, {warningAlerts.length} warnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alert Rules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
            <p className="text-xs text-muted-foreground">
              {rules.filter(r => r.enabled).length} enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground">
              Average alert detection time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
        </TabsList>

        {/* Active Alerts */}
        <TabsContent value="active" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">All systems operational</p>
                <p className="text-sm text-muted-foreground">No active alerts</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {activeAlerts.map(alert => (
                <Alert key={alert.id} variant={getSeverityColor(alert.severity)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      {getSeverityIcon(alert.severity)}
                      <div className="space-y-1">
                        <AlertTitle>{alert.ruleName}</AlertTitle>
                        <AlertDescription>{alert.message}</AlertDescription>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{alert.timestamp.toLocaleString()}</span>
                          {alert.campaignName && (
                            <span>Campaign: {alert.campaignName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Alert History */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>All alerts from the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.slice(0, 20).map(alert => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      alert.resolvedAt ? "bg-secondary/50" : "bg-secondary"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      {getSeverityIcon(alert.severity)}
                      <div>
                        <p className="font-medium text-sm">{alert.ruleName}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.timestamp.toLocaleString()}
                          {alert.resolvedAt && ` - Resolved at ${alert.resolvedAt.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={alert.resolvedAt ? 'outline' : getSeverityColor(alert.severity)}>
                      {alert.resolvedAt ? 'Resolved' : alert.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alert Rules */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Rules</CardTitle>
              <CardDescription>Configure when and how you receive alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map(rule => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center space-x-4">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {getMetricIcon(rule.metric)}
                          <p className="font-medium">{rule.name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                        <div className="flex items-center space-x-4 text-xs">
                          <Badge variant="outline">{rule.metric}</Badge>
                          <span>{rule.condition.replace('_', ' ')} {rule.threshold}</span>
                          <Badge variant={getSeverityColor(rule.severity)}>
                            {rule.severity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingRule(rule)
                          setShowRuleDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit' : 'Create'} Alert Rule</DialogTitle>
            <DialogDescription>
              Configure when you want to be alerted about campaign performance
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              saveRule({
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                metric: formData.get('metric') as string,
                condition: formData.get('condition') as string,
                threshold: parseFloat(formData.get('threshold') as string),
                timeWindow: formData.get('timeWindow') ? parseInt(formData.get('timeWindow') as string) : undefined,
                severity: formData.get('severity') as string,
                cooldown: formData.get('cooldown') ? parseInt(formData.get('cooldown') as string) : undefined
              })
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingRule?.name}
                placeholder="e.g., High CPC Alert"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                defaultValue={editingRule?.description}
                placeholder="Brief description of the alert"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metric">Metric</Label>
                <Select name="metric" defaultValue={editingRule?.metric || 'cpc'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spend">Spend</SelectItem>
                    <SelectItem value="cpc">CPC</SelectItem>
                    <SelectItem value="ctr">CTR</SelectItem>
                    <SelectItem value="roas">ROAS</SelectItem>
                    <SelectItem value="impressions">Impressions</SelectItem>
                    <SelectItem value="conversions">Conversions</SelectItem>
                    <SelectItem value="budget_consumed_percentage">Budget %</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select name="condition" defaultValue={editingRule?.condition || 'greater_than'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="greater_than">Greater than</SelectItem>
                    <SelectItem value="less_than">Less than</SelectItem>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="percentage_change">% Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold</Label>
                <Input
                  id="threshold"
                  name="threshold"
                  type="number"
                  step="0.01"
                  defaultValue={editingRule?.threshold}
                  placeholder="e.g., 2.5"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select name="severity" defaultValue={editingRule?.severity || 'warning'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowRuleDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingRule ? 'Update' : 'Create'} Rule
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}