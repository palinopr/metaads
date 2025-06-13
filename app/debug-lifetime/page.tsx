"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugLifetimePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDebug = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-lifetime-metrics')
      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setData({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Debug Lifetime Metrics</h1>
      
      <Button onClick={runDebug} disabled={loading} className="mb-6">
        {loading ? 'Analyzing...' : 'Analyze Lifetime Data'}
      </Button>

      {data && !data.error && (
        <div className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Spend Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Account Level (amount_spent): <strong className="text-green-400">${data.summary?.accountLevelSpend?.toLocaleString()}</strong></p>
                <p>Sum of All Campaigns: <strong>${data.summary?.campaignSum?.toLocaleString()}</strong></p>
                <p>Missing/Deleted Campaigns: <strong className="text-yellow-400">${data.summary?.discrepancy?.toLocaleString()}</strong> ({data.summary?.discrepancyPercent})</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Conversion Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Standard Purchases: <strong>{data.purchases?.totalPurchases?.toLocaleString()}</strong></p>
                <p>Web Purchases: <strong className="text-blue-400">{data.purchases?.webPurchases?.toLocaleString()}</strong></p>
                <p>Omni Purchases: <strong>{data.purchases?.omniPurchases?.toLocaleString()}</strong></p>
                <p className="text-xl mt-4">Total All Conversions: <strong className="text-green-400">{data.purchases?.totalConversions?.toLocaleString()}</strong></p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Standard Revenue: <strong>${data.revenue?.totalRevenue?.toLocaleString()}</strong></p>
                <p>Web Revenue: <strong className="text-blue-400">${data.revenue?.webRevenue?.toLocaleString()}</strong></p>
                <p>Omni Revenue: <strong>${data.revenue?.omniRevenue?.toLocaleString()}</strong></p>
                <p className="text-xl mt-4">Total All Revenue: <strong className="text-green-400">${data.revenue?.combinedRevenue?.toLocaleString()}</strong></p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Campaign Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Total Campaigns Found: <strong>{data.campaigns?.total}</strong></p>
                <p>Campaigns with Data: <strong>{data.campaigns?.withInsights}</strong></p>
                <p>Pages Scanned: <strong>{data.campaigns?.pagesScanned}</strong></p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>From Campaign Aggregation</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(data.metrics?.fromCampaigns, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {data.metrics?.fromAccountInsights && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>From Account Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(data.metrics.fromAccountInsights, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {data?.error && (
        <Card className="bg-red-900/20 border-red-700">
          <CardContent className="pt-6">
            <p className="text-red-400">Error: {data.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}