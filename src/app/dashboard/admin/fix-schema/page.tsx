"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2, WrenchIcon } from "lucide-react"

export default function FixSchemaPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string }>({})

  const handleFixSchema = async () => {
    setLoading(true)
    setResult({})
    
    try {
      const response = await fetch("/api/admin/fix-schema", {
        method: "POST",
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResult({ success: true, message: data.message })
      } else {
        setResult({ error: data.error })
      }
    } catch (error) {
      setResult({ error: "Failed to connect to server" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WrenchIcon className="h-5 w-5" />
            Fix Meta Ad Accounts Schema
          </CardTitle>
          <CardDescription>
            This tool will check and fix any schema mismatches in the meta_ad_accounts table
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This operation will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Check for schema mismatches in the meta_ad_accounts table</li>
                <li>Backup existing data if any</li>
                <li>Recreate the table with the correct schema if needed</li>
                <li>Restore the backed up data</li>
              </ul>
            </AlertDescription>
          </Alert>

          {result.success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {result.message}
              </AlertDescription>
            </Alert>
          )}

          {result.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleFixSchema} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing Schema...
              </>
            ) : (
              "Fix Schema Now"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}