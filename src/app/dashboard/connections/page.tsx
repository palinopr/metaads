"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Facebook, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function ConnectionsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isConnecting, setIsConnecting] = useState(false)
  const [metaConnection, setMetaConnection] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    // Check if user has existing Meta connection
    checkMetaConnection()
  }, [])

  const checkMetaConnection = async () => {
    try {
      const response = await fetch("/api/connections/meta")
      if (response.ok) {
        const data = await response.json()
        setMetaConnection(data.connection)
      }
    } catch (error) {
      console.error("Error checking Meta connection:", error)
    }
  }

  const handleMetaConnect = async () => {
    setIsConnecting(true)
    setError("")
    
    try {
      // Initialize Meta OAuth flow
      const response = await fetch("/api/auth/meta/url")
      const data = await response.json()
      
      if (data.url) {
        // Redirect to Meta OAuth
        window.location.href = data.url
      } else {
        throw new Error("Failed to get Meta OAuth URL")
      }
    } catch (error: any) {
      setError(error.message || "Failed to connect to Meta")
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      const response = await fetch("/api/connections/meta", {
        method: "DELETE"
      })
      
      if (response.ok) {
        setMetaConnection(null)
      }
    } catch (error) {
      console.error("Error disconnecting:", error)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Connections</h1>
        <p className="text-muted-foreground mt-2">
          Connect your advertising accounts to start managing campaigns
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Meta (Facebook) Connection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Facebook className="h-6 w-6 text-blue-600" />
              </div>
              Meta Business
            </CardTitle>
            <CardDescription>
              Connect your Meta Business account to manage Facebook and Instagram ads
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metaConnection ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Connected</p>
                      <p className="text-sm text-muted-foreground">
                        {metaConnection.name || metaConnection.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </Button>
                </div>
                
                <Button 
                  className="w-full"
                  onClick={() => router.push("/dashboard/connections/meta/accounts")}
                >
                  Manage Ad Accounts
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full"
                onClick={handleMetaConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Facebook className="mr-2 h-4 w-4" />
                    Connect Meta Business
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Google Ads Card (Coming Soon) */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              Google Ads
            </CardTitle>
            <CardDescription>
              Connect your Google Ads account (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}