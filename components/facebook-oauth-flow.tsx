'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Facebook, Loader2, AlertCircle, RefreshCw } from 'lucide-react'

interface OAuthStatus {
  authenticated: boolean
  user?: any
  adAccounts?: any[]
  token?: string
}

interface FacebookOAuthFlowProps {
  onSuccess?: (data: OAuthStatus) => void
  onError?: (error: string) => void
}

export function FacebookOAuthFlow({ onSuccess, onError }: FacebookOAuthFlowProps) {
  const [status, setStatus] = useState<OAuthStatus>({ authenticated: false })
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Check current OAuth status on mount
  useEffect(() => {
    checkOAuthStatus()
  }, [])

  const checkOAuthStatus = async () => {
    try {
      setChecking(true)
      const response = await fetch('/api/oauth/status')
      const data = await response.json()
      
      setStatus(data)
      
      if (data.authenticated && onSuccess) {
        onSuccess(data)
      }
    } catch (error) {
      console.error('Error checking OAuth status:', error)
      setError('Failed to check authentication status')
    } finally {
      setChecking(false)
    }
  }

  const handleFacebookLogin = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Redirect to Facebook OAuth
      window.location.href = '/api/oauth/facebook?action=login'
    } catch (error) {
      console.error('OAuth error:', error)
      setError('Failed to initiate Facebook login')
      setLoading(false)
      if (onError) onError('Failed to initiate Facebook login')
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/oauth/status', { method: 'DELETE' })
      if (response.ok) {
        setStatus({ authenticated: false })
        setError(null)
      }
    } catch (error) {
      console.error('Logout error:', error)
      setError('Failed to logout')
    }
  }

  const handleRefreshAccounts = async () => {
    setRefreshing(true)
    setError(null)
    
    try {
      const response = await fetch('/api/oauth/refresh-accounts')
      const data = await response.json()
      
      if (data.success) {
        // Update local status with new accounts
        setStatus(prev => ({
          ...prev,
          adAccounts: data.accounts
        }))
        
        if (onSuccess) {
          onSuccess({
            ...status,
            adAccounts: data.accounts
          })
        }
        
        // Show success message
        setError(`Successfully refreshed! Found ${data.totalAccounts} accounts across ${data.pages} pages.`)
      } else {
        setError(data.error || 'Failed to refresh accounts')
      }
    } catch (error) {
      console.error('Refresh error:', error)
      setError('Failed to refresh account list')
    } finally {
      setRefreshing(false)
    }
  }

  if (checking) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Checking authentication status...</span>
        </CardContent>
      </Card>
    )
  }

  if (status.authenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            Connected to Facebook
          </CardTitle>
          <CardDescription>
            Successfully connected to your Facebook account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.user && (
            <div className="p-3 bg-green-50 rounded-md">
              <p className="text-sm font-medium">Welcome, {status.user.name}!</p>
              <p className="text-xs text-gray-600">ID: {status.user.id}</p>
            </div>
          )}
          
          {status.adAccounts && status.adAccounts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Available Ad Accounts:</h4>
              <div className="space-y-2">
                {status.adAccounts.map((account) => (
                  <div key={account.id} className="p-2 border rounded text-sm">
                    <div className="font-medium">{account.name}</div>
                    <div className="text-gray-600 text-xs">
                      ID: {account.id} • Status: {account.account_status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefreshAccounts} 
              disabled={refreshing}
              className="flex-1"
            >
              {refreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Accounts
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex-1">
              Disconnect Account
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Facebook className="h-5 w-5 text-blue-600 mr-2" />
          Connect with Facebook
        </CardTitle>
        <CardDescription>
          Connect your Facebook account to access your ad campaigns and analytics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          <Button 
            onClick={handleFacebookLogin} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <Facebook className="h-4 w-4 mr-2" />
                Connect with Facebook
              </>
            )}
          </Button>
          
          <div className="text-xs text-gray-600 space-y-1">
            <p>This will allow the dashboard to:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Read your ad campaigns and performance data</li>
              <li>Access insights and analytics</li>
              <li>Manage your advertising accounts</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default FacebookOAuthFlow