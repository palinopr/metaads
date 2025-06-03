"use client"

import type React from "react"
import { useState, useEffect, type FormEvent, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Added Tabs
import { DateRangeSelector, type DateRangePreset } from "@/components/date-range-selector"
import { CampaignPredictions } from "@/components/campaign-predictions" // Added CampaignPredictions
import { AIAnalysisModal } from "@/components/ai-analysis-modal"
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
  LineChartIcon,
  BarChart3,
} from "lucide-react"
import { formatNumberWithCommas, formatCurrency, formatPercentage } from "@/lib/utils"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// --- Interfaces (ensure HistoricalDataPoint is defined or imported if needed by CampaignPredictions) ---
interface MetaAction {
  action_type: string
  value: string
}

interface DailyInsightData {
  date_start: string
  date_stop: string
  spend?: string
  impressions?: string
  clicks?: string
  ctr?: string
  cpc?: string
  actions?: MetaAction[]
  action_values?: MetaAction[]
  roas?: { action_type: string; value: string }[]
  frequency?: string
}

// This interface is what CampaignPredictions expects for its historicalData prop
interface HistoricalDataPointForPrediction {
  date: string // YYYY-MM-DD
  spend: number
  revenue: number
  roas: number
  conversions: number
}

interface CampaignInsightSummary {
  spend?: string
  impressions?: string
  clicks?: string
  ctr?: string
  cpc?: string
  actions?: MetaAction[]
  action_values?: MetaAction[]
  frequency?: string
}

interface RawCampaign {
  id: string
  name: string
  created_time: string
  effective_status: string
  insights?: { data?: CampaignInsightSummary[] }
}
interface AdSet {
  id: string
  name: string
  status: string
  insights?: { data?: CampaignInsightSummary[] }
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
  processedInsights: ReturnType<typeof processCampaignInsights> // Summary insights
  expandedData?: {
    adSets: AdSet[]
    hourlyData: HourlyDataPoint[]
    historicalDailyData?: DailyInsightData[] // Raw from API
    processedHistoricalDailyData?: HistoricalDataPointForPrediction[] // Formatted for CampaignPredictions
    isLoading: boolean
    error?: string
  }
}
interface FetchError {
  error: string
  details?: any
}

// --- Helper Functions ---
const findMetaActionValue = (items: MetaAction[] | undefined, targetTypes: string[]): number => {
  if (!items) return 0
  return items
    .filter((item) => targetTypes.includes(item.action_type))
    .reduce((sum, item) => sum + Number.parseFloat(item.value || "0"), 0)
}

const getROASValue = (roasData: any): number => {
  if (!roasData) return 0
  if (Array.isArray(roasData)) {
    const purchaseRoas = roasData.find((r) => r.action_type === "omni_purchase" || r.action_type === "purchase")
    return Number.parseFloat(purchaseRoas?.value || "0")
  }
  if (typeof roasData === "string" || typeof roasData === "number") {
    return Number.parseFloat(String(roasData))
  }
  return 0
}

const processCampaignInsights = (insightData?: CampaignInsightSummary | DailyInsightData) => {
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
    "complete_registration",
    "lead",
  ])
  let roasValue = 0
  if ("roas" in data && data.roas) {
    roasValue = getROASValue(data.roas)
  } else {
    roasValue = spend > 0 ? revenue / spend : 0
  }
  return {
    spend,
    revenue,
    conversions,
    roas: roasValue,
    impressions: Number.parseInt(data.impressions || "0", 10),
    clicks: Number.parseInt(data.clicks || "0", 10),
    ctr: Number.parseFloat(data.ctr || "0"),
    cpc: Number.parseFloat(data.cpc || "0"),
    frequency: Number.parseFloat(data.frequency || "0"),
    date: "date_start" in data ? data.date_start : undefined,
  }
}

