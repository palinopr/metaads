import { EventEmitter } from 'events'

export interface StreamingEvent {
  id: string
  timestamp: Date
  type: 'impression' | 'click' | 'conversion' | 'spend' | 'bid_adjustment' | 'creative_change'
  campaignId: string
  adSetId?: string
  adId?: string
  data: Record<string, any>
  metadata?: Record<string, any>
}

export interface MetricSnapshot {
  timestamp: Date
  campaignId: string
  metric: string
  value: number
  delta?: number
  aggregation?: 'sum' | 'avg' | 'count' | 'rate'
}

export interface StreamingWindow {
  duration: number // in milliseconds
  slide: number // in milliseconds
  metrics: string[]
  aggregations: string[]
}

export interface AnalyticsQuery {
  id: string
  name: string
  window: StreamingWindow
  filters?: Record<string, any>
  groupBy?: string[]
  having?: Record<string, any>
  callback: (results: MetricSnapshot[]) => void
}

export interface TrendDetection {
  metric: string
  campaignId: string
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile'
  confidence: number
  changeRate: number
  significance: number
  timestamp: Date
}

export interface AnomalyDetection {
  id: string
  metric: string
  campaignId: string
  expectedValue: number
  actualValue: number
  deviation: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  context?: Record<string, any>
}

class StreamBuffer {
  private events: StreamingEvent[] = []
  private maxSize: number
  private ttl: number // time to live in milliseconds

  constructor(maxSize: number = 10000, ttl: number = 3600000) { // 1 hour TTL
    this.maxSize = maxSize
    this.ttl = ttl
  }

  add(event: StreamingEvent) {
    this.events.push(event)
    this.cleanup()
  }

  getEvents(filters?: Record<string, any>, limit?: number): StreamingEvent[] {
    let filtered = this.events

    if (filters) {
      filtered = this.events.filter(event => {
        return Object.entries(filters).every(([key, value]) => {
          if (key === 'campaignId') return event.campaignId === value
          if (key === 'type') return event.type === value
          if (key === 'since') return event.timestamp >= value
          if (key === 'until') return event.timestamp <= value
          return event.data[key] === value
        })
      })
    }

    return limit ? filtered.slice(-limit) : filtered
  }

  private cleanup() {
    const now = Date.now()
    
    // Remove old events
    this.events = this.events.filter(event => 
      now - event.timestamp.getTime() < this.ttl
    )

    // Limit buffer size
    if (this.events.length > this.maxSize) {
      this.events = this.events.slice(-this.maxSize)
    }
  }

  clear() {
    this.events = []
  }

  size(): number {
    return this.events.length
  }
}

export class StreamingAnalyticsEngine extends EventEmitter {
  private buffer: StreamBuffer
  private queries: Map<string, AnalyticsQuery> = new Map()
  private windows: Map<string, NodeJS.Timeout> = new Map()
  private baselines: Map<string, number[]> = new Map()
  private trendHistory: Map<string, number[]> = new Map()

  constructor() {
    super()
    this.buffer = new StreamBuffer()
    this.initializeDefaultQueries()
  }

