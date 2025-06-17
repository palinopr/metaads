"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import {
  Bell,
  BellOff,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Zap,
  Settings,
  Check,
  X
} from "lucide-react"

interface AlertRule {
  id: string
  name: string
  type: 'spend' | 'roas' | 'ctr' | 'conversions' | 'cpa'
  condition: 'above' | 'below' | 'change'
  threshold: number
  enabled: boolean
  severity: 'low' | 'medium' | 'high'
  lastTriggered?: string
}

interface SmartAlert {
  id: string
  ruleId: string
  campaignId: string
  campaignName: string
  message: string
  value: number
  timestamp: string
  severity: 'low' | 'medium' | 'high'
  acknowledged: boolean
}

interface SmartAlertsProps {
  campaigns: any[]
}

export function SmartAlerts({ campaigns }: SmartAlertsProps) {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    {
      id: '1',
      name: 'High Spend Alert',
      type: 'spend',
      condition: 'above',
      threshold: 1000,
      enabled: true,
      severity: 'high'
    },
    {
      id: '2',
      name: 'Low ROAS Warning',
      type: 'roas',
      condition: 'below',
      threshold: 1.5,
      enabled: true,
      severity: 'medium'
    },
    {
      id: '3',
      name: 'CTR Drop Alert',
      type: 'ctr',
      condition: 'below',
      threshold: 1.0,
      enabled: true,
      severity: 'medium'
    },
    {
      id: '4',
      name: 'High CPA Alert',
      type: 'cpa',
      condition: 'above',
      threshold: 50,
      enabled: true,
      severity: 'high'
    }
  ])

  const [alerts, setAlerts] = useState<SmartAlert[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [newRule, setNewRule] = useState<Partial<AlertRule>>({
    type: 'spend',
    condition: 'above',
    threshold: 0,
    severity: 'medium',
    enabled: true
  })

  // Check campaigns against alert rules
  useEffect(() => {
    const checkAlerts = () => {
      const newAlerts: SmartAlert[] = []

      campaigns.forEach(campaign => {
        alertRules.forEach(rule => {
          if (!rule.enabled) return

          let value = 0
          let shouldTrigger = false

          switch (rule.type) {
            case 'spend':
              value = campaign.spend || 0
              break
            case 'roas':
              value = campaign.roas || 0
              break
            case 'ctr':
              value = campaign.ctr || 0
              break
            case 'conversions':
              value = campaign.conversions || 0
              break
            case 'cpa':
              value = campaign.spend && campaign.conversions 
                ? campaign.spend / campaign.conversions 
                : 0
              break
          }

          if (rule.condition === 'above' && value > rule.threshold) {
            shouldTrigger = true
          } else if (rule.condition === 'below' && value < rule.threshold && value > 0) {
            shouldTrigger = true
          }

          if (shouldTrigger) {
            const alert: Alert = {
              id: `${Date.now()}-${Math.random()}`,
              ruleId: rule.id,
              campaignId: campaign.id,
              campaignName: campaign.name,
              message: generateAlertMessage(rule, campaign, value),
              value,
              timestamp: new Date().toISOString(),
              severity: rule.severity,
              acknowledged: false
            }
            newAlerts.push(alert)
          }
        })
      })

      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 100)) // Keep last 100 alerts
        
        // Show toast notifications for high severity alerts
        newAlerts
          .filter(alert => alert.severity === 'high')
          .forEach(alert => {
            toast.error(alert.message, {
              duration: 5000,
              action: {
                label: 'View',
                onClick: () => setShowSettings(false)
              }
            })
          })
      }
    }

    // Check alerts on mount and when campaigns change
    checkAlerts()

    // Set up interval to check alerts every minute
    const interval = setInterval(checkAlerts, 60000)
    return () => clearInterval(interval)
  }, [campaigns, alertRules])

  const generateAlertMessage = (rule: AlertRule, campaign: any, value: number): string => {
    const metricLabels = {
      spend: 'Spend',
      roas: 'ROAS',
      ctr: 'CTR',
      conversions: 'Conversions',
      cpa: 'CPA'
    }

    const metric = metricLabels[rule.type]
    const formattedValue = rule.type === 'spend' || rule.type === 'cpa' 
      ? `$${value.toFixed(2)}`
      : rule.type === 'ctr'
      ? `${value.toFixed(2)}%`
      : value.toFixed(2)

    return `${campaign.name}: ${metric} is ${rule.condition} threshold (${formattedValue})`
  }

  const toggleRule = (ruleId: string) => {
    setAlertRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    )
  }

  const addRule = () => {
    if (!newRule.name || !newRule.threshold) {
      toast.error('Please fill in all fields')
      return
    }

    const rule: AlertRule = {
      id: Date.now().toString(),
      name: newRule.name,
      type: newRule.type!,
      condition: newRule.condition!,
      threshold: newRule.threshold,
      enabled: newRule.enabled!,
      severity: newRule.severity!
    }

    setAlertRules(prev => [...prev, rule])
    setNewRule({
      type: 'spend',
      condition: 'above',
      threshold: 0,
      severity: 'medium',
      enabled: true
    })
    toast.success('Alert rule added')
  }

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    )
  }

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'medium':
        return <TrendingDown className="h-4 w-4 text-yellow-500" />
      default:
        return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200'
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200'
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Smart Alerts
              </CardTitle>
              <CardDescription>
                Automated monitoring for campaign performance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {unacknowledgedCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {unacknowledgedCount} new
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alert Rules Settings */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alert Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Rules */}
            <div className="space-y-2">
              {alertRules.map(rule => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {rule.type.toUpperCase()} {rule.condition} {rule.threshold}
                      </p>
                    </div>
                  </div>
                  <Badge variant={rule.enabled ? "default" : "secondary"}>
                    {rule.severity}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Add New Rule */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Add New Rule</h4>
              <div className="space-y-3">
                <Input
                  placeholder="Rule name"
                  value={newRule.name || ''}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    className="px-3 py-2 rounded-md border"
                    value={newRule.type}
                    onChange={(e) => setNewRule({ ...newRule, type: e.target.value as any })}
                  >
                    <option value="spend">Spend</option>
                    <option value="roas">ROAS</option>
                    <option value="ctr">CTR</option>
                    <option value="cpa">CPA</option>
                    <option value="conversions">Conversions</option>
                  </select>
                  <select
                    className="px-3 py-2 rounded-md border"
                    value={newRule.condition}
                    onChange={(e) => setNewRule({ ...newRule, condition: e.target.value as any })}
                  >
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                  </select>
                  <Input
                    type="number"
                    placeholder="Threshold"
                    value={newRule.threshold || ''}
                    onChange={(e) => setNewRule({ ...newRule, threshold: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <select
                    className="px-3 py-2 rounded-md border"
                    value={newRule.severity}
                    onChange={(e) => setNewRule({ ...newRule, severity: e.target.value as any })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <Button onClick={addRule} size="sm">
                    Add Rule
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Alerts</CardTitle>
          <CardDescription>
            {alerts.length === 0 
              ? "No alerts triggered" 
              : `${unacknowledgedCount} unacknowledged alerts`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Bell className="h-8 w-8 mb-2" />
                <p>All campaigns are performing within thresholds</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border transition-all ${
                      getSeverityColor(alert.severity)
                    } ${alert.acknowledged ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(alert.severity)}
                        <div>
                          <p className="font-medium text-sm">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
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