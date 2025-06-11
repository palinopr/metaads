// Note: child_process and fs imports are handled server-side only
// These will be dynamically imported when needed

export interface LogEntry {
  id: string
  timestamp: string
  level: 'error' | 'warning' | 'info' | 'debug' | 'trace'
  message: string
  details?: any
  source?: string
  category?: string
  tags?: string[]
  stackTrace?: string
  requestId?: string
  userId?: string
  duration?: number
  httpStatus?: number
  url?: string
  method?: string
}

export interface LogFilter {
  level?: string[]
  source?: string[]
  category?: string[]
  tags?: string[]
  timeRange?: {
    start: Date
    end: Date
  }
  searchTerm?: string
  httpStatus?: number[]
  method?: string[]
}

export interface LogStats {
  total: number
  byLevel: Record<string, number>
  bySource: Record<string, number>
  byCategory: Record<string, number>
  errorRate: number
  avgDuration?: number
}

/**
 * Log parsing utilities for various log formats
 */
export class LogParser {
  private static LOG_PATTERNS = {
    // Standard application log format
    standard: /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z?)\s+\[(\w+)\]\s+(.+)$/,
    
    // Docker container log format
    docker: /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{9}Z)\s+(.+)$/,
    
    // Nginx access log format
    nginx: /^(\d+\.\d+\.\d+\.\d+)\s+-\s+-\s+\[([^\]]+)\]\s+"(\w+)\s+([^"]+)\s+HTTP\/[\d\.]+"\s+(\d+)\s+(\d+)/,
    
    // Next.js log format
    nextjs: /^\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(\w+)\s+(.+)$/,
    
    // Meta API response format
    metaApi: /^META_API\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+\[(\w+)\]\s+(.+)$/,
  }

  static parseLogLine(line: string, source?: string): LogEntry | null {
    if (!line.trim()) return null

    try {
      // Try to parse as JSON first (structured logs)
      const jsonLog = JSON.parse(line)
      if (jsonLog.timestamp && jsonLog.level && jsonLog.message) {
        return this.normalizeLogEntry(jsonLog, source)
      }
    } catch {
      // Not JSON, try pattern matching
    }

    // Try different patterns based on source
    for (const [patternName, pattern] of Object.entries(this.LOG_PATTERNS)) {
      const match = line.match(pattern)
      if (match) {
        return this.parsePatternMatch(match, patternName, line, source)
      }
    }

    // Fallback: create basic log entry
    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level: this.detectLogLevel(line),
      message: line,
      source: source || 'unknown',
      category: 'general'
    }
  }

  private static parsePatternMatch(
    match: RegExpMatchArray, 
    patternName: string, 
    originalLine: string,
    source?: string
  ): LogEntry {
    const baseLog = {
      id: this.generateId(),
      source: source || patternName,
      category: this.categorizeLog(originalLine)
    }

    switch (patternName) {
      case 'standard':
      case 'metaApi':
        return {
          ...baseLog,
          timestamp: match[1],
          level: match[2].toLowerCase() as LogEntry['level'],
          message: match[3],
          tags: this.extractTags(match[3])
        }

      case 'docker':
        return {
          ...baseLog,
          timestamp: match[1],
          level: this.detectLogLevel(match[2]),
          message: match[2],
          tags: this.extractTags(match[2])
        }

      case 'nginx':
        return {
          ...baseLog,
          timestamp: match[2],
          level: parseInt(match[5]) >= 400 ? 'error' : 'info',
          message: `${match[3]} ${match[4]} - ${match[5]} (${match[6]} bytes)`,
          method: match[3],
          url: match[4],
          httpStatus: parseInt(match[5]),
          category: 'http'
        }

      case 'nextjs':
        return {
          ...baseLog,
          timestamp: new Date(match[1]).toISOString(),
          level: match[2].toLowerCase() as LogEntry['level'],
          message: match[3],
          category: 'nextjs'
        }

      default:
        return {
          ...baseLog,
          timestamp: new Date().toISOString(),
          level: 'info',
          message: originalLine
        }
    }
  }

  private static normalizeLogEntry(jsonLog: any, source?: string): LogEntry {
    return {
      id: jsonLog.id || this.generateId(),
      timestamp: jsonLog.timestamp,
      level: jsonLog.level,
      message: jsonLog.message,
      details: jsonLog.details,
      source: source || jsonLog.source,
      category: jsonLog.category || this.categorizeLog(jsonLog.message),
      tags: jsonLog.tags || this.extractTags(jsonLog.message),
      stackTrace: jsonLog.stackTrace || jsonLog.stack,
      requestId: jsonLog.requestId || jsonLog.req_id,
      userId: jsonLog.userId || jsonLog.user_id,
      duration: jsonLog.duration,
      httpStatus: jsonLog.httpStatus || jsonLog.status,
      url: jsonLog.url,
      method: jsonLog.method
    }
  }

  private static detectLogLevel(text: string): LogEntry['level'] {
    const lowerText = text.toLowerCase()
    if (lowerText.includes('error') || lowerText.includes('exception') || lowerText.includes('fail')) {
      return 'error'
    }
    if (lowerText.includes('warn') || lowerText.includes('caution')) {
      return 'warning'
    }
    if (lowerText.includes('debug') || lowerText.includes('trace')) {
      return 'debug'
    }
    return 'info'
  }

  private static categorizeLog(message: string): string {
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
    if (lowerMessage.includes('auth') || lowerMessage.includes('token') || lowerMessage.includes('login')) {
      return 'authentication'
    }
    if (lowerMessage.includes('cache') || lowerMessage.includes('redis')) {
      return 'cache'
    }
    if (lowerMessage.includes('docker') || lowerMessage.includes('container')) {
      return 'docker'
    }
    
    return 'general'
  }

  private static extractTags(message: string): string[] {
    const tags: string[] = []
    
    // Extract hashtags
    const hashtagMatches = message.match(/#\w+/g)
    if (hashtagMatches) {
      tags.push(...hashtagMatches.map(tag => tag.substring(1)))
    }
    
    // Extract key-value pairs
    const kvMatches = message.match(/(\w+)=([^\s]+)/g)
    if (kvMatches) {
      tags.push(...kvMatches.map(kv => kv.split('=')[0]))
    }
    
    return tags
  }

  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Docker container log integration (server-side only)
 */
export class DockerLogReader {
  static async getContainerLogs(
    containerName: string, 
    options: {
      tail?: number
      since?: string
      follow?: boolean
    } = {}
  ): Promise<LogEntry[]> {
    // This function runs server-side only
    if (typeof window !== 'undefined') {
      throw new Error('DockerLogReader can only be used server-side')
    }

    const { spawn } = await import('child_process')
    
    return new Promise((resolve, reject) => {
      const args = ['logs']
      
      if (options.tail) args.push('--tail', options.tail.toString())
      if (options.since) args.push('--since', options.since)
      if (options.follow) args.push('-f')
      
      args.push(containerName)
      
      const docker = spawn('docker', args)
      const logs: LogEntry[] = []
      let buffer = ''
      
      docker.stdout.on('data', (data) => {
        buffer += data.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          const logEntry = LogParser.parseLogLine(line, `docker:${containerName}`)
          if (logEntry) {
            logs.push(logEntry)
          }
        }
      })
      
      docker.stderr.on('data', (data) => {
        const errorLog: LogEntry = {
          id: LogParser['generateId'](),
          timestamp: new Date().toISOString(),
          level: 'error',
          message: data.toString(),
          source: `docker:${containerName}`,
          category: 'docker-error'
        }
        logs.push(errorLog)
      })
      
      docker.on('close', (code) => {
        if (code === 0) {
          resolve(logs)
        } else {
          reject(new Error(`Docker logs command failed with code ${code}`))
        }
      })
      
      docker.on('error', (error) => {
        reject(error)
      })
    })
  }

  static async streamContainerLogs(
    containerName: string,
    onLog: (log: LogEntry) => void,
    onError?: (error: Error) => void
  ): Promise<() => void> {
    // This function runs server-side only
    if (typeof window !== 'undefined') {
      throw new Error('DockerLogReader can only be used server-side')
    }

    const { spawn } = await import('child_process')
    
    const docker = spawn('docker', ['logs', '-f', '--tail', '100', containerName])
    let buffer = ''
    
    docker.stdout.on('data', (data) => {
      buffer += data.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        const logEntry = LogParser.parseLogLine(line, `docker:${containerName}`)
        if (logEntry) {
          onLog(logEntry)
        }
      }
    })
    
    docker.stderr.on('data', (data) => {
      const errorLog: LogEntry = {
        id: LogParser['generateId'](),
        timestamp: new Date().toISOString(),
        level: 'error',
        message: data.toString(),
        source: `docker:${containerName}`,
        category: 'docker-error'
      }
      onLog(errorLog)
    })
    
    docker.on('error', (error) => {
      if (onError) onError(error)
    })
    
    // Return cleanup function
    return () => {
      docker.kill()
    }
  }
}

