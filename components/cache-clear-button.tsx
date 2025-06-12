'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function CacheClearButton() {
  const [clearing, setClearing] = useState(false)
  const [message, setMessage] = useState('')

  const clearCacheAndReload = async () => {
    setClearing(true)
    setMessage('Clearing cache...')

    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(name => {
            console.log('Deleting cache:', name)
            return caches.delete(name)
          })
        )
        setMessage(`Cleared ${cacheNames.length} caches`)
      }

      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(
          registrations.map(reg => {
            console.log('Unregistering service worker:', reg.scope)
            return reg.unregister()
          })
        )
        setMessage(prev => `${prev}, unregistered ${registrations.length} service workers`)
      }

      // Clear local storage
      localStorage.clear()
      sessionStorage.clear()
      
      setMessage(prev => `${prev}. Reloading...`)
      
      // Force reload after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error('Failed to clear cache:', error)
      setMessage('Failed to clear cache: ' + error)
      setClearing(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={clearCacheAndReload}
        disabled={clearing}
        className="border-gray-700 hover:bg-gray-800"
      >
        {clearing ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Clearing...
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Cache
          </>
        )}
      </Button>
      
      {message && (
        <Alert className="text-xs">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}