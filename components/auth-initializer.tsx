"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Shield, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Lock
} from "lucide-react"
import { SecureCredentialManager } from "@/lib/auth/secure-credential-manager"
import { CredentialManager } from "@/lib/credential-manager"
import { SessionManager } from "@/lib/auth/session-manager"
import { useToast } from "@/components/ui/use-toast"

interface AuthInitializerProps {
  onInitialized: () => void
  onNeedsSetup: () => void
}

export function AuthInitializer({ onInitialized, onNeedsSetup }: AuthInitializerProps) {
  const [step, setStep] = useState<'checking' | 'migrating' | 'initializing' | 'complete' | 'setup-needed'>('checking')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      setStep('checking')
      setProgress(20)
      
      // Check if we have credentials in the new system
      const secureCredsExist = await SecureCredentialManager.load()
      
      if (secureCredsExist) {
        setStep('initializing')
        setProgress(60)
        
        // Initialize the secure system
        await SecureCredentialManager.initialize()
        
        // Validate existing credentials
        const validation = await SecureCredentialManager.validate(secureCredsExist)
        
        if (validation.isValid) {
          setStep('complete')
          setProgress(100)
          
          setTimeout(() => {
            onInitialized()
          }, 1000)
        } else if (validation.needsRefresh) {
          setError("Your access token has expired. Please reconnect your account.")
          setStep('setup-needed')
        } else {
          setError("Your saved credentials are invalid. Please set up again.")
          setStep('setup-needed')
        }
        return
      }
      
      // Check for old credentials to migrate
      const oldCreds = await CredentialManager.load()
      
      if (oldCreds) {
        setStep('migrating')
        setProgress(40)
        
        // Migrate old credentials
        const migrated = await CredentialManager.migrateToSecure()
        
        if (migrated) {
          setStep('initializing')
          setProgress(80)
          
          // Initialize the secure system
          await SecureCredentialManager.initialize()
          
          setStep('complete')
          setProgress(100)
          
          toast({
            title: "Migration Complete",
            description: "Your credentials have been migrated to the new secure system",
          })
          
          setTimeout(() => {
            onInitialized()
          }, 1500)
        } else {
          setError("Failed to migrate your credentials. Please set up again.")
          setStep('setup-needed')
        }
        return
      }
      
      // No credentials found, need setup
      setStep('setup-needed')
      setProgress(100)
      
    } catch (error) {
      console.error('Auth initialization error:', error)
      setError(error instanceof Error ? error.message : 'Failed to initialize authentication')
      setStep('setup-needed')
    }
  }

  const handleSetupClick = () => {
    onNeedsSetup()
  }

  const getStepMessage = () => {
    switch (step) {
      case 'checking':
        return "Checking for existing credentials..."
      case 'migrating':
        return "Migrating to secure credential storage..."
      case 'initializing':
        return "Initializing secure authentication system..."
      case 'complete':
        return "Authentication system ready!"
      case 'setup-needed':
        return "Setup required"
      default:
        return "Initializing..."
    }
  }

  const getStepIcon = () => {
    switch (step) {
      case 'checking':
      case 'migrating':
      case 'initializing':
        return <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
      case 'complete':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'setup-needed':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />
      default:
        return <Shield className="h-6 w-6 text-gray-500" />
    }
  }

  if (step === 'setup-needed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication Setup Required
          </CardTitle>
          <CardDescription>
            Connect your Meta Ads account to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <strong>Enhanced Security Features:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• AES-256-GCM encryption for stored credentials</li>
                <li>• Session-based authentication with automatic timeout</li>
                <li>• Rate limiting to prevent unauthorized access</li>
                <li>• Secure token validation and refresh handling</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <Button onClick={handleSetupClick} className="w-full">
            <ArrowRight className="h-4 w-4 mr-2" />
            Set Up Meta Ads Connection
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Initializing Authentication
        </CardTitle>
        <CardDescription>
          Setting up secure credential management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {/* Status */}
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-4">
            {getStepIcon()}
            <div>
              <h3 className="font-medium">{getStepMessage()}</h3>
              {step === 'migrating' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Your existing credentials are being upgraded to use encryption and enhanced security features.
                </p>
              )}
              {step === 'complete' && (
                <p className="text-sm text-muted-foreground mt-2">
                  All security features are now active. Redirecting to dashboard...
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Security Features List */}
        {(step === 'migrating' || step === 'initializing') && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Security Features Being Activated:</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Credential encryption with AES-256-GCM</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Session management with automatic timeout</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Rate limiting for API endpoints</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Token validation and refresh handling</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}