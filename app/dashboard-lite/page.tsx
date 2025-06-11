'use client'

import dynamic from 'next/dynamic'
import { Suspense, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Lazy load heavy components with proper default export handling
const Overview = dynamic(
  () => import('@/components/overview').then(mod => ({ default: mod.default || mod.Overview || mod })),
  {
    loading: () => <LoadingSkeleton />,
    ssr: false
  }
)

const AIInsights = dynamic(
  () => import('@/components/ai-insights').then(mod => ({ default: mod.default || mod.AIInsights || mod })),
  {
    loading: () => <LoadingSkeleton />,
    ssr: false
  }
)

const PredictiveAnalytics = dynamic(
  () => import('@/components/predictive-analytics').then(mod => ({ default: mod.default || mod.PredictiveAnalytics || mod })),
  {
    loading: () => <LoadingSkeleton />,
    ssr: false
  }
)

const CampaignComparison = dynamic(
  () => import('@/components/campaign-comparison').then(mod => ({ default: mod.default || mod.CampaignComparison || mod })),
  {
    loading: () => <LoadingSkeleton />,
    ssr: false
  }
)

const EnhancedCampaignsTab = dynamic(
  () => import('@/components/enhanced-campaigns-tab').then(mod => ({ default: mod.default || mod.EnhancedCampaignsTab || mod })),
  {
    loading: () => <LoadingSkeleton />,
    ssr: false
  }
)

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

export default function DashboardLitePage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Lite</h2>
        <p className="text-muted-foreground">
          Optimized version with better performance
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <Suspense fallback={<LoadingSkeleton />}>
            <Overview />
          </Suspense>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Suspense fallback={<LoadingSkeleton />}>
            <EnhancedCampaignsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-4">
          <Suspense fallback={<LoadingSkeleton />}>
            <AIInsights />
          </Suspense>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Suspense fallback={<LoadingSkeleton />}>
            <PredictiveAnalytics />
          </Suspense>
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <Suspense fallback={<LoadingSkeleton />}>
            <CampaignComparison />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}