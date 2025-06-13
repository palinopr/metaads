import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const envVars = {
    FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID ? 'Set' : 'Not Set',
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ? 'Set' : 'Not Set',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'Not Set',
    NODE_ENV: process.env.NODE_ENV,
    // Show partial values for debugging (first 4 chars only)
    FACEBOOK_APP_ID_PREVIEW: process.env.FACEBOOK_APP_ID ? 
      process.env.FACEBOOK_APP_ID.substring(0, 4) + '...' : 'Not Set',
    HOST: request.headers.get('host'),
    COMPUTED_REDIRECT_URI: `${process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`}/api/oauth/facebook/callback`
  }

  return NextResponse.json({
    message: 'OAuth Configuration Debug',
    environment: envVars,
    timestamp: new Date().toISOString()
  })
}