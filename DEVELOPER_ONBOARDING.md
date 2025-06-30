# Developer Onboarding - MetaAds Project

## 🎯 Project Overview

MetaAds is a Facebook Ads management platform built with Next.js 15, TypeScript, and Supabase. The platform helps users create, manage, and optimize their Facebook advertising campaigns with AI-powered assistance.

### Tech Stack
- **Frontend**: Next.js 15.3.1, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js for authentication
- **Database**: PostgreSQL (via Supabase), Drizzle ORM
- **AI Integration**: OpenAI/Anthropic APIs for intelligent campaign assistance
- **Deployment**: Vercel
- **Version Control**: GitHub

## 🔍 Current Issue: Admin Access Not Working

### The Problem
User `jaime@outletmedia.net` should have admin access, but the system shows "Are you admin? No" despite multiple configuration attempts.

### Root Cause Analysis
1. **Email Mismatch**: Initially configured for `jaime@outletmedia.com` but user registered as `jaime@outletmedia.net`
2. **Environment Variable Complexity**: Multiple layers of environment variables causing confusion
3. **Build-time vs Runtime**: `NEXT_PUBLIC_*` variables are baked in at build time
4. **Multiple Vercel Projects**: Two projects (`metaads` and `metaads-web`) causing deployment confusion

## 🛠️ Tools I'm Using

### 1. **Vercel CLI**
```bash
vercel ls          # List deployments
vercel --prod      # Deploy to production
vercel env add     # Add environment variables
vercel alias set   # Update domain aliases
vercel logs        # Check deployment logs
```

### 2. **Git/GitHub**
```bash
git add -A
git commit -m "message"
git push origin main
```
**Important**: Always push to GitHub - Vercel auto-deploys from GitHub pushes

### 3. **Debugging Tools**
- **curl**: Testing API endpoints
- **Python json.tool**: Formatting JSON responses
- **Browser DevTools**: Checking client-side issues
- **Console logging**: Tracking execution flow

### 4. **Code Analysis**
- **grep**: Searching for patterns in code
- **Read/Edit tools**: Modifying files programmatically
- **Task tool**: Delegating complex searches

## 📋 Step-by-Step Debugging Process

### Step 1: Identify the Problem
```bash
# Check what email the user is logged in with
curl https://metaads-web.vercel.app/dashboard/debug-admin
```
Found: User is `jaime@outletmedia.net` not `jaime@outletmedia.com`

### Step 2: Trace the Admin Check Flow
1. **Client-side check** in `/src/components/dashboard-sidebar.tsx`
2. **Middleware check** in `/src/middleware.ts`
3. **API check** in `/src/app/api/admin/agent-config/route.ts`

### Step 3: Environment Variable Investigation
```bash
vercel env ls production | grep ADMIN
```
Found multiple environment variables:
- `ADMIN_EMAILS`
- `NEXT_PUBLIC_ADMIN_EMAILS`

### Step 4: Multiple Fix Attempts
1. **Attempt 1**: Update environment variables
   - Issue: Build-time variables don't update without rebuild

2. **Attempt 2**: Add fallback values in code
   - Issue: Wrong email in fallback

3. **Attempt 3**: Hardcode the correct email
   - Issue: Multiple places to update

4. **Final Solution**: Direct hardcoded checks
   ```typescript
   const isAdmin = session?.user?.email === "jaime@outletmedia.net"
   ```

## 🎓 Key Lessons Learned

### 1. **Environment Variables in Next.js**
- `NEXT_PUBLIC_*` variables are embedded at build time
- Regular env vars are available server-side only
- Changing them requires a rebuild and redeployment

### 2. **Vercel Deployment Flow**
```
GitHub Push → Vercel Build → Deploy → Update Alias
```
- Multiple deployments can exist simultaneously
- Aliases (domains) must be updated to point to new deployments

### 3. **Authentication Complexity**
- NextAuth session data structure
- Email string comparisons are case-sensitive
- Session persistence across deployments

### 4. **Debugging Strategy**
1. Create test endpoints that don't require auth
2. Add visible debug information in the UI
3. Use hardcoded values to eliminate variables
4. Test incrementally

## 🚀 How to Fix Similar Issues

### 1. Create Debug Endpoints
```typescript
// /src/app/api/debug-public/route.ts
export async function GET() {
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    adminEmails: process.env.ADMIN_EMAILS,
    // ... other debug info
  })
}
```

### 2. Add Visual Debug Info
```tsx
// In components
{session?.user?.email && (
  <div className="debug-info">
    Email: {session.user.email}
    Admin: {isAdmin ? "YES" : "NO"}
  </div>
)}
```

### 3. Use Direct Checks During Development
```typescript
// Bypass complex logic temporarily
const isAdmin = email === "jaime@outletmedia.net"
```

### 4. Document Everything
- Keep track of what emails are being used
- Document environment variable purposes
- Note deployment URLs and aliases

## 📝 Current Project Structure

```
metaads/
├── src/
│   ├── app/                    # Next.js 13+ app directory
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dashboard pages
│   │   └── (auth pages)       # Sign-in, sign-up
│   ├── components/            # React components
│   ├── lib/                   # Utilities and configurations
│   └── db/                    # Database schema and config
├── public/                    # Static files
├── scripts/                   # Utility scripts
└── Configuration files
```

## 🔧 Common Commands

### Local Development
```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run lint            # Run linter
```

### Database
```bash
npx drizzle-kit push    # Push schema changes
npx drizzle-kit studio  # Open database studio
```

### Deployment
```bash
git add -A && git commit -m "message" && git push origin main
# Vercel auto-deploys from GitHub
```

## 🐛 Troubleshooting Checklist

1. **User can't log in**
   - Check DATABASE_URL encoding (special characters need %encoding)
   - Verify NextAuth configuration
   - Check Supabase connection

2. **Admin panel not showing**
   - Verify exact email match (case-sensitive)
   - Check all three locations: middleware, API, component
   - Ensure deployment has latest code

3. **Environment variables not working**
   - Remember NEXT_PUBLIC_* needs rebuild
   - Use `vercel env ls` to verify
   - Check both development and production

4. **Deployment issues**
   - Cancel stuck deployments: `vercel rm <url> --yes`
   - Update alias after deployment
   - Check for multiple Vercel projects

## 💡 Pro Tips

1. **Always test with production URLs** - localhost can hide issues
2. **Use the same email everywhere** - avoid .com vs .net confusion
3. **Keep deployments clean** - remove failed/old deployments
4. **Document API changes** - helps with debugging later
5. **Use TypeScript strictly** - catches many issues early

## 🎯 Next Steps for New Developers

1. **Set up local environment**
   ```bash
   git clone https://github.com/palinopr/metaads.git
   cd metaads
   npm install
   cp .env.example .env.local
   # Edit .env.local with your values
   npm run dev
   ```

2. **Understand the auth flow**
   - Study `/src/lib/auth.ts`
   - Check `/src/middleware.ts`
   - Review NextAuth documentation

3. **Learn the deployment process**
   - Make a small change
   - Push to GitHub
   - Watch Vercel dashboard
   - Update alias if needed

4. **Explore the codebase**
   - Start with `/src/app/page.tsx`
   - Follow imports to understand structure
   - Check API routes for backend logic

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Guide](https://next-auth.js.org)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)

---

**Remember**: When in doubt, create a test endpoint and console.log everything!