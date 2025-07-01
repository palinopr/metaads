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
  FileText,
  Image as ImageIcon
} from "lucide-react"

interface Ad {
  id: string
  name: string
  status: string
  effective_status: string
  adset_id: string
  adset_name?: string
  campaign_id: string
  campaign_name?: string
  creative?: {
    title?: string
    body?: string
    thumbnail_url?: string
    image_url?: string
  }
  metrics?: {
    impressions: number
    clicks: number
    spend: number
    conversions: number
    ctr: number
    cpm: number
    cpc: number
  }
}

export default function AdDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const campaignId = params.campaignId as string
  const adSetId = params.adsetId as string
  const adId = params.adId as string
  const initialTab = searchParams.get('tab') || 'gender'
  
  const [ad, setAd] = useState<Ad | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { dateRange, setDateRange } = useDateRange()

  useEffect(() => {
    fetchAd()
  }, [adId])

  const fetchAd = async () => {
    try {
      setLoading(true)
      setError("")
      
      // Fetch ad details
      const response = await fetch(`/api/campaigns/${campaignId}/adsets/${adSetId}/ads?adId=${adId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch ad")
      }
      
      if (data.ads && data.ads.length > 0) {
        setAd(data.ads[0])
      } else {
        throw new Error("Ad not found")
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

  if (error || !ad) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>{error || "Ad not found"}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/campaigns/${campaignId}/adsets/${adSetId}/ads`)}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Ads
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
              onClick={() => router.push(`/dashboard/campaigns/${campaignId}/adsets/${adSetId}/ads`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{ad.name}</h1>
            {getStatusBadge(ad.effective_status || ad.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            Campaign: {ad.campaign_name || campaignId} • Ad Set: {ad.adset_name || adSetId}
          </p>
        </div>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      {/* Creative Preview */}
      {ad.creative && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Creative Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {ad.creative.image_url || ad.creative.thumbnail_url ? (
                <img 
                  src={ad.creative.image_url || ad.creative.thumbnail_url}
                  alt="Ad creative"
                  className="w-24 h-24 rounded object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-medium">{ad.creative.title || "No title"}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {ad.creative.body || "No description"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      {ad.metrics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impressions</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(ad.metrics.impressions)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(ad.metrics.clicks)}</div>
              <p className="text-xs text-muted-foreground">
                CTR: {ad.metrics.ctr.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(ad.metrics.spend)}</div>
              <p className="text-xs text-muted-foreground">
                CPC: {formatCurrency(ad.metrics.cpc || 0)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(ad.metrics.conversions)}</div>
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
          <TabsTrigger value="insights">
            <BarChart3 className="mr-2 h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="details">
            <FileText className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="gender" className="space-y-4">
          <GenderAnalytics 
            campaignId={campaignId} 
            adSetId={adSetId}
            adId={adId}
            dateRange={dateRangeForApi} 
          />
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ad Insights</CardTitle>
              <CardDescription>
                Detailed performance metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Insights visualization coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ad Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ad ID</span>
                  <span className="text-sm font-mono">{ad.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-sm">{ad.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Effective Status</span>
                  <span className="text-sm">{ad.effective_status}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}