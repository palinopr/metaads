"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugSpendPage() {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDebug = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/debug-lifetime-spend')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      setDebugData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Lifetime Spend</h1>
      
      <Button onClick={runDebug} disabled={loading} className="mb-6">
        {loading ? 'Running Debug...' : 'Run Debug Test'}
      </Button>

      {error && (
        <Card className="mb-6 border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-500">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {debugData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Level Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugData.debug.account, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spend Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Account Level Spend: <strong>${debugData.debug.comparison.accountLevelSpend.toFixed(2)}</strong></p>
                <p>Campaigns Sum: <strong>${debugData.debug.comparison.campaignsSumSpend.toFixed(2)}</strong></p>
                <p>Insights API: <strong>${debugData.debug.comparison.insightsSpend.toFixed(2)}</strong></p>
                <p className="text-red-500">Your Dashboard Shows: <strong>${debugData.debug.comparison.yourDashboardShows.toFixed(2)}</strong></p>
                <p className="text-green-500">Meta Web Shows: <strong>${debugData.debug.comparison.metaWebInterfaceShows.toFixed(2)}</strong></p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Raw Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}