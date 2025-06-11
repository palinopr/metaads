'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestDebugPage() {
  const [campaignId, setCampaignId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testCampaignDetails = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Get credentials from storage
      const credsResponse = await fetch('/api/credentials-simple')
      const credsData = await credsResponse.json()
      
      if (!credsData.success) {
        setResult({ error: 'No credentials found' })
        return
      }

      // Test campaign details
      const response = await fetch('/api/debug-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId,
          accessToken: credsData.credentials.accessToken,
          adAccountId: credsData.credentials.adAccountId,
          type: 'campaign_details',
          datePreset: 'last_30d'
        })
      })

      const data = await response.json()
      setResult({ status: response.status, data })
    } catch (error: any) {
      setResult({
        status: 'error',
        data: { error: error.message }
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Debug Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="campaignId">Campaign ID</Label>
            <Input
              id="campaignId"
              type="text"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              placeholder="Enter campaign ID (e.g., 120212686948790433)"
            />
            <p className="text-sm text-gray-500 mt-1">
              You can find campaign IDs in the main dashboard URL when you click on a campaign
            </p>
          </div>

          <Button 
            onClick={testCampaignDetails}
            disabled={loading || !campaignId}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Campaign Details API'}
          </Button>

          {result && (
            <Alert className={result.status === 200 ? 'border-green-500' : 'border-red-500'}>
              <AlertDescription>
                <pre className="text-xs overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Go to the main dashboard</li>
              <li>Click on any campaign (like "House78 - Rise and Rose - Brooklyn")</li>
              <li>Look at the URL - it will show something like `/campaign/120212686948790433`</li>
              <li>Copy the number part and paste it here</li>
              <li>Click "Test Campaign Details API" to see the raw API response</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}