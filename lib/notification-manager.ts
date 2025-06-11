import { toast } from "@/components/ui/use-toast"

export interface NotificationChannel {
  id: string
  name: string
  type: 'email' | 'slack' | 'webhook' | 'in-app'
  enabled: boolean
  config: Record<string, any>
}

export interface NotificationPreferences {
  channels: NotificationChannel[]
  rules: NotificationRule[]
  defaults: {
    critical: string[]
    warning: string[]
    info: string[]
  }
}

export interface NotificationRule {
  id: string
  name: string
  trigger: {
    type: 'threshold' | 'anomaly' | 'scheduled' | 'event'
    condition: string
    value?: number
    metric?: string
  }
  channels: string[]
  priority: 'critical' | 'warning' | 'info'
  enabled: boolean
}

export class NotificationManager {
  private static instance: NotificationManager
  private preferences: NotificationPreferences
  
  private constructor() {
    this.preferences = this.loadPreferences()
  }
  
  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }
  
  private loadPreferences(): NotificationPreferences {
    const saved = localStorage.getItem('notification-preferences')
    if (saved) {
      return JSON.parse(saved)
    }
    
    return {
      channels: [
        {
          id: 'in-app',
          name: 'In-App Notifications',
          type: 'in-app',
          enabled: true,
          config: {}
        }
      ],
      rules: [],
      defaults: {
        critical: ['in-app'],
        warning: ['in-app'],
        info: ['in-app']
      }
    }
  }
  
  savePreferences(preferences: NotificationPreferences) {
    this.preferences = preferences
    localStorage.setItem('notification-preferences', JSON.stringify(preferences))
  }
  
  getPreferences(): NotificationPreferences {
    return this.preferences
  }
  
  async sendNotification(
    title: string,
    message: string,
    priority: 'critical' | 'warning' | 'info' = 'info',
    channels?: string[],
    data?: any
  ) {
    const targetChannels = channels || this.preferences.defaults[priority]
    
    for (const channelId of targetChannels) {
      const channel = this.preferences.channels.find(c => c.id === channelId)
      if (!channel || !channel.enabled) continue
      
      try {
        await this.sendToChannel(channel, title, message, priority, data)
      } catch (error) {
        console.error(`Failed to send notification to ${channel.name}:`, error)
      }
    }
  }
  
  private async sendToChannel(
    channel: NotificationChannel,
    title: string,
    message: string,
    priority: string,
    data?: any
  ) {
    switch (channel.type) {
      case 'in-app':
        this.sendInAppNotification(title, message, priority)
        break
        
      case 'email':
        await this.sendEmailNotification(channel, title, message, data)
        break
        
      case 'slack':
        await this.sendSlackNotification(channel, title, message, priority, data)
        break
        
      case 'webhook':
        await this.sendWebhookNotification(channel, title, message, priority, data)
        break
    }
  }
  
  private sendInAppNotification(title: string, message: string, priority: string) {
    toast({
      title,
      description: message,
      variant: priority === 'critical' ? 'destructive' : 'default'
    })
    
    // Store in notification center
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]')
    notifications.unshift({
      id: Date.now().toString(),
      title,
      message,
      priority,
      timestamp: new Date().toISOString(),
      read: false
    })
    localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, 100)))
  }
  
  private async sendEmailNotification(
    channel: NotificationChannel,
    title: string,
    message: string,
    data?: any
  ) {
    // Email sending would require backend integration
    const payload = {
      to: channel.config.recipients,
      subject: title,
      body: message,
      data,
      smtp: channel.config.smtp
    }
    
    // This would call your backend API
    console.log('Email notification:', payload)
  }
  
  private async sendSlackNotification(
    channel: NotificationChannel,
    title: string,
    message: string,
    priority: string,
    data?: any
  ) {
    const webhook = channel.config.webhookUrl
    if (!webhook) return
    
    const color = {
      critical: '#dc2626',
      warning: '#f59e0b',
      info: '#3b82f6'
    }[priority] || '#6b7280'
    
    const payload = {
      attachments: [{
        color,
        title,
        text: message,
        fields: data ? Object.entries(data).map(([k, v]) => ({
          title: k,
          value: String(v),
          short: true
        })) : undefined,
        ts: Math.floor(Date.now() / 1000)
      }]
    }
    
    try {
      // This would be a real API call in production
      console.log('Slack notification:', { webhook, payload })
    } catch (error) {
      console.error('Failed to send Slack notification:', error)
    }
  }
  
  private async sendWebhookNotification(
    channel: NotificationChannel,
    title: string,
    message: string,
    priority: string,
    data?: any
  ) {
    const url = channel.config.url
    if (!url) return
    
    const payload = {
      title,
      message,
      priority,
      timestamp: new Date().toISOString(),
      ...data
    }
    
    try {
      // This would be a real API call in production
      console.log('Webhook notification:', { url, payload })
    } catch (error) {
      console.error('Failed to send webhook notification:', error)
    }
  }
  
  async checkRules(metrics: Record<string, any>) {
    for (const rule of this.preferences.rules) {
      if (!rule.enabled) continue
      
      const triggered = await this.evaluateRule(rule, metrics)
      if (triggered) {
        await this.sendNotification(
          rule.name,
          `Rule triggered: ${rule.trigger.condition}`,
          rule.priority,
          rule.channels,
          { rule, metrics }
        )
      }
    }
  }
  
  private async evaluateRule(rule: NotificationRule, metrics: Record<string, any>): Promise<boolean> {
    switch (rule.trigger.type) {
      case 'threshold':
        if (!rule.trigger.metric || !rule.trigger.value) return false
        const value = metrics[rule.trigger.metric]
        if (value === undefined) return false
        
        switch (rule.trigger.condition) {
          case 'greater_than':
            return value > rule.trigger.value
          case 'less_than':
            return value < rule.trigger.value
          case 'equals':
            return value === rule.trigger.value
          default:
            return false
        }
        
      case 'anomaly':
        // Implement anomaly detection logic
        return false
        
      case 'event':
        // Check for specific events
        return false
        
      default:
        return false
    }
  }
}

export const notificationManager = NotificationManager.getInstance()