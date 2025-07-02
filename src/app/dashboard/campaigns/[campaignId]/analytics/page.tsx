"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DateRangeSelector } from "@/components/date-range-selector"
import { GenderAnalytics } from "@/components/gender-analytics"
import { AgeAnalytics } from "@/components/age-analytics"
import { PerformanceTimeline } from "@/components/performance-timeline"
import { useDateRange } from "@/contexts/date-range-context"
import {
  ArrowLeft,
  BarChart3,
  Loader2,
  Users,
  Clock,
  DollarSign,
  Target,
  TrendingUp,
  Download,
  Share2,
  Brain,
  Eye,
  MousePointer
} from "lucide-react"

interface Campaign {
  id: string
  name: string
  status: string
  objective: string
  budgetAmount: number
  budgetType: string
  insights?: {
    impressions: number
    clicks: number
    spend: number
    conversions: number
    ctr: number
    cpm: number
  }
}

export default function CampaignAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.campaignId as string
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { dateRange, setDateRange } = useDateRange()

  useEffect(() => {
    fetchCampaign()
  }, [campaignId, dateRange])

  const fetchCampaign = async () => {
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch(`/api/campaigns/${campaignId}/details?sync=true&date_preset=${dateRange}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch campaign")
      }
      
      setCampaign(data)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      ACTIVE: "badge-active",
      PAUSED: "badge-paused",
      DELETED: "badge-error",
      ARCHIVED: "bg-gray-100 text-gray-700 border-gray-200"
    }
    
    return (
      <Badge className={`${statusClasses[status as keyof typeof statusClasses] || statusClasses.PAUSED} border`}>
        {status}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>{error || "Campaign not found"}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/campaigns")}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>
      </div>
    )
  }

  const dateRangeForApi = {
    start: new Date(Date.now() - (dateRange === 'last_7d' ? 7 : dateRange === 'last_14d' ? 14 : 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/campaigns/${campaignId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Campaign Analytics
            </h1>
            {getStatusBadge(campaign.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            {campaign.name} • {campaign.objective} • {campaign.budgetType === 'DAILY' ? 'Daily' : 'Lifetime'} Budget: {formatCurrency(campaign.budgetAmount / 100)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {campaign.insights && (
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impressions</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(campaign.insights.impressions)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(campaign.insights.clicks)}</div>
              <p className="text-xs text-muted-foreground">
                CTR: {(campaign.insights.ctr / 100).toFixed(2)}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(campaign.insights.spend / 100)}</div>
              <p className="text-xs text-muted-foreground">
                CPM: {formatCurrency(campaign.insights.cpm / 100)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(campaign.insights.conversions)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPC</CardTitle>
              <MousePointer className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaign.insights.clicks > 0 
                  ? formatCurrency(campaign.insights.spend / campaign.insights.clicks / 100)
                  : "$0.00"
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROAS</CardTitle>
              <Target className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaign.insights.spend > 0 
                  ? ((campaign.insights.conversions * 50) / (campaign.insights.spend / 100)).toFixed(2) + "x"
                  : "0x"
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="demographics">
            <Users className="mr-2 h-4 w-4" />
            Demographics
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Clock className="mr-2 h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="costs">
            <DollarSign className="mr-2 h-4 w-4" />
            Cost Analysis
          </TabsTrigger>
          <TabsTrigger value="audience">
            <Target className="mr-2 h-4 w-4" />
            Audience
          </TabsTrigger>
          <TabsTrigger value="funnel">
            <TrendingUp className="mr-2 h-4 w-4" />
            Funnel
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Brain className="mr-2 h-4 w-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="demographics" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Gender Distribution</h3>
            <GenderAnalytics campaignId={campaignId} dateRange={dateRangeForApi} />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Age Distribution</h3>
            <AgeAnalytics campaignId={campaignId} dateRange={dateRangeForApi} />
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <PerformanceTimeline campaignId={campaignId} dateRange={dateRangeForApi} />
        </TabsContent>
        
        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
              <CardDescription>
                Understand your spending patterns and ROI
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Cost analysis visualization coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audience Insights</CardTitle>
              <CardDescription>
                Deep dive into your audience segments
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Audience insights visualization coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>
                Visualize your customer journey from impression to conversion
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Conversion funnel visualization coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>
                Get intelligent recommendations based on your campaign data
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">AI insights coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}