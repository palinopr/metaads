# MetaAds Troubleshooting Guide

This guide helps you resolve common issues independently. Check here first before asking for help.

## Quick Diagnostic Commands

```bash
# Check if all dependencies are installed
npm list

# Verify environment setup
npm run dev
# Look for missing env var warnings

# Test database connection
npm run db:studio

# Check TypeScript errors
npm run typecheck

# Lint issues
npm run lint
```

## Common Issues & Solutions

### 1. Build Failures

#### TypeScript Errors
```bash
# Error: Type 'X' is not assignable to type 'Y'
npm run typecheck

# Common fixes:
# 1. Add proper type annotations
# 2. Use type assertions for third-party libs
# 3. Check for missing imports
```

#### Missing Dependencies
```bash
# Error: Cannot find module 'X'
npm install
# or
npm install [missing-package]
```

#### Environment Variable Issues
```bash
# Error: Missing required environment variable
cp .env.example .env
# Fill in all required values

# For Vercel deployment
vercel env pull
```

### 2. Database Issues

#### Connection Failures
```bash
# Error: Connection timeout
# Fix: Check DATABASE_URL format
postgresql://user:password@host:5432/database

# If password has special chars (!@#$%)
# URL encode them: ! becomes %21
```

#### Migration Errors
```bash
# Error: Migration failed
npm run db:generate
npm run db:migrate

# Reset database (CAUTION: data loss)
npm run db:push
```

#### Query Errors
```typescript
// Error: Column doesn't exist
// Fix: Regenerate types
npm run db:generate

// Error: Relation doesn't exist
// Fix: Check schema matches database
npm run db:studio
```

### 3. Authentication Issues

#### NextAuth Errors
```typescript
// Error: No session found
// Fix 1: Check NEXTAUTH_SECRET is set
// Fix 2: Verify NEXTAUTH_URL matches deployment

// Error: OAuth callback error
// Fix: Update Facebook app settings
// - Add correct redirect URLs
// - Verify app is in production mode
```

#### Facebook OAuth Issues
```bash
# Error: Invalid OAuth redirect
# Fix: Add these URLs to Facebook app:
# Development: http://localhost:3000/api/auth/callback/facebook
# Production: https://yourdomain.com/api/auth/callback/facebook

# Error: Missing permissions
# Fix: Request these scopes:
# - email
# - public_profile
# - ads_management
# - ads_read
```

### 4. Meta Ads API Issues

#### Rate Limiting
```typescript
// Error: API call limit reached
// Fix: Implement exponential backoff
async function callWithRetry(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      if (error.code === 80000 && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000))
        continue
      }
      throw error
    }
  }
}
```

#### Permission Errors
```typescript
// Error: (#10) Permission denied
// Fix: Check user has granted required permissions
const requiredPermissions = ['ads_management', 'ads_read']
const grantedPermissions = session.user.permissions || []
const hasPermissions = requiredPermissions.every(p => 
  grantedPermissions.includes(p)
)
```

#### Invalid Parameters
```typescript
// Error: Invalid parameter
// Fix: Validate against Meta's API docs
// Common issues:
// - Wrong date format (use YYYY-MM-DD)
// - Invalid enum values
// - Missing required fields
```

### 5. UI/Component Issues

#### Hydration Errors
```typescript
// Error: Hydration mismatch
// Fix 1: Use useEffect for client-only code
useEffect(() => {
  // Client-only code here
}, [])

// Fix 2: Use dynamic imports
const ClientOnlyComponent = dynamic(
  () => import('./ClientComponent'),
  { ssr: false }
)
```

#### State Management Issues
```typescript
// Error: Too many re-renders
// Fix: Check dependency arrays
useEffect(() => {
  // Effect code
}, [/* only necessary deps */])

// Fix: Use useCallback for functions
const handleClick = useCallback(() => {
  // Handler code
}, [/* deps */])
```

### 6. Deployment Issues

#### Vercel Build Failures
```bash
# Check build logs
vercel logs --since 1h

# Common fixes:
# 1. Clear cache and rebuild
vercel --force

# 2. Check all env vars are set
vercel env ls

# 3. Ensure build command is correct
# Should be: npm run build
```

#### Environment Mismatches
```bash
# Development works but production fails
# Fix: Ensure all env vars are in Vercel
vercel env add VARIABLE_NAME

# Check for NEXT_PUBLIC_ prefix
# Client-side vars need NEXT_PUBLIC_ prefix
```

### 7. Performance Issues

#### Slow API Responses
```typescript
// Fix 1: Add indexes to database
// In schema:
@@index([userId, createdAt])

// Fix 2: Implement caching
import { unstable_cache } from 'next/cache'

const getCachedData = unstable_cache(
  async (id: string) => fetchData(id),
  ['cache-key'],
  { revalidate: 60 } // 1 minute
)
```

#### Memory Leaks
```typescript
// Fix: Clean up subscriptions
useEffect(() => {
  const subscription = subscribe()
  return () => subscription.unsubscribe()
}, [])

// Fix: Avoid storing large objects in state
// Use pagination instead
```

## Error Patterns to Watch For

### Pattern 1: Async/Await Issues
```typescript
// Bad: Missing await
const data = fetch('/api/data') // Returns Promise

// Good: Proper await
const data = await fetch('/api/data')
```

### Pattern 2: Type Safety
```typescript
// Bad: Using any
const processData = (data: any) => { }

// Good: Proper types
const processData = (data: Campaign) => { }
```

### Pattern 3: Error Boundaries
```typescript
// Always wrap async operations
try {
  const result = await riskyOperation()
} catch (error) {
  console.error('Operation failed:', error)
  // Handle gracefully
}
```

## Debug Utilities

### Add Debug Logging
```typescript
// In development only
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', { data, error })
}
```

### API Response Inspection
```typescript
// Add to API routes for debugging
export async function GET(request: Request) {
  console.log('Headers:', Object.fromEntries(request.headers))
  console.log('URL:', request.url)
  // ... rest of handler
}
```

### Database Query Logging
```typescript
// Enable Drizzle query logging
const db = drizzle(client, {
  logger: true
})
```

## When All Else Fails

1. **Clear all caches**:
   ```bash
   rm -rf .next
   rm -rf node_modules
   npm install
   ```

2. **Check GitHub issues**:
   - Search MetaAds repo issues
   - Check Next.js issues
   - Check library specific issues

3. **Minimal reproduction**:
   - Create smallest possible example
   - Remove unrelated code
   - Test in isolation

4. **Environment reset**:
   ```bash
   # Start fresh
   git stash
   npm install
   npm run dev
   ```

---

**Remember**: Most issues are configuration problems. Check environment variables and API credentials first!