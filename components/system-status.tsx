"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, XCircle, AlertCircle, RefreshCw, 
  Wifi, WifiOff, Database, Key, Activity, Settings
} from 'lucide-react'

interface SystemStatusProps {
  accessToken?: string
  adAccountId?: string
  campaignsCount: number
  isLoading?: boolean
  error?: string | null
  onOpenSettings?: () => void
}

export function SystemStatus({ 
  accessToken, 
  adAccountId, 
  campaignsCount, 
  isLoading,
  error,
  onOpenSettings
}: SystemStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [timestamp, setTimestamp] = useState(new Date())

  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const checks = [
    {
      name: 'Internet Connection',
      status: isOnline ? 'success' : 'error',
      icon: isOnline ? Wifi : WifiOff,
      message: isOnline ? 'Connected' : 'No internet connection'
    },
    {
      name: 'API Credentials',
      status: accessToken && adAccountId ? 'success' : 'warning',
      icon: Key,
      message: accessToken && adAccountId 
        ? 'Configured' 
        : 'Not configured - Click Settings to add'
    },
    {
      name: 'Meta API Connection',
      status: error ? 'error' : (campaignsCount > 0 ? 'success' : 'warning'),
      icon: Database,
      message: error || (campaignsCount > 0 
        ? `Connected (${campaignsCount} campaigns)` 
        : 'No campaigns found')
    },
    {
      name: 'Application Status',
      status: isLoading ? 'loading' : 'success',
      icon: Activity,
      message: isLoading ? 'Loading...' : 'Ready'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-500'
      case 'error': return 'text-red-500'
      case 'warning': return 'text-yellow-500'
      case 'loading': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return CheckCircle
      case 'error': return XCircle
      case 'warning': return AlertCircle
      default: return RefreshCw
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
        <CardDescription>
          Real-time diagnostics • Last checked: {timestamp.toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {checks.map((check) => {
          const StatusIcon = getStatusIcon(check.status)
          const ItemIcon = check.icon
          
          return (
            <div key={check.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ItemIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{check.name}</p>
                  <p className="text-sm text-muted-foreground">{check.message}</p>
                </div>
              </div>
              <StatusIcon className={`h-5 w-5 ${getStatusColor(check.status)}`} />
            </div>
          )
        })}
        
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Quick Diagnosis:</h4>
          {!accessToken && (
            <p className="text-sm text-muted-foreground mb-2">
              • Add your Meta API credentials to see campaigns
            </p>
          )}
          {accessToken && campaignsCount === 0 && !error && (
            <p className="text-sm text-muted-foreground mb-2">
              • Credentials added but no campaigns found - check if account has active campaigns
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 mb-2">
              • API Error: {error}
            </p>
          )}
          <div className="flex gap-2 mt-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
            {onOpenSettings && (!accessToken || !adAccountId || error) && (
              <Button
                size="sm"
                onClick={onOpenSettings}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure API
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}