/**
 * File-based log reader (server-side only)
 */
export class FileLogReader {
  static async readLogFile(filePath: string, options: {
    tail?: number
    follow?: boolean
  } = {}): Promise<LogEntry[]> {
    // This function runs server-side only
    if (typeof window !== 'undefined') {
      throw new Error('FileLogReader can only be used server-side')
    }

    try {
      const { promises: fs } = await import('fs')
      const path = await import('path')
      
      const content = await fs.readFile(filePath, 'utf-8')
      const lines = content.split('\n')
      
      const logLines = options.tail ? lines.slice(-options.tail) : lines
      const logs: LogEntry[] = []
      
      for (const line of logLines) {
        const logEntry = LogParser.parseLogLine(line, `file:${path.basename(filePath)}`)
        if (logEntry) {
          logs.push(logEntry)
        }
      }
      
      return logs
    } catch (error) {
      throw new Error(`Failed to read log file ${filePath}: ${error}`)
    }
  }

  static async watchLogFile(
    filePath: string,
    onLog: (log: LogEntry) => void,
    onError?: (error: Error) => void
  ): Promise<() => void> {
    // This function runs server-side only
    if (typeof window !== 'undefined') {
      throw new Error('FileLogReader can only be used server-side')
    }

    const { spawn } = await import('child_process')
    const path = await import('path')
    
    const tail = spawn('tail', ['-f', filePath])
    
    tail.stdout.on('data', (data) => {
      const lines = data.toString().split('\n')
      for (const line of lines) {
        if (line.trim()) {
          const logEntry = LogParser.parseLogLine(line, `file:${path.basename(filePath)}`)
          if (logEntry) {
            onLog(logEntry)
          }
        }
      }
    })
    
    tail.on('error', (error) => {
      if (onError) onError(error)
    })
    
    return () => {
      tail.kill()
    }
  }
}

