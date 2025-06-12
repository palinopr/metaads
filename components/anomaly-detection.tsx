'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  AlertCircle, 
  Target,
  Activity,
  Brain,
  Zap,
  Eye,
  Search,
  Filter,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Bell,
  BellOff,
  Clock,
  Calendar,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart,
  Gauge,
  Sparkles,
  CheckCircle,
  XCircle,
  Info,
  ArrowUp,
  ArrowDown,
  Minus,
  Download,
  RefreshCw
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, Cell, BarChart, Bar, PieChart as RechartsPieChart, Legend } from 'recharts'

// Types
interface AnomalyData {
  timestamp: Date
  metric: string
  value: number
  expectedValue: number
  deviationScore: number
  anomalyType: 'spike' | 'drop' | 'trend_change' | 'seasonal_deviation' | 'outlier'
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  campaignId?: string
  campaignName?: string
  adsetId?: string
  adsetName?: string
}

interface DetectionModel {
  id: string
  name: string
  type: 'statistical' | 'machine_learning' | 'seasonal' | 'threshold'
  description: string
  isActive: boolean
  sensitivity: number // 0-100
  parameters: Record<string, any>
  metrics: string[]
  lastTraining?: Date
  accuracy?: number
  falsePositiveRate?: number
}

interface PatternInsight {
  id: string
  type: 'recurring_anomaly' | 'performance_correlation' | 'seasonal_pattern' | 'campaign_interference'
  title: string
  description: string
  confidence: number
  metrics: string[]
  timeframe: string
  actionable: boolean
  recommendation?: string
  impact: 'positive' | 'negative' | 'neutral'
}

interface HistoricalMetric {
  timestamp: Date
  impressions: number
  clicks: number
  conversions: number
  spend: number
  ctr: number
  cpm: number
  cpc: number
  roas: number
  quality_score: number
  frequency: number
}

interface AnomalyDetectionProps {
  accountId?: string
  campaignIds?: string[]
  timeRange?: '1h' | '6h' | '24h' | '7d' | '30d'
  onAnomalyDetected?: (anomaly: AnomalyData) => void
  onPatternDiscovered?: (pattern: PatternInsight) => void
}

// Statistical functions
class StatisticalDetector {
  static calculateZScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0
    return Math.abs((value - mean) / stdDev)
  }

  static detectOutliers(values: number[], threshold: number = 2.5): boolean[] {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)

    return values.map(value => this.calculateZScore(value, mean, stdDev) > threshold)
  }

  static calculateMovingAverage(values: number[], windowSize: number): number[] {
    const result: number[] = []
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - windowSize + 1)
      const window = values.slice(start, i + 1)
      const average = window.reduce((sum, val) => sum + val, 0) / window.length
      result.push(average)
    }
    return result
  }

  static detectTrendChange(values: number[], windowSize: number = 10): { changePoints: number[], trends: string[] } {
    const movingAvg = this.calculateMovingAverage(values, windowSize)
    const changePoints: number[] = []
    const trends: string[] = []

    for (let i = windowSize; i < movingAvg.length - windowSize; i++) {
      const beforeTrend = (movingAvg[i] - movingAvg[i - windowSize]) / windowSize
      const afterTrend = (movingAvg[i + windowSize] - movingAvg[i]) / windowSize
      
      if (Math.abs(beforeTrend - afterTrend) > 0.1) {
        changePoints.push(i)
        trends.push(afterTrend > beforeTrend ? 'upward' : 'downward')
      }
    }

    return { changePoints, trends }
  }
}

