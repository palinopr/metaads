'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, Filter, TrendingUp, Target, Eye, MousePointer, DollarSign, ArrowUpDown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CampaignData {
  id: string
  name: string
  status: string
  spend: number
  revenue: number
  roas: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpa: number
}

interface AdSetData {
  id: string
  name: string
  campaign_id: string
  campaign_name: string
  status: string
  spend: number
  revenue: number
  roas: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  targeting?: any
}

interface AdData {
  id: string
  name: string
  adset_id: string
  adset_name: string
  campaign_id: string
  campaign_name: string
  status: string
  spend: number
  revenue: number
  roas: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  creative?: {
    title?: string
    body?: string
    call_to_action?: string
    image_url?: string
    video_url?: string
  }
}

interface CampaignComparisonToolProps {
  campaigns: CampaignData[]
  accessToken: string
  adAccountId: string
  datePreset: string
}

export function CampaignComparisonTool({ 
  campaigns, 
  accessToken, 
  adAccountId, 
  datePreset 
}: CampaignComparisonToolProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [adSetsData, setAdSetsData] = useState<AdSetData[]>([])
  const [adsData, setAdsData] = useState<AdData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'spend' | 'roas' | 'conversions' | 'ctr' | 'name'>('spend')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Filter campaigns by search term
  const filteredCampaigns = useMemo(() => {
    if (!searchTerm.trim()) return campaigns
    
    return campaigns.filter(campaign => 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [campaigns, searchTerm])

  // Selected campaigns data
  const selectedCampaigns = useMemo(() => {
    return campaigns.filter(campaign => selectedCampaignIds.includes(campaign.id))
  }, [campaigns, selectedCampaignIds])

  // Handle campaign selection
  const handleCampaignToggle = (campaignId: string) => {
    setSelectedCampaignIds(prev => 
      prev.includes(campaignId)
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    )
  }

  const selectAllFiltered = () => {
    const filteredIds = filteredCampaigns.map(c => c.id)
    setSelectedCampaignIds(filteredIds)
  }

  const clearSelection = () => {
    setSelectedCampaignIds([])
  }

  // Fetch detailed data for selected campaigns
  const fetchDetailedData = async () => {
    if (selectedCampaignIds.length === 0) {
      setError('Please select at least one campaign')
      return
    }

    setIsLoading(true)
    setError(null)
    setAdSetsData([])
    setAdsData([])

    try {
      // Fetch adsets and ads for all selected campaigns
      const allAdSets: AdSetData[] = []
      const allAds: AdData[] = []

      for (const campaignId of selectedCampaignIds) {
        const campaign = campaigns.find(c => c.id === campaignId)
        if (!campaign) continue

        // Fetch adsets for this campaign
        const adSetsResponse = await fetch('/api/meta/campaign-adsets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId,
            accessToken,
            datePreset
          })
        })

        if (adSetsResponse.ok) {
          const adSetsResult = await adSetsResponse.json()
          const processedAdSets = (adSetsResult.adSets || []).map((adSet: any) => ({
            ...adSet,
            campaign_id: campaignId,
            campaign_name: campaign.name,
            spend: parseFloat(adSet.spend || '0'),
            revenue: parseFloat(adSet.revenue || '0'),
            roas: adSet.spend > 0 ? adSet.revenue / adSet.spend : 0,
            conversions: parseInt(adSet.conversions || '0'),
            impressions: parseInt(adSet.impressions || '0'),
            clicks: parseInt(adSet.clicks || '0'),
            ctr: parseFloat(adSet.ctr || '0'),
            cpc: parseFloat(adSet.cpc || '0')
          }))
          allAdSets.push(...processedAdSets)

          // Fetch ads for each adset
          for (const adSet of processedAdSets) {
            const adsResponse = await fetch('/api/meta/adset-ads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                adSetId: adSet.id,
                accessToken,
                datePreset
              })
            })

            if (adsResponse.ok) {
              const adsResult = await adsResponse.json()
              const processedAds = (adsResult.ads || []).map((ad: any) => ({
                ...ad,
                adset_id: adSet.id,
                adset_name: adSet.name,
                campaign_id: campaignId,
                campaign_name: campaign.name,
                spend: parseFloat(ad.spend || '0'),
                revenue: parseFloat(ad.revenue || '0'),
                roas: ad.spend > 0 ? ad.revenue / ad.spend : 0,
                conversions: parseInt(ad.conversions || '0'),
                impressions: parseInt(ad.impressions || '0'),
                clicks: parseInt(ad.clicks || '0'),
                ctr: parseFloat(ad.ctr || '0'),
                cpc: parseFloat(ad.cpc || '0')
              }))
              allAds.push(...processedAds)
            }
          }
        }
      }

      setAdSetsData(allAdSets)
      setAdsData(allAds)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch detailed data')
    } finally {
      setIsLoading(false)
    }
  }

  // Sort function
  const sortData = <T extends Record<string, any>>(data: T[], key: string): T[] => {
    return [...data].sort((a, b) => {
      let aVal = a[key]
      let bVal = b[key]
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  }

  const sortedCampaigns = sortData(selectedCampaigns, sortBy)
  const sortedAdSets = sortData(adSetsData, sortBy)
  const sortedAds = sortData(adsData, sortBy)

  // Calculate aggregated metrics
  const aggregatedMetrics = useMemo(() => {
    const totalSpend = selectedCampaigns.reduce((sum, c) => sum + c.spend, 0)
    const totalRevenue = selectedCampaigns.reduce((sum, c) => sum + c.revenue, 0)
    const totalConversions = selectedCampaigns.reduce((sum, c) => sum + c.conversions, 0)
    const totalImpressions = selectedCampaigns.reduce((sum, c) => sum + c.impressions, 0)
    const totalClicks = selectedCampaigns.reduce((sum, c) => sum + c.clicks, 0)

    return {
      totalSpend,
      totalRevenue,
      overallROAS: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      totalConversions,
      avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      avgCPC: totalClicks > 0 ? totalSpend / totalClicks : 0,
      avgCPA: totalConversions > 0 ? totalSpend / totalConversions : 0
    }
  }, [selectedCampaigns])

  const formatCurrency = (num: number) => `$${num.toFixed(2)}`
  const formatNumber = (num: number) => num.toLocaleString()

  return (
    <div className="space-y-6 p-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Campaign Comparison Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search Campaigns</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Type keywords to filter campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600"
                />
              </div>
            </div>
            <Button onClick={selectAllFiltered} variant="outline" size="sm">
              Select All Filtered
            </Button>
            <Button onClick={clearSelection} variant="outline" size="sm">
              Clear Selection
            </Button>
          </div>

          {/* Campaign Selection */}
          <div className="max-h-60 overflow-y-auto border border-gray-600 rounded p-3 bg-gray-700/50">
            <div className="space-y-2">
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center space-x-2 p-2 hover:bg-gray-600/50 rounded">
                  <Checkbox
                    checked={selectedCampaignIds.includes(campaign.id)}
                    onCheckedChange={() => handleCampaignToggle(campaign.id)}
                  />
                  <div className="flex-1 grid grid-cols-6 gap-2 text-xs">
                    <div className="col-span-2">
                      <span className="font-medium">{campaign.name}</span>
                      <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'} className="ml-2 text-xs">
                        {campaign.status}
                      </Badge>
                    </div>
                    <div>Spend: {formatCurrency(campaign.spend)}</div>
                    <div>ROAS: {campaign.roas.toFixed(2)}x</div>
                    <div>Conv: {formatNumber(campaign.conversions)}</div>
                    <div>CTR: {campaign.ctr.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Campaigns Summary */}
          {selectedCampaignIds.length > 0 && (
            <Card className="bg-gray-700/50 border-gray-600">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Selected Campaigns ({selectedCampaignIds.length})</h4>
                  <Button onClick={fetchDetailedData} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading Details...
                      </>
                    ) : (
                      'Compare Selected Campaigns'
                    )}
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Total Spend</span>
                    <p className="font-bold text-blue-400">{formatCurrency(aggregatedMetrics.totalSpend)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Revenue</span>
                    <p className="font-bold text-green-400">{formatCurrency(aggregatedMetrics.totalRevenue)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Overall ROAS</span>
                    <p className="font-bold text-purple-400">{aggregatedMetrics.overallROAS.toFixed(2)}x</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Conv</span>
                    <p className="font-bold text-yellow-400">{formatNumber(aggregatedMetrics.totalConversions)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Avg CTR</span>
                    <p className="font-bold text-orange-400">{aggregatedMetrics.avgCTR.toFixed(2)}%</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Avg CPC</span>
                    <p className="font-bold text-cyan-400">{formatCurrency(aggregatedMetrics.avgCPC)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Avg CPA</span>
                    <p className="font-bold text-red-400">{formatCurrency(aggregatedMetrics.avgCPA)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Detailed Comparison Results */}
      {(adSetsData.length > 0 || adsData.length > 0) && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Detailed Comparison Results</CardTitle>
              <div className="flex items-center gap-2">
                <Label>Sort by:</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spend">Spend</SelectItem>
                    <SelectItem value="roas">ROAS</SelectItem>
                    <SelectItem value="conversions">Conversions</SelectItem>
                    <SelectItem value="ctr">CTR</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="campaigns" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="campaigns">Campaigns ({selectedCampaigns.length})</TabsTrigger>
                <TabsTrigger value="adsets">Ad Sets ({adSetsData.length})</TabsTrigger>
                <TabsTrigger value="ads">Ads ({adsData.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="campaigns" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-600 text-gray-400">
                        <th className="text-left p-2">Campaign</th>
                        <th className="text-right p-2">Spend</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">ROAS</th>
                        <th className="text-right p-2">Conv</th>
                        <th className="text-right p-2">CTR</th>
                        <th className="text-right p-2">CPC</th>
                        <th className="text-right p-2">CPA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCampaigns.map((campaign) => (
                        <tr key={campaign.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                          <td className="p-2">
                            <div>
                              <span className="font-medium">{campaign.name}</span>
                              <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'} className="ml-2">
                                {campaign.status}
                              </Badge>
                            </div>
                          </td>
                          <td className="text-right p-2">{formatCurrency(campaign.spend)}</td>
                          <td className="text-right p-2">{formatCurrency(campaign.revenue)}</td>
                          <td className="text-right p-2 font-medium">{campaign.roas.toFixed(2)}x</td>
                          <td className="text-right p-2">{formatNumber(campaign.conversions)}</td>
                          <td className="text-right p-2">{campaign.ctr.toFixed(2)}%</td>
                          <td className="text-right p-2">{formatCurrency(campaign.cpc)}</td>
                          <td className="text-right p-2">{formatCurrency(campaign.cpa)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="adsets" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-600 text-gray-400">
                        <th className="text-left p-2">Ad Set</th>
                        <th className="text-left p-2">Campaign</th>
                        <th className="text-right p-2">Spend</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">ROAS</th>
                        <th className="text-right p-2">Conv</th>
                        <th className="text-right p-2">CTR</th>
                        <th className="text-right p-2">CPC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAdSets.map((adSet) => (
                        <tr key={adSet.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                          <td className="p-2">
                            <div>
                              <span className="font-medium">{adSet.name}</span>
                              <Badge variant={adSet.status === 'ACTIVE' ? 'default' : 'secondary'} className="ml-2">
                                {adSet.status}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-2 text-gray-400">{adSet.campaign_name}</td>
                          <td className="text-right p-2">{formatCurrency(adSet.spend)}</td>
                          <td className="text-right p-2">{formatCurrency(adSet.revenue)}</td>
                          <td className="text-right p-2 font-medium">{adSet.roas.toFixed(2)}x</td>
                          <td className="text-right p-2">{formatNumber(adSet.conversions)}</td>
                          <td className="text-right p-2">{adSet.ctr.toFixed(2)}%</td>
                          <td className="text-right p-2">{formatCurrency(adSet.cpc)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="ads" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-600 text-gray-400">
                        <th className="text-left p-2">Ad</th>
                        <th className="text-left p-2">Ad Set</th>
                        <th className="text-left p-2">Campaign</th>
                        <th className="text-right p-2">Spend</th>
                        <th className="text-right p-2">ROAS</th>
                        <th className="text-right p-2">Conv</th>
                        <th className="text-right p-2">CTR</th>
                        <th className="text-left p-2">Creative</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAds.map((ad) => (
                        <tr key={ad.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                          <td className="p-2">
                            <div>
                              <span className="font-medium">{ad.name}</span>
                              <Badge variant={ad.status === 'ACTIVE' ? 'default' : 'secondary'} className="ml-2">
                                {ad.status}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-2 text-gray-400 text-xs">{ad.adset_name}</td>
                          <td className="p-2 text-gray-400 text-xs">{ad.campaign_name}</td>
                          <td className="text-right p-2">{formatCurrency(ad.spend)}</td>
                          <td className="text-right p-2 font-medium">{ad.roas.toFixed(2)}x</td>
                          <td className="text-right p-2">{formatNumber(ad.conversions)}</td>
                          <td className="text-right p-2">{ad.ctr.toFixed(2)}%</td>
                          <td className="p-2 max-w-xs">
                            {ad.creative && (
                              <div className="text-xs space-y-1">
                                {ad.creative.title && <div><strong>Title:</strong> {ad.creative.title}</div>}
                                {ad.creative.body && <div><strong>Text:</strong> {ad.creative.body.substring(0, 100)}...</div>}
                                {ad.creative.call_to_action && <div><strong>CTA:</strong> {ad.creative.call_to_action}</div>}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}