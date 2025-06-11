'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, DollarSign, Target, Zap, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts'

interface ROIScenario {
  name: string
  currentSpend: number
  newSpend: number
  currentROAS: number
  projectedROAS: number
  projectedRevenue: number
  projectedProfit: number
  roi: number
  confidence: number
}

interface WhatIfInputs {
  currentSpend: number
  currentRevenue: number
  spendIncrease: number
  roasChange: number
  timeframe: number
}

export function ROICalculator() {
  const [inputs, setInputs] = useState<WhatIfInputs>({
    currentSpend: 10000,
    currentRevenue: 50000,
    spendIncrease: 25,
    roasChange: 0,
    timeframe: 30
  })

  const [scenarios, setScenarios] = useState<ROIScenario[]>([])
  const [activeTab, setActiveTab] = useState('calculator')

  const calculateScenarios = () => {
    const currentROAS = inputs.currentRevenue / inputs.currentSpend
    const newSpend = inputs.currentSpend * (1 + inputs.spendIncrease / 100)
    const spendDiff = newSpend - inputs.currentSpend

    const scenarios: ROIScenario[] = [
      {
        name: 'Conservative',
        currentSpend: inputs.currentSpend,
        newSpend: newSpend,
        currentROAS: currentROAS,
        projectedROAS: currentROAS * (1 + (inputs.roasChange - 0.5) / 100),
        projectedRevenue: 0,
        projectedProfit: 0,
        roi: 0,
        confidence: 85
      },
      {
        name: 'Moderate',
        currentSpend: inputs.currentSpend,
        newSpend: newSpend,
        currentROAS: currentROAS,
        projectedROAS: currentROAS * (1 + inputs.roasChange / 100),
        projectedRevenue: 0,
        projectedProfit: 0,
        roi: 0,
        confidence: 70
      },
      {
        name: 'Aggressive',
        currentSpend: inputs.currentSpend,
        newSpend: newSpend,
        currentROAS: currentROAS,
        projectedROAS: currentROAS * (1 + (inputs.roasChange + 0.5) / 100),
        projectedRevenue: 0,
        projectedProfit: 0,
        roi: 0,
        confidence: 55
      }
    ]

    scenarios.forEach(scenario => {
      scenario.projectedRevenue = scenario.newSpend * scenario.projectedROAS
      const currentProfit = inputs.currentRevenue - inputs.currentSpend
      scenario.projectedProfit = scenario.projectedRevenue - scenario.newSpend
      scenario.roi = ((scenario.projectedProfit - currentProfit) / spendDiff) * 100
    })

    setScenarios(scenarios)
  }

  const generateTimeseriesData = () => {
    const days = inputs.timeframe
    const data = []
    
    for (let i = 0; i <= days; i++) {
      const progress = i / days
      const currentRevenue = inputs.currentRevenue * (1 + progress * 0.1)
      
      scenarios.forEach((scenario, index) => {
        const dailyRevenue = scenario.projectedRevenue * progress
        const dailySpend = scenario.newSpend * progress
        const dailyProfit = dailyRevenue - dailySpend
        
        if (index === 0) {
          data.push({
            day: i,
            conservative: dailyProfit,
            moderate: 0,
            aggressive: 0,
            current: currentRevenue - inputs.currentSpend * progress
          })
        } else if (index === 1) {
          data[i].moderate = dailyProfit
        } else {
          data[i].aggressive = dailyProfit
        }
      })
    }
    
    return data
  }

  const getROIColor = (roi: number) => {
    if (roi >= 200) return 'text-green-600'
    if (roi >= 100) return 'text-green-500'
    if (roi >= 50) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>
    if (confidence >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>
    return <Badge className="bg-red-100 text-red-800">Low Confidence</Badge>
  }

  useEffect(() => {
    calculateScenarios()
  }, [inputs])

  const chartData = generateTimeseriesData()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calculator className="h-6 w-6" />
        <h2 className="text-2xl font-bold">ROI Calculator & What-If Scenarios</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Input Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currentSpend">Current Monthly Spend</Label>
                  <Input
                    id="currentSpend"
                    type="number"
                    value={inputs.currentSpend}
                    onChange={(e) => setInputs({...inputs, currentSpend: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentRevenue">Current Monthly Revenue</Label>
                  <Input
                    id="currentRevenue"
                    type="number"
                    value={inputs.currentRevenue}
                    onChange={(e) => setInputs({...inputs, currentRevenue: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Spend Increase: {inputs.spendIncrease}%</Label>
                  <Slider
                    value={[inputs.spendIncrease]}
                    onValueChange={(value) => setInputs({...inputs, spendIncrease: value[0]})}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    New spend: ${(inputs.currentSpend * (1 + inputs.spendIncrease / 100)).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Expected ROAS Change: {inputs.roasChange > 0 ? '+' : ''}{inputs.roasChange}%</Label>
                  <Slider
                    value={[inputs.roasChange]}
                    onValueChange={(value) => setInputs({...inputs, roasChange: value[0]})}
                    max={50}
                    min={-25}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeframe">Forecast Timeframe (days)</Label>
                  <Input
                    id="timeframe"
                    type="number"
                    value={inputs.timeframe}
                    onChange={(e) => setInputs({...inputs, timeframe: Number(e.target.value)})}
                    min={7}
                    max={90}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current ROAS</p>
                    <p className="text-2xl font-bold">{(inputs.currentRevenue / inputs.currentSpend).toFixed(2)}x</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Profit</p>
                    <p className="text-2xl font-bold">${(inputs.currentRevenue - inputs.currentSpend).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Profit Margin</p>
                    <p className="text-2xl font-bold">{((inputs.currentRevenue - inputs.currentSpend) / inputs.currentRevenue * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Break-even ROAS</p>
                    <p className="text-2xl font-bold">1.00x</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Risk Assessment
                  </h4>
                  <div className="space-y-2 text-sm">
                    {inputs.spendIncrease > 50 && (
                      <p className="text-red-600">⚠️ High spend increase may impact ROAS negatively</p>
                    )}
                    {(inputs.currentRevenue / inputs.currentSpend) < 2 && (
                      <p className="text-yellow-600">⚠️ Current ROAS is below optimal threshold</p>
                    )}
                    {inputs.roasChange < -10 && (
                      <p className="text-red-600">⚠️ Significant ROAS decline expected</p>
                    )}
                    {inputs.spendIncrease <= 25 && inputs.roasChange >= 0 && (
                      <p className="text-green-600">✅ Low risk scenario</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scenarios.map((scenario, index) => (
              <Card key={scenario.name} className={`relative ${index === 1 ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{scenario.name}</CardTitle>
                    {getConfidenceBadge(scenario.confidence)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Projected ROAS</p>
                      <p className="font-semibold">{scenario.projectedROAS.toFixed(2)}x</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">New Revenue</p>
                      <p className="font-semibold">${scenario.projectedRevenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">New Profit</p>
                      <p className="font-semibold">${scenario.projectedProfit.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ROI on Investment</p>
                      <p className={`font-bold text-lg ${getROIColor(scenario.roi)}`}>
                        {scenario.roi.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Additional spend: ${(scenario.newSpend - scenario.currentSpend).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ROI Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scenarios}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'roi' ? `${Number(value).toFixed(0)}%` : `$${Number(value).toLocaleString()}`,
                      name === 'roi' ? 'ROI' : name === 'projectedRevenue' ? 'Revenue' : 'Profit'
                    ]} 
                  />
                  <Legend />
                  <Bar dataKey="roi" fill="#10b981" name="ROI %" />
                  <Bar dataKey="projectedProfit" fill="#3b82f6" name="Projected Profit" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profit Forecast Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Profit']} />
                  <Legend />
                  <Area type="monotone" dataKey="current" stackId="1" stroke="#94a3b8" fill="#94a3b8" name="Current Trajectory" />
                  <Area type="monotone" dataKey="conservative" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Conservative" />
                  <Area type="monotone" dataKey="moderate" stackId="3" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Moderate" />
                  <Area type="monotone" dataKey="aggressive" stackId="4" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Aggressive" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recommended Action
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scenarios.length > 0 && (
                  <div className="space-y-3">
                    {scenarios[1].roi > 100 ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-800">✅ Recommended: Increase Spend</h4>
                        <p className="text-sm text-green-700">
                          The moderate scenario shows {scenarios[1].roi.toFixed(0)}% ROI. 
                          Consider implementing this increase gradually.
                        </p>
                      </div>
                    ) : scenarios[1].roi > 50 ? (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-semibold text-yellow-800">⚠️ Proceed with Caution</h4>
                        <p className="text-sm text-yellow-700">
                          The ROI is moderate ({scenarios[1].roi.toFixed(0)}%). 
                          Consider optimizing campaigns first.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-semibold text-red-800">❌ Not Recommended</h4>
                        <p className="text-sm text-red-700">
                          Low ROI expected ({scenarios[1].roi.toFixed(0)}%). 
                          Focus on optimization instead of scaling.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline">
                  Export Scenarios to CSV
                </Button>
                <Button className="w-full" variant="outline">
                  Schedule Campaign Updates
                </Button>
                <Button className="w-full" variant="outline">
                  Set ROI Alerts
                </Button>
                <Button className="w-full">
                  Implement Moderate Scenario
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}