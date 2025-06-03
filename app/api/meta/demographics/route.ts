import { NextResponse, type NextRequest } from "next/server"

const META_API_VERSION = "v19.0" // Or your preferred version

export async function POST(request: NextRequest) {
  try {
    const { campaignId, accessToken, datePreset = "last_30d" } = await request.json()

    if (!campaignId || !accessToken) {
      return NextResponse.json({ error: "Campaign ID and Access Token are required." }, { status: 400 })
    }

    // Construct the date_range based on datePreset or a fixed range
    // For simplicity, using a fixed recent range. For dynamic, map datePreset to since/until.
    // Example: last_30d would require calculating dates.
    // The provided code uses a fixed range from 2024-01-01. Let's make it more dynamic or use date_preset.
    // Using date_preset is simpler if the API supports it well for breakdowns.
    // If not, we'd need to calculate 'since' and 'until' based on datePreset.
    // For now, let's try with date_preset as it's simpler.
    // The original code had a hardcoded time_range. Let's use datePreset for consistency.

    const demographicsUrl =
      `https://graph.facebook.com/${META_API_VERSION}/${campaignId}/insights?` +
      `fields=actions,action_values,impressions,spend` +
      `&breakdowns=age,gender,region,device_platform` +
      `&date_preset=${datePreset}` + // Using datePreset
      `&limit=200` + // Increased limit for more comprehensive data
      `&access_token=${accessToken}`

    const response = await fetch(demographicsUrl)
    const data = await response.json()

    if (data.error) {
      console.error("Meta Demographics API Error:", data.error)
      throw new Error(data.error.message || `Facebook API error: ${data.error.code} - ${data.error.error_subcode}`)
    }

    const ageData: { [key: string]: { conversions: number; revenue: number; impressions: number; spend: number } } = {}
    const genderData: { [key: string]: { conversions: number; revenue: number; spend: number } } = {}
    const regionData: {
      [key: string]: { city: string; state: string; conversions: number; revenue: number; spend: number }
    } = {}
    const deviceData: { [key: string]: { conversions: number; revenue: number; spend: number } } = {}

    let totalConversionsAll = 0

    data.data?.forEach((row: any) => {
      const currentSpend = Number.parseFloat(row.spend || "0")
      let currentConversions = 0
      let currentRevenue = 0

      if (row.actions) {
        const purchaseAction = row.actions.find(
          (a: any) =>
            a.action_type === "purchase" ||
            a.action_type === "omni_purchase" ||
            a.action_type === "offsite_conversion.fb_pixel_purchase",
        )
        if (purchaseAction) {
          currentConversions += Number.parseInt(purchaseAction.value || "0")
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
          currentRevenue += Number.parseFloat(purchaseValue.value || "0")
        }
      }
      totalConversionsAll += currentConversions

      // Age breakdown
      if (row.age) {
        if (!ageData[row.age]) ageData[row.age] = { conversions: 0, revenue: 0, impressions: 0, spend: 0 }
        ageData[row.age].conversions += currentConversions
        ageData[row.age].revenue += currentRevenue
        ageData[row.age].impressions += Number.parseInt(row.impressions || "0")
        ageData[row.age].spend += currentSpend
      }

      // Gender breakdown
      if (row.gender) {
        if (!genderData[row.gender]) genderData[row.gender] = { conversions: 0, revenue: 0, spend: 0 }
        genderData[row.gender].conversions += currentConversions
        genderData[row.gender].revenue += currentRevenue
        genderData[row.gender].spend += currentSpend
      }

      // Region breakdown
      if (row.region) {
        const key = row.region // Region can be "City, State" or just "State" or "Country"
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
        regionData[key].conversions += currentConversions
        regionData[key].revenue += currentRevenue
        regionData[key].spend += currentSpend
      }

      // Device platform
      if (row.device_platform) {
        if (!deviceData[row.device_platform]) deviceData[row.device_platform] = { conversions: 0, revenue: 0, spend: 0 }
        deviceData[row.device_platform].conversions += currentConversions
        deviceData[row.device_platform].revenue += currentRevenue
        deviceData[row.device_platform].spend += currentSpend
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
      type: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize
      ...data,
      percentage: totalConversionsAll > 0 ? Math.round((data.conversions / totalConversionsAll) * 100) : 0,
    }))

    const formatRegion = Object.entries(regionData)
      .map(([_, data]) => ({
        // Key 'region' is already part of 'data' as city/state
        ...data,
        roas: data.spend > 0 ? data.revenue / data.spend : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue) // Sort by revenue or conversions

    const formatDevice = Object.entries(deviceData)
      .map(([platform, data]) => ({
        platform: platform.charAt(0).toUpperCase() + platform.slice(1), // Capitalize
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
    console.error("Demographics API Error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch demographics" }, { status: 500 })
  }
}
