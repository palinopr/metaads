'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function OAuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [localStorageInfo, setLocalStorageInfo] = useState<any>(null)

  useEffect(() => {
    // Check localStorage
    if (typeof window !== 'undefined') {
      const metaAdsCredentials = localStorage.getItem('metaAdsCredentials')
      const fbAccessToken = localStorage.getItem('fb_access_token')
      const fbSelectedAccount = localStorage.getItem('fb_selected_account')
      
      setLocalStorageInfo({
        hasMetaAdsCredentials: !!metaAdsCredentials,
        metaAdsCredentials: metaAdsCredentials ? JSON.parse(metaAdsCredentials) : null,
        hasFbAccessToken: !!fbAccessToken,
        hasFbSelectedAccount: !!fbSelectedAccount,
        fbAccessToken: fbAccessToken,
        fbSelectedAccount: fbSelectedAccount
      })
    }
  }, [])

  const runDebugCheck = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/oauth/verify')
      const data = await response.json()
      setDebugInfo(data)
    } catch (error: any) {
      setDebugInfo({ error: error.message })
    }
    setLoading(false)
  }

  const fixCredentials = async () => {
    if (!localStorageInfo?.metaAdsCredentials) {
      alert('No credentials found in localStorage')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/oauth/fix-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(localStorageInfo.metaAdsCredentials)
      })
      
      const data = await response.json()
      if (data.success) {
        alert('Credentials fixed! Refreshing...')
        window.location.reload()
      } else {
        alert('Error: ' + (data.error || 'Failed to fix credentials'))
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
    setLoading(false)
  }

  const clearAllData = () => {
    if (confirm('This will clear all OAuth data. Continue?')) {
      // Clear localStorage
      localStorage.removeItem('metaAdsCredentials')
      localStorage.removeItem('fb_access_token')
      localStorage.removeItem('fb_selected_account')
      
      // Clear cookies via API
      fetch('/api/oauth/status', { method: 'DELETE' })
        .then(() => {
          alert('All data cleared. Redirecting to OAuth setup...')
          window.location.href = '/oauth-setup'
        })
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">OAuth Debug Console</h1>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Actions</CardTitle>
              <CardDescription className="text-gray-400">
                Debug and fix OAuth issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={runDebugCheck} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Run Debug Check
                </Button>
                <Button 
                  onClick={fixCredentials} 
                  disabled={loading || !localStorageInfo?.metaAdsCredentials}
                  variant="secondary"
                >
                  Fix Credentials from localStorage
                </Button>
                <Button onClick={clearAllData} variant="destructive">
                  Clear All Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {localStorageInfo && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">localStorage Status</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-gray-300 overflow-auto">
                  {JSON.stringify(localStorageInfo, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {debugInfo && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Debug Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Cookie Status */}
                  <div>
                    <h3 className="text-white font-medium mb-2">Cookie Status</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {debugInfo.cookies?.hasAccessToken ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-gray-300 text-sm">
                          Access Token: {debugInfo.cookies?.hasAccessToken ? 'Present' : 'Missing'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {debugInfo.cookies?.hasSelectedAccount ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-gray-300 text-sm">
                          Selected Account: {debugInfo.cookies?.selectedAccount || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* API Tests */}
                  {debugInfo.apiTests && (
                    <div>
                      <h3 className="text-white font-medium mb-2">API Tests</h3>
                      <div className="space-y-2">
                        {debugInfo.apiTests.directTest && (
                          <div className="flex items-center gap-2">
                            {debugInfo.apiTests.directTest.success ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-gray-300 text-sm">
                              Direct Meta API Test: {debugInfo.apiTests.directTest.success ? 'Success' : 'Failed'}
                            </span>
                          </div>
                        )}
                        {debugInfo.apiTests.viaOurApi && (
                          <div className="flex items-center gap-2">
                            {debugInfo.apiTests.viaOurApi.success ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-gray-300 text-sm">
                              Via Our API: {debugInfo.apiTests.viaOurApi.success ? 'Success' : 'Failed'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {debugInfo.recommendations && debugInfo.recommendations.length > 0 && (
                    <div>
                      <h3 className="text-white font-medium mb-2">Recommendations</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {debugInfo.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="text-yellow-400 text-sm">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Raw Debug Data */}
                  <div>
                    <h3 className="text-white font-medium mb-2">Raw Debug Data</h3>
                    <pre className="text-xs text-gray-300 overflow-auto bg-gray-900 p-2 rounded">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}