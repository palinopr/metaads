"use client"

import React, { useState, useEffect, useRef } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MetaStyleDashboard } from "@/components/meta-style-dashboard"
import { SettingsForm } from "@/components/settings-form"
import { ClientWrapper } from "./client-wrapper"
import { CredentialManager } from "@/lib/credential-manager"

function MetaAdsDashboardContent() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasValidCredentials, setHasValidCredentials] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [credentials, setCredentials] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const isMounted = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Initialize and check credentials
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        console.log('Initializing dashboard...')
        const savedCreds = CredentialManager.load()
        console.log('Loaded credentials:', savedCreds ? 'Found' : 'Not found')
        
        if (!cancelled && savedCreds) {
          // We have saved credentials, validate them
          console.log('Validating saved credentials...')
          
          if (CredentialManager.areValidated()) {
            // Quick validation - just check if they're still valid
            const result = await CredentialManager.validate(savedCreds)
            
            if (!cancelled) {
              console.log('Validation result:', result)
              
              if (result.isValid) {
                setCredentials(savedCreds)
                setHasValidCredentials(true)
                setShowSettings(false)
              } else {
                // Credentials failed validation
                console.error('Credentials validation failed:', result.error)
                setError(result.error || "Credentials validation failed")
                setShowSettings(true)
              }
            }
          } else {
            // Credentials were never validated
            if (!cancelled) {
              setCredentials(savedCreds)
              setShowSettings(true)
            }
          }
        } else if (!cancelled) {
          // No saved credentials
          console.log('No saved credentials found')
          setShowSettings(true)
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Initialization error:', err)
          setError('Failed to initialize. Please try refreshing the page.')
          setShowSettings(true)
        }
      } finally {
        if (!cancelled) {
          setIsInitialized(true)
        }
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSettingsSuccess = () => {
    if (!isMounted.current) return
    
    console.log('Settings saved successfully')
    // Reload credentials
    const savedCreds = CredentialManager.load()
    if (savedCreds) {
      setCredentials(savedCreds)
      setHasValidCredentials(true)
      setShowSettings(false)
      setError(null)
      // Force a page refresh to reinitialize everything
      window.location.reload()
    }
  }

  const handleOpenSettings = () => {
    setShowSettings(true)
  }

  const handleClearCredentials = () => {
    CredentialManager.clear()
    setCredentials(null)
    setHasValidCredentials(false)
    setShowSettings(true)
    setError(null)
  }

  // Dummy handlers for compatibility with MetaStyleDashboard
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    // This is handled by SettingsForm now
  }

  // Loading state
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Initializing Meta Ads Dashboard...</p>
        </div>
      </div>
    )
  }

  // Settings view
  if (showSettings || !hasValidCredentials) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Meta Ads Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              {hasValidCredentials ? 'Update your settings' : 'Connect your Meta account to get started'}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <SettingsForm
            onSuccess={handleSettingsSuccess}
            initialToken={credentials?.accessToken || ""}
            initialAccountId={credentials?.adAccountId || ""}
          />

          {hasValidCredentials && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowSettings(false)
                  setError(null)
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Meta Ads Dashboard</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenSettings}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {credentials && (
          <MetaStyleDashboard
            accessToken={credentials.accessToken}
            adAccountId={credentials.adAccountId}
            showSettings={false}
            setShowSettings={setShowSettings}
            onSaveCredentials={handleSaveCredentials}
            onClearCredentials={handleClearCredentials}
            setAccessToken={() => {}}
            setAdAccountId={() => {}}
            error={error}
            setError={setError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            showToken={false}
            setShowToken={() => {}}
          />
        )}
      </div>
    </div>
  )
}

export default function MetaAdsDashboard() {
  return (
    <ClientWrapper>
      <MetaAdsDashboardContent />
    </ClientWrapper>
  )
}