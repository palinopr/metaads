import { NextResponse, type NextRequest } from "next/server"

const META_API_VERSION = "v19.0" // Use the latest appropriate API version

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

    const fields = "name,spend,insights{actions,action_values}"
    const apiUrl = `https://graph.facebook.com/${META_API_VERSION}/${adAccountId}/campaigns?fields=${fields}&access_token=${accessToken}`

    const metaResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!metaResponse.ok) {
      const errorData = await metaResponse.json()
      console.error("Meta API Error:", errorData)
      return NextResponse.json(
        { error: "Failed to fetch data from Meta API", details: errorData },
        { status: metaResponse.status },
      )
    }

    const data = await metaResponse.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error proxying Meta API request:", error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error while contacting Meta API" }, { status: 500 })
  }
}
