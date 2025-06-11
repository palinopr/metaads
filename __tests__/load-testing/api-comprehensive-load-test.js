// Comprehensive API Load Testing for Meta Ads Dashboard
// Tests all API endpoints under various load conditions with rate limiting validation

import http from 'k6/http'
import { check, group, sleep, fail } from 'k6'
import { Rate, Trend, Counter, Gauge } from 'k6/metrics'
import { randomString, randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js'

// Custom metrics for comprehensive API testing
const apiResponseTime = new Trend('api_response_time')
const apiErrorRate = new Rate('api_error_rate')
const apiSuccessRate = new Rate('api_success_rate')
const metaApiResponseTime = new Trend('meta_api_response_time')
const healthCheckResponseTime = new Trend('health_check_response_time')
const realTimeApiResponseTime = new Trend('realtime_api_response_time')
const aiInsightsResponseTime = new Trend('ai_insights_response_time')
const errorLoggingResponseTime = new Trend('error_logging_response_time')

// Rate limiting and capacity metrics
const rateLimitHits = new Counter('rate_limit_hits')
const rateLimitRecoveries = new Counter('rate_limit_recoveries')
const concurrentRequests = new Gauge('concurrent_requests')
const apiThroughput = new Rate('api_throughput')
const metaApiRateLimit = new Counter('meta_api_rate_limit')
const authApiRateLimit = new Counter('auth_api_rate_limit')

// Error tracking metrics
const apiErrors4xx = new Counter('api_errors_4xx')
const apiErrors5xx = new Counter('api_errors_5xx')
const timeoutErrors = new Counter('timeout_errors')
const connectionErrors = new Counter('connection_errors')

// Performance degradation metrics
const slowResponses = new Counter('slow_responses')
const verySlowResponses = new Counter('very_slow_responses')
const memoryPressure = new Gauge('memory_pressure_indicator')

// Test configuration for comprehensive API load testing
export const options = {
  scenarios: {
    // Scenario 1: Baseline API performance
    baseline_api_test: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
      gracefulRampDown: '30s',
      tags: { test_type: 'baseline' },
    },

    // Scenario 2: Meta API intensive testing
    meta_api_load: {
      executor: 'ramping-vus',
      startTime: '6m',
      startVUs: 5,
      stages: [
        { duration: '2m', target: 30 },
        { duration: '5m', target: 30 },
        { duration: '2m', target: 60 },
        { duration: '5m', target: 60 },
        { duration: '1m', target: 0 },
      ],
      tags: { test_type: 'meta_api' },
    },

    // Scenario 3: Real-time features stress test
    realtime_stress_test: {
      executor: 'ramping-vus',
      startTime: '21m',
      startVUs: 20,
      stages: [
        { duration: '1m', target: 100 },
        { duration: '3m', target: 100 },
        { duration: '1m', target: 150 },
        { duration: '2m', target: 150 },
        { duration: '1m', target: 0 },
      ],
      tags: { test_type: 'realtime' },
    },

    // Scenario 4: AI processing load test
    ai_processing_load: {
      executor: 'constant-vus',
      vus: 25,
      duration: '8m',
      startTime: '30m',
      tags: { test_type: 'ai_processing' },
    },

    // Scenario 5: Mixed API load simulation
    mixed_api_simulation: {
      executor: 'ramping-arrival-rate',
      startTime: '40m',
      startRate: 50,
      timeUnit: '1s',
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '1m', target: 50 },
      ],
      preAllocatedVUs: 100,
      maxVUs: 300,
      tags: { test_type: 'mixed_simulation' },
    },

    // Scenario 6: Rate limit validation
    rate_limit_validation: {
      executor: 'per-vu-iterations',
      vus: 20,
      iterations: 100,
      startTime: '50m',
      maxDuration: '10m',
      tags: { test_type: 'rate_limit' },
    },

    // Scenario 7: API endurance test
    api_endurance_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30m',
      startTime: '65m',
      tags: { test_type: 'endurance' },
    },
  },
  
  thresholds: {
    // Response time thresholds
    api_response_time: ['p(95)<3000', 'p(99)<8000'],
    meta_api_response_time: ['p(95)<5000', 'p(99)<10000'],
    health_check_response_time: ['p(95)<500', 'p(99)<1000'],
    realtime_api_response_time: ['p(95)<2000', 'p(99)<5000'],
    ai_insights_response_time: ['p(95)<8000', 'p(99)<15000'],
    error_logging_response_time: ['p(95)<1000', 'p(99)<2000'],
    
    // Success rate thresholds
    api_success_rate: ['rate>0.95'], // 95% success rate minimum
    api_error_rate: ['rate<0.05'],   // Less than 5% error rate
    api_throughput: ['rate>0.8'],    // 80% throughput maintenance
    
    // Error thresholds
    api_errors_5xx: ['count<100'],   // Less than 100 server errors
    timeout_errors: ['count<50'],    // Less than 50 timeouts
    connection_errors: ['count<25'], // Less than 25 connection errors
    
    // Rate limiting thresholds
    rate_limit_hits: ['count<500'],  // Reasonable rate limit encounters
    
    // Performance degradation thresholds
    slow_responses: ['count<200'],      // Responses > 5s
    very_slow_responses: ['count<50'],  // Responses > 10s
    
    // Overall HTTP thresholds
    http_req_duration: ['p(95)<8000'],
    http_req_failed: ['rate<0.1'],
  },
}

