"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TestMetaAPIPage() {
  const [accessToken, setAccessToken] = useState("")
  const [adAccountId, setAdAccountId] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAPI = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "overview",
          datePreset: "last_30d",
          accessToken,
          adAccountId,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        setError(`API Error: ${data.error || response.statusText}`)
      } else {
        setResult(data)
      }
    } catch (err: any) {
      setError(`Network Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Meta API Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Access Token</label>
            <Input
              type="password"
              placeholder="Your Meta access token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Ad Account ID</label>
            <Input
              placeholder="act_123456789"
              value={adAccountId}
              onChange={(e) => setAdAccountId(e.target.value)}
            />
          </div>

          <Button 
            onClick={testAPI} 
            disabled={loading || !accessToken || !adAccountId}
            className="w-full"
          >
            {loading ? "Testing..." : "Test API Connection"}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">API Response:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}