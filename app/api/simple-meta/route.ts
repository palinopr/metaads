import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token, accountId } = await request.json()

    if (!token || !accountId) {
      return NextResponse.json(
        { error: 'Missing credentials' },
        { status: 400 }
      )
    }

    // Clean token (remove Bearer prefix if exists)
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim()
    
    // Simple API call - just get campaigns
    const url = `https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=id,name,status&limit=10&access_token=${cleanToken}`
    
    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || 'Meta API error' },
        { status: 400 }
      )
    }

    // Return simple data
    return NextResponse.json({
      campaigns: data.data || [],
      count: data.data?.length || 0
    })

  } catch (error) {
    console.error('Simple Meta API error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}