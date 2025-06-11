"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Settings, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Activity,
  AlertCircle,
  Bug,
  Eye,
  EyeOff,
  ChevronRight,
  BarChart3,
  Calendar,
  TrendingDown,
  Zap
} from "lucide-react"
import { MetaAPIClient, formatAccessToken, formatAdAccountId, processInsights } from "@/lib/meta-api-client"
import { MetaAPIEnhanced } from "@/lib/meta-api-enhanced"
import { DebugPanel } from "@/components/debug-panel"
import { CampaignDetail } from "@/components/campaign-detail"
import { formatCurrency, formatNumberWithCommas, formatPercentage } from "@/lib/utils"
import { cn } from "@/lib/utils"

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
}

export default function MetaAdsDashboardV3() {
  // View state
  const [view, setView] = useState<'dashboard' | 'campaign-detail'>('dashboard')
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  
  // Credentials state
  const [accessToken, setAccessToken] = useState("")
  const [adAccountId, setAdAccountId] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isDebugOpen, setIsDebugOpen] = useState(false)

  // Data state
  const [campaigns, setCampaigns] = useState<EnhancedCampaign[]>([])
  const [accountInfo, setAccountInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Stats
  const [stats, setStats] = useState({
    totalSpend: 0,
    totalRevenue: 0,
    totalConversions: 0,
    avgROAS: 0,
    activeCampaigns: 0,
    todaySpend: 0,
    todayConversions: 0,
    topPerformer: null as string | null,
    worstPerformer: null as string | null
  })

  // Load saved credentials
  useEffect(() => {
    const savedToken = localStorage.getItem("metaAccessToken")
    const savedAccountId = localStorage.getItem("metaAdAccountId")
    
    if (savedToken && savedAccountId) {
      setAccessToken(savedToken)
      setAdAccountId(savedAccountId)
    } else {
      setShowSettings(true)
    }
  }, [])

  // Test connection when credentials are loaded
  const testConnection = useCallback(async () => {
    if (!accessToken || !adAccountId) return

    try {
      const client = new MetaAPIClient(accessToken, adAccountId)
      const result = await client.testConnection()
      
      if (result.success) {
        setAccountInfo(result.accountInfo)
        setError(null)
        return true
      } else {
        setError(result.error || "Connection failed")
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      return false
    }
  }, [accessToken, adAccountId])

  // Fetch campaigns with enhanced data
  const fetchCampaigns = useCallback(async () => {
    if (!accessToken || !adAccountId) return

    setIsLoading(true)
    setError(null)

    try {
      const client = new MetaAPIClient(accessToken, adAccountId)
      
      // Test connection first
      const connectionOk = await testConnection()
      if (!connectionOk) {
        setIsLoading(false)
        return
      }

      // Fetch campaigns
      const campaignsData = await client.getCampaigns()
      
      // Process campaigns with enhanced metrics
      const processedCampaigns: EnhancedCampaign[] = await Promise.all(
        campaignsData.map(async (campaign) => {
          const insights = campaign.insights?.data?.[0]
          const processed = processInsights(insights)
          
          // Get today's data
          let todayData = null
          try {
            todayData = await client.getCampaignTodayData(campaign.id)
          } catch (err) {
            console.error(`Failed to get today's data for campaign ${campaign.id}:`, err)
          }

          // Calculate days running
          const createdDate = new Date(campaign.created_time)
          const today = new Date()
          const daysRunning = Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

          // Calculate performance score (0-100)
          let performanceScore = 50
          if (processed) {
            if (processed.roas > 3) performanceScore = 90
            else if (processed.roas > 2) performanceScore = 80
            else if (processed.roas > 1.5) performanceScore = 70
            else if (processed.roas > 1) performanceScore = 60
            else if (processed.roas > 0.5) performanceScore = 40
            else performanceScore = 20

            // Adjust for CTR
            if (processed.ctr > 2) performanceScore += 10
            else if (processed.ctr < 0.5) performanceScore -= 10

            performanceScore = Math.max(0, Math.min(100, performanceScore))
          }

          return {
            ...campaign,
            insights: processed,
            todayData: processInsights(todayData),
            daysRunning,
            lifetimeROAS: processed?.roas || 0,
            performanceScore,
            trend: 'stable' as 'up' | 'down' | 'stable' // Would need historical data to calculate
          }
        })
      )

      // Sort by performance score
      processedCampaigns.sort((a, b) => b.performanceScore - a.performanceScore)

      // Calculate stats
      const stats = processedCampaigns.reduce((acc, campaign) => {
        if (campaign.insights) {
          acc.totalSpend += campaign.insights.spend
          acc.totalRevenue += campaign.insights.revenue
          acc.totalConversions += campaign.insights.conversions
        }
        
        if (campaign.todayData) {
          acc.todaySpend += campaign.todayData.spend
          acc.todayConversions += campaign.todayData.conversions
        }

        if (campaign.effective_status === 'ACTIVE') {
          acc.activeCampaigns++
        }

        return acc
      }, {
        totalSpend: 0,
        totalRevenue: 0,
        totalConversions: 0,
        todaySpend: 0,
        todayConversions: 0,
        activeCampaigns: 0
      })

      const avgROAS = stats.totalSpend > 0 ? stats.totalRevenue / stats.totalSpend : 0
      const topPerformer = processedCampaigns[0]?.name || null
      const worstPerformer = processedCampaigns[processedCampaigns.length - 1]?.name || null

      setCampaigns(processedCampaigns)
      setStats({
        ...stats,
        avgROAS,
        topPerformer,
        worstPerformer
      })
      setLastRefresh(new Date())
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch campaigns")
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, adAccountId, testConnection])

  // Save credentials and fetch data
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!accessToken || !adAccountId) {
      setError("Please provide both access token and account ID")
      return
    }

    // Format and save credentials
    const formattedToken = formatAccessToken(accessToken)
    const formattedAccountId = formatAdAccountId(adAccountId)

    localStorage.setItem("metaAccessToken", formattedToken)
    localStorage.setItem("metaAdAccountId", formattedAccountId)

    setAccessToken(formattedToken)
    setAdAccountId(formattedAccountId)
    
    // Test and fetch
    const success = await testConnection()
    if (success) {
      setShowSettings(false)
      fetchCampaigns()
    }
  }

  // Clear everything
  const handleClearCredentials = () => {
    localStorage.removeItem("metaAccessToken")
    localStorage.removeItem("metaAdAccountId")
    setAccessToken("")
    setAdAccountId("")
    setCampaigns([])
    setAccountInfo(null)
    setStats({
      totalSpend: 0,
      totalRevenue: 0,
      totalConversions: 0,
      avgROAS: 0,
      activeCampaigns: 0,
      todaySpend: 0,
      todayConversions: 0,
      topPerformer: null,
      worstPerformer: null
    })
    setShowSettings(true)
  }

  // Navigate to campaign detail
  const viewCampaignDetail = (campaignId: string) => {
    setSelectedCampaignId(campaignId)
    setView('campaign-detail')
  }

  // Auto-fetch on mount if credentials exist
  useEffect(() => {
    if (accessToken && adAccountId && !showSettings) {
      fetchCampaigns()
    }
  }, [accessToken, adAccountId, showSettings, fetchCampaigns])

  // Show campaign detail view
  if (view === 'campaign-detail' && selectedCampaignId) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <CampaignDetail
            campaignId={selectedCampaignId}
            accessToken={accessToken}
            adAccountId={adAccountId}
            onBack={() => setView('dashboard')}
          />
        </div>
      </div>
    )
  }

  // Dashboard view
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Meta Ads Dashboard Pro</h1>
            <p className="text-muted-foreground mt-2">
              Advanced campaign tracking with historical analysis
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDebugOpen(!isDebugOpen)}
            >
              <Bug className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            {!showSettings && (
              <Button
                onClick={fetchCampaigns}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Connect your Meta Ads account to start tracking performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCredentials} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="access-token">Access Token</Label>
                  <div className="relative">
                    <Input
                      id="access-token"
                      type={showToken ? "text" : "password"}
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Your Meta API access token"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Don't worry about "Bearer " prefix - we'll add it automatically
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-id">Ad Account ID</Label>
                  <Input
                    id="account-id"
                    value={adAccountId}
                    onChange={(e) => setAdAccountId(e.target.value)}
                    placeholder="act_123456789 or just 123456789"
                  />
                  <p className="text-sm text-muted-foreground">
                    We'll add "act_" prefix if needed
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    Save & Connect
                  </Button>
                  {(accessToken || adAccountId) && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClearCredentials}
                    >
                      Clear Credentials
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Account Info */}
        {accountInfo && !showSettings && (
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Account Name</p>
                  <p className="font-medium">{accountInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p className="font-medium">{accountInfo.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timezone</p>
                  <p className="font-medium">{accountInfo.timezone_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Refresh</p>
                  <p className="font-medium">
                    {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Spend</p>
                  <p className="font-medium">
                    {formatCurrency(parseFloat(accountInfo.amount_spent || '0') / 100)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Stats Cards */}
        {!showSettings && campaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalSpend)}</div>
                <p className="text-xs text-muted-foreground">
                  Today: {formatCurrency(stats.todaySpend)}
                </p>
                <Progress 
                  value={(stats.todaySpend / (stats.totalSpend / 30)) * 100} 
                  className="h-1 mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <div className="flex items-center text-xs">
                  {stats.avgROAS >= 1 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={stats.avgROAS >= 1 ? 'text-green-500' : 'text-red-500'}>
                    {stats.avgROAS.toFixed(2)}x ROAS
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumberWithCommas(stats.totalConversions)}</div>
                <p className="text-xs text-muted-foreground">
                  Today: {stats.todayConversions}
                </p>
                <Progress 
                  value={(stats.todayConversions / (stats.totalConversions / 30)) * 100} 
                  className="h-1 mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
                <p className="text-xs text-muted-foreground">
                  of {campaigns.length} total
                </p>
                <div className="flex gap-1 mt-2">
                  {campaigns.slice(0, 5).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full",
                        i < stats.activeCampaigns ? "bg-green-500" : "bg-gray-300"
                      )}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top/Worst Performer Cards */}
        {!showSettings && campaigns.length > 0 && (stats.topPerformer || stats.worstPerformer) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.topPerformer && (
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-green-500" />
                    Top Performer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-lg">{stats.topPerformer}</p>
                  <p className="text-sm text-muted-foreground">
                    Leading in ROAS and overall performance
                  </p>
                </CardContent>
              </Card>
            )}

            {stats.worstPerformer && (
              <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Needs Attention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-lg">{stats.worstPerformer}</p>
                  <p className="text-sm text-muted-foreground">
                    Consider optimizing or pausing this campaign
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Enhanced Campaigns Table */}
        {!showSettings && campaigns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>
                Click on any campaign to view detailed historical data and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Campaign</th>
                      <th className="text-left p-2">Performance</th>
                      <th className="text-right p-2">Lifetime</th>
                      <th className="text-right p-2">Today</th>
                      <th className="text-right p-2">ROAS</th>
                      <th className="text-right p-2">Budget</th>
                      <th className="text-center p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => (
                      <tr 
                        key={campaign.id} 
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {campaign.objective} • {campaign.daysRunning} days
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Progress 
                                value={campaign.performanceScore} 
                                className="h-2"
                              />
                            </div>
                            <span className="text-xs font-medium w-10 text-right">
                              {campaign.performanceScore}%
                            </span>
                          </div>
                          <Badge
                            variant={campaign.effective_status === 'ACTIVE' ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {campaign.effective_status}
                          </Badge>
                        </td>
                        <td className="text-right p-2">
                          <div className="font-medium">
                            {formatCurrency(campaign.insights?.spend || 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(campaign.insights?.revenue || 0)} rev
                          </div>
                        </td>
                        <td className="text-right p-2">
                          {campaign.todayData ? (
                            <>
                              <div className="font-medium">
                                {formatCurrency(campaign.todayData.spend)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {campaign.todayData.conversions} conv
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="text-right p-2">
                          <div className={cn(
                            "font-medium",
                            campaign.lifetimeROAS >= 1 ? "text-green-600" : "text-red-600"
                          )}>
                            {campaign.lifetimeROAS.toFixed(2)}x
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {campaign.insights?.ctr?.toFixed(2) || 0}% CTR
                          </div>
                        </td>
                        <td className="text-right p-2">
                          <div className="text-xs">
                            <div>{formatCurrency(campaign.insights?.cpa || 0)} CPA</div>
                            <div>{formatCurrency(campaign.insights?.cpc || 0)} CPC</div>
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => viewCampaignDetail(campaign.id)}
                          >
                            <BarChart3 className="h-4 w-4 mr-1" />
                            View Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!showSettings && !isLoading && campaigns.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Make sure your access token has the correct permissions and your account has active campaigns.
              </p>
              <Button onClick={fetchCampaigns}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Debug Panel */}
        <DebugPanel
          accessToken={accessToken}
          adAccountId={adAccountId}
          isOpen={isDebugOpen}
          onClose={() => setIsDebugOpen(false)}
        />
      </div>
    </div>
  )
}