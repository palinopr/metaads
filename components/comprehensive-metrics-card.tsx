"use client"

import * as React from "react"
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Target, 
  DollarSign, 
  Users, 
  MousePointer, 
  Heart,
  Share2,
  MessageCircle,
  Star,
  Gauge,
  PieChart,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Minus,
  Activity,
  MapPin,
  Calendar,
  Smartphone,
  Monitor,
  Globe,
  Clock,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from "recharts"

// Types
interface MetricItem {
  label: string
  value: string | number
  change?: number
  changeType?: "increase" | "decrease" | "stable"
  trend?: number[]
  target?: number
  status?: "excellent" | "good" | "warning" | "poor"
  icon?: React.ComponentType<{ className?: string }>
  description?: string
}

interface MetricsSection {
  title: string
  icon: React.ComponentType<{ className?: string }>
  metrics: MetricItem[]
  color: string
}

interface ComprehensiveMetricsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: Partial<Record<string, MetricsSection>>
  isExpanded?: boolean
  onToggleExpand?: () => void
  variant?: "default" | "compact" | "detailed"
}

// Default data structure
const defaultMetricsData: Record<string, MetricsSection> = {
  performance: {
    title: "Performance",
    icon: Activity,
    color: "rgb(59, 130, 246)", // blue-500
    metrics: [
      {
        label: "Impressions",
        value: "2.4M",
        change: 12.5,
        changeType: "increase",
        trend: [45, 52, 48, 61, 58, 67, 72, 69, 75, 78, 82, 85],
        target: 90,
        status: "good",
        icon: Eye,
        description: "Total ad impressions delivered"
      },
      {
        label: "Reach",
        value: "1.8M",
        change: 8.3,
        changeType: "increase",
        trend: [42, 48, 45, 55, 52, 60, 65, 62, 68, 71, 74, 77],
        target: 85,
        status: "good",
        icon: Users,
        description: "Unique users reached"
      },
      {
        label: "CTR",
        value: "3.2%",
        change: -2.1,
        changeType: "decrease",
        trend: [3.8, 3.6, 3.4, 3.2, 3.0, 2.9, 3.1, 3.3, 3.2, 3.4, 3.3, 3.2],
        target: 4.0,
        status: "warning",
        icon: MousePointer,
        description: "Click-through rate"
      },
      {
        label: "CPM",
        value: "$4.25",
        change: 15.2,
        changeType: "increase",
        trend: [3.2, 3.4, 3.8, 4.1, 4.3, 4.5, 4.2, 4.0, 4.1, 4.3, 4.2, 4.25],
        status: "warning",
        icon: DollarSign,
        description: "Cost per thousand impressions"
      }
    ]
  },
  engagement: {
    title: "Engagement",
    icon: Heart,
    color: "rgb(236, 72, 153)", // pink-500
    metrics: [
      {
        label: "Likes",
        value: "24.5K",
        change: 18.7,
        changeType: "increase",
        trend: [180, 195, 210, 205, 220, 235, 245, 240, 255, 260, 245, 245],
        status: "excellent",
        icon: Heart,
        description: "Total likes received"
      },
      {
        label: "Comments",
        value: "3.2K",
        change: 22.3,
        changeType: "increase",
        trend: [28, 32, 35, 38, 34, 40, 45, 42, 48, 52, 50, 32],
        status: "excellent",
        icon: MessageCircle,
        description: "Comments and replies"
      },
      {
        label: "Shares",
        value: "8.7K",
        change: 5.8,
        changeType: "increase",
        trend: [78, 82, 85, 83, 88, 92, 95, 93, 98, 102, 105, 87],
        status: "good",
        icon: Share2,
        description: "Content shares"
      },
      {
        label: "Saves",
        value: "12.1K",
        change: 14.2,
        changeType: "increase",
        trend: [95, 102, 108, 105, 115, 122, 128, 125, 135, 140, 138, 121],
        status: "excellent",
        icon: Star,
        description: "Content saves/bookmarks"
      }
    ]
  },
  quality: {
    title: "Quality",
    icon: Gauge,
    color: "rgb(34, 197, 94)", // green-500
    metrics: [
      {
        label: "Quality Score",
        value: "8.2/10",
        change: 3.5,
        changeType: "increase",
        trend: [7.8, 7.9, 8.0, 7.9, 8.1, 8.3, 8.4, 8.2, 8.3, 8.4, 8.3, 8.2],
        target: 9.0,
        status: "good",
        icon: Star,
        description: "Overall ad quality score"
      },
      {
        label: "Relevance Score",
        value: "Above Average",
        change: 0,
        changeType: "stable",
        status: "good",
        icon: Target,
        description: "Ad relevance to audience"
      },
      {
        label: "Landing Page Score",
        value: "85/100",
        change: 8.1,
        changeType: "increase",
        trend: [78, 79, 81, 80, 82, 84, 86, 85, 87, 88, 86, 85],
        target: 90,
        status: "good",
        icon: Globe,
        description: "Landing page experience"
      },
      {
        label: "Ad Strength",
        value: "Excellent",
        change: 12.0,
        changeType: "increase",
        status: "excellent",
        icon: Zap,
        description: "Overall ad creative strength"
      }
    ]
  },
  budget: {
    title: "Budget",
    icon: DollarSign,
    color: "rgb(168, 85, 247)", // violet-500
    metrics: [
      {
        label: "Spend",
        value: "$12,450",
        change: 15.8,
        changeType: "increase",
        trend: [950, 1020, 1150, 1080, 1200, 1350, 1280, 1400, 1320, 1450, 1380, 1245],
        target: 15000,
        status: "good",
        icon: DollarSign,
        description: "Total ad spend"
      },
      {
        label: "Budget Utilization",
        value: "83%",
        change: 5.2,
        changeType: "increase",
        trend: [75, 78, 80, 79, 81, 84, 85, 83, 84, 85, 84, 83],
        target: 90,
        status: "good",
        icon: PieChart,
        description: "Percentage of budget used"
      },
      {
        label: "CPC",
        value: "$1.32",
        change: -8.5,
        changeType: "decrease",
        trend: [1.45, 1.42, 1.38, 1.35, 1.33, 1.30, 1.28, 1.31, 1.34, 1.35, 1.33, 1.32],
        status: "excellent",
        icon: MousePointer,
        description: "Cost per click"
      },
      {
        label: "ROAS",
        value: "4.2x",
        change: 18.2,
        changeType: "increase",
        trend: [3.2, 3.4, 3.6, 3.5, 3.8, 4.0, 4.1, 3.9, 4.2, 4.3, 4.1, 4.2],
        target: 5.0,
        status: "good",
        icon: BarChart3,
        description: "Return on ad spend"
      }
    ]
  },
  targeting: {
    title: "Targeting",
    icon: Target,
    color: "rgb(245, 101, 101)", // red-500
    metrics: [
      {
        label: "Audience Match",
        value: "92%",
        change: 3.8,
        changeType: "increase",
        trend: [88, 89, 90, 89, 91, 93, 94, 92, 93, 94, 93, 92],
        target: 95,
        status: "excellent",
        icon: Users,
        description: "Audience targeting accuracy"
      },
      {
        label: "Geo Performance",
        value: "Above Average",
        change: 0,
        changeType: "stable",
        status: "good",
        icon: MapPin,
        description: "Geographic targeting effectiveness"
      },
      {
        label: "Time Optimization",
        value: "Optimal",
        change: 12.5,
        changeType: "increase",
        status: "excellent",
        icon: Clock,
        description: "Time-based targeting performance"
      },
      {
        label: "Device Split",
        value: "Mobile 68%",
        change: 5.2,
        changeType: "increase",
        status: "good",
        icon: Smartphone,
        description: "Mobile vs desktop performance"
      }
    ]
  }
}

