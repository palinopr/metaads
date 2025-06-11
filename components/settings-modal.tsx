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
import { Badge } from "@/components/ui/badge"
import { SettingsForm } from "./settings-form"
import { CredentialManager } from "@/lib/credential-manager"
import { SecureCredentialManager } from "@/lib/auth/secure-credential-manager"
import { AuthTestSuite } from "@/lib/auth/auth-test-suite"
import { AlertTriangle, Shield, TestTube } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  useSecureAuth?: boolean
}

export function SettingsModal({ open, onOpenChange, onSuccess, useSecureAuth = true }: SettingsModalProps) {
  const [credentials, setCredentials] = useState<any>(null)
  const [migrationStatus, setMigrationStatus] = useState<'checking' | 'needed' | 'complete' | 'error'>('checking')
  const [testResults, setTestResults] = useState<any>(null)
  const [runningTests, setRunningTests] = useState(false)

  useEffect(() => {
    if (open) {
      loadCredentials()
    }
  }, [open, useSecureAuth])

  const loadCredentials = async () => {
    try {
      if (useSecureAuth) {
        // Check if migration is needed
        const oldCreds = await CredentialManager.load()
        const newCreds = await SecureCredentialManager.load()
        
        if (!newCreds && oldCreds) {
          setMigrationStatus('needed')
          setCredentials(oldCreds)
        } else if (newCreds) {
          setMigrationStatus('complete')
          setCredentials(newCreds)
        } else {
          setMigrationStatus('complete')
          setCredentials(null)
        }
      } else {
        const savedCreds = await CredentialManager.load()
        setCredentials(savedCreds)
        setMigrationStatus('complete')
      }
    } catch (error) {
      console.error('Failed to load credentials:', error)
      setMigrationStatus('error')
    }
  }

  const handleMigration = async () => {
    try {
      const migrated = await CredentialManager.migrateToSecure()
      if (migrated) {
        setMigrationStatus('complete')
        await loadCredentials()
      } else {
        setMigrationStatus('error')
      }
    } catch (error) {
      console.error('Migration failed:', error)
      setMigrationStatus('error')
    }
  }

  const handleSuccess = (newCredentials?: any) => {
    if (onSuccess) {
      onSuccess()
    }
    onOpenChange(false)
  }

  const runAuthTests = async () => {
    setRunningTests(true)
    try {
      const testSuite = new AuthTestSuite()
      const results = await testSuite.runAllTests()
      setTestResults(results)
    } catch (error) {
      console.error('Test suite failed:', error)
    } finally {
      setRunningTests(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {useSecureAuth ? 'Secure Meta API Settings' : 'Meta API Settings'}
          </DialogTitle>
          <DialogDescription>
            Connect your Meta account with {useSecureAuth ? 'enhanced security features' : 'standard authentication'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Security Status */}
          {useSecureAuth && (
            <div className="flex items-center gap-2">
              <span className="text-sm">Security Status:</span>
              <Badge variant={migrationStatus === 'complete' ? 'success' : 'warning'}>
                {migrationStatus === 'complete' ? 'Secure' : 
                 migrationStatus === 'needed' ? 'Migration Available' :
                 migrationStatus === 'checking' ? 'Checking...' : 'Error'}
              </Badge>
            </div>
          )}

          {/* Migration Notice */}
          {useSecureAuth && migrationStatus === 'needed' && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Enhanced Security Available</strong></p>
                  <p className="text-sm">
                    Your credentials can be upgraded to use encryption and enhanced security features.
                  </p>
                  <Button size="sm" onClick={handleMigration}>
                    Upgrade to Secure Storage
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Migration Error */}
          {migrationStatus === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to upgrade credentials. Please try setting up your connection again.
              </AlertDescription>
            </Alert>
          )}

          {/* Test Results */}
          {testResults && (
            <Alert variant={testResults.failed === 0 ? 'default' : 'destructive'}>
              <TestTube className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Authentication Test Results</strong></p>
                  <p className="text-sm">
                    {testResults.passed}/{testResults.totalTests} tests passed 
                    ({testResults.duration}ms)
                  </p>
                  {testResults.failed > 0 && (
                    <details className="text-xs">
                      <summary>Failed Tests:</summary>
                      <ul className="mt-1 list-disc list-inside">
                        {testResults.results
                          .filter((r: any) => !r.passed)
                          .map((r: any, i: number) => (
                            <li key={i}>{r.test}: {r.error}</li>
                          ))}
                      </ul>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Test Button */}
          {useSecureAuth && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={runAuthTests}
                disabled={runningTests}
              >
                <TestTube className="h-4 w-4 mr-1" />
                {runningTests ? 'Running Tests...' : 'Test Security'}
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4">
          <SettingsForm
            onSuccess={handleSuccess}
            initialToken={credentials?.accessToken || ""}
            initialAccountId={credentials?.adAccountId || ""}
            useSecureAuth={useSecureAuth}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}