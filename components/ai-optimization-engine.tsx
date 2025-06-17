"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  DollarSign,
  Activity,
  BarChart3,
  ArrowRight,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Shield,
  Rocket,
  Bot,
  Eye,
  MousePointer,
  ShoppingCart,
  Lightbulb,
  ChevronRight,
  Settings,
  Info,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface OptimizationSuggestion {
  id: string
  type: 'urgent' | 'high' | 'medium' | 'low'
  category: 'bidding' | 'targeting' | 'creative' | 'budget' | 'schedule'
  title: string
  description: string
  impact: string
  action: string
  estimatedImprovement: number
  affectedCampaigns: number
}

interface AIOptimizationEngineProps {
  campaigns: any[]
}

export function AIOptimizationEngine({ campaigns }: AIOptimizationEngineProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set())
  const [automationEnabled, setAutomationEnabled] = useState(false)
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null)

  // Generate AI suggestions based on campaign data
  const generateSuggestions = () => {
    const newSuggestions: OptimizationSuggestion[] = []
    
    // Analyze campaigns for optimization opportunities
    campaigns.forEach(campaign => {
      // Low ROAS campaigns
      if (campaign.roas < 1 && campaign.spend > 100) {
        newSuggestions.push({
          id: `pause-${campaign.id}`,
          type: 'urgent',
          category: 'budget',
          title: `Pause underperforming campaign: ${campaign.name}`,
          description: `This campaign has ROAS of ${campaign.roas.toFixed(2)}x with $${campaign.spend.toFixed(0)} spend. Pausing it could save budget.`,
          impact: `Save $${(campaign.spend * 0.3).toFixed(0)}/month`,
          action: 'pause_campaign',
          estimatedImprovement: 15,
          affectedCampaigns: 1,
        })
      }
      
      // High CTR but low conversions
      if (campaign.ctr > 3 && campaign.conversions < 10) {
        newSuggestions.push({
          id: `landing-${campaign.id}`,
          type: 'high',
          category: 'creative',
          title: `Optimize landing page for: ${campaign.name}`,
          description: `High CTR (${campaign.ctr.toFixed(2)}%) but low conversions suggests landing page issues.`,
          impact: `Could increase conversions by 40%`,
          action: 'optimize_landing',
          estimatedImprovement: 40,
          affectedCampaigns: 1,
        })
      }
      
      // Budget reallocation opportunity
      if (campaign.roas > 3 && campaign.status === 'ACTIVE') {
        newSuggestions.push({
          id: `scale-${campaign.id}`,
          type: 'medium',
          category: 'budget',
          title: `Scale high-performing campaign: ${campaign.name}`,
          description: `This campaign has ${campaign.roas.toFixed(2)}x ROAS. Increasing budget could drive more revenue.`,
          impact: `+$${(campaign.revenue * 0.5).toFixed(0)} potential revenue`,
          action: 'increase_budget',
          estimatedImprovement: 25,
          affectedCampaigns: 1,
        })
      }
    })
    
    // Add some general optimizations
    newSuggestions.push({
      id: 'audience-expansion',
      type: 'medium',
      category: 'targeting',
      title: 'Enable Advantage+ audience expansion',
      description: 'Let Meta\'s AI find similar high-value audiences for your top campaigns.',
      impact: 'Reach 30% more potential customers',
      action: 'enable_advantage_plus',
      estimatedImprovement: 20,
      affectedCampaigns: campaigns.filter(c => c.roas > 2).length,
    })
    
    newSuggestions.push({
      id: 'creative-refresh',
      type: 'low',
      category: 'creative',
      title: 'Refresh ad creatives older than 30 days',
      description: 'Combat ad fatigue by updating creatives that have been running for over a month.',
      impact: 'Improve CTR by 15-20%',
      action: 'refresh_creatives',
      estimatedImprovement: 18,
      affectedCampaigns: Math.floor(campaigns.length * 0.4),
    })
    
    return newSuggestions
  }

  // Simulate AI scanning
  const runAIScan = () => {
    setIsScanning(true)
    setScanProgress(0)
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsScanning(false)
          setSuggestions(generateSuggestions())
          setLastScanTime(new Date())
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  // Auto-scan on mount
  useEffect(() => {
    if (campaigns.length > 0 && !lastScanTime) {
      runAIScan()
    }
  }, [campaigns])

  const totalPotentialImprovement = suggestions.reduce((sum, s) => sum + s.estimatedImprovement, 0) / suggestions.length || 0
  const urgentSuggestions = suggestions.filter(s => s.type === 'urgent')
  const totalAffectedCampaigns = new Set(suggestions.map(s => s.affectedCampaigns)).size

  const performanceData = [
    { day: 'Mon', current: 2.1, optimized: 2.8 },
    { day: 'Tue', current: 2.3, optimized: 3.1 },
    { day: 'Wed', current: 2.0, optimized: 2.9 },
    { day: 'Thu', current: 2.4, optimized: 3.5 },
    { day: 'Fri', current: 2.6, optimized: 3.9 },
    { day: 'Sat', current: 2.8, optimized: 4.2 },
    { day: 'Sun', current: 2.5, optimized: 3.8 },
  ]

  return (
    <div className="space-y-6">
      {/* AI Header */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
                <Brain className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  AI Optimization Engine
                  <Badge className="bg-white/20 text-white border-0">BETA</Badge>
                </CardTitle>
                <CardDescription className="text-white/90">
                  Your personal AI media buyer • Scans every 30 minutes
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm opacity-90">Automation</p>
                <div className="flex items-center gap-2 mt-1">
                  <Switch
                    checked={automationEnabled}
                    onCheckedChange={setAutomationEnabled}
                    className="data-[state=checked]:bg-white"
                  />
                  <span className="text-sm font-medium">
                    {automationEnabled ? 'Active' : 'Manual'}
                  </span>
                </div>
              </div>
              <Button
                onClick={runAIScan}
                disabled={isScanning}
                className="bg-white text-purple-600 hover:bg-white/90"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Run AI Scan
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        {isScanning && (
          <CardContent>
            <Progress value={scanProgress} className="h-2 bg-white/20" />
            <p className="text-sm mt-2 opacity-90">
              Analyzing {campaigns.length} campaigns for optimization opportunities...
            </p>
          </CardContent>
        )}
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <Badge variant="secondary">{suggestions.length}</Badge>
            </div>
            <p className="text-2xl font-bold">{suggestions.length}</p>
            <p className="text-sm text-muted-foreground">AI Suggestions</p>
            {urgentSuggestions.length > 0 && (
              <p className="text-xs text-red-600 mt-1">
                {urgentSuggestions.length} urgent
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <Badge variant="secondary">+{totalPotentialImprovement.toFixed(0)}%</Badge>
            </div>
            <p className="text-2xl font-bold">+{totalPotentialImprovement.toFixed(0)}%</p>
            <p className="text-sm text-muted-foreground">Potential ROAS Lift</p>
            <Progress value={totalPotentialImprovement} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-blue-500" />
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{totalAffectedCampaigns}</p>
            <p className="text-sm text-muted-foreground">Campaigns to Optimize</p>
            <p className="text-xs text-muted-foreground mt-1">
              {((totalAffectedCampaigns / campaigns.length) * 100).toFixed(0)}% of portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <Badge variant="secondary">Live</Badge>
            </div>
            <p className="text-2xl font-bold">
              {lastScanTime ? 
                `${Math.floor((new Date().getTime() - lastScanTime.getTime()) / 60000)}m ago` : 
                'Never'
              }
            </p>
            <p className="text-sm text-muted-foreground">Last AI Scan</p>
            <p className="text-xs text-muted-foreground mt-1">
              Next scan in {30 - (lastScanTime ? Math.floor((new Date().getTime() - lastScanTime.getTime()) / 60000) : 30)}m
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Suggestions */}
      <Tabs defaultValue="suggestions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suggestions">
            <Lightbulb className="h-4 w-4 mr-2" />
            Suggestions ({suggestions.length})
          </TabsTrigger>
          <TabsTrigger value="impact">
            <BarChart3 className="h-4 w-4 mr-2" />
            Impact Analysis
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          {suggestions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No suggestions yet</p>
                <p className="text-muted-foreground">
                  Run an AI scan to get personalized optimization suggestions
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`border-l-4 ${
                    suggestion.type === 'urgent' ? 'border-l-red-500' :
                    suggestion.type === 'high' ? 'border-l-orange-500' :
                    suggestion.type === 'medium' ? 'border-l-yellow-500' :
                    'border-l-blue-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {suggestion.category === 'bidding' && <DollarSign className="h-4 w-4" />}
                            {suggestion.category === 'targeting' && <Target className="h-4 w-4" />}
                            {suggestion.category === 'creative' && <Sparkles className="h-4 w-4" />}
                            {suggestion.category === 'budget' && <Activity className="h-4 w-4" />}
                            {suggestion.category === 'schedule' && <Clock className="h-4 w-4" />}
                            
                            <h4 className="font-medium">{suggestion.title}</h4>
                            <Badge variant={
                              suggestion.type === 'urgent' ? 'destructive' :
                              suggestion.type === 'high' ? 'default' :
                              'secondary'
                            } className="text-xs">
                              {suggestion.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {suggestion.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-green-600">
                              <TrendingUp className="h-3 w-3" />
                              {suggestion.impact}
                            </span>
                            <span className="text-muted-foreground">
                              Affects {suggestion.affectedCampaigns} campaign{suggestion.affectedCampaigns !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                            onClick={() => {
                              setSelectedSuggestions(prev => {
                                const updated = new Set(prev)
                                updated.add(suggestion.id)
                                return updated
                              })
                            }}
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Apply
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
          
          {suggestions.length > 0 && (
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Apply all suggestions</p>
                    <p className="text-sm text-muted-foreground">
                      Estimated improvement: +{totalPotentialImprovement.toFixed(0)}% ROAS
                    </p>
                  </div>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <Rocket className="h-4 w-4 mr-2" />
                    Apply All ({suggestions.length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="impact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Projected Performance Impact</CardTitle>
              <CardDescription>
                Expected ROAS improvement with AI optimizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="current"
                    stroke="#8B5CF6"
                    fillOpacity={1}
                    fill="url(#colorCurrent)"
                    name="Current ROAS"
                  />
                  <Area
                    type="monotone"
                    dataKey="optimized"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorOptimized)"
                    name="Optimized ROAS"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <p className="font-medium">Revenue Impact</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  +${(campaigns.reduce((sum, c) => sum + c.revenue, 0) * (totalPotentialImprovement / 100)).toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">Potential monthly increase</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <p className="font-medium">Risk Mitigation</p>
                </div>
                <p className="text-2xl font-bold">
                  ${campaigns.filter(c => c.roas < 1).reduce((sum, c) => sum + c.spend, 0).toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">Wasted spend prevented</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Rocket className="h-5 w-5 text-purple-500" />
                  <p className="font-medium">Scaling Potential</p>
                </div>
                <p className="text-2xl font-bold">
                  {campaigns.filter(c => c.roas > 3).length}
                </p>
                <p className="text-sm text-muted-foreground">Campaigns ready to scale</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization History</CardTitle>
              <CardDescription>
                Track the impact of applied AI suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    date: '2 hours ago',
                    action: 'Paused underperforming campaigns',
                    result: 'Saved $1,250 in wasted spend',
                    status: 'success',
                  },
                  {
                    date: 'Yesterday',
                    action: 'Enabled Advantage+ audiences',
                    result: '+35% reach, +12% conversions',
                    status: 'success',
                  },
                  {
                    date: '3 days ago',
                    action: 'Optimized bidding strategy',
                    result: 'Reduced CPA by 18%',
                    status: 'success',
                  },
                  {
                    date: '1 week ago',
                    action: 'Refreshed ad creatives',
                    result: 'CTR improved from 1.2% to 2.1%',
                    status: 'success',
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{item.action}</p>
                        <span className="text-xs text-muted-foreground">{item.date}</span>
                      </div>
                      <p className="text-sm text-green-600">{item.result}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}