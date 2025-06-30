import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ campaignId: string }> }
) {
  const params = await props.params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = params
    
    // TODO: Fetch real campaign data from Meta API
    // For now, return mock data
    const mockCampaign = {
      id: campaignId,
      name: `Campaign ${campaignId}`,
      status: 'ACTIVE',
      objective: 'OUTCOME_SALES',
      budget_settings: {
        daily_budget: 100
      },
      insights: {
        impressions: 45000,
        clicks: 1350,
        spend: 287.50,
        ctr: 3.0,
        cpc: 0.21,
        conversions: 45,
        roas: 3.2,
        frequency: 2.1
      },
      creative_count: 5,
      audience_size: 2500000,
      created_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
    
    return NextResponse.json(mockCampaign)
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}