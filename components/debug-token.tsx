"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MetaAPIClient } from "@/lib/meta-api-client"

export function DebugToken() {
  const [token, setToken] = useState("")
  const [accountId, setAccountId] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load saved values
    const savedToken = localStorage.getItem("metaAccessToken") || ""
    const savedAccountId = localStorage.getItem("metaAdAccountId") || ""
    setToken(savedToken)
    setAccountId(savedAccountId)
  }, [])

  const testToken = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Log what we're testing
      console.log("Testing with:", {
        token: token.substring(0, 20) + "...",
        accountId: accountId
      })

      const client = new MetaAPIClient(token, accountId)
      const testResult = await client.testConnection()
      
      setResult({
        success: testResult.success,
        data: testResult,
        tokenFormat: token.startsWith("Bearer ") ? "Has Bearer prefix" : "No Bearer prefix",
        accountFormat: accountId.startsWith("act_") ? "Has act_ prefix" : "No act_ prefix"
      })
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        type: error.name,
        isTokenExpired: error.isTokenExpired
      })
    }

    setLoading(false)
  }

  const saveAndTest = () => {
    localStorage.setItem("metaAccessToken", token)
    localStorage.setItem("metaAdAccountId", accountId)
    testToken()
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Debug Token Issues</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Access Token</Label>
          <Input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your Meta access token"
            type="password"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Current: {token ? token.substring(0, 20) + "..." : "Not set"}
          </p>
        </div>

        <div>
          <Label>Ad Account ID</Label>
          <Input
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="act_123456789"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Format: Should start with "act_"
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={testToken} disabled={loading}>
            {loading ? "Testing..." : "Test Connection"}
          </Button>
          <Button onClick={saveAndTest} variant="outline" disabled={loading}>
            Save & Test
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <h4 className="font-semibold mb-2">
              {result.success ? "✅ Success" : "❌ Failed"}
            </h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p>Common issues:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Token expired (need new token from Meta)</li>
            <li>Wrong token format (should not include "Bearer")</li>
            <li>Account ID format (must start with "act_")</li>
            <li>Token doesn't have required permissions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}