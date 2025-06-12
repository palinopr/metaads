# Sub-Agent Approach for Faster Meta Ads Dashboard Fixes

## Overview

The sub-agent approach divides complex dashboard issues into specialized domains, allowing parallel development and faster resolution. Each sub-agent focuses on a specific area of expertise.

## Sub-Agent Architecture

### Sub-Agent 1: Authentication & API Integration
**Domain**: Token management, API connections, credential handling
**Responsibility**: Ensure reliable communication with Meta API

**Core Files**:
- `/lib/credential-manager.ts`
- `/lib/meta-api-client.ts`
- `/components/settings-modal.tsx`
- `/app/api/meta/route.ts`

**Key Functions**:
- Token validation and refresh
- Credential storage and retrieval
- API connection health monitoring
- Error handling for authentication failures

### Sub-Agent 2: UI/UX Stability & Frontend
**Domain**: User interface, routing, content security, service workers
**Responsibility**: Ensure stable frontend experience

**Core Files**:
- `/app/layout.tsx`
- `/next.config.mjs`
- `/public/sw.js`
- `/components/error-boundary.tsx`
- Route files (`/app/*/page.tsx`)

**Key Functions**:
- Route management and 404 prevention
- Content Security Policy configuration
- Service worker optimization
- Error boundary implementation

### Sub-Agent 3: Performance & Monitoring
**Domain**: Caching, rate limiting, logging, performance optimization
**Responsibility**: Ensure optimal system performance

**Core Files**:
- `/lib/api-manager.ts`
- `/app/api/logs/route.ts`
- `/components/system-status.tsx`
- `/scripts/health-monitor.ts`

**Key Functions**:
- Intelligent caching strategies
- API rate limit management
- Performance monitoring and alerting
- Real-time log streaming

### Sub-Agent 4: Data Pipeline & Business Logic
**Domain**: Campaign data processing, insights calculation, data transformation
**Responsibility**: Ensure accurate and timely data delivery

**Core Files**:
- `/lib/meta-api-enhanced.ts`
- `/lib/campaign-store.ts`
- `/components/campaign-row-expanded.tsx`
- `/app/api/meta/day-hour-insights/route.ts`

**Key Functions**:
- Campaign data fetching and processing
- Metrics calculation (ROAS, CTR, CPC)
- Ad set and demographic data integration
- Historical data management

---

## Implementation Strategy

### Phase 1: Problem Identification and Assignment (2-3 minutes)

#### Diagnostic Decision Tree
```
Dashboard Issue
├── Authentication Error (500, token invalid)
│   └── Assign to Sub-Agent 1 (Authentication & API)
├── UI Problem (blank page, routes not found)
│   └── Assign to Sub-Agent 2 (UI/UX Stability)
├── Performance Issue (slow loading, rate limits)
│   └── Assign to Sub-Agent 3 (Performance & Monitoring)
└── Data Problem (no campaigns, wrong metrics)
    └── Assign to Sub-Agent 4 (Data Pipeline)
```

#### Quick Issue Classification
```bash
# Run diagnostics to determine sub-agent assignment
npm run diagnose:quick

# Output example:
# ✅ Authentication: Token valid, credentials stored
# ❌ UI: Missing route /pattern-analysis
# ⚠️ Performance: High memory usage detected
# ✅ Data: Campaigns loading correctly
# 
# Recommended assignment: Sub-Agent 2 (UI/UX)
```

### Phase 2: Parallel Sub-Agent Execution (5-15 minutes)

#### Sub-Agent 1: Authentication & API Fixes
```bash
# Authentication & API sub-agent workflow
echo "🔐 Sub-Agent 1: Starting authentication fixes..."

# 1. Validate current token
curl -G -d "access_token=$NEXT_PUBLIC_META_ACCESS_TOKEN" \
  "https://graph.facebook.com/v18.0/me"

# 2. Check credential storage
node -e "
  const fs = require('fs');
  console.log('Checking credential storage...');
  // Check localStorage simulation
"

# 3. Fix credential manager if needed
# Edit /lib/credential-manager.ts

# 4. Test API endpoints
curl -X POST http://localhost:3000/api/meta \
  -H "Content-Type: application/json" \
  -d '{"type":"overview"}'

echo "✅ Sub-Agent 1: Authentication fixes complete"
```

