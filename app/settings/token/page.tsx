'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Copy, RefreshCw, AlertCircle, CheckCircle, Key, Calendar, Shield } from 'lucide-react'
import { CredentialManager } from '@/lib/credential-manager'

export default function TokenManagementPage() {
  const [shortToken, setShortToken] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [longToken, setLongToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [savedAppSecret, setSavedAppSecret] = useState(false)

  // Check current token
  const checkCurrentToken = async () => {
    setLoading(true)
    setError('')
    
    try {
      const credentials = await CredentialManager.load()
      if (!credentials) {
        setError('No credentials found. Please configure in the main settings.')
        setLoading(false)
        return
      }

      // Debug the current token
      const response = await fetch(`https://graph.facebook.com/debug_token?input_token=${credentials.accessToken}&access_token=${credentials.accessToken}`)
      const data = await response.json()
      
      if (data.data) {
        setTokenInfo(data.data)
        
        // Check if token is expiring soon (less than 7 days)
        const expiresAt = data.data.expires_at
        const now = Math.floor(Date.now() / 1000)
        const daysLeft = Math.floor((expiresAt - now) / 86400)
        
        if (daysLeft < 7) {
          setError(`Your token expires in ${daysLeft} days. Consider extending it.`)
        }
      }
    } catch (err: any) {
      setError('Failed to check token: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Extend token
  const extendToken = async () => {
    if (!shortToken || !appSecret) {
      setError('Please provide both the short-lived token and app secret')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      // First, save app secret to localStorage (encrypted would be better in production)
      if (savedAppSecret) {
        localStorage.setItem('fb_app_secret', btoa(appSecret))
      }

      // Exchange for long-lived token
      const url = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=1349075236218599&client_secret=${appSecret}&fb_exchange_token=${shortToken}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.access_token) {
        setLongToken(data.access_token)
        
        // Calculate expiration
        const expiresInDays = Math.floor((data.expires_in || 5184000) / 86400)
        setSuccess(`Success! Your token has been extended for ${expiresInDays} days.`)
        
        // Debug the new token
        const debugResponse = await fetch(`https://graph.facebook.com/debug_token?input_token=${data.access_token}&access_token=${data.access_token}`)
        const debugData = await debugResponse.json()
        
        if (debugData.data) {
          setTokenInfo(debugData.data)
        }
      } else {
        setError(data.error?.message || 'Failed to extend token. Make sure your app secret is correct.')
      }
    } catch (err: any) {
      setError('Failed to extend token: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Save extended token to credentials
  const saveExtendedToken = async () => {
    if (!longToken) {
      setError('No extended token to save')
      return
    }

    try {
      const credentials = await CredentialManager.load()
      if (credentials) {
        await CredentialManager.save({
          ...credentials,
          accessToken: longToken
        }, true)
        
        setSuccess('Extended token saved successfully! Redirecting to dashboard...')
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      } else {
        setError('No existing credentials found. Please configure in main settings first.')
      }
    } catch (err: any) {
      setError('Failed to save token: ' + err.message)
    }
  }

  // Load saved app secret
  useState(() => {
    const saved = localStorage.getItem('fb_app_secret')
    if (saved) {
      setAppSecret(atob(saved))
      setSavedAppSecret(true)
    }
  })

  // Copy token to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Copied to clipboard!')
    setTimeout(() => setSuccess(''), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Token Management</h1>
          <p className="text-gray-400">Extend your Facebook access tokens to last 60 days</p>
        </div>

        {/* Current Token Status */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Current Token Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={checkCurrentToken} disabled={loading} className="w-full">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Check Current Token
            </Button>
            
            {tokenInfo && (
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">App ID:</span>
                  <span>{tokenInfo.app_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span>{tokenInfo.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expires:</span>
                  <span className={tokenInfo.expires_at ? 'text-yellow-400' : 'text-green-400'}>
                    {tokenInfo.expires_at 
                      ? new Date(tokenInfo.expires_at * 1000).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
                {tokenInfo.expires_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Days remaining:</span>
                    <span className={
                      Math.floor((tokenInfo.expires_at - Date.now() / 1000) / 86400) < 7 
                        ? 'text-red-400' 
                        : 'text-green-400'
                    }>
                      {Math.floor((tokenInfo.expires_at - Date.now() / 1000) / 86400)} days
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Scopes:</span>
                  <span className="text-xs">{tokenInfo.scopes?.join(', ')}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Extend Token */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Extend Access Token
            </CardTitle>
            <CardDescription>
              Convert a short-lived token (1-2 hours) to a long-lived token (60 days)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="shortToken">Short-lived Token</Label>
              <Textarea
                id="shortToken"
                value={shortToken}
                onChange={(e) => setShortToken(e.target.value)}
                placeholder="Paste your token from Graph API Explorer..."
                className="bg-gray-700 border-gray-600 h-24"
              />
              <p className="text-xs text-gray-400 mt-1">
                Get from: https://developers.facebook.com/tools/explorer/
              </p>
            </div>

            <div>
              <Label htmlFor="appSecret">App Secret</Label>
              <div className="flex gap-2">
                <Input
                  id="appSecret"
                  type="password"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  placeholder="Your app secret..."
                  className="bg-gray-700 border-gray-600"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setSavedAppSecret(!savedAppSecret)}
                  className={savedAppSecret ? 'bg-green-600' : ''}
                >
                  <Shield className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Get from: https://developers.facebook.com/apps/1349075236218599/settings/basic/
                {savedAppSecret && <span className="text-green-400 ml-2">✓ Will be saved</span>}
              </p>
            </div>

            <Button 
              onClick={extendToken} 
              disabled={loading || !shortToken || !appSecret}
              className="w-full"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Extend Token to 60 Days
            </Button>

            {longToken && (
              <div className="space-y-3">
                <div className="bg-green-900/30 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Label>Extended Token (60 days)</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(longToken)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={longToken}
                    readOnly
                    className="bg-gray-700 border-gray-600 text-xs h-20"
                  />
                </div>

                <Button 
                  onClick={saveExtendedToken}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Extended Token & Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-300">
            <ol className="list-decimal list-inside space-y-2">
              <li>Go to Facebook Graph API Explorer</li>
              <li>Select your app: "Outlet Media Method"</li>
              <li>Generate a new access token with ads permissions</li>
              <li>Copy the token and paste it above</li>
              <li>Get your app secret from Facebook App Settings</li>
              <li>Click "Extend Token" to get a 60-day token</li>
              <li>Save the extended token to use it in the dashboard</li>
            </ol>
            
            <Alert className="bg-blue-900/30 border-blue-700">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Pro Tip</AlertTitle>
              <AlertDescription>
                Check the "Will be saved" option to remember your app secret (stored locally only).
                You'll only need to paste new short-lived tokens in the future.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="bg-red-900/30 border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-900/30 border-green-700">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}