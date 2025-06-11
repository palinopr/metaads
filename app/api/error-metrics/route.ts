import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { metrics, timestamp, sessionId } = await request.json()
    
    // Create metrics directory if it doesn't exist
    const metricsDir = path.join(process.cwd(), 'logs', 'metrics')
    try {
      await fs.mkdir(metricsDir, { recursive: true })
    } catch (e) {
      // Directory might already exist
    }
    
    // Create metric entry
    const metricEntry = {
      metrics,
      timestamp,
      sessionId,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    }
    
    // Append to metrics log file
    const date = new Date().toISOString().split('T')[0]
    const metricFile = path.join(metricsDir, `metrics-${date}.json`)
    
    try {
      const existingMetrics = await fs.readFile(metricFile, 'utf8')
      const metricsArray = JSON.parse(existingMetrics)
      metricsArray.push(metricEntry)
      await fs.writeFile(metricFile, JSON.stringify(metricsArray, null, 2))
    } catch (e) {
      // File doesn't exist, create new one
      await fs.writeFile(metricFile, JSON.stringify([metricEntry], null, 2))
    }
    
    console.log('Error metrics logged:', {
      timestamp,
      sessionId,
      totalErrors: metrics.totalErrors,
      errorRate: metrics.errorRate
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to log error metrics:', error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || '24h'
    const category = url.searchParams.get('category')
    
    // Calculate time range
    const now = new Date()
    let startTime: Date
    
    switch (period) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000)
        break
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }
    
    // Collect metrics from files
    const metricsDir = path.join(process.cwd(), 'logs', 'metrics')
    const aggregatedMetrics = {
      totalErrors: 0,
      errorRate: 0,
      errorsByCategory: {} as Record<string, number>,
      errorsBySeverity: {} as Record<string, number>,
      sessions: new Set(),
      timeRange: {
        start: startTime.toISOString(),
        end: now.toISOString()
      }
    }
    
    try {
      // Read metrics files for the time range
      const days = Math.ceil((now.getTime() - startTime.getTime()) / (24 * 60 * 60 * 1000))
      
      for (let i = 0; i < days; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0]
        const metricFile = path.join(metricsDir, `metrics-${date}.json`)
        
        try {
          const content = await fs.readFile(metricFile, 'utf8')
          const metrics = JSON.parse(content)
          
          metrics.forEach((entry: any) => {
            const entryTime = new Date(entry.timestamp)
            if (entryTime >= startTime && entryTime <= now) {
              // Aggregate metrics
              aggregatedMetrics.totalErrors += entry.metrics.totalErrors || 0
              aggregatedMetrics.sessions.add(entry.sessionId)
              
              // Merge category stats
              if (entry.metrics.errorsByCategory) {
                Object.entries(entry.metrics.errorsByCategory).forEach(([cat, count]: [string, any]) => {
                  if (!category || category === 'all' || category === cat) {
                    aggregatedMetrics.errorsByCategory[cat] = 
                      (aggregatedMetrics.errorsByCategory[cat] || 0) + count
                  }
                })
              }
              
              // Merge severity stats
              if (entry.metrics.errorsBySeverity) {
                Object.entries(entry.metrics.errorsBySeverity).forEach(([sev, count]: [string, any]) => {
                  aggregatedMetrics.errorsBySeverity[sev] = 
                    (aggregatedMetrics.errorsBySeverity[sev] || 0) + count
                })
              }
            }
          })
        } catch (fileError) {
          // File doesn't exist for this date, skip
        }
      }
      
      // Calculate error rate (errors per session)
      const sessionCount = aggregatedMetrics.sessions.size
      aggregatedMetrics.errorRate = sessionCount > 0 ? 
        aggregatedMetrics.totalErrors / sessionCount : 0
      
      // Convert sessions Set to count
      const response = {
        ...aggregatedMetrics,
        sessions: sessionCount
      }
      
      return NextResponse.json(response)
      
    } catch (error) {
      console.error('Error reading metrics:', error)
      return NextResponse.json(aggregatedMetrics)
    }
    
  } catch (error) {
    console.error('Failed to get error metrics:', error)
    return NextResponse.json({ error: 'Failed to retrieve metrics' }, { status: 500 })
  }
}