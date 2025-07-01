# Context Findings

## Current Implementation Analysis

### Meta/Facebook Integration
- **OAuth Implementation**: Complete at `/src/app/api/auth/meta/callback/route.ts`
- **Token Management**: Long-lived tokens (60 days) stored in `meta_connections` table
- **Ad Account Fetching**: Working with pagination at `/src/app/api/connections/meta/accounts/route.ts`
- **Campaign Operations**: Read-only implementation at `/src/app/api/campaigns/route.ts`

### AI Agent System
**Architecture:**
- Hybrid TypeScript/Python implementation
- Core system at `/src/lib/ai/agent-system.ts`
- Python agents at `/src/agents/campaign-creator.py`
- Memory system for context retention
- Multi-agent orchestrator for complex tasks

**Agent Types Implemented:**
1. Campaign Creation Agent
2. Optimization Agent
3. Creative Agent
4. Analytics Agent

### Multi-Account Support
- Database supports multiple ad accounts per user
- Account selection mechanism with `is_selected` flag
- Proper pagination for large account lists
- Currency and timezone handling per account

### Real-time Monitoring
- **Current State**: Not implemented
- **API Polling**: Current approach for updates
- **No WebSocket/SSE**: Infrastructure not in place

### Database Schema
**Existing Tables:**
- `users`, `accounts`, `sessions` (auth)
- `meta_connections` (OAuth tokens)
- `meta_ad_accounts` (ad accounts)
- `agent_configs` (AI configurations)

**Missing Tables:**
- `campaigns`
- `ad_sets`
- `ads`
- `campaign_insights`
- `optimization_logs`

## Technical Constraints

### Limitations
1. **No Campaign Persistence**: Campaigns fetched but not stored
2. **Incomplete Meta API**: Only read operations implemented
3. **Mock Data Usage**: Some endpoints return hardcoded data
4. **No Real-time Updates**: Requires manual refresh

### Security Measures
- Proper OAuth 2.0 flow
- Token encryption in database
- Session-based authentication
- Environment variable usage

## Integration Points
- Meta Graph API v18.0
- OpenAI (GPT-3.5/4)
- Anthropic Claude
- Supabase for database
- Vercel for deployment

## Development Patterns
- Next.js 14 App Router
- React Server Components
- TypeScript throughout
- Drizzle ORM
- Tailwind CSS + shadcn/ui

## Key Files for Modification

### For Multi-Account Management:
- `/src/app/api/connections/meta/accounts/route.ts`
- `/src/db/schema.ts` (meta_ad_accounts table)
- `/src/app/(app)/dashboard/connections/page.tsx`

### For AI Autonomous Operation:
- `/src/lib/ai/agent-system.ts`
- `/src/lib/ai/agents/index.ts`
- `/src/app/api/ai/agents/route.ts`

### For Real-time Monitoring:
- Need to create new WebSocket/SSE infrastructure
- `/src/app/api/campaigns/[id]/insights/route.ts` (to be created)
- `/src/components/campaign/performance-monitor.tsx` (to be created)

### For Campaign Management:
- `/src/app/api/campaigns/route.ts` (extend for CRUD)
- `/src/db/schema.ts` (add campaign tables)
- `/src/lib/meta/campaign-service.ts` (to be created)

## Similar Features Analysis

### Dashboard Implementation
- Clean component structure at `/src/app/(app)/dashboard`
- Uses server components for data fetching
- Responsive design with Tailwind

### AI Lab Feature
- Located at `/src/app/(app)/dashboard/ai-lab`
- Chat-based interface for AI interactions
- Campaign generation workflow

## Performance Considerations
- No caching layer implemented
- Direct API calls without rate limiting
- No background job processing
- Missing database indexes