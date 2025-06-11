# Localhost:3000 Testing Guide

This guide provides comprehensive testing procedures for verifying all fixes and functionality on http://localhost:3000/.

## Prerequisites

Before testing, ensure:
- Node.js and npm are installed
- All dependencies are installed (`npm install`)
- Development server is running (`npm run dev`)
- Server is accessible at http://localhost:3000/

## 1. Initial Setup Verification

### Start the Development Server
```bash
# From the project root directory
npm run dev

# Verify server is running
# You should see: "Server running at http://localhost:3000"
```

### Check Server Health
```bash
# Test if server is responding
curl http://localhost:3000/health

# Expected response: {"status":"ok"}
```

## 2. Dashboard Testing Procedures

### 2.1 Dashboard Loading Verification

1. **Open Dashboard**
   - Navigate to: http://localhost:3000/
   - Verify page loads without errors
   - Check for loading indicators

2. **Verify Data Loading**
   ```bash
   # Check network tab in DevTools
   # Look for successful API calls to:
   - /api/campaigns
   - /api/ad-sets
   - /api/ads
   ```

3. **Console Error Check**
   - Open Browser DevTools (F12)
   - Navigate to Console tab
   - Refresh page
   - Verify NO errors appear
   - Common errors to watch for:
     - `Cannot read property of undefined`
     - `Failed to fetch`
     - `CORS policy` errors
     - `404 Not Found` errors

### 2.2 Dashboard Component Testing

**Campaign Selector**
- Click campaign dropdown
- Verify campaigns load
- Select different campaigns
- Verify data updates correctly

**Date Range Picker**
- Click date range selector
- Select different date ranges
- Verify data refreshes
- Check loading states work

**Metrics Display**
- Verify all metrics show values
- Check number formatting
- Verify currency displays correctly
- Test metric tooltips (if any)

## 3. Ad Sets Testing

### 3.1 Ad Sets Display Verification

1. **Load Ad Sets Page**
   ```bash
   # Direct navigation test
   open http://localhost:3000/ad-sets
   ```

2. **Verify Ad Sets Table**
   - Check table headers display
   - Verify data rows populate
   - Test sorting functionality
   - Check pagination works

3. **Ad Sets Interaction Testing**
   - Click on individual ad sets
   - Verify detail view loads
   - Test edit functionality
   - Check delete confirmations

### 3.2 Ad Sets API Testing

```bash
# Test ad sets endpoint
curl http://localhost:3000/api/ad-sets

# Test with campaign filter
curl http://localhost:3000/api/ad-sets?campaign_id=123

# Test pagination
curl http://localhost:3000/api/ad-sets?page=1&limit=10
```

## 4. API Endpoint Testing

### 4.1 Core API Endpoints

**Test Authentication (if applicable)**
```bash
# Test auth endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

**Test Campaign Endpoints**
```bash
# GET all campaigns
curl http://localhost:3000/api/campaigns

# GET specific campaign
curl http://localhost:3000/api/campaigns/123

# Test campaign metrics
curl http://localhost:3000/api/campaigns/123/metrics
```

**Test Ad Sets Endpoints**
```bash
# GET all ad sets
curl http://localhost:3000/api/ad-sets

# GET ad sets for campaign
curl http://localhost:3000/api/ad-sets?campaign_id=123

# GET specific ad set
curl http://localhost:3000/api/ad-sets/456
```

**Test Ads Endpoints**
```bash
# GET all ads
curl http://localhost:3000/api/ads

# GET ads for ad set
curl http://localhost:3000/api/ads?ad_set_id=456

# GET specific ad
curl http://localhost:3000/api/ads/789
```

### 4.2 API Response Validation

For each endpoint, verify:
- Status code is 200 for successful requests
- Response contains expected JSON structure
- No error messages in response
- Response time is under 1 second

## 5. Browser-Specific Testing

### 5.1 Chrome Testing

1. **Open Chrome DevTools**
   - Press F12 or Cmd+Option+I (Mac)
   - Check Console for errors
   - Monitor Network tab for failed requests

2. **Chrome-Specific Checks**
   - Test with Chrome extensions disabled
   - Verify in Incognito mode
   - Check responsive design mode

3. **Performance Testing**
   ```javascript
   // Run in Console
   performance.measure('page-load');
   console.log(performance.getEntriesByType('navigation'));
   ```

### 5.2 Firefox Testing

1. **Open Firefox Developer Tools**
   - Press F12 or Cmd+Option+I (Mac)
   - Check Web Console for errors
   - Monitor Network tab

2. **Firefox-Specific Checks**
   - Test with Enhanced Tracking Protection
   - Verify in Private Window
   - Check Responsive Design Mode

### 5.3 Safari Testing (Mac Only)

1. **Enable Developer Menu**
   - Safari > Preferences > Advanced
   - Check "Show Develop menu"

2. **Open Web Inspector**
   - Develop > Show Web Inspector
   - Check Console for errors
   - Monitor Network tab

3. **Safari-Specific Checks**
   - Test with Intelligent Tracking Prevention
   - Verify in Private Browsing
   - Check iOS simulator (if available)

### 5.4 Edge Testing

1. **Open Edge DevTools**
   - Press F12
   - Check Console for errors
   - Monitor Network tab

2. **Edge-Specific Checks**
   - Test with tracking prevention
   - Verify in InPrivate mode
   - Check IE mode compatibility (if needed)

## 6. Common Issues and Solutions

### 6.1 Server Won't Start

**Issue**: `npm run dev` fails
```bash
# Solution 1: Clear node_modules
rm -rf node_modules package-lock.json
npm install
npm run dev

