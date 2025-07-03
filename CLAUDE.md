# MetaAds - Global AI Assistant Rules

This document contains critical rules and context for AI assistants working on the MetaAds project.

## Project Overview
MetaAds is an AI-powered Meta (Facebook) Ads management platform - "Cursor for Meta Ads". It automates campaign creation, optimization, and monitoring through conversational AI interfaces.

## Pre-Development Checklist

Before implementing any features, ensure:
1. **Project is running**: Verify with `curl -I http://localhost:3000`
2. **Dependencies installed**: Check `node_modules` exists (npm install if needed)
3. **Environment configured**: Verify `.env` file exists (copy from .env.example)
4. **Database ready**: Run `npm run db:push` for new setups
5. **No existing errors**: Run `npm run lint && npm run typecheck`
6. **Development server active**: Check `ps aux | grep "next dev"`

If any check fails, see `SETUP.md` for resolution.

## Critical Rules

### 0. GITHUB PUSH RULE - NEVER FORGET!
**MANDATORY**: After EVERY change to the codebase:
1. Create a descriptive commit: `git add . && git commit -m "feat/fix/docs: description"`
2. Push to GitHub: `git push origin main`
3. Verify deployment: Check GitHub Actions or Vercel dashboard
4. **This is NON-NEGOTIABLE** - Set up reminders, use TodoWrite, whatever it takes!

**Deployment Flow**:
- Changes pushed to GitHub → Automatically deployed via Vercel
- Production URL updates automatically after successful push
- Always verify deployment status after push

### 1. Project Awareness
- **ALWAYS** read planning documents before implementing features
- Check TodoRead at the start of each conversation
- Review recent commits to understand current state
- Read REQUIREMENTS_SPEC.md for feature context

### 2. Technology Stack Rules
- **Framework**: Next.js 15 with App Router (NOT Pages Router)
- **Language**: TypeScript with strict mode enabled
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js with Facebook OAuth
- **UI**: Tailwind CSS + shadcn/ui components
- **AI**: OpenAI/Anthropic SDKs for agents

### 3. Code Structure Rules
- Keep components under 300 lines
- Split large files into logical modules
- Use server components by default, client components only when needed
- Follow existing patterns in src/components and src/app

### 4. File Organization
```
src/
├── app/              # Next.js App Router pages
├── components/       # Reusable React components
├── lib/             # Utilities and integrations
├── db/              # Database schema and queries
├── agents/          # AI agent implementations
├── types/           # TypeScript type definitions
└── contexts/        # React context providers
```

### 5. Testing & Validation
- Run `npm run lint` before committing
- Run `npm run typecheck` to verify types
- Test with `npm test` for unit tests
- Build with `npm run build` to catch errors
- Always handle Meta API rate limits

### 6. Meta Ads API Integration
- Use official facebook-nodejs-business-sdk
- Always check user permissions before API calls
- Implement exponential backoff for rate limits
- Store access tokens securely in database
- Log all API errors for debugging

### 7. AI Agent Development

#### Agent Architecture
- **Location**: All agents live in `src/agents/` as Python files
- **Base Class**: Inherit from the standardized `MetaAdsAgent` class (see `examples/agent-pattern.py`)
- **Naming**: Use kebab-case for files (e.g., `campaign-creator.py`)
- **Integration**: Call agents via API routes in `src/app/api/agents/`

#### Required Components
```python
# Every agent must have:
1. Environment configuration
2. Tool definitions with @tool decorator
3. Error handling and fallbacks
4. Async execution support
5. Session/memory management
```

#### Agent Development Rules
1. **LLM Configuration**:
   - Support both OpenAI and Anthropic providers
   - Use environment variable `AI_PROVIDER` to switch
   - Default to GPT-4 for complex tasks, GPT-3.5 for simple
   - Set appropriate temperature (0.7 for creative, 0 for analytical)

