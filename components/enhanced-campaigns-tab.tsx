'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Layers, 
  Target, 
  Image,
  Search,
  Filter,
  Download,
  RefreshCw,
  Settings2,
  Brain,
  Sparkles,
  BarChart3,
  DollarSign,
  TrendingUp,
  Activity
} from 'lucide-react'
import { CampaignHierarchyView } from './campaign-hierarchy-view'
import { BulkActions } from './bulk-actions'
import { InsightModal } from './insight-modal'
import { AdSetAndAdAPI, AdSet, Ad } from '@/lib/meta-api-adsets'

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
}

interface EnhancedCampaignsTabProps {
  campaigns: EnhancedCampaign[]
  accessToken: string
  adAccountId: string
  onRefresh: () => void
}

export function EnhancedCampaignsTab({ 
  campaigns, 
  accessToken, 
  adAccountId,
  onRefresh 
}: EnhancedCampaignsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('performance')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState<'campaign' | 'adset' | 'ad'>('campaign')
  const [campaignHierarchy, setCampaignHierarchy] = useState<Map<string, { adsets: AdSet[], ads: Ad[] }>>(new Map())
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false)
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalData, setModalData] = useState<{
    type: 'campaign' | 'adset' | 'ad'
    id: string
    name: string
    data?: any
    mode: 'insights' | 'predictions'
  } | null>(null)

  // Fetch adsets and ads for all campaigns
  useEffect(() => {
    if (campaigns.length > 0 && accessToken && adAccountId) {
      fetchHierarchy()
    }
  }, [campaigns, accessToken, adAccountId])

  const fetchHierarchy = async () => {
    setIsLoadingHierarchy(true)
    try {
      const api = new AdSetAndAdAPI(accessToken, adAccountId)
      const campaignIds = campaigns.map(c => c.id)
      const hierarchy = await api.getAllCampaignHierarchy(campaignIds)
      setCampaignHierarchy(hierarchy)
    } catch (error) {
      console.error('Failed to fetch hierarchy:', error)
    } finally {
      setIsLoadingHierarchy(false)
    }
  }

  const handleViewInsights = (type: 'campaign' | 'adset' | 'ad', id: string, name: string) => {
    setModalData({ type, id, name, mode: 'insights' })
    setModalOpen(true)
  }

  const handleViewPredictions = (type: 'campaign' | 'adset' | 'ad', id: string, name: string) => {
    setModalData({ type, id, name, mode: 'predictions' })
    setModalOpen(true)
  }

  const handleSelectionChange = (items: string[], type: 'campaign' | 'adset' | 'ad') => {
    setSelectedItems(items)
    setSelectedType(type)
  }

  const handleBulkAction = (action: string, items: string[]) => {
    console.log('Bulk action:', action, 'on items:', items)
    // Implement bulk actions
  }

  const exportData = () => {
    // Export logic
    console.log('Exporting data...')
  }

  // Filter and sort campaigns
  const filteredCampaigns = campaigns
    .filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'performance':
          return (b.performanceScore || 0) - (a.performanceScore || 0)
        case 'spend':
          return (b.spend || 0) - (a.spend || 0)
        case 'roas':
          return (b.roas || b.lifetimeROAS || 0) - (a.roas || a.lifetimeROAS || 0)
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  // Calculate totals
  const totalAdSets = Array.from(campaignHierarchy.values()).reduce((sum, h) => sum + h.adsets.length, 0)
  const totalAds = Array.from(campaignHierarchy.values()).reduce((sum, h) => sum + h.ads.length, 0)

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Campaign Management Center
              </CardTitle>
              <CardDescription>
                Complete hierarchy view with AI insights at every level
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Badge variant="outline" className="text-sm">
                <Layers className="h-3 w-3 mr-1" />
                {campaigns.length} Campaigns
              </Badge>
              <Badge variant="outline" className="text-sm">
                <Target className="h-3 w-3 mr-1" />
                {totalAdSets} Ad Sets
              </Badge>
              <Badge variant="outline" className="text-sm">
                <Image className="h-3 w-3 mr-1" />
                {totalAds} Ads
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns, ad sets, or ads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Filters */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="DELETED">Deleted</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <BarChart3 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="spend">Spend</SelectItem>
                <SelectItem value="roas">ROAS</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Actions */}
            <Button 
              variant="outline" 
              size="icon"
              onClick={fetchHierarchy}
              disabled={isLoadingHierarchy}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingHierarchy ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button variant="outline" size="icon" onClick={exportData}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <BulkActions
          selectedItems={selectedItems}
          itemType={selectedType}
          onAction={handleBulkAction}
        />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setModalOpen(true)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">
                  ${campaigns.reduce((sum, c) => sum + (c.spend || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average ROAS</p>
                <p className="text-2xl font-bold">
                  {(campaigns.reduce((sum, c) => sum + (c.roas || c.lifetimeROAS || 0), 0) / campaigns.length || 0).toFixed(2)}x
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold">
                  {campaigns.filter(c => c.status === 'ACTIVE').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Performance</p>
                <p className="text-2xl font-bold">
                  {(campaigns.reduce((sum, c) => sum + (c.performanceScore || 0), 0) / campaigns.length || 0).toFixed(0)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        {isLoadingHierarchy && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading ad sets and ads...</span>
            </CardContent>
          </Card>
        )}
        
        {filteredCampaigns.map((campaign) => {
          const hierarchy = campaignHierarchy.get(campaign.id) || { adsets: [], ads: [] }
          return (
            <CampaignHierarchyView
              key={campaign.id}
              campaign={campaign}
              adsets={hierarchy.adsets}
              ads={hierarchy.ads}
              onViewInsights={handleViewInsights}
              onViewPredictions={handleViewPredictions}
              onSelectionChange={handleSelectionChange}
              selectedItems={selectedItems}
            />
          )
        })}
      </div>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your filters or search query
            </p>
          </CardContent>
        </Card>
      )}

      {/* Insight Modal */}
      {modalData && (
        <InsightModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setModalData(null)
          }}
          type={modalData.type}
          id={modalData.id}
          name={modalData.name}
          data={modalData.data}
          mode={modalData.mode}
        />
      )}
    </div>
  )
}