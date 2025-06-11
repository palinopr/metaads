# Meta Ads Dashboard - Error Codes & Solutions

## Meta API Error Codes

### Authentication Errors (100-199)

#### Error 100: Invalid OAuth Access Token
```json
{
  "error": {
    "code": 100,
    "message": "Invalid OAuth access token",
    "type": "OAuthException"
  }
}
```
**Cause**: Token is expired, malformed, or invalid
**Solution**:
```bash
# 1. Check token in debugger
curl -G -d "input_token=YOUR_TOKEN&access_token=YOUR_TOKEN" \
  "https://graph.facebook.com/debug_token"

# 2. Generate new token
# Go to Business Settings → System Users → Generate New Token

# 3. Clear cached credentials
localStorage.removeItem('metaCredentials')
```

#### Error 190: Access Token Has Expired
```json
{
  "error": {
    "code": 190,
    "message": "Error validating access token: Session has expired",
    "type": "OAuthException"
  }
}
```
**Cause**: Token expired or session invalid
**Solution**:
```javascript
// Auto-refresh token implementation
const refreshToken = async () => {
  const response = await fetch('/api/refresh-token', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${currentToken}` }
  })
  return response.json()
}
```

### Permission Errors (200-299)

#### Error 200: Insufficient Permissions  
```json
{
  "error": {
    "code": 200,
    "message": "The user hasn't authorized the application to perform this action",
    "type": "FacebookApiException"
  }
}
```
**Cause**: Token lacks required permissions
**Required Permissions**:
- `ads_management`
- `ads_read`
- `business_management`

**Solution**:
```bash
# 1. Check current permissions
curl -G -d "access_token=YOUR_TOKEN" \
  "https://graph.facebook.com/v18.0/me/permissions"

# 2. Request additional permissions through Business Settings
```

### Rate Limiting Errors (300-399)

#### Error 300: API Rate Limit Exceeded
```json
{
  "error": {
    "code": 4,
    "message": "Application request limit reached",
    "type": "OAuthException"
  }
}
```
**Cause**: Too many API requests in short time
**Solution**:
```javascript
// Implement exponential backoff
const apiCallWithRetry = async (url, options, retries = 3) => {
  try {
    const response = await fetch(url, options)
    if (response.status === 429) {
      if (retries > 0) {
        const delay = Math.pow(2, 3 - retries) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        return apiCallWithRetry(url, options, retries - 1)
      }
    }
    return response
  } catch (error) {
    console.error('API call failed:', error)
    throw error
  }
}
```

### Data Access Errors (400-499)

#### Error 403: Forbidden Access
```json
{
  "error": {
    "code": 403,
    "message": "The user does not have permission to access this ad account",
    "type": "FacebookApiException"
  }
}
```
**Cause**: System user lacks access to specific ad account
**Solution**:
```bash
# 1. Check ad account access in Business Settings
# 2. Add system user to ad account
# 3. Verify account ID format: act_XXXXXXXXXX
```

#### Error 404: Account Not Found
```json
{
  "error": {
    "code": 803,
    "message": "Some of the aliases you requested do not exist: act_INVALID_ID",
    "type": "FacebookApiException"
  }
}
```
**Cause**: Invalid ad account ID format or non-existent account
**Solution**:
```javascript
// Validate account ID format
const validateAccountId = (accountId) => {
  const pattern = /^act_\d+$/
  if (!pattern.test(accountId)) {
    throw new Error('Account ID must be in format: act_XXXXXXXXXX')
  }
  return accountId
}
```

---

## Dashboard Application Errors

### Frontend Errors (5xx)

#### Error 500: Internal Server Error
```
TypeError: Cannot read property 'map' of undefined
at CampaignsList.render
```
**Cause**: API returned unexpected data structure
**Solution**:
```javascript
// Add defensive programming
const renderCampaigns = (campaigns = []) => {
  if (!Array.isArray(campaigns)) {
    console.warn('Expected campaigns array, got:', typeof campaigns)
    return <div>No campaigns available</div>
  }
  
  return campaigns.map(campaign => (
    <CampaignRow key={campaign?.id || Math.random()} campaign={campaign} />
  ))
}
```

#### Error 503: Service Unavailable
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Cause**: Development server not running or crashed
**Solution**:
```bash
# 1. Check if process is running
ps aux | grep "next dev" | grep -v grep

