"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAccountInsightsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/account-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datePreset: 'lifetime'
        })
      })
      
      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setData({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Test Account Insights API</h1>
      
      <Button onClick={testAPI} disabled={loading} className="mb-6">
        {loading ? 'Testing...' : 'Test Lifetime Metrics'}
      </Button>

      {data && (
        <div className="space-y-4">
          {data.success && (
            <>
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Lifetime Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>Spend: <strong className="text-green-400">${data.metrics?.spend?.toLocaleString()}</strong></p>
                    <p>Revenue: <strong className="text-blue-400">${data.metrics?.revenue?.toLocaleString()}</strong></p>
                    <p>Conversions: <strong>{data.metrics?.conversions?.toLocaleString()}</strong></p>
                    <p>ROAS: <strong className="text-yellow-400">{data.metrics?.roas?.toFixed(2)}x</strong></p>
                    <p>Impressions: <strong>{data.metrics?.impressions?.toLocaleString()}</strong></p>
                    <p>Clicks: <strong>{data.metrics?.clicks?.toLocaleString()}</strong></p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Debug Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(data.debug, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Full Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto max-h-96">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}