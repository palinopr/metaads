"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent 
} from "@/components/ui/chart"
import {
  Loader2,
  AlertCircle,
  Snowflake,
  Sun,
  Leaf,
  MapleLeaf,
  Calendar,
  TrendingUp,
  TrendingDown,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Star,
  AlertTriangle
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend
} from "recharts"

interface SeasonalDataPoint {
  date: string
  month: number // 1-12
  quarter: number // 1-4
  season: "Spring" | "Summer" | "Fall" | "Winter"
  year: number
  spend: number
  revenue: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  roas: number
  dayOfYear: number
  weekOfYear: number
}

interface SeasonalPatternsProps {
  data?: SeasonalDataPoint[]
  isLoading?: boolean
  error?: string | null
  onRefresh?: () => void
  dateRange?: string
  className?: string
  includeHolidays?: boolean
}

type SeasonalMetric = "spend" | "revenue" | "conversions" | "roas" | "ctr" | "impressions"
type SeasonalView = "monthly" | "quarterly" | "seasonal" | "yearly"
type ChartType = "line" | "bar" | "radar" | "pie"

const METRIC_CONFIG = {
  spend: { 
    label: "Spend", 
    color: "#ef4444", 
    format: (val: number) => `$${val.toLocaleString()}`,
    higherIsBetter: false
  },
  revenue: { 
    label: "Revenue", 
    color: "#22c55e", 
    format: (val: number) => `$${val.toLocaleString()}`,
    higherIsBetter: true
  },
  conversions: { 
    label: "Conversions", 
    color: "#3b82f6", 
    format: (val: number) => val.toLocaleString(),
    higherIsBetter: true
  },
  roas: { 
    label: "ROAS", 
    color: "#8b5cf6", 
    format: (val: number) => `${val.toFixed(2)}x`,
    higherIsBetter: true
  },
  ctr: { 
    label: "CTR", 
    color: "#06b6d4", 
    format: (val: number) => `${(val * 100).toFixed(2)}%`,
    higherIsBetter: true
  },
  impressions: { 
    label: "Impressions", 
    color: "#84cc16", 
    format: (val: number) => val.toLocaleString(),
    higherIsBetter: true
  }
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"]
const SEASONS = ["Spring", "Summer", "Fall", "Winter"]

const SEASON_ICONS = {
  Spring: Leaf,
  Summer: Sun,
  Fall: MapleLeaf,
  Winter: Snowflake
}

const SEASON_COLORS = {
  Spring: "#84cc16",
  Summer: "#f59e0b", 
  Fall: "#ea580c",
  Winter: "#06b6d4"
}

// Holiday periods that might affect performance
const HOLIDAY_PERIODS = [
  { name: "New Year", start: { month: 1, day: 1 }, end: { month: 1, day: 2 } },
  { name: "Valentine's Day", start: { month: 2, day: 14 }, end: { month: 2, day: 14 } },
  { name: "Easter", start: { month: 3, day: 20 }, end: { month: 4, day: 25 } }, // Approximate range
  { name: "Mother's Day", start: { month: 5, day: 8 }, end: { month: 5, day: 15 } }, // Second Sunday of May
  { name: "Memorial Day", start: { month: 5, day: 25 }, end: { month: 5, day: 31 } },
  { name: "Father's Day", start: { month: 6, day: 15 }, end: { month: 6, day: 21 } }, // Third Sunday of June
  { name: "Independence Day", start: { month: 7, day: 4 }, end: { month: 7, day: 4 } },
  { name: "Labor Day", start: { month: 9, day: 1 }, end: { month: 9, day: 7 } }, // First Monday
  { name: "Halloween", start: { month: 10, day: 31 }, end: { month: 10, day: 31 } },
  { name: "Thanksgiving", start: { month: 11, day: 22 }, end: { month: 11, day: 28 } },
  { name: "Black Friday", start: { month: 11, day: 29 }, end: { month: 11, day: 29 } },
  { name: "Cyber Monday", start: { month: 12, day: 2 }, end: { month: 12, day: 2 } },
  { name: "Christmas Season", start: { month: 12, day: 15 }, end: { month: 12, day: 31 } }
]

export function SeasonalPatterns({
  data = [],
  isLoading = false,
  error = null,
  onRefresh,
  dateRange = "Last 12 months",
  className,
  includeHolidays = true
}: SeasonalPatternsProps) {
  const [selectedMetric, setSelectedMetric] = useState<SeasonalMetric>("revenue")
  const [viewMode, setViewMode] = useState<SeasonalView>("monthly")
  const [chartType, setChartType] = useState<ChartType>("bar")
  const [showYearOverYear, setShowYearOverYear] = useState(false)

  // Process data based on view mode
  const processedData = useMemo(() => {
    if (!data.length) return []

    const aggregated: { [key: string]: any } = {}

    data.forEach(item => {
      let key: string
      let label: string
      
      switch (viewMode) {
        case "monthly":
          key = `${item.month}`
          label = MONTHS[item.month - 1]
          break
        case "quarterly":
          key = `${item.quarter}`
          label = QUARTERS[item.quarter - 1]
          break
        case "seasonal":
          key = item.season
          label = item.season
          break
        case "yearly":
          key = `${item.year}`
          label = `${item.year}`
          break
        default:
          key = `${item.month}`
          label = MONTHS[item.month - 1]
      }

      if (!aggregated[key]) {
        aggregated[key] = {
          key,
          label,
          spend: 0,
          revenue: 0,
          conversions: 0,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          cpc: 0,
          roas: 0,
          count: 0
        }
      }

      aggregated[key].spend += item.spend
      aggregated[key].revenue += item.revenue
      aggregated[key].conversions += item.conversions
      aggregated[key].impressions += item.impressions
      aggregated[key].clicks += item.clicks
      aggregated[key].ctr += item.ctr
      aggregated[key].cpc += item.cpc
      aggregated[key].roas += item.roas
      aggregated[key].count += 1
    })

    // Calculate averages for rates
    return Object.values(aggregated).map((item: any) => ({
      ...item,
      ctr: item.ctr / item.count,
      cpc: item.cpc / item.count,
      roas: item.roas / item.count
    })).sort((a: any, b: any) => {
      if (viewMode === "yearly") return parseInt(a.key) - parseInt(b.key)
      return parseInt(a.key) - parseInt(b.key)
    })
  }, [data, viewMode])

  // Calculate year-over-year comparison
  const yearOverYearData = useMemo(() => {
    if (!showYearOverYear || !data.length) return []

    const yearData: { [year: number]: { [period: string]: any } } = {}
    
    data.forEach(item => {
      if (!yearData[item.year]) yearData[item.year] = {}
      
      let periodKey: string
      switch (viewMode) {
        case "monthly":
          periodKey = MONTHS[item.month - 1]
          break
        case "quarterly":
          periodKey = QUARTERS[item.quarter - 1]
          break
        case "seasonal":
          periodKey = item.season
          break
        default:
          periodKey = MONTHS[item.month - 1]
      }

      if (!yearData[item.year][periodKey]) {
        yearData[item.year][periodKey] = {
          period: periodKey,
          spend: 0,
          revenue: 0,
          conversions: 0,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          cpc: 0,
          roas: 0,
          count: 0
        }
      }

      const period = yearData[item.year][periodKey]
      period.spend += item.spend
      period.revenue += item.revenue
      period.conversions += item.conversions
      period.impressions += item.impressions
      period.clicks += item.clicks
      period.ctr += item.ctr
      period.cpc += item.cpc
      period.roas += item.roas
      period.count += 1
    })

    // Convert to array format for charting
    const years = Object.keys(yearData).map(Number).sort()
    if (years.length < 2) return []

    const periods = new Set<string>()
    Object.values(yearData).forEach(yearObj => {
      Object.keys(yearObj).forEach(period => periods.add(period))
    })

    return Array.from(periods).map(period => {
      const result: any = { period }
      years.forEach(year => {
        const periodData = yearData[year][period]
        if (periodData) {
          result[`${year}`] = periodData[selectedMetric] / (periodData.count || 1)
        }
      })
      return result
    })
  }, [data, viewMode, selectedMetric, showYearOverYear])

  // Generate insights
  const insights = useMemo(() => {
    if (!processedData.length) return { peak: null, low: null, patterns: [] }

    const values = processedData.map((d: any) => d[selectedMetric])
    const config = METRIC_CONFIG[selectedMetric]
    
    let peakIndex = 0
    let lowIndex = 0
    
    if (config.higherIsBetter) {
      peakIndex = values.indexOf(Math.max(...values))
      lowIndex = values.indexOf(Math.min(...values))
    } else {
      peakIndex = values.indexOf(Math.min(...values))
      lowIndex = values.indexOf(Math.max(...values))
    }

    const peak = processedData[peakIndex]
    const low = processedData[lowIndex]

    // Generate patterns
    const patterns: string[] = []
    
    // Seasonal analysis
    if (viewMode === "seasonal") {
      const seasonData = processedData as any[]
      const bestSeason = seasonData.reduce((best, current) => 
        config.higherIsBetter ? 
          (current[selectedMetric] > best[selectedMetric] ? current : best) :
          (current[selectedMetric] < best[selectedMetric] ? current : best)
      )
      patterns.push(`${bestSeason.label} consistently shows the ${config.higherIsBetter ? "highest" : "lowest"} ${config.label.toLowerCase()}`)
    }

    // Monthly patterns
    if (viewMode === "monthly") {
      const monthData = processedData as any[]
      const q4Months = monthData.filter((d: any) => ["October", "November", "December"].includes(d.label))
      const q1Months = monthData.filter((d: any) => ["January", "February", "March"].includes(d.label))
      
      if (q4Months.length && q1Months.length) {
        const q4Avg = q4Months.reduce((sum: number, d: any) => sum + d[selectedMetric], 0) / q4Months.length
        const q1Avg = q1Months.reduce((sum: number, d: any) => sum + d[selectedMetric], 0) / q1Months.length
        
        if (Math.abs(q4Avg - q1Avg) / Math.max(q4Avg, q1Avg) > 0.3) {
          const stronger = q4Avg > q1Avg ? "Q4 (holiday season)" : "Q1 (new year)"
          patterns.push(`${stronger} shows significantly stronger performance than other periods`)
        }
      }
    }

    // Volatility analysis
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const volatility = Math.sqrt(variance) / mean

    if (volatility > 0.5) {
      patterns.push(`High seasonal volatility detected (${(volatility * 100).toFixed(1)}% coefficient of variation)`)
    }

    return {
      peak: peak ? `${peak.label}: ${config.format(peak[selectedMetric])}` : null,
      low: low ? `${low.label}: ${config.format(low[selectedMetric])}` : null,
      patterns,
      volatility: volatility * 100
    }
  }, [processedData, selectedMetric, viewMode])

  // Export functionality
  const handleExport = () => {
    if (!processedData.length) return

    const csvData = [
      ["Period", ...Object.keys(METRIC_CONFIG).map(k => METRIC_CONFIG[k as SeasonalMetric].label)],
      ...processedData.map((item: any) => [
        item.label,
        ...Object.keys(METRIC_CONFIG).map(metric => item[metric].toString())
      ])
    ]

    const csvContent = csvData.map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `seasonal-patterns-${selectedMetric}-${viewMode}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderChart = () => {
    const config = METRIC_CONFIG[selectedMetric]
    const dataToChart = showYearOverYear && yearOverYearData.length ? yearOverYearData : processedData
    
    if (chartType === "pie" && !showYearOverYear) {
      const total = processedData.reduce((sum: number, item: any) => sum + item[selectedMetric], 0)
      const pieData = processedData.map((item: any, index: number) => ({
        name: item.label,
        value: item[selectedMetric],
        percentage: ((item[selectedMetric] / total) * 100).toFixed(1),
        fill: viewMode === "seasonal" ? SEASON_COLORS[item.key as keyof typeof SEASON_COLORS] :
              `hsl(${(index * 360) / processedData.length}, 70%, 50%)`
      }))

      return (
        <ChartContainer config={{ [selectedMetric]: { label: config.label, color: config.color } }} className="h-[400px] w-full">
          <RechartsPieChart>
            <Tooltip 
              formatter={(value: any, name: any, props: any) => [
                `${config.format(value)} (${props.payload.percentage}%)`,
                props.payload.name
              ]}
            />
            <RechartsPieChart
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </RechartsPieChart>
          </RechartsPieChart>
        </ChartContainer>
      )
    }

    if (chartType === "radar" && !showYearOverYear) {
      const radarData = processedData.map((item: any) => ({
        subject: item.label,
        value: item[selectedMetric],
        fullMark: Math.max(...processedData.map((d: any) => d[selectedMetric]))
      }))

      return (
        <ChartContainer config={{ [selectedMetric]: { label: config.label, color: config.color } }} className="h-[400px] w-full">
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis />
            <Radar
              name={config.label}
              dataKey="value"
              stroke={config.color}
              fill={config.color}
              fillOpacity={0.3}
            />
            <Tooltip formatter={(value: any) => [config.format(value), config.label]} />
          </RadarChart>
        </ChartContainer>
      )
    }

    const chartConfig = showYearOverYear && yearOverYearData.length ? 
      Object.keys(yearOverYearData[0] || {})
        .filter(key => key !== "period")
        .reduce((acc, year) => ({
          ...acc,
          [year]: { label: year, color: `hsl(${(parseInt(year) - 2020) * 60}, 70%, 50%)` }
        }), {}) :
      { [selectedMetric]: { label: config.label, color: config.color } }

    if (chartType === "line") {
      return (
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <LineChart data={dataToChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey={showYearOverYear ? "period" : "label"} 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                if (config.format(0).includes("$") && value >= 1000) {
                  return `$${(value / 1000).toFixed(1)}k`
                }
                return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(1)
              }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {showYearOverYear ? (
              Object.keys(chartConfig).map(year => (
                <Line
                  key={year}
                  type="monotone"
                  dataKey={year}
                  stroke={chartConfig[year].color}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke={config.color}
                strokeWidth={3}
                dot={{ fill: config.color, strokeWidth: 2, r: 5 }}
              />
            )}
            {showYearOverYear && <ChartLegend content={<ChartLegendContent />} />}
          </LineChart>
        </ChartContainer>
      )
    }

    // Default to bar chart
    return (
      <ChartContainer config={chartConfig} className="h-[400px] w-full">
        <BarChart data={dataToChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey={showYearOverYear ? "period" : "label"} 
            className="text-xs"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              if (config.format(0).includes("$") && value >= 1000) {
                return `$${(value / 1000).toFixed(1)}k`
              }
              return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(1)
            }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          {showYearOverYear ? (
            Object.keys(chartConfig).map(year => (
              <Bar
                key={year}
                dataKey={year}
                fill={chartConfig[year].color}
                opacity={0.8}
                radius={[2, 2, 0, 0]}
              />
            ))
          ) : (
            <Bar
              dataKey={selectedMetric}
              fill={config.color}
              opacity={0.8}
              radius={[2, 2, 0, 0]}
            />
          )}
          {showYearOverYear && <ChartLegend content={<ChartLegendContent />} />}
        </BarChart>
      </ChartContainer>
    )
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8 min-h-[400px]">
          <Loader2 className="animate-spin h-8 w-8 text-primary mr-3" />
          <span className="text-muted-foreground">Loading seasonal patterns...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh} className="ml-2">
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!processedData.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Seasonal Patterns
          </CardTitle>
          <CardDescription>Analyze performance patterns across seasons and time periods</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No seasonal data available for analysis.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Seasonal Patterns
            </CardTitle>
            <CardDescription>
              Analyze {METRIC_CONFIG[selectedMetric].label.toLowerCase()} patterns by {viewMode} periods • {dateRange}
            </CardDescription>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <Select value={selectedMetric} onValueChange={(val) => setSelectedMetric(val as SeasonalMetric)}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METRIC_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={viewMode} onValueChange={(val) => setViewMode(val as SeasonalView)}>
              <SelectTrigger className="w-full sm:w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="seasonal">Seasonal</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={chartType} onValueChange={(val) => setChartType(val as ChartType)}>
              <SelectTrigger className="w-full sm:w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="radar">Radar</SelectItem>
                <SelectItem value="pie">Pie</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Performance Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {insights.peak && (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <Star className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Best Period</p>
                <p className="text-xs text-green-700 dark:text-green-300">{insights.peak}</p>
              </div>
            </div>
          )}
          
          {insights.low && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Lowest Period</p>
                <p className="text-xs text-red-700 dark:text-red-300">{insights.low}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Volatility</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {insights.volatility < 25 ? "Low" : insights.volatility < 50 ? "Medium" : "High"} ({insights.volatility.toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>

        {/* Chart Options */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-semibold capitalize">
            {viewMode} {METRIC_CONFIG[selectedMetric].label} Pattern
          </h3>
          
          {viewMode !== "yearly" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowYearOverYear(!showYearOverYear)}
              className="text-xs"
            >
              {showYearOverYear ? "Hide" : "Show"} Year-over-Year
            </Button>
          )}
        </div>

        {/* Chart */}
        {renderChart()}

        {/* Seasonal Icons for seasonal view */}
        {viewMode === "seasonal" && (
          <div className="flex justify-center gap-8">
            {SEASONS.map(season => {
              const Icon = SEASON_ICONS[season as keyof typeof SEASON_ICONS]
              const seasonData = processedData.find((d: any) => d.key === season)
              const value = seasonData ? seasonData[selectedMetric] : 0
              return (
                <div key={season} className="text-center">
                  <Icon 
                    className="h-8 w-8 mx-auto mb-2" 
                    style={{ color: SEASON_COLORS[season as keyof typeof SEASON_COLORS] }}
                  />
                  <p className="text-sm font-medium">{season}</p>
                  <p className="text-xs text-muted-foreground">
                    {METRIC_CONFIG[selectedMetric].format(value)}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Insights */}
        {insights.patterns.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Seasonal Insights
            </h4>
            <div className="space-y-2">
              {insights.patterns.map((pattern, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{pattern}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Holiday Impact Note */}
        {includeHolidays && viewMode === "monthly" && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Holiday Impact Analysis</h4>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Performance patterns may be significantly influenced by major holidays and shopping seasons. 
              Consider Black Friday/Cyber Monday (November), Christmas season (December), and other seasonal events 
              when interpreting these patterns.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}