# 2. Kill and restart
pkill -f "next dev"
npm run dev

# 3. Check port availability
lsof -i :3000
```

### Database/Storage Errors (6xx)

#### Error 600: LocalStorage Quota Exceeded
```
QuotaExceededError: Failed to execute 'setItem' on 'Storage'
```
**Cause**: Browser storage limit reached
**Solution**:
```javascript
// Implement storage cleanup
const cleanupStorage = () => {
  const keys = Object.keys(localStorage)
  const cacheKeys = keys.filter(key => key.startsWith('cache_'))
  
  // Remove old cache entries
  cacheKeys.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key))
      if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(key)
      }
    } catch (e) {
      localStorage.removeItem(key)
    }
  })
}
```

#### Error 601: Settings Save Failed
```
Error: Failed to save settings to localStorage
```
**Cause**: Browser privacy settings or storage failure
**Solution**:
```javascript
// Fallback storage mechanism
const saveSettings = (settings) => {
  try {
    localStorage.setItem('metaSettings', JSON.stringify(settings))
  } catch (error) {
    // Fallback to sessionStorage
    try {
      sessionStorage.setItem('metaSettings', JSON.stringify(settings))
      console.warn('Saved to sessionStorage instead of localStorage')
    } catch (fallbackError) {
      // In-memory storage as last resort
      window.metaSettings = settings
      console.warn('Using in-memory storage - settings will not persist')
    }
  }
}
```

---

## Network and Infrastructure Errors

### Connection Errors (7xx)

#### Error 700: Network Request Failed
```
TypeError: Failed to fetch
```
**Cause**: Network connectivity issues or CORS problems
**Solution**:
```javascript
// Add network error handling
const fetchWithRetry = async (url, options = {}, retries = 3) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    
    if (retries > 0 && error.message.includes('fetch')) {
      console.log(`Retrying request... (${retries} attempts left)`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return fetchWithRetry(url, options, retries - 1)
    }
    
    throw error
  }
}
```

#### Error 701: CORS Policy Violation
```
Access to fetch at 'https://graph.facebook.com' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```
**Cause**: Improper CORS configuration
**Solution**:
```javascript
// next.config.mjs
export default {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

### Security Errors (8xx)

#### Error 800: Content Security Policy Violation
```
Refused to connect to 'https://external-domain.com' because it violates 
the Content Security Policy directive: "connect-src 'self'"
```
**Cause**: CSP blocking external requests
**Solution**:
```javascript
// Update CSP in next.config.mjs
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://graph.facebook.com;
  font-src 'self';
`

export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy.replace(/\n/g, ''),
          },
        ],
      },
    ]
  },
}
```

---

## Performance and Resource Errors

### Memory Errors (9xx)

#### Error 900: JavaScript Heap Out of Memory
```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - 
JavaScript heap out of memory
```
**Cause**: Memory leak or excessive data processing
**Solution**:
```bash
# 1. Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev

