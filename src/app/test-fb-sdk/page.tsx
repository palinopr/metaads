"use client"

import { useEffect, useState } from "react"
import Script from "next/script"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

declare global {
  interface Window {
    FB: any
    fbAsyncInit: () => void
  }
}

export default function TestFacebookSDK() {
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [loginStatus, setLoginStatus] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '1349075236218599',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      })
      
      setSdkLoaded(true)
      checkLoginStatus()
    }
  }, [])

  const checkLoginStatus = () => {
    if (!window.FB) return
    
    window.FB.getLoginStatus((response: any) => {
      setLoginStatus(response)
      if (response.status === 'connected') {
        fetchUserInfo()
      }
    })
  }

  const handleFBLogin = () => {
    if (!window.FB) {
      setError('Facebook SDK not loaded')
      return
    }

    window.FB.login((response: any) => {
      if (response.authResponse) {
        setLoginStatus(response)
        fetchUserInfo()
      } else {
        setError('User cancelled login or did not fully authorize.')
      }
    }, {scope: 'public_profile,email'})
  }

  const fetchUserInfo = () => {
    window.FB.api('/me', {fields: 'id,name,email,picture'}, (response: any) => {
      if (response.error) {
        setError(response.error.message)
      } else {
        setUserInfo(response)
      }
    })
  }

  const handleFBLogout = () => {
    window.FB.logout((response: any) => {
      setLoginStatus(null)
      setUserInfo(null)
    })
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src="https://connect.facebook.net/en_US/sdk.js"
      />
      
      <div className="container mx-auto py-10 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Facebook SDK Test (Direct)</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>SDK Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>SDK Loaded:</strong> {sdkLoaded ? 'Yes' : 'No'}</p>
            <p><strong>App ID:</strong> {process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '1349075236218599'}</p>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border-red-500">
            <CardHeader>
              <CardTitle className="text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Login Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loginStatus ? (
              <pre className="text-sm bg-muted p-4 rounded overflow-auto">
                {JSON.stringify(loginStatus, null, 2)}
              </pre>
            ) : (
              <p>Not checked yet</p>
            )}
          </CardContent>
        </Card>

        {userInfo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>User Info</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded overflow-auto">
                {JSON.stringify(userInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={checkLoginStatus} 
              disabled={!sdkLoaded}
              variant="outline"
              className="w-full"
            >
              Check Login Status
            </Button>
            
            {loginStatus?.status !== 'connected' ? (
              <Button 
                onClick={handleFBLogin} 
                disabled={!sdkLoaded}
                className="w-full"
              >
                Login with Facebook (Direct SDK)
              </Button>
            ) : (
              <Button 
                onClick={handleFBLogout} 
                disabled={!sdkLoaded}
                variant="outline"
                className="w-full"
              >
                Logout
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-sm text-muted-foreground">
          <p>This page tests Facebook login directly using the Facebook SDK, bypassing NextAuth.</p>
          <p>If this works but NextAuth doesn't, the issue is with NextAuth configuration.</p>
          <p>If this also fails, the issue is with the Facebook App configuration.</p>
        </div>
      </div>
    </>
  )
}