import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { eq, and } from "drizzle-orm"
import { campaigns, campaignInsights, adSets, ads } from "@/db/schema"

// Get single campaign with details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: campaignId } = await params
    const { searchParams } = new URL(request.url)
    const includeAdSets = searchParams.get('includeAdSets') === 'true'
    const includeAds = searchParams.get('includeAds') === 'true'
    const includeInsights = searchParams.get('includeInsights') === 'true'

    // Get campaign
    const campaign = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.userId, session.user.id)
        )
      )
      .limit(1)

    if (campaign.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    let result: any = campaign[0]

    // Get ad sets if requested
    if (includeAdSets) {
      const campaignAdSets = await db
        .select()
        .from(adSets)
        .where(eq(adSets.campaignId, campaignId))

      result.adSets = campaignAdSets
    }

    // Get ads if requested
    if (includeAds && result.adSets) {
      for (let i = 0; i < result.adSets.length; i++) {
        const adSetAds = await db
          .select()
          .from(ads)
          .where(eq(ads.adSetId, result.adSets[i].id))
        
        result.adSets[i].ads = adSetAds
      }
    }

    // Get insights if requested
    if (includeInsights) {
      const insights = await db
        .select()
        .from(campaignInsights)
        .where(eq(campaignInsights.campaignId, campaignId))
        .orderBy(campaignInsights.date)

      result.insights = insights
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update campaign
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: campaignId } = await params
    const body = await request.json()
    const { name, status, budgetAmount, spendCap, endTime } = body

    // Verify ownership
    const campaign = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.userId, session.user.id)
        )
      )
      .limit(1)

    if (campaign.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Update campaign
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (status !== undefined) updateData.status = status
    if (budgetAmount !== undefined) updateData.budgetAmount = Math.round(budgetAmount * 100)
    if (spendCap !== undefined) updateData.spendCap = Math.round(spendCap * 100)
    if (endTime !== undefined) updateData.endTime = new Date(endTime)
    updateData.updatedAt = new Date()

    const updatedCampaign = await db
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, campaignId))
      .returning()

    // TODO: Update campaign in Meta Ads API if it has a metaId

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign[0]
    })
  } catch (error) {
    console.error('Campaign update error:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

// Delete campaign
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: campaignId } = await params

    // Verify ownership and delete
    const deletedCampaign = await db
      .delete(campaigns)
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.userId, session.user.id)
        )
      )
      .returning()

    if (deletedCampaign.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // TODO: Delete or archive campaign in Meta Ads API if it has a metaId

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    })
  } catch (error) {
    console.error('Campaign deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}