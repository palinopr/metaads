'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle2, XCircle, AlertCircle, Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TestResult {
  step: string
  status: 'success' | 'error' | 'warning'
  message: string
  timing: number
  data?: any
  error?: any
}

interface TestReport {
  timestamp: string
  totalTime: number
  accessTokenValid: boolean
  adAccountValid: boolean
  results: TestResult[]
  summary: {
    totalCampaigns: number
    totalAdSets: number
    totalSpend: number
    campaignsWithData: number
    campaignsWithoutData: number
    errors: string[]
    warnings: string[]
  }
}

export default function TestMetaCompletePage() {
  const [accessToken, setAccessToken] = useState('')
  const [adAccountId, setAdAccountId] = useState('')
  const [datePreset, setDatePreset] = useState('last_30d')
  const [isLoading, setIsLoading] = useState(false)
  const [testReport, setTestReport] = useState<TestReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runTest = async () => {
    if (!accessToken || !adAccountId) {
      setError('Please provide both access token and ad account ID')
      return
    }

    setIsLoading(true)
    setError(null)
    setTestReport(null)

    try {
      const response = await fetch('/api/test-meta-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          adAccountId,
          datePreset,
        }),
      })

      const data = await response.json()

      if (data.success && data.report) {
        setTestReport(data.report)
      } else {
        setError(data.error || 'Test failed')
        if (data.report) {
          setTestReport(data.report)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run test')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="border-green-500 text-green-500">Success</Badge>
      case 'error':
        return <Badge variant="outline" className="border-red-500 text-red-500">Error</Badge>
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Warning</Badge>
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Meta Ads Integration Test</CardTitle>
          <CardDescription>
            Run a comprehensive test of the Meta Ads integration to validate data flow and identify issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Enter your Meta access token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adAccountId">Ad Account ID</Label>
              <Input
                id="adAccountId"
                placeholder="act_123456789"
                value={adAccountId}
                onChange={(e) => setAdAccountId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="datePreset">Date Range</Label>
              <Select value={datePreset} onValueChange={setDatePreset}>
                <SelectTrigger id="datePreset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last_7d">Last 7 Days</SelectItem>
                  <SelectItem value="last_30d">Last 30 Days</SelectItem>
                  <SelectItem value="last_90d">Last 90 Days</SelectItem>
                  <SelectItem value="maximum">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={runTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Complete Test
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {testReport && (
            <div className="space-y-4 mt-6">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Time</p>
                      <p className="text-2xl font-bold">{testReport.totalTime}ms</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Campaigns</p>
                      <p className="text-2xl font-bold">{testReport.summary.totalCampaigns}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ad Sets</p>
                      <p className="text-2xl font-bold">{testReport.summary.totalAdSets}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spend</p>
                      <p className="text-2xl font-bold">${testReport.summary.totalSpend.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Campaigns with Data</p>
                      <p className="text-lg font-semibold text-green-600">
                        {testReport.summary.campaignsWithData}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Campaigns without Data</p>
                      <p className="text-lg font-semibold text-yellow-600">
                        {testReport.summary.campaignsWithoutData}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-4">
                    <Badge variant="outline">
                      Token: {testReport.accessTokenValid ? 'Valid' : 'Invalid'}
                    </Badge>
                    <Badge variant="outline">
                      Account: {testReport.adAccountValid ? 'Valid' : 'Invalid'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Test Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {testReport.results.map((result, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(result.status)}
                              <span className="font-medium">{result.step}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(result.status)}
                              <span className="text-sm text-muted-foreground">
                                {result.timing}ms
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{result.message}</p>
                          {result.data && (
                            <details className="mt-2">
                              <summary className="text-sm cursor-pointer text-blue-600">
                                View Details
                              </summary>
                              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Errors and Warnings */}
              {(testReport.summary.errors.length > 0 || testReport.summary.warnings.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Issues Found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {testReport.summary.errors.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-red-600 mb-2">Errors</h4>
                        <ul className="space-y-1">
                          {testReport.summary.errors.map((error, index) => (
                            <li key={index} className="text-sm text-red-600">
                              • {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {testReport.summary.warnings.length > 0 && (
                      <div>
                        <h4 className="font-medium text-yellow-600 mb-2">Warnings</h4>
                        <ul className="space-y-1">
                          {testReport.summary.warnings.map((warning, index) => (
                            <li key={index} className="text-sm text-yellow-600">
                              • {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}