import { NextResponse } from "next/server"
import { railwayFetch } from "@/lib/railway-fetch-fix"

export async function POST(request: Request) {
  try {
    const { adId, accessToken } = await request.json()

    if (!adId || !accessToken) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    const cleanToken = accessToken.replace(/^Bearer\s+/i, '')
    
    // Fetch comprehensive ad data
    const adUrl = `https://graph.facebook.com/v19.0/${adId}?` +
      `fields=id,name,status,creative{` +
        `id,name,title,body,image_url,image_hash,video_id,thumbnail_url,` +
        `object_story_spec,object_type,object_url,link_url,` +
        `asset_feed_spec,degrees_of_freedom_spec,` +
        `effective_object_story_id` +
      `},adcreatives{` +
        `id,name,title,body,image_url,image_hash,video_id,thumbnail_url,` +
        `object_story_spec,object_type,object_url,link_url` +
      `},preview_shareable_link` +
      `&access_token=${cleanToken}`
    
    const adRes = await railwayFetch(adUrl)
    const adData = await adRes.json()

    if (adData.error) {
      throw new Error(adData.error.message)
    }

    // Try to extract creative info from all possible sources
    let creativeInfo = {
      type: 'unknown',
      mediaUrl: '',
      caption: '',
      title: '',
      debug: {} as any
    }

    // Source 1: Direct creative field
    if (adData.creative) {
      creativeInfo.debug.creative = adData.creative
      creativeInfo.caption = adData.creative.body || ''
      creativeInfo.title = adData.creative.title || ''
      
      if (adData.creative.video_id) {
        creativeInfo.type = 'video'
        creativeInfo.mediaUrl = adData.creative.thumbnail_url || ''
      } else if (adData.creative.image_url) {
        creativeInfo.type = 'image'
        creativeInfo.mediaUrl = adData.creative.image_url
      }
    }

    // Source 2: Adcreatives field
    if (adData.adcreatives?.data?.[0]) {
      const adcreative = adData.adcreatives.data[0]
      creativeInfo.debug.adcreative = adcreative
      
      if (!creativeInfo.caption) {
        creativeInfo.caption = adcreative.body || ''
      }
      if (!creativeInfo.title) {
        creativeInfo.title = adcreative.title || ''
      }
      
      if (creativeInfo.type === 'unknown') {
        if (adcreative.video_id) {
          creativeInfo.type = 'video'
          creativeInfo.mediaUrl = adcreative.thumbnail_url || ''
        } else if (adcreative.image_url) {
          creativeInfo.type = 'image'
          creativeInfo.mediaUrl = adcreative.image_url
        }
      }
    }

    // Source 3: Object story spec
    const storySpec = adData.creative?.object_story_spec || adData.adcreatives?.data?.[0]?.object_story_spec
    if (storySpec) {
      creativeInfo.debug.storySpec = storySpec
      
      // Check for Instagram or Facebook story
      if (storySpec.instagram_actor_id || storySpec.page_id) {
        if (storySpec.video_data) {
          creativeInfo.type = 'video'
          if (!creativeInfo.mediaUrl) {
            creativeInfo.mediaUrl = storySpec.video_data.image_url || ''
          }
          if (!creativeInfo.caption) {
            creativeInfo.caption = storySpec.video_data.message || ''
          }
        } else if (storySpec.link_data) {
          creativeInfo.type = 'image'
          if (!creativeInfo.mediaUrl) {
            creativeInfo.mediaUrl = storySpec.link_data.picture || storySpec.link_data.image_url || ''
          }
          if (!creativeInfo.caption) {
            creativeInfo.caption = storySpec.link_data.message || storySpec.link_data.description || ''
          }
          if (!creativeInfo.title) {
            creativeInfo.title = storySpec.link_data.name || ''
          }
        } else if (storySpec.photo_data) {
          creativeInfo.type = 'image'
          if (!creativeInfo.mediaUrl) {
            creativeInfo.mediaUrl = storySpec.photo_data.image_url || ''
          }
          if (!creativeInfo.caption) {
            creativeInfo.caption = storySpec.photo_data.caption || ''
          }
        }
      }
    }

    // If still unknown, try to fetch the creative directly
    if (creativeInfo.type === 'unknown' && adData.creative?.id) {
      const creativeUrl = `https://graph.facebook.com/v19.0/${adData.creative.id}?` +
        `fields=id,name,title,body,image_url,image_hash,video_id,thumbnail_url,` +
        `object_story_spec,effective_object_story_id` +
        `&access_token=${cleanToken}`
      
      const creativeRes = await railwayFetch(creativeUrl)
      const creativeData = await creativeRes.json()
      
      if (!creativeData.error) {
        creativeInfo.debug.directCreative = creativeData
        
        if (creativeData.video_id) {
          creativeInfo.type = 'video'
          creativeInfo.mediaUrl = creativeData.thumbnail_url || ''
        } else if (creativeData.image_url) {
          creativeInfo.type = 'image'
          creativeInfo.mediaUrl = creativeData.image_url
        }
      }
    }

    return NextResponse.json({
      adId,
      adName: adData.name,
      status: adData.status,
      previewLink: adData.preview_shareable_link,
      creativeInfo,
      rawData: adData
    })

  } catch (error: any) {
    console.error("Debug Creative Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch creative details" },
      { status: 500 }
    )
  }
}