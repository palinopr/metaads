import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()
    
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs')
    try {
      await fs.mkdir(logsDir, { recursive: true })
    } catch (e) {
      // Directory might already exist
    }
    
    // Handle both single errors and batch errors
    const errors = requestData.batch && requestData.errors ? 
      requestData.errors : [requestData]
    
    const logEntries = errors.map((errorData: any) => ({
      ...errorData,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      timestamp: errorData.timestamp || new Date().toISOString(),
      offline: requestData.offline || false
    }))
    
    // Append to error log file
    const logFile = path.join(logsDir, `errors-${new Date().toISOString().split('T')[0]}.json`)
    
    try {
      const existingLogs = await fs.readFile(logFile, 'utf8')
      const logs = JSON.parse(existingLogs)
      logs.push(...logEntries)
      await fs.writeFile(logFile, JSON.stringify(logs, null, 2))
    } catch (e) {
      // File doesn't exist, create new one
      await fs.writeFile(logFile, JSON.stringify(logEntries, null, 2))
    }
    
    console.error(`Client error(s) logged: ${logEntries.length} error(s)`, {
      count: logEntries.length,
      offline: requestData.offline,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({ 
      success: true, 
      processed: logEntries.length 
    })
  } catch (error) {
    console.error('Failed to log error:', error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}