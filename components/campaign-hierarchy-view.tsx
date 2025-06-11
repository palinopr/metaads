'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Target, 
  Image,
  TrendingUp,
  DollarSign,
  Eye,
  Brain,
  BarChart3,
  Sparkles,
  RefreshCw,
  Download
} from 'lucide-react'
import { AdSet, Ad } from '@/lib/meta-api-adsets'
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
import { formatCurrency, formatNumberWithCommas, formatPercentage } from '@/lib/utils'
import { processInsights } from '@/lib/meta-api-client'

interface CampaignHierarchyViewProps {
  campaign: EnhancedCampaign
  adsets: AdSet[]
  ads: Ad[]
  onViewInsights: (type: 'campaign' | 'adset' | 'ad', id: string, name: string) => void
  onViewPredictions: (type: 'campaign' | 'adset' | 'ad', id: string, name: string) => void
  onSelectionChange?: (selected: string[], type: 'campaign' | 'adset' | 'ad') => void
  selectedItems?: string[]
}

export function CampaignHierarchyView({ 
  campaign, 
  adsets, 
  ads,
  onViewInsights,
  onViewPredictions
}: CampaignHierarchyViewProps) {
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set())
  const [selectedView, setSelectedView] = useState<'hierarchy' | 'performance' | 'insights'>('hierarchy')

  const toggleAdSet = (adsetId: string) => {
    setExpandedAdSets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(adsetId)) {
        newSet.delete(adsetId)
      } else {
        newSet.add(adsetId)
      }
      return newSet
    })
  }

  const getAdsetMetrics = (adset: AdSet) => {
    const insights = adset.insights?.data?.[0]
    return processInsights(insights)
  }

  const getAdMetrics = (ad: Ad) => {
    const insights = ad.insights?.data?.[0]
    return processInsights(insights)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800'
      case 'DELETED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Campaign Structure: {campaign.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
            <TabsList>
              <TabsTrigger value="hierarchy">Hierarchy View</TabsTrigger>
              <TabsTrigger value="performance">Performance Matrix</TabsTrigger>
              <TabsTrigger value="insights">AI Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="hierarchy" className="space-y-4 mt-4">
              {/* Campaign Level Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{campaign.name}</h3>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span>Revenue: {formatCurrency(campaign.revenue || 0)}</span>
                      <span>ROAS: {campaign.roas || campaign.lifetimeROAS || 0}x</span>
                      <span>Spend: {formatCurrency(campaign.spend || 0)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onViewInsights('campaign', campaign.id, campaign.name)}
                    >
                      <Brain className="h-3 w-3 mr-1" />
                      AI Insights
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onViewPredictions('campaign', campaign.id, campaign.name)}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Predictions
                    </Button>
                  </div>
                </div>
              </div>

              {/* AdSets */}
              <div className="space-y-3">
                {adsets.map((adset) => {
                  const adsetAds = ads.filter(ad => ad.adset_id === adset.id)
                  const isExpanded = expandedAdSets.has(adset.id)
                  const metrics = getAdsetMetrics(adset)

                  return (
                    <div key={adset.id} className="border rounded-lg">
                      {/* AdSet Header */}
                      <div 
                        className="p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleAdSet(adset.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isExpanded ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                            <Target className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{adset.name}</span>
                            <Badge className={getStatusColor(adset.status)}>
                              {adset.status}
                            </Badge>
                            <Badge variant="outline">
                              {adsetAds.length} ads
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-right">
                              <div>Spend: {formatCurrency(metrics?.spend || 0)}</div>
                              <div>ROAS: {metrics?.roas || 0}x</div>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onViewInsights('adset', adset.id, adset.name)
                                }}
                              >
                                <Brain className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onViewPredictions('adset', adset.id, adset.name)
                                }}
                              >
                                <Sparkles className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ads */}
                      {isExpanded && (
                        <div className="border-t bg-gray-50 p-3 space-y-2">
                          {adsetAds.map((ad) => {
                            const adMetrics = getAdMetrics(ad)
                            
                            return (
                              <div key={ad.id} className="bg-white rounded p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Image className="h-4 w-4 text-green-500" />
                                  <span className="text-sm">{ad.name}</span>
                                  <Badge className={getStatusColor(ad.status)} variant="outline">
                                    {ad.status}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                  <div className="text-xs text-right">
                                    <div>Spend: {formatCurrency(adMetrics?.spend || 0)}</div>
                                    <div>CTR: {formatPercentage(adMetrics?.ctr || 0)}</div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => onViewInsights('ad', ad.id, ad.name)}
                                    >
                                      <Brain className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => onViewPredictions('ad', ad.id, ad.name)}
                                    >
                                      <Sparkles className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="mt-4">
              {/* Performance comparison grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-right p-2">Spend</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">ROAS</th>
                      <th className="text-right p-2">CTR</th>
                      <th className="text-right p-2">CPC</th>
                      <th className="text-center p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Campaign row */}
                    <tr className="border-b bg-blue-50">
                      <td className="p-2 font-medium">{campaign.name}</td>
                      <td className="p-2">
                        <Badge>Campaign</Badge>
                      </td>
                      <td className="text-right p-2">{formatCurrency(campaign.spend)}</td>
                      <td className="text-right p-2">{formatCurrency(campaign.revenue)}</td>
                      <td className="text-right p-2">{campaign.roas}x</td>
                      <td className="text-right p-2">{formatPercentage(campaign.ctr)}</td>
                      <td className="text-right p-2">{formatCurrency(campaign.cpc)}</td>
                      <td className="text-center p-2">
                        <Button size="sm" variant="outline">View</Button>
                      </td>
                    </tr>

                    {/* AdSet rows */}
                    {adsets.map((adset) => {
                      const metrics = getAdsetMetrics(adset)
                      return (
                        <tr key={adset.id} className="border-b">
                          <td className="p-2 pl-8">{adset.name}</td>
                          <td className="p-2">
                            <Badge variant="outline">AdSet</Badge>
                          </td>
                          <td className="text-right p-2">{formatCurrency(metrics?.spend || 0)}</td>
                          <td className="text-right p-2">{formatCurrency(metrics?.revenue || 0)}</td>
                          <td className="text-right p-2">{metrics?.roas || 0}x</td>
                          <td className="text-right p-2">{formatPercentage(metrics?.ctr || 0)}</td>
                          <td className="text-right p-2">{formatCurrency(metrics?.cpc || 0)}</td>
                          <td className="text-center p-2">
                            <Button size="sm" variant="outline">View</Button>
                          </td>
                        </tr>
                      )
                    })}

                    {/* Ad rows */}
                    {ads.map((ad) => {
                      const metrics = getAdMetrics(ad)
                      return (
                        <tr key={ad.id} className="border-b">
                          <td className="p-2 pl-16">{ad.name}</td>
                          <td className="p-2">
                            <Badge variant="secondary">Ad</Badge>
                          </td>
                          <td className="text-right p-2">{formatCurrency(metrics?.spend || 0)}</td>
                          <td className="text-right p-2">{formatCurrency(metrics?.revenue || 0)}</td>
                          <td className="text-right p-2">{metrics?.roas || 0}x</td>
                          <td className="text-right p-2">{formatPercentage(metrics?.ctr || 0)}</td>
                          <td className="text-right p-2">{formatCurrency(metrics?.cpc || 0)}</td>
                          <td className="text-center p-2">
                            <Button size="sm" variant="outline">View</Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="mt-4">
              <div className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <Brain className="h-4 w-4" />
                  <AlertTitle>AI Analysis Summary</AlertTitle>
                  <AlertDescription>
                    This campaign has {adsets.length} ad sets and {ads.length} ads. 
                    Click on any level to see detailed AI insights and predictions.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-md" onClick={() => onViewInsights('campaign', campaign.id, campaign.name)}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Campaign Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        View AI-powered insights for the entire campaign
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Best Performing AdSet</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        {adsets.length > 0 ? adsets[0].name : 'No adsets'} - Click for insights
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Top Ad Creative</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        {ads.length > 0 ? ads[0].name : 'No ads'} - Click for analysis
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}