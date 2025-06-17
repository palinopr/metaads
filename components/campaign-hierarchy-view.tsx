"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Image,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  MousePointer,
  ShoppingCart,
  Search,
  Filter,
  Download,
  BarChart3,
  Settings,
  Copy,
  MoreVertical,
  Calendar,
  Clock,
  Target,
  Zap,
  Activity,
  Info,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  RefreshCw,
  Sparkles,
  Layers,
  Grid3x3,
  ListTree,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EnhancedMetaAPIClient } from "@/lib/meta-api-client-enhanced"
import { CredentialManager } from "@/lib/credential-manager"
import { toast } from "sonner"
import { CampaignDetailAnalytics } from "./campaign-detail-analytics"

interface AdCreative {
  id: string
  name: string
  status: string
  thumbnail_url?: string
  video_url?: string
  link_url?: string
  call_to_action_type?: string
}

interface Ad {
  id: string
  name: string
  status: string
  effective_status: string
  creative?: AdCreative
  insights?: {
    spend: number
    impressions: number
    clicks: number
    ctr: number
    conversions: number
    revenue: number
  }
}

interface AdSet {
  id: string
  name: string
  status: string
  effective_status: string
  daily_budget?: number
  lifetime_budget?: number
  bid_amount?: number
  targeting?: any
  ads?: Ad[]
  insights?: {
    spend: number
    impressions: number
    clicks: number
    ctr: number
    conversions: number
    revenue: number
  }
}

interface CampaignWithHierarchy {
  id: string
  name: string
  status: string
  effective_status: string
  objective?: string
  spend: number
  revenue: number
  roas: number
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  adsets?: AdSet[]
  expanded?: boolean
}

interface CampaignHierarchyViewProps {
  campaigns: any[]
}

