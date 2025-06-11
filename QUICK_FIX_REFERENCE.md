# Quick Fix Reference Guide

## Emergency Fix Commands (Copy & Paste)

### 🚨 Dashboard Not Loading (30 seconds)
```bash
pkill -f "next dev" && rm -rf .next && npm run dev
```

### 🔑 Token Issues (60 seconds)
```javascript
// In browser console (F12)
localStorage.removeItem('metaCredentials')
localStorage.removeItem('metaSettings')
// Then refresh page and re-enter credentials
```

### 🐳 Docker Problems (2 minutes)
```bash
docker-compose down && docker-compose build --no-cache && docker-compose up -d
```

### 🌐 Cache Problems (30 seconds)
```bash
# Browser: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
# Server: rm -rf .next && npm run dev
```

### 📡 API Connection Issues (60 seconds)
```bash
curl -X POST http://localhost:3000/api/meta -H "Content-Type: application/json" -d '{"type":"overview"}'
# If fails: Check token and account ID in settings
```

---

## Problem → Solution Matrix

| Problem | Quick Fix | Time | Command |
|---------|-----------|------|---------|
| White screen | Clear cache + restart | 30s | `Ctrl+Shift+R` |
| 500 error | Kill & restart server | 30s | `pkill -f "next dev" && npm run dev` |
| "No campaigns" | Check credentials | 60s | Open Settings → Re-enter token |
| Slow loading | Use lite dashboard | 10s | Go to `/dashboard-lite` |
| Docker fails | Rebuild container | 2m | `docker-compose down && docker-compose up -d --build` |
| Build errors | Clear Next.js cache | 30s | `rm -rf .next && npm run dev` |
| Port conflict | Kill process | 30s | `lsof -ti:3000 \| xargs kill -9` |
| Memory issues | Restart with limits | 60s | `NODE_OPTIONS="--max-old-space-size=4096" npm run dev` |

---

## Common Error Messages & Fixes

### "Cannot parse access token"
```bash
# 1. Check token format (should start with 'EAA')
echo $NEXT_PUBLIC_META_ACCESS_TOKEN | head -c 10

# 2. Generate new token in Meta Business Settings
# 3. Clear stored credentials
localStorage.removeItem('metaCredentials')
```

### "Rate limit exceeded"
```bash
# 1. Wait 60 seconds
# 2. Check rate limit status in dashboard footer
# 3. Enable request queuing
export NEXT_PUBLIC_API_RATE_LIMIT=20
```

### "EADDRINUSE: address already in use"
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9
npm run dev
```

### "Module not found" / Import errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### "Failed to fetch"
```bash
# 1. Check if server is running
curl -I http://localhost:3000

# 2. Check for CORS issues in browser console
# 3. Restart server if needed
npm run dev
```

---

## Component-Specific Quick Fixes

### Dashboard Not Showing Data
```javascript
// 1. Check API response in Network tab (F12)
// 2. Clear API cache
fetch('/api/cache', { method: 'DELETE' })

// 3. Check localStorage for credentials
console.log(localStorage.getItem('metaCredentials'))
```

### Settings Not Saving
```javascript
// 1. Check localStorage quota
navigator.storage.estimate().then(console.log)

// 2. Clear old data
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('old_') || key.includes('backup')) {
    localStorage.removeItem(key)
  }
})

// 3. Try sessionStorage as fallback
sessionStorage.setItem('metaCredentials', JSON.stringify(credentials))
```

### Campaign Data Missing
```bash
# 1. Test Meta API directly
curl -G -d "access_token=YOUR_TOKEN" \
  "https://graph.facebook.com/v18.0/act_YOUR_ID/campaigns"

# 2. Check date range filter
# 3. Verify account ID format (act_XXXXXXXXXX)
```

---

## Performance Quick Fixes

### Slow Page Loading
```bash
# 1. Use lightweight dashboard
open http://localhost:3000/dashboard-lite

# 2. Enable caching
export NEXT_PUBLIC_CACHE_TTL=600000

# 3. Check bundle size
npm run build -- --analyze
```

### High Memory Usage
```bash
# 1. Restart with memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# 2. Clear browser cache
# Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

# 3. Use memory monitoring
node --inspect npm run dev
```

### API Rate Limiting
```javascript
// 1. Check current usage
console.log('Rate limit status:', window.rateLimitStatus)

// 2. Enable request queuing
localStorage.setItem('enableRequestQueue', 'true')

// 3. Reduce request frequency
localStorage.setItem('apiRateLimit', '20')
```

---

## Browser-Specific Quick Fixes

### Chrome Issues
```bash
# 1. Hard refresh
Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

# 2. Clear site data
# F12 → Application → Storage → Clear storage

# 3. Disable extensions
# Incognito mode: Ctrl+Shift+N / Cmd+Shift+N
```

### Firefox Issues
```bash
# 1. Clear cache
Ctrl+Shift+Delete → Select "Cache" → Clear

# 2. Disable strict mode
# about:config → privacy.resistFingerprinting → false

# 3. Reset localStorage
# F12 → Storage → Local Storage → Clear
```

### Safari Issues
```bash
# 1. Empty caches
# Develop → Empty Caches

# 2. Clear website data
# Preferences → Privacy → Manage Website Data

# 3. Disable content blockers
# Preferences → Websites → Content Blockers
```

---

## Development Environment Fixes

### TypeScript Errors
```bash
# 1. Clear TypeScript cache
rm -rf .next/cache
npx tsc --build --clean

# 2. Restart TypeScript server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"

