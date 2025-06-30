# Facebook OAuth Testing Guide

## Current Setup

- **Local URL**: http://localhost:3000
- **Facebook App ID**: 1349075236218599
- **OAuth Callback**: http://localhost:3000/api/auth/callback/facebook

## Testing Steps

1. **Open Browser**: http://localhost:3000
2. **Click "Sign In"** button
3. **Expected Flow**:
   - Redirected to Facebook login
   - Authorize the app
   - Redirected back to http://localhost:3000/dashboard

## Common Issues and Fixes

### Issue 1: "URL Blocked" Error
If you see this error, you need to add the callback URL to your Facebook App:

1. Go to: https://developers.facebook.com/apps/1349075236218599/fb-login/settings/
2. Add to "Valid OAuth Redirect URIs":
   ```
   http://localhost:3000/api/auth/callback/facebook
   ```
3. Click "Save Changes"

### Issue 2: "App Not Set Up" 
Your app might be in development mode. Solutions:
1. Add yourself as a test user in the Facebook App
2. Or make the app live (requires app review)

### Issue 3: Invalid redirect_uri
Make sure NEXTAUTH_URL in .env.local is set to:
```
NEXTAUTH_URL="http://localhost:3000"
```

## Quick Debug Commands

Check current setup:
```bash
curl http://localhost:3000/api/health | jq
```

Check auth endpoint:
```bash
curl -I http://localhost:3000/api/auth/providers
```

## Facebook App Dashboard
Direct link to your app settings:
https://developers.facebook.com/apps/1349075236218599/settings/basic/

## Test Now
1. Open: http://localhost:3000
2. Click "Sign In"
3. Report any errors you see