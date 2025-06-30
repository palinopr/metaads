"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle } from "lucide-react"

export default function AdminTestPage() {
  const { data: session } = useSession()
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  // Direct hardcoded check
  const isAdminDirect = session?.user?.email === "jaime@outletmedia.net"
  
  useEffect(() => {
    if (session?.user?.email) {
      testAdminApi()
    }
  }, [session])
  
  const testAdminApi = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/override")
      const data = await response.json()
      setApiResponse(data)
    } catch (error) {
      console.error("Error testing admin API:", error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin Access Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <strong>Your email:</strong> 
            <code className="bg-muted px-2 py-1 rounded">{session?.user?.email || "Not logged in"}</code>
          </div>
          <div className="flex items-center gap-2">
            <strong>Email type:</strong> 
            <code className="bg-muted px-2 py-1 rounded">{typeof session?.user?.email}</code>
          </div>
          <div className="flex items-center gap-2">
            <strong>Email length:</strong> 
            <code className="bg-muted px-2 py-1 rounded">{session?.user?.email?.length || 0} characters</code>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Direct Admin Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {isAdminDirect ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="text-lg">
              {isAdminDirect ? "You ARE an admin (direct check)" : "You are NOT an admin (direct check)"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Checking if email === "jaime@outletmedia.net"
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>API Admin Check</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : apiResponse ? (
            <pre className="bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          ) : (
            <p>No response yet</p>
          )}
          <Button onClick={testAdminApi} className="mt-4">
            Test Admin API
          </Button>
        </CardContent>
      </Card>
      
      <Alert>
        <AlertDescription>
          <strong>What this page does:</strong>
          <ul className="list-disc list-inside mt-2">
            <li>Shows your exact email from the session</li>
            <li>Tests if your email exactly matches "jaime@outletmedia.net"</li>
            <li>Calls the admin API to verify server-side admin check</li>
            <li>All checks are hardcoded to avoid environment variable issues</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            onClick={() => window.location.href = "/dashboard/admin/agent-settings"}
            className="w-full"
          >
            Try to Access Admin Settings
          </Button>
          <Button 
            onClick={() => window.location.href = "/dashboard"}
            variant="outline"
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}