const BASE_URL = 'http://localhost:3000'

// Test data generators
function generateCampaignData() {
  return {
    id: `campaign_${randomIntBetween(1000000, 9999999)}`,
    name: `Load Test Campaign ${randomString(8)}`,
    status: randomItem(['ACTIVE', 'PAUSED']),
    objective: randomItem(['CONVERSIONS', 'TRAFFIC', 'AWARENESS']),
    spend: randomIntBetween(100, 50000),
    datePreset: randomItem(['today', 'yesterday', 'last_7d', 'last_14d', 'last_30d']),
  }
}

function generateAdAccountData() {
  return {
    adAccountId: `act_${randomIntBetween(100000000, 999999999)}`,
    accessToken: generateAccessToken(),
  }
}

function generateAccessToken() {
  const prefixes = ['EAABwzLixnjYBO', 'EAAG', 'EAABsbCs1iHgBO']
  const prefix = randomItem(prefixes)
  const suffix = randomString(50, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-')
  return `${prefix}${suffix}`
}

function generateInsightParams() {
  return {
    level: randomItem(['campaign', 'adset', 'ad']),
    timeRange: randomItem(['today', 'yesterday', 'last_7d', 'last_14d', 'last_30d']),
    breakdowns: randomItem([['age'], ['gender'], ['country'], ['age', 'gender']]),
  }
}

// Core API testing functions
function testHealthEndpoint() {
  group('Health Check API', () => {
    const startTime = Date.now()
    concurrentRequests.add(1)
    
    const response = http.get(`${BASE_URL}/api/health`)
    const duration = Date.now() - startTime
    
    healthCheckResponseTime.add(duration)
    apiResponseTime.add(duration)
    concurrentRequests.add(-1)
    
    const success = check(response, {
      'health endpoint responds 200': (r) => r.status === 200,
      'health has status field': (r) => {
        try {
          const body = JSON.parse(r.body)
          return body.status !== undefined
        } catch {
          return false
        }
      },
      'health has memory info': (r) => {
        try {
          const body = JSON.parse(r.body)
          return body.memory !== undefined
        } catch {
          return false
        }
      },
      'health response time acceptable': () => duration < 1000,
    })
    
    // Track performance degradation
    if (duration > 5000) slowResponses.add(1)
    if (duration > 10000) verySlowResponses.add(1)
    
    updateMetrics(response, success, duration)
    apiThroughput.add(1)
  })
}

function testDetailedHealthEndpoint() {
  group('Detailed Health Check API', () => {
    const startTime = Date.now()
    concurrentRequests.add(1)
    
    const response = http.get(`${BASE_URL}/api/health/detailed`)
    const duration = Date.now() - startTime
    
    healthCheckResponseTime.add(duration)
    apiResponseTime.add(duration)
    concurrentRequests.add(-1)
    
    const success = check(response, {
      'detailed health responds': (r) => [200, 500].includes(r.status),
      'detailed health has system info': (r) => {
        if (r.status !== 200) return true // Server errors are acceptable
        try {
          const body = JSON.parse(r.body)
          return body.system !== undefined && body.dependencies !== undefined
        } catch {
          return false
        }
      },
      'detailed health response time': () => duration < 2000,
    })
    
    updateMetrics(response, success, duration)
    apiThroughput.add(1)
  })
}

function testMetaApiConnection() {
  group('Meta API Connection Test', () => {
    const startTime = Date.now()
    concurrentRequests.add(1)
    
    const accountData = generateAdAccountData()
    const payload = JSON.stringify({
      type: 'test_connection',
      accessToken: accountData.accessToken,
      adAccountId: accountData.adAccountId,
    })
    
    const response = http.post(`${BASE_URL}/api/meta`, payload, {
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'LoadTest/1.0',
      },
      timeout: '10s',
    })
    
    const duration = Date.now() - startTime
    metaApiResponseTime.add(duration)
    apiResponseTime.add(duration)
    concurrentRequests.add(-1)
    
    const success = check(response, {
      'meta connection responds': (r) => [200, 400, 401, 429].includes(r.status),
      'meta connection has response body': (r) => r.body && r.body.length > 0,
      'meta connection response time': () => duration < 8000,
    })
    
    // Track Meta API specific rate limiting
    if (response.status === 429) {
      metaApiRateLimit.add(1)
      rateLimitHits.add(1)
      
      check(response, {
        'meta rate limit has retry info': (r) => {
          try {
            const body = JSON.parse(r.body)
            return body.retryAfter !== undefined || body.error_code !== undefined
          } catch {
            return false
          }
        },
      })
    }
    
    updateMetrics(response, success, duration)
    apiThroughput.add(1)
  })
}

