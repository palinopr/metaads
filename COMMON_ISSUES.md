# Common Issues & Solutions

Quick reference for troubleshooting common MetaAds development issues.

## Setup Issues

### npm install fails
```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# If still failing, try with legacy peer deps
npm install --legacy-peer-deps
```

### Port 3000 already in use
```bash
# Find process using port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Working directory errors (cd command fails)
```bash
# Use absolute paths instead
pwd  # Get current directory
cd "/Users/username/path/to/metaads"

# Or stay in current directory
npm run dev --prefix metaads
```

### Environment variables not loading
**Symptoms**: Features failing silently, authentication errors

**Solution**:
```bash
# Verify .env exists
ls -la .env

# Check format (no spaces around =)
# Good: KEY=value
# Bad:  KEY = value

# Restart dev server after changes
```

## Development Issues

### TypeScript errors won't go away
```bash
# Clear TypeScript cache
rm -rf .next
npm run dev

# Restart TS server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Component not updating
**Symptoms**: Changes not reflected in browser

**Solutions**:
1. Check if it's a Client Component that needs 'use client'
2. Clear Next.js cache: `rm -rf .next`
3. Hard refresh browser: Cmd+Shift+R
4. Check for syntax errors in terminal

### Database errors

#### "Database file not found"
```bash
# For SQLite development
npm run db:push

# For PostgreSQL
# Check DATABASE_URL format
# postgresql://user:password@host:port/database
```

#### Migration errors
```bash
# Reset migrations (DEV ONLY!)
rm -rf src/db/migrations
npm run db:generate
npm run db:migrate

# For production, never delete migrations!
```

### API route returns 404
**Check**:
1. File location: Must be in `src/app/api/*/route.ts`
2. Export names: Must export GET, POST, etc.
3. File name: Must be exactly `route.ts`

Example structure:
```
src/app/api/
  campaigns/
    route.ts         ✓ /api/campaigns
    [id]/
      route.ts       ✓ /api/campaigns/123
```

### Meta API Issues

#### "Invalid OAuth Token"
1. Token might be expired
2. Check required permissions
3. Verify FACEBOOK_APP_ID matches token

#### Rate limit errors
```javascript
// Implement exponential backoff
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function retryWithBackoff(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) throw error
      await delay(Math.pow(2, i) * 1000)
    }
  }
}
```

#### Sandbox vs Production
- Use test ad accounts for development
- Different rate limits apply
- Some features only work in production

## Build Issues

### Build fails with memory error
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Module not found errors
```bash
# Check imports use correct paths
# Good: @/components/ui/button
# Bad:  ../../../components/ui/button

# Fix all imports
npm run lint -- --fix
```

### Build succeeds but deployment fails
Check:
1. All environment variables set in production
2. Database URL is production URL
3. No hardcoded localhost references

## Runtime Issues

### Hydration errors
**Symptoms**: "Text content does not match server-rendered HTML"

**Common causes**:
1. Date/time rendering differently
2. Using window/document in server components
3. Conditional rendering based on client state

**Fix**:
```typescript
// Wrap dynamic content
import dynamic from 'next/dynamic'

const ClientOnlyComponent = dynamic(
  () => import('./ClientComponent'),
  { ssr: false }
)
```

### Session not persisting
1. Check NEXTAUTH_SECRET is set
2. Verify NEXTAUTH_URL matches your domain
3. Clear cookies and try again

### Images not loading
```typescript
// Use Next.js Image component
import Image from 'next/image'

// Add domain to next.config.ts
images: {
  domains: ['example.com']
}
```

## AI Agent Issues

### Agent not responding
```bash
# Check AI provider is set
echo $AI_PROVIDER

# Verify API key
echo $OPENAI_API_KEY | cut -c1-10...

# Test connectivity
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### High AI costs
1. Use GPT-3.5 for simple tasks
2. Implement caching for repeated queries
3. Set max token limits

### Agent memory issues
```python
# Clear session after 24 hours
if session_age > 86400:
    agent.clear_memory(session_id)
```

## Performance Issues

### Slow page loads
1. Check for large client bundles
2. Use React Server Components
3. Implement proper caching
4. Lazy load heavy components

### Database queries slow
```sql
-- Add indexes for common queries
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
```

### Memory leaks
Common causes:
1. Event listeners not cleaned up
2. Intervals/timeouts not cleared
3. Large arrays in state

## Quick Fixes

### Reset everything (DEV ONLY!)
```bash
# Nuclear option - loses all data
rm -rf node_modules .next dev.db
npm install
npm run db:push
npm run dev
```

### Check what's running
```bash
# Find Next.js processes
ps aux | grep next

# Find node processes
ps aux | grep node

# Check ports
lsof -i :3000
netstat -an | grep 3000
```

### View logs
```bash
# If running in background
tail -f dev.log

# PM2 logs (if using PM2)
pm2 logs

# Vercel logs (if deployed)
vercel logs
```

## Getting Help

If none of these solutions work:

1. Check error message carefully
2. Search in project for similar code
3. Check Meta Ads API documentation
4. Review Next.js 15 documentation
5. Look for patterns in `examples/`

Remember: Most issues have been encountered before. Check existing code and documentation first!