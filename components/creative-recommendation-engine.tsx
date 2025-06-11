'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Sparkles,
  TrendingUp,
  Lightbulb,
  Palette,
  Type,
  Image,
  Video,
  Zap,
  Target,
  Brain,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Star,
  Filter,
  Download,
  Copy,
  Eye,
  MousePointer,
  DollarSign,
  Users,
  Layers,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Hash,
  MessageSquare,
  Clock
} from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { CreativeRecommendation } from '@/lib/creative-intelligence'

interface RecommendationEngineProps {
  campaignId: string
  currentPerformance: {
    ctr: number
    conversionRate: number
    cpc: number
    roas: number
  }
  audience: {
    demographics: any
    interests: string[]
    behaviors: string[]
  }
  industry?: string
  onRecommendationApplied?: (recommendation: CreativeRecommendation) => void
}

interface EnhancedRecommendation extends CreativeRecommendation {
  category: 'copy' | 'visual' | 'format' | 'targeting' | 'timing'
  confidence: number
  effort: 'low' | 'medium' | 'high'
  timeToImplement: string
  examples?: string[]
  bestPractices?: string[]
}

export function CreativeRecommendationEngine({
  campaignId,
  currentPerformance,
  audience,
  industry = 'general',
  onRecommendationApplied
}: RecommendationEngineProps) {
  const [activeTab, setActiveTab] = useState('all')
  const [recommendations, setRecommendations] = useState<EnhancedRecommendation[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedRecs, setExpandedRecs] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Generate recommendations based on performance and audience
    generateRecommendations()
  }, [currentPerformance, audience])

  const generateRecommendations = () => {
    const recs: EnhancedRecommendation[] = []

    // Copy recommendations
    if (currentPerformance.ctr < 1.5) {
      recs.push({
        type: 'text_rewrite',
        priority: 'high',
        element: 'headline',
        suggestedValue: 'Use numbers and power words in headlines',
        expectedImpact: { metric: 'CTR', improvement: 0.25 },
        reasoning: 'Headlines with numbers get 36% more clicks',
        category: 'copy',
        confidence: 92,
        effort: 'low',
        timeToImplement: '30 minutes',
        examples: [
          '5 Ways to Save on Insurance Today',
          'Get 50% Off - Limited Time Only',
          'Join 10,000+ Happy Customers'
        ],
        bestPractices: [
          'Keep headlines under 30 characters',
          'Include your main benefit',
          'Create urgency when appropriate'
        ]
      })
    }

    // Visual recommendations
    if (currentPerformance.ctr < 2) {
      recs.push({
        type: 'color_adjustment',
        priority: 'high',
        element: 'image',
        suggestedValue: 'High contrast colors with clear focal point',
        expectedImpact: { metric: 'CTR', improvement: 0.30 },
        reasoning: 'High contrast images stop the scroll 45% more effectively',
        category: 'visual',
        confidence: 88,
        effort: 'medium',
        timeToImplement: '2 hours',
        examples: [
          'Use complementary colors (blue/orange, purple/yellow)',
          'Add white space around key elements',
          'Use faces looking toward your CTA'
        ]
      })
    }

    // Format recommendations
    recs.push({
      type: 'new_variation',
      priority: 'medium',
      suggestedValue: { format: 'carousel', slides: 3 },
      expectedImpact: { metric: 'Engagement', improvement: 0.40 },
      reasoning: 'Carousel ads get 72% more engagement in your industry',
      category: 'format',
      confidence: 85,
      effort: 'medium',
      timeToImplement: '3 hours',
      bestPractices: [
        'Tell a story across slides',
        'Each slide should work independently',
        'Save the best content for slide 1'
      ]
    })

    // Timing recommendations
    if (audience.demographics?.age_range) {
      recs.push({
        type: 'element_change',
        priority: 'medium',
        element: 'scheduling',
        suggestedValue: 'Peak hours: 7-9 AM, 12-2 PM, 7-10 PM',
        expectedImpact: { metric: 'CTR', improvement: 0.15 },
        reasoning: `Your audience (${audience.demographics.age_range}) is most active during these hours`,
        category: 'timing',
        confidence: 78,
        effort: 'low',
        timeToImplement: '15 minutes'
      })
    }

    // Video recommendations
    recs.push({
      type: 'new_variation',
      priority: 'high',
      suggestedValue: { format: 'video', duration: '15s' },
      expectedImpact: { metric: 'Engagement', improvement: 0.60 },
      reasoning: 'Video ads drive 135% more organic reach',
      category: 'format',
      confidence: 91,
      effort: 'high',
      timeToImplement: '1-2 days',
      bestPractices: [
        'Hook viewers in first 3 seconds',
        'Design for sound-off viewing',
        'Include captions',
        'Keep it under 15 seconds'
      ]
    })

    // Industry-specific recommendations
    if (industry === 'ecommerce') {
      recs.push({
        type: 'element_change',
        priority: 'high',
        element: 'social_proof',
        suggestedValue: 'Add reviews, ratings, or testimonials',
        expectedImpact: { metric: 'Conversion Rate', improvement: 0.35 },
        reasoning: '92% of consumers read reviews before purchasing',
        category: 'copy',
        confidence: 94,
        effort: 'low',
        timeToImplement: '1 hour',
        examples: [
          '⭐⭐⭐⭐⭐ "Best purchase ever!" - Sarah M.',
          'Join 50,000+ satisfied customers',
          'Rated #1 by TrustPilot'
        ]
      })
    }

    setRecommendations(recs)
  }

  const toggleExpanded = (recId: string) => {
    const newExpanded = new Set(expandedRecs)
    if (newExpanded.has(recId)) {
      newExpanded.delete(recId)
    } else {
      newExpanded.add(recId)
    }
    setExpandedRecs(newExpanded)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'copy': return Type
      case 'visual': return Palette
      case 'format': return Layers
      case 'targeting': return Target
      case 'timing': return Clock
      default: return Sparkles
    }
  }

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'high': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.category === selectedCategory)

  const performanceRadarData = [
    { metric: 'CTR', current: currentPerformance.ctr * 50, potential: (currentPerformance.ctr * 1.3) * 50 },
    { metric: 'Conversions', current: currentPerformance.conversionRate * 30, potential: (currentPerformance.conversionRate * 1.4) * 30 },
    { metric: 'Engagement', current: 65, potential: 85 },
    { metric: 'Relevance', current: 70, potential: 90 },
    { metric: 'Efficiency', current: currentPerformance.roas * 10, potential: (currentPerformance.roas * 1.25) * 10 }
  ]

  const impactByCategory = [
    { category: 'Copy', impact: 25, count: recommendations.filter(r => r.category === 'copy').length },
    { category: 'Visual', impact: 30, count: recommendations.filter(r => r.category === 'visual').length },
    { category: 'Format', impact: 40, count: recommendations.filter(r => r.category === 'format').length },
    { category: 'Timing', impact: 15, count: recommendations.filter(r => r.category === 'timing').length }
  ]

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Creative Recommendations
          </CardTitle>
          <CardDescription>
            Personalized suggestions based on your campaign performance and audience insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Potential */}
            <div>
              <h4 className="text-sm font-medium mb-3">Performance Potential</h4>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={performanceRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Current" dataKey="current" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.3} />
                  <Radar name="Potential" dataKey="potential" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Impact by Category */}
            <div>
              <h4 className="text-sm font-medium mb-3">Expected Impact by Category</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={impactByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="impact" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{recommendations.length}</p>
              <p className="text-sm text-muted-foreground">Total Recommendations</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                +{Math.round(recommendations.reduce((acc, r) => acc + r.expectedImpact.improvement * 100, 0) / recommendations.length)}%
              </p>
              <p className="text-sm text-muted-foreground">Avg. Expected Lift</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {recommendations.filter(r => r.confidence > 85).length}
              </p>
              <p className="text-sm text-muted-foreground">High Confidence</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {recommendations.filter(r => r.effort === 'low').length}
              </p>
              <p className="text-sm text-muted-foreground">Quick Wins</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recommendations</CardTitle>
            <div className="flex gap-2">
              {['all', 'copy', 'visual', 'format', 'timing'].map(cat => {
                const Icon = getCategoryIcon(cat)
                return (
                  <Button
                    key={cat}
                    size="sm"
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Button>
                )
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {filteredRecommendations.map((rec, idx) => {
                const Icon = getCategoryIcon(rec.category)
                const isExpanded = expandedRecs.has(`${rec.type}_${idx}`)
                
                return (
                  <Card key={idx} className="overflow-hidden">
                    <CardHeader 
                      className="cursor-pointer"
                      onClick={() => toggleExpanded(`${rec.type}_${idx}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            rec.priority === 'high' ? 'bg-red-50' : 
                            rec.priority === 'medium' ? 'bg-yellow-50' : 'bg-blue-50'
                          }`}>
                            <Icon className={`h-4 w-4 ${
                              rec.priority === 'high' ? 'text-red-600' : 
                              rec.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{rec.suggestedValue}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{rec.reasoning}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                +{(rec.expectedImpact.improvement * 100).toFixed(0)}% {rec.expectedImpact.metric}
                              </Badge>
                              <Badge variant="outline" className={`text-xs ${getEffortColor(rec.effort)}`}>
                                {rec.effort} effort
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {rec.timeToImplement}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Confidence</p>
                            <p className="text-lg font-bold">{rec.confidence}%</p>
                          </div>
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="pt-0">
                        <Separator className="mb-4" />
                        
                        {rec.examples && rec.examples.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium mb-2">Examples:</h5>
                            <ul className="space-y-1">
                              {rec.examples.map((example, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <CheckCircle className="h-3 w-3 mt-0.5 text-green-500" />
                                  {example}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {rec.bestPractices && rec.bestPractices.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium mb-2">Best Practices:</h5>
                            <ul className="space-y-1">
                              {rec.bestPractices.map((practice, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <Star className="h-3 w-3 mt-0.5 text-yellow-500" />
                                  {practice}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex gap-2 mt-4">
                          <Button 
                            size="sm"
                            onClick={() => onRecommendationApplied?.(rec)}
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Apply This
                          </Button>
                          <Button size="sm" variant="outline">
                            <Copy className="h-4 w-4 mr-1" />
                            Save for Later
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>Pro Tip</AlertTitle>
        <AlertDescription>
          Start with low-effort, high-confidence recommendations for quick wins. 
          Test one change at a time to accurately measure impact.
        </AlertDescription>
      </Alert>
    </div>
  )
}