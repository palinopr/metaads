'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMetricUpdates } from '@/hooks/use-websocket'
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Zap,
  Clock,
  Users,
  Eye,
  MousePointer,
  DollarSign,
  Play,
  Pause,
  Award,
  AlertCircle
} from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Bar, BarChart } from 'recharts'
import { cn } from '@/lib/utils'

interface ABTestVariant {
  id: string
  name: string
  adId: string
  adSetId: string
  campaignId: string
  isControl: boolean
  metrics: {
    impressions: number
    clicks: number
    conversions: number
    spend: number
    ctr: number
    cpc: number
    cpa: number
    roas: number
  }
  trafficAllocation: number // percentage
  status: 'active' | 'paused' | 'stopped'
}

interface ABTest {
  id: string
  name: string
  description: string
  campaignId: string
  campaignName: string
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed'
  startDate: Date
  endDate?: Date
  duration: number // in days
  hypothesis: string
  primaryMetric: 'ctr' | 'cpc' | 'cpa' | 'roas' | 'conversions'
  secondaryMetrics: string[]
  variants: ABTestVariant[]
  statisticalSignificance: {
    confidence: number
    power: number
    minDetectableEffect: number
    currentPValue?: number
    isSignificant: boolean
    winningVariant?: string
    requiredSampleSize: number
    currentSampleSize: number
  }
  realTimeData: {
    lastUpdate: Date
    liveMetrics: Record<string, number>
    hourlyTrends: Array<{
      time: string
      [key: string]: any
    }>
  }
  alerts: ABTestAlert[]
}

interface ABTestAlert {
  id: string
  type: 'significance' | 'performance' | 'sample_size' | 'duration' | 'budget'
  severity: 'info' | 'warning' | 'critical'
  message: string
  timestamp: Date
  acknowledged: boolean
}

