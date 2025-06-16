"use client"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import React, { useState, useEffect, useCallback } from "react"
import { optimizedApiManager } from "@/lib/api-manager-optimized"
import { EnhancedMetaAPIClient } from "@/lib/meta-api-client-enhanced"
import { CredentialManager } from "@/lib/credential-manager"
import { CommandPalette } from "@/components/command-palette"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  DollarSign,
  MousePointer,
  Eye,
  Command,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { EnhancedPerformanceCharts } from "@/components/enhanced-performance-charts"
import { DailyBudgetOptimizer } from "@/components/daily-budget-optimizer"
import { BudgetCommandCenter } from "@/components/budget-command-center"
import { PerformanceAnomalyDetector } from "@/components/performance-anomaly-detector"
import { toast } from "sonner"

interface Campaign {
  id: string
  name: string
  status: string
  effective_status?: string
  spend: number
  revenue: number
  roas: number
  impressions: number
  clicks: number
  ctr: number
  conversions: number
}

interface OverviewData {
  totalSpend: number
  totalRevenue: number
  totalConversions: number
  overallROAS: number
  activeCampaigns: number
  totalImpressions: number
  totalClicks: number
  avgCTR: number
}

export default function CleanDashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [overview, setOverview] = useState<OverviewData>({
    totalSpend: 0,
    totalRevenue: 0,
    totalConversions: 0,
    overallROAS: 0,
    activeCampaigns: 0,
    totalImpressions: 0,
    totalClicks: 0,
    avgCTR: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showBudgetCenter, setShowBudgetCenter] = useState(false)
  const [showAnomalyDetector, setShowAnomalyDetector] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      if (!loading) setRefreshing(true)
      
      const credentialManager = CredentialManager.getInstance()
      const credentials = await credentialManager.getCredentials()
      
      if (!credentials) {
        throw new Error("No credentials found")
      }

      const client = new EnhancedMetaAPIClient(credentials)
      const campaignsData = await client.getCampaignsWithInsights({
        fields: ["name", "status", "effective_status", "daily_budget", "lifetime_budget"],
        insightFields: ["spend", "impressions", "clicks", "ctr", "conversions", "conversion_values"],
        datePreset: "last_30d",
      })

      // Process campaigns
      const processedCampaigns = campaignsData.map((campaign: any) => {
        const insights = campaign.insights?.data?.[0] || {}
        const spend = parseFloat(insights.spend || "0")
        const revenue = parseFloat(insights.conversion_values?.find((v: any) => v.action_type === "purchase")?.value || "0")
        const conversions = parseInt(insights.conversions?.find((c: any) => c.action_type === "purchase")?.value || "0")
        
        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.effective_status || campaign.status,
          spend,
          revenue,
          roas: spend > 0 ? revenue / spend : 0,
          impressions: parseInt(insights.impressions || "0"),
          clicks: parseInt(insights.clicks || "0"),
          ctr: parseFloat(insights.ctr || "0"),
          conversions,
        }
      })

      // Calculate overview
      const newOverview = processedCampaigns.reduce((acc, campaign) => {
        acc.totalSpend += campaign.spend
        acc.totalRevenue += campaign.revenue
        acc.totalConversions += campaign.conversions
        acc.totalImpressions += campaign.impressions
        acc.totalClicks += campaign.clicks
        if (campaign.status === "ACTIVE") acc.activeCampaigns++
        return acc
      }, {
        totalSpend: 0,
        totalRevenue: 0,
        totalConversions: 0,
        totalImpressions: 0,
        totalClicks: 0,
        activeCampaigns: 0,
        overallROAS: 0,
        avgCTR: 0,
      })

      newOverview.overallROAS = newOverview.totalSpend > 0 ? newOverview.totalRevenue / newOverview.totalSpend : 0
      newOverview.avgCTR = newOverview.totalImpressions > 0 ? (newOverview.totalClicks / newOverview.totalImpressions) * 100 : 0

      setCampaigns(processedCampaigns)
      setOverview(newOverview)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch campaign data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [loading])

  useEffect(() => {
    fetchData()
  }, [])

  // Event listeners for command palette actions
  useEffect(() => {
    const handleRefreshData = () => fetchData()
    const handleOpenBudgetCenter = () => setShowBudgetCenter(true)
    const handleOpenAnomalyDetector = () => setShowAnomalyDetector(true)
    
    window.addEventListener('refresh-all-data', handleRefreshData)
    window.addEventListener('toggle-budget-command-center', handleOpenBudgetCenter)
    window.addEventListener('toggle-anomaly-detector', handleOpenAnomalyDetector)
    
    return () => {
      window.removeEventListener('refresh-all-data', handleRefreshData)
      window.removeEventListener('toggle-budget-command-center', handleOpenBudgetCenter)
      window.removeEventListener('toggle-anomaly-detector', handleOpenAnomalyDetector)
    }
  }, [fetchData])

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <CommandPalette />
      
      <div className="p-6 space-y-6">
        {/* Clean Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Campaign Dashboard</h1>
            <p className="text-muted-foreground">Press ⌘K to open command palette</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1">
              <Command className="w-3 h-3 mr-1" />
              ⌘K
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchData}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{formatCurrency(overview.totalSpend)}</span>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{formatCurrency(overview.totalRevenue)}</span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ROAS: {overview.overallROAS.toFixed(2)}x
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{overview.activeCampaigns}</span>
                <Badge variant="default" className="text-xs">
                  {campaigns.length} total
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>CTR</span>
                  <span className="font-medium">{overview.avgCTR.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Conversions</span>
                  <span className="font-medium">{formatNumber(overview.totalConversions)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>30-day performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedPerformanceCharts campaigns={campaigns} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>
                  All optimization actions are available via the command palette (⌘K)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left">Campaign</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-right">Spend</th>
                        <th className="p-3 text-right">Revenue</th>
                        <th className="p-3 text-right">ROAS</th>
                        <th className="p-3 text-right">CTR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((campaign) => (
                        <tr key={campaign.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{campaign.name}</td>
                          <td className="p-3">
                            <Badge
                              variant={campaign.status === "ACTIVE" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {campaign.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">{formatCurrency(campaign.spend)}</td>
                          <td className="p-3 text-right">{formatCurrency(campaign.revenue)}</td>
                          <td className="p-3 text-right">
                            <span className={campaign.roas >= 2 ? "text-green-600" : campaign.roas >= 1 ? "text-yellow-600" : "text-red-600"}>
                              {campaign.roas.toFixed(2)}x
                            </span>
                          </td>
                          <td className="p-3 text-right">{campaign.ctr.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Use the command palette (⌘K) to access advanced features like AI optimization, 
                budget analysis, and anomaly detection.
              </AlertDescription>
            </Alert>
            
            {showBudgetCenter && (
              <BudgetCommandCenter 
                campaigns={campaigns}
                onClose={() => setShowBudgetCenter(false)}
              />
            )}
            
            {showAnomalyDetector && (
              <PerformanceAnomalyDetector 
                campaigns={campaigns}
                onClose={() => setShowAnomalyDetector(false)}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}