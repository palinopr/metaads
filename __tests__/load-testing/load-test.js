// Load testing with Artillery
// This file can be used with Artillery: artillery run load-test.yml

const fs = require('fs')
const path = require('path')

// Generate test data for load testing
function generateTestData() {
  const campaigns = []
  const adSets = []
  const credentials = []
  
  // Generate 100 test campaigns
  for (let i = 0; i < 100; i++) {
    campaigns.push({
      id: `campaign_${i}`,
      name: `Load Test Campaign ${i}`,
      status: i % 3 === 0 ? 'ACTIVE' : i % 3 === 1 ? 'PAUSED' : 'DELETED',
      spend: Math.random() * 10000,
      impressions: Math.floor(Math.random() * 1000000),
      clicks: Math.floor(Math.random() * 50000),
      conversions: Math.floor(Math.random() * 1000),
    })
  }
  
  // Generate ad sets for each campaign
  campaigns.forEach((campaign, campaignIndex) => {
    const adSetCount = Math.floor(Math.random() * 5) + 1
    for (let i = 0; i < adSetCount; i++) {
      adSets.push({
        id: `adset_${campaignIndex}_${i}`,
        campaign_id: campaign.id,
        name: `Load Test AdSet ${campaignIndex}-${i}`,
        status: 'ACTIVE',
        spend: Math.random() * 1000,
      })
    }
  })
  
  // Generate test credentials
  for (let i = 0; i < 10; i++) {
    credentials.push({
      accessToken: `test_token_${i}_${'x'.repeat(20)}`,
      adAccountId: `act_${1000000 + i}`
    })
  }
  
  return { campaigns, adSets, credentials }
}

// Performance test scenarios
const loadTestScenarios = {
  // Light load - normal usage
  lightLoad: {
    duration: 60, // 1 minute
    arrivalRate: 5, // 5 users per second
    rampTo: 10, // ramp up to 10 users per second
  },
  
  // Medium load - busy period
  mediumLoad: {
    duration: 300, // 5 minutes
    arrivalRate: 20, // 20 users per second
    rampTo: 50, // ramp up to 50 users per second
  },
  
  // Heavy load - stress test
  heavyLoad: {
    duration: 180, // 3 minutes
    arrivalRate: 50, // 50 users per second
    rampTo: 100, // ramp up to 100 users per second
  },
  
  // Spike test - sudden traffic increase
  spikeTest: {
    duration: 120, // 2 minutes
    arrivalRate: 100, // 100 users per second immediately
  },
  
  // Soak test - sustained load
  soakTest: {
    duration: 1800, // 30 minutes
    arrivalRate: 25, // 25 users per second sustained
  }
}

// Test functions for different API endpoints
function testHealthEndpoint(requestParams, context, events, done) {
  const startTime = Date.now()
  
  // Simulate health check request
  setTimeout(() => {
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    // Record metrics
    events.emit('histogram', 'health_check_response_time', responseTime)
    
    if (responseTime > 1000) {
      events.emit('counter', 'health_check_slow_responses', 1)
    }
    
    done()
  }, Math.random() * 100) // Simulate 0-100ms response time
}

function testMetaApiEndpoint(requestParams, context, events, done) {
  const startTime = Date.now()
  const testData = generateTestData()
  
  // Simulate Meta API request
  setTimeout(() => {
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    // Record metrics
    events.emit('histogram', 'meta_api_response_time', responseTime)
    
    if (responseTime > 5000) {
      events.emit('counter', 'meta_api_slow_responses', 1)
    }
    
    // Simulate rate limiting
    if (Math.random() < 0.05) { // 5% chance of rate limiting
      events.emit('counter', 'meta_api_rate_limited', 1)
    }
    
    done()
  }, Math.random() * 2000 + 500) // Simulate 500-2500ms response time
}

