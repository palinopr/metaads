"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Lock,
  Unlock,
  Activity
} from "lucide-react"
import { SecureCredentialManager } from "@/lib/auth/secure-credential-manager"
import { SessionManager } from "@/lib/auth/session-manager"
import { TokenManager } from "@/lib/auth/token-manager"
import { AuthRateLimiters } from "@/lib/auth/rate-limiter"
import { useToast } from "@/components/ui/use-toast"

interface AuthStatus {
  hasSession: boolean
  sessionId?: string
  sessionExpiresIn?: number
  hasToken: boolean
  tokenValid: boolean
  tokenExpiresIn?: number
  needsRefresh: boolean
  encryptionEnabled: boolean
  lastActivity?: number
  rateLimits: {
    api: { remaining: number; resetAt: number }
    validation: { remaining: number; resetAt: number }
  }
}

export function AuthStatusMonitor() {
  const [status, setStatus] = useState<AuthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()
  
  const checkAuthStatus = useCallback(async () => {
    try {
      const session = SessionManager.getSession()
      const tokenStatus = await TokenManager.getTokenStatus()
      const debugInfo = await SecureCredentialManager.getDebugInfo()
      
      // Check rate limits
      const apiLimiter = AuthRateLimiters.getApiLimiter()
      const validationLimiter = AuthRateLimiters.getValidationLimiter()
      
      const apiLimit = await apiLimiter.checkLimit('status-check')
      const validationLimit = await validationLimiter.checkLimit('status-check')
      
      const authStatus: AuthStatus = {
        hasSession: !!session,
        sessionId: session?.id,
        sessionExpiresIn: session ? session.expiresAt - Date.now() : undefined,
        hasToken: tokenStatus.hasToken,
        tokenValid: tokenStatus.isValid,
        tokenExpiresIn: tokenStatus.expiresIn,
        needsRefresh: tokenStatus.needsRefresh,
        encryptionEnabled: debugInfo.encryptionEnabled,
        lastActivity: session?.lastActivity,
        rateLimits: {
          api: {
            remaining: apiLimit.remaining,
            resetAt: apiLimit.resetAt
          },
          validation: {
            remaining: validationLimit.remaining,
            resetAt: validationLimit.resetAt
          }
        }
      }
      
      setStatus(authStatus)
    } catch (error) {
      console.error('Failed to check auth status:', error)
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [])
  
  const handleRefreshSession = async () => {
    setRefreshing(true)
    try {
      const newSession = await SessionManager.renewSession()
      if (newSession) {
        toast({
          title: "Session refreshed",
          description: "Your session has been extended successfully"
        })
        await checkAuthStatus()
      } else {
        toast({
          title: "Session refresh failed",
          description: "Please log in again",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh session",
        variant: "destructive"
      })
    } finally {
      setRefreshing(false)
    }
  }
  
  const handleClearAuth = async () => {
    if (confirm("This will clear all authentication data. Are you sure?")) {
      await SecureCredentialManager.clear()
      toast({
        title: "Authentication cleared",
        description: "All credentials and session data have been removed"
      })
      await checkAuthStatus()
    }
  }
  
  useEffect(() => {
    // Initial check
    checkAuthStatus()
    
    // Set up periodic checks
    const interval = setInterval(checkAuthStatus, 30000) // Every 30 seconds
    
    // Listen for session events
    const handleSessionExpired = () => {
      toast({
        title: "Session expired",
        description: "Please log in again to continue",
        variant: "destructive"
      })
      checkAuthStatus()
    }
    
    const handleTokenExpired = () => {
      toast({
        title: "Token expired",
        description: "Your access token has expired. Please reconnect your account.",
        variant: "destructive"
      })
      checkAuthStatus()
    }
    
    window.addEventListener('session-expired', handleSessionExpired)
    window.addEventListener('token-expired', handleTokenExpired)
    
    // Listen for activity updates
    SessionManager.addActivityListener(checkAuthStatus)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('session-expired', handleSessionExpired)
      window.removeEventListener('token-expired', handleTokenExpired)
      SessionManager.removeActivityListener(checkAuthStatus)
    }
  }, [checkAuthStatus, toast])
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to retrieve authentication status
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }
  
  const formatTime = (ms?: number) => {
    if (!ms || ms < 0) return "Expired"
    
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m`
    return `${seconds}s`
  }
  
  const getExpiryProgress = (expiresIn?: number, maxDuration: number = 24 * 60 * 60 * 1000) => {
    if (!expiresIn || expiresIn < 0) return 0
    return Math.min(100, (expiresIn / maxDuration) * 100)
  }
  
  const getStatusColor = (valid: boolean, needsRefresh: boolean) => {
    if (!valid) return "destructive"
    if (needsRefresh) return "warning"
    return "success"
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Authentication Status
        </CardTitle>
        <CardDescription>
          Monitor and manage your authentication state
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Session</span>
            <Badge variant={status.hasSession ? "success" : "destructive"}>
              {status.hasSession ? "Active" : "Inactive"}
            </Badge>
          </div>
          {status.hasSession && status.sessionExpiresIn && (
            <>
              <Progress value={getExpiryProgress(status.sessionExpiresIn)} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Expires in {formatTime(status.sessionExpiresIn)}</span>
                {status.lastActivity && (
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Last activity {formatTime(Date.now() - status.lastActivity)} ago
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Token Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Access Token</span>
            <Badge variant={getStatusColor(status.tokenValid, status.needsRefresh)}>
              {!status.hasToken ? "Missing" : status.tokenValid ? (status.needsRefresh ? "Needs Refresh" : "Valid") : "Invalid"}
            </Badge>
          </div>
          {status.hasToken && status.tokenExpiresIn && (
            <>
              <Progress 
                value={getExpiryProgress(status.tokenExpiresIn, 60 * 24 * 60 * 60 * 1000)} 
                className="h-2" 
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Expires in {formatTime(status.tokenExpiresIn)}</span>
              </div>
            </>
          )}
        </div>
        
        {/* Security Features */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Security</span>
            <div className="flex items-center gap-2">
              {status.encryptionEnabled ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Encrypted
                </Badge>
              ) : (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Unlock className="h-3 w-3" />
                  Not Encrypted
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Rate Limits */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Rate Limits</span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <span>API Requests</span>
              <span className="font-mono">{status.rateLimits.api.remaining}/60</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <span>Validations</span>
              <span className="font-mono">{status.rateLimits.validation.remaining}/10</span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefreshSession}
            disabled={!status.hasSession || refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Session
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={handleClearAuth}
          >
            Clear Auth
          </Button>
        </div>
        
        {/* Warnings */}
        {status.needsRefresh && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your access token will expire soon. Please reconnect your Meta account.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}