"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
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
import { Users, MapPin, Smartphone, Monitor, TrendingUp, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency, formatNumberWithCommas } from "@/lib/utils"

interface DemographicEntry {
  conversions: number
  revenue: number
  spend?: number
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
}
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
  campaignName?: string
  accessToken: string
  datePreset?: string
}

export function DemographicAnalytics({ campaignId, campaignName, accessToken, datePreset }: DemographicAnalyticsProps) {
  const [demographicData, setDemographicData] = useState<DemographicData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDemographics = useCallback(async () => {
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
        body: JSON.stringify({ campaignId, accessToken, datePreset: datePreset || "last_30d" }),
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
  }, [campaignId, accessToken, datePreset])

  useEffect(() => {
    fetchDemographics()
  }, [fetchDemographics])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 min-h-[300px]">
        <Loader2 className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 text-blue-500" />
        <span className="ml-2 mt-3 text-gray-400 text-sm">Loading demographic insights...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-700/50">
        <CardHeader>
          <CardTitle className="text-red-400 text-base">Error Loading Demographics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-300 text-sm">{error}</p>
          <button onClick={fetchDemographics} className="mt-2 text-xs text-blue-400 hover:underline">
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
      <Card className="bg-gray-800/70 border-gray-700/80">
        <CardHeader>
          <CardTitle className="text-base">Demographic Insights</CardTitle>
        </CardHeader>
        <CardContent className="text-center p-6 text-gray-400">
          <Users className="mx-auto h-10 w-10 text-gray-500 mb-3" />
          <p className="text-sm">No demographic data available for this campaign and period.</p>
          <p className="text-xs mt-1">Try selecting a different date range or check back later.</p>
        </CardContent>
      </Card>
    )
  }

  const COLORS_GENDER = ["#3B82F6", "#EC4899", "#F59E0B"]
  const COLORS_DEVICE = ["#10B981", "#8B5CF6", "#EF4444", "#F97316"]

  const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800/90 p-2.5 border border-gray-700 rounded-md shadow-lg text-xs">
          <p className="label text-gray-300 font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="capitalize">
              {`${entry.name}: ${entry.name === "Revenue" || entry.name === "Spend" ? formatCurrency(entry.value) : formatNumberWithCommas(entry.value)} ${entry.name === "Conversions" ? "conv." : ""}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const PieCustomLabelContent = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.4
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    const percentage = (percent * 100).toFixed(0)

    if (Number.parseInt(percentage) < 8) return null

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="9px"
        fontWeight="medium"
      >
        {`${name}: ${percentage}%`}
      </text>
    )
  }

  const renderChartCard = (
    title: string,
    description: string,
    icon: React.ReactNode,
    chart: React.ReactNode,
    insights?: React.ReactNode,
  ) => (
    <Card className="bg-gray-800/70 border-gray-700/80">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm md:text-base flex items-center gap-1.5">
          {icon}
          {title}
        </CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-2 py-2 md:px-3 md:py-3">
        {chart}
        {insights && <div className="mt-2 text-xs text-gray-400 px-2">{insights}</div>}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4 md:space-y-6">
      {demographicData.age &&
        demographicData.age.length > 0 &&
        renderChartCard(
          "Age Distribution",
          "Conversions and Revenue by Age Group",
          <Users className="w-4 h-4 text-blue-400" />,
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={demographicData.age} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,114,128,0.2)" />
              <XAxis dataKey="range" stroke="#9CA3AF" fontSize={10} />
              <YAxis
                yAxisId="left"
                stroke="#818CF8"
                fontSize={9}
                tickFormatter={(val) => formatNumberWithCommas(val, 0)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#34D399"
                fontSize={9}
                tickFormatter={(val) => formatCurrency(val).replace(".00", "")}
              />
              <Tooltip content={<CustomTooltipContent />} />
              <Legend wrapperStyle={{ fontSize: "10px" }} iconSize={8} />
              <Bar
                yAxisId="left"
                dataKey="conversions"
                name="Conv."
                fill="#3B82F6"
                radius={[3, 3, 0, 0]}
                barSize={20}
              />
              <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#10B981" radius={[3, 3, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>,
          demographicData.age[0] && (
            <p>
              Top age group: <strong>{demographicData.age[0].range}</strong> ({demographicData.age[0].percentage}% of
              conv.)
            </p>
          ),
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {demographicData.gender &&
          demographicData.gender.length > 0 &&
          renderChartCard(
            "Gender Distribution",
            "Conversions by Gender",
            <Users className="w-4 h-4 text-pink-400" />,
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={demographicData.gender}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={<PieCustomLabelContent />}
                  outerRadius={70}
                  innerRadius={35}
                  fill="#8884d8"
                  dataKey="conversions"
                  nameKey="type"
                >
                  {demographicData.gender.map((entry, index) => (
                    <Cell key={`cell-gender-${index}`} fill={COLORS_GENDER[index % COLORS_GENDER.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipContent />} />
                <Legend
                  wrapperStyle={{ fontSize: "10px" }}
                  iconSize={8}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                />
              </PieChart>
            </ResponsiveContainer>,
          )}

        {demographicData.device &&
          demographicData.device.length > 0 &&
          renderChartCard(
            "Device Platform",
            "Conversions by Device",
            <Smartphone className="w-4 h-4 text-purple-400" />,
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={demographicData.device}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={<PieCustomLabelContent />}
                  outerRadius={70}
                  innerRadius={35}
                  fill="#8884d8"
                  dataKey="conversions"
                  nameKey="platform"
                >
                  {demographicData.device.map((entry, index) => (
                    <Cell key={`cell-device-${index}`} fill={COLORS_DEVICE[index % COLORS_DEVICE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipContent />} />
                <Legend
                  wrapperStyle={{ fontSize: "10px" }}
                  iconSize={8}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                />
              </PieChart>
            </ResponsiveContainer>,
          )}
      </div>

      {demographicData.region &&
        demographicData.region.length > 0 &&
        renderChartCard(
          "Top Performing Cities",
          "Top 5 cities by revenue",
          <MapPin className="w-4 h-4 text-green-400" />,
          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="text-left py-1.5 px-2">City</th>
                  <th className="text-left py-1.5 px-2 hidden sm:table-cell">State</th>
                  <th className="text-right py-1.5 px-2">Conv.</th>
                  <th className="text-right py-1.5 px-2">Revenue</th>
                  <th className="text-right py-1.5 px-2">ROAS</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {demographicData.region.slice(0, 5).map((city, index) => (
                  <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-1.5 px-2 font-medium truncate max-w-[100px] sm:max-w-xs" title={city.city}>
                      {city.city}
                    </td>
                    <td className="py-1.5 px-2 hidden sm:table-cell">{city.state}</td>
                    <td className="py-1.5 px-2 text-right">{formatNumberWithCommas(city.conversions)}</td>
                    <td className="py-1.5 px-2 text-right text-green-400">{formatCurrency(city.revenue)}</td>
                    <td className="py-1.5 px-2 text-right">
                      <span
                        className={`font-medium ${city.roas > 5 ? "text-green-300" : city.roas > 2 ? "text-yellow-300" : "text-red-300"}`}
                      >
                        {city.roas.toFixed(2)}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
          demographicData.region[0] && (
            <p>
              Top city: <strong>{demographicData.region[0].city}</strong> ({demographicData.region[0].roas.toFixed(2)}x
              ROAS)
            </p>
          ),
        )}

      {(demographicData.age?.[0] || demographicData.region?.[0] || demographicData.device?.[0]) && (
        <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700/50">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm md:text-base flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-yellow-400" /> Key Demographic Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-1.5 text-xs">
            {demographicData.age[0] && (
              <div className="flex items-start gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-gray-200">Primary Age: </span>
                  <span className="text-gray-300">
                    {demographicData.age[0].range} ({demographicData.age[0].percentage}% of conv.,{" "}
                    {formatCurrency(demographicData.age[0].revenue)} rev)
                  </span>
                </div>
              </div>
            )}
            {demographicData.region[0] && (
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-gray-200">Top City: </span>
                  <span className="text-gray-300">
                    {demographicData.region[0].city}
                    {demographicData.region[0].state ? `, ${demographicData.region[0].state}` : ""} (
                    {demographicData.region[0].roas.toFixed(2)}x ROAS,{" "}
                    {formatNumberWithCommas(demographicData.region[0].conversions)} conv.)
                  </span>
                </div>
              </div>
            )}
            {demographicData.device[0] && (
              <div className="flex items-start gap-1.5">
                {demographicData.device[0].platform.toLowerCase().includes("mobile") ? (
                  <Smartphone className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                ) : (
                  <Monitor className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                )}
                <div>
                  <span className="font-medium text-gray-200">Primary Platform: </span>
                  <span className="text-gray-300">
                    {demographicData.device[0].platform} ({demographicData.device[0].percentage}% of conv.)
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
