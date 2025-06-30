"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestAuthPage() {
  const { data: session, status } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    // Check for OAuth errors in URL
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')
    const errorDesc = urlParams.get('error_description')
    
    if (errorParam) {
      setError(`OAuth Error: ${errorParam} - ${errorDesc || 'No description'}`)
    }

    // Get debug info
    setDebugInfo({
      currentUrl: window.location.href,
      authUrl: process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'Not set',
      hasSession: !!session,
      sessionStatus: status,
    })
  }, [session, status])

  const handleSignIn = async () => {
    try {
      setError(null)
      const result = await signIn('facebook', {
        redirect: false,
        callbackUrl: '/test-auth'
      })
      
      if (result?.error) {
        setError(`SignIn Error: ${result.error}`)
      }
    } catch (err: any) {
      setError(`Exception: ${err.message}`)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Auth Test Page</h1>

      {/* Current Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
          <CardDescription>Current session information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Logged In:</strong> {session ? 'Yes' : 'No'}</p>
            {session?.user && (
              <>
                <p><strong>Name:</strong> {session.user.name || 'Not provided'}</p>
                <p><strong>Email:</strong> {session.user.email || 'Not provided'}</p>
                <p><strong>ID:</strong> {session.user.id || 'Not provided'}</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {error && (
        <Card className="mb-6 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap">{error}</pre>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!session ? (
            <>
              <Button onClick={handleSignIn} className="w-full">
                Sign In with Facebook
              </Button>
              <Button 
                onClick={() => signIn('facebook')} 
                variant="outline" 
                className="w-full"
              >
                Sign In with Facebook (Redirect)
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => signOut({ callbackUrl: '/test-auth' })} 
              variant="outline"
              className="w-full"
            >
              Sign Out
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-auto">
{JSON.stringify(debugInfo, null, 2)}
          </pre>
          
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Provider Check:</p>
            <Button
              onClick={async () => {
                const res = await fetch('/api/auth/providers')
                const providers = await res.json()
                setDebugInfo((prev: any) => ({ ...prev, providers }))
              }}
              size="sm"
              variant="outline"
            >
              Check Providers
            </Button>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Session Check:</p>
            <Button
              onClick={async () => {
                const res = await fetch('/api/auth/session')
                const sessionData = await res.json()
                setDebugInfo((prev: any) => ({ ...prev, sessionData }))
              }}
              size="sm"
              variant="outline"
            >
              Check Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}