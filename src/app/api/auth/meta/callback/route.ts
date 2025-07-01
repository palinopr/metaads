import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db/drizzle"
import { sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    // Handle OAuth errors
    if (error) {
      console.error('Meta OAuth error:', error)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/connections?error=${error}`
      )
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/connections?error=missing_params`
      )
    }
    
    // Decode and verify state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    const { userId } = stateData
    
    // Exchange code for access token
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    tokenUrl.searchParams.append('client_id', process.env.FACEBOOK_APP_ID!)
    tokenUrl.searchParams.append('client_secret', process.env.FACEBOOK_APP_SECRET!)
    tokenUrl.searchParams.append('code', code)
    tokenUrl.searchParams.append('redirect_uri', `${process.env.NEXTAUTH_URL}/api/auth/meta/callback`)
    
    const tokenResponse = await fetch(tokenUrl.toString())
    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/connections?error=token_exchange_failed`
      )
    }
    
    // Get user info from Meta
    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${tokenData.access_token}`
    )
    const userData = await userResponse.json()
    
    // Exchange short-lived token for long-lived token
    const longLivedTokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    longLivedTokenUrl.searchParams.append('grant_type', 'fb_exchange_token')
    longLivedTokenUrl.searchParams.append('client_id', process.env.FACEBOOK_APP_ID!)
    longLivedTokenUrl.searchParams.append('client_secret', process.env.FACEBOOK_APP_SECRET!)
    longLivedTokenUrl.searchParams.append('fb_exchange_token', tokenData.access_token)
    
    const longLivedResponse = await fetch(longLivedTokenUrl.toString())
    const longLivedData = await longLivedResponse.json()
    
    const finalAccessToken = longLivedData.access_token || tokenData.access_token
    
    // Check if connection exists for this user
    const existingConnection = await db.execute(sql`
      SELECT id FROM meta_connections 
      WHERE user_id = ${userId}
      LIMIT 1
    `)
    
    if (existingConnection.rows.length > 0) {
      // Update existing connection
      await db.execute(sql`
        UPDATE meta_connections 
        SET 
          access_token = ${finalAccessToken},
          expires_at = ${new Date(Date.now() + (60 * 24 * 60 * 60 * 1000))},
          updated_at = ${new Date()}
        WHERE user_id = ${userId}
      `)
    } else {
      // Create new connection
      const connectionId = crypto.randomUUID()
      await db.execute(sql`
        INSERT INTO meta_connections (
          id,
          user_id,
          access_token,
          expires_at,
          created_at,
          updated_at
        ) VALUES (
          ${connectionId},
          ${userId},
          ${finalAccessToken},
          ${new Date(Date.now() + (60 * 24 * 60 * 60 * 1000))},
          ${new Date()},
          ${new Date()}
        )
      `)
    }
    
    // Redirect back to connections page
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/connections?success=true`
    )
    
  } catch (error) {
    console.error('Meta callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/connections?error=callback_failed`
    )
  }
}