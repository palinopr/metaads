'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { 
  Zap, 
  Plus, 
  Settings2, 
  AlertTriangle,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Pause,
  Play,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3
} from 'lucide-react'
import { automationEngine, AutomationRule, ruleTemplates } from '@/lib/automation-engine'
import { Slider } from "@/components/ui/slider"

export function AutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [activeTab, setActiveTab] = useState('rules')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    name: '',
    description: '',
    enabled: true,
    trigger: {
      type: 'metric_threshold',
      metric: 'spend',
      threshold: 100,
      comparison: 'gt'
    },
    conditions: [],
    actions: [],
    triggerCount: 0
  })

  useEffect(() => {
    setRules(automationEngine.getRules())
  }, [])

  const createRule = () => {
    const rule: AutomationRule = {
      id: Date.now().toString(),
      name: newRule.name || 'New Rule',
      description: newRule.description,
      enabled: newRule.enabled ?? true,
      trigger: newRule.trigger!,
      conditions: newRule.conditions || [],
      actions: newRule.actions || [],
      triggerCount: 0
    }
    
    const updatedRules = [...rules, rule]
    setRules(updatedRules)
    automationEngine.saveRules(updatedRules)
    
    setNewRule({
      name: '',
      description: '',
      enabled: true,
      trigger: {
        type: 'metric_threshold',
        metric: 'spend',
        threshold: 100,
        comparison: 'gt'
      },
      conditions: [],
      actions: [],
      triggerCount: 0
    })
    setIsCreating(false)
  }

  const updateRule = (rule: AutomationRule) => {
    const updatedRules = rules.map(r => r.id === rule.id ? rule : r)
    setRules(updatedRules)
    automationEngine.saveRules(updatedRules)
    setEditingRule(null)
  }

  const deleteRule = (id: string) => {
    const updatedRules = rules.filter(r => r.id !== id)
    setRules(updatedRules)
    automationEngine.saveRules(updatedRules)
  }

  const toggleRule = (id: string) => {
    const updatedRules = rules.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    )
    setRules(updatedRules)
    automationEngine.saveRules(updatedRules)
  }

  const duplicateRule = (rule: AutomationRule) => {
    const newRule: AutomationRule = {
      ...rule,
      id: Date.now().toString(),
      name: `${rule.name} (Copy)`,
      triggerCount: 0,
      lastTriggered: undefined
    }
    const updatedRules = [...rules, newRule]
    setRules(updatedRules)
    automationEngine.saveRules(updatedRules)
  }

  const applyTemplate = (templateName: string) => {
    const template = ruleTemplates.find(t => t.name === templateName)
    if (template) {
      setNewRule({
        ...newRule,
        name: template.name,
        description: template.description,
        trigger: template.trigger,
        actions: template.actions
      })
    }
  }

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'metric_threshold': return <BarChart3 className="h-4 w-4" />
      case 'performance_change': return <TrendingDown className="h-4 w-4" />
      case 'budget_limit': return <DollarSign className="h-4 w-4" />
      case 'schedule': return <Clock className="h-4 w-4" />
      default: return <Zap className="h-4 w-4" />
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'pause_campaign': return <Pause className="h-4 w-4" />
      case 'adjust_budget': return <DollarSign className="h-4 w-4" />
      case 'send_notification': return <AlertTriangle className="h-4 w-4" />
      default: return <Settings2 className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Automation Rules
          </h2>
          <p className="text-muted-foreground">Create rules to automate campaign management</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">Active Rules</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Rule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Selection */}
                <div className="space-y-2">
                  <Label>Start from template (optional)</Label>
                  <Select value={selectedTemplate} onValueChange={(value) => {
                    setSelectedTemplate(value)
                    applyTemplate(value)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {ruleTemplates.map(template => (
                        <SelectItem key={template.name} value={template.name}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rule Name</Label>
                    <Input
                      placeholder="e.g., High Spend Alert"
                      value={newRule.name}
                      onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Optional description"
                      value={newRule.description || ''}
                      onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                    />
                  </div>
                </div>

                {/* Trigger Configuration */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold">Trigger</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Trigger Type</Label>
                      <Select 
                        value={newRule.trigger?.type}
                        onValueChange={(value: any) => setNewRule({
                          ...newRule,
                          trigger: { ...newRule.trigger!, type: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="metric_threshold">Metric Threshold</SelectItem>
                          <SelectItem value="performance_change">Performance Change</SelectItem>
                          <SelectItem value="budget_limit">Budget Limit</SelectItem>
                          <SelectItem value="schedule">Schedule</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newRule.trigger?.type === 'metric_threshold' && (
                      <>
                        <div className="space-y-2">
                          <Label>Metric</Label>
                          <Select
                            value={newRule.trigger.metric}
                            onValueChange={(value) => setNewRule({
                              ...newRule,
                              trigger: { ...newRule.trigger!, metric: value }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="spend">Spend</SelectItem>
                              <SelectItem value="cpc">CPC</SelectItem>
                              <SelectItem value="ctr">CTR</SelectItem>
                              <SelectItem value="roas">ROAS</SelectItem>
                              <SelectItem value="conversions">Conversions</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Comparison</Label>
                          <Select
                            value={newRule.trigger.comparison}
                            onValueChange={(value: any) => setNewRule({
                              ...newRule,
                              trigger: { ...newRule.trigger!, comparison: value }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gt">Greater than</SelectItem>
                              <SelectItem value="lt">Less than</SelectItem>
                              <SelectItem value="eq">Equals</SelectItem>
                              <SelectItem value="gte">Greater or equal</SelectItem>
                              <SelectItem value="lte">Less or equal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Threshold Value</Label>
                          <Input
                            type="number"
                            value={newRule.trigger.threshold}
                            onChange={(e) => setNewRule({
                              ...newRule,
                              trigger: { ...newRule.trigger!, threshold: Number(e.target.value) }
                            })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Actions</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNewRule({
                        ...newRule,
                        actions: [...(newRule.actions || []), {
                          type: 'send_notification',
                          parameters: { priority: 'info', message: '' }
                        }]
                      })}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Action
                    </Button>
                  </div>
                  
                  {newRule.actions?.map((action, index) => (
                    <Card key={index} className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Select
                            value={action.type}
                            onValueChange={(value: any) => {
                              const updatedActions = [...(newRule.actions || [])]
                              updatedActions[index] = { ...action, type: value }
                              setNewRule({ ...newRule, actions: updatedActions })
                            }}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="send_notification">Send Notification</SelectItem>
                              <SelectItem value="pause_campaign">Pause Campaign</SelectItem>
                              <SelectItem value="adjust_budget">Adjust Budget</SelectItem>
                              <SelectItem value="adjust_bid">Adjust Bid</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const updatedActions = newRule.actions?.filter((_, i) => i !== index)
                              setNewRule({ ...newRule, actions: updatedActions })
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {action.type === 'send_notification' && (
                          <div className="space-y-2">
                            <Input
                              placeholder="Notification message"
                              value={action.parameters.message || ''}
                              onChange={(e) => {
                                const updatedActions = [...(newRule.actions || [])]
                                updatedActions[index] = {
                                  ...action,
                                  parameters: { ...action.parameters, message: e.target.value }
                                }
                                setNewRule({ ...newRule, actions: updatedActions })
                              }}
                            />
                            <Select
                              value={action.parameters.priority || 'info'}
                              onValueChange={(value) => {
                                const updatedActions = [...(newRule.actions || [])]
                                updatedActions[index] = {
                                  ...action,
                                  parameters: { ...action.parameters, priority: value }
                                }
                                setNewRule({ ...newRule, actions: updatedActions })
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="info">Info</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        {action.type === 'adjust_budget' && (
                          <div className="space-y-2">
                            <Label>Adjustment (%)</Label>
                            <Slider
                              value={[action.parameters.percentage || 0]}
                              onValueChange={(value) => {
                                const updatedActions = [...(newRule.actions || [])]
                                updatedActions[index] = {
                                  ...action,
                                  parameters: { ...action.parameters, percentage: value[0] }
                                }
                                setNewRule({ ...newRule, actions: updatedActions })
                              }}
                              min={-50}
                              max={50}
                              step={5}
                            />
                            <p className="text-sm text-muted-foreground text-center">
                              {action.parameters.percentage || 0}%
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button onClick={createRule}>Create Rule</Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {getTriggerIcon(rule.trigger.type)}
                        <h3 className="text-lg font-semibold">{rule.name}</h3>
                        {rule.enabled ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      
                      {rule.description && (
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Trigger: </span>
                          <span className="font-medium">
                            {rule.trigger.type === 'metric_threshold' && 
                              `${rule.trigger.metric} ${rule.trigger.comparison} ${rule.trigger.threshold}`
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Actions: </span>
                          <span className="font-medium">{rule.actions.length}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Triggered: </span>
                          <span className="font-medium">{rule.triggerCount} times</span>
                        </div>
                        {rule.lastTriggered && (
                          <div>
                            <span className="text-muted-foreground">Last triggered: </span>
                            <span className="font-medium">
                              {new Date(rule.lastTriggered).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        {rule.actions.map((action, i) => (
                          <Badge key={i} variant="outline" className="text-xs gap-1">
                            {getActionIcon(action.type)}
                            {action.type.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingRule(rule)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => duplicateRule(rule)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ruleTemplates.map((template) => (
              <Card key={template.name}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getTriggerIcon(template.trigger.type)}
                    {template.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Trigger: </span>
                      <span className="font-medium">
                        {template.trigger.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {template.actions.map((action, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {action.type.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      className="w-full mt-4"
                      variant="outline"
                      onClick={() => {
                        setSelectedTemplate(template.name)
                        applyTemplate(template.name)
                        setIsCreating(true)
                        setActiveTab('rules')
                      }}
                    >
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Rule Execution History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rules.filter(r => r.lastTriggered).map(rule => (
                  <div key={rule.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Last triggered: {rule.lastTriggered && new Date(rule.lastTriggered).toLocaleString()}
                      </p>
                    </div>
                    <Badge>{rule.triggerCount} times</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}