import { NextResponse } from "next/server"
import { railwayFetch } from "@/lib/railway-fetch-fix"

export async function POST(request: Request) {
  try {
    const { campaignId, accessToken, datePreset } = await request.json()

    if (!campaignId || !accessToken) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    const cleanToken = accessToken.replace(/^Bearer\s+/i, '')
    
    // Map date presets
    const datePresetMap: { [key: string]: string } = {
      'today': 'today',
      'yesterday': 'yesterday',
      'last_7d': 'last_7_d',
      'last_14d': 'last_14_d',
      'last_28d': 'last_28_d',
      'last_30d': 'last_30_d',
      'last_90d': 'last_90_d',
      'lifetime': 'maximum'
    }
    const metaDatePreset = datePresetMap[datePreset] || datePreset

    // First, get campaign info
    const campaignUrl = `https://graph.facebook.com/v19.0/${campaignId}?fields=id,name,status,objective&access_token=${cleanToken}`
    const campaignRes = await railwayFetch(campaignUrl)
    const campaignData = await campaignRes.json()

    // Fetch adsets with insights
    const adsetsUrl = `https://graph.facebook.com/v19.0/${campaignId}/adsets?` +
      `fields=id,name,status,targeting,bid_amount,daily_budget,lifetime_budget,` +
      `insights.date_preset(${metaDatePreset}){spend,impressions,clicks,ctr,cpc,actions,action_values}` +
      `&limit=100&access_token=${cleanToken}`
    
    const adsetsRes = await railwayFetch(adsetsUrl)
    const adsetsData = await adsetsRes.json()

    if (adsetsData.error) {
      throw new Error(adsetsData.error.message)
    }

    // Process adsets and fetch ads for each
    const processedAdsets = await Promise.all(
      (adsetsData.data || []).map(async (adset: any) => {
        // Fetch ads for this adset with expanded creative fields
        const adsUrl = `https://graph.facebook.com/v19.0/${adset.id}/ads?` +
          `fields=id,name,status,creative{id,title,body,image_url,video_id,thumbnail_url,` +
          `object_story_spec,asset_feed_spec,effective_object_story_id},adcreatives{id,image_url,video_id,body,title},` +
          `insights.date_preset(${metaDatePreset}){spend,impressions,clicks,ctr,cpc,actions,action_values}` +
          `&limit=100&access_token=${cleanToken}`
        
        const adsRes = await railwayFetch(adsUrl)
        const adsData = await adsRes.json()

        // Process insights for adset
        let adsetMetrics = {
          spend: 0,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          cpc: 0,
          conversions: 0,
          revenue: 0,
          roas: 0
        }

        if (adset.insights?.data?.[0]) {
          const insights = adset.insights.data[0]
          adsetMetrics.spend = parseFloat(insights.spend || "0")
          adsetMetrics.impressions = parseInt(insights.impressions || "0")
          adsetMetrics.clicks = parseInt(insights.clicks || "0")
          adsetMetrics.ctr = parseFloat(insights.ctr || "0")
          adsetMetrics.cpc = parseFloat(insights.cpc || "0")

          // Count conversions and revenue
          if (insights.actions) {
            insights.actions.forEach((action: any) => {
              if (action.action_type === "offsite_conversion.fb_pixel_purchase") {
                adsetMetrics.conversions += parseInt(action.value || "0")
              }
            })
          }
          if (insights.action_values) {
            insights.action_values.forEach((av: any) => {
              if (av.action_type === "offsite_conversion.fb_pixel_purchase") {
                adsetMetrics.revenue += parseFloat(av.value || "0")
              }
            })
          }
          adsetMetrics.roas = adsetMetrics.spend > 0 ? adsetMetrics.revenue / adsetMetrics.spend : 0
        }

        // Process ads
        const processedAds = (adsData.data || []).map((ad: any) => {
          let adMetrics = {
            spend: 0,
            impressions: 0,
            clicks: 0,
            ctr: 0,
            cpc: 0,
            conversions: 0,
            revenue: 0,
            roas: 0
          }

          if (ad.insights?.data?.[0]) {
            const insights = ad.insights.data[0]
            adMetrics.spend = parseFloat(insights.spend || "0")
            adMetrics.impressions = parseInt(insights.impressions || "0")
            adMetrics.clicks = parseInt(insights.clicks || "0")
            adMetrics.ctr = parseFloat(insights.ctr || "0")
            adMetrics.cpc = parseFloat(insights.cpc || "0")

            if (insights.actions) {
              insights.actions.forEach((action: any) => {
                if (action.action_type === "offsite_conversion.fb_pixel_purchase") {
                  adMetrics.conversions += parseInt(action.value || "0")
                }
              })
            }
            if (insights.action_values) {
              insights.action_values.forEach((av: any) => {
                if (av.action_type === "offsite_conversion.fb_pixel_purchase") {
                  adMetrics.revenue += parseFloat(av.value || "0")
                }
              })
            }
            adMetrics.roas = adMetrics.spend > 0 ? adMetrics.revenue / adMetrics.spend : 0
          }

          // Extract creative info - check multiple sources
          let creativeType = 'unknown'
          let caption = ''
          let mediaUrl = ''
          
          // Try to get creative data from various sources
          const creative = ad.creative || (ad.adcreatives && ad.adcreatives.data?.[0]) || {}
          
          // Get caption/text from multiple possible locations
          // First check asset_feed_spec for dynamic creative ads
          if (creative.asset_feed_spec?.bodies?.[0]?.text) {
            caption = creative.asset_feed_spec.bodies[0].text
          } else {
            caption = creative.body || 
                     creative.title || 
                     ad.adcreatives?.data?.[0]?.body || 
                     ad.adcreatives?.data?.[0]?.title || 
                     creative.object_story_spec?.link_data?.message ||
                     creative.object_story_spec?.link_data?.name ||
                     creative.object_story_spec?.link_data?.description ||
                     creative.object_story_spec?.video_data?.message ||
                     creative.object_story_spec?.video_data?.title ||
                     ''
          }
          
          // Also get title from asset_feed_spec if available
          let adTitle = ''
          if (creative.asset_feed_spec?.titles?.[0]?.text) {
            adTitle = creative.asset_feed_spec.titles[0].text
          }
          
          // Determine creative type and media URL
          if (creative.asset_feed_spec?.videos?.length > 0) {
            // Dynamic creative with videos
            creativeType = 'video'
            mediaUrl = creative.asset_feed_spec.videos[0].thumbnail_url || ''
          } else if (creative.video_id || ad.adcreatives?.data?.[0]?.video_id) {
            creativeType = 'video'
            mediaUrl = creative.thumbnail_url || ad.adcreatives?.data?.[0]?.thumbnail_url || ''
          } else if (creative.image_url || ad.adcreatives?.data?.[0]?.image_url) {
            creativeType = 'image'
            mediaUrl = creative.image_url || ad.adcreatives?.data?.[0]?.image_url || ''
          } else if (creative.object_story_spec) {
            // Check object_story_spec for media
            const storySpec = creative.object_story_spec
            if (storySpec.video_data) {
              creativeType = 'video'
              mediaUrl = storySpec.video_data.image_url || ''
            } else if (storySpec.link_data?.image_hash || storySpec.link_data?.picture) {
              creativeType = 'image'
              mediaUrl = storySpec.link_data.picture || ''
            }
          }
          
          // Log for debugging and fallback
          let wasAssumed = false
          if (creativeType === 'unknown' && adMetrics.spend > 0) {
            console.log('Unknown creative type for ad:', ad.id, 'creative data:', creative)
            // Default to image if we have spend but can't determine type
            creativeType = 'image'
            wasAssumed = true
          }
          
          // Log caption extraction for debugging
          if (!caption && adMetrics.spend > 0) {
            console.log('No caption found for ad:', ad.id, 'name:', ad.name)
            console.log('Creative structure:', JSON.stringify({
              hasCreative: !!ad.creative,
              hasAdcreatives: !!ad.adcreatives,
              creativeKeys: Object.keys(creative),
              objectStorySpec: creative.object_story_spec ? Object.keys(creative.object_story_spec) : null
            }, null, 2))
          }

          // Combine title and caption if both exist
          if (adTitle && caption) {
            caption = `${adTitle}\n\n${caption}`
          }
          
          return {
            id: ad.id,
            name: ad.name,
            status: ad.status,
            creativeType,
            caption,
            mediaUrl,
            wasAssumed,
            isDynamicCreative: !!creative.asset_feed_spec,
            ...adMetrics
          }
        })

        return {
          id: adset.id,
          name: adset.name,
          status: adset.status,
          targeting: adset.targeting,
          budget: {
            daily: adset.daily_budget,
            lifetime: adset.lifetime_budget
          },
          ...adsetMetrics,
          ads: processedAds
        }
      })
    )

    // Calculate campaign totals
    const campaignTotals = processedAdsets.reduce((acc, adset) => ({
      spend: acc.spend + adset.spend,
      impressions: acc.impressions + adset.impressions,
      clicks: acc.clicks + adset.clicks,
      conversions: acc.conversions + adset.conversions,
      revenue: acc.revenue + adset.revenue,
      adsets: acc.adsets + 1,
      ads: acc.ads + adset.ads.length
    }), {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      adsets: 0,
      ads: 0
    })

    campaignTotals.ctr = campaignTotals.impressions > 0 
      ? (campaignTotals.clicks / campaignTotals.impressions) * 100 
      : 0
    campaignTotals.cpc = campaignTotals.clicks > 0 
      ? campaignTotals.spend / campaignTotals.clicks 
      : 0
    campaignTotals.roas = campaignTotals.spend > 0 
      ? campaignTotals.revenue / campaignTotals.spend 
      : 0

    // Analyze creative performance
    const creativeAnalysis = {
      byType: {
        image: { count: 0, spend: 0, conversions: 0, revenue: 0 },
        video: { count: 0, spend: 0, conversions: 0, revenue: 0 },
        unknown: { count: 0, spend: 0, conversions: 0, revenue: 0 }
      },
      topPerformingAds: [] as any[],
      assumedTypes: 0 // Track how many we had to assume
    }

    let totalAdsProcessed = 0
    processedAdsets.forEach(adset => {
      adset.ads.forEach(ad => {
        totalAdsProcessed++
        const type = ad.creativeType as 'image' | 'video' | 'unknown'
        creativeAnalysis.byType[type].count++
        creativeAnalysis.byType[type].spend += ad.spend
        creativeAnalysis.byType[type].conversions += ad.conversions
        creativeAnalysis.byType[type].revenue += ad.revenue
        
        if (ad.wasAssumed) {
          creativeAnalysis.assumedTypes++
        }
      })
    })
    
    console.log('Creative analysis summary:', {
      totalAds: totalAdsProcessed,
      byType: creativeAnalysis.byType
    })

    // Get top performing ads
    const allAds = processedAdsets.flatMap(adset => 
      adset.ads.map(ad => ({ ...ad, adsetName: adset.name }))
    )
    creativeAnalysis.topPerformingAds = allAds
      .filter(ad => ad.spend > 0)
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 5)

    return NextResponse.json({
      campaign: {
        ...campaignData,
        ...campaignTotals
      },
      adsets: processedAdsets,
      creativeAnalysis,
      datePreset
    })

  } catch (error: any) {
    console.error("Campaign Hierarchy Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch campaign hierarchy" },
      { status: 500 }
    )
  }
}