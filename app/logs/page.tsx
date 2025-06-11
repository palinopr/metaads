'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Trash2, Download, Pause, Play, Filter, Search, Settings, AlertTriangle, Info, Bug, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { LogEntry, LogAnalyzer, LogExporter } from '@/lib/log-utils-client'

interface LogFilter {
  levels: string[]
  sources: string[]
  categories: string[]
  searchTerm: string
  showStackTraces: boolean
  timeRange: 'all' | '1h' | '6h' | '24h' | '7d'
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filters, setFilters] = useState<LogFilter>({
    levels: [],
    sources: [],
    categories: [],
    searchTerm: '',
    showStackTraces: true,
    timeRange: 'all'
  })
  const [isPaused, setIsPaused] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'txt'>('json')
  const [showStats, setShowStats] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isPaused) {
      connectToStream()
    } else {
      disconnectStream()
    }

    return () => {
      disconnectStream()
    }
  }, [isPaused])

  const connectToStream = () => {
    try {
      eventSourceRef.current = new EventSource('/api/logs/stream')
      
      eventSourceRef.current.onopen = () => {
        setIsConnected(true)
        console.log('Connected to log stream')
      }

      eventSourceRef.current.onmessage = (event) => {
        try {
          const logEntry = JSON.parse(event.data) as LogEntry
          setLogs(prevLogs => {
            const newLogs = [...prevLogs, logEntry]
            // Keep only last 1000 logs
            if (newLogs.length > 1000) {
              return newLogs.slice(-1000)
            }
            return newLogs
          })
          
          // Auto-scroll to bottom if enabled
          if (autoScroll) {
            setTimeout(() => {
              if (scrollAreaRef.current) {
                const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
                if (scrollContainer) {
                  scrollContainer.scrollTop = scrollContainer.scrollHeight
                }
              }
            }, 100)
          }
        } catch (error) {
          console.error('Failed to parse log entry:', error)
        }
      }

      eventSourceRef.current.onerror = () => {
        setIsConnected(false)
        console.error('Log stream connection error')
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (!isPaused) {
            connectToStream()
          }
        }, 5000)
      }
    } catch (error) {
      console.error('Failed to connect to log stream:', error)
      setIsConnected(false)
    }
  }

  const disconnectStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  // Compute filtered logs with advanced filtering
  const filteredLogs = useMemo(() => {
    let result = logs

    // Apply time range filter
    if (filters.timeRange !== 'all') {
      const now = new Date()
      const timeMap = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      }
      const cutoff = new Date(now.getTime() - timeMap[filters.timeRange])
      result = result.filter(log => new Date(log.timestamp) >= cutoff)
    }

    // Apply level filters
    if (filters.levels.length > 0) {
      result = result.filter(log => filters.levels.includes(log.level))
    }

    // Apply source filters
    if (filters.sources.length > 0) {
      result = result.filter(log => log.source && filters.sources.includes(log.source))
    }

    // Apply category filters
    if (filters.categories.length > 0) {
      result = result.filter(log => log.category && filters.categories.includes(log.category))
    }

    // Apply search term
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase()
      result = result.filter(log => {
        const searchableText = [
          log.message,
          log.source,
          log.category,
          ...(log.tags || []),
          JSON.stringify(log.details || {})
        ].join(' ').toLowerCase()
        return searchableText.includes(searchTerm)
      })
    }

    return result
  }, [logs, filters])

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const sources = [...new Set(logs.map(log => log.source).filter(Boolean))]
    const categories = [...new Set(logs.map(log => log.category).filter(Boolean))]
    return { sources, categories }
  }, [logs])

  // Generate log statistics
  const logStats = useMemo(() => {
    return LogAnalyzer.generateStats(filteredLogs)
  }, [filteredLogs])

  // Detect anomalies
  const anomalies = useMemo(() => {
    return LogAnalyzer.detectAnomalies(logs)
  }, [logs])

  const exportLogs = () => {
    let content: string
    let mimeType: string
    let extension: string

    switch (exportFormat) {
      case 'csv':
        content = LogExporter.exportToCSV(filteredLogs)
        mimeType = 'text/csv'
        extension = 'csv'
        break
      case 'txt':
        content = LogExporter.exportToText(filteredLogs)
        mimeType = 'text/plain'
        extension = 'txt'
        break
      default:
        content = LogExporter.exportToJSON(filteredLogs)
        mimeType = 'application/json'
        extension = 'json'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.${extension}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const updateFilter = (key: keyof LogFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleFilterValue = (key: 'levels' | 'sources' | 'categories', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }))
  }

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive'
      case 'warning':
        return 'outline'
      case 'info':
        return 'secondary'
      case 'debug':
        return 'default'
      case 'trace':
        return 'default'
      default:
        return 'default'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400 bg-red-950/20 border-red-800'
      case 'warning':
        return 'text-yellow-400 bg-yellow-950/20 border-yellow-800'
      case 'info':
        return 'text-blue-400 bg-blue-950/20 border-blue-800'
      case 'debug':
        return 'text-gray-400 bg-gray-950/20 border-gray-800'
      case 'trace':
        return 'text-purple-400 bg-purple-950/20 border-purple-800'
      default:
        return 'text-gray-400 bg-gray-950/20 border-gray-800'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertTriangle className="w-3 h-3" />
      case 'warning':
        return <Zap className="w-3 h-3" />
      case 'info':
        return <Info className="w-3 h-3" />
      case 'debug':
      case 'trace':
        return <Bug className="w-3 h-3" />
      default:
        return <Info className="w-3 h-3" />
    }
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'meta-api':
        return 'bg-blue-600'
      case 'http':
        return 'bg-green-600'
      case 'database':
        return 'bg-purple-600'
      case 'authentication':
        return 'bg-orange-600'
      case 'docker':
        return 'bg-cyan-600'
      case 'cache':
        return 'bg-pink-600'
      default:
        return 'bg-gray-600'
    }
  }

  const isAnomaly = (log: LogEntry) => {
    return anomalies.some(anomaly => anomaly.id === log.id)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-time Log Viewer</h1>
          <p className="text-muted-foreground mt-1">
            Monitor application logs in real-time for debugging Meta API issues
          </p>
        </div>
        <div className="flex items-center gap-3">
          {anomalies.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {anomalies.length} Anomalies
            </Badge>
          )}
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg">Log Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{logStats.total}</div>
                <div className="text-sm text-gray-400">Total Logs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{logStats.byLevel.error || 0}</div>
                <div className="text-sm text-gray-400">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{logStats.byLevel.warning || 0}</div>
                <div className="text-sm text-gray-400">Warnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{logStats.errorRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-400">Error Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Search & Filters</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search Input */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            {/* Time Range Filter */}
            <Select 
              value={filters.timeRange} 
              onValueChange={(value) => updateFilter('timeRange', value)}
            >
              <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="6h">Last 6 Hours</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>

            {/* Level Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
                  <Filter className="w-4 h-4 mr-2" />
                  Levels ({filters.levels.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 bg-gray-800 border-gray-700">
                <div className="space-y-2">
                  {['error', 'warning', 'info', 'debug', 'trace'].map(level => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={level}
                        checked={filters.levels.includes(level)}
                        onCheckedChange={() => toggleFilterValue('levels', level)}
                      />
                      <Label htmlFor={level} className="flex items-center gap-2">
                        {getLevelIcon(level)}
                        {level.toUpperCase()}
                      </Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Source Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
                  Sources ({filters.sources.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 bg-gray-800 border-gray-700">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filterOptions.sources.map(source => (
                    <div key={source} className="flex items-center space-x-2">
                      <Checkbox
                        id={source}
                        checked={filters.sources.includes(source)}
                        onCheckedChange={() => toggleFilterValue('sources', source)}
                      />
                      <Label htmlFor={source} className="text-sm">{source}</Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Category Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
                  Categories ({filters.categories.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 bg-gray-800 border-gray-700">
                <div className="space-y-2">
                  {filterOptions.categories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={filters.categories.includes(category)}
                        onCheckedChange={() => toggleFilterValue('categories', category)}
                      />
                      <Label htmlFor={category} className="text-sm flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getCategoryColor(category)}`} />
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Additional Options */}
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoScroll"
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
              />
              <Label htmlFor="autoScroll">Auto-scroll</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showStackTraces"
                checked={filters.showStackTraces}
                onCheckedChange={(checked) => updateFilter('showStackTraces', checked)}
              />
              <Label htmlFor="showStackTraces">Show stack traces</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Log Stream</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={exportFormat} onValueChange={(value: 'json' | 'csv' | 'txt') => setExportFormat(value)}>
                <SelectTrigger className="w-20 bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="txt">TXT</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
                className="bg-gray-800 border-gray-700 hover:bg-gray-700"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportLogs}
                disabled={filteredLogs.length === 0}
                className="bg-gray-800 border-gray-700 hover:bg-gray-700"
              >
                <Download className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearLogs}
                disabled={logs.length === 0}
                className="bg-gray-800 border-gray-700 hover:bg-gray-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="bg-black rounded-lg border border-gray-800 p-4">
            <ScrollArea className="h-[600px]" ref={scrollAreaRef}>
              <div className="space-y-1 font-mono text-sm">
                {filteredLogs.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    {isPaused ? 'Log streaming is paused' : 'Waiting for logs...'}
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`border rounded-lg p-3 transition-all duration-200 ${
                        getLevelColor(log.level)
                      } ${
                        isAnomaly(log) ? 'animate-pulse border-red-500' : ''
                      } hover:bg-opacity-80`}
                    >
                      {/* Header Row */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gray-400 text-xs whitespace-nowrap font-mono">
                          {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          {getLevelIcon(log.level)}
                          <Badge
                            variant={getLevelBadgeVariant(log.level)}
                            className="text-xs px-2 py-0 h-5"
                          >
                            {log.level.toUpperCase()}
                          </Badge>
                        </div>

                        {log.category && (
                          <Badge 
                            className={`text-xs px-2 py-0 h-5 text-white ${getCategoryColor(log.category)}`}
                          >
                            {log.category}
                          </Badge>
                        )}

                        {log.source && (
                          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                            {log.source}
                          </span>
                        )}

                        {isAnomaly(log) && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            ANOMALY
                          </Badge>
                        )}

                        <div className="flex-1" />

                        {log.httpStatus && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            log.httpStatus >= 400 ? 'bg-red-700 text-red-100' : 'bg-green-700 text-green-100'
                          }`}>
                            {log.httpStatus}
                          </span>
                        )}

                        {log.duration && (
                          <span className="text-xs text-yellow-400">
                            {log.duration}ms
                          </span>
                        )}
                      </div>

                      {/* Message */}
                      <div className="mb-2">
                        <div className="break-all font-mono text-sm">
                          {log.message}
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="space-y-2">
                        {log.url && (
                          <div className="text-xs">
                            <span className="text-gray-400">URL:</span>{' '}
                            <span className="text-blue-400">{log.method}</span>{' '}
                            <span className="text-gray-300">{log.url}</span>
                          </div>
                        )}

                        {log.tags && log.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs text-gray-400">Tags:</span>
                            {log.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs h-4 px-1">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {log.requestId && (
                          <div className="text-xs">
                            <span className="text-gray-400">Request ID:</span>{' '}
                            <span className="text-purple-400 font-mono">{log.requestId}</span>
                          </div>
                        )}

                        {log.userId && (
                          <div className="text-xs">
                            <span className="text-gray-400">User ID:</span>{' '}
                            <span className="text-orange-400 font-mono">{log.userId}</span>
                          </div>
                        )}

                        {log.details && (
                          <details className="text-xs">
                            <summary className="text-gray-400 cursor-pointer hover:text-gray-300">
                              Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-900 rounded text-gray-300 overflow-x-auto text-xs">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}

                        {log.stackTrace && filters.showStackTraces && (
                          <details className="text-xs">
                            <summary className="text-red-400 cursor-pointer hover:text-red-300">
                              Stack Trace
                            </summary>
                            <pre className="mt-2 p-2 bg-red-950/20 border border-red-800 rounded text-red-300 overflow-x-auto text-xs">
                              {log.stackTrace}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <div>
              Showing {filteredLogs.length} of {logs.length} logs
              {logs.length >= 2000 && ' (limited to last 2000)'}
            </div>
            <div className="flex items-center gap-4">
              {anomalies.length > 0 && (
                <span className="text-red-400">
                  {anomalies.length} anomalies detected
                </span>
              )}
              <span>
                Error rate: {logStats.errorRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}