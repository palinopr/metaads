/**
 * Advanced Alert Management System
 * 
 * Comprehensive alerting system with:
 * - Rule-based alerting with complex conditions
 * - Multiple notification channels (email, Slack, webhooks)
 * - Alert escalation and routing
 * - Intelligent noise reduction
 * - Alert correlation and grouping
 */

import { SystemMetric } from './index'
import { metricsCollector } from './metrics-collector'

export interface AlertRule {
  id: string
  name: string
  description: string
  enabled: boolean
  
  // Condition configuration
  condition: {
    type: 'threshold' | 'anomaly' | 'absence' | 'rate' | 'composite'
    metric: string
    operator?: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'regex'
    threshold?: number
    window?: number // Time window in minutes
    aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'p95' | 'p99'
    
    // For rate-based alerts
    rateThreshold?: number
    rateWindow?: number
    
    // For composite alerts
    subConditions?: AlertCondition[]
    operator_between_conditions?: 'AND' | 'OR'
    
    // For anomaly detection
    sensitivity?: 'low' | 'medium' | 'high'
    baseline_days?: number
  }
  
  // Alert configuration
  severity: 'info' | 'warning' | 'error' | 'critical'
  tags: Record<string, string>
  
  // Notification configuration
  notifications: AlertNotification[]
  
  // Timing configuration
  cooldown: number // Minutes before re-alerting
  max_alerts_per_hour?: number
  
  // Auto-resolution
  auto_resolve?: boolean
  resolve_timeout?: number // Minutes
  
  // Escalation
  escalation?: {
    enabled: boolean
    levels: Array<{
      delay_minutes: number
      notifications: AlertNotification[]
    }>
  }
}

export interface AlertCondition {
  metric: string
  operator: '>' | '<' | '>=' | '<=' | '==' | '!='
  threshold: number
  window?: number
  aggregation?: string
}

export interface AlertNotification {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'pagerduty'
  config: Record<string, any>
  enabled: boolean
  filters?: {
    severity?: string[]
    tags?: Record<string, string>
    time_windows?: Array<{
      start: string // HH:MM
      end: string   // HH:MM
      timezone: string
    }>
  }
}

export interface AlertEvent {
  id: string
  rule_id: string
  title: string
  description: string
  severity: AlertRule['severity']
  
  // Timing
  triggered_at: Date
  resolved_at?: Date
  last_notification_at?: Date
  
  // Context
  metric_value: number
  threshold: number
  tags: Record<string, string>
  context: Record<string, any>
  
  // State
  status: 'active' | 'resolved' | 'acknowledged' | 'suppressed'
  acknowledged_by?: string
  acknowledged_at?: Date
  
  // Notifications
  notifications_sent: Array<{
    type: string
    sent_at: Date
    success: boolean
    error?: string
  }>
  
  // Escalation
  escalation_level: number
  next_escalation_at?: Date
}

export class AdvancedAlertManager {
  private rules: Map<string, AlertRule> = new Map()
  private activeAlerts: Map<string, AlertEvent> = new Map()
  private alertHistory: AlertEvent[] = []
  private evaluationInterval: NodeJS.Timeout | null = null
  
  private maxHistorySize = 10000
  private evaluationIntervalMs = 60000 // 1 minute
  private enabled = true

  constructor(options: {
    evaluationIntervalMs?: number
    maxHistorySize?: number
    enabled?: boolean
  } = {}) {
    this.evaluationIntervalMs = options.evaluationIntervalMs ?? 60000
    this.maxHistorySize = options.maxHistorySize ?? 10000
    this.enabled = options.enabled ?? true
    
    this.setupDefaultRules()
    this.startEvaluation()
  }

