/**
 * Developer Analytics System
 * 
 * Tracks API usage, developer engagement, and provides insights
 * for improving developer experience and API adoption.
 */

import { NextRequest } from 'next/server'

export interface APIUsageEvent {
  id: string
  timestamp: string
  apiKey?: string
  developerId?: string
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  userAgent: string
  ip: string
  requestSize: number
  responseSize: number
  error?: string
  metadata?: Record<string, any>
}

export interface DeveloperMetrics {
  developerId: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  avgResponseTime: number
  topEndpoints: Array<{
    endpoint: string
    requests: number
    successRate: number
  }>
  errorsByType: Record<string, number>
  requestsByDay: Array<{
    date: string
    requests: number
  }>
  lastActivity: string
  joinDate: string
}

export interface APIAnalytics {
  totalDevelopers: number
  activeDevelopers: number
  totalRequests: number
  requestsToday: number
  avgResponseTime: number
  successRate: number
  topEndpoints: Array<{
    endpoint: string
    requests: number
    uniqueDevelopers: number
    avgResponseTime: number
  }>
  errorDistribution: Record<string, number>
  geographicDistribution: Record<string, number>
  sdkUsage: Record<string, number>
  trendsOverTime: Array<{
    date: string
    requests: number
    developers: number
    successRate: number
  }>
}

class DeveloperAnalyticsService {
  private usageEvents: APIUsageEvent[] = []
  private maxEvents = 100000 // Keep last 100k events in memory
  
  constructor() {
    // In production, this would connect to a database
    this.initializeStorage()
  }

  private initializeStorage() {
    // Initialize persistent storage (Redis, PostgreSQL, etc.)
    // For demo purposes, using in-memory storage
  }

  /**
   * Track an API usage event
   */
  trackAPIUsage(request: NextRequest, response: {
    status: number
    headers: Headers
  }, responseTime: number, error?: string): void {
    const event: APIUsageEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      endpoint: this.extractEndpoint(request.url),
      method: request.method || 'GET',
      statusCode: response.status,
      responseTime,
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: this.extractIP(request),
      requestSize: this.estimateRequestSize(request),
      responseSize: this.estimateResponseSize(response),
      error,
      apiKey: this.extractAPIKey(request),
      developerId: this.extractDeveloperID(request),
      metadata: {
        referer: request.headers.get('referer'),
        origin: request.headers.get('origin'),
        contentType: request.headers.get('content-type')
      }
    }

    this.usageEvents.push(event)
    
    // Keep memory usage under control
    if (this.usageEvents.length > this.maxEvents) {
      this.usageEvents = this.usageEvents.slice(-this.maxEvents)
    }

