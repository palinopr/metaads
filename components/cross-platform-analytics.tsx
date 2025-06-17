"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Facebook,
  Instagram,
  Youtube,
  ShoppingBag,
  Mail,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  MousePointer,
  ShoppingCart,
  Target,
  Zap,
  Activity,
  PieChart,
  ArrowUp,
  ArrowDown,
  Link,
  Globe,
  Smartphone,
  Monitor,
  Calendar,
  Download,
  RefreshCw,
  Settings,
  Info,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronRight,
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from 'recharts'
import { motion } from "framer-motion"

// Platform icons mapping
const platformIcons = {
  meta: Facebook,
  instagram: Instagram,
  google: Globe,
  youtube: Youtube,
  tiktok: Activity,
  shopify: ShoppingBag,
  klaviyo: Mail,
}

interface CrossPlatformAnalyticsProps {
  campaigns: any[]
}

export function CrossPlatformAnalytics({ campaigns }: CrossPlatformAnalyticsProps) {
  const [dateRange, setDateRange] = useState('last_30_days')
  const [compareMode, setCompareMode] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState(['meta', 'google', 'tiktok'])

  // Mock cross-platform data
  const platformData = {
    meta: {
      spend: 23162,
      revenue: 161789,
      roas: 6.98,
      impressions: 2847293,
      clicks: 68974,
      ctr: 2.42,
      conversions: 2747,
      cpc: 0.34,
      cpa: 8.43,
    },
    google: {
      spend: 18750,
      revenue: 93750,
      roas: 5.0,
      impressions: 1523000,
      clicks: 45690,
      ctr: 3.0,
      conversions: 1875,
      cpc: 0.41,
      cpa: 10.0,
    },
    tiktok: {
      spend: 8500,
      revenue: 51000,
      roas: 6.0,
      impressions: 980000,
      clicks: 29400,
      ctr: 3.0,
      conversions: 850,
      cpc: 0.29,
      cpa: 10.0,
    },
    shopify: {
      revenue: 306539,
      orders: 5472,
      aov: 56.04,
      conversionRate: 2.8,
      returningCustomerRate: 0.34,
      cartAbandonmentRate: 0.68,
    },
    klaviyo: {
      emailsSent: 125000,
      openRate: 0.24,
      clickRate: 0.032,
      revenue: 45000,
      subscribers: 25000,
      unsubscribeRate: 0.002,
    },
  }

  // Calculate unified metrics
  const unifiedMetrics = {
    totalSpend: Object.entries(platformData)
      .filter(([key]) => ['meta', 'google', 'tiktok'].includes(key))
      .reduce((sum, [_, data]: any) => sum + (data.spend || 0), 0),
    totalRevenue: platformData.shopify.revenue,
    overallROAS: 0,
    totalImpressions: Object.entries(platformData)
      .filter(([key]) => ['meta', 'google', 'tiktok'].includes(key))
      .reduce((sum, [_, data]: any) => sum + (data.impressions || 0), 0),
    totalClicks: Object.entries(platformData)
      .filter(([key]) => ['meta', 'google', 'tiktok'].includes(key))
      .reduce((sum, [_, data]: any) => sum + (data.clicks || 0), 0),
    totalConversions: Object.entries(platformData)
      .filter(([key]) => ['meta', 'google', 'tiktok'].includes(key))
      .reduce((sum, [_, data]: any) => sum + (data.conversions || 0), 0),
    avgCTR: 0,
    avgCPA: 0,
  }
  
  unifiedMetrics.overallROAS = unifiedMetrics.totalSpend > 0 ? unifiedMetrics.totalRevenue / unifiedMetrics.totalSpend : 0
  unifiedMetrics.avgCTR = unifiedMetrics.totalImpressions > 0 ? (unifiedMetrics.totalClicks / unifiedMetrics.totalImpressions) * 100 : 0
  unifiedMetrics.avgCPA = unifiedMetrics.totalConversions > 0 ? unifiedMetrics.totalSpend / unifiedMetrics.totalConversions : 0

  // Time series data for charts
  const timeSeriesData = [
    { date: 'Jan 1', meta: 4500, google: 3200, tiktok: 1800, total: 9500 },
    { date: 'Jan 7', meta: 5200, google: 3800, tiktok: 2100, total: 11100 },
    { date: 'Jan 14', meta: 6100, google: 4200, tiktok: 2400, total: 12700 },
    { date: 'Jan 21', meta: 5800, google: 4500, tiktok: 2800, total: 13100 },
    { date: 'Jan 28', meta: 6500, google: 4800, tiktok: 3200, total: 14500 },
  ]

  // Funnel data
  const funnelData = [
    { stage: 'Impressions', value: unifiedMetrics.totalImpressions, percentage: 100 },
    { stage: 'Clicks', value: unifiedMetrics.totalClicks, percentage: (unifiedMetrics.totalClicks / unifiedMetrics.totalImpressions) * 100 },
    { stage: 'Add to Cart', value: Math.floor(unifiedMetrics.totalClicks * 0.15), percentage: 15 },
    { stage: 'Initiate Checkout', value: Math.floor(unifiedMetrics.totalClicks * 0.08), percentage: 8 },
    { stage: 'Purchases', value: unifiedMetrics.totalConversions, percentage: (unifiedMetrics.totalConversions / unifiedMetrics.totalClicks) * 100 },
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                Cross-Platform Analytics
                <Badge className="bg-white/20 text-white border-0">UNIFIED</Badge>
              </CardTitle>
              <CardDescription className="text-white/90">
                All your marketing channels in one powerful dashboard
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="secondary" className="bg-white text-purple-600 hover:bg-white/90">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync All
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Platform Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { platform: 'meta', name: 'Meta', status: 'connected', lastSync: '2 min ago' },
          { platform: 'google', name: 'Google', status: 'connected', lastSync: '5 min ago' },
          { platform: 'tiktok', name: 'TikTok', status: 'connected', lastSync: '10 min ago' },
          { platform: 'shopify', name: 'Shopify', status: 'connected', lastSync: '1 min ago' },
          { platform: 'klaviyo', name: 'Klaviyo', status: 'connected', lastSync: '15 min ago' },
          { platform: 'ga4', name: 'GA4', status: 'not_connected', lastSync: 'Never' },
        ].map((platform) => {
          const Icon = platformIcons[platform.platform as keyof typeof platformIcons] || Globe
          return (
            <Card key={platform.platform} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-5 w-5" />
                  {platform.status === 'connected' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <p className="font-medium">{platform.name}</p>
                <p className="text-xs text-muted-foreground">
                  {platform.status === 'connected' ? platform.lastSync : 'Not connected'}
                </p>
                {platform.status !== 'connected' && (
                  <Button size="sm" variant="link" className="p-0 h-auto text-xs mt-1">
                    Connect <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Unified Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <Badge variant="secondary">All Platforms</Badge>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(unifiedMetrics.totalSpend)}</p>
            <p className="text-sm text-muted-foreground">Total Ad Spend</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <div className="flex -space-x-1">
                {['meta', 'google', 'tiktok'].map((platform) => {
                  const Icon = platformIcons[platform as keyof typeof platformIcons]
                  return (
                    <div key={platform} className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                      <Icon className="h-3 w-3" />
                    </div>
                  )
                })}
              </div>
              <span className="text-muted-foreground">3 platforms</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-xs text-green-600 flex items-center gap-1">
                <ArrowUp className="h-3 w-3" />
                {((unifiedMetrics.overallROAS - 5) / 5 * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(unifiedMetrics.totalRevenue)}</p>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-xs text-green-600 mt-2">
              {unifiedMetrics.overallROAS.toFixed(2)}x Blended ROAS
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <MousePointer className="h-5 w-5 text-purple-500" />
              <Badge variant="secondary">{unifiedMetrics.avgCTR.toFixed(2)}%</Badge>
            </div>
            <p className="text-2xl font-bold">{formatNumber(unifiedMetrics.totalClicks)}</p>
            <p className="text-sm text-muted-foreground">Total Clicks</p>
            <Progress value={unifiedMetrics.avgCTR * 20} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="h-5 w-5 text-orange-500" />
              <span className="text-xs text-muted-foreground">
                ${unifiedMetrics.avgCPA.toFixed(2)} CPA
              </span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(unifiedMetrics.totalConversions)}</p>
            <p className="text-sm text-muted-foreground">Total Conversions</p>
            <p className="text-xs text-orange-600 mt-2">
              {platformData.shopify.conversionRate.toFixed(1)}% site CVR
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend by Platform</CardTitle>
                <CardDescription>
                  Track performance across all connected platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <defs>
                      <linearGradient id="colorMeta" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorGoogle" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorTikTok" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Area
                      type="monotone"
                      dataKey="meta"
                      stackId="1"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorMeta)"
                    />
                    <Area
                      type="monotone"
                      dataKey="google"
                      stackId="1"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#colorGoogle)"
                    />
                    <Area
                      type="monotone"
                      dataKey="tiktok"
                      stackId="1"
                      stroke="#F59E0B"
                      fillOpacity={1}
                      fill="url(#colorTikTok)"
                    />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Platform Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Spend & Revenue Distribution</CardTitle>
                <CardDescription>
                  See where your budget goes and revenue comes from
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Spend by Platform</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <RePieChart>
                        <Pie
                          data={[
                            { name: 'Meta', value: platformData.meta.spend },
                            { name: 'Google', value: platformData.google.spend },
                            { name: 'TikTok', value: platformData.tiktok.spend },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Revenue by Source</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <RePieChart>
                        <Pie
                          data={[
                            { name: 'Paid Ads', value: unifiedMetrics.totalRevenue * 0.6 },
                            { name: 'Email', value: platformData.klaviyo.revenue },
                            { name: 'Organic', value: unifiedMetrics.totalRevenue * 0.25 },
                            { name: 'Direct', value: unifiedMetrics.totalRevenue * 0.15 },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {[
                      { name: 'Meta', value: platformData.meta.spend, color: '#3B82F6' },
                      { name: 'Google', value: platformData.google.spend, color: '#10B981' },
                      { name: 'TikTok', value: platformData.tiktok.spend, color: '#F59E0B' },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: 'Paid Ads', value: unifiedMetrics.totalRevenue * 0.6, color: '#3B82F6' },
                      { name: 'Email', value: platformData.klaviyo.revenue, color: '#10B981' },
                      { name: 'Organic', value: unifiedMetrics.totalRevenue * 0.25, color: '#F59E0B' },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance Comparison</CardTitle>
              <CardDescription>
                Compare key metrics across your advertising platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Platform</th>
                      <th className="text-right p-2">Spend</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">ROAS</th>
                      <th className="text-right p-2">CTR</th>
                      <th className="text-right p-2">CPC</th>
                      <th className="text-right p-2">CPA</th>
                      <th className="text-right p-2">Conversions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['meta', 'google', 'tiktok'].map((platform) => {
                      const data = platformData[platform as keyof typeof platformData] as any
                      const Icon = platformIcons[platform as keyof typeof platformIcons]
                      return (
                        <tr key={platform} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span className="capitalize">{platform}</span>
                            </div>
                          </td>
                          <td className="text-right p-2">{formatCurrency(data.spend)}</td>
                          <td className="text-right p-2 text-green-600">
                            {formatCurrency(data.revenue)}
                          </td>
                          <td className="text-right p-2 font-medium">
                            <span className={data.roas >= 5 ? 'text-green-600' : 'text-yellow-600'}>
                              {data.roas.toFixed(2)}x
                            </span>
                          </td>
                          <td className="text-right p-2">{data.ctr.toFixed(2)}%</td>
                          <td className="text-right p-2">${data.cpc.toFixed(2)}</td>
                          <td className="text-right p-2">${data.cpa.toFixed(2)}</td>
                          <td className="text-right p-2">{formatNumber(data.conversions)}</td>
                        </tr>
                      )
                    })}
                    <tr className="font-medium bg-muted/50">
                      <td className="p-2">Total</td>
                      <td className="text-right p-2">{formatCurrency(unifiedMetrics.totalSpend)}</td>
                      <td className="text-right p-2 text-green-600">
                        {formatCurrency(unifiedMetrics.totalRevenue)}
                      </td>
                      <td className="text-right p-2">
                        <span className="text-green-600">
                          {unifiedMetrics.overallROAS.toFixed(2)}x
                        </span>
                      </td>
                      <td className="text-right p-2">{unifiedMetrics.avgCTR.toFixed(2)}%</td>
                      <td className="text-right p-2">-</td>
                      <td className="text-right p-2">${unifiedMetrics.avgCPA.toFixed(2)}</td>
                      <td className="text-right p-2">{formatNumber(unifiedMetrics.totalConversions)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Platform Customer Journey</CardTitle>
              <CardDescription>
                Visualize how users move through your marketing funnel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData.map((stage, index) => (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium">{stage.stage}</div>
                      <div className="flex-1">
                        <div className="relative h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stage.percentage}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500"
                          />
                          <div className="absolute inset-0 flex items-center justify-between px-4">
                            <span className="text-sm font-medium text-white">
                              {formatNumber(stage.value)}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {stage.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < funnelData.length - 1 && (
                      <div className="ml-16 h-4 w-0.5 bg-gray-300 dark:bg-gray-700" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">Click-to-Cart Rate</p>
                    <p className="text-2xl font-bold">15%</p>
                    <p className="text-xs text-muted-foreground">Industry avg: 12%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">Cart-to-Purchase Rate</p>
                    <p className="text-2xl font-bold">
                      {(100 - platformData.shopify.cartAbandonmentRate * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Industry avg: 30%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">Overall CVR</p>
                    <p className="text-2xl font-bold">
                      {((unifiedMetrics.totalConversions / unifiedMetrics.totalClicks) * 100).toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Industry avg: 2.5%</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Platform Deep Dives */}
            {Object.entries(platformData).slice(0, 4).map(([platform, data]) => {
              const Icon = platformIcons[platform as keyof typeof platformIcons]
              return (
                <Card key={platform}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <span className="capitalize">{platform}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(data).slice(0, 6).map(([metric, value]) => (
                        <div key={metric}>
                          <p className="text-sm text-muted-foreground capitalize">
                            {metric.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="text-lg font-medium">
                            {typeof value === 'number' ? 
                              metric.includes('rate') || metric === 'ctr' ? 
                                `${(value * (value < 1 ? 100 : 1)).toFixed(2)}%` :
                              metric.includes('spend') || metric.includes('revenue') || metric === 'aov' ?
                                formatCurrency(value) :
                              formatNumber(value)
                            : value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="attribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Touch Attribution</CardTitle>
              <CardDescription>
                Understand how different touchpoints contribute to conversions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Using data-driven attribution model based on machine learning
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  {[
                    { channel: 'Meta (First Touch)', credit: 35, conversions: 962 },
                    { channel: 'Google (Search)', credit: 28, conversions: 770 },
                    { channel: 'Email (Nurture)', credit: 15, conversions: 413 },
                    { channel: 'TikTok (Discovery)', credit: 12, conversions: 330 },
                    { channel: 'Direct (Last Touch)', credit: 10, conversions: 275 },
                  ].map((item) => (
                    <div key={item.channel} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.channel}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.credit}% credit • {item.conversions} conversions
                        </span>
                      </div>
                      <Progress value={item.credit} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Cross-Platform Insights</CardTitle>
              <CardDescription>
                Actionable recommendations based on unified data analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    title: 'Shift budget from Google to TikTok',
                    description: 'TikTok is showing 20% better CPA with similar quality conversions',
                    impact: '+$12,500 monthly revenue',
                    confidence: 92,
                    priority: 'high',
                  },
                  {
                    title: 'Increase email frequency for high-value segments',
                    description: 'Top 20% of customers show 3.2x higher engagement with weekly emails',
                    impact: '+$8,000 from email revenue',
                    confidence: 87,
                    priority: 'high',
                  },
                  {
                    title: 'Launch retargeting on TikTok',
                    description: 'Missing 45% of cart abandoners who are active on TikTok',
                    impact: '+15% conversion recovery',
                    confidence: 78,
                    priority: 'medium',
                  },
                  {
                    title: 'Optimize for mobile conversions',
                    description: '68% of traffic is mobile but only 42% of conversions',
                    impact: '+$18,000 potential revenue',
                    confidence: 95,
                    priority: 'high',
                  },
                ].map((insight, index) => (
                  <Card
                    key={index}
                    className={`border-l-4 ${
                      insight.priority === 'high' ? 'border-l-red-500' : 'border-l-yellow-500'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            {insight.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {insight.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-green-600 font-medium">
                              {insight.impact}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {insight.confidence}% confidence
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm">Apply</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}