/**
 * Log filtering and analysis utilities
 */
export class LogAnalyzer {
  static filterLogs(logs: LogEntry[], filter: LogFilter): LogEntry[] {
    return logs.filter(log => {
      // Level filter
      if (filter.level && filter.level.length > 0 && !filter.level.includes(log.level)) {
        return false
      }
      
      // Source filter
      if (filter.source && filter.source.length > 0 && !filter.source.includes(log.source || '')) {
        return false
      }
      
      // Category filter
      if (filter.category && filter.category.length > 0 && !filter.category.includes(log.category || '')) {
        return false
      }
      
      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        const logTags = log.tags || []
        if (!filter.tags.some(tag => logTags.includes(tag))) {
          return false
        }
      }
      
      // Time range filter
      if (filter.timeRange) {
        const logTime = new Date(log.timestamp)
        if (logTime < filter.timeRange.start || logTime > filter.timeRange.end) {
          return false
        }
      }
      
      // Search term filter
      if (filter.searchTerm) {
        const searchTerm = filter.searchTerm.toLowerCase()
        const searchableText = [
          log.message,
          log.source,
          log.category,
          ...(log.tags || []),
          JSON.stringify(log.details || {})
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchTerm)) {
          return false
        }
      }
      
      // HTTP status filter
      if (filter.httpStatus && filter.httpStatus.length > 0 && log.httpStatus) {
        if (!filter.httpStatus.includes(log.httpStatus)) {
          return false
        }
      }
      
      // HTTP method filter
      if (filter.method && filter.method.length > 0 && log.method) {
        if (!filter.method.includes(log.method)) {
          return false
        }
      }
      
      return true
    })
  }

  static generateStats(logs: LogEntry[]): LogStats {
    const stats: LogStats = {
      total: logs.length,
      byLevel: {},
      bySource: {},
      byCategory: {},
      errorRate: 0
    }
    
    let errorCount = 0
    let totalDuration = 0
    let durationCount = 0
    
    for (const log of logs) {
      // Count by level
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1
      
      // Count by source
      if (log.source) {
        stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1
      }
      
      // Count by category
      if (log.category) {
        stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1
      }
      
      // Count errors
      if (log.level === 'error') {
        errorCount++
      }
      
      // Calculate average duration
      if (log.duration !== undefined) {
        totalDuration += log.duration
        durationCount++
      }
    }
    
    stats.errorRate = logs.length > 0 ? (errorCount / logs.length) * 100 : 0
    stats.avgDuration = durationCount > 0 ? totalDuration / durationCount : undefined
    
    return stats
  }

  static detectAnomalies(logs: LogEntry[]): LogEntry[] {
    const anomalies: LogEntry[] = []
    
    // High error rate in short time window
    const errorLogs = logs.filter(log => log.level === 'error')
    if (errorLogs.length > 10) {
      const recentErrors = errorLogs.filter(log => {
        const logTime = new Date(log.timestamp)
        const now = new Date()
        return (now.getTime() - logTime.getTime()) < 60000 // Last minute
      })
      
      if (recentErrors.length > 5) {
        anomalies.push(...recentErrors)
      }
    }
    
    // Slow requests (if duration is available)
    const slowLogs = logs.filter(log => 
      log.duration !== undefined && log.duration > 5000 // > 5 seconds
    )
    anomalies.push(...slowLogs)
    
    // HTTP 5xx errors
    const serverErrors = logs.filter(log => 
      log.httpStatus && log.httpStatus >= 500 && log.httpStatus < 600
    )
    anomalies.push(...serverErrors)
    
    return anomalies
  }
}

/**
 * Log export utilities
 */
export class LogExporter {
  static exportToJSON(logs: LogEntry[]): string {
    return JSON.stringify(logs, null, 2)
  }

  static exportToCSV(logs: LogEntry[]): string {
    if (logs.length === 0) return ''
    
    const headers = [
      'timestamp', 'level', 'message', 'source', 'category', 
      'httpStatus', 'method', 'url', 'duration', 'requestId'
    ]
    
    const csvRows = [headers.join(',')]
    
    for (const log of logs) {
      const row = headers.map(header => {
        const value = (log as any)[header]
        if (value === undefined || value === null) return ''
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return String(value)
      })
      csvRows.push(row.join(','))
    }
    
    return csvRows.join('\n')
  }

  static exportToText(logs: LogEntry[]): string {
    return logs.map(log => {
      let line = `[${log.timestamp}] [${log.level.toUpperCase()}]`
      if (log.source) line += ` [${log.source}]`
      line += ` ${log.message}`
      if (log.details) {
        line += `\n  Details: ${JSON.stringify(log.details)}`
      }
      return line
    }).join('\n')
  }
}