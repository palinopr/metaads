import { NextResponse } from "next/server"

interface HourlyInsight {
  spend?: string
  impressions?: string
  clicks?: string
  ctr?: string
  actions?: { action_type: string; value: string }[]
  action_values?: { action_type: string; value: string }[]
  date_start: string // ISO 8601 format, e.g., "2023-10-26T00:00:00-0700"
  date_stop: string
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

    const insightsUrl =
      `https://graph.facebook.com/v19.0/${campaignId}/insights?` +
      `fields=spend,impressions,clicks,ctr,actions,action_values` +
      `&time_increment=hourly` + // Fetches data aggregated by hour
      `&time_range=${JSON.stringify(timeRange)}` +
      `&limit=1000` + // Increased limit, consider pagination if needed for very long ranges
      `&access_token=${accessToken}`

    const response = await fetch(insightsUrl)
    const apiResponseData = await response.json()

    if (apiResponseData.error) {
      console.error("Facebook API Error:", apiResponseData.error)
      throw new Error(`Facebook API Error: ${apiResponseData.error.message} (Code: ${apiResponseData.error.code})`)
    }

    const rawInsights: HourlyInsight[] = apiResponseData.data || []
    const heatmapData: any[] = []
    const dayHourAggregates: { [key: string]: AggregatedHourData } = {}

    rawInsights.forEach((hourData: HourlyInsight) => {
      // The date_start from Meta API is in the ad account's timezone.
      // We need to parse this correctly. Example: "2023-10-26T00:00:00-0700"
      // For simplicity, we'll assume the date string correctly represents the local time of the ad account.
      // If the API returns UTC and you need to convert, more complex date handling is needed.
      const date = new Date(hourData.date_start)
      const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()]
      const hour = date.getHours() // This will be in the local timezone of the server running this code if not careful.
      // However, since Meta gives it with offset, new Date() should parse it to correct UTC moment,
      // then getDay/getHours gives values based on server's locale.
      // For advertiser timezone breakdown, Meta's `hourly_stats_aggregated_by_advertiser_time_zone` is better
      // but here we are using `time_increment=hourly` which is by default advertiser timezone.

      const spend = Number.parseFloat(hourData.spend || "0")
      let revenue = 0
      let conversions = 0

      if (hourData.action_values) {
        hourData.action_values.forEach((av) => {
          if (
            av.action_type === "omni_purchase" ||
            av.action_type === "purchase" ||
            av.action_type === "offsite_conversion.fb_pixel_purchase"
          ) {
            revenue += Number.parseFloat(av.value || "0")
          }
        })
      }

      if (hourData.actions) {
        hourData.actions.forEach((a) => {
          if (
            a.action_type === "omni_purchase" ||
            a.action_type === "purchase" ||
            a.action_type === "offsite_conversion.fb_pixel_purchase" ||
            a.action_type === "complete_registration" ||
            a.action_type === "lead"
          ) {
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
          `Top performing slots (e.g., ${bestTimes[0].dayOfWeek} ${bestTimes[0].hour}:00 at ${bestTimes[0].roas.toFixed(1)}x ROAS) are significantly better than lower ones (e.g., ${worstTimes[worstTimes.length - 1].dayOfWeek} ${worstTimes[worstTimes.length - 1].hour}:00 at ${worstOverallRoas.toFixed(1)}x ROAS). Consider reallocating budget or using ad scheduling.`,
        )
      }
    }

    const sortedDayPerformance = [...dayPerformance].sort((a, b) => b.avgRoas - a.avgRoas)
    const bestDay = sortedDayPerformance[0]
    const worstDay = sortedDayPerformance[sortedDayPerformance.length - 1]

    if (bestDay && worstDay && bestDay.avgRoas > worstDay.avgRoas * 1.5 && bestDay.avgRoas > 1) {
      recommendations.push(
        `${bestDay.day}s (avg ${bestDay.avgRoas.toFixed(1)}x ROAS) perform notably better than ${worstDay.day}s (avg ${worstDay.avgRoas.toFixed(1)}x ROAS). Evaluate budget allocation across days.`,
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
        `Morning hours (6am-11am, avg ${morningAvgRoas.toFixed(1)}x ROAS) tend to outperform evening hours (6pm-11pm, avg ${eveningAvgRoas.toFixed(1)}x ROAS).`,
      )
    } else if (eveningAvgRoas > morningAvgRoas * 1.2 && eveningAvgRoas > 1) {
      recommendations.push(
        `Evening hours (6pm-11pm, avg ${eveningAvgRoas.toFixed(1)}x ROAS) tend to outperform morning hours (6am-11am, avg ${morningAvgRoas.toFixed(1)}x ROAS).`,
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
