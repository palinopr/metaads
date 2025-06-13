import { NextResponse } from "next/server"
import { safeToFixed } from "@/lib/safe-utils"
import { formatAccessToken } from "@/lib/meta-api-client"
import { railwayFetch } from "@/lib/railway-fetch-fix"

interface HourlyInsight {
  spend?: string
  impressions?: string
  clicks?: string
  ctr?: string
  actions?: { action_type: string; value: string }[]
  action_values?: { action_type: string; value: string }[]
  date_start: string // ISO 8601 format, e.g., "2023-10-26"
  date_stop: string
  hourly_stats_aggregated_by_advertiser_time_zone?: string // "HH:MM:SS - HH:MM:SS"
}

interface AggregatedHourData {
  dayOfWeek: string
  hour: number
  spend: number
  revenue: number
  conversions: number
  impressions: number
  clicks: number
  count: number // Number of data points aggregated for this slot
}

export async function POST(request: Request) {
  try {
    const { campaignId, accessToken, datePreset } = await request.json()

    if (!campaignId || !accessToken || !datePreset) {
      return NextResponse.json(
        { error: "Missing required parameters: campaignId, accessToken, or datePreset" },
        { status: 400 },
      )
    }

    // Clean the access token to remove Bearer prefix
    const cleanToken = accessToken.replace(/^Bearer\s+/i, '')

    // For lifetime, get campaign created_time
    let campaignStartDate: Date | null = null
    if (datePreset === 'lifetime') {
      try {
        const campaignUrl = `https://graph.facebook.com/v19.0/${campaignId}?fields=created_time&access_token=${cleanToken}`
        const campaignRes = await railwayFetch(campaignUrl)
        const campaignData = await campaignRes.json()
        if (campaignData.created_time) {
          campaignStartDate = new Date(campaignData.created_time)
          console.log('Campaign created on:', campaignData.created_time)
        }
      } catch (e) {
        console.warn('Could not fetch campaign creation date')
      }
    }

    const endDate = new Date()
    const startDate = new Date()

    switch (datePreset) {
      case "today":
        // Handled by hourlyData in campaign_details, but if called directly:
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case "yesterday":
        startDate.setDate(endDate.getDate() - 1)
        startDate.setHours(0, 0, 0, 0)
        endDate.setDate(endDate.getDate() - 1)
        endDate.setHours(23, 59, 59, 999)
        break
      case "last_7d":
        startDate.setDate(endDate.getDate() - 7)
        break
      case "last_14d":
        startDate.setDate(endDate.getDate() - 14)
        break
      case "last_30d":
        startDate.setDate(endDate.getDate() - 30)
        break
      case "last_90d":
        startDate.setDate(endDate.getDate() - 90)
        break
      case "lifetime":
        // For lifetime, use campaign start date if available
        if (campaignStartDate) {
          startDate.setTime(campaignStartDate.getTime())
        } else {
          // Fallback to 3 years ago (within Meta's 37-month limit)
          startDate.setFullYear(startDate.getFullYear() - 3)
        }
        break
      case "this_month":
        startDate.setDate(1)
        startDate.setHours(0, 0, 0, 0)
        break
      case "last_month":
        startDate.setMonth(startDate.getMonth() - 1)
        startDate.setDate(1)
        startDate.setHours(0, 0, 0, 0)
        endDate.setDate(0) // Sets to the last day of the previous month
        endDate.setHours(23, 59, 59, 999)
        break
      default: // Default to last_30d if unknown preset
        startDate.setDate(endDate.getDate() - 30)
    }

    const timeRange = {
      since: startDate.toISOString().split("T")[0],
      until: endDate.toISOString().split("T")[0],
    }
    
    // For historical data, we'll use date_preset or time_range with daily breakdown
    // Then we'll make a separate call for hourly data if needed
    let insightsUrl: string
    
    if (datePreset === 'today' || datePreset === 'yesterday') {
      // For single day, use hourly breakdown
      insightsUrl =
        `https://graph.facebook.com/v19.0/${campaignId}/insights?` +
        `fields=spend,impressions,clicks,ctr,actions,action_values` +
        `&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone` +
        `&date_preset=${datePreset}` +
        `&time_increment=1` +
        `&limit=1000` +
        `&access_token=${cleanToken}`
    } else if (datePreset === 'lifetime') {
      // For lifetime, hourly breakdown might not work for long ranges
      // Limit to last 90 days for hourly data
      const lifetimeEndDate = new Date()
      const lifetimeStartDate = new Date()
      lifetimeStartDate.setDate(lifetimeEndDate.getDate() - 90)
      
      // Use the more recent of: 90 days ago or campaign start
      const effectiveStartDate = startDate > lifetimeStartDate ? startDate : lifetimeStartDate
      
      const limitedTimeRange = {
        since: effectiveStartDate.toISOString().split("T")[0],
        until: lifetimeEndDate.toISOString().split("T")[0]
      }
      
      insightsUrl =
        `https://graph.facebook.com/v19.0/${campaignId}/insights?` +
        `fields=spend,impressions,clicks,ctr,actions,action_values` +
        `&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone` +
        `&time_range=${JSON.stringify(limitedTimeRange)}` +
        `&time_increment=1` +
        `&limit=5000` +
        `&access_token=${cleanToken}`
        
      console.log('Lifetime day/week analysis limited to last 90 days for hourly data')
    } else {
      // For multi-day ranges, use date_preset with proper mapping
      const datePresetMap: { [key: string]: string } = {
        'last_14d': 'last_14_d',
        'last_28d': 'last_28_d',
        'last_30d': 'last_30_d',
        'last_90d': 'last_90_d',
        'last_7d': 'last_7_d'
      }
      const metaDatePreset = datePresetMap[datePreset] || datePreset
      
      insightsUrl =
        `https://graph.facebook.com/v19.0/${campaignId}/insights?` +
        `fields=spend,impressions,clicks,ctr,actions,action_values` +
        `&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone` +
        `&date_preset=${metaDatePreset}` +
        `&time_increment=1` +
        `&limit=5000` +
        `&access_token=${cleanToken}`
    }

    console.log('Day/Week Analysis URL (without token):', insightsUrl.split('&access_token=')[0])
    console.log('Time range:', timeRange)
    
    const response = await railwayFetch(insightsUrl)
    const apiResponseData = await response.json()

    if (apiResponseData.error) {
      console.error("Facebook API Error:", apiResponseData.error)
      throw new Error(`Facebook API Error: ${apiResponseData.error.message} (Code: ${apiResponseData.error.code})`)
    }

    const rawInsights: HourlyInsight[] = apiResponseData.data || []
    const heatmapData: any[] = []
    const dayHourAggregates: { [key: string]: AggregatedHourData } = {}

    rawInsights.forEach((hourData: any) => {
      // When using hourly_stats_aggregated_by_advertiser_time_zone breakdown,
      // the hour is provided in the breakdown field, not in date_start
      const date = new Date(hourData.date_start + "T00:00:00")
      const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()]
      
      // Extract hour from hourly_stats_aggregated_by_advertiser_time_zone field
      // Format is "HH:MM:SS - HH:MM:SS"
      let hour = 0
      if (hourData.hourly_stats_aggregated_by_advertiser_time_zone) {
        hour = Number.parseInt(hourData.hourly_stats_aggregated_by_advertiser_time_zone.split(":")[0], 10)
      }

      const spend = Number.parseFloat(hourData.spend || "0")
      let revenue = 0
      let conversions = 0

      if (hourData.action_values) {
        hourData.action_values.forEach((av) => {
          if (av.action_type === "offsite_conversion.fb_pixel_purchase") {
            revenue += Number.parseFloat(av.value || "0")
          }
        })
      }

      if (hourData.actions) {
        hourData.actions.forEach((a) => {
          if (a.action_type === "offsite_conversion.fb_pixel_purchase") {
            conversions += Number.parseInt(a.value || "0", 10)
          }
        })
      }

      const key = `${dayOfWeek}-${hour}`

      if (!dayHourAggregates[key]) {
        dayHourAggregates[key] = {
          dayOfWeek,
          hour,
          spend: 0,
          revenue: 0,
          conversions: 0,
          impressions: 0,
          clicks: 0,
          count: 0,
        }
      }

      dayHourAggregates[key].spend += spend
      dayHourAggregates[key].revenue += revenue
      dayHourAggregates[key].conversions += conversions
      dayHourAggregates[key].impressions += Number.parseInt(hourData.impressions || "0", 10)
      dayHourAggregates[key].clicks += Number.parseInt(hourData.clicks || "0", 10)
      dayHourAggregates[key].count += 1
    })

    Object.values(dayHourAggregates).forEach((agg: AggregatedHourData) => {
      heatmapData.push({
        dayOfWeek: agg.dayOfWeek,
        hour: agg.hour,
        spend: agg.spend,
        revenue: agg.revenue,
        roas: agg.spend > 0 ? agg.revenue / agg.spend : 0,
        conversions: agg.conversions,
        impressions: agg.impressions,
        clicks: agg.clicks,
        ctr: agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0,
      })
    })

    const sortedByRoas = [...heatmapData].sort((a, b) => b.roas - a.roas)
    const bestTimes = sortedByRoas.filter((d) => d.spend > (0.01 * d.spend || 1)).slice(0, 10) // Filter for some minimal spend
    const worstTimes = sortedByRoas
      .filter((d) => d.spend > (0.01 * d.spend || 1))
      .slice(-10)
      .reverse()

    const dayPerformance = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => {
      const dayData = heatmapData.filter((d) => d.dayOfWeek === day)
      const totalSpend = dayData.reduce((sum, d) => sum + d.spend, 0)
      const totalRevenue = dayData.reduce((sum, d) => sum + d.revenue, 0)
      const totalConversions = dayData.reduce((sum, d) => sum + d.conversions, 0)

      return {
        day,
        totalSpend,
        totalRevenue,
        avgRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
        conversions: totalConversions,
      }
    })

    const recommendations: string[] = []
    if (bestTimes.length > 0 && worstTimes.length > 0 && bestTimes[0].roas > 0 && worstTimes[0].roas >= 0) {
      const bestOverallRoas = bestTimes[0].roas
      const worstOverallRoas = worstTimes[worstTimes.length - 1].roas // last item of worstTimes is the actual worst
      if (bestOverallRoas > worstOverallRoas * 2 && bestOverallRoas > 1) {
        // Check if best is significantly better
        recommendations.push(
          `Top performing slots (e.g., ${bestTimes[0].dayOfWeek} ${bestTimes[0].hour}:00 at ${safeToFixed(bestTimes[0].roas, 1)}x ROAS) are significantly better than lower ones (e.g., ${worstTimes[worstTimes.length - 1].dayOfWeek} ${worstTimes[worstTimes.length - 1].hour}:00 at ${safeToFixed(worstOverallRoas, 1)}x ROAS). Consider reallocating budget or using ad scheduling.`,
        )
      }
    }

    const sortedDayPerformance = [...dayPerformance].sort((a, b) => b.avgRoas - a.avgRoas)
    const bestDay = sortedDayPerformance[0]
    const worstDay = sortedDayPerformance[sortedDayPerformance.length - 1]

    if (bestDay && worstDay && bestDay.avgRoas > worstDay.avgRoas * 1.5 && bestDay.avgRoas > 1) {
      recommendations.push(
        `${bestDay.day}s (avg ${safeToFixed(bestDay.avgRoas, 1)}x ROAS) perform notably better than ${worstDay.day}s (avg ${safeToFixed(worstDay.avgRoas, 1)}x ROAS). Evaluate budget allocation across days.`,
      )
    }

    const morningHoursData = heatmapData.filter((d) => d.hour >= 6 && d.hour <= 11)
    const eveningHoursData = heatmapData.filter((d) => d.hour >= 18 && d.hour <= 23)

    const totalMorningSpend = morningHoursData.reduce((sum, d) => sum + d.spend, 0)
    const totalMorningRevenue = morningHoursData.reduce((sum, d) => sum + d.revenue, 0)
    const morningAvgRoas = totalMorningSpend > 0 ? totalMorningRevenue / totalMorningSpend : 0

    const totalEveningSpend = eveningHoursData.reduce((sum, d) => sum + d.spend, 0)
    const totalEveningRevenue = eveningHoursData.reduce((sum, d) => sum + d.revenue, 0)
    const eveningAvgRoas = totalEveningSpend > 0 ? totalEveningRevenue / totalEveningSpend : 0

    if (morningAvgRoas > eveningAvgRoas * 1.2 && morningAvgRoas > 1) {
      recommendations.push(
        `Morning hours (6am-11am, avg ${safeToFixed(morningAvgRoas, 1)}x ROAS) tend to outperform evening hours (6pm-11pm, avg ${safeToFixed(eveningAvgRoas, 1)}x ROAS).`,
      )
    } else if (eveningAvgRoas > morningAvgRoas * 1.2 && eveningAvgRoas > 1) {
      recommendations.push(
        `Evening hours (6pm-11pm, avg ${safeToFixed(eveningAvgRoas, 1)}x ROAS) tend to outperform morning hours (6am-11am, avg ${safeToFixed(morningAvgRoas, 1)}x ROAS).`,
      )
    }
    if (recommendations.length === 0) {
      recommendations.push(
        "Performance is relatively consistent across different times and days, or spend is too low for strong recommendations. Monitor closely.",
      )
    }

    return NextResponse.json({
      heatmapData,
      insights: {
        bestTimes: bestTimes.slice(0, 5), // Send top 5
        worstTimes: worstTimes.slice(0, 5), // Send top 5 worst
        dayPerformance,
        bestDayTime: bestTimes[0], // For budget optimization section
        worstDayTime: worstTimes[worstTimes.length - 1], // For budget optimization section
        recommendations,
      },
    })
  } catch (error: any) {
    console.error("Day/Week Analysis API Error:", error)
    return NextResponse.json({ error: error.message || "Failed to analyze day/week performance" }, { status: 500 })
  }
}
