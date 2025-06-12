# Deployment and Testing Procedures

## Pre-Deployment Testing Checklist

### Phase 1: Code Quality Validation (5-10 minutes)

#### 1.1 TypeScript Compilation
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Expected output: No errors
# If errors found: Fix before proceeding
```

#### 1.2 Linting and Code Standards
```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Check for remaining issues
npm run lint -- --max-warnings 0
```

#### 1.3 Security Scan
```bash
# Check for security vulnerabilities
npm audit

# Fix high/critical vulnerabilities
npm audit fix

# Check for sensitive data in code
grep -r "access_token\|password\|secret" --exclude-dir=node_modules .
```

### Phase 2: Build and Bundle Validation (3-5 minutes)

#### 2.1 Build Process
```bash
# Clean previous build
rm -rf .next

# Create production build
npm run build

# Check build output for errors/warnings
# Build should complete without errors
```

#### 2.2 Bundle Analysis
```bash
# Analyze bundle size (if @next/bundle-analyzer installed)
ANALYZE=true npm run build

# Check for:
# - Bundle size < 1.5MB
# - No duplicate dependencies
# - Proper code splitting
```

#### 2.3 Environment Variables
```bash
# Verify all required env vars are set
echo "Checking environment variables..."
node -e "
  const required = ['NEXT_PUBLIC_META_ACCESS_TOKEN', 'NEXT_PUBLIC_META_AD_ACCOUNT_ID'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error('Missing required env vars:', missing);
    process.exit(1);
  }
  console.log('All required environment variables are set');
"
```

### Phase 3: Functional Testing (10-15 minutes)

#### 3.1 API Connectivity Test
```bash
# Test Meta API connection
node test-meta-api.js

# Expected output:
# ✓ Token is valid
# ✓ Ad account accessible
# ✓ Campaigns retrieved
# ✓ Ad sets retrieved
```

#### 3.2 Local Server Testing
```bash
# Start development server
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 10

# Test endpoints
curl -f http://localhost:3000/api/health || echo "Health check failed"
curl -f http://localhost:3000/api/meta -X POST -H "Content-Type: application/json" -d '{"type":"overview"}' || echo "Meta API failed"

# Stop server
kill $SERVER_PID
```

#### 3.3 Integration Testing
```bash
# Run comprehensive integration tests
npm run test:integration

# This should test:
# - All API endpoints
# - Database operations
# - External service connections
# - Error handling scenarios
```

### Phase 4: Performance and Load Testing (5-10 minutes)

#### 4.1 Memory Leak Test
```bash
# Start server with memory monitoring
NODE_OPTIONS="--max-old-space-size=512" npm run dev &
SERVER_PID=$!

# Run memory stress test
node scripts/memory-monitor.js &
MONITOR_PID=$!

# Wait for test completion
sleep 300  # 5 minutes

# Check results
kill $MONITOR_PID
kill $SERVER_PID

# Memory should not exceed 512MB during normal operation
```

#### 4.2 API Rate Limit Test
```bash
# Test rate limiting behavior
node scripts/crash-test.js rapid-api-calls

# Expected behavior:
# - Requests queued when limit hit
# - No server crashes
# - Graceful degradation
```

#### 4.3 Load Testing
```bash
# Simulate multiple concurrent users
npm run test:load

# This should test:
# - 10 concurrent users
# - 100 requests per user
# - Response time < 2 seconds
# - No memory leaks
```

---

## Deployment Procedures

### Development Deployment

#### 1. Local Development Setup
```bash
# 1. Clone/update repository
git pull origin main

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local with actual credentials

# 4. Start development server
npm run dev

# 5. Verify functionality
open http://localhost:3000
```

#### 2. Development Testing Workflow
```bash
# Before making changes
git checkout -b feature/your-feature-name

# After making changes
npm run test:pre-deploy
npm run build
npm run test:integration

# If all tests pass
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

### Staging Deployment

#### 1. Staging Environment Setup
```bash
# 1. Deploy to staging server
rsync -av --exclude node_modules . staging-server:/path/to/app/

# 2. Install dependencies on staging
ssh staging-server "cd /path/to/app && npm install"

# 3. Build for staging
ssh staging-server "cd /path/to/app && npm run build"

# 4. Start staging server
ssh staging-server "cd /path/to/app && pm2 start ecosystem.config.js --env staging"
```

#### 2. Staging Validation
```bash
# Test staging environment
curl -f https://staging.yourdomain.com/api/health
curl -f https://staging.yourdomain.com/api/meta -X POST -H "Content-Type: application/json" -d '{"type":"overview"}'

# Run automated tests against staging
STAGING_URL=https://staging.yourdomain.com npm run test:e2e
```

### Production Deployment

#### 1. Pre-Production Checklist
- [ ] All tests passing in staging
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Backup of current production ready
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

#### 2. Production Deployment Steps
```bash
# 1. Create production build
npm run build:production

# 2. Run final validation
npm run test:production

# 3. Deploy to production (zero-downtime)
pm2 start ecosystem.config.js --env production

# 4. Health check
curl -f https://yourdomain.com/api/health

# 5. Monitor for 15 minutes
pm2 logs --lines 50
```

#### 3. Post-Deployment Validation
```bash
# 1. Functional verification
curl -f https://yourdomain.com/api/meta -X POST -H "Content-Type: application/json" -d '{"type":"overview"}'

# 2. Performance check
curl -w "@curl-timing.txt" -o /dev/null -s https://yourdomain.com/

# 3. Monitor error rates
tail -f /var/log/application/error.log | grep ERROR | wc -l

# 4. Check memory usage
pm2 monit
```

