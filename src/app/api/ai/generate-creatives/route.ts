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

    const { strategy, count = 5 } = await req.json()
    
    const intelligence = new CampaignIntelligence()
    const creatives = await intelligence.generateAdCreatives(strategy, count)
    
    return NextResponse.json({
      success: true,
      creatives
    })
  } catch (error) {
    console.error('Creative generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate creatives' },
      { status: 500 }
    )
  }
}