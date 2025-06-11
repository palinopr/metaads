"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  Settings, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Activity,
  AlertCircle,
  Bug,
  Eye,
  EyeOff,
  ChevronRight,
  BarChart3,
  Calendar,
  TrendingDown,
  Zap,
  Brain,
  Trophy,
  Sparkles,
  Bell,
  Building2,
  Calculator,
  FileText,
  Layers,
  Image,
  MoreVertical,
  Filter,
  Search,
  Download,
  ChevronDown,
  Settings2
} from "lucide-react"
import { MetaAPIClient, formatAccessToken, formatAdAccountId, processInsights, TokenExpiredError } from "@/lib/meta-api-client"
import { safeToFixed, safeCurrency, safeParseNumber } from "@/lib/safe-utils"
import { AdSetAndAdAPI, AdSet, Ad } from '@/lib/meta-api-adsets'
import { DebugPanel } from "@/components/debug-panel"
import { AIInsights } from "@/components/ai-insights"
import { TokenStatus } from "./token-status"
import { PredictiveAnalytics } from "@/components/predictive-analytics"
import { CompetitorBenchmark } from "@/components/competitor-benchmark"
import { ROICalculator } from "@/components/roi-calculator"
import { CreativePerformanceAnalyzer } from "@/components/creative-performance-analyzer"
import { DemographicAnalytics } from "@/components/demographic-analytics"
import { DayHourPerformance } from "@/components/day-hour-performance"
import { DayWeekPerformance } from "@/components/day-week-performance"
import { TokenExpiryAlert } from "@/components/token-expiry-alert"
import { DateFilter } from "@/components/date-filter"
import { formatCurrency, formatNumberWithCommas, formatPercentage } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { ComprehensiveInsightsView } from "@/components/comprehensive-insights-view"

interface EnhancedCampaign {
  id: string
  name: string
  status: string
  effective_status: string
  objective: string
  created_time: string
  insights?: any
  todayData?: any
  trend?: 'up' | 'down' | 'stable'
  daysRunning: number
  lifetimeROAS: number
  performanceScore: number
  adSetCount?: number
  adCount?: number
  spend?: number
  revenue?: number
  roas?: number
  ctr?: number
  cpc?: number
  adsets?: AdSet[]
  adsets_count?: number
  impressions?: number
  clicks?: number
  conversions?: number
  cpa?: number
}

interface MetaStyleDashboardProps {
  accessToken: string
  adAccountId: string
  showSettings: boolean
  setShowSettings: (show: boolean) => void
  onSaveCredentials: (e: React.FormEvent) => void
  onClearCredentials: () => void
  setAccessToken: (token: string) => void
  setAdAccountId: (id: string) => void
  error: string | null
  setError?: (error: string | null) => void
  isLoading: boolean
  setIsLoading?: (loading: boolean) => void
  showToken: boolean
  setShowToken: (show: boolean) => void
}

