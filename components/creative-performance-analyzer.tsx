'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Image, 
  Video, 
  FileText,
  Eye,
  MousePointer,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Palette,
  Type,
  Zap,
  Target,
  Layers,
  Brain,
  Scan,
  HeatmapIcon,
  Shield,
  Sparkles,
  Camera,
  Gauge,
  RefreshCw
} from 'lucide-react'
import { Label } from "@/components/ui/label"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, Area, AreaChart } from 'recharts'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Creative {
  id: string
  type: 'image' | 'video' | 'carousel'
  url?: string
  title?: string
  body?: string
  cta?: string
  metrics: {
    impressions: number
    clicks: number
    ctr: number
    conversions: number
    conversionRate: number
    engagementRate: number
    thumbStopRate?: number
    avgWatchTime?: number
    frequency: number
  }
  visualAnalysis?: {
    dominantColors: string[]
    textCoverage: number
    facesDetected: number
    logoPresence: boolean
    brightness: number
    contrast: number
    complexity: number
    emotionScores?: {
      joy: number
      trust: number
      surprise: number
      anticipation: number
    }
  }
  heatmapData?: {
    clicks: Array<{x: number, y: number, value: number}>
    attention: Array<{x: number, y: number, value: number}>
    engagement: Array<{x: number, y: number, value: number}>
  }
  complianceStatus?: {
    textCoverage: boolean
    copyrightClear: boolean
    brandGuidelines: boolean
    platformPolicies: boolean
    issues: string[]
  }
}

interface CreativePerformanceAnalyzerProps {
  adId: string
  adName: string
  creative: Creative
  historicalData?: any[]
  benchmarks?: any
}

