# MetaAds Development Workflow

Common development tasks and workflows for the MetaAds project.

## Daily Development Flow

### 1. Starting Your Day
```bash
# Navigate to project
cd /path/to/metaads

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Start dev server
npm run dev

# Verify setup
curl -I http://localhost:3000
```

### 2. Before Writing Code
- Read `CLAUDE.md` for project rules
- Check `TodoRead` for existing tasks
- Review related code in `examples/`
- Ensure all validation passes:
  ```bash
  npm run lint && npm run typecheck
  ```

### 3. During Development
- Keep components under 300 lines
- Follow patterns from `examples/`
- Run validation frequently
- Test changes in browser

### 4. Before Committing
```bash
# Run all checks
npm run lint
npm run typecheck
npm run build

# If database changed
npm run db:generate
npm run db:migrate
```

## Common Development Tasks

### Creating a New API Route

1. **Check existing patterns**:
   ```bash
   # Look at example
   cat examples/api-route-pattern.ts
   ```

2. **Create route file**:
   ```bash
   # Create new route
   touch src/app/api/your-feature/route.ts
   ```

3. **Implement with standard pattern**:
   - Authentication check
   - Zod validation
   - Error handling
   - Proper responses

4. **Test the route**:
   ```bash
   # Test with curl
   curl -X POST http://localhost:3000/api/your-feature \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

### Creating a New Component

1. **Check component patterns**:
   ```bash
   cat examples/component-pattern.tsx
   ```

2. **Generate shadcn/ui component** (if needed):
   ```bash
   npx shadcn-ui@latest add [component-name]
   ```

3. **Create your component**:
   ```bash
   mkdir -p src/components/your-feature
   touch src/components/your-feature/your-component.tsx
   ```

4. **Follow the pattern**:
   - Proper TypeScript interfaces
   - Loading states
   - Error handling
   - Responsive design

### Working with Database

1. **Check current schema**:
   ```bash
   # Open Drizzle Studio
   npm run db:studio
   ```

2. **Modify schema**:
   ```bash
   # Edit schema files
   vim src/db/schema/your-table.ts
   ```

3. **Generate migration**:
   ```bash
   npm run db:generate
   ```

4. **Apply migration**:
   ```bash
   npm run db:migrate
   ```

5. **Create query functions**:
   ```bash
   # Follow pattern
   cat examples/database-pattern.ts
   
   # Create query file
   touch src/lib/queries/your-queries.ts
   ```

### Implementing a Feature

1. **Create feature request**:
   ```bash
   cp INITIAL.md INITIAL_your_feature.md
   # Fill out the template
   ```

2. **Generate PRP**:
   ```
   /generate-prp
   ```

3. **Review and refine PRP**

4. **Execute implementation**:
   ```
   /execute-prp
   ```

5. **Validate continuously**

### Working with Meta Ads API

1. **Check permissions**:
   ```javascript
   // Verify user has required permissions
   const hasPermission = await checkMetaPermission(userId, 'ads_management')
   ```

2. **Handle rate limits**:
   ```javascript
   // Use exponential backoff
   await retryWithBackoff(async () => {
     return await metaApi.getCampaign(campaignId)
   })
   ```

3. **Test with sandbox**:
   - Use Meta's test ad accounts
   - Don't use production data in dev

### Debugging Issues

1. **Check server logs**:
   ```bash
   # If running in background
   tail -f dev.log
   
   # Or restart in foreground
   npm run dev
   ```

2. **Check browser console**:
   - Open DevTools (F12)
   - Check Console tab
   - Check Network tab

3. **Database issues**:
   ```bash
   # Visual inspection
   npm run db:studio
   
   # Reset database (dev only!)
   rm dev.db
   npm run db:push
   ```

4. **TypeScript errors**:
   ```bash
   # See all errors
   npm run typecheck
   
   # Fix imports
   npm run lint -- --fix
   ```

## Deployment Workflow

### 1. Pre-deployment Checks
```bash
# All tests pass
npm test

# Build succeeds
npm run build

# No TypeScript errors
npm run typecheck

# Lint passes
npm run lint
```

### 2. Environment Variables
```bash
# Ensure production vars are set
vercel env pull .env.production

# Never commit .env files!
git status # Should not show .env
```

### 3. Database Migrations
```bash
# Generate production migration
npm run db:generate

# Test migration locally first
npm run db:migrate

# Commit migration files
git add src/db/migrations
git commit -m "Add migration for [feature]"
```

## Working with AI Agents

### 1. Testing Agents Locally
```bash
# Set AI provider
export AI_PROVIDER=openai
export OPENAI_API_KEY=your-key

# Test agent
python scripts/test-agent.py optimization
```

### 2. Creating New Agent
1. Copy existing agent pattern
2. Implement required methods
3. Add to agent registry
4. Create API route
5. Test thoroughly

### 3. Agent Debugging
```bash
# Check logs
tail -f logs/agent-*.log

# Test tools individually
python -m src.agents.test_tools
```

## Collaboration Workflow

### 1. Creating a Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Making Changes
- Follow existing patterns
- Update tests
- Update documentation

### 3. Before PR
```bash
# Rebase on main
git fetch origin
git rebase origin/main

# Run all checks
npm run lint
npm run typecheck
npm run build
npm test
```

### 4. PR Description
Include:
- What changed
- Why it changed
- How to test
- Screenshots (if UI)

## Performance Monitoring

### 1. Build Size
```bash
# Check bundle size
npm run build
# Look for "Route (app)" sizes
```

### 2. Runtime Performance
- Use React DevTools Profiler
- Check Network tab for slow APIs
- Monitor Meta API response times

### 3. Database Performance
```bash
# Check slow queries
npm run db:studio
# Look at query execution times
```

## Quick Reference

### Essential Commands
```bash
npm run dev          # Start development
npm run build        # Production build
npm run lint         # Fix linting
npm run typecheck    # Check types
npm run db:studio    # Database GUI
npm run db:migrate   # Run migrations
npm test            # Run tests
```

### File Locations
- API Routes: `src/app/api/`
- Components: `src/components/`
- Database: `src/db/`
- Queries: `src/lib/queries/`
- Types: `src/types/`
- Agents: `src/agents/`

### Common Patterns
- API Routes: See `examples/api-route-pattern.ts`
- Components: See `examples/component-pattern.tsx`
- Database: See `examples/database-pattern.ts`

Remember: When in doubt, check existing code patterns first!