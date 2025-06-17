'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { 
  Sparkles, 
  TrendingUp, 
  Clock,
  DollarSign,
  Target,
  Image,
  AlertTriangle,
  ChevronRight
} from 'lucide-react'

interface AdPrediction {
  timeframe: '7d' | '14d' | '30d'
  metrics: {
    impressions: number
    clicks: number
    spend: number
    conversions: number
    revenue: number
    roas: number
    ctr: number
  }
  confidence: number
  recommendations: string[]
}

interface AdLevelPredictionsProps {
  adId: string
  adName: string
  creative?: any
  currentMetrics: any
  historicalData?: any[]
  onImplementRecommendation?: (recommendation: string) => void
}

export function AdLevelPredictions({ 
  adId, 
  adName, 
  creative,
  currentMetrics,
  historicalData = [],
  onImplementRecommendation 
}: AdLevelPredictionsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '14d' | '30d'>('7d')
  const [selectedScenario, setSelectedScenario] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate')

  // Generate predictions based on current performance
  const generatePrediction = (timeframe: '7d' | '14d' | '30d'): AdPrediction => {
    const days = timeframe === '7d' ? 7 : timeframe === '14d' ? 14 : 30
    const growthFactor = selectedScenario === 'conservative' ? 0.95 : 
                        selectedScenario === 'moderate' ? 1.1 : 1.25

    const dailySpend = currentMetrics?.spend || 100
    const dailyRevenue = currentMetrics?.revenue || 300
    const currentROAS = currentMetrics?.roas || 3

    return {
      timeframe,
      metrics: {
        impressions: Math.round((currentMetrics?.impressions || 1000) * days * growthFactor),
        clicks: Math.round((currentMetrics?.clicks || 50) * days * growthFactor),
        spend: dailySpend * days,
        conversions: Math.round((currentMetrics?.conversions || 10) * days * growthFactor),
        revenue: dailyRevenue * days * growthFactor,
        roas: currentROAS * growthFactor,
        ctr: currentMetrics?.ctr || 2.5
      },
      confidence: selectedScenario === 'conservative' ? 85 : 
                  selectedScenario === 'moderate' ? 70 : 55,
      recommendations: generateRecommendations(currentMetrics)
    }
  }

  const generateRecommendations = (metrics: any): string[] => {
    const recommendations: string[] = []

    if (metrics?.ctr < 1) {
      recommendations.push('Test new ad copy to improve CTR')
      recommendations.push('Refine image/video creative for better engagement')
    }

    if (metrics?.roas < 2) {
      recommendations.push('Optimize landing page for conversions')
      recommendations.push('Test different call-to-action buttons')
    }

    if (metrics?.frequency > 3) {
      recommendations.push('Expand audience to reduce ad fatigue')
      recommendations.push('Create new creative variations')
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue current strategy - performing well')
      recommendations.push('Test 20% budget increase for scaling')
    }

    return recommendations
  }

  const prediction = generatePrediction(selectedTimeframe)

  // Generate chart data
  const generateChartData = () => {
    const days = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '14d' ? 14 : 30
    const data = []
    
    for (let i = 0; i <= days; i++) {
      const progress = i / days
      data.push({
        day: i,
        spend: Math.round(currentMetrics?.spend * i),
        revenue: Math.round(prediction.metrics.revenue * progress),
        conversions: Math.round(prediction.metrics.conversions * progress),
        roas: (prediction.metrics.revenue * progress) / (currentMetrics?.spend * i) || 0
      })
    }
    
    return data
  }

  const chartData = generateChartData()

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>
    if (confidence >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>
    return <Badge className="bg-red-100 text-red-800">Low Confidence</Badge>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Ad Predictions: {adName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="forecast" className="space-y-4">
            <TabsList>
              <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
              <TabsTrigger value="performance">Performance Trends</TabsTrigger>
              <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
            </TabsList>

            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedTimeframe === '7d' ? 'default' : 'outline'}
                  onClick={() => setSelectedTimeframe('7d')}
                >
                  7 Days
                </Button>
                <Button
                  size="sm"
                  variant={selectedTimeframe === '14d' ? 'default' : 'outline'}
                  onClick={() => setSelectedTimeframe('14d')}
                >
                  14 Days
                </Button>
                <Button
                  size="sm"
                  variant={selectedTimeframe === '30d' ? 'default' : 'outline'}
                  onClick={() => setSelectedTimeframe('30d')}
                >
                  30 Days
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedScenario === 'conservative' ? 'default' : 'outline'}
                  onClick={() => setSelectedScenario('conservative')}
                >
                  Conservative
                </Button>
                <Button
                  size="sm"
                  variant={selectedScenario === 'moderate' ? 'default' : 'outline'}
                  onClick={() => setSelectedScenario('moderate')}
                >
                  Moderate
                </Button>
                <Button
                  size="sm"
                  variant={selectedScenario === 'aggressive' ? 'default' : 'outline'}
                  onClick={() => setSelectedScenario('aggressive')}
                >
                  Aggressive
                </Button>
              </div>
            </div>

            <TabsContent value="forecast" className="space-y-4">
              {/* Prediction Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Projected Revenue</p>
                        <p className="text-xl font-bold">${prediction.metrics.revenue.toFixed(0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Expected ROAS</p>
                        <p className="text-xl font-bold">{prediction.metrics.roas.toFixed(2)}x</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Conversions</p>
                        <p className="text-xl font-bold">{prediction.metrics.conversions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <div className="mt-1">{getConfidenceBadge(prediction.confidence)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => `$${Number(value).toFixed(0)}`} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stackId="1" 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.6}
                        name="Revenue"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="spend" 
                        stackId="2" 
                        stroke="#ef4444" 
                        fill="#ef4444" 
                        fillOpacity={0.6}
                        name="Spend"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="conversions" 
                        stroke="#8b5cf6" 
                        name="Conversions"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="roas" 
                        stroke="#3b82f6" 
                        name="ROAS"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Creative Performance */}
              {creative && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Creative Performance Indicators
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Engagement Rate</span>
                        <Badge variant={currentMetrics?.ctr > 2 ? 'default' : 'secondary'}>
                          {currentMetrics?.ctr || 0}% CTR
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Creative Fatigue</span>
                        <Badge variant={currentMetrics?.frequency > 3 ? 'destructive' : 'default'}>
                          {currentMetrics?.frequency || 1.5}x frequency
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Relevance Score</span>
                        <Badge>8/10</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {prediction.recommendations.map((recommendation, index) => (
                <Alert key={index} className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-4 w-4 mt-1" />
                    <div>
                      <p className="font-medium">Recommendation {index + 1}</p>
                      <p className="text-sm text-muted-foreground mt-1">{recommendation}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onImplementRecommendation?.(recommendation)}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </Alert>
              ))}

              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Budget Risk</span>
                      <Badge variant="outline">Low</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Creative Fatigue Risk</span>
                      <Badge variant={currentMetrics?.frequency > 3 ? 'destructive' : 'outline'}>
                        {currentMetrics?.frequency > 3 ? 'High' : 'Medium'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Market Saturation</span>
                      <Badge variant="outline">Medium</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}