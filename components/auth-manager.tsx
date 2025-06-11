"use client"

import { useState, useEffect } from "react"
import { AuthInitializer } from "./auth-initializer"
import { OAuthFlowManager } from "./oauth-flow-manager"
import { AuthStatusMonitor } from "./auth-status-monitor"
import { SecureSettingsModal } from "./settings-modal-secure"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Settings, 
  RefreshCw, 
  CheckCircle,
  Lock,
  Activity
} from "lucide-react"
import { SecureCredentialManager } from "@/lib/auth/secure-credential-manager"
import { SessionManager } from "@/lib/auth/session-manager"
import { useToast } from "@/components/ui/use-toast"

interface AuthManagerProps {
  children: React.ReactNode
  showMonitor?: boolean
  onAuthReady?: () => void
}

type AuthState = 'initializing' | 'needs-setup' | 'authenticated' | 'error'

export function AuthManager({ children, showMonitor = false, onAuthReady }: AuthManagerProps) {
  const [authState, setAuthState] = useState<AuthState>('initializing')
  const [showSetup, setShowSetup] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Listen for auth events
    const handleSessionExpired = () => {
      toast({
        title: "Session Expired",
        description: "Please log in again to continue",
        variant: "destructive"
      })
      setAuthState('needs-setup')
    }

    const handleTokenExpired = () => {
      toast({
        title: "Token Expired",
        description: "Your access token has expired. Please reconnect your account.",
        variant: "destructive"
      })
      setAuthState('needs-setup')
    }

    window.addEventListener('session-expired', handleSessionExpired)
    window.addEventListener('token-expired', handleTokenExpired)

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired)
      window.removeEventListener('token-expired', handleTokenExpired)
    }
  }, [toast])

  useEffect(() => {
    // Update session info
    const updateSessionInfo = () => {
      const session = SessionManager.getSession()
      setHasSession(!!session)
      setSessionInfo(session)
    }

    updateSessionInfo()
    
    // Listen for session updates
    SessionManager.addActivityListener(updateSessionInfo)

    return () => {
      SessionManager.removeActivityListener(updateSessionInfo)
    }
  }, [])

  const handleAuthInitialized = () => {
    setAuthState('authenticated')
    if (onAuthReady) {
      onAuthReady()
    }
  }

  const handleNeedsSetup = () => {
    setAuthState('needs-setup')
    setShowSetup(true)
  }

  const handleSetupComplete = () => {
    setShowSetup(false)
    setAuthState('authenticated')
    if (onAuthReady) {
      onAuthReady()
    }
  }

  const handleOpenSettings = () => {
    setShowSettings(true)
  }

  const handleSettingsSuccess = () => {
    setShowSettings(false)
    toast({
      title: "Settings Updated",
      description: "Your authentication settings have been updated successfully"
    })
  }

  const handleForceReauth = async () => {
    await SecureCredentialManager.clear()
    setAuthState('needs-setup')
    setShowSetup(true)
  }

  const getAuthBadge = () => {
    switch (authState) {
      case 'initializing':
        return (
          <Badge variant="secondary" className="animate-pulse">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Initializing
          </Badge>
        )
      case 'authenticated':
        return (
          <Badge variant="success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Authenticated
          </Badge>
        )
      case 'needs-setup':
        return (
          <Badge variant="destructive">
            <Shield className="h-3 w-3 mr-1" />
            Setup Required
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive">
            <Shield className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
    }
  }

  // Show initializer if still initializing
  if (authState === 'initializing') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <AuthInitializer
          onInitialized={handleAuthInitialized}
          onNeedsSetup={handleNeedsSetup}
        />
      </div>
    )
  }

  // Show setup flow if needed
  if (authState === 'needs-setup' && showSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <OAuthFlowManager onCredentialsSet={handleSetupComplete} />
      </div>
    )
  }

  // Render main app with auth controls
  return (
    <div className="min-h-screen">
      {/* Auth status bar */}
      <div className="bg-background border-b px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Authentication Status:</span>
              {getAuthBadge()}
            </div>
            
            {hasSession && sessionInfo && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Encrypted Session</span>
                <Activity className="h-3 w-3" />
                <span>
                  Expires: {new Date(sessionInfo.expiresAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {authState === 'authenticated' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenSettings}
                  className="text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleForceReauth}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Re-authenticate
                </Button>
              </>
            )}
            
            {authState === 'needs-setup' && (
              <Button
                size="sm"
                onClick={() => setShowSetup(true)}
                className="text-xs"
              >
                <Shield className="h-3 w-3 mr-1" />
                Connect Account
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex">
        <div className="flex-1">
          {authState === 'authenticated' ? (
            children
          ) : (
            <div className="flex items-center justify-center min-h-[calc(100vh-60px)] p-4">
              <Card className="max-w-md w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Authentication Required
                  </CardTitle>
                  <CardDescription>
                    Please connect your Meta Ads account to continue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertDescription>
                      Your credentials will be secured with military-grade encryption
                      and protected by our enhanced security system.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    onClick={() => setShowSetup(true)} 
                    className="w-full mt-4"
                  >
                    Connect Meta Ads Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Monitoring sidebar */}
        {showMonitor && authState === 'authenticated' && (
          <div className="w-80 border-l bg-muted/10 p-4">
            <AuthStatusMonitor />
          </div>
        )}
      </div>

      {/* Modals */}
      <SecureSettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        onSuccess={handleSettingsSuccess}
      />
    </div>
  )
}