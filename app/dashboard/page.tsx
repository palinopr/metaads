"use client"

import type React from "react"
import { useState, useEffect, type FormEvent, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Settings,
  Loader2,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Target,
  Activity,
  AlertCircle,
  ExternalLink,
  Download,
  Info,
  MousePointer,
} from "lucide-react"
import { formatNumberWithCommas, formatCurrency } from "@/lib/utils"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { DateRangeSelector } from "@/components/date-range-selector" // Added DateRangeSelector import
import { AIAnalysisModal } from "@/components/ai-analysis-modal"
import { CampaignPredictions } from "@/components/campaign-predictions"
import { DemographicAnalytics } from "@/components/demographic-analytics"
import { DayHourPerformance } from "@/components/day-hour-performance" // Corrected import name
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// --- Interfaces ---
interface MetaAction {
  action_type: string
  value: string
}

interface CampaignInsightData {
  spend?: string
  impressions?: string
  clicks?: string
  ctr?: string
  cpc?: string
  actions?: MetaAction[]
  action_values?: MetaAction[]
  frequency?: string
  // Add other potential fields if needed from API
  revenue?: string // Explicitly add revenue if it can come from insights
  conversions?: string // Explicitly add conversions
}

interface RawCampaign {
  id: string
  name: string
  created_time: string
  effective_status: string
  status?: string // Added status as it's used for filtering
  insights?: { data?: CampaignInsightData[] }
  todayData?: {
    // For today's specific metrics
    spend: number
    conversions: number
  }
  processedInsights?: ProcessedCampaignInsights // Ensure this is always populated
}

interface ProcessedCampaignInsights {
  spend: number
  revenue: number
  conversions: number
  roas: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  frequency: number
}

interface AdSet {
  id: string
  name: string
  status: string
  insights?: { data?: CampaignInsightData[] }
}
interface HourlyDataPoint {
  hourly_stats_aggregated_by_advertiser_time_zone?: string
  time_start?: string
  spend?: string
  impressions?: string
  clicks?: string
  actions?: MetaAction[]
}

interface ProcessedCampaign extends RawCampaign {
  processedInsights: ProcessedCampaignInsights
  expandedData?: { adSets: AdSet[]; hourlyData: HourlyDataPoint[]; isLoading: boolean; error?: string }
}
interface FetchError {
  error: string
  details?: any
}

interface OverviewDataState {
  todaySpend: number
  todayConversions: number
  totalSpend: number
  totalRevenue: number
  totalConversions: number
  totalImpressions: number
  totalClicks: number
  activeCampaigns: number
  overallROAS: number
  avgCTR: number
  avgCPC: number
  avgCPA: number
}

// --- Helper Functions ---
const findMetaActionValue = (items: MetaAction[] | undefined, targetTypes: string[]): number => {
  if (!items) return 0
  return items
    .filter((item) => targetTypes.includes(item.action_type))
    .reduce((sum, item) => sum + Number.parseFloat(item.value || "0"), 0)
}

const processCampaignInsightsHelper = (insightData?: CampaignInsightData): ProcessedCampaignInsights => {
  const data = insightData || {}
  const spend = Number.parseFloat(data.spend || "0")
  const revenue = findMetaActionValue(data.action_values, [
    "omni_purchase",
    "purchase",
    "offsite_conversion.fb_pixel_purchase",
  ])
  const conversions = findMetaActionValue(data.actions, [
    "omni_purchase",
    "purchase",
    "offsite_conversion.fb_pixel_purchase",
    "complete_registration", // Added from user's code
    "lead", // Added from user's code
  ])
  return {
    spend,
    revenue,
    conversions,
    roas: spend > 0 ? revenue / spend : 0,
    impressions: Number.parseInt(data.impressions || "0", 10),
    clicks: Number.parseInt(data.clicks || "0", 10),
    ctr: Number.parseFloat(data.ctr || "0"), // Meta often provides CTR directly
    cpc: Number.parseFloat(data.cpc || "0"), // Meta often provides CPC directly
    frequency: Number.parseFloat(data.frequency || "0"),
  }
}

