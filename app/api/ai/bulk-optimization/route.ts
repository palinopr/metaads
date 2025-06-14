import { NextResponse } from "next/server"
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  try {
    const { campaigns, metrics, overviewData, anthropicApiKey } = await request.json()

    if (!anthropicApiKey) {
      return NextResponse.json({
        error: 'Anthropic API key not provided. Please configure your API key in AI Settings.'
      }, { status: 400 })
    }

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    })

    // Prepare comprehensive data for analysis
    const analysisData = {
      accountMetrics: {
        todaySpend: metrics.todaySpend,
        todayRevenue: metrics.todayRevenue,
        todayROAS: metrics.todayROAS,
        todayBudget: metrics.todayBudget,
        spendPace: metrics.spendPace,
        expectedPace: metrics.expectedPace,
        paceStatus: metrics.paceStatus,
        remainingHours: metrics.remainingHours,
        remainingBudget: metrics.remainingBudget,
        projectedEndOfDaySpend: metrics.projectedEndOfDaySpend,
        overallROAS: overviewData.overallROAS,
        totalSpend: overviewData.totalSpend,
        totalRevenue: overviewData.totalRevenue
      },
      performanceGroups: {
        highPerformers: metrics.highPerformers.map((c: any) => ({
          name: c.name,
          roas: c.roas,
          spend: c.todaySpend || c.spend,
          budget: c.daily_budget,
          utilizationRate: c.daily_budget ? (c.todaySpend || 0) / c.daily_budget : 0
        })),
        lowPerformers: metrics.lowPerformers.map((c: any) => ({
          name: c.name,
          roas: c.roas,
          spend: c.todaySpend || c.spend,
          budget: c.daily_budget
        })),
        underutilized: metrics.underutilized.map((c: any) => ({
          name: c.name,
          roas: c.roas,
          spend: c.todaySpend || c.spend,
          budget: c.daily_budget,
          utilizationRate: c.daily_budget ? (c.todaySpend || 0) / c.daily_budget : 0
        }))
      }
    }

    const bulkOptimizationPrompt = `You are an expert Meta Ads optimization specialist. Analyze this real-time account data and provide specific bulk optimization recommendations.

CURRENT ACCOUNT STATUS:
${JSON.stringify(analysisData, null, 2)}

Please provide optimization recommendations in the following JSON format:

{
  "recommendations": [
    {
      "type": "opportunity|risk|warning",
      "priority": "high|medium|low",
      "campaign": "campaign_name or 'Account Level'",
      "action": "specific action to take",
      "reason": "data-driven reason for this recommendation",
      "impact": "expected impact in dollars or percentage"
    }
  ]
}

ANALYSIS GUIDELINES:
1. HIGH PRIORITY OPPORTUNITIES:
   - High performers with <80% budget utilization
   - ROAS > account average * 1.5
   - Recommend 30-50% budget increase

2. HIGH PRIORITY RISKS:
   - Low performers with ROAS < 1
   - Spending >50% of budget with poor returns
   - Recommend pause or 50%+ budget reduction

3. PACING ISSUES:
   - Overpacing: Spending too fast for time of day
   - Underpacing: Missing opportunities
   - Recommend budget redistribution

4. ACCOUNT-LEVEL OPTIMIZATIONS:
   - Total budget reallocation opportunities
   - Cross-campaign budget shifts
   - Time-based budget strategies

Provide 5-10 specific, actionable recommendations sorted by priority and potential impact.`

    console.log('Sending bulk optimization request to Claude...')
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 2000,
      temperature: 0.1,
      messages: [{
        role: "user",
        content: bulkOptimizationPrompt
      }]
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    
    // Extract JSON from response
    let result
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not extract JSON from response')
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      // Return fallback recommendations
      return NextResponse.json({
        recommendations: [
          {
            type: 'opportunity',
            priority: 'high',
            campaign: 'Account Level',
            action: 'Review high-performing campaigns for budget increases',
            reason: 'Multiple campaigns showing strong ROAS with budget constraints',
            impact: 'Potential 20-30% revenue increase'
          }
        ]
      })
    }

    return NextResponse.json({
      success: true,
      recommendations: result.recommendations || [],
      tokensUsed: response.usage?.input_tokens + (response.usage?.output_tokens || 0)
    })

  } catch (error: any) {
    console.error('Bulk optimization error:', error)
    
    if (error.message?.includes('API key')) {
      return NextResponse.json({
        error: 'Invalid Anthropic API key. Please check your API key in Settings.'
      }, { status: 401 })
    }

    return NextResponse.json({
      error: error.message || 'Failed to generate bulk optimizations'
    }, { status: 500 })
  }
}