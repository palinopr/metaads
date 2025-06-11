import { EventEmitter } from 'events'

export interface AlertRule {
  id: string
  name: string
  description: string
  enabled: boolean
  metric: string
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'percentage_change'
  threshold: number
  timeWindow?: number // in minutes
  severity: 'info' | 'warning' | 'error' | 'critical'
  cooldown?: number // in minutes, prevent alert spam
  actions: AlertAction[]
  metadata?: Record<string, any>
}

export interface AlertAction {
  type: 'notification' | 'email' | 'webhook' | 'auto_pause' | 'auto_adjust'
  config: Record<string, any>
}

export interface Alert {
  id: string
  ruleId: string
  ruleName: string
  campaignId?: string
  campaignName?: string
  metric: string
  currentValue: number
  threshold: number
  severity: AlertRule['severity']
  message: string
  timestamp: Date
  acknowledged: boolean
  resolvedAt?: Date
  metadata?: Record<string, any>
}

export interface MetricSnapshot {
  campaignId: string
  metric: string
  value: number
  timestamp: Date
}

export class AlertsEngine extends EventEmitter {
  private rules: Map<string, AlertRule> = new Map()
  private activeAlerts: Map<string, Alert> = new Map()
  private metricHistory: Map<string, MetricSnapshot[]> = new Map()
  private cooldowns: Map<string, Date> = new Map()

  constructor() {
    super()
    this.initializeDefaultRules()
  }

  private initializeDefaultRules() {
    // Budget alerts
    this.addRule({
      id: 'budget_80',
      name: 'Budget 80% Consumed',
      description: 'Alert when campaign budget reaches 80%',
      enabled: true,
      metric: 'budget_consumed_percentage',
      condition: 'greater_than',
      threshold: 80,
      severity: 'warning',
      cooldown: 60,
      actions: [
        { type: 'notification', config: { title: 'Budget Warning', priority: 'high' } }
      ]
    })

    this.addRule({
      id: 'budget_95',
      name: 'Budget 95% Consumed',
      description: 'Critical alert when campaign budget reaches 95%',
      enabled: true,
      metric: 'budget_consumed_percentage',
      condition: 'greater_than',
      threshold: 95,
      severity: 'critical',
      cooldown: 30,
      actions: [
        { type: 'notification', config: { title: 'Budget Critical', priority: 'urgent' } },
        { type: 'email', config: { template: 'budget_critical' } }
      ]
    })

    // Performance alerts
    this.addRule({
      id: 'cpc_spike',
      name: 'CPC Spike Detection',
      description: 'Alert when CPC increases by more than 50%',
      enabled: true,
      metric: 'cpc',
      condition: 'percentage_change',
      threshold: 50,
      timeWindow: 60,
      severity: 'warning',
      cooldown: 120,
      actions: [
        { type: 'notification', config: { title: 'CPC Spike Detected' } }
      ]
    })

    this.addRule({
      id: 'roas_drop',
      name: 'ROAS Drop Alert',
      description: 'Alert when ROAS falls below 1.5',
      enabled: true,
      metric: 'roas',
      condition: 'less_than',
      threshold: 1.5,
      severity: 'error',
      cooldown: 60,
      actions: [
        { type: 'notification', config: { title: 'Low ROAS Alert' } },
        { type: 'webhook', config: { url: '/api/alerts/roas-drop' } }
      ]
    })

    this.addRule({
      id: 'ctr_drop',
      name: 'CTR Performance Alert',
      description: 'Alert when CTR drops below 1%',
      enabled: true,
      metric: 'ctr',
      condition: 'less_than',
      threshold: 1,
      severity: 'warning',
      cooldown: 90,
      actions: [
        { type: 'notification', config: { title: 'Low CTR Alert' } }
      ]
    })

    // Delivery alerts
    this.addRule({
      id: 'no_impressions',
      name: 'No Impressions Alert',
      description: 'Alert when campaign has 0 impressions for 2 hours',
      enabled: true,
      metric: 'impressions',
      condition: 'equals',
      threshold: 0,
      timeWindow: 120,
      severity: 'error',
      cooldown: 240,
      actions: [
        { type: 'notification', config: { title: 'Campaign Not Delivering' } },
        { type: 'email', config: { template: 'delivery_issue' } }
      ]
    })

    // Conversion alerts
    this.addRule({
      id: 'high_cpa',
      name: 'High CPA Alert',
      description: 'Alert when CPA exceeds target by 25%',
      enabled: true,
      metric: 'cpa',
      condition: 'percentage_change',
      threshold: 25,
      severity: 'warning',
      cooldown: 60,
      actions: [
        { type: 'notification', config: { title: 'CPA Above Target' } }
      ]
    })
  }

