"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, TrendingUp, TrendingDown, Activity, Pause, Play } from "lucide-react"

interface TimelineEvent {
  id: string
  campaignId: string
  campaignName: string
  type: 'created' | 'paused' | 'resumed' | 'budget_change' | 'performance_spike' | 'performance_drop'
  timestamp: Date
  description: string
  value?: number
  previousValue?: number
  impact?: 'positive' | 'negative' | 'neutral'
}

interface CampaignTimelineProps {
  campaigns: any[]
}

export function CampaignTimeline({ campaigns }: CampaignTimelineProps) {
  const [timeRange, setTimeRange] = useState('7d')
  const [filterType, setFilterType] = useState('all')

  // Generate simulated timeline events
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = []
    const now = new Date()

    campaigns.forEach(campaign => {
      // Campaign creation event
      const daysAgo = Math.floor(Math.random() * 30) + 1
      const createdDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      
      events.push({
        id: `${campaign.id}-created`,
        campaignId: campaign.id,
        campaignName: campaign.name,
        type: 'created',
        timestamp: createdDate,
        description: 'Campaign launched',
        impact: 'neutral'
      })

      // Status changes
      if (campaign.status === 'PAUSED' && campaign.spend > 0) {
        const pauseDaysAgo = Math.floor(Math.random() * 10) + 1
        const pauseDate = new Date(now.getTime() - pauseDaysAgo * 24 * 60 * 60 * 1000)
        
        events.push({
          id: `${campaign.id}-paused`,
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'paused',
          timestamp: pauseDate,
          description: 'Campaign paused',
          impact: 'neutral'
        })
      }

      // Performance events
      if (campaign.roas > 3) {
        const spikeDaysAgo = Math.floor(Math.random() * 7) + 1
        const spikeDate = new Date(now.getTime() - spikeDaysAgo * 24 * 60 * 60 * 1000)
        
        events.push({
          id: `${campaign.id}-spike`,
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'performance_spike',
          timestamp: spikeDate,
          description: 'Performance spike detected',
          value: campaign.roas,
          impact: 'positive'
        })
      }

      if (campaign.roas < 1 && campaign.spend > 100) {
        const dropDaysAgo = Math.floor(Math.random() * 5) + 1
        const dropDate = new Date(now.getTime() - dropDaysAgo * 24 * 60 * 60 * 1000)
        
        events.push({
          id: `${campaign.id}-drop`,
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'performance_drop',
          timestamp: dropDate,
          description: 'Performance drop detected',
          value: campaign.roas,
          impact: 'negative'
        })
      }
    })

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [campaigns])

  // Filter events based on time range and type
  const filteredEvents = useMemo(() => {
    const now = new Date()
    const timeRangeMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity
    }[timeRange]

    return timelineEvents.filter(event => {
      const timeDiff = now.getTime() - event.timestamp.getTime()
      const withinTimeRange = timeDiff <= timeRangeMs
      const matchesType = filterType === 'all' || event.type === filterType
      return withinTimeRange && matchesType
    })
  }, [timelineEvents, timeRange, filterType])

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <Play className="h-4 w-4" />
      case 'paused':
        return <Pause className="h-4 w-4" />
      case 'resumed':
        return <Play className="h-4 w-4" />
      case 'performance_spike':
        return <TrendingUp className="h-4 w-4" />
      case 'performance_drop':
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getEventColor = (impact?: string) => {
    switch (impact) {
      case 'positive':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'negative':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      default:
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 30) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Campaign Timeline
            </CardTitle>
            <CardDescription>
              Track campaign events and performance changes
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24h</SelectItem>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="performance_spike">Spikes</SelectItem>
                <SelectItem value="performance_drop">Drops</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
          
          {/* Events */}
          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No events in the selected time range
              </div>
            ) : (
              filteredEvents.map((event, index) => (
                <div key={event.id} className="relative flex items-start gap-4">
                  {/* Event dot and icon */}
                  <div
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background ${getEventColor(
                      event.impact
                    )}`}
                  >
                    {getEventIcon(event.type)}
                  </div>
                  
                  {/* Event content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm line-clamp-1">
                          {event.campaignName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {event.description}
                          {event.value && (
                            <span className="font-medium ml-1">
                              ({event.value.toFixed(2)}x ROAS)
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(event.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}