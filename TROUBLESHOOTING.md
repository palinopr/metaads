# Troubleshooting Guide for Meta Ads Dashboard

## Common Issues and Solutions

### 1. "Nothing is showing" / Blank Page

**Symptoms:**
- Server says it's running but you see nothing
- Page loads but shows "No campaigns found"
- Features aren't visible

**Root Causes:**
1. No API credentials configured
2. Invalid API credentials
3. No active campaigns in account
4. Server not actually running

**Quick Diagnosis Commands:**
```bash
# 1. Check if server is running
ps aux | grep "next dev" | grep -v grep

# 2. Check server response
curl -I http://localhost:3000

# 3. Check for errors in console
npm run dev 2>&1 | head -50

# 4. Check TypeScript errors
npx tsc --noEmit
```

**Solution Steps:**
1. Open browser at http://localhost:3000
2. Check browser console (F12) for errors
3. Click Settings icon and add Meta API credentials
4. Verify credentials are correct in Meta Business Manager

### 2. Server Crashes on Updates

**Symptoms:**
- Server crashes after code changes
- Port conflicts (EADDRINUSE)
- TypeScript errors

**Prevention:**
```bash
# Before making changes:
1. Save current state: git add . && git commit -m "checkpoint"
2. Check TypeScript: npx tsc --noEmit
3. Kill old processes: pkill -f "next dev"
```

**Fix:**
```bash
# Clean restart procedure
pkill -f "next dev"
rm -rf .next
npm run dev
```

### 3. Features Not Appearing

**Symptoms:**
- New features (predictive AI, filters) not visible
- Components missing

**Diagnosis:**
```bash
# Check if files exist
ls -la components/campaign-predictive-mini.tsx
ls -la components/date-filter.tsx
ls -la components/campaign-row-expanded.tsx

# Check imports
grep -n "CampaignPredictiveMini" app/page.tsx
grep -n "DateFilter" app/page.tsx
```

**Common Fixes:**
1. Hard refresh browser: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
2. Clear Next.js cache: `rm -rf .next`
3. Restart dev server

## Automated Health Check Script

Create this script to diagnose issues automatically: