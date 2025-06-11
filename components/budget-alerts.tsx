'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Pause,
  Play,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from "@/components/ui/use-toast"

interface BudgetAlert {
  id: string
  name: string
  campaignId?: string
  campaignName?: string
  type: 'daily' | 'weekly' | 'monthly' | 'lifetime'
  budgetLimit: number
  currentSpend: number
  thresholds: {
    warning: number // percentage
    critical: number // percentage
  }
  actions: {
    pauseAtLimit: boolean
    notifyAtWarning: boolean
    notifyAtCritical: boolean
    adjustBidsAtWarning: boolean
    bidAdjustment: number // percentage
  }
  enabled: boolean
  lastTriggered?: Date
  triggerCount: number
}

interface CampaignBudgetData {
  campaignId: string
  campaignName: string
  dailyBudget: number
  currentSpend: number
  spendPercentage: number
  status: 'active' | 'paused' | 'warning' | 'critical'
}

export function BudgetAlerts() {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([])
  const [campaignData, setCampaignData] = useState<CampaignBudgetData[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingAlert, setEditingAlert] = useState<BudgetAlert | null>(null)

  const [newAlert, setNewAlert] = useState<Partial<BudgetAlert>>({
    name: '',
    type: 'daily',
    budgetLimit: 100,
    thresholds: {
      warning: 80,
      critical: 95
    },
    actions: {
      pauseAtLimit: false,
      notifyAtWarning: true,
      notifyAtCritical: true,
      adjustBidsAtWarning: false,
      bidAdjustment: -10
    },
    enabled: true
  })

  // Mock campaign data
  useEffect(() => {
    const mockCampaigns: CampaignBudgetData[] = [
      {
        campaignId: '1',
        campaignName: 'Holiday Sale Campaign',
        dailyBudget: 500,
        currentSpend: 420,
        spendPercentage: 84,
        status: 'warning'
      },
      {
        campaignId: '2',
        campaignName: 'Brand Awareness',
        dailyBudget: 200,
        currentSpend: 195,
        spendPercentage: 97.5,
        status: 'critical'
      },
      {
        campaignId: '3',
        campaignName: 'Product Launch',
        dailyBudget: 300,
        currentSpend: 150,
        spendPercentage: 50,
        status: 'active'
      }
    ]
    setCampaignData(mockCampaigns)

    // Load saved alerts
    const saved = localStorage.getItem('budget-alerts')
    if (saved) {
      setAlerts(JSON.parse(saved))
    } else {
      // Create sample alerts
      const sampleAlerts: BudgetAlert[] = [
        {
          id: '1',
          name: 'Daily Budget Monitor',
          type: 'daily',
          budgetLimit: 500,
          currentSpend: 420,
          thresholds: {
            warning: 80,
            critical: 95
          },
          actions: {
            pauseAtLimit: true,
            notifyAtWarning: true,
            notifyAtCritical: true,
            adjustBidsAtWarning: false,
            bidAdjustment: -10
          },
          enabled: true,
          triggerCount: 3
        }
      ]
      setAlerts(sampleAlerts)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('budget-alerts', JSON.stringify(alerts))
  }, [alerts])

  const createAlert = () => {
    const alert: BudgetAlert = {
      id: Date.now().toString(),
      name: newAlert.name || 'New Budget Alert',
      campaignId: newAlert.campaignId,
      campaignName: newAlert.campaignName,
      type: newAlert.type!,
      budgetLimit: newAlert.budgetLimit!,
      currentSpend: 0,
      thresholds: newAlert.thresholds!,
      actions: newAlert.actions!,
      enabled: newAlert.enabled ?? true,
      triggerCount: 0
    }
    
    setAlerts([...alerts, alert])
    setNewAlert({
      name: '',
      type: 'daily',
      budgetLimit: 100,
      thresholds: {
        warning: 80,
        critical: 95
      },
      actions: {
        pauseAtLimit: false,
        notifyAtWarning: true,
        notifyAtCritical: true,
        adjustBidsAtWarning: false,
        bidAdjustment: -10
      },
      enabled: true
    })
    setIsCreating(false)
    
    toast({
      title: "Budget alert created",
      description: "Your budget monitoring alert has been set up successfully."
    })
  }

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
    ))
  }

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id))
    toast({
      title: "Alert deleted",
      description: "Budget alert has been removed."
    })
  }

  const getBudgetStatus = (spendPercentage: number, thresholds: BudgetAlert['thresholds']) => {
    if (spendPercentage >= thresholds.critical) return 'critical'
    if (spendPercentage >= thresholds.warning) return 'warning'
    return 'active'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500'
      case 'warning': return 'bg-yellow-500'
      case 'active': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Critical
        </Badge>
      case 'warning':
        return <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800">
          <AlertTriangle className="h-3 w-3" />
          Warning
        </Badge>
      case 'active':
        return <Badge variant="default" className="gap-1 bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3" />
          Active
        </Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Budget Alerts & Controls
          </h2>
          <p className="text-muted-foreground">Monitor spending and automate budget controls</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Alert
        </Button>
      </div>

      {/* Campaign Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Campaign Budget Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaignData.map(campaign => {
              const status = campaign.status
              return (
                <Card key={campaign.campaignId} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{campaign.campaignName}</h4>
                        <p className="text-sm text-muted-foreground">
                          ${campaign.currentSpend} / ${campaign.dailyBudget}
                        </p>
                      </div>
                      {getStatusBadge(status)}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Spend Progress</span>
                        <span>{campaign.spendPercentage.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={campaign.spendPercentage} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Settings className="h-3 w-3 mr-1" />
                        Adjust
                      </Button>
                      {status === 'critical' && (
                        <Button size="sm" variant="destructive" className="flex-1">
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Create Alert Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create Budget Alert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Alert Name</Label>
                <Input
                  placeholder="e.g., Daily Budget Monitor"
                  value={newAlert.name}
                  onChange={(e) => setNewAlert({...newAlert, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Budget Type</Label>
                <Select
                  value={newAlert.type}
                  onValueChange={(value: any) => setNewAlert({...newAlert, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Budget</SelectItem>
                    <SelectItem value="weekly">Weekly Budget</SelectItem>
                    <SelectItem value="monthly">Monthly Budget</SelectItem>
                    <SelectItem value="lifetime">Lifetime Budget</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Budget Limit ($)</Label>
                <Input
                  type="number"
                  value={newAlert.budgetLimit}
                  onChange={(e) => setNewAlert({...newAlert, budgetLimit: Number(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Campaign (Optional)</Label>
                <Select
                  value={newAlert.campaignId || ''}
                  onValueChange={(value) => {
                    const campaign = campaignData.find(c => c.campaignId === value)
                    setNewAlert({
                      ...newAlert, 
                      campaignId: value,
                      campaignName: campaign?.campaignName
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All campaigns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All campaigns</SelectItem>
                    {campaignData.map(campaign => (
                      <SelectItem key={campaign.campaignId} value={campaign.campaignId}>
                        {campaign.campaignName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Thresholds */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold">Alert Thresholds</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Warning Threshold (%)</Label>
                  <Slider
                    value={[newAlert.thresholds?.warning || 80]}
                    onValueChange={(value) => setNewAlert({
                      ...newAlert,
                      thresholds: { ...newAlert.thresholds!, warning: value[0] }
                    })}
                    min={50}
                    max={100}
                    step={5}
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    {newAlert.thresholds?.warning || 80}%
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Critical Threshold (%)</Label>
                  <Slider
                    value={[newAlert.thresholds?.critical || 95]}
                    onValueChange={(value) => setNewAlert({
                      ...newAlert,
                      thresholds: { ...newAlert.thresholds!, critical: value[0] }
                    })}
                    min={80}
                    max={100}
                    step={5}
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    {newAlert.thresholds?.critical || 95}%
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold">Automated Actions</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Pause campaign at budget limit</Label>
                    <p className="text-sm text-muted-foreground">Automatically pause when budget is fully spent</p>
                  </div>
                  <Switch
                    checked={newAlert.actions?.pauseAtLimit || false}
                    onCheckedChange={(checked) => setNewAlert({
                      ...newAlert,
                      actions: { ...newAlert.actions!, pauseAtLimit: checked }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Send warning notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified at warning threshold</p>
                  </div>
                  <Switch
                    checked={newAlert.actions?.notifyAtWarning || false}
                    onCheckedChange={(checked) => setNewAlert({
                      ...newAlert,
                      actions: { ...newAlert.actions!, notifyAtWarning: checked }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Send critical notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified at critical threshold</p>
                  </div>
                  <Switch
                    checked={newAlert.actions?.notifyAtCritical || false}
                    onCheckedChange={(checked) => setNewAlert({
                      ...newAlert,
                      actions: { ...newAlert.actions!, notifyAtCritical: checked }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Adjust bids at warning</Label>
                    <p className="text-sm text-muted-foreground">Automatically reduce bids to slow spending</p>
                  </div>
                  <Switch
                    checked={newAlert.actions?.adjustBidsAtWarning || false}
                    onCheckedChange={(checked) => setNewAlert({
                      ...newAlert,
                      actions: { ...newAlert.actions!, adjustBidsAtWarning: checked }
                    })}
                  />
                </div>
                
                {newAlert.actions?.adjustBidsAtWarning && (
                  <div className="space-y-2 ml-4">
                    <Label>Bid Adjustment (%)</Label>
                    <Slider
                      value={[newAlert.actions?.bidAdjustment || -10]}
                      onValueChange={(value) => setNewAlert({
                        ...newAlert,
                        actions: { ...newAlert.actions!, bidAdjustment: value[0] }
                      })}
                      min={-50}
                      max={0}
                      step={5}
                    />
                    <p className="text-sm text-muted-foreground text-center">
                      {newAlert.actions?.bidAdjustment || -10}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={createAlert}>Create Alert</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Active Budget Alerts</h3>
        {alerts.map(alert => {
          const spendPercentage = (alert.currentSpend / alert.budgetLimit) * 100
          const status = getBudgetStatus(spendPercentage, alert.thresholds)
          
          return (
            <Card key={alert.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-semibold">{alert.name}</h4>
                      {getStatusBadge(status)}
                      {alert.enabled ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Pause className="h-3 w-3 mr-1" />
                          Paused
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Budget Type</p>
                        <p className="font-medium capitalize">{alert.type}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Limit</p>
                        <p className="font-medium">${alert.budgetLimit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Current Spend</p>
                        <p className="font-medium">${alert.currentSpend}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Triggered</p>
                        <p className="font-medium">{alert.triggerCount} times</p>
                      </div>
                    </div>
                    
                    {alert.campaignName && (
                      <p className="text-sm text-muted-foreground">
                        Campaign: {alert.campaignName}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Budget Progress</span>
                        <span>{spendPercentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={spendPercentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Warning: {alert.thresholds.warning}%</span>
                        <span>Critical: {alert.thresholds.critical}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Switch
                      checked={alert.enabled}
                      onCheckedChange={() => toggleAlert(alert.id)}
                    />
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteAlert(alert.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}