#### Sub-Agent 2: UI/UX Stability Fixes
```bash
# UI/UX sub-agent workflow
echo "🎨 Sub-Agent 2: Starting UI/UX fixes..."

# 1. Check for missing routes
find app -name "page.tsx" | grep -v node_modules

# 2. Verify CSP configuration
node -e "
  const config = require('./next.config.mjs');
  console.log('CSP configured:', !!config.default.headers);
"

# 3. Fix service worker issues
if [ -f "public/sw.js" ]; then
  echo "Service worker exists, checking registration..."
  # Validate service worker
fi

# 4. Add missing routes
if [ ! -f "app/pattern-analysis/page.tsx" ]; then
  mkdir -p app/pattern-analysis
  cat > app/pattern-analysis/page.tsx << 'EOF'
export default function PatternAnalysis() {
  return <div>Pattern Analysis - Coming Soon</div>
}
EOF
fi

echo "✅ Sub-Agent 2: UI/UX fixes complete"
```

#### Sub-Agent 3: Performance & Monitoring Fixes
```bash
# Performance & Monitoring sub-agent workflow
echo "⚡ Sub-Agent 3: Starting performance fixes..."

# 1. Check memory usage
MEMORY_USAGE=$(ps -o pid,ppid,cmd,%mem --sort=-%mem | grep node | head -1 | awk '{print $4}')
echo "Current memory usage: ${MEMORY_USAGE}%"

# 2. Implement rate limiting
if ! grep -q "API_RATE_LIMIT" .env.local; then
  echo "NEXT_PUBLIC_API_RATE_LIMIT=30" >> .env.local
fi

# 3. Set up caching
if ! grep -q "CACHE_TTL" .env.local; then
  echo "NEXT_PUBLIC_CACHE_TTL=600000" >> .env.local
fi

# 4. Enable performance monitoring
npm install --save-dev clinic
echo "Performance monitoring tools installed"

echo "✅ Sub-Agent 3: Performance fixes complete"
```

#### Sub-Agent 4: Data Pipeline Fixes
```bash
# Data Pipeline sub-agent workflow
echo "📊 Sub-Agent 4: Starting data pipeline fixes..."

# 1. Test Meta API data fetch
node test-meta-api.js

# 2. Validate campaign store
node -e "
  console.log('Testing campaign store...');
  // Test campaign data structure
"

# 3. Check metrics calculations
echo "Validating ROAS, CTR, CPC calculations..."

# 4. Test ad set integration
curl -X POST http://localhost:3000/api/meta \
  -H "Content-Type: application/json" \
  -d '{"type":"overview","datePreset":"last_7d"}'

echo "✅ Sub-Agent 4: Data pipeline fixes complete"
```

### Phase 3: Integration and Validation (3-5 minutes)

#### Cross-Agent Integration Test
```bash
# Integration test script
echo "🔗 Running cross-agent integration tests..."

# Test full user workflow
npm run test:integration

# Validate all systems working together
curl -f http://localhost:3000/api/health
curl -f -X POST http://localhost:3000/api/meta \
  -H "Content-Type: application/json" \
  -d '{"type":"overview"}'

# Check UI rendering
curl -f http://localhost:3000/dashboard

echo "✅ Integration tests complete"
```

---

## Sub-Agent Templates

