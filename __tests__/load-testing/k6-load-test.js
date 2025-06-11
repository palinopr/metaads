// K6 Load Testing Script for Meta Ads Dashboard

import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// Custom metrics
const healthCheckDuration = new Trend('health_check_duration')
const metaApiDuration = new Trend('meta_api_duration')
const dashboardLoadDuration = new Trend('dashboard_load_duration')
const errorRate = new Rate('error_rate')
const rateLimitCounter = new Counter('rate_limit_counter')

// Test configuration
export const options = {
  stages: [
    // Warm-up
    { duration: '1m', target: 10 },
    
    // Light load
    { duration: '2m', target: 25 },
    
    // Medium load
    { duration: '3m', target: 50 },
    
    // Heavy load
    { duration: '2m', target: 100 },
    
    // Spike test
    { duration: '1m', target: 200 },
    
    // Cool down
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    // 95% of requests should be below 2s
    http_req_duration: ['p(95)<2000'],
    
    // 99% of requests should be below 5s
    'http_req_duration{group:::Health Check}': ['p(99)<1000'],
    'http_req_duration{group:::Meta API}': ['p(99)<5000'],
    'http_req_duration{group:::Dashboard Load}': ['p(99)<10000'],
    
    // Error rate should be below 1%
    error_rate: ['rate<0.01'],
    
    // Rate limiting should be minimal
    rate_limit_counter: ['count<100'],
    
    // HTTP error rate should be below 5%
    http_req_failed: ['rate<0.05'],
  },
}

// Base URL
const BASE_URL = 'http://localhost:3000'

// Test data
const testCredentials = {
  valid: {
    accessToken: 'EAABwzLixnjYBAtest123456789012345',
    adAccountId: 'act_123456789'
  },
  invalid: {
    accessToken: 'invalid_token',
    adAccountId: 'invalid_account'
  }
}

// Utility function to generate random campaign ID
function getRandomCampaignId() {
  return `campaign_${Math.floor(Math.random() * 1000000)}`
}

// Health check test
function testHealthCheck() {
  group('Health Check', () => {
    const startTime = Date.now()
    const response = http.get(`${BASE_URL}/api/health`)
    const duration = Date.now() - startTime
    
    healthCheckDuration.add(duration)
    
    const isSuccess = check(response, {
      'health check status is 200': (r) => r.status === 200,
      'health check has status field': (r) => JSON.parse(r.body).status !== undefined,
      'health check has memory field': (r) => JSON.parse(r.body).memory !== undefined,
      'health check has uptime field': (r) => JSON.parse(r.body).uptime !== undefined,
      'health check response time < 1s': () => duration < 1000,
    })
    
    if (!isSuccess) {
      errorRate.add(1)
    } else {
      errorRate.add(0)
    }
  })
}

// Meta API connection test
function testMetaApiConnection() {
  group('Meta API Connection', () => {
    const startTime = Date.now()
    const payload = JSON.stringify({
      type: 'test_connection',
      accessToken: testCredentials.valid.accessToken,
      adAccountId: testCredentials.valid.adAccountId
    })
    
    const response = http.post(`${BASE_URL}/api/meta`, payload, {
      headers: { 'Content-Type': 'application/json' }
    })
    
    const duration = Date.now() - startTime
    metaApiDuration.add(duration)
    
    const isSuccess = check(response, {
      'meta api connection status is valid': (r) => [200, 400, 401].includes(r.status),
      'meta api connection response time < 5s': () => duration < 5000,
    })
    
    if (response.status === 429) {
      rateLimitCounter.add(1)
    }
    
    if (!isSuccess) {
      errorRate.add(1)
    } else {
      errorRate.add(0)
    }
  })
}

// Meta API overview test
function testMetaApiOverview() {
  group('Meta API Overview', () => {
    const startTime = Date.now()
    const payload = JSON.stringify({
      type: 'overview',
      accessToken: testCredentials.valid.accessToken,
      adAccountId: testCredentials.valid.adAccountId,
      datePreset: 'last_30d'
    })
    
    const response = http.post(`${BASE_URL}/api/meta`, payload, {
      headers: { 'Content-Type': 'application/json' }
    })
    
    const duration = Date.now() - startTime
    metaApiDuration.add(duration)
    
    const isSuccess = check(response, {
      'meta api overview status is valid': (r) => [200, 401, 429, 500].includes(r.status),
      'meta api overview response time < 10s': () => duration < 10000,
    })
    
    if (response.status === 429) {
      rateLimitCounter.add(1)
    }
    
    if (!isSuccess) {
      errorRate.add(1)
    } else {
      errorRate.add(0)
    }
    
    // If successful, test response structure
    if (response.status === 200) {
      const body = JSON.parse(response.body)
      check(body, {
        'overview has campaigns field': (b) => b.campaigns !== undefined,
        'overview has success field': (b) => b.success !== undefined,
      })
    }
  })
}

