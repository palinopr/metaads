"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  MousePointer, 
  Eye, 
  DollarSign,
  BarChart3,
  Download,
  Filter,
  Plus
} from "lucide-react"
import Link from "next/link"
import { DateRangeSelector, type DatePreset } from "@/components/date-range-selector"

interface AccountStats {
  impressions: number
  clicks: number
  spend: number
  ctr: number
  cpm: number
}

interface SelectedAccount {
  account_id: string
  name: string
  currency: string
  timezone_name: string
  stats?: AccountStats | null
}

export default function DashboardPage() {
  const [selectedAccount, setSelectedAccount] = useState<SelectedAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DatePreset>("last_30d")

  useEffect(() => {
    fetchSelectedAccount()
  }, [dateRange])

  const fetchSelectedAccount = async () => {
    try {
      const response = await fetch(`/api/connections/meta/selected-account?date_preset=${dateRange}`)
      const data = await response.json()
      if (data.account) {
        setSelectedAccount(data.account)
      }
    } catch (error) {
      console.error("Error fetching account data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!selectedAccount) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">No Ad Account Selected</h2>
          <p className="text-muted-foreground mb-6">
            Please connect and select an ad account to view your dashboard
          </p>
          <Button asChild>
            <Link href="/dashboard/connections">
              <Plus className="mr-2 h-4 w-4" />
              Connect Ad Account
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const stats = selectedAccount.stats || {
    impressions: 0,
    clicks: 0,
    spend: 0,
    ctr: 0,
    cpm: 0
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Ads Manager</h1>
          <div className="flex items-center gap-3">
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.spend, selectedAccount.currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dateRange === "today" ? "Today" : 
               dateRange === "yesterday" ? "Yesterday" :
               dateRange === "last_7d" ? "Last 7 days" :
               dateRange === "last_14d" ? "Last 14 days" :
               dateRange === "last_30d" ? "Last 30 days" :
               dateRange === "this_month" ? "This month" :
               dateRange === "last_month" ? "Last month" : "Lifetime"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.impressions)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.cpm > 0 && `${formatCurrency(stats.cpm, selectedAccount.currency)} CPM`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.clicks)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.ctr > 0 && `${stats.ctr.toFixed(2)}% CTR`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/dashboard/campaigns" className="text-blue-600 hover:underline">
                View all campaigns
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button asChild className="w-full">
              <Link href="/dashboard/campaigns/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Link>
            </Button>
            <Button variant="outline" className="w-full" disabled>
              <TrendingUp className="mr-2 h-4 w-4" />
              View Insights
            </Button>
            <Button variant="outline" className="w-full" disabled>
              <BarChart3 className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Campaigns Table (placeholder) */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Campaigns</CardTitle>
            <Button variant="link" asChild>
              <Link href="/dashboard/campaigns">View all</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No campaigns yet</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/campaigns/create">
                <Plus className="mr-2 h-4 w-4" />
                Create your first campaign
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}