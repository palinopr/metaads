"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { MetaAPIClient, formatAccessToken, formatAdAccountId, TokenExpiredError } from "@/lib/meta-api-client"
import { MetaStyleDashboard } from "@/components/meta-style-dashboard"
import { ClientWrapper } from "./client-wrapper"
import { cn } from "@/lib/utils"

function MetaAdsDashboardContent() {
  // Credentials state
  const [accessToken, setAccessToken] = useState("")
  const [adAccountId, setAdAccountId] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  // Loading and error state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Load saved credentials
  useEffect(() => {
    const savedToken = localStorage.getItem("metaAccessToken")
    const savedAccountId = localStorage.getItem("metaAdAccountId")
    
    if (savedToken && savedAccountId) {
      setAccessToken(savedToken)
      setAdAccountId(savedAccountId)
    } else {
      setShowSettings(true)
    }
  }, [])

  // Test connection
  const testConnection = useCallback(async () => {
    if (!accessToken || !adAccountId) return false

    try {
      const client = new MetaAPIClient(accessToken, adAccountId)
      const result = await client.testConnection()
      
      if (result.success) {
        setError(null)
        return true
      } else {
        setError(result.error || "Connection failed")
        return false
      }
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        setError("Your access token has expired. Please update your credentials.")
        // Clear expired token
        localStorage.removeItem("metaAccessToken")
        setAccessToken("")
      } else {
        setError(err instanceof Error ? err.message : "Unknown error")
      }
      return false
    }
  }, [accessToken, adAccountId])

  // Save credentials and test connection
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!accessToken || !adAccountId) {
      setError("Please provide both access token and account ID")
      return
    }

    setIsLoading(true)

    // Format and save credentials
    const formattedToken = formatAccessToken(accessToken)
    const formattedAccountId = formatAdAccountId(adAccountId)

    localStorage.setItem("metaAccessToken", formattedToken)
    localStorage.setItem("metaAdAccountId", formattedAccountId)

    setAccessToken(formattedToken)
    setAdAccountId(formattedAccountId)
    
    // Test connection
    const success = await testConnection()
    if (success) {
      setShowSettings(false)
    }
    
    setIsLoading(false)
  }

  // Clear credentials
  const handleClearCredentials = () => {
    localStorage.removeItem("metaAccessToken")
    localStorage.removeItem("metaAdAccountId")
    setAccessToken("")
    setAdAccountId("")
    setError(null)
    setShowSettings(true)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <MetaStyleDashboard
          accessToken={accessToken}
          adAccountId={adAccountId}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          onSaveCredentials={handleSaveCredentials}
          onClearCredentials={handleClearCredentials}
          setAccessToken={setAccessToken}
          setAdAccountId={setAdAccountId}
          error={error}
          setError={setError}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          showToken={showToken}
          setShowToken={setShowToken}
        />
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