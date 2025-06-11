'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Settings,
  Volume2,
  VolumeX,
  BellRing,
  Clock,
  DollarSign,
  Target,
  Activity,
  Zap,
  Mail,
  Smartphone
} from 'lucide-react'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionable: boolean
  campaignId?: string
  metric?: string
  value?: number
  threshold?: number
}

interface NotificationRule {
  id: string
  name: string
  enabled: boolean
  metric: string
  condition: 'above' | 'below' | 'change'
  threshold: number
  frequency: 'immediate' | 'hourly' | 'daily'
  channels: ('browser' | 'email' | 'sms')[]
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState('notifications')
  const [filter, setFilter] = useState<'all' | 'unread' | 'success' | 'warning' | 'error'>('all')

  const sampleNotifications: Notification[] = [
    {
      id: '1',
      type: 'warning',
      title: 'ROAS Below Threshold',
      message: 'Campaign "Summer Sale" ROAS dropped to 1.8x (threshold: 2.0x)',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      read: false,
      actionable: true,
      campaignId: 'summer-sale',
      metric: 'roas',
      value: 1.8,
      threshold: 2.0
    },
    {
      id: '2',
      type: 'success',
      title: 'Daily Revenue Target Met',
      message: 'Daily revenue reached $15,000 (120% of target)',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      read: false,
      actionable: false,
      metric: 'revenue',
      value: 15000,
      threshold: 12500
    },
    {
      id: '3',
      type: 'error',
      title: 'Campaign Budget Exhausted',
      message: 'Campaign "Black Friday" has spent 100% of daily budget',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      read: true,
      actionable: true,
      campaignId: 'black-friday',
      metric: 'spend',
      value: 5000,
      threshold: 5000
    },
    {
      id: '4',
      type: 'info',
      title: 'Weekly Report Generated',
      message: 'Your weekly performance report is ready for review',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      read: true,
      actionable: false
    }
  ]

  const defaultRules: NotificationRule[] = [
    {
      id: 'roas-low',
      name: 'ROAS Below Threshold',
      enabled: true,
      metric: 'roas',
      condition: 'below',
      threshold: 2.0,
      frequency: 'immediate',
      channels: ['browser', 'email']
    },
    {
      id: 'spend-high',
      name: 'High Daily Spend',
      enabled: true,
      metric: 'spend',
      condition: 'above',
      threshold: 1000,
      frequency: 'hourly',
      channels: ['browser']
    },
    {
      id: 'revenue-target',
      name: 'Daily Revenue Target',
      enabled: true,
      metric: 'revenue',
      condition: 'above',
      threshold: 10000,
      frequency: 'daily',
      channels: ['browser', 'email']
    },
    {
      id: 'ctr-drop',
      name: 'CTR Significant Drop',
      enabled: false,
      metric: 'ctr',
      condition: 'change',
      threshold: -20,
      frequency: 'immediate',
      channels: ['browser', 'email', 'sms']
    }
  ]

  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications')
    const savedRules = localStorage.getItem('notification-rules')
    
    if (savedNotifications) {
      const loaded = JSON.parse(savedNotifications)
      setNotifications(loaded)
      setUnreadCount(loaded.filter((n: Notification) => !n.read).length)
    } else {
      setNotifications(sampleNotifications)
      setUnreadCount(sampleNotifications.filter(n => !n.read).length)
    }
    
