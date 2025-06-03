"use client"

import { useState, useEffect, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, Settings, Loader2 } from "lucide-react"
import Link from "next/link"

interface ProcessedCampaign {
  id: string
  name: string
  spend: number
  revenue: number
  conversions: number
  roas: number
}

interface FetchError {
  error: string
  details?: any
}

// Helper function to find specific action values/types
const findActionValue = (actions: any[], actionType: string): number => {
  const purchaseActionTypes = [actionType, "omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase"]
  const action = actions?.find((a) => purchaseActionTypes.includes(a.action_type))
  return action ? Number.parseFloat(action.value) : 0
}

export default function HomePage() {
  const [accessToken, setAccessToken] = useState("")
  const [adAccountId, setAdAccountId] = useState("")
  const [credentialsSubmitted, setCredentialsSubmitted] = useState(false)

  const [campaignsData, setCampaignsData] = useState<ProcessedCampaign[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState<FetchError | null>(null)

  const [showSettings, setShowSettings] = useState(true)

  // Load credentials from localStorage if available
  useEffect(() => {
    const storedToken = localStorage.getItem("metaAccessToken")
    const storedAccountId = localStorage.getItem("metaAdAccountId")
    if (storedToken && storedAccountId) {
      setAccessToken(storedToken)
      setAdAccountId(storedAccountId)
      setCredentialsSubmitted(true) // Assume if stored, they were submitted
      setShowSettings(false) // Hide settings if loaded
    }
  }, [])

  // Fetch data when credentialsSubmitted changes and are valid
  useEffect(() => {
    if (credentialsSubmitted && accessToken && adAccountId) {
      fetchMetaAdsData()
    }
  }, [credentialsSubmitted, accessToken, adAccountId])

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
    setShowSettings(false) // Hide settings after submission
  }

  const fetchMetaAdsData = async () => {
    if (!accessToken || !adAccountId) {
      setFetchError({ error: "Credentials are not set." })
      return
    }
    setIsLoading(true)
    setFetchError(null)
    setCampaignsData([])

    try {
      const res = await fetch(`/api/meta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken, adAccountId }),
      })

      const responseData = await res.json()

      if (!res.ok) {
        setFetchError({
          error: `Failed to fetch ads data. API responded with: ${responseData.error || res.statusText}`,
          details: responseData.details,
        })
        setIsLoading(false)
        return
      }

      if (!responseData.data) {
        if (responseData.error) {
          setFetchError({
            error: `Meta API Error: ${responseData.error.message || "Unknown error"}`,
            details: responseData.error,
          })
        } else {
          setFetchError({ error: "No campaign data found or unexpected format." })
        }
        setCampaignsData([])
        setIsLoading(false)
        return
      }

      const processedData = responseData.data.map((campaign: any): ProcessedCampaign => {
        const spend = Number.parseFloat(campaign.spend || "0")
        const revenue = findActionValue(campaign.insights?.data?.[0]?.action_values, "omni_purchase")
        const conversions = findActionValue(campaign.insights?.data?.[0]?.actions, "omni_purchase")
        const roas = spend > 0 ? revenue / spend : 0
        return {
          id: campaign.id,
          name: campaign.name,
          spend,
          revenue,
          conversions: Math.round(conversions),
          roas,
        }
      })
      setCampaignsData(processedData)
    } catch (error: any) {
      console.error("Error in fetchMetaAdsData:", error)
      setFetchError({ error: error.message || "An unknown error occurred while fetching data." })
    } finally {
      setIsLoading(false)
    }
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
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Meta Ads Dashboard</h1>
        <Button variant="outline" size="icon" onClick={() => setShowSettings(!showSettings)}>
          <Settings className="h-5 w-5" />
          <span className="sr-only">Toggle Settings</span>
        </Button>
      </div>

      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>API Credentials</CardTitle>
            <CardDescription>Enter your Meta Ads API Access Token and Ad Account ID.</CardDescription>
          </CardHeader>
          <form onSubmit={handleCredentialSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  type="password" // Keep as password for basic obfuscation
                  placeholder="Enter your Access Token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adAccountId">Ad Account ID (e.g., act_123...)</Label>
                <Input
                  id="adAccountId"
                  type="text"
                  placeholder="Enter your Ad Account ID"
                  value={adAccountId}
                  onChange={(e) => setAdAccountId(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="ghost" onClick={clearCredentials}>
                Clear Credentials
              </Button>
              <Button type="submit" disabled={isLoading || !accessToken || !adAccountId}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save & Fetch Data
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {!credentialsSubmitted && !showSettings && (
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Credentials Required</AlertTitle>
          <AlertDescription>
            Please enter your Meta API credentials in the settings panel to fetch data. Click the{" "}
            <Settings className="inline h-4 w-4" /> icon to open settings.
          </AlertDescription>
        </Alert>
      )}

      {fetchError && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <p>{fetchError.error}</p>
            {fetchError.details && (
              <pre className="mt-2 text-xs bg-muted p-2 rounded">{JSON.stringify(fetchError.details, null, 2)}</pre>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Loading Campaign Data...</p>
        </div>
      )}

      {!isLoading && !fetchError && credentialsSubmitted && campaignsData.length === 0 && (
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>No Campaign Data</AlertTitle>
          <AlertDescription>
            No campaign data was returned. This could be due to no active campaigns, an issue with the API response, or
            incorrect credentials.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !fetchError && credentialsSubmitted && campaignsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Overview of your Facebook Ads campaigns.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignsData.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>{campaign.name}</TableCell>
                    <TableCell className="text-right">${campaign.spend.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${campaign.revenue.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{campaign.conversions}</TableCell>
                    <TableCell className="text-right">{campaign.roas.toFixed(2)}x</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Optional: Link to About page from starter */}
      <div className="text-center mt-12">
        <Button variant="link" asChild>
          <Link href="/about">About This App</Link>
        </Button>
      </div>
    </div>
  )
}
