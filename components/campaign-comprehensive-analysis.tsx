"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Image as ImageIcon, 
  Video, 
  DollarSign,
  Users,
  Eye,
  MousePointer,
  Target,
  AlertCircle,
  ChevronRight,
  Filter,
  ArrowUpDown
} from "lucide-react"
import { formatCurrency, formatNumberWithCommas, formatPercentage } from "@/lib/utils"
import { optimizedApiManager } from "@/lib/api-manager-optimized"

interface CampaignAnalysisProps {
  campaignId: string
  campaignName: string
  accessToken: string
  datePreset: string
}

export function CampaignComprehensiveAnalysis({
  campaignId,
  campaignName,
  accessToken,
  datePreset
}: CampaignAnalysisProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAdset, setSelectedAdset] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'spend' | 'roas' | 'conversions'>('spend')

  useEffect(() => {
    fetchHierarchyData()
  }, [campaignId, datePreset])

  const fetchHierarchyData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await optimizedApiManager.request<any>(
        "/api/campaign-hierarchy",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId,
            accessToken,
            datePreset
          })
        },
        { priority: 2 }
      )

      setData(response)
      if (response.adsets?.length > 0) {
        setSelectedAdset(response.adsets[0].id)
      }
    } catch (err: any) {
      setError(err.message || "Failed to load campaign analysis")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-700">
        <CardContent className="py-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const selectedAdsetData = data.adsets?.find((a: any) => a.id === selectedAdset)
  
  // Sort adsets based on selected criteria
  const sortedAdsets = [...(data.adsets || [])].sort((a, b) => {
    switch (sortBy) {
      case 'spend': return b.spend - a.spend
      case 'roas': return b.roas - a.roas
      case 'conversions': return b.conversions - a.conversions
      default: return 0
    }
  })

  const getPerformanceColor = (value: number, type: 'roas' | 'ctr' | 'cpc') => {
    switch (type) {
      case 'roas':
        if (value >= 3) return 'text-green-400'
        if (value >= 1.5) return 'text-yellow-400'
        return 'text-red-400'
      case 'ctr':
        if (value >= 2) return 'text-green-400'
        if (value >= 1) return 'text-yellow-400'
        return 'text-red-400'
      case 'cpc':
        if (value <= 0.5) return 'text-green-400'
        if (value <= 1) return 'text-yellow-400'
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Campaign Overview */}
      <Card className="bg-gray-800/70 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Campaign Overview
          </CardTitle>
          <CardDescription>
            Performance across {data.campaign?.adsets || 0} ad sets and {data.campaign?.ads || 0} ads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Total Spend</p>
              <p className="text-xl font-bold">{formatCurrency(data.campaign?.spend || 0)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Revenue</p>
              <p className="text-xl font-bold">{formatCurrency(data.campaign?.revenue || 0)}</p>
              <p className={`text-sm ${getPerformanceColor(data.campaign?.roas || 0, 'roas')}`}>
                {(data.campaign?.roas || 0).toFixed(2)}x ROAS
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Conversions</p>
              <p className="text-xl font-bold">{formatNumberWithCommas(data.campaign?.conversions || 0)}</p>
              <p className="text-sm text-gray-500">
                {data.campaign?.spend > 0 
                  ? formatCurrency((data.campaign.spend / data.campaign.conversions) || 0) + ' CPA'
                  : '-'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Engagement</p>
              <p className="text-xl font-bold">{formatNumberWithCommas(data.campaign?.clicks || 0)}</p>
              <p className={`text-sm ${getPerformanceColor(data.campaign?.ctr || 0, 'ctr')}`}>
                {(data.campaign?.ctr || 0).toFixed(2)}% CTR
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creative Performance */}
      <Card className="bg-gray-800/70 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Creative Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Performance */}
            <div className="p-4 bg-gray-700/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">Image Ads</span>
                </div>
                <Badge variant="secondary">
                  {data.creativeAnalysis?.byType.image.count || 0} ads
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Spend:</span>
                  <span>{formatCurrency(data.creativeAnalysis?.byType.image.spend || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Conversions:</span>
                  <span>{data.creativeAnalysis?.byType.image.conversions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ROAS:</span>
                  <span className={getPerformanceColor(
                    data.creativeAnalysis?.byType.image.spend > 0 
                      ? (data.creativeAnalysis.byType.image.revenue / data.creativeAnalysis.byType.image.spend)
                      : 0, 
                    'roas'
                  )}>
                    {data.creativeAnalysis?.byType.image.spend > 0 
                      ? ((data.creativeAnalysis.byType.image.revenue / data.creativeAnalysis.byType.image.spend).toFixed(2) + 'x')
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Video Performance */}
            <div className="p-4 bg-gray-700/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-400" />
                  <span className="font-medium">Video Ads</span>
                </div>
                <Badge variant="secondary">
                  {data.creativeAnalysis?.byType.video.count || 0} ads
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Spend:</span>
                  <span>{formatCurrency(data.creativeAnalysis?.byType.video.spend || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Conversions:</span>
                  <span>{data.creativeAnalysis?.byType.video.conversions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ROAS:</span>
                  <span className={getPerformanceColor(
                    data.creativeAnalysis?.byType.video.spend > 0 
                      ? (data.creativeAnalysis.byType.video.revenue / data.creativeAnalysis.byType.video.spend)
                      : 0, 
                    'roas'
                  )}>
                    {data.creativeAnalysis?.byType.video.spend > 0 
                      ? ((data.creativeAnalysis.byType.video.revenue / data.creativeAnalysis.byType.video.spend).toFixed(2) + 'x')
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Note about unknown or assumed creatives */}
          {(data.creativeAnalysis?.byType.unknown.count > 0 || data.creativeAnalysis?.assumedTypes > 0) && (
            <div className="mt-2 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <p className="text-xs text-yellow-400">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                {data.creativeAnalysis.byType.unknown.count > 0 && (
                  <>Note: {data.creativeAnalysis.byType.unknown.count} ad{data.creativeAnalysis.byType.unknown.count > 1 ? 's' : ''} could not be categorized. </>
                )}
                {data.creativeAnalysis.assumedTypes > 0 && (
                  <>{data.creativeAnalysis.assumedTypes} ad{data.creativeAnalysis.assumedTypes > 1 ? 's' : ''} assumed to be image ads based on performance data. </>
                )}
                Creative data may be limited due to API restrictions.
              </p>
            </div>
          )}

          {/* Top Performing Ads */}
          {data.creativeAnalysis?.topPerformingAds?.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-3 text-gray-300">Top Performing Ads</h4>
              <div className="space-y-2">
                {data.creativeAnalysis.topPerformingAds.slice(0, 3).map((ad: any, idx: number) => (
                  <div key={ad.id} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                    <span className="text-lg font-bold text-gray-500">#{idx + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{ad.name}</p>
                      <p className="text-xs text-gray-400 truncate">{ad.caption}</p>
                      <p className="text-xs text-gray-500">in {ad.adsetName}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getPerformanceColor(ad.roas, 'roas')}`}>
                        {ad.roas.toFixed(2)}x
                      </p>
                      <p className="text-xs text-gray-400">{formatCurrency(ad.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ad Sets Comparison */}
      <Card className="bg-gray-800/70 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Ad Sets Performance</CardTitle>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md"
            >
              <option value="spend">Sort by Spend</option>
              <option value="roas">Sort by ROAS</option>
              <option value="conversions">Sort by Conversions</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedAdset || ''} onValueChange={setSelectedAdset}>
            <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 h-auto p-1 bg-gray-700/50">
              {sortedAdsets.map((adset: any) => (
                <TabsTrigger 
                  key={adset.id} 
                  value={adset.id}
                  className="flex flex-col items-start p-3 h-auto data-[state=active]:bg-gray-600"
                >
                  <span className="text-xs font-medium truncate w-full">{adset.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{formatCurrency(adset.spend)}</span>
                    <span className={`text-xs ${getPerformanceColor(adset.roas, 'roas')}`}>
                      {adset.roas.toFixed(1)}x
                    </span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {selectedAdsetData && (
              <TabsContent value={selectedAdset!} className="mt-4 space-y-4">
                {/* Ad Set Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 bg-gray-700/30 rounded-lg">
                    <p className="text-xs text-gray-400">Spend</p>
                    <p className="text-lg font-bold">{formatCurrency(selectedAdsetData.spend)}</p>
                  </div>
                  <div className="p-3 bg-gray-700/30 rounded-lg">
                    <p className="text-xs text-gray-400">Revenue</p>
                    <p className="text-lg font-bold">{formatCurrency(selectedAdsetData.revenue)}</p>
                  </div>
                  <div className="p-3 bg-gray-700/30 rounded-lg">
                    <p className="text-xs text-gray-400">Conversions</p>
                    <p className="text-lg font-bold">{selectedAdsetData.conversions}</p>
                  </div>
                  <div className="p-3 bg-gray-700/30 rounded-lg">
                    <p className="text-xs text-gray-400">ROAS</p>
                    <p className={`text-lg font-bold ${getPerformanceColor(selectedAdsetData.roas, 'roas')}`}>
                      {selectedAdsetData.roas.toFixed(2)}x
                    </p>
                  </div>
                </div>

                {/* Ads in this Ad Set */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Ads Performance ({selectedAdsetData.ads?.length || 0} ads)</h4>
                  <div className="space-y-2">
                    {(selectedAdsetData.ads || []).map((ad: any) => (
                      <div key={ad.id} className="p-3 bg-gray-700/30 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {ad.creativeType === 'video' ? (
                                <Video className="w-4 h-4 text-purple-400" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-blue-400" />
                              )}
                              <p className="font-medium text-sm">{ad.name}</p>
                              <Badge 
                                variant={ad.status === 'ACTIVE' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {ad.status}
                              </Badge>
                            </div>
                            {ad.caption && (
                              <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                                "{ad.caption}"
                              </p>
                            )}
                          </div>
                          {ad.mediaUrl && (
                            <img 
                              src={ad.mediaUrl} 
                              alt="Ad preview"
                              className="w-16 h-16 object-cover rounded ml-3"
                            />
                          )}
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Spend</span>
                            <p className="font-medium">{formatCurrency(ad.spend)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Revenue</span>
                            <p className="font-medium">{formatCurrency(ad.revenue)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Conv.</span>
                            <p className="font-medium">{ad.conversions}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">ROAS</span>
                            <p className={`font-medium ${getPerformanceColor(ad.roas, 'roas')}`}>
                              {ad.roas.toFixed(2)}x
                            </p>
                          </div>
                        </div>

                        {/* Performance bar */}
                        <div className="mt-2">
                          <Progress 
                            value={Math.min((ad.roas / 5) * 100, 100)} 
                            className="h-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}