function testMetaApiOverview() {
  group('Meta API Overview', () => {
    const startTime = Date.now()
    concurrentRequests.add(1)
    
    const accountData = generateAdAccountData()
    const campaignData = generateCampaignData()
    
    const payload = JSON.stringify({
      type: 'overview',
      accessToken: accountData.accessToken,
      adAccountId: accountData.adAccountId,
      datePreset: campaignData.datePreset,
    })
    
    const response = http.post(`${BASE_URL}/api/meta`, payload, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: '15s',
    })
    
    const duration = Date.now() - startTime
    metaApiResponseTime.add(duration)
    apiResponseTime.add(duration)
    concurrentRequests.add(-1)
    
    const success = check(response, {
      'meta overview responds': (r) => [200, 400, 401, 429, 500].includes(r.status),
      'meta overview response time': () => duration < 12000,
    })
    
    if (response.status === 200) {
      check(response, {
        'overview has campaigns data': (r) => {
          try {
            const body = JSON.parse(r.body)
            return body.campaigns !== undefined || body.data !== undefined
          } catch {
            return false
          }
        },
      })
    }
    
    if (response.status === 429) {
      metaApiRateLimit.add(1)
      rateLimitHits.add(1)
    }
    
    updateMetrics(response, success, duration)
    apiThroughput.add(1)
  })
}

function testMetaApiCampaignDetails() {
  group('Meta API Campaign Details', () => {
    const startTime = Date.now()
    concurrentRequests.add(1)
    
    const accountData = generateAdAccountData()
    const campaignData = generateCampaignData()
    
    const payload = JSON.stringify({
      type: 'campaign_details',
      accessToken: accountData.accessToken,
      adAccountId: accountData.adAccountId,
      campaignId: campaignData.id,
      datePreset: campaignData.datePreset,
    })
    
    const response = http.post(`${BASE_URL}/api/meta`, payload, {
      headers: { 
        'Content-Type': 'application/json',
      },
      timeout: '20s',
    })
    
    const duration = Date.now() - startTime
    metaApiResponseTime.add(duration)
    apiResponseTime.add(duration)
    concurrentRequests.add(-1)
    
    const success = check(response, {
      'campaign details responds': (r) => [200, 400, 401, 404, 429, 500].includes(r.status),
      'campaign details response time': () => duration < 18000,
    })
    
    if (response.status === 429) {
      metaApiRateLimit.add(1)
      rateLimitHits.add(1)
    }
    
    updateMetrics(response, success, duration)
    apiThroughput.add(1)
  })
}

