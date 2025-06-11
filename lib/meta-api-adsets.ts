import { MetaAPIClient } from './meta-api-client'

export interface AdSet {
  id: string
  name: string
  campaign_id: string
  status: string
  effective_status: string
  daily_budget?: string
  lifetime_budget?: string
  bid_amount?: string
  targeting?: any
  created_time: string
  updated_time: string
  insights?: {
    data: Array<{
      impressions: string
      clicks: string
      spend: string
      ctr: string
      cpm: string
      cpp: string
      purchase_roas?: Array<{ action_type: string; value: string }>
      actions?: Array<{ action_type: string; value: string }>
      action_values?: Array<{ action_type: string; value: string }>
    }>
  }
}

export interface Ad {
  id: string
  name: string
  adset_id: string
  campaign_id: string
  status: string
  effective_status: string
  creative?: {
    id: string
    name: string
    title?: string
    body?: string
    image_url?: string
    video_url?: string
  }
  created_time: string
  updated_time: string
  insights?: {
    data: Array<{
      impressions: string
      clicks: string
      spend: string
      ctr: string
      cpm: string
      cpp: string
      purchase_roas?: Array<{ action_type: string; value: string }>
      actions?: Array<{ action_type: string; value: string }>
      action_values?: Array<{ action_type: string; value: string }>
    }>
  }
}

export class AdSetAndAdAPI extends MetaAPIClient {
  async getAdSetsForCampaign(campaignId: string, datePreset = 'last_30d'): Promise<AdSet[]> {
    try {
      const url = this.buildUrl(`${campaignId}/adsets`, {
        fields: `id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,bid_amount,targeting,created_time,updated_time,insights.date_preset(${datePreset}){impressions,clicks,spend,ctr,cpm,cpp,actions,action_values,purchase_roas}`,
        limit: 50
      })
      
      const response = await this.fetchWithRetry(url)
      return response.data || []
    } catch (error) {
      console.error('Failed to fetch adsets:', error)
      throw error
    }
  }

  async getAdsForAdSet(adsetId: string): Promise<Ad[]> {
    try {
      const url = this.buildUrl(`${adsetId}/ads`, {
        fields: 'id,name,adset_id,campaign_id,status,effective_status,creative{id,name,title,body,image_url,video_url},created_time,updated_time,insights{impressions,clicks,spend,ctr,cpm,cpp,actions,action_values,purchase_roas}',
        limit: 50
      })
      
      const response = await this.fetchWithRetry(url)
      return response.data || []
    } catch (error) {
      console.error('Failed to fetch ads:', error)
      throw error
    }
  }

  async getAdSetsWithAds(campaignId: string, datePreset = 'last_30d'): Promise<{ adsets: AdSet[], ads: Ad[] }> {
    try {
      const adsets = await this.getAdSetsForCampaign(campaignId, datePreset)
      const allAds: Ad[] = []

      // Fetch ads for each adset in parallel
      const adsPromises = adsets.map(adset => this.getAdsForAdSet(adset.id))
      const adsResults = await Promise.all(adsPromises)
      
      adsResults.forEach(ads => allAds.push(...ads))

      return { adsets, ads: allAds }
    } catch (error) {
      console.error('Failed to fetch adsets and ads:', error)
      throw error
    }
  }

  async getAllCampaignHierarchy(campaignIds: string[], datePreset = 'last_30d'): Promise<Map<string, { adsets: AdSet[], ads: Ad[] }>> {
    const hierarchy = new Map<string, { adsets: AdSet[], ads: Ad[] }>()

    await Promise.all(
      campaignIds.map(async (campaignId) => {
        try {
          const data = await this.getAdSetsWithAds(campaignId, datePreset)
          hierarchy.set(campaignId, data)
        } catch (error) {
          console.error(`Failed to fetch hierarchy for campaign ${campaignId}:`, error)
          hierarchy.set(campaignId, { adsets: [], ads: [] })
        }
      })
    )

    return hierarchy
  }
}