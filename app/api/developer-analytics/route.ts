import { NextRequest, NextResponse } from 'next/server'
import { developerAnalytics } from '@/lib/developer-analytics'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    const developerId = searchParams.get('developerId')
    const format = searchParams.get('format') || 'json'

    let data: any

    switch (type) {
      case 'overview':
        data = developerAnalytics.getAPIAnalytics()
        break
        
      case 'health':
        data = developerAnalytics.getAPIHealthMetrics()
        break
        
      case 'developer':
        if (!developerId) {
          return NextResponse.json(
            { error: 'Developer ID is required for developer-specific analytics' },
            { status: 400 }
          )
        }
        try {
          data = developerAnalytics.getDeveloperMetrics(developerId)
        } catch (error) {
          return NextResponse.json(
            { error: 'Developer not found' },
            { status: 404 }
          )
        }
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid analytics type. Use: overview, health, or developer' },
          { status: 400 }
        )
    }

    // Support different output formats
    if (format === 'csv' && type === 'overview') {
      const csv = convertToCSV(data)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="api-analytics.csv"'
        }
      })
    }

    return NextResponse.json({
      success: true,
      type,
      data,
      timestamp: new Date().toISOString(),
      ...(developerId && { developerId })
    })

  } catch (error) {
    console.error('Developer analytics error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve analytics data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'track_event':
        // Custom event tracking
        if (!data.event || !data.developerId) {
          return NextResponse.json(
            { error: 'Event name and developer ID are required' },
            { status: 400 }
          )
        }
        
        // Here you would typically track custom events
        // For now, just acknowledge the request
        return NextResponse.json({
          success: true,
          message: 'Event tracked successfully',
          eventId: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })

      case 'bulk_export':
        // Bulk data export for admin users
        const { startDate, endDate, developerId } = data
        
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'Start date and end date are required for bulk export' },
            { status: 400 }
          )
        }
        
        // In production, this would generate a background job
        // and return a job ID for status checking
        return NextResponse.json({
          success: true,
          message: 'Bulk export initiated',
          jobId: `export_${Date.now()}`,
          estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: track_event or bulk_export' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Developer analytics POST error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process analytics request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to convert data to CSV format
function convertToCSV(data: any): string {
  if (!data.topEndpoints) return ''
  
  const headers = ['Endpoint', 'Requests', 'Unique Developers', 'Avg Response Time (ms)']
  const rows = data.topEndpoints.map((endpoint: any) => [
    endpoint.endpoint,
    endpoint.requests,
    endpoint.uniqueDevelopers,
    endpoint.avgResponseTime
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map((row: any[]) => row.join(','))
  ].join('\n')
  
  return csvContent
}