  private initializeDefaultQueries() {
    // Real-time CTR monitoring
    this.addQuery({
      id: 'realtime_ctr',
      name: 'Real-time CTR',
      window: {
        duration: 5 * 60 * 1000, // 5 minutes
        slide: 30 * 1000, // 30 seconds
        metrics: ['clicks', 'impressions'],
        aggregations: ['sum']
      },
      callback: (results) => {
        const ctrData = this.calculateCTR(results)
        if (ctrData) {
          this.emit('metric-update', {
            type: 'ctr',
            data: ctrData
          })
        }
      }
    })

    // Real-time conversion tracking
    this.addQuery({
      id: 'realtime_conversions',
      name: 'Real-time Conversions',
      window: {
        duration: 10 * 60 * 1000, // 10 minutes
        slide: 60 * 1000, // 1 minute
        metrics: ['conversions', 'clicks'],
        aggregations: ['sum']
      },
      callback: (results) => {
        const conversionData = this.calculateConversionRate(results)
        if (conversionData) {
          this.emit('metric-update', {
            type: 'conversion_rate',
            data: conversionData
          })
        }
      }
    })

    // Spend rate monitoring
    this.addQuery({
      id: 'spend_rate',
      name: 'Spend Rate Analysis',
      window: {
        duration: 60 * 60 * 1000, // 1 hour
        slide: 5 * 60 * 1000, // 5 minutes
        metrics: ['spend'],
        aggregations: ['sum']
      },
      callback: (results) => {
        const spendData = this.calculateSpendRate(results)
        if (spendData) {
          this.emit('metric-update', {
            type: 'spend_rate',
            data: spendData
          })
        }
      }
    })

    // Anomaly detection
    this.addQuery({
      id: 'anomaly_detection',
      name: 'Anomaly Detection',
      window: {
        duration: 30 * 60 * 1000, // 30 minutes
        slide: 2 * 60 * 1000, // 2 minutes
        metrics: ['cpc', 'ctr', 'conversion_rate', 'spend_rate'],
        aggregations: ['avg']
      },
      callback: (results) => {
        const anomalies = this.detectAnomalies(results)
        anomalies.forEach(anomaly => {
          this.emit('anomaly-detected', anomaly)
        })
      }
    })
  }

  public ingestEvent(event: StreamingEvent) {
    this.buffer.add(event)
    this.processRealTimeMetrics(event)
    this.emit('event-ingested', event)
  }

  public ingestBatch(events: StreamingEvent[]) {
    events.forEach(event => this.ingestEvent(event))
    this.emit('batch-ingested', { count: events.length })
  }

  public addQuery(query: AnalyticsQuery) {
    this.queries.set(query.id, query)
    this.startWindowProcessing(query)
  }

  public removeQuery(queryId: string) {
    this.queries.delete(queryId)
    const timer = this.windows.get(queryId)
    if (timer) {
      clearInterval(timer)
      this.windows.delete(queryId)
    }
  }

  private startWindowProcessing(query: AnalyticsQuery) {
    const timer = setInterval(() => {
      this.processWindow(query)
    }, query.window.slide)
    
    this.windows.set(query.id, timer)
  }

  private processWindow(query: AnalyticsQuery) {
    const now = new Date()
    const windowStart = new Date(now.getTime() - query.window.duration)
    
    const events = this.buffer.getEvents({
      since: windowStart,
      until: now,
      ...query.filters
    })

    const metrics = this.aggregateMetrics(events, query)
    query.callback(metrics)
  }

  private aggregateMetrics(events: StreamingEvent[], query: AnalyticsQuery): MetricSnapshot[] {
    const grouped = this.groupEvents(events, query.groupBy || ['campaignId'])
    const results: MetricSnapshot[] = []

    for (const [groupKey, groupEvents] of grouped.entries()) {
      for (const metric of query.window.metrics) {
        for (const aggregation of query.window.aggregations) {
          const value = this.calculateAggregation(groupEvents, metric, aggregation)
          
          results.push({
            timestamp: new Date(),
            campaignId: this.extractCampaignId(groupKey),
            metric: `${metric}_${aggregation}`,
            value,
            aggregation: aggregation as any
          })
        }
      }
    }

    return results
  }

  private groupEvents(events: StreamingEvent[], groupBy: string[]): Map<string, StreamingEvent[]> {
    const groups = new Map<string, StreamingEvent[]>()

    events.forEach(event => {
      const key = groupBy.map(field => {
        if (field === 'campaignId') return event.campaignId
        if (field === 'adSetId') return event.adSetId || 'unknown'
        if (field === 'adId') return event.adId || 'unknown'
        return event.data[field] || 'unknown'
      }).join('|')

      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(event)
    })

    return groups
  }

