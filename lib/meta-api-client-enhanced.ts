// Comprehensive Meta Graph API Client with ALL Meta API fields and methods
import { z } from 'zod'

// Environment configuration
const META_API_VERSION = 'v19.0'
const META_API_BASE_URL = 'https://graph.facebook.com'

// Validation schemas
const AccessTokenSchema = z.string().min(1)
const AdAccountIdSchema = z.string().regex(/^act_\d+$/, 'Ad Account ID must start with "act_" followed by numbers')

// Enhanced error handling
export class MetaAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public type?: string,
    public fbTraceId?: string,
    public isTokenExpired?: boolean
  ) {
    super(message)
    this.name = 'MetaAPIError'
  }
}

export class TokenExpiredError extends MetaAPIError {
  constructor(message: string = 'Access token has expired') {
    super(message, 'OAuthException', 'OAuthException', undefined, true)
    this.name = 'TokenExpiredError'
  }
}

// Comprehensive TypeScript interfaces with ALL Meta API fields
export interface MetaAdAccount {
  id: string
  account_id: string
  account_status: number
  account_groups?: string[]
  ad_account_promotable_objects?: any
  age?: number
  agency_client_declaration?: any
  all_payment_methods?: any[]
  amount_spent: string
  attribution_spec?: any[]
  balance: string
  brand_safety_content_filter_levels?: string[]
  business?: any
  business_city?: string
  business_country_code?: string
  business_name?: string
  business_state?: string
  business_street?: string
  business_street2?: string
  business_zip?: string
  capabilities?: string[]
  created_time: string
  currency: string
  custom_audience_info?: any
  default_dsa_beneficiary?: string
  default_dsa_payor?: string
  disable_reason?: number
  end_advertiser?: string
  end_advertiser_name?: string
  existing_customers?: string[]
  extended_credit_invoice_group?: any
  failed_delivery_checks?: any[]
  fb_entity?: number
  funding_source?: string
  funding_source_details?: any
  has_migrated_permissions?: boolean
  has_page_authorized_adaccount?: boolean
  io_number?: string
  is_attribution_spec_system_default?: boolean
  is_direct_deals_enabled?: boolean
  is_in_3ds_authorization_enabled_market?: boolean
  is_notifications_enabled?: boolean
  is_personal?: number
  is_prepay_account?: boolean
  is_tax_id_required?: boolean
  line_numbers?: number[]
  media_agency?: string
  min_campaign_group_spend_cap?: string
  min_daily_budget?: number
  name: string
  offsite_pixels_tos_accepted?: boolean
  owner?: string
  owner_business?: any
  partner?: string
  rf_spec?: any
  show_checkout_experience?: boolean
  spend_cap?: string
  tax_id?: string
  tax_id_status?: number
  tax_id_type?: string
  timezone_id: number
  timezone_name: string
  timezone_offset_hours_utc: number
  tos_accepted?: any
  user_role?: string
  user_tos_accepted?: any
}

export interface ComprehensiveCampaign {
  // Basic identification fields
  id: string
  account_id: string
  adlabels?: any[]
  bid_strategy?: 'LOWEST_COST_WITHOUT_CAP' | 'LOWEST_COST_WITH_BID_CAP' | 'TARGET_COST' | 'COST_CAP'
  boosted_object_id?: string
  brand_lift_studies?: any[]
  budget_rebalance_flag?: boolean
  budget_remaining?: string
  buying_type?: 'AUCTION' | 'RESERVED'
  can_create_brand_lift_study?: boolean
  can_use_spend_cap?: boolean
  configured_status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  created_time: string
  daily_budget?: string
  effective_status: string
  issues_info?: any[]
  last_budget_toggling_time?: string
  lifetime_budget?: string
  name: string
  objective: 'OUTCOME_APP_PROMOTION' | 'OUTCOME_AWARENESS' | 'OUTCOME_ENGAGEMENT' | 'OUTCOME_LEADS' | 'OUTCOME_SALES' | 'OUTCOME_TRAFFIC'
  pacing_type?: string[]
  promoted_object?: any
  recommendations?: any[]
  source_campaign?: any
  source_campaign_id?: string
  special_ad_categories?: ('NONE' | 'EMPLOYMENT' | 'HOUSING' | 'CREDIT')[]
  special_ad_category_country?: string[]
  spend_cap?: string
  start_time?: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  stop_time?: string
  topline_id?: string
  updated_time: string
  
  // Smart Campaign fields
  smart_promotion_type?: string
  
  // Comprehensive insights fields
  account_currency?: string
  account_id_insights?: string
  account_name?: string
  action_values?: MetaActionValue[]
  actions?: MetaAction[]
  ad_click_actions?: MetaAction[]
  ad_impression_actions?: MetaAction[]
  age_targeting?: string
  app_store_clicks?: string
  attention_events_per_impression?: string
  attention_events_unq_per_reach?: string
  auction_bid?: string
  auction_competitiveness?: string
  auction_max_competitor_bid?: string
  call_to_action_clicks?: string
  campaign_id_insights?: string
  campaign_name?: string
  canvas_avg_view_percent?: string
  canvas_avg_view_time?: string
  catalog_segment_actions?: MetaAction[]
  catalog_segment_value?: MetaActionValue[]
  catalog_segment_value_mobile_purchase_roas?: string
  catalog_segment_value_omni_purchase_roas?: string
  catalog_segment_value_website_purchase_roas?: string
  clicks?: string
  conversion_rate_ranking?: 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE'
  conversion_values?: MetaActionValue[]
  conversions?: MetaAction[]
  converted_product_quantity?: MetaAction[]
  converted_product_value?: MetaActionValue[]
  cost_per_15_sec_video_view?: MetaAction[]
  cost_per_2_sec_continuous_video_view?: MetaAction[]
  cost_per_action_type?: MetaAction[]
  cost_per_ad_click?: MetaAction[]
  cost_per_conversion?: MetaAction[]
  cost_per_dda_countby_convs?: string
  cost_per_estimated_ad_recallers?: string
  cost_per_inline_link_click?: string
  cost_per_inline_post_engagement?: string
  cost_per_one_thousand_ad_impression?: MetaAction[]
  cost_per_outbound_click?: MetaAction[]
  cost_per_thruplay?: MetaAction[]
  cost_per_unique_action_type?: MetaAction[]
  cost_per_unique_click?: string
  cost_per_unique_conversion?: MetaAction[]
  cost_per_unique_inline_link_click?: string
  cost_per_unique_outbound_click?: MetaAction[]
  cpc?: string
  cpm?: string
  cpp?: string
  created_time_insights?: string
  creative_media_type?: string
  ctr?: string
  date_start?: string
  date_stop?: string
  dda_countby_convs?: string
  dda_results?: MetaAction[]
  engagement_rate_ranking?: 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE'
  estimated_ad_recall_rate?: string
  estimated_ad_recallers?: string
  frequency?: string
  full_view_impressions?: string
  full_view_reach?: string
  gender_targeting?: string
  impressions?: string
  inline_link_click_ctr?: string
  inline_link_clicks?: string
  inline_post_engagement?: string
  instagram_upcoming_event_reminders_set?: string
  instant_experience_clicks_to_open?: string
  instant_experience_clicks_to_start?: string
  instant_experience_outbound_clicks?: MetaAction[]
  mobile_app_purchase_roas?: MetaActionValue[]
  newsfeed_avg_position?: string
  newsfeed_clicks?: string
  newsfeed_impressions?: string
  objective_insights?: string
  optimization_goal?: string
  outbound_clicks?: MetaAction[]
  outbound_clicks_ctr?: MetaAction[]
  place_page_name?: string
  purchase_roas?: MetaActionValue[]
  qualifying_question_qualify_answer_rate?: string
  quality_ranking?: 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE'
  quality_score_ectr?: string
  quality_score_ecvr?: string
  quality_score_organic?: string
  reach?: string
  social_spend?: string
  spend?: string
  total_postbacks?: string
  total_postbacks_detailed?: MetaAction[]
  unique_actions?: MetaAction[]
  unique_clicks?: string
  unique_conversions?: MetaAction[]
  unique_ctr?: string
  unique_inline_link_click_ctr?: string
  unique_inline_link_clicks?: string
  unique_link_clicks_ctr?: string
  unique_outbound_clicks?: MetaAction[]
  unique_outbound_clicks_ctr?: MetaAction[]
  unique_video_continuous_2_sec_watched_actions?: MetaAction[]
  unique_video_view_15_sec?: MetaAction[]
  updated_time_insights?: string
  video_15_sec_watched_actions?: MetaAction[]
  video_30_sec_watched_actions?: MetaAction[]
  video_avg_time_watched_actions?: MetaAction[]
  video_continuous_2_sec_watched_actions?: MetaAction[]
  video_p100_watched_actions?: MetaAction[]
  video_p25_watched_actions?: MetaAction[]
  video_p50_watched_actions?: MetaAction[]
  video_p75_watched_actions?: MetaAction[]
  video_p95_watched_actions?: MetaAction[]
  video_play_actions?: MetaAction[]
  video_play_curve_actions?: any[]
  video_play_retention_0_to_15s_actions?: MetaAction[]
  video_play_retention_20_to_60s_actions?: MetaAction[]
  video_play_retention_graph_actions?: any[]
  video_thruplay_watched_actions?: MetaAction[]
  video_time_watched_actions?: MetaAction[]
  website_ctr?: MetaAction[]
  website_purchase_roas?: MetaActionValue[]
}

export interface ComprehensiveAdSet {
  // Basic identification fields
  id: string
  account_id: string
  adlabels?: any[]
  adset_schedule?: any[]
  asset_feed_id?: string
  attribution_spec?: any[]
  bid_adjustments?: any
  bid_amount?: number
  bid_constraints?: any
  bid_info?: any
  bid_strategy?: 'LOWEST_COST_WITHOUT_CAP' | 'LOWEST_COST_WITH_BID_CAP' | 'TARGET_COST' | 'COST_CAP'
  billing_event?: 'APP_INSTALLS' | 'CLICKS' | 'IMPRESSIONS' | 'LINK_CLICKS' | 'NONE' | 'PAGE_LIKES' | 'POST_ENGAGEMENT' | 'THRUPLAY' | 'PURCHASE' | 'LISTING_INTERACTION'
  budget_remaining?: string
  campaign?: any
  campaign_id: string
  configured_status?: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  created_time: string
  creative_sequence?: string[]
  daily_budget?: string
  daily_min_spend_target?: string
  daily_spend_cap?: string
  destination_type?: 'WEBSITE' | 'APP' | 'MESSENGER' | 'APPLINKS_AUTOMATIC' | 'WHATSAPP'
  effective_status: string
  end_time?: string
  frequency_control_specs?: any[]
  full_funnel_exploration_mode?: 'DISABLED' | 'EXTENDED_EXPLORATION' | 'LIMITED_EXPLORATION'
  instagram_actor_id?: string
  is_dynamic_creative?: boolean
  issues_info?: any[]
  learning_stage_info?: any
  lifetime_budget?: string
  lifetime_imps?: number
  lifetime_min_spend_target?: string
  lifetime_spend_cap?: string
  multi_optimization_goal_weight?: 'BALANCED' | 'PREFER_INSTALL' | 'PREFER_EVENT'
  name: string
  optimization_goal?: 'AD_RECALL_LIFT' | 'APP_INSTALLS' | 'APP_INSTALLS_AND_OFFSITE_CONVERSIONS' | 'CLICKS' | 'DERIVED_EVENTS' | 'ENGAGED_USERS' | 'EVENT_RESPONSES' | 'IMPRESSIONS' | 'LANDING_PAGE_VIEWS' | 'LEAD_GENERATION' | 'LINK_CLICKS' | 'NONE' | 'OFFSITE_CONVERSIONS' | 'PAGE_LIKES' | 'POST_ENGAGEMENT' | 'QUALITY_CALL' | 'QUALITY_LEAD' | 'REACH' | 'SOCIAL_IMPRESSIONS' | 'THRUPLAY' | 'TWO_SECOND_CONTINUOUS_VIDEO_VIEWS' | 'VALUE'
  optimization_sub_event?: string
  pacing_type?: string[]
  promoted_object?: any
  recommendations?: any[]
  recurring_budget_semantics?: boolean
  review_feedback?: string
  rf_prediction_id?: string
  source_adset?: any
  source_adset_id?: string
  start_time?: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  targeting?: AdSetTargeting
  targeting_optimization_types?: any
  time_based_ad_rotation_id_blocks?: number[][]
  time_based_ad_rotation_intervals?: number[]
  updated_time: string
  use_new_app_click?: boolean
  
