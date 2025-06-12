# Meta Ads Dashboard - Debugging Checklist

## Quick Diagnostic Commands

Run these commands first to gather system information:

```bash
# 1. System Health Check (30 seconds)
curl -I http://localhost:3000/api/health
ps aux | grep node | grep -v grep
npm run test:health

# 2. Meta API Connectivity (60 seconds) 
node test-meta-api.js
curl -X POST http://localhost:3000/api/meta -H "Content-Type: application/json" -d '{"type":"overview"}'

# 3. Log Analysis (30 seconds)
tail -20 server.log
grep -i error server.log | tail -10
```

---

## Issue Category: AUTHENTICATION PROBLEMS

### ✅ Token Issues Checklist

- [ ] **Check Token Format**
  ```bash
  # Token should start with 'EAA' and be ~180+ characters
  echo $NEXT_PUBLIC_META_ACCESS_TOKEN | head -c 10
  ```

- [ ] **Verify Token Expiry**
  - Go to Meta Business Settings → System Users
  - Check token expiration date
  - Generate new token if expired

- [ ] **Test Token Permissions**
  ```bash
  # Test with curl
  curl -G -d "access_token=YOUR_TOKEN" \
    "https://graph.facebook.com/v18.0/me/adaccounts"
  ```

- [ ] **Clear and Reset Credentials**
  ```javascript
  // In browser console
  localStorage.removeItem('metaCredentials')
  localStorage.removeItem('metaSettings')
  // Then refresh page and re-enter credentials
  ```

- [ ] **Validate Account ID Format**
  ```javascript
  // Should be: act_1234567890
  const accountId = "act_" + YOUR_NUMERIC_ID
  ```

### ✅ Storage Issues Checklist

- [ ] **Check localStorage Persistence**
  ```javascript
  // Browser console
  console.log(JSON.parse(localStorage.getItem('metaCredentials')))
  ```

- [ ] **Verify Settings Modal Save Function**
  - Open Settings → Enter credentials → Save
  - Check if values persist after page refresh
  - Look for console errors during save

- [ ] **Check for Browser Storage Limitations**
  - Try incognito mode
  - Clear all browser data for localhost
  - Test in different browser

---

## Issue Category: API CONNECTIVITY PROBLEMS

### ✅ Network Issues Checklist

- [ ] **Test Basic API Connectivity**
  ```bash
  # Test local API
  curl http://localhost:3000/api/health
  
  # Test Meta API directly
  curl "https://graph.facebook.com/v18.0/me?access_token=YOUR_TOKEN"
  ```

- [ ] **Check Rate Limiting**
  ```bash
  # Look for rate limit headers
  curl -I "https://graph.facebook.com/v18.0/act_YOUR_ID/campaigns?access_token=YOUR_TOKEN"
  ```

- [ ] **Verify CORS and CSP Settings**
  - Check browser Network tab for blocked requests
  - Look for CSP violations in console
  - Check `next.config.mjs` for proper domains

- [ ] **Test with Minimal Request**
  ```javascript
  // In browser console
  fetch('/api/meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'overview', datePreset: 'today' })
  }).then(r => r.json()).then(console.log)
  ```

### ✅ API Response Issues Checklist

- [ ] **Check Response Format**
  ```bash
  # Verify API returns expected structure
  node -e "
    fetch('http://localhost:3000/api/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'overview' })
    }).then(r => r.json()).then(console.log)
  "
  ```

- [ ] **Validate Campaign Data Structure**
  - Each campaign should have: id, name, status, spend, impressions
  - Check for missing adsets_count field
  - Verify metrics calculations (CTR, CPC, ROAS)

- [ ] **Check Date Range Logic**
  ```javascript
  // Test different date presets
  const datePresets = ['today', 'yesterday', 'last_7d', 'last_30d']
  // Try each one and check if data changes appropriately
  ```

---

## Issue Category: UI/FRONTEND PROBLEMS

### ✅ Display Issues Checklist

- [ ] **Check for JavaScript Errors**
  - Open F12 → Console
  - Look for red error messages
  - Check for unhandled promise rejections

- [ ] **Verify Component Rendering**
  ```javascript
  // Check if key components are mounted
  console.log(document.querySelector('[data-testid="dashboard"]'))
  console.log(document.querySelector('.campaign-row'))
  ```

- [ ] **Test Cache Clearing**
  ```bash
  # Clear Next.js cache
  rm -rf .next
  npm run dev
  ```

- [ ] **Browser Cache Issues**
  - Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
  - Try incognito/private mode
  - Clear browser cache for localhost

### ✅ Routing Issues Checklist

