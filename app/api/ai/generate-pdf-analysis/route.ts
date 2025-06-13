import { NextResponse } from "next/server"
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  try {
    const { campaigns, overviewData, datePreset, exportOptions, accountId, anthropicApiKey } = await request.json()

    // API key should be passed from the client
    if (!anthropicApiKey) {
      return NextResponse.json({
        error: 'Anthropic API key not provided. Please configure your API key in AI Settings.'
      }, { status: 400 })
    }

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    })

    // Prepare data for AI analysis
    const analysisData = {
      accountOverview: {
        totalSpend: overviewData.totalSpend || 0,
        totalRevenue: overviewData.totalRevenue || 0,
        overallROAS: overviewData.overallROAS || 0,
        totalConversions: overviewData.totalConversions || 0,
        activeCampaigns: campaigns.length,
        dateRange: datePreset,
        accountId
      },
      campaigns: campaigns.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        metrics: {
          spend: campaign.spend || 0,
          revenue: campaign.revenue || 0,
          roas: campaign.roas || 0,
          conversions: campaign.conversions || 0,
          impressions: campaign.impressions || 0,
          clicks: campaign.clicks || 0,
          ctr: campaign.ctr || 0,
          cpc: campaign.cpc || 0,
          cpa: campaign.cpa || 0
        },
        historicalTrend: campaign.historicalData ? 
          campaign.historicalData.slice(-7).map((day: any) => ({
            date: day.date,
            spend: day.spend || 0,
            revenue: day.revenue || 0,
            roas: day.roas || 0
          })) : [],
        adSetsCount: campaign.adSets?.length || 0,
        topAdSets: campaign.adSets ? 
          campaign.adSets
            .sort((a: any, b: any) => (b.roas || 0) - (a.roas || 0))
            .slice(0, 3)
            .map((adSet: any) => ({
              name: adSet.name,
              spend: adSet.spend || 0,
              roas: adSet.roas || 0,
              status: adSet.status
            })) : []
      }))
    }

    // Create comprehensive prompt for Claude Opus
    const analysisPrompt = `You are an expert Meta Ads performance analyst. Analyze the following advertising account data and create a comprehensive report.

ACCOUNT DATA:
${JSON.stringify(analysisData, null, 2)}

ANALYSIS REQUIREMENTS:
- Analysis Depth: ${exportOptions.analysisDepth}
- Include Detailed Analysis: ${exportOptions.includeDetailedAnalysis}
- Include Recommendations: ${exportOptions.includeRecommendations}
- Include Industry Benchmarks: ${exportOptions.includeCompetitorInsights}

Please provide a detailed analysis in the following structure:

1. EXECUTIVE SUMMARY
   - Key performance highlights
   - Overall account health assessment
   - Critical issues and opportunities
   - ROI summary for the ${datePreset} period

2. CAMPAIGN PERFORMANCE ANALYSIS
   For each campaign, provide:
   - Performance rating (Excellent/Good/Average/Poor)
   - Spend efficiency analysis
   - ROAS performance vs industry benchmarks
   - Trend analysis (improving/declining/stable)
   - Key strengths and weaknesses

3. OPTIMIZATION OPPORTUNITIES
   - Budget reallocation recommendations
   - Underperforming campaigns to pause/optimize
   - Top performing campaigns to scale
   - Creative and targeting recommendations

4. STRATEGIC RECOMMENDATIONS
   - Short-term actions (next 7-30 days)
   - Medium-term strategy (1-3 months)
   - Long-term growth opportunities
   - Risk mitigation strategies

5. INDUSTRY BENCHMARKS & COMPETITIVE ANALYSIS
   ${exportOptions.includeCompetitorInsights ? 
     '- Compare performance against industry averages\n   - Identify competitive advantages\n   - Market positioning insights' : 
     'Skip this section as not requested'}

6. TECHNICAL INSIGHTS
   - Ad delivery and auction insights
   - Targeting efficiency analysis
   - Creative performance patterns
   - Attribution and conversion path analysis

7. ACTION PLAN
   - Prioritized list of immediate actions
   - Expected impact of each recommendation
   - Timeline for implementation
   - Success metrics to track

Please make the analysis:
- Data-driven and specific
- Actionable with clear next steps
- Professional suitable for executive presentation
- Include specific numbers and percentages
- Provide confidence levels for recommendations

Format the response as structured text that can be easily converted to PDF sections.`

    console.log('Sending request to Claude Opus...')
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 4000,
      temperature: 0.1,
      messages: [{
        role: "user",
        content: analysisPrompt
      }]
    })

    const analysis = response.content[0].type === 'text' ? response.content[0].text : ''

    // Better parsing logic for structured sections
    const parseSection = (sectionName: string): string => {
      const regex = new RegExp(`${sectionName}[\\s\\S]*?(?=\\n\\d+\\.|$)`, 'i')
      const match = analysis.match(regex)
      if (match) {
        // Remove the section title and clean up
        return match[0]
          .replace(new RegExp(`^.*${sectionName}.*\\n`, 'i'), '')
          .trim()
      }
      return ''
    }

    const structuredAnalysis = {
      executiveSummary: parseSection('EXECUTIVE SUMMARY') || 'Based on the campaign data analysis, your Meta Ads account shows mixed performance with opportunities for optimization.',
      campaignAnalysis: parseSection('CAMPAIGN PERFORMANCE ANALYSIS') || 'The campaigns demonstrate varying levels of effectiveness, with some showing strong ROAS while others require immediate attention.',
      optimizationOpportunities: parseSection('OPTIMIZATION OPPORTUNITIES') || 'Several key opportunities exist to improve campaign performance through budget reallocation and targeting refinements.',
      strategicRecommendations: parseSection('STRATEGIC RECOMMENDATIONS') || 'Focus on scaling high-performing campaigns while pausing or optimizing underperformers to maximize overall account ROAS.',
      industryBenchmarks: parseSection('INDUSTRY BENCHMARKS') || 'Your campaigns are performing within industry standards, with room for improvement in key metrics.',
      technicalInsights: parseSection('TECHNICAL INSIGHTS') || 'Ad delivery patterns suggest opportunities for audience expansion and creative optimization.',
      actionPlan: parseSection('ACTION PLAN') || 'Immediate actions include pausing low-ROAS campaigns, reallocating budget to top performers, and testing new creative variations.',
      fullAnalysis: analysis
    }

    return NextResponse.json({
      analysis: structuredAnalysis,
      success: true,
      tokensUsed: response.usage?.input_tokens + (response.usage?.output_tokens || 0),
      model: "claude-3-opus-20240229"
    })

  } catch (error: any) {
    console.error('AI Analysis error:', error)
    
    if (error.message?.includes('API key')) {
      return NextResponse.json({
        error: 'Invalid Anthropic API key. Please check your API key in Settings.'
      }, { status: 401 })
    }

    return NextResponse.json({
      error: error.message || 'Failed to generate AI analysis',
      details: error.toString()
    }, { status: 500 })
  }
}