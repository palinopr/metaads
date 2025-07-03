# MetaAds Setup Guide

This guide ensures AI assistants can properly set up and run the MetaAds project.

## Prerequisites Check

Before starting, verify:
- Node.js 18+ installed
- Git installed
- Terminal access
- Port 3000 available

## Step-by-Step Setup

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd metaads
```

### 2. Verify Project Structure
```bash
# Check critical directories exist
ls -la .claude/ PRPs/ examples/ src/
```

### 3. Install Dependencies
```bash
npm install
# Expected: ~726 packages installed
# Time: ~10-30 seconds
# Note: Some deprecation warnings are normal
```

### 4. Environment Setup

#### For Development (Quick Start)
```bash
# Copy example env file
cp .env.example .env

# Or create minimal development .env:
cat > .env << 'EOF'
# Database - SQLite for local dev
DATABASE_URL="file:./dev.db"
DIRECT_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-change-in-production"

# Placeholders for required vars
FACEBOOK_APP_ID="placeholder"
FACEBOOK_APP_SECRET="placeholder"
NEXT_PUBLIC_FACEBOOK_APP_ID="placeholder"
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder"
SUPABASE_SERVICE_ROLE_KEY="placeholder"
ENCRYPTION_KEY="development-key"
AI_PROVIDER="openai"
OPENAI_API_KEY="placeholder"
ADMIN_EMAILS="admin@example.com"
NEXT_PUBLIC_ADMIN_EMAILS="admin@example.com"
EOF
```

#### For Production Setup
See `.env.example` for all required variables with real values.

### 5. Database Setup

#### Development (SQLite)
```bash
# Generate database schema
npm run db:push

# If migrations exist:
npm run db:migrate
```

#### Production (PostgreSQL)
```bash
# Ensure DATABASE_URL is set correctly
# Format: postgresql://user:password@host:port/database

# Run migrations
npm run db:migrate
```

### 6. Start Development Server
```bash
# Foreground (see logs)
npm run dev

# Background (for long-running)
nohup npm run dev > dev.log 2>&1 &
```

### 7. Verify Setup
```bash
# Check server is running
curl -I http://localhost:3000

# Expected response:
# HTTP/1.1 200 OK
# X-Powered-By: Next.js
```

## Common Setup Issues

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

### Database Connection Failed
- For SQLite: Ensure write permissions in project directory
- For PostgreSQL: Check DATABASE_URL format and credentials

### Dependencies Installation Failed
```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Not Loading
- Ensure `.env` file exists in project root
- Check for typos in variable names
- No spaces around `=` in `.env` file

## Feature-Specific Setup

### Facebook OAuth
1. Create Facebook App at developers.facebook.com
2. Add OAuth redirect: `http://localhost:3000/api/auth/callback/facebook`
3. Update FACEBOOK_APP_ID and FACEBOOK_APP_SECRET

### AI Features
1. Get API keys from OpenAI or Anthropic
2. Update OPENAI_API_KEY or ANTHROPIC_API_KEY
3. Set AI_PROVIDER to match your choice

### Meta Ads API
1. Ensure Facebook App has ads_management permission
2. User must grant proper scopes during OAuth
3. Test with Meta Ads sandbox first

## Validation Checklist

After setup, verify:
- [ ] `npm run dev` starts without errors
- [ ] http://localhost:3000 loads
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `npm run build`

## Quick Commands Reference

```bash
# Development
npm run dev          # Start dev server
npm run lint         # Run linter
npm run typecheck    # Check TypeScript
npm run build        # Production build

# Database
npm run db:push      # Push schema (dev)
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio

# Testing
npm test            # Run tests
npm run test:e2e    # E2E tests (if configured)
```

## Next Steps

1. Review `CLAUDE.md` for project conventions
2. Check `examples/` for code patterns
3. Read `DEVELOPMENT_WORKFLOW.md` for common tasks
4. See `COMMON_ISSUES.md` for troubleshooting

Remember: Always run validation commands before committing changes!