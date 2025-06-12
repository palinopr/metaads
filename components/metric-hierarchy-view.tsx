'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from "@/components/ui/breadcrumb"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  ChevronRight, 
  ChevronDown, 
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Target,
  Image,
  Layers,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  Eye,
  Brain,
  Sparkles,
  DollarSign,
  MousePointer,
  Users,
  Activity
} from 'lucide-react'
import { AdSet, Ad } from '@/lib/meta-api-adsets'
import { formatCurrency, formatNumberWithCommas, formatPercentage } from '@/lib/utils'
import { processInsights } from '@/lib/meta-api-client'

interface EnhancedCampaign {
  id: string
  name: string
  status: string
  effective_status: string
  objective: string
  created_time: string
  insights?: any
  todayData?: any
  trend?: 'up' | 'down' | 'stable'
  daysRunning: number
  lifetimeROAS: number
  performanceScore: number
  adSetCount?: number
  adCount?: number
  spend?: number
  revenue?: number
  roas?: number
  ctr?: number
  cpc?: number
  cpm?: number
  impressions?: number
  clicks?: number
}

interface HierarchyItem {
  id: string
  name: string
  type: 'campaign' | 'adset' | 'ad'
  status: string
  metrics: {
    spend: number
    revenue: number
    roas: number
    ctr: number
    cpc: number
    cpm: number
    impressions: number
    clicks: number
    conversions: number
  }
  parent_id?: string
  children?: HierarchyItem[]
  performance_score?: number
  trend?: 'up' | 'down' | 'stable'
}

interface MetricHierarchyViewProps {
  campaign: EnhancedCampaign
  adsets: AdSet[]
  ads: Ad[]
  onViewInsights: (type: 'campaign' | 'adset' | 'ad', id: string, name: string) => void
  onViewPredictions: (type: 'campaign' | 'adset' | 'ad', id: string, name: string) => void
  onNavigate?: (breadcrumb: { type: 'campaign' | 'adset' | 'ad', id: string, name: string }[]) => void
}

type SortField = 'name' | 'spend' | 'revenue' | 'roas' | 'ctr' | 'cpc' | 'impressions' | 'clicks'
type SortDirection = 'asc' | 'desc'
type FilterStatus = 'all' | 'active' | 'paused' | 'deleted'

