"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  MousePointer,
  Eye,
  Target,
  Calendar,
  BarChart3,
  Activity,
  Info,
} from "lucide-react"
import { EnhancedMetaAPIClient } from "@/lib/meta-api-client-enhanced"
import { CredentialManager } from "@/lib/credential-manager"

interface ClientPortalData {
  accountName: string
  campaigns: Array<{
    id: string
    name: string
    status: string
    spend: number
    revenue: number
    roas: number
    impressions: number
    clicks: number
    ctr: number
    conversions: number
  }>
  metrics: {
    totalSpend: number
    totalRevenue: number
    totalConversions: number
    averageRoas: number
    activeCampaigns: number
    totalImpressions: number
    totalClicks: number
    averageCtr: number
  }
  lastUpdated: string
}

export default function ClientPortalPage() {
  const params = useParams()
  const clientId = params.clientId as string
  const [data, setData] = useState<ClientPortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClientData() {
      try {
        setLoading(true)
        
        // In a real implementation, you'd validate the clientId against a whitelist
        // and use a read-only API key for this specific client
        const credentialManager = CredentialManager.getInstance()
        const credentials = await credentialManager.getCredentials()
        
        if (!credentials) {
          throw new Error("No credentials available")
        }

        const client = new EnhancedMetaAPIClient(credentials)
        const accountInfo = await client.getAccountInfo()
        
        // Fetch campaigns with insights
        const campaigns = await client.getCampaignsWithInsights({
          fields: ["name", "status", "effective_status", "daily_budget", "lifetime_budget"],
          insightFields: ["spend", "impressions", "clicks", "ctr", "conversions", "conversion_values"],
          datePreset: "last_30d",
        })

        // Process campaign data
        const processedCampaigns = campaigns.map((campaign: any) => {
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

        // Calculate aggregate metrics
        const metrics = processedCampaigns.reduce((acc, campaign) => {
          acc.totalSpend += campaign.spend
          acc.totalRevenue += campaign.revenue
          acc.totalConversions += campaign.conversions
          acc.totalImpressions += campaign.impressions
          acc.totalClicks += campaign.clicks
          acc.activeCampaigns += campaign.status === "ACTIVE" ? 1 : 0
          return acc
        }, {
          totalSpend: 0,
          totalRevenue: 0,
          totalConversions: 0,
          totalImpressions: 0,
          totalClicks: 0,
          activeCampaigns: 0,
          averageRoas: 0,
          averageCtr: 0,
        })

        metrics.averageRoas = metrics.totalSpend > 0 ? metrics.totalRevenue / metrics.totalSpend : 0
        metrics.averageCtr = metrics.totalImpressions > 0 ? (metrics.totalClicks / metrics.totalImpressions) * 100 : 0

        setData({
          accountName: accountInfo.name || "Client Account",
          campaigns: processedCampaigns,
          metrics,
          lastUpdated: new Date().toLocaleString(),
        })
      } catch (err: any) {
        setError(err.message || "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchClientData()
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchClientData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [clientId])

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            {error || "Unable to load client data. Please check your access permissions."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{data.accountName} - Performance Dashboard</h1>
          <p className="text-muted-foreground">Last updated: {data.lastUpdated}</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Activity className="w-3 h-3 mr-1" />
          Read-Only Access
        </Badge>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{formatCurrency(data.metrics.totalSpend)}</span>
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
              <span className="text-2xl font-bold">{formatCurrency(data.metrics.totalRevenue)}</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average ROAS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{data.metrics.averageRoas.toFixed(2)}x</span>
              <Target className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{data.metrics.activeCampaigns}</span>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Performance metrics for all campaigns in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="conversions">Conversions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">Campaign</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-right">Spend</th>
                      <th className="p-2 text-right">Revenue</th>
                      <th className="p-2 text-right">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b">
                        <td className="p-2">{campaign.name}</td>
                        <td className="p-2">
                          <Badge
                            variant={campaign.status === "ACTIVE" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {campaign.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-right">{formatCurrency(campaign.spend)}</td>
                        <td className="p-2 text-right">{formatCurrency(campaign.revenue)}</td>
                        <td className="p-2 text-right">
                          <span className={campaign.roas >= 2 ? "text-green-600" : "text-orange-600"}>
                            {campaign.roas.toFixed(2)}x
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-4">
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">Campaign</th>
                      <th className="p-2 text-right">Impressions</th>
                      <th className="p-2 text-right">Clicks</th>
                      <th className="p-2 text-right">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b">
                        <td className="p-2">{campaign.name}</td>
                        <td className="p-2 text-right">{formatNumber(campaign.impressions)}</td>
                        <td className="p-2 text-right">{formatNumber(campaign.clicks)}</td>
                        <td className="p-2 text-right">{campaign.ctr.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="conversions" className="space-y-4">
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">Campaign</th>
                      <th className="p-2 text-right">Conversions</th>
                      <th className="p-2 text-right">Cost per Conversion</th>
                      <th className="p-2 text-right">Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.map((campaign) => {
                      const costPerConversion = campaign.conversions > 0 ? campaign.spend / campaign.conversions : 0
                      const conversionRate = campaign.clicks > 0 ? (campaign.conversions / campaign.clicks) * 100 : 0
                      
                      return (
                        <tr key={campaign.id} className="border-b">
                          <td className="p-2">{campaign.name}</td>
                          <td className="p-2 text-right">{formatNumber(campaign.conversions)}</td>
                          <td className="p-2 text-right">{formatCurrency(costPerConversion)}</td>
                          <td className="p-2 text-right">{conversionRate.toFixed(2)}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold">{formatNumber(data.metrics.totalImpressions)}</span>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold">{formatNumber(data.metrics.totalClicks)}</span>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold">{data.metrics.averageCtr.toFixed(2)}%</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This dashboard provides read-only access to your advertising performance data. 
          For full campaign management capabilities, please contact your account manager.
        </AlertDescription>
      </Alert>
    </div>
  )
}