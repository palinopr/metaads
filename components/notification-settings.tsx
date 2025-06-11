'use client'

import React, { useState, useEffect } from 'react'
// import { motion } from 'framer-motion'
import {
  Bell,
  BellOff,
  Settings,
  Clock,
  Volume2,
  VolumeX,
  Vibrate,
  Smartphone,
  TestTube,
  Check,
  X,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePushNotifications, useNotificationPreferences } from '@/hooks/use-push-notifications'
import { useDeviceOptimizations } from '@/hooks/use-mobile'

export function NotificationSettings() {
  const {
    isSupported,
    isInitialized,
    isSubscribed,
    permission,
    isLoading,
    error,
    initialize,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification
  } = usePushNotifications()

  const {
    preferences,
    toggleCategory,
    toggleQuietHours,
    setQuietHours,
    setFrequency,
    updatePreferences
  } = useNotificationPreferences()

  const { isMobile } = useDeviceOptimizations()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle')

  // Initialize on mount
  useEffect(() => {
    if (isSupported && !isInitialized) {
      initialize()
    }
  }, [isSupported, isInitialized, initialize])

  // Handle test notification
  const handleTestNotification = async () => {
    setTestStatus('testing')
    try {
      await testNotification()
      setTestStatus('success')
      setTimeout(() => setTestStatus('idle'), 3000)
    } catch (error) {
      setTestStatus('failed')
      setTimeout(() => setTestStatus('idle'), 3000)
    }
  }

  // Handle subscription toggle
  const handleSubscriptionToggle = async () => {
    if (isSubscribed) {
      await unsubscribe()
    } else {
      if (permission !== 'granted') {
        await requestPermission()
      }
      await subscribe()
    }
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your browser or device doesn't support push notifications. 
              Please use a modern browser with notification support.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications
            </div>
            <Badge variant={isSubscribed ? "default" : "secondary"}>
              {isSubscribed ? "Enabled" : "Disabled"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Get notified about campaign updates, performance alerts, and important changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Main Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Enable Push Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Allow the app to send you notifications
              </p>
            </div>
            <Switch
              checked={isSubscribed && preferences?.enabled}
              onCheckedChange={handleSubscriptionToggle}
              disabled={isLoading || permission === 'denied'}
            />
          </div>

          {/* Permission Status */}
          {permission !== 'granted' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {permission === 'denied' 
                  ? "Notifications are blocked. Please enable them in your browser settings."
                  : "Click the toggle above to enable notifications."
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Test Notification */}
          {isSubscribed && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestNotification}
                disabled={testStatus === 'testing'}
                className="touch-target"
              >
                <TestTube className={cn(
                  "h-4 w-4 mr-2",
                  testStatus === 'testing' && "animate-spin"
                )} />
                Test Notification
              </Button>
              {testStatus === 'success' && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Test sent!</span>
                </div>
              )}
              {testStatus === 'failed' && (
                <div className="flex items-center gap-1 text-red-600">
                  <X className="h-4 w-4" />
                  <span className="text-sm">Test failed</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      {isSubscribed && preferences && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Categories</CardTitle>
            <CardDescription>
              Choose which types of notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(preferences.categories).map(([category, enabled]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium capitalize">{category}</h4>
                  <p className="text-sm text-muted-foreground">
                    {getCategoryDescription(category)}
                  </p>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={() => toggleCategory(category as any)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Advanced Settings */}
      {isSubscribed && preferences && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Settings
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide' : 'Show'}
              </Button>
            </CardTitle>
          </CardHeader>
          {showAdvanced && (
            <CardContent className="space-y-6">
              {/* Quiet Hours */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Quiet Hours
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Disable notifications during specified hours
                    </p>
                  </div>
                  <Switch
                    checked={preferences.quietHours.enabled}
                    onCheckedChange={toggleQuietHours}
                  />
                </div>

                {preferences.quietHours.enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="text-sm font-medium">Start Time</label>
                      <input
                        type="time"
                        value={preferences.quietHours.start}
                        onChange={(e) => setQuietHours(e.target.value, preferences.quietHours.end)}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Time</label>
                      <input
                        type="time"
                        value={preferences.quietHours.end}
                        onChange={(e) => setQuietHours(preferences.quietHours.start, e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <Separator />

              {/* Notification Frequency */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Notification Frequency</h4>
                {Object.entries(preferences.frequency).map(([category, frequency]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{category}</span>
                    <Select
                      value={frequency}
                      onValueChange={(value) => setFrequency(category as any, value as any)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        {category === 'alert' && (
                          <SelectItem value="never">Never</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Media Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Media & Interaction</h4>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm">Sound</span>
                  </div>
                  <Switch
                    checked={preferences.sound}
                    onCheckedChange={(checked) => updatePreferences({ sound: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Vibrate className="h-4 w-4" />
                    <span className="text-sm">Vibration</span>
                  </div>
                  <Switch
                    checked={preferences.vibration}
                    onCheckedChange={(checked) => updatePreferences({ vibration: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm">Group Similar Notifications</span>
                  </div>
                  <Switch
                    checked={preferences.grouping}
                    onCheckedChange={(checked) => updatePreferences({ grouping: checked })}
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Mobile-specific note */}
      {isMobile && (
        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertDescription>
            On mobile devices, you can also manage notification settings in your device's system settings.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function getCategoryDescription(category: string): string {
  const descriptions = {
    campaign: "Updates about campaign status changes and optimizations",
    performance: "Alerts when metrics exceed thresholds or opportunities arise", 
    alert: "Critical issues that require immediate attention",
    system: "App updates, maintenance, and general announcements",
    automation: "When automation rules are triggered or actions are taken"
  }
  
  return descriptions[category as keyof typeof descriptions] || "Notifications for this category"
}