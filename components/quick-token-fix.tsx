'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Key, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export function QuickTokenFix() {
  const [token, setToken] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showForm, setShowForm] = useState(true)

  const handleUpdate = async () => {
    if (!token.trim()) {
      toast.error('Please enter a token')
      return
    }

    setIsUpdating(true)
    
    // Save to localStorage
    localStorage.setItem('metaAccessToken', token.trim())
    
    // If there's a META_ACCESS_TOKEN key, update that too
    localStorage.setItem('META_ACCESS_TOKEN', token.trim())
    
    toast.success('Token updated! Refreshing page...')
    
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  if (!showForm) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Token Expired - Quick Fix
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert className="py-2">
            <AlertDescription className="text-xs">
              Your Meta token has expired. Get a new one from{' '}
              <a
                href="https://developers.facebook.com/tools/explorer/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Graph Explorer
              </a>
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Paste new token here..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
            />
            <Button
              onClick={handleUpdate}
              disabled={isUpdating || !token.trim()}
              className="w-full"
              size="sm"
            >
              {isUpdating ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Update Token
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}