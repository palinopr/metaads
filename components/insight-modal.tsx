'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'
import { AIInsights } from './ai-insights'
import { PredictiveAnalytics } from './predictive-analytics'
import { AdSetLevelInsights } from './adset-level-insights'
import { AdLevelPredictions } from './ad-level-predictions'

interface InsightModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'campaign' | 'adset' | 'ad'
  id: string
  name: string
  data?: any
  mode: 'insights' | 'predictions'
}

export function InsightModal({ 
  isOpen, 
  onClose, 
  type, 
  id, 
  name, 
  data,
  mode = 'insights'
}: InsightModalProps) {
  const [activeTab, setActiveTab] = useState(mode)

  const renderContent = () => {
    if (type === 'campaign') {
      return (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights" className="mt-4">
            <AIInsights campaigns={data ? [data] : []} />
          </TabsContent>
          
          <TabsContent value="predictions" className="mt-4">
            <PredictiveAnalytics campaigns={data ? [data] : []} />
          </TabsContent>
        </Tabs>
      )
    }

    if (type === 'adset') {
      return (
        <AdSetLevelInsights
          adsetId={id}
          adsetName={name}
          metrics={data?.metrics}
          targeting={data?.targeting}
        />
      )
    }

    if (type === 'ad') {
      return (
        <AdLevelPredictions
          adId={id}
          adName={name}
          creative={data?.creative}
          currentMetrics={data?.metrics}
        />
      )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="capitalize">{type} Analysis: {name}</span>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}