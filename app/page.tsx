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
  Users,
} from "lucide-react"
import { formatNumberWithCommas, formatCurrency, formatPercentage } from "@/lib/utils"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

// --- Interfaces ---
interface MetaAction {
  action_type: string
  value: string
}
interface TodayInsights {
  spend?: string
  actions?: MetaAction[]
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
}
interface RawCampaign {
  id: string
  name: string
  created_time: string
  effective_status: string
  insights?: { data?: CampaignInsightData[] }
}
interface AdSet {
  id: string
  name: string
  status: string
  insights?: { data?: CampaignInsightData[] }
}
interface HourlyDataPoint {
  time_start: string
  spend?: string
  impressions?: string
  clicks?: string
  actions?: MetaAction[]
}

interface ProcessedCampaign extends RawCampaign {
  processedInsights: {
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
  expandedData?: { adSets: AdSet[]; hourlyData: HourlyDataPoint[]; isLoading: boolean; error?: string }
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

const processCampaignInsights = (insightData?: CampaignInsightData) => {
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
  ])
  return {
    spend,
    revenue,
    conversions,
    roas: spend > 0 ? revenue / spend : 0,
    impressions: Number.parseInt(data.impressions || "0", 10),
    clicks: Number.parseInt(data.clicks || "0", 10),
    ctr: Number.parseFloat(data.ctr || "0"),
    cpc: Number.parseFloat(data.cpc || "0"),
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
  const [todaySpend, setTodaySpend] = useState(0)
  const [todayConversions, setTodayConversions] = useState(0)
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

  // UI states
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState<FetchError | null>(null)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState("5") // minutes
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null)