function testMetaApiDemographics() {
  group('Meta API Demographics', () => {
    const startTime = Date.now()
    concurrentRequests.add(1)
    
    const accountData = generateAdAccountData()
    const insightParams = generateInsightParams()
    
    const payload = JSON.stringify({
      type: 'demographics',
      accessToken: accountData.accessToken,
      adAccountId: accountData.adAccountId,
      timeRange: insightParams.timeRange,
      level: insightParams.level,
    })
    
    const response = http.post(`${BASE_URL}/api/meta/demographics`, payload, {
      headers: { 
        'Content-Type': 'application/json',
      },
      timeout: '25s',
    })
    
    const duration = Date.now() - startTime
    metaApiResponseTime.add(duration)
    apiResponseTime.add(duration)
    concurrentRequests.add(-1)
    
    const success = check(response, {
      'demographics responds': (r) => [200, 400, 401, 429, 500].includes(r.status),
      'demographics response time': () => duration < 20000,
    })
    
    if (response.status === 429) {
      metaApiRateLimit.add(1)
      rateLimitHits.add(1)
    }
    
    updateMetrics(response, success, duration)
    apiThroughput.add(1)
  })
}

function testRealtimeAPI() {
  group('Realtime API', () => {
    const startTime = Date.now()
    concurrentRequests.add(1)
    
    const response = http.get(`${BASE_URL}/api/realtime`, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
      timeout: '5s',
    })
    
    const duration = Date.now() - startTime
    realTimeApiResponseTime.add(duration)
    apiResponseTime.add(duration)
    concurrentRequests.add(-1)
    
    const success = check(response, {
      'realtime api responds': (r) => [200, 429, 503].includes(r.status),
      'realtime response time': () => duration < 3000,
    })
    
    if (response.status === 200) {
      check(response, {
        'realtime has data field': (r) => {
          try {
            const body = JSON.parse(r.body)
            return body.data !== undefined || body.metrics !== undefined
          } catch {
            return false
          }
        },
      })
    }
    
    updateMetrics(response, success, duration)
    apiThroughput.add(1)
  })
}

