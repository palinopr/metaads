"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
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

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg border">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Campaign Hierarchy</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Expand campaigns to see ad sets and individual ads • {filteredCampaigns.length} campaigns shown
            </p>
          </div>
          <div className="flex items-center gap-2">
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

      {/* Enhanced Campaign Hierarchy */}
      <Card className="shadow-lg border-0 bg-white dark:bg-gray-900">
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              <div className="col-span-5">Campaign / Ad Set / Ad</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-1 text-right">Spend</div>
              <div className="col-span-1 text-right">Revenue</div>
              <div className="col-span-1 text-right">ROAS</div>
              <div className="col-span-1 text-right">CTR</div>
              <div className="col-span-1 text-right">Conv.</div>
              <div className="col-span-1 text-center">Actions</div>
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
                      <div className="col-span-5 flex items-center gap-3">
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
                                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                  {getObjectiveIcon(campaign.objective)}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Campaign • {formatNumber(campaign.impressions)} impressions
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

                      {/* Metrics */}
                      <div className="col-span-1 text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                          {formatCurrency(campaign.spend)}
                        </p>
                      </div>
                      <div className="col-span-1 text-right">
                        <p className="font-semibold text-green-600 text-sm">
                          {formatCurrency(campaign.revenue)}
                        </p>
                      </div>
                      <div className="col-span-1 text-right">
                        <p className={`font-bold text-sm ${
                          campaign.roas >= 2 ? 'text-green-600' : 
                          campaign.roas >= 1 ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {campaign.roas.toFixed(2)}x
                        </p>
                      </div>
                      <div className="col-span-1 text-right">
                        <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                          {campaign.ctr.toFixed(2)}%
                        </p>
                      </div>
                      <div className="col-span-1 text-right">
                        <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                          {formatNumber(campaign.conversions)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
                                      <div className="col-span-1 text-center">
                                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-600">
                                          View
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
  )
}