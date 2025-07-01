"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
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
  Image as ImageIcon
} from "lucide-react"

interface AdSet {
  id: string
  name: string
  status: string
  effective_status: string
  campaign_id: string
  campaign_name?: string
  optimization_goal?: string
  billing_event?: string
  bid_amount?: number
  daily_budget?: number
  lifetime_budget?: number
  metrics?: {
    impressions: number
    clicks: number
    spend: number
    conversions: number
    ctr: number
    cpm: number
  }
}

export default function AdSetDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const campaignId = params.campaignId as string
  const adSetId = params.adsetId as string
  const initialTab = searchParams.get('tab') || 'gender'
  
  const [adSet, setAdSet] = useState<AdSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { dateRange, setDateRange } = useDateRange()

  useEffect(() => {
    fetchAdSet()
  }, [adSetId])

  const fetchAdSet = async () => {
    try {
      setLoading(true)
      setError("")
      
      // Fetch ad set details
      const response = await fetch(`/api/campaigns/${campaignId}/adsets?adSetId=${adSetId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch ad set")
      }
      
      if (data.adSets && data.adSets.length > 0) {
        setAdSet(data.adSets[0])
      } else {
        throw new Error("Ad set not found")
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

  if (error || !adSet) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>{error || "Ad set not found"}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/campaigns/${campaignId}/adsets`)}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Ad Sets
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
              onClick={() => router.push(`/dashboard/campaigns/${campaignId}/adsets`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{adSet.name}</h1>
            {getStatusBadge(adSet.effective_status || adSet.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            {adSet.optimization_goal} • Budget: {
              adSet.daily_budget 
                ? `${formatCurrency(adSet.daily_budget)}/day`
                : adSet.lifetime_budget
                ? `${formatCurrency(adSet.lifetime_budget)} lifetime`
                : 'No budget set'
            }
          </p>
        </div>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      {/* Overview Cards */}
      {adSet.metrics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impressions</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(adSet.metrics.impressions)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(adSet.metrics.clicks)}</div>
              <p className="text-xs text-muted-foreground">
                CTR: {adSet.metrics.ctr.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(adSet.metrics.spend)}</div>
              <p className="text-xs text-muted-foreground">
                CPM: {formatCurrency(adSet.metrics.cpm)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(adSet.metrics.conversions)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue={initialTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="gender">
            <Users className="mr-2 h-4 w-4" />
            Gender Analytics
          </TabsTrigger>
          <TabsTrigger value="ads">
            <ImageIcon className="mr-2 h-4 w-4" />
            Ads
          </TabsTrigger>
          <TabsTrigger value="insights">
            <BarChart3 className="mr-2 h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="gender" className="space-y-4">
          <GenderAnalytics 
            campaignId={campaignId} 
            adSetId={adSetId}
            dateRange={dateRangeForApi} 
          />
        </TabsContent>
        
        <TabsContent value="ads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ads</CardTitle>
              <CardDescription>
                Manage ads for this ad set
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Button onClick={() => router.push(`/dashboard/campaigns/${campaignId}/adsets/${adSetId}/ads`)}>
                View Ads
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ad Set Insights</CardTitle>
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