  // All comprehensive insights fields (same as campaign)
  account_currency?: string
  account_id_insights?: string
  account_name?: string
  action_values?: MetaActionValue[]
  actions?: MetaAction[]
  ad_click_actions?: MetaAction[]
  ad_impression_actions?: MetaAction[]
  age_targeting?: string
  app_store_clicks?: string
  attention_events_per_impression?: string
  attention_events_unq_per_reach?: string
  auction_bid?: string
  auction_competitiveness?: string
  auction_max_competitor_bid?: string
  call_to_action_clicks?: string
  campaign_id_insights?: string
  campaign_name?: string
  canvas_avg_view_percent?: string
  canvas_avg_view_time?: string
  catalog_segment_actions?: MetaAction[]
  catalog_segment_value?: MetaActionValue[]
  catalog_segment_value_mobile_purchase_roas?: string
  catalog_segment_value_omni_purchase_roas?: string
  catalog_segment_value_website_purchase_roas?: string
  clicks?: string
  conversion_rate_ranking?: 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE'
  conversion_values?: MetaActionValue[]
  conversions?: MetaAction[]
  converted_product_quantity?: MetaAction[]
  converted_product_value?: MetaActionValue[]
  cost_per_15_sec_video_view?: MetaAction[]
  cost_per_2_sec_continuous_video_view?: MetaAction[]
  cost_per_action_type?: MetaAction[]
  cost_per_ad_click?: MetaAction[]
  cost_per_conversion?: MetaAction[]
  cost_per_dda_countby_convs?: string
  cost_per_estimated_ad_recallers?: string
  cost_per_inline_link_click?: string
  cost_per_inline_post_engagement?: string
  cost_per_one_thousand_ad_impression?: MetaAction[]
  cost_per_outbound_click?: MetaAction[]
  cost_per_thruplay?: MetaAction[]
  cost_per_unique_action_type?: MetaAction[]
  cost_per_unique_click?: string
  cost_per_unique_conversion?: MetaAction[]
  cost_per_unique_inline_link_click?: string
  cost_per_unique_outbound_click?: MetaAction[]
  cpc?: string
  cpm?: string
  cpp?: string
  created_time_insights?: string
  creative_media_type?: string
  ctr?: string
  date_start?: string
  date_stop?: string
  dda_countby_convs?: string
  dda_results?: MetaAction[]
  engagement_rate_ranking?: 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE'
  estimated_ad_recall_rate?: string
  estimated_ad_recallers?: string
  frequency?: string
  full_view_impressions?: string
  full_view_reach?: string
  gender_targeting?: string
  impressions?: string
  inline_link_click_ctr?: string
  inline_link_clicks?: string
  inline_post_engagement?: string
  instagram_upcoming_event_reminders_set?: string
  instant_experience_clicks_to_open?: string
  instant_experience_clicks_to_start?: string
  instant_experience_outbound_clicks?: MetaAction[]
  mobile_app_purchase_roas?: MetaActionValue[]
  newsfeed_avg_position?: string
  newsfeed_clicks?: string
  newsfeed_impressions?: string
  objective_insights?: string
  optimization_goal_insights?: string
  outbound_clicks?: MetaAction[]
  outbound_clicks_ctr?: MetaAction[]
  place_page_name?: string
  purchase_roas?: MetaActionValue[]
  qualifying_question_qualify_answer_rate?: string
  quality_ranking?: 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE'
  quality_score_ectr?: string
  quality_score_ecvr?: string
  quality_score_organic?: string
  reach?: string
  social_spend?: string
  spend?: string
  total_postbacks?: string
  total_postbacks_detailed?: MetaAction[]
  unique_actions?: MetaAction[]
  unique_clicks?: string
  unique_conversions?: MetaAction[]
  unique_ctr?: string
  unique_inline_link_click_ctr?: string
  unique_inline_link_clicks?: string
  unique_link_clicks_ctr?: string
  unique_outbound_clicks?: MetaAction[]
  unique_outbound_clicks_ctr?: MetaAction[]
  unique_video_continuous_2_sec_watched_actions?: MetaAction[]
  unique_video_view_15_sec?: MetaAction[]
  updated_time_insights?: string
  video_15_sec_watched_actions?: MetaAction[]
  video_30_sec_watched_actions?: MetaAction[]
  video_avg_time_watched_actions?: MetaAction[]
  video_continuous_2_sec_watched_actions?: MetaAction[]
  video_p100_watched_actions?: MetaAction[]
  video_p25_watched_actions?: MetaAction[]
  video_p50_watched_actions?: MetaAction[]
  video_p75_watched_actions?: MetaAction[]
  video_p95_watched_actions?: MetaAction[]
  video_play_actions?: MetaAction[]
  video_play_curve_actions?: any[]
  video_play_retention_0_to_15s_actions?: MetaAction[]
  video_play_retention_20_to_60s_actions?: MetaAction[]
  video_play_retention_graph_actions?: any[]
  video_thruplay_watched_actions?: MetaAction[]
  video_time_watched_actions?: MetaAction[]
  website_ctr?: MetaAction[]
  website_purchase_roas?: MetaActionValue[]
}

export interface ComprehensiveAd {
  // Basic identification fields
  id: string
  account_id: string
  ad_review_feedback?: any
  adlabels?: any[]
  adset?: any
  adset_id: string
  bid_amount?: number
  bid_info?: any
  bid_type?: 'ABSOLUTE_OCPM' | 'CPC' | 'CPM' | 'CPA'
  campaign?: any
  campaign_id: string
  configured_status?: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  conversion_specs?: any[]
  created_time: string
  creative: AdCreative
  demolink_hash?: string
  display_sequence?: number
  effective_status: string
  engagement_audience?: boolean
  failed_delivery_checks?: any[]
  issues_info?: any[]
  last_updated_by_app_id?: string
  name: string
  preview_shareable_link?: string
  priority?: number
  recommendations?: any[]
  source_ad?: any
  source_ad_id?: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  tracking_specs?: any[]
  updated_time: string
  
  // All comprehensive insights fields (same as campaign)
  account_currency?: string
  account_id_insights?: string
  account_name?: string
  action_values?: MetaActionValue[]
  actions?: MetaAction[]
  ad_click_actions?: MetaAction[]
  ad_impression_actions?: MetaAction[]
  age_targeting?: string
  app_store_clicks?: string
  attention_events_per_impression?: string
  attention_events_unq_per_reach?: string
  auction_bid?: string
  auction_competitiveness?: string
  auction_max_competitor_bid?: string
  call_to_action_clicks?: string
  campaign_id_insights?: string
  campaign_name?: string
  canvas_avg_view_percent?: string
  canvas_avg_view_time?: string
  catalog_segment_actions?: MetaAction[]
  catalog_segment_value?: MetaActionValue[]
  catalog_segment_value_mobile_purchase_roas?: string
  catalog_segment_value_omni_purchase_roas?: string
  catalog_segment_value_website_purchase_roas?: string
  clicks?: string
  conversion_rate_ranking?: 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE'
  conversion_values?: MetaActionValue[]
  conversions?: MetaAction[]
  converted_product_quantity?: MetaAction[]
  converted_product_value?: MetaActionValue[]
  cost_per_15_sec_video_view?: MetaAction[]
  cost_per_2_sec_continuous_video_view?: MetaAction[]
  cost_per_action_type?: MetaAction[]
  cost_per_ad_click?: MetaAction[]
  cost_per_conversion?: MetaAction[]
  cost_per_dda_countby_convs?: string
  cost_per_estimated_ad_recallers?: string
  cost_per_inline_link_click?: string
  cost_per_inline_post_engagement?: string
  cost_per_one_thousand_ad_impression?: MetaAction[]
  cost_per_outbound_click?: MetaAction[]
  cost_per_thruplay?: MetaAction[]
  cost_per_unique_action_type?: MetaAction[]
  cost_per_unique_click?: string
  cost_per_unique_conversion?: MetaAction[]
  cost_per_unique_inline_link_click?: string
  cost_per_unique_outbound_click?: MetaAction[]
  cpc?: string
  cpm?: string
  cpp?: string
  created_time_insights?: string
  creative_media_type?: string
  ctr?: string
  date_start?: string
  date_stop?: string
  dda_countby_convs?: string
  dda_results?: MetaAction[]
  engagement_rate_ranking?: 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE'
  estimated_ad_recall_rate?: string
  estimated_ad_recallers?: string
  frequency?: string
  full_view_impressions?: string
  full_view_reach?: string
  gender_targeting?: string
  impressions?: string
  inline_link_click_ctr?: string
  inline_link_clicks?: string
  inline_post_engagement?: string
  instagram_upcoming_event_reminders_set?: string
  instant_experience_clicks_to_open?: string
  instant_experience_clicks_to_start?: string
  instant_experience_outbound_clicks?: MetaAction[]
  mobile_app_purchase_roas?: MetaActionValue[]
  newsfeed_avg_position?: string
  newsfeed_clicks?: string
  newsfeed_impressions?: string
  objective_insights?: string
  optimization_goal_insights?: string
  outbound_clicks?: MetaAction[]
  outbound_clicks_ctr?: MetaAction[]
  place_page_name?: string
  purchase_roas?: MetaActionValue[]
  qualifying_question_qualify_answer_rate?: string
  quality_ranking?: 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE'
  quality_score_ectr?: string
  quality_score_ecvr?: string
  quality_score_organic?: string
  reach?: string
  social_spend?: string
  spend?: string
  total_postbacks?: string
  total_postbacks_detailed?: MetaAction[]
  unique_actions?: MetaAction[]
  unique_clicks?: string
  unique_conversions?: MetaAction[]
  unique_ctr?: string
  unique_inline_link_click_ctr?: string
  unique_inline_link_clicks?: string
  unique_link_clicks_ctr?: string
  unique_outbound_clicks?: MetaAction[]
  unique_outbound_clicks_ctr?: MetaAction[]
  unique_video_continuous_2_sec_watched_actions?: MetaAction[]
  unique_video_view_15_sec?: MetaAction[]
  updated_time_insights?: string
  video_15_sec_watched_actions?: MetaAction[]
  video_30_sec_watched_actions?: MetaAction[]
  video_avg_time_watched_actions?: MetaAction[]
  video_continuous_2_sec_watched_actions?: MetaAction[]
  video_p100_watched_actions?: MetaAction[]
  video_p25_watched_actions?: MetaAction[]
  video_p50_watched_actions?: MetaAction[]
  video_p75_watched_actions?: MetaAction[]
  video_p95_watched_actions?: MetaAction[]
  video_play_actions?: MetaAction[]
  video_play_curve_actions?: any[]
  video_play_retention_0_to_15s_actions?: MetaAction[]
  video_play_retention_20_to_60s_actions?: MetaAction[]
  video_play_retention_graph_actions?: any[]
  video_thruplay_watched_actions?: MetaAction[]
  video_time_watched_actions?: MetaAction[]
  website_ctr?: MetaAction[]
  website_purchase_roas?: MetaActionValue[]
}