2. **Tool Development**:
   - Always use Pydantic models for tool inputs
   - Include comprehensive docstrings
   - Implement retry logic for external API calls
   - Return structured Dict[str, Any] responses
   - See `examples/agent-tool-pattern.py` for patterns

3. **Error Handling**:
   - Never let exceptions bubble up to the user
   - Provide fallback responses when APIs fail
   - Log errors with context for debugging
   - Return user-friendly error messages

4. **Memory Management**:
   - Use LangGraph's InMemorySaver for development
   - Implement session-based memory for production
   - Clear memory after 24 hours of inactivity
   - Store important context in database

5. **Testing Requirements**:
   - Mock all external API calls in tests
   - Test with both LLM providers
   - Include edge cases (rate limits, API failures)
   - Validate tool outputs match schemas

#### Integration Pattern
```typescript
// API Route (TypeScript)
await executeAgent(
  agentType: "optimization",
  action: "analyze",
  parameters: { campaignId: "123" },
  sessionId: "user-session-456"
)
```

```python
# Agent (Python)
async def process(self, action: str, params: Dict, session_id: str):
    # Implementation
```

#### Performance Guidelines
- Keep agent responses under 5 seconds
- Stream responses for long-running tasks
- Cache Meta API responses for 5 minutes
- Use connection pooling for API calls

#### Validation Scripts
```bash
# Validate AI configuration
./scripts/validate-ai-config.js

# Test agent connectivity
python scripts/test-agent-connectivity.py

# Check Meta permissions
./scripts/check-meta-permissions.js
```

### 8. Security Rules
- NEVER commit .env files
- Use environment variables for all secrets
- Validate all user inputs
- Sanitize data before database operations
- Check OAuth scopes match requirements

### 9. Performance Considerations
- Use React Server Components for initial loads
- Implement proper caching strategies
- Optimize images with next/image
- Use database indexes on frequently queried fields
- Implement SSE with proper connection management

### 10. Error Handling
- Always use try-catch for async operations
- Provide user-friendly error messages
- Log errors with context for debugging
- Implement fallback UI for error states
- Handle Meta API specific errors gracefully

### 11. Development Environment Management
- **Local Dev**: SQLite is acceptable for quick prototyping
- **Background Processes**: Use `nohup npm run dev > dev.log 2>&1 &` for long sessions
- **Port Conflicts**: Check with `lsof -i :3000` before starting
- **Process Management**: Track PIDs when running background servers
- **Environment Switching**: Keep separate .env.local and .env.production files

## Common Patterns

### API Route Pattern
```typescript
// app/api/campaigns/route.ts
import { auth } from "@/lib/auth"
import { db } from "@/db"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    // Implementation
  } catch (error) {
    console.error("Campaign fetch error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
```

### Component Pattern
```typescript
// components/campaigns/campaign-card.tsx
interface CampaignCardProps {
  campaign: Campaign
  onUpdate?: (campaign: Campaign) => void
}

export function CampaignCard({ campaign, onUpdate }: CampaignCardProps) {
  // Implementation following shadcn/ui patterns
}
```

### Database Query Pattern
```typescript
// lib/queries/campaigns.ts
import { db } from "@/db"
import { campaigns } from "@/db/schema"

export async function getCampaignsByUserId(userId: string) {
  return db.select().from(campaigns).where(eq(campaigns.userId, userId))
}
```

## Known Gotchas

### General Gotchas
1. **Facebook OAuth**: Requires HTTPS even in development
2. **Meta API Versions**: Always use the latest stable version (v18.0)
3. **Rate Limits**: Different limits for development vs production
4. **SSE in Next.js**: Requires specific response headers
5. **TypeScript Strict**: Some libraries need type assertions

