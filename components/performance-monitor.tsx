"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  Zap, 
  Database, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Gauge,
  HardDrive,
  Network,
  Clock
} from 'lucide-react'
import { optimizedApiManager } from '@/lib/api-manager-optimized'

interface PerformanceMetrics {
  pageLoad: number
  apiResponseTime: number
  cacheHitRate: number
  memoryUsage: number
  bundleSize: number
  activeConnections: number
  errorRate: number
  successRate: number
}

interface CacheStats {
  memoryEntries: number
  memorySize: number
  maxMemorySize: number
  utilizationPercent: number
}

interface RateLimitStatus {
  remaining: number
  resetIn: number
  total: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoad: 0,
    apiResponseTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    bundleSize: 0,
    activeConnections: 0,
    errorRate: 0,
    successRate: 100
  })

  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    if (!isMonitoring) return

    const updateMetrics = () => {
      // Get performance stats from API manager
      const stats = optimizedApiManager.getPerformanceStats()
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        apiResponseTime: stats.avgResponseTime || 0,
        cacheHitRate: stats.cacheHitRate || 0,
        successRate: stats.successRate || 100,
        errorRate: 100 - (stats.successRate || 100),
        activeConnections: stats.deduplicator?.inFlightCount || 0
      }))

      // Update cache stats
      if (stats.cache) {
        setCacheStats(stats.cache)
      }

      // Update rate limit status
      if (stats.rateLimit) {
        setRateLimitStatus(stats.rateLimit)
      }

      // Measure page performance
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigation) {
          setMetrics(prev => ({
            ...prev,
            pageLoad: navigation.loadEventEnd - navigation.loadEventStart
          }))
        }

        // Memory usage (if available)
        if ('memory' in performance) {
          const memory = (performance as any).memory
          setMetrics(prev => ({
            ...prev,
            memoryUsage: memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100
          }))
        }
      }

      setLastUpdate(new Date())
    }

    // Initial update
    updateMetrics()

    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000)

    return () => clearInterval(interval)
  }, [isMonitoring])

  const getMetricStatus = (value: number, thresholds: { good: number, warning: number }) => {
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.warning) return 'warning'
    return 'critical'
  }

  const getMetricColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'critical': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getMetricIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4" />
      case 'warning': return <AlertCircle className="w-4 h-4" />
      case 'critical': return <AlertCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const clearCache = async () => {
    optimizedApiManager.clearCache()
    // Send message to service worker to clear cache
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const channel = new MessageChannel()
      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [channel.port2]
      )
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-blue-500" />
              Performance Monitor
            </CardTitle>
            <CardDescription>
              Real-time performance metrics and optimization status
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isMonitoring ? "default" : "secondary"}>
              {isMonitoring ? "Live" : "Paused"}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMonitoring(!isMonitoring)}
            >
              {isMonitoring ? "Pause" : "Resume"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Web Vitals */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-gray-300">Core Web Vitals</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Page Load Time"
              value={`${metrics.pageLoad.toFixed(0)}ms`}
              target="< 2000ms"
              status={getMetricStatus(metrics.pageLoad, { good: 2000, warning: 3000 })}
              icon={<Clock className="w-4 h-4" />}
              progress={(2000 - Math.min(metrics.pageLoad, 2000)) / 2000 * 100}
            />
            <MetricCard
              title="API Response Time"
              value={`${metrics.apiResponseTime.toFixed(0)}ms`}
              target="< 200ms"
              status={getMetricStatus(metrics.apiResponseTime, { good: 200, warning: 500 })}
              icon={<Network className="w-4 h-4" />}
              progress={(500 - Math.min(metrics.apiResponseTime, 500)) / 500 * 100}
            />
            <MetricCard
              title="Memory Usage"
              value={`${metrics.memoryUsage.toFixed(1)}%`}
              target="< 70%"
              status={getMetricStatus(metrics.memoryUsage, { good: 70, warning: 85 })}
              icon={<HardDrive className="w-4 h-4" />}
              progress={100 - metrics.memoryUsage}
            />
          </div>
        </div>

        {/* Cache Performance */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-gray-300">Cache Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              title="Cache Hit Rate"
              value={`${metrics.cacheHitRate.toFixed(1)}%`}
              target="> 80%"
              status={metrics.cacheHitRate > 80 ? 'good' : metrics.cacheHitRate > 60 ? 'warning' : 'critical'}
              icon={<Database className="w-4 h-4" />}
              progress={metrics.cacheHitRate}
            />
            {cacheStats && (
              <MetricCard
                title="Cache Memory"
                value={`${(cacheStats.memorySize / 1024 / 1024).toFixed(1)}MB`}
                target={`/ ${(cacheStats.maxMemorySize / 1024 / 1024).toFixed(0)}MB`}
                status={cacheStats.utilizationPercent < 80 ? 'good' : cacheStats.utilizationPercent < 90 ? 'warning' : 'critical'}
                icon={<Database className="w-4 h-4" />}
                progress={100 - cacheStats.utilizationPercent}
              />
            )}
          </div>
        </div>

        {/* API Performance */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-gray-300">API Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Success Rate"
              value={`${metrics.successRate.toFixed(1)}%`}
              target="> 99%"
              status={metrics.successRate > 99 ? 'good' : metrics.successRate > 95 ? 'warning' : 'critical'}
              icon={<CheckCircle className="w-4 h-4" />}
              progress={metrics.successRate}
            />
            <MetricCard
              title="Active Connections"
              value={metrics.activeConnections.toString()}
              target="< 5"
              status={metrics.activeConnections < 5 ? 'good' : metrics.activeConnections < 10 ? 'warning' : 'critical'}
              icon={<Activity className="w-4 h-4" />}
              progress={(10 - Math.min(metrics.activeConnections, 10)) / 10 * 100}
            />
            {rateLimitStatus && (
              <MetricCard
                title="Rate Limit"
                value={`${rateLimitStatus.remaining}/${rateLimitStatus.total}`}
                target={`Resets in ${rateLimitStatus.resetIn}s`}
                status={rateLimitStatus.remaining > 10 ? 'good' : rateLimitStatus.remaining > 5 ? 'warning' : 'critical'}
                icon={<Zap className="w-4 h-4" />}
                progress={(rateLimitStatus.remaining / rateLimitStatus.total) * 100}
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={clearCache}
              className="text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Clear Cache
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface MetricCardProps {
  title: string
  value: string
  target: string
  status: string
  icon: React.ReactNode
  progress: number
}

function MetricCard({ title, value, target, status, icon, progress }: MetricCardProps) {
  const color = status === 'good' ? 'text-green-500' : status === 'warning' ? 'text-yellow-500' : 'text-red-500'
  const bgColor = status === 'good' ? 'bg-green-500/10' : status === 'warning' ? 'bg-yellow-500/10' : 'bg-red-500/10'
  
  return (
    <div className={`p-4 rounded-lg border ${bgColor} border-gray-700`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{title}</span>
        <span className={color}>{icon}</span>
      </div>
      <div className="flex items-baseline justify-between mb-2">
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        <span className="text-xs text-gray-500">{target}</span>
      </div>
      <Progress value={progress} className="h-1" />
    </div>
  )
}