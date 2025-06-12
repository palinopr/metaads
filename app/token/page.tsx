'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function TokenRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the actual token management page
    router.replace('/settings/token')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400">Redirecting to Token Management...</p>
      </div>
    </div>
  )
}