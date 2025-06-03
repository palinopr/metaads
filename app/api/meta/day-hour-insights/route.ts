import { NextResponse, type NextRequest } from "next/server"

const META_API_VERSION = "v19.0" // Or your preferred version

// Helper to fetch from Meta API (can be shared if moved to a lib)
async function fetchMetaDayHour(url: string, accessToken: string) {
  const fullUrl = url.includes("access_token=") ? url : `${url}&access_token=${accessToken}`
  const response = await fetch(fullUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  })
  if (!response.ok) {
    const errorData = await response.json()
    console.error(
      `Meta API Error (DayHourInsights) for URL ${url.split("&access_token")[0]}:`,
      errorData.error || errorData,
    )
    throw new Error(errorData.error?.message || `Meta API request failed with status ${response.status}`)
  }
  return response.json()
}

export async function POST(request: NextRequest) {
  try {
    const { campaignId, accessToken, datePreset = "last_30d" } = await request.json()

    if (!campaignId || !accessToken) {
      return NextResponse.json({ error: "Campaign ID and Access Token are required." }, { status: 400 })
    }

    // Fetch hourly data for the campaign over the specified datePreset
    // We need 'hourly_stats_aggregated_by_advertiser_time_zone' for the hour in ad account's timezone
    // and 'actions'/'action_values' for performance metrics.
    const insightsFields = "spend,actions,action_values,impressions,clicks"
    const insightsUrl =
      `https://graph.facebook.com/${META_API_VERSION}/${campaignId}/insights?` +
      `fields=${insightsFields}` +
      `&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone` + // This gives hour of day
      `&date_preset=${datePreset}` +
      `&time_increment=1` + // Important: time_increment=1 with date_preset gives daily data, each with hourly breakdown
      `&limit=5000` + // Potentially many data points (e.g., 30 days * 24 hours)
      `&access_token=${accessToken}`

    const apiResponse = await fetchMetaDayHour(insightsUrl, accessToken)

    if (!apiResponse.data || apiResponse.data.length === 0) {
      return NextResponse.json({ dayHourData: [] }) // No data found
    }

    // Process the data
    const processedData = apiResponse.data.map((item: any) => {
      const spend = Number.parseFloat(item.spend || "0")
      let revenue = 0
      let conversions = 0

      if (item.action_values) {
        item.action_values.forEach((av: any) => {
          if (
            av.action_type === "purchase" ||
            av.action_type === "omni_purchase" ||
            av.action_type === "offsite_conversion.fb_pixel_purchase"
          ) {
            revenue += Number.parseFloat(av.value || "0")
          }
        })
      }
      if (item.actions) {
        item.actions.forEach((a: any) => {
          if (
            a.action_type === "purchase" ||
            a.action_type === "omni_purchase" ||
            a.action_type === "offsite_conversion.fb_pixel_purchase"
          ) {
            conversions += Number.parseInt(a.value || "0")
          }
        })
      }

      // date_start is in YYYY-MM-DD format for daily entries when time_increment=1
      // hourly_stats_aggregated_by_advertiser_time_zone is HH:MM:SS - HH:MM:SS format
      const dayOfWeek = new Date(item.date_start + "T00:00:00").getDay() // 0 (Sun) to 6 (Sat)
      const hour = Number.parseInt(item.hourly_stats_aggregated_by_advertiser_time_zone.split(":")[0], 10)

      return {
        date: item.date_start,
        dayOfWeek, // 0-6
        hour, // 0-23
        spend,
        revenue,
        conversions,
        roas: spend > 0 ? revenue / spend : 0,
        impressions: Number.parseInt(item.impressions || "0", 10),
        clicks: Number.parseInt(item.clicks || "0", 10),
      }
    })

    return NextResponse.json({ dayHourData: processedData })
  } catch (error: any) {
    console.error("Error in day-hour-insights API route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