export interface AdCreative {
  id: string
  account_id?: string
  actor_id?: string
  adlabels?: any[]
  applink_treatment?: 'DEEPLINK_WITH_APPSTORE_FALLBACK' | 'DEEPLINK_WITH_WEB_FALLBACK' | 'WEB_ONLY'
  asset_feed_spec?: any
  authorization_category?: 'NONE' | 'POLITICAL' | 'ISSUE_ELECTORAL_POLITICAL'
  auto_update?: boolean
  body?: string
  branded_content_sponsor_page_id?: string
  bundle_folder_id?: string
  call_to_action_type?: 'OPEN_LINK' | 'LIKE_PAGE' | 'SHOP_NOW' | 'PLAY_GAME' | 'INSTALL_APP' | 'USE_APP' | 'INSTALL_MOBILE_APP' | 'USE_MOBILE_APP' | 'BOOK_TRAVEL' | 'LISTEN_MUSIC' | 'WATCH_VIDEO' | 'LEARN_MORE' | 'SIGN_UP' | 'DOWNLOAD' | 'WATCH_MORE' | 'NO_BUTTON' | 'VISIT_PAGES_FEED' | 'APPLY_NOW' | 'BUY_NOW' | 'GET_DIRECTIONS' | 'BUY_TICKETS' | 'UPDATE_APP' | 'BET_NOW' | 'OPEN_INSTANT_APP' | 'FOLLOW_NEWS_STORYLINE' | 'SELL_NOW' | 'RECORD_NOW' | 'DONATE_NOW' | 'SUBSCRIBE' | 'WHATSAPP_MESSAGE' | 'BOOK_NOW' | 'CONTACT_US' | 'DONATE' | 'FIND_STORE' | 'START_ORDER' | 'GET_MOBILE_APP' | 'INSTALL_DESKTOP_APP' | 'GET_DESKTOP_APP' | 'LOYALTY_LEARN_MORE'
  categorization_criteria?: 'BRAND' | 'CATEGORY' | 'PRODUCT_TYPE'
  category_media_source?: 'MIXED' | 'IMAGE' | 'VIDEO'
  collaborative_ads_lsb_image_bank_id?: string
  contextual_multi_ads?: any
  creative_sourcing_spec?: any
  degrees_of_freedom_spec?: any
  destination_set_id?: string
  dynamic_ad_voice?: 'DYNAMIC' | 'ADVERTISER_CHOICE'
  effective_authorization_category?: 'NONE' | 'POLITICAL' | 'ISSUE_ELECTORAL_POLITICAL'
  effective_instagram_media_id?: string
  effective_instagram_story_id?: string
  effective_object_story_id?: string
  enable_direct_install?: boolean
  enable_launch_instant_app?: boolean
  image_crops?: any
  image_hash?: string
  image_url?: string
  instagram_actor_id?: string
  instagram_permalink_url?: string
  instagram_story_id?: string
  interactive_components_spec?: any
  link_deep_link_url?: string
  link_destination_display_url?: string
  link_og_id?: string
  link_url?: string
  messenger_sponsored_message?: string
  name?: string
  object_id?: string
  object_store_url?: string
  object_story_id?: string
  object_story_spec?: any
  object_type?: 'SHARE' | 'PAGE' | 'EVENT' | 'STORE_ITEM' | 'OFFER' | 'PHOTO' | 'VIDEO' | 'APPLICATION' | 'INVALID'
  object_url?: string
  omnichannel_link_spec?: any
  page_welcome_message?: string
  place_page_set_id?: string
  platform_customizations?: any
  playable_asset_id?: string
  portrait_customizations?: any
  product_set_id?: string
  recommender_settings?: any
  source_instagram_media_id?: string
  status?: 'ACTIVE' | 'DELETED'
  template_url?: string
  template_url_spec?: any
  thumbnail_id?: string
  thumbnail_url?: string
  title?: string
  url_tags?: string
  use_page_actor_override?: boolean
  video_id?: string
}

export interface AdSetTargeting {
  // Geographic targeting
  geo_locations?: {
    countries?: string[]
    regions?: {
      key: string
      name?: string
    }[]
    cities?: {
      key: string
      radius?: number
      distance_unit?: 'mile' | 'kilometer'
      name?: string
      region?: string
      region_id?: string
      country?: string
    }[]
    zips?: {
      key: string
      name?: string
      primary_city_id?: number
      region_id?: number
      country?: string
    }[]
    location_types?: ('home' | 'recent' | 'travel_in')[]
    custom_locations?: {
      latitude: number
      longitude: number
      radius: number
      distance_unit?: 'mile' | 'kilometer'
      address_string?: string
      name?: string
    }[]
    electoral_districts?: {
      key: string
      name?: string
    }[]
    places?: {
      key: string
      name?: string
    }[]
    location_cluster_ids?: string[]
  }
  
  // Demographic targeting
  age_min?: number
  age_max?: number
  genders?: (1 | 2)[] // 1 = male, 2 = female
  
  // Interest targeting
  interests?: {
    id: string
    name?: string
  }[]
  
  // Behavior targeting
  behaviors?: {
    id: string
    name?: string
  }[]
  
  // Custom audiences
  custom_audiences?: {
    id: string
    name?: string
  }[]
  excluded_custom_audiences?: {
    id: string
    name?: string
  }[]
  
  // Lookalike audiences
  lookalike_audiences?: {
    id: string
    name?: string
    ratio?: number
  }[]
  
  // Connection targeting
  connections?: {
    id: string
    name?: string
  }[]
  excluded_connections?: {
    id: string
    name?: string
  }[]
  friends_of_connections?: {
    id: string
    name?: string
  }[]
  
  // Detailed targeting
  flexible_spec?: {
    interests?: {
      id: string
      name?: string
    }[]
    behaviors?: {
      id: string
      name?: string
    }[]
    demographics?: {
      id: string
      name?: string
    }[]
    life_events?: {
      id: string
      name?: string
    }[]
    industries?: {
      id: string
      name?: string
    }[]
    income?: {
      id: string
      name?: string
    }[]
    net_worth?: {
      id: string
      name?: string
    }[]
    home_type?: {
      id: string
      name?: string
    }[]
    home_ownership?: {
      id: string
      name?: string
    }[]
    home_value?: {
      id: string
      name?: string
    }[]
    ethnic_affinity?: {
      id: string
      name?: string
    }[]
    generation?: {
      id: string
      name?: string
    }[]
    household_composition?: {
      id: string
      name?: string
    }[]
    moms?: {
      id: string
      name?: string
    }[]
    office_type?: {
      id: string
      name?: string
    }[]
    politics?: {
      id: string
      name?: string
    }[]
    relationship_statuses?: {
      id: string
      name?: string
    }[]
    user_adclusters?: {
      id: string
      name?: string
    }[]
  }[]
  
  // Exclusions
  exclusions?: {
    interests?: {
      id: string
      name?: string
    }[]
    behaviors?: {
      id: string
      name?: string
    }[]
    demographics?: {
      id: string
      name?: string
    }[]
    life_events?: {
      id: string
      name?: string
    }[]
    user_adclusters?: {
      id: string
      name?: string
    }[]
  }
  
  // Platform targeting
  publisher_platforms?: ('facebook' | 'instagram' | 'audience_network' | 'messenger')[]
  facebook_positions?: ('feed' | 'instant_article' | 'instream_video' | 'right_hand_column' | 'suggested_video' | 'marketplace')[]
  instagram_positions?: ('stream' | 'story' | 'explore' | 'reels')[]
  audience_network_positions?: ('classic' | 'instream_video' | 'rewarded_video' | 'native_banner')[]
  messenger_positions?: ('messenger_home' | 'sponsored_messages')[]
  
  // Device targeting
  device_platforms?: ('mobile' | 'desktop')[]
  user_device?: ('iPhone' | 'iPod' | 'iPad' | 'Android_Smartphone' | 'Android_Tablet' | 'feature_phone' | 'desktop')[]
  user_os?: ('iOS' | 'Android' | 'Windows' | 'Mac' | 'Linux')[]
  wireless_carrier?: string[]
  
  // Language targeting
  locales?: string[]
  
  // Financial targeting
  income?: {
    id: string
    name?: string
  }[]
  net_worth?: {
    id: string
    name?: string
  }[]
  
  // Education targeting
  education_majors?: {
    id: string
    name?: string
  }[]
  education_schools?: {
    id: string
    name?: string
  }[]
  education_statuses?: number[]
  
  // Work targeting
  work_employers?: {
    id: string
    name?: string
  }[]
  work_positions?: {
    id: string
    name?: string
  }[]
  
  // Brand safety
  brand_safety_content_filter_levels?: ('FACEBOOK_STANDARD' | 'AN_STANDARD' | 'AN_STANDARD_PLUS')[]
  excluded_brand_safety_content_types?: string[]
  
  // App targeting
  app_install_state?: 'installed' | 'not_installed'
  fb_deal_id?: string
  
  // Engagement targeting
  engagement_specs?: {
    engagement_type: 'page' | 'page_post' | 'video' | 'app' | 'event'
    event_type?: 'recent' | 'upcoming'
  }[]
  
  // Family targeting
  family_statuses?: {
    id: string
    name?: string
  }[]
  
  // Household targeting
  household_composition?: {
    id: string
    name?: string
  }[]
  
  // Life events targeting
  life_events?: {
    id: string
    name?: string
  }[]
  
  // Political targeting
  politics?: {
    id: string
    name?: string
  }[]
  
  // User device targeting
  site_category?: string[]
  
  // Zip targeting
  zips?: {
    key: string
    name?: string
    primary_city_id?: number
    region_id?: number
    country?: string
  }[]
}

export interface MetaAction {
  action_type: string
  value: string
  '1d_click'?: string
  '1d_view'?: string
  '7d_click'?: string
  '7d_view'?: string
  '28d_click'?: string
  '28d_view'?: string
  dda?: string
}

export interface MetaActionValue {
  action_type: string
  value: string
  '1d_click'?: string
  '1d_view'?: string
  '7d_click'?: string
  '7d_view'?: string
  '28d_click'?: string
  '28d_view'?: string
}

// Breakdown interfaces
export interface DemographicBreakdown {
  age?: string
  gender?: string
  country?: string
  region?: string
  dma?: string
  hourly_stats_aggregated_by_advertiser_time_zone?: string
  hourly_stats_aggregated_by_audience_time_zone?: string
  place_page_id?: string
  publisher_platform?: string
  platform_position?: string
  device_platform?: string
  product_id?: string
  // All metrics
  spend: number
  impressions: number
  clicks: number
  reach: number
  frequency: number
  ctr: number
  cpc: number
  cpm: number
  cpp: number
  actions?: MetaAction[]
  action_values?: MetaActionValue[]
  conversions: number
  cost_per_conversion: number
  purchase_roas: number
  revenue: number
}

export interface HourlyBreakdown {
  hourly_stats_aggregated_by_advertiser_time_zone: string
  hourly_stats_aggregated_by_audience_time_zone?: string
  spend: number
  impressions: number
  clicks: number
  reach: number
  frequency: number
  ctr: number
  cpc: number
  cpm: number
  actions?: MetaAction[]
  action_values?: MetaActionValue[]
  conversions: number
  cost_per_conversion: number
  purchase_roas: number
  revenue: number
}