export function CampaignHierarchyView({ campaigns }: CampaignHierarchyViewProps) {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set())
  const [loadingCampaigns, setLoadingCampaigns] = useState<Set<string>>(new Set())
  const [loadingAdSets, setLoadingAdSets] = useState<Set<string>>(new Set())
  const [campaignData, setCampaignData] = useState<Map<string, CampaignWithHierarchy>>(new Map())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedCampaignForAnalytics, setSelectedCampaignForAnalytics] = useState<any>(null)

  // Fetch campaign details (ad sets and ads)
  const fetchCampaignDetails = async (campaignId: string) => {
    setLoadingCampaigns(prev => new Set(prev).add(campaignId))
    
    try {
      const credentials = await CredentialManager.load()
      if (!credentials) {
        throw new Error("No credentials found")
      }

      // Fetch ad sets for the campaign
      const response = await fetch("/api/campaign-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          accessToken: credentials.accessToken,
          adAccountId: credentials.adAccountId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch campaign details")
      }

      const data = await response.json()
      
      // Update campaign data with ad sets
      setCampaignData(prev => {
        const updated = new Map(prev)
        const campaign = campaigns.find(c => c.id === campaignId)
        if (campaign) {
          updated.set(campaignId, {
            ...campaign,
            adsets: data.adsets || [],
            expanded: true,
          })
        }
        return updated
      })
    } catch (error) {
      console.error("Error fetching campaign details:", error)
      toast.error("Failed to load campaign details")
    } finally {
      setLoadingCampaigns(prev => {
        const updated = new Set(prev)
        updated.delete(campaignId)
        return updated
      })
    }
  }

  // Fetch ad set details (ads)
  const fetchAdSetDetails = async (adSetId: string, campaignId: string) => {
    setLoadingAdSets(prev => new Set(prev).add(adSetId))
    
    try {
      const credentials = await CredentialManager.load()
      if (!credentials) {
        throw new Error("No credentials found")
      }

      // Fetch ads for the ad set
      const response = await fetch("/api/adset-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adSetId,
          accessToken: credentials.accessToken,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch ad set details")
      }

      const data = await response.json()
      
      // Update ad set data with ads
      setCampaignData(prev => {
        const updated = new Map(prev)
        const campaign = updated.get(campaignId)
        if (campaign && campaign.adsets) {
          const adSetIndex = campaign.adsets.findIndex(as => as.id === adSetId)
          if (adSetIndex !== -1) {
            campaign.adsets[adSetIndex] = {
              ...campaign.adsets[adSetIndex],
              ads: data.ads || [],
            }
          }
        }
        return updated
      })
    } catch (error) {
      console.error("Error fetching ad set details:", error)
      toast.error("Failed to load ad details")
    } finally {
      setLoadingAdSets(prev => {
        const updated = new Set(prev)
        updated.delete(adSetId)
        return updated
      })
    }
  }

  // Toggle campaign expansion
  const toggleCampaign = async (campaignId: string) => {
    const isExpanded = expandedCampaigns.has(campaignId)
    
    if (isExpanded) {
      setExpandedCampaigns(prev => {
        const updated = new Set(prev)
        updated.delete(campaignId)
        return updated
      })
    } else {
      setExpandedCampaigns(prev => new Set(prev).add(campaignId))
      
      // Fetch campaign details if not already loaded
      if (!campaignData.has(campaignId)) {
        await fetchCampaignDetails(campaignId)
      }
    }
  }

  // Toggle ad set expansion
  const toggleAdSet = async (adSetId: string, campaignId: string) => {
    const isExpanded = expandedAdSets.has(adSetId)
    
    if (isExpanded) {
      setExpandedAdSets(prev => {
        const updated = new Set(prev)
        updated.delete(adSetId)
        return updated
      })
    } else {
      setExpandedAdSets(prev => new Set(prev).add(adSetId))
      
      // Fetch ad set details if not already loaded
      const campaign = campaignData.get(campaignId)
      const adSet = campaign?.adsets?.find(as => as.id === adSetId)
      if (adSet && !adSet.ads) {
        await fetchAdSetDetails(adSetId, campaignId)
      }
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20'
      case 'DELETED':
      case 'ARCHIVED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20'
    }
  }

  const getObjectiveIcon = (objective?: string) => {
    switch (objective?.toUpperCase()) {
      case 'CONVERSIONS':
      case 'OUTCOME_SALES':
        return <ShoppingCart className="h-4 w-4" />
      case 'LINK_CLICKS':
      case 'OUTCOME_TRAFFIC':
        return <MousePointer className="h-4 w-4" />
      case 'IMPRESSIONS':
      case 'REACH':
      case 'OUTCOME_AWARENESS':
        return <Eye className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
    }
  }

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const active = filteredCampaigns.filter(c => c.status === 'ACTIVE')
    const totalSpend = filteredCampaigns.reduce((sum, c) => sum + c.spend, 0)
    const totalRevenue = filteredCampaigns.reduce((sum, c) => sum + c.revenue, 0)
    const totalImpressions = filteredCampaigns.reduce((sum, c) => sum + c.impressions, 0)
    const totalClicks = filteredCampaigns.reduce((sum, c) => sum + c.clicks, 0)
    const totalConversions = filteredCampaigns.reduce((sum, c) => sum + c.conversions, 0)
    
    return {
      activeCampaigns: active.length,
      totalCampaigns: filteredCampaigns.length,
      totalSpend,
      totalRevenue,
      avgROAS: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      totalImpressions,
      totalClicks,
      avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      totalConversions,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
    }
  }, [filteredCampaigns])

  const [viewMode, setViewMode] = useState<'hierarchy' | 'grid' | 'compact'>('hierarchy')
  const [selectedMetric, setSelectedMetric] = useState<'spend' | 'revenue' | 'roas' | 'ctr'>('roas')

  if (selectedCampaignForAnalytics) {
    return (
      <CampaignDetailAnalytics
        campaign={selectedCampaignForAnalytics}
        onBack={() => setSelectedCampaignForAnalytics(null)}
      />
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Layers className="h-5 w-5 opacity-80" />
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                {summaryMetrics.activeCampaigns}/{summaryMetrics.totalCampaigns} active
              </span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalSpend)}</p>
            <p className="text-sm opacity-90">Total Spend</p>
            <Progress value={(summaryMetrics.activeCampaigns / summaryMetrics.totalCampaigns) * 100} className="mt-2 h-1 bg-white/20" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 opacity-80" />
              <span className="text-xs bg-white/20 px-2 py-1 rounded flex items-center gap-1">
                {summaryMetrics.avgROAS > 2 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {((summaryMetrics.avgROAS - 1) * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalRevenue)}</p>
            <p className="text-sm opacity-90">Total Revenue • {summaryMetrics.avgROAS.toFixed(2)}x ROAS</p>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  className={`h-1 flex-1 rounded ${
                    star <= Math.round(summaryMetrics.avgROAS) ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <MousePointer className="h-5 w-5 opacity-80" />
              <Badge className="bg-white/20 text-white border-0">
                {summaryMetrics.avgCTR.toFixed(2)}%
              </Badge>
            </div>
            <p className="text-2xl font-bold">{formatNumber(summaryMetrics.totalClicks)}</p>
            <p className="text-sm opacity-90">Total Clicks</p>
            <p className="text-xs mt-1 opacity-80">{formatNumber(summaryMetrics.totalImpressions)} impressions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 opacity-80" />
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 opacity-80" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Conversion Rate: {summaryMetrics.conversionRate.toFixed(2)}%</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-2xl font-bold">{formatNumber(summaryMetrics.totalConversions)}</p>
            <p className="text-sm opacity-90">Total Conversions</p>
            <div className="mt-2 h-1 bg-white/20 rounded overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${Math.min(summaryMetrics.conversionRate * 10, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Header with View Modes */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                Campaign Management Center
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time performance tracking • {filteredCampaigns.length} of {campaigns.length} campaigns
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'hierarchy' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('hierarchy')}
                    className="px-3"
                  >
                    <ListTree className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hierarchy View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="px-3"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Grid View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'compact' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('compact')}
                    className="px-3"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Compact View</TooltipContent>
              </Tooltip>
            </div>
            <Button variant="outline" size="sm" className="bg-white dark:bg-gray-800">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="bg-white dark:bg-gray-800">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="bg-white dark:bg-gray-800">
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search campaigns, ad sets, or ads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
          <select
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium min-w-[120px]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
          </select>
        </div>
      </div>

      {/* Performance Alerts */}
      {filteredCampaigns.some(c => c.roas < 1 && c.spend > 100) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                {filteredCampaigns.filter(c => c.roas < 1 && c.spend > 100).length} campaigns need optimization
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                These campaigns have ROAS below 1.0x and significant spend. Consider pausing or optimizing them.
              </p>
            </div>
            <Button size="sm" variant="outline" className="bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700">
              <Zap className="h-4 w-4 mr-1" />
              Quick Optimize
            </Button>
          </div>
        </div>
      )}

      {/* Enhanced Campaign Hierarchy */}
      <Card className="shadow-lg border-0 bg-white dark:bg-gray-900">
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              <div className="col-span-4">Campaign / Ad Set / Ad</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-1 text-right">Spend</div>
              <div className="col-span-1 text-right">Revenue</div>
              <div className="col-span-1 text-right">ROAS</div>
              <div className="col-span-1 text-right">CTR</div>
              <div className="col-span-1 text-right">Conv.</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredCampaigns.map((campaign) => {
              const isExpanded = expandedCampaigns.has(campaign.id)
              const isLoading = loadingCampaigns.has(campaign.id)
              const campaignDetails = campaignData.get(campaign.id) || campaign

              return (
                <div key={campaign.id}>
                  {/* Enhanced Campaign Row */}
                  <div className="bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 border-l-4 border-l-blue-500">
                    <div className="grid grid-cols-12 gap-4 items-center px-6 py-4">
                      {/* Campaign Name & Controls */}
                      <div className="col-span-4 flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-7 w-7 hover:bg-blue-100 dark:hover:bg-blue-900"
                          onClick={() => toggleCampaign(campaign.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                          ) : isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-blue-600" />
                          )}
                        </Button>
                        
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <FolderOpen className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Folder className="h-5 w-5 text-blue-600" />
                          )}
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                {campaign.name}
                              </span>
                              {campaign.objective && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded flex items-center gap-1">
                                      {getObjectiveIcon(campaign.objective)}
                                      <span className="capitalize">{campaign.objective?.toLowerCase()}</span>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>Campaign Objective</TooltipContent>
                                </Tooltip>
                              )}
                              {/* Performance Indicator */}
                              {campaign.spend > 0 && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                                      campaign.roas >= 3 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                      campaign.roas >= 1.5 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                    }`}>
                                      {campaign.roas >= 3 ? <TrendingUp className="h-3 w-3" /> :
                                       campaign.roas >= 1.5 ? <Activity className="h-3 w-3" /> :
                                       <TrendingDown className="h-3 w-3" />}
                                      {campaign.roas >= 3 ? 'Top Performer' :
                                       campaign.roas >= 1.5 ? 'Average' :
                                       'Needs Attention'}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div>
                                      <p className="font-semibold">Performance Analysis</p>
                                      <p>ROAS: {campaign.roas.toFixed(2)}x</p>
                                      <p>Spend: {formatCurrency(campaign.spend)}</p>
                                      <p>Revenue: {formatCurrency(campaign.revenue)}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Campaign
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {formatNumber(campaign.impressions)} impressions
                              </span>
                              {campaign.conversions > 0 && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  {formatNumber(campaign.conversions)} conversions
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-1 text-center">
                        <Badge variant="secondary" className={`text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </Badge>
                      </div>

                      {/* Enhanced Metrics with Indicators */}
                      <div className="col-span-1 text-right">
                        <Tooltip>
                          <TooltipTrigger>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                {formatCurrency(campaign.spend)}
                              </p>
                              <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all duration-300"
                                  style={{ width: `${Math.min((campaign.spend / summaryMetrics.totalSpend) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {((campaign.spend / summaryMetrics.totalSpend) * 100).toFixed(1)}% of total spend
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="col-span-1 text-right">
                        <Tooltip>
                          <TooltipTrigger>
                            <div>
                              <p className="font-semibold text-green-600 text-sm flex items-center justify-end gap-1">
                                {campaign.revenue > campaign.spend && <ArrowUp className="h-3 w-3" />}
                                {formatCurrency(campaign.revenue)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {campaign.spend > 0 ? `${((campaign.revenue / campaign.spend - 1) * 100).toFixed(0)}% profit` : 'No spend'}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            Profit: {formatCurrency(campaign.revenue - campaign.spend)}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="col-span-1 text-right">
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex flex-col items-end">
                              <div className={`flex items-center gap-1 font-bold text-sm ${
                                campaign.roas >= 2 ? 'text-green-600' : 
                                campaign.roas >= 1 ? 'text-yellow-600' : 
                                'text-red-600'
                              }`}>
                                {campaign.roas >= 2 ? <TrendingUp className="h-3 w-3" /> :
                                 campaign.roas >= 1 ? <Activity className="h-3 w-3" /> :
                                 <TrendingDown className="h-3 w-3" />}
                                {campaign.roas.toFixed(2)}x
                              </div>
                              <div className="flex gap-0.5 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <div
                                    key={star}
                                    className={`h-1 w-1 rounded-full ${
                                      star <= Math.ceil(campaign.roas) ? 
                                      campaign.roas >= 2 ? 'bg-green-600' : 
                                      campaign.roas >= 1 ? 'bg-yellow-600' : 
                                      'bg-red-600' : 'bg-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {campaign.roas >= 2 ? 'Excellent performance' :
                             campaign.roas >= 1 ? 'Breaking even' :
                             'Below target'}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="col-span-1 text-right">
                        <Tooltip>
                          <TooltipTrigger>
                            <div>
                              <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                {campaign.ctr.toFixed(2)}%
                              </p>
                              <p className="text-xs text-gray-500">
                                {campaign.ctr > summaryMetrics.avgCTR ? 
                                  <span className="text-green-600">↑ Above avg</span> : 
                                  <span className="text-red-600">↓ Below avg</span>
                                }
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            Average CTR: {summaryMetrics.avgCTR.toFixed(2)}%
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="col-span-1 text-right">
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex flex-col items-end">
                              <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                {formatNumber(campaign.conversions)}
                              </p>
                              {campaign.clicks > 0 && (
                                <p className="text-xs text-gray-500">
                                  {((campaign.conversions / campaign.clicks) * 100).toFixed(1)}% CVR
                                </p>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div>
                              <p>Conversion Rate: {campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100).toFixed(2) : 0}%</p>
                              <p>Cost per Conversion: {campaign.conversions > 0 ? formatCurrency(campaign.spend / campaign.conversions) : 'N/A'}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCampaignForAnalytics(campaign)}
                          className="text-xs px-3 py-1 h-7 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                        >
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Analyze
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setSelectedCampaignForAnalytics(campaign)}
                              className="font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Analyze Campaign
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <PauseCircle className="h-4 w-4 mr-2" />
                              Pause
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Ad Sets */}
                  {isExpanded && campaignDetails.adsets && (
                    <div className="bg-gray-50 dark:bg-gray-800/50">
                      {campaignDetails.adsets.map((adSet) => {
                        const isAdSetExpanded = expandedAdSets.has(adSet.id)
                        const isAdSetLoading = loadingAdSets.has(adSet.id)

                        return (
                          <div key={adSet.id}>
                            {/* Enhanced Ad Set Row */}
                            <div className="bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all duration-200 border-l-4 border-l-purple-400 ml-8 my-1">
                              <div className="grid grid-cols-12 gap-4 items-center px-6 py-3">
                                {/* Ad Set Name & Controls */}
                                <div className="col-span-5 flex items-center gap-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 h-6 w-6 hover:bg-purple-100 dark:hover:bg-purple-900"
                                    onClick={() => toggleAdSet(adSet.id, campaign.id)}
                                    disabled={isAdSetLoading}
                                  >
                                    {isAdSetLoading ? (
                                      <div className="animate-spin h-3 w-3 border-2 border-purple-500 border-t-transparent rounded-full" />
                                    ) : isAdSetExpanded ? (
                                      <ChevronDown className="h-3 w-3 text-purple-600" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 text-purple-600" />
                                    )}
                                  </Button>
                                  
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-purple-600" />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                                          {adSet.name}
                                        </span>
                                        {adSet.daily_budget && (
                                          <span className="text-xs text-gray-500 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                                            ${adSet.daily_budget}/day
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        Ad Set • {formatNumber(adSet.insights?.impressions || 0)} impressions
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Status */}
                                <div className="col-span-1 text-center">
                                  <Badge variant="secondary" className={`text-xs ${getStatusColor(adSet.effective_status)}`}>
                                    {adSet.effective_status}
                                  </Badge>
                                </div>

                                {/* Metrics */}
                                <div className="col-span-1 text-right">
                                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                                    {formatCurrency(adSet.insights?.spend || 0)}
                                  </p>
                                </div>
                                <div className="col-span-1 text-right">
                                  <p className="font-medium text-green-600 text-sm">
                                    {formatCurrency(adSet.insights?.revenue || 0)}
                                  </p>
                                </div>
                                <div className="col-span-1 text-right">
                                  <p className="font-medium text-gray-600 dark:text-gray-400 text-sm">-</p>
                                </div>
                                <div className="col-span-1 text-right">
                                  <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                    {(adSet.insights?.ctr || 0).toFixed(2)}%
                                  </p>
                                </div>
                                <div className="col-span-1 text-right">
                                  <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                    {formatNumber(adSet.insights?.conversions || 0)}
                                  </p>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 text-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>Edit</DropdownMenuItem>
                                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>

                            {/* Enhanced Individual Ads */}
                            {isAdSetExpanded && adSet.ads && (
                              <div className="bg-gray-100 dark:bg-gray-900/50 ml-16">
                                {adSet.ads.map((ad) => (
                                  <div key={ad.id} className="bg-white dark:bg-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all duration-200 border-l-4 border-l-orange-400 my-1 mx-2">
                                    <div className="grid grid-cols-12 gap-4 items-center px-4 py-2">
                                      {/* Ad Name & Creative */}
                                      <div className="col-span-5 flex items-center gap-2">
                                        <div className="w-4" /> {/* Spacer for alignment */}
                                        
                                        {ad.creative?.video_url ? (
                                          <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                                            <PlayCircle className="h-3 w-3 text-green-600" />
                                            <span className="text-xs text-green-700 dark:text-green-300">Video</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded">
                                            <Image className="h-3 w-3 text-orange-600" />
                                            <span className="text-xs text-orange-700 dark:text-orange-300">Image</span>
                                          </div>
                                        )}

                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                                              {ad.name}
                                            </span>
                                          </div>
                                          <div className="text-xs text-gray-500 mt-0.5">
                                            Ad • {ad.creative?.call_to_action_type || 'No CTA'}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Status */}
                                      <div className="col-span-1 text-center">
                                        <Badge variant="secondary" className={`text-xs ${getStatusColor(ad.effective_status)}`}>
                                          {ad.effective_status}
                                        </Badge>
                                      </div>

                                      {/* Metrics */}
                                      <div className="col-span-1 text-right">
                                        <p className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                                          {formatCurrency(ad.insights?.spend || 0)}
                                        </p>
                                      </div>
                                      <div className="col-span-1 text-right">
                                        <p className="font-medium text-green-600 text-xs">
                                          {formatCurrency(ad.insights?.revenue || 0)}
                                        </p>
                                      </div>
                                      <div className="col-span-1 text-right">
                                        <p className="font-medium text-gray-600 dark:text-gray-400 text-xs">-</p>
                                      </div>
                                      <div className="col-span-1 text-right">
                                        <p className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                                          {(ad.insights?.ctr || 0).toFixed(2)}%
                                        </p>
                                      </div>
                                      <div className="col-span-1 text-right">
                                        <p className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                                          {formatNumber(ad.insights?.conversions || 0)}
                                        </p>
                                      </div>

                                      {/* Actions */}
                                      <div className="col-span-2 text-center">
                                        <Button variant="ghost" size="sm" className="h-7 px-3 py-1 text-xs hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-transparent hover:border-orange-200">
                                          <Eye className="h-3 w-3 mr-1" />
                                          View Details
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  )
}