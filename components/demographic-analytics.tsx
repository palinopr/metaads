"use client"

import React from "react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Users, MapPin, Smartphone, Monitor, TrendingUp, Loader2 } from "lucide-react" // Added Smartphone, Monitor, Loader2
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card" // Added Card components
import { formatCurrency, formatNumberWithCommas } from "@/lib/utils" // Assuming these exist

interface DemographicEntry {
  conversions: number
  revenue: number
  spend?: number // Optional, as not all breakdowns might have it directly
  percentage: number
}
interface AgeEntry extends DemographicEntry {
  range: string
}
interface GenderEntry extends DemographicEntry {
  type: string
}
interface RegionEntry extends DemographicEntry {
  city: string
  state: string
  roas: number
  spend: number
} // Ensure spend is here
interface DeviceEntry extends DemographicEntry {
  platform: string
}

interface DemographicData {
  age: AgeEntry[]
  gender: GenderEntry[]
  region: RegionEntry[]
  device: DeviceEntry[]
}

interface DemographicAnalyticsProps {
  campaignId: string
  campaignName?: string // Optional, as not used in this component directly
  accessToken: string
  datePreset: string // Pass datePreset for API call
}

export function DemographicAnalytics({ campaignId, accessToken, datePreset }: DemographicAnalyticsProps) {
  const [demographicData, setDemographicData] = React.useState<DemographicData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true) // Start with loading true
  const [error, setError] = React.useState<string | null>(null)

  const fetchDemographics = React.useCallback(async () => {
    if (!campaignId || !accessToken) {
      setIsLoading(false)
      setError("Campaign ID or Access Token is missing.")
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/meta/demographics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, accessToken, datePreset }), // Pass datePreset
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch demographics")
      }

      const data = await response.json()
      setDemographicData(data)
    } catch (err: any) {
      console.error("Error fetching demographics:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [campaignId, accessToken, datePreset]) // Add datePreset to dependencies

  React.useEffect(() => {
    fetchDemographics()
  }, [fetchDemographics]) // fetchDemographics is now memoized

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 text-blue-500" />
        <span className="ml-3 mt-4 text-gray-400">Loading demographic insights...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-700">
        <CardHeader>
          <CardTitle className="text-red-400">Error Loading Demographics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-300">{error}</p>
          <button onClick={fetchDemographics} className="mt-2 text-sm text-blue-400 hover:underline">
            Try again
          </button>
        </CardContent>
      </Card>
    )
  }

  if (
    !demographicData ||
    (!demographicData.age?.length &&
      !demographicData.gender?.length &&
      !demographicData.region?.length &&
      !demographicData.device?.length)
  ) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Demographic Insights</CardTitle>
        </CardHeader>
        <CardContent className="text-center p-8 text-gray-400">
          <Users className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <p>No demographic data available for this campaign and period.</p>
          <p className="text-xs mt-1">Try selecting a different date range or check back later.</p>
        </CardContent>
      </Card>
    )
  }

  const COLORS_GENDER = ["#3B82F6", "#EC4899", "#F59E0B"] // Blue, Pink, Orange for unknown
  const COLORS_DEVICE = ["#10B981", "#8B5CF6", "#EF4444"] // Green, Purple, Red

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 border border-gray-700 rounded-md shadow-lg text-sm">
          <p className="label text-gray-300">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.name === "Revenue" || entry.name === "Spend" ? formatCurrency(entry.value) : formatNumberWithCommas(entry.value)} ${entry.name === "Conversions" ? "conversions" : ""}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const PieCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value, fill }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    const percentage = (percent * 100).toFixed(0)

    if (Number.parseInt(percentage) < 5) return null // Don't render label if too small

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize="10px">
        {`${name}: ${percentage}%`}
      </text>
    )
  }

  return (
    <div className="space-y-6">
      {/* Age Distribution */}
      {demographicData.age && demographicData.age.length > 0 && (
        <Card className="bg-gray-800/70 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> Age Distribution
            </CardTitle>
            <CardDescription>Conversions and Revenue by Age Group</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demographicData.age} margin={{ top: 5, right: 0, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="range" stroke="#9CA3AF" fontSize={12} />
                <YAxis
                  yAxisId="left"
                  stroke="#818CF8"
                  fontSize={10}
                  tickFormatter={(val) => formatNumberWithCommas(val)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#34D399"
                  fontSize={10}
                  tickFormatter={(val) => formatCurrency(val)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar yAxisId="left" dataKey="conversions" name="Conversions" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {demographicData.age.slice(0, 3).map((age) => (
                <div key={age.range} className="bg-gray-700/50 rounded p-2.5">
                  <div className="font-medium text-gray-200">{age.range}</div>
                  <div className="text-gray-400">{age.percentage}% of conversions</div>
                  <div className="text-green-400">{formatCurrency(age.revenue)} revenue</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender Split */}
        {demographicData.gender && demographicData.gender.length > 0 && (
          <Card className="bg-gray-800/70 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">Gender Distribution</CardTitle>
              <CardDescription>Conversions by Gender</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={demographicData.gender}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={<PieCustomLabel />}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="conversions"
                    nameKey="type"
                  >
                    {demographicData.gender.map((entry, index) => (
                      <Cell key={`cell-gender-${index}`} fill={COLORS_GENDER[index % COLORS_GENDER.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Device Platform */}
        {demographicData.device && demographicData.device.length > 0 && (
          <Card className="bg-gray-800/70 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">Device Platform</CardTitle>
              <CardDescription>Conversions by Device</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={demographicData.device}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={<PieCustomLabel />}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="conversions"
                    nameKey="platform"
                  >
                    {demographicData.device.map((entry, index) => (
                      <Cell
                        key={`cell-device-${index}`}
                        fill={COLORS_DEVICE[index % COLORS_DEVICE.length]}
                        className={entry.platform.toLowerCase() === "mobile" ? "text-green-400" : "text-purple-400"}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Cities/Regions */}
      {demographicData.region && demographicData.region.length > 0 && (
        <Card className="bg-gray-800/70 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-400" /> Top Performing Cities
            </CardTitle>
            <CardDescription>Top 10 cities by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="text-left py-2 px-2">City</th>
                    <th className="text-left py-2 px-2 hidden sm:table-cell">State</th>
                    <th className="text-right py-2 px-2">Conversions</th>
                    <th className="text-right py-2 px-2">Revenue</th>
                    <th className="text-right py-2 px-2 hidden sm:table-cell">Spend</th>
                    <th className="text-right py-2 px-2">ROAS</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {demographicData.region.slice(0, 10).map((city, index) => (
                    <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-2 px-2 font-medium">{city.city}</td>
                      <td className="py-2 px-2 hidden sm:table-cell">{city.state}</td>
                      <td className="py-2 px-2 text-right">{formatNumberWithCommas(city.conversions)}</td>
                      <td className="py-2 px-2 text-right text-green-400">{formatCurrency(city.revenue)}</td>
                      <td className="py-2 px-2 text-right hidden sm:table-cell">{formatCurrency(city.spend)}</td>
                      <td className="py-2 px-2 text-right">
                        <span
                          className={`font-medium ${city.roas > 10 ? "text-green-300" : city.roas > 3 ? "text-yellow-300" : "text-red-300"}`}
                        >
                          {city.roas.toFixed(2)}x
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights Summary Card */}
      {demographicData.age?.[0] && demographicData.region?.[0] && demographicData.device?.[0] && (
        <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-400" /> Key Demographic Insights
            </CardTitle>
            <CardDescription>Summary of top performing segments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {demographicData.age[0] && (
              <div className="flex items-start gap-3 p-2 bg-gray-800/30 rounded">
                <Users className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-200">Primary Age Group: </span>
                  <span className="text-gray-300">
                    {demographicData.age[0].range} ({demographicData.age[0].percentage}% of conversions,{" "}
                    {formatCurrency(demographicData.age[0].revenue)} revenue)
                  </span>
                </div>
              </div>
            )}

            {demographicData.region[0] && (
              <div className="flex items-start gap-3 p-2 bg-gray-800/30 rounded">
                <MapPin className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-200">Top City: </span>
                  <span className="text-gray-300">
                    {demographicData.region[0].city}
                    {demographicData.region[0].state ? `, ${demographicData.region[0].state}` : ""} (
                    {demographicData.region[0].roas.toFixed(2)}x ROAS,{" "}
                    {formatNumberWithCommas(demographicData.region[0].conversions)} conversions)
                  </span>
                </div>
              </div>
            )}

            {demographicData.device[0] && (
              <div className="flex items-start gap-3 p-2 bg-gray-800/30 rounded">
                {demographicData.device[0].platform.toLowerCase() === "mobile" ? (
                  <Smartphone className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <Monitor className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <span className="font-medium text-gray-200">Primary Platform: </span>
                  <span className="text-gray-300">
                    {demographicData.device[0].platform} ({demographicData.device[0].percentage}% of conversions)
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
