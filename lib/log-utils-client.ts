// Client-side log utilities (no Node.js dependencies)

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
 * Log filtering and analysis utilities (client-side safe)
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
 * Log export utilities (client-side safe)
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