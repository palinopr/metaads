# API Access & Troubleshooting Guide

This document contains all API endpoints, credentials locations, and troubleshooting procedures for MetaAds.

## Available APIs & Services

### 1. Vercel Environment
- **Platform**: Vercel (Next.js hosting)
- **Access**: Environment variables are set in Vercel dashboard
- **CLI**: Install with `npm i -g vercel` if needed
- **Commands**:
  ```bash
  vercel env pull        # Pull env vars from Vercel
  vercel env ls          # List environment variables
  vercel logs           # View function logs
  vercel --prod         # Deploy to production
  ```

### 2. Supabase API
- **URL**: Available in `NEXT_PUBLIC_SUPABASE_URL`
- **Anon Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Service Role Key**: `SUPABASE_SERVICE_ROLE_KEY` (backend only)
- **Features**:
  - Database (PostgreSQL)
  - Authentication
  - Real-time subscriptions
  - Storage

### 3. Meta (Facebook) Ads API
- **App ID**: `FACEBOOK_APP_ID` / `NEXT_PUBLIC_FACEBOOK_APP_ID`
- **App Secret**: `FACEBOOK_APP_SECRET`
- **Base URL**: `https://graph.facebook.com/v20.0`
- **OAuth Scopes Required**:
  - `ads_management`
  - `ads_read`
  - `business_management`
  - `email`
  - `public_profile`

### 4. AI Services
- **OpenAI**: `OPENAI_API_KEY`
- **Anthropic**: `ANTHROPIC_API_KEY`
- **Provider Selection**: `AI_PROVIDER` env var

### 5. Database
- **Connection**: `DATABASE_URL`
- **Direct Connection**: `DIRECT_URL`
- **Management**: Drizzle ORM with PostgreSQL

## Self-Service Error Resolution

### Common API Errors & Fixes

#### 1. Database Connection Errors
```typescript
// Error: Connection timeout
// Fix: Check DATABASE_URL format and encoding
const encodedPassword = encodeURIComponent('password-with-!@#$')
const DATABASE_URL = `postgresql://user:${encodedPassword}@host:5432/db`
```

#### 2. Supabase Auth Errors
```typescript
// Error: Invalid API key
// Fix: Ensure keys match environment
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// For server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)
```

#### 3. Meta API Rate Limits
```typescript
// Error: Rate limit exceeded
// Fix: Implement exponential backoff
async function callMetaAPI(endpoint: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(endpoint)
      if (response.status === 429) {
        const delay = Math.pow(2, i) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      return response
    } catch (error) {
      if (i === retries - 1) throw error
    }
  }
}
```

#### 4. NextAuth Session Errors
```typescript
// Error: No session found
// Fix: Check auth configuration
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  // Continue with authenticated request
}
```

## Environment Variable Debugging

### Check Available Variables
```bash
# In development
npm run dev
# Check console for loaded env vars

# In production (Vercel)
vercel env pull .env.local
cat .env.local
```

### Required Environment Variables
```env
# Core Database
DATABASE_URL=
DIRECT_URL=

# Authentication
NEXTAUTH_URL=
NEXTAUTH_SECRET=
ENCRYPTION_KEY=

# Facebook/Meta
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
NEXT_PUBLIC_FACEBOOK_APP_ID=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services
AI_PROVIDER=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Admin
ADMIN_EMAILS=
NEXT_PUBLIC_ADMIN_EMAILS=
```

## API Testing Commands

### Test Database Connection
```bash
npm run db:studio
# Should open Drizzle Studio if connection works
```

### Test Meta API
```bash
# In your code, add this test endpoint
// app/api/test/meta/route.ts
export async function GET() {
  const testUrl = `https://graph.facebook.com/v20.0/me?access_token=${userAccessToken}`
  const response = await fetch(testUrl)
  return Response.json(await response.json())
}
```

### Test Supabase Connection
```typescript
// app/api/test/supabase/route.ts
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('users').select('count')
  return Response.json({ data, error })
}
```

## Deployment Troubleshooting

### Vercel Deployment Issues
```bash
# Check build logs
vercel logs --since 1h

# Redeploy with clean cache
vercel --force

# Check environment variables
vercel env ls
```

### Database Migration Issues
```bash
# Generate fresh migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Reset and push schema (CAUTION: data loss)
npm run db:push
```

## API Response Patterns

### Success Response
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Context Engineering Integration

To use this in your workflow:

1. **Before implementing**: Check this file for API patterns
2. **During errors**: Reference the self-service fixes
3. **For new APIs**: Add documentation here
4. **In PRPs**: Reference specific sections

Example PRP reference:
```markdown
### Documentation to Read
- [ ] API Access: API_ACCESS.md#meta-api-rate-limits
- [ ] Error Handling: API_ACCESS.md#common-api-errors-fixes
```

## Quick Debug Checklist

When encountering API errors:

1. [ ] Check environment variables are set
2. [ ] Verify API keys are valid and not expired
3. [ ] Check rate limits and quotas
4. [ ] Look for typos in endpoint URLs
5. [ ] Verify authentication tokens
6. [ ] Check CORS settings for client-side calls
7. [ ] Review server logs for detailed errors
8. [ ] Test with minimal reproduction

---

**Remember**: Most API errors are configuration issues. Check environment variables first!