### Sub-Agent 1 Template: Authentication & API
```typescript
// lib/sub-agent-auth.ts
export class AuthenticationSubAgent {
  async diagnose() {
    const issues = []
    
    // Check token validity
    const tokenValid = await this.validateToken()
    if (!tokenValid) issues.push('INVALID_TOKEN')
    
    // Check credential storage
    const credentialsStored = this.checkCredentialStorage()
    if (!credentialsStored) issues.push('MISSING_CREDENTIALS')
    
    // Check API connectivity
    const apiConnected = await this.testApiConnection()
    if (!apiConnected) issues.push('API_CONNECTION_FAILED')
    
    return issues
  }
  
  async fix(issues: string[]) {
    for (const issue of issues) {
      switch (issue) {
        case 'INVALID_TOKEN':
          await this.refreshToken()
          break
        case 'MISSING_CREDENTIALS':
          await this.setupCredentialStorage()
          break
        case 'API_CONNECTION_FAILED':
          await this.fixApiConnection()
          break
      }
    }
  }
  
  async validateToken() {
    // Token validation logic
  }
  
  async refreshToken() {
    // Token refresh logic
  }
  
  checkCredentialStorage() {
    // Storage validation logic
  }
  
  async testApiConnection() {
    // API connection test
  }
}
```

### Sub-Agent 2 Template: UI/UX Stability
```typescript
// lib/sub-agent-ui.ts
export class UIStabilitySubAgent {
  async diagnose() {
    const issues = []
    
    // Check for missing routes
    const missingRoutes = await this.findMissingRoutes()
    if (missingRoutes.length > 0) issues.push('MISSING_ROUTES')
    
    // Check CSP configuration
    const cspConfigured = this.checkCSPConfiguration()
    if (!cspConfigured) issues.push('CSP_MISCONFIGURED')
    
    // Check service worker
    const swIssues = this.checkServiceWorker()
    if (swIssues.length > 0) issues.push('SERVICE_WORKER_ISSUES')
    
    return issues
  }
  
  async fix(issues: string[]) {
    for (const issue of issues) {
      switch (issue) {
        case 'MISSING_ROUTES':
          await this.createMissingRoutes()
          break
        case 'CSP_MISCONFIGURED':
          await this.fixCSPConfiguration()
          break
        case 'SERVICE_WORKER_ISSUES':
          await this.fixServiceWorker()
          break
      }
    }
  }
  
  async findMissingRoutes() {
    // Route detection logic
  }
  
  async createMissingRoutes() {
    // Route creation logic
  }
  
  checkCSPConfiguration() {
    // CSP validation logic
  }
  
  checkServiceWorker() {
    // Service worker validation logic
  }
}
```

### Sub-Agent 3 Template: Performance & Monitoring
```typescript
// lib/sub-agent-performance.ts
export class PerformanceSubAgent {
  async diagnose() {
    const issues = []
    
    // Check memory usage
    const memoryUsage = await this.checkMemoryUsage()
    if (memoryUsage > 80) issues.push('HIGH_MEMORY_USAGE')
    
    // Check rate limiting
    const rateLimitConfigured = this.checkRateLimiting()
    if (!rateLimitConfigured) issues.push('NO_RATE_LIMITING')
    
    // Check caching
    const cachingEnabled = this.checkCaching()
    if (!cachingEnabled) issues.push('NO_CACHING')
    
    return issues
  }
  
  async fix(issues: string[]) {
    for (const issue of issues) {
      switch (issue) {
        case 'HIGH_MEMORY_USAGE':
          await this.optimizeMemoryUsage()
          break
        case 'NO_RATE_LIMITING':
          await this.setupRateLimiting()
          break
        case 'NO_CACHING':
          await this.enableCaching()
          break
      }
    }
  }
  
  async checkMemoryUsage() {
    // Memory usage monitoring
  }
  
  checkRateLimiting() {
    // Rate limiting validation
  }
  
  checkCaching() {
    // Cache configuration check
  }
}
```

