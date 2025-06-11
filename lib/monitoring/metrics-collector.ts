/**
 * Advanced Metrics Collection System
 * 
 * Collects comprehensive application, business, and system metrics
 * with real-time aggregation and buffering capabilities
 */

import { SystemMetric } from './index'

export interface MetricSeries {
  name: string
  points: Array<{ timestamp: number; value: number }>
  tags: Record<string, string>
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'p50' | 'p95' | 'p99'
}

export interface MetricSnapshot {
  timestamp: Date
  counters: Map<string, number>
  gauges: Map<string, number>
  histograms: Map<string, number[]>
  timers: Map<string, number[]>
  sets: Map<string, Set<string>>
}

export class AdvancedMetricsCollector {
  private metrics: Map<string, SystemMetric[]> = new Map()
  private counters: Map<string, number> = new Map()
  private gauges: Map<string, number> = new Map()
  private histograms: Map<string, number[]> = new Map()
  private timers: Map<string, number[]> = new Map()
  private sets: Map<string, Set<string>> = new Map()
  
  private buffer: SystemMetric[] = []
  private bufferSize = 1000
  private flushInterval: NodeJS.Timeout | null = null
  private flushIntervalMs = 10000 // 10 seconds
  
  private sampleRate = 1.0
  private enabled = true

  constructor(options: { 
    bufferSize?: number
    flushIntervalMs?: number
    sampleRate?: number
    enabled?: boolean
  } = {}) {
    this.bufferSize = options.bufferSize ?? 1000
    this.flushIntervalMs = options.flushIntervalMs ?? 10000
    this.sampleRate = options.sampleRate ?? 1.0
    this.enabled = options.enabled ?? true
    
    this.startFlushInterval()
  }

  // Counter operations
  increment(name: string, value = 1, tags: Record<string, string> = {}): void {
    if (!this.shouldSample()) return
    
    const key = this.buildKey(name, tags)
    const current = this.counters.get(key) || 0
    this.counters.set(key, current + value)
    
    this.addToBuffer({
      name,
      value: current + value,
      timestamp: new Date(),
      tags: { ...tags, type: 'counter' },
      type: 'counter'
    })
  }

  decrement(name: string, value = 1, tags: Record<string, string> = {}): void {
    this.increment(name, -value, tags)
  }

  // Gauge operations
  gauge(name: string, value: number, tags: Record<string, string> = {}): void {
    if (!this.shouldSample()) return
    
    const key = this.buildKey(name, tags)
    this.gauges.set(key, value)
    
    this.addToBuffer({
      name,
      value,
      timestamp: new Date(),
      tags: { ...tags, type: 'gauge' },
      type: 'gauge'
    })
  }

  // Histogram operations
  histogram(name: string, value: number, tags: Record<string, string> = {}): void {
    if (!this.shouldSample()) return
    
    const key = this.buildKey(name, tags)
    const values = this.histograms.get(key) || []
    values.push(value)
    
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift()
    }
    
    this.histograms.set(key, values)
    
