import { NextResponse, type NextRequest } from "next/server"

const META_API_VERSION = "v19.0" // Keep your desired API version

// Add this helper function at the top of app/api/meta/route.ts if not already present
// or import if it's in a shared lib.
const findMetaActionValueApi = (items: any[] | undefined, targetTypes: string[]): number => {
  if (!items) return 0
  return items
    .filter((item) => targetTypes.includes(item.action_type))
    .reduce((sum, item) => sum + Number.parseFloat(item.value || "0"), 0)
}

const processCampaignInsightsHelper = (insightData?: any): any => {
  const data = insightData || {}
  const spend = Number.parseFloat(data.spend || "0")
  const revenue = findMetaActionValueApi(data.action_values, [
    "omni_purchase",
    "purchase",
    "offsite_conversion.fb_pixel_purchase",
  ])
  const conversions = findMetaActionValueApi(data.actions, [
    "omni_purchase",
    "purchase",
    "offsite_conversion.fb_pixel_purchase",
    "complete_registration",
    "lead",
  ])
  return {
    spend,
    revenue,
    conversions,
    roas: spend > 0 ? revenue / spend : 0,
    impressions: Number.parseInt(data.impressions || "0", 10),
    clicks: Number.parseInt(data.clicks || "0", 10),
    ctr: Number.parseFloat(data.ctr || "0"),
    cpc: Number.parseFloat(data.cpc || "0"),
    frequency: Number.parseFloat(data.frequency || "0"),
  }
}

// Helper to fetch from Meta API
async function fetchMeta(url: string, accessToken: string) {
  const fullUrl = url.includes("access_token=") ? url : `${url}&access_token=${accessToken}`
  const response = await fetch(fullUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store", // Ensure fresh data
  })
  if (!response.ok) {
    const errorData = await response.json()
    console.error(`Meta API Error for URL ${url.split("&access_token")[0]}:`, errorData.error || errorData)
    throw new Error(errorData.error?.message || `Meta API request failed with status ${response.status}`)
  }
  return response.json()
}

