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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns, ad sets, or ads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <select
            className="px-3 py-2 rounded-md border text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
        </div>
      </div>

      {/* Campaign Hierarchy */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredCampaigns.map((campaign) => {
              const isExpanded = expandedCampaigns.has(campaign.id)
              const isLoading = loadingCampaigns.has(campaign.id)
              const campaignDetails = campaignData.get(campaign.id) || campaign

              return (
                <div key={campaign.id}>
                  {/* Campaign Row */}
                  <div className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-6 w-6"
                      onClick={() => toggleCampaign(campaign.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      ) : isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    
                    {isExpanded ? (
                      <FolderOpen className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Folder className="h-4 w-4 text-blue-600" />
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{campaign.name}</span>
                        <Badge variant="secondary" className={`text-xs ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </Badge>
                        {campaign.objective && getObjectiveIcon(campaign.objective)}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-muted-foreground">Spend</p>
                        <p className="font-medium">{formatCurrency(campaign.spend)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-medium">{formatCurrency(campaign.revenue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">ROAS</p>
                        <p className={`font-medium ${
                          campaign.roas >= 2 ? 'text-green-600' : 
                          campaign.roas >= 1 ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {campaign.roas.toFixed(2)}x
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">CTR</p>
                        <p className="font-medium">{campaign.ctr.toFixed(2)}%</p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
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

                  {/* Ad Sets */}
                  {isExpanded && campaignDetails.adsets && (
                    <div className="pl-8 bg-muted/20">
                      {campaignDetails.adsets.map((adSet) => {
                        const isAdSetExpanded = expandedAdSets.has(adSet.id)
                        const isAdSetLoading = loadingAdSets.has(adSet.id)

                        return (
                          <div key={adSet.id}>
                            {/* Ad Set Row */}
                            <div className="flex items-center gap-3 p-3 border-t hover:bg-muted/50 transition-colors">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-6 w-6"
                                onClick={() => toggleAdSet(adSet.id, campaign.id)}
                                disabled={isAdSetLoading}
                              >
                                {isAdSetLoading ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                                ) : isAdSetExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                              
                              <FileText className="h-4 w-4 text-purple-600" />

                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{adSet.name}</span>
                                  <Badge variant="secondary" className={`text-xs ${getStatusColor(adSet.effective_status)}`}>
                                    {adSet.effective_status}
                                  </Badge>
                                  {adSet.daily_budget && (
                                    <span className="text-xs text-muted-foreground">
                                      Daily: {formatCurrency(adSet.daily_budget)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-xs">
                                <div className="text-right">
                                  <p className="text-muted-foreground">Spend</p>
                                  <p className="font-medium">{formatCurrency(adSet.insights?.spend || 0)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-muted-foreground">CTR</p>
                                  <p className="font-medium">{(adSet.insights?.ctr || 0).toFixed(2)}%</p>
                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Edit</DropdownMenuItem>
                                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Ads */}
                            {isAdSetExpanded && adSet.ads && (
                              <div className="pl-8 bg-muted/10">
                                {adSet.ads.map((ad) => (
                                  <div key={ad.id} className="flex items-center gap-3 p-2 border-t hover:bg-muted/50 transition-colors">
                                    <div className="w-6" /> {/* Spacer */}
                                    
                                    {ad.creative?.video_url ? (
                                      <PlayCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Image className="h-4 w-4 text-orange-600" />
                                    )}

                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs">{ad.name}</span>
                                        <Badge variant="secondary" className={`text-xs ${getStatusColor(ad.effective_status)}`}>
                                          {ad.effective_status}
                                        </Badge>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs">
                                      <div className="text-right">
                                        <p className="text-muted-foreground">Impressions</p>
                                        <p className="font-medium">{formatNumber(ad.insights?.impressions || 0)}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-muted-foreground">Clicks</p>
                                        <p className="font-medium">{formatNumber(ad.insights?.clicks || 0)}</p>
                                      </div>
                                    </div>

                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                      View
                                    </Button>
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