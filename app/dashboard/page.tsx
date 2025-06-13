// app/dashboard/page.tsx - OPTIMIZED VERSION WITH CODE SPLITTING
"use client"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import React from "react"
import { useState, useEffect, useCallback, type FormEvent, Suspense, lazy } from "react"
import dynamicImport from 'next/dynamic'
import { safeToFixed } from "@/lib/safe-utils"
import { CredentialManager, type Credentials } from "@/lib/credential-manager"
import { OAuthCredentialBridge } from "@/lib/oauth-credential-bridge"
import { optimizedApiManager } from "@/lib/api-manager-optimized"
import { EnhancedMetaAPIClient } from "@/lib/meta-api-client-enhanced"
import {
  TrendingUp,
  Target,
  Brain,
  Sparkles,
  Download,
  RefreshCw,
  AlertCircle,
  WifiOff,
  Settings,
  Activity,
  DollarSign,
  MousePointer,
  ChevronDown,
  ExternalLink,
  Info,
  Loader2,
  Key,
  Eye,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

// Lazy load heavy components
const DateRangeSelector = dynamicImport(() => 
  import('@/components/date-range-selector').then(mod => ({ default: mod.DateRangeSelector })),
  { 
    loading: () => <Skeleton className="w-40 h-10" />,
    ssr: false 
  }
)

const CampaignPredictions = dynamicImport(() => 
  import('@/components/campaign-predictions').then(mod => ({ default: mod.CampaignPredictions })),
  { 
    loading: () => <div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>,
    ssr: false 
  }
)

const DemographicAnalytics = dynamicImport(() => 
  import('@/components/demographic-analytics').then(mod => ({ default: mod.DemographicAnalytics })),
  { 
    loading: () => <div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>,
    ssr: false 
  }
)

const DayWeekPerformance = dynamicImport(() => 
  import('@/components/day-week-performance').then(mod => ({ default: mod.DayWeekPerformance })),
  { 
    loading: () => <div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>,
    ssr: false 
  }
)

const AIAnalysisModal = dynamicImport(() => 
  import('@/components/ai-analysis-modal').then(mod => ({ default: mod.AIAnalysisModal })),
  { 
    loading: () => <Button disabled size="sm" variant="outline"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Loading...</Button>,
    ssr: false 
  }
)

// Lazy load charts only when needed
const LineChart = dynamicImport(() => 
  import('recharts').then(mod => ({ default: mod.LineChart })),
  { ssr: false }
)

const Line = dynamicImport(() => 
  import('recharts').then(mod => ({ default: mod.Line })),
  { ssr: false }
)

const AreaChart = dynamicImport(() => 
  import('recharts').then(mod => ({ default: mod.AreaChart })),
  { ssr: false }
)

const Area = dynamicImport(() => 
  import('recharts').then(mod => ({ default: mod.Area })),
  { ssr: false }
)

const XAxis = dynamicImport(() => 
  import('recharts').then(mod => ({ default: mod.XAxis })),
  { ssr: false }
)

const YAxis = dynamicImport(() => 
  import('recharts').then(mod => ({ default: mod.YAxis })),
  { ssr: false }
)

const CartesianGrid = dynamicImport(() => 
  import('recharts').then(mod => ({ default: mod.CartesianGrid })),
  { ssr: false }
)

const Tooltip = dynamicImport(() => 
  import('recharts').then(mod => ({ default: mod.Tooltip })),
  { ssr: false }
)

const Legend = dynamicImport(() => 
  import('recharts').then(mod => ({ default: mod.Legend })),
  { ssr: false }
)

const ResponsiveContainer = dynamicImport(() => 
  import('recharts').then(mod => ({ default: mod.ResponsiveContainer })),
  { ssr: false }
)

// Lazy load comprehensive components
const MetricHierarchyView = dynamicImport(() => 
  import('@/components/metric-hierarchy-view').then(mod => ({ default: mod.MetricHierarchyView })),
  { 
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>,
    ssr: false 
  }
)

const ComprehensiveMetricsCard = dynamicImport(() => 
  import('@/components/comprehensive-metrics-card').then(mod => ({ default: mod.ComprehensiveMetricsCard })),
  { 
    loading: () => <div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>,
    ssr: false 
  }
)

const AdvancedChartSuite = dynamicImport(() => 
  import('@/components/advanced-chart-suite').then(mod => ({ default: mod.AdvancedChartSuite })),
  { 
    loading: () => <div className="h-80 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>,
    ssr: false 
  }
)

const DemographicBreakdown = dynamicImport(() => 
  import('@/components/demographic-breakdown').then(mod => ({ default: mod.DemographicBreakdown })),
  { 
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>,
    ssr: false 
  }
)

// Performance monitor - lazy loaded
const PerformanceMonitor = dynamicImport(() => 
  import('@/components/performance-monitor').then(mod => ({ default: mod.PerformanceMonitor })),
  { 
    loading: () => <Skeleton className="w-full h-96" />,
    ssr: false 
  }
)

// Interfaces (same as before)
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
  revenue?: string
  conversions?: string
}

interface ProcessedCampaignInsights {
  spend: number
  revenue: number
  roas: string
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  frequency?: number
}

interface Campaign {
  id: string
  name: string
  status: string
  effective_status?: string
  created_time: string
  objective?: string
  daily_budget?: number
  lifetime_budget?: number
  processedInsights?: ProcessedCampaignInsights
  insights?: { data?: CampaignInsightData[] }
  spend?: number
  impressions?: number
  clicks?: number
  ctr?: number
  cpc?: number
  conversions?: number
  revenue?: number
  roas?: number
  cpa?: number
  adsets_count?: number
  todayData?: {
    spend: number
    conversions: number
  }
  expandedData?: {
    historicalDailyData?: any[]
    todayHourlyData?: any[]
    adSets?: any[]
    isLoading?: boolean
    error?: string
  }
}

interface OverviewData {
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

// Utility functions (optimized)
const formatNumberWithCommas = (num: number | string | undefined): string => {
  if (num === undefined) return "0"
  const number = typeof num === "string" ? Number.parseFloat(num) : num
  if (isNaN(number)) return "0"
  return number.toLocaleString("en-US")
}

const formatCurrency = (num: number | undefined): string => {
  if (num === undefined) return "$0.00"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

const findMetaActionValue = (items: MetaAction[] | undefined, targetTypes: string[]): number => {
  if (!items) return 0
  return items
    .filter((item) => targetTypes.includes(item.action_type))
    .reduce((sum, item) => sum + Number.parseFloat(item.value || "0"), 0)
}

// Data transformation functions for comprehensive components
const transformCampaignsToHierarchy = (campaigns: Campaign[]): any => {
  return campaigns.map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    type: 'campaign',
    status: campaign.status,
    metrics: {
      spend: campaign.spend || 0,
      revenue: campaign.revenue || 0,
      roas: campaign.roas || 0,
      ctr: campaign.ctr || 0,
      cpc: campaign.cpc || 0,
      cpm: 0, // Would need to calculate from impressions
      impressions: campaign.impressions || 0,
      clicks: campaign.clicks || 0,
      conversions: campaign.conversions || 0
    },
    children: [] // AdSets would be populated here when detailed data is fetched
  }))
}

const transformToChartData = (campaigns: Campaign[]): any[] => {
  return campaigns.map((campaign, index) => ({
    id: campaign.id,
    name: campaign.name,
    value: campaign.spend || 0,
    category: campaign.status,
    x: index,
    y: campaign.spend || 0,
    size: campaign.impressions || 0,
    date: campaign.created_time
  }))
}