// --- Main Component ---
export default function AdvancedDashboardPage() {
  const [accessToken, setAccessToken] = useState("")
  const [adAccountId, setAdAccountId] = useState("")
  const [credentialsSubmitted, setCredentialsSubmitted] = useState(false)
  const [showSettings, setShowSettings] = useState(true)

  // Data states
  const [campaigns, setCampaigns] = useState<ProcessedCampaign[]>([])
  const [overviewData, setOverviewData] = useState<OverviewDataState>({
    todaySpend: 0,
    todayConversions: 0,
    totalSpend: 0,
    totalRevenue: 0,
    totalConversions: 0,
    totalImpressions: 0,
    totalClicks: 0,
    activeCampaigns: 0,
    overallROAS: 0,
    avgCTR: 0,
    avgCPC: 0,
    avgCPA: 0,
  })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // UI states
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState<FetchError | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false) // Renamed from autoRefreshEnabled
  const [refreshInterval, setRefreshInterval] = useState(300000) // Default to 5 minutes (in ms)
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null)
  const [selectedDateRange, setSelectedDateRange] = useState("last_30d") // Default date range

  // Filter and sort states
  const [campaignStatusFilter, setCampaignStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_desc")
  const [activeTab, setActiveTab] = useState<string>("overview") // For campaign details tabs

  // --- Effects ---
  useEffect(() => {
    const storedToken = localStorage.getItem("metaAccessToken")
    const storedAccountId = localStorage.getItem("metaAdAccountId")
    if (storedToken && storedAccountId) {
      setAccessToken(storedToken)
      setAdAccountId(storedAccountId)
      setCredentialsSubmitted(true)
      setShowSettings(false)
    } else {
      setShowSettings(true) // Ensure settings are shown if no credentials
    }
  }, [])

  const fetchOverviewData = useCallback(
    async (isRefresh = false) => {
      if (!accessToken || !adAccountId) return
      if (!isRefresh) setIsLoading(true)
      else setIsRefreshing(true)
      setFetchError(null)

      try {
        const response = await fetch("/api/meta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "overview",
            datePreset: selectedDateRange,
            accessToken: accessToken,
            adAccountId: adAccountId,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch overview data")
        }

        const data = await response.json()
        const fetchedCampaigns: RawCampaign[] = data.campaigns || []

        let todaySpend = 0
        let todayConversions = 0
        let totalSpend = 0
        let totalRevenue = 0
        let totalConversions = 0
        let totalImpressions = 0
        let totalClicks = 0
        let activeCampaigns = 0

        const processedCampaignsList = fetchedCampaigns.map((campaign: RawCampaign) => {
          // FIX: Count active campaigns correctly
          // The API returns 'effective_status' for overall status, and 'status' for configured status.
          // Prefer 'effective_status' if available, otherwise fallback to 'status'.
          if (campaign.effective_status === "ACTIVE" || campaign.status === "ACTIVE") {
            activeCampaigns++
          }

          const insights = campaign.processedInsights || processCampaignInsightsHelper(campaign.insights?.data?.[0])

          totalSpend += insights.spend || 0
          totalRevenue += insights.revenue || 0
          totalConversions += insights.conversions || 0
          totalImpressions += insights.impressions || 0
          totalClicks += insights.clicks || 0

          if (campaign.todayData) {
            todaySpend += campaign.todayData.spend || 0
            todayConversions += campaign.todayData.conversions || 0
          }
          return { ...campaign, processedInsights: insights }
        })

        const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
        const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
        const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0
        const avgCPA = totalConversions > 0 ? totalSpend / totalConversions : 0

        setCampaigns(processedCampaignsList as ProcessedCampaign[])
        setOverviewData({
          todaySpend,
          todayConversions,
          totalSpend,
          totalRevenue,
          totalConversions,
          totalImpressions,
          totalClicks,
          activeCampaigns,
          overallROAS,
          avgCTR,
          avgCPC,
          avgCPA,
        })
        setLastUpdated(new Date())
      } catch (err: any) {
        console.error("Failed to fetch overview data:", err)
        setFetchError({ error: err.message })
      } finally {
        if (!isRefresh) setIsLoading(false)
        else setIsRefreshing(false)
      }
    },
    [accessToken, adAccountId, selectedDateRange],
  )

  useEffect(() => {
    if (credentialsSubmitted) {
      fetchOverviewData()
    }
  }, [credentialsSubmitted, fetchOverviewData]) // fetchOverviewData is now a dependency

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    if (autoRefresh && credentialsSubmitted && refreshInterval > 0) {
      intervalId = setInterval(() => fetchOverviewData(true), refreshInterval)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [autoRefresh, refreshInterval, credentialsSubmitted, fetchOverviewData])

  const handleCredentialSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!accessToken || !adAccountId) {
      setFetchError({ error: "Token and Account ID are required." })
      return
    }
    localStorage.setItem("metaAccessToken", accessToken)
    localStorage.setItem("metaAdAccountId", adAccountId)
    setCredentialsSubmitted(true)
    setShowSettings(false)
  }
  const clearCredentials = () => {
    localStorage.removeItem("metaAccessToken")
    localStorage.removeItem("metaAdAccountId")
    setAccessToken("")
    setAdAccountId("")
    setCredentialsSubmitted(false)
    setCampaigns([])
    setFetchError(null)
    setShowSettings(true)
    setOverviewData({
      // Reset overview data
      todaySpend: 0,
      todayConversions: 0,
      totalSpend: 0,
      totalRevenue: 0,
      totalConversions: 0,
      totalImpressions: 0,
      totalClicks: 0,
      activeCampaigns: 0,
      overallROAS: 0,
      avgCTR: 0,
      avgCPC: 0,
      avgCPA: 0,
    })
    setLastUpdated(null)
  }

  const fetchCampaignDetails = async (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              expandedData: {
                ...(c.expandedData || { adSets: [], hourlyData: [] }),
                isLoading: true,
                error: undefined,
              },
            }
          : c,
      ),
    )
    try {
      const res = await fetch(`/api/meta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          adAccountId,
          type: "campaign_details",
          campaignId,
          datePreset: selectedDateRange,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Failed to fetch details for campaign ${campaignId}`)

      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId
            ? { ...c, expandedData: { adSets: data.adSets || [], hourlyData: data.hourlyData || [], isLoading: false } }
            : c,
        ),
      )
    } catch (err: any) {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId
            ? {
                ...c,
                expandedData: {
                  ...(c.expandedData || { adSets: [], hourlyData: [] }),
                  isLoading: false,
                  error: err.message,
                },
              }
            : c,
        ),
      )
    }
  }

  const onAccordionChange = (value: string) => {
    const newExpandedId = expandedCampaignId === value ? null : value
    setExpandedCampaignId(newExpandedId)
    if (newExpandedId) {
      const campaign = campaigns.find((c) => c.id === newExpandedId)
      // Fetch if no data or if data is stale (e.g., different date range was used previously)
      // For simplicity, always refetching if not loaded. Add more complex logic if needed.
      if (!campaign?.expandedData?.adSets?.length && !campaign?.expandedData?.hourlyData?.length) {
        fetchCampaignDetails(newExpandedId)
      }
    }
  }

  const exportCampaignToJson = (campaign: ProcessedCampaign) => {
    const dataStr = JSON.stringify(campaign, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `${campaign.name.replace(/\s+/g, "_")}_data.json`
    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const getFilteredAndSortedCampaigns = () => {
    let filtered = campaigns

    if (campaignStatusFilter !== "all") {
      filtered = filtered.filter((c) => (c.effective_status || c.status) === campaignStatusFilter)
    }

    const sorted = [...filtered].sort((a, b) => {
      const aInsights = a.processedInsights || { spend: 0, roas: 0 }
      const bInsights = b.processedInsights || { spend: 0, roas: 0 }
      switch (sortBy) {
        case "created_desc":
          return new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
        case "created_asc":
          return new Date(a.created_time).getTime() - new Date(b.created_time).getTime()
        case "spend_desc":
          return (bInsights.spend || 0) - (aInsights.spend || 0)
        case "roas_desc":
          return (bInsights.roas || 0) - (aInsights.roas || 0)
        case "name_asc":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })
    return sorted
  }

  // --- Metric Card Component ---
  const MetricCard = ({
    title,
    value,
    subtitle,
    gradient,
    icon: Icon,
    pulse,
  }: {
    title: string
    value: string | number
    subtitle?: React.ReactNode
    gradient: string
    icon: React.ElementType
    pulse?: boolean
  }) => (
    <Card className={`text-white shadow-xl ${gradient} hover:opacity-90 transition-opacity relative overflow-hidden`}>
      {pulse && <div className="absolute inset-0 bg-white opacity-10 animate-pulse"></div>}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-gray-200" />
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-gray-200/80 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )

  // --- Render ---
  if (!credentialsSubmitted && showSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Card className="w-full max-w-md mx-auto shadow-lg bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">API Credentials</CardTitle>
            <CardDescription className="text-gray-400">
              Enter Meta Ads API Access Token & Ad Account ID. Stored in your browser.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCredentialSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="accessToken" className="text-gray-300">
                  Access Token
                </Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="EAA..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  required
                  className="text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adAccountId" className="text-gray-300">
                  Ad Account ID
                </Label>
                <Input
                  id="adAccountId"
                  type="text"
                  placeholder="act_1234567890"
                  value={adAccountId}
                  onChange={(e) => setAdAccountId(e.target.value)}
                  required
                  className="text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={clearCredentials}
                className="text-sm text-gray-400 hover:text-white w-full sm:w-auto"
              >
                Clear Credentials
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isRefreshing || !accessToken || !adAccountId}
                className="text-sm w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
              >
                {(isLoading && !campaigns.length) || isRefreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save & Fetch Data
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 text-white">
      {/* Header with Date Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
          {" "}
          {/* Added flex-wrap and gap-4 */}
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Meta Ads Dashboard Pro
            </h1>
            <p className="text-gray-400 mt-1 text-xs">
              Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "Never"}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {" "}
            {/* Added flex-wrap */}
            <DateRangeSelector
              value={selectedDateRange}
              onChange={(value) => {
                setSelectedDateRange(value)
                if (credentialsSubmitted) {
                  fetchOverviewData() // Re-fetch on change
                }
              }}
              disabled={isLoading || isRefreshing}
            />
            <div className="flex items-center gap-2">
              <Switch
                id="auto-refresh-switch" // Added id for label association
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
                className="data-[state=checked]:bg-blue-600"
              />
              <Label htmlFor="auto-refresh-switch" className="text-sm text-gray-400 whitespace-nowrap">
                Auto-Refresh
              </Label>
            </div>
            <Select
              value={String(refreshInterval)}
              onValueChange={(value) => setRefreshInterval(Number.parseInt(value))}
              disabled={!autoRefresh || isLoading || isRefreshing}
            >
              <SelectTrigger className="w-28 bg-gray-800 border-gray-700 text-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="60000" className="text-xs hover:bg-gray-700 focus:bg-gray-600">
                  1 min
                </SelectItem>
                <SelectItem value="300000" className="text-xs hover:bg-gray-700 focus:bg-gray-600">
                  5 min
                </SelectItem>
                <SelectItem value="600000" className="text-xs hover:bg-gray-700 focus:bg-gray-600">
                  10 min
                </SelectItem>
                <SelectItem value="1800000" className="text-xs hover:bg-gray-700 focus:bg-gray-600">
                  30 min
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors border-gray-700 text-white"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {isLoading && campaigns.length === 0 && (
        <div className="flex justify-center items-center py-20 min-h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="ml-3 text-lg text-gray-400">Loading Dashboard Data...</p>
        </div>
      )}
      {fetchError && (
        <Alert variant="destructive" className="bg-red-900/80 border-red-700 text-red-100">
          <AlertCircle className="h-5 w-5 text-red-300" />
          <AlertTitle className="font-semibold">Dashboard Error</AlertTitle>
          <AlertDescription>{fetchError.error}</AlertDescription>
        </Alert>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <MetricCard
          title="Today's Spend"
          value={formatCurrency(overviewData.todaySpend)}
          subtitle={
            <span className="flex items-center gap-1 text-xs">
              LIVE <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            </span>
          }
          gradient="bg-gradient-to-br from-blue-900 to-blue-800"
          icon={DollarSign}
          pulse={isRefreshing && overviewData.todaySpend === 0} // Pulse if refreshing and no data yet
        />

        <MetricCard
          title={`Total Revenue (${selectedDateRange.replace(/_/g, " ")})`}
          value={formatCurrency(overviewData.totalRevenue)}
          subtitle={`${overviewData.overallROAS.toFixed(2)}x ROAS`}
          gradient="bg-gradient-to-br from-green-900 to-green-800"
          icon={TrendingUp}
        />

        <MetricCard
          title="Active Campaigns"
          value={overviewData.activeCampaigns.toString()}
          subtitle="Currently Running"
          gradient="bg-gradient-to-br from-purple-900 to-purple-800"
          icon={Activity}
        />

        <MetricCard
          title={`Conversions (${selectedDateRange.replace(/_/g, " ")})`}
          value={formatNumberWithCommas(overviewData.totalConversions)}
          subtitle={`${formatNumberWithCommas(overviewData.todayConversions)} today`}
          gradient="bg-gradient-to-br from-yellow-900 to-yellow-800"
          icon={Target}
        />

        <MetricCard
          title={`Average CPA (${selectedDateRange.replace(/_/g, " ")})`}
          value={formatCurrency(overviewData.avgCPA)}
          subtitle="Per conversion"
          gradient="bg-gradient-to-br from-red-900 to-red-800"
          icon={MousePointer}
        />

        <Card className="bg-gray-800 border-gray-700 shadow-xl flex items-center justify-center">
          <Button
            variant="ghost"
            className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50"
            onClick={() => fetchOverviewData(true)}
            disabled={isRefreshing || isLoading}
          >
            {isRefreshing ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <RefreshCw className="h-8 w-8 group-hover:animate-spin" />
            )}
            <span className="mt-2 text-xs">Refresh All</span>
          </Button>
        </Card>
      </div>

      {/* Campaign Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select
          value={campaignStatusFilter}
          onValueChange={setCampaignStatusFilter}
          disabled={isLoading || isRefreshing}
        >
          <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-700 text-white text-xs">
            <SelectValue placeholder="All Campaigns" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white">
            <SelectItem value="all" className="text-xs hover:bg-gray-700 focus:bg-gray-600">
              All Campaigns
            </SelectItem>
            <SelectItem value="ACTIVE" className="text-xs hover:bg-gray-700 focus:bg-gray-600">
              Active Only
            </SelectItem>
            <SelectItem value="PAUSED" className="text-xs hover:bg-gray-700 focus:bg-gray-600">
              Paused Only
            </SelectItem>
            {/* Add other statuses if needed, e.g., ARCHIVED, DELETED */}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy} disabled={isLoading || isRefreshing}>
          <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-700 text-white text-xs">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white">
            <SelectItem value="created_desc" className="text-xs hover:bg-gray-700 focus:bg-gray-600">
              Newest First
            </SelectItem>
            <SelectItem value="created_asc" className="text-xs hover:bg-gray-700 focus:bg-gray-600">
              Oldest First
            </SelectItem>
            <SelectItem value="spend_desc" className="text-xs hover:bg-gray-700 focus:bg-gray-600">
              Highest Spend
            </SelectItem>
            <SelectItem value="roas_desc" className="text-xs hover:bg-gray-700 focus:bg-gray-600">
              Highest ROAS
            </SelectItem>
            <SelectItem value="name_asc" className="text-xs hover:bg-gray-700 focus:bg-gray-600">
              Name (A-Z)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns Table */}
      {credentialsSubmitted && !isLoading && campaigns.length > 0 && (
        <Card className="bg-gray-800 border-gray-700 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Campaigns Overview ({selectedDateRange.replace(/_/g, " ")})</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion
              type="single"
              collapsible
              className="w-full"
              value={expandedCampaignId || undefined}
              onValueChange={onAccordionChange}
            >
              {getFilteredAndSortedCampaigns().map((campaign) => (
                <AccordionItem
                  key={campaign.id}
                  value={campaign.id}
                  className="border-b border-gray-700 last:border-b-0"
                >
                  <AccordionTrigger className="hover:bg-gray-700/50 px-4 py-3 text-left text-sm font-medium [&[data-state=open]>svg]:rotate-180 transition-colors">
                    <div className="grid grid-cols-3 md:grid-cols-7 gap-2 w-full items-center">
                      {" "}
                      {/* Adjusted grid for AI button */}
                      <span className="col-span-2 md:col-span-2 truncate" title={campaign.name}>
                        {" "}
                        {/* Adjusted span */}
                        {campaign.name}
                      </span>
                      <span className="text-right hidden md:block">
                        {formatCurrency(campaign.processedInsights.spend)}
                      </span>
                      <span className="text-right hidden md:block">{`${campaign.processedInsights.roas.toFixed(
                        2,
                      )}x`}</span>
                      <span className="text-right">
                        {formatNumberWithCommas(campaign.processedInsights.conversions)}
                      </span>
                      <span
                        className={`text-xs ${
                          (campaign.effective_status || campaign.status) === "ACTIVE"
                            ? "text-green-400"
                            : "text-gray-400"
                        } hidden md:block text-right`}
                      >
                        {campaign.effective_status || campaign.status}
                      </span>
                      <div className="hidden md:flex justify-end">
                        <AIAnalysisModal
                          campaign={campaign}
                          historicalData={campaign.expandedData?.hourlyData} // Pass appropriate historical data
                          allCampaigns={campaigns}
                        />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="bg-gray-800/50 p-0 md:p-4 space-y-6 border-t border-gray-700">
                    {campaign.expandedData?.isLoading && (
                      <div className="flex justify-center items-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                        <span className="ml-2 text-gray-400">Loading details...</span>
                      </div>
                    )}
                    {campaign.expandedData?.error && (
                      <Alert variant="destructive" className="bg-red-900/80 border-red-700 text-red-100 m-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{campaign.expandedData.error}</AlertDescription>
                      </Alert>
                    )}

                    {campaign.expandedData && !campaign.expandedData.isLoading && !campaign.expandedData.error && (
                      <Tabs
                        defaultValue="overview_detail"
                        className="w-full"
                        value={activeTab}
                        onValueChange={setActiveTab}
                      >
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4 sticky top-0 z-10 bg-gray-800/80 backdrop-blur-sm p-1 rounded-md">
                          <TabsTrigger
                            value="overview_detail"
                            className="text-xs data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                          >
                            Performance
                          </TabsTrigger>
                          <TabsTrigger
                            value="predictions"
                            className="text-xs data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                          >
                            Predictions
                          </TabsTrigger>
                          <TabsTrigger
                            value="demographics"
                            className="text-xs data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                          >
                            Demographics
                          </TabsTrigger>
                          <TabsTrigger
                            value="day_hour"
                            className="text-xs data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                          >
                            Day/Hour
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview_detail" className="p-0 md:p-2">
                          <Card className="bg-gray-700/30 border-gray-600">
                            <CardHeader>
                              <CardTitle className="text-base">Today's Hourly Performance</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                  data={(campaign.expandedData.hourlyData || []).map((h) => ({
                                    time: new Date(
                                      h.hourly_stats_aggregated_by_advertiser_time_zone || h.time_start || Date.now(),
                                    ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                                    spend: Number.parseFloat(h.spend || "0"),
                                    roas:
                                      Number.parseFloat(h.spend || "0") > 0
                                        ? findMetaActionValue(h.actions, [
                                            "omni_purchase",
                                            "purchase",
                                            "offsite_conversion.fb_pixel_purchase",
                                          ]) / Number.parseFloat(h.spend || "0")
                                        : 0,
                                  }))}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 114, 128, 0.3)" />
                                  <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                                  <YAxis
                                    yAxisId="left"
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                                  />
                                  <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickFormatter={(value) => `${value.toFixed(1)}x`}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: "rgba(31, 41, 55, 0.9)",
                                      border: "1px solid #4B5563",
                                      borderRadius: "0.375rem",
                                      color: "#F3F4F6",
                                    }}
                                    itemStyle={{ color: "#D1D5DB" }}
                                    labelStyle={{ color: "#E5E7EB", fontWeight: "bold" }}
                                  />
                                  <Legend wrapperStyle={{ fontSize: "12px", color: "#D1D5DB" }} />
                                  <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="spend"
                                    stroke="#60A5FA"
                                    fill="#60A5FA"
                                    fillOpacity={0.2}
                                    name="Spend ($)"
                                  />
                                  <Area
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="roas"
                                    stroke="#34D399"
                                    fill="#34D399"
                                    fillOpacity={0.2}
                                    name="ROAS"
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>

                          <Card className="bg-gray-700/30 border-gray-600 mt-4">
                            <CardHeader>
                              <CardTitle className="text-base">Ad Sets</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-gray-600 hover:bg-gray-700/50">
                                    <TableHead className="text-gray-300">Name</TableHead>
                                    <TableHead className="text-gray-300">Status</TableHead>
                                    <TableHead className="text-right text-gray-300">Spend</TableHead>
                                    <TableHead className="text-right text-gray-300">ROAS</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(campaign.expandedData.adSets || []).map((adSet) => {
                                    const adSetInsights = processCampaignInsightsHelper(adSet.insights?.data?.[0])
                                    return (
                                      <TableRow
                                        key={adSet.id}
                                        className="border-gray-600 hover:bg-gray-700/50 text-xs text-gray-400"
                                      >
                                        <TableCell className="text-gray-300">{adSet.name}</TableCell>
                                        <TableCell
                                          className={adSet.status === "ACTIVE" ? "text-green-400" : "text-gray-500"}
                                        >
                                          {adSet.status}
                                        </TableCell>
                                        <TableCell className="text-right text-gray-300">
                                          {formatCurrency(adSetInsights.spend)}
                                        </TableCell>
                                        <TableCell className="text-right text-gray-300">
                                          {adSetInsights.roas.toFixed(2)}x
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })}
                                  {campaign.expandedData.adSets?.length === 0 && (
                                    <TableRow>
                                      <TableCell colSpan={4} className="text-center text-gray-500 py-4">
                                        No ad sets found for this campaign.
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                          <div className="grid md:grid-cols-2 gap-4 mt-4">
                            <Card className="bg-gray-700/30 border-gray-600">
                              <CardHeader>
                                <CardTitle className="text-base">Quick Analysis</CardTitle>
                              </CardHeader>
                              <CardContent className="text-xs text-gray-300 space-y-2">
                                <p>
                                  Overall ROAS ({selectedDateRange.replace("_", " ")}):{" "}
                                  <span className="font-semibold">{campaign.processedInsights.roas.toFixed(2)}x</span>
                                </p>
                                <p>
                                  {campaign.processedInsights.roas < 1
                                    ? "Recommendation: ROAS is low. Review ad creatives, targeting, and landing page."
                                    : campaign.processedInsights.roas > 3
                                      ? "Recommendation: ROAS is strong! Consider scaling budget or exploring lookalike audiences."
                                      : "Recommendation: Performance is moderate. Monitor closely and optimize."}
                                </p>
                                {campaign.processedInsights.frequency > 3 && (
                                  <p className="mt-2 text-yellow-400 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                                    High Frequency ({campaign.processedInsights.frequency.toFixed(2)}). Consider
                                    audience refresh.
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                            <div className="space-y-2 flex flex-col justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-xs text-gray-300"
                                onClick={() => exportCampaignToJson(campaign)}
                              >
                                <Download className="mr-2 h-3 w-3" /> Export Campaign JSON
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-xs text-gray-300"
                              >
                                <a
                                  href={`https://www.facebook.com/adsmanager/manage/campaigns/edit?act=${adAccountId}&campaign_id=${campaign.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="mr-2 h-3 w-3" /> View in Ads Manager
                                </a>
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="predictions" className="p-0 md:p-2">
                          <CampaignPredictions
                            campaignName={campaign.name}
                            historicalData={campaign.expandedData?.hourlyData || []} // Adjust as needed
                            currentMetrics={campaign.processedInsights}
                          />
                        </TabsContent>
                        <TabsContent value="demographics" className="p-0 md:p-2">
                          <DemographicAnalytics
                            campaignId={campaign.id}
                            accessToken={accessToken || ""}
                            datePreset={selectedDateRange}
                          />
                        </TabsContent>
                        <TabsContent value="day_hour" className="p-0 md:p-2">
                          <DayHourPerformance
                            campaignId={campaign.id}
                            campaignName={campaign.name}
                            accessToken={accessToken || ""}
                            datePreset={selectedDateRange}
                          />
                        </TabsContent>
                      </Tabs>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {getFilteredAndSortedCampaigns().length === 0 && !isLoading && (
              <div className="text-center py-10 text-gray-500">
                <Info className="mx-auto h-8 w-8 mb-2" />
                No campaigns match the current filters.
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <footer className="text-center mt-12 py-6 border-t border-gray-700">
        <p className="text-sm text-gray-500">Meta Ads Dashboard Pro | Built with Next.js & v0</p>
      </footer>
    </div>
  )
}
