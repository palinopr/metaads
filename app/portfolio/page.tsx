'use client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import dynamicImport from 'next/dynamic'

const PortfolioContent = dynamicImport(
  () => import('@/components/portfolio-content'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    )
  }
)

export default function PortfolioPage() {
  return <PortfolioContent />
}