    // In production, save to persistent storage
    this.persistEvent(event)
  }

  /**
   * Get analytics for a specific developer
   */
  getDeveloperMetrics(developerId: string): DeveloperMetrics {
    const developerEvents = this.usageEvents.filter(
      event => event.developerId === developerId
    )

    if (developerEvents.length === 0) {
      throw new Error('Developer not found')
    }

    const totalRequests = developerEvents.length
    const successfulRequests = developerEvents.filter(
      event => event.statusCode >= 200 && event.statusCode < 400
    ).length
    const failedRequests = totalRequests - successfulRequests

    const avgResponseTime = developerEvents.reduce(
      (sum, event) => sum + event.responseTime, 0
    ) / totalRequests

    // Calculate top endpoints
    const endpointCounts = this.groupBy(developerEvents, 'endpoint')
    const topEndpoints = Object.entries(endpointCounts)
      .map(([endpoint, events]) => ({
        endpoint,
        requests: events.length,
        successRate: events.filter(e => e.statusCode >= 200 && e.statusCode < 400).length / events.length * 100
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10)

    // Calculate errors by type
    const errorsByType = developerEvents
      .filter(event => event.error)
      .reduce((acc, event) => {
        const errorType = this.categorizeError(event.error!)
        acc[errorType] = (acc[errorType] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    // Calculate requests by day (last 30 days)
    const requestsByDay = this.getRequestsByDay(developerEvents, 30)

    return {
      developerId,
      totalRequests,
      successfulRequests,
      failedRequests,
      avgResponseTime: Math.round(avgResponseTime),
      topEndpoints,
      errorsByType,
      requestsByDay,
      lastActivity: developerEvents[developerEvents.length - 1]?.timestamp || '',
      joinDate: developerEvents[0]?.timestamp || ''
    }
  }

  /**
   * Get overall API analytics
   */
  getAPIAnalytics(): APIAnalytics {
    const uniqueDevelopers = new Set(
      this.usageEvents
        .filter(event => event.developerId)
        .map(event => event.developerId!)
    ).size

    const today = new Date().toISOString().split('T')[0]
    const todayEvents = this.usageEvents.filter(
      event => event.timestamp.startsWith(today)
    )

    const activeDevelopers = new Set(
      todayEvents
        .filter(event => event.developerId)
        .map(event => event.developerId!)
    ).size

    const totalRequests = this.usageEvents.length
    const requestsToday = todayEvents.length

    const avgResponseTime = this.usageEvents.reduce(
      (sum, event) => sum + event.responseTime, 0
    ) / totalRequests

    const successfulRequests = this.usageEvents.filter(
      event => event.statusCode >= 200 && event.statusCode < 400
    ).length
    const successRate = (successfulRequests / totalRequests) * 100

    // Top endpoints
    const endpointGroups = this.groupBy(this.usageEvents, 'endpoint')
    const topEndpoints = Object.entries(endpointGroups)
      .map(([endpoint, events]) => ({
        endpoint,
        requests: events.length,
        uniqueDevelopers: new Set(events.filter(e => e.developerId).map(e => e.developerId!)).size,
        avgResponseTime: Math.round(events.reduce((sum, e) => sum + e.responseTime, 0) / events.length)
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10)

    // Error distribution
    const errorDistribution = this.usageEvents
      .filter(event => event.error)
      .reduce((acc, event) => {
        const errorType = this.categorizeError(event.error!)
        acc[errorType] = (acc[errorType] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    // Geographic distribution (simplified)
    const geographicDistribution = this.usageEvents
      .reduce((acc, event) => {
        const country = this.extractCountryFromIP(event.ip)
        acc[country] = (acc[country] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    // SDK usage based on User-Agent
    const sdkUsage = this.usageEvents
      .reduce((acc, event) => {
        const sdk = this.extractSDKFromUserAgent(event.userAgent)
        acc[sdk] = (acc[sdk] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    // Trends over time (last 30 days)
    const trendsOverTime = this.getTrendsOverTime(30)

    return {
      totalDevelopers: uniqueDevelopers,
      activeDevelopers,
      totalRequests,
      requestsToday,
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate * 100) / 100,
      topEndpoints,
      errorDistribution,
      geographicDistribution,
      sdkUsage,
      trendsOverTime
    }
  }

  /**
   * Get API health metrics
   */
  getAPIHealthMetrics() {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const recentEvents = this.usageEvents.filter(
      event => event.timestamp >= last24Hours
    )

    const errorRate = recentEvents.filter(
      event => event.statusCode >= 400
    ).length / recentEvents.length * 100

    const avgResponseTime = recentEvents.reduce(
      (sum, event) => sum + event.responseTime, 0
    ) / recentEvents.length

    const p95ResponseTime = this.calculatePercentile(
      recentEvents.map(e => e.responseTime), 95
    )

    const p99ResponseTime = this.calculatePercentile(
      recentEvents.map(e => e.responseTime), 99
    )

    return {
      requestsLast24h: recentEvents.length,
      errorRate: Math.round(errorRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      p99ResponseTime: Math.round(p99ResponseTime),
      timestamp: new Date().toISOString()
    }
  }

  // Helper methods

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname
    } catch {
      return url
    }
  }

  private extractIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           'unknown'
  }

  private extractAPIKey(request: NextRequest): string | undefined {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }
    return request.headers.get('x-api-key') || undefined
  }

  private extractDeveloperID(request: NextRequest): string | undefined {
    // In production, this would be extracted from JWT or API key
    const apiKey = this.extractAPIKey(request)
    if (apiKey) {
      // Hash or map API key to developer ID
      return `dev_${apiKey.substring(0, 8)}`
    }
    return undefined
  }

  private estimateRequestSize(request: NextRequest): number {
    // Estimate request size based on headers and body
    let size = 0
    
    // Headers
    request.headers.forEach((value, key) => {
      size += key.length + value.length + 4 // ": " and "\r\n"
    })
    
    // URL
    size += request.url.length
    
    // Method
    size += (request.method || 'GET').length
    
    return size
  }

  private estimateResponseSize(response: { headers: Headers }): number {
    const contentLength = response.headers.get('content-length')
    if (contentLength) {
      return parseInt(contentLength, 10)
    }
    
    // Estimate based on headers if no content-length
    let size = 0
    response.headers.forEach((value, key) => {
      size += key.length + value.length + 4
    })
    
    return size + 200 // Estimate for status line and body
  }

  private categorizeError(error: string): string {
    if (error.includes('timeout')) return 'timeout'
    if (error.includes('network')) return 'network'
    if (error.includes('auth')) return 'authentication'
    if (error.includes('rate limit')) return 'rate_limit'
    if (error.includes('validation')) return 'validation'
    return 'other'
  }

  private extractCountryFromIP(ip: string): string {
    // Simplified country extraction
    // In production, use GeoIP service
    if (ip.startsWith('192.168.') || ip === 'unknown') return 'Unknown'
    if (ip.startsWith('10.')) return 'US'
    return 'Other'
  }

  private extractSDKFromUserAgent(userAgent: string): string {
    if (userAgent.includes('MetaAdsClient-Python')) return 'Python SDK'
    if (userAgent.includes('MetaAdsClient-JS')) return 'JavaScript SDK'
    if (userAgent.includes('curl')) return 'cURL'
    if (userAgent.includes('Postman')) return 'Postman'
    if (userAgent.includes('Mozilla')) return 'Browser'
    return 'Other'
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key])
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(item)
      return groups
    }, {} as Record<string, T[]>)
  }

  private getRequestsByDay(events: APIUsageEvent[], days: number) {
    const result = []
    const now = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const dayEvents = events.filter(event => 
        event.timestamp.startsWith(dateStr)
      )
      
      result.push({
        date: dateStr,
        requests: dayEvents.length
      })
    }
    
    return result
  }

  private getTrendsOverTime(days: number) {
    const result = []
    const now = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const dayEvents = this.usageEvents.filter(event => 
        event.timestamp.startsWith(dateStr)
      )
      
      const developers = new Set(
        dayEvents.filter(e => e.developerId).map(e => e.developerId!)
      ).size
      
      const successfulRequests = dayEvents.filter(
        event => event.statusCode >= 200 && event.statusCode < 400
      ).length
      
      result.push({
        date: dateStr,
        requests: dayEvents.length,
        developers,
        successRate: dayEvents.length > 0 ? 
          Math.round((successfulRequests / dayEvents.length) * 100) : 0
      })
    }
    
    return result
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index] || 0
  }

  private persistEvent(event: APIUsageEvent): void {
    // In production, save to database
    // For now, just log to console in debug mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${event.method} ${event.endpoint} - ${event.statusCode} (${event.responseTime}ms)`)
    }
  }
}

// Export singleton instance
export const developerAnalytics = new DeveloperAnalyticsService()

// Middleware function for Next.js
export function createAnalyticsMiddleware() {
  return (request: NextRequest, response: Response, responseTime: number, error?: string) => {
    developerAnalytics.trackAPIUsage(
      request,
      {
        status: response.status,
        headers: response.headers
      },
      responseTime,
      error
    )
  }
}

export default DeveloperAnalyticsService