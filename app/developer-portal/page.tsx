"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { APIPlayground } from '@/components/api-playground'
import { 
  BookOpen, 
  Code2, 
  Download, 
  ExternalLink, 
  Key, 
  Zap, 
  Shield, 
  Cpu, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Copy,
  Github,
  FileText,
  Play,
  Rocket,
  Database,
  BarChart3
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface APIMetrics {
  totalRequests: number
  successRate: number
  avgResponseTime: number
  endpoints: {
    [key: string]: {
      requests: number
      successRate: number
      avgResponseTime: number
    }
  }
  rateLimits: {
    hourly: number
    daily: number
    current: number
  }
}

interface DocumentationSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  category: string
}

const DOCUMENTATION_SECTIONS: DocumentationSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Quick start guide and basic API usage',
    icon: <Rocket className="h-5 w-5" />,
    href: '/docs/getting-started',
    category: 'Basics'
  },
  {
    id: 'authentication',
    title: 'Authentication',
    description: 'API keys, OAuth, and security best practices',
    icon: <Shield className="h-5 w-5" />,
    href: '/docs/authentication',
    category: 'Basics'
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    description: 'Complete endpoint documentation and schemas',
    icon: <BookOpen className="h-5 w-5" />,
    href: '/docs/api-reference',
    category: 'Reference'
  },
  {
    id: 'meta-api',
    title: 'Meta API Integration',
    description: 'Working with Meta advertising data',
    icon: <Database className="h-5 w-5" />,
    href: '/docs/meta-api',
    category: 'Integration'
  },
  {
    id: 'ai-insights',
    title: 'AI & Analytics',
    description: 'Leveraging AI-powered insights and predictions',
    icon: <Cpu className="h-5 w-5" />,
    href: '/docs/ai-insights',
    category: 'Features'
  },
  {
    id: 'real-time',
    title: 'Real-time Features',
    description: 'WebSocket connections and live data streaming',
    icon: <Zap className="h-5 w-5" />,
    href: '/docs/real-time',
    category: 'Features'
  },
  {
    id: 'analytics',
    title: 'Analytics & Reporting',
    description: 'Campaign analytics and demographic insights',
    icon: <BarChart3 className="h-5 w-5" />,
    href: '/docs/analytics',
    category: 'Features'
  },
  {
    id: 'sdks',
    title: 'SDKs & Libraries',
    description: 'Official client libraries and code examples',
    icon: <Code2 className="h-5 w-5" />,
    href: '/docs/sdks',
    category: 'Tools'
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    description: 'Event-driven integrations and notifications',
    icon: <ExternalLink className="h-5 w-5" />,
    href: '/docs/webhooks',
    category: 'Integration'
  },
  {
    id: 'errors',
    title: 'Error Handling',
    description: 'Error codes, troubleshooting, and best practices',
    icon: <AlertTriangle className="h-5 w-5" />,
    href: '/docs/errors',
    category: 'Reference'
  }
]

const SDK_EXAMPLES = {
  javascript: `import { MetaAdsClient } from '@metaads/api-client';

const client = new MetaAdsClient({
  baseUrl: 'https://api.metaads.com',
  metaToken: 'YOUR_META_TOKEN',
  claudeKey: 'YOUR_CLAUDE_KEY'
});

// Get campaigns
const campaigns = await client.getCampaigns('act_123456789');

// Get AI insights
const insights = await client.getOptimizationRecommendations(campaigns);
console.log('Recommendations:', insights.data.recommendations);`,

  python: `from metaads import MetaAdsClient

client = MetaAdsClient(
    base_url='https://api.metaads.com',
    meta_token='YOUR_META_TOKEN',
    claude_api_key='YOUR_CLAUDE_KEY'
)

# Get campaigns
campaigns = client.get_campaigns('act_123456789')

# Get AI insights
insights = client.get_optimization_recommendations(campaigns)
print('Recommendations:', insights['data']['recommendations'])`,

  curl: `# Test API connection
curl -X POST https://api.metaads.com/api/meta \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "test_connection",
    "adAccountId": "act_YOUR_ACCOUNT_ID",
    "accessToken": "YOUR_META_TOKEN"
  }'

# Get campaigns overview
curl -X POST https://api.metaads.com/api/meta \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "overview",
    "adAccountId": "act_YOUR_ACCOUNT_ID",
    "accessToken": "YOUR_META_TOKEN",
    "datePreset": "last_30d"
  }'`
}

