"use client"

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon, 
  Search, 
  Save, 
  Upload, 
  Download,
  RotateCcw,
  Settings,
  Target,
  DollarSign,
  MapPin,
  Users,
  TrendingUp,
  BarChart3,
  Clock,
  Zap,
  Star,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

// Types
export interface MetricFilter {
  id: string
  metric: string
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between' | 'in' | 'not_in'
  value: number | number[] | string | string[]
  enabled: boolean
}

export interface DateRangeFilter {
  id: string
  type: 'absolute' | 'relative' | 'comparison'
  startDate?: Date
  endDate?: Date
  relativePeriod?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_month' | 'last_month' | 'this_year' | 'last_year'
  comparisonStartDate?: Date
  comparisonEndDate?: Date
  enabled: boolean
}

export interface GeographicFilter {
  id: string
  type: 'country' | 'region' | 'city' | 'postal_code' | 'dma'
  locations: string[]
  exclude: boolean
  enabled: boolean
}

export interface DemographicFilter {
  id: string
  type: 'age' | 'gender' | 'language' | 'device' | 'platform'
  values: string[]
  ageRange?: [number, number]
  enabled: boolean
}

export interface PerformanceTierFilter {
  id: string
  tier: 'top_performers' | 'average_performers' | 'underperformers' | 'custom'
  metric: string
  percentile?: number
  customRange?: [number, number]
  enabled: boolean
}

export interface FilterPreset {
  id: string
  name: string
  description?: string
  filters: {
    metrics: MetricFilter[]
    dateRange: DateRangeFilter
    geographic: GeographicFilter[]
    demographic: DemographicFilter[]
    performanceTiers: PerformanceTierFilter[]
    campaignObjectives: string[]
    budgetTypes: string[]
  }
  isDefault?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AdvancedFiltersProps {
  onFiltersChange: (filters: any) => void
  initialFilters?: any
  availableMetrics?: string[]
  availableCountries?: string[]
  availableRegions?: string[]
  availableCities?: string[]
  className?: string
}

// Constants
const METRICS = [
  'impressions', 'clicks', 'spend', 'ctr', 'cpc', 'cpm', 'conversions', 
  'conversion_rate', 'roas', 'cost_per_conversion', 'reach', 'frequency',
  'video_views', 'video_completion_rate', 'engagement_rate', 'link_clicks'
]

const CAMPAIGN_OBJECTIVES = [
  'awareness', 'traffic', 'engagement', 'leads', 'app_promotion', 
  'sales', 'store_visits', 'reach', 'video_views', 'messages'
]

const BUDGET_TYPES = [
  'daily', 'lifetime', 'campaign_budget_optimization', 'adset_budget'
]

const OPERATORS = [
  { value: 'gt', label: 'Greater than' },
  { value: 'gte', label: 'Greater than or equal' },
  { value: 'lt', label: 'Less than' },
  { value: 'lte', label: 'Less than or equal' },
  { value: 'eq', label: 'Equal to' },
  { value: 'between', label: 'Between' },
  { value: 'in', label: 'In list' },
  { value: 'not_in', label: 'Not in list' }
]

const PERFORMANCE_TIERS = [
  { value: 'top_performers', label: 'Top Performers (Top 25%)' },
  { value: 'average_performers', label: 'Average Performers (25-75%)' },
  { value: 'underperformers', label: 'Underperformers (Bottom 25%)' },
  { value: 'custom', label: 'Custom Range' }
]

const RELATIVE_PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'last_90_days', label: 'Last 90 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'this_year', label: 'This year' },
  { value: 'last_year', label: 'Last year' }
]