// Utility functions
const getStatusColor = (status?: MetricItem["status"]) => {
  switch (status) {
    case "excellent": return "text-green-600 dark:text-green-400"
    case "good": return "text-blue-600 dark:text-blue-400"
    case "warning": return "text-yellow-600 dark:text-yellow-400"
    case "poor": return "text-red-600 dark:text-red-400"
    default: return "text-gray-600 dark:text-gray-400"
  }
}

const getStatusBadgeVariant = (status?: MetricItem["status"]) => {
  switch (status) {
    case "excellent": return "default"
    case "good": return "secondary"
    case "warning": return "outline"
    case "poor": return "destructive"
    default: return "outline"
  }
}

const getTrendIcon = (changeType?: MetricItem["changeType"], change?: number) => {
  if (!change || change === 0) return <Minus className="h-3 w-3" />
  return changeType === "increase" ? 
    <ChevronUp className="h-3 w-3 text-green-600" /> : 
    <ChevronDown className="h-3 w-3 text-red-600" />
}

const formatChange = (change?: number) => {
  if (!change || change === 0) return "No change"
  const sign = change > 0 ? "+" : ""
  return `${sign}${change.toFixed(1)}%`
}

// Mini Sparkline Component
const MiniSparkline: React.FC<{ data: number[]; color: string; className?: string }> = ({ 
  data, 
  color, 
  className 
}) => {
  const sparklineData = data.map((value, index) => ({ index, value }))
  
  return (
    <div className={cn("h-8 w-16", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sparklineData}>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={color}
            fillOpacity={0.1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Metric Item Component
const MetricItemComponent: React.FC<{ 
  metric: MetricItem
  sectionColor: string
  variant?: "default" | "compact" | "detailed"
}> = ({ metric, sectionColor, variant = "default" }) => {
  const IconComponent = metric.icon

  return (
    <div className="group p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {IconComponent && (
              <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className="text-sm font-medium text-foreground truncate">{metric.label}</span>
            {metric.status && (
              <Badge variant={getStatusBadgeVariant(metric.status)} className="text-xs px-1.5 py-0">
                {metric.status}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">{metric.value}</span>
              {metric.change !== undefined && (
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  metric.changeType === "increase" ? "text-green-600 dark:text-green-400" :
                  metric.changeType === "decrease" ? "text-red-600 dark:text-red-400" :
                  "text-gray-600 dark:text-gray-400"
                )}>
                  {getTrendIcon(metric.changeType, metric.change)}
                  <span>{formatChange(metric.change)}</span>
                </div>
              )}
            </div>
            
            {metric.trend && variant !== "compact" && (
              <MiniSparkline 
                data={metric.trend} 
                color={sectionColor}
                className="opacity-80 group-hover:opacity-100 transition-opacity"
              />
            )}
          </div>

          {variant === "detailed" && metric.description && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {metric.description}
            </p>
          )}

          {metric.target && variant !== "compact" && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div 
                  className="h-1 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((parseFloat(metric.value.toString()) / metric.target) * 100, 100)}%`,
                    backgroundColor: sectionColor
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                Target: {metric.target}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Main Component
export const ComprehensiveMetricsCard: React.FC<ComprehensiveMetricsCardProps> = ({
  data = defaultMetricsData,
  isExpanded = false,
  onToggleExpand,
  variant = "default",
  className,
  ...props
}) => {
  const [activeTab, setActiveTab] = React.useState("performance")
  const mergedData = { ...defaultMetricsData, ...data }
  const sections = Object.keys(mergedData)

  return (
    <Card className={cn("w-full", className)} variant="interactive" {...props}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Comprehensive Metrics
          </CardTitle>
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="px-6 pb-4">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1">
              {sections.map((sectionKey) => {
                const section = mergedData[sectionKey]
                const IconComponent = section.icon
                
                return (
                  <TabsTrigger 
                    key={sectionKey}
                    value={sectionKey}
                    className="flex flex-col items-center gap-1 py-2 px-3 data-[state=active]:bg-background"
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="text-xs font-medium">{section.title}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          {sections.map((sectionKey) => {
            const section = mergedData[sectionKey]
            
            return (
              <TabsContent key={sectionKey} value={sectionKey} className="m-0">
                <div className="px-6 pb-6">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                    {section.metrics.map((metric, index) => (
                      <MetricItemComponent
                        key={`${sectionKey}-${index}`}
                        metric={metric}
                        sectionColor={section.color}
                        variant={variant}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default ComprehensiveMetricsCard