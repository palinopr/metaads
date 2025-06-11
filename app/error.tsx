"use client"

import React, { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug,
  Copy,
  CheckCircle
} from "lucide-react"
import Link from "next/link"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const [copied, setCopied] = React.useState(false)

  useEffect(() => {
    // Log the error to the console and error logging service
    console.error('Application Error:', error)
    
    // Send error to logging API
    fetch('/api/log-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }).catch(console.error)
  }, [error])

  const copyErrorDetails = async () => {
    const errorDetails = `
Error: ${error.message}
Digest: ${error.digest || 'N/A'}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Stack Trace:
${error.stack}
    `.trim()

    try {
      await navigator.clipboard.writeText(errorDetails)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Error Icon and Title */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Something went wrong!</h1>
            <p className="text-muted-foreground mt-2">
              An unexpected error occurred. Our team has been notified.
            </p>
          </div>
        </div>

        {/* Error Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Error Details
            </CardTitle>
            <CardDescription>
              Technical information about the error
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-mono text-sm">
                {error.message || 'An unknown error occurred'}
              </AlertDescription>
            </Alert>
            
            {error.digest && (
              <div className="text-sm">
                <span className="font-semibold">Error ID:</span>{" "}
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  {error.digest}
                </code>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyErrorDetails}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copied!' : 'Copy Error Details'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} size="lg" className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            If this error persists, please try the following:
          </p>
          <ul className="space-y-1 text-left max-w-md mx-auto">
            <li>• Refresh the page</li>
            <li>• Clear your browser cache</li>
            <li>• Check your internet connection</li>
            <li>• Try again in a few minutes</li>
          </ul>
          <div className="pt-4">
            <Link href="/debug" className="text-primary hover:underline">
              Open Debug Panel
            </Link>
            {" "}•{" "}
            <Link href="/logs" className="text-primary hover:underline">
              View System Logs
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}