export default function DeveloperPortal() {
  const [apiMetrics, setApiMetrics] = useState<APIMetrics | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<keyof typeof SDK_EXAMPLES>('javascript')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Simulate fetching API metrics
    const fetchMetrics = async () => {
      try {
        // In real implementation, this would be an actual API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setApiMetrics({
          totalRequests: 1247563,
          successRate: 99.8,
          avgResponseTime: 245,
          endpoints: {
            '/api/meta': { requests: 856432, successRate: 99.9, avgResponseTime: 189 },
            '/api/ai-insights': { requests: 234567, successRate: 99.5, avgResponseTime: 1250 },
            '/api/realtime': { requests: 89012, successRate: 99.9, avgResponseTime: 45 },
            '/api/demographics': { requests: 67552, successRate: 99.7, avgResponseTime: 312 }
          },
          rateLimits: {
            hourly: 1000,
            daily: 10000,
            current: 127
          }
        })
      } catch (error) {
        console.error('Failed to fetch metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to Clipboard",
      description: "Code example has been copied to your clipboard",
    })
  }

  const categories = [...new Set(DOCUMENTATION_SECTIONS.map(section => section.category))]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/10">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Developer Portal</h1>
              <p className="text-xl text-muted-foreground">
                Build powerful advertising analytics applications with the Meta Ads Dashboard API
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <a href="https://github.com/metaads/dashboard" target="_blank">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </a>
              </Button>
              <Button asChild>
                <a href="/docs/getting-started">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Get Started
                </a>
              </Button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Active Developers</span>
                </div>
                <p className="text-2xl font-bold mt-1">2,847</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">API Calls (24h)</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {loading ? '...' : apiMetrics?.totalRequests.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Avg Response</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {loading ? '...' : `${apiMetrics?.avgResponseTime}ms`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Uptime</span>
                </div>
                <p className="text-2xl font-bold mt-1">99.9%</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
            <TabsTrigger value="playground">API Playground</TabsTrigger>
            <TabsTrigger value="examples">Code Examples</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* API Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Key Features
                  </CardTitle>
                  <CardDescription>
                    What you can build with our API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      <div>
                        <h4 className="font-medium">Real-time Campaign Monitoring</h4>
                        <p className="text-sm text-muted-foreground">
                          Monitor campaign performance with live updates and alerts
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                      <div>
                        <h4 className="font-medium">AI-Powered Insights</h4>
                        <p className="text-sm text-muted-foreground">
                          Get optimization recommendations and performance predictions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                      <div>
                        <h4 className="font-medium">Demographic Analytics</h4>
                        <p className="text-sm text-muted-foreground">
                          Analyze audience segments and targeting performance
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                      <div>
                        <h4 className="font-medium">Multi-Account Management</h4>
                        <p className="text-sm text-muted-foreground">
                          Manage multiple Meta ad accounts from a single interface
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Getting Started
                  </CardTitle>
                  <CardDescription>
                    Start building in minutes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">1</Badge>
                      <span className="text-sm">Get your Meta API access token</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">2</Badge>
                      <span className="text-sm">Test your connection with our API</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">3</Badge>
                      <span className="text-sm">Start fetching campaign data</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">4</Badge>
                      <span className="text-sm">Add AI insights to your app</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex gap-2">
                    <Button size="sm" asChild>
                      <a href="/docs/getting-started">
                        <Play className="h-3 w-3 mr-1" />
                        Quick Start
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href="/playground">
                        <Code2 className="h-3 w-3 mr-1" />
                        Try API
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rate Limits & Performance */}
            {apiMetrics && (
              <Card>
                <CardHeader>
                  <CardTitle>API Performance & Limits</CardTitle>
                  <CardDescription>
                    Current API performance metrics and rate limits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-500">
                        {apiMetrics.successRate}%
                      </p>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">
                        {apiMetrics.avgResponseTime}ms
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">
                        {apiMetrics.rateLimits.current}/{apiMetrics.rateLimits.hourly}
                      </p>
                      <p className="text-sm text-muted-foreground">Hourly Rate Limit</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">
                        {apiMetrics.totalRequests.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Requests (24h)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {categories.map(category => (
                <div key={category}>
                  <h3 className="font-semibold text-lg mb-4">{category}</h3>
                  <div className="space-y-3">
                    {DOCUMENTATION_SECTIONS
                      .filter(section => section.category === category)
                      .map(section => (
                        <Card key={section.id} className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <a href={section.href} className="block">
                              <div className="flex items-start gap-3">
                                <div className="text-primary mt-1">
                                  {section.icon}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium mb-1">{section.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {section.description}
                                  </p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </a>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="playground">
            <APIPlayground />
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Code Examples</CardTitle>
                <CardDescription>
                  Get started quickly with these code examples
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {Object.keys(SDK_EXAMPLES).map(lang => (
                      <Button
                        key={lang}
                        variant={selectedLanguage === lang ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedLanguage(lang as keyof typeof SDK_EXAMPLES)}
                      >
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(SDK_EXAMPLES[selectedLanguage])}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <ScrollArea className="h-[400px]">
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                        <code>{SDK_EXAMPLES[selectedLanguage]}</code>
                      </pre>
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SDK Downloads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5" />
                    JavaScript/TypeScript SDK
                  </CardTitle>
                  <CardDescription>
                    Official Node.js client library
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-3 rounded font-mono text-sm">
                    npm install @metaads/api-client
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" asChild>
                      <a href="/docs/sdks/javascript">
                        <BookOpen className="h-3 w-3 mr-1" />
                        Documentation
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href="https://github.com/metaads/js-client" target="_blank">
                        <Github className="h-3 w-3 mr-1" />
                        GitHub
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5" />
                    Python SDK
                  </CardTitle>
                  <CardDescription>
                    Official Python client library
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-3 rounded font-mono text-sm">
                    pip install metaads-api-client
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" asChild>
                      <a href="/docs/sdks/python">
                        <BookOpen className="h-3 w-3 mr-1" />
                        Documentation
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href="https://github.com/metaads/python-client" target="_blank">
                        <Github className="h-3 w-3 mr-1" />
                        GitHub
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {apiMetrics && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Endpoint Performance</CardTitle>
                    <CardDescription>
                      Performance metrics for individual API endpoints
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(apiMetrics.endpoints).map(([endpoint, metrics]) => (
                        <div key={endpoint} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-mono text-sm">{endpoint}</p>
                            <p className="text-xs text-muted-foreground">
                              {metrics.requests.toLocaleString()} requests
                            </p>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <div className="text-center">
                              <p className="font-medium text-green-500">
                                {metrics.successRate}%
                              </p>
                              <p className="text-xs text-muted-foreground">Success</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">
                                {metrics.avgResponseTime}ms
                              </p>
                              <p className="text-xs text-muted-foreground">Response</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rate Limits</CardTitle>
                      <CardDescription>
                        Current usage and limits
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          You are currently using {apiMetrics.rateLimits.current} of your {apiMetrics.rateLimits.hourly} hourly requests.
                        </AlertDescription>
                      </Alert>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Hourly Limit</span>
                          <span>{apiMetrics.rateLimits.current}/{apiMetrics.rateLimits.hourly}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(apiMetrics.rateLimits.current / apiMetrics.rateLimits.hourly) * 100}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>API Status</CardTitle>
                      <CardDescription>
                        System health and status
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">All systems operational</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>API Server</span>
                          <Badge variant="default">Healthy</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Database</span>
                          <Badge variant="default">Healthy</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Real-time Services</span>
                          <Badge variant="default">Healthy</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>AI Services</span>
                          <Badge variant="default">Healthy</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}