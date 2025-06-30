import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Meta OAuth parameters
    const clientId = process.env.FACEBOOK_APP_ID
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/meta/callback`
    const state = Buffer.from(JSON.stringify({
      userId: session.user.id,
      timestamp: Date.now()
    })).toString('base64')
    
    // Permissions needed for ads management
    const scope = [
      'email',
      'public_profile',
      'ads_management',
      'ads_read',
      'business_management',
      'pages_read_engagement',
      'pages_show_list',
      'instagram_basic',
      'instagram_manage_insights'
    ].join(',')
    
    // Build Meta OAuth URL
    const oauthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
    oauthUrl.searchParams.append('client_id', clientId!)
    oauthUrl.searchParams.append('redirect_uri', redirectUri)
    oauthUrl.searchParams.append('state', state)
    oauthUrl.searchParams.append('scope', scope)
    oauthUrl.searchParams.append('response_type', 'code')
    
    return NextResponse.json({ url: oauthUrl.toString() })
  } catch (error) {
    console.error('Error generating Meta OAuth URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate OAuth URL' },
      { status: 500 }
    )
  }
}