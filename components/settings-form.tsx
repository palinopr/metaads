"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2, Eye, EyeOff, TestTube, Wifi } from "lucide-react"
import { CredentialManager } from "@/lib/credential-manager"
import { SecureCredentialManager } from "@/lib/auth/secure-credential-manager"
import { TokenManager } from "@/lib/auth/token-manager"
import { AuthRateLimiters } from "@/lib/auth/rate-limiter"

interface SettingsFormProps {
  onSuccess: (credentials: any) => void
  initialToken?: string
  initialAccountId?: string
  disabled?: boolean
  useSecureAuth?: boolean
}

export function SettingsForm({ onSuccess, initialToken = "", initialAccountId = "", disabled = false, useSecureAuth = true }: SettingsFormProps) {
  const [token, setToken] = useState(initialToken)
  const [accountId, setAccountId] = useState(initialAccountId)
  const [showToken, setShowToken] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [quickValidationErrors, setQuickValidationErrors] = useState<string[]>([])
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Real-time validation as user types
  useEffect(() => {
    if (token.trim() && accountId.trim()) {
      const cleanToken = token.trim()
      const cleanAccountId = accountId.trim()
      const formattedAccountId = cleanAccountId.startsWith('act_') 
        ? cleanAccountId 
        : `act_${cleanAccountId}`

      const credentials = {
        accessToken: cleanToken,
        adAccountId: formattedAccountId
      }

      const quickValidation = CredentialManager.validateQuick(credentials)
      setQuickValidationErrors(quickValidation.isValid ? [] : [quickValidation.error || 'Invalid format'])
    } else {
      setQuickValidationErrors([])
    }
  }, [token, accountId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsValidating(true)
    setValidationResult(null)
    setSaveSuccess(false)

    try {
      // Check rate limits first
      const loginLimiter = AuthRateLimiters.getLoginLimiter()
      const rateLimit = await loginLimiter.checkLimit('settings-form')
      
      if (!rateLimit.allowed) {
        setValidationResult({
          isValid: false,
          error: `Too many attempts. Please wait ${rateLimit.retryAfter} seconds before trying again.`
        })
        return
      }

      // Clean up inputs
      const cleanToken = token.trim()
      const cleanAccountId = accountId.trim()

      // Basic validation
      if (!cleanToken || !cleanAccountId) {
        setValidationResult({
          isValid: false,
          error: 'Both access token and ad account ID are required'
        })
        return
      }

      // Add act_ prefix if missing
      const formattedAccountId = cleanAccountId.startsWith('act_') 
        ? cleanAccountId 
        : `act_${cleanAccountId}`

      const credentials = {
        accessToken: cleanToken,
        adAccountId: formattedAccountId,
        encryptionEnabled: true
      }

      let result

      if (useSecureAuth) {
        // Use secure authentication system
        
        // First validate token format
        if (!TokenManager.validateTokenFormat(cleanToken)) {
          setValidationResult({
            isValid: false,
            error: 'Invalid token format. Meta tokens should be 50+ characters long and contain valid characters.'
          })
          return
        }

        // Validate with secure system
        result = await SecureCredentialManager.validate(credentials, true)
        
        if (result.isValid) {
          // Save with encryption
          const saveResult = await SecureCredentialManager.save(credentials, true, true)
          
          if (saveResult) {
            console.log('Credentials saved securely')
            setSaveSuccess(true)
            
            // Wait a bit to show success
            setTimeout(() => {
              onSuccess(credentials)
            }, 1500)
          } else {
            setValidationResult({
              isValid: false,
              error: 'Failed to save credentials securely. Please try again.'
            })
          }
        }
      } else {
        // Use legacy system
        const formatValidation = CredentialManager.validateFormat(credentials)
        if (!formatValidation.isValid) {
          setValidationResult({
            isValid: false,
            error: 'Invalid format: ' + formatValidation.errors.join(', ')
          })
          return
        }

        result = await CredentialManager.validate(credentials)
        
        if (result.isValid) {
          const saveResult = CredentialManager.save(credentials, true)
          
          if (saveResult) {
            console.log('Credentials saved successfully')
            setSaveSuccess(true)
            
            setTimeout(() => {
              onSuccess(credentials)
            }, 1500)
          } else {
            setValidationResult({
              isValid: false,
              error: 'Failed to save credentials. Please try again.'
            })
          }
        }
      }
      
      setValidationResult(result)

    } catch (error: any) {
      console.error('Validation error:', error)
      setValidationResult({
        isValid: false,
        error: error.message || 'Validation failed'
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setValidationResult(null)

    try {
      const cleanToken = token.trim()
      const cleanAccountId = accountId.trim()
      const formattedAccountId = cleanAccountId.startsWith('act_') 
        ? cleanAccountId 
        : `act_${cleanAccountId}`

      const credentials = {
        accessToken: cleanToken,
        adAccountId: formattedAccountId
      }

      const result = await CredentialManager.testConnection(credentials)
      setValidationResult(result)
    } catch (error: any) {
      setValidationResult({
        isValid: false,
        error: error.message || 'Connection test failed'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const getDebugInfo = () => {
    const info = CredentialManager.getDebugInfo()
    console.log('Debug info:', info)
    alert(JSON.stringify(info, null, 2))
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Meta API Settings</CardTitle>
        <CardDescription>
          Connect your Meta account to start managing your ads
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Access Token</Label>
            <div className="relative">
              <Input
                id="token"
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your Meta access token (EAA...)"
                className={`pr-10 ${quickValidationErrors.length > 0 && token.trim() ? 'border-red-500' : ''}`}
                disabled={disabled}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get this from Meta Business Manager → System Users → Generate Token
            </p>
            {token.trim() && token.trim().length < 50 && (
              <p className="text-xs text-amber-600">
                ⚠️ Token appears short (Meta tokens are typically 100+ characters)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">Ad Account ID</Label>
            <Input
              id="accountId"
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="123456789 or act_123456789"
              className={quickValidationErrors.length > 0 && accountId.trim() ? 'border-red-500' : ''}
              disabled={disabled}
              required
            />
            <p className="text-xs text-muted-foreground">
              Find this in Meta Ads Manager → Account Overview
            </p>
            {accountId.trim() && !accountId.startsWith('act_') && !/^\d+$/.test(accountId.trim()) && (
              <p className="text-xs text-amber-600">
                ⚠️ Should be numbers only (we'll add "act_" prefix) or full format "act_123456789"
              </p>
            )}
          </div>

          {quickValidationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div>
                  <p className="font-semibold">Format Issues:</p>
                  <ul className="text-sm mt-1 list-disc list-inside">
                    {quickValidationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {saveSuccess && (
            <Alert variant="default" className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <p className="font-semibold text-green-800">✅ Credentials saved successfully!</p>
                <p className="text-sm text-green-700 mt-1">Redirecting to dashboard...</p>
              </AlertDescription>
            </Alert>
          )}

          {validationResult && (
            <Alert variant={validationResult.isValid ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {validationResult.isValid ? (
                  <div className="space-y-1">
                    <p className="font-semibold">✅ Connection successful!</p>
                    {validationResult.details?.accountInfo && (
                      <p className="text-sm">
                        Connected to: {validationResult.details.accountInfo.name}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold">Connection failed</p>
                    <p className="text-sm mt-1">{validationResult.error}</p>
                    {validationResult.helpText && (
                      <p className="text-xs mt-2 text-muted-foreground">
                        💡 {validationResult.helpText}
                      </p>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={disabled || isValidating || isTesting || !token || !accountId || quickValidationErrors.length > 0}
              className="flex-1"
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating & Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Save & Connect
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || isValidating || isTesting || !token || !accountId || quickValidationErrors.length > 0}
              onClick={handleTestConnection}
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Test
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getDebugInfo}
            >
              Debug
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Troubleshooting Tips:</h4>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• <strong>Token format:</strong> Meta tokens are 100+ characters and contain "EAA" or "|"</li>
            <li>• <strong>Token expiry:</strong> Tokens expire after 60 days - generate new one if expired</li>
            <li>• <strong>Account ID:</strong> Numbers only (123456789) or full format (act_123456789)</li>
            <li>• <strong>Permissions:</strong> Token needs ads_management and ads_read permissions</li>
            <li>• <strong>Testing:</strong> Use "Test" button to verify connection before saving</li>
            <li>• <strong>Common errors:</strong> "Invalid OAuth" = bad token, "Invalid account ID" = wrong format</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}