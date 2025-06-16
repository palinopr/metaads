"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
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
  Scatter,
  ScatterChart,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Activity,
  BarChart3,
  PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Maximize2,
  Search,
  Calendar,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MousePointer,
  ShoppingCart,
} from "lucide-react"

interface Campaign {
  id: string
  name: string
  status: string
  spend: number
  revenue: number
  roas: number
  impressions: number
  clicks: number
  ctr: number
  conversions: number
}

interface AdvancedDashboardProps {
  campaigns: Campaign[]
  overview: any
}

export function AdvancedDashboard({ campaigns, overview }: AdvancedDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('spend')
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'analytics'>('analytics')

  // Filter and sort campaigns
  const processedCampaigns = useMemo(() => {
    let filtered = campaigns.filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
      return matchesSearch && matchesStatus
    })

    // Sort campaigns
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'spend':
          return b.spend - a.spend
        case 'revenue':
          return b.revenue - a.revenue
        case 'roas':
          return b.roas - a.roas
        case 'conversions':
          return b.conversions - a.conversions
        default:
          return 0
      }
    })

    return filtered
  }, [campaigns, searchTerm, statusFilter, sortBy])

  // Calculate metrics by status
  const metricsByStatus = useMemo(() => {
    const active = campaigns.filter(c => c.status === 'ACTIVE')
    const paused = campaigns.filter(c => c.status === 'PAUSED')
    
    return {
      active: {
        count: active.length,
        spend: active.reduce((sum, c) => sum + c.spend, 0),
        revenue: active.reduce((sum, c) => sum + c.revenue, 0),
      },
      paused: {
        count: paused.length,
        spend: paused.reduce((sum, c) => sum + c.spend, 0),
        revenue: paused.reduce((sum, c) => sum + c.revenue, 0),
      }
    }
  }, [campaigns])

  // Top performers
  const topPerformers = useMemo(() => {
    return [...campaigns]
      .filter(c => c.revenue > 0)
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 5)
  }, [campaigns])

  // Underperformers
  const underperformers = useMemo(() => {
    return campaigns
      .filter(c => c.spend > 100 && c.roas < 1)
      .sort((a, b) => a.roas - b.roas)
      .slice(0, 5)
  }, [campaigns])

  // Group campaigns by performance tiers
  const performanceTiers = useMemo(() => {
    const tiers = {
      excellent: campaigns.filter(c => c.roas >= 5),
      good: campaigns.filter(c => c.roas >= 2 && c.roas < 5),
      average: campaigns.filter(c => c.roas >= 1 && c.roas < 2),
      poor: campaigns.filter(c => c.roas < 1 && c.spend > 0),
      inactive: campaigns.filter(c => c.spend === 0),
    }
    
    return Object.entries(tiers).map(([tier, campaigns]) => ({
      tier,
      count: campaigns.length,
      spend: campaigns.reduce((sum, c) => sum + c.spend, 0),
      revenue: campaigns.reduce((sum, c) => sum + c.revenue, 0),
    }))
  }, [campaigns])

  // Spending distribution data
  const spendingDistribution = useMemo(() => {
    const ranges = [
      { range: '$0', min: 0, max: 0 },
      { range: '$1-100', min: 1, max: 100 },
      { range: '$100-500', min: 100, max: 500 },
      { range: '$500-1K', min: 500, max: 1000 },
      { range: '$1K-5K', min: 1000, max: 5000 },
      { range: '$5K+', min: 5000, max: Infinity },
    ]

    return ranges.map(({ range, min, max }) => ({
      range,
      campaigns: campaigns.filter(c => c.spend >= min && c.spend < max).length,
      totalSpend: campaigns
        .filter(c => c.spend >= min && c.spend < max)
        .reduce((sum, c) => sum + c.spend, 0),
    }))
  }, [campaigns])

  // Performance scatter data
  const scatterData = useMemo(() => {
    return campaigns
      .filter(c => c.spend > 0)
      .map(c => ({
        x: c.spend,
        y: c.roas,
        z: c.conversions,
        name: c.name,
        status: c.status,
      }))
  }, [campaigns])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  return (
    <div className="space-y-6">
      {/* Advanced Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Campaign Intelligence Center</h2>
          <p className="text-muted-foreground">
            Analyzing {campaigns.length} campaigns with AI-powered insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'analytics' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('analytics')}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Analytics
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <Activity className="h-4 w-4 mr-1" />
            Table
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            <PieChartIcon className="h-4 w-4 mr-1" />
            Cards
          </Button>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground truncate">
              {topPerformers[0]?.name || 'N/A'}
            </p>
            <p className="text-lg font-bold text-green-600">
              {topPerformers[0]?.roas.toFixed(2)}x ROAS
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-red-600">{underperformers.length}</p>
            <p className="text-xs text-muted-foreground">
              Campaigns below 1x ROAS
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Active Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-blue-600">
              {metricsByStatus.active.count > 0
                ? (metricsByStatus.active.revenue / metricsByStatus.active.spend).toFixed(2)
                : '0'}x
            </p>
            <p className="text-xs text-muted-foreground">
              Active campaigns ROAS
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-purple-600">
              {formatCurrency(metricsByStatus.paused.revenue)}
            </p>
            <p className="text-xs text-muted-foreground">
              Revenue from paused campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'analytics' && (
        <>
          {/* Performance Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Tiers</CardTitle>
                <CardDescription>Campaign distribution by ROAS performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceTiers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tier" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatNumber(value)} />
                    <Bar dataKey="count" fill="#8884d8" name="Campaigns">
                      {performanceTiers.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spending Distribution</CardTitle>
                <CardDescription>Campaigns grouped by spend ranges</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={spendingDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ range, campaigns }) => `${range}: ${campaigns}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="campaigns"
                    >
                      {spendingDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Scatter Plot */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Matrix</CardTitle>
              <CardDescription>
                Spend vs ROAS analysis (bubble size = conversions)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Spend"
                    tickFormatter={(value) => `$${value}`}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="ROAS"
                    tickFormatter={(value) => `${value}x`}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background p-2 border rounded shadow-lg">
                            <p className="text-sm font-medium">{data.name}</p>
                            <p className="text-xs">Spend: {formatCurrency(data.x)}</p>
                            <p className="text-xs">ROAS: {data.y.toFixed(2)}x</p>
                            <p className="text-xs">Conversions: {data.z}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Scatter
                    name="Campaigns"
                    data={scatterData}
                    fill="#8884d8"
                  >
                    {scatterData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.status === 'ACTIVE' ? '#00C49F' : '#FF8042'}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top & Bottom Performers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.map((campaign, i) => (
                    <div key={campaign.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-green-600">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {campaign.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(campaign.spend)} spent
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {campaign.roas.toFixed(2)}x
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Need Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {underperformers.map((campaign, i) => (
                    <div key={campaign.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-red-600">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {campaign.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(campaign.spend)} spent
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        {campaign.roas.toFixed(2)}x
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {viewMode === 'table' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Campaign Details</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spend">Sort by Spend</SelectItem>
                    <SelectItem value="revenue">Sort by Revenue</SelectItem>
                    <SelectItem value="roas">Sort by ROAS</SelectItem>
                    <SelectItem value="conversions">Sort by Conversions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Campaign</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-right">Spend</th>
                    <th className="p-2 text-right">Revenue</th>
                    <th className="p-2 text-right">ROAS</th>
                    <th className="p-2 text-right">Conversions</th>
                    <th className="p-2 text-right">CTR</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processedCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div>
                          <p className="font-medium text-sm">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(campaign.impressions)} impressions
                          </p>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge
                          variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">{formatCurrency(campaign.spend)}</td>
                      <td className="p-2 text-right">{formatCurrency(campaign.revenue)}</td>
                      <td className="p-2 text-right">
                        <span
                          className={
                            campaign.roas >= 2
                              ? 'text-green-600 font-medium'
                              : campaign.roas >= 1
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }
                        >
                          {campaign.roas.toFixed(2)}x
                        </span>
                      </td>
                      <td className="p-2 text-right">{formatNumber(campaign.conversions)}</td>
                      <td className="p-2 text-right">{campaign.ctr.toFixed(2)}%</td>
                      <td className="p-2 text-right">
                        <Button size="sm" variant="ghost">
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedCampaigns.slice(0, 12).map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium line-clamp-2">
                    {campaign.name}
                  </CardTitle>
                  <Badge
                    variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className="text-xs ml-2"
                  >
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Spend</p>
                    <p className="font-medium">{formatCurrency(campaign.spend)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="font-medium">{formatCurrency(campaign.revenue)}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">ROAS</p>
                    <p className={`font-bold text-lg ${
                      campaign.roas >= 2 ? 'text-green-600' : 
                      campaign.roas >= 1 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {campaign.roas.toFixed(2)}x
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Conversions</p>
                    <p className="font-medium">{formatNumber(campaign.conversions)}</p>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatNumber(campaign.impressions)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointer className="h-3 w-3" />
                      {campaign.ctr.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}