export function MetricHierarchyView({ 
  campaign, 
  adsets, 
  ads,
  onViewInsights,
  onViewPredictions,
  onNavigate
}: MetricHierarchyViewProps) {
  // Navigation state
  const [breadcrumb, setBreadcrumb] = useState<{ type: 'campaign' | 'adset' | 'ad', id: string, name: string }[]>([
    { type: 'campaign', id: campaign.id, name: campaign.name }
  ])

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [sortField, setSortField] = useState<SortField>('spend')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // View state
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [selectedView, setSelectedView] = useState<'hierarchy' | 'table' | 'comparison'>('hierarchy')
  const [comparisonItems, setComparisonItems] = useState<Set<string>>(new Set())

  // Responsive state
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Helper functions
  const getMetrics = (item: AdSet | Ad | EnhancedCampaign) => {
    if ('insights' in item && item.insights) {
      const insights = item.insights?.data?.[0]
      return processInsights(insights)
    }
    
    // Fallback for campaign data
    return {
      spend: item.spend || 0,
      revenue: item.revenue || 0,
      roas: item.roas || 0,
      ctr: item.ctr || 0,
      cpc: item.cpc || 0,
      cpm: item.cpm || 0,
      impressions: item.impressions || 0,
      clicks: item.clicks || 0,
      conversions: 0
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'DELETED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getPerformanceIndicator = (value: number, threshold: { good: number, poor: number }) => {
    if (value >= threshold.good) return { icon: TrendingUp, color: 'text-green-500' }
    if (value <= threshold.poor) return { icon: TrendingDown, color: 'text-red-500' }
    return { icon: Minus, color: 'text-yellow-500' }
  }

  // Build hierarchy data
  const hierarchyData = useMemo(() => {
    const campaignMetrics = getMetrics(campaign)
    const campaignItem: HierarchyItem = {
      id: campaign.id,
      name: campaign.name,
      type: 'campaign',
      status: campaign.status,
      metrics: campaignMetrics,
      performance_score: campaign.performanceScore,
      trend: campaign.trend,
      children: []
    }

    adsets.forEach(adset => {
      const adsetMetrics = getMetrics(adset)
      const adsetItem: HierarchyItem = {
        id: adset.id,
        name: adset.name,
        type: 'adset',
        status: adset.status,
        metrics: adsetMetrics,
        parent_id: campaign.id,
        children: []
      }

      const adsetAds = ads.filter(ad => ad.adset_id === adset.id)
      adsetAds.forEach(ad => {
        const adMetrics = getMetrics(ad)
        const adItem: HierarchyItem = {
          id: ad.id,
          name: ad.name,
          type: 'ad',
          status: ad.status,
          metrics: adMetrics,
          parent_id: adset.id
        }
        adsetItem.children!.push(adItem)
      })

      campaignItem.children!.push(adsetItem)
    })

    return campaignItem
  }, [campaign, adsets, ads])

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    const filterItems = (items: HierarchyItem[]): HierarchyItem[] => {
      return items
        .filter(item => {
          // Search filter
          const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
          
          // Status filter
          const matchesStatus = statusFilter === 'all' || 
            item.status.toLowerCase() === statusFilter.toLowerCase()

          return matchesSearch && matchesStatus
        })
        .map(item => ({
          ...item,
          children: item.children ? filterItems(item.children) : undefined
        }))
        .sort((a, b) => {
          const aValue = a.metrics[sortField] || 0
          const bValue = b.metrics[sortField] || 0
          
          if (sortField === 'name') {
            return sortDirection === 'asc' 
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name)
          }
          
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
        })
    }

    return filterItems([hierarchyData])
  }, [hierarchyData, searchQuery, statusFilter, sortField, sortDirection])

  // Navigation handlers
  const handleNavigateToItem = (item: HierarchyItem) => {
    const newBreadcrumb = [
      { type: 'campaign' as const, id: campaign.id, name: campaign.name }
    ]

    if (item.type === 'adset') {
      newBreadcrumb.push({ type: 'adset', id: item.id, name: item.name })
    } else if (item.type === 'ad') {
      const parentAdset = adsets.find(as => as.id === item.parent_id)
      if (parentAdset) {
        newBreadcrumb.push({ type: 'adset', id: parentAdset.id, name: parentAdset.name })
      }
      newBreadcrumb.push({ type: 'ad', id: item.id, name: item.name })
    }

    setBreadcrumb(newBreadcrumb)
    onNavigate?.(newBreadcrumb)
  }

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1)
    setBreadcrumb(newBreadcrumb)
    onNavigate?.(newBreadcrumb)
  }

  // Toggle handlers
  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleComparison = (id: string) => {
    setComparisonItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Render hierarchy item
  const renderHierarchyItem = (item: HierarchyItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id)
    const hasChildren = item.children && item.children.length > 0
    const isSelected = comparisonItems.has(item.id)

    const IconComponent = item.type === 'campaign' ? Layers : 
                         item.type === 'adset' ? Target : Image

    const roasIndicator = getPerformanceIndicator(item.metrics.roas, { good: 3, poor: 1 })
    const ctrIndicator = getPerformanceIndicator(item.metrics.ctr * 100, { good: 2, poor: 0.5 })

    return (
      <div key={item.id} className="space-y-2">
        <Card className={`transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(item.id)}
                    className="p-1 h-auto"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                )}
                
                <div 
                  className={`flex items-center gap-2 cursor-pointer hover:opacity-80 ${level > 0 ? `ml-${level * 4}` : ''}`}
                  onClick={() => handleNavigateToItem(item)}
                >
                  <IconComponent className={`h-4 w-4 ${
                    item.type === 'campaign' ? 'text-blue-500' :
                    item.type === 'adset' ? 'text-green-500' : 'text-orange-500'
                  }`} />
                  <span className="font-medium truncate">{item.name}</span>
                  <Badge className={getStatusColor(item.status)} variant="outline">
                    {item.status}
                  </Badge>
                  {hasChildren && (
                    <Badge variant="secondary">
                      {item.children!.length} {item.type === 'campaign' ? 'adsets' : 'ads'}
                    </Badge>
                  )}
                </div>
              </div>

              {!isMobile && (
                <div className="flex items-center gap-4">
                  {/* Key metrics */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(item.metrics.spend)}</div>
                      <div className="text-xs text-muted-foreground">Spend</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{item.metrics.roas.toFixed(2)}x</span>
                        <roasIndicator.icon className={`h-3 w-3 ${roasIndicator.color}`} />
                      </div>
                      <div className="text-xs text-muted-foreground">ROAS</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{formatPercentage(item.metrics.ctr)}</span>
                        <ctrIndicator.icon className={`h-3 w-3 ${ctrIndicator.color}`} />
                      </div>
                      <div className="text-xs text-muted-foreground">CTR</div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleComparison(item.id)
                      }}
                      className={isSelected ? 'bg-blue-100' : ''}
                    >
                      <BarChart3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewInsights(item.type, item.id, item.name)
                      }}
                    >
                      <Brain className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewPredictions(item.type, item.id, item.name)
                      }}
                    >
                      <Sparkles className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile metrics */}
            {isMobile && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium">{formatCurrency(item.metrics.spend)}</div>
                  <div className="text-muted-foreground">Spend</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{item.metrics.roas.toFixed(2)}x</div>
                  <div className="text-muted-foreground">ROAS</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{formatPercentage(item.metrics.ctr)}</div>
                  <div className="text-muted-foreground">CTR</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expanded children */}
        {isExpanded && hasChildren && (
          <Collapsible open={isExpanded}>
            <CollapsibleContent className="space-y-2 ml-4">
              {item.children!.map(child => renderHierarchyItem(child, level + 1))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    )
  }

  // Render table view
  const renderTableView = () => {
    const flattenItems = (items: HierarchyItem[]): HierarchyItem[] => {
      const result: HierarchyItem[] = []
      items.forEach(item => {
        result.push(item)
        if (item.children) {
          result.push(...flattenItems(item.children))
        }
      })
      return result
    }

    const allItems = flattenItems(filteredAndSortedData)

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    if (sortField === 'name') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortField('name')
                      setSortDirection('asc')
                    }
                  }}
                  className="p-0 h-auto font-medium"
                >
                  Name
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </Button>
              </th>
              <th className="text-left p-3">Type</th>
              <th className="text-right p-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    if (sortField === 'spend') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortField('spend')
                      setSortDirection('desc')
                    }
                  }}
                  className="p-0 h-auto font-medium"
                >
                  Spend
                  {sortField === 'spend' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </Button>
              </th>
              <th className="text-right p-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    if (sortField === 'roas') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortField('roas')
                      setSortDirection('desc')
                    }
                  }}
                  className="p-0 h-auto font-medium"
                >
                  ROAS
                  {sortField === 'roas' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </Button>
              </th>
              <th className="text-right p-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    if (sortField === 'ctr') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortField('ctr')
                      setSortDirection('desc')
                    }
                  }}
                  className="p-0 h-auto font-medium"
                >
                  CTR
                  {sortField === 'ctr' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </Button>
              </th>
              <th className="text-right p-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    if (sortField === 'cpc') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortField('cpc')
                      setSortDirection('asc')
                    }
                  }}
                  className="p-0 h-auto font-medium"
                >
                  CPC
                  {sortField === 'cpc' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </Button>
              </th>
              <th className="text-center p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allItems.map((item) => {
              const roasIndicator = getPerformanceIndicator(item.metrics.roas, { good: 3, poor: 1 })
              
              return (
                <tr 
                  key={item.id} 
                  className={`border-b hover:bg-muted/25 cursor-pointer ${
                    comparisonItems.has(item.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNavigateToItem(item)}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {item.type === 'campaign' && <Layers className="h-4 w-4 text-blue-500" />}
                      {item.type === 'adset' && <Target className="h-4 w-4 text-green-500" />}
                      {item.type === 'ad' && <Image className="h-4 w-4 text-orange-500" />}
                      <span className={item.type === 'ad' ? 'ml-8' : item.type === 'adset' ? 'ml-4' : ''}>
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge 
                      variant={item.type === 'campaign' ? 'default' : 
                               item.type === 'adset' ? 'secondary' : 'outline'}
                    >
                      {item.type}
                    </Badge>
                  </td>
                  <td className="text-right p-3">{formatCurrency(item.metrics.spend)}</td>
                  <td className="text-right p-3">
                    <div className="flex items-center justify-end gap-1">
                      {item.metrics.roas.toFixed(2)}x
                      <roasIndicator.icon className={`h-3 w-3 ${roasIndicator.color}`} />
                    </div>
                  </td>
                  <td className="text-right p-3">{formatPercentage(item.metrics.ctr)}</td>
                  <td className="text-right p-3">{formatCurrency(item.metrics.cpc)}</td>
                  <td className="text-center p-3">
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleComparison(item.id)
                        }}
                        className={comparisonItems.has(item.id) ? 'bg-blue-100' : ''}
                      >
                        <BarChart3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewInsights(item.type, item.id, item.name)
                        }}
                      >
                        <Brain className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // Render comparison view
  const renderComparisonView = () => {
    const selectedItems = Array.from(comparisonItems).map(id => {
      const findItem = (items: HierarchyItem[]): HierarchyItem | null => {
        for (const item of items) {
          if (item.id === id) return item
          if (item.children) {
            const found = findItem(item.children)
            if (found) return found
          }
        }
        return null
      }
      return findItem([hierarchyData])
    }).filter(Boolean) as HierarchyItem[]

    if (selectedItems.length === 0) {
      return (
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No items selected for comparison</h3>
          <p className="text-muted-foreground">
            Select items from the hierarchy or table view to compare their performance metrics.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Performance Comparison</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setComparisonItems(new Set())}
          >
            Clear Selection
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedItems.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {item.type === 'campaign' && <Layers className="h-4 w-4 text-blue-500" />}
                  {item.type === 'adset' && <Target className="h-4 w-4 text-green-500" />}
                  {item.type === 'ad' && <Image className="h-4 w-4 text-orange-500" />}
                  <span className="truncate">{item.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Spend</div>
                    <div className="font-medium">{formatCurrency(item.metrics.spend)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">ROAS</div>
                    <div className="font-medium">{item.metrics.roas.toFixed(2)}x</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">CTR</div>
                    <div className="font-medium">{formatPercentage(item.metrics.ctr)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">CPC</div>
                    <div className="font-medium">{formatCurrency(item.metrics.cpc)}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewInsights(item.type, item.id, item.name)}
                    className="flex-1"
                  >
                    <Brain className="h-3 w-3 mr-1" />
                    Insights
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleComparison(item.id)}
                  >
                    ×
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Card>
        <CardContent className="p-4">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumb.map((item, index) => (
                <div key={item.id} className="flex items-center">
                  <BreadcrumbItem>
                    {index === breadcrumb.length - 1 ? (
                      <BreadcrumbPage>{item.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink 
                        onClick={() => handleBreadcrumbClick(index)}
                        className="cursor-pointer"
                      >
                        {item.name}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumb.length - 1 && <BreadcrumbSeparator />}
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns, ad sets, or ads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterStatus)}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Metric Hierarchy View
            {comparisonItems.size > 0 && (
              <Badge variant="secondary">
                {comparisonItems.size} selected for comparison
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
            </TabsList>

            <TabsContent value="hierarchy" className="space-y-4 mt-6">
              {filteredAndSortedData.map(item => renderHierarchyItem(item))}
            </TabsContent>

            <TabsContent value="table" className="mt-6">
              {renderTableView()}
            </TabsContent>

            <TabsContent value="comparison" className="mt-6">
              {renderComparisonView()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}