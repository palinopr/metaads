# MetaAds Code Examples

This directory contains canonical examples of code patterns used throughout the MetaAds project. These examples serve as reference implementations for common tasks and should be followed when implementing new features.

## Directory Contents

### 1. API Route Pattern (`api-route-pattern.ts`)
Standard pattern for creating API routes with:
- Authentication using NextAuth
- Request validation with Zod
- Proper error handling
- Database operations with Drizzle ORM
- Transaction support

**When to use:** Creating any new API endpoint in `src/app/api/`

### 2. Component Pattern (`component-pattern.tsx`)
Standard pattern for React components with:
- Client-side data fetching
- Loading and error states
- Optimistic updates
- Toast notifications
- Proper TypeScript typing

**When to use:** Creating new UI components in `src/components/`

### 3. Database Pattern (`database-pattern.ts`)
Standard patterns for database operations including:
- Simple queries with error handling
- Complex joins and aggregations
- Transactions for data consistency
- Batch operations
- Performance-optimized queries

**When to use:** Creating new database queries in `src/lib/queries/`

## Key Principles

1. **Authentication First**: Always check user authentication and permissions
2. **Validate Everything**: Use Zod for runtime validation of all inputs
3. **Handle Errors Gracefully**: Provide meaningful error messages to users
4. **Type Safety**: Leverage TypeScript for compile-time safety
5. **Performance Matters**: Use proper database indexes and query optimization

## Common Imports

```typescript
// Authentication
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Database
import { db } from "@/db/drizzle"
import { eq, and, desc } from "drizzle-orm"

// Validation
import { z } from "zod"

// UI Components
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
```

## Meta Ads API Integration

When working with Meta's Marketing API:

```typescript
// Always check permissions
const hasPermission = await checkMetaPermission(userId, 'ads_management')

// Handle rate limits
try {
  const result = await metaApi.getCampaign(campaignId)
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Implement exponential backoff
  }
}

// Use batch requests when possible
const batch = metaApi.createBatch()
batch.add('GET', '/campaigns')
batch.add('GET', '/adsets')
const results = await batch.execute()
```

## Testing Patterns

Always include tests for new features:

```typescript
// Unit test example
describe('Campaign API', () => {
  it('should require authentication', async () => {
    const response = await fetch('/api/campaigns')
    expect(response.status).toBe(401)
  })
  
  it('should validate input', async () => {
    const response = await fetch('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' })
    })
    expect(response.status).toBe(400)
  })
})
```

## Performance Guidelines

1. Use React Server Components by default
2. Implement proper caching strategies
3. Paginate large data sets
4. Use database indexes on frequently queried fields
5. Minimize client-side JavaScript bundle size

## Security Best Practices

1. Never expose sensitive data in API responses
2. Always validate and sanitize user inputs
3. Use environment variables for secrets
4. Implement proper CORS policies
5. Log security-relevant events

Remember: When in doubt, look for existing patterns in the codebase before creating new ones.