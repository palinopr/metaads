import { NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { eq, and, desc } from "drizzle-orm"
import { campaigns, campaignInsights, metaAdAccounts, metaConnections } from "@/db/schema"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const campaignId = params.id

  // Verify campaign ownership
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
    return new Response('Campaign not found', { status: 404 })
  }

  // Create SSE response
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ 
          type: 'connected', 
          campaignId,
          timestamp: new Date().toISOString() 
        })}\n\n`)
      )

      // Set up interval to fetch and send updates
      const intervalId = setInterval(async () => {
        try {
          // Get latest insights
          const latestInsight = await db
            .select()
            .from(campaignInsights)
            .where(eq(campaignInsights.campaignId, campaignId))
            .orderBy(desc(campaignInsights.date))
            .limit(1)

          if (latestInsight.length > 0) {
            const insight = latestInsight[0]
            
            // If campaign has Meta ID, try to fetch real-time data
            if (campaign[0].metaId) {
              const adAccount = await db
                .select({
                  accessToken: metaConnections.accessToken
                })
                .from(metaAdAccounts)
                .innerJoin(metaConnections, eq(metaAdAccounts.connectionId, metaConnections.id))
                .where(eq(metaAdAccounts.id, campaign[0].adAccountId))
                .limit(1)

              if (adAccount.length > 0 && adAccount[0].accessToken) {
                try {
                  // Fetch real-time data from Meta
                  const insightsUrl = `https://graph.facebook.com/v18.0/${campaign[0].metaId}/insights`
                  const params = new URLSearchParams({
                    access_token: adAccount[0].accessToken,
                    fields: 'impressions,clicks,spend,ctr,cpm,conversions',
                    date_preset: 'today'
                  })

                  const response = await fetch(`${insightsUrl}?${params}`)
                  const data = await response.json()

                  if (data.data && data.data.length > 0) {
                    const realtimeData = data.data[0]
                    
                    // Send real-time update
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({
                        type: 'realtime_update',
                        campaignId,
                        metrics: {
                          impressions: parseInt(realtimeData.impressions || 0),
                          clicks: parseInt(realtimeData.clicks || 0),
                          spend: parseFloat(realtimeData.spend || 0),
                          ctr: parseFloat(realtimeData.ctr || 0),
                          cpm: parseFloat(realtimeData.cpm || 0),
                          conversions: parseInt(realtimeData.conversions || 0)
                        },
                        timestamp: new Date().toISOString()
                      })}\n\n`)
                    )

                    // Update local database with latest data
                    await db
                      .insert(campaignInsights)
                      .values({
                        campaignId: campaign[0].id,
                        date: new Date(),
                        impressions: parseInt(realtimeData.impressions || 0),
                        clicks: parseInt(realtimeData.clicks || 0),
                        spend: Math.round(parseFloat(realtimeData.spend || 0) * 100),
                        ctr: Math.round(parseFloat(realtimeData.ctr || 0) * 10000),
                        cpm: Math.round(parseFloat(realtimeData.cpm || 0) * 100),
                        conversions: parseInt(realtimeData.conversions || 0),
                      })
                      .onConflictDoUpdate({
                        target: [campaignInsights.campaignId, campaignInsights.date],
                        set: {
                          impressions: parseInt(realtimeData.impressions || 0),
                          clicks: parseInt(realtimeData.clicks || 0),
                          spend: Math.round(parseFloat(realtimeData.spend || 0) * 100),
                          updatedAt: new Date()
                        }
                      })
                  }
                } catch (error) {
                  console.error('Error fetching real-time data:', error)
                }
              }
            }

            // Send cached data update
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'cached_update',
                campaignId,
                metrics: {
                  impressions: insight.impressions,
                  clicks: insight.clicks,
                  spend: insight.spend / 100,
                  ctr: insight.ctr ? insight.ctr / 10000 : 0,
                  cpm: insight.cpm ? insight.cpm / 100 : 0,
                  cpc: insight.clicks > 0 ? insight.spend / insight.clicks / 100 : 0,
                  conversions: insight.conversions || 0,
                  roas: insight.roas ? insight.roas / 100 : 0
                },
                lastUpdated: insight.updatedAt,
                timestamp: new Date().toISOString()
              })}\n\n`)
            )
          }

          // Send heartbeat
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'heartbeat', 
              timestamp: new Date().toISOString() 
            })}\n\n`)
          )
        } catch (error) {
          console.error('Error in SSE stream:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              message: 'Failed to fetch updates',
              timestamp: new Date().toISOString() 
            })}\n\n`)
          )
        }
      }, 30000) // Update every 30 seconds

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    }
  })
}