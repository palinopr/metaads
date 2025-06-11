import { notificationManager } from './notification-manager'

export interface AutomationRule {
  id: string
  name: string
  description?: string
  enabled: boolean
  trigger: RuleTrigger
  conditions: RuleCondition[]
  actions: RuleAction[]
  lastTriggered?: Date
  triggerCount: number
  cooldownMinutes?: number
}

export interface RuleTrigger {
  type: 'metric_threshold' | 'performance_change' | 'budget_limit' | 'schedule' | 'anomaly'
  metric?: string
  threshold?: number
  comparison?: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  timeframe?: string // e.g., '1h', '24h', '7d'
  schedule?: string // cron expression
}

export interface RuleCondition {
  type: 'and' | 'or'
  field: string
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'between' | 'in'
  value: any
}

export interface RuleAction {
  type: 'pause_campaign' | 'adjust_budget' | 'send_notification' | 'create_report' | 'webhook' | 'adjust_bid'
  parameters: Record<string, any>
}

export interface WorkflowStep {
  id: string
  name: string
  type: 'trigger' | 'condition' | 'action' | 'delay'
  config: Record<string, any>
  nextSteps: string[]
}

export interface Workflow {
  id: string
  name: string
  description?: string
  enabled: boolean
  steps: WorkflowStep[]
  startStepId: string
  lastRun?: Date
  runCount: number
}

export class AutomationEngine {
  private static instance: AutomationEngine
  private rules: AutomationRule[] = []
  private workflows: Workflow[] = []
  private ruleHistory: Map<string, Date> = new Map()
  
  private constructor() {
    this.loadRules()
    this.loadWorkflows()
  }
  
