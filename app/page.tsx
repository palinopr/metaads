"use client"

import { useState, useEffect, type FormEvent, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, Settings, Loader2, RefreshCw, Info } from "lucide-react"
import Link from "next/link"
import { formatNumberWithCommas, formatCurrency, formatPercentage } from "@/lib/utils"

interface CampaignInsight {
  impressions?: string
  clicks?: string
  ctr?: string
  cpc?: string
  actions?: Array<{ action_type: string; value: string }>
  action_values?: Array<{ action_type: string; value: string }>
}

interface RawCampaignData {
  id: string
  name: string
  spend?: string
  created_time: string
  insights?: { data: CampaignInsight[] }
}

interface ProcessedCampaign {
  id: string
  name: string
  spend: number
  revenue: number
  conversions: number
  roas: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  created_time: string
}

interface FetchError {
  error: string
  details?: any
}

const findActionValue = (
  items: Array<{ action_type: string; value: string }> | undefined,
  targetActionType: string,
): number => {
  if (!items) return 0
  const purchaseActionTypes = [targetActionType, "omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase"]
  return items
    .filter((item) => purchaseActionTypes.includes(item.action_type))
    .reduce((sum, item) => sum + Number.parseFloat(item.value || "0"), 0)
}

export default function HomePage() {
  const [accessToken, setAccessToken] = useState("")
  const [adAccountId, setAdAccountId] = useState("")
  const [credentialsSubmitted, setCredentialsSubmitted] = useState(false)

  const [campaignsData, setCampaignsData] = useState<ProcessedCampaign[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState<FetchError | null>(null)
  const [showSettings, setShowSettings] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem("metaAccessToken")
    const storedAccountId = localStorage.getItem("metaAdAccountId")
    if (storedToken && storedAccountId) {
      setAccessToken(storedToken)
      setAdAccountId(storedAccountId)
      setCredentialsSubmitted(true)
      setShowSettings(false)
    } else {
      setShowSettings(true)
    }
  }, [])

  const fetchMetaAdsData = useCallback(
    async (isRefresh = false) => {
      if (!accessToken || !adAccountId) {
        setFetchError({ error: "Credentials are not set. Please enter them in settings." })
        return
      }
      if (!isRefresh) setIsLoading(true)
      else setIsRefreshing(true)
      setFetchError(null)

      try {
        const res = await fetch(`/api/meta`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken, adAccountId }),
        })
        const responseData = await res.json()
        if (!res.ok) {
          setFetchError({
            error: `Failed to fetch ads data. API responded with: ${responseData.error || res.statusText}`,
            details: responseData.details,
          })
          setCampaignsData([])
          return
        }
        if (!responseData.data || responseData.data.length === 0) {
          setCampaignsData([])
          if (responseData.error) {
            setFetchError({
              error: `Meta API Error: ${responseData.error.message || "Unknown error"}`,
              details: responseData.error,
            })
          }
          return
        }
        const processedData = responseData.data.map((campaign: RawCampaignData): ProcessedCampaign => {
          const insight = campaign.insights?.data?.[0] || {}
          const spend = Number.parseFloat(campaign.spend || "0")
          const revenue = findActionValue(insight.action_values, "omni_purchase")
          const conversions = findActionValue(insight.actions, "omni_purchase")
          const roas = spend > 0 ? revenue / spend : 0
          const impressions = Number.parseInt(insight.impressions || "0", 10)
          const clicks = Number.parseInt(insight.clicks || "0", 10)
          const ctr = Number.parseFloat(insight.ctr || "0")
          const cpc = Number.parseFloat(insight.cpc || "0")
          return {
            id: campaign.id,
            name: campaign.name,
            spend,
            revenue,
            conversions: Math.round(conversions),
            roas,
            impressions,
            clicks,
            ctr,
            cpc,
            created_time: campaign.created_time,
          }
        })
        setCampaignsData(processedData)
      } catch (error: any) {
        setFetchError({ error: error.message || "An unknown error occurred." })
        setCampaignsData([])
      } finally {
        if (!isRefresh) setIsLoading(false)
        else setIsRefreshing(false)
      }
    },
    [accessToken, adAccountId],
  )

  useEffect(() => {
    if (credentialsSubmitted && accessToken && adAccountId) {
      fetchMetaAdsData()
    }
  }, [credentialsSubmitted, accessToken, adAccountId, fetchMetaAdsData])

  const handleCredentialSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!accessToken || !adAccountId) {
      setFetchError({ error: "Access Token and Ad Account ID are required." })
      return
    }
    setFetchError(null)
    localStorage.setItem("metaAccessToken", accessToken)
    localStorage.setItem("metaAdAccountId", adAccountId)
    setCredentialsSubmitted(true)
    setShowSettings(false)
  }

  const clearCredentials = () => {
    localStorage.removeItem("metaAccessToken")
    localStorage.removeItem("metaAdAccountId")
    setAccessToken("")
    setAdAccountId("")
    setCredentialsSubmitted(false)
    setCampaignsData([])
    setFetchError(null)
    setShowSettings(true)
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8 space-y-6 min-h-screen">
      <div className="flex flex-wrap justify-between items-center gap-4 border-b pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Meta Ads Dashboard</h1>
        <div className="flex items-center gap-2">
          {credentialsSubmitted && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchMetaAdsData(true)}
              disabled={isRefreshing || isLoading}
            >
              {isRefreshing ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
              <span className="sr-only">Refresh Data</span>
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-5 w-5" />
            <span className="sr-only">Toggle Settings</span>
          </Button>
        </div>
      </div>

      {showSettings && (
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">API Credentials</CardTitle>
            <CardDescription>Enter Meta Ads API Access Token & Ad Account ID. Stored in your browser.</CardDescription>
          </CardHeader>
          <form onSubmit={handleCredentialSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="EAA..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adAccountId">Ad Account ID</Label>
                <Input
                  id="adAccountId"
                  type="text"
                  placeholder="act_1234567890"
                  value={adAccountId}
                  onChange={(e) => setAdAccountId(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={clearCredentials}
                className="text-sm text-muted-foreground hover:text-foreground w-full sm:w-auto"
              >
                Clear Credentials
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isRefreshing || !accessToken || !adAccountId}
                className="text-sm w-full sm:w-auto"
              >
                {(isLoading && !campaignsData.length) || isRefreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save & Fetch Data
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {!credentialsSubmitted && !showSettings && (
        <Alert className="max-w-lg mx-auto">
          <Info className="h-4 w-4" />
          <AlertTitle>Credentials Required</AlertTitle>
          <AlertDescription>
            Please enter credentials. Click <Settings className="inline h-4 w-4 mx-1" /> icon.
          </AlertDescription>
        </Alert>
      )}

      {fetchError && (
        <Alert variant="destructive" className="max-w-2xl mx-auto shadow-md">
          <Terminal className="h-4 w-4" />
          <AlertTitle className="font-semibold">Error Fetching Data</AlertTitle>
          <AlertDescription>
            <p className="mb-1">{fetchError.error}</p>
            {fetchError.details && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer hover:underline">Details</summary>
                <pre className="mt-1 bg-muted p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(fetchError.details, null, 2)}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && campaignsData.length === 0 && (
        <div className="flex flex-col justify-center items-center py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg mt-4 text-muted-foreground">Loading Campaign Data...</p>
        </div>
      )}

      {!isLoading && !fetchError && credentialsSubmitted && campaignsData.length === 0 && (
        <Alert className="max-w-lg mx-auto">
          <Info className="h-4 w-4" />
          <AlertTitle>No Campaign Data</AlertTitle>
          <AlertDescription>
            No campaigns found or data is processing. Try refreshing or check Meta Ads Manager.
          </AlertDescription>
        </Alert>
      )}

      {credentialsSubmitted && campaignsData.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Campaign Performance</CardTitle>
            <CardDescription>Sorted by creation date (newest first). All currency in USD.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px] min-w-[200px]">Campaign Name</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead className="text-right">Impr.</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">CPC</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignsData.map((campaign) => (
                  <TableRow key={campaign.id} className="text-sm">
                    <TableCell className="font-medium py-3">{campaign.name}</TableCell>
                    <TableCell className="text-right py-3">{formatCurrency(campaign.spend)}</TableCell>
                    <TableCell className="text-right py-3">{formatCurrency(campaign.revenue)}</TableCell>
                    <TableCell className="text-right py-3">{campaign.roas.toFixed(2)}x</TableCell>
                    <TableCell className="text-right py-3">{formatNumberWithCommas(campaign.conversions)}</TableCell>
                    <TableCell className="text-right py-3">{formatNumberWithCommas(campaign.impressions)}</TableCell>
                    <TableCell className="text-right py-3">{formatNumberWithCommas(campaign.clicks)}</TableCell>
                    <TableCell className="text-right py-3">{formatPercentage(campaign.ctr)}</TableCell>
                    <TableCell className="text-right py-3">{formatCurrency(campaign.cpc)}</TableCell>
                    <TableCell className="text-right hidden md:table-cell py-3 text-xs text-muted-foreground">
                      {new Date(campaign.created_time).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <footer className="text-center mt-12 py-6 border-t">
        <p className="text-sm text-muted-foreground">Meta Ads Dashboard | Built with Next.js & v0</p>
        <Button variant="link" asChild className="mt-1">
          <Link href="/about">About This App</Link>
        </Button>
      </footer>
    </div>
  )
}
