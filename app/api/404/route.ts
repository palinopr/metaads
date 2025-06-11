import { NextRequest, NextResponse } from 'next/server'

// This route handles all undefined API endpoints
export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url)
  
  // Log the 404 API request for debugging
  console.warn(`API 404: ${pathname}`)
  
  return NextResponse.json(
    {
      error: 'API endpoint not found',
      message: `The API endpoint ${pathname} does not exist`,
      statusCode: 404,
      availableEndpoints: [
        '/api/health',
        '/api/log-error',
        '/api/logs/stream',
        '/api/meta',
        '/api/meta/day-hour-insights',
        '/api/meta/day-week-analysis',
        '/api/meta/demographics',
        '/api/simple-meta',
        '/api/test-meta-complete',
        '/api/test-meta',
        '/api/ai-analyze'
      ],
      timestamp: new Date().toISOString(),
      documentation: 'Check the available endpoints list above for valid API routes'
    },
    { 
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': '1.0.0'
      }
    }
  )
}

export async function POST(request: NextRequest) {
  return GET(request)
}

export async function PUT(request: NextRequest) {
  return GET(request)
}

export async function DELETE(request: NextRequest) {
  return GET(request)
}

export async function PATCH(request: NextRequest) {
  return GET(request)
}