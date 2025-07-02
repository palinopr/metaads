"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DateRangeSelector } from "@/components/date-range-selector"
import { useDateRange } from "@/contexts/date-range-context"
import { AgentChat } from "@/components/agent-chat"
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
  BarChart3,
  Brain,
  AlertCircle,
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
import { MetaReconnectBanner } from "@/components/meta-reconnect-banner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Campaign {
  id: string
  name: string
  status: string
  effective_status?: string
  objective: string
  created_time?: string
  budgetAmount?: number
  budgetType?: string
  insights?: {
    impressions: number
    clicks: number
    spend: number
    ctr: number
    cpm: number
  }
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { dateRange, setDateRange } = useDateRange()

  useEffect(() => {
    fetchCampaigns()
  }, [dateRange])

  const fetchCampaigns = async (forceSync = false) => {
    try {
      if (forceSync) {
        setSyncing(true)
      } else {
        setLoading(true)
      }
      setError("")
      
      // Use simple direct Meta API endpoint (like overview page does)
      const url = forceSync 
        ? `/api/campaigns?date_preset=${dateRange}&sync=true&includeInsights=true`
        : `/api/campaigns/simple?date_preset=${dateRange}`
      
      console.log('[Campaigns Page] Fetching campaigns:', {
        url,
        dateRange,
        forceSync
      })
      
      const response = await fetch(url)
      const data = await response.json()
      
      console.log('[Campaigns Page] Response:', {
        status: response.status,
        ok: response.ok,
        hasError: !!data.error,
        campaignsCount: data.campaigns?.length || 0,
        debug: data.debug
      })
      
      if (data.error) {
        setError(data.error)
        setDebugInfo(data.debug)
      } else {
        setCampaigns(data.campaigns || [])
        setSummary(data.summary)
        setDebugInfo(null)
        if (forceSync && data.syncedAt) {
          setLastSyncTime(new Date(data.syncedAt))
        }
      }
    } catch (error: any) {
      setError("Failed to fetch campaigns")
      console.error("Error fetching campaigns:", error)
    } finally {
      setLoading(false)
      setSyncing(false)
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

  // Filter and sort campaigns
  const filteredCampaigns = campaigns
    .filter(campaign => {
      if (statusFilter === "all") return true
      return (campaign.effective_status || campaign.status).toLowerCase() === statusFilter.toLowerCase()
    })
    .sort((a, b) => {
      // Sort by status first (Active > Others)
      const statusA = (a.effective_status || a.status).toUpperCase()
      const statusB = (b.effective_status || b.status).toUpperCase()
      
      if (statusA === "ACTIVE" && statusB !== "ACTIVE") return -1
      if (statusA !== "ACTIVE" && statusB === "ACTIVE") return 1
      
      // Then sort by spend (higher spend first)
      const spendA = a.insights?.spend || 0
      const spendB = b.insights?.spend || 0
      return spendB - spendA
    })

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
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h1">Campaigns</h1>
          <p className="text-muted-foreground text-sm">
            Manage and monitor your advertising campaigns
            {lastSyncTime && (
              <span className="ml-2 text-xs">
                • Last synced: {lastSyncTime.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => fetchCampaigns(true)}
            disabled={syncing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync with Meta'}
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/ai-lab')}>
            <Brain className="mr-2 h-4 w-4" />
            AI Lab
          </Button>
          <Button asChild>
            <Link href="/dashboard/campaigns/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-3 md:grid-cols-4">
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.active_campaigns}</div>
              <p className="text-xs text-muted-foreground">
                of {summary.total_campaigns} total
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated metric-card metric-card-spend">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.total_spend || 0)}</div>
            </CardContent>
          </Card>

          <Card className="card-elevated metric-card metric-card-impressions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impressions</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.total_impressions || 0)}</div>
            </CardContent>
          </Card>

          <Card className="card-elevated metric-card metric-card-clicks">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.total_clicks || 0)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Alert or Reconnect Banner */}
      {debugInfo ? (
        <MetaReconnectBanner debug={debugInfo} />
      ) : error ? (
        error === "No ad account selected" ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>{error}</p>
                <Button 
                  asChild 
                  size="sm"
                  variant="outline"
                >
                  <Link href="/dashboard/connections/meta/accounts">
                    Select Ad Account
                  </Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )
      ) : null}

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter === 'all' ? 'All Campaigns' : 
             statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) + ' Campaigns'}
            {filteredCampaigns.length > 0 && ` (${filteredCampaigns.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No campaigns found</p>
              <Button asChild>
                <Link href="/dashboard/campaigns/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first campaign
                </Link>
              </Button>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No {statusFilter !== 'all' ? statusFilter : ''} campaigns found</p>
              <Button 
                variant="outline" 
                onClick={() => setStatusFilter('all')}
              >
                Show all campaigns
              </Button>
            </div>
          ) : (
            <Table className="table-compact">
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Gender Analytics</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow 
                    key={campaign.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-blue-600 hover:underline">{campaign.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {campaign.objective}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(campaign.effective_status || campaign.status)}
                    </TableCell>
                    <TableCell>
                      {campaign.budgetAmount && (
                        <div className="text-sm">
                          {formatCurrency(campaign.budgetAmount / 100)}
                          {campaign.budgetType === 'DAILY' ? '/day' : ' lifetime'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-xs w-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/campaigns/${campaign.id}`)
                        }}
                      >
                        <Users className="mr-1 h-3 w-3" />
                        View Analytics
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(campaign.insights?.impressions || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(campaign.insights?.clicks || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency((campaign.insights?.spend || 0) / 100)}
                    </TableCell>
                    <TableCell className="text-right">
                      {campaign.insights?.ctr ? `${(campaign.insights.ctr / 100).toFixed(2)}%` : "-"}
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
                              router.push(`/dashboard/campaigns/${campaign.id}/analytics`)
                            }}
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/dashboard/campaigns/${campaign.id}`)
                            }}
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Campaign Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/dashboard/ai-lab?campaign=${campaign.id}`)
                            }}
                          >
                            <Brain className="mr-2 h-4 w-4" />
                            AI Optimize
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            {(campaign.effective_status || campaign.status) === "ACTIVE" ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause Campaign
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Resume Campaign
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
      
      {/* AI Campaign Assistant */}
      <AgentChat agentType="campaign" />
    </div>
  )
}