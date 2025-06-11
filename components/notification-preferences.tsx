'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Webhook,
  Plus,
  Trash2,
  Save,
  TestTube,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  AlertTriangle,
  Info,
  AlertCircle
} from 'lucide-react'
import { notificationManager, NotificationChannel, NotificationPreferences } from '@/lib/notification-manager'
import { toast } from "@/components/ui/use-toast"

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationManager.getPreferences()
  )
  const [isAddingChannel, setIsAddingChannel] = useState(false)
  const [testChannel, setTestChannel] = useState<string>('')
  const [activeTab, setActiveTab] = useState('channels')

  const [newChannel, setNewChannel] = useState<Partial<NotificationChannel>>({
    name: '',
    type: 'email',
    enabled: true,
    config: {}
  })

  const savePreferences = () => {
    notificationManager.savePreferences(preferences)
    toast({
      title: "Preferences saved",
      description: "Your notification preferences have been updated."
    })
  }

  const addChannel = () => {
    if (!newChannel.name) return

    const channel: NotificationChannel = {
      id: Date.now().toString(),
      name: newChannel.name,
      type: newChannel.type!,
      enabled: newChannel.enabled ?? true,
      config: newChannel.config || {}
    }

    setPreferences({
      ...preferences,
      channels: [...preferences.channels, channel]
    })

    setNewChannel({
      name: '',
      type: 'email',
      enabled: true,
      config: {}
    })
    setIsAddingChannel(false)
  }

  const updateChannel = (id: string, updates: Partial<NotificationChannel>) => {
    setPreferences({
      ...preferences,
      channels: preferences.channels.map(channel =>
        channel.id === id ? { ...channel, ...updates } : channel
      )
    })
  }

  const deleteChannel = (id: string) => {
    setPreferences({
      ...preferences,
      channels: preferences.channels.filter(c => c.id !== id),
      defaults: {
        critical: preferences.defaults.critical.filter(cId => cId !== id),
        warning: preferences.defaults.warning.filter(cId => cId !== id),
        info: preferences.defaults.info.filter(cId => cId !== id)
      }
    })
  }

  const testNotification = async (channelId: string) => {
    await notificationManager.sendNotification(
      'Test Notification',
      'This is a test notification from your Meta Ads Dashboard.',
      'info',
      [channelId],
      { timestamp: new Date().toISOString() }
    )
    
    toast({
      title: "Test sent",
      description: "Check your notification channel for the test message."
    })
  }

  const updateDefaultChannels = (priority: 'critical' | 'warning' | 'info', channelIds: string[]) => {
    setPreferences({
      ...preferences,
      defaults: {
        ...preferences.defaults,
        [priority]: channelIds
      }
    })
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'slack': return <MessageSquare className="h-4 w-4" />
      case 'webhook': return <Webhook className="h-4 w-4" />
      case 'in-app': return <Bell className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info': return <Info className="h-4 w-4 text-blue-500" />
      default: return <Info className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notification Preferences
          </h2>
          <p className="text-muted-foreground">Configure how you receive alerts and updates</p>
        </div>
        <Button onClick={savePreferences} className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="priorities">Priority Settings</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notification Channels</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingChannel(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Channel
            </Button>
          </div>

          {isAddingChannel && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add New Channel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Channel Name</Label>
                    <Input
                      placeholder="e.g., Team Slack"
                      value={newChannel.name}
                      onChange={(e) => setNewChannel({...newChannel, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Channel Type</Label>
                    <Select
                      value={newChannel.type}
                      onValueChange={(value: any) => setNewChannel({...newChannel, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="slack">Slack</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newChannel.type === 'email' && (
                  <div className="space-y-2">
                    <Label>Recipients (one per line)</Label>
                    <Textarea
                      placeholder="email@example.com"
                      onChange={(e) => setNewChannel({
                        ...newChannel,
                        config: { ...newChannel.config, recipients: e.target.value.split('\n').filter(e => e) }
                      })}
                    />
                  </div>
                )}

                {newChannel.type === 'slack' && (
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input
                      placeholder="https://hooks.slack.com/services/..."
                      onChange={(e) => setNewChannel({
                        ...newChannel,
                        config: { ...newChannel.config, webhookUrl: e.target.value }
                      })}
                    />
                  </div>
                )}

                {newChannel.type === 'webhook' && (
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input
                      placeholder="https://your-webhook-endpoint.com"
                      onChange={(e) => setNewChannel({
                        ...newChannel,
                        config: { ...newChannel.config, url: e.target.value }
                      })}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={addChannel}>Add Channel</Button>
                  <Button variant="outline" onClick={() => setIsAddingChannel(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {preferences.channels.map((channel) => (
              <Card key={channel.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(channel.type)}
                        <h4 className="font-semibold">{channel.name}</h4>
                        <Badge variant={channel.enabled ? "default" : "secondary"}>
                          {channel.type}
                        </Badge>
                        {channel.enabled ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Volume2 className="h-3 w-3 mr-1" />
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <VolumeX className="h-3 w-3 mr-1" />
                            Disabled
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {channel.type === 'email' && channel.config.recipients && (
                          <p>Recipients: {channel.config.recipients.join(', ')}</p>
                        )}
                        {channel.type === 'slack' && channel.config.webhookUrl && (
                          <p>Webhook configured</p>
                        )}
                        {channel.type === 'in-app' && (
                          <p>Notifications appear in the dashboard</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={channel.enabled}
                        onCheckedChange={(checked) => 
                          updateChannel(channel.id, { enabled: checked })
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testNotification(channel.id)}
                        disabled={!channel.enabled}
                      >
                        <TestTube className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                      {channel.type !== 'in-app' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteChannel(channel.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="priorities" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose which channels receive notifications for each priority level
          </p>

          {(['critical', 'warning', 'info'] as const).map((priority) => (
            <Card key={priority}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {getPriorityIcon(priority)}
                  {priority.charAt(0).toUpperCase() + priority.slice(1)} Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {preferences.channels.map((channel) => (
                    <div key={channel.id} className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.defaults[priority].includes(channel.id)}
                        onCheckedChange={(checked) => {
                          const current = preferences.defaults[priority]
                          updateDefaultChannels(
                            priority,
                            checked 
                              ? [...current, channel.id]
                              : current.filter(id => id !== channel.id)
                          )
                        }}
                      />
                      <Label className="flex items-center gap-2 cursor-pointer">
                        {getChannelIcon(channel.type)}
                        {channel.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Desktop Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Show browser notifications for critical alerts
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sound Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Play sound for critical notifications
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive daily summary of all notifications
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Quiet Hours</Label>
                    <p className="text-sm text-muted-foreground">
                      Pause non-critical notifications during specified hours
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { id: 'budget', name: 'Budget Alerts', description: 'When spending approaches limits' },
                  { id: 'performance', name: 'Performance Alerts', description: 'Significant metric changes' },
                  { id: 'automation', name: 'Automation Updates', description: 'Rule triggers and actions' },
                  { id: 'reports', name: 'Report Notifications', description: 'Scheduled report delivery' },
                  { id: 'system', name: 'System Updates', description: 'Platform updates and maintenance' }
                ].map((category) => (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{category.name}</Label>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                    <Switch defaultChecked />
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