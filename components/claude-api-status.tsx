'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Brain, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { claudeAPI } from '@/lib/claude-api-manager'

interface APIStatus {
  queueLength: number
  requestsThisMinute: number
  maxRequestsPerMinute: number
  resetIn: number
}

export function ClaudeAPIStatus() {
  const [status, setStatus] = useState<APIStatus | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    // Check initial availability
    setIsAvailable(claudeAPI.isAvailable())

    // Update status every 5 seconds
    const updateStatus = () => {
      const newStatus = claudeAPI.getQueueStatus()
      setStatus(newStatus)
    }

    updateStatus()
    const interval = setInterval(updateStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  if (!isAvailable) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Claude AI not configured. Add NEXT_PUBLIC_ANTHROPIC_API_KEY to enable AI insights.
        </AlertDescription>
      </Alert>
    )
  }

  if (!status) return null

  const usagePercent = (status.requestsThisMinute / status.maxRequestsPerMinute) * 100
  const isNearLimit = usagePercent > 80
  const isAtLimit = usagePercent >= 100

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle>Claude AI Status</CardTitle>
          </div>
          <Badge variant={isAtLimit ? "destructive" : isNearLimit ? "secondary" : "default"}>
            {isAtLimit ? "Rate Limited" : isNearLimit ? "Near Limit" : "Active"}
          </Badge>
        </div>
        <CardDescription>
          API usage and queue status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>API Usage</span>
            <span className="text-muted-foreground">
              {status.requestsThisMinute} / {status.maxRequestsPerMinute} requests
            </span>
          </div>
          <Progress value={usagePercent} className="h-2" />
        </div>

        {/* Queue Status */}
        {status.queueLength > 0 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {status.queueLength} request{status.queueLength > 1 ? 's' : ''} in queue
            </AlertDescription>
          </Alert>
        )}

        {/* Reset Timer */}
        {status.resetIn > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rate limit resets in</span>
            <Badge variant="outline">{status.resetIn}s</Badge>
          </div>
        )}

        {/* Recommendations */}
        {isAtLimit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Rate limit reached. New requests are queued with 12s intervals.
            </AlertDescription>
          </Alert>
        )}

        {isNearLimit && !isAtLimit && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Approaching rate limit. Consider batching analyses.
            </AlertDescription>
          </Alert>
        )}

        {!isNearLimit && !isAtLimit && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>API operating normally</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}