    this.addToBuffer({
      name,
      value,
      timestamp: new Date(),
      tags: { ...tags, type: 'histogram' },
      type: 'histogram'
    })
  }

  // Timer operations
  timer(name: string, duration: number, tags: Record<string, string> = {}): void {
    this.histogram(name, duration, { ...tags, unit: 'ms' })
  }

  time<T>(name: string, fn: () => T, tags: Record<string, string> = {}): T {
    const start = Date.now()
    try {
      const result = fn()
      this.timer(name, Date.now() - start, { ...tags, status: 'success' })
      return result
    } catch (error) {
      this.timer(name, Date.now() - start, { ...tags, status: 'error' })
      throw error
    }
  }

  async timeAsync<T>(name: string, fn: () => Promise<T>, tags: Record<string, string> = {}): Promise<T> {
    const start = Date.now()
    try {
      const result = await fn()
      this.timer(name, Date.now() - start, { ...tags, status: 'success' })
      return result
    } catch (error) {
      this.timer(name, Date.now() - start, { ...tags, status: 'error' })
      throw error
    }
  }

  // Set operations
  set(name: string, value: string, tags: Record<string, string> = {}): void {
    if (!this.shouldSample()) return
    
    const key = this.buildKey(name, tags)
    const values = this.sets.get(key) || new Set()
    values.add(value)
    this.sets.set(key, values)
    
    this.addToBuffer({
      name,
      value: values.size,
      timestamp: new Date(),
      tags: { ...tags, type: 'set' },
      type: 'set'
    })
  }

  // Business metrics helpers
  trackUserAction(action: string, userId?: string, metadata: Record<string, any> = {}): void {
    this.increment('user.actions', 1, {
      action,
      userId: userId || 'anonymous',
      ...Object.entries(metadata).reduce((acc, [k, v]) => ({
        ...acc,
        [k]: String(v)
      }), {})
    })
  }

  trackApiCall(endpoint: string, method: string, status: number, duration: number): void {
    this.increment('api.requests', 1, { endpoint, method, status: status.toString() })
    this.timer('api.duration', duration, { endpoint, method })
    
    if (status >= 400) {
      this.increment('api.errors', 1, { endpoint, method, status: status.toString() })
    }
  }

  trackCampaignMetric(metric: string, value: number, campaignId: string, tags: Record<string, string> = {}): void {
    this.gauge(`campaign.${metric}`, value, { campaignId, ...tags })
  }

  trackRevenue(amount: number, source: string, campaignId?: string): void {
    this.increment('revenue.total', amount, { source, campaignId: campaignId || 'unknown' })
    this.gauge('revenue.last', amount, { source })
  }

  trackError(error: Error, context: Record<string, any> = {}): void {
    this.increment('errors.total', 1, {
      type: error.constructor.name,
      message: error.message.substring(0, 100),
      ...Object.entries(context).reduce((acc, [k, v]) => ({
        ...acc,
        [k]: String(v)
      }), {})
    })
  }

  // Analytics helpers
  getHistogramStats(name: string, tags: Record<string, string> = {}): {
    count: number
    min: number
    max: number
    mean: number
    median: number
    p95: number
    p99: number
  } | null {
    const key = this.buildKey(name, tags)
    const values = this.histograms.get(key)
    
    if (!values || values.length === 0) {
      return null
    }

    const sorted = [...values].sort((a, b) => a - b)
    const count = sorted.length
    const sum = sorted.reduce((a, b) => a + b, 0)

    return {
      count,
      min: sorted[0],
      max: sorted[count - 1],
      mean: sum / count,
      median: sorted[Math.floor(count / 2)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)]
    }
  }

  getSnapshot(): MetricSnapshot {
    return {
      timestamp: new Date(),
      counters: new Map(this.counters),
      gauges: new Map(this.gauges),
      histograms: new Map(this.histograms),
      timers: new Map(this.timers),
      sets: new Map(this.sets)
    }
  }

  getSeries(name: string, since: Date = new Date(Date.now() - 3600000)): MetricSeries[] {
    const metrics = this.metrics.get(name) || []
    const filtered = metrics.filter(m => m.timestamp >= since)
    
    // Group by tags
    const series: Map<string, MetricSeries> = new Map()
    
    filtered.forEach(metric => {
      const tagsKey = JSON.stringify(metric.tags)
      let serie = series.get(tagsKey)
      
      if (!serie) {
        serie = {
          name,
          points: [],
          tags: metric.tags,
          aggregation: 'avg'
        }
        series.set(tagsKey, serie)
      }
      
      serie.points.push({
        timestamp: metric.timestamp.getTime(),
        value: typeof metric.value === 'number' ? metric.value : 0
      })
    })
    
    return Array.from(series.values())
  }

  // Internal methods
  private shouldSample(): boolean {
    return this.enabled && (this.sampleRate >= 1.0 || Math.random() < this.sampleRate)
  }

  private buildKey(name: string, tags: Record<string, string>): string {
    if (Object.keys(tags).length === 0) {
      return name
    }
    
    const sortedTags = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',')
    
    return `${name}{${sortedTags}}`
  }

  private addToBuffer(metric: SystemMetric): void {
    this.buffer.push(metric)
    
    // Also store in metrics map for queries
    const metrics = this.metrics.get(metric.name) || []
    metrics.push(metric)
    
    // Keep only last 10000 metrics per name
    if (metrics.length > 10000) {
      metrics.shift()
    }
    
    this.metrics.set(metric.name, metrics)
    
    // Flush if buffer is full
    if (this.buffer.length >= this.bufferSize) {
      this.flush()
    }
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush()
    }, this.flushIntervalMs)
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return
    
    const metricsToFlush = [...this.buffer]
    this.buffer = []
    
    try {
      // Send to monitoring endpoint
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: metricsToFlush })
      })
    } catch (error) {
      console.error('Failed to flush metrics:', error)
      // Re-add to buffer on failure (with limit)
      this.buffer.unshift(...metricsToFlush.slice(-500))
    }
  }

  // Public flush and cleanup
  async forceFlush(): Promise<void> {
    await this.flush()
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    this.flush()
  }

  // Configuration
  setSampleRate(rate: number): void {
    this.sampleRate = Math.max(0, Math.min(1, rate))
  }

  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
  }

  clear(): void {
    this.metrics.clear()
    this.counters.clear()
    this.gauges.clear()
    this.histograms.clear()
    this.timers.clear()
    this.sets.clear()
    this.buffer = []
  }
}

// Global instance
export const metricsCollector = new AdvancedMetricsCollector()

// React hook for metrics
import { useCallback, useEffect } from 'react'

export function useMetrics(component: string) {
  useEffect(() => {
    metricsCollector.trackUserAction('component.mount', undefined, { component })
    
    return () => {
      metricsCollector.trackUserAction('component.unmount', undefined, { component })
    }
  }, [component])

  const track = useCallback((action: string, value?: number, tags?: Record<string, string>) => {
    if (value !== undefined) {
      metricsCollector.gauge(`ui.${action}`, value, { component, ...tags })
    } else {
      metricsCollector.increment(`ui.${action}`, 1, { component, ...tags })
    }
  }, [component])

  const trackTiming = useCallback((action: string, duration: number, tags?: Record<string, string>) => {
    metricsCollector.timer(`ui.${action}`, duration, { component, ...tags })
  }, [component])

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    metricsCollector.trackError(error, { component, ...context })
  }, [component])

  return { track, trackTiming, trackError }
}