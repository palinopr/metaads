// Multi-Touch Attribution Engine
// Provides accurate attribution across the customer journey

export interface TouchPoint {
  timestamp: Date
  channel: 'meta_ads' | 'google_ads' | 'email' | 'organic' | 'direct' | 'referral'
  campaignId?: string
  adSetId?: string
  adId?: string
  interaction: 'impression' | 'click' | 'engagement' | 'conversion'
  value?: number
  device: string
  sessionId: string
}

export interface CustomerJourney {
  customerId: string
  touchPoints: TouchPoint[]
  conversionValue: number
  conversionDate: Date
  firstTouch: Date
  lastTouch: Date
  daysBetweenFirstAndLast: number
}

export interface AttributionModel {
  name: string
  calculate(journey: CustomerJourney): Map<string, number>
}

export class AttributionEngine {
  private models: Map<string, AttributionModel> = new Map()

  constructor() {
    this.initializeModels()
  }

  private initializeModels() {
    // Last-Click Attribution
    this.models.set('last-click', {
      name: 'Last-Click Attribution',
      calculate: (journey: CustomerJourney) => {
        const attribution = new Map<string, number>()
        const lastClick = [...journey.touchPoints]
          .reverse()
          .find(tp => tp.interaction === 'click')
        
        if (lastClick && lastClick.campaignId) {
          attribution.set(lastClick.campaignId, journey.conversionValue)
        }
        
        return attribution
      }
    })

    // First-Click Attribution
    this.models.set('first-click', {
      name: 'First-Click Attribution',
      calculate: (journey: CustomerJourney) => {
        const attribution = new Map<string, number>()
        const firstClick = journey.touchPoints
          .find(tp => tp.interaction === 'click')
        
        if (firstClick && firstClick.campaignId) {
          attribution.set(firstClick.campaignId, journey.conversionValue)
        }
        
        return attribution
      }
    })

    // Linear Attribution
    this.models.set('linear', {
      name: 'Linear Attribution',
      calculate: (journey: CustomerJourney) => {
        const attribution = new Map<string, number>()
        const clicks = journey.touchPoints.filter(tp => 
          tp.interaction === 'click' && tp.campaignId
        )
        
        if (clicks.length > 0) {
          const valuePerClick = journey.conversionValue / clicks.length
          
          clicks.forEach(click => {
            if (click.campaignId) {
              const current = attribution.get(click.campaignId) || 0
              attribution.set(click.campaignId, current + valuePerClick)
            }
          })
        }
        
        return attribution
      }
    })

    // Time-Decay Attribution
    this.models.set('time-decay', {
      name: 'Time-Decay Attribution',
      calculate: (journey: CustomerJourney) => {
        const attribution = new Map<string, number>()
        const clicks = journey.touchPoints.filter(tp => 
          tp.interaction === 'click' && tp.campaignId
        )
        
        if (clicks.length > 0) {
          const conversionTime = journey.conversionDate.getTime()
          const halfLife = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
          
          let totalWeight = 0
          const weights = clicks.map(click => {
            const timeDiff = conversionTime - click.timestamp.getTime()
            const weight = Math.pow(2, -timeDiff / halfLife)
            totalWeight += weight
            return weight
          })
          
          clicks.forEach((click, index) => {
            if (click.campaignId) {
              const value = (weights[index] / totalWeight) * journey.conversionValue
              const current = attribution.get(click.campaignId) || 0
              attribution.set(click.campaignId, current + value)
            }
          })
        }
        
        return attribution
      }
    })

    // Data-Driven Attribution (Simplified Shapley Value)
    this.models.set('data-driven', {
      name: 'Data-Driven Attribution (Shapley)',
      calculate: (journey: CustomerJourney) => {
        const attribution = new Map<string, number>()
        const campaigns = new Set<string>()
        
        journey.touchPoints.forEach(tp => {
          if (tp.campaignId && tp.interaction === 'click') {
            campaigns.add(tp.campaignId)
          }
        })
        
        // Simplified Shapley value calculation
        // In production, this would use historical conversion data
        const campaignArray = Array.from(campaigns)
        const marginalContributions = this.calculateMarginalContributions(
          campaignArray,
          journey
        )
        
        marginalContributions.forEach((value, campaign) => {
          attribution.set(campaign, value * journey.conversionValue)
        })
        
        return attribution
      }
    })

    // Position-Based Attribution (U-Shaped)
    this.models.set('position-based', {
      name: 'Position-Based Attribution',
      calculate: (journey: CustomerJourney) => {
        const attribution = new Map<string, number>()
        const clicks = journey.touchPoints.filter(tp => 
          tp.interaction === 'click' && tp.campaignId
        )
        
        if (clicks.length === 0) return attribution
        
        if (clicks.length === 1) {
          attribution.set(clicks[0].campaignId!, journey.conversionValue)
        } else if (clicks.length === 2) {
          attribution.set(clicks[0].campaignId!, journey.conversionValue * 0.5)
          attribution.set(clicks[1].campaignId!, journey.conversionValue * 0.5)
        } else {
          // 40% to first, 40% to last, 20% distributed among middle
          const firstClick = clicks[0]
          const lastClick = clicks[clicks.length - 1]
          const middleClicks = clicks.slice(1, -1)
          
          attribution.set(firstClick.campaignId!, journey.conversionValue * 0.4)
          attribution.set(lastClick.campaignId!, journey.conversionValue * 0.4)
          
          const middleValue = (journey.conversionValue * 0.2) / middleClicks.length
          middleClicks.forEach(click => {
            if (click.campaignId) {
              const current = attribution.get(click.campaignId) || 0
              attribution.set(click.campaignId, current + middleValue)
            }
          })
        }
        
        return attribution
      }
    })
  }