// New function for fetching today's hourly data with correct timezone handling
async function fetchTodayHourlyData(campaignId: string, accessToken: string, apiVersion: string) {
  try {
    // Get today's date in PST/PDT (Meta's timezone)
    // Meta's API typically uses the ad account's configured timezone for 'today' preset.
    // Forcing PST/PDT via time_range might be more explicit if needed,
    // but date_preset=today with time_increment=hourly should respect account timezone.
    // The provided code uses time_range with a calculated PST date. We'll stick to that.

    const now = new Date()
    // Determine if it's PDT or PST. For simplicity, let's assume PDT from March to November.
    // A more robust solution would use a library like `date-fns-tz`.
    const isPDT = now.getMonth() > 1 && now.getMonth() < 10 // Approx March to Nov
    const offset = isPDT ? -7 : -8 // PDT is UTC-7, PST is UTC-8

    const accountTime = new Date(now.getTime() + offset * 60 * 60 * 1000)
    const dateString = accountTime.toISOString().split("T")[0]

    const hourlyUrl =
      `https://graph.facebook.com/${apiVersion}/${campaignId}/insights?` +
      `fields=spend,impressions,clicks,actions,action_values,ctr,cpc` +
      `&time_increment=hourly` + // Corrected from '1' to 'hourly' for clarity with time_range
      `&time_range={"since":"${dateString}","until":"${dateString}"}` +
      `&access_token=${accessToken}`

    const response = await fetch(hourlyUrl)
    if (!response.ok) {
      const errorData = await response.json()
      console.error(
        `Meta API Error for Hourly Data URL ${hourlyUrl.split("&access_token")[0]}:`,
        errorData.error || errorData,
      )
      throw new Error(
        errorData.error?.message || `Meta API request for hourly data failed with status ${response.status}`,
      )
    }
    const data = await response.json()

    if (data.data && data.data.length > 0) {
      return data.data.map((hourData: any) => {
        // The API returns hour_start in UTC if time_range is used with specific dates.
        // We need to convert this back to the ad account's local time for display or ensure consistency.
        // For simplicity, we'll parse the hour from date_start/hour_start.
        // The `hourly_stats_aggregated_by_advertiser_time_zone` field is better if available with date_preset=today.
        // Since we are using time_range, `date_start` will be in UTC.
        const dateStart = new Date(hourData.date_start) // This is UTC
        // To display in Ad Account's timezone, you'd need that timezone.
        // For now, let's just get the UTC hour.
        const hour = dateStart.getUTCHours()

        const spend = Number.parseFloat(hourData.spend || "0")
        let revenue = 0
        let conversions = 0

        if (hourData.action_values) {
          hourData.action_values.forEach((av: any) => {
            if (
              av.action_type === "purchase" ||
              av.action_type === "omni_purchase" ||
              av.action_type === "offsite_conversion.fb_pixel_purchase"
            ) {
              revenue += Number.parseFloat(av.value || "0")
            }
          })
        }

        if (hourData.actions) {
          hourData.actions.forEach((a: any) => {
            if (
              a.action_type === "purchase" ||
              a.action_type === "omni_purchase" ||
              a.action_type === "offsite_conversion.fb_pixel_purchase"
            ) {
              conversions += Number.parseInt(a.value || "0")
            }
          })
        }

        return {
          // Use `hourly_stats_aggregated_by_advertiser_time_zone` if available, otherwise format from `date_start`
          time_start:
            hourData.hourly_stats_aggregated_by_advertiser_time_zone || `${hour.toString().padStart(2, "0")}:00`,
          spend,
          revenue,
          roas: spend > 0 ? revenue / spend : 0,
          impressions: Number.parseInt(hourData.impressions || "0", 10),
          clicks: Number.parseInt(hourData.clicks || "0", 10),
          conversions,
          // Keep original fields for flexibility client-side
          hourly_stats_aggregated_by_advertiser_time_zone: hourData.hourly_stats_aggregated_by_advertiser_time_zone,
          date_start: hourData.date_start, // UTC timestamp
          date_stop: hourData.date_stop, // UTC timestamp
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching hourly data:", error)
    return [] // Return empty array on error to prevent breaking the UI
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      accessToken,
      adAccountId,
      type, // 'overview', 'campaign_details', 'historical_campaign_data'
      campaignId,
      datePreset = "last_30d",
    } = body

    if (!accessToken || !adAccountId) {
      return NextResponse.json({ error: "Access Token and Ad Account ID are required." }, { status: 400 })
    }

    if (type === "overview") {
      // Fetch initial campaign list with their period insights
      const campaignListSummaryFields =
        "id,name,created_time,effective_status,status,insights.date_preset(" + // Added 'status' here for client-side active check
        datePreset +
        "){spend,impressions,clicks,ctr,cpc,actions,action_values,frequency}"
      const campaignsSummaryUrl = `https://graph.facebook.com/${META_API_VERSION}/${adAccountId}/campaigns?fields=${campaignListSummaryFields}&limit=100` // Consider pagination for more than 100 campaigns

      const campaignsSummaryData = await fetchMeta(campaignsSummaryUrl, accessToken)

      const initialCampaigns = campaignsSummaryData.data || []

      // Sort campaigns by creation time initially
      if (Array.isArray(initialCampaigns)) {
        initialCampaigns.sort((a: any, b: any) => {
          const dateA = a.created_time ? new Date(a.created_time).getTime() : 0
          const dateB = b.created_time ? new Date(b.created_time).getTime() : 0
          return dateB - dateA
        })
      }

      // For each campaign, also fetch today's data
      const campaignsWithTodayData = await Promise.all(
        initialCampaigns.map(async (campaign: any) => {
          try {
            const today = new Date()
            // To ensure "today" refers to the ad account's timezone, it's best if the API handles this.
            // If strictly client-side interpretation of "today" is needed, it can be complex.
            // For Meta, date_preset=today usually works based on account's timezone.
            // Here, we construct time_range for explicit today.
            const todayStr = today.toISOString().split("T")[0]

            const todayUrl =
              `https://graph.facebook.com/${META_API_VERSION}/${campaign.id}/insights?` +
              `fields=spend,actions,action_values&` + // Only fetch necessary fields for today
              `time_range={"since":"${todayStr}","until":"${todayStr}"}&` +
              `access_token=${accessToken}`

            const todayInsightsData = await fetchMeta(todayUrl, accessToken)

            let todaySpend = 0
            let todayConversions = 0

            if (todayInsightsData.data && todayInsightsData.data[0]) {
              const todayInsights = todayInsightsData.data[0]
              todaySpend = Number.parseFloat(todayInsights.spend || "0")

              if (todayInsights.actions) {
                todayInsights.actions.forEach((action: any) => {
                  if (
                    action.action_type === "purchase" ||
                    action.action_type === "omni_purchase" ||
                    action.action_type === "offsite_conversion.fb_pixel_purchase" ||
                    action.action_type === "complete_registration" || // As per user's code
                    action.action_type === "lead" // As per user's code
                  ) {
                    todayConversions += Number.parseInt(action.value || "0", 10)
                  }
                })
              }
            }

            // Ensure processedInsights is attached if not already
            const processedInsights = campaign.insights?.data?.[0]
              ? processCampaignInsightsHelper(campaign.insights.data[0])
              : {
                  spend: 0,
                  revenue: 0,
                  conversions: 0,
                  roas: 0,
                  impressions: 0,
                  clicks: 0,
                  ctr: 0,
                  cpc: 0,
                  frequency: 0,
                }

            return {
              ...campaign,
              processedInsights, // Ensure processedInsights is part of the returned campaign object
              todayData: {
                spend: todaySpend,
                conversions: todayConversions,
              },
            }
          } catch (err: any) {
            console.error(`Error fetching today's data for campaign ${campaign.id}:`, err.message)
            const processedInsights = campaign.insights?.data?.[0]
              ? processCampaignInsightsHelper(campaign.insights.data[0])
              : {
                  spend: 0,
                  revenue: 0,
                  conversions: 0,
                  roas: 0,
                  impressions: 0,
                  clicks: 0,
                  ctr: 0,
                  cpc: 0,
                  frequency: 0,
                }
            return {
              ...campaign,
              processedInsights,
              todayData: {
                spend: 0,
                conversions: 0,
              },
              errorTodayData: err.message,
            }
          }
        }),
      )

      // The API no longer directly returns activeCampaignsCount or overall todayData.
      // These will be calculated on the client-side from the campaignsWithTodayData.
      return NextResponse.json({
        campaigns: campaignsWithTodayData,
        // dateRange: datePreset, // Client already knows this
      })
    } else if (type === "campaign_details" && campaignId) {
      const adSetFields =
        "name,status,insights.date_preset(" + datePreset + "){spend,impressions,clicks,actions,action_values}" // Removed roas
      const adSetsUrl = `https://graph.facebook.com/${META_API_VERSION}/${campaignId}/adsets?fields=${adSetFields}&limit=50`
      const adSetsData = await fetchMeta(adSetsUrl, accessToken)

      // Use the new function for hourly data
      const hourlyDataResult = await fetchTodayHourlyData(campaignId, accessToken, META_API_VERSION)

      return NextResponse.json({
        adSets: adSetsData.data || [],
        hourlyData: hourlyDataResult, // Use result from the new function
      })
    } else if (type === "historical_campaign_data" && campaignId) {
      const historicalFields = "spend,impressions,clicks,ctr,cpc,actions,action_values,frequency" // Removed roas
      // For historical daily data, time_increment=1 with date_preset gives daily breakdown
      const historicalDataUrl = `https://graph.facebook.com/${META_API_VERSION}/${campaignId}/insights?fields=${historicalFields}&date_preset=${datePreset}&time_increment=1`
      const historicalData = await fetchMeta(historicalDataUrl, accessToken)
      return NextResponse.json({
        historicalData: historicalData.data || [],
      })
    } else {
      return NextResponse.json({ error: "Invalid request type or missing parameters." }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Error in Meta API proxy:", error)
    return NextResponse.json({ error: error.message || "Internal server error in API proxy" }, { status: 500 })
  }
}
