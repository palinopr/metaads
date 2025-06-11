import { NextRequest, NextResponse } from 'next/server'

/**
 * Analytics Data Collection API
 * 
 * Handles incoming analytics data including:
 * - User sessions and behavior
 * - Page views and interactions
 * - Conversion events
 * - Performance metrics
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session, timestamp } = body
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session data is required' },
        { status: 400 }
      )
    }
    
    // Validate session structure
    if (!session.id || !session.anonymousId || !session.startTime) {
      return NextResponse.json(
        { error: 'Invalid session structure' },
        { status: 400 }
      )
    }
    
    // Process the session data
    const processedSession = {
      ...session,
      processed_at: new Date(),
      ip_address: getClientIP(request),
      user_agent: request.headers.get('user-agent'),
      // Add server-side enrichment
      server_timestamp: new Date()
    }
    
    // In a real implementation, this would:
    // 1. Store session data in analytics database (ClickHouse, BigQuery, etc.)
    // 2. Update user profiles and segments
    // 3. Calculate conversion funnel metrics
    // 4. Trigger real-time alerts for anomalies
    // 5. Update A/B test statistics
    
    console.log(`Analytics session processed: ${session.id}`)
    console.log(`- Page views: ${session.pageViews?.length || 0}`)
    console.log(`- Events: ${session.events?.length || 0}`)
    console.log(`- Duration: ${session.duration || 'ongoing'}ms`)
    
    // Extract key metrics for monitoring
    const metrics = extractSessionMetrics(processedSession)
    
    // Log important events for monitoring
    if (session.events) {
      session.events.forEach(event => {
        if (event.category === 'conversion') {
          console.log(`Conversion event: ${event.action} by ${session.userId || session.anonymousId}`)
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      processed: true,
      metrics,
      timestamp: new Date()
    })
    
  } catch (error: any) {
    console.error('Analytics processing error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process analytics data',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const metric = searchParams.get('metric')
    
    // In a real implementation, this would query the analytics database
    // For now, return mock analytics data
    
    const mockData = generateMockAnalyticsData({
      sessionId,
      userId,
      startDate: startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate) : new Date(),
      metric
    })
    
    return NextResponse.json(mockData)
    
  } catch (error: any) {
    console.error('Analytics query error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to query analytics data',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// Helper functions
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

function extractSessionMetrics(session: any) {
  const metrics = {
    session_duration: session.duration || 0,
    page_views: session.pageViews?.length || 0,
    events_count: session.events?.length || 0,
    bounce_rate: session.pageViews?.length === 1 ? 1 : 0,
    conversion_events: 0,
    error_events: 0,
    performance_score: 0
  }
  
  // Count event types
  if (session.events) {
    session.events.forEach(event => {
      if (event.category === 'conversion') {
        metrics.conversion_events++
      }
      if (event.type === 'error') {
        metrics.error_events++
      }
    })
  }
  
  // Calculate performance score
  if (session.performanceMetrics) {
    const perf = session.performanceMetrics
    let score = 100
    
    // Deduct points for poor performance
    if (perf.fcp > 2000) score -= 10
    if (perf.lcp > 2500) score -= 15
    if (perf.fid > 100) score -= 10
    if (perf.cls > 0.1) score -= 10
    if (perf.jsErrors > 0) score -= perf.jsErrors * 5
    
    metrics.performance_score = Math.max(0, score)
  }
  
  return metrics
}

function generateMockAnalyticsData(params: {
  sessionId?: string | null
  userId?: string | null
  startDate: Date
  endDate: Date
  metric?: string | null
}) {
  const { startDate, endDate, metric } = params
  
  // Generate time-series data
  const data = []
  const duration = endDate.getTime() - startDate.getTime()
  const interval = Math.max(3600000, duration / 100) // Max 100 points, min 1 hour
  
  for (let time = startDate.getTime(); time <= endDate.getTime(); time += interval) {
    const timestamp = new Date(time)
    
    let value = 0
    switch (metric) {
      case 'page_views':
        value = Math.floor(Math.random() * 100) + 50
        break
      case 'sessions':
        value = Math.floor(Math.random() * 50) + 20
        break
      case 'conversions':
        value = Math.floor(Math.random() * 10) + 1
        break
      case 'bounce_rate':
        value = Math.random() * 0.4 + 0.3 // 30-70%
        break
      case 'avg_session_duration':
        value = Math.random() * 300000 + 120000 // 2-7 minutes in ms
        break
      default:
        value = Math.random() * 100
    }
    
    data.push({
      timestamp: time,
      value,
      date: timestamp.toISOString().split('T')[0]
    })
  }
  
  // Summary statistics
  const summary = {
    total_sessions: Math.floor(Math.random() * 1000) + 500,
    total_page_views: Math.floor(Math.random() * 5000) + 2000,
    total_events: Math.floor(Math.random() * 10000) + 5000,
    unique_users: Math.floor(Math.random() * 800) + 400,
    avg_session_duration: Math.floor(Math.random() * 300) + 180, // seconds
    bounce_rate: Math.random() * 0.3 + 0.4, // 40-70%
    conversion_rate: Math.random() * 0.05 + 0.02, // 2-7%
    top_pages: [
      { path: '/dashboard', views: 1250, bounce_rate: 0.35 },
      { path: '/campaigns', views: 890, bounce_rate: 0.42 },
      { path: '/analytics', views: 650, bounce_rate: 0.38 },
      { path: '/settings', views: 420, bounce_rate: 0.55 },
      { path: '/reports', views: 380, bounce_rate: 0.48 }
    ],
    user_segments: [
      { name: 'New Users', count: 150, percentage: 30 },
      { name: 'Returning Users', count: 250, percentage: 50 },
      { name: 'Power Users', count: 100, percentage: 20 }
    ],
    device_breakdown: [
      { type: 'desktop', count: 350, percentage: 70 },
      { type: 'mobile', count: 120, percentage: 24 },
      { type: 'tablet', count: 30, percentage: 6 }
    ]
  }
  
  return {
    timeRange: {
      start: startDate,
      end: endDate
    },
    metric: metric || 'all',
    data,
    summary
  }
}