// --- Main Component ---
export default function AdvancedDashboardPage() {
  const [accessToken, setAccessToken] = useState("")
  const [adAccountId, setAdAccountId] = useState("")
  const [credentialsSubmitted, setCredentialsSubmitted] = useState(false)
  const [showSettings, setShowSettings] = useState(true)
  const [todaySpend, setTodaySpend] = useState(0)
  const [activeCampaignsCount, setActiveCampaignsCount] = useState(0)
  const [campaigns, setCampaigns] = useState<ProcessedCampaign[]>([])
  const [overallStats, setOverallStats] = useState({
    totalRevenue: 0,
    avgCPA: 0,
    totalSpend: 0,
    totalConversions: 0,
    avgROAS: 0,
    avgCTR: 0,
    avgCPC: 0,
  })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState<FetchError | null>(null)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState("5")
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null)
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangePreset>("last_30d")

  useEffect(() => {
    const storedToken = localStorage.getItem("metaAccessToken")
    const storedAccountId = localStorage.getItem("metaAdAccountId")
    if (storedToken && storedAccountId) {
      setAccessToken(storedToken)
      setAdAccountId(storedAccountId)
      setCredentialsSubmitted(true)
      setShowSettings(false)
    }
  }, [])

  const fetchOverviewData = useCallback(
    async (isRefresh = false) => {
      if (!accessToken || !adAccountId) return
      if (!isRefresh) setIsLoading(true)
      else setIsRefreshing(true)
      setFetchError(null)
      try {
        const res = await fetch(`/api/meta`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken, adAccountId, type: "overview", datePreset: selectedDateRange }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to fetch overview data")
        setTodaySpend(Number.parseFloat(data.todayData?.spend || "0"))
        setActiveCampaignsCount(data.activeCampaignsCount || 0)
        const processedCampaignsList = (data.campaigns || []).map((c: RawCampaign) => ({
          ...c,
          processedInsights: processCampaignInsights(c.insights?.data?.[0]),
        }))
        setCampaigns(processedCampaignsList)
        let totalSpend = 0,
          totalRevenue = 0,
          totalConversions = 0,
          totalImpressions = 0,
          totalClicks = 0
        processedCampaignsList.forEach((c) => {
          totalSpend += c.processedInsights.spend
          totalRevenue += c.processedInsights.revenue
          totalConversions += c.processedInsights.conversions
          totalImpressions += c.processedInsights.impressions
          totalClicks += c.processedInsights.clicks
        })
        setOverallStats({
          totalSpend,
          totalRevenue,
          totalConversions,
          avgCPA: totalConversions > 0 ? totalSpend / totalConversions : 0,
          avgROAS: totalSpend > 0 ? totalRevenue / totalSpend : 0,
          avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
          avgCPC: totalClicks > 0 ? totalSpend / totalClicks : 0,
        })
        setLastUpdated(new Date())
      } catch (err: any) {
        setFetchError({ error: err.message })
      } finally {
        if (!isRefresh) setIsLoading(false)
        else setIsRefreshing(false)
      }
    },
    [accessToken, adAccountId, selectedDateRange],
  )

  useEffect(() => {
    if (credentialsSubmitted) fetchOverviewData()
  }, [credentialsSubmitted, fetchOverviewData, selectedDateRange])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    if (autoRefreshEnabled && credentialsSubmitted) {
      intervalId = setInterval(() => fetchOverviewData(true), Number(refreshInterval) * 60 * 1000)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [autoRefreshEnabled, refreshInterval, credentialsSubmitted, fetchOverviewData])

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
    setShowSettings(true)
  }

  const fetchCampaignHistoricalAndDetails = async (campaignId: string) => {
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
      const detailsRes = await fetch(`/api/meta`, {
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
      const detailsData = await detailsRes.json()
      if (!detailsRes.ok) throw new Error(detailsData.error || `Failed to fetch details for campaign ${campaignId}`)

      const historicalRes = await fetch(`/api/meta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          adAccountId,
          type: "historical_campaign_data",
          campaignId,
          datePreset: selectedDateRange,
        }),
      })
      const historicalApiData = await historicalRes.json()
      if (!historicalRes.ok)
        throw new Error(historicalApiData.error || `Failed to fetch historical data for campaign ${campaignId}`)

      const processedHistorical = (historicalApiData.historicalData || [])
        .map((d: DailyInsightData) => {
          const processed = processCampaignInsights(d)
          return {
            // Format for CampaignPredictions component
            date: d.date_start, // YYYY-MM-DD
            spend: processed.spend,
            revenue: processed.revenue,
            roas: processed.roas,
            conversions: processed.conversions,
          }
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId
            ? {
                ...c,
                expandedData: {
                  adSets: detailsData.adSets || [],
                  hourlyData: detailsData.hourlyData || [],
                  historicalDailyData: historicalApiData.historicalData || [],
                  processedHistoricalDailyData: processedHistorical,
                  isLoading: false,
                },
              }
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
      if (
        !campaign?.expandedData?.processedHistoricalDailyData?.length ||
        campaign?.expandedData?.isLoading === false
      ) {
        fetchCampaignHistoricalAndDetails(newExpandedId)
      }
    }
  }

  const exportCampaignToJson = (campaign: ProcessedCampaign) => {
    const jsonString = JSON.stringify(campaign, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${campaign.name.replace(/[^a-z0-9]/gi, "_")}_data.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const MetricCard = ({
    title,
    value,
    gradient,
    icon: Icon,
    pulse,
  }: { title: string; value: string | number; gradient: string; icon: React.ElementType; pulse?: boolean }) => (
    <Card className={`text-white shadow-xl ${gradient} hover:opacity-90 transition-opacity relative overflow-hidden`}>
      {pulse && <div className="absolute inset-0 bg-white opacity-10 animate-pulse"></div>}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-gray-200" />
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )

  const StatCard = ({ title, value }: { title: string; value: string | number }) => (
    <Card className="bg-gray-800 border-gray-700 shadow-lg hover:bg-gray-700/50 transition-colors">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-2xl font-bold text-white">{value}</div>
      </CardContent>
    </Card>
  )

  if (!credentialsSubmitted && showSettings) {
    // ... (Credential form - same as before)
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
      {/* Header and Controls */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-gray-700 pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Meta Ads Dashboard Pro</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangeSelector
            selectedRange={selectedDateRange}
            onRangeChange={setSelectedDateRange}
            disabled={isLoading || isRefreshing}
          />
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-refresh"
              checked={autoRefreshEnabled}
              onCheckedChange={setAutoRefreshEnabled}
              className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-600"
            />
            <Label htmlFor="auto-refresh" className="text-sm text-gray-300 whitespace-nowrap">
              Auto-Refresh
            </Label>
          </div>
          <Select value={refreshInterval} onValueChange={setRefreshInterval} disabled={!autoRefreshEnabled}>
            <SelectTrigger className="w-[100px] text-sm bg-gray-700 border-gray-600 hover:border-gray-500 focus:ring-blue-500">
              <SelectValue placeholder="Interval" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              {[1, 5, 10, 30].map((val) => (
                <SelectItem key={val} value={String(val)} className="hover:bg-gray-700 focus:bg-gray-600">
                  {val} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchOverviewData(true)}
            disabled={isRefreshing || isLoading}
            title="Refresh Data"
            className="bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500 text-white"
          >
            {isRefreshing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5 group-hover:animate-spin" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(true)}
            title="Settings"
            className="border-gray-600 hover:bg-gray-700 hover:border-gray-500"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {lastUpdated && (
        <p className="text-xs text-gray-500 text-right -mt-4">
          Last updated: {lastUpdated.toLocaleTimeString()} ({selectedDateRange.replace("_", " ").replace("d", " days")})
        </p>
      )}

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

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Today's Spend"
          value={formatCurrency(todaySpend)}
          gradient="bg-gradient-to-br from-blue-900 to-blue-800"
          icon={DollarSign}
          pulse={isRefreshing}
        />
        <MetricCard
          title={`Revenue (${selectedDateRange.replace("_", " ")})`}
          value={formatCurrency(overallStats.totalRevenue)}
          gradient="bg-gradient-to-br from-green-900 to-green-800"
          icon={TrendingUp}
        />
        <MetricCard
          title="Active Campaigns"
          value={activeCampaignsCount}
          gradient="bg-gradient-to-br from-purple-900 to-purple-800"
          icon={Activity}
        />
        <MetricCard
          title={`Conversions (${selectedDateRange.replace("_", " ")})`}
          value={formatNumberWithCommas(overallStats.totalConversions)}
          gradient="bg-gradient-to-br from-yellow-900 to-yellow-800"
          icon={Target}
        />
        <MetricCard
          title={`Avg CPA (${selectedDateRange.replace("_", " ")})`}
          value={formatCurrency(overallStats.avgCPA)}
          gradient="bg-gradient-to-br from-red-900 to-red-800"
          icon={DollarSign}
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

      {/* Overall Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title={`Total Spend (${selectedDateRange.replace("_", " ")})`}
          value={formatCurrency(overallStats.totalSpend)}
        />
        <StatCard
          title={`Total Conversions (${selectedDateRange.replace("_", " ")})`}
          value={formatNumberWithCommas(overallStats.totalConversions)}
        />
        <StatCard
          title={`Overall ROAS (${selectedDateRange.replace("_", " ")})`}
          value={`${overallStats.avgROAS.toFixed(2)}x`}
        />
        <StatCard
          title={`Avg CTR (${selectedDateRange.replace("_", " ")})`}
          value={formatPercentage(overallStats.avgCTR, false)}
        />
        <StatCard
          title={`Avg CPC (${selectedDateRange.replace("_", " ")})`}
          value={formatCurrency(overallStats.avgCPC)}
        />
      </div>

      {/* Campaigns Table & Accordion */}
      {credentialsSubmitted && !isLoading && campaigns.length > 0 && (
        <Card className="bg-gray-800 border-gray-700 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">
              Campaigns Overview ({selectedDateRange.replace("_", " ").replace("d", " days")})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion
              type="single"
              collapsible
              className="w-full"
              value={expandedCampaignId || undefined}
              onValueChange={onAccordionChange}
            >
              {campaigns.map((campaign) => {
                const historicalChartData =
                  campaign.expandedData?.processedHistoricalDailyData?.map((d) => ({
                    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), // Format for chart XAxis
                    Spend: d.spend,
                    Revenue: d.revenue,
                    ROAS: d.roas,
                    Conversions: d.conversions,
                  })) || []

                return (
                  <AccordionItem
                    key={campaign.id}
                    value={campaign.id}
                    className="border-b border-gray-700 last:border-b-0"
                  >
                    <AccordionTrigger className="hover:bg-gray-700/50 px-4 py-3 text-left text-sm font-medium [&[data-state=open]>svg]:rotate-180 transition-colors">
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 w-full items-center">
                        <span className="col-span-2 md:col-span-1 truncate" title={campaign.name}>
                          {campaign.name}
                        </span>
                        <span className="text-right hidden md:block">
                          {formatCurrency(campaign.processedInsights.spend)}
                        </span>
                        <span className="text-right hidden md:block">{`${campaign.processedInsights.roas.toFixed(2)}x`}</span>
                        <span className="text-right">
                          {formatNumberWithCommas(campaign.processedInsights.conversions)}
                        </span>
                        <span className="text-right hidden md:block">
                          {formatPercentage(campaign.processedInsights.ctr, false)}
                        </span>
                        <span
                          className={`text-xs ${campaign.effective_status === "ACTIVE" ? "text-green-400" : "text-gray-400"} hidden md:block text-right`}
                        >
                          {campaign.effective_status}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-gray-800/50 p-0 md:p-4 space-y-6 border-t border-gray-700">
                      {campaign.expandedData?.isLoading && (
                        <div className="flex justify-center items-center py-10">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                          <span className="ml-3 text-gray-400">Loading campaign details...</span>
                        </div>
                      )}
                      {campaign.expandedData?.error && (
                        <Alert variant="destructive" className="m-4 bg-red-900/80 border-red-700 text-red-100">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{campaign.expandedData.error}</AlertDescription>
                        </Alert>
                      )}

                      {campaign.expandedData && !campaign.expandedData.isLoading && !campaign.expandedData.error && (
                        <Tabs defaultValue="details" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 gap-1 bg-gray-700/50 p-1 rounded-lg mb-4">
                            <TabsTrigger
                              value="details"
                              className="text-xs md:text-sm py-1.5 data-[state=active]:bg-gray-600 data-[state=active]:text-white text-gray-300 hover:bg-gray-600/70"
                            >
                              Details & Ad Sets
                            </TabsTrigger>
                            <TabsTrigger
                              value="predictions"
                              className="text-xs md:text-sm py-1.5 data-[state=active]:bg-gray-600 data-[state=active]:text-white text-gray-300 hover:bg-gray-600/70"
                            >
                              <BarChart3 className="mr-1.5 h-4 w-4" /> Predictions
                            </TabsTrigger>
                            {/* Placeholder for future "Compare" tab */}
                            <TabsTrigger
                              value="compare"
                              disabled
                              className="text-xs md:text-sm py-1.5 text-gray-500 cursor-not-allowed"
                            >
                              Compare Campaigns
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="details" className="space-y-6">
                            {/* Historical Performance Chart */}
                            {historicalChartData.length > 0 && (
                              <Card className="bg-gray-700/30 border-gray-600">
                                <CardHeader>
                                  <CardTitle className="text-base flex items-center">
                                    <LineChartIcon className="mr-2 h-5 w-5 text-blue-400" />
                                    Historical Performance ({selectedDateRange.replace("_", " ").replace("d", " days")})
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="h-[350px] pt-4">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={historicalChartData}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 114, 128, 0.2)" />
                                      <XAxis
                                        dataKey="date"
                                        stroke="#9CA3AF"
                                        fontSize={10}
                                        tickFormatter={(val) => {
                                          // val is expected to be a string like "Jan 1" from:
                                          // new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                          // This format usually doesn't include the year, so the original .replace(/, \d{4}/, "") was often redundant.
                                          // We'll keep it simple. If val could sometimes include a year, this might need adjustment.
                                          if (typeof val === "string") {
                                            return val.replace(/, \d{4}/, "") // Attempt to remove year if present
                                          }
                                          return String(val) // Fallback
                                        }}
                                      />
                                      <YAxis
                                        yAxisId="left"
                                        stroke="#818CF8"
                                        fontSize={10}
                                        tickFormatter={(value) => `$${formatNumberWithCommas(value)}`}
                                      />
                                      <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        stroke="#FBBF24"
                                        fontSize={10}
                                        tickFormatter={(value) => value.toFixed(1)}
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
                                        formatter={(value: number, name: string) => {
                                          if (name === "Spend" || name === "Revenue") return formatCurrency(value)
                                          if (name === "ROAS") return `${value.toFixed(2)}x`
                                          if (name === "Conversions") return formatNumberWithCommas(value)
                                          return value
                                        }}
                                      />
                                      <Legend
                                        wrapperStyle={{ fontSize: "12px", color: "#D1D5DB", paddingTop: "10px" }}
                                      />
                                      <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="Spend"
                                        stroke="#818CF8"
                                        strokeWidth={2}
                                        dot={{ r: 2 }}
                                        activeDot={{ r: 4 }}
                                        name="Spend ($)"
                                      />
                                      <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="Revenue"
                                        stroke="#34D399"
                                        strokeWidth={2}
                                        dot={{ r: 2 }}
                                        activeDot={{ r: 4 }}
                                        name="Revenue ($)"
                                      />
                                      <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="ROAS"
                                        stroke="#FBBF24"
                                        strokeWidth={2}
                                        dot={{ r: 2 }}
                                        activeDot={{ r: 4 }}
                                        name="ROAS (x)"
                                      />
                                      <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="Conversions"
                                        stroke="#F472B6"
                                        strokeWidth={2}
                                        dot={{ r: 2 }}
                                        activeDot={{ r: 4 }}
                                        name="Conversions"
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </CardContent>
                              </Card>
                            )}
                            {historicalChartData.length === 0 && !campaign.expandedData?.isLoading && (
                              <p className="text-center text-gray-500 py-4">
                                No historical daily data available for this period.
                              </p>
                            )}
                            {/* Today's Hourly Chart, Ad Sets Table, Quick Analysis, Links - same as before */}
                            <Card className="bg-gray-700/30 border-gray-600">
                              <CardHeader>
                                <CardTitle className="text-base">Today's Hourly Performance</CardTitle>
                              </CardHeader>
                              <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={campaign.expandedData.hourlyData.map((h) => ({
                                      time: new Date(
                                        h.hourly_stats_aggregated_by_advertiser_time_zone || h.time_start || Date.now(),
                                      ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                                      spend: Number.parseFloat(h.spend || "0"),
                                      roas:
                                        Number.parseFloat(h.spend || "0") > 0
                                          ? findMetaActionValue(h.actions, ["omni_purchase", "purchase"]) /
                                            Number.parseFloat(h.spend || "0")
                                          : 0,
                                    }))}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 114, 128, 0.3)" />
                                    <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} />
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
                            <Card className="bg-gray-700/30 border-gray-600">
                              <CardHeader>
                                <CardTitle className="text-base">
                                  Ad Sets ({selectedDateRange.replace("_", " ").replace("d", " days")})
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-gray-600 hover:bg-gray-700/50">
                                      <TableHead className="text-gray-300">Name</TableHead>
                                      <TableHead className="text-gray-300">Status</TableHead>
                                      <TableHead className="text-right text-gray-300">Spend</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {campaign.expandedData.adSets.map((adSet) => {
                                      const adSetInsights = processCampaignInsights(adSet.insights?.data?.[0])
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
                                        </TableRow>
                                      )
                                    })}
                                    {campaign.expandedData.adSets.length === 0 && (
                                      <TableRow>
                                        <TableCell colSpan={3} className="text-center text-gray-500 py-4">
                                          No ad sets found for this campaign.
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </CardContent>
                            </Card>
                            <div className="grid md:grid-cols-2 gap-4">
                              <Card className="bg-gray-700/30 border-gray-600">
                                <CardHeader>
                                  <CardTitle className="text-base">
                                    Quick Analysis ({selectedDateRange.replace("_", " ").replace("d", " days")})
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-gray-300 space-y-2">
                                  <p>
                                    Overall ROAS:{" "}
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
                                <AIAnalysisModal
                                  campaign={campaign}
                                  // Pass the correct historical data for predictions, which is processedHistoricalDailyData
                                  historicalData={campaign.expandedData?.processedHistoricalDailyData}
                                  allCampaigns={campaigns} // Pass the list of all campaigns for comparison context
                                />
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

                          <TabsContent value="predictions" className="space-y-6">
                            {campaign.expandedData?.processedHistoricalDailyData && campaign.processedInsights ? (
                              <CampaignPredictions
                                campaignName={campaign.name}
                                historicalData={campaign.expandedData.processedHistoricalDailyData}
                                currentMetrics={campaign.processedInsights}
                              />
                            ) : (
                              <div className="text-center py-10 text-gray-400">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
                                Preparing prediction data...
                              </div>
                            )}
                          </TabsContent>
                          <TabsContent value="compare" className="space-y-6">
                            <div className="text-center py-10 text-gray-400">
                              <BarChart3 className="mx-auto h-10 w-10 mb-2 text-indigo-500" />
                              <p className="font-semibold">Campaign Comparison Feature</p>
                              <p className="text-sm">
                                This section will allow you to compare this campaign's performance and predictions
                                against similar past campaigns or benchmarks.
                              </p>
                              <p className="text-xs mt-2">(Coming Soon)</p>
                            </div>
                          </TabsContent>
                        </Tabs>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
            {campaigns.length === 0 && !isLoading && (
              <div className="text-center py-10 text-gray-500">
                <Activity className="mx-auto h-8 w-8 mb-2" />
                <p>No campaigns to display for the selected period.</p>
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
