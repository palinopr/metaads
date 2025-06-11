"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, AlertTriangle, CheckCircle, Clock, Zap, TrendingUp, TrendingDown,
  Target, Eye, Activity, Settings, Plus, X, Filter, Search,
  Mail, MessageSquare, Smartphone, Slack, Calendar, Users
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface CompetitiveAlertsProps {
  industry: string
}

interface CompetitiveAlert {
  id: string
  type: 'new_ad' | 'spend_change' | 'performance_change' | 'market_share' | 'pricing' | 'product_launch'
  priority: 'low' | 'medium' | 'high' | 'critical'
  competitor: string
  title: string
  description: string
  timestamp: Date
  isRead: boolean
  data?: {
    oldValue?: number
    newValue?: number
    change?: number
    metric?: string
  }
  actionRequired: boolean
  relatedUrl?: string
}

interface AlertRule {
  id: string
  name: string
  type: 'spend_threshold' | 'performance_change' | 'new_ad_launch' | 'market_share_change' | 'keyword_bidding'
  competitors: string[]
  conditions: {
    threshold?: number
    percentage?: number
    metric?: string
    timeframe?: string
  }
  isActive: boolean
  notifications: string[]
  lastTriggered?: Date
}

export function CompetitiveAlerts({ industry }: CompetitiveAlertsProps) {
  const [selectedTab, setSelectedTab] = useState('alerts')
  const [filterType, setFilterType] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  // Mock alerts data
  const alerts: CompetitiveAlert[] = [
    {
      id: 'alert-1',
      type: 'spend_change',
      priority: 'critical',
      competitor: 'TechLeader Corp',
      title: 'Massive Ad Spend Increase Detected',
      description: 'TechLeader Corp increased their monthly ad spend by 180% in the last 7 days. This represents their largest spend increase in 12 months.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: false,
      data: {
        oldValue: 125000,
        newValue: 350000,
        change: 180,
        metric: 'Monthly Ad Spend'
      },
      actionRequired: true
    },
    {
      id: 'alert-2',
      type: 'new_ad',
      priority: 'high',
      competitor: 'MarketChallenger Inc',
      title: 'New Video Campaign Launched',
      description: 'MarketChallenger Inc launched a new video advertising campaign targeting your key demographics with aggressive pricing messaging.',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      isRead: false,
      actionRequired: true,
      relatedUrl: '/competitor-ads/mc-video-campaign'
    },
    {
      id: 'alert-3',
      type: 'performance_change',
      priority: 'medium',
      competitor: 'EstablishedBrand LLC',
      title: 'CTR Performance Improvement',
      description: 'EstablishedBrand LLC achieved a 45% improvement in click-through rates over the past 14 days across their display campaigns.',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      isRead: true,
      data: {
        oldValue: 1.8,
        newValue: 2.6,
        change: 45,
        metric: 'CTR'
      },
      actionRequired: false
    },
    {
      id: 'alert-4',
      type: 'market_share',
      priority: 'high',
      competitor: 'InnovativeStartup',
      title: 'Market Share Growth',
      description: 'InnovativeStartup captured an additional 2.3% market share in the past month, now holding 8.7% of the total market.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      isRead: true,
      data: {
        oldValue: 6.4,
        newValue: 8.7,
        change: 2.3,
        metric: 'Market Share'
      },
      actionRequired: true
    },
    {
      id: 'alert-5',
      type: 'pricing',
      priority: 'medium',
      competitor: 'ValueBrand Solutions',
      title: 'Pricing Strategy Change',
      description: 'ValueBrand Solutions reduced their average product pricing by 15% and is heavily promoting this in their ad campaigns.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      isRead: true,
      actionRequired: false
    }
  ]

  const alertRules: AlertRule[] = [
    {
      id: 'rule-1',
      name: 'Large Spend Increases',
      type: 'spend_threshold',
      competitors: ['TechLeader Corp', 'MarketChallenger Inc'],
      conditions: {
        threshold: 100000,
        percentage: 50,
        timeframe: '7 days'
      },
      isActive: true,
      notifications: ['email', 'slack'],
      lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 'rule-2',
      name: 'New Ad Launches',
      type: 'new_ad_launch',
      competitors: ['All Tracked Competitors'],
      conditions: {
        timeframe: '24 hours'
      },
      isActive: true,
      notifications: ['email', 'push'],
      lastTriggered: new Date(Date.now() - 6 * 60 * 60 * 1000)
    },
    {
      id: 'rule-3',
      name: 'Performance Improvements',
      type: 'performance_change',
      competitors: ['TechLeader Corp', 'EstablishedBrand LLC'],
      conditions: {
        percentage: 30,
        metric: 'CTR',
        timeframe: '14 days'
      },
      isActive: true,
      notifications: ['email'],
      lastTriggered: new Date(Date.now() - 12 * 60 * 60 * 1000)
    },
    {
      id: 'rule-4',
      name: 'Market Share Shifts',
      type: 'market_share_change',
      competitors: ['All Tracked Competitors'],
      conditions: {
        percentage: 1,
        timeframe: '30 days'
      },
      isActive: false,
      notifications: ['email', 'slack']
    }
  ]

  const getAlertIcon = (type: string, priority: string) => {
    const iconClass = priority === 'critical' ? 'text-red-600' : 
                     priority === 'high' ? 'text-orange-600' :
                     priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
    
    switch (type) {
      case 'spend_change': return <TrendingUp className={`h-4 w-4 ${iconClass}`} />
      case 'new_ad': return <Eye className={`h-4 w-4 ${iconClass}`} />
      case 'performance_change': return <Activity className={`h-4 w-4 ${iconClass}`} />
      case 'market_share': return <Target className={`h-4 w-4 ${iconClass}`} />
      case 'pricing': return <TrendingDown className={`h-4 w-4 ${iconClass}`} />
      case 'product_launch': return <Zap className={`h-4 w-4 ${iconClass}`} />
      default: return <Bell className={`h-4 w-4 ${iconClass}`} />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesType = filterType === 'all' || alert.type === filterType
    const matchesPriority = filterPriority === 'all' || alert.priority === filterPriority
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.competitor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesReadStatus = !showUnreadOnly || !alert.isRead
    
    return matchesType && matchesPriority && matchesSearch && matchesReadStatus
  })

  const unreadCount = alerts.filter(alert => !alert.isRead).length
  const criticalCount = alerts.filter(alert => alert.priority === 'critical' && !alert.isRead).length

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Competitive Alerts
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-700 ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Real-time notifications about competitor activities and market changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{alerts.length}</div>
              <div className="text-sm text-muted-foreground">Total Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
              <div className="text-sm text-muted-foreground">Unread</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{criticalCount}</div>
              <div className="text-sm text-muted-foreground">Critical Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{alertRules.filter(r => r.isActive).length}</div>
              <div className="text-sm text-muted-foreground">Active Rules</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts">Recent Alerts</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="settings">Notification Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-6">
          {/* Alert Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-64">
                  <Input
                    placeholder="Search alerts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Alert Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="spend_change">Spend Changes</SelectItem>
                    <SelectItem value="new_ad">New Ads</SelectItem>
                    <SelectItem value="performance_change">Performance</SelectItem>
                    <SelectItem value="market_share">Market Share</SelectItem>
                    <SelectItem value="pricing">Pricing</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showUnreadOnly}
                    onCheckedChange={setShowUnreadOnly}
                    id="unread-only"
                  />
                  <label htmlFor="unread-only" className="text-sm">
                    Unread only
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alert List */}
          <div className="space-y-4">
            {filteredAlerts.map(alert => (
              <Card key={alert.id} className={`transition-all hover:shadow-md ${!alert.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.type, alert.priority)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`font-medium ${!alert.isRead ? 'font-semibold' : ''}`}>
                            {alert.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">{alert.competitor}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(alert.priority)} variant="outline">
                            {alert.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(alert.timestamp)}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm">{alert.description}</p>

                      {alert.data && (
                        <div className="flex items-center gap-4 text-sm bg-gray-50 rounded p-2">
                          <span className="text-muted-foreground">{alert.data.metric}:</span>
                          <span>
                            {alert.data.metric === 'Monthly Ad Spend' ? formatCurrency(alert.data.oldValue!) : 
                             alert.data.metric === 'Market Share' ? `${alert.data.oldValue}%` :
                             alert.data.oldValue?.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium">
                            {alert.data.metric === 'Monthly Ad Spend' ? formatCurrency(alert.data.newValue!) : 
                             alert.data.metric === 'Market Share' ? `${alert.data.newValue}%` :
                             alert.data.newValue?.toFixed(1)}
                          </span>
                          <Badge variant="outline" className={alert.data.change! > 0 ? 'text-green-600' : 'text-red-600'}>
                            {alert.data.change! > 0 ? '+' : ''}{alert.data.change}%
                          </Badge>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          {alert.actionRequired && (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              Action Required
                            </Badge>
                          )}
                          {alert.relatedUrl && (
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!alert.isRead && (
                            <Button size="sm" variant="ghost">
                              Mark as Read
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredAlerts.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No alerts found</h3>
                  <p className="text-muted-foreground">
                    No alerts match your current filters
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Alert Rules</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Rule
            </Button>
          </div>

          <div className="space-y-4">
            {alertRules.map(rule => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge variant="outline" className="capitalize">
                          {rule.type.replace('_', ' ')}
                        </Badge>
                        <Switch checked={rule.isActive} />
                        {rule.isActive && (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p>Competitors: {rule.competitors.join(', ')}</p>
                        <p>
                          Conditions: 
                          {rule.conditions.threshold && ` Threshold: ${formatCurrency(rule.conditions.threshold)}`}
                          {rule.conditions.percentage && ` Change: ${rule.conditions.percentage}%`}
                          {rule.conditions.metric && ` Metric: ${rule.conditions.metric}`}
                          {rule.conditions.timeframe && ` Timeframe: ${rule.conditions.timeframe}`}
                        </p>
                        <p>Notifications: {rule.notifications.join(', ')}</p>
                        {rule.lastTriggered && (
                          <p>Last triggered: {getTimeAgo(rule.lastTriggered)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              <strong>Pro Tip:</strong> Set up multiple rules with different thresholds to catch 
              both major competitor moves and subtle market shifts. Consider creating rules for 
              seasonal patterns and industry-specific events.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive competitive alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Notification Channels</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-muted-foreground">Mobile and browser push notifications</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Slack className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Slack Integration</p>
                        <p className="text-sm text-muted-foreground">Send alerts to Slack channel</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4" />
                      <div>
                        <p className="font-medium">SMS Alerts</p>
                        <p className="text-sm text-muted-foreground">Critical alerts via SMS</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Alert Frequency</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Critical Alerts</span>
                    <Select defaultValue="immediate">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>High Priority Alerts</span>
                    <Select defaultValue="immediate">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Medium/Low Priority</span>
                    <Select defaultValue="daily">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Quiet Hours</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Start Time</label>
                    <Select defaultValue="22:00">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20:00">8:00 PM</SelectItem>
                        <SelectItem value="21:00">9:00 PM</SelectItem>
                        <SelectItem value="22:00">10:00 PM</SelectItem>
                        <SelectItem value="23:00">11:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Time</label>
                    <Select defaultValue="08:00">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="06:00">6:00 AM</SelectItem>
                        <SelectItem value="07:00">7:00 AM</SelectItem>
                        <SelectItem value="08:00">8:00 AM</SelectItem>
                        <SelectItem value="09:00">9:00 AM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Only critical alerts will be sent during quiet hours
                </p>
              </div>

              <div className="pt-4 border-t">
                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}