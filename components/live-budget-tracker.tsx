'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useMetricUpdates } from '@/hooks/use-websocket'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Settings,
  Calendar,
  Clock,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  Pause,
  Play,
  Edit
} from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from 'recharts'
import { cn } from '@/lib/utils'

interface BudgetMetrics {
  campaignId: string
  campaignName: string
  dailyBudget: number
  totalBudget: number
  spentToday: number
  spentTotal: number
  remainingDaily: number
  remainingTotal: number
  spendRate: number // per hour
  projectedDailySpend: number
  projectedTotalSpend: number
  budgetUtilization: number
  daysRemaining: number
  lastUpdate: Date
  isActive: boolean
  alerts: BudgetAlert[]
}

interface BudgetAlert {
  id: string
  type: 'overspend' | 'underspend' | 'pace' | 'depletion'
  severity: 'info' | 'warning' | 'critical'
  message: string
  threshold: number
  current: number
  timestamp: Date
}

interface BudgetSettings {
  campaignId: string
  autoAdjust: boolean
  pauseAtLimit: boolean
  alertThresholds: {
    warning: number // percentage
    critical: number // percentage
  }
  paceAlerts: boolean
  maxDailyIncrease: number // percentage
}

interface SpendingTrend {
  time: string
  spent: number
  projected: number
  budget: number
}