  public addRule(rule: AlertRule) {
    this.rules.set(rule.id, rule)
    this.emit('rule-added', rule)
  }

  public updateRule(ruleId: string, updates: Partial<AlertRule>) {
    const rule = this.rules.get(ruleId)
    if (rule) {
      const updatedRule = { ...rule, ...updates }
      this.rules.set(ruleId, updatedRule)
      this.emit('rule-updated', updatedRule)
    }
  }

  public deleteRule(ruleId: string) {
    const deleted = this.rules.delete(ruleId)
    if (deleted) {
      this.emit('rule-deleted', ruleId)
    }
  }

  public processMetric(snapshot: MetricSnapshot) {
    // Store metric history
    const key = `${snapshot.campaignId}:${snapshot.metric}`
    if (!this.metricHistory.has(key)) {
      this.metricHistory.set(key, [])
    }
    
    const history = this.metricHistory.get(key)!
    history.push(snapshot)
    
    // Keep only last 24 hours of data
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const filtered = history.filter(h => h.timestamp > cutoff)
    this.metricHistory.set(key, filtered)

    // Check all enabled rules
    this.rules.forEach(rule => {
      if (rule.enabled && rule.metric === snapshot.metric) {
        this.evaluateRule(rule, snapshot)
      }
    })
  }

  private evaluateRule(rule: AlertRule, snapshot: MetricSnapshot) {
    const cooldownKey = `${rule.id}:${snapshot.campaignId}`
    const cooldownUntil = this.cooldowns.get(cooldownKey)
    
    if (cooldownUntil && cooldownUntil > new Date()) {
      return // Still in cooldown period
    }

    let shouldAlert = false
    let message = ''

    switch (rule.condition) {
      case 'greater_than':
        shouldAlert = snapshot.value > rule.threshold
        message = `${rule.metric} (${snapshot.value}) exceeds threshold (${rule.threshold})`
        break

      case 'less_than':
        shouldAlert = snapshot.value < rule.threshold
        message = `${rule.metric} (${snapshot.value}) is below threshold (${rule.threshold})`
        break

      case 'equals':
        shouldAlert = snapshot.value === rule.threshold
        if (rule.timeWindow) {
          // Check if value has been equal for the time window
          shouldAlert = this.checkTimeWindow(snapshot, rule)
        }
        message = `${rule.metric} equals ${rule.threshold}`
        break

      case 'percentage_change':
        const change = this.calculatePercentageChange(snapshot, rule.timeWindow || 60)
        shouldAlert = Math.abs(change) > rule.threshold
        message = `${rule.metric} changed by ${change.toFixed(1)}% (threshold: ${rule.threshold}%)`
        break
    }

    if (shouldAlert) {
      this.triggerAlert(rule, snapshot, message)
    } else {
      // Check if we should resolve an existing alert
      this.checkAlertResolution(rule, snapshot)
    }
  }

