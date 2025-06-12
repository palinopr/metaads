# Meta API Token Handling Fix

## Problem
The application was experiencing "Malformed access token" errors when calling the Meta (Facebook) API. The issue was that access tokens were being passed with a "Bearer " prefix, which Meta's API doesn't accept.

## Root Cause
When tokens are stored or passed around in the application, they often include the "Bearer " prefix as part of standard OAuth2 authentication headers. However, Meta's API expects just the raw token value without this prefix.

## Solution Implemented

### 1. Token Cleaning in API Routes
We've added token cleaning logic to all API routes that interact with Meta's API:

```typescript
// Clean the access token to remove Bearer prefix
const cleanToken = accessToken.replace(/^Bearer\s+/i, '')
```

### 2. Updated Files
The following API routes have been updated to clean tokens before using them:

1. **`/app/api/meta/route.ts`**
   - Updated `fetchMeta()` helper function
   - Updated `fetchTodayHourlyData()` function

2. **`/app/api/meta/day-week-analysis/route.ts`**
   - Added token cleaning before building API URL

3. **`/app/api/meta/demographics/route.ts`**
   - Updated `fetchBreakdownData()` function

4. **`/app/api/meta/day-hour-insights/route.ts`**
   - Already had token cleaning implemented

### 3. Pattern Applied
All Meta API calls now follow this pattern:

```typescript
// Before making any Meta API call:
const cleanToken = accessToken.replace(/^Bearer\s+/i, '')

// Then use cleanToken in the API URL:
const url = `https://graph.facebook.com/v19.0/...&access_token=${cleanToken}`
```

## Testing
After implementing these fixes:
1. The "Malformed access token" errors should no longer appear
2. API calls to Meta should succeed with proper authentication
3. All features dependent on Meta API data should work correctly

## Prevention
To prevent similar issues in the future:
1. Always use the `formatAccessToken` utility from `@/lib/meta-api-client` when available
2. Add token cleaning as the first step in any function that builds Meta API URLs
3. Consider creating a centralized Meta API client that handles token formatting automatically

## Monitoring
Watch for these error patterns in logs:
- "Malformed access token"
- "Invalid OAuth access token"
- "OAuthException" with code 190

If any of these appear, check that the relevant API route is properly cleaning the token.