  // --- Effects ---
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
          body: JSON.stringify({ accessToken, adAccountId, type: "overview", datePreset: "last_30d" }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to fetch overview data")

        setTodaySpend(Number.parseFloat(data.todayData?.spend || "0"))
        setTodayConversions(findMetaActionValue(data.todayData?.actions, ["omni_purchase", "purchase"]))
        setActiveCampaignsCount(data.activeCampaignsCount || 0)

        const processedCampaignsList = (data.campaigns || []).map((c: RawCampaign) => ({
          ...c,
          processedInsights: processCampaignInsights(c.insights?.data?.[0]),
        }))
        setCampaigns(processedCampaignsList)

        // Calculate overall stats from the campaign list (last 30d)
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
      } catch (err: any) {
        setFetchError({ error: err.message })
      } finally {
        if (!isRefresh) setIsLoading(false)
        else setIsRefreshing(false)
      }
    },
    [accessToken, adAccountId],
  )

  useEffect(() => {
    if (credentialsSubmitted) fetchOverviewData()
  }, [credentialsSubmitted, fetchOverviewData])

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
    /* ... (same as before) ... */
    localStorage.removeItem("metaAccessToken")
    localStorage.removeItem("metaAdAccountId")
    setAccessToken("")
    setAdAccountId("")
    setCredentialsSubmitted(false)
    setCampaigns([])
    setFetchError(null)
    setShowSettings(true)
    setTodaySpend(0)
    setTodayConversions(0)
    setActiveCampaignsCount(0)
    setOverallStats({
      totalRevenue: 0,
      avgCPA: 0,
      totalSpend: 0,
      totalConversions: 0,
      avgROAS: 0,
      avgCTR: 0,
      avgCPC: 0,
    })
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
          datePreset: "last_30d",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Failed to fetch details for campaign ${campaignId}`)

      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId
            ? { ...c, expandedData: { adSets: data.adSets, hourlyData: data.hourlyData, isLoading: false } }
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
    setExpandedCampaignId(value)
    if (value && !campaigns.find((c) => c.id === value)?.expandedData?.adSets?.length) {
      // Fetch only if not already fetched or empty
      fetchCampaignDetails(value)
    }
  }

  // --- Metric Card Component ---
  const MetricCard = ({
    title,
    value,
    gradient,
    icon: Icon,
  }: { title: string; value: string | number; gradient: string; icon: React.ElementType }) => (
    <Card className={`text-white shadow-xl ${gradient} hover:opacity-90 transition-opacity`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-gray-200" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )

  // --- Render ---
  if (!credentialsSubmitted && showSettings) {
    return (
      /* ... Settings Form (same structure as before, ensure dark theme compatibility) ... */
      <div className="flex items-center justify-center min-h-screen">
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
        <h1 className="text-3xl font-bold tracking-tight">Meta Ads Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-refresh"
              checked={autoRefreshEnabled}
              onCheckedChange={setAutoRefreshEnabled}
              className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-600"
            />
            <Label htmlFor="auto-refresh" className="text-sm text-gray-300">
              Auto-Refresh
            </Label>
          </div>
          <Select value={refreshInterval} onValueChange={setRefreshInterval} disabled={!autoRefreshEnabled}>
            <SelectTrigger className="w-[100px] text-sm bg-gray-700 border-gray-600 hover:border-gray-500 focus:ring-blue-500">
              <SelectValue placeholder="Interval" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              {[1, 5, 10, 30].map((val) => (
                <SelectItem key={val} value={String(val)} className="hover:bg-gray-700">
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
            className="border-gray-600 hover:bg-gray-700 hover:border-gray-500"
          >
            {isRefreshing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? "" : "group-hover:animate-pulse"}`} />
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

      {/* Loading/Error States */}
      {isLoading && campaigns.length === 0 && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      )}
      {fetchError && (
        <Alert variant="destructive" className="bg-red-900 border-red-700 text-red-100">
          <AlertCircle className="h-5 w-5 text-red-300" />
          <AlertTitle>Error</AlertTitle>
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
        />
        <MetricCard
          title="Total Revenue (30d)"
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
          title="Today's Conversions"
          value={formatNumberWithCommas(todayConversions)}
          gradient="bg-gradient-to-br from-yellow-800 to-yellow-700"
          icon={Target}
        />
        <MetricCard
          title="Avg CPA (30d)"
          value={formatCurrency(overallStats.avgCPA)}
          gradient="bg-gradient-to-br from-red-900 to-red-800"
          icon={DollarSign}
        />
        {/* Refresh button is now with controls, this card can be another metric or removed */}
        <Card className="bg-gray-800 border-gray-700 shadow-xl flex items-center justify-center">
          <Users className="h-10 w-10 text-gray-500" /> {/* Placeholder for 6th card */}
        </Card>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Spend (30d)" value={formatCurrency(overallStats.totalSpend)} />
        <StatCard title="Total Conversions (30d)" value={formatNumberWithCommas(overallStats.totalConversions)} />
        <StatCard title="Overall ROAS (30d)" value={`${overallStats.avgROAS.toFixed(2)}x`} />
        <StatCard title="Avg CTR (30d)" value={formatPercentage(overallStats.avgCTR)} />
        <StatCard title="Avg CPC (30d)" value={formatCurrency(overallStats.avgCPC)} />
      </div>

      {/* Campaigns Table */}
      <Card className="bg-gray-800 border-gray-700 shadow-xl">
        <CardHeader>
          <CardTitle>Campaigns Overview (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion
            type="single"
            collapsible
            className="w-full"
            value={expandedCampaignId || undefined}
            onValueChange={onAccordionChange}
          >
            {campaigns.map((campaign) => (
              <AccordionItem key={campaign.id} value={campaign.id} className="border-b border-gray-700">
                <AccordionTrigger className="hover:bg-gray-750 px-4 py-3 text-left text-sm font-medium [&[data-state=open]>svg]:rotate-180">
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 w-full items-center">
                    <span className="col-span-2 md:col-span-1 truncate">{campaign.name}</span>
                    <span className="text-right hidden md:block">
                      {formatCurrency(campaign.processedInsights.spend)}
                    </span>
                    <span className="text-right hidden md:block">{`${campaign.processedInsights.roas.toFixed(2)}x`}</span>
                    <span className="text-right">{formatNumberWithCommas(campaign.processedInsights.conversions)}</span>
                    <span className="text-right hidden md:block">
                      {formatPercentage(campaign.processedInsights.ctr)}
                    </span>
                    <span
                      className={`text-xs ${campaign.effective_status === "ACTIVE" ? "text-green-400" : "text-gray-400"} hidden md:block text-right`}
                    >
                      {campaign.effective_status}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-gray-850 p-4 space-y-6">
                  {campaign.expandedData?.isLoading && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                    </div>
                  )}
                  {campaign.expandedData?.error && (
                    <Alert variant="destructive" className="bg-red-900 border-red-700 text-red-100">
                      <AlertCircle className="h-4 w-4" />
                      {campaign.expandedData.error}
                    </Alert>
                  )}

                  {campaign.expandedData && !campaign.expandedData.isLoading && !campaign.expandedData.error && (
                    <>
                      {/* Hourly Chart */}
                      <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-base">Today's Hourly Performance</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={campaign.expandedData.hourlyData.map((h) => ({
                                time: new Date(h.time_start).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }),
                                spend: Number.parseFloat(h.spend || "0"),
                                impressions: Number.parseInt(h.impressions || "0", 10),
                              }))}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                              <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} />
                              <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#1F2937",
                                  border: "1px solid #374151",
                                  borderRadius: "0.25rem",
                                }}
                                itemStyle={{ color: "#E5E7EB" }}
                                labelStyle={{ color: "#CBD5E1" }}
                              />
                              <Legend wrapperStyle={{ fontSize: "12px" }} />
                              <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="spend"
                                stroke="#3B82F6"
                                fill="#3B82F6"
                                fillOpacity={0.3}
                                name="Spend ($)"
                              />
                              <Area
                                yAxisId="right"
                                type="monotone"
                                dataKey="impressions"
                                stroke="#10B981"
                                fill="#10B981"
                                fillOpacity={0.3}
                                name="Impressions"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Ad Sets Table */}
                      <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-base">Ad Sets</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow className="border-gray-700 hover:bg-gray-750">
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Spend</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {campaign.expandedData.adSets.map((adSet) => {
                                const adSetInsights = processCampaignInsights(adSet.insights?.data?.[0])
                                return (
                                  <TableRow key={adSet.id} className="border-gray-700 hover:bg-gray-750 text-xs">
                                    <TableCell>{adSet.name}</TableCell>
                                    <TableCell
                                      className={adSet.status === "ACTIVE" ? "text-green-400" : "text-gray-400"}
                                    >
                                      {adSet.status}
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(adSetInsights.spend)}</TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>

                      {/* AI Reco & Actions */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <Card className="bg-gray-800 border-gray-700">
                          <CardHeader>
                            <CardTitle className="text-base">Quick Analysis</CardTitle>
                          </CardHeader>
                          <CardContent className="text-xs">
                            <p>ROAS: {campaign.processedInsights.roas.toFixed(2)}x</p>
                            <p className="mt-1">
                              {campaign.processedInsights.roas < 1
                                ? "Recommendation: ROAS is low. Review ad creatives, targeting, and landing page."
                                : campaign.processedInsights.roas > 3
                                  ? "Recommendation: ROAS is strong! Consider scaling budget or exploring lookalike audiences."
                                  : "Recommendation: Performance is moderate. Monitor closely and optimize."}
                            </p>
                            {campaign.processedInsights.frequency > 3 && (
                              <p className="mt-2 text-yellow-400">
                                <AlertCircle className="inline h-4 w-4 mr-1" />
                                High Frequency ({campaign.processedInsights.frequency.toFixed(2)}). Consider audience
                                refresh.
                              </p>
                            )}
                          </CardContent>
                        </Card>
                        <div className="space-y-2 flex flex-col justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-xs"
                            onClick={() => alert("Exporting campaign data (not implemented yet)...")}
                          >
                            <Download className="mr-2 h-3 w-3" /> Export Campaign Data
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-xs"
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
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
      <footer className="text-center mt-12 py-6 border-t border-gray-700">
        <p className="text-sm text-gray-400">Meta Ads Dashboard Pro | Built with Next.js & v0</p>
      </footer>
    </div>
  )
}

// Simple Stat Card component
const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <Card className="bg-gray-800 border-gray-700 shadow-lg hover:bg-gray-750 transition-colors">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-white">{value}</div>
    </CardContent>
  </Card>
)