// Campaign details test
function testCampaignDetails() {
  group('Campaign Details', () => {
    const startTime = Date.now()
    const payload = JSON.stringify({
      type: 'campaign_details',
      accessToken: testCredentials.valid.accessToken,
      adAccountId: testCredentials.valid.adAccountId,
      campaignId: getRandomCampaignId(),
      datePreset: 'last_7d'
    })
    
    const response = http.post(`${BASE_URL}/api/meta`, payload, {
      headers: { 'Content-Type': 'application/json' }
    })
    
    const duration = Date.now() - startTime
    metaApiDuration.add(duration)
    
    const isSuccess = check(response, {
      'campaign details status is valid': (r) => [200, 400, 401, 500].includes(r.status),
      'campaign details response time < 15s': () => duration < 15000,
    })
    
    if (response.status === 429) {
      rateLimitCounter.add(1)
    }
    
    if (!isSuccess) {
      errorRate.add(1)
    } else {
      errorRate.add(0)
    }
  })
}

// Dashboard load simulation
function testDashboardLoad() {
  group('Dashboard Load', () => {
    const startTime = Date.now()
    
    // Load main page
    const mainPageResponse = http.get(`${BASE_URL}/`)
    check(mainPageResponse, {
      'dashboard page loads': (r) => r.status === 200,
      'dashboard page is HTML': (r) => r.headers['Content-Type']?.includes('text/html'),
    })
    
    sleep(1) // Simulate user reading page
    
    // Load health check (simulating frontend API calls)
    testHealthCheck()
    
    sleep(2) // Simulate user interaction
    
    // Load campaign data
    testMetaApiOverview()
    
    const totalDuration = Date.now() - startTime
    dashboardLoadDuration.add(totalDuration)
    
    check({ duration: totalDuration }, {
      'complete dashboard load < 30s': (d) => d.duration < 30000,
    })
  })
}

// Error scenarios test
function testErrorScenarios() {
  group('Error Scenarios', () => {
    // Test invalid JSON
    const invalidJsonResponse = http.post(`${BASE_URL}/api/meta`, 'invalid json', {
      headers: { 'Content-Type': 'application/json' }
    })
    
    check(invalidJsonResponse, {
      'invalid JSON returns 400': (r) => r.status === 400,
    })
    
    sleep(1)
    
    // Test missing parameters
    const emptyPayloadResponse = http.post(`${BASE_URL}/api/meta`, '{}', {
      headers: { 'Content-Type': 'application/json' }
    })
    
    check(emptyPayloadResponse, {
      'empty payload returns 400': (r) => r.status === 400,
    })
    
    sleep(1)
    
    // Test invalid credentials
    const invalidCredsPayload = JSON.stringify({
      type: 'test_connection',
      accessToken: testCredentials.invalid.accessToken,
      adAccountId: testCredentials.invalid.adAccountId
    })
    
    const invalidCredsResponse = http.post(`${BASE_URL}/api/meta`, invalidCredsPayload, {
      headers: { 'Content-Type': 'application/json' }
    })
    
    check(invalidCredsResponse, {
      'invalid credentials returns 400': (r) => r.status === 400,
    })
  })
}

// Rate limiting test
function testRateLimiting() {
  group('Rate Limiting', () => {
    const payload = JSON.stringify({
      type: 'test_connection',
      accessToken: testCredentials.valid.accessToken,
      adAccountId: testCredentials.valid.adAccountId
    })
    
    // Make rapid requests to trigger rate limiting
    for (let i = 0; i < 15; i++) {
      const response = http.post(`${BASE_URL}/api/meta`, payload, {
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.status === 429) {
        rateLimitCounter.add(1)
        check(response, {
          'rate limit response has retry after': (r) => {
            const body = JSON.parse(r.body)
            return body.retryAfter !== undefined
          }
        })
        break // Stop when rate limited
      }
      
      sleep(0.1) // Small delay between requests
    }
  })
}

// Main test function
export default function () {
  // Randomly choose test scenario based on weights
  const scenario = Math.random()
  
  if (scenario < 0.3) {
    // 30% - Dashboard load simulation
    testDashboardLoad()
  } else if (scenario < 0.6) {
    // 30% - Meta API tests
    testMetaApiOverview()
    sleep(2)
    testCampaignDetails()
  } else if (scenario < 0.8) {
    // 20% - Connection tests
    testMetaApiConnection()
    sleep(1)
    testHealthCheck()
  } else if (scenario < 0.95) {
    // 15% - Error scenarios
    testErrorScenarios()
  } else {
    // 5% - Rate limiting tests
    testRateLimiting()
  }
  
  // Random sleep between 1-5 seconds to simulate user behavior
  sleep(Math.random() * 4 + 1)
}

// Setup function (runs once before test)
export function setup() {
  console.log('Starting load test for Meta Ads Dashboard')
  console.log(`Target: ${BASE_URL}`)
  console.log('Test scenarios: Dashboard Load, Meta API, Health Checks, Error Handling, Rate Limiting')
  
  // Verify server is running
  const healthResponse = http.get(`${BASE_URL}/api/health`)
  if (healthResponse.status !== 200) {
    console.error('Server is not responding. Make sure the application is running.')
    return null
  }
  
  return {
    serverStatus: 'running',
    startTime: new Date().toISOString()
  }
}

// Teardown function (runs once after test)
export function teardown(data) {
  if (data && data.startTime) {
    console.log(`Load test completed. Started at: ${data.startTime}`)
    console.log('Check the results above for performance metrics and thresholds.')
  }
}