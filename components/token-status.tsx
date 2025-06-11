'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Key, RefreshCw, CheckCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface TokenStatusProps {
  error?: string | null
  onTokenUpdate?: (token: string) => void
}

export function TokenStatus({ error, onTokenUpdate }: TokenStatusProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newToken, setNewToken] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  // Show dialog if token expired
  useEffect(() => {
    if (error?.includes('expired') || error?.includes('access token')) {
      setIsOpen(true)
    }
  }, [error])

  const validateToken = async (token: string) => {
    setIsValidating(true)
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${token}`
      )
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      return true
    } catch (err) {
      console.error('Token validation failed:', err)
      return false
    } finally {
      setIsValidating(false)
    }
  }

  const handleTokenUpdate = async () => {
    if (!newToken.trim()) {
      toast.error('Please enter a token')
      return
    }

    const isValid = await validateToken(newToken)
    
    if (isValid) {
      // Update in localStorage
      localStorage.setItem('META_ACCESS_TOKEN', newToken)
      
      // Call parent callback
      if (onTokenUpdate) {
        onTokenUpdate(newToken)
      }
      
      toast.success('Token updated successfully!')
      setIsOpen(false)
      setNewToken('')
      
      // Reload to apply new token
      window.location.reload()
    } else {
      toast.error('Invalid token. Please check and try again.')
    }
  }

  if (!error?.includes('expired') && !error?.includes('access token')) {
    return null
  }

  return (
    <>
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Meta Access Token Expired</AlertTitle>
        <AlertDescription className="mt-2">
          <p>{error}</p>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="mt-2">
                <Key className="mr-2 h-4 w-4" />
                Update Token
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Update Meta Access Token</DialogTitle>
                <DialogDescription>
                  Your Meta access token has expired. Generate a new one and paste it below.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Quick Links:</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://developers.facebook.com/tools/explorer/', '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Graph Explorer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://developers.facebook.com/tools/debug/accesstoken/', '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Token Debugger
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token">New Access Token</Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="Paste your new token here..."
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    The token will be stored locally in your browser.
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Need help?</strong> Check the META_TOKEN_REFRESH_GUIDE.md file for detailed instructions.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleTokenUpdate} disabled={isValidating}>
                  {isValidating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Update Token
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </AlertDescription>
      </Alert>
    </>
  )
}