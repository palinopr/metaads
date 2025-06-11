// K6 Authentication Load Testing for Meta Ads Dashboard
// Tests authentication system under various load conditions

import http from 'k6/http'
import { check, group, sleep, fail } from 'k6'
import { Rate, Trend, Counter, Gauge } from 'k6/metrics'
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js'

// Custom metrics for authentication testing
const authResponseTime = new Trend('auth_response_time')
const authErrorRate = new Rate('auth_error_rate')
const authSuccessRate = new Rate('auth_success_rate')
const sessionCreationTime = new Trend('session_creation_time')
const tokenValidationTime = new Trend('token_validation_time')
const concurrentSessions = new Gauge('concurrent_sessions')
const rateLimitHits = new Counter('rate_limit_hits')
const authFailures = new Counter('auth_failures')
const tokenRefreshTime = new Trend('token_refresh_time')
const csrfValidationTime = new Trend('csrf_validation_time')

// Test configuration for authentication load testing
export const options = {
  scenarios: {
    // Scenario 1: Normal authentication load
    normal_auth_load: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '2m', target: 25 },   // Ramp up to 25 users
        { duration: '5m', target: 25 },   // Stay at 25 users
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '5m', target: 50 },   // Stay at 50 users
        { duration: '2m', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '30s',
      tags: { test_type: 'normal_auth' },
    },

    // Scenario 2: Authentication spike test
    auth_spike_test: {
      executor: 'ramping-vus',
      startTime: '15m',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 200 }, // Sudden spike to 200 users
        { duration: '2m', target: 200 },  // Maintain spike
        { duration: '30s', target: 10 },  // Quick ramp down
      ],
      gracefulRampDown: '15s',
      tags: { test_type: 'auth_spike' },
    },

    // Scenario 3: Session management stress test
    session_stress_test: {
      executor: 'constant-vus',
      vus: 100,
      duration: '10m',
      startTime: '20m',
      tags: { test_type: 'session_stress' },
    },

    // Scenario 4: Rate limiting validation
    rate_limit_test: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 50,
      startTime: '32m',
      maxDuration: '5m',
      tags: { test_type: 'rate_limit' },
    },

    // Scenario 5: Token refresh under load
    token_refresh_test: {
      executor: 'ramping-vus',
      startTime: '40m',
      startVUs: 20,
      stages: [
        { duration: '1m', target: 75 },
        { duration: '3m', target: 75 },
        { duration: '1m', target: 0 },
      ],
      tags: { test_type: 'token_refresh' },
    },
  },
  
  thresholds: {
    // Authentication performance thresholds
    auth_response_time: ['p(95)<3000', 'p(99)<5000'],
    session_creation_time: ['p(95)<1000', 'p(99)<2000'],
    token_validation_time: ['p(95)<500', 'p(99)<1000'],
    token_refresh_time: ['p(95)<2000', 'p(99)<4000'],
    csrf_validation_time: ['p(95)<200', 'p(99)<500'],
    
    // Error rate thresholds
    auth_error_rate: ['rate<0.05'], // Less than 5% error rate
    auth_success_rate: ['rate>0.90'], // More than 90% success rate
    
    // Overall HTTP thresholds
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.1'],
    
    // Rate limiting should not exceed 20% of requests
    rate_limit_hits: ['count<1000'],
  },
}

const BASE_URL = 'http://localhost:3000'