### Setup & Environment Gotchas
6. **Working Directory**: Bash commands may fail with `cd` - use absolute paths
7. **npm install Timeouts**: Some packages take 10-30s, use longer timeouts
8. **Background Processes**: Next.js dev server continues running after terminal closes
9. **SQLite for Dev**: Acceptable for local dev but switch to PostgreSQL for production
10. **Placeholder Credentials**: Dev server runs with placeholders but features won't work

### AI Agent Gotchas
11. **Python Path Issues**: Add project root to sys.path in agents
12. **Async Execution**: All agent methods must be async
13. **Tool Timeouts**: Meta API calls can take 10+ seconds
14. **Memory Leaks**: Clear agent memory after sessions
15. **LLM Rate Limits**: 
    - OpenAI: 10,000 tokens/min for GPT-4
    - Anthropic: 100,000 tokens/min for Claude
16. **Cost Management**: Use GPT-3.5 for simple tasks to reduce costs
17. **Prompt Injection**: Always validate user inputs before passing to LLMs
18. **Response Streaming**: EventSource API has 64KB limit per message

## Validation Commands
```bash
# Before any commit
npm run lint
npm run typecheck
npm run build

# Database changes
npm run db:generate
npm run db:migrate

# Testing
npm test
npm run test:e2e  # If implemented
```

## Deployment Rules
**IMPORTANT: Always deploy to production with Vercel**
```bash
# ALWAYS use this command:
vercel --prod

# NEVER use just 'vercel' for preview deployments
```

This ensures consistent production URLs and proper environment handling.

## Resources
- Meta Ads API Docs: https://developers.facebook.com/docs/marketing-apis
- Next.js 15 Docs: https://nextjs.org/docs
- Drizzle ORM: https://orm.drizzle.team
- shadcn/ui: https://ui.shadcn.com

## API Access & Self-Service Troubleshooting

### Available Tools
- **Vercel CLI**: Environment variables, logs, deployments
- **Supabase API**: Database, auth, real-time, storage
- **Meta Ads API**: Campaign management endpoints
- **AI Services**: OpenAI and Anthropic APIs

### Self-Service Error Resolution
When encountering errors:
1. Check `API_ACCESS.md` for common fixes
2. Verify environment variables are set correctly
3. Check rate limits and implement backoff
4. Review server logs for detailed errors

### Quick Fixes
```bash
# Database issues
npm run db:studio  # Visual database browser

# Environment issues
vercel env pull    # Get latest env vars

# Build issues
npm run lint       # Fix linting errors
npm run typecheck  # Fix type errors
```

For detailed API documentation and troubleshooting, see `API_ACCESS.md`.

## Context Engineering Workflow
1. Feature requests go in INITIAL.md
2. Generate PRP with `/generate-prp`
3. Execute implementation with `/execute-prp`
4. Validate at each step
5. Fix errors using API_ACCESS.md
6. Update documentation as needed

## Continuous Context Improvement

**IMPORTANT**: Always think proactively about improving the project's context:

1. **Document New Patterns**: When you discover a pattern used multiple times, add it to `examples/`
2. **Fix What's Wrong**: If you find a better way to do something, update the existing examples
3. **Capture Gotchas**: Add newly discovered pitfalls to this file or relevant documentation
4. **Enhance Templates**: If PRPs are missing important sections, update the template
5. **Track Improvements**: Use `.claude/IMPROVEMENT_LOG.md` to track discoveries

### When to Update Context
- Found a repeated pattern? → Add to `examples/`
- Discovered a Meta API quirk? → Add to Known Gotchas
- Better error handling approach? → Update examples
- Missing validation step? → Add to PRP template
- New integration point? → Document the pattern

### Example Improvements
- If you implement SSE and it works well → Create `examples/sse-pattern.ts`
- If you find Meta API has undocumented behavior → Add to CLAUDE.md gotchas
- If you create a new agent pattern → Add `examples/agent-pattern.py`

Remember: Context is king. When in doubt, research existing patterns before implementing new ones. But when you find better ways, update the context for future use! When errors occur, check API_ACCESS.md first before asking for help.