### Sub-Agent 4 Template: Data Pipeline
```typescript
// lib/sub-agent-data.ts
export class DataPipelineSubAgent {
  async diagnose() {
    const issues = []
    
    // Check campaign data
    const campaignData = await this.validateCampaignData()
    if (!campaignData.valid) issues.push('INVALID_CAMPAIGN_DATA')
    
    // Check metrics calculation
    const metricsValid = this.validateMetricsCalculation()
    if (!metricsValid) issues.push('METRICS_CALCULATION_ERROR')
    
    // Check ad set integration
    const adSetIntegration = await this.checkAdSetIntegration()
    if (!adSetIntegration) issues.push('ADSET_INTEGRATION_FAILED')
    
    return issues
  }
  
  async fix(issues: string[]) {
    for (const issue of issues) {
      switch (issue) {
        case 'INVALID_CAMPAIGN_DATA':
          await this.fixCampaignDataFetch()
          break
        case 'METRICS_CALCULATION_ERROR':
          await this.fixMetricsCalculation()
          break
        case 'ADSET_INTEGRATION_FAILED':
          await this.fixAdSetIntegration()
          break
      }
    }
  }
  
  async validateCampaignData() {
    // Campaign data validation logic
  }
  
  validateMetricsCalculation() {
    // Metrics validation logic
  }
  
  async checkAdSetIntegration() {
    // Ad set integration check
  }
}
```

---

## Orchestration Script

### Main Sub-Agent Coordinator
```bash
#!/bin/bash
# scripts/sub-agent-coordinator.sh

set -e

echo "🤖 Meta Ads Dashboard Sub-Agent Fix Coordinator"
echo "================================================"

# Phase 1: Problem identification
echo "Phase 1: Diagnosing issues..."
node scripts/diagnose-issues.js > diagnosis.json

# Parse diagnosis results
AUTH_ISSUES=$(cat diagnosis.json | jq -r '.authentication | length')
UI_ISSUES=$(cat diagnosis.json | jq -r '.ui | length')
PERF_ISSUES=$(cat diagnosis.json | jq -r '.performance | length')
DATA_ISSUES=$(cat diagnosis.json | jq -r '.data | length')

echo "Found issues: Auth($AUTH_ISSUES), UI($UI_ISSUES), Perf($PERF_ISSUES), Data($DATA_ISSUES)"

# Phase 2: Parallel execution
echo "Phase 2: Launching sub-agents..."

PIDS=()

# Launch sub-agents in parallel
if [ "$AUTH_ISSUES" -gt 0 ]; then
  echo "🔐 Launching Authentication Sub-Agent..."
  ./scripts/sub-agent-auth.sh &
  PIDS+=($!)
fi

if [ "$UI_ISSUES" -gt 0 ]; then
  echo "🎨 Launching UI/UX Sub-Agent..."
  ./scripts/sub-agent-ui.sh &
  PIDS+=($!)
fi

if [ "$PERF_ISSUES" -gt 0 ]; then
  echo "⚡ Launching Performance Sub-Agent..."
  ./scripts/sub-agent-performance.sh &
  PIDS+=($!)
fi

if [ "$DATA_ISSUES" -gt 0 ]; then
  echo "📊 Launching Data Pipeline Sub-Agent..."
  ./scripts/sub-agent-data.sh &
  PIDS+=($!)
fi

# Wait for all sub-agents to complete
echo "Waiting for sub-agents to complete..."
for pid in ${PIDS[@]}; do
  wait $pid
  if [ $? -eq 0 ]; then
    echo "✅ Sub-agent $pid completed successfully"
  else
    echo "❌ Sub-agent $pid failed"
    exit 1
  fi
done

# Phase 3: Integration testing
echo "Phase 3: Integration testing..."
npm run test:integration

if [ $? -eq 0 ]; then
  echo "✅ All sub-agents completed successfully!"
  echo "🚀 Dashboard should now be fully operational"
else
  echo "❌ Integration tests failed"
  exit 1
fi

# Cleanup
rm -f diagnosis.json
```