# 2. Implement data pagination
```

```javascript
// Paginate large datasets
const processCampaignsInBatches = async (campaigns, batchSize = 10) => {
  const results = []
  
  for (let i = 0; i < campaigns.length; i += batchSize) {
    const batch = campaigns.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(campaign => processCampaign(campaign))
    )
    results.push(...batchResults)
    
    // Allow garbage collection between batches
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  
  return results
}
```

#### Error 901: Maximum Call Stack Size Exceeded
```
RangeError: Maximum call stack size exceeded
```
**Cause**: Infinite recursion or deeply nested operations
**Solution**:
```javascript
// Convert recursion to iteration
const flattenCampaignData = (campaigns) => {
  const result = []
  const stack = [...campaigns]
  
  while (stack.length > 0) {
    const current = stack.pop()
    result.push(current)
    
    if (current.adsets && current.adsets.length > 0) {
      stack.push(...current.adsets)
    }
  }
  
  return result
}
```

---

## Error Handling Best Practices

### Global Error Handler
```javascript
// components/global-error-handler.tsx
import React from 'react'

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Global error caught:', error, errorInfo)
    
    // Log error to monitoring service
    this.logErrorToService(error, errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  logErrorToService = (error, errorInfo) => {
    // Send error to logging service
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      })
    }).catch(console.error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo.componentStack}
          </details>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default GlobalErrorBoundary
```

### API Error Handler
```javascript
// lib/api-error-handler.ts
export const handleApiError = (error: any, context: string) => {
  console.error(`API Error in ${context}:`, error)
  
  // Extract error details
  const errorCode = error?.error?.code || error?.status || 'UNKNOWN'
  const errorMessage = error?.error?.message || error?.message || 'Unknown error'
  const errorType = error?.error?.type || 'APIException'
  
  // Map error codes to user-friendly messages
  const userMessage = mapErrorToUserMessage(errorCode, errorMessage)
  
  // Log for debugging
  logError({
    code: errorCode,
    message: errorMessage,
    type: errorType,
    context,
    timestamp: new Date().toISOString()
  })
  
  return {
    userMessage,
    technicalMessage: errorMessage,
    code: errorCode,
    canRetry: isRetryableError(errorCode)
  }
}

const mapErrorToUserMessage = (code: string | number, message: string) => {
  const errorMessages = {
    100: 'Please check your access token and try again.',
    190: 'Your session has expired. Please log in again.',
    200: 'You don\'t have permission to access this data.',
    4: 'Rate limit exceeded. Please wait before trying again.',
    403: 'Access denied to this ad account.',
    500: 'Server error. Please try again later.'
  }
  
  return errorMessages[code] || `An error occurred: ${message}`
}

const isRetryableError = (code: string | number) => {
  // Errors that can be resolved by retrying
  const retryableCodes = [4, 500, 503, 'NETWORK_ERROR', 'TIMEOUT']
  return retryableCodes.includes(code)
}
```

---

## Error Monitoring and Logging

### Error Logging Service
```javascript
// app/api/log-error/route.ts
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json()
    
    // Add timestamp and request info
    const logEntry = {
      ...errorData,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      url: request.url,
      method: request.method
    }
    
    // Write to error log file
    const logPath = path.join(process.cwd(), 'error.log')
    const logLine = JSON.stringify(logEntry) + '\n'
    
    fs.appendFileSync(logPath, logLine)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to log error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
```

### Error Monitoring Dashboard
```javascript
// components/error-monitor.tsx
import { useState, useEffect } from 'react'

export const ErrorMonitor = () => {
  const [errors, setErrors] = useState([])
  
  useEffect(() => {
    // Subscribe to error events
    const handleError = (event) => {
      const errorInfo = {
        message: event.error?.message || 'Unknown error',
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href
      }
      
      setErrors(prev => [errorInfo, ...prev.slice(0, 9)]) // Keep last 10 errors
    }
    
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleError)
    
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleError)
    }
  }, [])
  
  if (errors.length === 0) return null
  
  return (
    <div className="error-monitor">
      <h3>Recent Errors ({errors.length})</h3>
      {errors.map((error, index) => (
        <div key={index} className="error-item">
          <div className="error-message">{error.message}</div>
          <div className="error-time">{error.timestamp}</div>
        </div>
      ))}
    </div>
  )
}
```

Remember: **Always test error handling scenarios** during development to ensure graceful degradation!