    if (savedRules) {
      setRules(JSON.parse(savedRules))
    } else {
      setRules(defaultRules)
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications))
    localStorage.setItem('notification-rules', JSON.stringify(rules))
  }, [notifications, rules])

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const deleteNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id)
    setNotifications(notifications.filter(n => n.id !== id))
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const toggleRule = (id: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ))
  }

  const sendTestNotification = () => {
    const testNotification: Notification = {
      id: Date.now().toString(),
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification to verify your settings.',
      timestamp: new Date().toISOString(),
      read: false,
      actionable: false
    }
    
    setNotifications([testNotification, ...notifications])
    setUnreadCount(prev => prev + 1)
    
    if (soundEnabled) {
      // Play notification sound (if supported)
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhEkRHZbAAAQIDBAUGBwgJCgsMDQ4PEBAREhITEhUQFBAVEBYPFgAXDxcNGA0YDBkMGQoZChgJGQgYCBgHFwcXBhYGFgQWBBUDFQMUAhQCEwETABMAEgAQAA8ADgAOAAwACwALAAkACQAIAAcABgAEAAQAAwACAAEAAAAAAAAAAAAAAAAA')
      audio.play().catch(() => {}) // Ignore errors
    }
    
    // Browser notification (if permission granted)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(testNotification.title, {
        body: testNotification.message,
        icon: '/favicon.ico'
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error': return <X className="h-4 w-4 text-red-500" />
      default: return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notification.read
    return notification.type === filter
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <div className="relative">
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>
            Notification Center
          </h2>
          <p className="text-muted-foreground">Real-time alerts and performance notifications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={sendTestNotification}>
            Test Notification
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="gap-2"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="notifications">
            Notifications 
            {unreadCount > 0 && (
              <Badge className="ml-2 h-5 px-2 bg-red-500">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <div className="flex justify-between items-center">
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter notifications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Notifications</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Mark All as Read
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                  <p className="text-muted-foreground text-center">
                    {filter === 'unread' ? 'All caught up! No unread notifications.' : 'You\'ll see notifications here when they arrive.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card key={notification.id} className={`${!notification.read ? 'ring-2 ring-blue-500/20 bg-blue-50/50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{notification.title}</h4>
                            <Badge className={`text-xs ${getBadgeColor(notification.type)}`}>
                              {notification.type}
                            </Badge>
                            {!notification.read && (
                              <Badge className="text-xs bg-blue-100 text-blue-800">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getTimeAgo(notification.timestamp)}
                            </span>
                            {notification.metric && (
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {notification.metric}: {notification.value}
                                {notification.threshold && ` (threshold: ${notification.threshold})`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-2">
                        {notification.actionable && (
                          <Button size="sm" variant="outline" className="text-xs">
                            Take Action
                          </Button>
                        )}
                        {!notification.read && (
                          <Button size="sm" variant="ghost" onClick={() => markAsRead(notification.id)}>
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => deleteNotification(notification.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{rule.name}</h4>
                        <Badge className={rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {rule.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Alert when <strong>{rule.metric}</strong> is{' '}
                        <strong>{rule.condition === 'change' ? `changes by` : rule.condition} {rule.threshold}
                        {rule.condition === 'change' ? '%' : rule.metric === 'roas' ? 'x' : ''}</strong>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {rule.frequency}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bell className="h-3 w-3" />
                          {rule.channels.join(', ')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Button className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Create New Alert Rule
          </Button>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="browser-notifications">Browser Notifications</Label>
                  <p className="text-sm text-muted-foreground">Show notifications in your browser</p>
                </div>
                <Switch id="browser-notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sound-notifications">Sound Alerts</Label>
                  <p className="text-sm text-muted-foreground">Play sound when notifications arrive</p>
                </div>
                <Switch 
                  id="sound-notifications" 
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send alerts to your email</p>
                </div>
                <Switch id="email-notifications" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input placeholder="alerts@company.com" />
              </div>
              
              <div className="space-y-2">
                <Label>SMS Number</Label>
                <Input placeholder="+1 (555) 123-4567" />
              </div>
              
              <div className="space-y-2">
                <Label>Slack Webhook URL</Label>
                <Input placeholder="https://hooks.slack.com/..." />
              </div>
              
              <Button>Save Channel Settings</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quiet Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
                  <p className="text-sm text-muted-foreground">Disable notifications during specified hours</p>
                </div>
                <Switch id="quiet-hours" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" defaultValue="22:00" />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" defaultValue="08:00" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}