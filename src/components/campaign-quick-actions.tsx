"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Play, 
  Pause, 
  TrendingUp, 
  Copy, 
  Brain,
  Zap,
  DollarSign,
  BarChart
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CampaignQuickActionsProps {
  campaign: any
  onActionComplete?: () => void
}

export function CampaignQuickActions({ campaign, onActionComplete }: CampaignQuickActionsProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  const handleAction = async (action: string) => {
    setIsProcessing(action)
    
    try {
      switch (action) {
        case 'pause':
        case 'resume':
          // TODO: Implement pause/resume via API
          console.log(`${action} campaign ${campaign.id}`)
          break
          
        case 'duplicate':
          // TODO: Implement duplicate via API
          console.log(`Duplicate campaign ${campaign.id}`)
          break
          
        case 'optimize':
          // Navigate to AI Lab with campaign pre-selected
          router.push(`/dashboard/ai-lab?campaign=${campaign.id}`)
          break
          
        case 'boost':
          // TODO: Implement budget boost
          console.log(`Boost budget for campaign ${campaign.id}`)
          break
      }
      
      if (onActionComplete) {
        onActionComplete()
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error)
    } finally {
      setIsProcessing(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>
          Manage your campaign with one click
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {campaign.status === 'ACTIVE' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('pause')}
            disabled={isProcessing === 'pause'}
            className="gap-2"
          >
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('resume')}
            disabled={isProcessing === 'resume'}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Resume
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('duplicate')}
          disabled={isProcessing === 'duplicate'}
          className="gap-2"
        >
          <Copy className="h-4 w-4" />
          Duplicate
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('optimize')}
          disabled={isProcessing === 'optimize'}
          className="gap-2 text-primary hover:text-primary"
        >
          <Brain className="h-4 w-4" />
          AI Optimize
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('boost')}
          disabled={isProcessing === 'boost'}
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          Boost Budget
        </Button>
      </CardContent>
    </Card>
  )
}