function testDashboardLoad(requestParams, context, events, done) {
  const startTime = Date.now()
  
  // Simulate dashboard loading with multiple API calls
  const apiCalls = [
    testHealthEndpoint,
    testMetaApiEndpoint,
    testMetaApiEndpoint, // Multiple Meta API calls
  ]
  
  let completedCalls = 0
  apiCalls.forEach(apiCall => {
    apiCall(requestParams, context, events, () => {
      completedCalls++
      if (completedCalls === apiCalls.length) {
        const endTime = Date.now()
        const totalTime = endTime - startTime
        
        events.emit('histogram', 'dashboard_load_time', totalTime)
        
        if (totalTime > 10000) {
          events.emit('counter', 'dashboard_slow_loads', 1)
        }
        
        done()
      }
    })
  })
}

// Memory usage simulation
function simulateMemoryUsage() {
  const initialMemory = process.memoryUsage()
  const testData = generateTestData()
  
  // Simulate processing large datasets
  const processedData = testData.campaigns.map(campaign => ({
    ...campaign,
    adSets: testData.adSets.filter(adSet => adSet.campaign_id === campaign.id),
    metrics: {
      roas: campaign.spend > 0 ? (campaign.conversions * 50) / campaign.spend : 0,
      ctr: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0,
    }
  }))
  
  const finalMemory = process.memoryUsage()
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
  
  return {
    memoryIncrease,
    processedRecords: processedData.length,
    averageProcessingTime: memoryIncrease / processedData.length
  }
}

// Database connection simulation
function simulateDatabaseLoad(connectionCount = 10) {
  const connections = []
  
  for (let i = 0; i < connectionCount; i++) {
    connections.push({
      id: i,
      status: 'active',
      queries: Math.floor(Math.random() * 100),
      responseTime: Math.random() * 500
    })
  }
  
  return {
    totalConnections: connections.length,
    activeConnections: connections.filter(c => c.status === 'active').length,
    averageResponseTime: connections.reduce((sum, c) => sum + c.responseTime, 0) / connections.length,
    totalQueries: connections.reduce((sum, c) => sum + c.queries, 0)
  }
}

// Error simulation
function simulateErrors() {
  const errorTypes = [
    'OAuth token expired',
    'Rate limit exceeded',
    'Network timeout',
    'Invalid ad account ID',
    'Server error',
    'Database connection failed'
  ]
  
  const errors = []
  
  // Simulate random errors (5% error rate)
  for (let i = 0; i < 100; i++) {
    if (Math.random() < 0.05) {
      errors.push({
        type: errorTypes[Math.floor(Math.random() * errorTypes.length)],
        timestamp: new Date().toISOString(),
        severity: Math.random() < 0.2 ? 'critical' : Math.random() < 0.5 ? 'warning' : 'info'
      })
    }
  }
  
  return errors
}

// Performance monitoring
function monitorPerformance() {
  const metrics = {
    memoryUsage: simulateMemoryUsage(),
    databaseLoad: simulateDatabaseLoad(),
    errors: simulateErrors(),
    timestamp: new Date().toISOString()
  }
  
  return metrics
}

// Export functions for use in load testing
module.exports = {
  generateTestData,
  loadTestScenarios,
  testHealthEndpoint,
  testMetaApiEndpoint,
  testDashboardLoad,
  simulateMemoryUsage,
  simulateDatabaseLoad,
  simulateErrors,
  monitorPerformance
}

// If run directly, perform a quick load test simulation
if (require.main === module) {
  console.log('Running load test simulation...')
  
  const startTime = Date.now()
  
  // Simulate concurrent users
  const userCount = 50
  const promises = []
  
  for (let i = 0; i < userCount; i++) {
    promises.push(new Promise((resolve) => {
      testDashboardLoad({}, {}, {
        emit: (metric, name, value) => {
          console.log(`User ${i}: ${metric} ${name} = ${value}`)
        }
      }, resolve)
    }))
  }
  
  Promise.all(promises).then(() => {
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    console.log(`\nLoad test completed:`)
    console.log(`- Total time: ${totalTime}ms`)
    console.log(`- Average time per user: ${totalTime / userCount}ms`)
    console.log(`- Users per second: ${userCount / (totalTime / 1000)}`)
    
    const metrics = monitorPerformance()
    console.log('\nPerformance metrics:', JSON.stringify(metrics, null, 2))
  })
}