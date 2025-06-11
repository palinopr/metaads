"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ExternalLink, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  RefreshCw,
  Copy,
  Eye,
  EyeOff
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { SecureCredentialManager } from "@/lib/auth/secure-credential-manager"
import { SessionManager } from "@/lib/auth/session-manager"
import { TokenManager } from "@/lib/auth/token-manager"

interface OAuthFlowManagerProps {
  onCredentialsSet?: (credentials: any) => void
}

export function OAuthFlowManager({ onCredentialsSet }: OAuthFlowManagerProps) {
  const [step, setStep] = useState<'guide' | 'validate' | 'complete'>('guide')
  const [showToken, setShowToken] = useState(false)
  const [token, setToken] = useState('')
  const [accountId, setAccountId] = useState('')
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Initialize the auth system
    SecureCredentialManager.initialize()
  }, [])

  const steps = [
    {
      title: "Access Meta Business Manager",
      description: "Go to your Meta Business account to generate an access token",
      status: step === 'guide' ? 'current' : 'completed'
    },
    {
      title: "Generate Access Token",
      description: "Create a long-lived access token with proper permissions",
      status: step === 'guide' ? 'pending' : step === 'validate' ? 'current' : 'completed'
    },
    {
      title: "Validate & Save",
      description: "Test the token and save it securely",
      status: step === 'validate' ? 'current' : step === 'complete' ? 'completed' : 'pending'
    }
  ]

  const handleOpenMetaBusiness = () => {
    const url = 'https://business.facebook.com/settings/system-users'
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleOpenGraphExplorer = () => {
    const url = 'https://developers.facebook.com/tools/explorer/'
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleProceedToValidation = () => {
    if (!token.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter your access token to proceed",
        variant: "destructive"
      })
      return
    }
    setStep('validate')
  }

  const handleValidateCredentials = async () => {
    if (!token.trim() || !accountId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both access token and ad account ID",
        variant: "destructive"
      })
      return
    }

    setValidating(true)
    try {
      // Validate token format first
      if (!TokenManager.validateTokenFormat(token)) {
        setValidationResult({
          isValid: false,
          error: "Invalid token format. Meta tokens should be 50+ characters long.",
          details: { tokenFormat: false, accountFormat: false, apiConnection: false }
        })
        return
      }

      // Format account ID
      const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`

      // Test with secure credential manager
      const credentials = {
        accessToken: token.trim(),
        adAccountId: formattedAccountId,
        encryptionEnabled: true
      }

      const result = await SecureCredentialManager.validate(credentials, true)
      setValidationResult(result)

      if (result.isValid) {
        // Save credentials
        const saved = await SecureCredentialManager.save(credentials, true, true)
        
        if (saved) {
          setStep('complete')
          toast({
            title: "Success!",
            description: "Your credentials have been validated and saved securely",
          })

          if (onCredentialsSet) {
            onCredentialsSet(credentials)
          }
        } else {
          throw new Error('Failed to save credentials')
        }
      }
    } catch (error) {
      console.error('Validation error:', error)
      setValidationResult({
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        details: { tokenFormat: true, accountFormat: true, apiConnection: false }
      })
    } finally {
      setValidating(false)
    }
  }

  const handleCopyToken = async () => {
    if (token) {
      await navigator.clipboard.writeText(token)
      toast({
        title: "Copied",
        description: "Token copied to clipboard"
      })
    }
  }

  const getStepProgress = () => {
    switch (step) {
      case 'guide': return 33
      case 'validate': return 66
      case 'complete': return 100
      default: return 0
    }
  }

  if (step === 'guide') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Meta OAuth Setup Guide
          </CardTitle>
          <CardDescription>
            Securely connect your Meta Ads account with proper authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Setup Progress</span>
              <span>{getStepProgress()}%</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((stepItem, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  stepItem.status === 'completed' ? 'bg-green-100 text-green-700' :
                  stepItem.status === 'current' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {stepItem.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{stepItem.title}</h3>
                  <p className="text-sm text-muted-foreground">{stepItem.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Important Security Requirements:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Use a System User token (not personal account)</li>
                <li>• Grant only necessary permissions: ads_read, ads_management</li>
                <li>• Set token expiration to 60 days maximum</li>
                <li>• Never share your token publicly</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Quick Links */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleOpenMetaBusiness} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Open Meta Business Manager
            </Button>
            <Button variant="outline" onClick={handleOpenGraphExplorer} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Graph API Explorer
            </Button>
          </div>

          {/* Token Input */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Access Token *</label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your Meta access token here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowToken(!showToken)}
                    className="h-6 w-6 p-0"
                  >
                    {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  {token && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyToken}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ad Account ID *</label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="Enter your ad account ID (e.g., act_123456789)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-muted-foreground">
                Find this in your Meta Ads Manager URL or account settings
              </p>
            </div>

            <Button 
              onClick={handleProceedToValidation}
              disabled={!token.trim() || !accountId.trim()}
              className="w-full"
            >
              Validate Credentials
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'validate') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Validating Your Credentials
          </CardTitle>
          <CardDescription>
            Testing your access token and account permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={getStepProgress()} className="h-2" />
          
          {validating ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-4">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                <div>
                  <h3 className="font-medium">Validating credentials...</h3>
                  <p className="text-sm text-muted-foreground">This may take a few moments</p>
                </div>
              </div>
            </div>
          ) : validationResult ? (
            <div className="space-y-4">
              {validationResult.isValid ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Validation Successful!</strong><br />
                    Your credentials are valid and have been saved securely with encryption.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Validation Failed</strong><br />
                    {validationResult.error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Validation Details */}
              <div className="space-y-2">
                <h4 className="font-medium">Validation Results:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex items-center gap-2 p-2 border rounded">
                    {validationResult.details?.tokenFormat ? 
                      <CheckCircle className="h-4 w-4 text-green-500" /> : 
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    }
                    <span className="text-sm">Token Format</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    {validationResult.details?.accountFormat ? 
                      <CheckCircle className="h-4 w-4 text-green-500" /> : 
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    }
                    <span className="text-sm">Account Format</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    {validationResult.details?.apiConnection ? 
                      <CheckCircle className="h-4 w-4 text-green-500" /> : 
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    }
                    <span className="text-sm">API Connection</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setStep('guide')}
                  variant="outline"
                >
                  Go Back
                </Button>
                <Button 
                  onClick={handleValidateCredentials}
                  disabled={validating}
                >
                  Retry Validation
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={handleValidateCredentials} className="w-full">
              Start Validation
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (step === 'complete') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Setup Complete!
          </CardTitle>
          <CardDescription>
            Your Meta Ads account is now securely connected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={100} className="h-2" />
          
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Your credentials are now secure!</strong><br />
              • Encrypted with AES-256-GCM encryption<br />
              • Protected with session-based key derivation<br />
              • Automatic session timeout after 30 minutes of inactivity<br />
              • Rate limiting enabled to prevent abuse
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="font-medium">Security Features Active:</h4>
            <div className="grid grid-cols-2 gap-2">
              <Badge variant="success" className="justify-center py-2">
                <Lock className="h-3 w-3 mr-1" />
                Encryption Enabled
              </Badge>
              <Badge variant="success" className="justify-center py-2">
                <Shield className="h-3 w-3 mr-1" />
                Session Protected
              </Badge>
            </div>
          </div>

          <Button 
            onClick={() => window.location.reload()} 
            className="w-full"
          >
            Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}