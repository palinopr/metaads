// Enhanced Meta API Client with Historical Data Support
import { z } from 'zod'
import { MetaAPIClient, processInsights } from './meta-api-client'

// Re-export everything from base client
export * from './meta-api-client'

export interface CampaignHistoricalData {
  date: string
  spend: number
  revenue: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  roas: number
  cpa: number
}

export interface CampaignBudgetInfo {
  dailyBudget?: number
  lifetimeBudget?: number
  totalSpent: number
  remainingBudget: number
  burnRate: number
  daysRemaining: number
  projectedEndDate: Date | null
}

export interface CampaignMetrics {
  bestDay: CampaignHistoricalData | null
  worstDay: CampaignHistoricalData | null
  avgDailySpend: number
  avgDailyRevenue: number
  avgROAS: number
  trend: 'improving' | 'declining' | 'stable'
  weekOverWeekGrowth: number
}

export class MetaAPIEnhanced extends MetaAPIClient {
  // Get complete campaign history from creation
  async getCampaignCompleteHistory(campaignId: string): Promise<{
    campaign: any
    history: CampaignHistoricalData[]
    budget: CampaignBudgetInfo
    metrics: CampaignMetrics
  }> {
    // First get campaign details including created_time
    const campaignUrl = this.buildUrl(campaignId, {
      fields: 'id,name,status,objective,created_time,daily_budget,lifetime_budget,updated_time'
    })
    
    const campaignData = await this.fetchWithRetry(campaignUrl)
    
    // Calculate date range from creation to today
    const createdDate = new Date(campaignData.created_time)
    const today = new Date()
    const daysSinceCreation = Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Fetch historical data with daily breakdown
    const insightsUrl = this.buildUrl(`${campaignId}/insights`, {
      fields: 'spend,impressions,clicks,ctr,cpc,actions,action_values,conversions,cost_per_conversion',
      time_increment: '1', // Daily breakdown
      time_range: JSON.stringify({
        since: createdDate.toISOString().split('T')[0],
        until: today.toISOString().split('T')[0]
      }),
      limit: 1000 // Ensure we get all days
    })
    
    const insightsData = await this.fetchWithRetry(insightsUrl)
    
    // Process each day's data
    const history: CampaignHistoricalData[] = (insightsData.data || []).map((day: any) => {
      const processed = processInsights(day)
      return {
        date: day.date_start,
        spend: processed.spend,
        revenue: processed.revenue,
        conversions: processed.conversions,
        impressions: processed.impressions,
        clicks: processed.clicks,
        ctr: processed.ctr,
        cpc: processed.cpc,
        roas: processed.roas,
        cpa: processed.cpa
      }
    })
    
    // Sort by date
    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Calculate budget info
    const totalSpent = history.reduce((sum, day) => sum + day.spend, 0)
    const dailyBudget = parseFloat(campaignData.daily_budget || '0') / 100 // Convert from cents
    const lifetimeBudget = parseFloat(campaignData.lifetime_budget || '0') / 100
    
    const budget: CampaignBudgetInfo = {
      dailyBudget: dailyBudget || undefined,
      lifetimeBudget: lifetimeBudget || undefined,
      totalSpent,
      remainingBudget: lifetimeBudget ? lifetimeBudget - totalSpent : Infinity,
      burnRate: history.length > 0 ? totalSpent / history.length : 0,
      daysRemaining: 0,
      projectedEndDate: null
    }
    
    // Calculate days remaining based on burn rate
    if (budget.burnRate > 0 && budget.remainingBudget !== Infinity) {
      budget.daysRemaining = Math.ceil(budget.remainingBudget / budget.burnRate)
      budget.projectedEndDate = new Date()
      budget.projectedEndDate.setDate(budget.projectedEndDate.getDate() + budget.daysRemaining)
    }
    
    // Calculate metrics
    const metrics = this.calculateCampaignMetrics(history)
    
    return {
      campaign: campaignData,
      history,
      budget,
      metrics
    }
  }
  
