"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Users, TrendingUp, DollarSign } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from "recharts"

interface GenderAnalyticsProps {
  campaignId: string
  adSetId?: string
  adId?: string
  dateRange?: {
    start: string
    end: string
  }
}

interface GenderData {
  gender: string
  impressions: number
  clicks: number
  spend: string
  conversions: number
  ctr: string
  cpc: string
  cpm: string
  impressionsPercentage: string
  clicksPercentage: string
  spendPercentage: string
  conversionsPercentage: string
}

const GENDER_COLORS = {
  male: "#3B82F6", // Blue
  female: "#EC4899", // Pink
  unknown: "#9CA3AF" // Gray
}

const GENDER_LABELS = {
  male: "Male",
  female: "Female",
  unknown: "Unknown"
}

export function GenderAnalytics({ campaignId, adSetId, adId, dateRange }: GenderAnalyticsProps) {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [data, setData] = useState<any>(null)
  const [metric, setMetric] = useState<"impressions" | "clicks" | "spend" | "conversions">("impressions")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchDemographics()
  }, [campaignId, adSetId, adId, dateRange])

  const fetchDemographics = async (sync = false) => {
    try {
      if (sync) {
        setSyncing(true)
      } else {
        setLoading(true)
      }
      setError("")

      const params = new URLSearchParams({
        metric,
        ...(dateRange?.start && { startDate: dateRange.start }),
        ...(dateRange?.end && { endDate: dateRange.end }),
        ...(adSetId && { adSetId }),
        ...(adId && { adId }),
        ...(sync && { sync: "true" })
      })

      const response = await fetch(`/api/campaigns/${campaignId}/demographics?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch demographics")
      }

      setData(result)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDemographics()}
            className="mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.demographics?.gender?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gender Analytics</CardTitle>
          <CardDescription>
            No gender data available. Click sync to fetch from Meta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => fetchDemographics(true)}
            disabled={syncing}
          >
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Gender Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const genderData = data.demographics.gender
  const pieData = genderData.map((g: GenderData) => ({
    name: GENDER_LABELS[g.gender as keyof typeof GENDER_LABELS] || g.gender,
    value: parseInt(g[`${metric}` === "spend" ? "spend" : metric].toString()),
    percentage: (g as any)[`${metric}Percentage`] || '0'
  }))

  // Prepare data for bar chart
  const barData = genderData.map((g: GenderData) => ({
    gender: GENDER_LABELS[g.gender as keyof typeof GENDER_LABELS] || g.gender,
    impressions: g.impressions,
    clicks: g.clicks,
    spend: parseFloat(g.spend),
    conversions: g.conversions,
    ctr: parseFloat(g.ctr),
    cpc: parseFloat(g.cpc),
    cpm: parseFloat(g.cpm)
  }))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {genderData.map((g: GenderData) => (
          <Card key={g.gender}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                {GENDER_LABELS[g.gender as keyof typeof GENDER_LABELS] || g.gender}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Impressions</span>
                <span className="text-sm font-medium">{g.impressions.toLocaleString()} ({g.impressionsPercentage}%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Clicks</span>
                <span className="text-sm font-medium">{g.clicks.toLocaleString()} ({g.clicksPercentage}%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Spend</span>
                <span className="text-sm font-medium">${g.spend} ({g.spendPercentage}%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">CTR</span>
                <span className="text-sm font-medium">{g.ctr}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">CPC</span>
                <span className="text-sm font-medium">${g.cpc}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Distribution by Gender</CardTitle>
            <div className="flex gap-2 mt-2">
              {["impressions", "clicks", "spend", "conversions"].map((m) => (
                <Button
                  key={m}
                  variant={metric === m ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMetric(m as typeof metric)}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percentage }) => `${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={GENDER_COLORS[genderData[index].gender as keyof typeof GENDER_COLORS] || "#8884d8"} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Performance by Gender</CardTitle>
            <CardDescription>CTR, CPC, and CPM comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gender" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="ctr" fill="#3B82F6" name="CTR (%)" />
                <Bar dataKey="cpc" fill="#EC4899" name="CPC ($)" />
                <Bar dataKey="cpm" fill="#10B981" name="CPM ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchDemographics(true)}
          disabled={syncing}
        >
          {syncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </>
          )}
        </Button>
      </div>
    </div>
  )
}