export interface DeviceBreakdown {
  device_platform: 'desktop' | 'mobile'
  publisher_platform?: string
  platform_position?: string
  spend: number
  impressions: number
  clicks: number
  reach: number
  frequency: number
  ctr: number
  cpc: number
  cpm: number
  actions?: MetaAction[]
  action_values?: MetaActionValue[]
  conversions: number
  cost_per_conversion: number
  purchase_roas: number
  revenue: number
}

export interface PlacementBreakdown {
  publisher_platform: 'facebook' | 'instagram' | 'audience_network' | 'messenger'
  platform_position: string
  spend: number
  impressions: number
  clicks: number
  reach: number
  frequency: number
  ctr: number
  cpc: number
  cpm: number
  actions?: MetaAction[]
  action_values?: MetaActionValue[]
  conversions: number
  cost_per_conversion: number
  purchase_roas: number
  revenue: number
}

export interface GeographicBreakdown {
  country?: string
  region?: string
  dma?: string
  spend: number
  impressions: number
  clicks: number
  reach: number
  frequency: number
  ctr: number
  cpc: number
  cpm: number
  actions?: MetaAction[]
  action_values?: MetaActionValue[]
  conversions: number
  cost_per_conversion: number
  purchase_roas: number
  revenue: number
}

export interface AgeGenderBreakdown {
  age: string
  gender: string
  spend: number
  impressions: number
  clicks: number
  reach: number
  frequency: number
  ctr: number
  cpc: number
  cpm: number
  actions?: MetaAction[]
  action_values?: MetaActionValue[]
  conversions: number
  cost_per_conversion: number
  purchase_roas: number
  revenue: number
}

// Helper functions
export function formatAccessToken(token: string): string {
  const trimmedToken = token.trim()
  if (trimmedToken.toLowerCase().startsWith('bearer ')) {
    return trimmedToken.substring(7).trim()
  }
  return trimmedToken
}

export function formatAdAccountId(accountId: string): string {
  const trimmedId = accountId.trim()
  if (!trimmedId.startsWith('act_')) {
    return `act_${trimmedId}`
  }
  return trimmedId
}

export function debugLog(message: string, data?: any) {
  if (typeof window !== 'undefined' && window.localStorage.getItem('debug') === 'true') {
    console.log(`[Enhanced Meta API] ${message}`, data || '')
  }
}

// Comprehensive Enhanced Meta API Client
export class ComprehensiveMetaAPIClient {
  private accessToken: string
  private adAccountId: string
  private debug: boolean

  constructor(accessToken: string, adAccountId: string, debug = false) {
    const validatedToken = AccessTokenSchema.parse(accessToken)
    const validatedAccountId = AdAccountIdSchema.parse(formatAdAccountId(adAccountId))

    this.accessToken = formatAccessToken(validatedToken)
    this.adAccountId = validatedAccountId
    this.debug = debug
  }

  // Core fetch method with retry logic
  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<any> {
    let urlObj: URL
    try {
      urlObj = new URL(url)
    } catch (error) {
      console.error('Invalid URL provided to fetchWithRetry:', url)
      throw new Error(`Invalid URL: ${url}`)
    }
    
    const pathname = urlObj.pathname
    const versionMatch = pathname.match(/\/v\d+\.\d+\/(.*)/)
    const endpoint = versionMatch ? versionMatch[1] : pathname.replace(/^\//, '')
    
    if (!endpoint || endpoint === '') {
      console.error('Empty endpoint extracted from URL:', {
        url,
        pathname: urlObj.pathname,
        versionMatch,
        endpoint
      })
      throw new Error('Invalid endpoint extracted from URL')
    }
    
    const params: Record<string, string> = {}
    urlObj.searchParams.forEach((value, key) => {
      if (key !== 'access_token') {
        params[key] = value
      }
    })
    
    for (let i = 0; i < retries; i++) {
      try {
        debugLog(`Proxying request to: ${endpoint}`)
        
        const apiUrl = typeof window === 'undefined' 
          ? `http://localhost:${process.env.PORT || 3000}/api/meta`
          : '/api/meta'
          
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint,
            params,
            accessToken: this.accessToken
          })
        })

        const data = await response.json()

        if (!response.ok) {
          const error = data.error || {}
          
          const isTokenExpired = error.code === 190 || 
                                error.type === 'OAuthException' ||
                                (error.message && error.message.toLowerCase().includes('expired')) ||
                                (error.message && error.message.toLowerCase().includes('invalid'))
          
          if (isTokenExpired) {
            throw new TokenExpiredError(error.message || 'Access token has expired')
          }
          
          throw new MetaAPIError(
            error.message || `HTTP ${response.status}`,
            error.code?.toString(),
            error.type,
            error.fbtrace_id,
            isTokenExpired
          )
        }