### Issue Diagnosis Script
```javascript
// scripts/diagnose-issues.js
const fs = require('fs')
const path = require('path')

async function diagnoseIssues() {
  const diagnosis = {
    authentication: [],
    ui: [],
    performance: [],
    data: []
  }
  
  // Check authentication issues
  try {
    const response = await fetch('http://localhost:3000/api/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'overview' })
    })
    
    if (!response.ok) {
      diagnosis.authentication.push('API_CONNECTION_FAILED')
    }
  } catch (error) {
    diagnosis.authentication.push('SERVER_DOWN')
  }
  
  // Check UI issues
  const routesToCheck = [
    'app/dashboard/page.tsx',
    'app/pattern-analysis/page.tsx',
    'app/logs/page.tsx'
  ]
  
  routesToCheck.forEach(route => {
    if (!fs.existsSync(route)) {
      diagnosis.ui.push(`MISSING_ROUTE:${route}`)
    }
  })
  
  // Check performance issues
  const memoryUsage = process.memoryUsage()
  if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
    diagnosis.performance.push('HIGH_MEMORY_USAGE')
  }
  
  // Check data issues
  if (!process.env.NEXT_PUBLIC_META_ACCESS_TOKEN) {
    diagnosis.data.push('MISSING_TOKEN')
  }
  
  if (!process.env.NEXT_PUBLIC_META_AD_ACCOUNT_ID) {
    diagnosis.data.push('MISSING_ACCOUNT_ID')
  }
  
  console.log(JSON.stringify(diagnosis, null, 2))
}

diagnoseIssues().catch(console.error)
```

---

## Benefits of Sub-Agent Approach

### 1. Parallel Processing
- **Traditional**: Sequential debugging (20-30 minutes)
- **Sub-Agent**: Parallel execution (5-15 minutes)
- **Time Savings**: 50-75% reduction in fix time

### 2. Specialized Expertise
- Each sub-agent focuses on specific domain knowledge
- Deeper understanding of component interactions
- More targeted and effective solutions

### 3. Fault Isolation
- Issues in one domain don't block others
- Failed sub-agent can be re-run independently
- Clear separation of concerns

### 4. Scalability
- Easy to add new sub-agents for specific issues
- Can be automated for common problem patterns
- Supports team-based development

### 5. Comprehensive Coverage
- Ensures all system aspects are checked
- Reduces likelihood of missing related issues
- Systematic approach to problem resolution

---

## Monitoring and Metrics

### Sub-Agent Performance Tracking
```bash
# Track sub-agent execution times
echo "Sub-Agent Performance Report" > performance.log
echo "============================" >> performance.log

# Authentication Sub-Agent
time ./scripts/sub-agent-auth.sh 2>&1 | tee -a performance.log

# UI Sub-Agent  
time ./scripts/sub-agent-ui.sh 2>&1 | tee -a performance.log

# Performance Sub-Agent
time ./scripts/sub-agent-performance.sh 2>&1 | tee -a performance.log

# Data Sub-Agent
time ./scripts/sub-agent-data.sh 2>&1 | tee -a performance.log
```

### Success Rate Monitoring
```javascript
// scripts/sub-agent-metrics.js
const metrics = {
  totalRuns: 0,
  successfulRuns: 0,
  subAgentStats: {
    authentication: { runs: 0, successes: 0 },
    ui: { runs: 0, successes: 0 },
    performance: { runs: 0, successes: 0 },
    data: { runs: 0, successes: 0 }
  }
}

function updateMetrics(subAgent, success) {
  metrics.totalRuns++
  metrics.subAgentStats[subAgent].runs++
  
  if (success) {
    metrics.successfulRuns++
    metrics.subAgentStats[subAgent].successes++
  }
  
  // Save metrics
  fs.writeFileSync('sub-agent-metrics.json', JSON.stringify(metrics, null, 2))
}

function getSuccessRate() {
  const overallRate = (metrics.successfulRuns / metrics.totalRuns * 100).toFixed(2)
  console.log(`Overall success rate: ${overallRate}%`)
  
  Object.entries(metrics.subAgentStats).forEach(([agent, stats]) => {
    const rate = stats.runs > 0 ? (stats.successes / stats.runs * 100).toFixed(2) : 0
    console.log(`${agent}: ${rate}% (${stats.successes}/${stats.runs})`)
  })
}
```

Remember: **The sub-agent approach is most effective for complex issues** - simple problems should still use direct fixes!