  private calculateMarginalContributions(
    campaigns: string[],
    journey: CustomerJourney
  ): Map<string, number> {
    // Simplified Shapley value calculation
    const contributions = new Map<string, number>()
    
    // In a real implementation, this would:
    // 1. Generate all possible coalitions
    // 2. Calculate conversion probability for each coalition
    // 3. Compute marginal contributions
    // 4. Average across all permutations
    
    // For now, use a simplified approach based on interaction frequency and recency
    campaigns.forEach(campaign => {
      const interactions = journey.touchPoints.filter(tp => 
        tp.campaignId === campaign && tp.interaction === 'click'
      )
      
      const frequency = interactions.length
      const recency = interactions.length > 0 
        ? (journey.conversionDate.getTime() - interactions[interactions.length - 1].timestamp.getTime()) / (1000 * 60 * 60 * 24)
        : Infinity
      
      // Simple scoring: more interactions and more recent = higher contribution
      const score = frequency * Math.pow(0.9, recency)
      contributions.set(campaign, score)
    })
    
    // Normalize contributions
    const totalScore = Array.from(contributions.values()).reduce((a, b) => a + b, 0)
    contributions.forEach((value, key) => {
      contributions.set(key, value / totalScore)
    })
    
    return contributions
  }

  calculateAttribution(
    journey: CustomerJourney,
    modelName: string = 'data-driven'
  ): Map<string, number> {
    const model = this.models.get(modelName)
    if (!model) {
      throw new Error(`Attribution model ${modelName} not found`)
    }
    
    return model.calculate(journey)
  }

  compareModels(journey: CustomerJourney): Map<string, Map<string, number>> {
    const comparison = new Map<string, Map<string, number>>()
    
    this.models.forEach((model, name) => {
      comparison.set(name, model.calculate(journey))
    })
    
    return comparison
  }

  // Advanced Analytics Methods
  
