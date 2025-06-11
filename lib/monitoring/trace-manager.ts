/**
 * Distributed Tracing System
 * 
 * Provides comprehensive distributed tracing capabilities for performance monitoring
 * and debugging across the entire application stack
 */

import { TraceSpan } from './index'
import { metricsCollector } from './metrics-collector'

export interface TraceContext {
  traceId: string
  spanId: string
  parentSpanId?: string
  baggage?: Record<string, string>
}

export interface SpanOptions {
  operationName: string
  tags?: Record<string, any>
  startTime?: number
  childOf?: TraceSpan | TraceContext
}

export class Span {
  public readonly id: string
  public readonly traceId: string
  public readonly parentId?: string
  public readonly operationName: string
  public readonly startTime: number
  
  private tags: Record<string, any> = {}
  private logs: Array<{ timestamp: number; fields: Record<string, any> }> = []
  private finished = false
  private endTime?: number
  private status: 'ok' | 'error' | 'timeout' = 'ok'

  constructor(options: SpanOptions, traceManager: TraceManager) {
    this.id = this.generateId()
    this.operationName = options.operationName
    this.startTime = options.startTime || Date.now()
    
    if (options.childOf) {
      if ('traceId' in options.childOf) {
        this.traceId = options.childOf.traceId
        this.parentId = options.childOf.spanId
      } else {
        this.traceId = options.childOf.traceId
        this.parentId = options.childOf.id
      }
    } else {
      this.traceId = this.generateId()
    }
    
    if (options.tags) {
      this.tags = { ...options.tags }
    }
    
    // Add default tags
    this.tags.component = 'meta-ads-dashboard'
    this.tags.environment = process.env.NODE_ENV || 'development'
  }

  setTag(key: string, value: any): Span {
    this.tags[key] = value
    return this
  }

  setTags(tags: Record<string, any>): Span {
    Object.assign(this.tags, tags)
    return this
  }

  log(fields: Record<string, any>): Span {
    this.logs.push({
      timestamp: Date.now(),
      fields
    })
    return this
  }

  logEvent(event: string, payload?: any): Span {
    return this.log({ event, payload })
  }

  setStatus(status: 'ok' | 'error' | 'timeout'): Span {
    this.status = status
    return this
  }

  finish(endTime?: number): void {
    if (this.finished) return
    
    this.endTime = endTime || Date.now()
    this.finished = true
    
    const duration = this.endTime - this.startTime
    
    // Record metrics
    metricsCollector.timer('trace.span.duration', duration, {
      operation: this.operationName,
      status: this.status,
      ...Object.entries(this.tags).reduce((acc, [k, v]) => ({
        ...acc,
        [k]: String(v)
      }), {})
    })
    
    // Notify trace manager
    if (this.traceManager) {
      this.traceManager.finishSpan(this)
    }
  }

