'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestDebugPage() {
  const [campaignId, setCampaignId] = useState('120224238698680525')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testCampaignDetails = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Use your new working token
      const accessToken = 'EAATKZBg465ucBO7LlPXw5pZBVFKX4edsRkiVh9Lm68YUJUMkBR2UUvlbYG4rZCwkbf6mrl2BmJroBgkThXsoqhJwfe1tYkvj8t7O550TOJ56r5AnZBJGuqR0ZApBG02aUflSmg34G9rewZBlqEgBw5l8OW7vDLUUHpBYYpgRCbaZBWrTB0SlFlOZCdxZCrZAYJRUmR6CEBMqKMx3ZAfHDPeA0ec1Td6frnuQD1y'
      const adAccountId = 'act_787610255314938'

      // Test the actual /api/meta endpoint that the dashboard uses
      const response = await fetch('/api/meta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId,
          accessToken,
          adAccountId,
          type: 'campaign_details',
          datePreset: 'last_30d'
        })
      })

      const data = await response.json()
      setResult({ 
        status: response.status, 
        data,
        campaignId,
        endpoint: '/api/meta'
      })
      
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
          <CardTitle>Test Actual Campaign Details API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="campaignId">Campaign ID</Label>
            <Input
              id="campaignId"
              type="text"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              placeholder="Enter campaign ID"
            />
          </div>

          <Button 
            onClick={testCampaignDetails}
            disabled={loading || !campaignId}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test /api/meta Campaign Details'}
          </Button>

          {result && (
            <Alert className={result.status === 200 ? 'border-green-500' : 'border-red-500'}>
              <AlertDescription>
                <div className="space-y-2">
                  <div><strong>Status:</strong> {result.status}</div>
                  <div><strong>Endpoint:</strong> {result.endpoint}</div>
                  <div><strong>Campaign ID:</strong> {result.campaignId}</div>
                  
                  {result.data?.summary && (
                    <div className="bg-green-100 p-3 rounded">
                      <strong>Summary Found!</strong>
                      <div>Spend: ${result.data.summary.spend}</div>
                      <div>Revenue: ${result.data.summary.revenue}</div>
                      <div>ROAS: {result.data.summary.roas}x</div>
                      <div>CTR: {result.data.summary.ctr}%</div>
                    </div>
                  )}
                  
                  <details>
                    <summary>Full Response</summary>
                    <pre className="text-xs overflow-auto max-h-96 mt-2">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">This will test:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>The exact same API endpoint the dashboard uses: <code>/api/meta</code></li>
              <li>With the same parameters: campaign_details type</li>
              <li>Should show if summary data is being returned</li>
              <li>Help identify why the dashboard shows zeros</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}