export function LiveABTestMonitor() {
  const [tests, setTests] = useState<Map<string, ABTest>>(new Map())
  const [selectedTest, setSelectedTest] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Subscribe to A/B test updates
  useMetricUpdates('ab_test', useCallback((data: any) => {
    updateABTestData(data)
  }, []))

  const updateABTestData = (data: any) => {
    setTests(prev => {
      const updated = new Map(prev)
      const existing = updated.get(data.testId) || createDefaultABTest(data.testId, data.name)
      
      // Update metrics and calculations
      const updatedTest: ABTest = {
        ...existing,
        ...data,
        realTimeData: {
          ...existing.realTimeData,
          lastUpdate: new Date(),
          liveMetrics: data.metrics || existing.realTimeData.liveMetrics
        }
      }
      
      // Recalculate statistical significance
      updatedTest.statisticalSignificance = calculateStatisticalSignificance(updatedTest)
      
      // Generate alerts
      updatedTest.alerts = generateABTestAlerts(updatedTest)
      
      updated.set(data.testId, updatedTest)
      return updated
    })
  }

  const createDefaultABTest = (testId: string, name: string): ABTest => ({
    id: testId,
    name,
    description: '',
    campaignId: '',
    campaignName: '',
    status: 'draft',
    startDate: new Date(),
    duration: 14,
    hypothesis: '',
    primaryMetric: 'ctr',
    secondaryMetrics: ['cpc', 'cpa'],
    variants: [],
    statisticalSignificance: {
      confidence: 95,
      power: 80,
      minDetectableEffect: 5,
      isSignificant: false,
      requiredSampleSize: 1000,
      currentSampleSize: 0
    },
    realTimeData: {
      lastUpdate: new Date(),
      liveMetrics: {},
      hourlyTrends: []
    },
    alerts: []
  })

  const calculateStatisticalSignificance = (test: ABTest) => {
    if (test.variants.length < 2) {
      return test.statisticalSignificance
    }

    const control = test.variants.find(v => v.isControl)
    const treatment = test.variants.find(v => !v.isControl)
    
    if (!control || !treatment) {
      return test.statisticalSignificance
    }

    // Calculate conversion rates for CTR test
    const controlRate = control.metrics.clicks / Math.max(control.metrics.impressions, 1)
    const treatmentRate = treatment.metrics.clicks / Math.max(treatment.metrics.impressions, 1)
    
    // Simple Z-test calculation (simplified)
    const pooledRate = (control.metrics.clicks + treatment.metrics.clicks) / 
                       Math.max(control.metrics.impressions + treatment.metrics.impressions, 1)
    
    const standardError = Math.sqrt(
      pooledRate * (1 - pooledRate) * 
      (1 / Math.max(control.metrics.impressions, 1) + 1 / Math.max(treatment.metrics.impressions, 1))
    )
    
    const zScore = Math.abs(treatmentRate - controlRate) / Math.max(standardError, 0.001)
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)))
    
    const isSignificant = pValue < (1 - test.statisticalSignificance.confidence / 100)
    const winningVariant = treatmentRate > controlRate ? treatment.id : control.id
    
    const currentSampleSize = control.metrics.impressions + treatment.metrics.impressions
    
    return {
      ...test.statisticalSignificance,
      currentPValue: pValue,
      isSignificant,
      winningVariant: isSignificant ? winningVariant : undefined,
      currentSampleSize
    }
  }

  // Simplified normal CDF approximation
  const normalCDF = (x: number): number => {
    return 0.5 * (1 + erf(x / Math.sqrt(2)))
  }

  const erf = (x: number): number => {
    // Approximation of error function
    const a1 =  0.254829592
    const a2 = -0.284496736
    const a3 =  1.421413741
    const a4 = -1.453152027
    const a5 =  1.061405429
    const p  =  0.3275911

    const sign = x < 0 ? -1 : 1
    x = Math.abs(x)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return sign * y
  }

  const generateABTestAlerts = (test: ABTest): ABTestAlert[] => {
    const alerts: ABTestAlert[] = []
    
    // Significance alert
    if (test.statisticalSignificance.isSignificant && test.status === 'running') {
      alerts.push({
        id: `significance_${Date.now()}`,
        type: 'significance',
        severity: 'info',
        message: `Test has reached statistical significance! Winning variant: ${test.statisticalSignificance.winningVariant}`,
        timestamp: new Date(),
        acknowledged: false
      })
    }
    
    // Sample size alert
    const sampleProgress = (test.statisticalSignificance.currentSampleSize / test.statisticalSignificance.requiredSampleSize) * 100
    if (sampleProgress >= 100 && !test.statisticalSignificance.isSignificant) {
      alerts.push({
        id: `sample_size_${Date.now()}`,
        type: 'sample_size',
        severity: 'warning',
        message: 'Required sample size reached but no significant difference detected',
        timestamp: new Date(),
        acknowledged: false
      })
    }
    
    // Performance degradation alert
    if (test.variants.length >= 2) {
      const control = test.variants.find(v => v.isControl)
      const treatment = test.variants.find(v => !v.isControl)
      
      if (control && treatment) {
        const performanceDrop = ((control.metrics.ctr - treatment.metrics.ctr) / control.metrics.ctr) * 100
        if (performanceDrop > 20) {
          alerts.push({
            id: `performance_${Date.now()}`,
            type: 'performance',
            severity: 'critical',
            message: `Treatment variant showing ${performanceDrop.toFixed(1)}% performance drop`,
            timestamp: new Date(),
            acknowledged: false
          })
        }
      }
    }
    
    return alerts
  }

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`
  }

  const formatCurrency = (value: number): string => {
    return `$${value.toFixed(2)}`
  }

  const formatNumber = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toFixed(0)
  }

  const getSignificanceColor = (pValue?: number, confidence: number = 95): string => {
    if (!pValue) return 'text-gray-500'
    const threshold = (100 - confidence) / 100
    if (pValue < threshold) return 'text-green-500'
    if (pValue < threshold * 2) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getVariantPerformance = (variant: ABTestVariant, control: ABTestVariant) => {
    if (variant.isControl) return { change: 0, icon: <Target className="h-4 w-4" /> }
    
    const ctrlRate = control.metrics.ctr
    const varRate = variant.metrics.ctr
    const change = ctrlRate > 0 ? ((varRate - ctrlRate) / ctrlRate) * 100 : 0
    
    if (Math.abs(change) < 1) return { change, icon: <Target className="h-4 w-4 text-gray-500" /> }
    if (change > 0) return { change, icon: <TrendingUp className="h-4 w-4 text-green-500" /> }
    return { change, icon: <TrendingDown className="h-4 w-4 text-red-500" /> }
  }

  const currentTest = selectedTest ? tests.get(selectedTest) : null
  const runningTests = Array.from(tests.values()).filter(t => t.status === 'running')
  const significantTests = runningTests.filter(t => t.statisticalSignificance.isSignificant)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live A/B Test Monitor</h2>
          <p className="text-muted-foreground">Real-time A/B test monitoring with statistical analysis</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Target className="h-4 w-4 mr-2" />
          Create Test
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningTests.length}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Significant Results</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{significantTests.length}</div>
            <p className="text-xs text-muted-foreground">Tests with significance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sample Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(runningTests.reduce((sum, test) => sum + test.statisticalSignificance.currentSampleSize, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Across all tests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {runningTests.length > 0 
                ? (runningTests.reduce((sum, test) => sum + test.statisticalSignificance.confidence, 0) / runningTests.length).toFixed(0)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Statistical confidence</p>
          </CardContent>
        </Card>
      </div>

      {/* Tests List */}
      <Card>
        <CardHeader>
          <CardTitle>A/B Tests</CardTitle>
          <CardDescription>Click on a test to view detailed analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from(tests.values()).map(test => {
              const control = test.variants.find(v => v.isControl)
              const treatment = test.variants.find(v => !v.isControl)
              const sampleProgress = (test.statisticalSignificance.currentSampleSize / test.statisticalSignificance.requiredSampleSize) * 100

              return (
                <div
                  key={test.id}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-colors",
                    selectedTest === test.id ? "border-primary bg-secondary/50" : "hover:bg-secondary/25"
                  )}
                  onClick={() => setSelectedTest(test.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{test.name}</h3>
                        <Badge variant={test.status === 'running' ? 'default' : 'secondary'}>
                          {test.status}
                        </Badge>
                        {test.statisticalSignificance.isSignificant && (
                          <Badge variant="default" className="bg-green-500">
                            <Award className="h-3 w-3 mr-1" />
                            Significant
                          </Badge>
                        )}
                        {test.alerts.length > 0 && (
                          <Badge variant="destructive">
                            {test.alerts.length} alerts
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{test.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Primary Metric</p>
                          <p className="font-medium">{test.primaryMetric.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Variants</p>
                          <p className="font-medium">{test.variants.length}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Sample Size</p>
                          <p className="font-medium">{formatNumber(test.statisticalSignificance.currentSampleSize)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Confidence</p>
                          <p className={cn('font-medium', getSignificanceColor(test.statisticalSignificance.currentPValue, test.statisticalSignificance.confidence))}>
                            {test.statisticalSignificance.confidence}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{test.duration} days</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Sample Progress</span>
                          <span>{Math.min(100, sampleProgress).toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.min(100, sampleProgress)} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Test View */}
      {currentTest && (
        <>
          {/* Test Alerts */}
          {currentTest.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Alerts - {currentTest.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentTest.alerts.map(alert => (
                    <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{alert.type.replace('_', ' ').toUpperCase()}</AlertTitle>
                      <AlertDescription>
                        {alert.message} - {alert.timestamp.toLocaleTimeString()}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistical Analysis */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Statistical Significance</CardTitle>
                <CardDescription>Real-time statistical analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <Badge variant={currentTest.statisticalSignificance.isSignificant ? 'default' : 'secondary'}>
                      {currentTest.statisticalSignificance.isSignificant ? 'Significant' : 'Not Significant'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>P-Value:</span>
                    <span className={cn('font-medium', getSignificanceColor(currentTest.statisticalSignificance.currentPValue, currentTest.statisticalSignificance.confidence))}>
                      {currentTest.statisticalSignificance.currentPValue?.toFixed(4) || 'Calculating...'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Confidence Level:</span>
                    <span className="font-medium">{currentTest.statisticalSignificance.confidence}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Statistical Power:</span>
                    <span className="font-medium">{currentTest.statisticalSignificance.power}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Min Detectable Effect:</span>
                    <span className="font-medium">{currentTest.statisticalSignificance.minDetectableEffect}%</span>
                  </div>
                  
                  {currentTest.statisticalSignificance.winningVariant && (
                    <div className="flex items-center justify-between">
                      <span>Winning Variant:</span>
                      <Badge variant="default" className="bg-green-500">
                        {currentTest.variants.find(v => v.id === currentTest.statisticalSignificance.winningVariant)?.name || 'Unknown'}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sample Size Progress</CardTitle>
                <CardDescription>Current vs required sample size</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Current Sample:</span>
                    <span className="font-medium">{formatNumber(currentTest.statisticalSignificance.currentSampleSize)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Required Sample:</span>
                    <span className="font-medium">{formatNumber(currentTest.statisticalSignificance.requiredSampleSize)}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.min(100, (currentTest.statisticalSignificance.currentSampleSize / currentTest.statisticalSignificance.requiredSampleSize) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (currentTest.statisticalSignificance.currentSampleSize / currentTest.statisticalSignificance.requiredSampleSize) * 100)} 
                      className="h-3"
                    />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Estimated time to significance: {
                      currentTest.statisticalSignificance.isSignificant 
                        ? 'Already reached'
                        : 'Calculating...'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Variant Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Variant Performance Comparison</CardTitle>
              <CardDescription>Real-time metrics for each test variant</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="metrics">
                <TabsList>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  <TabsTrigger value="charts">Charts</TabsTrigger>
                </TabsList>
                
                <TabsContent value="metrics" className="space-y-4">
                  <div className="grid gap-4">
                    {currentTest.variants.map(variant => {
                      const control = currentTest.variants.find(v => v.isControl)!
                      const performance = getVariantPerformance(variant, control)
                      
                      return (
                        <Card key={variant.id} className={cn(
                          "relative",
                          variant.isControl && "border-blue-200 bg-blue-50/50",
                          currentTest.statisticalSignificance.winningVariant === variant.id && "border-green-200 bg-green-50/50"
                        )}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{variant.name}</CardTitle>
                              <div className="flex items-center space-x-2">
                                {variant.isControl && <Badge variant="outline">Control</Badge>}
                                {currentTest.statisticalSignificance.winningVariant === variant.id && (
                                  <Badge variant="default" className="bg-green-500">
                                    <Award className="h-3 w-3 mr-1" />
                                    Winner
                                  </Badge>
                                )}
                                <Badge variant={variant.status === 'active' ? 'default' : 'secondary'}>
                                  {variant.status}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-1">
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">Impressions</span>
                                </div>
                                <p className="text-lg font-semibold">{formatNumber(variant.metrics.impressions)}</p>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center space-x-1">
                                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">Clicks</span>
                                </div>
                                <p className="text-lg font-semibold">{formatNumber(variant.metrics.clicks)}</p>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center space-x-1">
                                  <Target className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">CTR</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <p className="text-lg font-semibold">{formatPercentage(variant.metrics.ctr)}</p>
                                  {!variant.isControl && (
                                    <div className="flex items-center space-x-1">
                                      {performance.icon}
                                      <span className={cn(
                                        'text-sm',
                                        performance.change > 0 ? 'text-green-500' : performance.change < 0 ? 'text-red-500' : 'text-gray-500'
                                      )}>
                                        {performance.change > 0 ? '+' : ''}{performance.change.toFixed(1)}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">CPC</span>
                                </div>
                                <p className="text-lg font-semibold">{formatCurrency(variant.metrics.cpc)}</p>
                              </div>
                            </div>
                            
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="space-y-1">
                                <span className="text-sm text-muted-foreground">Conversions</span>
                                <p className="font-semibold">{formatNumber(variant.metrics.conversions)}</p>
                              </div>
                              
                              <div className="space-y-1">
                                <span className="text-sm text-muted-foreground">Spend</span>
                                <p className="font-semibold">{formatCurrency(variant.metrics.spend)}</p>
                              </div>
                              
                              <div className="space-y-1">
                                <span className="text-sm text-muted-foreground">CPA</span>
                                <p className="font-semibold">{formatCurrency(variant.metrics.cpa)}</p>
                              </div>
                              
                              <div className="space-y-1">
                                <span className="text-sm text-muted-foreground">ROAS</span>
                                <p className="font-semibold">{variant.metrics.roas.toFixed(2)}x</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>
                
                <TabsContent value="charts" className="space-y-4">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={currentTest.variants.map(v => ({
                        name: v.name,
                        ctr: v.metrics.ctr * 100,
                        cpc: v.metrics.cpc,
                        conversions: v.metrics.conversions,
                        isControl: v.isControl
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="ctr" fill="#3b82f6" name="CTR %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}