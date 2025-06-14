'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  AlertTriangle, TrendingDown, TrendingUp, Activity,
  Zap, Eye, Clock, RefreshCw, CheckCircle, XCircle
} from "lucide-react"
import { formatCurrency, formatPercentage } from "@/lib/utils"

interface MetricAnomaly {
  id: string
  timestamp: Date
  campaignId: string
  campaignName: string
  metric: string
  currentValue: number
  expectedValue: number
  deviation: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'spike' | 'drop' | 'trend_change' | 'unusual_pattern'
  detected: boolean
  resolved: boolean
  suggestedActions: string[]
  probableCauses: string[]
}

interface PerformanceAnomalyDetectorProps {
  campaigns: any[]
  historicalData?: any[]
  onAnomalyDetected?: (anomaly: MetricAnomaly) => void
}

export function PerformanceAnomalyDetector({ 
  campaigns, 
  historicalData,
  onAnomalyDetected 
}: PerformanceAnomalyDetectorProps) {
  const [anomalies, setAnomalies] = useState<MetricAnomaly[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [autoScan, setAutoScan] = useState(true)
  const [lastScan, setLastScan] = useState<Date | null>(null)

  // Auto-scan every 5 minutes if enabled
  useEffect(() => {
    if (autoScan) {
      scanForAnomalies()
      const interval = setInterval(scanForAnomalies, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [autoScan, campaigns])

  const scanForAnomalies = async () => {
    setIsScanning(true)
    const detectedAnomalies: MetricAnomaly[] = []

    try {
      // Check each campaign for anomalies
      for (const campaign of campaigns) {
        // ROAS Anomaly Detection
        const roasAnomaly = detectROASAnomaly(campaign)
        if (roasAnomaly) detectedAnomalies.push(roasAnomaly)

        // Spend Anomaly Detection
        const spendAnomaly = detectSpendAnomaly(campaign)
        if (spendAnomaly) detectedAnomalies.push(spendAnomaly)

        // CTR Anomaly Detection
        const ctrAnomaly = detectCTRAnomaly(campaign)
        if (ctrAnomaly) detectedAnomalies.push(ctrAnomaly)

        // Conversion Rate Anomaly
        const conversionAnomaly = detectConversionAnomaly(campaign)
        if (conversionAnomaly) detectedAnomalies.push(conversionAnomaly)
      }

      // Sort by severity
      detectedAnomalies.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })

      setAnomalies(detectedAnomalies)
      setLastScan(new Date())

      // Notify about critical anomalies
      detectedAnomalies
        .filter(a => a.severity === 'critical')
        .forEach(a => onAnomalyDetected?.(a))

    } catch (error) {
      console.error('Error scanning for anomalies:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const detectROASAnomaly = (campaign: any): MetricAnomaly | null => {
    const currentROAS = campaign.roas || 0
    const avgROAS = campaign.lifetimeROAS || campaign.roas || 2
    const deviation = Math.abs((currentROAS - avgROAS) / avgROAS)

    if (deviation > 0.5) {
      const isDropping = currentROAS < avgROAS
      return {
        id: `${campaign.id}-roas-${Date.now()}`,
        timestamp: new Date(),
        campaignId: campaign.id,
        campaignName: campaign.name,
        metric: 'ROAS',
        currentValue: currentROAS,
        expectedValue: avgROAS,
        deviation: deviation * 100,
        severity: deviation > 0.8 ? 'critical' : deviation > 0.6 ? 'high' : 'medium',
        type: isDropping ? 'drop' : 'spike',
        detected: true,
        resolved: false,
        suggestedActions: isDropping ? [
          'Review recent creative changes',
          'Check audience targeting settings',
          'Analyze competitor activity',
          'Consider pausing if ROAS < 1'
        ] : [
          'Verify tracking is working correctly',
          'Check for data anomalies',
          'Consider scaling budget carefully',
          'Monitor for sustainability'
        ],
        probableCauses: isDropping ? [
          'Creative fatigue',
          'Increased competition',
          'Audience saturation',
          'Seasonal changes'
        ] : [
          'Tracking issues',
          'One-time large purchase',
          'Promotional period',
          'Improved targeting'
        ]
      }
    }
    return null
  }

  const detectSpendAnomaly = (campaign: any): MetricAnomaly | null => {
    const budget = Number(campaign.daily_budget) || 0
    const currentSpend = campaign.todaySpend || campaign.spend * 0.04
    const expectedSpend = budget * (new Date().getHours() / 24)
    
    if (budget > 0) {
      const spendRate = currentSpend / expectedSpend
      
      if (spendRate > 1.5 || spendRate < 0.5) {
        const isOverspending = spendRate > 1
        return {
          id: `${campaign.id}-spend-${Date.now()}`,
          timestamp: new Date(),
          campaignId: campaign.id,
          campaignName: campaign.name,
          metric: 'Spend',
          currentValue: currentSpend,
          expectedValue: expectedSpend,
          deviation: Math.abs(spendRate - 1) * 100,
          severity: spendRate > 2 || spendRate < 0.3 ? 'high' : 'medium',
          type: isOverspending ? 'spike' : 'drop',
          detected: true,
          resolved: false,
          suggestedActions: isOverspending ? [
            'Check bid settings',
            'Review audience size',
            'Verify budget caps',
            'Consider reducing bids'
          ] : [
            'Check campaign status',
            'Review ad approval status',
            'Verify payment method',
            'Check delivery issues'
          ],
          probableCauses: isOverspending ? [
            'Increased competition',
            'Broader audience match',
            'Higher CPMs',
            'Bid strategy change'
          ] : [
            'Ad disapprovals',
            'Limited audience',
            'Budget pacing',
            'Technical issues'
          ]
        }
      }
    }
    return null
  }

  const detectCTRAnomaly = (campaign: any): MetricAnomaly | null => {
    const currentCTR = campaign.ctr || 0
    const avgCTR = 1.5 // Industry average
    const deviation = Math.abs((currentCTR - avgCTR) / avgCTR)

    if (currentCTR < 0.5 && campaign.impressions > 10000) {
      return {
        id: `${campaign.id}-ctr-${Date.now()}`,
        timestamp: new Date(),
        campaignId: campaign.id,
        campaignName: campaign.name,
        metric: 'CTR',
        currentValue: currentCTR,
        expectedValue: avgCTR,
        deviation: deviation * 100,
        severity: currentCTR < 0.3 ? 'high' : 'medium',
        type: 'drop',
        detected: true,
        resolved: false,
        suggestedActions: [
          'Refresh creative assets',
          'Test new ad copy',
          'Review targeting relevance',
          'A/B test different formats'
        ],
        probableCauses: [
          'Creative fatigue',
          'Poor targeting match',
          'Increased frequency',
          'Competitive landscape'
        ]
      }
    }
    return null
  }

  const detectConversionAnomaly = (campaign: any): MetricAnomaly | null => {
    const clicks = campaign.clicks || 0
    const conversions = campaign.conversions || 0
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0
    const expectedRate = 2.5 // Expected conversion rate

    if (clicks > 100 && conversionRate < 1) {
      return {
        id: `${campaign.id}-conv-${Date.now()}`,
        timestamp: new Date(),
        campaignId: campaign.id,
        campaignName: campaign.name,
        metric: 'Conversion Rate',
        currentValue: conversionRate,
        expectedValue: expectedRate,
        deviation: Math.abs((conversionRate - expectedRate) / expectedRate) * 100,
        severity: conversionRate < 0.5 ? 'critical' : 'high',
        type: 'drop',
        detected: true,
        resolved: false,
        suggestedActions: [
          'Check landing page performance',
          'Verify conversion tracking',
          'Review checkout process',
          'Test different offers'
        ],
        probableCauses: [
          'Landing page issues',
          'Tracking problems',
          'Poor traffic quality',
          'Offer mismatch'
        ]
      }
    }
    return null
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'spike': return <TrendingUp className="w-5 h-5 text-orange-500" />
      case 'drop': return <TrendingDown className="w-5 h-5 text-red-500" />
      case 'trend_change': return <Activity className="w-5 h-5 text-yellow-500" />
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  const resolveAnomaly = (anomalyId: string) => {
    setAnomalies(prev => 
      prev.map(a => a.id === anomalyId ? { ...a, resolved: true } : a)
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Performance Anomaly Detector
              </CardTitle>
              <CardDescription>
                Real-time detection of unusual campaign behavior
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm">Auto-scan</label>
                <input
                  type="checkbox"
                  checked={autoScan}
                  onChange={(e) => setAutoScan(e.target.checked)}
                  className="toggle"
                />
              </div>
              <Button
                size="sm"
                onClick={scanForAnomalies}
                disabled={isScanning}
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Scan Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Last scan: {lastScan ? lastScan.toLocaleTimeString() : 'Never'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="destructive">{anomalies.filter(a => a.severity === 'critical').length} Critical</Badge>
              <Badge variant="secondary">{anomalies.filter(a => a.severity === 'high').length} High</Badge>
              <Badge variant="outline">{anomalies.filter(a => !a.resolved).length} Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anomaly List */}
      <div className="space-y-4">
        {anomalies.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">All systems normal</p>
              <p className="text-sm text-muted-foreground mt-1">
                No performance anomalies detected
              </p>
            </CardContent>
          </Card>
        ) : (
          anomalies.filter(a => !a.resolved).map((anomaly) => (
            <Card key={anomaly.id} className={anomaly.resolved ? 'opacity-50' : ''}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Anomaly Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getAnomalyIcon(anomaly.type)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{anomaly.campaignName}</h4>
                          <Badge className={getSeverityColor(anomaly.severity)}>
                            {anomaly.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {anomaly.metric} {anomaly.type === 'drop' ? 'dropped' : 'spiked'} by {anomaly.deviation.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveAnomaly(anomaly.id)}
                    >
                      Resolve
                    </Button>
                  </div>

                  {/* Metrics Comparison */}
                  <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Current</p>
                      <p className="font-medium">
                        {anomaly.metric === 'ROAS' ? `${anomaly.currentValue.toFixed(2)}x` :
                         anomaly.metric === 'Spend' ? formatCurrency(anomaly.currentValue) :
                         anomaly.metric === 'CTR' || anomaly.metric === 'Conversion Rate' ? 
                         `${anomaly.currentValue.toFixed(2)}%` : anomaly.currentValue}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expected</p>
                      <p className="font-medium">
                        {anomaly.metric === 'ROAS' ? `${anomaly.expectedValue.toFixed(2)}x` :
                         anomaly.metric === 'Spend' ? formatCurrency(anomaly.expectedValue) :
                         anomaly.metric === 'CTR' || anomaly.metric === 'Conversion Rate' ? 
                         `${anomaly.expectedValue.toFixed(2)}%` : anomaly.expectedValue}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Deviation</p>
                      <p className={`font-medium ${anomaly.type === 'drop' ? 'text-red-500' : 'text-orange-500'}`}>
                        {anomaly.type === 'drop' ? '-' : '+'}{anomaly.deviation.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Probable Causes */}
                  <div>
                    <h5 className="text-sm font-medium mb-2">Probable Causes</h5>
                    <div className="flex flex-wrap gap-2">
                      {anomaly.probableCauses.map((cause, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {cause}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Actions */}
                  <div>
                    <h5 className="text-sm font-medium mb-2">Recommended Actions</h5>
                    <ul className="space-y-1">
                      {anomaly.suggestedActions.map((action, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start">
                          <span className="text-blue-500 mr-2">→</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Statistics */}
      {anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anomaly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Detected</p>
                <p className="text-2xl font-bold">{anomalies.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{anomalies.filter(a => !a.resolved).length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Most Common</p>
                <p className="text-sm font-medium">
                  {(() => {
                    const counts = anomalies.reduce((acc, a) => {
                      acc[a.metric] = (acc[a.metric] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
                  })()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
                <p className="text-2xl font-bold">
                  {anomalies.length > 0 
                    ? `${((anomalies.filter(a => a.resolved).length / anomalies.length) * 100).toFixed(0)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}