  toJSON(): TraceSpan {
    return {
      id: this.id,
      traceId: this.traceId,
      parentId: this.parentId,
      operationName: this.operationName,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.endTime ? this.endTime - this.startTime : undefined,
      tags: { ...this.tags },
      logs: [...this.logs],
      status: this.status
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private traceManager?: TraceManager
  
  setTraceManager(manager: TraceManager): void {
    this.traceManager = manager
  }
}

export class TraceManager {
  private activeSpans: Map<string, Span> = new Map()
  private finishedSpans: TraceSpan[] = []
  private maxFinishedSpans = 10000
  private flushInterval: NodeJS.Timeout | null = null
  private samplingRate = 1.0
  private enabled = true

  constructor(options: {
    samplingRate?: number
    maxFinishedSpans?: number
    flushIntervalMs?: number
    enabled?: boolean
  } = {}) {
    this.samplingRate = options.samplingRate ?? 1.0
    this.maxFinishedSpans = options.maxFinishedSpans ?? 10000
    this.enabled = options.enabled ?? true
    
    if (options.flushIntervalMs) {
      this.startFlushInterval(options.flushIntervalMs)
    }
  }

  startSpan(options: SpanOptions): Span {
    if (!this.shouldSample()) {
      return new NoopSpan(options.operationName)
    }
    
    const span = new Span(options, this)
    span.setTraceManager(this)
    this.activeSpans.set(span.id, span)
    
    return span
  }

  finishSpan(span: Span): void {
    this.activeSpans.delete(span.id)
    
    this.finishedSpans.push(span.toJSON())
    
    // Keep only recent spans
    if (this.finishedSpans.length > this.maxFinishedSpans) {
      this.finishedSpans.shift()
    }
  }

  getActiveSpans(): Span[] {
    return Array.from(this.activeSpans.values())
  }

  getFinishedSpans(): TraceSpan[] {
    return [...this.finishedSpans]
  }

  getTrace(traceId: string): TraceSpan[] {
    return this.finishedSpans.filter(span => span.traceId === traceId)
  }

  // High-level tracing helpers
  async traceAsync<T>(
    operationName: string,
    fn: (span: Span) => Promise<T>,
    options: Omit<SpanOptions, 'operationName'> = {}
  ): Promise<T> {
    const span = this.startSpan({ ...options, operationName })
    
    try {
      const result = await fn(span)
      span.setStatus('ok')
      return result
    } catch (error) {
      span.setStatus('error')
      span.log({ 
        level: 'error',
        message: error.message,
        stack: error.stack
      })
      throw error
    } finally {
      span.finish()
    }
  }

  trace<T>(
    operationName: string,
    fn: (span: Span) => T,
    options: Omit<SpanOptions, 'operationName'> = {}
  ): T {
    const span = this.startSpan({ ...options, operationName })
    
    try {
      const result = fn(span)
      span.setStatus('ok')
      return result
    } catch (error) {
      span.setStatus('error')
      span.log({
        level: 'error',
        message: error.message,
        stack: error.stack
      })
      throw error
    } finally {
      span.finish()
    }
  }

  // API request tracing
  traceApiRequest(url: string, method: string, options: RequestInit = {}): Promise<Response> {
    return this.traceAsync('http.request', async (span) => {
      span.setTags({
        'http.url': url,
        'http.method': method,
        'http.user_agent': navigator?.userAgent || 'server'
      })
      
      const startTime = Date.now()
      
      try {
        const response = await fetch(url, options)
        
        span.setTags({
          'http.status_code': response.status,
          'http.status_text': response.statusText
        })
        
        span.log({
          event: 'response_received',
          duration: Date.now() - startTime
        })
        
        if (!response.ok) {
          span.setStatus('error')
        }
        
        return response
      } catch (error) {
        span.setStatus('error')
        span.log({
          event: 'request_failed',
          error: error.message
        })
        throw error
      }
    })
  }

  // Database operation tracing
  traceDbOperation<T>(
    operation: string,
    query: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.traceAsync('db.query', async (span) => {
      span.setTags({
        'db.type': 'meta-api',
        'db.operation': operation,
        'db.statement': query.substring(0, 200) // Truncate long queries
      })
      
      const result = await fn()
      
      span.log({
        event: 'query_completed',
        rows_affected: Array.isArray(result) ? result.length : 1
      })
      
      return result
    })
  }

  // Component lifecycle tracing
  traceComponent(componentName: string): {
    onMount: () => void
    onUnmount: () => void
    onRender: () => void
    onError: (error: Error) => void
  } {
    let mountSpan: Span | null = null
    let renderSpan: Span | null = null
    
    return {
      onMount: () => {
        mountSpan = this.startSpan({
          operationName: 'component.mount',
          tags: { component: componentName }
        })
      },
      
      onUnmount: () => {
        if (mountSpan) {
          mountSpan.finish()
        }
      },
      
      onRender: () => {
        if (renderSpan) {
          renderSpan.finish()
        }
        renderSpan = this.startSpan({
          operationName: 'component.render',
          tags: { component: componentName }
        })
      },
      
      onError: (error: Error) => {
        const errorSpan = this.startSpan({
          operationName: 'component.error',
          tags: { component: componentName }
        })
        
        errorSpan.setStatus('error')
        errorSpan.log({
          level: 'error',
          message: error.message,
          stack: error.stack
        })
        errorSpan.finish()
      }
    }
  }

  // Analytics and reporting
  getTraceAnalytics(timeRange: { start: Date; end: Date }) {
    const relevantSpans = this.finishedSpans.filter(span => 
      span.startTime >= timeRange.start.getTime() && 
      span.startTime <= timeRange.end.getTime()
    )
    
    const operations = new Map<string, {
      count: number
      totalDuration: number
      errors: number
      timeouts: number
    }>()
    
    relevantSpans.forEach(span => {
      const stats = operations.get(span.operationName) || {
        count: 0,
        totalDuration: 0,
        errors: 0,
        timeouts: 0
      }
      
      stats.count++
      stats.totalDuration += span.duration || 0
      
      if (span.status === 'error') stats.errors++
      if (span.status === 'timeout') stats.timeouts++
      
      operations.set(span.operationName, stats)
    })
    
    const analytics = Array.from(operations.entries()).map(([operation, stats]) => ({
      operation,
      count: stats.count,
      avgDuration: stats.totalDuration / stats.count,
      errorRate: stats.errors / stats.count,
      timeoutRate: stats.timeouts / stats.count
    }))
    
    return analytics.sort((a, b) => b.count - a.count)
  }

  private shouldSample(): boolean {
    return this.enabled && (this.samplingRate >= 1.0 || Math.random() < this.samplingRate)
  }

  private startFlushInterval(intervalMs: number): void {
    this.flushInterval = setInterval(() => {
      this.flush()
    }, intervalMs)
  }

  private async flush(): Promise<void> {
    if (this.finishedSpans.length === 0) return
    
    const spansToFlush = [...this.finishedSpans]
    this.finishedSpans = []
    
    try {
      await fetch('/api/monitoring/traces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spans: spansToFlush })
      })
    } catch (error) {
      console.error('Failed to flush traces:', error)
      // Re-add to buffer on failure (with limit)
      this.finishedSpans.unshift(...spansToFlush.slice(-1000))
    }
  }

  setSamplingRate(rate: number): void {
    this.samplingRate = Math.max(0, Math.min(1, rate))
  }

  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
  }

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
}

// No-op implementation for when tracing is disabled
class NoopSpan extends Span {
  constructor(operationName: string) {
    super({ operationName }, null as any)
  }

  setTag(): Span { return this }
  setTags(): Span { return this }
  log(): Span { return this }
  logEvent(): Span { return this }
  setStatus(): Span { return this }
  finish(): void {}
}

// Global trace manager
export const traceManager = new TraceManager({
  samplingRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  flushIntervalMs: 30000 // 30 seconds
})

// React hook for tracing
import { useEffect, useRef } from 'react'

export function useTracing(componentName: string) {
  const tracingRef = useRef(traceManager.traceComponent(componentName))
  
  useEffect(() => {
    const tracing = tracingRef.current
    tracing.onMount()
    
    return () => {
      tracing.onUnmount()
    }
  }, [])
  
  useEffect(() => {
    tracingRef.current.onRender()
  })
  
  return {
    traceAsync: <T>(operation: string, fn: (span: Span) => Promise<T>) =>
      traceManager.traceAsync(`${componentName}.${operation}`, fn),
    
    trace: <T>(operation: string, fn: (span: Span) => T) =>
      traceManager.trace(`${componentName}.${operation}`, fn),
    
    onError: (error: Error) => tracingRef.current.onError(error)
  }
}