import { NextResponse } from "next/server"
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  try {
    const { campaigns, overviewData, anthropicApiKey } = await request.json()

    if (!anthropicApiKey) {
      return NextResponse.json({
        error: 'Anthropic API key not provided. Please configure your API key in AI Settings.'
      }, { status: 400 })
    }

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    })

    // Prepare comprehensive campaign data for analysis
    const campaignAnalysis = {
      accountMetrics: {
        totalSpend: overviewData.totalSpend,
        totalRevenue: overviewData.totalRevenue,
        overallROAS: overviewData.overallROAS,
        totalConversions: overviewData.totalConversions,
        avgCPA: overviewData.totalSpend / (overviewData.totalConversions || 1),
        campaignCount: campaigns.length
      },
      campaigns: campaigns.map((campaign: any) => ({
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
          lifetime: campaign.lifetime_budget,
          percentOfTotal: ((campaign.daily_budget || campaign.lifetime_budget || 0) / 
            campaigns.reduce((sum: number, c: any) => sum + (c.daily_budget || c.lifetime_budget || 0), 0.01)) * 100
        }
      }))
    }

    const optimizationPrompt = `You are an expert Meta Ads optimization specialist. Analyze the following advertising account data and provide specific, actionable budget optimization recommendations.

ACCOUNT DATA:
${JSON.stringify(campaignAnalysis, null, 2)}

Please provide optimization recommendations in the following JSON format:

{
  "recommendations": [
    {
      "campaignId": "campaign_id",
      "campaignName": "campaign_name",
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
        "Specific data-driven reason 3"
      ],
      "actionItems": [
        "Specific action 1",
        "Specific action 2",
        "Specific action 3"
      ],
      "confidence": 0.0-1.0
    }
  ],
  "summary": {
    "totalRecommendations": number,
    "highPriorityCount": number,
    "potentialRevenueImpact": number,
    "budgetReallocation": number,
    "keyInsights": [
      "Key insight 1",
      "Key insight 2",
      "Key insight 3"
    ]
  }
}

ANALYSIS GUIDELINES:
1. For HIGH PERFORMERS (ROAS > account average * 1.5):
   - Recommend budget increases of 30-50%
   - Suggest audience expansion if frequency > 3
   - Prioritize scaling opportunities

2. For AVERAGE PERFORMERS (ROAS between 50-150% of average):
   - Recommend optimization before budget changes
   - Suggest creative refresh if CTR < 1%
   - Focus on incremental improvements

3. For POOR PERFORMERS (ROAS < 50% of average):
   - Recommend budget decrease or pause
   - Only suggest pause if ROAS < 1 and conversions < 5
   - Provide specific turnaround strategies

4. BUDGET REALLOCATION:
   - Ensure total budget remains similar (reallocate from poor to good)
   - Consider daily spend limits and pacing
   - Factor in campaign age and learning phase

5. CREATIVE & AUDIENCE:
   - Flag creative fatigue (CTR < 0.5% with high impressions)
   - Suggest audience expansion for saturated campaigns (frequency > 4)
   - Consider seasonal trends and market conditions

Provide specific, actionable recommendations with exact budget numbers and expected outcomes. Be aggressive with recommendations for clear winners and losers, but measured with average performers.`

    console.log('Sending optimization request to Claude...')
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 4000,
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
      // Return a fallback structure
      recommendations = {
        recommendations: [],
        summary: {
          totalRecommendations: 0,
          highPriorityCount: 0,
          potentialRevenueImpact: 0,
          budgetReallocation: 0,
          keyInsights: ['Error parsing AI recommendations. Please try again.']
        }
      }
    }

    return NextResponse.json({
      success: true,
      recommendations: recommendations.recommendations || [],
      summary: recommendations.summary || {},
      tokensUsed: response.usage?.input_tokens + (response.usage?.output_tokens || 0)
    })

  } catch (error: any) {
    console.error('Campaign optimization error:', error)
    
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