"use client"

import type React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/components/overview"
import { RecentSales } from "@/components/recent-sales"
import { Search } from "@/components/search"
import { useState, useCallback } from "react"
import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DayWeekPerformance } from "@/components/day-week-performance"
import { Loader2, RefreshCw, TrendingUp, DollarSign, Target, Activity, MousePointer } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { RawCampaign } from "@/types" // Declare the RawCampaign variable

const MetricCard = ({
  title,
  value,
  subtitle, // Added subtitle
  gradient,
  icon: Icon,
  pulse,
}: {
  title: string
  value: string | number
  subtitle?: React.ReactNode // Added subtitle
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
      {subtitle && <p className="text-xs text-gray-200/80 mt-1">{subtitle}</p>} {/* Added subtitle display */}
    </CardContent>
  </Card>
)

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

const formatNumberWithCommas = (number: number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export default function DashboardPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="w-full">
      <div className="flex justify-between">
        <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
          Dashboard
        </h1>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-6 w-6 text-muted-foreground cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              <p>This is the dashboard page. It contains an overview of your store, recent sales, and a search bar.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex justify-between">
        <Overview />
        <Search />
      </div>

      <Tabs defaultValue="recent" className="w-full mt-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Sales</TabsTrigger>
          <TabsTrigger value="dayweek">Day/Week Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="recent">
          <RecentSales />
        </TabsContent>
        <TabsContent value="dayweek">
          <DayWeekPerformance />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AdvancedDashboardPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [adAccountId, setAdAccountId] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState<{ error: string } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedDateRange, setSelectedDateRange] = useState<string>("LAST_3D")

  const [overviewData, setOverviewData] = useState({
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

  const processCampaignInsights = (insights: any) => {
    if (!insights) return { spend: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 }

    const spend = Number.parseFloat(insights.spend) || 0
    const revenue = Number.parseFloat(insights.revenue) || 0
    const conversions = Number.parseInt(insights.conversions) || 0
    const impressions = Number.parseInt(insights.impressions) || 0
    const clicks = Number.parseInt(insights.clicks) || 0

    return { spend, revenue, conversions, impressions, clicks }
  }

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
            accessToken: accessToken, // Use existing state
            adAccountId: adAccountId, // Use existing state
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch overview data")
        }

        const apiData = await response.json()
        const fetchedCampaigns = apiData.campaigns || []

        // Process campaigns to calculate metrics
        let calculatedTodaySpend = 0
        let calculatedTodayConversions = 0
        let calculatedTotalSpend = 0
        let calculatedTotalRevenue = 0
        let calculatedTotalConversions = 0
        let calculatedTotalImpressions = 0
        let calculatedTotalClicks = 0
        let calculatedActiveCampaigns = 0

        fetchedCampaigns.forEach((campaign: any) => {
          if (campaign.effective_status === "ACTIVE" || campaign.status === "ACTIVE") {
            // Check both possible status fields
            calculatedActiveCampaigns++
          }

          const insights = campaign.processedInsights || processCampaignInsights(campaign.insights?.data?.[0]) // Ensure processedInsights exists

          calculatedTotalSpend += insights.spend || 0
          calculatedTotalRevenue += insights.revenue || 0
          calculatedTotalConversions += insights.conversions || 0
          calculatedTotalImpressions += insights.impressions || 0
          calculatedTotalClicks += insights.clicks || 0

          if (campaign.todayData) {
            calculatedTodaySpend += campaign.todayData.spend || 0
            calculatedTodayConversions += campaign.todayData.conversions || 0
          }
        })

        const calculatedOverallROAS = calculatedTotalSpend > 0 ? calculatedTotalRevenue / calculatedTotalSpend : 0
        const calculatedAvgCTR =
          calculatedTotalImpressions > 0 ? (calculatedTotalClicks / calculatedTotalImpressions) * 100 : 0
        const calculatedAvgCPC = calculatedTotalClicks > 0 ? calculatedTotalSpend / calculatedTotalClicks : 0
        const calculatedAvgCPA = calculatedTotalConversions > 0 ? calculatedTotalSpend / calculatedTotalConversions : 0

        // Update campaigns state (ensure it's the full list with todayData)
        setCampaigns(
          fetchedCampaigns.map((c: RawCampaign) => ({
            ...c,
            processedInsights: c.processedInsights || processCampaignInsights(c.insights?.data?.[0]),
            // todayData should already be on 'c' from the API
          })),
        )

        setOverviewData({
          todaySpend: calculatedTodaySpend,
          todayConversions: calculatedTodayConversions,
          totalSpend: calculatedTotalSpend,
          totalRevenue: calculatedTotalRevenue,
          totalConversions: calculatedTotalConversions,
          totalImpressions: calculatedTotalImpressions,
          totalClicks: calculatedTotalClicks,
          activeCampaigns: calculatedActiveCampaigns,
          overallROAS: calculatedOverallROAS,
          avgCTR: calculatedAvgCTR,
          avgCPC: calculatedAvgCPC,
          avgCPA: calculatedAvgCPA,
        })
        setLastUpdated(new Date()) // Keep this to show when data was fetched
      } catch (err: any) {
        console.error("Failed to fetch overview data:", err)
        setFetchError({ error: err.message }) // Use object for fetchError
      } finally {
        if (!isRefresh) setIsLoading(false)
        else setIsRefreshing(false)
      }
    },
    [accessToken, adAccountId, selectedDateRange], // Keep dependencies
  )

  const handleRefreshAll = () => {
    fetchOverviewData(true)
  }

  return (
    <div>
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Today's Spend */}
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
          pulse={isRefreshing}
        />

        {/* Total Revenue */}
        <MetricCard
          title={`Total Revenue (${selectedDateRange.replace("_", " ")})`}
          value={formatCurrency(overviewData.totalRevenue)}
          subtitle={`${overviewData.overallROAS.toFixed(2)}x ROAS`}
          gradient="bg-gradient-to-br from-green-900 to-green-800"
          icon={TrendingUp}
        />

        {/* Active Campaigns */}
        <MetricCard
          title="Active Campaigns"
          value={overviewData.activeCampaigns.toString()}
          subtitle="Currently Running"
          gradient="bg-gradient-to-br from-purple-900 to-purple-800"
          icon={Activity} // Changed from Target to Activity for better semantics
        />

        {/* Conversions */}
        <MetricCard
          title={`Conversions (${selectedDateRange.replace("_", " ")})`}
          value={formatNumberWithCommas(overviewData.totalConversions)}
          subtitle={`${formatNumberWithCommas(overviewData.todayConversions)} today`}
          gradient="bg-gradient-to-br from-yellow-900 to-yellow-800"
          icon={Target} // Changed from Users to Target
        />

        {/* Average CPA */}
        <MetricCard
          title={`Average CPA (${selectedDateRange.replace("_", " ")})`}
          value={formatCurrency(overviewData.avgCPA)}
          subtitle="Per conversion"
          gradient="bg-gradient-to-br from-red-900 to-red-800"
          icon={MousePointer}
        />

        {/* Refresh Button Card */}
        <Card className="bg-gray-800 border-gray-700 shadow-xl flex items-center justify-center">
          <Button
            variant="ghost"
            className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50"
            onClick={handleRefreshAll} // Use the defined handler
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
    </div>
  )
}
