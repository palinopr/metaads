'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Key, Save } from 'lucide-react'

// Simple, crash-proof dashboard
export default function SimpleDashboard() {
  const [token, setToken] = useState('')
  const [accountId, setAccountId] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load saved credentials
  useEffect(() => {
    const savedToken = localStorage.getItem('meta_token')
    const savedAccount = localStorage.getItem('meta_account')
    if (savedToken) setToken(savedToken)
    if (savedAccount) setAccountId(savedAccount)
  }, [])

  // Save credentials
  const saveCredentials = () => {
    localStorage.setItem('meta_token', token)
    localStorage.setItem('meta_account', accountId)
    setError('')
  }

  // Fetch data - with proper error handling
  const fetchData = async () => {
    if (!token || !accountId) {
      setError('Please enter both token and account ID')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Simple fetch - no complex logic
      const response = await fetch('/api/simple-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, accountId })
      })

      const result = await response.json()
      
      if (!response.ok) {
        setError(result.error || 'Failed to fetch data')
        return
      }

      setData(result)
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Simple Meta Ads Dashboard</h1>

      {/* Credentials Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Meta API Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Access Token</label>
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Your Meta access token..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Ad Account ID</label>
            <Input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="act_123456789"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveCredentials} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Fetch Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Data Display */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.campaigns?.map((campaign: any) => (
            <Card key={campaign.id}>
              <CardHeader>
                <CardTitle className="text-lg">{campaign.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium">{campaign.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Spend:</span>
                    <span className="font-medium">${campaign.spend || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impressions:</span>
                    <span className="font-medium">{campaign.impressions || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-8 text-sm text-gray-500">
        <p>Tips:</p>
        <ul className="list-disc list-inside">
          <li>Get token from: https://developers.facebook.com/tools/explorer/</li>
          <li>Account ID should start with "act_"</li>
          <li>This simple version won't crash</li>
        </ul>
      </div>
    </div>
  )
}