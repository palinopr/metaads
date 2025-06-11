// Data Validator for Meta Ads API responses
import { z } from 'zod'

// Common Meta API field schemas
export const MetaActionSchema = z.object({
  action_type: z.string(),
  value: z.string(),
  '1d_click': z.string().optional(),
  '7d_click': z.string().optional(),
  '28d_click': z.string().optional(),
  '1d_view': z.string().optional(),
  '7d_view': z.string().optional(),
  '28d_view': z.string().optional()
})

export const MetaInsightsSchema = z.object({
  spend: z.string().optional(),
  impressions: z.string().optional(),
  clicks: z.string().optional(),
  ctr: z.string().optional(),
  cpc: z.string().optional(),
  cpm: z.string().optional(),
  cpp: z.string().optional(),
  actions: z.array(MetaActionSchema).optional(),
  action_values: z.array(MetaActionSchema).optional(),
  conversions: z.string().optional(),
  cost_per_conversion: z.string().optional(),
  frequency: z.string().optional(),
  reach: z.string().optional(),
  date_start: z.string().optional(),
  date_stop: z.string().optional()
})

export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED']),
  effective_status: z.enum(['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED', 'IN_PROCESS', 'WITH_ISSUES']).optional(),
  objective: z.string().optional(),
  created_time: z.string(),
  updated_time: z.string().optional(),
  daily_budget: z.string().optional(),
  lifetime_budget: z.string().optional(),
  budget_remaining: z.string().optional(),
  insights: z.object({
    data: z.array(MetaInsightsSchema)
  }).optional()
})

export const AdSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED']),
  campaign_id: z.string(),
  daily_budget: z.string().optional(),
  lifetime_budget: z.string().optional(),
  targeting: z.any().optional(),
  insights: z.object({
    data: z.array(MetaInsightsSchema)
  }).optional()
})

export const AdAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  account_status: z.number().optional(),
  currency: z.string(),
  timezone_name: z.string(),
  spend_cap: z.string().optional(),
  amount_spent: z.string().optional()
})

// Validation result type
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: Array<{
    path: string
    message: string
  }>
  warnings?: Array<{
    path: string
    message: string
  }>
}

// Data sanitization utilities
export class DataSanitizer {
  // Sanitize numeric string values
  static sanitizeNumeric(value: string | undefined, defaultValue: number = 0): number {
    if (!value) return defaultValue
    const parsed = parseFloat(value)
    return isNaN(parsed) ? defaultValue : parsed
  }

  // Sanitize currency values (convert cents to dollars)
  static sanitizeCurrency(value: string | undefined, inCents: boolean = true): number {
    const numeric = this.sanitizeNumeric(value, 0)
    return inCents ? numeric / 100 : numeric
  }

  // Sanitize percentage values
  static sanitizePercentage(value: string | undefined): number {
    return this.sanitizeNumeric(value, 0)
  }

  // Sanitize date strings
  static sanitizeDate(value: string | undefined): string | null {
    if (!value) return null
    try {
      const date = new Date(value)
      return isNaN(date.getTime()) ? null : date.toISOString()
    } catch {
      return null
    }
  }

  // Sanitize and normalize campaign status
  static sanitizeStatus(status: string | undefined, effectiveStatus?: string): string {
    const normalizedStatus = effectiveStatus || status || 'UNKNOWN'
    return normalizedStatus.toUpperCase()
  }

  // Extract action values by type
  static extractActionValue(
    actions: z.infer<typeof MetaActionSchema>[] | undefined,
    actionTypes: string[]
  ): number {
    if (!actions) return 0
    
    return actions
      .filter(action => actionTypes.includes(action.action_type))
      .reduce((sum, action) => sum + this.sanitizeNumeric(action.value), 0)
  }
}

// Data transformer for consistent output
export class DataTransformer {
  // Transform raw insights data to normalized format
  static transformInsights(insights: z.infer<typeof MetaInsightsSchema>) {
    const spend = DataSanitizer.sanitizeNumeric(insights.spend)
    const impressions = DataSanitizer.sanitizeNumeric(insights.impressions)
    const clicks = DataSanitizer.sanitizeNumeric(insights.clicks)
    
    // Calculate conversions and revenue
    const purchaseActionTypes = [
      'purchase',
      'omni_purchase',
      'offsite_conversion.fb_pixel_purchase'
    ]
    
    const conversions = DataSanitizer.extractActionValue(
      insights.actions,
      purchaseActionTypes
    )
    
    const revenue = DataSanitizer.extractActionValue(
      insights.action_values,
      purchaseActionTypes
    )
    
    // Calculate derived metrics
    const ctr = DataSanitizer.sanitizePercentage(insights.ctr)
    const cpc = DataSanitizer.sanitizeNumeric(insights.cpc)
    const roas = spend > 0 ? revenue / spend : 0
    const cpa = conversions > 0 ? spend / conversions : 0
    
    return {
      spend,
      impressions,
      clicks,
      conversions,
      revenue,
      ctr,
      cpc,
      roas,
      cpa,
      frequency: DataSanitizer.sanitizeNumeric(insights.frequency),
      reach: DataSanitizer.sanitizeNumeric(insights.reach),
      dateStart: DataSanitizer.sanitizeDate(insights.date_start),
      dateStop: DataSanitizer.sanitizeDate(insights.date_stop)
    }
  }