# Solution 2: Check port availability
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill process using port 3000
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

### 6.2 API Requests Failing

**Issue**: 404 errors on API calls
```bash
# Check API route definitions
grep -r "router\|app\." --include="*.js" --include="*.ts" .

# Verify API prefix
# Ensure calls use correct prefix: /api/
```

**Issue**: CORS errors
```javascript
// Add to server configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### 6.3 Data Not Loading

**Issue**: Empty dashboard/tables
```bash
# Check database connection
npm run db:status  # if available

# Verify mock data is available
ls -la src/data/  # or wherever mock data is stored

# Check API responses
curl -v http://localhost:3000/api/campaigns
```

### 6.4 Console Errors

**Issue**: "Cannot read property of undefined"
```javascript
// Check for null/undefined before accessing properties
// Add optional chaining: object?.property?.subproperty
```

**Issue**: "Failed to fetch"
```bash
# Verify backend is running
ps aux | grep node  # Mac/Linux
tasklist | findstr node  # Windows

# Check network connectivity
ping localhost
```

## 7. Quick Testing Commands

### 7.1 Full System Test
```bash
# Run all tests in sequence
npm test && npm run dev

# In another terminal
npm run test:e2e  # if e2e tests exist
```

### 7.2 Component Testing
```bash
# Test specific components
npm test -- --testNamePattern="Dashboard"
npm test -- --testNamePattern="AdSets"
```

### 7.3 API Testing Script
```bash
#!/bin/bash
# Save as test-api.sh

echo "Testing API endpoints..."

# Test health
curl -s http://localhost:3000/health | jq .

# Test campaigns
echo "\nTesting /api/campaigns..."
curl -s http://localhost:3000/api/campaigns | jq '.[] | {id, name}'

# Test ad sets
echo "\nTesting /api/ad-sets..."
curl -s http://localhost:3000/api/ad-sets | jq '.[] | {id, name, campaign_id}'

# Test ads
echo "\nTesting /api/ads..."
curl -s http://localhost:3000/api/ads | jq '.[] | {id, name, ad_set_id}'
```

### 7.4 Browser Console Testing
```javascript
// Paste in browser console to test API
async function testAPI() {
  const endpoints = [
    '/api/campaigns',
    '/api/ad-sets',
    '/api/ads'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`);
      const data = await response.json();
      console.log(`✓ ${endpoint}: ${data.length} items`);
    } catch (error) {
      console.error(`✗ ${endpoint}: ${error.message}`);
    }
  }
}

testAPI();
```

## 8. Testing Checklist

Before considering the application ready:

- [ ] Server starts without errors
- [ ] Homepage loads at http://localhost:3000/
- [ ] No console errors in browser
- [ ] All API endpoints return data
- [ ] Dashboard displays campaign data
- [ ] Ad sets load and display correctly
- [ ] Filtering and sorting work
- [ ] Page navigation works
- [ ] Forms submit successfully
- [ ] Error states display appropriately
- [ ] Loading states appear during data fetch
- [ ] Responsive design works on mobile sizes
- [ ] Works in Chrome, Firefox, Safari, Edge
- [ ] Performance is acceptable (<3s page load)
- [ ] No memory leaks during extended use

## 9. Continuous Testing

### Development Mode Testing
```bash
# Watch mode for automatic testing
npm run test:watch

# Run linting
npm run lint

# Check for type errors (if using TypeScript)
npm run type-check
```

### Pre-commit Testing
```bash
# Add to .git/hooks/pre-commit
#!/bin/sh
npm run lint
npm test
```

## 10. Troubleshooting Resources

- Check `npm run dev` output for server errors
- Review browser console for client-side errors
- Check Network tab for failed requests
- Use React DevTools (if React) for component state
- Enable verbose logging in development mode
- Check localhost:3000/_debug (if debug route exists)

---

Remember: Always test in multiple browsers and clear cache between major testing sessions!