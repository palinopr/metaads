"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestSpendPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [datePreset, setDatePreset] = useState('lifetime')

  const testAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/direct-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'overview',
          datePreset: datePreset
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

  const calculateTotalSpend = () => {
    if (!data?.campaigns) return 0
    return data.campaigns.reduce((sum: number, c: any) => sum + (c.spend || 0), 0)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Test Direct Meta API</h1>
      
      <div className="flex gap-4 mb-6">
        <select 
          value={datePreset} 
          onChange={(e) => setDatePreset(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last_7d">Last 7 Days</option>
          <option value="last_30d">Last 30 Days</option>
          <option value="lifetime">Lifetime</option>
        </select>
        
        <Button onClick={testAPI} disabled={loading}>
          {loading ? 'Testing...' : 'Test API'}
        </Button>
      </div>

      {data && (
        <div className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>API Response Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Date Preset: <strong>{datePreset}</strong></p>
                <p>Success: <strong>{data.success ? 'Yes' : 'No'}</strong></p>
                <p>Campaign Count: <strong>{data.campaigns?.length || 0}</strong></p>
                <p className="text-xl">
                  Calculated Total Spend: <strong className="text-green-400">
                    ${calculateTotalSpend().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </p>
                {data.debug && (
                  <>
                    <p>Debug Total Spend: <strong>${data.debug.totalSpend?.toFixed(2)}</strong></p>
                    <p>Debug Date Preset: <strong>{data.debug.datePreset}</strong></p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {data.campaigns && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Top 5 Campaigns by Spend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.campaigns
                    .filter((c: any) => c.spend > 0)
                    .sort((a: any, b: any) => b.spend - a.spend)
                    .slice(0, 5)
                    .map((campaign: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-sm">{campaign.name}</span>
                        <span className="text-sm font-mono">${campaign.spend.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Raw Response</CardTitle>
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