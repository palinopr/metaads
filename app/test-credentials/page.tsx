'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestCredentialsPage() {
  const [accessToken, setAccessToken] = useState('')
  const [adAccountId, setAdAccountId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testCredentials = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Test the credentials
      const response = await fetch('/api/meta-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          adAccountId,
          type: 'test_connection'
        })
      })

      const data = await response.json()
      setResult({ status: response.status, data })

      // If successful, save to credentials API
      if (response.ok && data.success) {
        const saveResponse = await fetch('/api/credentials-simple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken,
            adAccountId
          })
        })

        if (saveResponse.ok) {
          setResult(prev => ({
            ...prev,
            saved: true,
            saveMessage: 'Credentials saved successfully!'
          }))
        }
      }
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
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Meta Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="accessToken">Access Token</Label>
            <Input
              id="accessToken"
              type="text"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Paste your access token here"
              className="font-mono text-sm"
            />
            <p className="text-sm text-gray-500 mt-1">
              From Facebook Graph API Explorer
            </p>
          </div>

          <div>
            <Label htmlFor="adAccountId">Ad Account ID</Label>
            <Input
              id="adAccountId"
              type="text"
              value={adAccountId}
              onChange={(e) => setAdAccountId(e.target.value)}
              placeholder="act_123456789"
            />
            <p className="text-sm text-gray-500 mt-1">
              Format: act_ followed by numbers
            </p>
          </div>

          <Button 
            onClick={testCredentials}
            disabled={loading || !accessToken || !adAccountId}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Credentials'}
          </Button>

          {result && (
            <Alert className={result.status === 200 ? 'border-green-500' : 'border-red-500'}>
              <AlertDescription>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}

          {result?.saved && (
            <Alert className="border-green-500">
              <AlertDescription>
                {result.saveMessage} You can now go to the{' '}
                <a href="/dashboard" className="underline font-semibold">
                  Dashboard
                </a>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}