---

## Automated Testing Framework

### Test Suite Organization

#### Unit Tests
```bash
# Test individual functions and components
npm run test:unit

# Coverage report
npm run test:coverage

# Expected coverage: >80%
```

#### Integration Tests
```bash
# Test API endpoints and data flow
npm run test:integration

# Test database operations
npm run test:db

# Test external API integrations
npm run test:api
```

#### End-to-End Tests
```bash
# Test complete user workflows
npm run test:e2e

# Test different browsers
npm run test:browser-compat

# Test responsive design
npm run test:responsive
```

### Custom Test Scripts

#### API Health Test
```javascript
// scripts/test-api-health.js
const fetch = require('node-fetch')

const testApiHealth = async () => {
  const tests = [
    { name: 'Health Check', url: '/api/health', method: 'GET' },
    { name: 'Meta API', url: '/api/meta', method: 'POST', body: { type: 'overview' } },
    { name: 'Logs API', url: '/api/logs', method: 'GET' }
  ]
  
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000'
  
  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`)
      
      const options = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' }
      }
      
      if (test.body) {
        options.body = JSON.stringify(test.body)
      }
      
      const response = await fetch(`${baseUrl}${test.url}`, options)
      
      if (response.ok) {
        console.log(`✓ ${test.name} passed`)
      } else {
        console.error(`✗ ${test.name} failed: ${response.status}`)
        process.exit(1)
      }
    } catch (error) {
      console.error(`✗ ${test.name} error:`, error.message)
      process.exit(1)
    }
  }
  
  console.log('All API health tests passed!')
}

testApiHealth()
```

#### Performance Benchmark Test
```javascript
// scripts/performance-test.js
const puppeteer = require('puppeteer')

const performanceTest = async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  
  // Enable performance monitoring
  await page.setCacheEnabled(false)
  
  console.log('Testing page load performance...')
  
  const startTime = Date.now()
  await page.goto('http://localhost:3000')
  
  // Wait for dashboard to load
  await page.waitForSelector('[data-testid="dashboard-loaded"]', { timeout: 30000 })
  
  const loadTime = Date.now() - startTime
  
  // Check performance metrics
  const metrics = await page.metrics()
  
  console.log(`Page load time: ${loadTime}ms`)
  console.log(`JS heap used: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`)
  
  // Performance thresholds
  const thresholds = {
    loadTime: 5000,  // 5 seconds max
    memoryUsage: 100  // 100MB max
  }
  
  const memoryUsageMB = Math.round(metrics.JSHeapUsedSize / 1024 / 1024)
  
  if (loadTime > thresholds.loadTime) {
    console.error(`Performance test failed: Load time ${loadTime}ms exceeds threshold ${thresholds.loadTime}ms`)
    process.exit(1)
  }
  
  if (memoryUsageMB > thresholds.memoryUsage) {
    console.error(`Performance test failed: Memory usage ${memoryUsageMB}MB exceeds threshold ${thresholds.memoryUsage}MB`)
    process.exit(1)
  }
  
  await browser.close()
  console.log('Performance test passed!')
}

performanceTest().catch(error => {
  console.error('Performance test failed:', error)
  process.exit(1)
})
```

---

## Continuous Integration Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy Meta Ads Dashboard

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run TypeScript check
      run: npx tsc --noEmit
    
    - name: Run linting
      run: npm run lint
    
    - name: Run security audit
      run: npm audit --audit-level high
    
    - name: Build application
      run: npm run build
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        NEXT_PUBLIC_META_ACCESS_TOKEN: ${{ secrets.META_ACCESS_TOKEN }}
        NEXT_PUBLIC_META_AD_ACCOUNT_ID: ${{ secrets.META_AD_ACCOUNT_ID }}

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to staging
      run: |
        # Deploy staging logic here
        echo "Deploying to staging..."
    
    - name: Run staging tests
      run: |
        # Staging validation tests
        npm run test:staging

  deploy-production:
    needs: [test, deploy-staging]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        # Production deployment logic
        echo "Deploying to production..."
    
    - name: Post-deployment validation
      run: |
        # Production validation tests
        npm run test:production
```

---

## Rollback Procedures

### Emergency Rollback
```bash
# 1. Immediate rollback to last known good version
pm2 stop all
git checkout [last-known-good-commit]
npm install
npm run build
pm2 start ecosystem.config.js --env production

# 2. Verify rollback success
curl -f https://yourdomain.com/api/health

# 3. Monitor for stability
pm2 logs --lines 100
```

### Planned Rollback
```bash
# 1. Create rollback point before deployment
git tag -a "pre-deployment-$(date +%Y%m%d-%H%M%S)" -m "Pre-deployment checkpoint"

# 2. If rollback needed
git checkout [rollback-tag]
npm install
npm run build
pm2 reload ecosystem.config.js

# 3. Validate rollback
npm run test:production
```

---

## Monitoring and Alerting

### Performance Monitoring
```bash
# Set up monitoring scripts
crontab -e

# Add these entries:
# Check health every 5 minutes
*/5 * * * * /path/to/scripts/health-check.sh

# Performance report every hour
0 * * * * /path/to/scripts/performance-report.sh

# Daily deployment summary
0 9 * * * /path/to/scripts/daily-report.sh
```

Remember: **Always test in staging before production deployment** and **have a rollback plan ready**!