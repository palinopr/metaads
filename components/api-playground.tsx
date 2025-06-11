"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Play, Download, Upload, BookOpen, Code2, Zap, AlertTriangle, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface APIEndpoint {
  id: string
  name: string
  method: string
  path: string
  description: string
  category: string
  parameters: Parameter[]
  requestBody?: RequestBodySchema
  responses: Response[]
  examples: Example[]
  security?: string[]
}

interface Parameter {
  name: string
  type: string
  required: boolean
  description: string
  example?: any
  enum?: string[]
  location: 'query' | 'header' | 'path'
}

interface RequestBodySchema {
  type: string
  properties: { [key: string]: any }
  required?: string[]
  example?: any
}

interface Response {
  status: number
  description: string
  example?: any
}

interface Example {
  name: string
  description: string
  request: any
  response?: any
}

const API_ENDPOINTS: APIEndpoint[] = [
  {
    id: 'health',
    name: 'Health Check',
    method: 'GET',
    path: '/api/health',
    description: 'Check the health status of the API and system resources',
    category: 'System',
    parameters: [],
    responses: [
      {
        status: 200,
        description: 'System is healthy',
        example: {
          status: 'healthy',
          memory: { heapUsed: 125, heapTotal: 200 },
          uptime: 3600,
          timestamp: '2023-12-10T10:30:00Z'
        }
      }
    ],
    examples: [
      {
        name: 'Basic health check',
        description: 'Get current system health status',
        request: {}
      }
    ]
  },
  {
    id: 'meta-overview',
    name: 'Campaign Overview',
    method: 'POST',
    path: '/api/meta',
    description: 'Get overview of all campaigns with insights and ad sets',
    category: 'Meta API',
    parameters: [],
    requestBody: {
      type: 'object',
      required: ['type', 'adAccountId', 'accessToken'],
      properties: {
        type: { type: 'string', enum: ['overview'] },
        adAccountId: { type: 'string', description: 'Meta ad account ID (act_XXXXXX)' },
        accessToken: { type: 'string', description: 'Meta API access token' },
        datePreset: { type: 'string', default: 'last_30d' }
      },
      example: {
        type: 'overview',
        adAccountId: 'act_123456789',
        accessToken: 'YOUR_ACCESS_TOKEN',
        datePreset: 'last_30d'
      }
    },
    responses: [
      {
        status: 200,
        description: 'Campaign overview data',
        example: {
          campaigns: [
            {
              id: '123456789',
              name: 'Summer Sale Campaign',
              status: 'ACTIVE',
              spend: 1500.50,
              impressions: 50000,
              clicks: 2500,
              roas: 4.2
            }
          ],
          success: true
        }
      },
      {
        status: 401,
        description: 'Invalid access token',
        example: {
          error: 'Invalid OAuth access token',
          success: false
        }
      }
    ],
    examples: [
      {
        name: 'Get campaign overview',
        description: 'Fetch all campaigns with their performance metrics',
        request: {
          type: 'overview',
          adAccountId: 'act_123456789',
          accessToken: 'YOUR_ACCESS_TOKEN',
          datePreset: 'last_30d'
        }
      }
    ],
    security: ['MetaAccessToken']
  },
  {
    id: 'meta-campaign-details',
    name: 'Campaign Details',
    method: 'POST',
    path: '/api/meta',
    description: 'Get detailed campaign data including historical and hourly insights',
    category: 'Meta API',
    parameters: [],
    requestBody: {
      type: 'object',
      required: ['type', 'campaignId', 'adAccountId', 'accessToken'],
      properties: {
        type: { type: 'string', enum: ['campaign_details'] },
        campaignId: { type: 'string', description: 'Meta campaign ID' },
        adAccountId: { type: 'string', description: 'Meta ad account ID' },
        accessToken: { type: 'string', description: 'Meta API access token' },
        datePreset: { type: 'string', default: 'last_30d' }
      },
      example: {
        type: 'campaign_details',
        campaignId: '123456789',
        adAccountId: 'act_123456789',
        accessToken: 'YOUR_ACCESS_TOKEN',
        datePreset: 'last_7d'
      }
    },
    responses: [
      {
        status: 200,
        description: 'Campaign detailed data',
        example: {
          historicalDailyData: [
            { date: '2023-12-01', spend: 100, revenue: 400, roas: 4.0 }
          ],
          todayHourlyData: [
            { hour: '10:00', spend: 10, impressions: 1000, clicks: 50 }
          ],
          adSets: [],
          success: true
        }
      }
    ],
    examples: [
      {
        name: 'Get campaign details',
        description: 'Fetch detailed historical and hourly data for a specific campaign',
        request: {
          type: 'campaign_details',
          campaignId: '123456789',
          adAccountId: 'act_123456789',
          accessToken: 'YOUR_ACCESS_TOKEN',
          datePreset: 'last_7d'
        }
      }
    ],
    security: ['MetaAccessToken']
  },
  {
    id: 'meta-test-connection',
    name: 'Test Connection',
    method: 'POST',
    path: '/api/meta',
    description: 'Test connection to Meta API and validate credentials',
    category: 'Meta API',
    parameters: [],
    requestBody: {
      type: 'object',
      required: ['type', 'adAccountId', 'accessToken'],
      properties: {
        type: { type: 'string', enum: ['test_connection'] },
        adAccountId: { type: 'string', description: 'Meta ad account ID' },
        accessToken: { type: 'string', description: 'Meta API access token' }
      },
      example: {
        type: 'test_connection',
        adAccountId: 'act_123456789',
        accessToken: 'YOUR_ACCESS_TOKEN'
      }
    },
    responses: [
      {
        status: 200,
        description: 'Connection successful',
        example: {
          success: true,
          accountInfo: {
            id: 'act_123456789',
            name: 'My Ad Account',
            status: 'ACTIVE',
            currency: 'USD',
            timezone: 'America/New_York'
          }
        }
      },
      {
        status: 401,
        description: 'Invalid credentials',
        example: {
          success: false,
          error: 'Invalid OAuth access token'
        }
      }
    ],
    examples: [
      {
        name: 'Test API connection',
        description: 'Validate Meta API credentials and account access',
        request: {
          type: 'test_connection',
          adAccountId: 'act_123456789',
          accessToken: 'YOUR_ACCESS_TOKEN'
        }
      }
    ],
    security: ['MetaAccessToken']
  },
  {
    id: 'demographics',
    name: 'Demographics Analytics',
    method: 'POST',
    path: '/api/meta/demographics',
    description: 'Get demographic breakdown data for a campaign',
    category: 'Analytics',
    parameters: [],
    requestBody: {
      type: 'object',
      required: ['campaignId', 'accessToken'],
      properties: {
        campaignId: { type: 'string', description: 'Meta campaign ID' },
        accessToken: { type: 'string', description: 'Meta API access token' },
        datePreset: { type: 'string', default: 'last_30d' }
      },
      example: {
        campaignId: '123456789',
        accessToken: 'YOUR_ACCESS_TOKEN',
        datePreset: 'last_30d'
      }
    },
    responses: [
      {
        status: 200,
        description: 'Demographic analytics data',
        example: {
          age: [
            { range: '25-34', conversions: 50, revenue: 2000, percentage: 35 }
          ],
          gender: [
            { type: 'Female', conversions: 80, revenue: 3200, percentage: 55 }
          ],
          region: [
            { city: 'New York', state: 'NY', conversions: 30, revenue: 1200, roas: 4.0 }
          ],
          device: [
            { platform: 'Mobile', conversions: 100, revenue: 4000, percentage: 70 }
          ]
        }
      }
    ],
    examples: [
      {
        name: 'Get demographics data',
        description: 'Fetch demographic breakdown for campaign performance',
        request: {
          campaignId: '123456789',
          accessToken: 'YOUR_ACCESS_TOKEN',
          datePreset: 'last_30d'
        }
      }
    ],
    security: ['MetaAccessToken']
  },
  {
    id: 'ai-insights',
    name: 'AI Insights',
    method: 'POST',
    path: '/api/ai-insights',
    description: 'Generate AI-powered insights and predictions',
    category: 'AI & Analytics',
    parameters: [],
    requestBody: {
      type: 'object',
      required: ['campaigns', 'action'],
      properties: {
        campaigns: { type: 'array', description: 'Array of campaign objects' },
        action: { 
          type: 'string', 
          enum: ['predictions', 'anomalies', 'recommendations', 'trends', 'competitor', 'sentiment', 'ab-test', 'performance-prediction', 'insights'],
          description: 'Type of AI analysis to perform'
        },
        params: { type: 'object', description: 'Action-specific parameters' },
        claudeApiKey: { type: 'string', description: 'Claude API key' }
      },
      example: {
        campaigns: [],
        action: 'recommendations',
        params: {},
        claudeApiKey: 'YOUR_CLAUDE_API_KEY'
      }
    },
    responses: [
      {
        status: 200,
        description: 'AI insights generated',
        example: {
          success: true,
          data: {
            recommendations: [
              {
                type: 'budget',
                priority: 'high',
                action: 'Increase budget by 20%',
                reasoning: 'Campaign is performing well with high ROAS'
              }
            ]
          },
          action: 'recommendations',
          timestamp: '2023-12-10T10:30:00Z'
        }
      }
    ],
    examples: [
      {
        name: 'Get optimization recommendations',
        description: 'Generate AI-powered optimization suggestions',
        request: {
          campaigns: [],
          action: 'recommendations',
          params: {},
          claudeApiKey: 'YOUR_CLAUDE_API_KEY'
        }
      }
    ],
    security: ['ClaudeAPI']
  },
  {
    id: 'realtime-status',
    name: 'Real-time Status',
    method: 'GET',
    path: '/api/realtime',
    description: 'Get real-time system operational status',
    category: 'Real-time',
    parameters: [
      {
        name: 'demo',
        type: 'string',
        required: false,
        description: 'Set to "true" to generate demo data',
        example: 'true',
        enum: ['true', 'false'],
        location: 'query'
      }
    ],
    responses: [
      {
        status: 200,
        description: 'Real-time system status',
        example: {
          status: 'operational',
          uptime: 3600,
          timestamp: '2023-12-10T10:30:00Z',
          stats: {
            websocket: { connections: 5 },
            streaming: { queries: 10 }
          }
        }
      }
    ],
    examples: [
      {
        name: 'Get system status',
        description: 'Check real-time system operational status',
        request: {}
      },
      {
        name: 'Generate demo data',
        description: 'Generate demo real-time data for testing',
        request: { demo: 'true' }
      }
    ]
  }
]

