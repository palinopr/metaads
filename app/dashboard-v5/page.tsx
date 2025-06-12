'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardV5() {
  const router = useRouter()
  
  useEffect(() => {
    // Force clear all validation and redirect to main dashboard
    console.log('Dashboard V5 - Clearing validation flags')
    
    // Set credentials as validated
    if (typeof window !== 'undefined') {
      localStorage.setItem('metaCredentialsValidated', 'true')
      localStorage.setItem('bypassValidation', 'true')
    }
    
    // Redirect to main dashboard
    router.push('/dashboard')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-2xl mb-4">Bypassing validation...</h1>
        <p>Redirecting to dashboard...</p>
      </div>
    </div>
  )
}