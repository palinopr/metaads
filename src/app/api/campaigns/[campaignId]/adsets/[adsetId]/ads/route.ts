import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { sql } from "drizzle-orm"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ campaignId: string; adsetId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { campaignId, adsetId } = await params
    const { searchParams } = new URL(request.url)
    const datePreset = searchParams.get('date_preset') || 'last_30d'
    const limit = searchParams.get('limit') || '50'
    
    // Get selected ad account with token
    const result = await db.execute(sql`
      SELECT 
        ma.account_id,
        ma.name as account_name,
        mc.access_token
      FROM meta_ad_accounts ma
      JOIN meta_connections mc ON ma.connection_id = mc.id
      WHERE ma.user_id = ${session.user.id}
      AND ma.is_selected = true
      LIMIT 1
    `)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ 
        ads: [],
        error: "No ad account selected"
      })
    }
    
    const account = result.rows[0]
    
    try {
      // Get campaign and ad set info
      console.log(`[Ads] Fetching campaign and ad set info`)
      const [campaignResponse, adsetResponse] = await Promise.all([
        fetch(`https://graph.facebook.com/v18.0/${campaignId}?fields=name&access_token=${account.access_token}`),
        fetch(`https://graph.facebook.com/v18.0/${adsetId}?fields=name&access_token=${account.access_token}`)
      ])
      
      const [campaignData, adsetData] = await Promise.all([
        campaignResponse.json(),
        adsetResponse.json()
      ])
      
      // Fetch ads from Meta API
      console.log(`[Ads] Fetching ads for ad set ${adsetId}`)
      
      const adsUrl = `https://graph.facebook.com/v18.0/${adsetId}/ads?fields=id,name,status,adset_id,campaign_id,created_time,updated_time,effective_status,creative{id,title,body,image_url,thumbnail_url,link_url,object_story_spec},insights.date_preset(${datePreset}){impressions,clicks,spend,ctr,cpm,conversions,cost_per_conversion,frequency,reach,unique_clicks}&limit=${limit}&access_token=${account.access_token}`
      
      const response = await fetch(adsUrl)
      const data = await response.json()
      
      if (data.error) {
        console.error('[Ads] Meta API error:', data.error)
        return NextResponse.json({
          ads: [],
          error: data.error.message,
          debug: {
            error_type: data.error.type,
            error_code: data.error.code,
            fbtrace_id: data.error.fbtrace_id
          }
        })
      }
      
      // Transform ads data
      const ads = (data.data || []).map((ad: any) => ({
        id: ad.id,
        name: ad.name,
        status: ad.status,
        effective_status: ad.effective_status,
        adset_id: ad.adset_id,
        campaign_id: ad.campaign_id,
        created_time: ad.created_time,
        updated_time: ad.updated_time,
        creative: ad.creative ? {
          id: ad.creative.id,
          title: ad.creative.title,
          body: ad.creative.body,
          image_url: ad.creative.image_url,
          thumbnail_url: ad.creative.thumbnail_url,
          link_url: ad.creative.link_url
        } : null,
        metrics: ad.insights?.data?.[0] ? {
          impressions: parseInt(ad.insights.data[0].impressions || 0),
          clicks: parseInt(ad.insights.data[0].clicks || 0),
          spend: parseFloat(ad.insights.data[0].spend || 0),
          ctr: parseFloat(ad.insights.data[0].ctr || 0),
          cpm: parseFloat(ad.insights.data[0].cpm || 0),
          conversions: parseInt(ad.insights.data[0].conversions || 0),
          cost_per_conversion: parseFloat(ad.insights.data[0].cost_per_conversion || 0),
          frequency: parseFloat(ad.insights.data[0].frequency || 0),
          reach: parseInt(ad.insights.data[0].reach || 0),
          unique_clicks: parseInt(ad.insights.data[0].unique_clicks || 0)
        } : null
      }))
      
      // Get summary stats
      const summary = {
        total_ads: ads.length,
        active_ads: ads.filter((a: any) => a.effective_status === 'ACTIVE').length,
        paused_ads: ads.filter((a: any) => a.effective_status === 'PAUSED').length,
        total_spend: ads.reduce((sum: number, a: any) => sum + (a.metrics?.spend || 0), 0),
        total_impressions: ads.reduce((sum: number, a: any) => sum + (a.metrics?.impressions || 0), 0),
        total_clicks: ads.reduce((sum: number, a: any) => sum + (a.metrics?.clicks || 0), 0),
        total_reach: ads.reduce((sum: number, a: any) => sum + (a.metrics?.reach || 0), 0),
        avg_ctr: ads.length > 0 
          ? ads.reduce((sum: number, a: any) => sum + (a.metrics?.ctr || 0), 0) / ads.length 
          : 0,
        avg_frequency: ads.length > 0 
          ? ads.reduce((sum: number, a: any) => sum + (a.metrics?.frequency || 0), 0) / ads.length 
          : 0
      }
      
      return NextResponse.json({
        ads,
        summary,
        campaignName: campaignData.name || "",
        adsetName: adsetData.name || "",
        account: {
          id: account.account_id,
          name: account.account_name
        },
        pagination: {
          has_next: !!data.paging?.next,
          has_previous: !!data.paging?.previous,
          cursors: data.paging?.cursors
        }
      })
      
    } catch (error: any) {
      console.error('[Ads] Error:', error)
      return NextResponse.json({
        ads: [],
        error: "Failed to fetch ads",
        debug: error.message
      })
    }
    
  } catch (error) {
    console.error('Error in ads endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}