export function APIPlayground() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(API_ENDPOINTS[0])
  const [requestData, setRequestData] = useState<string>('')
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [headers, setHeaders] = useState<{ [key: string]: string }>({
    'Content-Type': 'application/json'
  })
  const [queryParams, setQueryParams] = useState<{ [key: string]: string }>({})
  const { toast } = useToast()
  const responseRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (selectedEndpoint) {
      // Initialize request data based on endpoint
      if (selectedEndpoint.requestBody?.example) {
        setRequestData(JSON.stringify(selectedEndpoint.requestBody.example, null, 2))
      } else {
        setRequestData('')
      }
      
      // Initialize query parameters
      const params: { [key: string]: string } = {}
      selectedEndpoint.parameters?.forEach(param => {
        if (param.location === 'query' && param.example) {
          params[param.name] = param.example.toString()
        }
      })
      setQueryParams(params)
    }
  }, [selectedEndpoint])

  const handleSendRequest = async () => {
    if (!selectedEndpoint) return

    setLoading(true)
    setResponse(null)

    try {
      const url = new URL(`${window.location.origin}${selectedEndpoint.path}`)
      
      // Add query parameters
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value) {
          url.searchParams.append(key, value)
        }
      })

      const requestOptions: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          ...headers,
        }
      }

      // Add request body for POST requests
      if (selectedEndpoint.method === 'POST' && requestData.trim()) {
        try {
          JSON.parse(requestData) // Validate JSON
          requestOptions.body = requestData
        } catch (error) {
          throw new Error('Invalid JSON in request body')
        }
      }

      const response = await fetch(url.toString(), requestOptions)
      const data = await response.json()

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data
      })

      if (response.ok) {
        toast({
          title: "Request Successful",
          description: `${selectedEndpoint.method} ${selectedEndpoint.path} returned ${response.status}`,
        })
      } else {
        toast({
          title: "Request Failed",
          description: `${selectedEndpoint.method} ${selectedEndpoint.path} returned ${response.status}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      setResponse({
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      
      toast({
        title: "Request Error",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to Clipboard",
      description: "Content has been copied to your clipboard",
    })
  }

  const loadExample = (example: Example) => {
    if (example.request) {
      setRequestData(JSON.stringify(example.request, null, 2))
    }
    
    // Update query params if needed
    if (selectedEndpoint?.method === 'GET' && example.request) {
      const params: { [key: string]: string } = {}
      Object.entries(example.request).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
          params[key] = value.toString()
        }
      })
      setQueryParams(params)
    }
  }

  const exportCollection = () => {
    const collection = {
      info: {
        name: 'Meta Ads Dashboard API',
        description: 'API collection for Meta Ads Dashboard',
        version: '1.0.0'
      },
      endpoints: API_ENDPOINTS
    }
    
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'meta-ads-api-collection.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const categories = [...new Set(API_ENDPOINTS.map(ep => ep.category))]

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Playground</h1>
          <p className="text-muted-foreground mt-1">
            Test and explore the Meta Ads Dashboard API endpoints interactively
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCollection}>
            <Download className="h-4 w-4 mr-2" />
            Export Collection
          </Button>
          <Button variant="outline" asChild>
            <a href="/docs/api" target="_blank">
              <BookOpen className="h-4 w-4 mr-2" />
              API Docs
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Endpoint Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
            <CardDescription>
              Choose an endpoint to test
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {categories.map(category => (
                  <div key={category}>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      {category}
                    </h4>
                    <div className="space-y-1 mb-4">
                      {API_ENDPOINTS.filter(ep => ep.category === category).map(endpoint => (
                        <Button
                          key={endpoint.id}
                          variant={selectedEndpoint?.id === endpoint.id ? "default" : "ghost"}
                          className="w-full justify-start text-left p-3 h-auto"
                          onClick={() => setSelectedEndpoint(endpoint)}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <Badge variant={
                              endpoint.method === 'GET' ? 'secondary' : 
                              endpoint.method === 'POST' ? 'default' : 'outline'
                            }>
                              {endpoint.method}
                            </Badge>
                            <div className="text-left flex-1">
                              <div className="font-medium text-sm">{endpoint.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {endpoint.path}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Request Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant={
                    selectedEndpoint?.method === 'GET' ? 'secondary' : 
                    selectedEndpoint?.method === 'POST' ? 'default' : 'outline'
                  }>
                    {selectedEndpoint?.method}
                  </Badge>
                  {selectedEndpoint?.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  {selectedEndpoint?.path}
                </CardDescription>
              </div>
              <Button 
                onClick={handleSendRequest} 
                disabled={loading}
                className="min-w-[100px]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="request" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="request">Request</TabsTrigger>
                <TabsTrigger value="params">Parameters</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
              </TabsList>

              <TabsContent value="request" className="space-y-4">
                <div className="space-y-4">
                  <Alert>
                    <Code2 className="h-4 w-4" />
                    <AlertDescription>
                      {selectedEndpoint?.description}
                    </AlertDescription>
                  </Alert>

                  {/* Headers */}
                  <div>
                    <Label className="text-base font-medium">Headers</Label>
                    <div className="space-y-2 mt-2">
                      {Object.entries(headers).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Header name"
                            value={key}
                            onChange={(e) => {
                              const newHeaders = { ...headers }
                              delete newHeaders[key]
                              newHeaders[e.target.value] = value
                              setHeaders(newHeaders)
                            }}
                          />
                          <Input
                            placeholder="Header value"
                            value={value}
                            onChange={(e) => {
                              setHeaders({ ...headers, [key]: e.target.value })
                            }}
                          />
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHeaders({ ...headers, '': '' })}
                      >
                        Add Header
                      </Button>
                    </div>
                  </div>

                  {/* Request Body */}
                  {selectedEndpoint?.method === 'POST' && (
                    <div>
                      <Label className="text-base font-medium">Request Body</Label>
                      <Textarea
                        className="mt-2 font-mono text-sm min-h-[200px]"
                        placeholder="Enter JSON request body..."
                        value={requestData}
                        onChange={(e) => setRequestData(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="params" className="space-y-4">
                {/* Query Parameters */}
                {selectedEndpoint?.parameters?.filter(p => p.location === 'query').length > 0 && (
                  <div>
                    <Label className="text-base font-medium">Query Parameters</Label>
                    <div className="space-y-3 mt-2">
                      {selectedEndpoint.parameters
                        .filter(p => p.location === 'query')
                        .map(param => (
                          <div key={param.name} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-medium">{param.name}</Label>
                              {param.required && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                            </div>
                            <Input
                              placeholder={param.description}
                              value={queryParams[param.name] || ''}
                              onChange={(e) => setQueryParams({
                                ...queryParams,
                                [param.name]: e.target.value
                              })}
                            />
                            <p className="text-xs text-muted-foreground">{param.description}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Security Requirements */}
                {selectedEndpoint?.security && (
                  <div>
                    <Label className="text-base font-medium">Authentication</Label>
                    <div className="mt-2 space-y-2">
                      {selectedEndpoint.security.map(scheme => (
                        <Alert key={scheme}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            This endpoint requires <strong>{scheme}</strong> authentication.
                            {scheme === 'MetaAccessToken' && (
                              <span> Add your Meta API access token to the Authorization header.</span>
                            )}
                            {scheme === 'ClaudeAPI' && (
                              <span> Add your Claude API key to the X-Claude-API-Key header.</span>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="examples" className="space-y-4">
                <div className="space-y-3">
                  {selectedEndpoint?.examples.map((example, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm">{example.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {example.description}
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadExample(example)}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Load
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(example.request, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="response" className="space-y-4">
                {response ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          response.status >= 200 && response.status < 300 ? 'default' : 'destructive'
                        }>
                          {response.status} {response.statusText}
                        </Badge>
                        {response.status >= 200 && response.status < 300 && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(response.data, null, 2))}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-sm font-medium">Response Headers</Label>
                      <pre className="text-xs bg-muted p-3 rounded mt-2 overflow-auto">
                        {JSON.stringify(response.headers, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Response Body</Label>
                      <ScrollArea className="h-[300px] mt-2">
                        <pre 
                          ref={responseRef}
                          className="text-xs bg-muted p-3 rounded overflow-auto whitespace-pre-wrap"
                        >
                          {JSON.stringify(response.data, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Send a request to see the response here</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}