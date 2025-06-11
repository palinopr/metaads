import { NextRequest, NextResponse } from 'next/server'
import { LogEntry, DockerLogReader, FileLogReader, LogParser } from '@/lib/log-utils'

// In-memory log storage (in production, you'd use a proper logging service)
const logBuffer: LogEntry[] = []
const MAX_BUFFER_SIZE = 2000

// Active log streams
const activeStreams = new Set<ReadableStreamDefaultController>()
const dockerStreams = new Map<string, () => void>()
const fileStreams = new Map<string, () => void>()

// Helper function to add logs
export function addLog(level: LogEntry['level'], message: string, details?: any, source?: string) {
  const logEntry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    details,
    source,
    category: categorizeLog(message),
    tags: extractTags(message)
  }
  
  logBuffer.push(logEntry)
  
  // Keep buffer size limited
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift()
  }
  
  // Broadcast to all active streams
  broadcastLog(logEntry)
  
  // Also log to console for debugging
  const consoleMethod = level === 'error' ? console.error : 
                       level === 'warning' ? console.warn : 
                       console.log
  consoleMethod(`[${level.toUpperCase()}] ${message}`, details || '')
  
  return logEntry
}

// Helper function to categorize logs
function categorizeLog(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('meta') || lowerMessage.includes('facebook')) {
    return 'meta-api'
  }
  if (lowerMessage.includes('http') || lowerMessage.includes('request') || lowerMessage.includes('response')) {
    return 'http'
  }
  if (lowerMessage.includes('database') || lowerMessage.includes('sql') || lowerMessage.includes('query')) {
    return 'database'
  }
  return 'general'
}

// Helper function to extract tags
function extractTags(message: string): string[] {
  const tags: string[] = []
  const hashtagMatches = message.match(/#\w+/g)
  if (hashtagMatches) {
    tags.push(...hashtagMatches.map(tag => tag.substring(1)))
  }
  return tags
}

// Broadcast log to all active streams
function broadcastLog(logEntry: LogEntry) {
  const data = `data: ${JSON.stringify(logEntry)}\n\n`
  for (const controller of activeStreams) {
    try {
      controller.enqueue(data)
    } catch (error) {
      // Remove inactive streams
      activeStreams.delete(controller)
    }
  }
}

// Initialize Docker log streaming
async function initializeDockerStreams() {
  const containerNames = ['metaads', 'metaads-db', 'metaads-redis'] // Common container names
  
  for (const containerName of containerNames) {
    try {
      const cleanup = await DockerLogReader.streamContainerLogs(
        containerName,
        (log) => {
          logBuffer.push(log)
          if (logBuffer.length > MAX_BUFFER_SIZE) {
            logBuffer.shift()
          }
          broadcastLog(log)
        },
        (error) => {
          console.warn(`Docker stream error for ${containerName}:`, error.message)
        }
      )
      dockerStreams.set(containerName, cleanup)
    } catch (error) {
      console.log(`Container ${containerName} not found, skipping...`)
    }
  }
}

// Initialize file log streaming
async function initializeFileStreams() {
  const logFiles = [
    './server.log',
    './server-error.log',
    './next.log',
    '/var/log/nginx/access.log',
    '/var/log/nginx/error.log'
  ]
  
  for (const filePath of logFiles) {
    try {
      const cleanup = await FileLogReader.watchLogFile(
        filePath,
        (log) => {
          logBuffer.push(log)
          if (logBuffer.length > MAX_BUFFER_SIZE) {
            logBuffer.shift()
          }
          broadcastLog(log)
        },
        (error) => {
          console.warn(`File stream error for ${filePath}:`, error.message)
        }
      )
      fileStreams.set(filePath, cleanup)
    } catch (error) {
      console.log(`Log file ${filePath} not accessible, skipping...`)
    }
  }
}

// Initialize all streams on startup
let streamsInitialized = false
async function ensureStreamsInitialized() {
  if (!streamsInitialized) {
    streamsInitialized = true
    await Promise.all([
      initializeDockerStreams(),
      initializeFileStreams()
    ])
  }
}

// Global logging functions
if (typeof global !== 'undefined') {
  (global as any).logInfo = (message: string, details?: any, source?: string) => 
    addLog('info', message, details, source);
  (global as any).logWarning = (message: string, details?: any, source?: string) => 
    addLog('warning', message, details, source);
  (global as any).logError = (message: string, details?: any, source?: string) => 
    addLog('error', message, details, source);
  (global as any).logDebug = (message: string, details?: any, source?: string) => 
    addLog('debug', message, details, source);
}

export async function GET(request: NextRequest) {
  // Initialize streams on first request
  await ensureStreamsInitialized()
  
  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  })

  // Parse query parameters for filtering
  const url = new URL(request.url)
  const source = url.searchParams.get('source')
  const level = url.searchParams.get('level')
  const category = url.searchParams.get('category')

  // Create a readable stream
  const stream = new ReadableStream({
    start(controller) {
      // Add controller to active streams
      activeStreams.add(controller)
      
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ 
        id: 'connection', 
        timestamp: new Date().toISOString(), 
        level: 'info', 
        message: 'Connected to enhanced log stream',
        source: 'system',
        category: 'connection'
      })}\n\n`)

      // Send buffered logs (with filtering if specified)
      const filteredLogs = logBuffer.filter(log => {
        if (source && log.source !== source) return false
        if (level && log.level !== level) return false
        if (category && log.category !== category) return false
        return true
      })
      
      filteredLogs.forEach(log => {
        controller.enqueue(`data: ${JSON.stringify(log)}\n\n`)
      })

      // Send heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        if (request.signal.aborted) {
          clearInterval(heartbeatInterval)
          return
        }
        try {
          controller.enqueue(`:heartbeat ${Date.now()}\n\n`)
        } catch (error) {
          clearInterval(heartbeatInterval)
          activeStreams.delete(controller)
        }
      }, 30000)

      // Clean up on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval)
        activeStreams.delete(controller)
        try {
          controller.close()
        } catch (error) {
          // Controller already closed
        }
      })
    },
  })

  return new NextResponse(stream, { headers })
}

// Demo endpoint to generate test logs
export async function POST(request: NextRequest) {
  try {
    const { level, message, details, source } = await request.json()
    
    if (!level || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const logEntry = addLog(level, message, details, source)
    
    return NextResponse.json({ success: true, log: logEntry })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}