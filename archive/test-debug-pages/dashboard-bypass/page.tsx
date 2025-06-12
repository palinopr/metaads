'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CredentialManager } from '@/lib/credential-manager'

export default function DashboardBypass() {
  const router = useRouter()
  
  useEffect(() => {
    async function bypassAndRedirect() {
      // Force save the working credentials
      const workingCreds = {
        accessToken: 'EAATKZBg465ucBO7LlPXw5pZBVFKX4edsRkiVh9Lm68YUJUMkBR2UUvlbYG4rZCwkbf6mrl2BmJroBgkThXsoqhJwfe1tYkvj8t7O550TOJ56r5AnZBJGuqR0ZApBG02aUflSmg34G9rewZBlqEgBw5l8OW7vDLUUHpBYYpgRCbaZBWrTB0SlFlOZCdxZCrZAYJRUmR6CEBMqKMx3ZAfHDPeA0ec1Td6frnuQD1y',
        adAccountId: 'act_787610255314938'
      }
      
      await CredentialManager.save(workingCreds, true)
      
      // Force clear service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          await registration.unregister()
        }
      }
      
      // Clear all caches
      if ('caches' in window) {
        const names = await caches.keys()
        await Promise.all(names.map(name => caches.delete(name)))
      }
      
      // Redirect to dashboard
      window.location.href = '/dashboard'
    }
    
    bypassAndRedirect()
  }, [])
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-2xl mb-4">Bypassing cache and setting credentials...</h1>
        <p>You will be redirected to the dashboard shortly.</p>
      </div>
    </div>
  )
}