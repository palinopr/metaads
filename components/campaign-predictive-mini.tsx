"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { 
  TrendingUp, Sparkles, ArrowUp, ArrowDown, 
  AlertTriangle, ChevronRight
} from 'lucide-react'
import { formatCurrency, formatNumberWithCommas } from '@/lib/utils'

interface CampaignPredictiveMiniProps {
  campaign: any
  onViewDetails?: () => void
}

interface Prediction {
  date: string
  predictedSpend: number
  predictedRevenue: number
  predictedROAS: number
  predictedConversions: number
  confidence: number
}

export function CampaignPredictiveMini({ campaign, onViewDetails }: CampaignPredictiveMiniProps) {
  const [timeframe, setTimeframe] = useState<'7d' | '30d'>('7d')
  const [scenario, setScenario] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  
  const scenarios = {
    conservative: {
      name: 'Conservative',
      budgetMultiplier: 1.0,
      expectedROAS: 0.95,
      color: 'text-green-500'
    },
    moderate: {
      name: 'Moderate',
      budgetMultiplier: 1.5,
      expectedROAS: 0.9,
      color: 'text-blue-500'
    },
    aggressive: {
      name: 'Aggressive',
      budgetMultiplier: 2.5,
      expectedROAS: 0.85,
      color: 'text-red-500'
    }
  }

  useEffect(() => {
    generatePredictions()
  }, [campaign, timeframe, scenario])

  const generatePredictions = () => {
    if (!campaign) return
    
    const days = timeframe === '7d' ? 7 : 30
    const newPredictions: Prediction[] = []
    
    // Extract spend and ROAS data from campaign
    const spend = campaign.insights?.spend || 0
    const daysRunning = campaign.daysRunning || 1
    const avgDailySpend = spend / daysRunning
    const currentROAS = campaign.lifetimeROAS || campaign.insights?.roas || 1
    const scenarioData = scenarios[scenario]
    
    for (let i = 1; i <= days; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      
      // Weekend adjustment
      const dayOfWeek = date.getDay()
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.85 : 1.1
      
      const predictedSpend = avgDailySpend * scenarioData.budgetMultiplier * weekendMultiplier
      const predictedROAS = currentROAS * scenarioData.expectedROAS * (0.9 + Math.random() * 0.2)
      const predictedRevenue = predictedSpend * predictedROAS
      const predictedConversions = predictedRevenue / 50 // Assuming $50 AOV
      
      newPredictions.push({
        date: date.toISOString().split('T')[0],
        predictedSpend,
        predictedRevenue,
        predictedROAS,
        predictedConversions: Math.round(predictedConversions),
        confidence: Math.max(60, 95 - (i * 1.5))
      })
    }
    
    setPredictions(newPredictions)
  }

  const calculateMetrics = () => {
    const totalSpend = predictions.reduce((sum, p) => sum + p.predictedSpend, 0)
    const totalRevenue = predictions.reduce((sum, p) => sum + p.predictedRevenue, 0)
    const avgROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
    const totalProfit = totalRevenue - totalSpend
    
    return { totalSpend, totalRevenue, avgROAS, totalProfit }
  }

  const metrics = calculateMetrics()
  const currentScenario = scenarios[scenario]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">AI Predictions</CardTitle>
          </div>
          {onViewDetails && (
            <Button variant="ghost" size="sm" onClick={onViewDetails}>
              View Full Analysis
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
        <CardDescription>
          Forecast for {campaign.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="grid grid-cols-2 gap-3">
          <Select value={timeframe} onValueChange={setTimeframe as any}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Next 7 Days</SelectItem>
              <SelectItem value="30d">Next 30 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={scenario} onValueChange={setScenario as any}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conservative">Conservative</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="aggressive">Aggressive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Predicted Revenue</p>
            <p className="text-xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
            <div className="flex items-center text-xs">
              {metrics.avgROAS >= 1 ? (
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={metrics.avgROAS >= 1 ? 'text-green-500' : 'text-red-500'}>
                {metrics.avgROAS.toFixed(2)}x ROAS
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Expected Profit</p>
            <p className={`text-xl font-bold ${metrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.totalProfit)}
            </p>
            <p className="text-xs text-muted-foreground">
              {((metrics.totalProfit / metrics.totalSpend) * 100).toFixed(0)}% margin
            </p>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={predictions}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).getDate().toString()}
                fontSize={12}
              />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: any) => formatCurrency(value)}
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="predictedRevenue"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                strokeWidth={2}
                name="Revenue"
              />
              <Area
                type="monotone"
                dataKey="predictedSpend"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.3}
                name="Spend"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Scenario Badge */}
        <div className="flex items-center justify-between pt-2">
          <Badge variant="outline" className={currentScenario.color}>
            {currentScenario.name} Scenario
          </Badge>
          <span className="text-xs text-muted-foreground">
            {predictions[0]?.confidence.toFixed(0)}% confidence
          </span>
        </div>
      </CardContent>
    </Card>
  )
}