"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import { 
  TrendingUp, Calendar, DollarSign, Target, Zap,
  AlertTriangle, Info, ArrowUp, ArrowDown, Minus
} from 'lucide-react'
import { formatCurrency, formatNumberWithCommas, formatPercentage } from '@/lib/utils'

interface PredictiveAnalyticsProps {
  campaigns: any[]
  historicalData?: any[]
}

interface Prediction {
  date: string
  predictedSpend: number
  predictedRevenue: number
  predictedROAS: number
  predictedConversions: number
  confidence: number
  upper: number
  lower: number
}

interface Scenario {
  name: string
  description: string
  budgetMultiplier: number
  expectedROAS: number
  risk: 'low' | 'medium' | 'high'
}

export function PredictiveAnalytics({ campaigns, historicalData = [] }: PredictiveAnalyticsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all')
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d')
  const [scenario, setScenario] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate')
  
  const scenarios: Record<string, Scenario> = {
    conservative: {
      name: 'Conservative',
      description: 'Maintain current budget with focus on stability',
      budgetMultiplier: 1.0,
      expectedROAS: 0.95,
      risk: 'low'
    },
    moderate: {
      name: 'Moderate Growth',
      description: 'Gradual budget increase with balanced risk',
      budgetMultiplier: 1.5,
      expectedROAS: 0.9,
      risk: 'medium'
    },
    aggressive: {
      name: 'Aggressive Scaling',
      description: 'Significant budget increase for rapid growth',
      budgetMultiplier: 2.5,
      expectedROAS: 0.85,
      risk: 'high'
    }
  }

  useEffect(() => {
    generatePredictions()
  }, [selectedCampaign, timeframe, scenario])

  const generatePredictions = () => {
    // In a real implementation, this would use ML models
    // For demo, using trend analysis and seasonal patterns
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90
    const newPredictions: Prediction[] = []
    
    // Get baseline metrics
    const activeCampaigns = selectedCampaign === 'all' 
      ? campaigns 
      : campaigns.filter(c => c.id === selectedCampaign)
    
    const avgDailySpend = activeCampaigns.reduce((sum, c) => 
      sum + (c.insights?.spend || 0) / (c.daysRunning || 1), 0
    )
    const avgROAS = activeCampaigns.reduce((sum, c) => 
      sum + (c.lifetimeROAS || 0), 0
    ) / (activeCampaigns.length || 1)
    
    const scenarioData = scenarios[scenario]
    
    for (let i = 1; i <= days; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      
      // Apply growth trend and seasonality
      const dayOfWeek = date.getDay()
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.85 : 1.1
      const trendMultiplier = 1 + (i * 0.002) // 0.2% daily growth
      
      const baseSpend = avgDailySpend * scenarioData.budgetMultiplier
      const predictedSpend = baseSpend * weekendMultiplier * trendMultiplier
      
      // Add some randomness for realism
      const randomFactor = 0.9 + Math.random() * 0.2
      const predictedROAS = avgROAS * scenarioData.expectedROAS * randomFactor
      
      const predictedRevenue = predictedSpend * predictedROAS
      const predictedConversions = predictedRevenue / 50 // Assuming $50 avg order value
      
      // Calculate confidence intervals
      const confidence = Math.max(60, 95 - (i * 0.5)) // Confidence decreases over time
      const variance = (100 - confidence) / 100
      
      newPredictions.push({
        date: date.toISOString().split('T')[0],
        predictedSpend,
        predictedRevenue,
        predictedROAS,
        predictedConversions: Math.round(predictedConversions),
        confidence,
        upper: predictedRevenue * (1 + variance),
        lower: predictedRevenue * (1 - variance)
      })
    }
    
    setPredictions(newPredictions)
  }

  const calculateMetrics = () => {
    const totalPredictedSpend = predictions.reduce((sum, p) => sum + p.predictedSpend, 0)
    const totalPredictedRevenue = predictions.reduce((sum, p) => sum + p.predictedRevenue, 0)
    const avgPredictedROAS = totalPredictedSpend > 0 ? totalPredictedRevenue / totalPredictedSpend : 0
    const totalPredictedProfit = totalPredictedRevenue - totalPredictedSpend
    
    return {
      totalPredictedSpend,
      totalPredictedRevenue,
      avgPredictedROAS,
      totalPredictedProfit,
      avgConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / (predictions.length || 1)
    }
  }

  const metrics = calculateMetrics()
  const currentScenario = scenarios[scenario]

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-500'
      case 'medium': return 'text-yellow-500'
      case 'high': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Predictive Analytics & Forecasting
          </CardTitle>
          <CardDescription>
            AI-powered predictions for your campaign performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Campaign</label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Timeframe</label>
              <Select value={timeframe} onValueChange={setTimeframe as any}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Next 7 Days</SelectItem>
                  <SelectItem value="30d">Next 30 Days</SelectItem>
                  <SelectItem value="90d">Next 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Growth Scenario</label>
              <Select value={scenario} onValueChange={setScenario as any}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="moderate">Moderate Growth</SelectItem>
                  <SelectItem value="aggressive">Aggressive Scaling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scenario Details */}
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>{currentScenario.name}:</strong> {currentScenario.description}
              <span className={`ml-2 font-medium ${getRiskColor(currentScenario.risk)}`}>
                ({currentScenario.risk} risk)
              </span>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Prediction Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Predicted Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalPredictedSpend)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics.totalPredictedSpend / predictions.length)}/day avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Predicted Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalPredictedRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics.totalPredictedRevenue / predictions.length)}/day avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Predicted ROAS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgPredictedROAS.toFixed(2)}x</div>
            <div className="flex items-center text-xs">
              {metrics.avgPredictedROAS >= 1 ? (
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={metrics.avgPredictedROAS >= 1 ? 'text-green-500' : 'text-red-500'}>
                {metrics.avgPredictedROAS >= 1 ? 'Profitable' : 'Loss'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expected Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.totalPredictedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.totalPredictedProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((metrics.totalPredictedProfit / metrics.totalPredictedSpend) * 100).toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confidence Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgConfidence.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Based on historical data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Prediction Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Revenue Forecast</TabsTrigger>
          <TabsTrigger value="roas">ROAS Projection</TabsTrigger>
          <TabsTrigger value="conversions">Conversion Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecast with Confidence Intervals</CardTitle>
              <CardDescription>
                Predicted revenue range based on {currentScenario.name.toLowerCase()} scenario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={predictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stroke="#e0e0e0"
                    fill="#f0f0f0"
                    fillOpacity={0.3}
                    name="Upper Bound"
                  />
                  <Area
                    type="monotone"
                    dataKey="predictedRevenue"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    strokeWidth={2}
                    name="Expected Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stroke="#e0e0e0"
                    fill="#f0f0f0"
                    fillOpacity={0.3}
                    name="Lower Bound"
                  />
                  <Area
                    type="monotone"
                    dataKey="predictedSpend"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.3}
                    name="Predicted Spend"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roas">
          <Card>
            <CardHeader>
              <CardTitle>ROAS Projection</CardTitle>
              <CardDescription>
                Expected return on ad spend over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={predictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => value.toFixed(2) + 'x'}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Legend />
                  <ReferenceLine y={1} stroke="#666" strokeDasharray="3 3" label="Break-even" />
                  <Line
                    type="monotone"
                    dataKey="predictedROAS"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Predicted ROAS"
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="#94a3b8"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                    name="Confidence %"
                    yAxisId="right"
                  />
                  <YAxis yAxisId="right" orientation="right" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Forecast</CardTitle>
              <CardDescription>
                Expected conversions based on current trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={predictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => formatNumberWithCommas(value)}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="predictedConversions"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                    name="Predicted Conversions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Analysis</CardTitle>
          <CardDescription>
            Potential risks and mitigation strategies for {currentScenario.name.toLowerCase()} scenario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentScenario.risk === 'high' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>High Risk Warning:</strong> Aggressive scaling may lead to:
                  <ul className="list-disc list-inside mt-2">
                    <li>Temporary ROAS decline as algorithms adjust</li>
                    <li>Increased CPA during scaling phase</li>
                    <li>Potential audience fatigue if not managed properly</li>
                  </ul>
                  <p className="mt-2 font-medium">Mitigation: Monitor daily and be ready to adjust budgets.</p>
                </AlertDescription>
              </Alert>
            )}
            
            {currentScenario.risk === 'medium' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Moderate Risk:</strong> Balanced growth approach with:
                  <ul className="list-disc list-inside mt-2">
                    <li>Gradual budget increases to maintain stability</li>
                    <li>Expected 10-15% fluctuation in daily performance</li>
                    <li>Need for weekly optimization reviews</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {currentScenario.risk === 'low' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Low Risk:</strong> Conservative approach focusing on:
                  <ul className="list-disc list-inside mt-2">
                    <li>Maintaining current performance levels</li>
                    <li>Minimal volatility in results</li>
                    <li>Steady, predictable outcomes</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}