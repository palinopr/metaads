"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Calendar, TrendingUp, DollarSign } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"

interface AgeAnalyticsProps {
  campaignId: string
  adSetId?: string
  adId?: string
  dateRange?: {
    start: string
    end: string
  }
}

interface AgeData {
  ageRange: string
  impressions: number
  clicks: number
  spend: string
  conversions: number
  ctr: string
  conversionRate: string
}

const AGE_COLORS = {
  "18-24": "#3B82F6", // Blue
  "25-34": "#8B5CF6", // Purple
  "35-44": "#EC4899", // Pink
  "45-54": "#F59E0B", // Amber
  "55-64": "#10B981", // Emerald
  "65+": "#6B7280",   // Gray
  "unknown": "#9CA3AF" // Light Gray
}

const AGE_LABELS = {
  "18-24": "18-24 years",
  "25-34": "25-34 years",
  "35-44": "35-44 years",
  "45-54": "45-54 years",
  "55-64": "55-64 years",
  "65+": "65+ years",
  "unknown": "Unknown"
}

export function AgeAnalytics({ campaignId, adSetId, adId, dateRange }: AgeAnalyticsProps) {
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

  if (!data || !data.demographics?.age?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Age Analytics</CardTitle>
          <CardDescription>
            No age data available. Click sync to fetch from Meta.
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
                Sync Age Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const ageData = data.demographics.age.filter((a: AgeData) => a.ageRange !== 'unknown')
  
  // Prepare data for charts
  const barData = ageData.map((a: AgeData) => ({
    age: AGE_LABELS[a.ageRange as keyof typeof AGE_LABELS] || a.ageRange,
    impressions: a.impressions,
    clicks: a.clicks,
    spend: parseFloat(a.spend),
    conversions: a.conversions,
    ctr: parseFloat(a.ctr),
    conversionRate: parseFloat(a.conversionRate)
  }))

  const pieData = ageData.map((a: AgeData) => ({
    name: AGE_LABELS[a.ageRange as keyof typeof AGE_LABELS] || a.ageRange,
    value: parseInt(a[metric === "spend" ? "spend" : metric].toString()),
    percentage: ((parseInt(a[metric === "spend" ? "spend" : metric].toString()) / 
      ageData.reduce((sum: number, item: any) => sum + parseInt(item[metric === "spend" ? "spend" : metric].toString()), 0)) * 100).toFixed(1)
  }))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {ageData.map((a: AgeData) => (
          <Card key={a.ageRange}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {AGE_LABELS[a.ageRange as keyof typeof AGE_LABELS] || a.ageRange}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">{a.impressions.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>CTR: {a.ctr}%</div>
                <div>Spend: ${a.spend}</div>
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
            <CardTitle className="text-sm font-medium">Distribution by Age</CardTitle>
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
                      fill={AGE_COLORS[ageData[index].ageRange as keyof typeof AGE_COLORS] || "#8884d8"} 
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
            <CardTitle className="text-sm font-medium">Performance by Age Group</CardTitle>
            <CardDescription>CTR and Conversion Rate comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" angle={-45} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="ctr" fill="#3B82F6" name="CTR (%)" />
                <Bar dataKey="conversionRate" fill="#10B981" name="Conversion Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cost Efficiency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Cost Efficiency by Age Group</CardTitle>
          <CardDescription>Spend distribution and CPC across age groups</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="spend" stroke="#EC4899" name="Spend ($)" />
              <Line type="monotone" dataKey="clicks" stroke="#3B82F6" name="Clicks" yAxisId="right" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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