export function MetaStyleDashboard({
  accessToken,
  adAccountId,
  showSettings,
  setShowSettings,
  onSaveCredentials,
  onClearCredentials,
  setAccessToken,
  setAdAccountId,
  error,
  setError,
  isLoading,
  setIsLoading,
  showToken,
  setShowToken
}: MetaStyleDashboardProps) {
  // State for data
  const [campaigns, setCampaigns] = useState<EnhancedCampaign[]>([])
  const [adSets, setAdSets] = useState<Map<string, AdSet[]>>(new Map())
  const [ads, setAds] = useState<Map<string, Ad[]>>(new Map())
  const [accountInfo, setAccountInfo] = useState<any>(null)
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'all'>('all')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [isDebugOpen, setIsDebugOpen] = useState(false)
  const [showTokenExpiredAlert, setShowTokenExpiredAlert] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [localIsLoading, setLocalIsLoading] = useState(false)
  
  // State for the comprehensive view
  const [selectedItem, setSelectedItem] = useState<{
    type: 'campaign' | 'adset' | 'ad'
    id: string
    name: string
    data?: any
  } | null>(null)
  const [showComprehensiveView, setShowComprehensiveView] = useState(false)

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Fetch campaigns data
  const fetchCampaigns = useCallback(async () => {
    if (!accessToken || !adAccountId) return

    // Use local state as primary, props as fallback
    setLocalIsLoading(true)
    setLocalError(null)
    if (setIsLoading) {
      setIsLoading(true)
    }
    if (setError) {
      setError(null)
    }

    try {
      // Use the API proxy route instead of direct client
      const response = await fetch('/api/meta-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'overview',
          datePreset: dateFilter === 'all' ? 'last_30d' : dateFilter,
          accessToken: accessToken,
          adAccountId: adAccountId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Failed to fetch campaigns'
        console.log('API Error received:', errorMessage)
        
        // Check for token expiration - check the actual error string, not nested error object
        if (errorMessage.includes('Session has expired') || 
            errorMessage.includes('access token') ||
            errorMessage.includes('OAuthException') ||
            errorMessage.includes('Error validating access token')) {
          console.log('Token expired detected!')
          const tokenErrorMsg = 'Your Meta access token has expired. Please generate a new token and update it in the settings.'
          setLocalError(tokenErrorMsg)
          setLocalIsLoading(false)
          if (setError) {
            setError(tokenErrorMsg)
          }
          if (setIsLoading) {
            setIsLoading(false)
          }
          setShowTokenExpiredAlert(true)
          return
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      console.log('API Response received:', {
        success: data.success,
        campaignsCount: data.campaigns?.length || 0,
        firstCampaign: data.campaigns?.[0] ? {
          name: data.campaigns[0].name,
          adsets_count: data.campaigns[0].adsets_count,
          hasAdsets: !!data.campaigns[0].adsets,
          adsetsLength: data.campaigns[0].adsets?.length
        } : null
      })
      
      // Set account info
      if (data.accountInfo) {
        setAccountInfo(data.accountInfo)
      }

      // Process campaigns
      const processedCampaigns: EnhancedCampaign[] = (data.campaigns || []).map((campaign: any) => {
        // Calculate metrics
        const createdDate = new Date(campaign.created_time)
        const today = new Date()
        const daysRunning = Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

        let performanceScore = 50
        if (campaign.spend > 0) {
          if (campaign.roas > 3) performanceScore = 90
          else if (campaign.roas > 2) performanceScore = 80
          else if (campaign.roas > 1.5) performanceScore = 70
          else if (campaign.roas > 1) performanceScore = 60
          else if (campaign.roas > 0.5) performanceScore = 40
          else performanceScore = 20

          if (campaign.ctr > 2) performanceScore += 10
          else if (campaign.ctr < 0.5) performanceScore -= 10

          performanceScore = Math.max(0, Math.min(100, performanceScore))
        }

        return {
          ...campaign,
          insights: campaign.insights,
          daysRunning,
          lifetimeROAS: campaign.roas || 0,
          performanceScore,
          trend: 'stable' as const,
          // Preserve adsets data from API response
          adsets: campaign.adsets,
          adsets_count: campaign.adsets_count
        }
      })

      setCampaigns(processedCampaigns)
      setLastRefresh(new Date())
      
      // Process ad sets from the campaigns data
      console.log('Processing ad sets from campaigns data...')
      const newAdSets = new Map<string, AdSet[]>()
      const newAds = new Map<string, Ad[]>()
      
      let totalAdSets = 0
      let totalAds = 0
      
      // Use the ad sets that came with the campaigns from the API
      processedCampaigns.forEach(campaign => {
        if (campaign.adsets && Array.isArray(campaign.adsets)) {
          newAdSets.set(campaign.id, campaign.adsets)
          totalAdSets += campaign.adsets.length
          console.log(`Campaign ${campaign.name}: ${campaign.adsets.length} ad sets`)
          
          // Process ads from each ad set if they exist
          campaign.adsets.forEach((adSet: AdSet) => {
            if (adSet.ads && Array.isArray(adSet.ads)) {
              newAds.set(adSet.id, adSet.ads)
              totalAds += adSet.ads.length
            }
          })
        } else {
          console.log(`Campaign ${campaign.name}: No ad sets found in response`)
          newAdSets.set(campaign.id, [])
        }
      })
      
      console.log(`Total from API response: ${totalAdSets} ad sets, ${totalAds} ads`)
      
      setAdSets(newAdSets)
      setAds(newAds)
      
      // If no ad sets were found in the response, try fetching them separately
      if (totalAdSets === 0 && processedCampaigns.length > 0) {
        console.log('No ad sets in response, fetching separately...')
        try {
          const api = new AdSetAndAdAPI(accessToken, adAccountId)
          const campaignIds = processedCampaigns.map(c => c.id)
          const hierarchy = await api.getAllCampaignHierarchy(campaignIds, dateFilter === 'all' ? 'last_30d' : dateFilter)
          
          console.log('Separate fetch - hierarchy size:', hierarchy.size)
          
          hierarchy.forEach((value, key) => {
            newAdSets.set(key, value.adsets)
            totalAdSets += value.adsets.length
            value.adsets.forEach(adset => {
              const adsForAdSet = value.ads.filter(ad => ad.adset_id === adset.id)
              newAds.set(adset.id, adsForAdSet)
              totalAds += adsForAdSet.length
            })
          })
          
          console.log(`Separate fetch total: ${totalAdSets} ad sets, ${totalAds} ads`)
          
          setAdSets(newAdSets)
          setAds(newAds)
        } catch (error) {
          console.error('Failed to fetch ad sets separately:', error)
        }
      }
      
      setLocalIsLoading(false)
      if (setIsLoading) {
        setIsLoading(false)
      }
      
    } catch (err: any) {
      console.error('Error fetching campaigns:', err)
      
      // Check if it's a token error
      const errorMessage = err.message || err.toString()
      if (err instanceof TokenExpiredError || 
          errorMessage.includes('Session has expired') || 
          errorMessage.includes('access token') ||
          errorMessage.includes('OAuthException') ||
          errorMessage.includes('Error validating access token')) {
        const tokenErrorMsg = 'Your Meta access token has expired. Please generate a new token and update it in the settings.'
        setShowTokenExpiredAlert(true)
        setLocalError(tokenErrorMsg)
        if (setError) {
          setError(tokenErrorMsg)
        }
      } else {
        setLocalError(errorMessage)
        if (setError) {
          setError(errorMessage)
        }
      }
      
      setLocalIsLoading(false)
      if (setIsLoading) {
        setIsLoading(false)
      }
    }
  }, [accessToken, adAccountId, dateFilter])

  // Auto-fetch on mount if credentials exist
  useEffect(() => {
    if (accessToken && adAccountId && !showSettings) {
      fetchCampaigns()
    }
  }, [accessToken, adAccountId, showSettings, fetchCampaigns])

  // Open comprehensive insights view
  const openInsights = (
    type: 'campaign' | 'adset' | 'ad',
    id: string,
    name: string,
    data: any
  ) => {
    setSelectedItem({ type, id, name, data })
    setShowComprehensiveView(true)
  }

  // Close comprehensive view
  const closeComprehensiveView = () => {
    setShowComprehensiveView(false)
    setSelectedItem(null)
  }

  // Filter functions
  const filterByStatus = (items: any[]) => {
    if (statusFilter === 'all') return items
    return items.filter(item => item.effective_status === statusFilter)
  }

  const filterBySearch = (items: any[], key: string = 'name') => {
    if (!searchQuery) return items
    return items.filter(item => 
      item[key]?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }


  // Render campaign row
  const renderCampaignRow = (campaign: EnhancedCampaign) => {
    const campaignAdSets = adSets.get(campaign.id) || []
    
    return (
      <TableRow key={campaign.id}>
        <TableCell className="font-medium">
          <div>
            <div className="font-semibold">{campaign.name}</div>
            <div className="text-sm text-muted-foreground">
              {campaign.objective} • {campaignAdSets.length} ad sets
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={campaign.effective_status === 'ACTIVE' ? 'default' : 'secondary'}>
            {campaign.effective_status}
          </Badge>
        </TableCell>
        <TableCell>{formatCurrency(campaign.spend)}</TableCell>
        <TableCell>{formatNumberWithCommas(campaign.insights?.impressions || 0)}</TableCell>
        <TableCell>{formatNumberWithCommas(campaign.insights?.clicks || 0)}</TableCell>
        <TableCell>{formatPercentage(campaign.ctr)}</TableCell>
        <TableCell>{formatCurrency(campaign.cpc)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="font-medium">{safeToFixed(campaign.roas, 2)}x</span>
            {campaign.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
            {campaign.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openInsights('campaign', campaign.id, campaign.name, campaign)}
              title="View Comprehensive Insights"
            >
              <Brain className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  // Render ad set row
  const renderAdSetRow = (adSet: AdSet, campaignName: string) => {
    const adSetAds = ads.get(adSet.id) || []
    const insights = processInsights(adSet.insights?.data?.[0])
    
    return (
      <TableRow key={adSet.id}>
        <TableCell className="font-medium">
          <div>
            <div className="font-semibold">{adSet.name}</div>
            <div className="text-sm text-muted-foreground">
              {campaignName} • {adSetAds.length} ads
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={adSet.effective_status === 'ACTIVE' ? 'default' : 'secondary'}>
            {adSet.effective_status}
          </Badge>
        </TableCell>
        <TableCell>{formatCurrency(insights?.spend || 0)}</TableCell>
        <TableCell>{formatNumberWithCommas(insights?.impressions || 0)}</TableCell>
        <TableCell>{formatNumberWithCommas(insights?.clicks || 0)}</TableCell>
        <TableCell>{formatPercentage(insights?.ctr || 0)}</TableCell>
        <TableCell>{formatCurrency(insights?.cpc || 0)}</TableCell>
        <TableCell>
          <span className="font-medium">{safeToFixed(insights?.roas, 2)}x</span>
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openInsights('adset', adSet.id, adSet.name, { ...adSet, insights })}
              title="View Comprehensive Insights"
            >
              <Brain className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  // Render ad row
  const renderAdRow = (ad: Ad, adSetName: string, campaignName: string) => {
    const insights = processInsights(ad.insights?.data?.[0])
    
    return (
      <TableRow key={ad.id}>
        <TableCell className="font-medium">
          <div>
            <div className="font-semibold">{ad.name}</div>
            <div className="text-sm text-muted-foreground">
              {campaignName} › {adSetName}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={ad.effective_status === 'ACTIVE' ? 'default' : 'secondary'}>
            {ad.effective_status}
          </Badge>
        </TableCell>
        <TableCell>{formatCurrency(insights?.spend || 0)}</TableCell>
        <TableCell>{formatNumberWithCommas(insights?.impressions || 0)}</TableCell>
        <TableCell>{formatNumberWithCommas(insights?.clicks || 0)}</TableCell>
        <TableCell>{formatPercentage(insights?.ctr || 0)}</TableCell>
        <TableCell>{formatCurrency(insights?.cpc || 0)}</TableCell>
        <TableCell>
          <span className="font-medium">{safeToFixed(insights?.roas, 2)}x</span>
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openInsights('ad', ad.id, ad.name, { ...ad, insights })}
              title="View Comprehensive Insights"
            >
              <Brain className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  // Get all ad sets for display
  const getAllAdSets = () => {
    const allAdSets: { adSet: AdSet, campaignName: string }[] = []
    campaigns.forEach(campaign => {
      const campaignAdSets = adSets.get(campaign.id) || []
      campaignAdSets.forEach(adSet => {
        allAdSets.push({ adSet, campaignName: campaign.name })
      })
    })
    console.log('getAllAdSets - Total campaigns:', campaigns.length, 'Total ad sets:', allAdSets.length)
    return allAdSets
  }

  // Get all ads for display
  const getAllAds = () => {
    const allAds: { ad: Ad, adSetName: string, campaignName: string }[] = []
    campaigns.forEach(campaign => {
      const campaignAdSets = adSets.get(campaign.id) || []
      campaignAdSets.forEach(adSet => {
        const adSetAds = ads.get(adSet.id) || []
        adSetAds.forEach(ad => {
          allAds.push({ ad, adSetName: adSet.name, campaignName: campaign.name })
        })
      })
    })
    console.log('getAllAds - Total campaigns:', campaigns.length, 'Total ads:', allAds.length)
    return allAds
  }

  if (showSettings) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Connect your Meta Ads account to start tracking performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSaveCredentials} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-token">Access Token</Label>
              <div className="relative">
                <Input
                  id="access-token"
                  type={showToken ? "text" : "password"}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Your Meta API access token"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-id">Ad Account ID</Label>
              <Input
                id="account-id"
                value={adAccountId}
                onChange={(e) => setAdAccountId(e.target.value)}
                placeholder="act_123456789 or just 123456789"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                Save & Connect
              </Button>
              {(accessToken || adAccountId) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClearCredentials}
                >
                  Clear Credentials
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  // Show comprehensive view if selected
  if (showComprehensiveView && selectedItem) {
    return (
      <ComprehensiveInsightsView
        item={selectedItem}
        campaigns={campaigns}
        accessToken={accessToken}
        adAccountId={adAccountId}
        onBack={closeComprehensiveView}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Meta Ads Manager</h1>
          <p className="text-muted-foreground">
            Analyze campaigns, ad sets, and ads with AI-powered insights
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <DateFilter 
            selected={dateFilter} 
            onSelect={setDateFilter}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDebugOpen(!isDebugOpen)}
          >
            <Bug className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            onClick={fetchCampaigns}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Token Status - Shows when token is expired */}
      <TokenStatus 
        error={localError || error || (showTokenExpiredAlert ? 'Your Meta access token has expired. Please generate a new token and update it in the settings.' : null)} 
        onTokenUpdate={(newToken) => {
          // Update the token in state
          setAccessToken(newToken)
          setLocalError(null)
          if (setError) {
            setError(null)
          }
          setShowTokenExpiredAlert(false)
        }}
      />

      {/* Error Alert - Only show for non-token errors */}
      {(localError || error) && 
       !(localError || error || '').includes('expired') && 
       !(localError || error || '').includes('access token') && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{localError || error}</AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">
            <Layers className="h-4 w-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="adsets">
            <Target className="h-4 w-4 mr-2" />
            Ad Sets
          </TabsTrigger>
          <TabsTrigger value="ads">
            <Image className="h-4 w-4 mr-2" />
            Ads
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Campaigns</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search campaigns..."
                      className="pl-8 w-[200px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                        All Statuses
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('ACTIVE')}>
                        Active Only
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('PAUSED')}>
                        Paused Only
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>CPC</TableHead>
                    <TableHead>ROAS</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterBySearch(filterByStatus(campaigns)).map(renderCampaignRow)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ad Sets Tab */}
        <TabsContent value="adsets" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Ad Sets</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search ad sets..."
                      className="pl-8 w-[200px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                        All Statuses
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('ACTIVE')}>
                        Active Only
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('PAUSED')}>
                        Paused Only
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Set</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>CPC</TableHead>
                    <TableHead>ROAS</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterBySearch(filterByStatus(getAllAdSets()), 'adSet.name').length > 0 ? (
                    filterBySearch(filterByStatus(getAllAdSets()), 'adSet.name')
                      .map(({ adSet, campaignName }) => renderAdSetRow(adSet, campaignName))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {campaigns.length === 0 
                            ? "No campaigns loaded. Please connect your Meta account first."
                            : "No ad sets found. Fetching data..."}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ads Tab */}
        <TabsContent value="ads" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Ads</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search ads..."
                      className="pl-8 w-[200px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                        All Statuses
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('ACTIVE')}>
                        Active Only
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('PAUSED')}>
                        Paused Only
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>CPC</TableHead>
                    <TableHead>ROAS</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterBySearch(filterByStatus(getAllAds()), 'ad.name').length > 0 ? (
                    filterBySearch(filterByStatus(getAllAds()), 'ad.name')
                      .map(({ ad, adSetName, campaignName }) => renderAdRow(ad, adSetName, campaignName))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {campaigns.length === 0 
                            ? "No campaigns loaded. Please connect your Meta account first."
                            : "No ads found. Fetching data..."}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      {/* Debug Panel */}
      <DebugPanel
        accessToken={accessToken}
        adAccountId={adAccountId}
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
      />

      {/* Token Expiry Alert */}
      <TokenExpiryAlert
        isVisible={showTokenExpiredAlert}
        onReauthenticate={() => {
          setShowTokenExpiredAlert(false)
          setShowSettings(true)
        }}
        onDismiss={() => setShowTokenExpiredAlert(false)}
      />
    </div>
  )
}