# 3. Check for type errors
npx tsc --noEmit
```

### ESLint Errors
```bash
# 1. Auto-fix issues
npm run lint -- --fix

# 2. Ignore specific errors (temporary)
# Add // eslint-disable-next-line to problem line

# 3. Update ESLint config if needed
npm run lint -- --print-config .
```

### Build Failures
```bash
# 1. Clear all caches
rm -rf .next node_modules package-lock.json
npm install
npm run build

# 2. Check for environment variable issues
node -e "console.log(process.env.NEXT_PUBLIC_META_ACCESS_TOKEN ? 'Token set' : 'Token missing')"

# 3. Build with verbose output
npm run build -- --debug
```

---

## Emergency Recovery Procedures

### Complete System Reset (5 minutes)
```bash
#!/bin/bash
# Emergency reset script

echo "🚨 Emergency system reset..."

# 1. Stop all processes
pkill -f "next dev"
pkill -f "node"

# 2. Clear all caches
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json

# 3. Clean install
npm install

# 4. Restart development server
npm run dev

echo "✅ System reset complete"
```

### Docker Emergency Recovery
```bash
#!/bin/bash
# Docker emergency recovery

echo "🐳 Docker emergency recovery..."

# 1. Stop all containers
docker-compose down --volumes --remove-orphans

# 2. Clean Docker system
docker system prune -af

# 3. Rebuild and restart
docker-compose build --no-cache --pull
docker-compose up -d

# 4. Check health
sleep 30
curl -f http://localhost:3000/api/health && echo "✅ Recovery successful"
```

### Browser Emergency Reset
```javascript
// Complete browser state reset
// Run in console (F12)

// Clear all storage
localStorage.clear()
sessionStorage.clear()

// Clear service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister())
})

// Clear IndexedDB
indexedDB.databases().then(databases => {
  databases.forEach(db => indexedDB.deleteDatabase(db.name))
})

console.log('✅ Browser state cleared - refresh page')
```

---

## Automated Quick Fix Scripts

### Health Check Script
```bash
#!/bin/bash
# scripts/quick-health-check.sh

echo "🔍 Running quick health check..."

# Check server
if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "✅ Server is running"
else
    echo "❌ Server is down - starting..."
    npm run dev &
    sleep 10
fi

# Check Meta API
if curl -f -X POST http://localhost:3000/api/meta \
    -H "Content-Type: application/json" \
    -d '{"type":"overview"}' >/dev/null 2>&1; then
    echo "✅ Meta API is working"
else
    echo "❌ Meta API issue - check credentials"
fi

# Check memory usage
MEMORY=$(ps -o pid,ppid,cmd,%mem --sort=-%mem | grep node | head -1 | awk '{print $4}')
if (( $(echo "$MEMORY > 10" | bc -l) )); then
    echo "⚠️ High memory usage: ${MEMORY}%"
fi

echo "✅ Health check complete"
```

### Auto-Fix Script
```bash
#!/bin/bash
# scripts/auto-fix.sh

echo "🔧 Running auto-fix procedures..."

# 1. Fix common port issues
if lsof -i:3000 >/dev/null 2>&1; then
    echo "🔧 Fixing port conflict..."
    lsof -ti:3000 | xargs kill -9
fi

# 2. Clear problematic caches
echo "🧹 Clearing caches..."
rm -rf .next

# 3. Check and fix permissions
if [ ! -w "package.json" ]; then
    echo "🔧 Fixing permissions..."
    chmod +w package.json
fi

# 4. Restart server
echo "🚀 Restarting server..."
npm run dev &

echo "✅ Auto-fix complete"
```

---

## Quick Reference Card

### 🔥 Most Common Issues (90% of problems)

1. **Dashboard blank** → `Ctrl+Shift+R` (hard refresh)
2. **500 error** → `pkill -f "next dev" && npm run dev`
3. **"No campaigns"** → Check Settings → Re-enter token
4. **Slow loading** → Use `/dashboard-lite`
5. **Port conflict** → `lsof -ti:3000 | xargs kill -9`

### 📱 Mobile Quick Fixes

- **Clear cache**: Browser settings → Clear data
- **Hard refresh**: Pull down to refresh
- **Incognito mode**: Browser menu → New incognito tab
- **Different browser**: Try Chrome, Firefox, or Safari

### 🎯 Success Indicators

After applying fixes, you should see:
- ✅ Dashboard loads within 5 seconds
- ✅ Campaign data displays
- ✅ No console errors (F12)
- ✅ Settings save properly
- ✅ API calls return data

### ⚡ Emergency Contacts

When all else fails:
1. **Check server logs**: `tail -f server.log`
2. **Test API directly**: `curl http://localhost:3000/api/health`
3. **Use emergency server**: `node emergency-server.js`
4. **Switch to stable version**: `./start-stable.sh`

---

## Copy-Paste Commands for Different Scenarios

### Morning Startup Routine
```bash
# Quick morning startup
cd /path/to/metaads
git pull origin main
npm install
npm run dev
```

### Pre-Meeting Quick Fix
```bash
# Ensure dashboard works for demo
pkill -f "next dev"
rm -rf .next
npm run dev
# Wait 30 seconds, then open http://localhost:3000/dashboard-lite
```

### End-of-Day Cleanup
```bash
# Clean shutdown
pkill -f "next dev"
docker-compose down
# Clear temporary files
rm -rf .next/cache
```

### Emergency Demo Mode
```bash
# Absolutely must work right now
node emergency-server.js
# Or use the lite dashboard at /dashboard-lite
```

Remember: **When in doubt, try the lite dashboard first** - it's more stable and loads faster!