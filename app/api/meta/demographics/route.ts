import { NextResponse, type NextRequest } from "next/server"

const META_API_VERSION = "v19.0" // Or your preferred version

// Helper function to extract key metrics from a row
// This is a simplified version of what processCampaignInsights might do,
// focused on what's needed for demographic aggregation.
// You might need to adjust this based on your exact needs or reuse/import a more generic one.
const extractMetricsFromRow = (row: any) => {
  const spend = Number.parseFloat(row.spend || "0")
  let conversions = 0
  let revenue = 0

  if (row.actions) {
    const purchaseAction = row.actions.find(
      (a: any) =>
        a.action_type === "purchase" ||
        a.action_type === "omni_purchase" ||
        a.action_type === "offsite_conversion.fb_pixel_purchase",
    )
    if (purchaseAction) {
      conversions += Number.parseInt(purchaseAction.value || "0")
    }
  }

  if (row.action_values) {
    const purchaseValue = row.action_values.find(
      (av: any) =>
        av.action_type === "purchase" ||
        av.action_type === "omni_purchase" ||
        av.action_type === "offsite_conversion.fb_pixel_purchase",
    )
    if (purchaseValue) {
      revenue += Number.parseFloat(purchaseValue.value || "0")
    }
  }
  return {
    spend,
    conversions,
    revenue,
    impressions: Number.parseInt(row.impressions || "0"),
  }
}