export default function AnomalyDetection({
  accountId,
  campaignIds,
  timeRange = '24h',
  onAnomalyDetected,
  onPatternDiscovered
}: AnomalyDetectionProps) {
  const [isActive, setIsActive] = useState(false)
  const [selectedTab, setSelectedTab] = useState('anomalies')
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([])
  const [patterns, setPatterns] = useState<PatternInsight[]>([])
  const [historicalData, setHistoricalData] = useState<HistoricalMetric[]>([])
  const [detectionModels, setDetectionModels] = useState<DetectionModel[]>([])
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['spend', 'conversions', 'ctr', 'roas'])
  const [sensitivityLevel, setSensitivityLevel] = useState(70)
  const [autoRetrain, setAutoRetrain] = useState(true)
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const detectionIntervalRef = useRef<NodeJS.Timeout>()
  const retrainingIntervalRef = useRef<NodeJS.Timeout>()

  // Initialize detection models
  const initializeModels = useCallback(() => {
    const models: DetectionModel[] = [
      {
        id: 'statistical-zscore',
        name: 'Statistical Z-Score',
        type: 'statistical',
        description: 'Detects anomalies using statistical z-score analysis',
        isActive: true,
        sensitivity: 75,
        parameters: { threshold: 2.5, windowSize: 20 },
        metrics: ['spend', 'conversions', 'ctr', 'roas'],
        accuracy: 85,
        falsePositiveRate: 12
      },
      {
        id: 'seasonal-arima',
        name: 'Seasonal ARIMA',
        type: 'seasonal',
        description: 'Detects seasonal anomalies and trend changes',
        isActive: true,
        sensitivity: 80,
        parameters: { seasonality: 24, trendWindow: 7 },
        metrics: ['impressions', 'clicks', 'spend'],
        accuracy: 78,
        falsePositiveRate: 15
      },
      {
        id: 'ml-isolation-forest',
        name: 'Isolation Forest',
        type: 'machine_learning',
        description: 'ML-based outlier detection using isolation forest',
        isActive: false,
        sensitivity: 85,
        parameters: { contamination: 0.1, nEstimators: 100 },
        metrics: ['all'],
        accuracy: 88,
        falsePositiveRate: 8
      },
      {
        id: 'threshold-based',
        name: 'Dynamic Thresholds',
        type: 'threshold',
        description: 'Adaptive threshold-based anomaly detection',
        isActive: true,
        sensitivity: 65,
        parameters: { adaptiveWindow: 14, thresholdMultiplier: 1.5 },
        metrics: ['cpm', 'cpc', 'frequency'],
        accuracy: 72,
        falsePositiveRate: 20
      }
    ]

    setDetectionModels(models)
  }, [])

  // Generate mock historical data
  const generateHistoricalData = useCallback((): HistoricalMetric[] => {
    const data: HistoricalMetric[] = []
    const now = new Date()
    const hoursBack = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720

    for (let i = hoursBack; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
      
      // Base values with some randomness
      const baseImpressions = 5000 + Math.random() * 2000
      const baseClicks = baseImpressions * (0.02 + Math.random() * 0.03)
      const baseConversions = baseClicks * (0.05 + Math.random() * 0.05)
      const baseSpend = baseImpressions * (0.05 + Math.random() * 0.03)
      
      // Add seasonal patterns
      const hourOfDay = timestamp.getHours()
      const dayOfWeek = timestamp.getDay()
      
      // Business hours boost
      const businessHoursMultiplier = (hourOfDay >= 9 && hourOfDay <= 17) ? 1.3 : 0.8
      
      // Weekend reduction 
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.0
      
      // Apply seasonal adjustments
      const seasonalMultiplier = businessHoursMultiplier * weekendMultiplier
      
      const impressions = Math.floor(baseImpressions * seasonalMultiplier)
      const clicks = Math.floor(baseClicks * seasonalMultiplier)
      const conversions = Math.floor(baseConversions * seasonalMultiplier)
      const spend = baseSpend * seasonalMultiplier
      
      // Add occasional anomalies
      let anomalyMultiplier = 1
      if (Math.random() < 0.05) { // 5% chance of anomaly
        anomalyMultiplier = Math.random() < 0.5 ? 0.3 : 2.5 // Drop or spike
      }

      data.push({
        timestamp,
        impressions: Math.floor(impressions * anomalyMultiplier),
        clicks: Math.floor(clicks * anomalyMultiplier),
        conversions: Math.floor(conversions * anomalyMultiplier),
        spend: spend * anomalyMultiplier,
        ctr: (clicks / impressions) * 100,
        cpm: (spend / impressions) * 1000,
        cpc: spend / clicks,
        roas: (conversions * 50) / spend, // Assuming $50 per conversion
        quality_score: 7 + Math.random() * 3,
        frequency: 1.5 + Math.random() * 1.5
      })
    }

    return data
  }, [timeRange])

  // Detect anomalies using statistical methods
  const detectAnomalies = useCallback((data: HistoricalMetric[], models: DetectionModel[]): AnomalyData[] => {
    const anomalies: AnomalyData[] = []
    const activeModels = models.filter(model => model.isActive)

    selectedMetrics.forEach(metric => {
      const values = data.map(d => d[metric as keyof HistoricalMetric] as number)
      
      activeModels.forEach(model => {
        if (!model.metrics.includes(metric) && !model.metrics.includes('all')) return

        switch (model.type) {
          case 'statistical':
            const outliers = StatisticalDetector.detectOutliers(values, model.parameters.threshold)
            outliers.forEach((isOutlier, index) => {
              if (isOutlier && index > 10) { // Skip initial values for context
                const currentValue = values[index]
                const recentValues = values.slice(Math.max(0, index - 10), index)
                const expectedValue = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length
                const deviationScore = Math.abs((currentValue - expectedValue) / expectedValue) * 100

                anomalies.push({
                  timestamp: data[index].timestamp,
                  metric,
                  value: currentValue,
                  expectedValue,
                  deviationScore,
                  anomalyType: currentValue > expectedValue ? 'spike' : 'drop',
                  severity: deviationScore > 50 ? 'critical' : deviationScore > 30 ? 'high' : deviationScore > 15 ? 'medium' : 'low',
                  confidence: Math.min(95, 60 + (deviationScore / 100) * 35),
                  campaignId: campaignIds?.[0],
                  campaignName: `Campaign ${campaignIds?.[0]}`
                })
              }
            })
            break

          case 'seasonal':
            const { changePoints } = StatisticalDetector.detectTrendChange(values, model.parameters.trendWindow)
            changePoints.forEach(point => {
              if (point < data.length - 1) {
                const currentValue = values[point]
                const expectedValue = values[point - 1]
                const deviationScore = Math.abs((currentValue - expectedValue) / expectedValue) * 100

                anomalies.push({
                  timestamp: data[point].timestamp,
                  metric,
                  value: currentValue,
                  expectedValue,
                  deviationScore,
                  anomalyType: 'trend_change',
                  severity: deviationScore > 25 ? 'high' : 'medium',
                  confidence: 75,
                  campaignId: campaignIds?.[0],
                  campaignName: `Campaign ${campaignIds?.[0]}`
                })
              }
            })
            break

          case 'threshold':
            const movingAvg = StatisticalDetector.calculateMovingAverage(values, model.parameters.adaptiveWindow)
            values.forEach((value, index) => {
              if (index >= model.parameters.adaptiveWindow) {
                const threshold = movingAvg[index] * model.parameters.thresholdMultiplier
                if (Math.abs(value - movingAvg[index]) > threshold) {
                  const deviationScore = (Math.abs(value - movingAvg[index]) / movingAvg[index]) * 100

                  anomalies.push({
                    timestamp: data[index].timestamp,
                    metric,
                    value,
                    expectedValue: movingAvg[index],
                    deviationScore,
                    anomalyType: 'outlier',
                    severity: deviationScore > 40 ? 'high' : 'medium',
                    confidence: 70,
                    campaignId: campaignIds?.[0],
                    campaignName: `Campaign ${campaignIds?.[0]}`
                  })
                }
              }
            })
            break
        }
      })
    })

    // Sort by severity and timestamp
    return anomalies.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
      if (severityDiff !== 0) return severityDiff
      return b.timestamp.getTime() - a.timestamp.getTime()
    })
  }, [selectedMetrics, campaignIds])

  // Generate pattern insights
  const generatePatterns = useCallback((anomalies: AnomalyData[], data: HistoricalMetric[]): PatternInsight[] => {
    const insights: PatternInsight[] = []

    // Recurring anomaly pattern
    const anomalyByHour = anomalies.reduce((acc, anomaly) => {
      const hour = anomaly.timestamp.getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const peakHour = Object.entries(anomalyByHour).sort(([,a], [,b]) => b - a)[0]
    if (peakHour && parseInt(peakHour[1] as string) > 2) {
      insights.push({
        id: 'recurring-hour',
        type: 'recurring_anomaly',
        title: `Recurring Anomalies at ${peakHour[0]}:00`,
        description: `${peakHour[1]} anomalies detected consistently around ${peakHour[0]}:00. This suggests a systematic issue or external factor.`,
        confidence: 85,
        metrics: [...new Set(anomalies.filter(a => a.timestamp.getHours() === parseInt(peakHour[0])).map(a => a.metric))],
        timeframe: 'Hourly pattern',
        actionable: true,
        recommendation: 'Review campaign scheduling and bid adjustments for this time period.',
        impact: 'negative'
      })
    }

    // Performance correlation
    const spendAnomalies = anomalies.filter(a => a.metric === 'spend')
    const conversionAnomalies = anomalies.filter(a => a.metric === 'conversions')
    
    if (spendAnomalies.length > 0 && conversionAnomalies.length > 0) {
      const correlatedAnomalies = spendAnomalies.filter(sa => 
        conversionAnomalies.some(ca => 
          Math.abs(ca.timestamp.getTime() - sa.timestamp.getTime()) < 60 * 60 * 1000 // Within 1 hour
        )
      )

      if (correlatedAnomalies.length > 1) {
        insights.push({
          id: 'spend-conversion-correlation',
          type: 'performance_correlation',
          title: 'Spend-Conversion Correlation Detected',
          description: `${correlatedAnomalies.length} instances where spend and conversion anomalies occurred simultaneously.`,
          confidence: 75,
          metrics: ['spend', 'conversions'],
          timeframe: 'Concurrent events',
          actionable: true,
          recommendation: 'Investigate budget allocation and conversion tracking during anomaly periods.',
          impact: 'negative'
        })
      }
    }

    // Seasonal pattern
    const weekendAnomalies = anomalies.filter(a => {
      const day = a.timestamp.getDay()
      return day === 0 || day === 6
    })

    if (weekendAnomalies.length > anomalies.length * 0.4) {
      insights.push({
        id: 'weekend-pattern',
        type: 'seasonal_pattern',
        title: 'Weekend Performance Pattern',
        description: `${Math.round((weekendAnomalies.length / anomalies.length) * 100)}% of anomalies occur on weekends.`,
        confidence: 80,
        metrics: [...new Set(weekendAnomalies.map(a => a.metric))],
        timeframe: 'Weekly pattern',
        actionable: true,
        recommendation: 'Consider separate bidding strategies for weekdays vs weekends.',
        impact: 'neutral'
      })
    }

    return insights
  }, [])

  // Main detection cycle
  const runDetection = useCallback(() => {
    const data = generateHistoricalData()
    setHistoricalData(data)

    const detectedAnomalies = detectAnomalies(data, detectionModels)
    const newAnomalies = detectedAnomalies.filter(anomaly => 
      !anomalies.some(existing => 
        existing.metric === anomaly.metric && 
        Math.abs(existing.timestamp.getTime() - anomaly.timestamp.getTime()) < 5 * 60 * 1000
      )
    )

    if (newAnomalies.length > 0) {
      setAnomalies(prev => [...newAnomalies, ...prev].slice(0, 100)) // Keep last 100
      newAnomalies.forEach(anomaly => onAnomalyDetected?.(anomaly))
    }

    const insights = generatePatterns([...newAnomalies, ...anomalies], data)
    const newInsights = insights.filter(insight => 
      !patterns.some(existing => existing.id === insight.id)
    )

    if (newInsights.length > 0) {
      setPatterns(prev => [...newInsights, ...prev])
      newInsights.forEach(pattern => onPatternDiscovered?.(pattern))
    }
  }, [detectionModels, generateHistoricalData, detectAnomalies, generatePatterns, anomalies, patterns, onAnomalyDetected, onPatternDiscovered])

  // Start/stop detection
  const toggleDetection = useCallback(() => {
    if (isActive) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
      if (retrainingIntervalRef.current) {
        clearInterval(retrainingIntervalRef.current)
      }
      setIsActive(false)
    } else {
      detectionIntervalRef.current = setInterval(runDetection, 30000) // Run every 30 seconds
      if (autoRetrain) {
        retrainingIntervalRef.current = setInterval(() => {
          // Retrain models (placeholder)
          console.log('Retraining models...')
        }, 60 * 60 * 1000) // Retrain every hour
      }
      setIsActive(true)
      runDetection() // Initial run
    }
  }, [isActive, runDetection, autoRetrain])

  // Initialize
  useEffect(() => {
    initializeModels()
  }, [initializeModels])

  // Cleanup
  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
      if (retrainingIntervalRef.current) {
        clearInterval(retrainingIntervalRef.current)
      }
    }
  }, [])

  // Filter anomalies
  const filteredAnomalies = useMemo(() => {
    let filtered = anomalies

    if (filterSeverity !== 'all') {
      filtered = filtered.filter(anomaly => anomaly.severity === filterSeverity)
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(anomaly => anomaly.anomalyType === filterType)
    }

    if (searchQuery) {
      filtered = filtered.filter(anomaly => 
        anomaly.metric.toLowerCase().includes(searchQuery.toLowerCase()) ||
        anomaly.anomalyType.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [anomalies, filterSeverity, filterType, searchQuery])

  // Chart data
  const chartData = useMemo(() => {
    return historicalData.map(data => ({
      timestamp: data.timestamp.toLocaleTimeString(),
      ...selectedMetrics.reduce((acc, metric) => {
        acc[metric] = data[metric as keyof HistoricalMetric] as number
        return acc
      }, {} as Record<string, number>)
    }))
  }, [historicalData, selectedMetrics])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAnomalyTypeIcon = (type: string) => {
    switch (type) {
      case 'spike': return <ArrowUp className="h-4 w-4" />
      case 'drop': return <ArrowDown className="h-4 w-4" />
      case 'trend_change': return <TrendingUp className="h-4 w-4" />
      case 'seasonal_deviation': return <Calendar className="h-4 w-4" />
      case 'outlier': return <Target className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Anomaly Detection</h2>
          <p className="text-muted-foreground">
            AI-powered detection of unusual patterns and performance anomalies
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-sm text-muted-foreground">
              {isActive ? 'Detection Active' : 'Detection Paused'}
            </span>
          </div>
          <Button
            variant={isActive ? "destructive" : "default"}
            size="sm"
            onClick={toggleDetection}
          >
            {isActive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{anomalies.filter(a => a.severity === 'critical' || a.severity === 'high').length}</div>
                <div className="text-sm text-muted-foreground">Critical/High Anomalies</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{detectionModels.filter(m => m.isActive).length}</div>
                <div className="text-sm text-muted-foreground">Active Models</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{patterns.length}</div>
                <div className="text-sm text-muted-foreground">Pattern Insights</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{Math.round(detectionModels.reduce((acc, m) => acc + (m.accuracy || 0), 0) / detectionModels.length)}%</div>
                <div className="text-sm text-muted-foreground">Avg Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="anomalies">Anomalies ({filteredAnomalies.length})</TabsTrigger>
          <TabsTrigger value="patterns">Patterns ({patterns.length})</TabsTrigger>
          <TabsTrigger value="models">Models ({detectionModels.length})</TabsTrigger>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
        </TabsList>

        <TabsContent value="anomalies" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="spike">Spike</SelectItem>
                <SelectItem value="drop">Drop</SelectItem>
                <SelectItem value="trend_change">Trend Change</SelectItem>
                <SelectItem value="seasonal_deviation">Seasonal</SelectItem>
                <SelectItem value="outlier">Outlier</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search anomalies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          {/* Anomalies List */}
          <div className="space-y-3">
            {filteredAnomalies.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                  <h3 className="text-lg font-medium">No Anomalies Detected</h3>
                  <p className="text-muted-foreground">All metrics are within expected ranges</p>
                </CardContent>
              </Card>
            ) : (
              filteredAnomalies.map((anomaly, index) => (
                <Card key={index} className={`border-l-4 ${anomaly.severity === 'critical' ? 'border-l-red-500' : anomaly.severity === 'high' ? 'border-l-orange-500' : anomaly.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getAnomalyTypeIcon(anomaly.anomalyType)}
                          <h3 className="font-medium capitalize">{anomaly.anomalyType.replace('_', ' ')} in {anomaly.metric.toUpperCase()}</h3>
                          <Badge className={getSeverityColor(anomaly.severity)}>
                            {anomaly.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {Math.round(anomaly.confidence)}% confidence
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-2">
                          <div>
                            <span className="text-muted-foreground">Current Value:</span>
                            <div className="font-medium">{anomaly.value.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Expected Value:</span>
                            <div className="font-medium">{anomaly.expectedValue.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Deviation:</span>
                            <div className="font-medium">{anomaly.deviationScore.toFixed(1)}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Time:</span>
                            <div className="font-medium">{anomaly.timestamp.toLocaleString()}</div>
                          </div>
                        </div>
                        
                        {anomaly.campaignName && (
                          <div className="text-xs text-muted-foreground">
                            Campaign: {anomaly.campaignName}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <Progress 
                          value={Math.min(anomaly.deviationScore, 100)} 
                          className="w-20 h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="space-y-3">
            {patterns.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Info className="h-12 w-12 mx-auto text-blue-500 mb-2" />
                  <h3 className="text-lg font-medium">No Patterns Detected</h3>
                  <p className="text-muted-foreground">Continue monitoring to discover performance patterns</p>
                </CardContent>
              </Card>
            ) : (
              patterns.map((pattern) => (
                <Card key={pattern.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-5 w-5 text-blue-500" />
                          <h3 className="font-medium">{pattern.title}</h3>
                          <Badge variant="outline">
                            {Math.round(pattern.confidence)}% confidence
                          </Badge>
                          {pattern.actionable && (
                            <Badge className="bg-green-100 text-green-800">
                              Actionable
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {pattern.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <span>Type: {pattern.type.replace('_', ' ')}</span>
                          <span>Timeframe: {pattern.timeframe}</span>
                          <span>Metrics: {pattern.metrics.join(', ')}</span>
                        </div>
                        
                        {pattern.recommendation && (
                          <div className="bg-blue-50 p-3 rounded-lg mt-2">
                            <div className="text-sm font-medium text-blue-900 mb-1">Recommendation:</div>
                            <div className="text-sm text-blue-800">{pattern.recommendation}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="space-y-3">
            {detectionModels.map((model) => (
              <Card key={model.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-5 w-5 text-purple-500" />
                        <h3 className="font-medium">{model.name}</h3>
                        <Badge variant="outline" className={model.type === 'machine_learning' ? 'text-purple-600' : model.type === 'statistical' ? 'text-blue-600' : model.type === 'seasonal' ? 'text-green-600' : 'text-orange-600'}>
                          {model.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {!model.isActive && (
                          <Badge variant="outline" className="text-gray-500">
                            INACTIVE
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {model.description}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Sensitivity:</span>
                          <div className="font-medium">{model.sensitivity}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Accuracy:</span>
                          <div className="font-medium">{model.accuracy}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">False Positive Rate:</span>
                          <div className="font-medium">{model.falsePositiveRate}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Metrics:</span>
                          <div className="font-medium">{model.metrics.join(', ')}</div>
                        </div>
                      </div>
                      
                      {model.lastTraining && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Last trained: {model.lastTraining.toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={model.isActive}
                        onCheckedChange={(checked) => {
                          setDetectionModels(prev => prev.map(m => 
                            m.id === model.id ? { ...m, isActive: checked } : m
                          ))
                        }}
                      />
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="visualization" className="space-y-4">
          {/* Metric Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Visualization Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['spend', 'impressions', 'clicks', 'conversions', 'ctr', 'cpm', 'cpc', 'roas'].map((metric) => (
                  <div key={metric} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={metric}
                      checked={selectedMetrics.includes(metric)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMetrics(prev => [...prev, metric])
                        } else {
                          setSelectedMetrics(prev => prev.filter(m => m !== metric))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={metric} className="text-sm capitalize">
                      {metric}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Series Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Metric Timeline with Anomalies</CardTitle>
              <CardDescription>
                Historical performance data with detected anomalies highlighted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    {selectedMetrics.map((metric, index) => (
                      <Line
                        key={metric}
                        type="monotone"
                        dataKey={metric}
                        stroke={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Anomaly Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Anomaly Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['critical', 'high', 'medium', 'low'].map((severity) => {
                    const count = anomalies.filter(a => a.severity === severity).length
                    const percentage = anomalies.length > 0 ? (count / anomalies.length) * 100 : 0
                    
                    return (
                      <div key={severity} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${severity === 'critical' ? 'bg-red-500' : severity === 'high' ? 'bg-orange-500' : severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                          <span className="capitalize">{severity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="w-20 h-2" />
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Anomaly Type Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['spike', 'drop', 'trend_change', 'outlier', 'seasonal_deviation'].map((type) => {
                    const count = anomalies.filter(a => a.anomalyType === type).length
                    const percentage = anomalies.length > 0 ? (count / anomalies.length) * 100 : 0
                    
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getAnomalyTypeIcon(type)}
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="w-20 h-2" />
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}