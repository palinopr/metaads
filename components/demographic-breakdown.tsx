"use client"

import React, { useState, useMemo, useCallback } from "react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts"
import {
  Users,
  MapPin,
  Smartphone,
  Monitor,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Filter,
  Download,
  Eye,
  BarChart3,
  PieChart as PieChartIcon,
  Table as TableIcon,
  MoreVertical,
  Share2,
  RefreshCw,
  Calendar,
  Target,
  DollarSign,
  Activity,
  Globe,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Types
interface DemographicMetrics {
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  spend: number
  ctr: number
  cpc: number
  cpm: number
  roas: number
  conversionRate: number
  percentage: number
}

interface AgeGroupData extends DemographicMetrics {
  ageRange: string
  segment: "youth" | "millennial" | "genx" | "boomer"
}

interface GenderData extends DemographicMetrics {
  gender: "male" | "female" | "unknown"
}

interface DeviceData extends DemographicMetrics {
  device: "mobile" | "desktop" | "tablet"
  platform: string
  osVersion?: string
}

interface GeographicData extends DemographicMetrics {
  country: string
  region: string
  city: string
  countryCode: string
  latitude?: number
  longitude?: number
  timezone?: string
}

interface DemographicBreakdownData {
  age: AgeGroupData[]
  gender: GenderData[]
  device: DeviceData[]
  geographic: GeographicData[]
  summary: {
    totalImpressions: number
    totalClicks: number
    totalConversions: number
    totalRevenue: number
    totalSpend: number
    averageCTR: number
    averageROAS: number
    topPerformingSegment: string
  }
}

interface ComparisonData {
  current: DemographicBreakdownData
  previous?: DemographicBreakdownData
  benchmark?: DemographicBreakdownData
}

// Props
interface DemographicBreakdownProps {
  data: ComparisonData
  loading?: boolean
  onRefresh?: () => void
  onExport?: (format: "csv" | "pdf" | "excel") => void
  allowComparison?: boolean
  showAdvancedMetrics?: boolean
  className?: string
}

// Utility functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatNumber = (value: number, decimals = 0): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`
}

const getPerformanceColor = (value: number, benchmark: number): string => {
  const ratio = value / benchmark
  if (ratio >= 1.2) return "text-green-500"
  if (ratio >= 0.8) return "text-yellow-500"
  return "text-red-500"
}

const getPerformanceIcon = (current: number, previous?: number) => {
  if (!previous) return null
  const change = ((current - previous) / previous) * 100
  if (change > 5) return <TrendingUp className="w-4 h-4 text-green-500" />
  if (change < -5) return <TrendingDown className="w-4 h-4 text-red-500" />
  return <Activity className="w-4 h-4 text-yellow-500" />
}

