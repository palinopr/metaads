"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Plus, 
  Loader2, 
  Eye, 
  MousePointer, 
  DollarSign,
  TrendingUp,
  Pause,
  Play,
  MoreHorizontal,
  RefreshCw,
  ArrowLeft,
  FileText,
  Image
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DateRangeSelector } from "@/components/date-range-selector"
import { useDateRange } from "@/contexts/date-range-context"

interface Ad {
  id: string
  name: string
  status: string
  effective_status: string
  adset_id: string
  adset_name?: string
  campaign_id: string
  campaign_name?: string
  created_time: string
  creative?: {
    id: string
    title?: string
    body?: string
    image_url?: string
    thumbnail_url?: string
    link_url?: string
  }
  metrics?: {
    impressions: number
    clicks: number
    spend: number
    ctr: number
    cpm: number
    conversions?: number
    cost_per_conversion?: number
    frequency?: number
    reach?: number
  }
}

export default function AdsPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.campaignId as string
  const adsetId = params.adsetId as string
  
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState<any>(null)
  const [adsetName, setAdsetName] = useState("")
  const [campaignName, setCampaignName] = useState("")
  const { dateRange, setDateRange } = useDateRange()

  useEffect(() => {
    fetchAds()
  }, [adsetId, dateRange])

  const fetchAds = async () => {
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch(`/api/campaigns/${campaignId}/adsets/${adsetId}/ads?date_preset=${dateRange}`)
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setAds(data.ads || [])
        setSummary(data.summary)
        setAdsetName(data.adsetName || "")
        setCampaignName(data.campaignName || "")
      }
    } catch (error: any) {
      setError("Failed to fetch ads")
      console.error("Error fetching ads:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      ACTIVE: { variant: "default", className: "bg-green-100 text-green-800" },
      PAUSED: { variant: "secondary", className: "bg-yellow-100 text-yellow-800" },
      DELETED: { variant: "destructive", className: "bg-red-100 text-red-800" },
      ARCHIVED: { variant: "outline", className: "" }
    }
    
    const config = variants[status] || variants.PAUSED
    
    return (
      <Badge variant={config.variant} className={config.className}>
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

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/campaigns" className="hover:text-foreground">
          Campaigns
        </Link>
        <span>/</span>
        <Link href={`/dashboard/campaigns/${campaignId}/adsets`} className="hover:text-foreground">
          {campaignName || campaignId}
        </Link>
        <span>/</span>
        <span className="text-foreground">{adsetName || adsetId}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Ads</h1>
            <p className="text-muted-foreground mt-1">
              Manage ads for {adsetName || "this ad set"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <Button variant="outline" onClick={fetchAds}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Ad
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.active_ads}</div>
              <p className="text-xs text-muted-foreground">
                of {summary.total_ads} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.total_spend)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impressions</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.total_impressions)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.avg_frequency && `${summary.avg_frequency.toFixed(1)} avg frequency`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.total_clicks)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.avg_ctr && `${summary.avg_ctr.toFixed(2)}% avg CTR`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reach</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.total_reach || 0)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Ads Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Ads</CardTitle>
        </CardHeader>
        <CardContent>
          {ads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No ads found</p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create your first ad
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Creative</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">CPM</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ad.name}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {ad.id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {ad.creative?.thumbnail_url ? (
                          <img 
                            src={ad.creative.thumbnail_url} 
                            alt={ad.creative.title || "Ad thumbnail"}
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                            <Image className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="text-sm">
                          <div className="font-medium truncate max-w-[200px]">
                            {ad.creative?.title || "No title"}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {ad.creative?.body || "No description"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(ad.effective_status)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(ad.metrics?.impressions || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(ad.metrics?.clicks || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(ad.metrics?.spend || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {ad.metrics?.ctr ? `${ad.metrics.ctr.toFixed(2)}%` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {ad.metrics?.cpm ? formatCurrency(ad.metrics.cpm) : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            View Performance
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            {ad.effective_status === "ACTIVE" ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause Ad
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Resume Ad
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}