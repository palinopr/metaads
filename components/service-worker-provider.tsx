'use client'

import { useEffect, ReactNode } from 'react'
import { registerServiceWorker } from '@/app/sw-register'
import { toast } from 'sonner'

interface ServiceWorkerProviderProps {
  children: ReactNode
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  useEffect(() => {
    // Only register in production or if explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_SW === 'true') {
      registerServiceWorker()
      
      // Listen for service worker messages
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'SYNC_COMPLETE') {
            toast.success('Data synced successfully', {
              description: `Last sync: ${new Date(event.data.timestamp).toLocaleTimeString()}`
            })
          }
        })
      }
    }
  }, [])

  return <>{children}</>
}