  // Calculate performance metrics
  private calculateCampaignMetrics(history: CampaignHistoricalData[]): CampaignMetrics {
    if (history.length === 0) {
      return {
        bestDay: null,
        worstDay: null,
        avgDailySpend: 0,
        avgDailyRevenue: 0,
        avgROAS: 0,
        trend: 'stable',
        weekOverWeekGrowth: 0
      }
    }
    
    // Find best and worst days by ROAS
    const sortedByROAS = [...history].sort((a, b) => b.roas - a.roas)
    const bestDay = sortedByROAS[0]
    const worstDay = sortedByROAS[sortedByROAS.length - 1]
    
    // Calculate averages
    const totalSpend = history.reduce((sum, day) => sum + day.spend, 0)
    const totalRevenue = history.reduce((sum, day) => sum + day.revenue, 0)
    const avgDailySpend = totalSpend / history.length
    const avgDailyRevenue = totalRevenue / history.length
    const avgROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
    
    // Calculate trend (last 7 days vs previous 7 days)
    let trend: 'improving' | 'declining' | 'stable' = 'stable'
    let weekOverWeekGrowth = 0
    
    if (history.length >= 14) {
      const last7Days = history.slice(-7)
      const previous7Days = history.slice(-14, -7)
      
      const last7ROAS = this.calculateAvgROAS(last7Days)
      const previous7ROAS = this.calculateAvgROAS(previous7Days)
      
      if (previous7ROAS > 0) {
        weekOverWeekGrowth = ((last7ROAS - previous7ROAS) / previous7ROAS) * 100
        
        if (weekOverWeekGrowth > 10) trend = 'improving'
        else if (weekOverWeekGrowth < -10) trend = 'declining'
      }
    }
    
    return {
      bestDay,
      worstDay,
      avgDailySpend,
      avgDailyRevenue,
      avgROAS,
      trend,
      weekOverWeekGrowth
    }
  }
  
  private calculateAvgROAS(days: CampaignHistoricalData[]): number {
    const totalSpend = days.reduce((sum, day) => sum + day.spend, 0)
    const totalRevenue = days.reduce((sum, day) => sum + day.revenue, 0)
    return totalSpend > 0 ? totalRevenue / totalSpend : 0
  }
  
  // Get performance comparison across campaigns
  async getCampaignComparison(campaignIds: string[]): Promise<{
    campaigns: Array<{
      id: string
      name: string
      totalSpend: number
      totalRevenue: number
      avgROAS: number
      performance: 'top' | 'average' | 'underperforming'
    }>
    insights: {
      topPerformer: string
      worstPerformer: string
      totalPortfolioROAS: number
      recommendation: string
    }
  }> {
    const campaignData = await Promise.all(
      campaignIds.map(async (id) => {
        const { campaign, history } = await this.getCampaignCompleteHistory(id)
        const totalSpend = history.reduce((sum, day) => sum + day.spend, 0)
        const totalRevenue = history.reduce((sum, day) => sum + day.revenue, 0)
        const avgROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
        
        return {
          id,
          name: campaign.name,
          totalSpend,
          totalRevenue,
          avgROAS,
          performance: 'average' as 'top' | 'average' | 'underperforming'
        }
      })
    )
    
    // Sort by ROAS
    campaignData.sort((a, b) => b.avgROAS - a.avgROAS)
    
    // Classify performance
    const avgPortfolioROAS = campaignData.reduce((sum, c) => sum + c.avgROAS, 0) / campaignData.length
    
    campaignData.forEach(campaign => {
      if (campaign.avgROAS > avgPortfolioROAS * 1.2) {
        campaign.performance = 'top'
      } else if (campaign.avgROAS < avgPortfolioROAS * 0.8) {
        campaign.performance = 'underperforming'
      }
    })
    
    // Generate insights
    const topPerformer = campaignData[0]
    const worstPerformer = campaignData[campaignData.length - 1]
    const totalSpend = campaignData.reduce((sum, c) => sum + c.totalSpend, 0)
    const totalRevenue = campaignData.reduce((sum, c) => sum + c.totalRevenue, 0)
    const totalPortfolioROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
    
    let recommendation = ''
    if (totalPortfolioROAS < 1) {
      recommendation = 'Your portfolio is not profitable. Consider pausing underperforming campaigns and reallocating budget to top performers.'
    } else if (totalPortfolioROAS < 2) {
      recommendation = 'Your portfolio is profitable but has room for improvement. Focus on scaling top performers and optimizing underperformers.'
    } else {
      recommendation = 'Great performance! Consider increasing budgets on top campaigns to scale profitability.'
    }
    
    return {
      campaigns: campaignData,
      insights: {
        topPerformer: topPerformer.name,
        worstPerformer: worstPerformer.name,
        totalPortfolioROAS,
        recommendation
      }
    }
  }
}