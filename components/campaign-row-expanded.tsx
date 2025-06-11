"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CampaignPredictiveMini } from '@/components/campaign-predictive-mini'
import { 
  ChevronRight, ChevronDown, BarChart3,
  TrendingUp, TrendingDown
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CampaignRowExpandedProps {
  campaign: any
  onViewDetails: (campaignId: string) => void
}

export function CampaignRowExpanded({ campaign, onViewDetails }: CampaignRowExpandedProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      <tr className="border-b hover:bg-muted/50 transition-colors">
        <td className="p-2">
          <div className="flex items-start gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 mt-0.5"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <div>
              <div className="font-medium">{campaign.name}</div>
              <div className="text-xs text-muted-foreground">
                {campaign.objective} • {campaign.daysRunning} days
              </div>
            </div>
          </div>
        </td>
        <td className="p-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Progress 
                value={campaign.performanceScore} 
                className="h-2"
              />
            </div>
            <span className="text-xs font-medium w-10 text-right">
              {campaign.performanceScore}%
            </span>
          </div>
          <Badge
            variant={campaign.effective_status === 'ACTIVE' ? 'default' : 'secondary'}
            className="mt-1"
          >
            {campaign.effective_status}
          </Badge>
        </td>
        <td className="text-right p-2">
          <div className="font-medium">
            {formatCurrency(campaign.insights?.spend || 0)}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatCurrency(campaign.insights?.revenue || 0)} rev
          </div>
        </td>
        <td className="text-right p-2">
          {campaign.todayData ? (
            <>
              <div className="font-medium">
                {formatCurrency(campaign.todayData.spend)}
              </div>
              <div className="text-xs text-muted-foreground">
                {campaign.todayData.conversions} conv
              </div>
            </>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </td>
        <td className="text-right p-2">
          <div className={cn(
            "font-medium",
            campaign.lifetimeROAS >= 1 ? "text-green-600" : "text-red-600"
          )}>
            {campaign.lifetimeROAS.toFixed(2)}x
          </div>
          <div className="text-xs text-muted-foreground">
            {campaign.insights?.ctr?.toFixed(2) || 0}% CTR
          </div>
        </td>
        <td className="text-right p-2">
          <div className="text-xs">
            <div>{formatCurrency(campaign.insights?.cpa || 0)} CPA</div>
            <div>{formatCurrency(campaign.insights?.cpc || 0)} CPC</div>
          </div>
        </td>
        <td className="text-center p-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewDetails(campaign.id)}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </td>
      </tr>
      
      {isExpanded && (
        <tr className="border-b bg-muted/30">
          <td colSpan={7} className="p-4">
            <div className="max-w-2xl mx-auto">
              <CampaignPredictiveMini 
                campaign={campaign}
                onViewDetails={() => onViewDetails(campaign.id)}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}