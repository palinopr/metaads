# Product Requirements Prompt (PRP) - Dashboard Quick Stats Widget

## 0. Pre-Implementation Setup Verification

Before starting implementation, verify:
- [ ] Development server is running (`curl -I http://localhost:3000`)
- [ ] No existing TypeScript errors (`npm run typecheck`)
- [ ] No linting errors (`npm run lint`)
- [ ] Database is accessible (`npm run db:studio`)
- [ ] Latest code is pulled (`git pull origin main`)
- [ ] Dependencies are up to date (`npm install`)

If any check fails, see `SETUP.md` or `COMMON_ISSUES.md` for resolution.

## 1. Goal / Why / What

### Goal
Add a Quick Stats widget to the main dashboard that displays key performance metrics in a card layout, providing users with immediate visibility into their advertising performance.

### Why
- Users need quick access to their most important metrics without navigating to multiple pages
- Current dashboard requires users to select accounts and wait for data loading
- Immediate visibility of key metrics improves user engagement and decision-making
- Reduces time to insight for advertising performance monitoring

### What
- Quick Stats widget with four key metrics: Total Campaigns, Active Campaigns, Today's Spend, Average CTR
- Automatic data loading on dashboard visit
- Responsive grid layout (2x2 on mobile, 1x4 on desktop)
- Proper loading and error states
- 1-minute caching to reduce database load

## 2. All Needed Context

### Documentation to Read
- [ ] Meta Marketing API: /marketing-api/reference/ad-insights (for understanding metrics)
- [ ] Next.js 15 App Router: /docs/app/building-your-application/data-fetching/fetching
- [ ] Project Docs: REQUIREMENTS_SPEC.md sections on Dashboard and Metrics
- [ ] Database Schema: campaigns, campaignInsights, metaAdAccounts tables

### Examples to Reference
- [ ] Similar component: `src/components/campaigns/campaign-metrics.tsx` (MetricCard component)
- [ ] API pattern: `src/app/api/campaigns/route.ts` (GET method with summary calculation)
- [ ] Database query: `src/examples/database-pattern.ts` (getUserDashboardData function)
- [ ] Component pattern: `src/examples/component-pattern.tsx` (data fetching pattern)

### Known Constraints & Gotchas
- Meta API rate limits: Not applicable (using internal database)
- OAuth scope requirements: ads_read (already handled by existing auth)
- Database considerations: Need efficient query for campaign counts and today's metrics
- UI/UX requirements: Must match existing card styling patterns
- Performance: Dashboard load time must remain under 1 second

## 3. Implementation Blueprint

### Data Models
```typescript
// Quick stats data structure
interface QuickStats {
  totalCampaigns: number
  activeCampaigns: number
  todaySpend: number // In user's currency
  averageCtr: number // Percentage
  currency: string // For formatting spend
  loading: boolean
  error: string | null
}

// API Response type
interface QuickStatsResponse {
  stats: QuickStats
  cachedAt?: string
  error?: string
}
```

### Database Changes
No new tables needed. Will use existing:
- `campaigns` table for campaign counts
- `campaignInsights` table for today's spend and CTR
- `metaAdAccounts` table for currency information

### Task List
1. [ ] API Implementation
   - [ ] Create `/api/dashboard/quick-stats/route.ts`
   - [ ] Implement efficient database query for stats
   - [ ] Add 1-minute caching with proper cache headers
   - [ ] Handle cases where user has no selected account

2. [ ] Frontend Component
   - [ ] Create `src/components/dashboard/quick-stats-widget.tsx`
   - [ ] Implement data fetching with loading state
   - [ ] Add error handling with retry capability
   - [ ] Use existing MetricCard pattern for consistency

3. [ ] Dashboard Integration
   - [ ] Update `src/app/dashboard/page.tsx` to include Quick Stats widget
   - [ ] Position widget at top of dashboard
   - [ ] Ensure proper spacing and layout

4. [ ] Responsive Design
   - [ ] Implement 2x2 grid on mobile (< 768px)
   - [ ] Implement 1x4 grid on desktop (>= 768px)
   - [ ] Test on various screen sizes

5. [ ] Testing & Validation
   - [ ] Test with users who have no campaigns
   - [ ] Test with users who have campaigns but no today's data
   - [ ] Verify currency formatting for different currencies
   - [ ] Test error states and retry functionality

### Pseudocode / Key Logic
```typescript
// API Route: /api/dashboard/quick-stats/route.ts
async function GET(request: Request) {
  // 1. Get session and verify auth
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized
  
  // 2. Check cache headers
  const cacheKey = `quick-stats:${session.user.id}`
  
  // 3. Get selected ad account with currency
  const account = await getSelectedAccount(session.user.id)
  if (!account) return { stats: defaultEmptyStats }
  
  // 4. Execute optimized query for stats
  const stats = await db.transaction(async (tx) => {
    // Get campaign counts
    const [campaignCounts] = await tx.select({
      total: count(),
      active: sum(case when status = 'ACTIVE' then 1 else 0)
    }).from(campaigns)
    .where(and(
      eq(campaigns.userId, session.user.id),
      eq(campaigns.adAccountId, account.id)
    ))
    
    // Get today's metrics
    const [todayMetrics] = await tx.select({
      spend: sum(campaignInsights.spend),
      impressions: sum(campaignInsights.impressions),
      clicks: sum(campaignInsights.clicks)
    }).from(campaignInsights)
    .innerJoin(campaigns, eq(campaigns.id, campaignInsights.campaignId))
    .where(and(
      eq(campaigns.userId, session.user.id),
      eq(campaignInsights.date, today())
    ))
    
    return {
      totalCampaigns: campaignCounts.total || 0,
      activeCampaigns: campaignCounts.active || 0,
      todaySpend: (todayMetrics.spend || 0) / 100, // Convert from cents
      averageCtr: calculateCtr(todayMetrics.clicks, todayMetrics.impressions)
    }
  })
  
  // 5. Return with cache headers
  return NextResponse.json({ 
    stats: { ...stats, currency: account.currency }
  }, {
    headers: { 'Cache-Control': 'private, max-age=60' }
  })
}
```

