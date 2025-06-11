# Standard Operating Procedure: Meta Ads Dashboard Fixes

## Table of Contents
1. [Emergency Response Protocol](#emergency-response-protocol)
2. [Common Issue Categories](#common-issue-categories)
3. [Systematic Troubleshooting Approach](#systematic-troubleshooting-approach)
4. [Fix Implementation Strategy](#fix-implementation-strategy)
5. [Validation and Testing](#validation-and-testing)
6. [Performance Optimization](#performance-optimization)
7. [Prevention Measures](#prevention-measures)

## Emergency Response Protocol

### Level 1: Dashboard Completely Down
**Symptoms**: 500 errors, white screen, server crashes
**Response Time**: < 5 minutes

1. **Immediate Actions**:
   ```bash
   # Kill all processes
   pkill -f "next dev"
   pkill -f "node"
   
   # Clear cache and restart
   rm -rf .next
   npm run dev
   ```

2. **Check Emergency Server**:
   ```bash
   node emergency-server.js
   ```

3. **Activate Stable Backup**:
   ```bash
   ./start-stable.sh
   ```

### Level 2: Partial Functionality Issues
**Symptoms**: Some features not working, API errors
**Response Time**: < 15 minutes

1. **Quick Diagnostics**:
   ```bash
   # Check health status
   curl -I http://localhost:3000/api/health
   
   # Test Meta API connection
   node test-meta-api.js
   ```

2. **Use Lightweight Dashboard**:
   - Navigate to `http://localhost:3000/dashboard-lite`
   - Reduced functionality but stable

### Level 3: Performance Degradation
**Symptoms**: Slow loading, rate limit hits
**Response Time**: < 30 minutes

1. **Check Rate Limits**:
   - Monitor API quota in dashboard footer
   - Implement request queuing if needed

2. **Enable Caching**:
   ```bash
   # Set cache environment variables
   NEXT_PUBLIC_CACHE_TTL=600000
   NEXT_PUBLIC_API_RATE_LIMIT=30
   ```

## Common Issue Categories

### 1. Authentication & Token Issues

#### Invalid OAuth Access Token (CRITICAL)
- **Error**: "Invalid OAuth access token - Cannot parse access token"
- **Root Cause**: Token expired, malformed, or not properly stored
- **Fix Strategy**: Token validation and refresh workflow

**Immediate Fix**:
1. Check token expiry in Meta Business Settings
2. Generate new long-lived token
3. Clear localStorage and re-enter credentials
4. Verify token format (should start with 'EAA')

**Code Location**: 
- `/components/settings-modal.tsx`
- `/lib/credential-manager.ts`
- `/app/api/meta/route.ts`

#### Token Storage Issues
- **Symptoms**: Credentials not persisting between sessions
- **Debugging**:
   ```javascript
   // Check localStorage in browser console
   console.log(localStorage.getItem('metaCredentials'))
   ```

### 2. API Integration Problems

#### Rate Limit Exceeded
- **Error**: "API rate limit exceeded"
- **Solution**: Implement intelligent request queuing
- **Code**: `/lib/api-manager.ts`

#### Missing Campaign Data
- **Symptoms**: "No campaigns found" despite having active campaigns
- **Checklist**:
  - [ ] Token has campaigns:read permission
  - [ ] Ad Account ID format correct (act_XXXXXXX)
  - [ ] Date range includes campaign activity
  - [ ] Campaign status is ACTIVE

### 3. UI/UX Issues

#### Content Security Policy (CSP) Violations
- **Error**: "Refused to connect to external domain"
- **Fix**: Update CSP headers in `next.config.mjs`
- **Location**: `/next.config.mjs`

#### Service Worker Conflicts
- **Symptoms**: Chrome extension errors, offline functionality broken
- **Fix**: Update service worker scope and handlers
- **Location**: `/public/sw.js`

#### Missing Routes (404 Errors)
- **Error**: "404 - This page could not be found"
- **Solution**: Create missing route files
- **Pattern**: `/app/[route-name]/page.tsx`

## Systematic Troubleshooting Approach

### Phase 1: Information Gathering (2-3 minutes)

1. **Check Browser Console**:
   - Press F12 → Console tab
   - Look for red error messages
   - Note any network failures

2. **Check Server Logs**:
   ```bash
   # Real-time logs
   tail -f server.log
   
   # Error logs
   grep -i error server.log | tail -20
   ```

3. **System Health Check**:
   ```bash
   # Run automated diagnostics
   npm run test:health
   
   # Check process status
   ps aux | grep node
   ```

### Phase 2: Problem Classification (1-2 minutes)

**Use Decision Tree**:
- Server not responding → Infrastructure issue
- 500 errors → Application code issue  
- 404 errors → Routing issue
- Blank page → Authentication/data issue
- Slow performance → Rate limiting/optimization issue

### Phase 3: Targeted Resolution (5-15 minutes)

**Follow Fix Templates** (see DEBUGGING_CHECKLIST.md)

## Fix Implementation Strategy

### Sub-Agent Approach for Complex Issues

#### Sub-Agent 1: Authentication & API Fix
**Responsibility**: Token management, API connections
**Files**: 
- `/lib/credential-manager.ts`
- `/lib/meta-api-client.ts`
- `/components/settings-modal.tsx`

#### Sub-Agent 2: UI/UX Stability
**Responsibility**: Frontend issues, routing, CSP
**Files**:
- `/app/layout.tsx`
- `/next.config.mjs`
- `/public/sw.js`
- Missing route files

#### Sub-Agent 3: Performance & Monitoring
**Responsibility**: Caching, rate limiting, logging
**Files**:
- `/lib/api-manager.ts`
- `/app/api/logs/route.ts`
- `/components/system-status.tsx`

#### Sub-Agent 4: Data Pipeline
**Responsibility**: Campaign data, insights processing
**Files**:
- `/app/api/meta/route.ts`
- `/lib/meta-api-enhanced.ts`
- `/lib/campaign-store.ts`

### Execution Workflow

1. **Parallel Development**:
   - Each sub-agent works independently
   - No cross-dependencies during development
   - Individual testing before integration

2. **Integration Testing**:
   ```bash
   # Test individual components
   npm run test:pre-deploy
   
   # Integration test
   npm run test:crash
   
   # Performance validation
   npm run test:health
   ```

3. **Staged Deployment**:
   - Test on localhost:3000 first
   - Verify all features work
   - Monitor for 15 minutes before considering stable

## Validation and Testing

### Pre-Deploy Validation Checklist

- [ ] TypeScript compilation clean
- [ ] No ESLint errors
- [ ] All API endpoints respond correctly
- [ ] Token refresh mechanism works
- [ ] Rate limiting functions properly
- [ ] Cache invalidation works
- [ ] Error boundaries catch exceptions
- [ ] Logging system operational

### Post-Fix Verification

1. **Functional Testing**:
   ```bash
   # Complete system test
   node scripts/test-meta-integration.js
   ```

2. **Load Testing**:
   ```bash
   # Stress test API endpoints
   npm run test:crash
   ```

3. **User Acceptance Testing**:
   - Test all user workflows
   - Verify data accuracy
   - Check responsive design
   - Test offline functionality

## Performance Optimization

### Immediate Performance Fixes

1. **Enable Smart Caching**:
   ```javascript
   // 5-minute cache for campaigns
   const CACHE_TTL = {
     campaigns: 300000,
     insights: 600000,
     demographics: 1800000
   }
   ```

2. **Implement Rate Limiting**:
   ```javascript
   // Max 30 requests per minute
   const RATE_LIMIT = {
     maxRequests: 30,
     windowMs: 60000,
     queueRequests: true
   }
   ```

3. **Code Splitting**:
   - Lazy load heavy components
   - Dynamic imports for optional features
   - Bundle size optimization

### Performance Monitoring

- **Metrics to Track**:
  - Initial page load time (target: < 2 seconds)
  - API response time (target: < 500ms)
  - Memory usage (target: < 100MB)
  - Bundle size (target: < 1.5MB)

## Prevention Measures

### 1. Automated Monitoring

```bash
# Set up continuous health monitoring
crontab -e
# Add: */5 * * * * /path/to/scripts/health-check.sh
```

### 2. Error Prevention

- **Input Validation**: All user inputs validated
- **API Error Handling**: Comprehensive try-catch blocks
- **Token Refresh**: Automatic token refresh before expiry
- **Graceful Degradation**: Fallback modes for feature failures

### 3. Development Best Practices

- **Pre-commit Hooks**: Run linting and type checking
- **Automated Testing**: Unit tests for critical functions
- **Code Reviews**: Peer review before merging
- **Documentation**: Keep SOPs updated with each change

## Success Criteria

### Immediate Success (within 30 minutes)
- [ ] Dashboard loads without 500 errors
- [ ] User can authenticate successfully
- [ ] Campaign data displays correctly
- [ ] No console errors during normal operation

### Long-term Success (within 24 hours)
- [ ] System remains stable under normal load
- [ ] Performance metrics within target ranges
- [ ] Error rate < 1% of requests
- [ ] User satisfaction with dashboard responsiveness

### Maintenance Success (ongoing)
- [ ] Automated monitoring alerts working
- [ ] Monthly performance reviews conducted
- [ ] SOP documentation kept current
- [ ] Team trained on troubleshooting procedures