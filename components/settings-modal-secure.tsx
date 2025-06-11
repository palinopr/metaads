"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { SettingsForm } from "./settings-form"
import { SecureCredentialManager } from "@/lib/auth/secure-credential-manager"
import { SessionManager } from "@/lib/auth/session-manager"
import { AuthRateLimiters } from "@/lib/auth/rate-limiter"
import { Shield, Lock, AlertTriangle, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function SecureSettingsModal({ open, onOpenChange, onSuccess }: SettingsModalProps) {
  const [credentials, setCredentials] = useState<any>(null)
  const [encryptionEnabled, setEncryptionEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadCredentials()
      checkRateLimits()
    }
  }, [open])

  const loadCredentials = async () => {
    try {
      const savedCreds = await SecureCredentialManager.load()
      setCredentials(savedCreds)
      if (savedCreds) {
        setEncryptionEnabled(savedCreds.encryptionEnabled !== false)
      }
    } catch (error) {
      console.error('Failed to load credentials:', error)
      toast({
        title: "Error",
        description: "Failed to load saved credentials",
        variant: "destructive"
      })
    }
  }

  const checkRateLimits = async () => {
    try {
      const loginLimiter = AuthRateLimiters.getLoginLimiter()
      const limit = await loginLimiter.checkLimit('settings-modal')
      
      if (limit.remaining <= 2) {
        setRateLimitWarning(`Only ${limit.remaining} login attempts remaining. Resets in ${Math.ceil((limit.resetAt - Date.now()) / 60000)} minutes.`)
      }
    } catch (error) {
      console.error('Failed to check rate limits:', error)
    }
  }

  const handleSuccess = async (newCredentials: any) => {
    setLoading(true)
    try {
      // Initialize session if needed
      let session = SessionManager.getSession()
      if (!session) {
        session = await SessionManager.createSession(newCredentials.adAccountId)
      }

      // Save credentials with encryption preference
      const saved = await SecureCredentialManager.save(
        {
          ...newCredentials,
          encryptionEnabled
        },
        true, // validated
        encryptionEnabled
      )

      if (saved) {
        toast({
          title: "Success",
          description: "Credentials saved securely",
        })
        
        if (onSuccess) {
          onSuccess()
        }
        onOpenChange(false)
      } else {
        throw new Error('Failed to save credentials')
      }
    } catch (error) {
      console.error('Failed to save credentials:', error)
      toast({
        title: "Error",
        description: "Failed to save credentials securely",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    const password = prompt('Enter a password to encrypt your backup:')
    if (!password) return

    try {
      const encrypted = await SecureCredentialManager.exportCredentials(password)
      if (encrypted) {
        // Create download link
        const blob = new Blob([encrypted], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `meta-ads-backup-${new Date().toISOString().split('T')[0]}.enc`
        a.click()
        URL.revokeObjectURL(url)
        
        toast({
          title: "Backup created",
          description: "Your credentials have been exported securely",
        })
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export credentials",
        variant: "destructive"
      })
    }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.enc'
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const password = prompt('Enter the password for this backup:')
      if (!password) return

      try {
        const encrypted = await file.text()
        const imported = await SecureCredentialManager.importCredentials(encrypted, password)
        
        if (imported) {
          toast({
            title: "Import successful",
            description: "Your credentials have been restored",
          })
          loadCredentials()
        } else {
          throw new Error('Import failed')
        }
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Failed to import credentials. Check your password.",
          variant: "destructive"
        })
      }
    }
    
    input.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Secure Meta API Settings
          </DialogTitle>
          <DialogDescription>
            Connect your Meta account with enhanced security features
          </DialogDescription>
        </DialogHeader>
        
        {rateLimitWarning && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{rateLimitWarning}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          {/* Security Options */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security Options
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="encryption">Enable Encryption</Label>
                <p className="text-sm text-muted-foreground">
                  Encrypt stored credentials using session-based keys
                </p>
              </div>
              <Switch
                id="encryption"
                checked={encryptionEnabled}
                onCheckedChange={setEncryptionEnabled}
              />
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your credentials are protected with:
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• AES-256-GCM encryption {encryptionEnabled && <Badge variant="success" className="ml-1 text-xs">Active</Badge>}</li>
                  <li>• Session-based key derivation</li>
                  <li>• Automatic session timeout after 30 minutes of inactivity</li>
                  <li>• Rate limiting to prevent brute force attacks</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
          
          {/* Backup/Restore */}
          {credentials && (
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Backup & Restore</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleExport}>
                  Export Backup
                </Button>
                <Button size="sm" variant="outline" onClick={handleImport}>
                  Import Backup
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Create encrypted backups of your credentials for safekeeping
              </p>
            </div>
          )}
          
          {/* Settings Form */}
          <div className="mt-4">
            <SettingsForm
              onSuccess={handleSuccess}
              initialToken={credentials?.accessToken || ""}
              initialAccountId={credentials?.adAccountId || ""}
              disabled={loading}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}