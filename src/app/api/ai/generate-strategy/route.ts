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

    const { businessInfo } = await req.json()
    
    const intelligence = new CampaignIntelligence()
    const strategy = await intelligence.generateCampaignStrategy(businessInfo)
    const predictions = await intelligence.predictPerformance(strategy)
    
    return NextResponse.json({
      success: true,
      strategy,
      predictions
    })
  } catch (error) {
    console.error('Strategy generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate strategy' },
      { status: 500 }
    )
  }
}