const generateMockDemographicData = (campaigns: Campaign[]): any => {
  // Generate mock demographic data based on campaign performance
  const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0)
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0)
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0)
  
  return {
    current: {
      age: [
        { ageRange: "18-24", impressions: 50000, clicks: 1500, conversions: 75, revenue: 3750, spend: 1200, ctr: 3.0, cpc: 0.8, cpm: 24, roas: 3.125, conversionRate: 5.0, percentage: 0.25, segment: "youth" },
        { ageRange: "25-34", impressions: 80000, clicks: 2800, conversions: 140, revenue: 7000, spend: 2000, ctr: 3.5, cpc: 0.71, cpm: 25, roas: 3.5, conversionRate: 5.0, percentage: 0.35, segment: "millennial" },
        { ageRange: "35-44", impressions: 60000, clicks: 1800, conversions: 108, revenue: 5400, spend: 1500, ctr: 3.0, cpc: 0.83, cpm: 25, roas: 3.6, conversionRate: 6.0, percentage: 0.25, segment: "genx" },
        { ageRange: "45+", impressions: 30000, clicks: 600, conversions: 30, revenue: 1500, spend: 500, ctr: 2.0, cpc: 0.83, cpm: 16.67, roas: 3.0, conversionRate: 5.0, percentage: 0.15, segment: "boomer" }
      ],
      gender: [
        { gender: "female", impressions: 120000, clicks: 4200, conversions: 210, revenue: 10500, spend: 3000, ctr: 3.5, cpc: 0.71, cpm: 25, roas: 3.5, conversionRate: 5.0, percentage: 0.6 },
        { gender: "male", impressions: 80000, clicks: 2400, conversions: 120, revenue: 6000, spend: 1800, ctr: 3.0, cpc: 0.75, cpm: 22.5, roas: 3.33, conversionRate: 5.0, percentage: 0.4 }
      ],
      device: [
        { device: "mobile", platform: "iOS", impressions: 140000, clicks: 4900, conversions: 245, revenue: 12250, spend: 3500, ctr: 3.5, cpc: 0.71, cpm: 25, roas: 3.5, conversionRate: 5.0, percentage: 0.7 },
        { device: "desktop", platform: "Windows", impressions: 60000, clicks: 1800, conversions: 108, revenue: 5400, spend: 1500, ctr: 3.0, cpc: 0.83, cpm: 25, roas: 3.6, conversionRate: 6.0, percentage: 0.3 }
      ],
      geographic: [
        { country: "United States", region: "California", city: "Los Angeles", countryCode: "US", impressions: 80000, clicks: 2800, conversions: 140, revenue: 7000, spend: 2000, ctr: 3.5, cpc: 0.71, cpm: 25, roas: 3.5, conversionRate: 5.0, percentage: 0.4 },
        { country: "United States", region: "New York", city: "New York", countryCode: "US", impressions: 60000, clicks: 2100, conversions: 105, revenue: 5250, spend: 1500, ctr: 3.5, cpc: 0.71, cpm: 25, roas: 3.5, conversionRate: 5.0, percentage: 0.3 },
        { country: "Canada", region: "Ontario", city: "Toronto", countryCode: "CA", impressions: 40000, clicks: 1200, conversions: 60, revenue: 3000, spend: 900, ctr: 3.0, cpc: 0.75, cpm: 22.5, roas: 3.33, conversionRate: 5.0, percentage: 0.2 },
        { country: "United Kingdom", region: "England", city: "London", countryCode: "GB", impressions: 20000, clicks: 600, conversions: 30, revenue: 1500, spend: 450, ctr: 3.0, cpc: 0.75, cpm: 22.5, roas: 3.33, conversionRate: 5.0, percentage: 0.1 }
      ],
      summary: {
        totalImpressions: campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0),
        totalClicks: campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0),
        totalConversions,
        totalRevenue,
        totalSpend,
        averageCTR: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + (c.ctr || 0), 0) / campaigns.length : 0,
        averageROAS: totalSpend > 0 ? totalRevenue / totalSpend : 0,
        topPerformingSegment: "25-34 Female Mobile"
      }
    }
  }
}

// MetricCard Component (optimized with React.memo)
interface MetricCardProps {
  title: string
  value: string
  subtitle: React.ReactNode
  gradient: string
  icon: React.ReactNode
  pulse?: boolean
}

const MetricCard = React.memo(function MetricCard({ title, value, subtitle, gradient, icon, pulse }: MetricCardProps) {
  return (
    <div
      className={`bg-gradient-to-br ${gradient} rounded-lg p-4 border border-gray-700 hover:scale-[1.02] transition-transform relative overflow-hidden`}
    >
      {pulse && <div className="absolute inset-0 bg-white opacity-10 animate-pulse"></div>}
      <div className="flex items-center justify-between mb-1 relative z-10">
        <span className="text-sm text-gray-200 opacity-90">{title}</span>
        <span className="text-gray-200 opacity-80">{icon}</span>
      </div>
      <div className="text-2xl font-bold relative z-10">{value}</div>
      <div className="text-xs text-gray-300 opacity-80 mt-1 relative z-10">{subtitle}</div>
    </div>
  )
})