export function LiveBudgetTracker() {
  const [campaigns, setCampaigns] = useState<Map<string, BudgetMetrics>>(new Map())
  const [settings, setSettings] = useState<Map<string, BudgetSettings>>(new Map())
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [spendingTrends, setSpendingTrends] = useState<Map<string, SpendingTrend[]>>(new Map())

  // Subscribe to budget updates
  useMetricUpdates('budget', useCallback((data: any) => {
    updateBudgetMetrics(data)
  }, []))

  useMetricUpdates('spend', useCallback((data: any) => {
    updateSpendMetrics(data)
  }, []))

  const updateBudgetMetrics = (data: any) => {
    setCampaigns(prev => {
      const updated = new Map(prev)
      const existing = updated.get(data.campaignId) || createDefaultBudgetMetrics(data.campaignId, data.campaignName)
      
      const updatedMetrics: BudgetMetrics = {
        ...existing,
        ...data,
        lastUpdate: new Date()
      }
      
      // Calculate derived metrics
      updatedMetrics.remainingDaily = Math.max(0, updatedMetrics.dailyBudget - updatedMetrics.spentToday)
      updatedMetrics.remainingTotal = Math.max(0, updatedMetrics.totalBudget - updatedMetrics.spentTotal)
      updatedMetrics.budgetUtilization = (updatedMetrics.spentTotal / updatedMetrics.totalBudget) * 100
      
      // Calculate days remaining based on current spend rate
      if (updatedMetrics.spendRate > 0) {
        updatedMetrics.daysRemaining = updatedMetrics.remainingTotal / (updatedMetrics.spendRate * 24)
      }
      
      // Calculate projected spend
      const hoursRemaining = 24 - new Date().getHours()
      updatedMetrics.projectedDailySpend = updatedMetrics.spentToday + (updatedMetrics.spendRate * hoursRemaining)
      
      // Generate alerts
      updatedMetrics.alerts = generateBudgetAlerts(updatedMetrics)
      
      updated.set(data.campaignId, updatedMetrics)
      return updated
    })
  }

  const updateSpendMetrics = (data: any) => {
    // Update spending trends
    setSpendingTrends(prev => {
      const updated = new Map(prev)
      const trends = updated.get(data.campaignId) || []
      
      const now = new Date()
      const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
      
      const newTrend: SpendingTrend = {
        time: timeStr,
        spent: data.spentToday || 0,
        projected: data.projectedDailySpend || 0,
        budget: data.dailyBudget || 0
      }
      
      const newTrends = [...trends, newTrend].slice(-24) // Keep last 24 hours
      updated.set(data.campaignId, newTrends)
      
      return updated
    })
  }

  const createDefaultBudgetMetrics = (campaignId: string, campaignName: string): BudgetMetrics => ({
    campaignId,
    campaignName,
    dailyBudget: 0,
    totalBudget: 0,
    spentToday: 0,
    spentTotal: 0,
    remainingDaily: 0,
    remainingTotal: 0,
    spendRate: 0,
    projectedDailySpend: 0,
    projectedTotalSpend: 0,
    budgetUtilization: 0,
    daysRemaining: 0,
    lastUpdate: new Date(),
    isActive: true,
    alerts: []
  })

  const generateBudgetAlerts = (metrics: BudgetMetrics): BudgetAlert[] => {
    const alerts: BudgetAlert[] = []
    const campaignSettings = settings.get(metrics.campaignId)
    
    if (!campaignSettings) return alerts

    // Daily budget alerts
    const dailyUtilization = (metrics.spentToday / metrics.dailyBudget) * 100
    
    if (dailyUtilization >= campaignSettings.alertThresholds.critical) {
      alerts.push({
        id: `daily_critical_${Date.now()}`,
        type: 'overspend',
        severity: 'critical',
        message: `Daily budget ${dailyUtilization.toFixed(1)}% consumed`,
        threshold: campaignSettings.alertThresholds.critical,
        current: dailyUtilization,
        timestamp: new Date()
      })
    } else if (dailyUtilization >= campaignSettings.alertThresholds.warning) {
      alerts.push({
        id: `daily_warning_${Date.now()}`,
        type: 'overspend',
        severity: 'warning',
        message: `Daily budget ${dailyUtilization.toFixed(1)}% consumed`,
        threshold: campaignSettings.alertThresholds.warning,
        current: dailyUtilization,
        timestamp: new Date()
      })
    }

    // Pace alerts
    if (campaignSettings.paceAlerts) {
      const expectedSpend = (metrics.dailyBudget / 24) * new Date().getHours()
      const paceDifference = ((metrics.spentToday - expectedSpend) / expectedSpend) * 100
      
      if (Math.abs(paceDifference) > 25) {
        alerts.push({
          id: `pace_${Date.now()}`,
          type: 'pace',
          severity: Math.abs(paceDifference) > 50 ? 'critical' : 'warning',
          message: `Spending ${paceDifference > 0 ? 'ahead' : 'behind'} pace by ${Math.abs(paceDifference).toFixed(1)}%`,
          threshold: 25,
          current: Math.abs(paceDifference),
          timestamp: new Date()
        })
      }
    }

    // Total budget depletion alert
    if (metrics.daysRemaining < 7 && metrics.daysRemaining > 0) {
      alerts.push({
        id: `depletion_${Date.now()}`,
        type: 'depletion',
        severity: metrics.daysRemaining < 3 ? 'critical' : 'warning',
        message: `Budget will be depleted in ${metrics.daysRemaining.toFixed(1)} days at current pace`,
        threshold: 7,
        current: metrics.daysRemaining,
        timestamp: new Date()
      })
    }

    return alerts
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const getBudgetHealthColor = (utilization: number): string => {
    if (utilization < 50) return 'text-green-500'
    if (utilization < 75) return 'text-yellow-500'
    if (utilization < 90) return 'text-orange-500'
    return 'text-red-500'
  }

  const getPaceIndicator = (metrics: BudgetMetrics) => {
    if (metrics.projectedDailySpend > metrics.dailyBudget * 1.1) {
      return { icon: <TrendingUp className="h-4 w-4 text-red-500" />, label: 'Over pace', color: 'text-red-500' }
    } else if (metrics.projectedDailySpend < metrics.dailyBudget * 0.9) {
      return { icon: <TrendingDown className="h-4 w-4 text-blue-500" />, label: 'Under pace', color: 'text-blue-500' }
    } else {
      return { icon: <Target className="h-4 w-4 text-green-500" />, label: 'On pace', color: 'text-green-500' }
    }
  }

  const pauseCampaign = async (campaignId: string) => {
    // In a real implementation, this would call the Meta API
    setCampaigns(prev => {
      const updated = new Map(prev)
      const campaign = updated.get(campaignId)
      if (campaign) {
        campaign.isActive = false
        updated.set(campaignId, campaign)
      }
      return updated
    })
  }

  const resumeCampaign = async (campaignId: string) => {
    // In a real implementation, this would call the Meta API
    setCampaigns(prev => {
      const updated = new Map(prev)
      const campaign = updated.get(campaignId)
      if (campaign) {
        campaign.isActive = true
        updated.set(campaignId, campaign)
      }
      return updated
    })
  }

  const updateCampaignSettings = (campaignId: string, newSettings: Partial<BudgetSettings>) => {
    setSettings(prev => {
      const updated = new Map(prev)
      const existing = updated.get(campaignId) || {
        campaignId,
        autoAdjust: false,
        pauseAtLimit: false,
        alertThresholds: { warning: 75, critical: 90 },
        paceAlerts: true,
        maxDailyIncrease: 20
      }
      updated.set(campaignId, { ...existing, ...newSettings })
      return updated
    })
  }

  const currentCampaign = selectedCampaign ? campaigns.get(selectedCampaign) : null
  const currentTrends = selectedCampaign ? spendingTrends.get(selectedCampaign) || [] : []
  const totalActiveBudget = Array.from(campaigns.values()).reduce((sum, c) => sum + c.dailyBudget, 0)
  const totalSpentToday = Array.from(campaigns.values()).reduce((sum, c) => sum + c.spentToday, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Budget Tracker</h2>
          <p className="text-muted-foreground">Real-time budget monitoring and alerts</p>
        </div>
        <Button variant="outline" onClick={() => setShowSettings(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Overall Budget Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Daily Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalActiveBudget)}</div>
            <p className="text-xs text-muted-foreground">
              Across {campaigns.size} active campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spent Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpentToday)}</div>
            <div className="flex items-center text-xs">
              <span className={cn(getBudgetHealthColor((totalSpentToday / totalActiveBudget) * 100))}>
                {((totalSpentToday / totalActiveBudget) * 100).toFixed(1)}% utilized
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.from(campaigns.values()).reduce((sum, c) => sum + c.alerts.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Budget-related alerts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Budget List */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Budgets</CardTitle>
          <CardDescription>Real-time budget tracking for all campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from(campaigns.values()).map(campaign => {
              const pace = getPaceIndicator(campaign)
              const dailyUtilization = (campaign.spentToday / campaign.dailyBudget) * 100
              
              return (
                <div
                  key={campaign.campaignId}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-colors",
                    selectedCampaign === campaign.campaignId ? "border-primary bg-secondary/50" : "hover:bg-secondary/25"
                  )}
                  onClick={() => setSelectedCampaign(campaign.campaignId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{campaign.campaignName}</h3>
                          <Badge variant={campaign.isActive ? 'default' : 'secondary'}>
                            {campaign.isActive ? 'Active' : 'Paused'}
                          </Badge>
                          {campaign.alerts.length > 0 && (
                            <Badge variant="destructive">
                              {campaign.alerts.length} alerts
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {pace.icon}
                          <span className={cn('text-sm', pace.color)}>{pace.label}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Daily Budget</p>
                          <p className="font-medium">{formatCurrency(campaign.dailyBudget)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Spent Today</p>
                          <p className="font-medium">{formatCurrency(campaign.spentToday)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Remaining</p>
                          <p className="font-medium">{formatCurrency(campaign.remainingDaily)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Projected</p>
                          <p className="font-medium">{formatCurrency(campaign.projectedDailySpend)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Budget Utilization</span>
                          <span className={getBudgetHealthColor(dailyUtilization)}>
                            {dailyUtilization.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={dailyUtilization} className="h-2" />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          campaign.isActive ? pauseCampaign(campaign.campaignId) : resumeCampaign(campaign.campaignId)
                        }}
                      >
                        {campaign.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed View for Selected Campaign */}
      {currentCampaign && (
        <>
          {/* Campaign Alerts */}
          {currentCampaign.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Budget Alerts - {currentCampaign.campaignName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentCampaign.alerts.map(alert => (
                    <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert</AlertTitle>
                      <AlertDescription>
                        {alert.message} - {alert.timestamp.toLocaleTimeString()}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Spending Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Spending Trend - {currentCampaign.campaignName}</CardTitle>
              <CardDescription>Today's spending pattern vs budget and projection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [formatCurrency(value), name]}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="budget"
                      stackId="1"
                      stroke="#e5e7eb"
                      fill="#f3f4f6"
                      name="Daily Budget"
                    />
                    <Area
                      type="monotone"
                      dataKey="projected"
                      stackId="2"
                      stroke="#fbbf24"
                      fill="#fef3c7"
                      name="Projected Spend"
                    />
                    <Area
                      type="monotone"
                      dataKey="spent"
                      stackId="3"
                      stroke="#3b82f6"
                      fill="#dbeafe"
                      name="Actual Spend"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Budget Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Budget Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Daily Budget:</span>
                    <span className="font-medium">{formatCurrency(currentCampaign.dailyBudget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Spent Today:</span>
                    <span className="font-medium">{formatCurrency(currentCampaign.spentToday)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining:</span>
                    <span className="font-medium">{formatCurrency(currentCampaign.remainingDaily)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hourly Rate:</span>
                    <span className="font-medium">{formatCurrency(currentCampaign.spendRate)}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Projected End-of-Day:</span>
                    <span className={cn(
                      'font-medium',
                      currentCampaign.projectedDailySpend > currentCampaign.dailyBudget ? 'text-red-500' : 'text-green-500'
                    )}>
                      {formatCurrency(currentCampaign.projectedDailySpend)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Budget Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Budget:</span>
                    <span className="font-medium">{formatCurrency(currentCampaign.totalBudget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Spent:</span>
                    <span className="font-medium">{formatCurrency(currentCampaign.spentTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining:</span>
                    <span className="font-medium">{formatCurrency(currentCampaign.remainingTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Utilization:</span>
                    <span className={cn('font-medium', getBudgetHealthColor(currentCampaign.budgetUtilization))}>
                      {currentCampaign.budgetUtilization.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days Remaining:</span>
                    <span className="font-medium">
                      {currentCampaign.daysRemaining > 0 ? `${currentCampaign.daysRemaining.toFixed(1)} days` : 'Depleted'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}