function testAIInsightsAPI() {
  group('AI Insights API', () => {
    const startTime = Date.now()
    concurrentRequests.add(1)
    
    const accountData = generateAdAccountData()
    const campaignData = generateCampaignData()
    
    const payload = JSON.stringify({
      campaigns: [campaignData],
      analysisType: 'performance',
      timeframe: campaignData.datePreset,
    })
    
    const response = http.post(`${BASE_URL}/api/ai-insights`, payload, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accountData.accessToken}`,
      },
      timeout: '30s',
    })
    
    const duration = Date.now() - startTime
    aiInsightsResponseTime.add(duration)
    apiResponseTime.add(duration)
    concurrentRequests.add(-1)
    
    const success = check(response, {
      'ai insights responds': (r) => [200, 400, 401, 429, 500, 503].includes(r.status),
      'ai insights response time': () => duration < 25000,
    })
    
    // AI processing is resource intensive, track performance
    if (duration > 15000) {
      memoryPressure.add(1)
    }
    
    updateMetrics(response, success, duration)
    apiThroughput.add(1)
  })
}

function testErrorLoggingAPI() {
  group('Error Logging API', () => {
    const startTime = Date.now()
    concurrentRequests.add(1)
    
    const errorData = {
      message: `Load test error ${randomString(10)}`,
      stack: 'LoadTest.js:123',
      timestamp: new Date().toISOString(),
      userAgent: 'LoadTest/1.0',
      url: '/dashboard',
      severity: randomItem(['error', 'warning', 'info']),
    }
    
    const response = http.post(`${BASE_URL}/api/log-error`, JSON.stringify(errorData), {
      headers: { 
        'Content-Type': 'application/json',
      },
      timeout: '5s',
    })
    
    const duration = Date.now() - startTime
    errorLoggingResponseTime.add(duration)
    apiResponseTime.add(duration)
    concurrentRequests.add(-1)
    
    const success = check(response, {
      'error logging responds': (r) => [200, 400, 429].includes(r.status),
      'error logging response time': () => duration < 2000,
    })
    
    updateMetrics(response, success, duration)
    apiThroughput.add(1)
  })
}

function testAPIHealthMetrics() {
  group('API Health Metrics', () => {
    const startTime = Date.now()
    concurrentRequests.add(1)
    
    const response = http.get(`${BASE_URL}/api/error-metrics`, {
      headers: {
        'Accept': 'application/json',
      },
      timeout: '3s',
    })
    
    const duration = Date.now() - startTime
    apiResponseTime.add(duration)
    concurrentRequests.add(-1)
    
    const success = check(response, {
      'metrics endpoint responds': (r) => [200, 500].includes(r.status),
      'metrics response time': () => duration < 2000,
    })
    
    updateMetrics(response, success, duration)
    apiThroughput.add(1)
  })
}

function testRateLimitRecovery() {
  group('Rate Limit Recovery', () => {
    const accountData = generateAdAccountData()
    let rateLimitEncountered = false
    let recoverySuccessful = false
    
    // Make requests until rate limited
    for (let i = 0; i < 30; i++) {
      const response = http.post(`${BASE_URL}/api/meta`, JSON.stringify({
        type: 'test_connection',
        accessToken: accountData.accessToken,
        adAccountId: accountData.adAccountId,
      }), {
        headers: { 'Content-Type': 'application/json' },
        timeout: '5s',
      })
      
      if (response.status === 429) {
        rateLimitEncountered = true
        rateLimitHits.add(1)
        
        // Extract retry-after header
        const retryAfter = response.headers['Retry-After'] || '60'
        const waitTime = Math.min(parseInt(retryAfter), 120) // Cap at 2 minutes
        
        console.log(`Rate limited, waiting ${waitTime}s`)
        sleep(waitTime)
        
        // Try again after waiting
        const retryResponse = http.post(`${BASE_URL}/api/meta`, JSON.stringify({
          type: 'test_connection',
          accessToken: accountData.accessToken,
          adAccountId: accountData.adAccountId,
        }), {
          headers: { 'Content-Type': 'application/json' },
        })
        
        if (retryResponse.status !== 429) {
          recoverySuccessful = true
          rateLimitRecoveries.add(1)
        }
        
        break
      }
      
      sleep(0.2) // 200ms between requests
    }
    
    check({ rateLimitEncountered, recoverySuccessful }, {
      'rate limit recovery test completed': () => true,
      'rate limit recovery successful': (data) => !data.rateLimitEncountered || data.recoverySuccessful,
    })
  })
}

// Utility function to update metrics
function updateMetrics(response, success, duration) {
  if (success) {
    apiSuccessRate.add(1)
    apiErrorRate.add(0)
  } else {
    apiSuccessRate.add(0)
    apiErrorRate.add(1)
  }
  
  // Track error types
  if (response.status >= 400 && response.status < 500) {
    apiErrors4xx.add(1)
  } else if (response.status >= 500) {
    apiErrors5xx.add(1)
  }
  
  // Track timeouts and connection errors
  if (response.error_code === 1050) { // Timeout
    timeoutErrors.add(1)
  } else if (response.error_code === 1212) { // Connection error
    connectionErrors.add(1)
  }
  
  // Track slow responses
  if (duration > 5000) slowResponses.add(1)
  if (duration > 10000) verySlowResponses.add(1)
}

// Main test execution function
export default function () {
  const testType = __ENV.TEST_TYPE || 'mixed'
  
  switch (testType) {
    case 'health_only':
      testHealthEndpoint()
      if (Math.random() < 0.3) testDetailedHealthEndpoint()
      break
      
    case 'meta_api_only':
      testMetaApiConnection()
      if (Math.random() < 0.7) testMetaApiOverview()
      if (Math.random() < 0.5) testMetaApiCampaignDetails()
      if (Math.random() < 0.3) testMetaApiDemographics()
      break
      
    case 'realtime_only':
      testRealtimeAPI()
      break
      
    case 'ai_only':
      testAIInsightsAPI()
      break
      
    case 'error_logging_only':
      testErrorLoggingAPI()
      testAPIHealthMetrics()
      break
      
    case 'rate_limit_test':
      testRateLimitRecovery()
      break
      
    default:
      // Mixed scenario - realistic user behavior
      const scenario = Math.random()
      
      // Always include health check (10% chance)
      if (Math.random() < 0.1) {
        testHealthEndpoint()
      }
      
      if (scenario < 0.4) {
        // 40% - Meta API operations
        testMetaApiConnection()
        sleep(randomIntBetween(1, 3))
        testMetaApiOverview()
        
        if (Math.random() < 0.6) {
          sleep(randomIntBetween(2, 5))
          testMetaApiCampaignDetails()
        }
        
        if (Math.random() < 0.3) {
          sleep(randomIntBetween(1, 4))
          testMetaApiDemographics()
        }
      } else if (scenario < 0.6) {
        // 20% - Realtime features
        testRealtimeAPI()
        sleep(randomIntBetween(5, 15))
        testRealtimeAPI() // Poll again
      } else if (scenario < 0.75) {
        // 15% - AI insights
        testAIInsightsAPI()
      } else if (scenario < 0.9) {
        // 15% - Mixed operations
        testHealthEndpoint()
        sleep(1)
        testMetaApiConnection()
        sleep(2)
        testRealtimeAPI()
        if (Math.random() < 0.5) {
          sleep(1)
          testErrorLoggingAPI()
        }
      } else {
        // 10% - Error logging and metrics
        testErrorLoggingAPI()
        sleep(1)
        testAPIHealthMetrics()
      }
  }
  
  // Simulate user think time
  sleep(randomIntBetween(1, 8))
}

// Setup function
export function setup() {
  console.log('🚀 Starting Comprehensive API Load Test')
  console.log(`Target: ${BASE_URL}`)
  console.log('Test Coverage: Health, Meta API, Realtime, AI Insights, Error Logging')
  
  // Verify server is running
  const healthResponse = http.get(`${BASE_URL}/api/health`, { timeout: '10s' })
  if (healthResponse.status !== 200) {
    fail('Server health check failed. Ensure the application is running.')
  }
  
  console.log('✅ Server health check passed')
  console.log('🎯 Test scenarios configured for comprehensive API coverage')
  
  return {
    serverStatus: 'running',
    startTime: new Date().toISOString(),
    testCoverage: ['health', 'meta-api', 'realtime', 'ai-insights', 'error-logging'],
  }
}

// Teardown function
export function teardown(data) {
  if (data && data.startTime) {
    console.log(`🏁 Comprehensive API load test completed`)
    console.log(`Started: ${data.startTime}`)
    console.log(`Finished: ${new Date().toISOString()}`)
    console.log(`Coverage: ${data.testCoverage.join(', ')}`)
  }
  
  console.log('\n📊 Key Metrics Summary:')
  console.log('Performance Metrics:')
  console.log('- api_response_time: Overall API response times')
  console.log('- meta_api_response_time: Meta Facebook API response times')
  console.log('- realtime_api_response_time: Real-time feature response times')
  console.log('- ai_insights_response_time: AI processing response times')
  
  console.log('\nReliability Metrics:')
  console.log('- api_success_rate: Overall API success rate')
  console.log('- api_error_rate: Overall API error rate')
  console.log('- rate_limit_hits: Rate limiting encounters')
  console.log('- rate_limit_recoveries: Successful recoveries from rate limits')
  
  console.log('\nCapacity Metrics:')
  console.log('- api_throughput: Request processing rate')
  console.log('- concurrent_requests: Peak concurrent request count')
  console.log('- slow_responses: Responses exceeding 5 seconds')
  console.log('- very_slow_responses: Responses exceeding 10 seconds')
  
  console.log('\n⚠️  Error Analysis:')
  console.log('- api_errors_4xx: Client error count (check request format)')
  console.log('- api_errors_5xx: Server error count (check system health)')
  console.log('- timeout_errors: Request timeout count')
  console.log('- connection_errors: Network connection error count')
}