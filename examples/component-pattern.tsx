// Component Pattern - MetaAds Standard
// This example shows the standard pattern for data-fetching components with proper state management

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Campaign, CampaignInsight } from "@/types"

interface CampaignDashboardProps {
  campaignId: string
  onUpdate?: (campaign: Campaign) => void
}

export function CampaignDashboard({ campaignId, onUpdate }: CampaignDashboardProps) {
  // 1. State management - group related states
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [insights, setInsights] = useState<CampaignInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  
  const router = useRouter()

  // 2. Data fetching function with error handling
  const fetchCampaignData = useCallback(async () => {
    try {
      setError(null)
      
      // Fetch campaign details
      const campaignRes = await fetch(`/api/campaigns/${campaignId}`)
      if (!campaignRes.ok) {
        throw new Error('Failed to fetch campaign')
      }
      const campaignData = await campaignRes.json()
      setCampaign(campaignData.data)

      // Fetch insights in parallel
      const insightsRes = await fetch(`/api/campaigns/${campaignId}/insights`)
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json()
        setInsights(insightsData.data || [])
      }
      
    } catch (err) {
      console.error('Error fetching campaign:', err)
      setError(err instanceof Error ? err.message : 'Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  // 3. User action handlers with optimistic updates
  const handleSync = async () => {
    setSyncing(true)
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Sync failed')
      }
      
      // Show success feedback
      toast({
        title: "Campaign synced",
        description: "Latest data from Meta has been fetched.",
      })
      
      // Refresh data
      await fetchCampaignData()
      
    } catch (err) {
      toast({
        title: "Sync failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!campaign) return
    
    // Optimistic update
    const previousStatus = campaign.status
    setCampaign({ ...campaign, status: newStatus })
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update status')
      }
      
      const updated = await response.json()
      setCampaign(updated.data)
      onUpdate?.(updated.data)
      
    } catch (err) {
      // Revert on error
      setCampaign({ ...campaign, status: previousStatus })
      toast({
        title: "Update failed",
        description: "Could not update campaign status",
        variant: "destructive",
      })
    }
  }

  // 4. Effects
  useEffect(() => {
    fetchCampaignData()
  }, [fetchCampaignData])

  // 5. Render states - Loading
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-4"
            onClick={() => {
              setError(null)
              setLoading(true)
              fetchCampaignData()
            }}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Empty state
  if (!campaign) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Campaign not found</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push('/campaigns')}
          >
            Back to Campaigns
          </Button>
        </CardContent>
      </Card>
    )
  }

  // 6. Main render with data
  return (
    <div className="space-y-6">
      {/* Campaign Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{campaign.name}</CardTitle>
            <CardDescription>
              Created {new Date(campaign.createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {campaign.status}
            </Badge>
            <Button 
              onClick={handleSync} 
              disabled={syncing}
              size="sm"
              variant="outline"
            >
              {syncing ? 'Syncing...' : 'Sync'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Insights Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {insights.map((insight) => (
          <Card key={insight.id}>
            <CardHeader className="pb-2">
              <CardDescription>{insight.metric}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{insight.value}</p>
              {insight.change && (
                <p className={`text-sm ${insight.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {insight.change > 0 ? '+' : ''}{insight.change}%
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            onClick={() => handleStatusChange('PAUSED')}
            disabled={campaign.status === 'PAUSED'}
            variant="outline"
          >
            Pause Campaign
          </Button>
          <Button
            onClick={() => handleStatusChange('ACTIVE')}
            disabled={campaign.status === 'ACTIVE'}
          >
            Activate Campaign
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Example of a list component with pagination
export function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  
  const fetchCampaigns = useCallback(async (pageNum: number) => {
    try {
      const response = await fetch(`/api/campaigns?page=${pageNum}&limit=10`)
      const data = await response.json()
      
      if (pageNum === 1) {
        setCampaigns(data.data)
      } else {
        setCampaigns(prev => [...prev, ...data.data])
      }
      
      setHasMore(data.data.length === 10)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCampaigns(page)
  }, [page, fetchCampaigns])

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
      
      {hasMore && (
        <Button
          onClick={() => setPage(p => p + 1)}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  )
}