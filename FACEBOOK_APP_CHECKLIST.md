# Facebook App Configuration Checklist

## ✅ Basic Settings
**Location**: Settings → Basic
- [ ] **App ID**: 1349075236218599
- [ ] **App Secret**: Configured in environment variables
- [ ] **App Mode**: Development (not Live)
- [ ] **App Domains**: 
  - `localhost` (for development)
  - `metaads-web.vercel.app` (for production)
- [ ] **Privacy Policy URL**: Add any URL (even placeholder like https://metaads-web.vercel.app/privacy)
- [ ] **Terms of Service URL**: Add any URL (even placeholder like https://metaads-web.vercel.app/terms)

## ✅ Facebook Login Settings
**Location**: Facebook Login → Settings
- [ ] **Client OAuth Login**: ON
- [ ] **Web OAuth Login**: ON
- [ ] **Valid OAuth Redirect URIs**:
  ```
  http://localhost:3000/api/auth/callback/facebook
  https://metaads-web.vercel.app/api/auth/callback/facebook
  ```
- [ ] **Enforce HTTPS**: ON (for production)
- [ ] **Use Strict Mode for Redirect URIs**: Your choice (ON is more secure)

## ✅ App Roles
**Location**: Roles → Roles or Test Users
- [ ] You are added as:
  - Administrator OR
  - Developer OR
  - Test User
- [ ] If using Test Users, create one and use those credentials

## ✅ App Review / Permissions
**Location**: App Review → Permissions and Features
- [ ] Basic permissions should be available:
  - `email`
  - `public_profile`
- [ ] No additional permissions needed for basic auth

## ✅ Use Cases (if available)
**Location**: Use Cases
- [ ] "Authenticate and request data from users with Facebook Login" is added

## ⚠️ Common Issues

### "App not set up"
- App is in development mode and you're not a test user/admin
- Solution: Add yourself as test user or admin

### "URL Blocked"
- Redirect URI not in whitelist
- Solution: Add exact callback URLs to Valid OAuth Redirect URIs

### "This app needs at least one supported permission"
- App doesn't have basic permissions configured
- Solution: Ensure email and public_profile are available

### "Invalid App ID"
- Wrong App ID in environment variables
- Solution: Verify FACEBOOK_APP_ID matches dashboard

## 🔍 Quick Verification

1. Check your role: https://developers.facebook.com/apps/1349075236218599/roles/roles/
2. Check login settings: https://developers.facebook.com/apps/1349075236218599/fb-login/settings/
3. Check basic settings: https://developers.facebook.com/apps/1349075236218599/settings/basic/

## 📝 Required Fields for Public Apps

If you plan to make the app public later, you'll need:
- Privacy Policy URL (required)
- Terms of Service URL (required)
- App Icon
- App Category
- Business Verification (for some features)