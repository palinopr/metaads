'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TokenStatus } from '@/components/token-status'

export default function TestTokenErrorPage() {
  const [error, setError] = useState<string | null>(
    'Error validating access token: Session has expired on Friday, 06-Jun-25 22:00:00 PDT. The current time is Friday, 06-Jun-25 22:18:16 PDT.'
  )

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Token Error Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              This page tests the token error UI. You should see the token update dialog below.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Current error:</p>
            <code className="block p-2 bg-muted rounded text-xs">
              {error || 'No error'}
            </code>
          </div>

          <TokenStatus 
            error={error}
            onTokenUpdate={(newToken) => {
              console.log('New token:', newToken)
              setError(null)
            }}
          />

          <div className="flex gap-2">
            <Button 
              onClick={() => setError('Error validating access token: Session has expired')}
              variant="outline"
              size="sm"
            >
              Simulate Token Error
            </Button>
            <Button 
              onClick={() => setError(null)}
              variant="outline"
              size="sm"
            >
              Clear Error
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}