  calculateIncrementality(
    testGroup: CustomerJourney[],
    controlGroup: CustomerJourney[]
  ): {
    lift: number
    confidence: number
    incrementalRevenue: number
  } {
    const testConversions = testGroup.filter(j => j.conversionValue > 0).length
    const controlConversions = controlGroup.filter(j => j.conversionValue > 0).length
    
    const testRate = testConversions / testGroup.length
    const controlRate = controlConversions / controlGroup.length
    
    const lift = (testRate - controlRate) / controlRate
    
    // Calculate statistical significance
    const pooledRate = (testConversions + controlConversions) / (testGroup.length + controlGroup.length)
    const standardError = Math.sqrt(
      pooledRate * (1 - pooledRate) * (1/testGroup.length + 1/controlGroup.length)
    )
    const zScore = (testRate - controlRate) / standardError
    const confidence = this.calculateConfidence(zScore)
    
    const testRevenue = testGroup.reduce((sum, j) => sum + j.conversionValue, 0)
    const controlRevenue = controlGroup.reduce((sum, j) => sum + j.conversionValue, 0)
    const incrementalRevenue = testRevenue - (controlRevenue * testGroup.length / controlGroup.length)
    
    return { lift, confidence, incrementalRevenue }
  }

  private calculateConfidence(zScore: number): number {
    // Simplified confidence calculation
    // In production, use proper statistical libraries
    const absZ = Math.abs(zScore)
    if (absZ > 2.58) return 0.99
    if (absZ > 1.96) return 0.95
    if (absZ > 1.64) return 0.90
    return 1 - Math.exp(-absZ * absZ / 2) / Math.sqrt(2 * Math.PI)
  }

  analyzeCustomerJourneyPatterns(
    journeys: CustomerJourney[]
  ): {
    avgTouchPoints: number
    avgDaysToConversion: number
    commonPaths: Array<{ path: string[], count: number, conversionRate: number }>
    channelInteractions: Map<string, number>
  } {
    const totalTouchPoints = journeys.reduce((sum, j) => sum + j.touchPoints.length, 0)
    const avgTouchPoints = totalTouchPoints / journeys.length
    
    const totalDays = journeys.reduce((sum, j) => sum + j.daysBetweenFirstAndLast, 0)
    const avgDaysToConversion = totalDays / journeys.length
    
    // Analyze common paths
    const pathCounts = new Map<string, { count: number, conversions: number }>()
    journeys.forEach(journey => {
      const path = journey.touchPoints
        .filter(tp => tp.interaction === 'click')
        .map(tp => tp.channel)
        .join(' → ')
      
      const current = pathCounts.get(path) || { count: 0, conversions: 0 }
      current.count++
      if (journey.conversionValue > 0) current.conversions++
      pathCounts.set(path, current)
    })
    
    const commonPaths = Array.from(pathCounts.entries())
      .map(([path, data]) => ({
        path: path.split(' → '),
        count: data.count,
        conversionRate: data.conversions / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    // Channel interaction frequency
    const channelInteractions = new Map<string, number>()
    journeys.forEach(journey => {
      journey.touchPoints.forEach(tp => {
        const current = channelInteractions.get(tp.channel) || 0
        channelInteractions.set(tp.channel, current + 1)
      })
    })
    
    return {
      avgTouchPoints,
      avgDaysToConversion,
      commonPaths,
      channelInteractions
    }
  }
}

// Helper function to build customer journeys from raw data
export function buildCustomerJourney(
  customerId: string,
  interactions: any[],
  conversion?: { value: number, date: Date }
): CustomerJourney {
  const touchPoints: TouchPoint[] = interactions.map(interaction => ({
    timestamp: new Date(interaction.timestamp),
    channel: interaction.channel || 'meta_ads',
    campaignId: interaction.campaign_id,
    adSetId: interaction.adset_id,
    adId: interaction.ad_id,
    interaction: interaction.type,
    value: interaction.value,
    device: interaction.device || 'unknown',
    sessionId: interaction.session_id || 'unknown'
  }))
  
  touchPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  
  const firstTouch = touchPoints[0]?.timestamp || new Date()
  const lastTouch = touchPoints[touchPoints.length - 1]?.timestamp || new Date()
  const daysBetweenFirstAndLast = 
    (lastTouch.getTime() - firstTouch.getTime()) / (1000 * 60 * 60 * 24)
  
  return {
    customerId,
    touchPoints,
    conversionValue: conversion?.value || 0,
    conversionDate: conversion?.date || lastTouch,
    firstTouch,
    lastTouch,
    daysBetweenFirstAndLast
  }
}