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
  const [checkingAccount, setCheckingAccount] = useState(false)

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

  const checkAccountAccess = async () => {
    setCheckingAccount(true)
    setResult(null)

    try {
      const response = await fetch('/api/check-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          adAccountId
        })
      })

      const data = await response.json()
      setResult({ 
        status: response.status, 
        data,
        type: 'account-check'
      })
    } catch (error: any) {
      setResult({
        status: 'error',
        data: { error: error.message },
        type: 'account-check'
      })
    } finally {
      setCheckingAccount(false)
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

          <div className="flex gap-2">
            <Button 
              onClick={checkAccountAccess}
              disabled={checkingAccount || !accessToken || !adAccountId}
              variant="outline"
              className="flex-1"
            >
              {checkingAccount ? 'Checking...' : 'Check Account Access'}
            </Button>
            <Button 
              onClick={testCredentials}
              disabled={loading || !accessToken || !adAccountId}
              className="flex-1"
            >
              {loading ? 'Testing...' : 'Test Credentials'}
            </Button>
          </div>

          {result && (
            <Alert className={result.status === 200 ? 'border-green-500' : 'border-red-500'}>
              <AlertDescription>
                {result.type === 'account-check' && result.data.availableAccounts && (
                  <div className="space-y-2">
                    <p className="font-semibold text-red-600">
                      Account {result.data.requestedAccount} is not accessible with this token.
                    </p>
                    <p className="text-sm">
                      You have access to {result.data.totalAccounts} accounts. Here are some you can use:
                    </p>
                    <div className="max-h-40 overflow-y-auto border rounded p-2 text-xs">
                      {result.data.availableAccounts.slice(0, 10).map((acc: any) => (
                        <div key={acc.id} className="py-1">
                          <span className="font-mono">{acc.id}</span> - {acc.name || 'Unnamed'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(!result.type || result.type !== 'account-check' || !result.data.availableAccounts) && (
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
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