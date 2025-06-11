"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts'
import { 
  Eye, Search, Filter, Calendar, Play, Image, FileText, 
  TrendingUp, TrendingDown, Clock, Globe, Users, Target,
  AlertCircle, CheckCircle, Download, Share, Bookmark,
  ThumbsUp, MessageSquare, ExternalLink, Zap, Activity
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface CompetitorAdMonitoringProps {
  industry: string
}

interface CompetitorAd {
  id: string
  competitorName: string
  competitorDomain: string
  adType: 'image' | 'video' | 'carousel' | 'text' | 'collection'
  headline: string
  description: string
  callToAction: string
  imageUrl?: string
  videoUrl?: string
  firstSeen: Date
  lastSeen: Date
  isActive: boolean
  platforms: string[]
  estimatedReach: number
  estimatedSpend: number
  engagement: {
    likes: number
    comments: number
    shares: number
    estimatedCTR: number
  }
  targeting: {
    ageRange: string
    gender: string
    locations: string[]
    interests: string[]
  }
  performance: {
    trend: 'up' | 'down' | 'stable'
    score: number
  }
}

interface AdTrend {
  date: string
  newAds: number
  activeAds: number
  stoppedAds: number
  totalSpend: number
}

export function CompetitorAdMonitoring({ industry }: CompetitorAdMonitoringProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('all')
  const [selectedAdType, setSelectedAdType] = useState<string>('all')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [sortBy, setSortBy] = useState('recent')

  // Mock competitor ads data
  const competitorAds: CompetitorAd[] = [
    {
      id: 'ad-1',
      competitorName: 'TechLeader Corp',
      competitorDomain: 'techleader.com',
      adType: 'video',
      headline: 'Transform Your Business with AI',
      description: 'Discover how our AI-powered solutions can revolutionize your workflow and boost productivity by 300%.',
      callToAction: 'Get Free Demo',
      videoUrl: '/mock-video-1.mp4',
      firstSeen: new Date('2024-05-15'),
      lastSeen: new Date(),
      isActive: true,
      platforms: ['Facebook', 'Instagram', 'LinkedIn'],
      estimatedReach: 250000,
      estimatedSpend: 15000,
      engagement: {
        likes: 1245,
        comments: 89,
        shares: 156,
        estimatedCTR: 3.2
      },
      targeting: {
        ageRange: '25-54',
        gender: 'All',
        locations: ['United States', 'Canada', 'United Kingdom'],
        interests: ['Business', 'Technology', 'Entrepreneurship']
      },
      performance: {
        trend: 'up',
        score: 87
      }
    },
    {
      id: 'ad-2',
      competitorName: 'MarketChallenger Inc',
      competitorDomain: 'marketchallenger.com',
      adType: 'carousel',
      headline: 'Summer Sale - Up to 70% Off',
      description: 'Don\'t miss our biggest sale of the year! Premium products at unbeatable prices.',
      callToAction: 'Shop Now',
      imageUrl: '/mock-carousel-1.jpg',
      firstSeen: new Date('2024-06-01'),
      lastSeen: new Date(),
      isActive: true,
      platforms: ['Facebook', 'Instagram', 'TikTok'],
      estimatedReach: 180000,
      estimatedSpend: 8500,
      engagement: {
        likes: 2156,
        comments: 234,
        shares: 445,
        estimatedCTR: 4.1
      },
      targeting: {
        ageRange: '18-45',
        gender: 'All',
        locations: ['United States', 'Canada'],
        interests: ['Shopping', 'Fashion', 'Lifestyle']
      },
      performance: {
        trend: 'up',
        score: 92
      }
    },
    {
      id: 'ad-3',
      competitorName: 'EstablishedBrand LLC',
      competitorDomain: 'established.com',
      adType: 'image',
      headline: 'Trusted by Millions Worldwide',
      description: 'Join the millions who trust our proven solutions for their business needs.',
      callToAction: 'Learn More',
      imageUrl: '/mock-image-1.jpg',
      firstSeen: new Date('2024-05-20'),
      lastSeen: new Date('2024-06-05'),
      isActive: false,
      platforms: ['Google Ads', 'LinkedIn'],
      estimatedReach: 120000,
      estimatedSpend: 12000,
      engagement: {
        likes: 567,
        comments: 45,
        shares: 78,
        estimatedCTR: 2.1
      },
      targeting: {
        ageRange: '35-65',
        gender: 'All',
        locations: ['United States', 'United Kingdom', 'Australia'],
        interests: ['Business', 'Finance', 'Professional Services']
      },
      performance: {
        trend: 'down',
        score: 64
      }
    },
    {
      id: 'ad-4',
      competitorName: 'InnovativeStartup',
      competitorDomain: 'innovative.io',
      adType: 'video',
      headline: 'The Future is Here',
      description: 'Experience cutting-edge technology that will change how you work forever.',
      callToAction: 'Try Free',
      videoUrl: '/mock-video-2.mp4',
      firstSeen: new Date('2024-06-08'),
      lastSeen: new Date(),
      isActive: true,
      platforms: ['TikTok', 'YouTube', 'Instagram'],
      estimatedReach: 95000,
      estimatedSpend: 5500,
      engagement: {
        likes: 892,
        comments: 123,
        shares: 234,
        estimatedCTR: 5.3
      },
      targeting: {
        ageRange: '18-35',
        gender: 'All',
        locations: ['United States'],
        interests: ['Technology', 'Innovation', 'Startups']
      },
      performance: {
        trend: 'up',
        score: 78
      }
    }
  ]

  const adTrends: AdTrend[] = [
    { date: '2024-05-01', newAds: 12, activeAds: 145, stoppedAds: 8, totalSpend: 245000 },
    { date: '2024-05-08', newAds: 18, activeAds: 155, stoppedAds: 5, totalSpend: 268000 },
    { date: '2024-05-15', newAds: 15, activeAds: 162, stoppedAds: 7, totalSpend: 289000 },
    { date: '2024-05-22', newAds: 22, activeAds: 177, stoppedAds: 9, totalSpend: 312000 },
    { date: '2024-05-29', newAds: 19, activeAds: 187, stoppedAds: 6, totalSpend: 335000 },
    { date: '2024-06-05', newAds: 25, activeAds: 206, stoppedAds: 4, totalSpend: 358000 },
    { date: '2024-06-12', newAds: 21, activeAds: 223, stoppedAds: 8, totalSpend: 381000 }
  ]

  const getAdTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="h-4 w-4" />
      case 'image': return <Image className="h-4 w-4" />
      case 'carousel': return <Image className="h-4 w-4" />
      case 'text': return <FileText className="h-4 w-4" />
      case 'collection': return <Image className="h-4 w-4" />
      default: return <Image className="h-4 w-4" />
    }
  }

  const getPerformanceTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'stable': return <Activity className="h-4 w-4 text-yellow-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredAds = competitorAds.filter(ad => {
    const matchesSearch = ad.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ad.competitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ad.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCompetitor = selectedCompetitor === 'all' || ad.competitorName === selectedCompetitor
    const matchesAdType = selectedAdType === 'all' || ad.adType === selectedAdType
    const matchesPlatform = selectedPlatform === 'all' || ad.platforms.includes(selectedPlatform)
    
    return matchesSearch && matchesCompetitor && matchesAdType && matchesPlatform
  })

  const sortedAds = [...filteredAds].sort((a, b) => {
    switch (sortBy) {
      case 'recent': return b.firstSeen.getTime() - a.firstSeen.getTime()
      case 'performance': return b.performance.score - a.performance.score
      case 'engagement': return b.engagement.estimatedCTR - a.engagement.estimatedCTR
      case 'spend': return b.estimatedSpend - a.estimatedSpend
      default: return 0
    }
  })

  const competitors = [...new Set(competitorAds.map(ad => ad.competitorName))]
  const adTypes = [...new Set(competitorAds.map(ad => ad.adType))]
  const platforms = [...new Set(competitorAds.flatMap(ad => ad.platforms))]

  const adTypeDistribution = adTypes.map(type => ({
    name: type,
    value: competitorAds.filter(ad => ad.adType === type).length,
    fill: type === 'video' ? '#3b82f6' : type === 'image' ? '#10b981' : 
          type === 'carousel' ? '#f59e0b' : type === 'text' ? '#8b5cf6' : '#94a3b8'
  }))

  const platformDistribution = platforms.map(platform => ({
    platform,
    activeAds: competitorAds.filter(ad => ad.platforms.includes(platform) && ad.isActive).length,
    totalAds: competitorAds.filter(ad => ad.platforms.includes(platform)).length,
    estimatedSpend: competitorAds
      .filter(ad => ad.platforms.includes(platform))
      .reduce((sum, ad) => sum + ad.estimatedSpend, 0)
  }))

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Competitor Ad Monitoring
          </CardTitle>
          <CardDescription>
            Track and analyze competitor advertising strategies across platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search ads by headline, competitor, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedCompetitor} onValueChange={setSelectedCompetitor}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Competitors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Competitors</SelectItem>
                {competitors.map(competitor => (
                  <SelectItem key={competitor} value={competitor}>{competitor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedAdType} onValueChange={setSelectedAdType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Ad Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {adTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {platforms.map(platform => (
                  <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="spend">Est. Spend</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{competitorAds.length}</div>
              <div className="text-sm text-muted-foreground">Total Ads Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {competitorAds.filter(ad => ad.isActive).length}
              </div>
              <div className="text-sm text-muted-foreground">Currently Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(competitorAds.reduce((sum, ad) => sum + ad.estimatedSpend, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Est. Total Spend</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(competitorAds.reduce((sum, ad) => sum + ad.engagement.estimatedCTR, 0) / competitorAds.length).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg CTR</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="ads" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ads">Ad Library</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="ads" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedAds.map(ad => (
              <Card key={ad.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getAdTypeIcon(ad.adType)}
                      <Badge variant="outline" className="capitalize">{ad.adType}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPerformanceTrendIcon(ad.performance.trend)}
                      <Badge className={ad.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {ad.isActive ? 'Active' : 'Stopped'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg leading-tight">{ad.headline}</CardTitle>
                    <CardDescription className="text-sm">{ad.competitorName}</CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {(ad.imageUrl || ad.videoUrl) && (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      {ad.adType === 'video' ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Play className="h-8 w-8" />
                          <span>Video Ad</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Image className="h-8 w-8" />
                          <span>Image Ad</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{ad.description}</p>
                    <Button size="sm" variant="outline" className="w-full">
                      {ad.callToAction}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Est. Reach:</span>
                      <span className="ml-2 font-medium">{ad.estimatedReach.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Est. Spend:</span>
                      <span className="ml-2 font-medium">{formatCurrency(ad.estimatedSpend)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">CTR:</span>
                      <span className="ml-2 font-medium">{ad.engagement.estimatedCTR.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Score:</span>
                      <span className="ml-2 font-medium">{ad.performance.score}/100</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Globe className="h-3 w-3" />
                      <span className="text-muted-foreground">Platforms:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {ad.platforms.map(platform => (
                        <Badge key={platform} variant="secondary" className="text-xs">{platform}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>First seen: {ad.firstSeen.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Bookmark className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        <span>{ad.engagement.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{ad.engagement.comments}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Share className="h-3 w-3" />
                        <span>{ad.engagement.shares}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {sortedAds.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No ads found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or filters
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ad Activity Trends</CardTitle>
                <CardDescription>New, active, and stopped ads over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={adTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="newAds" stroke="#3b82f6" strokeWidth={2} name="New Ads" />
                    <Line type="monotone" dataKey="activeAds" stroke="#10b981" strokeWidth={2} name="Active Ads" />
                    <Line type="monotone" dataKey="stoppedAds" stroke="#ef4444" strokeWidth={2} name="Stopped Ads" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estimated Spend Trends</CardTitle>
                <CardDescription>Total estimated advertising spend over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={adTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      formatter={(value) => formatCurrency(value as number)}
                    />
                    <Bar dataKey="totalSpend" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Platform Distribution</CardTitle>
              <CardDescription>Ad distribution and spend across platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platformDistribution.map(platform => (
                  <div key={platform.platform} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{platform.platform}</span>
                      <div className="text-sm text-muted-foreground">
                        {platform.activeAds} active / {platform.totalAds} total
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Progress value={(platform.activeAds / platform.totalAds) * 100} className="flex-1 h-2" />
                      <span className="text-sm font-medium min-w-20">
                        {formatCurrency(platform.estimatedSpend)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ad Type Distribution</CardTitle>
                <CardDescription>Distribution of ad formats being used</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={adTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {adTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Analysis</CardTitle>
                <CardDescription>Ad performance scores and engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competitors.map(competitor => {
                    const competitorAdsData = competitorAds.filter(ad => ad.competitorName === competitor)
                    const avgScore = competitorAdsData.reduce((sum, ad) => sum + ad.performance.score, 0) / competitorAdsData.length
                    const avgCTR = competitorAdsData.reduce((sum, ad) => sum + ad.engagement.estimatedCTR, 0) / competitorAdsData.length
                    const totalSpend = competitorAdsData.reduce((sum, ad) => sum + ad.estimatedSpend, 0)
                    
                    return (
                      <div key={competitor} className="border rounded p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{competitor}</h4>
                          <Badge variant="outline">{competitorAdsData.length} ads</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Avg Score</div>
                            <div className="font-medium">{avgScore.toFixed(0)}/100</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Avg CTR</div>
                            <div className="font-medium">{avgCTR.toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Total Spend</div>
                            <div className="font-medium">{formatCurrency(totalSpend)}</div>
                          </div>
                        </div>
                        <Progress value={avgScore} className="mt-2 h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Strategic observations from competitor ad analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Video Content Surge:</strong> 40% increase in video ad adoption 
                      over the past month, with higher engagement rates (+28% CTR).
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Mobile-First Creative:</strong> Top-performing ads are optimized 
                      for mobile viewing with vertical or square formats.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Seasonal Messaging:</strong> Competitors are heavily leveraging 
                      summer themes and limited-time offers in their current campaigns.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Competitive Opportunities</CardTitle>
                <CardDescription>Gaps and opportunities identified in competitor strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="border rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium">Underutilized Platforms</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      TikTok and YouTube Shorts show limited competitor presence 
                      despite high engagement potential.
                    </p>
                  </div>

                  <div className="border rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium">Creative Format Gap</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Interactive and user-generated content formats are rarely used 
                      by competitors, presenting differentiation opportunity.
                    </p>
                  </div>

                  <div className="border rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium">Messaging Opportunity</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sustainability and social responsibility messaging is underrepresented 
                      in current competitor campaigns.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
              <CardDescription>Strategic recommendations based on competitive analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Accelerate Video Content Production</h4>
                    <p className="text-sm text-muted-foreground">
                      Increase video ad investment by 40% to match industry trends and capitalize on higher engagement rates.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Expand Platform Presence</h4>
                    <p className="text-sm text-muted-foreground">
                      Test campaigns on TikTok and YouTube Shorts where competitor presence is limited but audience engagement is high.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Develop Interactive Creative Formats</h4>
                    <p className="text-sm text-muted-foreground">
                      Experiment with polls, AR filters, and user-generated content to differentiate from competitor approaches.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Incorporate Sustainability Messaging</h4>
                    <p className="text-sm text-muted-foreground">
                      Leverage sustainability and social responsibility themes to appeal to conscious consumers and differentiate from competitors.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}