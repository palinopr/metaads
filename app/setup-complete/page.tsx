'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function SetupCompletePage() {
  const router = useRouter()

  useEffect(() => {
    // Clear any stale data and redirect to dashboard
    const timer = setTimeout(() => {
      // Force a hard navigation to bypass any client-side issues
      window.location.href = '/dashboard'
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" />
        <h1 className="text-2xl font-bold">Setup Complete!</h1>
        <p className="text-gray-400">Redirecting to your dashboard...</p>
        <p className="text-sm text-gray-500">If you're not redirected, <a href="/dashboard" className="text-blue-400 hover:underline">click here</a></p>
      </div>
    </div>
  )
}