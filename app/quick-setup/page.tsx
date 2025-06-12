'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function QuickSetupPage() {
  const router = useRouter()

  useEffect(() => {
    // Save dummy credentials and redirect
    if (typeof window !== 'undefined') {
      localStorage.setItem('meta_access_token', 'YOUR_TOKEN_HERE')
      localStorage.setItem('meta_ad_account_id', 'act_787610255314938')
      localStorage.setItem('metaCredentialsValidated', 'true')
      
      // Force redirect to dashboard
      window.location.href = '/dashboard'
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl mb-4">Quick Setup</h1>
        <p>Setting up credentials and redirecting...</p>
      </div>
    </div>
  )
}