// Default presets
const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: 'high_performers',
    name: 'High Performers',
    description: 'Campaigns with strong ROAS and conversion rates',
    filters: {
      metrics: [
        {
          id: 'roas_filter',
          metric: 'roas',
          operator: 'gte',
          value: 3,
          enabled: true
        },
        {
          id: 'conversion_rate_filter',
          metric: 'conversion_rate',
          operator: 'gte',
          value: 0.02,
          enabled: true
        }
      ],
      dateRange: {
        id: 'date_range',
        type: 'relative',
        relativePeriod: 'last_30_days',
        enabled: true
      },
      geographic: [],
      demographic: [],
      performanceTiers: [],
      campaignObjectives: [],
      budgetTypes: []
    },
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'needs_optimization',
    name: 'Needs Optimization',
    description: 'Campaigns with high spend but low performance',
    filters: {
      metrics: [
        {
          id: 'spend_filter',
          metric: 'spend',
          operator: 'gte',
          value: 1000,
          enabled: true
        },
        {
          id: 'roas_filter',
          metric: 'roas',
          operator: 'lt',
          value: 2,
          enabled: true
        }
      ],
      dateRange: {
        id: 'date_range',
        type: 'relative',
        relativePeriod: 'last_7_days',
        enabled: true
      },
      geographic: [],
      demographic: [],
      performanceTiers: [],
      campaignObjectives: [],
      budgetTypes: []
    },
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export function AdvancedFilters({ 
  onFiltersChange, 
  initialFilters,
  availableMetrics = METRICS,
  availableCountries = [],
  availableRegions = [],
  availableCities = [],
  className 
}: AdvancedFiltersProps) {
  // State
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('metrics')
  const [metricFilters, setMetricFilters] = useState<MetricFilter[]>([])
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>({
    id: 'main_date_range',
    type: 'relative',
    relativePeriod: 'last_30_days',
    enabled: true
  })
  const [geographicFilters, setGeographicFilters] = useState<GeographicFilter[]>([])
  const [demographicFilters, setDemographicFilters] = useState<DemographicFilter[]>([])
  const [performanceTierFilters, setPerformanceTierFilters] = useState<PerformanceTierFilter[]>([])
  const [campaignObjectives, setCampaignObjectives] = useState<string[]>([])
  const [budgetTypes, setBudgetTypes] = useState<string[]>([])
  const [presets, setPresets] = useState<FilterPreset[]>(DEFAULT_PRESETS)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [savePresetOpen, setSavePresetOpen] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetDescription, setNewPresetDescription] = useState('')

  // Computed values
  const activeFiltersCount = useMemo(() => {
    return (
      metricFilters.filter(f => f.enabled).length +
      (dateRangeFilter.enabled ? 1 : 0) +
      geographicFilters.filter(f => f.enabled).length +
      demographicFilters.filter(f => f.enabled).length +
      performanceTierFilters.filter(f => f.enabled).length +
      campaignObjectives.length +
      budgetTypes.length
    )
  }, [metricFilters, dateRangeFilter, geographicFilters, demographicFilters, performanceTierFilters, campaignObjectives, budgetTypes])

  const currentFilters = useMemo(() => ({
    metrics: metricFilters,
    dateRange: dateRangeFilter,
    geographic: geographicFilters,
    demographic: demographicFilters,
    performanceTiers: performanceTierFilters,
    campaignObjectives,
    budgetTypes
  }), [metricFilters, dateRangeFilter, geographicFilters, demographicFilters, performanceTierFilters, campaignObjectives, budgetTypes])

  // Effects
  useEffect(() => {
    onFiltersChange(currentFilters)
  }, [currentFilters, onFiltersChange])

  // Handlers
  const addMetricFilter = useCallback(() => {
    const newFilter: MetricFilter = {
      id: `metric_${Date.now()}`,
      metric: availableMetrics[0] || 'impressions',
      operator: 'gte',
      value: 0,
      enabled: true
    }
    setMetricFilters(prev => [...prev, newFilter])
  }, [availableMetrics])

  const updateMetricFilter = useCallback((id: string, updates: Partial<MetricFilter>) => {
    setMetricFilters(prev => prev.map(filter => 
      filter.id === id ? { ...filter, ...updates } : filter
    ))
  }, [])

  const removeMetricFilter = useCallback((id: string) => {
    setMetricFilters(prev => prev.filter(filter => filter.id !== id))
  }, [])

  const addGeographicFilter = useCallback(() => {
    const newFilter: GeographicFilter = {
      id: `geo_${Date.now()}`,
      type: 'country',
      locations: [],
      exclude: false,
      enabled: true
    }
    setGeographicFilters(prev => [...prev, newFilter])
  }, [])

  const updateGeographicFilter = useCallback((id: string, updates: Partial<GeographicFilter>) => {
    setGeographicFilters(prev => prev.map(filter =>
      filter.id === id ? { ...filter, ...updates } : filter
    ))
  }, [])

  const removeGeographicFilter = useCallback((id: string) => {
    setGeographicFilters(prev => prev.filter(filter => filter.id !== id))
  }, [])

  const addDemographicFilter = useCallback(() => {
    const newFilter: DemographicFilter = {
      id: `demo_${Date.now()}`,
      type: 'age',
      values: [],
      enabled: true
    }
    setDemographicFilters(prev => [...prev, newFilter])
  }, [])

  const updateDemographicFilter = useCallback((id: string, updates: Partial<DemographicFilter>) => {
    setDemographicFilters(prev => prev.map(filter =>
      filter.id === id ? { ...filter, ...updates } : filter
    ))
  }, [])

  const removeDemographicFilter = useCallback((id: string) => {
    setDemographicFilters(prev => prev.filter(filter => filter.id !== id))
  }, [])

  const addPerformanceTierFilter = useCallback(() => {
    const newFilter: PerformanceTierFilter = {
      id: `perf_${Date.now()}`,
      tier: 'top_performers',
      metric: 'roas',
      enabled: true
    }
    setPerformanceTierFilters(prev => [...prev, newFilter])
  }, [])

  const updatePerformanceTierFilter = useCallback((id: string, updates: Partial<PerformanceTierFilter>) => {
    setPerformanceTierFilters(prev => prev.map(filter =>
      filter.id === id ? { ...filter, ...updates } : filter
    ))
  }, [])

  const removePerformanceTierFilter = useCallback((id: string) => {
    setPerformanceTierFilters(prev => prev.filter(filter => filter.id !== id))
  }, [])

  const loadPreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId)
    if (!preset) return

    setMetricFilters(preset.filters.metrics)
    setDateRangeFilter(preset.filters.dateRange)
    setGeographicFilters(preset.filters.geographic)
    setDemographicFilters(preset.filters.demographic)
    setPerformanceTierFilters(preset.filters.performanceTiers)
    setCampaignObjectives(preset.filters.campaignObjectives)
    setBudgetTypes(preset.filters.budgetTypes)
    setSelectedPreset(presetId)
  }, [presets])

  const savePreset = useCallback(() => {
    if (!newPresetName.trim()) return

    const newPreset: FilterPreset = {
      id: `preset_${Date.now()}`,
      name: newPresetName,
      description: newPresetDescription,
      filters: currentFilters,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setPresets(prev => [...prev, newPreset])
    setNewPresetName('')
    setNewPresetDescription('')
    setSavePresetOpen(false)
    setSelectedPreset(newPreset.id)
  }, [newPresetName, newPresetDescription, currentFilters])

  const clearAllFilters = useCallback(() => {
    setMetricFilters([])
    setDateRangeFilter({
      id: 'main_date_range',
      type: 'relative',
      relativePeriod: 'last_30_days',
      enabled: true
    })
    setGeographicFilters([])
    setDemographicFilters([])
    setPerformanceTierFilters([])
    setCampaignObjectives([])
    setBudgetTypes([])
    setSelectedPreset(null)
  }, [])

  const exportFilters = useCallback(() => {
    const dataStr = JSON.stringify(currentFilters, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `advanced-filters-${format(new Date(), 'yyyy-MM-dd')}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [currentFilters])

  // Render functions
  const renderMetricFilter = (filter: MetricFilter) => (
    <Card key={filter.id} className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={filter.enabled}
            onCheckedChange={(enabled) => updateMetricFilter(filter.id, { enabled })}
          />
          <Label className="text-sm font-medium">Metric Filter</Label>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeMetricFilter(filter.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Metric</Label>
          <Select
            value={filter.metric}
            onValueChange={(metric) => updateMetricFilter(filter.id, { metric })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMetrics.map((metric) => (
                <SelectItem key={metric} value={metric}>
                  {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Operator</Label>
          <Select
            value={filter.operator}
            onValueChange={(operator: any) => updateMetricFilter(filter.id, { operator })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Value</Label>
          {filter.operator === 'between' ? (
            <div className="flex gap-1">
              <Input
                type="number"
                placeholder="Min"
                value={Array.isArray(filter.value) ? filter.value[0] : ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  const currentValue = Array.isArray(filter.value) ? filter.value : [0, 0]
                  updateMetricFilter(filter.id, { value: [value, currentValue[1]] })
                }}
              />
              <Input
                type="number"
                placeholder="Max"
                value={Array.isArray(filter.value) ? filter.value[1] : ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  const currentValue = Array.isArray(filter.value) ? filter.value : [0, 0]
                  updateMetricFilter(filter.id, { value: [currentValue[0], value] })
                }}
              />
            </div>
          ) : (
            <Input
              type="number"
              placeholder="Enter value"
              value={typeof filter.value === 'number' ? filter.value : ''}
              onChange={(e) => updateMetricFilter(filter.id, { value: parseFloat(e.target.value) || 0 })}
            />
          )}
        </div>
      </div>
    </Card>
  )

  const renderDateRangeFilter = () => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={dateRangeFilter.enabled}
            onCheckedChange={(enabled) => setDateRangeFilter(prev => ({ ...prev, enabled }))}
          />
          <Label className="text-sm font-medium">Date Range</Label>
        </div>
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={dateRangeFilter.type}
            onValueChange={(type: any) => setDateRangeFilter(prev => ({ ...prev, type }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relative">Relative Period</SelectItem>
              <SelectItem value="absolute">Absolute Dates</SelectItem>
              <SelectItem value="comparison">Date Comparison</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {dateRangeFilter.type === 'relative' && (
          <div>
            <Label className="text-xs text-muted-foreground">Period</Label>
            <Select
              value={dateRangeFilter.relativePeriod}
              onValueChange={(relativePeriod: any) => setDateRangeFilter(prev => ({ ...prev, relativePeriod }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIVE_PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {dateRangeFilter.type === 'absolute' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRangeFilter.startDate ? format(dateRangeFilter.startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRangeFilter.startDate}
                    onSelect={(date) => setDateRangeFilter(prev => ({ ...prev, startDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRangeFilter.endDate ? format(dateRangeFilter.endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRangeFilter.endDate}
                    onSelect={(date) => setDateRangeFilter(prev => ({ ...prev, endDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>
    </Card>
  )

  const renderGeographicFilter = (filter: GeographicFilter) => (
    <Card key={filter.id} className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={filter.enabled}
            onCheckedChange={(enabled) => updateGeographicFilter(filter.id, { enabled })}
          />
          <Label className="text-sm font-medium">Geographic Filter</Label>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeGeographicFilter(filter.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={filter.type}
            onValueChange={(type: any) => updateGeographicFilter(filter.id, { type })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="country">Country</SelectItem>
              <SelectItem value="region">Region/State</SelectItem>
              <SelectItem value="city">City</SelectItem>
              <SelectItem value="postal_code">Postal Code</SelectItem>
              <SelectItem value="dma">DMA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={filter.exclude}
            onCheckedChange={(exclude) => updateGeographicFilter(filter.id, { exclude })}
          />
          <Label className="text-xs text-muted-foreground">Exclude</Label>
        </div>
      </div>

      <div className="mt-3">
        <Label className="text-xs text-muted-foreground">Locations</Label>
        <Input
          placeholder="Enter locations (comma-separated)"
          value={filter.locations.join(', ')}
          onChange={(e) => {
            const locations = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
            updateGeographicFilter(filter.id, { locations })
          }}
        />
      </div>
    </Card>
  )

  const renderDemographicFilter = (filter: DemographicFilter) => (
    <Card key={filter.id} className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={filter.enabled}
            onCheckedChange={(enabled) => updateDemographicFilter(filter.id, { enabled })}
          />
          <Label className="text-sm font-medium">Demographic Filter</Label>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeDemographicFilter(filter.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={filter.type}
            onValueChange={(type: any) => updateDemographicFilter(filter.id, { type })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="age">Age</SelectItem>
              <SelectItem value="gender">Gender</SelectItem>
              <SelectItem value="language">Language</SelectItem>
              <SelectItem value="device">Device</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filter.type === 'age' ? (
          <div>
            <Label className="text-xs text-muted-foreground">Age Range: {filter.ageRange?.[0]} - {filter.ageRange?.[1]}</Label>
            <Slider
              value={filter.ageRange || [18, 65]}
              onValueChange={(ageRange: [number, number]) => updateDemographicFilter(filter.id, { ageRange })}
              max={65}
              min={13}
              step={1}
              className="mt-2"
            />
          </div>
        ) : (
          <div>
            <Label className="text-xs text-muted-foreground">Values</Label>
            <Input
              placeholder="Enter values (comma-separated)"
              value={filter.values.join(', ')}
              onChange={(e) => {
                const values = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                updateDemographicFilter(filter.id, { values })
              }}
            />
          </div>
        )}
      </div>
    </Card>
  )

  const renderPerformanceTierFilter = (filter: PerformanceTierFilter) => (
    <Card key={filter.id} className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={filter.enabled}
            onCheckedChange={(enabled) => updatePerformanceTierFilter(filter.id, { enabled })}
          />
          <Label className="text-sm font-medium">Performance Tier</Label>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removePerformanceTierFilter(filter.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Tier</Label>
          <Select
            value={filter.tier}
            onValueChange={(tier: any) => updatePerformanceTierFilter(filter.id, { tier })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERFORMANCE_TIERS.map((tier) => (
                <SelectItem key={tier.value} value={tier.value}>
                  {tier.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Based on Metric</Label>
          <Select
            value={filter.metric}
            onValueChange={(metric) => updatePerformanceTierFilter(filter.id, { metric })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMetrics.map((metric) => (
                <SelectItem key={metric} value={metric}>
                  {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filter.tier === 'custom' && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Min Value</Label>
            <Input
              type="number"
              placeholder="Minimum"
              value={filter.customRange?.[0] || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0
                const currentRange = filter.customRange || [0, 0]
                updatePerformanceTierFilter(filter.id, { customRange: [value, currentRange[1]] })
              }}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Max Value</Label>
            <Input
              type="number"
              placeholder="Maximum"
              value={filter.customRange?.[1] || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0
                const currentRange = filter.customRange || [0, 0]
                updatePerformanceTierFilter(filter.id, { customRange: [currentRange[0], value] })
              }}
            />
          </div>
        </div>
      )}
    </Card>
  )

  const renderPresetManager = () => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-sm font-medium">Filter Presets</Label>
        <div className="flex gap-2">
          <Dialog open={savePresetOpen} onOpenChange={setSavePresetOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Filter Preset</DialogTitle>
                <DialogDescription>
                  Save your current filter configuration as a reusable preset.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="preset-name">Preset Name</Label>
                  <Input
                    id="preset-name"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Enter preset name"
                  />
                </div>
                <div>
                  <Label htmlFor="preset-description">Description (Optional)</Label>
                  <Input
                    id="preset-description"
                    value={newPresetDescription}
                    onChange={(e) => setNewPresetDescription(e.target.value)}
                    placeholder="Enter description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSavePresetOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={savePreset} disabled={!newPresetName.trim()}>
                  Save Preset
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={exportFilters}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
              selectedPreset === preset.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
            )}
            onClick={() => loadPreset(preset.id)}
          >
            <div>
              <div className="font-medium text-sm">{preset.name}</div>
              {preset.description && (
                <div className="text-xs text-muted-foreground">{preset.description}</div>
              )}
            </div>
            {preset.isDefault && (
              <Badge variant="secondary" className="text-xs">Default</Badge>
            )}
          </div>
        ))}
      </div>
    </Card>
  )

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <div>
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
              <CardDescription>
                {activeFiltersCount > 0 
                  ? `${activeFiltersCount} active filter${activeFiltersCount === 1 ? '' : 's'}`
                  : 'No active filters'
                }
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              disabled={activeFiltersCount === 0}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg">
              {[
                { id: 'presets', label: 'Presets', icon: Star },
                { id: 'metrics', label: 'Metrics', icon: BarChart3 },
                { id: 'date', label: 'Date Range', icon: CalendarIcon },
                { id: 'performance', label: 'Performance', icon: TrendingUp },
                { id: 'geographic', label: 'Geographic', icon: MapPin },
                { id: 'demographic', label: 'Demographic', icon: Users },
                { id: 'campaign', label: 'Campaign', icon: Target },
                { id: 'budget', label: 'Budget', icon: DollarSign }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-1"
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </Button>
                )
              })}
            </div>

            {/* Filter Content */}
            <ScrollArea className="h-[600px] w-full">
              <div className="space-y-4 pr-4">
                {activeTab === 'presets' && renderPresetManager()}

                {activeTab === 'metrics' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Metric Filters</Label>
                      <Button variant="outline" size="sm" onClick={addMetricFilter}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Filter
                      </Button>
                    </div>
                    {metricFilters.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No metric filters configured. Click "Add Filter" to get started.
                      </div>
                    ) : (
                      metricFilters.map(renderMetricFilter)
                    )}
                  </div>
                )}

                {activeTab === 'date' && (
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Date Range Configuration</Label>
                    {renderDateRangeFilter()}
                  </div>
                )}

                {activeTab === 'performance' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Performance Tiers</Label>
                      <Button variant="outline" size="sm" onClick={addPerformanceTierFilter}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Tier
                      </Button>
                    </div>
                    {performanceTierFilters.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No performance tier filters configured.
                      </div>
                    ) : (
                      performanceTierFilters.map(renderPerformanceTierFilter)
                    )}
                  </div>
                )}

                {activeTab === 'geographic' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Geographic Filters</Label>
                      <Button variant="outline" size="sm" onClick={addGeographicFilter}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Location
                      </Button>
                    </div>
                    {geographicFilters.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No geographic filters configured.
                      </div>
                    ) : (
                      geographicFilters.map(renderGeographicFilter)
                    )}
                  </div>
                )}

                {activeTab === 'demographic' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Demographic Filters</Label>
                      <Button variant="outline" size="sm" onClick={addDemographicFilter}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Filter
                      </Button>
                    </div>
                    {demographicFilters.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No demographic filters configured.
                      </div>
                    ) : (
                      demographicFilters.map(renderDemographicFilter)
                    )}
                  </div>
                )}

                {activeTab === 'campaign' && (
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Campaign Objectives</Label>
                    <Card className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {CAMPAIGN_OBJECTIVES.map((objective) => (
                          <div key={objective} className="flex items-center space-x-2">
                            <Checkbox
                              id={`objective-${objective}`}
                              checked={campaignObjectives.includes(objective)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setCampaignObjectives(prev => [...prev, objective])
                                } else {
                                  setCampaignObjectives(prev => prev.filter(o => o !== objective))
                                }
                              }}
                            />
                            <Label
                              htmlFor={`objective-${objective}`}
                              className="text-sm font-normal capitalize"
                            >
                              {objective.replace(/_/g, ' ')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}

                {activeTab === 'budget' && (
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Budget Types</Label>
                    <Card className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {BUDGET_TYPES.map((budgetType) => (
                          <div key={budgetType} className="flex items-center space-x-2">
                            <Checkbox
                              id={`budget-${budgetType}`}
                              checked={budgetTypes.includes(budgetType)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setBudgetTypes(prev => [...prev, budgetType])
                                } else {
                                  setBudgetTypes(prev => prev.filter(b => b !== budgetType))
                                }
                              }}
                            />
                            <Label
                              htmlFor={`budget-${budgetType}`}
                              className="text-sm font-normal capitalize"
                            >
                              {budgetType.replace(/_/g, ' ')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      )}
    </Card>
  )
}