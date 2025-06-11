import { NextRequest, NextResponse } from 'next/server'

// Simplified Meta API endpoint for testing without security restrictions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken, adAccountId, type, endpoint, params } = body

    // Basic validation
    if (!accessToken || !adAccountId) {
      return NextResponse.json(
        { error: 'Missing required credentials' },
        { status: 400 }
      )
    }

    // Handle test connection
    if (type === 'test_connection') {
      const url = `https://graph.facebook.com/v19.0/${adAccountId}?access_token=${accessToken}&fields=name,account_status,currency,timezone_name`
      
      try {
        const response = await fetch(url)
        const data = await response.json()
        
        if (!response.ok) {
          return NextResponse.json(
            { error: 'Invalid credentials', details: data.error },
            { status: 401 }
          )
        }
        
        return NextResponse.json({
          success: true,
          account: data
        })
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to connect to Meta API' },
          { status: 500 }
        )
      }
    }

    // Handle other requests
    const metaEndpoint = endpoint || `${adAccountId}/insights`
    const url = new URL(`https://graph.facebook.com/v19.0/${metaEndpoint}`)
    url.searchParams.append('access_token', accessToken)
    
    // Add other parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const response = await fetch(url.toString())
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Meta API test route error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Meta test API is working. Use POST to test credentials.',
    example: {
      accessToken: 'your_token_here',
      adAccountId: 'act_123456789',
      type: 'test_connection'
    }
  })
}