  private calculateAggregation(events: StreamingEvent[], metric: string, aggregation: string): number {
    const values = events
      .map(event => event.data[metric] || 0)
      .filter(value => typeof value === 'number')

    switch (aggregation) {
      case 'sum':
        return values.reduce((sum, value) => sum + value, 0)
      case 'avg':
        return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
      case 'count':
        return values.length
      case 'max':
        return values.length > 0 ? Math.max(...values) : 0
      case 'min':
        return values.length > 0 ? Math.min(...values) : 0
      case 'rate':
        // Calculate rate per hour
        const timeSpan = events.length > 0 ? 
          (Math.max(...events.map(e => e.timestamp.getTime())) - Math.min(...events.map(e => e.timestamp.getTime()))) / 1000 / 3600 : 1
        return timeSpan > 0 ? values.reduce((sum, value) => sum + value, 0) / timeSpan : 0
      default:
        return 0
    }
  }

  private extractCampaignId(groupKey: string): string {
    return groupKey.split('|')[0]
  }

  private processRealTimeMetrics(event: StreamingEvent) {
    // Update real-time metric snapshots
    const timestamp = new Date()
    
    switch (event.type) {
      case 'impression':
        this.emit('metric-snapshot', {
          timestamp,
          campaignId: event.campaignId,
          metric: 'impressions',
          value: 1,
          delta: 1
        })
        break

      case 'click':
        this.emit('metric-snapshot', {
          timestamp,
          campaignId: event.campaignId,
          metric: 'clicks',
          value: 1,
          delta: 1
        })
        break

      case 'conversion':
        this.emit('metric-snapshot', {
          timestamp,
          campaignId: event.campaignId,
          metric: 'conversions',
          value: 1,
          delta: 1
        })
        break

      case 'spend':
        this.emit('metric-snapshot', {
          timestamp,
          campaignId: event.campaignId,
          metric: 'spend',
          value: event.data.amount || 0,
          delta: event.data.amount || 0
        })
        break
    }
  }

  private calculateCTR(results: MetricSnapshot[]): any {
    const clicksSnapshot = results.find(r => r.metric === 'clicks_sum')
    const impressionsSnapshot = results.find(r => r.metric === 'impressions_sum')
    
    if (clicksSnapshot && impressionsSnapshot && impressionsSnapshot.value > 0) {
      const ctr = (clicksSnapshot.value / impressionsSnapshot.value) * 100
      
      return {
        campaignId: clicksSnapshot.campaignId,
        ctr,
        clicks: clicksSnapshot.value,
        impressions: impressionsSnapshot.value,
        timestamp: clicksSnapshot.timestamp
      }
    }
    
    return null
  }

  private calculateConversionRate(results: MetricSnapshot[]): any {
    const conversionsSnapshot = results.find(r => r.metric === 'conversions_sum')
    const clicksSnapshot = results.find(r => r.metric === 'clicks_sum')
    
    if (conversionsSnapshot && clicksSnapshot && clicksSnapshot.value > 0) {
      const conversionRate = (conversionsSnapshot.value / clicksSnapshot.value) * 100
      
      return {
        campaignId: conversionsSnapshot.campaignId,
        conversionRate,
        conversions: conversionsSnapshot.value,
        clicks: clicksSnapshot.value,
        timestamp: conversionsSnapshot.timestamp
      }
    }
    
    return null
  }

  private calculateSpendRate(results: MetricSnapshot[]): any {
    const spendSnapshot = results.find(r => r.metric === 'spend_sum')
    
    if (spendSnapshot) {
      // Calculate hourly spend rate
      const hourlyRate = spendSnapshot.value
      
      return {
        campaignId: spendSnapshot.campaignId,
        hourlySpendRate: hourlyRate,
        totalSpend: spendSnapshot.value,
        timestamp: spendSnapshot.timestamp
      }
    }
    
    return null
  }

