import { NextResponse } from "next/server"
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  try {
    const { campaign, accountMetrics, anthropicApiKey } = await request.json()

    if (!anthropicApiKey) {
      return NextResponse.json({
        error: 'Anthropic API key not provided. Please configure your API key in AI Settings.'
      }, { status: 400 })
    }

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    })

    // Prepare campaign data for analysis
    const campaignAnalysis = {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        performance: {
          spend: campaign.spend,
          revenue: campaign.revenue,
          roas: campaign.roas,
          conversions: campaign.conversions,
          cpa: campaign.cpa,
          ctr: campaign.ctr,
          cpc: campaign.cpc,
          impressions: campaign.impressions,
          clicks: campaign.clicks,
          frequency: campaign.frequency || 0
        },
        budget: {
          daily: campaign.daily_budget,
          lifetime: campaign.lifetime_budget
        }
      },
      accountBenchmarks: {
        avgROAS: accountMetrics.avgROAS,
        avgCPA: accountMetrics.avgCPA,
        totalBudget: accountMetrics.totalBudget
      }
    }

    const optimizationPrompt = `You are an expert Meta Ads optimization specialist. Analyze this individual campaign and provide specific, actionable optimization recommendations.

CAMPAIGN DATA:
${JSON.stringify(campaignAnalysis, null, 2)}

Please provide optimization recommendations in the following JSON format:

{
  "recommendations": [
    {
      "type": "increase_budget|decrease_budget|pause|reactivate|creative_refresh|audience_expansion",
      "priority": "high|medium|low",
      "currentBudget": current_budget_number,
      "recommendedBudget": recommended_budget_number,
      "expectedImpact": {
        "spend": expected_spend_change,
        "revenue": expected_revenue_change,
        "roas": expected_roas
      },
      "reasoning": [
        "Specific data-driven reason 1",
        "Specific data-driven reason 2",
        "Specific data-driven reason 3",
        "Specific data-driven reason 4"
      ],
      "actionItems": [
        "Specific action 1",
        "Specific action 2",
        "Specific action 3",
        "Specific action 4"
      ],
      "confidence": 0.0-1.0
    }
  ]
}

ANALYSIS GUIDELINES:
1. Compare campaign performance against account benchmarks
2. If ROAS > account average * 1.5 and conversions > 10:
   - Recommend budget increase of 30-50%
   - Suggest audience expansion if frequency > 3
3. If ROAS < 50% of account average:
   - Recommend budget decrease or pause
   - Only suggest pause if ROAS < 1 and conversions < 5
4. Check for creative fatigue (CTR < 0.5% with high impressions)
5. Consider audience saturation (frequency > 4)
6. Factor in campaign spend level and conversion volume
7. Be specific with numbers and percentages
8. Maximum 3-4 recommendations per campaign

Provide actionable, specific recommendations with exact budget numbers and expected outcomes.`

    console.log('Sending single campaign optimization request to Claude...')
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 2000,
      temperature: 0.1,
      messages: [{
        role: "user",
        content: optimizationPrompt
      }]
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    
    // Extract JSON from response
    let recommendations
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not extract JSON from response')
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      // Return empty recommendations
      recommendations = {
        recommendations: []
      }
    }

    return NextResponse.json({
      success: true,
      recommendations: recommendations.recommendations || [],
      tokensUsed: response.usage?.input_tokens + (response.usage?.output_tokens || 0)
    })

  } catch (error: any) {
    console.error('Single campaign optimization error:', error)
    
    if (error.message?.includes('API key')) {
      return NextResponse.json({
        error: 'Invalid Anthropic API key. Please check your API key in Settings.'
      }, { status: 401 })
    }

    return NextResponse.json({
      error: error.message || 'Failed to generate optimization recommendations'
    }, { status: 500 })
  }
}