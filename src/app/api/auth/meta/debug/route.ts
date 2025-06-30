import { NextResponse } from "next/server"

export async function GET() {
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/meta/callback`
  
  return NextResponse.json({
    environment: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
    },
    oauth: {
      redirect_uri: redirectUri,
      required_settings: [
        "Add this to 'Valid OAuth Redirect URIs' in Facebook App settings",
        "Enable 'Client OAuth Login'",
        "Enable 'Web OAuth Login'"
      ]
    },
    urls_to_add: [
      redirectUri,
      "http://localhost:3000/api/auth/meta/callback"
    ]
  })
}