  private checkTimeWindow(snapshot: MetricSnapshot, rule: AlertRule): boolean {
    if (!rule.timeWindow) return true

    const key = `${snapshot.campaignId}:${snapshot.metric}`
    const history = this.metricHistory.get(key) || []
    const windowStart = new Date(Date.now() - rule.timeWindow * 60 * 1000)
    
    const windowData = history.filter(h => h.timestamp > windowStart)
    return windowData.every(h => this.evaluateCondition(h.value, rule.condition, rule.threshold))
  }

  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'greater_than': return value > threshold
      case 'less_than': return value < threshold
      case 'equals': return value === threshold
      case 'not_equals': return value !== threshold
      default: return false
    }
  }

  private calculatePercentageChange(snapshot: MetricSnapshot, timeWindowMinutes: number): number {
    const key = `${snapshot.campaignId}:${snapshot.metric}`
    const history = this.metricHistory.get(key) || []
    
    const compareTime = new Date(snapshot.timestamp.getTime() - timeWindowMinutes * 60 * 1000)
    const comparePoint = history
      .filter(h => h.timestamp <= compareTime)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
    
    if (!comparePoint || comparePoint.value === 0) return 0
    
    return ((snapshot.value - comparePoint.value) / comparePoint.value) * 100
  }

  private triggerAlert(rule: AlertRule, snapshot: MetricSnapshot, message: string) {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      campaignId: snapshot.campaignId,
      metric: snapshot.metric,
      currentValue: snapshot.value,
      threshold: rule.threshold,
      severity: rule.severity,
      message,
      timestamp: new Date(),
      acknowledged: false,
      metadata: {
        ...rule.metadata,
        ...snapshot
      }
    }

    this.activeAlerts.set(alert.id, alert)
    
    // Set cooldown
    if (rule.cooldown) {
      const cooldownKey = `${rule.id}:${snapshot.campaignId}`
      this.cooldowns.set(cooldownKey, new Date(Date.now() + rule.cooldown * 60 * 1000))
    }

    // Execute actions
    rule.actions.forEach(action => {
      this.executeAction(action, alert)
    })

    this.emit('alert-triggered', alert)
  }

  private checkAlertResolution(rule: AlertRule, snapshot: MetricSnapshot) {
    const activeAlertsForRule = Array.from(this.activeAlerts.values())
      .filter(alert => 
        alert.ruleId === rule.id && 
        alert.campaignId === snapshot.campaignId &&
        !alert.resolvedAt
      )

    activeAlertsForRule.forEach(alert => {
      let isResolved = false

      switch (rule.condition) {
        case 'greater_than':
          isResolved = snapshot.value <= rule.threshold
          break
        case 'less_than':
          isResolved = snapshot.value >= rule.threshold
          break
        case 'equals':
          isResolved = snapshot.value !== rule.threshold
          break
      }

      if (isResolved) {
        alert.resolvedAt = new Date()
        this.emit('alert-resolved', alert)
      }
    })
  }

  private executeAction(action: AlertAction, alert: Alert) {
    switch (action.type) {
      case 'notification':
        this.emit('send-notification', {
          ...action.config,
          alert
        })
        break

      case 'email':
        this.emit('send-email', {
          ...action.config,
          alert
        })
        break

      case 'webhook':
        this.emit('webhook', {
          url: action.config.url,
          payload: alert
        })
        break

      case 'auto_pause':
        this.emit('auto-pause-campaign', {
          campaignId: alert.campaignId,
          reason: alert.message
        })
        break

      case 'auto_adjust':
        this.emit('auto-adjust-campaign', {
          campaignId: alert.campaignId,
          metric: alert.metric,
          currentValue: alert.currentValue,
          config: action.config
        })
        break
    }
  }

  public acknowledgeAlert(alertId: string) {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.acknowledged = true
      this.emit('alert-acknowledged', alert)
    }
  }

  public getActiveAlerts(campaignId?: string): Alert[] {
    const alerts = Array.from(this.activeAlerts.values())
      .filter(alert => !alert.resolvedAt)
    
    if (campaignId) {
      return alerts.filter(alert => alert.campaignId === campaignId)
    }
    
    return alerts
  }

  public getRules(): AlertRule[] {
    return Array.from(this.rules.values())
  }

  public getMetricHistory(campaignId: string, metric: string, hoursBack: number = 24): MetricSnapshot[] {
    const key = `${campaignId}:${metric}`
    const history = this.metricHistory.get(key) || []
    const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000)
    
    return history.filter(h => h.timestamp > cutoff)
  }
}

// Singleton instance
export const alertsEngine = new AlertsEngine()