export function CreativePerformanceAnalyzer({
  adId,
  adName,
  creative,
  historicalData = [],
  benchmarks
}: CreativePerformanceAnalyzerProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [heatmapType, setHeatmapType] = useState<'clicks' | 'attention' | 'engagement'>('clicks')
  const [fatigueThreshold, setFatigueThreshold] = useState([3.5])
  const [showVisualAnalysis, setShowVisualAnalysis] = useState(false)
  
  // Calculate performance scores
  const calculateScores = () => {
    const scores = {
      engagement: 0,
      relevance: 0,
      conversion: 0,
      fatigue: 0,
      overall: 0
    }

    // Engagement score based on CTR and engagement rate
    if (creative.metrics.ctr > 2) scores.engagement = 90
    else if (creative.metrics.ctr > 1.5) scores.engagement = 70
    else if (creative.metrics.ctr > 1) scores.engagement = 50
    else scores.engagement = 30

    // Relevance score
    if (creative.metrics.conversionRate > 3) scores.relevance = 85
    else if (creative.metrics.conversionRate > 2) scores.relevance = 65
    else if (creative.metrics.conversionRate > 1) scores.relevance = 45
    else scores.relevance = 25

    // Conversion score
    scores.conversion = Math.min(100, creative.metrics.conversionRate * 20)

    // Fatigue score (inverse - lower frequency is better)
    if (creative.metrics.frequency < 2) scores.fatigue = 90
    else if (creative.metrics.frequency < 3) scores.fatigue = 70
    else if (creative.metrics.frequency < 4) scores.fatigue = 40
    else scores.fatigue = 20

    // Overall score
    scores.overall = Math.round(
      (scores.engagement * 0.3 + 
       scores.relevance * 0.3 + 
       scores.conversion * 0.3 + 
       scores.fatigue * 0.1)
    )

    return scores
  }

  const scores = calculateScores()

  // Generate insights
  const generateInsights = () => {
    const insights = []

    if (creative.metrics.ctr < 1) {
      insights.push({
        type: 'warning',
        title: 'Low Click-Through Rate',
        description: 'CTR is below industry average. Consider refreshing creative or improving headline.',
        action: 'Test new variations'
      })
    }

    if (creative.metrics.frequency > 3.5) {
      insights.push({
        type: 'critical',
        title: 'Creative Fatigue Detected',
        description: 'High frequency indicates audience saturation. Users seeing this ad too often.',
        action: 'Expand audience or pause ad'
      })
    }

    if (creative.type === 'video' && creative.metrics.avgWatchTime && creative.metrics.avgWatchTime < 3) {
      insights.push({
        type: 'warning',
        title: 'Low Video Engagement',
        description: 'Average watch time is below 3 seconds. Hook viewers in first 3 seconds.',
        action: 'Improve video opening'
      })
    }

    if (scores.overall > 80) {
      insights.push({
        type: 'success',
        title: 'High Performing Creative',
        description: 'This creative is performing excellently. Consider scaling budget.',
        action: 'Increase budget by 20-30%'
      })
    }

    return insights
  }

  const insights = generateInsights()

  // Creative elements analysis
  const elementAnalysis = [
    { element: 'Headline', score: creative.title ? 85 : 0, recommendation: 'Keep it under 40 characters' },
    { element: 'Body Text', score: creative.body ? 75 : 0, recommendation: 'Focus on benefits, not features' },
    { element: 'Call-to-Action', score: creative.cta ? 90 : 0, recommendation: 'Use action verbs' },
    { element: 'Visual Impact', score: scores.engagement, recommendation: 'Use high contrast colors' },
  ]

  // Radar chart data
  const radarData = [
    { metric: 'CTR', value: Math.min(100, creative.metrics.ctr * 50), benchmark: 50 },
    { metric: 'Engagement', value: scores.engagement, benchmark: 70 },
    { metric: 'Relevance', value: scores.relevance, benchmark: 60 },
    { metric: 'Conversion', value: scores.conversion, benchmark: 50 },
    { metric: 'Freshness', value: scores.fatigue, benchmark: 80 },
  ]

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical': return AlertTriangle
      case 'warning': return AlertTriangle
      case 'success': return CheckCircle
      default: return Lightbulb
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'success': return 'text-green-600 bg-green-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {creative.type === 'image' && <Image className="h-5 w-5" />}
              {creative.type === 'video' && <Video className="h-5 w-5" />}
              {creative.type === 'carousel' && <Layers className="h-5 w-5" />}
              Creative Performance: {adName}
            </span>
            <Badge className={scores.overall > 70 ? 'bg-green-100 text-green-800' : 
                           scores.overall > 40 ? 'bg-yellow-100 text-yellow-800' : 
                           'bg-red-100 text-red-800'}>
              Score: {scores.overall}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="visual">Visual Analysis</TabsTrigger>
              <TabsTrigger value="heatmap">Heatmaps</TabsTrigger>
              <TabsTrigger value="fatigue">Fatigue Detection</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="optimization">Optimization</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Impressions</p>
                        <p className="text-xl font-bold">{creative.metrics.impressions.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <MousePointer className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">CTR</p>
                        <p className="text-xl font-bold">{creative.metrics.ctr.toFixed(2)}%</p>
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
                        <p className="text-xl font-bold">{creative.metrics.conversions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Frequency</p>
                        <p className="text-xl font-bold">{creative.metrics.frequency.toFixed(1)}x</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Radar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Performance vs Benchmarks</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="Current" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Radar name="Benchmark" dataKey="benchmark" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.3} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visual" className="space-y-6 mt-6">
              {/* Visual Recognition Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Scan className="h-4 w-4" />
                    Visual Recognition Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {creative.visualAnalysis ? (
                    <div className="space-y-6">
                      {/* Color Analysis */}
                      <div>
                        <Label>Dominant Colors</Label>
                        <div className="flex gap-2 mt-2">
                          {creative.visualAnalysis.dominantColors.map((color, idx) => (
                            <div 
                              key={idx}
                              className="w-12 h-12 rounded border-2 border-gray-200"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Visual Metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Text Coverage</Label>
                          <Progress value={creative.visualAnalysis.textCoverage} className="mt-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {creative.visualAnalysis.textCoverage}% of image
                          </p>
                        </div>
                        <div>
                          <Label>Visual Complexity</Label>
                          <Progress value={creative.visualAnalysis.complexity} className="mt-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {creative.visualAnalysis.complexity < 30 ? 'Simple' : 
                             creative.visualAnalysis.complexity < 70 ? 'Moderate' : 'Complex'}
                          </p>
                        </div>
                      </div>

                      {/* Emotion Analysis */}
                      {creative.visualAnalysis.emotionScores && (
                        <div>
                          <Label>Emotional Impact</Label>
                          <div className="space-y-2 mt-2">
                            {Object.entries(creative.visualAnalysis.emotionScores).map(([emotion, score]) => (
                              <div key={emotion} className="flex items-center gap-2">
                                <span className="text-sm capitalize w-20">{emotion}</span>
                                <Progress value={score} className="flex-1" />
                                <span className="text-sm text-muted-foreground">{score}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Detection Results */}
                      <div className="flex gap-4">
                        <Badge variant={creative.visualAnalysis.facesDetected > 0 ? 'default' : 'secondary'}>
                          {creative.visualAnalysis.facesDetected} Faces Detected
                        </Badge>
                        <Badge variant={creative.visualAnalysis.logoPresence ? 'default' : 'secondary'}>
                          {creative.visualAnalysis.logoPresence ? 'Logo Present' : 'No Logo'}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Visual analysis not available for this creative
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Creative Elements Analysis */}
              {/* Creative Elements Analysis */}
              <div className="space-y-4">
                {elementAnalysis.map((element, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{element.element}</h4>
                          <Badge variant={element.score > 70 ? 'default' : 'secondary'}>
                            {element.score}/100
                          </Badge>
                        </div>
                        <Progress value={element.score} className="h-2" />
                        <p className="text-sm text-muted-foreground">{element.recommendation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Creative Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Creative Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {creative.title && (
                      <div>
                        <Label className="flex items-center gap-2">
                          <Type className="h-3 w-3" />
                          Headline
                        </Label>
                        <p className="text-sm mt-1">{creative.title}</p>
                      </div>
                    )}
                    {creative.body && (
                      <div>
                        <Label className="flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          Body Text
                        </Label>
                        <p className="text-sm mt-1">{creative.body}</p>
                      </div>
                    )}
                    {creative.cta && (
                      <div>
                        <Label className="flex items-center gap-2">
                          <Zap className="h-3 w-3" />
                          Call-to-Action
                        </Label>
                        <p className="text-sm mt-1">{creative.cta}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="heatmap" className="space-y-6 mt-6">
              {/* Heatmap Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Performance Heatmap
                    </span>
                    <Select value={heatmapType} onValueChange={(value: any) => setHeatmapType(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clicks">Clicks</SelectItem>
                        <SelectItem value="attention">Attention</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {creative.heatmapData ? (
                    <div className="relative">
                      {/* Placeholder for actual heatmap visualization */}
                      <div className="aspect-video bg-muted rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-sm text-muted-foreground">
                            Heatmap visualization for {heatmapType}
                          </p>
                        </div>
                        {/* In production, would render actual heatmap using canvas or D3.js */}
                      </div>
                      <div className="mt-4 flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded" />
                          Low Activity
                        </span>
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-500 rounded" />
                          High Activity
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Gauge className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Heatmap data not available. Collect more engagement data.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Heatmap Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Heatmap Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span>Most clicks concentrated on CTA button (85% of total)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span>Face in image attracts 3x more attention than text</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span>Bottom 30% of creative receives minimal engagement</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fatigue" className="space-y-6 mt-6">
              {/* Creative Fatigue Detection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Creative Fatigue Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Fatigue Score */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Fatigue Level</Label>
                      <Badge className={scores.fatigue > 70 ? 'bg-green-100 text-green-800' : 
                                     scores.fatigue > 40 ? 'bg-yellow-100 text-yellow-800' : 
                                     'bg-red-100 text-red-800'}>
                        {scores.fatigue > 70 ? 'Fresh' : scores.fatigue > 40 ? 'Moderate' : 'Fatigued'}
                      </Badge>
                    </div>
                    <Progress value={100 - scores.fatigue} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Frequency: {creative.metrics.frequency.toFixed(1)}x (threshold: {fatigueThreshold[0]}x)
                    </p>
                  </div>

                  {/* Fatigue Threshold Adjustment */}
                  <div>
                    <Label>Fatigue Frequency Threshold</Label>
                    <div className="mt-2 px-2">
                      <Slider 
                        value={fatigueThreshold} 
                        onValueChange={setFatigueThreshold}
                        min={1}
                        max={10}
                        step={0.5}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1x</span>
                        <span>{fatigueThreshold[0]}x</span>
                        <span>10x</span>
                      </div>
                    </div>
                  </div>

                  {/* Fatigue Timeline */}
                  <div>
                    <Label>Performance Over Time</Label>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={[
                        { day: 'Day 1', ctr: 2.5, engagement: 8 },
                        { day: 'Day 7', ctr: 2.3, engagement: 7.5 },
                        { day: 'Day 14', ctr: 1.8, engagement: 6 },
                        { day: 'Day 21', ctr: 1.2, engagement: 4 },
                        { day: 'Day 28', ctr: 0.8, engagement: 2.5 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="ctr" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="engagement" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Refresh Recommendations */}
                  <Alert>
                    <RefreshCw className="h-4 w-4" />
                    <AlertTitle>Refresh Recommendation</AlertTitle>
                    <AlertDescription>
                      Based on current fatigue levels, consider refreshing this creative within {Math.round(7 * (scores.fatigue / 100))} days.
                      Performance has declined {((2.5 - creative.metrics.ctr) / 2.5 * 100).toFixed(0)}% from peak.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6 mt-6">
              {/* Creative Compliance Check */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Compliance Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {creative.complianceStatus ? (
                    <div className="space-y-4">
                      {/* Compliance Checks */}
                      <div className="space-y-2">
                        {[
                          { name: 'Text Coverage (< 20%)', status: creative.complianceStatus.textCoverage },
                          { name: 'Copyright Clearance', status: creative.complianceStatus.copyrightClear },
                          { name: 'Brand Guidelines', status: creative.complianceStatus.brandGuidelines },
                          { name: 'Platform Policies', status: creative.complianceStatus.platformPolicies }
                        ].map((check, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/50">
                            <span className="text-sm">{check.name}</span>
                            {check.status ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Compliance Issues */}
                      {creative.complianceStatus.issues.length > 0 && (
                        <Alert className="bg-red-50 text-red-900">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Compliance Issues Found</AlertTitle>
                          <AlertDescription>
                            <ul className="mt-2 space-y-1">
                              {creative.complianceStatus.issues.map((issue, idx) => (
                                <li key={idx} className="text-sm">• {issue}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Compliance check pending
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4 mt-6">
              {insights.map((insight, index) => {
                const Icon = getInsightIcon(insight.type)
                return (
                  <Alert key={index} className={getInsightColor(insight.type)}>
                    <Icon className="h-4 w-4" />
                    <AlertTitle>{insight.title}</AlertTitle>
                    <AlertDescription>
                      <p>{insight.description}</p>
                      <Button size="sm" variant="outline" className="mt-2">
                        {insight.action}
                      </Button>
                    </AlertDescription>
                  </Alert>
                )
              })}

              {/* A/B Test Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    A/B Test Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Test different headline lengths (current: {creative.title?.length || 0} chars)</li>
                    <li>• Try emotion-based vs benefit-based copy</li>
                    <li>• Test different CTA buttons (color, text, placement)</li>
                    <li>• Experiment with image filters or overlays</li>
                    {creative.type === 'video' && <li>• Test different video lengths and opening hooks</li>}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-6 mt-6">
              {/* Optimization Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Immediate Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {scores.engagement < 50 && <li>✓ Improve visual contrast and clarity</li>}
                      {scores.fatigue < 50 && <li>✓ Create 2-3 new creative variations</li>}
                      {creative.metrics.ctr < 1 && <li>✓ Test more compelling headlines</li>}
                      <li>✓ Add social proof elements</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Long-term Strategy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Build creative refresh calendar (every 2-3 weeks)</li>
                      <li>• Develop brand consistency guidelines</li>
                      <li>• Create seasonal variations</li>
                      <li>• Test user-generated content</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Expected Impact */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Expected Impact of Optimizations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">CTR Improvement</span>
                      <span className="text-sm font-bold text-green-600">+15-25%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Conversion Rate</span>
                      <span className="text-sm font-bold text-green-600">+10-20%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cost per Conversion</span>
                      <span className="text-sm font-bold text-green-600">-20-30%</span>
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