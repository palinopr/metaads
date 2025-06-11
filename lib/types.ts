// Shared Types for Meta Ads Dashboard

export interface Campaign {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  objective: string
  budget_remaining?: number
  daily_budget?: number
  lifetime_budget?: number
  start_time: string
  stop_time?: string
  created_time: string
  updated_time: string
  insights?: CampaignInsights
  adsets?: AdSet[]
  account_id: string
}

export interface AdSet {
  id: string
  name: string
  campaign_id: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  daily_budget?: number
  lifetime_budget?: number
  start_time: string
  end_time?: string
  targeting?: Targeting
  insights?: AdSetInsights
  ads?: Ad[]
}

export interface Ad {
  id: string
  name: string
  adset_id: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  creative?: Creative
  insights?: AdInsights
}

export interface Creative {
  id: string
  name: string
  title?: string
  body?: string
  image_url?: string
  video_url?: string
  call_to_action?: string
  link_url?: string
}

export interface Targeting {
  geo_locations?: {
    countries?: string[]
    regions?: string[]
    cities?: string[]
  }
  age_min?: number
  age_max?: number
  genders?: number[]
  interests?: string[]
  behaviors?: string[]
  custom_audiences?: string[]
}

export interface CampaignInsights {
  impressions: number
  clicks: number
  spend: number
  reach: number
  frequency: number
  ctr: number
  cpc: number
  cpm: number
  cpp: number
  conversions?: number
  conversion_rate?: number
  revenue?: number
  roas?: number
  actions?: Action[]
  date_start?: string
  date_stop?: string
}

export interface AdSetInsights extends CampaignInsights {
  adset_id: string
  adset_name: string
}

export interface AdInsights extends CampaignInsights {
  ad_id: string
  ad_name: string
}

export interface Action {
  action_type: string
  value: number
}

export interface TimeSeriesData {
  date: string
  value: number
  [key: string]: any
}

export interface PredictionResult {
  predictions: TimeSeriesData[]
  confidence: number
  insights: {
    risks: string[]
    opportunities: string[]
    recommendations: string[]
  }
  metadata?: {
    model: string
    timestamp: string
    parameters: any
  }
}

export interface AnomalyResult {
  isAnomaly: boolean
  severity: 'low' | 'medium' | 'high'
  metric: string
  value: number
  expectedRange: [number, number]
  timestamp: string
  explanation: string
  recommendations?: string[]
}

export interface OptimizationRecommendation {
  id: string
  type: 'budget' | 'targeting' | 'creative' | 'bidding' | 'schedule'
  priority: 'low' | 'medium' | 'high'
  impact: {
    metric: string
    expectedChange: number
    confidence: number
  }
  action: string
  reasoning: string
  implementation?: {
    automatic: boolean
    parameters: any
  }
}

export interface ABTestResult {
  variant_a: {
    id: string
    name: string
    metrics: CampaignInsights
    sample_size: number
  }
  variant_b: {
    id: string
    name: string
    metrics: CampaignInsights
    sample_size: number
  }
  winner?: 'a' | 'b' | 'no_difference'
  confidence_level: number
  statistical_significance: boolean
  recommendations: string[]
}

export interface CompetitorInsight {
  competitor: string
  metric: string
  their_value: number
  your_value: number
  difference_percentage: number
  trend: 'improving' | 'declining' | 'stable'
  recommendations: string[]
}

export interface SentimentAnalysis {
  text: string
  sentiment: 'positive' | 'negative' | 'neutral'
  score: number
  emotions: {
    joy: number
    anger: number
    fear: number
    sadness: number
    surprise: number
  }
  suggestions?: string[]
}