## 4. Integration Points

### API Routes
- `GET /api/dashboard/quick-stats` - Fetch aggregated quick stats

### Database Queries
- `getQuickStatsForUser` - Optimized query for dashboard metrics
- Uses existing `campaigns` and `campaignInsights` tables

### External Services
- None - all data from internal database

### Frontend Routes
- `/dashboard` - Main dashboard page where widget is displayed

## 5. Validation & Testing

### Step 0: Environment Verification
```bash
# Ensure dev server is still running
curl -I http://localhost:3000 || npm run dev

# Check for any background errors
tail -n 50 dev.log  # if running in background

# Verify database connection
npm run db:studio
```

### Step 1: Syntax & Type Checking
```bash
npm run lint
npm run typecheck

# If errors, check COMMON_ISSUES.md for solutions
```

### Step 2: Build Verification
```bash
npm run build

# If memory errors:
# NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Step 3: Unit Tests
```bash
# Test the stats calculation logic
npm test -- quick-stats

# Test the component rendering
npm test -- QuickStatsWidget
```

### Step 4: Integration Testing
- [ ] Create test user with no campaigns - verify shows zeros
- [ ] Create test user with campaigns - verify correct counts
- [ ] Test with different time zones for "today's spend"
- [ ] Verify caching works (check network tab for 304 responses)
- [ ] Test error state by stopping database

### Step 5: Performance Testing
- [ ] Measure dashboard load time with widget
- [ ] Verify API response time < 200ms (after cache)
- [ ] Check database query execution plan
- [ ] Test with 1000+ campaigns

## 6. Success Criteria

### Functional Requirements
- [ ] Widget displays four metrics as specified
- [ ] Metrics update when navigating to dashboard
- [ ] Loading skeleton shows while fetching
- [ ] Error state with retry button works
- [ ] Numbers format correctly (currency, percentage)

### Technical Requirements
- [ ] No TypeScript errors
- [ ] Component follows existing patterns
- [ ] API implements proper caching
- [ ] Database queries are optimized
- [ ] Responsive layout works correctly

### Performance Requirements
- [ ] Dashboard loads in < 1 second
- [ ] API responds in < 200ms (cached)
- [ ] No memory leaks in component
- [ ] Handles 50+ concurrent users

## 7. Anti-Patterns to Avoid

### Common Mistakes
- ❌ Making separate API calls for each metric
- ❌ Not handling the "no account selected" case
- ❌ Forgetting to convert cents to dollars for display
- ❌ Missing loading states during data fetch
- ❌ Not caching the aggregated results

### MetaAds-Specific
- ❌ Using the Meta API directly (should use internal DB)
- ❌ Creating new database tables (use existing schema)
- ❌ Not following the existing MetricCard pattern
- ❌ Ignoring the date range context (widget shows today only)
- ❌ Making synchronous database calls

### Setup & Environment Pitfalls
- ❌ Not checking if campaigns table has data
- ❌ Forgetting about time zones for "today"
- ❌ Not handling different currency formats
- ❌ Missing error boundaries in the component
- ❌ Not testing with empty states

## 8. Rollback Plan

If issues arise:
1. Remove QuickStatsWidget from dashboard page
2. Delete the new API route
3. Clear any cached data
4. Monitor error logs for any lingering issues

## 9. Documentation Updates

After implementation:
- [ ] Add Quick Stats widget to component documentation
- [ ] Document the caching strategy in API docs
- [ ] Update dashboard user guide
- [ ] Add performance metrics to monitoring

---

## Implementation Example

### Component Structure
```typescript
// src/components/dashboard/quick-stats-widget.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  MousePointer,
  RefreshCw
} from "lucide-react"

interface QuickStatsWidgetProps {
  className?: string
}

export function QuickStatsWidget({ className }: QuickStatsWidgetProps) {
  const [stats, setStats] = useState<QuickStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setError(null)
      setLoading(true)
      
      const response = await fetch('/api/dashboard/quick-stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return <QuickStatsWidgetSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription className="flex items-center justify-between">
          {error}
          <Button size="sm" variant="outline" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`grid gap-3 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      <MetricCard
        title="Total Campaigns"
        value={stats?.totalCampaigns || 0}
        icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
      />
      <MetricCard
        title="Active Campaigns"
        value={stats?.activeCampaigns || 0}
        icon={<TrendingUp className="h-4 w-4 text-green-500" />}
      />
      <MetricCard
        title="Today's Spend"
        value={formatCurrency(stats?.todaySpend || 0, stats?.currency || 'USD')}
        icon={<DollarSign className="h-4 w-4 text-red-500" />}
      />
      <MetricCard
        title="Average CTR"
        value={`${stats?.averageCtr?.toFixed(2) || '0.00'}%`}
        icon={<MousePointer className="h-4 w-4 text-blue-500" />}
      />
    </div>
  )
}
```

**Remember**: Follow existing patterns, validate continuously, and prioritize user experience and performance.