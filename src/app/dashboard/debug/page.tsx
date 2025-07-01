"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Loader2,
  Key,
  Database,
  User,
  Building2
} from "lucide-react"

export default function DebugPage() {
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  const runTests = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/meta/test")
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      console.error("Test failed:", error)
      setTestResults({ error: "Failed to run tests" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const StatusIcon = ({ success }: { success: boolean }) => {
    return success ? (
      <CheckCircle2 className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!testResults) {
    return (
      <div className="p-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No test results available</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meta API Debug</h1>
          <p className="text-muted-foreground mt-2">
            Test your Meta integration and API connections
          </p>
        </div>
        <Button onClick={runTests} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Run Tests
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Token Status</p>
              <div className="flex items-center gap-2">
                <StatusIcon success={testResults.summary?.hasValidToken} />
                <span className="font-medium">
                  {testResults.summary?.hasValidToken ? "Valid" : "Invalid"}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Ad Accounts</p>
              <div className="flex items-center gap-2">
                <StatusIcon success={testResults.summary?.hasAdAccounts} />
                <span className="font-medium">
                  {testResults.tests?.adAccounts?.count || 0} found
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Selected Account</p>
              <div className="flex items-center gap-2">
                <StatusIcon success={testResults.summary?.hasSelectedAccount} />
                <span className="font-medium">
                  {testResults.summary?.hasSelectedAccount ? "Yes" : "None"}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Errors</p>
              <div className="flex items-center gap-2">
                {testResults.summary?.totalErrors === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                <span className="font-medium">
                  {testResults.summary?.totalErrors || 0} errors
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Account Info */}
      {testResults.selectedAccount && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Selected Ad Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {testResults.selectedAccount.name}</p>
              <p><span className="font-medium">Account ID:</span> {testResults.selectedAccount.accountId}</p>
              <p><span className="font-medium">Internal ID:</span> {testResults.selectedAccount.id}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Info */}
      {testResults.tests?.userInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.tests.userInfo.success ? (
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {testResults.tests.userInfo.data.name}</p>
                <p><span className="font-medium">ID:</span> {testResults.tests.userInfo.data.id}</p>
                <p><span className="font-medium">Email:</span> {testResults.tests.userInfo.data.email || "Not available"}</p>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>Failed to fetch user information</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Permissions */}
      {testResults.tests?.permissions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Granted Permissions:</p>
                <div className="flex flex-wrap gap-2">
                  {testResults.tests.permissions.granted?.map((perm: string) => (
                    <Badge key={perm} variant="outline" className="text-green-700">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>
              {testResults.tests.permissions.declined?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Declined Permissions:</p>
                  <div className="flex flex-wrap gap-2">
                    {testResults.tests.permissions.declined.map((perm: string) => (
                      <Badge key={perm} variant="outline" className="text-red-700">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ad Accounts */}
      {testResults.tests?.adAccounts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Ad Accounts ({testResults.tests.adAccounts.count})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.tests.adAccounts.success ? (
              <div className="space-y-3">
                {testResults.tests.adAccounts.accounts.map((account: any) => (
                  <div key={account.account_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{account.name}</h4>
                      <Badge variant={account.status === "ACTIVE" ? "default" : "secondary"}>
                        {account.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <p>ID: {account.account_id}</p>
                      <p>Currency: {account.currency}</p>
                      <p>Spent: {account.amount_spent}</p>
                      <p>Business: {account.business_name || "Personal"}</p>
                    </div>
                    {account.capabilities && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Capabilities:</p>
                        <div className="flex flex-wrap gap-1">
                          {account.capabilities.map((cap: string) => (
                            <Badge key={cap} variant="outline" className="text-xs">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>Failed to fetch ad accounts</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Insights Test */}
      {testResults.tests?.insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Insights API Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.tests.insights.success ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Query: {testResults.tests.insights.query}</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(testResults.tests.insights.data, null, 2)}
                </pre>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {testResults.tests.insights.message || "Insights API not available"}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {testResults.errors?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-700">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.errors.map((error: any, index: number) => (
                <Alert key={index} variant="destructive">
                  <AlertDescription>
                    <p className="font-medium">{error.test}:</p>
                    <pre className="mt-2 text-xs">{JSON.stringify(error.error, null, 2)}</pre>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Response */}
      <Card>
        <CardHeader>
          <CardTitle>Raw API Response</CardTitle>
          <CardDescription>Complete test results for debugging</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}