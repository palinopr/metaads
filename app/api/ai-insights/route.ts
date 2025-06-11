import { NextRequest, NextResponse } from 'next/server'
import { getAIPredictionService } from '@/lib/ai-predictions'
import { Campaign } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { campaigns, action, params, claudeApiKey } = await request.json()
    
    if (!campaigns || !Array.isArray(campaigns)) {
      return NextResponse.json(
        { error: 'Campaigns array is required' },
        { status: 400 }
      )
    }

    const aiService = getAIPredictionService(claudeApiKey)

    let result: any

    switch (action) {
      case 'predictions':
        if (!params.campaign) {
          return NextResponse.json(
            { error: 'Campaign is required for predictions' },
            { status: 400 }
          )
        }
        result = await aiService.getPredictions({
          campaign: params.campaign,
          timeframe: params.timeframe || '30d',
          scenario: params.scenario || 'moderate',
          includeSeasonality: params.includeSeasonality || false,
          includeCompetitorAnalysis: params.includeCompetitorAnalysis || false
        })
        break

      case 'anomalies':
        result = await aiService.detectAnomalies(campaigns, params.lookbackDays || 30)
        break

      case 'recommendations':
        result = await aiService.generateOptimizationRecommendations(campaigns)
        break

      case 'trends':
        result = await aiService.analyzeTrends(campaigns, params.metrics)
        break

      case 'competitor':
        result = await aiService.analyzeCompetitors(campaigns, params.industry || 'ecommerce')
        break

      case 'sentiment':
        if (!params.adCopy) {
          return NextResponse.json(
            { error: 'Ad copy is required for sentiment analysis' },
            { status: 400 }
          )
        }
        result = await aiService.analyzeSentiment(params.adCopy)
        break

      case 'ab-test':
        if (!params.variantA || !params.variantB) {
          return NextResponse.json(
            { error: 'Both variants are required for A/B test analysis' },
            { status: 400 }
          )
        }
        result = await aiService.analyzeABTest(
          params.variantA,
          params.variantB,
          params.confidenceLevel || 0.95
        )
        break

      case 'performance-prediction':
        if (!params.campaign) {
          return NextResponse.json(
            { error: 'Campaign is required for performance prediction' },
            { status: 400 }
          )
        }
        result = await aiService.predictCampaignPerformance(
          params.campaign,
          params.days || 30
        )
        break

      case 'insights':
        result = await aiService.generateInsights(campaigns)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result,
      action,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Insights API error:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'health') {
    return NextResponse.json({
      status: 'healthy',
      service: 'AI Insights API',
      version: '1.0.0',
      features: [
        'predictive-analytics',
        'anomaly-detection',
        'optimization-recommendations',
        'trend-analysis',
        'competitor-intelligence',
        'sentiment-analysis',
        'ab-testing',
        'performance-prediction',
        'insights-generation'
      ],
      timestamp: new Date().toISOString()
    })
  }

  return NextResponse.json(
    { error: 'Use POST method for AI insights operations' },
    { status: 405 }
  )
}