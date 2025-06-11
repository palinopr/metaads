'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useWebSocket } from '@/hooks/use-websocket'

// Import all real-time components
import { RealtimeDashboard } from '@/components/realtime-dashboard'
import { LivePerformanceMonitor } from '@/components/live-performance-monitor'
import { RealtimeAlertsCenter } from '@/components/realtime-alerts-center'
import { LiveBudgetTracker } from '@/components/live-budget-tracker'
import { LiveABTestMonitor } from '@/components/live-ab-test-monitor'
import { LiveCollaboration } from '@/components/live-collaboration'
import { RealtimeCompetitorTracking } from '@/components/realtime-competitor-tracking'

import { 
  Activity, 
  Zap, 
  Users, 
  DollarSign, 
  Target, 
  Bell, 
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react'

export default function RealtimePage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [demoMode, setDemoMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  const { isConnected, sendMessage, connect, disconnect } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/ws',
    reconnect: true,
    reconnectInterval: 5000,
    reconnectAttempts: 5
  })

  const startDemoData = async () => {
    try {
      const response = await fetch('/api/realtime?demo=true')
      if (response.ok) {
        setDemoMode(true)
        setTimeout(() => setDemoMode(false), 30000) // Run demo for 30 seconds
      }
    } catch (error) {
      console.error('Failed to start demo:', error)
    }
  }

  const testConnection = () => {
    sendMessage({
      type: 'ping',
      data: { test: true }
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-time Analytics Hub</h1>
          <p className="text-muted-foreground">
            Live monitoring, alerts, and collaboration for your Meta Ads campaigns
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Live' : 'Disconnected'}
            </Badge>
          </div>

          {/* Demo Mode */}
          {demoMode && (
            <Badge variant="secondary" className="animate-pulse">
              <Activity className="h-3 w-3 mr-1" />
              Demo Mode
            </Badge>
          )}

          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={startDemoData}
            disabled={demoMode}
          >
            <Play className="h-4 w-4 mr-2" />
            Demo Data
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={testConnection}
            disabled={!isConnected}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Test
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Metrics</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Updating now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A/B Tests</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Running now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Online</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Members active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Health</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Average utilization</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="text-xs">
            <BarChart3 className="h-4 w-4 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-xs">
            <Zap className="h-4 w-4 mr-1" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">
            <Bell className="h-4 w-4 mr-1" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="budget" className="text-xs">
            <DollarSign className="h-4 w-4 mr-1" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="ab-tests" className="text-xs">
            <Target className="h-4 w-4 mr-1" />
            A/B Tests
          </TabsTrigger>
          <TabsTrigger value="collaboration" className="text-xs">
            <Users className="h-4 w-4 mr-1" />
            Team
          </TabsTrigger>
          <TabsTrigger value="competitors" className="text-xs">
            <Activity className="h-4 w-4 mr-1" />
            Market
          </TabsTrigger>
        </TabsList>

        {/* Real-time Dashboard Overview */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Dashboard</CardTitle>
              <CardDescription>
                Live performance metrics with automated updates every 5 seconds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RealtimeDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Performance Monitor */}
        <TabsContent value="performance" className="space-y-4">
          <LivePerformanceMonitor />
        </TabsContent>

        {/* Real-time Alerts Center */}
        <TabsContent value="alerts" className="space-y-4">
          <RealtimeAlertsCenter />
        </TabsContent>

        {/* Live Budget Tracker */}
        <TabsContent value="budget" className="space-y-4">
          <LiveBudgetTracker />
        </TabsContent>

        {/* Live A/B Test Monitor */}
        <TabsContent value="ab-tests" className="space-y-4">
          <LiveABTestMonitor />
        </TabsContent>

        {/* Live Collaboration */}
        <TabsContent value="collaboration" className="space-y-4">
          <LiveCollaboration />
        </TabsContent>

        {/* Competitor Tracking */}
        <TabsContent value="competitors" className="space-y-4">
          <RealtimeCompetitorTracking />
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Real-time Settings</DialogTitle>
            <DialogDescription>
              Configure your real-time monitoring preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Connection Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Connection</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">WebSocket URL</label>
                  <p className="text-sm text-muted-foreground">
                    {process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/ws'}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Badge variant={isConnected ? 'default' : 'destructive'}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={connect}
                  disabled={isConnected}
                >
                  Connect
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnect}
                  disabled={!isConnected}
                >
                  Disconnect
                </Button>
              </div>
            </div>

            {/* Update Intervals */}
            <div className="space-y-4">
              <h4 className="font-medium">Update Intervals</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dashboard Refresh</label>
                  <p className="text-sm text-muted-foreground">5 seconds</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Alerts Check</label>
                  <p className="text-sm text-muted-foreground">30 seconds</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget Monitor</label>
                  <p className="text-sm text-muted-foreground">1 minute</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Competitor Data</label>
                  <p className="text-sm text-muted-foreground">5 minutes</p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-4">
              <h4 className="font-medium">Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Browser Notifications</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sound Alerts</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email Notifications</span>
                  <Badge variant="secondary">Disabled</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Close
            </Button>
            <Button onClick={() => setShowSettings(false)}>
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer Status */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>System Status: Operational</span>
              <span>•</span>
              <span>Last Update: {new Date().toLocaleTimeString()}</span>
              <span>•</span>
              <span>Uptime: 99.9%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Real-time monitoring active</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}