  private detectAnomalies(results: MetricSnapshot[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = []

    results.forEach(snapshot => {
      const baselineKey = `${snapshot.campaignId}:${snapshot.metric}`
      
      // Get or initialize baseline
      if (!this.baselines.has(baselineKey)) {
        this.baselines.set(baselineKey, [])
      }
      
      const baseline = this.baselines.get(baselineKey)!
      
      if (baseline.length > 0) {
        const expectedValue = this.calculateBaseline(baseline)
        const deviation = Math.abs(snapshot.value - expectedValue) / Math.max(expectedValue, 1)
        
        if (deviation > 0.5) { // 50% deviation threshold
          let severity: AnomalyDetection['severity'] = 'low'
          if (deviation > 2) severity = 'critical'
          else if (deviation > 1.5) severity = 'high'
          else if (deviation > 1) severity = 'medium'
          
          anomalies.push({
            id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            metric: snapshot.metric,
            campaignId: snapshot.campaignId,
            expectedValue,
            actualValue: snapshot.value,
            deviation,
            severity,
            timestamp: snapshot.timestamp,
            context: {
              baselineSize: baseline.length,
              deviationPercentage: deviation * 100
            }
          })
        }
      }
      
      // Update baseline (keep last 100 values)
      baseline.push(snapshot.value)
      if (baseline.length > 100) {
        baseline.shift()
      }
    })

    return anomalies
  }

  private calculateBaseline(values: number[]): number {
    // Simple moving average
    return values.reduce((sum, value) => sum + value, 0) / values.length
  }

  public detectTrends(campaignId: string, metric: string, windowSize: number = 10): TrendDetection | null {
    const key = `${campaignId}:${metric}`
    
    if (!this.trendHistory.has(key)) {
      return null
    }
    
    const history = this.trendHistory.get(key)!
    if (history.length < windowSize) {
      return null
    }
    
    const recentValues = history.slice(-windowSize)
    const trend = this.calculateTrend(recentValues)
    
    return {
      metric,
      campaignId,
      trend: trend.direction,
      confidence: trend.confidence,
      changeRate: trend.changeRate,
      significance: trend.significance,
      timestamp: new Date()
    }
  }

  private calculateTrend(values: number[]): {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile'
    confidence: number
    changeRate: number
    significance: number
  } {
    if (values.length < 2) {
      return { direction: 'stable', confidence: 0, changeRate: 0, significance: 0 }
    }
    
    // Calculate linear regression
    const n = values.length
    const x = Array.from({ length: n }, (_, i) => i)
    const y = values
    
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    // Calculate R-squared for confidence
    const yMean = sumY / n
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept
      return sum + Math.pow(yi - predicted, 2)
    }, 0)
    
    const rSquared = 1 - (ssRes / ssTotal)
    const confidence = Math.max(0, Math.min(1, rSquared))
    
    // Determine trend direction
    const changeRate = Math.abs(slope / (yMean || 1)) * 100
    let direction: 'increasing' | 'decreasing' | 'stable' | 'volatile'
    
    if (confidence < 0.3) {
      direction = 'volatile'
    } else if (Math.abs(slope) < 0.01) {
      direction = 'stable'
    } else if (slope > 0) {
      direction = 'increasing'
    } else {
      direction = 'decreasing'
    }
    
    return {
      direction,
      confidence,
      changeRate,
      significance: confidence * changeRate
    }
  }

  public getQueryStats(): Record<string, any> {
    return {
      activeQueries: this.queries.size,
      bufferSize: this.buffer.size(),
      queries: Array.from(this.queries.values()).map(q => ({
        id: q.id,
        name: q.name,
        windowDuration: q.window.duration,
        slideInterval: q.window.slide,
        metrics: q.window.metrics
      }))
    }
  }

  public clearBuffers() {
    this.buffer.clear()
    this.baselines.clear()
    this.trendHistory.clear()
  }

  public shutdown() {
    this.windows.forEach(timer => clearInterval(timer))
    this.windows.clear()
    this.queries.clear()
    this.clearBuffers()
  }
}

// Singleton instance
export const streamingAnalytics = new StreamingAnalyticsEngine()