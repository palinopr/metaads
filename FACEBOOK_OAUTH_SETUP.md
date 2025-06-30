# Facebook OAuth Setup Guide

## Prerequisites

1. Facebook Developer Account: https://developers.facebook.com/
2. Facebook App created and configured
3. Environment variables properly set

## Facebook App Configuration

### 1. Basic Settings

In your Facebook App Dashboard:

1. Go to **Settings > Basic**
2. Add your app domains:
   - For local development: `localhost`
   - For production: `metaads-web.vercel.app` (or your custom domain)
3. Set **Privacy Policy URL** and **Terms of Service URL** (required for production)

### 2. Facebook Login Setup

1. In the left sidebar, click **Add Product**
2. Find **Facebook Login** and click **Set Up**
3. Choose **Web**
4. Set your **Site URL**: `http://localhost:3000` (for development)

### 3. Valid OAuth Redirect URIs

**IMPORTANT**: Add these exact URLs to **Facebook Login > Settings**:

#### For Local Development:
```
http://localhost:3000/api/auth/callback/facebook
```

#### For Production:
```
https://metaads-web.vercel.app/api/auth/callback/facebook
https://metaads-web-git-main-palinos-projects.vercel.app/api/auth/callback/facebook
https://metaads-45mzrjtsy-palinos-projects.vercel.app/api/auth/callback/facebook
```

**Note**: Replace with your actual production URLs if different.

### 4. App Mode

- For testing: Set to **Development Mode**
- For production: Complete App Review and switch to **Live Mode**

## Environment Variables

Ensure these are set correctly:

```env
# Local Development (.env.local)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Production (Vercel Dashboard)
NEXTAUTH_URL=https://metaads-web.vercel.app
# Keep other variables the same
```

### Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Common Errors and Solutions

### Error: "URL Blocked"
**Message**: "This redirect URL is not allowed for this application"

**Solution**: 
- Add the exact callback URL to Facebook App settings
- Check for trailing slashes
- Ensure protocol matches (http vs https)

### Error: "Invalid OAuth Redirect URI"
**Message**: "The redirect_uri URL must be absolute"

**Solution**:
- Verify `NEXTAUTH_URL` is set correctly
- Don't include trailing slash in `NEXTAUTH_URL`
- Restart your dev server after changing env variables

### Error: "App Not Set Up"
**Message**: "This app is still in development mode"

**Solution**:
- Add test users in App Roles > Test Users
- Or switch app to Live mode (requires app review)

### Error: "Invalid Client ID"
**Message**: "Invalid App ID"

**Solution**:
- Double-check `FACEBOOK_APP_ID` in your env
- Ensure no extra spaces or quotes
- Verify the App ID in Facebook Developer Dashboard

## Testing Facebook OAuth

1. Start your dev server: `npm run dev`
2. Visit: http://localhost:3000/api/health
3. Check all services are "healthy"
4. Go to: http://localhost:3000
5. Click "Sign In"
6. You should be redirected to Facebook
7. After authorization, you'll be redirected back to your app

## Debug Mode

To see detailed NextAuth errors, set:

```env
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

Then check the console and network tab for detailed error messages.

## Verify Setup

Run this checklist:

- [ ] Facebook App ID and Secret are correct
- [ ] OAuth redirect URIs are added to Facebook App
- [ ] Environment variables are loaded (check /api/health)
- [ ] NEXTAUTH_SECRET is generated and set
- [ ] NEXTAUTH_URL matches your current environment
- [ ] App domain is added in Facebook settings
- [ ] Facebook Login product is enabled

## Need Help?

1. Check browser console for errors
2. Visit `/api/health` to verify configuration
3. Check Facebook App Dashboard for any warnings
4. Ensure your Facebook App is not in "Disabled" state