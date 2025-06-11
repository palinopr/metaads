import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check memory usage
    const memUsage = process.memoryUsage()
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
    
    // Force garbage collection if available and memory is high
    if (global.gc && heapUsedMB > 400) {
      console.log('Running garbage collection...')
      global.gc()
    }
    
    const status = heapUsedMB > 500 ? 'warning' : 'healthy'
    
    return NextResponse.json({
      status,
      memory: {
        heapUsed: heapUsedMB,
        heapTotal: heapTotalMB,
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024)
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        api: 'operational',
        realtime: 'operational',
        deployment: 'operational'
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 })
  }
}