'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, RefreshCw, Key, CheckCircle } from 'lucide-react'

interface TokenExpiryAlertProps {
  isVisible: boolean
  onReauthenticate: () => void
  onDismiss?: () => void
}

export function TokenExpiryAlert({ isVisible, onReauthenticate, onDismiss }: TokenExpiryAlertProps) {
  const [countdown, setCountdown] = useState(30)
  const [autoReauthenticate, setAutoReauthenticate] = useState(false)

  useEffect(() => {
    if (!isVisible) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (autoReauthenticate) {
            onReauthenticate()
          }
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, autoReauthenticate, onReauthenticate])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-red-600">Access Token Expired</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <Key className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Your Meta API access token has expired. Please re-authenticate to continue using the dashboard.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Common causes:</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 pl-4">
              <li>• Token validity period exceeded</li>
              <li>• Facebook Business account changes</li>
              <li>• API permissions modified</li>
              <li>• Account security updates</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Quick Fix</span>
            </div>
            <p className="text-sm text-blue-700">
              Get a new access token from{' '}
              <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">
                Facebook Business Manager
              </a>{' '}
              and update your credentials.
            </p>
          </div>

          {autoReauthenticate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Auto-redirecting in {countdown} seconds...</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={onReauthenticate} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Update Credentials
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAutoReauthenticate(!autoReauthenticate)}
                className="flex-1"
              >
                {autoReauthenticate ? 'Cancel Auto' : 'Auto Redirect'}
              </Button>
              
              {onDismiss && (
                <Button variant="ghost" size="sm" onClick={onDismiss} className="flex-1">
                  Dismiss
                </Button>
              )}
            </div>
          </div>

          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              Your data is safe - just needs re-authentication
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}