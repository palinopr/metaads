"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Image,
  Video,
  FileText,
  Sparkles,
  Wand2,
  Palette,
  Type,
  Layout,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Download,
  Upload,
  RefreshCw,
  Lightbulb,
  Zap,
  BarChart3,
  Award,
  Star,
  ChevronRight,
  Play,
  Pause,
  Copy,
  Settings,
  Info,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Brain,
  Layers,
  Grid3x3,
  Plus,
} from "lucide-react"
import { motion } from "framer-motion"

interface CreativeAsset {
  id: string
  type: 'image' | 'video' | 'carousel'
  url: string
  thumbnail: string
  name: string
  performance: {
    impressions: number
    clicks: number
    ctr: number
    conversions: number
    spend: number
    revenue: number
    roas: number
  }
  elements: {
    headline?: string
    description?: string
    cta?: string
    colors?: string[]
    tags?: string[]
  }
  aiScore: number
  status: 'active' | 'paused' | 'learning'
  createdAt: Date
}

interface CreativeIntelligenceProps {
  campaigns: any[]
}

export function CreativeIntelligence({ campaigns }: CreativeIntelligenceProps) {
  const [selectedAsset, setSelectedAsset] = useState<CreativeAsset | null>(null)
  const [generatingAd, setGeneratingAd] = useState(false)
  const [aiProgress, setAiProgress] = useState(0)

  // Mock creative assets data
  const creativeAssets: CreativeAsset[] = [
    {
      id: '1',
      type: 'video',
      url: '/mock-video-1.mp4',
      thumbnail: '/api/placeholder/400/400',
      name: 'Summer Sale Promo',
      performance: {
        impressions: 125000,
        clicks: 3750,
        ctr: 3.0,
        conversions: 187,
        spend: 1250,
        revenue: 9375,
        roas: 7.5,
      },
      elements: {
        headline: 'Summer Sale - Up to 50% Off',
        description: 'Shop the hottest deals of the season',
        cta: 'Shop Now',
        colors: ['#FF6B6B', '#4ECDC4', '#FFFFFF'],
        tags: ['sale', 'summer', 'discount', 'urgent'],
      },
      aiScore: 92,
      status: 'active',
      createdAt: new Date('2024-01-10'),
    },
    {
      id: '2',
      type: 'image',
      url: '/api/placeholder/400/400',
      thumbnail: '/api/placeholder/400/400',
      name: 'Product Showcase A',
      performance: {
        impressions: 98000,
        clicks: 1960,
        ctr: 2.0,
        conversions: 98,
        spend: 980,
        revenue: 4900,
        roas: 5.0,
      },
      elements: {
        headline: 'Discover Our New Collection',
        description: 'Premium quality, unbeatable prices',
        cta: 'Learn More',
        colors: ['#2D3436', '#74B9FF', '#FFFFFF'],
        tags: ['product', 'new', 'collection'],
      },
      aiScore: 78,
      status: 'active',
      createdAt: new Date('2024-01-08'),
    },
    {
      id: '3',
      type: 'carousel',
      url: '/api/placeholder/400/400',
      thumbnail: '/api/placeholder/400/400',
      name: 'Customer Testimonials',
      performance: {
        impressions: 45000,
        clicks: 675,
        ctr: 1.5,
        conversions: 34,
        spend: 450,
        revenue: 1700,
        roas: 3.78,
      },
      elements: {
        headline: 'See What Our Customers Say',
        description: 'Real reviews from real people',
        cta: 'Read Reviews',
        colors: ['#6C5CE7', '#A29BFE', '#FFFFFF'],
        tags: ['social-proof', 'testimonial', 'trust'],
      },
      aiScore: 65,
      status: 'learning',
      createdAt: new Date('2024-01-05'),
    },
  ]

  // Calculate creative insights
  const creativeInsights = {
    topPerformer: creativeAssets.reduce((best, current) => 
      current.performance.roas > best.performance.roas ? current : best
    ),
    avgCTR: creativeAssets.reduce((sum, asset) => sum + asset.performance.ctr, 0) / creativeAssets.length,
    totalImpressions: creativeAssets.reduce((sum, asset) => sum + asset.performance.impressions, 0),
    videoPerformance: creativeAssets.filter(a => a.type === 'video').reduce((sum, a) => sum + a.performance.roas, 0) / creativeAssets.filter(a => a.type === 'video').length || 0,
    imagePerformance: creativeAssets.filter(a => a.type === 'image').reduce((sum, a) => sum + a.performance.roas, 0) / creativeAssets.filter(a => a.type === 'image').length || 0,
  }

  const handleGenerateAd = () => {
    setGeneratingAd(true)
    setAiProgress(0)
    
    const interval = setInterval(() => {
      setAiProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setGeneratingAd(false)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  return (
    <div className="space-y-6">
      {/* Creative Intelligence Header */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
                <Sparkles className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl">Creative Intelligence</CardTitle>
                <CardDescription className="text-white/90">
                  AI-powered creative analysis and generation
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleGenerateAd}
              disabled={generatingAd}
              className="bg-white text-indigo-600 hover:bg-white/90"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Generate New Ad
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <Badge variant="secondary" className="text-xs">Top</Badge>
            </div>
            <p className="text-lg font-bold">{creativeInsights.topPerformer.name}</p>
            <p className="text-sm text-muted-foreground">Best Performer</p>
            <p className="text-xs text-green-600 mt-1">
              {creativeInsights.topPerformer.performance.roas.toFixed(2)}x ROAS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <MousePointer className="h-5 w-5 text-blue-500" />
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{creativeInsights.avgCTR.toFixed(2)}%</p>
            <p className="text-sm text-muted-foreground">Average CTR</p>
            <Progress value={creativeInsights.avgCTR * 20} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Video className="h-5 w-5 text-purple-500" />
              <span className="text-xs text-muted-foreground">vs Image</span>
            </div>
            <p className="text-2xl font-bold">
              {creativeInsights.videoPerformance > creativeInsights.imagePerformance ? '+' : '-'}
              {Math.abs(((creativeInsights.videoPerformance - creativeInsights.imagePerformance) / creativeInsights.imagePerformance * 100)).toFixed(0)}%
            </p>
            <p className="text-sm text-muted-foreground">Video Performance</p>
            <p className="text-xs text-purple-600 mt-1">
              {creativeInsights.videoPerformance.toFixed(2)}x avg ROAS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-5 w-5 text-green-500" />
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">
              {(creativeInsights.totalImpressions / 1000).toFixed(0)}K
            </p>
            <p className="text-sm text-muted-foreground">Total Impressions</p>
            <p className="text-xs text-muted-foreground mt-1">
              Across {creativeAssets.length} creatives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Brain className="h-5 w-5 text-pink-500" />
              <Badge variant="secondary" className="text-xs">AI</Badge>
            </div>
            <p className="text-2xl font-bold">
              {Math.round(creativeAssets.reduce((sum, a) => sum + a.aiScore, 0) / creativeAssets.length)}
            </p>
            <p className="text-sm text-muted-foreground">Avg AI Score</p>
            <div className="flex gap-0.5 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  className={`h-1 flex-1 rounded ${
                    star <= Math.round(creativeAssets.reduce((sum, a) => sum + a.aiScore, 0) / creativeAssets.length / 20)
                      ? 'bg-pink-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="library" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="library">
            <Grid3x3 className="h-4 w-4 mr-2" />
            Creative Library
          </TabsTrigger>
          <TabsTrigger value="generator">
            <Wand2 className="h-4 w-4 mr-2" />
            AI Generator
          </TabsTrigger>
          <TabsTrigger value="insights">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performance Insights
          </TabsTrigger>
          <TabsTrigger value="optimizer">
            <Zap className="h-4 w-4 mr-2" />
            Creative Optimizer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          {/* Filters and Search */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="Search creatives..."
                className="max-w-sm"
              />
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="carousel">Carousels</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="performance">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Best Performance</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="impressions">Most Impressions</SelectItem>
                  <SelectItem value="conversions">Most Conversions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Creative
            </Button>
          </div>

          {/* Creative Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {creativeAssets.map((asset) => (
              <motion.div
                key={asset.id}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className="cursor-pointer overflow-hidden"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={asset.thumbnail}
                      alt={asset.name}
                      className="object-cover w-full h-full"
                    />
                    {asset.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="h-12 w-12 text-white" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge
                        variant={asset.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {asset.status}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          asset.aiScore >= 80 ? 'bg-green-100 text-green-700' :
                          asset.aiScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}
                      >
                        AI: {asset.aiScore}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="flex gap-1">
                        {asset.elements.tags?.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs bg-white/90 backdrop-blur"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{asset.name}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">CTR</p>
                        <p className="font-medium">{asset.performance.ctr.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ROAS</p>
                        <p className="font-medium text-green-600">
                          {asset.performance.roas.toFixed(2)}x
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conversions</p>
                        <p className="font-medium">{asset.performance.conversions}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Spend</p>
                        <p className="font-medium">${asset.performance.spend}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Creative Generator</CardTitle>
              <CardDescription>
                Generate high-performing ads using AI trained on millions of successful campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label>Campaign Objective</Label>
                    <Select defaultValue="conversions">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conversions">Conversions</SelectItem>
                        <SelectItem value="traffic">Traffic</SelectItem>
                        <SelectItem value="awareness">Brand Awareness</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Target Audience</Label>
                    <Select defaultValue="broad">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="broad">Broad Audience</SelectItem>
                        <SelectItem value="young-adults">Young Adults (18-34)</SelectItem>
                        <SelectItem value="professionals">Professionals</SelectItem>
                        <SelectItem value="parents">Parents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Creative Format</Label>
                    <RadioGroup defaultValue="single-image">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single-image" id="single-image" />
                        <Label htmlFor="single-image">Single Image</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="video" id="video" />
                        <Label htmlFor="video">Video (9:16)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="carousel" id="carousel" />
                        <Label htmlFor="carousel">Carousel</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Brand Voice</Label>
                    <Select defaultValue="professional">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual & Friendly</SelectItem>
                        <SelectItem value="playful">Playful & Fun</SelectItem>
                        <SelectItem value="urgent">Urgent & Direct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Product/Service Description</Label>
                    <Textarea
                      placeholder="Describe your product or service..."
                      className="h-24"
                    />
                  </div>

                  <div>
                    <Label>Key Benefits (Optional)</Label>
                    <Textarea
                      placeholder="List main benefits or features..."
                      className="h-24"
                    />
                  </div>

                  <div>
                    <Label>Call to Action</Label>
                    <Select defaultValue="shop-now">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shop-now">Shop Now</SelectItem>
                        <SelectItem value="learn-more">Learn More</SelectItem>
                        <SelectItem value="sign-up">Sign Up</SelectItem>
                        <SelectItem value="get-started">Get Started</SelectItem>
                        <SelectItem value="download">Download</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={handleGenerateAd}
                  disabled={generatingAd}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                >
                  {generatingAd ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating Creative... {aiProgress}%
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Creative
                    </>
                  )}
                </Button>
                {generatingAd && (
                  <Progress value={aiProgress} className="mt-2" />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Creative Elements Performance</CardTitle>
                <CardDescription>
                  Which elements drive the best results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { element: 'Urgency Words', performance: 85, examples: ['Limited Time', 'Today Only'] },
                    { element: 'Social Proof', performance: 78, examples: ['Customer Reviews', 'Testimonials'] },
                    { element: 'Bold Colors', performance: 72, examples: ['Red CTAs', 'Bright Backgrounds'] },
                    { element: 'Human Faces', performance: 68, examples: ['Smiling People', 'Eye Contact'] },
                    { element: 'Numbers/Stats', performance: 65, examples: ['50% Off', 'Save $100'] },
                  ].map((item) => (
                    <div key={item.element} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.element}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.performance}% effective
                        </span>
                      </div>
                      <Progress value={item.performance} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Examples: {item.examples.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Format Performance Comparison</CardTitle>
                <CardDescription>
                  Average performance by creative format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { format: 'Video (9:16)', ctr: 3.2, conversions: 156, roas: 6.8, trend: 'up' },
                    { format: 'Single Image', ctr: 2.1, conversions: 98, roas: 4.5, trend: 'stable' },
                    { format: 'Carousel', ctr: 1.8, conversions: 67, roas: 3.9, trend: 'down' },
                    { format: 'Collection', ctr: 1.5, conversions: 45, roas: 3.2, trend: 'down' },
                  ].map((format) => (
                    <div key={format.format} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {format.format}
                          {format.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                          {format.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format.conversions} conversions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{format.ctr}% CTR</p>
                        <p className="text-sm text-green-600">{format.roas}x ROAS</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>
                Data-driven suggestions to improve creative performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    title: 'Switch to vertical video format',
                    description: 'Video ads are outperforming images by 51% in your account',
                    impact: '+32% expected CTR increase',
                    priority: 'high',
                  },
                  {
                    title: 'Add urgency messaging',
                    description: 'Creatives with time-limited offers show 85% better performance',
                    impact: '+28% conversion rate',
                    priority: 'high',
                  },
                  {
                    title: 'Refresh older creatives',
                    description: '3 creatives haven\'t been updated in 45+ days',
                    impact: 'Combat ad fatigue',
                    priority: 'medium',
                  },
                  {
                    title: 'Test user-generated content',
                    description: 'UGC typically sees 4.5x higher engagement',
                    impact: 'Build trust & authenticity',
                    priority: 'medium',
                  },
                ].map((rec, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      rec.priority === 'high' ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          {rec.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {rec.description}
                        </p>
                        <p className="text-sm text-green-600 mt-2">
                          {rec.impact}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimizer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Creative A/B Testing</CardTitle>
              <CardDescription>
                Automatically test and optimize your creative elements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    AI is currently testing 3 creative variations across 5 campaigns
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  {[
                    {
                      test: 'Headline Variations',
                      status: 'active',
                      progress: 67,
                      leader: 'Variant B',
                      improvement: '+24%',
                    },
                    {
                      test: 'CTA Button Colors',
                      status: 'active',
                      progress: 45,
                      leader: 'Red Button',
                      improvement: '+12%',
                    },
                    {
                      test: 'Image vs Video',
                      status: 'completed',
                      progress: 100,
                      leader: 'Video',
                      improvement: '+38%',
                    },
                  ].map((test) => (
                    <Card key={test.test}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{test.test}</p>
                            <p className="text-sm text-muted-foreground">
                              Leading: {test.leader} ({test.improvement})
                            </p>
                          </div>
                          <Badge variant={test.status === 'active' ? 'default' : 'secondary'}>
                            {test.status}
                          </Badge>
                        </div>
                        <Progress value={test.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                          {test.progress}% statistical significance
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}