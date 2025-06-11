"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  WifiOff, 
  RefreshCw, 
  Clock, 
  Database,
  BarChart3,
  TrendingUp,
  DollarSign,
  Activity
} from 'lucide-react'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const [cachedData, setCachedData] = useState<any>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load cached data
    loadCachedData()

    // Get last sync time
    const syncTime = localStorage.getItem('lastSyncTime')
    if (syncTime) {
      setLastSync(new Date(syncTime).toLocaleString())
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadCachedData = async () => {
    try {
      // Try to get cached campaign data
      if ('caches' in window) {
        const cache = await caches.open('meta-ads-api-v1.0.0')
        const keys = await cache.keys()
        
        // Find campaign data
        for (const request of keys) {
          if (request.url.includes('/api/meta')) {
            const response = await cache.match(request)
            if (response) {
              const data = await response.json()
              setCachedData(data)
              break
            }
          }
        }
      }

      // Also check localStorage for summary data
      const summaryData = localStorage.getItem('dashboardSummary')
      if (summaryData && !cachedData) {
        setCachedData(JSON.parse(summaryData))
      }
    } catch (error) {
      console.error('Error loading cached data:', error)
    }
  }

  const handleRetry = () => {
    if (isOnline) {
      window.location.href = '/'
    } else {
      window.location.reload()
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Offline Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <WifiOff className="h-16 w-16 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">You're Offline</h1>
          <p className="text-muted-foreground">
            Don't worry! You can still view your cached data.
          </p>
          {lastSync && (
            <p className="text-sm text-muted-foreground mt-2">
              Last synced: {lastSync}
            </p>
          )}
        </div>

        {/* Connection Status */}
        <Alert className="mb-6">
          <AlertDescription className="flex items-center justify-between">
            <span>
              {isOnline 
                ? "You're back online! Click retry to load fresh data."
                : "No internet connection detected. Showing cached data."}
            </span>
            <Button 
              onClick={handleRetry} 
              size="sm"
              variant={isOnline ? "default" : "outline"}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isOnline ? "Load Fresh Data" : "Retry"}
            </Button>
          </AlertDescription>
        </Alert>

        {/* Cached Data Display */}
        {cachedData ? (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Summary Cards */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(cachedData.totalSpend || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cached data
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cachedData.activeCampaigns || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cached data
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(cachedData.totalRevenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cached data
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average ROAS</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cachedData.averageRoas?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cached data
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                No Cached Data Available
              </CardTitle>
              <CardDescription>
                Connect to the internet and visit the dashboard to cache data for offline viewing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Offline Features */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Offline Features</CardTitle>
            <CardDescription>
              Here's what you can do while offline:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>View cached campaign data</span>
              </li>
              <li className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span>Access historical performance metrics</span>
              </li>
              <li className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span>Review analytics from your last session</span>
              </li>
              <li className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <span>All changes will sync when you're back online</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}