// Test data generators
function generateValidToken() {
  const prefixes = ['EAABwzLixnjYBO', 'EAAG', 'ABC123|DEF456']
  const prefix = prefixes[randomIntBetween(0, prefixes.length - 1)]
  const suffix = randomString(50, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-')
  return `${prefix}${suffix}`
}

function generateValidAdAccountId() {
  return `act_${randomIntBetween(100000000, 999999999)}`
}

function generateInvalidToken() {
  const invalidTokens = [
    'invalid_token',
    'short',
    '',
    'a'.repeat(600), // Too long
    'invalid@token!',
    'EAA', // Too short for valid format
  ]
  return invalidTokens[randomIntBetween(0, invalidTokens.length - 1)]
}

// Authentication test functions
function testHealthEndpoint() {
  group('Health Check', () => {
    const startTime = Date.now()
    const response = http.get(`${BASE_URL}/api/health`)
    const duration = Date.now() - startTime
    
    const success = check(response, {
      'health endpoint responds': (r) => r.status === 200,
      'health has required fields': (r) => {
        try {
          const body = JSON.parse(r.body)
          return body.status !== undefined && body.memory !== undefined
        } catch {
          return false
        }
      },
      'health response time acceptable': () => duration < 1000,
    })
    
    authResponseTime.add(duration)
    if (success) {
      authSuccessRate.add(1)
      authErrorRate.add(0)
    } else {
      authSuccessRate.add(0)
      authErrorRate.add(1)
      authFailures.add(1)
    }
  })
}

function testValidAuthentication() {
  group('Valid Authentication', () => {
    const startTime = Date.now()
    
    const payload = JSON.stringify({
      type: 'test_connection',
      accessToken: generateValidToken(),
      adAccountId: generateValidAdAccountId(),
    })
    
    const response = http.post(`${BASE_URL}/api/meta`, payload, {
      headers: { 
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })
    
    const duration = Date.now() - startTime
    authResponseTime.add(duration)
    
    const success = check(response, {
      'auth request status is valid': (r) => [200, 400, 401].includes(r.status),
      'auth response time acceptable': () => duration < 5000,
      'auth response has body': (r) => r.body.length > 0,
    })
    
    // Track rate limiting
    if (response.status === 429) {
      rateLimitHits.add(1)
      
      check(response, {
        'rate limit has retry after': (r) => {
          try {
            const body = JSON.parse(r.body)
            return body.retryAfter !== undefined
          } catch {
            return false
          }
        },
      })
    }
    
    if (success) {
      authSuccessRate.add(1)
      authErrorRate.add(0)
    } else {
      authSuccessRate.add(0)
      authErrorRate.add(1)
      authFailures.add(1)
    }
  })
}

function testInvalidAuthentication() {
  group('Invalid Authentication', () => {
    const startTime = Date.now()
    
    const invalidPayloads = [
      // Invalid token
      {
        type: 'test_connection',
        accessToken: generateInvalidToken(),
        adAccountId: generateValidAdAccountId(),
      },
      // Missing token
      {
        type: 'test_connection',
        adAccountId: generateValidAdAccountId(),
      },
      // Invalid JSON
      'invalid json',
      // Empty payload
      {},
      // Invalid account ID
      {
        type: 'test_connection',
        accessToken: generateValidToken(),
        adAccountId: 'invalid_account',
      },
    ]
    
    const payload = invalidPayloads[randomIntBetween(0, invalidPayloads.length - 1)]
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload)
    
    const response = http.post(`${BASE_URL}/api/meta`, body, {
      headers: { 
        'Content-Type': 'application/json',
      },
    })
    
    const duration = Date.now() - startTime
    authResponseTime.add(duration)
    
    const success = check(response, {
      'invalid auth returns 400 or 401': (r) => [400, 401].includes(r.status),
      'invalid auth response time acceptable': () => duration < 3000,
      'invalid auth has error message': (r) => {
        try {
          const body = JSON.parse(r.body)
          return body.error !== undefined || body.message !== undefined
        } catch {
          return false
        }
      },
    })
    
    if (success) {
      authSuccessRate.add(1)
      authErrorRate.add(0)
    } else {
      authSuccessRate.add(0)
      authErrorRate.add(1)
      authFailures.add(1)
    }
  })
}

function testSessionManagement() {
  group('Session Management', () => {
    const sessionStartTime = Date.now()
    
    // Simulate session creation through dashboard access
    const dashboardResponse = http.get(`${BASE_URL}/dashboard`)
    const sessionDuration = Date.now() - sessionStartTime
    sessionCreationTime.add(sessionDuration)
    
    check(dashboardResponse, {
      'dashboard loads': (r) => r.status === 200,
      'dashboard is HTML': (r) => r.headers['Content-Type']?.includes('text/html'),
    })
    
    // Simulate multiple API calls within session
    const apiCalls = randomIntBetween(3, 8)
    for (let i = 0; i < apiCalls; i++) {
      sleep(randomIntBetween(1, 3)) // Simulate user thinking time
      
      const tokenValidationStart = Date.now()
      testValidAuthentication()
      const tokenValidationDuration = Date.now() - tokenValidationStart
      tokenValidationTime.add(tokenValidationDuration)
    }
    
    // Update concurrent sessions gauge
    concurrentSessions.add(1)
  })
}

function testCSRFProtection() {
  group('CSRF Protection', () => {
    const csrfStart = Date.now()
    
    // Test without CSRF token (should fail)
    const response1 = http.post(`${BASE_URL}/api/meta`, JSON.stringify({
      type: 'test_connection',
      accessToken: generateValidToken(),
      adAccountId: generateValidAdAccountId(),
    }), {
      headers: { 
        'Content-Type': 'application/json',
        // No CSRF token
      },
    })
    
    // Test with invalid CSRF token
    const response2 = http.post(`${BASE_URL}/api/meta`, JSON.stringify({
      type: 'test_connection',
      accessToken: generateValidToken(),
      adAccountId: generateValidAdAccountId(),
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'invalid-csrf-token',
      },
    })
    
    const csrfDuration = Date.now() - csrfStart
    csrfValidationTime.add(csrfDuration)
    
    check(response1, {
      'request without CSRF handled properly': (r) => [400, 401, 403].includes(r.status),
    })
    
    check(response2, {
      'request with invalid CSRF handled properly': (r) => [400, 401, 403].includes(r.status),
    })
  })
}

function testTokenRefresh() {
  group('Token Refresh', () => {
    const refreshStart = Date.now()
    
    // Simulate token refresh scenario
    const refreshPayload = JSON.stringify({
      type: 'refresh_token',
      refreshToken: 'refresh_' + randomString(40),
    })
    
    const response = http.post(`${BASE_URL}/api/auth/refresh`, refreshPayload, {
      headers: { 
        'Content-Type': 'application/json',
      },
    })
    
    const refreshDuration = Date.now() - refreshStart
    tokenRefreshTime.add(refreshDuration)
    
    check(response, {
      'token refresh responds': (r) => [200, 400, 401].includes(r.status),
      'token refresh time acceptable': () => refreshDuration < 4000,
    })
  })
}

function testConcurrentAuthRequests() {
  group('Concurrent Authentication', () => {
    const concurrentRequests = randomIntBetween(5, 15)
    const requests = []
    
    // Prepare multiple requests
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push({
        method: 'POST',
        url: `${BASE_URL}/api/meta`,
        body: JSON.stringify({
          type: 'test_connection',
          accessToken: generateValidToken(),
          adAccountId: generateValidAdAccountId(),
        }),
        params: {
          headers: { 'Content-Type': 'application/json' },
        },
      })
    }
    
    const startTime = Date.now()
    const responses = http.batch(requests)
    const batchDuration = Date.now() - startTime
    
    authResponseTime.add(batchDuration / concurrentRequests)
    
    let successCount = 0
    responses.forEach((response, index) => {
      const success = check(response, {
        [`concurrent request ${index} succeeds`]: (r) => [200, 400, 401, 429].includes(r.status),
      })
      if (success) successCount++
    })
    
    authSuccessRate.add(successCount / concurrentRequests)
    authErrorRate.add((concurrentRequests - successCount) / concurrentRequests)
  })
}