// Chart colors
const COLORS = {
  age: ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#EF4444"],
  gender: ["#3B82F6", "#EC4899", "#6B7280"],
  device: ["#10B981", "#8B5CF6", "#F59E0B"],
  geographic: ["#3B82F6", "#10B981", "#EC4899", "#F59E0B", "#8B5CF6", "#EF4444"],
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm p-3 border rounded-lg shadow-lg">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="capitalize">{entry.dataKey}:</span>
            <span className="font-medium">
              {entry.dataKey.includes("revenue") || entry.dataKey.includes("spend")
                ? formatCurrency(entry.value)
                : entry.dataKey.includes("rate") || entry.dataKey.includes("ctr") || entry.dataKey.includes("roas")
                ? `${entry.value.toFixed(2)}${entry.dataKey.includes("rate") || entry.dataKey.includes("ctr") ? "%" : "x"}`
                : formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// Main component
export function DemographicBreakdown({
  data,
  loading = false,
  onRefresh,
  onExport,
  allowComparison = true,
  showAdvancedMetrics = false,
  className,
}: DemographicBreakdownProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "asc" | "desc"
  } | null>(null)
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart")
  const [selectedMetric, setSelectedMetric] = useState("revenue")
  const [comparisonMode, setComparisonMode] = useState<"previous" | "benchmark" | "none">("none")

  // Sort function
  const handleSort = useCallback((key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }))
  }, [])

  // Sorted data
  const getSortedData = useCallback((dataArray: any[]) => {
    if (!sortConfig) return dataArray

    return [...dataArray].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })
  }, [sortConfig])

  // Metrics for overview cards
  const overviewMetrics = useMemo(() => {
    const current = data.current.summary
    const previous = data.previous?.summary

    return [
      {
        title: "Total Revenue",
        value: formatCurrency(current.totalRevenue),
        change: previous ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100 : 0,
        icon: <DollarSign className="w-4 h-4" />,
        color: "text-green-500",
      },
      {
        title: "Conversions",
        value: formatNumber(current.totalConversions),
        change: previous ? ((current.totalConversions - previous.totalConversions) / previous.totalConversions) * 100 : 0,
        icon: <Target className="w-4 h-4" />,
        color: "text-blue-500",
      },
      {
        title: "Average ROAS",
        value: `${current.averageROAS.toFixed(2)}x`,
        change: previous ? ((current.averageROAS - previous.averageROAS) / previous.averageROAS) * 100 : 0,
        icon: <TrendingUp className="w-4 h-4" />,
        color: "text-purple-500",
      },
      {
        title: "Average CTR",
        value: formatPercentage(current.averageCTR),
        change: previous ? ((current.averageCTR - previous.averageCTR) / previous.averageCTR) * 100 : 0,
        icon: <Activity className="w-4 h-4" />,
        color: "text-orange-500",
      },
    ]
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading demographic data...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Demographic Breakdown</h2>
          <p className="text-muted-foreground">
            Comprehensive analysis of audience demographics and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {allowComparison && (
            <Select value={comparisonMode} onValueChange={(value: any) => setComparisonMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Comparison</SelectItem>
                {data.previous && <SelectItem value="previous">vs Previous</SelectItem>}
                {data.benchmark && <SelectItem value="benchmark">vs Benchmark</SelectItem>}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          {onExport && (
            <Select onValueChange={(format: any) => onExport(format)}>
              <SelectTrigger className="w-24">
                <Download className="w-4 h-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <div className={metric.color}>{metric.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change !== 0 && (
                <div className="flex items-center text-xs text-muted-foreground">
                  {getPerformanceIcon(metric.change, 0)}
                  <span className="ml-1">
                    {metric.change > 0 ? "+" : ""}{metric.change.toFixed(1)}% from previous period
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="age">Age Groups</TabsTrigger>
            <TabsTrigger value="gender">Gender</TabsTrigger>
            <TabsTrigger value="device">Device</TabsTrigger>
            <TabsTrigger value="geographic">Geographic</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="conversions">Conversions</SelectItem>
                <SelectItem value="clicks">Clicks</SelectItem>
                <SelectItem value="impressions">Impressions</SelectItem>
                <SelectItem value="roas">ROAS</SelectItem>
                <SelectItem value="ctr">CTR</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "chart" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("chart")}
                className="rounded-none border-none"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="rounded-none border-none"
              >
                <TableIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Age Distribution Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Age Distribution Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.current.age}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey={selectedMetric}
                      nameKey="ageRange"
                    >
                      {data.current.age.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.age[index % COLORS.age.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Device Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Device Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.current.device}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="device" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey={selectedMetric} fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Geographic Heatmap */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Top Performing Regions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.current.geographic.slice(0, 6).map((location, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{location.city}</div>
                        <div className="text-sm text-muted-foreground">{location.country}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {selectedMetric === "revenue" && formatCurrency(location[selectedMetric])}
                          {selectedMetric === "roas" && `${location[selectedMetric].toFixed(2)}x`}
                          {!["revenue", "roas"].includes(selectedMetric) && formatNumber(location[selectedMetric])}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatPercentage(location.percentage)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Age Groups Tab */}
        <TabsContent value="age" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Age Group Performance
              </CardTitle>
              <CardDescription>
                Performance metrics across different age demographics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viewMode === "chart" ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={getSortedData(data.current.age)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ageRange" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="conversions" fill="#3B82F6" name="Conversions" />
                    <Line yAxisId="right" type="monotone" dataKey="roas" stroke="#10B981" name="ROAS" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort("ageRange")}
                      >
                        Age Range <ArrowUpDown className="w-4 h-4 inline ml-1" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort("impressions")}
                      >
                        Impressions <ArrowUpDown className="w-4 h-4 inline ml-1" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort("conversions")}
                      >
                        Conversions <ArrowUpDown className="w-4 h-4 inline ml-1" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort("revenue")}
                      >
                        Revenue <ArrowUpDown className="w-4 h-4 inline ml-1" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort("roas")}
                      >
                        ROAS <ArrowUpDown className="w-4 h-4 inline ml-1" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort("percentage")}
                      >
                        Share <ArrowUpDown className="w-4 h-4 inline ml-1" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getSortedData(data.current.age).map((ageGroup, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{ageGroup.ageRange}</TableCell>
                        <TableCell className="text-right">{formatNumber(ageGroup.impressions)}</TableCell>
                        <TableCell className="text-right">{formatNumber(ageGroup.conversions)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(ageGroup.revenue)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={ageGroup.roas > 3 ? "default" : ageGroup.roas > 1.5 ? "secondary" : "destructive"}>
                            {ageGroup.roas.toFixed(2)}x
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatPercentage(ageGroup.percentage)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gender Tab */}
        <TabsContent value="gender" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gender Performance Analysis
              </CardTitle>
              <CardDescription>
                Performance metrics by gender demographics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viewMode === "chart" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.current.gender}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey={selectedMetric}
                        nameKey="gender"
                        label
                      >
                        {data.current.gender.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS.gender[index % COLORS.gender.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.current.gender}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="gender" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" fill="#EC4899" name="Revenue" />
                      <Bar dataKey="conversions" fill="#3B82F6" name="Conversions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gender</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">ROAS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.current.gender.map((genderData, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium capitalize">{genderData.gender}</TableCell>
                        <TableCell className="text-right">{formatNumber(genderData.impressions)}</TableCell>
                        <TableCell className="text-right">{formatNumber(genderData.clicks)}</TableCell>
                        <TableCell className="text-right">{formatNumber(genderData.conversions)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(genderData.revenue)}</TableCell>
                        <TableCell className="text-right">{formatPercentage(genderData.ctr)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={genderData.roas > 3 ? "default" : genderData.roas > 1.5 ? "secondary" : "destructive"}>
                            {genderData.roas.toFixed(2)}x
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Device Tab */}
        <TabsContent value="device" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Device & Platform Analysis
              </CardTitle>
              <CardDescription>
                Performance across different devices and platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viewMode === "chart" ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={data.current.device}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="device" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="conversions" fill="#10B981" name="Conversions" />
                    <Bar yAxisId="left" dataKey="clicks" fill="#3B82F6" name="Clicks" />
                    <Line yAxisId="right" type="monotone" dataKey="ctr" stroke="#F59E0B" name="CTR %" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">ROAS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.current.device.map((deviceData, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {deviceData.device === "mobile" ? (
                              <Smartphone className="w-4 h-4" />
                            ) : (
                              <Monitor className="w-4 h-4" />
                            )}
                            <span className="capitalize">{deviceData.device}</span>
                          </div>
                        </TableCell>
                        <TableCell>{deviceData.platform}</TableCell>
                        <TableCell className="text-right">{formatNumber(deviceData.impressions)}</TableCell>
                        <TableCell className="text-right">{formatNumber(deviceData.clicks)}</TableCell>
                        <TableCell className="text-right">{formatNumber(deviceData.conversions)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(deviceData.revenue)}</TableCell>
                        <TableCell className="text-right">{formatPercentage(deviceData.ctr)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={deviceData.roas > 3 ? "default" : deviceData.roas > 1.5 ? "secondary" : "destructive"}>
                            {deviceData.roas.toFixed(2)}x
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Geographic Performance
              </CardTitle>
              <CardDescription>
                Performance analysis by geographic location
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viewMode === "chart" ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data.current.geographic.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="city" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey={selectedMetric} fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort("city")}
                      >
                        Location <ArrowUpDown className="w-4 h-4 inline ml-1" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort("impressions")}
                      >
                        Impressions <ArrowUpDown className="w-4 h-4 inline ml-1" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort("conversions")}
                      >
                        Conversions <ArrowUpDown className="w-4 h-4 inline ml-1" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort("revenue")}
                      >
                        Revenue <ArrowUpDown className="w-4 h-4 inline ml-1" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort("roas")}
                      >
                        ROAS <ArrowUpDown className="w-4 h-4 inline ml-1" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort("percentage")}
                      >
                        Share <ArrowUpDown className="w-4 h-4 inline ml-1" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getSortedData(data.current.geographic).slice(0, 20).map((location, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{location.city}</div>
                            <div className="text-sm text-muted-foreground">
                              {location.region}, {location.country}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(location.impressions)}</TableCell>
                        <TableCell className="text-right">{formatNumber(location.conversions)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(location.revenue)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={location.roas > 3 ? "default" : location.roas > 1.5 ? "secondary" : "destructive"}>
                            {location.roas.toFixed(2)}x
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatPercentage(location.percentage)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DemographicBreakdown