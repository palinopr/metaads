import { NextRequest, NextResponse } from 'next/server'

/**
 * Metrics Collection API Endpoint
 * 
 * Handles incoming metrics from the application and stores them
 * for analysis and alerting
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { metrics } = body
    
    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json(
        { error: 'Invalid metrics data' },
        { status: 400 }
      )
    }
    
    // Process each metric
    const processedMetrics = metrics.map(metric => {
      // Validate metric structure
      if (!metric.name || metric.value === undefined || !metric.timestamp) {
        throw new Error(`Invalid metric structure: ${JSON.stringify(metric)}`)
      }
      
      return {
        ...metric,
        timestamp: new Date(metric.timestamp),
        processed_at: new Date(),
        source: 'meta-ads-dashboard'
      }
    })
    
    // In a real implementation, this would:
    // 1. Store metrics in a time-series database (InfluxDB, TimescaleDB, etc.)
    // 2. Check alert rules against new metrics
    // 3. Update real-time dashboards via WebSocket
    // 4. Calculate aggregations for reporting
    
    console.log(`Processed ${processedMetrics.length} metrics`)
    
    // Mock processing delay to simulate real storage
    await new Promise(resolve => setTimeout(resolve, 10))
    
    return NextResponse.json({
      success: true,
      processed: processedMetrics.length,
      timestamp: new Date()
    })
    
  } catch (error: any) {
    console.error('Metrics processing error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process metrics',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const metric = searchParams.get('metric')
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const tags = searchParams.get('tags')
    
    // Parse query parameters
    const startTime = start ? new Date(start) : new Date(Date.now() - 3600000) // Last hour
    const endTime = end ? new Date(end) : new Date()
    const parsedTags = tags ? JSON.parse(tags) : {}
    
    // In a real implementation, this would query the time-series database
    // For now, return mock data
    const mockData = generateMockMetricData(metric, startTime, endTime, parsedTags)
    
    return NextResponse.json({
      metric: metric || 'all',
      timeRange: {
        start: startTime,
        end: endTime
      },
      tags: parsedTags,
      data: mockData
    })
    
  } catch (error: any) {
    console.error('Metrics query error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to query metrics',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

function generateMockMetricData(metric: string | null, start: Date, end: Date, tags: any) {
  const points = []
  const duration = end.getTime() - start.getTime()
  const interval = Math.max(60000, duration / 100) // Max 100 points, min 1 minute intervals
  
  for (let time = start.getTime(); time <= end.getTime(); time += interval) {
    let value = 0
    
    // Generate realistic values based on metric type
    switch (metric) {
      case 'api.requests':
        value = Math.floor(Math.random() * 50) + 10
        break
      case 'api.duration':
        value = Math.floor(Math.random() * 500) + 100
        break
      case 'errors':
        value = Math.floor(Math.random() * 5)
        break
      case 'revenue.total':
        value = Math.floor(Math.random() * 1000) + 500
        break
      case 'user.actions':
        value = Math.floor(Math.random() * 100) + 20
        break
      default:
        value = Math.random() * 100
    }
    
    points.push({
      timestamp: time,
      value,
      tags
    })
  }
  
  return points
}