"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CheckCircle2, AlertCircle, Loader2, Building2, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface AdAccount {
  id: string
  account_id: string
  name: string
  currency: string
  timezone_name: string
  is_selected: boolean
}

export default function MetaAccountsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchAdAccounts()
  }, [])

  const fetchAdAccounts = async () => {
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch("/api/connections/meta/accounts")
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch ad accounts")
      }
      
      setAccounts(data.accounts || [])
      
      // Set selected account if one exists
      const selected = data.accounts?.find((acc: AdAccount) => acc.is_selected)
      if (selected) {
        setSelectedAccount(selected.account_id)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedAccount) {
      setError("Please select an ad account")
      return
    }
    
    try {
      setSaving(true)
      setError("")
      setSuccess("")
      
      const response = await fetch("/api/connections/meta/accounts/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ account_id: selectedAccount })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to save selection")
      }
      
      setSuccess("Ad account selected successfully!")
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/connections")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Connections
        </Button>
        
        <h1 className="text-3xl font-bold">Meta Ad Accounts</h1>
        <p className="text-muted-foreground mt-2">
          Select the ad account you want to manage
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available Ad Accounts</CardTitle>
          <CardDescription>
            Choose which ad account to connect to this dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No ad accounts found</p>
              <p className="text-sm mt-2">
                Make sure your Meta Business account has active ad accounts
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <RadioGroup value={selectedAccount} onValueChange={setSelectedAccount}>
                {accounts.map((account) => (
                  <div
                    key={account.account_id}
                    className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <RadioGroupItem value={account.account_id} id={account.account_id} />
                    <Label
                      htmlFor={account.account_id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{account.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {account.account_id} • {account.currency} • {account.timezone_name}
                      </div>
                      {account.is_selected && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600">Currently selected</span>
                        </div>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              
              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving || !selectedAccount}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Selection"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}