- [ ] **Check for Missing Routes**
  ```bash
  # Verify route files exist
  ls -la app/dashboard/page.tsx
  ls -la app/pattern-analysis/page.tsx
  ls -la app/logs/page.tsx
  ```

- [ ] **Test Route Navigation**
  - Manual URL entry: `http://localhost:3000/dashboard`
  - Click navigation links
  - Check for 404 errors in Network tab

- [ ] **Verify Dynamic Routes**
  - Check if campaign detail routes work
  - Test with different campaign IDs

---

## Issue Category: PERFORMANCE PROBLEMS

### ✅ Speed Issues Checklist

- [ ] **Measure Load Times**
  ```bash
  # Test page load speed
  curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/
  ```

- [ ] **Check Bundle Size**
  ```bash
  npm run build
  # Look for bundle size warnings
  ```

- [ ] **Monitor Memory Usage**
  ```bash
  # Check Node.js memory usage
  ps aux | grep node
  ```

- [ ] **Verify Caching**
  ```javascript
  // Check if caching is working
  console.log(localStorage.getItem('campaign_cache'))
  ```

### ✅ Rate Limiting Checklist

- [ ] **Check Current Rate Limit Status**
  - Look at dashboard footer for rate limit indicator
  - Check browser Network tab for 429 responses

- [ ] **Configure Rate Limiting**
  ```bash
  # Set environment variables
  export NEXT_PUBLIC_API_RATE_LIMIT=30
  export NEXT_PUBLIC_CACHE_TTL=600000
  ```

- [ ] **Test Request Queuing**
  - Make multiple rapid requests
  - Verify requests are queued, not rejected

---

## Issue Category: DATA ACCURACY PROBLEMS

### ✅ Campaign Data Checklist

- [ ] **Verify Campaign Count**
  - Compare dashboard count with Meta Ads Manager
  - Check date range filter effects
  - Verify active vs inactive campaigns

- [ ] **Check Metrics Calculations**
  ```javascript
  // Verify ROAS calculation
  const roas = revenue / spend
  
  // Verify CTR calculation  
  const ctr = (clicks / impressions) * 100
  
  // Verify CPC calculation
  const cpc = spend / clicks
  ```

- [ ] **Test Different Date Ranges**
  - Today, Yesterday, Last 7 days, Last 30 days
  - Check if metrics change appropriately
  - Verify historical data accuracy

### ✅ Ad Set Data Checklist

- [ ] **Check Ad Set Count**
  - Each campaign should show correct ad set count
  - Verify ad sets are fetched for each campaign
  - Check for missing ad set data

- [ ] **Verify Ad Set Metrics**
  - Ad set spend should sum to campaign spend
  - Check individual ad set performance
  - Verify ad set status filtering

---

## Common Fix Templates

### Template 1: Complete System Reset
```bash
# Nuclear option - fresh start
pkill -f "next dev"
rm -rf .next
rm -rf node_modules
npm install
npm run dev
```

### Template 2: API Connection Reset
```bash
# Reset API connections
curl -X DELETE http://localhost:3000/api/cache
# Clear localStorage in browser
# Re-enter credentials
# Test API connection
```

### Template 3: Performance Reset
```bash
# Clear all caches
rm -rf .next
# Set performance env vars
export NEXT_PUBLIC_CACHE_TTL=300000
export NEXT_PUBLIC_API_RATE_LIMIT=20
npm run dev
```

### Template 4: Emergency Fallback
```bash
# Use emergency server
node emergency-server.js
# Or use stable backup
./start-stable.sh
```

---

## Debugging Timeline

### First 2 Minutes: Quick Assessment
1. Run system health check commands
2. Check browser console for obvious errors
3. Verify server is responding

### Minutes 3-5: Problem Classification
1. Determine if issue is auth, API, UI, or performance
2. Use appropriate checklist section
3. Run targeted diagnostic commands

### Minutes 6-15: Targeted Resolution
1. Apply fixes from relevant checklist
2. Test each fix immediately
3. Document what worked

### Minutes 16-30: Validation & Monitoring
1. Run full system tests
2. Monitor for stability
3. Update documentation if new issue discovered

---

## Emergency Escalation

If issue persists after 30 minutes:

1. **Switch to Emergency Mode**:
   ```bash
   node emergency-server.js
   ```

2. **Contact Support with This Information**:
   - Error messages from console and logs
   - Steps already attempted
   - System configuration details
   - Screenshots of issue

3. **Preserve Evidence**:
   ```bash
   # Save current state
   cp server.log debug-$(date +%Y%m%d-%H%M%S).log
   npm run test:health > health-check-$(date +%Y%m%d-%H%M%S).txt
   ```

Remember: **Document everything** - future debugging sessions will be faster with good notes!