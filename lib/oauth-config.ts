// OAuth Configuration
// This is a temporary solution for Railway environment variable issues

export function getOAuthConfig() {
  // Try environment variables first
  let appId = process.env.FACEBOOK_APP_ID
  let appSecret = process.env.FACEBOOK_APP_SECRET
  let appUrl = process.env.NEXT_PUBLIC_APP_URL

  // Fallback to hardcoded values if env vars are not available
  // TODO: Remove these hardcoded values once Railway env vars are working
  if (!appId) {
    console.warn('FACEBOOK_APP_ID not found in environment, using fallback')
    appId = '1349075236218599'
  }

  if (!appSecret) {
    console.warn('FACEBOOK_APP_SECRET not found in environment, using fallback')
    appSecret = '7c301f1ac1404565f26462e3c734194c'
  }

  if (!appUrl) {
    console.warn('NEXT_PUBLIC_APP_URL not found in environment, using fallback')
    appUrl = 'https://metaads-production.up.railway.app'
  }

  return {
    FACEBOOK_APP_ID: appId,
    FACEBOOK_APP_SECRET: appSecret,
    APP_URL: appUrl,
    REDIRECT_URI: `${appUrl}/api/oauth/facebook/callback`
  }
}