async function fetchBreakdownData(
  campaignId: string,
  accessToken: string,
  datePreset: string,
  breakdown: string,
  fields: string,
): Promise<{ data?: any[]; error?: any; breakdownName?: string }> {
  const url =
    `https://graph.facebook.com/${META_API_VERSION}/${campaignId}/insights?` +
    `fields=${fields}` +
    `&breakdowns=${breakdown}` +
    `&date_preset=${datePreset}` +
    `&limit=500` + // Increased limit slightly
    `&access_token=${accessToken}`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      console.error(`Meta Demographics API Error for breakdown ${breakdown}:`, data.error)
      return { error: data.error, breakdownName: breakdown }
    }
    return { data: data.data || [], breakdownName: breakdown }
  } catch (error: any) {
    console.error(`Network or parsing error for breakdown ${breakdown}:`, error)
    return { error: { message: error.message || "Network error" }, breakdownName: breakdown }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { campaignId, accessToken, datePreset = "last_30d" } = await request.json()

    if (!campaignId || !accessToken) {
      return NextResponse.json({ error: "Campaign ID and Access Token are required." }, { status: 400 })
    }

    const commonFields = "actions,action_values,impressions,spend"

    // 1. Fetch total campaign conversions for accurate percentage calculation
    let totalConversionsAll = 0
    try {
      const totalStatsUrl = `https://graph.facebook.com/${META_API_VERSION}/${campaignId}/insights?fields=actions&date_preset=${datePreset}&access_token=${accessToken}`
      const totalStatsRes = await fetch(totalStatsUrl)
      const totalStatsData = await totalStatsRes.json()
      if (totalStatsData.data && totalStatsData.data[0] && totalStatsData.data[0].actions) {
        totalStatsData.data[0].actions.forEach((action: any) => {
          if (
            action.action_type === "purchase" ||
            action.action_type === "omni_purchase" ||
            action.action_type === "offsite_conversion.fb_pixel_purchase"
          ) {
            totalConversionsAll += Number.parseInt(action.value || "0")
          }
        })
      } else if (totalStatsData.error) {
        console.warn("Could not fetch total campaign conversions for percentages:", totalStatsData.error.message)
      }
    } catch (e: any) {
      console.warn("Error fetching total campaign conversions:", e.message)
    }

    const results = await Promise.all([
      fetchBreakdownData(campaignId, accessToken, datePreset, "age", commonFields),
      fetchBreakdownData(campaignId, accessToken, datePreset, "gender", commonFields),
      fetchBreakdownData(campaignId, accessToken, datePreset, "region", commonFields),
      fetchBreakdownData(campaignId, accessToken, datePreset, "device_platform", commonFields),
    ])

    const errors = results.filter((r) => r.error)
    if (errors.length > 0) {
      // Log all errors
      errors.forEach((err) =>
        console.error(
          `Error for ${err.breakdownName}: ${err.error?.message} (Code: ${err.error?.code}, Subcode: ${err.error?.error_subcode})`,
        ),
      )

      // If all requests failed with the same type of error, it might indicate a persistent issue.
      // For now, returning the first error encountered.
      const firstError = errors[0]
      return NextResponse.json(
        {
          error: `Failed to fetch some demographic data. First error for ${firstError.breakdownName}: ${firstError.error?.message || "Unknown error"} (Code: ${firstError.error?.code})`,
          details: errors.map((e) => ({
            breakdown: e.breakdownName,
            message: e.error?.message,
            code: e.error?.code,
            error_subcode: e.error?.error_subcode,
          })),
        },
        { status: 500 },
      )
    }

    const ageApiData = results.find((r) => r.breakdownName === "age")?.data || []
    const genderApiData = results.find((r) => r.breakdownName === "gender")?.data || []
    const regionApiData = results.find((r) => r.breakdownName === "region")?.data || []
    const deviceApiData = results.find((r) => r.breakdownName === "device_platform")?.data || []

    const ageData: { [key: string]: { conversions: number; revenue: number; impressions: number; spend: number } } = {}
    const genderData: { [key: string]: { conversions: number; revenue: number; spend: number } } = {}
    const regionData: {
      [key: string]: { city: string; state: string; conversions: number; revenue: number; spend: number }
    } = {}
    const deviceData: { [key: string]: { conversions: number; revenue: number; spend: number } } = {}

    ageApiData.forEach((row: any) => {
      const metrics = extractMetricsFromRow(row)
      if (row.age) {
        if (!ageData[row.age]) ageData[row.age] = { conversions: 0, revenue: 0, impressions: 0, spend: 0 }
        ageData[row.age].conversions += metrics.conversions
        ageData[row.age].revenue += metrics.revenue
        ageData[row.age].impressions += metrics.impressions
        ageData[row.age].spend += metrics.spend
      }
    })

    genderApiData.forEach((row: any) => {
      const metrics = extractMetricsFromRow(row)
      if (row.gender) {
        if (!genderData[row.gender]) genderData[row.gender] = { conversions: 0, revenue: 0, spend: 0 }
        genderData[row.gender].conversions += metrics.conversions
        genderData[row.gender].revenue += metrics.revenue
        genderData[row.gender].spend += metrics.spend
      }
    })

    regionApiData.forEach((row: any) => {
      const metrics = extractMetricsFromRow(row)
      if (row.region) {
        const key = row.region
        if (!regionData[key]) {
          const parts = key.split(",")
          regionData[key] = {
            city: parts[0]?.trim() || key,
            state: parts[1]?.trim() || "",
            conversions: 0,
            revenue: 0,
            spend: 0,
          }
        }
        regionData[key].conversions += metrics.conversions
        regionData[key].revenue += metrics.revenue
        regionData[key].spend += metrics.spend
      }
    })

    deviceApiData.forEach((row: any) => {
      const metrics = extractMetricsFromRow(row)
      if (row.device_platform) {
        if (!deviceData[row.device_platform]) deviceData[row.device_platform] = { conversions: 0, revenue: 0, spend: 0 }
        deviceData[row.device_platform].conversions += metrics.conversions
        deviceData[row.device_platform].revenue += metrics.revenue
        deviceData[row.device_platform].spend += metrics.spend
      }
    })

    const formatAge = Object.entries(ageData)
      .map(([range, data]) => ({
        range,
        ...data,
        percentage: totalConversionsAll > 0 ? Math.round((data.conversions / totalConversionsAll) * 100) : 0,
      }))
      .sort((a, b) => b.conversions - a.conversions)

    const formatGender = Object.entries(genderData).map(([type, data]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      ...data,
      percentage: totalConversionsAll > 0 ? Math.round((data.conversions / totalConversionsAll) * 100) : 0,
    }))

    const formatRegion = Object.entries(regionData)
      .map(([_, data]) => ({
        ...data,
        roas: data.spend > 0 ? data.revenue / data.spend : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    const formatDevice = Object.entries(deviceData)
      .map(([platform, data]) => ({
        platform: platform.charAt(0).toUpperCase() + platform.slice(1),
        ...data,
        percentage: totalConversionsAll > 0 ? Math.round((data.conversions / totalConversionsAll) * 100) : 0,
      }))
      .sort((a, b) => b.conversions - a.conversions)

    return NextResponse.json({
      age: formatAge,
      gender: formatGender,
      region: formatRegion,
      device: formatDevice,
    })
  } catch (error: any) {
    console.error("Demographics API Main Error Catcher:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch demographics" }, { status: 500 })
  }
}