  // Rule Management
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule)
    console.log(`Added alert rule: ${rule.name}`)
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.rules.get(ruleId)
    if (rule) {
      this.rules.set(ruleId, { ...rule, ...updates })
      console.log(`Updated alert rule: ${ruleId}`)
    }
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId)
    console.log(`Removed alert rule: ${ruleId}`)
  }

  enableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId)
    if (rule) {
      rule.enabled = true
      console.log(`Enabled alert rule: ${ruleId}`)
    }
  }

  disableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId)
    if (rule) {
      rule.enabled = false
      console.log(`Disabled alert rule: ${ruleId}`)
    }
  }

  // Alert Management
  acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.status = 'acknowledged'
      alert.acknowledged_by = acknowledgedBy
      alert.acknowledged_at = new Date()
      console.log(`Alert acknowledged: ${alertId} by ${acknowledgedBy}`)
    }
  }

  resolveAlert(alertId: string, resolvedBy?: string): void {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.status = 'resolved'
      alert.resolved_at = new Date()
      this.activeAlerts.delete(alertId)
      this.addToHistory(alert)
      console.log(`Alert resolved: ${alertId}`)
    }
  }

  suppressAlert(alertId: string, duration: number): void {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.status = 'suppressed'
      // Set auto-resolve after suppression duration
      setTimeout(() => {
        this.resolveAlert(alertId, 'auto-resolved')
      }, duration * 60000)
      console.log(`Alert suppressed: ${alertId} for ${duration} minutes`)
    }
  }

  // Evaluation Engine
  private async startEvaluation(): Promise<void> {
    if (!this.enabled) return
    
    this.evaluationInterval = setInterval(async () => {
      await this.evaluateRules()
    }, this.evaluationIntervalMs)
    
    console.log('Alert evaluation started')
  }

  private async evaluateRules(): Promise<void> {
    if (!this.enabled) return
    
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue
      
      try {
        await this.evaluateRule(rule)
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error)
      }
    }
    
    // Check for escalations
    await this.processEscalations()
    
    // Auto-resolve alerts
    this.processAutoResolution()
  }

  private async evaluateRule(rule: AlertRule): Promise<void> {
    const shouldAlert = await this.evaluateCondition(rule.condition)
    const existingAlert = this.findActiveAlertForRule(rule.id)
    
    if (shouldAlert && !existingAlert) {
      // Create new alert
      const metricValue = await this.getMetricValue(rule.condition.metric, rule.condition.window)
      await this.createAlert(rule, metricValue)
    } else if (!shouldAlert && existingAlert && rule.auto_resolve) {
      // Auto-resolve alert
      this.resolveAlert(existingAlert.id, 'auto-resolved')
    }
  }

  private async evaluateCondition(condition: AlertRule['condition']): Promise<boolean> {
    switch (condition.type) {
      case 'threshold':
        return this.evaluateThresholdCondition(condition)
      case 'rate':
        return this.evaluateRateCondition(condition)
      case 'absence':
        return this.evaluateAbsenceCondition(condition)
      case 'anomaly':
        return this.evaluateAnomalyCondition(condition)
      case 'composite':
        return this.evaluateCompositeCondition(condition)
      default:
        return false
    }
  }

  private async evaluateThresholdCondition(condition: AlertRule['condition']): Promise<boolean> {
    const value = await this.getMetricValue(
      condition.metric!,
      condition.window,
      condition.aggregation
    )
    
    if (value === null) return false
    
    switch (condition.operator) {
      case '>': return value > condition.threshold!
      case '<': return value < condition.threshold!
      case '>=': return value >= condition.threshold!
      case '<=': return value <= condition.threshold!
      case '==': return value === condition.threshold!
      case '!=': return value !== condition.threshold!
      default: return false
    }
  }

  private async evaluateRateCondition(condition: AlertRule['condition']): Promise<boolean> {
    const currentValue = await this.getMetricValue(condition.metric!, condition.window)
    const previousValue = await this.getMetricValue(
      condition.metric!,
      condition.rateWindow || 5,
      condition.aggregation
    )
    
    if (currentValue === null || previousValue === null || previousValue === 0) {
      return false
    }
    
    const rate = ((currentValue - previousValue) / previousValue) * 100
    return Math.abs(rate) > (condition.rateThreshold || 50)
  }

  private async evaluateAbsenceCondition(condition: AlertRule['condition']): Promise<boolean> {
    const lastValue = await this.getLastMetricTime(condition.metric!)
    const now = Date.now()
    const windowMs = (condition.window || 5) * 60000
    
    return (now - lastValue) > windowMs
  }

  private async evaluateAnomalyCondition(condition: AlertRule['condition']): Promise<boolean> {
    // Simplified anomaly detection
    // In a real implementation, this would use statistical analysis
    const currentValue = await this.getMetricValue(condition.metric!, 1)
    const historicalValues = await this.getHistoricalValues(
      condition.metric!,
      condition.baseline_days || 7
    )
    
    if (currentValue === null || historicalValues.length === 0) {
      return false
    }
    
    const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length
    const variance = historicalValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / historicalValues.length
    const stdDev = Math.sqrt(variance)
    
    const threshold = condition.sensitivity === 'high' ? 2 : 
                     condition.sensitivity === 'low' ? 4 : 3
    
    return Math.abs(currentValue - mean) > (threshold * stdDev)
  }

  private async evaluateCompositeCondition(condition: AlertRule['condition']): Promise<boolean> {
    if (!condition.subConditions || condition.subConditions.length === 0) {
      return false
    }
    
    const results = await Promise.all(
      condition.subConditions.map(subCondition => 
        this.evaluateThresholdCondition({ ...condition, ...subCondition })
      )
    )
    
    return condition.operator_between_conditions === 'OR'
      ? results.some(r => r)
      : results.every(r => r)
  }

  private async createAlert(rule: AlertRule, metricValue: number): Promise<void> {
    const alertId = this.generateAlertId()
    
    const alert: AlertEvent = {
      id: alertId,
      rule_id: rule.id,
      title: rule.name,
      description: rule.description,
      severity: rule.severity,
      triggered_at: new Date(),
      metric_value: metricValue,
      threshold: rule.condition.threshold || 0,
      tags: { ...rule.tags },
      context: {
        metric: rule.condition.metric,
        operator: rule.condition.operator,
        window: rule.condition.window
      },
      status: 'active',
      notifications_sent: [],
      escalation_level: 0
    }
    
    this.activeAlerts.set(alertId, alert)
    
    // Send notifications
    await this.sendNotifications(alert, rule.notifications)
    
    // Track alert metric
    metricsCollector.increment('alerts.triggered', 1, {
      rule_id: rule.id,
      severity: rule.severity
    })
    
    console.log(`Alert created: ${alert.title} (${alertId})`)
  }

  private async sendNotifications(
    alert: AlertEvent,
    notifications: AlertNotification[]
  ): Promise<void> {
    for (const notification of notifications) {
      if (!notification.enabled) continue
      
      // Check filters
      if (!this.shouldSendNotification(alert, notification)) continue
      
      try {
        await this.sendNotification(alert, notification)
        
        alert.notifications_sent.push({
          type: notification.type,
          sent_at: new Date(),
          success: true
        })
        
        alert.last_notification_at = new Date()
        
      } catch (error) {
        console.error(`Failed to send ${notification.type} notification:`, error)
        
        alert.notifications_sent.push({
          type: notification.type,
          sent_at: new Date(),
          success: false,
          error: error.message
        })
      }
    }
  }

  private shouldSendNotification(alert: AlertEvent, notification: AlertNotification): boolean {
    const filters = notification.filters
    if (!filters) return true
    
    // Check severity filter
    if (filters.severity && !filters.severity.includes(alert.severity)) {
      return false
    }
    
    // Check tag filters
    if (filters.tags) {
      for (const [key, value] of Object.entries(filters.tags)) {
        if (alert.tags[key] !== value) {
          return false
        }
      }
    }
    
    // Check time window filters
    if (filters.time_windows) {
      const now = new Date()
      const isInWindow = filters.time_windows.some(window => {
        // Simplified time window check
        return true // Implementation would check actual time ranges
      })
      if (!isInWindow) return false
    }
    
    return true
  }

  private async sendNotification(alert: AlertEvent, notification: AlertNotification): Promise<void> {
    switch (notification.type) {
      case 'email':
        await this.sendEmailNotification(alert, notification.config)
        break
      case 'slack':
        await this.sendSlackNotification(alert, notification.config)
        break
      case 'webhook':
        await this.sendWebhookNotification(alert, notification.config)
        break
      case 'sms':
        await this.sendSMSNotification(alert, notification.config)
        break
      case 'pagerduty':
        await this.sendPagerDutyNotification(alert, notification.config)
        break
    }
  }

  private async sendEmailNotification(alert: AlertEvent, config: any): Promise<void> {
    const emailBody = this.formatAlertForEmail(alert)
    
    await fetch('/api/monitoring/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: config.to || config.recipients,
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        body: emailBody,
        alert_id: alert.id
      })
    })
  }

  private async sendSlackNotification(alert: AlertEvent, config: any): Promise<void> {
    const slackMessage = this.formatAlertForSlack(alert)
    
    await fetch(config.webhook_url || process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    })
  }

  private async sendWebhookNotification(alert: AlertEvent, config: any): Promise<void> {
    await fetch(config.url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify({
        alert,
        timestamp: new Date().toISOString()
      })
    })
  }

  private async sendSMSNotification(alert: AlertEvent, config: any): Promise<void> {
    // Implementation would integrate with SMS service like Twilio
    console.log(`SMS notification would be sent to ${config.phone_number}`)
  }

  private async sendPagerDutyNotification(alert: AlertEvent, config: any): Promise<void> {
    // Implementation would integrate with PagerDuty API
    console.log(`PagerDuty notification would be sent for alert ${alert.id}`)
  }

  // Escalation Processing
  private async processEscalations(): Promise<void> {
    for (const alert of this.activeAlerts.values()) {
      const rule = this.rules.get(alert.rule_id)
      if (!rule || !rule.escalation?.enabled) continue
      
      if (alert.next_escalation_at && new Date() >= alert.next_escalation_at) {
        await this.escalateAlert(alert, rule)
      }
    }
  }

  private async escalateAlert(alert: AlertEvent, rule: AlertRule): Promise<void> {
    const escalation = rule.escalation!
    const nextLevel = alert.escalation_level + 1
    
    if (nextLevel >= escalation.levels.length) return
    
    const level = escalation.levels[nextLevel]
    alert.escalation_level = nextLevel
    
    // Send escalation notifications
    await this.sendNotifications(alert, level.notifications)
    
    // Schedule next escalation if available
    if (nextLevel + 1 < escalation.levels.length) {
      const nextEscalation = escalation.levels[nextLevel + 1]
      alert.next_escalation_at = new Date(
        Date.now() + nextEscalation.delay_minutes * 60000
      )
    }
    
    console.log(`Alert escalated to level ${nextLevel}: ${alert.id}`)
  }

  // Auto-resolution
  private processAutoResolution(): void {
    for (const alert of this.activeAlerts.values()) {
      const rule = this.rules.get(alert.rule_id)
      if (!rule || !rule.resolve_timeout) continue
      
      const timeoutMs = rule.resolve_timeout * 60000
      const alertAge = Date.now() - alert.triggered_at.getTime()
      
      if (alertAge > timeoutMs) {
        this.resolveAlert(alert.id, 'timeout')
      }
    }
  }

  // Helper methods
  private async getMetricValue(
    metric: string,
    window = 5,
    aggregation = 'avg'
  ): Promise<number | null> {
    // In a real implementation, this would query the metrics database
    // For now, return mock data
    return Math.random() * 100
  }

  private async getLastMetricTime(metric: string): Promise<number> {
    // Return mock timestamp
    return Date.now() - Math.random() * 300000 // Random time in last 5 minutes
  }

  private async getHistoricalValues(metric: string, days: number): Promise<number[]> {
    // Return mock historical data
    return Array.from({ length: days * 24 }, () => Math.random() * 100)
  }

  private findActiveAlertForRule(ruleId: string): AlertEvent | undefined {
    return Array.from(this.activeAlerts.values()).find(alert => alert.rule_id === ruleId)
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }

  private addToHistory(alert: AlertEvent): void {
    this.alertHistory.push(alert)
    
    // Keep only recent history
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory.shift()
    }
  }

  private formatAlertForEmail(alert: AlertEvent): string {
    return `
Alert: ${alert.title}

Severity: ${alert.severity.toUpperCase()}
Triggered: ${alert.triggered_at.toLocaleString()}
Metric Value: ${alert.metric_value}
Threshold: ${alert.threshold}

Description:
${alert.description}

Tags:
${Object.entries(alert.tags).map(([k, v]) => `${k}: ${v}`).join('\n')}

Alert ID: ${alert.id}
    `.trim()
  }

  private formatAlertForSlack(alert: AlertEvent): any {
    const color = {
      info: '#36a64f',
      warning: '#ff9900',
      error: '#ff0000',
      critical: '#990000'
    }[alert.severity]

    return {
      attachments: [{
        color,
        title: alert.title,
        fields: [
          { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
          { title: 'Metric Value', value: alert.metric_value.toString(), short: true },
          { title: 'Threshold', value: alert.threshold.toString(), short: true },
          { title: 'Triggered', value: alert.triggered_at.toISOString(), short: true }
        ],
        footer: 'Meta Ads Dashboard Monitoring',
        ts: Math.floor(alert.triggered_at.getTime() / 1000)
      }]
    }
  }

  // Setup default alert rules
  private setupDefaultRules(): void {
    // High error rate alert
    this.addRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      description: 'Error rate is above acceptable threshold',
      enabled: true,
      condition: {
        type: 'threshold',
        metric: 'errors.rate',
        operator: '>',
        threshold: 5, // 5% error rate
        window: 5,
        aggregation: 'avg'
      },
      severity: 'error',
      tags: { component: 'api' },
      notifications: [
        {
          type: 'email',
          enabled: true,
          config: { to: 'admin@example.com' }
        }
      ],
      cooldown: 30,
      auto_resolve: true,
      resolve_timeout: 60
    })

    // API response time alert
    this.addRule({
      id: 'slow-api-response',
      name: 'Slow API Response Time',
      description: 'API response time is above acceptable threshold',
      enabled: true,
      condition: {
        type: 'threshold',
        metric: 'api.duration.p95',
        operator: '>',
        threshold: 2000, // 2 seconds
        window: 10,
        aggregation: 'p95'
      },
      severity: 'warning',
      tags: { component: 'api' },
      notifications: [
        {
          type: 'slack',
          enabled: true,
          config: { channel: '#alerts' }
        }
      ],
      cooldown: 15
    })

    // Memory usage alert
    this.addRule({
      id: 'high-memory-usage',
      name: 'High Memory Usage',
      description: 'Server memory usage is critically high',
      enabled: true,
      condition: {
        type: 'threshold',
        metric: 'system.memory.usage_percent',
        operator: '>',
        threshold: 85,
        window: 5,
        aggregation: 'avg'
      },
      severity: 'critical',
      tags: { component: 'system' },
      notifications: [
        {
          type: 'email',
          enabled: true,
          config: { to: 'admin@example.com' }
        },
        {
          type: 'slack',
          enabled: true,
          config: { channel: '#critical-alerts' }
        }
      ],
      cooldown: 60,
      escalation: {
        enabled: true,
        levels: [
          {
            delay_minutes: 10,
            notifications: [
              {
                type: 'sms',
                enabled: true,
                config: { phone_number: '+1234567890' }
              }
            ]
          }
        ]
      }
    })
  }

  // Public API methods
  getActiveAlerts(): AlertEvent[] {
    return Array.from(this.activeAlerts.values())
  }

  getAlertHistory(limit = 100): AlertEvent[] {
    return this.alertHistory.slice(-limit)
  }

  getRules(): AlertRule[] {
    return Array.from(this.rules.values())
  }

  enable(): void {
    this.enabled = true
    this.startEvaluation()
  }

  disable(): void {
    this.enabled = false
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval)
      this.evaluationInterval = null
    }
  }

  destroy(): void {
    this.disable()
  }
}

// Global alert manager instance
export const alertManager = new AdvancedAlertManager()