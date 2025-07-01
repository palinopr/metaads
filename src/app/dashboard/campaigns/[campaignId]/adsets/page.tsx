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
  Target,
  Users
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

interface AdSet {
  id: string
  name: string
  status: string
  effective_status: string
  campaign_id: string
  campaign_name?: string
  created_time: string
  daily_budget?: number
  lifetime_budget?: number
  targeting?: any
  optimization_goal?: string
  billing_event?: string
  bid_amount?: number
  metrics?: {
    impressions: number
    clicks: number
    spend: number
    ctr: number
    cpm: number
    conversions?: number
    cost_per_conversion?: number
  }
}

export default function AdSetsPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.campaignId as string
  
  const [adSets, setAdSets] = useState<AdSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState<any>(null)
  const [campaignName, setCampaignName] = useState("")
  const { dateRange, setDateRange } = useDateRange()

  useEffect(() => {
    fetchAdSets()
  }, [campaignId, dateRange])

  const fetchAdSets = async () => {
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch(`/api/campaigns/${campaignId}/adsets?date_preset=${dateRange}`)
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setAdSets(data.adSets || [])
        setSummary(data.summary)
        setCampaignName(data.campaignName || "")
      }
    } catch (error: any) {
      setError("Failed to fetch ad sets")
      console.error("Error fetching ad sets:", error)
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
        <span className="text-foreground">{campaignName || campaignId}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Ad Sets</h1>
            <p className="text-muted-foreground mt-1">
              Manage ad sets for {campaignName || "this campaign"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <Button variant="outline" onClick={fetchAdSets}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Ad Set
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Ad Sets</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.active_adsets}</div>
              <p className="text-xs text-muted-foreground">
                of {summary.total_adsets} total
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.total_clicks)}</div>
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

      {/* Ad Sets Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Ad Sets</CardTitle>
        </CardHeader>
        <CardContent>
          {adSets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No ad sets found</p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create your first ad set
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Set</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adSets.map((adSet) => (
                  <TableRow 
                    key={adSet.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/dashboard/campaigns/${campaignId}/adsets/${adSet.id}/ads`)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-blue-600 hover:underline">{adSet.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {adSet.optimization_goal}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(adSet.effective_status)}
                    </TableCell>
                    <TableCell>
                      {adSet.daily_budget && (
                        <div className="text-sm">
                          {formatCurrency(adSet.daily_budget)}/day
                        </div>
                      )}
                      {adSet.lifetime_budget && (
                        <div className="text-sm">
                          {formatCurrency(adSet.lifetime_budget)} lifetime
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(adSet.metrics?.impressions || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(adSet.metrics?.clicks || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(adSet.metrics?.spend || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {adSet.metrics?.ctr ? `${adSet.metrics.ctr.toFixed(2)}%` : "-"}
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
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/dashboard/campaigns/${campaignId}/adsets/${adSet.id}?tab=gender`)
                            }}
                          >
                            <Users className="mr-2 h-4 w-4" />
                            Gender Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            {adSet.effective_status === "ACTIVE" ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause Ad Set
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Resume Ad Set
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