        debugLog('Success:', data)
        return data

      } catch (error) {
        debugLog(`Attempt ${i + 1} failed:`, error)
        
        if (i === retries - 1) throw error
        
        const delay = Math.min(1000 * Math.pow(2, i), 10000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // Build URL helper
  protected buildUrl(path: string, params: Record<string, any> = {}): string {
    if (!path || path.trim() === '') {
      console.error('Empty path provided to buildUrl')
      throw new Error('Path is required for building URL')
    }
    
    const trimmedPath = path.trim()
    let url: URL
    
    try {
      url = new URL(`${META_API_BASE_URL}/${META_API_VERSION}/${trimmedPath}`)
    } catch (error) {
      console.error('Failed to construct URL in buildUrl:', {
        path: trimmedPath,
        base: `${META_API_BASE_URL}/${META_API_VERSION}`,
        error
      })
      throw new Error(`Failed to build URL with path: ${trimmedPath}`)
    }
    
    url.searchParams.append('access_token', this.accessToken)
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          url.searchParams.append(key, JSON.stringify(value))
        } else {
          url.searchParams.append(key, String(value))
        }
      }
    })

    debugLog(`Built URL: ${url.toString().replace(this.accessToken, '***')}`)
    return url.toString()
  }

  // Test connection
  async testConnection(): Promise<{
    success: boolean
    accountInfo?: MetaAdAccount
    error?: string
  }> {
    try {
      const fields = [
        'id', 'account_id', 'account_status', 'age', 'amount_spent', 'balance',
        'business', 'business_city', 'business_country_code', 'business_name',
        'business_state', 'business_street', 'business_street2', 'business_zip',
        'capabilities', 'created_time', 'currency', 'disable_reason',
        'end_advertiser', 'end_advertiser_name', 'funding_source',
        'funding_source_details', 'has_migrated_permissions', 'io_number',
        'is_attribution_spec_system_default', 'is_direct_deals_enabled',
        'is_in_3ds_authorization_enabled_market', 'is_notifications_enabled',
        'is_personal', 'is_prepay_account', 'is_tax_id_required', 'line_numbers',
        'media_agency', 'min_campaign_group_spend_cap', 'min_daily_budget',
        'name', 'offsite_pixels_tos_accepted', 'owner', 'partner', 'rf_spec',
        'show_checkout_experience', 'spend_cap', 'tax_id', 'tax_id_status',
        'tax_id_type', 'timezone_id', 'timezone_name', 'timezone_offset_hours_utc',
        'tos_accepted', 'user_role', 'user_tos_accepted'
      ].join(',')

      const url = this.buildUrl(this.adAccountId, { fields })
      const data = await this.fetchWithRetry(url)
      
      return {
        success: true,
        accountInfo: data as MetaAdAccount
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get comprehensive campaigns with ALL available fields
  async getCampaignsComprehensive(
    datePreset: string = 'last_30d',
    customFields?: string[]
  ): Promise<ComprehensiveCampaign[]> {
    const basicFields = [
      'id', 'account_id', 'adlabels', 'bid_strategy', 'boosted_object_id',
      'brand_lift_studies', 'budget_rebalance_flag', 'budget_remaining',
      'buying_type', 'can_create_brand_lift_study', 'can_use_spend_cap',
      'configured_status', 'created_time', 'daily_budget', 'effective_status',
      'issues_info', 'last_budget_toggling_time', 'lifetime_budget', 'name',
      'objective', 'pacing_type', 'promoted_object', 'recommendations',
      'source_campaign', 'source_campaign_id', 'special_ad_categories',
      'special_ad_category_country', 'spend_cap', 'start_time', 'status',
      'stop_time', 'topline_id', 'updated_time', 'smart_promotion_type'
    ]

    const insightFields = [
      'account_currency', 'account_id', 'account_name', 'action_values', 'actions',
      'ad_click_actions', 'ad_impression_actions', 'age_targeting', 'app_store_clicks',
      'attention_events_per_impression', 'attention_events_unq_per_reach',
      'auction_bid', 'auction_competitiveness', 'auction_max_competitor_bid',
      'call_to_action_clicks', 'campaign_id', 'campaign_name', 'canvas_avg_view_percent',
      'canvas_avg_view_time', 'catalog_segment_actions', 'catalog_segment_value',
      'catalog_segment_value_mobile_purchase_roas', 'catalog_segment_value_omni_purchase_roas',
      'catalog_segment_value_website_purchase_roas', 'clicks', 'conversion_rate_ranking',
      'conversion_values', 'conversions', 'converted_product_quantity',
      'converted_product_value', 'cost_per_15_sec_video_view', 'cost_per_2_sec_continuous_video_view',
      'cost_per_action_type', 'cost_per_ad_click', 'cost_per_conversion',
      'cost_per_dda_countby_convs', 'cost_per_estimated_ad_recallers',
      'cost_per_inline_link_click', 'cost_per_inline_post_engagement',
      'cost_per_one_thousand_ad_impression', 'cost_per_outbound_click',
      'cost_per_thruplay', 'cost_per_unique_action_type', 'cost_per_unique_click',
      'cost_per_unique_conversion', 'cost_per_unique_inline_link_click',
      'cost_per_unique_outbound_click', 'cpc', 'cpm', 'cpp', 'created_time',
      'creative_media_type', 'ctr', 'date_start', 'date_stop', 'dda_countby_convs',
      'dda_results', 'engagement_rate_ranking', 'estimated_ad_recall_rate',
      'estimated_ad_recallers', 'frequency', 'full_view_impressions',
      'full_view_reach', 'gender_targeting', 'impressions', 'inline_link_click_ctr',
      'inline_link_clicks', 'inline_post_engagement', 'instagram_upcoming_event_reminders_set',
      'instant_experience_clicks_to_open', 'instant_experience_clicks_to_start',
      'instant_experience_outbound_clicks', 'mobile_app_purchase_roas',
      'newsfeed_avg_position', 'newsfeed_clicks', 'newsfeed_impressions',
      'objective', 'optimization_goal', 'outbound_clicks', 'outbound_clicks_ctr',
      'place_page_name', 'purchase_roas', 'qualifying_question_qualify_answer_rate',
      'quality_ranking', 'quality_score_ectr', 'quality_score_ecvr',
      'quality_score_organic', 'reach', 'social_spend', 'spend', 'total_postbacks',
      'total_postbacks_detailed', 'unique_actions', 'unique_clicks',
      'unique_conversions', 'unique_ctr', 'unique_inline_link_click_ctr',
      'unique_inline_link_clicks', 'unique_link_clicks_ctr', 'unique_outbound_clicks',
      'unique_outbound_clicks_ctr', 'unique_video_continuous_2_sec_watched_actions',
      'unique_video_view_15_sec', 'updated_time', 'video_15_sec_watched_actions',
      'video_30_sec_watched_actions', 'video_avg_time_watched_actions',
      'video_continuous_2_sec_watched_actions', 'video_p100_watched_actions',
      'video_p25_watched_actions', 'video_p50_watched_actions',
      'video_p75_watched_actions', 'video_p95_watched_actions',
      'video_play_actions', 'video_play_curve_actions',
      'video_play_retention_0_to_15s_actions', 'video_play_retention_20_to_60s_actions',
      'video_play_retention_graph_actions', 'video_thruplay_watched_actions',
      'video_time_watched_actions', 'website_ctr', 'website_purchase_roas'
    ]

    const fieldsToUse = customFields || basicFields
    const fields = [
      ...fieldsToUse,
      `insights.date_preset(${datePreset}){${insightFields.join(',')}}`
    ].join(',')

    const url = this.buildUrl(`${this.adAccountId}/campaigns`, {
      fields,
      limit: 100
    })

    const data = await this.fetchWithRetry(url)
    return this.processCampaignData(data.data || [])
  }

  // Get comprehensive ad sets with ALL available fields
  async getAdSetsComprehensive(
    campaignId?: string,
    datePreset: string = 'last_30d',
    customFields?: string[]
  ): Promise<ComprehensiveAdSet[]> {
    const basicFields = [
      'id', 'account_id', 'adlabels', 'adset_schedule', 'asset_feed_id',
      'attribution_spec', 'bid_adjustments', 'bid_amount', 'bid_constraints',
      'bid_info', 'bid_strategy', 'billing_event', 'budget_remaining',
      'campaign', 'campaign_id', 'configured_status', 'created_time',
      'creative_sequence', 'daily_budget', 'daily_min_spend_target',
      'daily_spend_cap', 'destination_type', 'effective_status', 'end_time',
      'frequency_control_specs', 'full_funnel_exploration_mode',
      'instagram_actor_id', 'is_dynamic_creative', 'issues_info',
      'learning_stage_info', 'lifetime_budget', 'lifetime_imps',
      'lifetime_min_spend_target', 'lifetime_spend_cap',
      'multi_optimization_goal_weight', 'name', 'optimization_goal',
      'optimization_sub_event', 'pacing_type', 'promoted_object',
      'recommendations', 'recurring_budget_semantics', 'review_feedback',
      'rf_prediction_id', 'source_adset', 'source_adset_id', 'start_time',
      'status', 'targeting', 'targeting_optimization_types',
      'time_based_ad_rotation_id_blocks', 'time_based_ad_rotation_intervals',
      'updated_time', 'use_new_app_click'
    ]

    const insightFields = [
      'account_currency', 'account_id', 'account_name', 'action_values', 'actions',
      'ad_click_actions', 'ad_impression_actions', 'age_targeting', 'app_store_clicks',
      'attention_events_per_impression', 'attention_events_unq_per_reach',
      'auction_bid', 'auction_competitiveness', 'auction_max_competitor_bid',
      'call_to_action_clicks', 'campaign_id', 'campaign_name', 'canvas_avg_view_percent',
      'canvas_avg_view_time', 'catalog_segment_actions', 'catalog_segment_value',
      'catalog_segment_value_mobile_purchase_roas', 'catalog_segment_value_omni_purchase_roas',
      'catalog_segment_value_website_purchase_roas', 'clicks', 'conversion_rate_ranking',
      'conversion_values', 'conversions', 'converted_product_quantity',
      'converted_product_value', 'cost_per_15_sec_video_view', 'cost_per_2_sec_continuous_video_view',
      'cost_per_action_type', 'cost_per_ad_click', 'cost_per_conversion',
      'cost_per_dda_countby_convs', 'cost_per_estimated_ad_recallers',
      'cost_per_inline_link_click', 'cost_per_inline_post_engagement',
      'cost_per_one_thousand_ad_impression', 'cost_per_outbound_click',
      'cost_per_thruplay', 'cost_per_unique_action_type', 'cost_per_unique_click',
      'cost_per_unique_conversion', 'cost_per_unique_inline_link_click',
      'cost_per_unique_outbound_click', 'cpc', 'cpm', 'cpp', 'created_time',
      'creative_media_type', 'ctr', 'date_start', 'date_stop', 'dda_countby_convs',
      'dda_results', 'engagement_rate_ranking', 'estimated_ad_recall_rate',
      'estimated_ad_recallers', 'frequency', 'full_view_impressions',
      'full_view_reach', 'gender_targeting', 'impressions', 'inline_link_click_ctr',
      'inline_link_clicks', 'inline_post_engagement', 'instagram_upcoming_event_reminders_set',
      'instant_experience_clicks_to_open', 'instant_experience_clicks_to_start',
      'instant_experience_outbound_clicks', 'mobile_app_purchase_roas',
      'newsfeed_avg_position', 'newsfeed_clicks', 'newsfeed_impressions',
      'objective', 'optimization_goal', 'outbound_clicks', 'outbound_clicks_ctr',
      'place_page_name', 'purchase_roas', 'qualifying_question_qualify_answer_rate',
      'quality_ranking', 'quality_score_ectr', 'quality_score_ecvr',
      'quality_score_organic', 'reach', 'social_spend', 'spend', 'total_postbacks',
      'total_postbacks_detailed', 'unique_actions', 'unique_clicks',
      'unique_conversions', 'unique_ctr', 'unique_inline_link_click_ctr',
      'unique_inline_link_clicks', 'unique_link_clicks_ctr', 'unique_outbound_clicks',
      'unique_outbound_clicks_ctr', 'unique_video_continuous_2_sec_watched_actions',
      'unique_video_view_15_sec', 'updated_time', 'video_15_sec_watched_actions',
      'video_30_sec_watched_actions', 'video_avg_time_watched_actions',
      'video_continuous_2_sec_watched_actions', 'video_p100_watched_actions',
      'video_p25_watched_actions', 'video_p50_watched_actions',
      'video_p75_watched_actions', 'video_p95_watched_actions',
      'video_play_actions', 'video_play_curve_actions',
      'video_play_retention_0_to_15s_actions', 'video_play_retention_20_to_60s_actions',
      'video_play_retention_graph_actions', 'video_thruplay_watched_actions',
      'video_time_watched_actions', 'website_ctr', 'website_purchase_roas'
    ]

    const fieldsToUse = customFields || basicFields
    const fields = [
      ...fieldsToUse,
      `insights.date_preset(${datePreset}){${insightFields.join(',')}}`
    ].join(',')

    const endpoint = campaignId 
      ? `${campaignId}/adsets`
      : `${this.adAccountId}/adsets`

    const url = this.buildUrl(endpoint, {
      fields,
      limit: 100
    })

    const data = await this.fetchWithRetry(url)
    return this.processAdSetData(data.data || [])
  }

  // Get comprehensive ads with ALL available fields
  async getAdsComprehensive(
    adSetId?: string,
    datePreset: string = 'last_30d',
    customFields?: string[]
  ): Promise<ComprehensiveAd[]> {
    const basicFields = [
      'id', 'account_id', 'ad_review_feedback', 'adlabels', 'adset',
      'adset_id', 'bid_amount', 'bid_info', 'bid_type', 'campaign',
      'campaign_id', 'configured_status', 'conversion_specs', 'created_time',
      'creative', 'demolink_hash', 'display_sequence', 'effective_status',
      'engagement_audience', 'failed_delivery_checks', 'issues_info',
      'last_updated_by_app_id', 'name', 'preview_shareable_link',
      'priority', 'recommendations', 'source_ad', 'source_ad_id',
      'status', 'tracking_specs', 'updated_time'
    ]

    const creativeFields = [
      'id', 'account_id', 'actor_id', 'adlabels', 'applink_treatment',
      'asset_feed_spec', 'authorization_category', 'auto_update', 'body',
      'branded_content_sponsor_page_id', 'bundle_folder_id', 'call_to_action_type',
      'categorization_criteria', 'category_media_source', 'collaborative_ads_lsb_image_bank_id',
      'contextual_multi_ads', 'creative_sourcing_spec', 'degrees_of_freedom_spec',
      'destination_set_id', 'dynamic_ad_voice', 'effective_authorization_category',
      'effective_instagram_media_id', 'effective_instagram_story_id',
      'effective_object_story_id', 'enable_direct_install', 'enable_launch_instant_app',
      'image_crops', 'image_hash', 'image_url', 'instagram_actor_id',
      'instagram_permalink_url', 'instagram_story_id', 'interactive_components_spec',
      'link_deep_link_url', 'link_destination_display_url', 'link_og_id',
      'link_url', 'messenger_sponsored_message', 'name', 'object_id',
      'object_store_url', 'object_story_id', 'object_story_spec', 'object_type',
      'object_url', 'omnichannel_link_spec', 'page_welcome_message',
      'place_page_set_id', 'platform_customizations', 'playable_asset_id',
      'portrait_customizations', 'product_set_id', 'recommender_settings',
      'source_instagram_media_id', 'status', 'template_url', 'template_url_spec',
      'thumbnail_id', 'thumbnail_url', 'title', 'url_tags', 'use_page_actor_override',
      'video_id'
    ]

    const insightFields = [
      'account_currency', 'account_id', 'account_name', 'action_values', 'actions',
      'ad_click_actions', 'ad_impression_actions', 'age_targeting', 'app_store_clicks',
      'attention_events_per_impression', 'attention_events_unq_per_reach',
      'auction_bid', 'auction_competitiveness', 'auction_max_competitor_bid',
      'call_to_action_clicks', 'campaign_id', 'campaign_name', 'canvas_avg_view_percent',
      'canvas_avg_view_time', 'catalog_segment_actions', 'catalog_segment_value',
      'catalog_segment_value_mobile_purchase_roas', 'catalog_segment_value_omni_purchase_roas',
      'catalog_segment_value_website_purchase_roas', 'clicks', 'conversion_rate_ranking',
      'conversion_values', 'conversions', 'converted_product_quantity',
      'converted_product_value', 'cost_per_15_sec_video_view', 'cost_per_2_sec_continuous_video_view',
      'cost_per_action_type', 'cost_per_ad_click', 'cost_per_conversion',
      'cost_per_dda_countby_convs', 'cost_per_estimated_ad_recallers',
      'cost_per_inline_link_click', 'cost_per_inline_post_engagement',
      'cost_per_one_thousand_ad_impression', 'cost_per_outbound_click',
      'cost_per_thruplay', 'cost_per_unique_action_type', 'cost_per_unique_click',
      'cost_per_unique_conversion', 'cost_per_unique_inline_link_click',
      'cost_per_unique_outbound_click', 'cpc', 'cpm', 'cpp', 'created_time',
      'creative_media_type', 'ctr', 'date_start', 'date_stop', 'dda_countby_convs',
      'dda_results', 'engagement_rate_ranking', 'estimated_ad_recall_rate',
      'estimated_ad_recallers', 'frequency', 'full_view_impressions',
      'full_view_reach', 'gender_targeting', 'impressions', 'inline_link_click_ctr',
      'inline_link_clicks', 'inline_post_engagement', 'instagram_upcoming_event_reminders_set',
      'instant_experience_clicks_to_open', 'instant_experience_clicks_to_start',
      'instant_experience_outbound_clicks', 'mobile_app_purchase_roas',
      'newsfeed_avg_position', 'newsfeed_clicks', 'newsfeed_impressions',
      'objective', 'optimization_goal', 'outbound_clicks', 'outbound_clicks_ctr',
      'place_page_name', 'purchase_roas', 'qualifying_question_qualify_answer_rate',
      'quality_ranking', 'quality_score_ectr', 'quality_score_ecvr',
      'quality_score_organic', 'reach', 'social_spend', 'spend', 'total_postbacks',
      'total_postbacks_detailed', 'unique_actions', 'unique_clicks',
      'unique_conversions', 'unique_ctr', 'unique_inline_link_click_ctr',
      'unique_inline_link_clicks', 'unique_link_clicks_ctr', 'unique_outbound_clicks',
      'unique_outbound_clicks_ctr', 'unique_video_continuous_2_sec_watched_actions',
      'unique_video_view_15_sec', 'updated_time', 'video_15_sec_watched_actions',
      'video_30_sec_watched_actions', 'video_avg_time_watched_actions',
      'video_continuous_2_sec_watched_actions', 'video_p100_watched_actions',
      'video_p25_watched_actions', 'video_p50_watched_actions',
      'video_p75_watched_actions', 'video_p95_watched_actions',
      'video_play_actions', 'video_play_curve_actions',
      'video_play_retention_0_to_15s_actions', 'video_play_retention_20_to_60s_actions',
      'video_play_retention_graph_actions', 'video_thruplay_watched_actions',
      'video_time_watched_actions', 'website_ctr', 'website_purchase_roas'
    ]

    const fieldsToUse = customFields || [
      ...basicFields,
      `creative{${creativeFields.join(',')}}`
    ]
    
    const fields = [
      ...fieldsToUse,
      `insights.date_preset(${datePreset}){${insightFields.join(',')}}`
    ].join(',')

    const endpoint = adSetId 
      ? `${adSetId}/ads`
      : `${this.adAccountId}/ads`

    const url = this.buildUrl(endpoint, {
      fields,
      limit: 100
    })

    const data = await this.fetchWithRetry(url)
    return this.processAdData(data.data || [])
  }

  // Comprehensive demographic breakdown with all possible breakdowns
  async getDemographicBreakdownComprehensive(
    entityId: string,
    entityType: 'campaign' | 'adset' | 'ad' = 'campaign',
    breakdowns: string[] = ['age', 'gender'],
    datePreset: string = 'last_30d',
    timeRange?: { since: string, until: string }
  ): Promise<DemographicBreakdown[]> {
    const fields = [
      'spend', 'impressions', 'clicks', 'reach', 'frequency', 'ctr', 'cpc', 'cpm', 'cpp',
      'actions', 'action_values', 'conversions', 'conversion_values',
      'cost_per_conversion', 'purchase_roas', 'unique_clicks', 'cost_per_unique_click',
      'social_spend', 'video_15_sec_watched_actions', 'video_30_sec_watched_actions',
      'video_p25_watched_actions', 'video_p50_watched_actions', 'video_p75_watched_actions',
      'video_p100_watched_actions', 'video_play_actions', 'video_thruplay_watched_actions',
      'outbound_clicks', 'cost_per_outbound_click', 'inline_link_clicks',
      'cost_per_inline_link_click', 'unique_outbound_clicks', 'unique_inline_link_clicks',
      'mobile_app_purchase_roas', 'website_purchase_roas'
    ].join(',')
    
    const params: any = {
      fields,
      breakdowns: breakdowns.join(','),
      limit: 1000
    }

    if (timeRange) {
      params.time_range = JSON.stringify(timeRange)
    } else {
      params.date_preset = datePreset
    }

    const url = this.buildUrl(`${entityId}/insights`, params)
    const data = await this.fetchWithRetry(url)
    return this.processDemographicData(data.data || [])
  }

  // Comprehensive hourly breakdown
  async getHourlyBreakdownComprehensive(
    entityId: string,
    entityType: 'campaign' | 'adset' | 'ad' = 'campaign',
    timeZone: 'advertiser' | 'audience' = 'advertiser',
    dateRange?: { since: string, until: string }
  ): Promise<HourlyBreakdown[]> {
    const fields = [
      'spend', 'impressions', 'clicks', 'reach', 'frequency', 'ctr', 'cpc', 'cpm',
      'actions', 'action_values', 'conversions', 'conversion_values',
      'cost_per_conversion', 'purchase_roas', 'unique_clicks', 'cost_per_unique_click',
      'social_spend', 'video_15_sec_watched_actions', 'video_30_sec_watched_actions',
      'video_p25_watched_actions', 'video_p50_watched_actions', 'video_p75_watched_actions',
      'video_p100_watched_actions', 'video_play_actions', 'video_thruplay_watched_actions',
      'outbound_clicks', 'cost_per_outbound_click', 'inline_link_clicks',
      'cost_per_inline_link_click', 'unique_outbound_clicks', 'unique_inline_link_clicks'
    ].join(',')
    
    const breakdown = timeZone === 'advertiser' 
      ? 'hourly_stats_aggregated_by_advertiser_time_zone'
      : 'hourly_stats_aggregated_by_audience_time_zone'

    const params: any = {
      fields,
      breakdowns: breakdown,
      limit: 1000
    }

    if (dateRange) {
      params.time_range = JSON.stringify(dateRange)
    } else {
      params.date_preset = 'last_7d'
    }

    const url = this.buildUrl(`${entityId}/insights`, params)
    const data = await this.fetchWithRetry(url)
    return this.processHourlyData(data.data || [])
  }

  // Comprehensive device breakdown
  async getDeviceBreakdownComprehensive(
    entityId: string,
    entityType: 'campaign' | 'adset' | 'ad' = 'campaign',
    datePreset: string = 'last_30d'
  ): Promise<DeviceBreakdown[]> {
    const fields = [
      'spend', 'impressions', 'clicks', 'reach', 'frequency', 'ctr', 'cpc', 'cpm',
      'actions', 'action_values', 'conversions', 'conversion_values',
      'cost_per_conversion', 'purchase_roas', 'unique_clicks', 'cost_per_unique_click',
      'social_spend', 'video_15_sec_watched_actions', 'video_30_sec_watched_actions',
      'video_p25_watched_actions', 'video_p50_watched_actions', 'video_p75_watched_actions',
      'video_p100_watched_actions', 'video_play_actions', 'video_thruplay_watched_actions',
      'outbound_clicks', 'cost_per_outbound_click', 'inline_link_clicks',
      'cost_per_inline_link_click', 'unique_outbound_clicks', 'unique_inline_link_clicks'
    ].join(',')
    
    const url = this.buildUrl(`${entityId}/insights`, {
      fields,
      breakdowns: 'device_platform',
      date_preset: datePreset,
      limit: 1000
    })

    const data = await this.fetchWithRetry(url)
    return this.processDeviceData(data.data || [])
  }

  // Comprehensive placement breakdown
  async getPlacementBreakdownComprehensive(
    entityId: string,
    entityType: 'campaign' | 'adset' | 'ad' = 'campaign',
    datePreset: string = 'last_30d'
  ): Promise<PlacementBreakdown[]> {
    const fields = [
      'spend', 'impressions', 'clicks', 'reach', 'frequency', 'ctr', 'cpc', 'cpm',
      'actions', 'action_values', 'conversions', 'conversion_values',
      'cost_per_conversion', 'purchase_roas', 'unique_clicks', 'cost_per_unique_click',
      'social_spend', 'video_15_sec_watched_actions', 'video_30_sec_watched_actions',
      'video_p25_watched_actions', 'video_p50_watched_actions', 'video_p75_watched_actions',
      'video_p100_watched_actions', 'video_play_actions', 'video_thruplay_watched_actions',
      'outbound_clicks', 'cost_per_outbound_click', 'inline_link_clicks',
      'cost_per_inline_link_click', 'unique_outbound_clicks', 'unique_inline_link_clicks'
    ].join(',')
    
    const url = this.buildUrl(`${entityId}/insights`, {
      fields,
      breakdowns: 'publisher_platform,platform_position',
      date_preset: datePreset,
      limit: 1000
    })

    const data = await this.fetchWithRetry(url)
    return this.processPlacementData(data.data || [])
  }

  // Geographic breakdown
  async getGeographicBreakdownComprehensive(
    entityId: string,
    breakdownLevel: 'country' | 'region' | 'dma' = 'country',
    datePreset: string = 'last_30d'
  ): Promise<GeographicBreakdown[]> {
    const fields = [
      'spend', 'impressions', 'clicks', 'reach', 'frequency', 'ctr', 'cpc', 'cpm',
      'actions', 'action_values', 'conversions', 'conversion_values',
      'cost_per_conversion', 'purchase_roas', 'unique_clicks', 'cost_per_unique_click',
      'social_spend', 'video_15_sec_watched_actions', 'video_30_sec_watched_actions',
      'video_p25_watched_actions', 'video_p50_watched_actions', 'video_p75_watched_actions',
      'video_p100_watched_actions', 'video_play_actions', 'video_thruplay_watched_actions',
      'outbound_clicks', 'cost_per_outbound_click', 'inline_link_clicks',
      'cost_per_inline_link_click', 'unique_outbound_clicks', 'unique_inline_link_clicks'
    ].join(',')
    
    const url = this.buildUrl(`${entityId}/insights`, {
      fields,
      breakdowns: breakdownLevel,
      date_preset: datePreset,
      limit: 1000
    })

    const data = await this.fetchWithRetry(url)
    return this.processGeographicData(data.data || [])
  }

  // Age and gender breakdown
  async getAgeGenderBreakdownComprehensive(
    entityId: string,
    datePreset: string = 'last_30d'
  ): Promise<AgeGenderBreakdown[]> {
    const fields = [
      'spend', 'impressions', 'clicks', 'reach', 'frequency', 'ctr', 'cpc', 'cpm',
      'actions', 'action_values', 'conversions', 'conversion_values',
      'cost_per_conversion', 'purchase_roas', 'unique_clicks', 'cost_per_unique_click',
      'social_spend', 'video_15_sec_watched_actions', 'video_30_sec_watched_actions',
      'video_p25_watched_actions', 'video_p50_watched_actions', 'video_p75_watched_actions',
      'video_p100_watched_actions', 'video_play_actions', 'video_thruplay_watched_actions',
      'outbound_clicks', 'cost_per_outbound_click', 'inline_link_clicks',
      'cost_per_inline_link_click', 'unique_outbound_clicks', 'unique_inline_link_clicks'
    ].join(',')
    
    const url = this.buildUrl(`${entityId}/insights`, {
      fields,
      breakdowns: 'age,gender',
      date_preset: datePreset,
      limit: 1000
    })

    const data = await this.fetchWithRetry(url)
    return this.processAgeGenderData(data.data || [])
  }

  // Custom insights with flexible parameters
  async getCustomInsights(
    entityId: string,
    options: {
      fields?: string[]
      breakdowns?: string[]
      datePreset?: string
      timeRange?: { since: string, until: string }
      filterBy?: Record<string, any>
      limit?: number
      sort?: string[]
    } = {}
  ): Promise<any[]> {
    const {
      fields = ['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'actions', 'action_values'],
      breakdowns = [],
      datePreset = 'last_30d',
      timeRange,
      filterBy = {},
      limit = 1000,
      sort = []
    } = options

    const params: any = {
      fields: fields.join(','),
      limit
    }

    if (breakdowns.length > 0) {
      params.breakdowns = breakdowns.join(',')
    }

    if (timeRange) {
      params.time_range = JSON.stringify(timeRange)
    } else {
      params.date_preset = datePreset
    }

    if (Object.keys(filterBy).length > 0) {
      params.filtering = JSON.stringify([filterBy])
    }

    if (sort.length > 0) {
      params.sort = sort.join(',')
    }

    const url = this.buildUrl(`${entityId}/insights`, params)
    const data = await this.fetchWithRetry(url)
    return data.data || []
  }

  // Data processing methods
  private processCampaignData(campaigns: any[]): ComprehensiveCampaign[] {
    return campaigns.map(campaign => {
      const processed: ComprehensiveCampaign = {
        // Basic fields
        id: campaign.id,
        account_id: campaign.account_id,
        name: campaign.name,
        status: campaign.status,
        configured_status: campaign.configured_status,
        effective_status: campaign.effective_status,
        objective: campaign.objective,
        created_time: campaign.created_time,
        updated_time: campaign.updated_time,
        
        // Optional fields
        adlabels: campaign.adlabels,
        bid_strategy: campaign.bid_strategy,
        boosted_object_id: campaign.boosted_object_id,
        brand_lift_studies: campaign.brand_lift_studies,
        budget_rebalance_flag: campaign.budget_rebalance_flag,
        budget_remaining: campaign.budget_remaining,
        buying_type: campaign.buying_type,
        can_create_brand_lift_study: campaign.can_create_brand_lift_study,
        can_use_spend_cap: campaign.can_use_spend_cap,
        daily_budget: campaign.daily_budget,
        lifetime_budget: campaign.lifetime_budget,
        issues_info: campaign.issues_info,
        last_budget_toggling_time: campaign.last_budget_toggling_time,
        pacing_type: campaign.pacing_type,
        promoted_object: campaign.promoted_object,
        recommendations: campaign.recommendations,
        source_campaign: campaign.source_campaign,
        source_campaign_id: campaign.source_campaign_id,
        special_ad_categories: campaign.special_ad_categories,
        special_ad_category_country: campaign.special_ad_category_country,
        spend_cap: campaign.spend_cap,
        start_time: campaign.start_time,
        stop_time: campaign.stop_time,
        topline_id: campaign.topline_id,
        smart_promotion_type: campaign.smart_promotion_type
      }

      // Process insights if available
      if (campaign.insights?.data?.[0]) {
        const insights = campaign.insights.data[0]
        this.addInsightsToEntity(processed, insights)
      }

      return processed
    })
  }

  private processAdSetData(adsets: any[]): ComprehensiveAdSet[] {
    return adsets.map(adset => {
      const processed: ComprehensiveAdSet = {
        // Basic fields
        id: adset.id,
        account_id: adset.account_id,
        name: adset.name,
        campaign_id: adset.campaign_id,
        status: adset.status,
        effective_status: adset.effective_status,
        created_time: adset.created_time,
        updated_time: adset.updated_time,
        
        // Optional fields
        adlabels: adset.adlabels,
        adset_schedule: adset.adset_schedule,
        asset_feed_id: adset.asset_feed_id,
        attribution_spec: adset.attribution_spec,
        bid_adjustments: adset.bid_adjustments,
        bid_amount: adset.bid_amount,
        bid_constraints: adset.bid_constraints,
        bid_info: adset.bid_info,
        bid_strategy: adset.bid_strategy,
        billing_event: adset.billing_event,
        budget_remaining: adset.budget_remaining,
        campaign: adset.campaign,
        configured_status: adset.configured_status,
        creative_sequence: adset.creative_sequence,
        daily_budget: adset.daily_budget,
        daily_min_spend_target: adset.daily_min_spend_target,
        daily_spend_cap: adset.daily_spend_cap,
        destination_type: adset.destination_type,
        end_time: adset.end_time,
        frequency_control_specs: adset.frequency_control_specs,
        full_funnel_exploration_mode: adset.full_funnel_exploration_mode,
        instagram_actor_id: adset.instagram_actor_id,
        is_dynamic_creative: adset.is_dynamic_creative,
        issues_info: adset.issues_info,
        learning_stage_info: adset.learning_stage_info,
        lifetime_budget: adset.lifetime_budget,
        lifetime_imps: adset.lifetime_imps,
        lifetime_min_spend_target: adset.lifetime_min_spend_target,
        lifetime_spend_cap: adset.lifetime_spend_cap,
        multi_optimization_goal_weight: adset.multi_optimization_goal_weight,
        optimization_goal: adset.optimization_goal,
        optimization_sub_event: adset.optimization_sub_event,
        pacing_type: adset.pacing_type,
        promoted_object: adset.promoted_object,
        recommendations: adset.recommendations,
        recurring_budget_semantics: adset.recurring_budget_semantics,
        review_feedback: adset.review_feedback,
        rf_prediction_id: adset.rf_prediction_id,
        source_adset: adset.source_adset,
        source_adset_id: adset.source_adset_id,
        start_time: adset.start_time,
        targeting: adset.targeting,
        targeting_optimization_types: adset.targeting_optimization_types,
        time_based_ad_rotation_id_blocks: adset.time_based_ad_rotation_id_blocks,
        time_based_ad_rotation_intervals: adset.time_based_ad_rotation_intervals,
        use_new_app_click: adset.use_new_app_click
      }

      // Process insights if available
      if (adset.insights?.data?.[0]) {
        const insights = adset.insights.data[0]
        this.addInsightsToEntity(processed, insights)
      }

      return processed
    })
  }

  private processAdData(ads: any[]): ComprehensiveAd[] {
    return ads.map(ad => {
      const processed: ComprehensiveAd = {
        // Basic fields
        id: ad.id,
        account_id: ad.account_id,
        name: ad.name,
        adset_id: ad.adset_id,
        campaign_id: ad.campaign_id,
        status: ad.status,
        effective_status: ad.effective_status,
        created_time: ad.created_time,
        updated_time: ad.updated_time,
        creative: ad.creative,
        
        // Optional fields
        ad_review_feedback: ad.ad_review_feedback,
        adlabels: ad.adlabels,
        adset: ad.adset,
        bid_amount: ad.bid_amount,
        bid_info: ad.bid_info,
        bid_type: ad.bid_type,
        campaign: ad.campaign,
        configured_status: ad.configured_status,
        conversion_specs: ad.conversion_specs,
        demolink_hash: ad.demolink_hash,
        display_sequence: ad.display_sequence,
        engagement_audience: ad.engagement_audience,
        failed_delivery_checks: ad.failed_delivery_checks,
        issues_info: ad.issues_info,
        last_updated_by_app_id: ad.last_updated_by_app_id,
        preview_shareable_link: ad.preview_shareable_link,
        priority: ad.priority,
        recommendations: ad.recommendations,
        source_ad: ad.source_ad,
        source_ad_id: ad.source_ad_id,
        tracking_specs: ad.tracking_specs
      }

      // Process insights if available
      if (ad.insights?.data?.[0]) {
        const insights = ad.insights.data[0]
        this.addInsightsToEntity(processed, insights)
      }

      return processed
    })
  }

  private addInsightsToEntity(entity: any, insights: any): void {
    // Basic metrics
    entity.spend = this.parseNumber(insights.spend)
    entity.impressions = this.parseNumber(insights.impressions)
    entity.clicks = this.parseNumber(insights.clicks)
    entity.reach = this.parseNumber(insights.reach)
    entity.frequency = this.parseNumber(insights.frequency)
    entity.ctr = this.parseNumber(insights.ctr)
    entity.cpc = this.parseNumber(insights.cpc)
    entity.cpm = this.parseNumber(insights.cpm)
    entity.cpp = this.parseNumber(insights.cpp)
    
    // Advanced metrics
    entity.unique_clicks = this.parseNumber(insights.unique_clicks)
    entity.cost_per_unique_click = this.parseNumber(insights.cost_per_unique_click)
    entity.social_spend = this.parseNumber(insights.social_spend)
    entity.inline_link_clicks = this.parseNumber(insights.inline_link_clicks)
    entity.cost_per_inline_link_click = this.parseNumber(insights.cost_per_inline_link_click)
    entity.unique_inline_link_clicks = this.parseNumber(insights.unique_inline_link_clicks)
    entity.cost_per_unique_inline_link_click = this.parseNumber(insights.cost_per_unique_inline_link_click)
    
    // Video metrics
    entity.video_15_sec_watched_actions = insights.video_15_sec_watched_actions || []
    entity.video_30_sec_watched_actions = insights.video_30_sec_watched_actions || []
    entity.video_p25_watched_actions = insights.video_p25_watched_actions || []
    entity.video_p50_watched_actions = insights.video_p50_watched_actions || []
    entity.video_p75_watched_actions = insights.video_p75_watched_actions || []
    entity.video_p100_watched_actions = insights.video_p100_watched_actions || []
    entity.video_play_actions = insights.video_play_actions || []
    entity.video_thruplay_watched_actions = insights.video_thruplay_watched_actions || []
    
    // Actions and conversions
    entity.actions = insights.actions || []
    entity.action_values = insights.action_values || []
    entity.outbound_clicks = insights.outbound_clicks || []
    entity.cost_per_outbound_click = insights.cost_per_outbound_click || []
    entity.unique_outbound_clicks = insights.unique_outbound_clicks || []
    
    // Quality rankings
    entity.quality_ranking = insights.quality_ranking
    entity.engagement_rate_ranking = insights.engagement_rate_ranking
    entity.conversion_rate_ranking = insights.conversion_rate_ranking
    
    // ROAS metrics
    entity.mobile_app_purchase_roas = insights.mobile_app_purchase_roas || []
    entity.website_purchase_roas = insights.website_purchase_roas || []
    entity.purchase_roas = insights.purchase_roas || []
    
    // Calculate custom metrics
    this.calculateCustomMetrics(entity, insights)
  }

  private parseNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0
    const parsed = parseFloat(String(value))
    return isNaN(parsed) ? 0 : parsed
  }

  private calculateCustomMetrics(entity: any, insights: any): void {
    // Calculate conversions and revenue from actions
    let conversions = 0
    let revenue = 0

    if (insights.actions) {
      insights.actions.forEach((action: any) => {
        if (['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'].includes(action.action_type)) {
          conversions += this.parseNumber(action.value)
        }
      })
    }

    if (insights.action_values) {
      insights.action_values.forEach((actionValue: any) => {
        if (['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'].includes(actionValue.action_type)) {
          revenue += this.parseNumber(actionValue.value)
        }
      })
    }

    entity.conversions = conversions
    entity.cost_per_conversion = conversions > 0 ? entity.spend / conversions : 0
    entity.purchase_roas = entity.spend > 0 ? revenue / entity.spend : 0
    entity.revenue = revenue
  }

  private processDemographicData(data: any[]): DemographicBreakdown[] {
    return data.map(item => {
      const processed: DemographicBreakdown = {
        age: item.age,
        gender: item.gender,
        country: item.country,
        region: item.region,
        dma: item.dma,
        hourly_stats_aggregated_by_advertiser_time_zone: item.hourly_stats_aggregated_by_advertiser_time_zone,
        hourly_stats_aggregated_by_audience_time_zone: item.hourly_stats_aggregated_by_audience_time_zone,
        place_page_id: item.place_page_id,
        publisher_platform: item.publisher_platform,
        platform_position: item.platform_position,
        device_platform: item.device_platform,
        product_id: item.product_id,
        spend: this.parseNumber(item.spend),
        impressions: this.parseNumber(item.impressions),
        clicks: this.parseNumber(item.clicks),
        reach: this.parseNumber(item.reach),
        frequency: this.parseNumber(item.frequency),
        ctr: this.parseNumber(item.ctr),
        cpc: this.parseNumber(item.cpc),
        cpm: this.parseNumber(item.cpm),
        cpp: this.parseNumber(item.cpp),
        actions: item.actions || [],
        action_values: item.action_values || [],
        conversions: 0,
        cost_per_conversion: 0,
        purchase_roas: 0,
        revenue: 0
      }

      this.calculateCustomMetrics(processed, item)
      return processed
    })
  }

  private processHourlyData(data: any[]): HourlyBreakdown[] {
    return data.map(item => {
      const processed: HourlyBreakdown = {
        hourly_stats_aggregated_by_advertiser_time_zone: item.hourly_stats_aggregated_by_advertiser_time_zone || item.date_start,
        hourly_stats_aggregated_by_audience_time_zone: item.hourly_stats_aggregated_by_audience_time_zone,
        spend: this.parseNumber(item.spend),
        impressions: this.parseNumber(item.impressions),
        clicks: this.parseNumber(item.clicks),
        reach: this.parseNumber(item.reach),
        frequency: this.parseNumber(item.frequency),
        ctr: this.parseNumber(item.ctr),
        cpc: this.parseNumber(item.cpc),
        cpm: this.parseNumber(item.cpm),
        actions: item.actions || [],
        action_values: item.action_values || [],
        conversions: 0,
        cost_per_conversion: 0,
        purchase_roas: 0,
        revenue: 0
      }

      this.calculateCustomMetrics(processed, item)
      return processed
    })
  }

  private processDeviceData(data: any[]): DeviceBreakdown[] {
    return data.map(item => {
      const processed: DeviceBreakdown = {
        device_platform: item.device_platform || 'unknown',
        publisher_platform: item.publisher_platform,
        platform_position: item.platform_position,
        spend: this.parseNumber(item.spend),
        impressions: this.parseNumber(item.impressions),
        clicks: this.parseNumber(item.clicks),
        reach: this.parseNumber(item.reach),
        frequency: this.parseNumber(item.frequency),
        ctr: this.parseNumber(item.ctr),
        cpc: this.parseNumber(item.cpc),
        cpm: this.parseNumber(item.cpm),
        actions: item.actions || [],
        action_values: item.action_values || [],
        conversions: 0,
        cost_per_conversion: 0,
        purchase_roas: 0,
        revenue: 0
      }

      this.calculateCustomMetrics(processed, item)
      return processed
    })
  }

  private processPlacementData(data: any[]): PlacementBreakdown[] {
    return data.map(item => {
      const processed: PlacementBreakdown = {
        publisher_platform: item.publisher_platform || 'unknown',
        platform_position: item.platform_position || 'unknown',
        spend: this.parseNumber(item.spend),
        impressions: this.parseNumber(item.impressions),
        clicks: this.parseNumber(item.clicks),
        reach: this.parseNumber(item.reach),
        frequency: this.parseNumber(item.frequency),
        ctr: this.parseNumber(item.ctr),
        cpc: this.parseNumber(item.cpc),
        cpm: this.parseNumber(item.cpm),
        actions: item.actions || [],
        action_values: item.action_values || [],
        conversions: 0,
        cost_per_conversion: 0,
        purchase_roas: 0,
        revenue: 0
      }

      this.calculateCustomMetrics(processed, item)
      return processed
    })
  }

  private processGeographicData(data: any[]): GeographicBreakdown[] {
    return data.map(item => {
      const processed: GeographicBreakdown = {
        country: item.country,
        region: item.region,
        dma: item.dma,
        spend: this.parseNumber(item.spend),
        impressions: this.parseNumber(item.impressions),
        clicks: this.parseNumber(item.clicks),
        reach: this.parseNumber(item.reach),
        frequency: this.parseNumber(item.frequency),
        ctr: this.parseNumber(item.ctr),
        cpc: this.parseNumber(item.cpc),
        cpm: this.parseNumber(item.cpm),
        actions: item.actions || [],
        action_values: item.action_values || [],
        conversions: 0,
        cost_per_conversion: 0,
        purchase_roas: 0,
        revenue: 0
      }

      this.calculateCustomMetrics(processed, item)
      return processed
    })
  }

  private processAgeGenderData(data: any[]): AgeGenderBreakdown[] {
    return data.map(item => {
      const processed: AgeGenderBreakdown = {
        age: item.age || 'unknown',
        gender: item.gender || 'unknown',
        spend: this.parseNumber(item.spend),
        impressions: this.parseNumber(item.impressions),
        clicks: this.parseNumber(item.clicks),
        reach: this.parseNumber(item.reach),
        frequency: this.parseNumber(item.frequency),
        ctr: this.parseNumber(item.ctr),
        cpc: this.parseNumber(item.cpc),
        cpm: this.parseNumber(item.cpm),
        actions: item.actions || [],
        action_values: item.action_values || [],
        conversions: 0,
        cost_per_conversion: 0,
        purchase_roas: 0,
        revenue: 0
      }

      this.calculateCustomMetrics(processed, item)
      return processed
    })
  }

  // Legacy compatibility methods
  async getCampaigns(datePreset = 'last_30d'): Promise<any[]> {
    const comprehensiveCampaigns = await this.getCampaignsComprehensive(datePreset)
    return comprehensiveCampaigns.map(campaign => ({
      ...campaign,
      insights: campaign.spend !== undefined ? {
        data: [{
          spend: campaign.spend,
          impressions: campaign.impressions,
          clicks: campaign.clicks,
          reach: campaign.reach,
          frequency: campaign.frequency,
          ctr: campaign.ctr,
          cpc: campaign.cpc,
          cpm: campaign.cpm,
          actions: campaign.actions,
          action_values: campaign.action_values,
          conversions: campaign.conversions,
          cost_per_conversion: campaign.cost_per_conversion
        }]
      } : undefined
    }))
  }

  async getAdSets(campaignId: string, datePreset = 'last_30d'): Promise<any[]> {
    const comprehensiveAdSets = await this.getAdSetsComprehensive(campaignId, datePreset)
    return comprehensiveAdSets.map(adset => ({
      ...adset,
      insights: adset.spend !== undefined ? {
        data: [{
          spend: adset.spend,
          impressions: adset.impressions,
          clicks: adset.clicks,
          actions: adset.actions,
          action_values: adset.action_values
        }]
      } : undefined
    }))
  }

  // Enhanced legacy compatibility
  async getCampaignsEnhanced(datePreset = 'last_30d'): Promise<any[]> {
    return this.getCampaignsComprehensive(datePreset)
  }

  async getAdSetsEnhanced(campaignId?: string, datePreset = 'last_30d'): Promise<any[]> {
    return this.getAdSetsComprehensive(campaignId, datePreset)
  }

  async getAdsForAdSet(adSetId: string, datePreset = 'last_30d'): Promise<any[]> {
    return this.getAdsComprehensive(adSetId, datePreset)
  }

  async getDemographicBreakdown(
    entityId: string, 
    entityType: 'campaign' | 'adset' | 'ad' = 'campaign',
    datePreset = 'last_30d'
  ): Promise<any[]> {
    return this.getDemographicBreakdownComprehensive(entityId, entityType, ['age', 'gender'], datePreset)
  }

  async getHourlyBreakdown(
    entityId: string,
    entityType: 'campaign' | 'adset' | 'ad' = 'campaign',
    dateRange?: { since: string, until: string }
  ): Promise<any[]> {
    return this.getHourlyBreakdownComprehensive(entityId, entityType, 'advertiser', dateRange)
  }

  async getDeviceBreakdown(
    entityId: string,
    entityType: 'campaign' | 'adset' | 'ad' = 'campaign',
    datePreset = 'last_30d'
  ): Promise<any[]> {
    return this.getDeviceBreakdownComprehensive(entityId, entityType, datePreset)
  }

  async getPlacementBreakdown(
    entityId: string,
    entityType: 'campaign' | 'adset' | 'ad' = 'campaign',
    datePreset = 'last_30d'
  ): Promise<any[]> {
    return this.getPlacementBreakdownComprehensive(entityId, entityType, datePreset)
  }
}

// Export helper functions for processing insights
export function processComprehensiveInsights(insights: any): any {
  if (!insights) return null

  const spend = parseFloat(insights.spend || '0')
  const impressions = parseInt(insights.impressions || '0')
  const clicks = parseInt(insights.clicks || '0')
  const reach = parseInt(insights.reach || '0')
  const frequency = parseFloat(insights.frequency || '0')
  const ctr = parseFloat(insights.ctr || '0')
  const cpc = parseFloat(insights.cpc || '0')
  const cpm = parseFloat(insights.cpm || '0')
  const cpp = parseFloat(insights.cpp || '0')

  let conversions = 0
  let revenue = 0

  if (insights.actions) {
    insights.actions.forEach((action: any) => {
      if (['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'].includes(action.action_type)) {
        conversions += parseInt(action.value || '0')
      }
    })
  }

  if (insights.action_values) {
    insights.action_values.forEach((actionValue: any) => {
      if (['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'].includes(actionValue.action_type)) {
        revenue += parseFloat(actionValue.value || '0')
      }
    })
  }

  const roas = spend > 0 ? revenue / spend : 0
  const cpa = conversions > 0 ? spend / conversions : 0

  return {
    // Basic metrics
    spend,
    impressions,
    clicks,
    reach,
    frequency,
    ctr,
    cpc,
    cpm,
    cpp,
    conversions,
    revenue,
    roas,
    cpa,
    
    // Advanced metrics
    unique_clicks: parseInt(insights.unique_clicks || '0'),
    cost_per_unique_click: parseFloat(insights.cost_per_unique_click || '0'),
    social_spend: parseFloat(insights.social_spend || '0'),
    inline_link_clicks: parseInt(insights.inline_link_clicks || '0'),
    cost_per_inline_link_click: parseFloat(insights.cost_per_inline_link_click || '0'),
    unique_inline_link_clicks: parseInt(insights.unique_inline_link_clicks || '0'),
    cost_per_unique_inline_link_click: parseFloat(insights.cost_per_unique_inline_link_click || '0'),
    
    // Video metrics (extracted from arrays)
    video_plays: insights.video_play_actions?.reduce((sum: number, action: any) => sum + parseInt(action.value || '0'), 0) || 0,
    video_p25_watched_actions: insights.video_p25_watched_actions?.reduce((sum: number, action: any) => sum + parseInt(action.value || '0'), 0) || 0,
    video_p50_watched_actions: insights.video_p50_watched_actions?.reduce((sum: number, action: any) => sum + parseInt(action.value || '0'), 0) || 0,
    video_p75_watched_actions: insights.video_p75_watched_actions?.reduce((sum: number, action: any) => sum + parseInt(action.value || '0'), 0) || 0,
    video_p100_watched_actions: insights.video_p100_watched_actions?.reduce((sum: number, action: any) => sum + parseInt(action.value || '0'), 0) || 0,
    video_15_sec_watched_actions: insights.video_15_sec_watched_actions?.reduce((sum: number, action: any) => sum + parseInt(action.value || '0'), 0) || 0,
    video_30_sec_watched_actions: insights.video_30_sec_watched_actions?.reduce((sum: number, action: any) => sum + parseInt(action.value || '0'), 0) || 0,
    video_thruplay_watched_actions: insights.video_thruplay_watched_actions?.reduce((sum: number, action: any) => sum + parseInt(action.value || '0'), 0) || 0,
    
    // Quality rankings
    quality_ranking: insights.quality_ranking,
    engagement_rate_ranking: insights.engagement_rate_ranking,
    conversion_rate_ranking: insights.conversion_rate_ranking,
    
    // Raw arrays for detailed analysis
    actions: insights.actions || [],
    action_values: insights.action_values || [],
    outbound_clicks: insights.outbound_clicks || [],
    cost_per_outbound_click: insights.cost_per_outbound_click || [],
    unique_outbound_clicks: insights.unique_outbound_clicks || [],
    mobile_app_purchase_roas: insights.mobile_app_purchase_roas || [],
    website_purchase_roas: insights.website_purchase_roas || [],
    purchase_roas: insights.purchase_roas || []
  }
}

// Export the legacy client name for backward compatibility
export const EnhancedMetaAPIClient = ComprehensiveMetaAPIClient

// Export all interfaces and types for external use
export type {
  ComprehensiveCampaign as EnhancedCampaign,
  ComprehensiveAdSet as EnhancedAdSet,
  ComprehensiveAd as EnhancedAd
}