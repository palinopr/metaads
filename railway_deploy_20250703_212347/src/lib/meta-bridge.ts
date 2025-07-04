/**
 * Meta Bridge - Connects our AI to Meta Ads API
 * 
 * CEO Note: This is where our intelligence meets Meta's distribution.
 * We create perfect campaigns, Meta delivers them.
 */

interface MetaCampaignConfig {
  name: string;
  objective: string;
  status: string;
  special_ad_categories: string[];
  daily_budget?: number;
  lifetime_budget?: number;
}

interface MetaAdSetConfig {
  name: string;
  campaign_id: string;
  targeting: any;
  billing_event: string;
  optimization_goal: string;
  bid_amount?: number;
  daily_budget?: number;
  start_time?: string;
  end_time?: string;
}

export class MetaBridge {
  private accessToken: string;
  private adAccountId: string;
  private apiVersion: string;

  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN || '';
    this.adAccountId = process.env.META_AD_ACCOUNT_ID || '';
    this.apiVersion = process.env.META_API_VERSION || 'v18.0';
  }

  /**
   * Transform our AI campaign into Meta's format
   */
  transformAICampaignToMeta(aiCampaign: any): MetaCampaignConfig {
    return {
      name: aiCampaign.campaign.name,
      objective: this.mapObjective(aiCampaign.campaign.objective),
      status: 'PAUSED', // Always start paused for safety
      special_ad_categories: [],
      daily_budget: aiCampaign.campaign.budget.amount * 100, // Convert to cents
    };
  }

  /**
   * Transform our AI ad sets to Meta's format
   */
  transformAIAdSetsToMeta(aiCampaign: any, campaignId: string): MetaAdSetConfig[] {
    return aiCampaign.campaign.ad_sets.map((adSet: any) => ({
      name: adSet.name,
      campaign_id: campaignId,
      targeting: this.transformTargeting(adSet.targeting),
      billing_event: adSet.billing_event || 'IMPRESSIONS',
      optimization_goal: adSet.optimization_goal || 'CONVERSIONS',
      bid_amount: adSet.bid_amount,
      daily_budget: adSet.budget.amount * 100,
      start_time: adSet.scheduling.start_time,
      end_time: adSet.scheduling.end_time,
    }));
  }

  /**
   * Map our objectives to Meta's
   */
  private mapObjective(aiObjective: string): string {
    const mapping: Record<string, string> = {
      'conversions': 'OUTCOME_SALES',
      'traffic': 'OUTCOME_TRAFFIC',
      'awareness': 'OUTCOME_AWARENESS',
      'engagement': 'OUTCOME_ENGAGEMENT',
      'leads': 'OUTCOME_LEADS',
      'app_installs': 'OUTCOME_APP_PROMOTION',
    };
    return mapping[aiObjective] || 'OUTCOME_TRAFFIC';
  }

  /**
   * Transform our targeting to Meta's format
   */
  private transformTargeting(aiTargeting: any): any {
    return {
      age_min: aiTargeting.age_min || 18,
      age_max: aiTargeting.age_max || 65,
      genders: this.mapGenders(aiTargeting.genders),
      geo_locations: {
        countries: aiTargeting.locations?.map((loc: any) => loc.country) || ['US'],
        cities: aiTargeting.locations?.flatMap((loc: any) => loc.cities || []),
      },
      interests: aiTargeting.interests?.map((interest: string) => ({
        name: interest,
      })),
      behaviors: aiTargeting.behaviors,
      custom_audiences: aiTargeting.custom_audiences,
      excluded_custom_audiences: aiTargeting.excluded_audiences,
    };
  }

  private mapGenders(genders: string[]): number[] {
    if (!genders || genders.includes('all')) return [1, 2];
    const mapping: Record<string, number> = {
      'male': 1,
      'female': 2,
    };
    return genders.map(g => mapping[g]).filter(Boolean);
  }

  /**
   * Create campaign in Meta
   * In production, this would call the actual Meta API
   */
  async createCampaign(aiCampaign: any): Promise<any> {
    // TODO: Implement actual Meta API call
    console.log('Creating Meta campaign:', aiCampaign);
    
    // For now, return mock response
    return {
      id: `meta_campaign_${Date.now()}`,
      name: aiCampaign.campaign.name,
      status: 'CREATED',
      preview_url: `https://business.facebook.com/adsmanager/manage/campaigns?act=${this.adAccountId}`,
    };
  }

  /**
   * CEO's quick campaign launcher
   * Takes our AI output and makes it live on Meta
   */
  async launchAICampaign(aiOutput: any): Promise<any> {
    try {
      // 1. Create campaign
      const metaCampaign = this.transformAICampaignToMeta(aiOutput);
      const campaign = await this.createCampaign(metaCampaign);

      // 2. Create ad sets
      const metaAdSets = this.transformAIAdSetsToMeta(aiOutput, campaign.id);
      // TODO: Create ad sets via API

      // 3. Create ads with our generated content
      const ads = aiOutput.generated_content.map((content: any) => ({
        name: content.headline,
        creative: {
          title: content.headline,
          body: content.primary_text,
          call_to_action_type: content.call_to_action,
        },
      }));
      // TODO: Create ads via API

      return {
        success: true,
        campaign_id: campaign.id,
        preview_url: campaign.preview_url,
        message: 'Campaign created successfully! Review and activate in Meta Ads Manager.',
      };
    } catch (error) {
      console.error('Meta Bridge Error:', error);
      throw new Error('Failed to create campaign in Meta');
    }
  }
}

// CEO's helper function
export async function deployToMeta(aiCampaignResult: any) {
  const bridge = new MetaBridge();
  return bridge.launchAICampaign(aiCampaignResult);
}