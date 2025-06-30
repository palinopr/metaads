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
  Brain
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

interface Campaign {
  id: string
  name: string
  status: string
  effective_status: string
  objective: string
  created_time: string
  daily_budget?: number
  lifetime_budget?: number
  metrics?: {
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
  const [error, setError] = useState("")
  const [summary, setSummary] = useState<any>(null)
  const { dateRange, setDateRange } = useDateRange()

  useEffect(() => {
    fetchCampaigns()
  }, [dateRange])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch(`/api/campaigns?date_preset=${dateRange}`)
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setCampaigns(data.campaigns || [])
        setSummary(data.summary)
      }
    } catch (error: any) {
      setError("Failed to fetch campaigns")
      console.error("Error fetching campaigns:", error)
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

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h1">Campaigns</h1>
          <p className="text-muted-foreground text-sm">
            Manage and monitor your advertising campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <Button variant="outline" onClick={fetchCampaigns}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
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
              <div className="text-2xl font-bold">{formatCurrency(summary.total_spend)}</div>
            </CardContent>
          </Card>

          <Card className="card-elevated metric-card metric-card-impressions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impressions</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.total_impressions)}</div>
            </CardContent>
          </Card>

          <Card className="card-elevated metric-card metric-card-clicks">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-purple-500" />
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

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
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
          ) : (
            <Table className="table-compact">
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
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
                {campaigns.map((campaign) => (
                  <TableRow 
                    key={campaign.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/dashboard/campaigns/${campaign.id}/adsets`)}
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
                      {getStatusBadge(campaign.effective_status)}
                    </TableCell>
                    <TableCell>
                      {campaign.daily_budget && (
                        <div className="text-sm">
                          {formatCurrency(campaign.daily_budget)}/day
                        </div>
                      )}
                      {campaign.lifetime_budget && (
                        <div className="text-sm">
                          {formatCurrency(campaign.lifetime_budget)} lifetime
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(campaign.metrics?.impressions || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(campaign.metrics?.clicks || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(campaign.metrics?.spend || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {campaign.metrics?.ctr ? `${campaign.metrics.ctr.toFixed(2)}%` : "-"}
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
                              router.push(`/dashboard/campaigns/${campaign.id}/adsets`)
                            }}
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            View Details
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
                            {campaign.effective_status === "ACTIVE" ? (
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