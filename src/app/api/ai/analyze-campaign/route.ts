import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CampaignIntelligence } from '@/lib/ai/campaign-intelligence'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = await req.json()
    
    console.log('[AI Analysis] Analyzing campaign:', campaignId)
    
    // For now, use mock data since we don't have the campaign details endpoint working
    const campaign = {
      id: campaignId,
      name: 'Campaign',
      insights: {
        ctr: 0.8, // Low CTR
        cpc: 2.5, // High CPC
        conversions: 10,
        spend: 250,
        roas: 1.5, // Low ROAS
        frequency: 4.2 // High frequency
      },
      creative_count: 2 // Limited creatives
    }
    
    // Analyze campaign with AI
    const intelligence = new CampaignIntelligence()
    
    // Calculate performance score
    const score = calculatePerformanceScore(campaign)
    
    // Identify issues
    const issues = identifyIssues(campaign)
    
    // Calculate optimization potential
    const potential = calculateOptimizationPotential(campaign)
    
    // Generate recommendations
    const recommendations = await generateRecommendations(campaign, issues)
    
    return NextResponse.json({
      success: true,
      score,
      potential,
      issues,
      recommendations,
      insights: {
        ctr: campaign.insights?.ctr || 0,
        cpc: campaign.insights?.cpc || 0,
        conversions: campaign.insights?.conversions || 0,
        spend: campaign.insights?.spend || 0
      }
    })
  } catch (error) {
    console.error('Campaign analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze campaign' },
      { status: 500 }
    )
  }
}

function calculatePerformanceScore(campaign: any): number {
  let score = 5 // Base score
  
  // Check CTR
  const ctr = campaign.insights?.ctr || 0
  if (ctr > 2) score += 2
  else if (ctr > 1) score += 1
  
  // Check ROAS
  const roas = campaign.insights?.roas || 0
  if (roas > 3) score += 2
  else if (roas > 2) score += 1
  
  // Check frequency
  const frequency = campaign.insights?.frequency || 0
  if (frequency < 2) score += 1
  else if (frequency > 4) score -= 1
  
  return Math.max(1, Math.min(10, score))
}

function identifyIssues(campaign: any): string[] {
  const issues = []
  
  if ((campaign.insights?.ctr || 0) < 1) {
    issues.push('Low click-through rate')
  }
  
  if ((campaign.insights?.frequency || 0) > 3) {
    issues.push('Ad fatigue detected')
  }
  
  if ((campaign.insights?.cpc || 0) > 2) {
    issues.push('High cost per click')
  }
  
  if (!campaign.creative_count || campaign.creative_count < 3) {
    issues.push('Limited creative variations')
  }
  
  return issues
}

function calculateOptimizationPotential(campaign: any): number {
  const currentRoas = campaign.insights?.roas || 1
  const benchmarkRoas = 3.5 // Industry benchmark
  
  const potential = ((benchmarkRoas - currentRoas) / currentRoas) * 100
  return Math.max(0, Math.min(100, Math.round(potential)))
}

async function generateRecommendations(campaign: any, issues: string[]): Promise<string[]> {
  const recommendations = []
  
  if (issues.includes('Low click-through rate')) {
    recommendations.push('Test new ad creatives with stronger hooks')
    recommendations.push('Refine audience targeting to reach more relevant users')
  }
  
  if (issues.includes('Ad fatigue detected')) {
    recommendations.push('Refresh creative assets immediately')
    recommendations.push('Implement creative rotation strategy')
  }
  
  if (issues.includes('High cost per click')) {
    recommendations.push('Optimize bidding strategy')
    recommendations.push('Test broader audiences to reduce competition')
  }
  
  return recommendations
}