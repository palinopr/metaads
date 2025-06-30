# Meta Ads Admin Debug Guide

## Overview
This guide provides comprehensive debugging tools and endpoints for resolving admin access issues in the Meta Ads platform.

## Quick Fix for Admin Access

The issue is that the system is checking for `jaime@outletmedia.com` but you're logging in as `jaime@outletmedia.net`.

### Option 1: Update Environment Variables (Recommended)
Run the provided script to automatically update all environment files:
```bash
node scripts/update-admin-config.js
```

Or manually update your `.env.local` file:
```env
NEXT_PUBLIC_ADMIN_EMAILS=jaime@outletmedia.com,jaime@outletmedia.net
```

### Option 2: Use Test Authentication Bypass
Add to your `.env.local`:
```env
ENABLE_TEST_AUTH_BYPASS=true
TEST_AUTH_BYPASS_EMAIL=jaime@outletmedia.net
TEST_AUTH_BYPASS_TOKEN=test-bypass-token
```

## Testing Endpoints

### 1. Debug API - Complete System Information
**Endpoint:** `GET /api/test/debug`

**Usage:**
```bash
curl http://localhost:3000/api/test/debug
```

**With Auth Bypass:**
```bash
curl -H "X-Test-Auth-Token: test-bypass-token" http://localhost:3000/api/test/debug
```

**Returns:**
- Current session information
- Admin check details
- Environment variables
- Database users and sessions
- Request headers and cookies

### 2. Session API - Test Authentication
**Endpoint:** `GET /api/test/session`

**Usage:**
```bash
curl http://localhost:3000/api/test/session
```

**Create Test Session:**
```bash
curl -X POST http://localhost:3000/api/test/session \
  -H "Content-Type: application/json" \
  -d '{"email": "jaime@outletmedia.net", "name": "Test User"}'
```

### 3. Admin Debug Override
**Endpoint:** `GET /api/admin/debug-override`

**Usage:**
```bash
curl -H "X-Test-Auth-Token: test-bypass-token" http://localhost:3000/api/admin/debug-override
```

**Returns detailed information about:**
- Current user email vs admin emails
- Character-by-character comparison
- Suggestions for fixes

### 4. Test Admin Check
**Endpoint:** `POST /api/test/debug`

**Usage:**
```bash
curl -X POST http://localhost:3000/api/test/debug \
  -H "Content-Type: application/json" \
  -d '{"action": "test-admin-check", "email": "jaime@outletmedia.net"}'
```

## External Testing Tool

Open `/public/test-api.html` in your browser for a GUI testing interface:
```
http://localhost:3000/test-api.html
```

Features:
- Test all debug endpoints
- Create test sessions
- Use authentication bypass
- View detailed responses

## Authentication Bypass Methods

### Method 1: Header-based
Add header to any request:
```
X-Test-Auth-Token: test-bypass-token
```

### Method 2: Query Parameter
Add to URL:
```
?test-auth-token=test-bypass-token
```

### Method 3: Session Cookie
Set cookie in browser:
```
Name: next-auth.session-token
Value: [session-token-from-create-session-endpoint]
```

## Debugging Workflow

1. **Check Current Configuration:**
   ```bash
   curl http://localhost:3000/api/test/debug | jq .adminCheck
   ```

2. **Verify Email Match:**
   ```bash
   curl -X POST http://localhost:3000/api/test/debug \
     -H "Content-Type: application/json" \
     -d '{"action": "test-admin-check", "email": "jaime@outletmedia.net"}' | jq
   ```

3. **Create Test Session:**
   ```bash
   curl -X POST http://localhost:3000/api/test/session \
     -H "Content-Type: application/json" \
     -d '{"email": "jaime@outletmedia.net"}' | jq .session.token
   ```

4. **Test with Bypass:**
   ```bash
   curl -H "X-Test-Auth-Token: test-bypass-token" \
     http://localhost:3000/api/admin/debug-override | jq
   ```

## Common Issues and Solutions

### Issue: "Are you admin? No"
**Cause:** Email mismatch (`.net` vs `.com`)
**Solution:** Update `NEXT_PUBLIC_ADMIN_EMAILS` to include both emails

### Issue: Not authenticated
**Cause:** No valid session
**Solution:** Use test authentication bypass or create a test session

### Issue: Environment variables not loading
**Cause:** Server needs restart after .env changes
**Solution:** Restart the development server

## Security Notes

⚠️ **WARNING:** The test authentication bypass should ONLY be used in development!

In production:
- Set `ENABLE_TEST_AUTH_BYPASS=false`
- Remove test bypass tokens from environment
- Use proper authentication only

## Additional Resources

- Check current admin emails: `/dashboard/debug-admin`
- View session details: `/dashboard/admin-test`
- API test tool: `/test-api.html`