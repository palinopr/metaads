"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DateRangeSelector } from "@/components/date-range-selector"
import { GenderAnalytics } from "@/components/gender-analytics"
import { useDateRange } from "@/contexts/date-range-context"
import {
  ArrowLeft,
  BarChart3,
  Loader2,
  Eye,
  MousePointer,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Calendar
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

export default function CampaignDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.campaignId as string
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { dateRange, setDateRange } = useDateRange()

  useEffect(() => {
    fetchCampaign()
  }, [campaignId])

  const fetchCampaign = async () => {
    try {
      setLoading(true)
      setError("")
      
      // Fetch campaign details
      const response = await fetch(`/api/campaigns?campaignId=${campaignId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch campaign")
      }
      
      if (data.campaigns && data.campaigns.length > 0) {
        setCampaign(data.campaigns[0])
      } else {
        throw new Error("Campaign not found")
      }
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
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/campaigns")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            {getStatusBadge(campaign.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            {campaign.objective} • {campaign.budgetType === 'DAILY' ? 'Daily' : 'Lifetime'} Budget: {formatCurrency(campaign.budgetAmount / 100)}
          </p>
        </div>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      {/* Overview Cards */}
      {campaign.insights && (
        <div className="grid gap-4 md:grid-cols-4">
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
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="gender" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gender">
            <Users className="mr-2 h-4 w-4" />
            Gender Analytics
          </TabsTrigger>
          <TabsTrigger value="adsets">
            <Target className="mr-2 h-4 w-4" />
            Ad Sets
          </TabsTrigger>
          <TabsTrigger value="insights">
            <BarChart3 className="mr-2 h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="gender" className="space-y-4">
          <GenderAnalytics campaignId={campaignId} dateRange={dateRangeForApi} />
        </TabsContent>
        
        <TabsContent value="adsets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ad Sets</CardTitle>
              <CardDescription>
                Manage ad sets for this campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Button onClick={() => router.push(`/dashboard/campaigns/${campaignId}/adsets`)}>
                View Ad Sets
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Insights</CardTitle>
              <CardDescription>
                Detailed performance metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Insights visualization coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}