  // Transform campaign data
  static transformCampaign(campaign: z.infer<typeof CampaignSchema>) {
    const insights = campaign.insights?.data?.[0]
    const transformedInsights = insights ? this.transformInsights(insights) : null
    
    return {
      id: campaign.id,
      name: campaign.name,
      status: DataSanitizer.sanitizeStatus(campaign.status, campaign.effective_status),
      objective: campaign.objective || 'UNKNOWN',
      createdTime: DataSanitizer.sanitizeDate(campaign.created_time),
      updatedTime: DataSanitizer.sanitizeDate(campaign.updated_time),
      dailyBudget: DataSanitizer.sanitizeCurrency(campaign.daily_budget),
      lifetimeBudget: DataSanitizer.sanitizeCurrency(campaign.lifetime_budget),
      budgetRemaining: DataSanitizer.sanitizeCurrency(campaign.budget_remaining),
      metrics: transformedInsights || {
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ctr: 0,
        cpc: 0,
        roas: 0,
        cpa: 0,
        frequency: 0,
        reach: 0,
        dateStart: null,
        dateStop: null
      }
    }
  }
}

// Main validator class
export class DataValidator {
  // Validate and transform campaign data
  static validateCampaign(data: unknown): ValidationResult<ReturnType<typeof DataTransformer.transformCampaign>> {
    try {
      const validated = CampaignSchema.parse(data)
      const transformed = DataTransformer.transformCampaign(validated)
      
      const warnings: Array<{ path: string; message: string }> = []
      
      // Check for potential data quality issues
      if (!validated.insights?.data?.length) {
        warnings.push({
          path: 'insights',
          message: 'No insights data available for this campaign'
        })
      }
      
      if (!validated.effective_status) {
        warnings.push({
          path: 'effective_status',
          message: 'Effective status missing, using regular status'
        })
      }
      
      return {
        success: true,
        data: transformed,
        warnings: warnings.length > 0 ? warnings : undefined
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        }
      }
      
      return {
        success: false,
        errors: [{
          path: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown validation error'
        }]
      }
    }
  }

  // Validate multiple campaigns
  static validateCampaigns(data: unknown[]): {
    valid: Array<ReturnType<typeof DataTransformer.transformCampaign>>
    invalid: Array<{ data: unknown; errors: ValidationResult<any>['errors'] }>
  } {
    const valid: Array<ReturnType<typeof DataTransformer.transformCampaign>> = []
    const invalid: Array<{ data: unknown; errors: ValidationResult<any>['errors'] }> = []
    
    for (const item of data) {
      const result = this.validateCampaign(item)
      if (result.success && result.data) {
        valid.push(result.data)
      } else {
        invalid.push({ data: item, errors: result.errors })
      }
    }
    
    return { valid, invalid }
  }

  // Validate ad account
  static validateAdAccount(data: unknown): ValidationResult<z.infer<typeof AdAccountSchema>> {
    try {
      const validated = AdAccountSchema.parse(data)
      return { success: true, data: validated }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        }
      }
      
      return {
        success: false,
        errors: [{
          path: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown validation error'
        }]
      }
    }
  }

  // Validate API response structure
  static validateApiResponse(response: unknown): ValidationResult<any> {
    if (!response || typeof response !== 'object') {
      return {
        success: false,
        errors: [{
          path: 'response',
          message: 'Invalid response format'
        }]
      }
    }
    
    const res = response as any
    
    // Check for error response
    if (res.error) {
      return {
        success: false,
        errors: [{
          path: 'error',
          message: res.error.message || 'API error'
        }]
      }
    }
    
    // Check for data array
    if ('data' in res && !Array.isArray(res.data)) {
      return {
        success: false,
        errors: [{
          path: 'data',
          message: 'Expected data to be an array'
        }]
      }
    }
    
    return { success: true, data: res }
  }
}

// Export schemas for external use
export const Schemas = {
  MetaAction: MetaActionSchema,
  MetaInsights: MetaInsightsSchema,
  Campaign: CampaignSchema,
  AdSet: AdSetSchema,
  AdAccount: AdAccountSchema
}