function testRateLimiting() {
  group('Rate Limiting Test', () => {
    const rapidRequests = 20
    let rateLimitTriggered = false
    
    for (let i = 0; i < rapidRequests; i++) {
      const response = http.post(`${BASE_URL}/api/meta`, JSON.stringify({
        type: 'test_connection',
        accessToken: generateValidToken(),
        adAccountId: generateValidAdAccountId(),
      }), {
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.status === 429) {
        rateLimitHits.add(1)
        rateLimitTriggered = true
        
        check(response, {
          'rate limit response includes retry after': (r) => {
            try {
              const body = JSON.parse(r.body)
              return body.retryAfter !== undefined
            } catch {
              return false
            }
          },
        })
        
        // Respect rate limit
        const retryAfter = response.headers['Retry-After'] || 1
        sleep(parseInt(retryAfter))
        break
      }
      
      sleep(0.1) // 100ms between requests
    }
  })
}

// Main test execution function
export default function () {
  const testType = __ENV.TEST_TYPE || 'mixed'
  
  // Update concurrent sessions counter
  concurrentSessions.add(1)
  
  switch (testType) {
    case 'auth_only':
      testValidAuthentication()
      break
      
    case 'invalid_auth':
      testInvalidAuthentication()
      break
      
    case 'session_test':
      testSessionManagement()
      break
      
    case 'csrf_test':
      testCSRFProtection()
      break
      
    case 'refresh_test':
      testTokenRefresh()
      break
      
    case 'concurrent_test':
      testConcurrentAuthRequests()
      break
      
    case 'rate_limit_test':
      testRateLimiting()
      break
      
    default:
      // Mixed scenario - randomly choose test type
      const scenario = Math.random()
      
      if (scenario < 0.3) {
        testValidAuthentication()
      } else if (scenario < 0.5) {
        testSessionManagement()
      } else if (scenario < 0.65) {
        testInvalidAuthentication()
      } else if (scenario < 0.75) {
        testCSRFProtection()
      } else if (scenario < 0.85) {
        testTokenRefresh()
      } else if (scenario < 0.95) {
        testConcurrentAuthRequests()
      } else {
        testRateLimiting()
      }
  }
  
  // Always include health check
  if (Math.random() < 0.1) { // 10% chance
    testHealthEndpoint()
  }
  
  // Update concurrent sessions counter before sleep
  concurrentSessions.add(-1)
  
  // Simulate user think time
  sleep(randomIntBetween(1, 5))
}

// Setup function - runs once before test starts
export function setup() {
  console.log('🔒 Starting Authentication Load Test')
  console.log(`Target: ${BASE_URL}`)
  
  // Verify server is running
  const healthResponse = http.get(`${BASE_URL}/api/health`)
  if (healthResponse.status !== 200) {
    fail('Server is not responding. Ensure the application is running.')
  }
  
  console.log('✅ Server health check passed')
  
  return {
    serverStatus: 'running',
    startTime: new Date().toISOString(),
  }
}

// Teardown function - runs once after test completes
export function teardown(data) {
  if (data && data.startTime) {
    console.log(`🏁 Authentication load test completed`)
    console.log(`Started: ${data.startTime}`)
    console.log(`Finished: ${new Date().toISOString()}`)
  }
  
  console.log('\n📊 Key Metrics to Review:')
  console.log('- auth_response_time: Authentication endpoint response times')
  console.log('- auth_error_rate: Rate of authentication failures')
  console.log('- session_creation_time: Time to establish sessions')
  console.log('- token_validation_time: Token validation performance')
  console.log('- rate_limit_hits: Number of rate limit encounters')
  console.log('- concurrent_sessions: Peak concurrent session count')
}