import { NextResponse } from "next/server"
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  try {
    const { campaign, accountAvgROAS, currentHour, percentDayRemaining, anthropicApiKey } = await request.json()

    if (!anthropicApiKey) {
      return NextResponse.json({
        error: 'Anthropic API key not provided. Please configure your API key in AI Settings.'
      }, { status: 400 })
    }

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    })

    // Prepare real-time analysis data
    const realtimeData = {
      currentTime: {
        hour: currentHour,
        percentDayRemaining,
        timeOfDay: currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : currentHour < 20 ? 'evening' : 'night'
      },
      campaign: {
        name: campaign.name,
        dailyBudget: campaign.daily_budget || 0,
        todayPerformance: {
          spend: campaign.todaySpend || 0,
          revenue: campaign.todayRevenue || 0,
          roas: campaign.todayROAS || campaign.roas,
          conversions: campaign.todayConversions || 0,
          impressions: campaign.todayImpressions || 0,
          ctr: campaign.todayCTR || campaign.ctr,
          spendPace: (campaign.todaySpend || 0) / (campaign.daily_budget || 1),
          expectedFullDaySpend: ((campaign.todaySpend || 0) / (currentHour / 24)) || 0
        },
        yesterdayPerformance: {
          roas: campaign.yesterdayROAS || 0,
          spend: campaign.yesterdaySpend || 0,
          conversions: campaign.yesterdayConversions || 0
        },
        lifetimeMetrics: {
          roas: campaign.roas,
          cpa: campaign.cpa,
          ctr: campaign.ctr
        }
      },
      accountBenchmark: {
        avgROAS: accountAvgROAS
      }
    }

    const dailyOptimizationPrompt = `You are a real-time Meta Ads budget optimization expert. It's currently ${currentHour}:00 with ${percentDayRemaining.toFixed(0)}% of the day remaining. Analyze this campaign's TODAY performance and provide IMMEDIATE budget recommendations.

REAL-TIME DATA:
${JSON.stringify(realtimeData, null, 2)}

Provide a single, actionable recommendation for TODAY in this JSON format:

{
  "recommendation": {
    "action": "increase|decrease|maintain|pause",
    "urgency": "immediate|monitor|optional",
    "currentBudget": number,
    "recommendedBudget": number,
    "percentageChange": number,
    "reasoning": [
      "Specific reason with TODAY's data",
      "Spend pacing analysis",
      "Time remaining consideration",
      "Expected impact for remaining hours"
    ],
    "expectedTodayImpact": {
      "additionalSpend": number,
      "additionalRevenue": number,
      "confidenceLevel": 0.0-1.0
    },
    "timeOfDay": "HH:00 timeperiod"
  }
}

DECISION CRITERIA:
1. IMMEDIATE INCREASE if:
   - Today's ROAS > account average * 1.5
   - Underpacing (spent < expected % for time of day)
   - At least 4 hours remaining
   - Strong conversion volume

2. IMMEDIATE DECREASE if:
   - Today's ROAS < account average * 0.7
   - Overpacing significantly
   - Burning budget with poor returns

3. IMMEDIATE PAUSE if:
   - ROAS < 1.0 (unprofitable)
   - Already spent >50% budget with poor performance

4. MONITOR if:
   - Performance is average
   - Pacing is normal
   - Less than 4 hours remaining

BE SPECIFIC: Use exact numbers from TODAY's performance. Focus on actionable insights for the remaining ${percentDayRemaining.toFixed(0)}% of the day.`

    console.log('Sending daily optimization request to Claude...')
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1500,
      temperature: 0.1,
      messages: [{
        role: "user",
        content: dailyOptimizationPrompt
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
      return NextResponse.json({
        error: 'Failed to parse optimization response'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      recommendation: result.recommendation,
      tokensUsed: response.usage?.input_tokens + (response.usage?.output_tokens || 0)
    })

  } catch (error: any) {
    console.error('Daily budget optimization error:', error)
    
    if (error.message?.includes('API key')) {
      return NextResponse.json({
        error: 'Invalid Anthropic API key. Please check your API key in Settings.'
      }, { status: 401 })
    }

    return NextResponse.json({
      error: error.message || 'Failed to generate daily optimization'
    }, { status: 500 })
  }
}