// Main Dashboard Component (optimized)
export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [overviewData, setOverviewData] = useState<OverviewData>({
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

  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false)
  const [credentialsSubmitted, setCredentialsSubmitted] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(300000) // 5 minutes
  const [selectedDateRange, setSelectedDateRange] = useState("today")
  const [expandedCampaigns, setExpandedCampaigns] = useState<string[]>([])
  const [activeTabs, setActiveTabs] = useState<{ [campaignId: string]: string }>({})

  const [campaignStatusFilter, setCampaignStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_desc")
  const [tokenExpiredWarning, setTokenExpiredWarning] = useState(false)

  // Comprehensive components state
  const [showComprehensiveView, setShowComprehensiveView] = useState(false)
  const [comprehensiveData, setComprehensiveData] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [demographicData, setDemographicData] = useState<any>(null)
  const [hierarchyData, setHierarchyData] = useState<any>(null)
  const [comprehensiveLoading, setComprehensiveLoading] = useState(false)

  const [credentials, setCredentials] = useState({
    accessToken: "",
    adAccountId: "",
  })

  // Load credentials on mount
  useEffect(() => {
    const loadCredentials = async () => {
      // First try OAuth credential bridge
      const oauthCredentials = await OAuthCredentialBridge.checkAndSync()
      
      if (oauthCredentials) {
        console.log('Loaded credentials from OAuth')
        setCredentials(oauthCredentials)
        setCredentialsSubmitted(true)
        setShowSettings(false)
        return
      }
      
      // Fall back to regular CredentialManager
      const savedCredentials = await CredentialManager.load()

      if (savedCredentials) {
        // Skip all validation - just use the credentials
        setCredentials(savedCredentials)
        setCredentialsSubmitted(true)
        setShowSettings(false)
      } else {
        setShowSettings(true)
      }
    }
    loadCredentials()
  }, [])

  // Optimized fetch function using the new API manager
  const fetchOverviewData = useCallback(
    async (isRefreshOp = false) => {
      if (!credentials.accessToken || !credentials.adAccountId) return

      const formatValidation = CredentialManager.validateFormat(credentials)
      if (!formatValidation.isValid) {
        console.error('Invalid credentials detected before API call:', formatValidation.errors)
        CredentialManager.clear()
        setCredentials({ accessToken: "", adAccountId: "" })
        setCredentialsSubmitted(false)
        setShowSettings(true)
        setFetchError('Invalid credentials: ' + formatValidation.errors.join(', '))
        return
      }

      if (!isRefreshOp) setIsLoading(true)
      else setIsRefreshing(true)
      setFetchError(null)

      try {
        // Always get account-level insights for accurate metrics (matches Meta UI)
        const accountData = await optimizedApiManager.request<any>(
          "/api/account-insights",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              datePreset: selectedDateRange,
              accessToken: credentials.accessToken,
              adAccountId: credentials.adAccountId,
            }),
          },
          {
            forceRefresh: true,
            priority: isRefreshOp ? 2 : 1,
            ttl: 0
          }
        )
        
        // Also get campaigns for display
        const campaignData = await optimizedApiManager.request<any>(
          "/api/direct-campaigns",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              datePreset: selectedDateRange,
              accessToken: credentials.accessToken,
              adAccountId: credentials.adAccountId,
            }),
          },
          {
            forceRefresh: true,
            priority: isRefreshOp ? 2 : 1,
            ttl: 0
          }
        )
        
        let data = campaignData
        // Override totals with account-level data for accurate metrics
        if (accountData.success && accountData.metrics) {
          data.accountMetrics = accountData.metrics
        }

        const fetchedCampaigns: Campaign[] = data.campaigns || []

        // Process campaigns (same logic as before but optimized)
        let totals = {
          todaySpend: 0,
          todayConversions: 0,
          totalSpend: 0,
          totalRevenue: 0,
          totalConversions: 0,
          totalImpressions: 0,
          totalClicks: 0,
          activeCampaigns: 0
        }

        const processedCampaignsList = fetchedCampaigns.map((campaign: Campaign) => {
          if (campaign.status === "ACTIVE" || campaign.effective_status === "ACTIVE") {
            totals.activeCampaigns++
          }

          const insights = {
            spend: campaign.spend || 0,
            revenue: campaign.revenue || 0,
            conversions: campaign.conversions || 0,
            impressions: campaign.impressions || 0,
            clicks: campaign.clicks || 0,
            ctr: campaign.ctr || 0,
            cpc: campaign.cpc || 0,
            roas: String(campaign.roas || 0)
          }
          
          totals.totalSpend += insights.spend
          totals.totalRevenue += insights.revenue
          totals.totalConversions += insights.conversions
          totals.totalImpressions += insights.impressions
          totals.totalClicks += insights.clicks

          // Note: todayData would need to be fetched separately with date_preset=today
          // For now, we're showing data for the selected date range

          return { ...campaign, processedInsights: insights }
        })

        // Always use account-level metrics if available for accurate totals
        if (data.accountMetrics) {
          const accountMetrics = data.accountMetrics
          console.log('Account metrics received:', accountMetrics)
          console.log('Before override - totals:', { ...totals })
          
          totals.totalSpend = accountMetrics.spend
          totals.totalRevenue = accountMetrics.revenue
          totals.totalConversions = accountMetrics.conversions
          totals.totalImpressions = accountMetrics.impressions
          totals.totalClicks = accountMetrics.clicks
          
          console.log('After override - totals:', { ...totals })
          console.log('Using account-level metrics for', selectedDateRange, ':', accountMetrics)
        }
        
        const overallROAS = totals.totalSpend > 0 ? totals.totalRevenue / totals.totalSpend : 0
        const avgCTR = totals.totalImpressions > 0 ? (totals.totalClicks / totals.totalImpressions) * 100 : 0
        const avgCPC = totals.totalClicks > 0 ? totals.totalSpend / totals.totalClicks : 0
        const avgCPA = totals.totalConversions > 0 ? totals.totalSpend / totals.totalConversions : 0

        setCampaigns(processedCampaignsList)
        
        // Debug logging
        console.log('Dashboard totals:', {
          totalSpend: totals.totalSpend,
          campaignCount: processedCampaignsList.length,
          datePreset: selectedDateRange,
          usingAccountLevel: !!data.accountMetrics,
          timestamp: new Date().toISOString()
        })
        
        setOverviewData({
          ...totals,
          overallROAS,
          avgCTR,
          avgCPC,
          avgCPA,
        })
        setLastUpdated(new Date())

        // Update comprehensive components data
        try {
          setComprehensiveLoading(true)
          setHierarchyData(transformCampaignsToHierarchy(processedCampaignsList))
          setChartData(transformToChartData(processedCampaignsList))
          setDemographicData(generateMockDemographicData(processedCampaignsList))
        } catch (error) {
          console.error('Error updating comprehensive data:', error)
        } finally {
          setComprehensiveLoading(false)
        }
        
        // Generate comprehensive metrics data
        const comprehensiveMetrics = {
          performance: {
            title: "Performance",
            icon: Activity,
            color: "rgb(59, 130, 246)",
            metrics: [
              {
                label: "Total Impressions",
                value: formatNumberWithCommas(totals.totalImpressions),
                change: 12.5,
                changeType: "increase",
                status: "good",
                icon: Eye,
                description: "Total ad impressions delivered"
              },
              {
                label: "Total Clicks",
                value: formatNumberWithCommas(totals.totalClicks),
                change: 8.3,
                changeType: "increase",
                status: "good",
                icon: MousePointer,
                description: "Total clicks received"
              },
              {
                label: "Average CTR",
                value: `${avgCTR.toFixed(2)}%`,
                change: -2.1,
                changeType: avgCTR > 2 ? "increase" : "decrease",
                status: avgCTR > 2 ? "good" : "warning",
                icon: MousePointer,
                description: "Average click-through rate"
              },
              {
                label: "Average CPC",
                value: formatCurrency(avgCPC),
                change: 15.2,
                changeType: "increase",
                status: "warning",
                icon: DollarSign,
                description: "Average cost per click"
              }
            ]
          },
          budget: {
            title: "Budget",
            icon: DollarSign,
            color: "rgb(168, 85, 247)",
            metrics: [
              {
                label: "Total Spend",
                value: formatCurrency(totals.totalSpend),
                change: 15.8,
                changeType: "increase",
                status: "good",
                icon: DollarSign,
                description: "Total ad spend"
              },
              {
                label: "Total Revenue",
                value: formatCurrency(totals.totalRevenue),
                change: 18.2,
                changeType: "increase",
                status: "excellent",
                icon: TrendingUp,
                description: "Total revenue generated"
              },
              {
                label: "Overall ROAS",
                value: `${overallROAS.toFixed(2)}x`,
                change: 18.2,
                changeType: "increase",
                status: overallROAS > 3 ? "excellent" : overallROAS > 1.5 ? "good" : "warning",
                icon: TrendingUp,
                description: "Return on ad spend"
              },
              {
                label: "Average CPA",
                value: formatCurrency(avgCPA),
                change: -8.5,
                changeType: "decrease",
                status: "excellent",
                icon: Target,
                description: "Cost per acquisition"
              }
            ]
          }
        }
        setComprehensiveData(comprehensiveMetrics)

        // Prefetch data for expanded campaigns
        const expandedCampaignIds = expandedCampaigns.filter(id => 
          processedCampaignsList.some(c => c.id === id)
        )
        
        if (expandedCampaignIds.length > 0) {
          prefetchCampaignDetails(expandedCampaignIds)
        }

      } catch (err: any) {
        console.error("Failed to fetch overview data:", err)
        
        // Handle token errors
        if (err.message && (
          err.message.toLowerCase().includes("oauth") || 
          err.message.toLowerCase().includes("access token") || 
          err.message.toLowerCase().includes("invalid token") ||
          err.message.toLowerCase().includes("expired")
        )) {
          setTokenExpiredWarning(true)
          CredentialManager.clear()
          setCredentials({ accessToken: "", adAccountId: "" })
          setCredentialsSubmitted(false)
          setShowSettings(true)
          setFetchError("Invalid or expired access token. Please re-enter your credentials or extend your token.")
        } else {
          setFetchError(err.message)
        }
      } finally {
        if (!isRefreshOp) setIsLoading(false)
        else setIsRefreshing(false)
      }
    },
    [credentials, selectedDateRange, expandedCampaigns],
  )

  // Prefetch campaign details for better performance
  const prefetchCampaignDetails = async (campaignIds: string[]) => {
    const requests = campaignIds.map(campaignId => ({
      endpoint: "/api/meta",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "campaign_details",
          campaignId,
          datePreset: selectedDateRange,
          accessToken: credentials.accessToken,
          adAccountId: credentials.adAccountId,
        }),
      },
      ttl: 10 * 60 * 1000 // 10 minutes
    }))

    await optimizedApiManager.prefetch(requests)
  }

  // Optimized campaign details fetch
  const fetchCampaignDetails = async (campaignId: string) => {
    const formatValidation = CredentialManager.validateFormat(credentials)
    if (!formatValidation.isValid) {
      console.error('Invalid credentials detected before campaign details API call:', formatValidation.errors)
      setFetchError('Invalid credentials: ' + formatValidation.errors.join(', '))
      return
    }

    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? { ...c, expandedData: { ...(c.expandedData || {}), isLoading: true, error: undefined } }
          : c,
      ),
    )

    try {
      const detailsData = await optimizedApiManager.request<any>(
        "/api/meta",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "campaign_details",
            campaignId,
            datePreset: selectedDateRange,
            accessToken: credentials.accessToken,
            adAccountId: credentials.adAccountId,
          }),
        },
        {
          priority: 2,
          batch: true
        }
      )

      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId
            ? {
                ...c,
                expandedData: {
                  historicalDailyData: detailsData.historicalDailyData || [],
                  todayHourlyData: detailsData.todayHourlyData || [],
                  adSets: detailsData.adSets || [],
                  isLoading: false,
                },
              }
            : c,
        ),
      )
    } catch (error: any) {
      console.error("Failed to fetch campaign details:", error)
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId
            ? { ...c, expandedData: { ...(c.expandedData || {}), isLoading: false, error: error.message } }
            : c,
        ),
      )
    }
  }

  const handleAccordionChange = (value: string[]) => {
    const newlyOpened = value.filter((id) => !expandedCampaigns.includes(id))
    setExpandedCampaigns(value)

    newlyOpened.forEach((campaignId) => {
      const campaign = campaigns.find((c) => c.id === campaignId)
      if (
        campaign &&
        (!campaign.expandedData ||
          (!campaign.expandedData.historicalDailyData && !campaign.expandedData.todayHourlyData))
      ) {
        fetchCampaignDetails(campaignId)
      }
    })
  }

  // Auto-refresh effect
  useEffect(() => {
    if (credentialsSubmitted && credentials.accessToken && credentials.adAccountId) {
      fetchOverviewData()
    }
  }, [credentialsSubmitted, selectedDateRange, credentials.accessToken, credentials.adAccountId])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    if (autoRefresh && credentialsSubmitted && refreshInterval > 0 && credentials.accessToken && credentials.adAccountId) {
      intervalId = setInterval(() => fetchOverviewData(true), refreshInterval)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [autoRefresh, refreshInterval, credentialsSubmitted, credentials.accessToken, credentials.adAccountId])

  // Filter and sort campaigns (memoized)
  const getFilteredAndSortedCampaigns = useCallback(() => {
    let filtered = campaigns

    if (campaignStatusFilter !== "all") {
      filtered = filtered.filter((c) => (c.effective_status || c.status) === campaignStatusFilter)
    }

    const sorted = [...filtered].sort((a, b) => {
      const aSpend = a.spend || 0
      const bSpend = b.spend || 0
      const aRoas = a.roas || 0
      const bRoas = b.roas || 0
      
      switch (sortBy) {
        case "created_desc":
          return new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
        case "created_asc":
          return new Date(a.created_time).getTime() - new Date(b.created_time).getTime()
        case "spend_desc":
          return bSpend - aSpend
        case "roas_desc":
          return bRoas - aRoas
        case "name_asc":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })
    return sorted
  }, [campaigns, campaignStatusFilter, sortBy])

  // Test connection function
  const testConnection = async (token: string, accountId: string): Promise<boolean> => {
    try {
      const credentials: Credentials = { accessToken: token, adAccountId: accountId }
      const formatValidation = CredentialManager.validateFormat(credentials)
      
      if (!formatValidation.isValid) {
        setFetchError('Invalid credential format: ' + formatValidation.errors.join(', '))
        return false
      }

      const data = await optimizedApiManager.request<any>(
        "/api/meta",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "test_connection",
            accessToken: token,
            adAccountId: accountId,
          }),
        },
        {
          forceRefresh: true,
          priority: 3
        }
      )
      
      if (data.success) {
        console.log('Connection test successful:', data.accountInfo)
        return true
      } else {
        setFetchError(data.error || "Connection test failed")
        return false
      }
    } catch (error: any) {
      console.error("Connection test error:", error)
      setFetchError(error.message || "Failed to test connection. Please check your network.")
      return false
    }
  }

  // Form handlers (same as before)
  const handleSaveCredentials = async (e: FormEvent) => {
    e.preventDefault()
    
    const cleanToken = credentials.accessToken.trim()
    const cleanAccountId = credentials.adAccountId.trim()
    
    if (!cleanToken || !cleanAccountId) {
      setFetchError("Access Token and Ad Account ID are required.")
      return
    }
    
    const formattedAccountId = cleanAccountId.startsWith("act_") ? cleanAccountId : `act_${cleanAccountId}`
    
    const credentialsToValidate: Credentials = {
      accessToken: cleanToken,
      adAccountId: formattedAccountId,
    }
    
    const formatValidation = CredentialManager.validateFormat(credentialsToValidate)
    if (!formatValidation.isValid) {
      setFetchError('Invalid credentials: ' + formatValidation.errors.join(', '))
      return
    }
    
    setIsTestingConnection(true)
    setFetchError(null)
    
    const isValid = await testConnection(cleanToken, formattedAccountId)
    setIsTestingConnection(false)
    
    if (!isValid) {
      return
    }
    
    await CredentialManager.save(credentialsToValidate, true)
    
    setCredentials(credentialsToValidate)
    setCredentialsSubmitted(true)
    setShowSettings(false)
    setFetchError(null)
    fetchOverviewData()
  }

  const handleClearCredentials = async () => {
    await CredentialManager.clear()
    setCredentials({ accessToken: "", adAccountId: "" })
    setCredentialsSubmitted(false)
    setCampaigns([])
    setOverviewData({
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
    setFetchError(null)
    setShowSettings(true)
  }

  const handleRefreshAll = () => {
    fetchOverviewData(true)
  }

  // Export campaign data
  const exportCampaignData = (campaign: Campaign) => {
    const dataToExport = {
      campaignInfo: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        created_time: campaign.created_time,
        objective: campaign.objective,
      },
      metricsOverSelectedPeriod: campaign.processedInsights,
      todayMetrics: campaign.todayData,
      detailedData: campaign.expandedData,
      exportedAt: new Date().toISOString(),
      dateRange: selectedDateRange,
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `campaign-${campaign.id}-${selectedDateRange}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleTabChange = (campaignId: string, newTabValue: string) => {
    setActiveTabs((prev) => ({ ...prev, [campaignId]: newTabValue }))
  }

  // Render credentials form
  if (!credentialsSubmitted && showSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
        <Card className="w-full max-w-md mx-auto shadow-lg bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="text-xl">API Configuration</CardTitle>
            <CardDescription className="text-gray-400">
              Enter Meta Ads API Access Token & Ad Account ID. Stored in your browser.
            </CardDescription>
            <div className="mt-4">
              <Link href="/oauth-setup">
                <Button variant="default" className="w-full bg-blue-600 hover:bg-blue-700">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect with Facebook (Recommended)
                </Button>
              </Link>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-800 px-2 text-gray-400">Or use manual setup</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <form onSubmit={handleSaveCredentials}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="accessToken" className="text-gray-300">
                  Access Token
                </Label>
                <Input
                  id="accessToken"
                  type="password"
                  value={credentials.accessToken}
                  onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
                  placeholder="EAA..."
                  required
                  className="bg-gray-700 border-gray-600 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="adAccountId" className="text-gray-300">
                  Ad Account ID
                </Label>
                <Input
                  id="adAccountId"
                  type="text"
                  value={credentials.adAccountId}
                  onChange={(e) => setCredentials({ ...credentials, adAccountId: e.target.value })}
                  placeholder="act_XXXXXXXXXX"
                  required
                  className="bg-gray-700 border-gray-600 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {fetchError && (
                <Alert variant="destructive" className="bg-red-900/30 border-red-700 text-red-300">
                  <AlertCircle className="h-4 w-4" /> <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardContent className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClearCredentials}
                className="text-sm text-gray-400 hover:text-white w-full sm:w-auto"
              >
                Clear Credentials
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                disabled={isTestingConnection}
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  "Save & Connect"
                )}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    )
  }

  // Main dashboard render
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Meta Ads Dashboard Pro
              </h1>
              <p className="text-gray-400 mt-1 text-xs">
                Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "Never"}
                {selectedDateRange && ` (${selectedDateRange.replace(/_/g, " ")})`}
              </p>
            </div>
            <div className="flex items-center flex-wrap gap-2 md:gap-4">
              <Suspense fallback={<Skeleton className="w-40 h-10" />}>
                <DateRangeSelector
                  value={selectedDateRange}
                  onChange={(value) => setSelectedDateRange(value)}
                  disabled={isLoading || isRefreshing}
                />
              </Suspense>
              <Link href="/oauth-debug" passHref>
                <Button variant="outline" className="flex items-center gap-2 text-xs border-gray-700 hover:bg-gray-800">
                  <Settings className="w-3 h-3 md:w-4 md:h-4" />
                  OAuth Debug
                </Button>
              </Link>
              <Link href="/settings/token" passHref>
                <Button variant="outline" className="flex items-center gap-2 text-xs border-gray-700 hover:bg-gray-800">
                  <Key className="w-3 h-3 md:w-4 md:h-4" />
                  Token Manager
                </Button>
              </Link>
              <Link href="/pattern-analysis" passHref>
                <Button variant="outline" className="flex items-center gap-2 text-xs border-gray-700 hover:bg-gray-800">
                  <Brain className="w-3 h-3 md:w-4 md:h-4" />
                  Pattern Analysis
                </Button>
              </Link>
              <Button
                variant={showComprehensiveView ? "default" : "outline"}
                className="flex items-center gap-2 text-xs border-gray-700 hover:bg-gray-800"
                onClick={() => setShowComprehensiveView(!showComprehensiveView)}
              >
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                {showComprehensiveView ? "Standard View" : "Comprehensive View"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
                className="border-gray-700 hover:bg-gray-800"
                title="Performance Monitor"
              >
                <Activity className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Switch
                  id="autoRefreshSwitch"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor="autoRefreshSwitch" className="text-xs md:text-sm text-gray-400 whitespace-nowrap">
                  Auto-Refresh
                </Label>
              </div>
              <Select
                value={refreshInterval.toString()}
                onValueChange={(value) => setRefreshInterval(Number.parseInt(value))}
                disabled={!autoRefresh || isLoading || isRefreshing}
              >
                <SelectTrigger className="w-24 text-xs bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="60000">1 min</SelectItem>
                  <SelectItem value="300000">5 min</SelectItem>
                  <SelectItem value="600000">10 min</SelectItem>
                  <SelectItem value="1800000">30 min</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className="border-gray-700 hover:bg-gray-800"
                title="Settings"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Token Expiration Warning */}
        {tokenExpiredWarning && (
          <Alert className="mb-6 bg-yellow-900/20 border-yellow-700 text-yellow-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Token Expired or About to Expire</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Your Facebook access token has expired or is about to expire. Extend it to continue using the dashboard.</span>
              <div className="flex gap-2">
                <Link href="/settings/token">
                  <Button variant="outline" size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600">
                    <Key className="w-3 h-3 mr-1" />
                    Extend Token Now
                  </Button>
                </Link>
                <Link href="/help/extend-token">
                  <Button variant="ghost" size="sm" className="text-yellow-300 hover:text-yellow-100">
                    Need Help?
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Performance Monitor */}
        {showPerformanceMonitor && (
          <Suspense fallback={<Skeleton className="w-full h-96" />}>
            <PerformanceMonitor />
          </Suspense>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mb-8 bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>Update your Meta Ads API credentials. Stored locally.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveCredentials}>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="accessTokenModal">Access Token</Label>
                  <Input
                    id="accessTokenModal"
                    type="password"
                    value={credentials.accessToken}
                    onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
                    placeholder="Your Meta Access Token"
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="adAccountIdModal">Ad Account ID</Label>
                  <Input
                    id="adAccountIdModal"
                    type="text"
                    value={credentials.adAccountId}
                    onChange={(e) => setCredentials({ ...credentials, adAccountId: e.target.value })}
                    placeholder="act_XXXXXXXXXX"
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                {fetchError && (
                  <Alert variant="destructive" className="bg-red-900/30 border-red-700 text-red-300">
                    <AlertCircle className="h-4 w-4" /> <AlertDescription>{fetchError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardContent className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4">
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClearCredentials}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Clear & Disconnect
                  </Button>
                  <Link href="/settings/token">
                    <Button
                      type="button"
                      variant="outline"
                      className="text-sm"
                    >
                      <Key className="w-4 h-4 mr-1" />
                      Extend Token
                    </Button>
                  </Link>
                </div>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  disabled={isTestingConnection}
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    "Update & Reconnect"
                  )}
                </Button>
              </CardContent>
            </form>
          </Card>
        )}

        {/* Error Alert */}
        {fetchError && !showSettings && (
          <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-700 text-red-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{fetchError}. Please check your API credentials in Settings or network connection.</span>
              {fetchError.toLowerCase().includes('token') && (
                <Link href="/settings/token">
                  <Button variant="outline" size="sm" className="ml-4">
                    <Key className="w-3 h-3 mr-1" />
                    Extend Token
                  </Button>
                </Link>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {credentialsSubmitted ? (
          <>
            {isLoading && campaigns.length === 0 && !isRefreshing && (
              <div className="flex flex-col items-center justify-center py-20 min-h-[300px]">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                <p className="ml-3 mt-4 text-lg text-gray-400">Loading Dashboard Data...</p>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <MetricCard
                title={`Spend (${selectedDateRange.replace(/_/g, " ")})`}
                value={formatCurrency(overviewData.totalSpend)}
                subtitle={
                  selectedDateRange === "today" ? (
                    <span className="flex items-center gap-1 text-xs">
                      LIVE <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    </span>
                  ) : (
                    "Total spend"
                  )
                }
                gradient="from-blue-900/70 to-blue-800/70"
                icon={<DollarSign className="w-4 h-4" />}
                pulse={isRefreshing && overviewData.totalSpend === 0}
              />
              <MetricCard
                title={`Revenue (${selectedDateRange.replace(/_/g, " ")})`}
                value={formatCurrency(overviewData.totalRevenue)}
                subtitle={`${safeToFixed(overviewData.overallROAS, 2)}x ROAS`}
                gradient="from-green-900/70 to-green-800/70"
                icon={<TrendingUp className="w-4 h-4" />}
              />
              <MetricCard
                title="Active Campaigns"
                value={formatNumberWithCommas(overviewData.activeCampaigns)}
                subtitle="Currently Running"
                gradient="from-purple-900/70 to-purple-800/70"
                icon={<Activity className="w-4 h-4" />}
              />
              <MetricCard
                title={`Conversions (${selectedDateRange.replace(/_/g, " ")})`}
                value={formatNumberWithCommas(overviewData.totalConversions)}
                subtitle="Total conversions"
                gradient="from-yellow-900/70 to-yellow-800/70"
                icon={<Target className="w-4 h-4" />}
              />
              <MetricCard
                title={`Avg CPA (${selectedDateRange.replace(/_/g, " ")})`}
                value={formatCurrency(overviewData.avgCPA)}
                subtitle="Per Conversion"
                gradient="from-red-900/70 to-red-800/70"
                icon={<MousePointer className="w-4 h-4" />}
              />
              <div className="bg-gray-800 rounded-lg p-2 border border-gray-700 flex items-center justify-center">
                <Button
                  onClick={handleRefreshAll}
                  disabled={isRefreshing || isLoading}
                  className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-300 hover:text-white"
                  variant="ghost"
                  size="sm"
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="text-xs">Refresh All</span>
                </Button>
              </div>
            </div>

            {/* Summary Stats - Additional Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6 text-xs">
              {[
                { label: "IMPRESSIONS", value: formatNumberWithCommas(overviewData.totalImpressions) },
                { label: "CLICKS", value: formatNumberWithCommas(overviewData.totalClicks) },
                { label: "CTR", value: `${safeToFixed(overviewData.avgCTR, 2)}%` },
                { label: "CPC", value: formatCurrency(overviewData.avgCPC) },
                { label: "TOTAL CAMPAIGNS", value: campaigns.length.toString() },
              ].map((stat) => (
                <Card key={stat.label} className="bg-gray-800/80 border-gray-700">
                  <CardContent className="p-3">
                    <div className="text-gray-400">
                      {stat.label} ({selectedDateRange.replace(/_/g, " ").toUpperCase()})
                    </div>
                    <div className="text-xl font-bold mt-1">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Comprehensive Components Section */}
            {showComprehensiveView && (
              <div className="space-y-6 mb-8">
                {comprehensiveLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-3 text-lg text-gray-400">Loading comprehensive analytics...</span>
                  </div>
                ) : (
                  <>
                    {/* Comprehensive Metrics Card */}
                    <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
                      <ComprehensiveMetricsCard 
                        data={comprehensiveData}
                        variant="detailed"
                        className="w-full"
                      />
                    </Suspense>

                {/* Advanced Chart Suite */}
                <Suspense fallback={<div className="h-80 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
                  <AdvancedChartSuite
                    data={chartData}
                    config={{
                      type: 'bar',
                      title: 'Campaign Performance Overview',
                      xAxisKey: 'name',
                      yAxisKey: 'value',
                      showGrid: true,
                      showLegend: true,
                      showTooltip: true,
                      colorScheme: 'business'
                    }}
                    className="w-full"
                    exportFormats={['png', 'svg', 'jpg']}
                  />
                </Suspense>

                {/* Demographic Breakdown */}
                <Suspense fallback={<div className="h-96 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
                  <DemographicBreakdown
                    data={demographicData || { current: { age: [], gender: [], device: [], geographic: [], summary: {} } }}
                    loading={isLoading}
                    onRefresh={() => fetchOverviewData(true)}
                    allowComparison={true}
                    showAdvancedMetrics={true}
                    className="w-full"
                  />
                </Suspense>
                  </>
                )}
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Select
                value={campaignStatusFilter}
                onValueChange={setCampaignStatusFilter}
                disabled={isLoading || isRefreshing}
              >
                <SelectTrigger className="w-full sm:w-40 text-xs bg-gray-800 border-gray-700">
                  <SelectValue placeholder="All Campaigns" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Campaigns</SelectItem>
                  <SelectItem value="ACTIVE">Active Only</SelectItem>
                  <SelectItem value="PAUSED">Paused Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy} disabled={isLoading || isRefreshing}>
                <SelectTrigger className="w-full sm:w-48 text-xs bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="created_desc">Newest First</SelectItem>
                  <SelectItem value="created_asc">Oldest First</SelectItem>
                  <SelectItem value="spend_desc">Highest Spend</SelectItem>
                  <SelectItem value="roas_desc">Highest ROAS</SelectItem>
                  <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campaigns List or MetricHierarchyView */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold mb-4">
                {showComprehensiveView ? "Campaign Hierarchy" : "Campaigns Overview"} ({getFilteredAndSortedCampaigns().length} campaigns)
              </h2>
              
              {showComprehensiveView && hierarchyData && hierarchyData.length > 0 ? (
                <Suspense fallback={<div className="h-96 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
                  <MetricHierarchyView
                    campaign={hierarchyData[0] || {
                      id: 'demo',
                      name: 'Demo Campaign',
                      type: 'campaign',
                      status: 'ACTIVE',
                      metrics: {
                        spend: 0,
                        revenue: 0,
                        roas: 0,
                        ctr: 0,
                        cpc: 0,
                        cpm: 0,
                        impressions: 0,
                        clicks: 0,
                        conversions: 0
                      },
                      children: []
                    }}
                    adsets={[]} // Would be populated with real AdSet data
                    ads={[]} // Would be populated with real Ad data
                    onViewInsights={(type, id, name) => {
                      console.log(`View insights for ${type}: ${name} (${id})`)
                      // Could open a modal or navigate to insights page
                    }}
                    onViewPredictions={(type, id, name) => {
                      console.log(`View predictions for ${type}: ${name} (${id})`)
                      // Could open predictions modal
                    }}
                    onNavigate={(breadcrumb) => {
                      console.log('Navigate to:', breadcrumb)
                      // Could update the current view based on breadcrumb
                    }}
                  />
                </Suspense>
              ) : isLoading && campaigns.length === 0 && !isRefreshing ? null : getFilteredAndSortedCampaigns().length === 0 && !isLoading ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="text-center py-10 text-gray-500">
                    <Info className="mx-auto h-8 w-8 mb-2" />
                    No campaigns match the current filters or no data available.
                  </CardContent>
                </Card>
              ) : !showComprehensiveView ? (
                <Accordion
                  type="multiple"
                  value={expandedCampaigns}
                  onValueChange={handleAccordionChange}
                  className="space-y-2"
                >
                  {getFilteredAndSortedCampaigns().map((campaign) => (
                    <AccordionItem
                      key={campaign.id}
                      value={campaign.id}
                      className="bg-gray-800/70 rounded-lg border border-gray-700/80 shadow-md"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:bg-gray-700/50 rounded-t-lg hover:no-underline transition-colors group">
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-2">
                            <h3
                              className="text-md md:text-lg font-semibold text-left truncate text-gray-100"
                              title={campaign.name}
                            >
                              {campaign.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                {campaign.adsets_count || 0} ad sets
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  campaign.status === "ACTIVE" || campaign.effective_status === "ACTIVE"
                                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                                }`}
                              >
                                {campaign.effective_status || campaign.status}
                              </span>
                              <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4 text-xs text-gray-300">
                            {[
                              { 
                                label: "Spend", 
                                value: formatCurrency(campaign.spend || 0) 
                              },
                              {
                                label: "ROAS",
                                value: `${safeToFixed(campaign.roas || 0, 2)}x`,
                                color:
                                  (campaign.roas || 0) > 2
                                    ? "text-green-400"
                                    : (campaign.roas || 0) > 1
                                      ? "text-yellow-400"
                                      : "text-red-400",
                              },
                              {
                                label: "Conversions",
                                value: formatNumberWithCommas(campaign.conversions || 0),
                              },
                              {
                                label: "CTR",
                                value: `${safeToFixed(campaign.ctr || 0, 2)}%`,
                                className: "hidden md:block",
                              },
                              {
                                label: "CPC",
                                value: formatCurrency(campaign.cpc || 0),
                                className: "hidden md:block",
                              },
                            ].map((metric) => (
                              <div key={metric.label} className={metric.className || ""}>
                                <span className="text-gray-500">{metric.label}</span>
                                <p className={`font-medium ${metric.color || "text-gray-200"}`}>{metric.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="border-t border-gray-700/50 bg-gray-800/30 rounded-b-lg">
                        <div className="p-3 md:p-4">
                          {campaign.expandedData?.isLoading ? (
                            <div className="flex justify-center items-center py-10">
                              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                              <p className="ml-2 text-gray-400">Loading campaign details...</p>
                            </div>
                          ) : campaign.expandedData?.error ? (
                            <Alert variant="destructive" className="bg-red-900/30 border-red-700 text-red-300">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{campaign.expandedData.error}</AlertDescription>
                            </Alert>
                          ) : campaign.expandedData ? (
                            <Tabs
                              defaultValue={activeTabs[campaign.id] || "details"}
                              onValueChange={(value) => handleTabChange(campaign.id, value)}
                              className="w-full"
                            >
                              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 bg-gray-700/80 mb-4 p-1 rounded-md text-xs">
                                <TabsTrigger value="details">Details & Ad Sets</TabsTrigger>
                                <TabsTrigger value="predictions">Predictions</TabsTrigger>
                                <TabsTrigger value="demographics">Demographics</TabsTrigger>
                                <TabsTrigger value="dayweek">Day/Time</TabsTrigger>
                                <TabsTrigger value="insights">AI Insights</TabsTrigger>
                              </TabsList>
                              <TabsContent value="details" className="space-y-4">
                                {campaign.expandedData?.historicalDailyData &&
                                  campaign.expandedData.historicalDailyData.length > 0 && (
                                    <Card className="bg-gray-700/50 border-gray-600/70">
                                      <CardHeader>
                                        <CardTitle className="text-base">
                                          Historical Performance ({selectedDateRange.replace(/_/g, " ")})
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="h-[250px] md:h-[300px]">
                                        <Suspense fallback={<Skeleton className="w-full h-full" />}>
                                          <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={campaign.expandedData.historicalDailyData}>
                                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 114, 128, 0.2)" />
                                              <XAxis
                                                dataKey="date"
                                                stroke="#9CA3AF"
                                                fontSize={10}
                                                tickFormatter={(date) =>
                                                  new Date(date).toLocaleDateString("en", {
                                                    month: "short",
                                                    day: "numeric",
                                                  })
                                                }
                                              />
                                              <YAxis
                                                yAxisId="left"
                                                stroke="#818CF8"
                                                fontSize={10}
                                                tickFormatter={(val) => `$${formatNumberWithCommas(val)}`}
                                              />
                                              <YAxis
                                                yAxisId="right"
                                                orientation="right"
                                                stroke="#34D399"
                                                fontSize={10}
                                                tickFormatter={(val) => `${safeToFixed(Number(val), 1)}x`}
                                              />
                                              <Tooltip
                                                contentStyle={{
                                                  backgroundColor: "rgba(31, 41, 55, 0.9)",
                                                  border: "1px solid #4B5563",
                                                  borderRadius: "0.375rem",
                                                }}
                                                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                              />
                                              <Legend wrapperStyle={{ fontSize: "10px" }} />
                                              <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="spend"
                                                stroke="#3B82F6"
                                                name="Spend"
                                                dot={false}
                                                strokeWidth={1.5}
                                              />
                                              <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="roas"
                                                stroke="#10B981"
                                                name="ROAS"
                                                dot={false}
                                                strokeWidth={1.5}
                                              />
                                            </LineChart>
                                          </ResponsiveContainer>
                                        </Suspense>
                                      </CardContent>
                                    </Card>
                                  )}
                                {campaign.expandedData?.todayHourlyData &&
                                  campaign.expandedData.todayHourlyData.length > 0 && (
                                    <Card className="bg-gray-700/50 border-gray-600/70">
                                      <CardHeader>
                                        <CardTitle className="text-base">Today's Hourly Performance</CardTitle>
                                      </CardHeader>
                                      <CardContent className="h-[200px] md:h-[250px]">
                                        <Suspense fallback={<Skeleton className="w-full h-full" />}>
                                          <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={campaign.expandedData.todayHourlyData}>
                                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 114, 128, 0.2)" />
                                              <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={10} />
                                              <YAxis
                                                stroke="#9CA3AF"
                                                fontSize={10}
                                                tickFormatter={(val) => `$${formatNumberWithCommas(val)}`}
                                              />
                                              <Tooltip
                                                contentStyle={{
                                                  backgroundColor: "rgba(31, 41, 55, 0.9)",
                                                  border: "1px solid #4B5563",
                                                }}
                                              />
                                              <Area
                                                type="monotone"
                                                dataKey="spend"
                                                stroke="#3B82F6"
                                                fill="#3B82F6"
                                                fillOpacity={0.3}
                                                name="Spend"
                                              />
                                            </AreaChart>
                                          </ResponsiveContainer>
                                        </Suspense>
                                      </CardContent>
                                    </Card>
                                  )}
                                {campaign.expandedData?.adSets && campaign.expandedData.adSets.length > 0 && (
                                  <Card className="bg-gray-700/50 border-gray-600/70">
                                    <CardHeader>
                                      <CardTitle className="text-base">Ad Sets</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="overflow-x-auto max-h-60">
                                        <table className="w-full text-xs">
                                          <thead>
                                            <tr className="border-b border-gray-600 text-gray-400">
                                              <th className="text-left py-1.5 px-2">Name</th>
                                              <th className="text-left py-1.5 px-2">Status</th>
                                              <th className="text-right py-1.5 px-2">Spend</th>
                                              <th className="text-right py-1.5 px-2">Revenue</th>
                                              <th className="text-right py-1.5 px-2">ROAS</th>
                                              <th className="text-right py-1.5 px-2">Conv.</th>
                                            </tr>
                                          </thead>
                                          <tbody className="text-gray-300">
                                            {campaign.expandedData.adSets.map((adSet: any) => {
                                              // Extract metrics from insights data
                                              let adSetSpend = 0
                                              let adSetRevenue = 0
                                              let adSetConversions = 0
                                              
                                              if (adSet.insights && adSet.insights.data && adSet.insights.data[0]) {
                                                const insight = adSet.insights.data[0]
                                                adSetSpend = parseFloat(insight.spend || '0')
                                                
                                                // Calculate revenue from action_values
                                                if (insight.action_values) {
                                                  insight.action_values.forEach((av: any) => {
                                                    if (['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'].includes(av.action_type)) {
                                                      adSetRevenue += parseFloat(av.value || '0')
                                                    }
                                                  })
                                                }
                                                
                                                // Calculate conversions from actions
                                                if (insight.actions) {
                                                  insight.actions.forEach((action: any) => {
                                                    if (['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'].includes(action.action_type)) {
                                                      adSetConversions += parseInt(action.value || '0')
                                                    }
                                                  })
                                                }
                                              }
                                              
                                              const adSetRoas = adSetSpend > 0 ? adSetRevenue / adSetSpend : 0
                                              
                                              return (
                                                <tr
                                                  key={adSet.id}
                                                  className="border-b border-gray-600/50 hover:bg-gray-700/30"
                                                >
                                                  <td className="py-1.5 px-2 truncate max-w-xs" title={adSet.name}>
                                                    {adSet.name}
                                                  </td>
                                                  <td className="py-1.5 px-2">
                                                    <span
                                                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                                                        adSet.status === "ACTIVE"
                                                          ? "bg-green-500/20 text-green-300"
                                                          : "bg-gray-600/50 text-gray-400"
                                                      }`}
                                                    >
                                                      {adSet.status}
                                                    </span>
                                                  </td>
                                                  <td className="py-1.5 px-2 text-right">
                                                    {formatCurrency(adSetSpend)}
                                                  </td>
                                                  <td className="py-1.5 px-2 text-right">
                                                    {formatCurrency(adSetRevenue)}
                                                  </td>
                                                  <td className="py-1.5 px-2 text-right font-medium">
                                                    {safeToFixed(adSetRoas, 2)}x
                                                  </td>
                                                  <td className="py-1.5 px-2 text-right">
                                                    {formatNumberWithCommas(adSetConversions)}
                                                  </td>
                                                </tr>
                                              )
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                                <div className="flex flex-wrap gap-2 mt-4">
                                  <Suspense fallback={<Button disabled size="sm" variant="outline"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Loading...</Button>}>
                                    <AIAnalysisModal
                                      campaign={campaign}
                                      historicalData={campaign.expandedData?.historicalDailyData}
                                      allCampaigns={campaigns}
                                    />
                                  </Suspense>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => exportCampaignData(campaign)}
                                    className="text-xs border-gray-600 hover:bg-gray-700/50"
                                  >
                                    <Download className="w-3 h-3 mr-1.5" />
                                    Export JSON
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="text-xs border-gray-600 hover:bg-gray-700/50"
                                  >
                                    <a
                                      href={`https://business.facebook.com/adsmanager/manage/campaigns?act=${credentials.adAccountId}&selected_campaign_ids=${campaign.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1.5" />
                                      View in Ads Manager
                                    </a>
                                  </Button>
                                </div>
                              </TabsContent>
                              <TabsContent value="predictions">
                                <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
                                  <CampaignPredictions
                                    campaignName={campaign.name}
                                    historicalData={campaign.expandedData?.historicalDailyData || []}
                                    currentMetrics={{
                                      spend: campaign.spend || 0,
                                      revenue: campaign.revenue || 0,
                                      roas: String(campaign.roas || 0),
                                      conversions: campaign.conversions || 0
                                    }}
                                  />
                                </Suspense>
                              </TabsContent>
                              <TabsContent value="demographics">
                                <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
                                  <DemographicAnalytics
                                    campaignId={campaign.id}
                                    campaignName={campaign.name}
                                    accessToken={credentials.accessToken}
                                    datePreset={selectedDateRange}
                                  />
                                </Suspense>
                              </TabsContent>
                              <TabsContent value="dayweek">
                                <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
                                  <DayWeekPerformance
                                    campaignId={campaign.id}
                                    campaignName={campaign.name}
                                    accessToken={credentials.accessToken}
                                    datePreset={selectedDateRange}
                                  />
                                </Suspense>
                              </TabsContent>
                              <TabsContent value="insights">
                                <Card className="bg-gray-700/50 border-gray-600/70">
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                      <Sparkles className="w-4 h-4 text-purple-400" />
                                      Campaign Intelligence
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                      AI-powered analysis and recommendations for "{campaign.name}"
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <Suspense fallback={<Button disabled size="sm" variant="outline"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Loading...</Button>}>
                                      <AIAnalysisModal
                                        campaign={campaign}
                                        historicalData={campaign.expandedData?.historicalDailyData}
                                        allCampaigns={campaigns}
                                        triggerButtonText="Get Detailed AI Insights"
                                      />
                                    </Suspense>
                                    <div className="mt-3 p-3 bg-gray-800/50 rounded-lg text-xs space-y-1.5 text-gray-300">
                                      <p>
                                        <strong>Status:</strong> {campaign.status}
                                      </p>
                                      <p>
                                        <strong>Objective:</strong> {campaign.objective || "N/A"}
                                      </p>
                                      <p>
                                        <strong>Daily Budget:</strong>{" "}
                                        {campaign.daily_budget
                                          ? formatCurrency(campaign.daily_budget)
                                          : "N/A (Lifetime Budget Likely)"}
                                      </p>
                                      <p>
                                        <strong>Lifetime Budget:</strong>{" "}
                                        {campaign.lifetime_budget
                                          ? formatCurrency(campaign.lifetime_budget)
                                          : "N/A (Daily Budget Likely)"}
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>
                              </TabsContent>
                            </Tabs>
                          ) : (
                            <div className="text-center py-6 text-gray-500 text-sm">
                              Click to load detailed data for this campaign.
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : null}
            </div>
          </>
        ) : (
          <Card className="bg-gray-800 border-gray-700 mt-10">
            <CardContent className="text-center py-12">
              <WifiOff className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Not Connected to Meta Ads API</h3>
              <p className="text-gray-400 mb-6">
                Configure your API credentials to start viewing real-time campaign data.
              </p>
              <Button onClick={() => setShowSettings(true)} className="bg-blue-600 hover:bg-blue-700">
                Configure API Settings
              </Button>
            </CardContent>
          </Card>
        )}
        
        <footer className="text-center mt-12 py-6 border-t border-gray-700">
          <p className="text-xs text-gray-500">Meta Ads Dashboard Pro | Built with Next.js & v0 | Optimized for Performance</p>
        </footer>
      </div>
    </div>
  )
}