  static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine()
    }
    return AutomationEngine.instance
  }
  
  private loadRules() {
    const saved = localStorage.getItem('automation-rules')
    if (saved) {
      this.rules = JSON.parse(saved)
    } else {
      // Default rules
      this.rules = [
        {
          id: '1',
          name: 'High Spend Alert',
          description: 'Alert when daily spend exceeds budget',
          enabled: true,
          trigger: {
            type: 'metric_threshold',
            metric: 'daily_spend',
            threshold: 1000,
            comparison: 'gt'
          },
          conditions: [],
          actions: [
            {
              type: 'send_notification',
              parameters: {
                priority: 'warning',
                message: 'Daily spend has exceeded $1000'
              }
            }
          ],
          triggerCount: 0
        },
        {
          id: '2',
          name: 'Low ROAS Campaign Pause',
          description: 'Pause campaigns with ROAS below 1.5 for 7 days',
          enabled: false,
          trigger: {
            type: 'performance_change',
            metric: 'roas',
            threshold: 1.5,
            comparison: 'lt',
            timeframe: '7d'
          },
          conditions: [
            {
              type: 'and',
              field: 'spend',
              operator: 'gt',
              value: 100
            }
          ],
          actions: [
            {
              type: 'pause_campaign',
              parameters: {}
            },
            {
              type: 'send_notification',
              parameters: {
                priority: 'critical',
                message: 'Campaign paused due to low ROAS'
              }
            }
          ],
          triggerCount: 0
        }
      ]
    }
  }
  
  private loadWorkflows() {
    const saved = localStorage.getItem('automation-workflows')
    if (saved) {
      this.workflows = JSON.parse(saved)
    }
  }
  
  saveRules(rules: AutomationRule[]) {
    this.rules = rules
    localStorage.setItem('automation-rules', JSON.stringify(rules))
  }
  
  saveWorkflows(workflows: Workflow[]) {
    this.workflows = workflows
    localStorage.setItem('automation-workflows', JSON.stringify(workflows))
  }
  
  getRules(): AutomationRule[] {
    return this.rules
  }
  
  getWorkflows(): Workflow[] {
    return this.workflows
  }
  
  async evaluateRules(metrics: Record<string, any>, campaigns?: any[]) {
    for (const rule of this.rules) {
      if (!rule.enabled) continue
      
      // Check cooldown
      if (rule.cooldownMinutes) {
        const lastTriggered = this.ruleHistory.get(rule.id)
        if (lastTriggered) {
          const cooldownMs = rule.cooldownMinutes * 60 * 1000
          if (Date.now() - lastTriggered.getTime() < cooldownMs) {
            continue
          }
        }
      }
      
      const triggered = await this.evaluateTrigger(rule.trigger, metrics)
      if (triggered && this.evaluateConditions(rule.conditions, metrics)) {
        await this.executeActions(rule.actions, { metrics, campaigns, rule })
        
        // Update rule stats
        rule.lastTriggered = new Date()
        rule.triggerCount++
        this.ruleHistory.set(rule.id, new Date())
        this.saveRules(this.rules)
      }
    }
  }
  
  private async evaluateTrigger(trigger: RuleTrigger, metrics: Record<string, any>): Promise<boolean> {
    switch (trigger.type) {
      case 'metric_threshold':
        if (!trigger.metric || trigger.threshold === undefined) return false
        const value = metrics[trigger.metric]
        if (value === undefined) return false
        
        return this.compareValues(value, trigger.threshold, trigger.comparison || 'gt')
        
      case 'performance_change':
        // Implement performance change detection
        return false
        
      case 'budget_limit':
        // Check budget limits
        return metrics.spend_percentage > 0.9
        
      case 'anomaly':
        // Implement anomaly detection
        return false
        
      case 'schedule':
        // Check cron schedule
        return false
        
      default:
        return false
    }
  }
  
  private compareValues(value: number, threshold: number, comparison: string): boolean {
    switch (comparison) {
      case 'gt': return value > threshold
      case 'lt': return value < threshold
      case 'eq': return value === threshold
      case 'gte': return value >= threshold
      case 'lte': return value <= threshold
      default: return false
    }
  }
  
  private evaluateConditions(conditions: RuleCondition[], data: Record<string, any>): boolean {
    if (!conditions.length) return true
    
    for (const condition of conditions) {
      const value = data[condition.field]
      let met = false
      
      switch (condition.operator) {
        case 'equals':
          met = value === condition.value
          break
        case 'contains':
          met = String(value).includes(condition.value)
          break
        case 'gt':
          met = value > condition.value
          break
        case 'lt':
          met = value < condition.value
          break
        case 'between':
          met = value >= condition.value[0] && value <= condition.value[1]
          break
        case 'in':
          met = condition.value.includes(value)
          break
      }
      
      if (condition.type === 'and' && !met) return false
      if (condition.type === 'or' && met) return true
    }
    
    return true
  }
  
  private async executeActions(actions: RuleAction[], context: any) {
    for (const action of actions) {
      try {
        await this.executeAction(action, context)
      } catch (error) {
        console.error('Failed to execute action:', action, error)
        await notificationManager.sendNotification(
          'Automation Error',
          `Failed to execute action: ${action.type}`,
          'warning'
        )
      }
    }
  }
  
  private async executeAction(action: RuleAction, context: any) {
    switch (action.type) {
      case 'send_notification':
        await notificationManager.sendNotification(
          action.parameters.title || 'Automation Alert',
          action.parameters.message,
          action.parameters.priority || 'info',
          action.parameters.channels
        )
        break
        
      case 'pause_campaign':
        // Implement campaign pause logic
        console.log('Pausing campaign:', context.campaigns)
        break
        
      case 'adjust_budget':
        // Implement budget adjustment
        console.log('Adjusting budget:', action.parameters)
        break
        
      case 'adjust_bid':
        // Implement bid adjustment
        console.log('Adjusting bid:', action.parameters)
        break
        
      case 'create_report':
        // Trigger report generation
        console.log('Creating report:', action.parameters)
        break
        
      case 'webhook':
        // Send webhook
        console.log('Sending webhook:', action.parameters.url)
        break
    }
  }
  
  async runWorkflow(workflowId: string, initialData?: any) {
    const workflow = this.workflows.find(w => w.id === workflowId)
    if (!workflow || !workflow.enabled) return
    
    const context = {
      data: initialData || {},
      history: [] as string[]
    }
    
    await this.executeWorkflowStep(workflow, workflow.startStepId, context)
    
    workflow.lastRun = new Date()
    workflow.runCount++
    this.saveWorkflows(this.workflows)
  }
  
  private async executeWorkflowStep(
    workflow: Workflow,
    stepId: string,
    context: any
  ) {
    const step = workflow.steps.find(s => s.id === stepId)
    if (!step || context.history.includes(stepId)) return
    
    context.history.push(stepId)
    
    switch (step.type) {
      case 'trigger':
        // Evaluate trigger condition
        break
        
      case 'condition':
        // Evaluate condition and choose next step
        const conditionMet = this.evaluateConditions([step.config as RuleCondition], context.data)
        const nextStepId = conditionMet ? step.nextSteps[0] : step.nextSteps[1]
        if (nextStepId) {
          await this.executeWorkflowStep(workflow, nextStepId, context)
        }
        break
        
      case 'action':
        // Execute action
        await this.executeAction(step.config as RuleAction, context)
        for (const nextId of step.nextSteps) {
          await this.executeWorkflowStep(workflow, nextId, context)
        }
        break
        
      case 'delay':
        // Wait for specified time
        await new Promise(resolve => setTimeout(resolve, step.config.minutes * 60 * 1000))
        for (const nextId of step.nextSteps) {
          await this.executeWorkflowStep(workflow, nextId, context)
        }
        break
    }
  }
}

export const automationEngine = AutomationEngine.getInstance()

// Preset rule templates
export const ruleTemplates = [
  {
    name: 'Budget Alert',
    description: 'Alert when spending approaches daily budget',
    trigger: {
      type: 'budget_limit' as const,
      threshold: 90,
      comparison: 'gt' as const
    },
    actions: [
      {
        type: 'send_notification' as const,
        parameters: {
          priority: 'warning',
          message: 'Daily budget is at {{spend_percentage}}%'
        }
      }
    ]
  },
  {
    name: 'High CPA Alert',
    description: 'Alert when CPA exceeds target',
    trigger: {
      type: 'metric_threshold' as const,
      metric: 'cpa',
      threshold: 50,
      comparison: 'gt' as const
    },
    actions: [
      {
        type: 'send_notification' as const,
        parameters: {
          priority: 'warning',
          message: 'CPA has exceeded $50'
        }
      }
    ]
  },
  {
    name: 'Low CTR Campaign Pause',
    description: 'Pause campaigns with CTR below 1%',
    trigger: {
      type: 'metric_threshold' as const,
      metric: 'ctr',
      threshold: 0.01,
      comparison: 'lt' as const
    },
    conditions: [
      {
        type: 'and' as const,
        field: 'impressions',
        operator: 'gt' as const,
        value: 1000
      }
    ],
    actions: [
      {
        type: 'pause_campaign' as const,
        parameters: {}
      }
    ]
  }
]