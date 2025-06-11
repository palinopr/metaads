"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LogEntry {
  id: string
  timestamp: Date
  type: 'info' | 'error' | 'warning' | 'network'
  message: string
  details?: any
}

interface NetworkRequest {
  id: string
  timestamp: Date
  method: string
  url: string
  status?: number
  statusText?: string
  duration?: number
  error?: string
  requestHeaders?: Record<string, string>
  responseHeaders?: Record<string, string>
  requestBody?: any
  responseBody?: any
}

export default function APIDebugPage() {
  const [token, setToken] = useState("")
  const [accountId, setAccountId] = useState("")
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [networkRequests, setNetworkRequests] = useState<NetworkRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load saved credentials
    const savedToken = localStorage.getItem("metaAccessToken") || ""
    const savedAccountId = localStorage.getItem("metaAdAccountId") || ""
    setToken(savedToken)
    setAccountId(savedAccountId)

    // Override console methods to capture logs
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn
    }

    console.log = (...args) => {
      addLog('info', args.join(' '), args)
      originalConsole.log(...args)
    }

    console.error = (...args) => {
      addLog('error', args.join(' '), args)
      originalConsole.error(...args)
    }

    console.warn = (...args) => {
      addLog('warning', args.join(' '), args)
      originalConsole.warn(...args)
    }

    // Intercept fetch to monitor network requests
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const [resource, config] = args
      const url = typeof resource === 'string' ? resource : resource.url
      const method = config?.method || 'GET'
      
      const requestId = Date.now().toString()
      const startTime = Date.now()
      
      const networkRequest: NetworkRequest = {
        id: requestId,
        timestamp: new Date(),
        method,
        url,
        requestHeaders: config?.headers as Record<string, string>,
        requestBody: config?.body
      }

      addNetworkRequest(networkRequest)
      
      try {
        const response = await originalFetch(...args)
        const duration = Date.now() - startTime
        
        // Clone response to read body
        const clonedResponse = response.clone()
        let responseBody
        try {
          responseBody = await clonedResponse.json()
        } catch {
          responseBody = await clonedResponse.text()
        }

        updateNetworkRequest(requestId, {
          status: response.status,
          statusText: response.statusText,
          duration,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          responseBody
        })

        if (!response.ok) {
          addLog('error', `API Error: ${response.status} ${response.statusText} for ${url}`, responseBody)
        }

        return response
      } catch (error) {
        const duration = Date.now() - startTime
        updateNetworkRequest(requestId, {
          duration,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        addLog('error', `Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`, error)
        throw error
      }
    }

    return () => {
      // Restore original methods
      console.log = originalConsole.log
      console.error = originalConsole.error
      console.warn = originalConsole.warn
      window.fetch = originalFetch
    }
  }, [])

  useEffect(() => {
    // Auto-scroll logs
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const addLog = (type: LogEntry['type'], message: string, details?: any) => {
    setLogs(prev => [...prev, {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      message,
      details
    }])
  }

  const addNetworkRequest = (request: NetworkRequest) => {
    setNetworkRequests(prev => [...prev, request])
  }

  const updateNetworkRequest = (id: string, updates: Partial<NetworkRequest>) => {
    setNetworkRequests(prev => prev.map(req => 
      req.id === id ? { ...req, ...updates } : req
    ))
  }

  const clearLogs = () => {
    setLogs([])
    setNetworkRequests([])
  }

  // Test functions
  const testDirectAPI = async () => {
    setIsLoading(true)
    addLog('info', 'Testing direct Meta API call...')
    
    try {
      const cleanToken = token.replace(/^Bearer\s+/i, '').trim()
      const url = `https://graph.facebook.com/v19.0/${accountId}?fields=id,name,currency&access_token=${cleanToken}`
      
      addLog('info', `Making request to: ${url.split('access_token=')[0]}...`)
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        addLog('info', 'Direct API call successful!', data)
      } else {
        addLog('error', 'Direct API call failed', data)
      }
    } catch (error) {
      addLog('error', `Direct API error: ${error instanceof Error ? error.message : 'Unknown error'}`, error)
    }
    
    setIsLoading(false)
  }

  const testProxyAPI = async () => {
    setIsLoading(true)
    addLog('info', 'Testing API through Next.js proxy...')
    
    try {
      const response = await fetch('/api/simple-meta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          accountId
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        addLog('info', 'Proxy API call successful!', data)
      } else {
        addLog('error', 'Proxy API call failed', data)
      }
    } catch (error) {
      addLog('error', `Proxy API error: ${error instanceof Error ? error.message : 'Unknown error'}`, error)
    }
    
    setIsLoading(false)
  }

  const testCORS = async () => {
    setIsLoading(true)
    addLog('info', 'Testing CORS headers...')
    
    try {
      const cleanToken = token.replace(/^Bearer\s+/i, '').trim()
      const url = `https://graph.facebook.com/v19.0/${accountId}?fields=id&access_token=${cleanToken}`
      
      // Test preflight
      const preflightResponse = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'content-type',
        }
      })
      
      addLog('info', `Preflight response status: ${preflightResponse.status}`)
      
      // Test actual request
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      }
      
      addLog('info', 'CORS headers received:', corsHeaders)
      
    } catch (error) {
      addLog('error', `CORS test error: ${error instanceof Error ? error.message : 'Unknown error'}`, error)
    }
    
    setIsLoading(false)
  }

  const runAllTests = async () => {
    clearLogs()
    await testDirectAPI()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await testProxyAPI()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await testCORS()
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3 
    })
  }

  const getLogTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      case 'network': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusColor = (status?: number) => {
    if (!status) return 'bg-gray-500'
    if (status >= 200 && status < 300) return 'bg-green-500'
    if (status >= 400 && status < 500) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Meta API Debug Console</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Access Token</Label>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your Meta access token"
              type="password"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {token ? `Token length: ${token.length} chars` : "No token set"}
            </p>
          </div>
          
          <div>
            <Label>Ad Account ID</Label>
            <Input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="act_123456789"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => {
              localStorage.setItem("metaAccessToken", token)
              localStorage.setItem("metaAdAccountId", accountId)
              addLog('info', 'Credentials saved to localStorage')
            }}>
              Save Credentials
            </Button>
            <Button onClick={runAllTests} disabled={isLoading} variant="outline">
              {isLoading ? "Running Tests..." : "Run All Tests"}
            </Button>
            <Button onClick={clearLogs} variant="destructive">
              Clear Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Button onClick={testDirectAPI} disabled={isLoading} variant="outline">
          Test Direct API Call
        </Button>
        <Button onClick={testProxyAPI} disabled={isLoading} variant="outline">
          Test Proxy API Call
        </Button>
        <Button onClick={testCORS} disabled={isLoading} variant="outline">
          Test CORS Headers
        </Button>
      </div>

      <Tabs defaultValue="console" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="console">Console Logs ({logs.length})</TabsTrigger>
          <TabsTrigger value="network">Network Requests ({networkRequests.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="console">
          <Card>
            <CardHeader>
              <CardTitle>Console Output</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground">No logs yet. Run a test to see output.</p>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div key={log.id} className="font-mono text-sm">
                        <span className="text-gray-500">{formatTimestamp(log.timestamp)}</span>
                        <span className={`ml-2 ${getLogTypeColor(log.type)}`}>
                          [{log.type.toUpperCase()}]
                        </span>
                        <span className="ml-2">{log.message}</span>
                        {log.details && (
                          <pre className="mt-1 ml-20 text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Network Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                {networkRequests.length === 0 ? (
                  <p className="text-muted-foreground">No network requests yet. Run a test to see traffic.</p>
                ) : (
                  <div className="space-y-4">
                    {networkRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{request.method}</Badge>
                            {request.status && (
                              <Badge className={getStatusColor(request.status)}>
                                {request.status} {request.statusText}
                              </Badge>
                            )}
                            {request.error && (
                              <Badge variant="destructive">Error</Badge>
                            )}
                          </div>
                          {request.duration && (
                            <span className="text-sm text-muted-foreground">
                              {request.duration}ms
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm">
                          <p className="font-mono break-all">{request.url}</p>
                        </div>
                        
                        {request.error && (
                          <Alert className="mt-2">
                            <AlertDescription>{request.error}</AlertDescription>
                          </Alert>
                        )}
                        
                        {request.responseBody && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-muted-foreground">
                              Response Body
                            </summary>
                            <pre className="mt-2 text-xs overflow-x-auto">
                              {JSON.stringify(request.responseBody, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">CORS Errors</h4>
            <p className="text-sm text-muted-foreground">
              If you see CORS errors when making direct API calls from the browser, this is expected. 
              Meta's API doesn't allow direct browser requests. Use the Next.js API routes as a proxy.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold">Token Expired (Error 190)</h4>
            <p className="text-sm text-muted-foreground">
              Your access token has expired. You need to generate a new one from Meta's Graph API Explorer 
              or through your app's authentication flow.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold">Invalid Token Format</h4>
            <p className="text-sm text-muted-foreground">
              Meta API tokens should not include the "Bearer" prefix. The token should be just the 
              alphanumeric string provided by Meta.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold">Network Timeouts</h4>
            <p className="text-sm text-muted-foreground">
              If requests are timing out, check your internet connection and Meta's API status. 
              Consider implementing retry logic with exponential backoff.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}