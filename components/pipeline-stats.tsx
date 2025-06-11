// Pipeline Performance Statistics Component
"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Activity, Database, Zap, Shield, Clock, TrendingUp } from "lucide-react"

export interface PipelineStats {
  cacheHitRate: number
  apiCallsSaved: number
  rateLimitStatus: {
    currentUsage: number
    maxAllowed: number
    resetTime: Date
  }
  validationErrors: number
  batchEfficiency: number
}

interface PipelineStatsProps {
  stats: PipelineStats | null
  className?: string
}

export function PipelineStatsCard({ stats, className = "" }: PipelineStatsProps) {
  if (!stats) return null

  const rateLimitPercent = (stats.rateLimitStatus.currentUsage / stats.rateLimitStatus.maxAllowed) * 100
  const resetTime = new Date(stats.rateLimitStatus.resetTime)
  const timeUntilReset = Math.max(0, resetTime.getTime() - Date.now())
  const minutesUntilReset = Math.ceil(timeUntilReset / (1000 * 60))

  return (
    <Card className={`bg-gray-800/50 border-gray-700 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          Pipeline Performance
        </CardTitle>
        <CardDescription className="text-xs text-gray-400">
          Real-time data pipeline metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Cache Performance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-gray-300">
              <Database className="w-3 h-3" />
              Cache Hit Rate
            </span>
            <Badge 
              variant={stats.cacheHitRate > 0.8 ? "default" : stats.cacheHitRate > 0.5 ? "secondary" : "destructive"}
              className="text-xs"
            >
              {(stats.cacheHitRate * 100).toFixed(1)}%
            </Badge>
          </div>
          <Progress 
            value={stats.cacheHitRate * 100} 
            className="h-1.5"
          />
        </div>

        {/* API Calls Saved */}
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-gray-300">
            <Zap className="w-3 h-3" />
            API Calls Saved
          </span>
          <span className="text-green-400 font-medium">
            {stats.apiCallsSaved}
          </span>
        </div>

        {/* Rate Limit Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-gray-300">
              <Shield className="w-3 h-3" />
              Rate Limit
            </span>
            <span className="text-gray-300">
              {stats.rateLimitStatus.currentUsage}/{stats.rateLimitStatus.maxAllowed}
            </span>
          </div>
          <Progress 
            value={rateLimitPercent} 
            className="h-1.5"
          />
          {minutesUntilReset > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              Resets in {minutesUntilReset}m
            </div>
          )}
        </div>

        {/* Batch Efficiency */}
        {stats.batchEfficiency > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-gray-300">
              <TrendingUp className="w-3 h-3" />
              Batch Efficiency
            </span>
            <Badge 
              variant={stats.batchEfficiency > 0.9 ? "default" : "secondary"}
              className="text-xs"
            >
              {(stats.batchEfficiency * 100).toFixed(1)}%
            </Badge>
          </div>
        )}

        {/* Validation Errors */}
        {stats.validationErrors > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300">Validation Errors</span>
            <Badge variant="destructive" className="text-xs">
              {stats.validationErrors}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version for smaller spaces
export function PipelineStatsCompact({ stats }: PipelineStatsProps) {
  if (!stats) return null

  return (
    <div className="flex items-center gap-3 text-xs text-gray-400">
      <div className="flex items-center gap-1">
        <Database className="w-3 h-3" />
        <span>{(stats.cacheHitRate * 100).toFixed(0)}% cache</span>
      </div>
      <div className="flex items-center gap-1">
        <Zap className="w-3 h-3" />
        <span>{stats.apiCallsSaved} saved</span>
      </div>
      <div className="flex items-center gap-1">
        <Shield className="w-3 h-3" />
        <span>{stats.rateLimitStatus.currentUsage}/{stats.rateLimitStatus.maxAllowed}</span>
      </div>
    </div>
  )
}