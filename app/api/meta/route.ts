import { NextResponse, type NextRequest } from "next/server"

const META_API_VERSION = "v19.0"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken, adAccountId } = body

    if (!accessToken || !adAccountId) {
      return NextResponse.json(
        { error: "Access Token and Ad Account ID are required in the request body." },
        { status: 400 },
      )
    }

    const fields = "name,spend,created_time,insights{impressions,clicks,ctr,cpc,actions,action_values}"
    const apiUrl = `https://graph.facebook.com/${META_API_VERSION}/${adAccountId}/campaigns?fields=${fields}&access_token=${accessToken}`

    const metaResponse = await fetch(apiUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })

    if (!metaResponse.ok) {
      const errorData = await metaResponse.json()
      console.error("Meta API Error:", errorData)
      return NextResponse.json(
        { error: "Failed to fetch data from Meta API", details: errorData.error || errorData },
        { status: metaResponse.status },
      )
    }

    const data = await metaResponse.json()

    if (data.data && Array.isArray(data.data)) {
      data.data.sort((a: any, b: any) => {
        const dateA = a.created_time ? new Date(a.created_time).getTime() : 0
        const dateB = b.created_time ? new Date(b.created_time).getTime() : 0
        return dateB - dateA
      })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error proxying Meta API request:", error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Internal server error while contacting Meta API", details: error.message },
      { status: 500 },
    )
  }
}
