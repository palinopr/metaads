# Meta Ads Integration Testing Guide

## Overview

This guide documents the comprehensive testing and validation tools added to the Meta Ads integration. These tools help identify and debug common issues with the Meta Ads API integration.

## Testing Components

### 1. Test Endpoint: `/api/test-meta-complete`

A comprehensive test endpoint that validates the entire Meta Ads data flow.

**Features:**
- Access token validation
- Ad account ID format checking
- Meta API connection testing
- Campaign and ad set fetching with timing
- Data integrity validation
- Detailed error reporting

**Usage:**
```bash
curl -X POST http://localhost:3000/api/test-meta-complete \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "YOUR_ACCESS_TOKEN",
    "adAccountId": "act_123456789",
    "datePreset": "last_30d"
  }'
```

### 2. Test UI: `/test-meta-complete`

A user-friendly interface for running integration tests.

**Features:**
- Visual test execution
- Real-time progress tracking
- Detailed result visualization
- Error and warning display
- Performance metrics

**Access:** Navigate to `http://localhost:3000/test-meta-complete`

### 3. Debug Utilities Library: `lib/meta-debug-utils.ts`

A collection of debugging utilities for Meta Ads integration.

**Components:**

#### PerformanceTimer
Tracks operation timing for performance analysis.
```typescript
const timer = new PerformanceTimer()
timer.start('fetchCampaigns')
// ... operation ...
timer.end('fetchCampaigns')
console.log(timer.getReport())
```

#### logCampaignStructure
Logs detailed campaign structure for debugging.
```typescript
logCampaignStructure(campaign, detailed = true)
```

#### validateCampaignData
Validates campaign data integrity.
```typescript
const validation = validateCampaignData(campaigns)
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors)
}
```

#### RateLimitTracker
Monitors and manages API rate limits.
```typescript
const rateLimiter = new RateLimitTracker()
rateLimiter.recordRequest('campaigns')
if (rateLimiter.shouldThrottle('campaigns')) {
  await delay(rateLimiter.getWaitTime('campaigns'))
}
```

#### fetchWithRetry
Implements retry logic with exponential backoff.
```typescript
const data = await fetchWithRetry(
  () => fetchCampaignData(),
  maxRetries = 3,
  delayMs = 1000,
  backoffMultiplier = 2
)
```

### 4. Enhanced API Client: `lib/meta-api-enhanced-client.ts`

An enhanced version of the Meta API client with error recovery and comprehensive metrics.

**Features:**
- Automatic retry on failures
- Token validation
- Rate limit handling
- Fallback data generation
- Performance tracking
- Detailed error reporting

**Usage:**
```typescript
const client = new EnhancedMetaAPIClient(accessToken, adAccountId, debugMode = true)

// Get campaigns with enhanced error handling
const campaigns = await client.getEnhancedCampaigns('last_30d')

// Test full integration flow
const testResult = await client.testFullFlow('last_30d')
console.log(testResult.report)
```

### 5. Command-Line Test Tool: `scripts/test-meta-integration.js`

A CLI tool for quick integration testing.

**Usage:**
```bash
node scripts/test-meta-integration.js <access_token> <ad_account_id> [date_preset]

# Example:
node scripts/test-meta-integration.js YOUR_TOKEN act_123456789 last_30d
```

## Common Issues and Solutions

### 1. Invalid Access Token
**Symptoms:** 
- Error: "Invalid OAuth 2.0 Access Token"
- HTTP 400 errors

**Solution:**
- Verify token hasn't expired
- Check token has required permissions: `ads_management`, `ads_read`
- Ensure token is not prefixed with "Bearer " (the API client handles this)

### 2. Invalid Ad Account ID
**Symptoms:**
- Error: "Invalid account ID format"
- Validation failures

**Solution:**
- Ensure account ID starts with "act_"
- Format: `act_123456789` (only numbers after "act_")

### 3. No Insights Data
**Symptoms:**
- Campaigns show but all metrics are 0
- "No insights data available" warnings

**Solution:**
- Check date range - campaigns may not have data for selected period
- Verify campaigns have been running and have spend
- Try different date presets (today, yesterday, last_7d, last_30d)

### 4. Rate Limiting
**Symptoms:**
- Error code 17 or 4
- "Too many requests" errors

**Solution:**
- The enhanced client includes automatic rate limiting
- Reduce parallel requests
- Implement delays between requests

### 5. Missing Ad Sets
**Symptoms:**
- Campaigns show "0 ad sets" despite having ad sets

**Solution:**
- Check if user has permission to view ad sets
- Verify ad sets are not archived
- Use the test endpoint to debug ad set fetching

## Testing Workflow

1. **Initial Validation**
   ```bash
   # Test basic connection
   curl -X POST http://localhost:3000/api/test-meta \
     -H "Content-Type: application/json" \
     -d '{"accessToken": "YOUR_TOKEN", "adAccountId": "act_123456789"}'
   ```

2. **Comprehensive Testing**
   - Navigate to `/test-meta-complete`
   - Enter credentials
   - Run full test suite
   - Review results and timing

3. **Debug Specific Issues**
   ```typescript
   // In your code
   import { logCampaignStructure, validateCampaignData } from '@/lib/meta-debug-utils'
   
   const campaigns = await fetchCampaigns()
   campaigns.forEach(campaign => logCampaignStructure(campaign))
   
   const validation = validateCampaignData(campaigns)
   console.log('Validation result:', validation)
   ```

4. **Performance Analysis**
   - Check timing in test results
   - Identify slow operations
   - Optimize based on findings

## Best Practices

1. **Always validate tokens before making requests**
   - Use the token validation utility
   - Handle token expiration gracefully

2. **Implement proper error handling**
   - Use try-catch blocks
   - Log errors with context
   - Provide fallback data when appropriate

3. **Monitor rate limits**
   - Use RateLimitTracker
   - Implement delays between batch requests
   - Cache responses when possible

4. **Test with different scenarios**
   - Active campaigns with spend
   - Paused campaigns
   - Campaigns without data
   - Different date ranges

5. **Use debug mode in development**
   ```typescript
   const client = new EnhancedMetaAPIClient(token, accountId, true)
   ```

## Troubleshooting Checklist

- [ ] Access token is valid and not expired
- [ ] Ad account ID follows correct format (act_NUMBERS)
- [ ] Token has required permissions (ads_management, ads_read)
- [ ] Selected date range contains campaign data
- [ ] API rate limits are not exceeded
- [ ] Network connection is stable
- [ ] Meta API service is operational

## Support

For additional help:
1. Check the test endpoint results for specific errors
2. Review debug logs in the console
3. Use the command-line tool for quick validation
4. Examine the META_API_TROUBLESHOOTING.md guide