"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCwIcon, DownloadIcon, SettingsIcon, PauseIcon, PlayIcon } from "lucide-react"
import { PerformanceMonitor } from "./performance-monitor"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface Campaign {
  id: string
  name: string
  status: string
  objective: string
  budgetType: string
  budgetAmount: number
  startTime?: string
  endTime?: string
}

interface CampaignDashboardProps {
  campaignId: string
}

export function CampaignDashboard({ campaignId }: CampaignDashboardProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  // Fetch campaign data
  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}?includeInsights=true`)
      if (!response.ok) throw new Error('Failed to fetch campaign')
      const data = await response.json()
      setCampaign(data)
    } catch (error) {
      console.error('Error fetching campaign:', error)
    }
  }

  // Fetch insights data
  const fetchInsights = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/insights`)
      if (!response.ok) throw new Error('Failed to fetch insights')
      const data = await response.json()
      setInsights(data.insights || [])
    } catch (error) {
      console.error('Error fetching insights:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sync with Meta
  const syncWithMeta = async () => {
    setSyncing(true)
    try {
      await fetch(`/api/campaigns/${campaignId}/insights?sync=true`)
      await fetchInsights()
    } catch (error) {
      console.error('Error syncing with Meta:', error)
    } finally {
      setSyncing(false)
    }
  }

  // Toggle campaign status
  const toggleCampaignStatus = async () => {
    if (!campaign) return
    
    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        setCampaign({ ...campaign, status: newStatus })
      }
    } catch (error) {
      console.error('Error updating campaign status:', error)
    }
  }

  useEffect(() => {
    fetchCampaign()
    fetchInsights()
  }, [campaignId])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Campaign not found</p>
        </CardContent>
      </Card>
    )
  }

  // Prepare chart data
  const chartData = insights.slice(-7).map(insight => ({
    date: new Date(insight.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    impressions: insight.impressions,
    clicks: insight.clicks,
    spend: insight.spend,
    conversions: insight.conversions || 0
  }))

  return (
    <div className="space-y-6">
      {/* Campaign Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{campaign.name}</CardTitle>
              <CardDescription className="mt-1">
                {campaign.objective} • {campaign.budgetType} Budget
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {campaign.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleCampaignStatus}
              >
                {campaign.status === 'ACTIVE' ? (
                  <>
                    <PauseIcon className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <PlayIcon className="mr-2 h-4 w-4" />
                    Resume
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Real-time Performance Monitor */}
      <PerformanceMonitor 
        campaignId={campaignId} 
        budget={campaign.budgetAmount / 100}
      />

      {/* Insights Charts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Campaign Insights</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={syncWithMeta}
                disabled={syncing}
              >
                <RefreshCwIcon className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                Sync
              </Button>
              <Button variant="outline" size="sm">
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="performance" className="space-y-4">
            <TabsList>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="spend">Spend Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="performance" className="space-y-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="impressions" 
                      stroke="#8884d8" 
                      name="Impressions"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="clicks" 
                      stroke="#82ca9d" 
                      name="Clicks"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="engagement" className="space-y-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="conversions" 
                      stackId="1"
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      name="Conversions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="spend" className="space-y-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Area 
                      type="monotone" 
                      dataKey="spend" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      name="Spend"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}