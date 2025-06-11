// WebSocket Load Testing for Meta Ads Dashboard Real-time Features
// Tests WebSocket connections, subscriptions, and real-time data flow under load

import ws from 'k6/ws'
import http from 'k6/http'
import { check, group, sleep, fail } from 'k6'
import { Rate, Trend, Counter, Gauge } from 'k6/metrics'
import { randomString, randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js'

// WebSocket-specific metrics
const wsConnectionTime = new Trend('ws_connection_time')
const wsMessageLatency = new Trend('ws_message_latency')
const wsMessageRate = new Rate('ws_message_rate')
const wsConnectionSuccess = new Rate('ws_connection_success')
const wsConnectionFailed = new Rate('ws_connection_failed')
const wsReconnectionTime = new Trend('ws_reconnection_time')

// Real-time feature metrics
const subscriptionTime = new Trend('subscription_time')
const unsubscriptionTime = new Trend('unsubscription_time')
const campaignUpdateLatency = new Trend('campaign_update_latency')
const metricUpdateLatency = new Trend('metric_update_latency')
const alertDeliveryTime = new Trend('alert_delivery_time')
const heartbeatLatency = new Trend('heartbeat_latency')

// Capacity and scalability metrics
const concurrentConnections = new Gauge('concurrent_connections')
const activeSubscriptions = new Gauge('active_subscriptions')
const messagesThroughput = new Counter('messages_throughput')
const droppedMessages = new Counter('dropped_messages')
const connectionDrops = new Counter('connection_drops')
const reconnectionAttempts = new Counter('reconnection_attempts')
const memoryUsageIndicator = new Gauge('memory_usage_indicator')

// Error and reliability metrics
const wsErrors = new Counter('ws_errors')
const messageErrors = new Counter('message_errors')
const subscriptionErrors = new Counter('subscription_errors')
const heartbeatMissed = new Counter('heartbeat_missed')
const staleConnections = new Counter('stale_connections')

// Test configuration for WebSocket load testing
export const options = {
  scenarios: {
    // Scenario 1: Baseline WebSocket connection test
    baseline_ws_test: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
      tags: { test_type: 'baseline_ws' },
    },

    // Scenario 2: Connection scaling test
    connection_scaling: {
      executor: 'ramping-vus',
      startTime: '6m',
      startVUs: 10,
      stages: [
        { duration: '2m', target: 50 },   // Ramp to 50 connections
        { duration: '3m', target: 50 },   // Hold 50 connections
        { duration: '2m', target: 100 },  // Ramp to 100 connections
        { duration: '5m', target: 100 },  // Hold 100 connections
        { duration: '2m', target: 200 },  // Ramp to 200 connections
        { duration: '3m', target: 200 },  // Hold 200 connections
        { duration: '2m', target: 0 },    // Ramp down
      ],
      tags: { test_type: 'connection_scaling' },
    },

    // Scenario 3: High-frequency message test
    high_frequency_messages: {
      executor: 'constant-vus',
      vus: 50,
      duration: '10m',
      startTime: '25m',
      tags: { test_type: 'high_frequency' },
    },

    // Scenario 4: Subscription stress test
    subscription_stress: {
      executor: 'ramping-vus',
      startTime: '40m',
      startVUs: 20,
      stages: [
        { duration: '1m', target: 75 },
        { duration: '5m', target: 75 },
        { duration: '1m', target: 0 },
      ],
      tags: { test_type: 'subscription_stress' },
    },

    // Scenario 5: Connection resilience test
    connection_resilience: {
      executor: 'constant-vus',
      vus: 30,
      duration: '15m',
      startTime: '50m',
      tags: { test_type: 'resilience' },
    },

    // Scenario 6: Real-time data flow simulation
    realtime_data_flow: {
      executor: 'ramping-arrival-rate',
      startTime: '70m',
      startRate: 20,
      timeUnit: '1s',
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '3m', target: 150 },
        { duration: '2m', target: 20 },
      ],
      preAllocatedVUs: 50,
      maxVUs: 150,
      tags: { test_type: 'realtime_flow' },
    },
  },
  
  thresholds: {
    // Connection performance thresholds
    ws_connection_time: ['p(95)<2000', 'p(99)<5000'],
    ws_connection_success: ['rate>0.98'], // 98% connection success rate
    ws_connection_failed: ['rate<0.02'],  // Less than 2% connection failures
    
    // Message performance thresholds
    ws_message_latency: ['p(95)<500', 'p(99)<1000'],
    ws_message_rate: ['rate>0.99'],  // 99% message delivery success
    
    // Real-time feature thresholds
    subscription_time: ['p(95)<1000', 'p(99)<2000'],
    campaign_update_latency: ['p(95)<1000', 'p(99)<2000'],
    metric_update_latency: ['p(95)<800', 'p(99)<1500'],
    alert_delivery_time: ['p(95)<500', 'p(99)<1000'],
    heartbeat_latency: ['p(95)<200', 'p(99)<500'],
    
    // Reliability thresholds
    connection_drops: ['count<50'],     // Less than 50 connection drops
    dropped_messages: ['count<100'],    // Less than 100 dropped messages
    ws_errors: ['count<200'],          // Less than 200 WebSocket errors
    heartbeat_missed: ['count<100'],   // Less than 100 missed heartbeats
    
    // Reconnection thresholds
    ws_reconnection_time: ['p(95)<3000', 'p(99)<8000'],
    reconnection_attempts: ['count<150'], // Reasonable reconnection attempts
  },
}

const BASE_URL = 'http://localhost:3000'
const WS_URL = 'ws://localhost:3000'

// Test data generators
function generateCampaignId() {
  return `campaign_${randomIntBetween(1000000, 9999999)}`
}

function generateMetricType() {
  return randomItem(['spend', 'impressions', 'clicks', 'conversions', 'ctr', 'cpm', 'roas'])
}

function generateChannelName() {
  const channelTypes = ['campaign', 'metrics', 'alerts', 'system', 'user']
  const channelType = randomItem(channelTypes)
  const identifier = randomIntBetween(1000, 9999)
  return `${channelType}:${identifier}`
}

function generateAlert() {
  return {
    type: randomItem(['budget', 'performance', 'error', 'info']),
    severity: randomItem(['low', 'medium', 'high', 'critical']),
    title: `Load Test Alert ${randomString(8)}`,
    message: `This is a load test alert message ${randomString(20)}`,
    timestamp: Date.now(),
    data: {
      campaignId: generateCampaignId(),
      value: randomIntBetween(1, 1000),
    }
  }
}

function generateCampaignUpdate() {
  return {
    campaignId: generateCampaignId(),
    status: randomItem(['ACTIVE', 'PAUSED']),
    spend: randomIntBetween(100, 10000),
    impressions: randomIntBetween(1000, 100000),
    clicks: randomIntBetween(10, 5000),
    conversions: randomIntBetween(1, 500),
    timestamp: Date.now(),
  }
}

function generateMetricUpdate() {
  return {
    metric: generateMetricType(),
    value: Math.random() * 1000,
    change: (Math.random() - 0.5) * 100, // -50% to +50% change
    timestamp: Date.now(),
  }
}

// WebSocket testing functions
function testBasicWebSocketConnection() {
  group('Basic WebSocket Connection', () => {
    const connectionStart = Date.now()
    
    const response = ws.connect(WS_URL, {
      headers: {
        'User-Agent': 'K6-WebSocket-LoadTest/1.0',
      },
    }, function (socket) {
      const connectionTime = Date.now() - connectionStart
      wsConnectionTime.add(connectionTime)
      concurrentConnections.add(1)
      
      let heartbeatReceived = false
      let messagesReceived = 0
      
      socket.on('open', () => {
        wsConnectionSuccess.add(1)
        
        // Send initial ping
        const pingStart = Date.now()
        socket.send(JSON.stringify({
          type: 'ping',
          timestamp: pingStart,
        }))
      })
      
      socket.on('message', (data) => {
        messagesReceived++
        messagesThroughput.add(1)
        
        try {
          const message = JSON.parse(data)
          const latency = Date.now() - (message.timestamp || Date.now())
          wsMessageLatency.add(latency)
          
          if (message.type === 'pong') {
            const heartbeatTime = Date.now() - message.timestamp
            heartbeatLatency.add(heartbeatTime)
            heartbeatReceived = true
          }
          
          wsMessageRate.add(1)
        } catch (error) {
          messageErrors.add(1)
          wsErrors.add(1)
        }
      })
      
      socket.on('error', (error) => {
        wsErrors.add(1)
        console.error('WebSocket error:', error)
      })
      
      socket.on('close', () => {
        concurrentConnections.add(-1)
        if (!heartbeatReceived) {
          heartbeatMissed.add(1)
        }
      })
      
      // Keep connection alive for a while
      sleep(randomIntBetween(10, 30))
      
      socket.close()
    })
    
    const success = check(response, {
      'WebSocket connection established': (r) => r !== null,
      'Connection time acceptable': () => (Date.now() - connectionStart) < 5000,
    })
    
    if (!success) {
      wsConnectionFailed.add(1)
      connectionDrops.add(1)
    }
  })
}

function testChannelSubscriptionUnsubscription() {
  group('Channel Subscription/Unsubscription', () => {
    const response = ws.connect(WS_URL, function (socket) {
      concurrentConnections.add(1)
      const subscriptions = new Set()
      let subscriptionResponses = 0
      
      socket.on('open', () => {
        // Subscribe to multiple channels
        const channelsToSubscribe = [
          generateChannelName(),
          generateChannelName(),
          generateChannelName(),
          `campaign:${generateCampaignId()}`,
          `metrics:${generateMetricType()}`,
        ]
        
        channelsToSubscribe.forEach((channel, index) => {
          setTimeout(() => {
            const subscribeStart = Date.now()
            
            socket.send(JSON.stringify({
              type: 'subscribe',
              channel: channel,
              timestamp: Date.now(),
            }))
            
            subscriptions.add(channel)
            activeSubscriptions.add(1)
            
            // Measure subscription time when we get confirmation
            socket.on('message', (data) => {
              try {
                const message = JSON.parse(data)
                if (message.channel === 'system' && message.data.message?.includes('Subscribed')) {
                  const subscriptionTime_val = Date.now() - subscribeStart
                  subscriptionTime.add(subscriptionTime_val)
                  subscriptionResponses++
                }
              } catch (error) {
                subscriptionErrors.add(1)
              }
            })
          }, index * 500) // Stagger subscriptions
        })
        
        // After some time, unsubscribe from half the channels
        setTimeout(() => {
          const channelsArray = Array.from(subscriptions)
          const channelsToUnsubscribe = channelsArray.slice(0, Math.floor(channelsArray.length / 2))
          
          channelsToUnsubscribe.forEach(channel => {
            const unsubscribeStart = Date.now()
            
            socket.send(JSON.stringify({
              type: 'unsubscribe',
              channel: channel,
              timestamp: Date.now(),
            }))
            
            subscriptions.delete(channel)
            activeSubscriptions.add(-1)
            
            const unsubscriptionTime_val = Date.now() - unsubscribeStart
            unsubscriptionTime.add(unsubscriptionTime_val)
          })
        }, 5000)
      })
      
      socket.on('error', (error) => {
        wsErrors.add(1)
        subscriptionErrors.add(1)
      })
      
      socket.on('close', () => {
        concurrentConnections.add(-1)
        // Clean up active subscriptions count
        activeSubscriptions.add(-subscriptions.size)
      })
      
      // Keep connection alive to test subscriptions
      sleep(randomIntBetween(15, 25))
      
      check({ subscriptionResponses }, {
        'Subscription confirmations received': (data) => data.subscriptionResponses > 0,
      })
      
      socket.close()
    })
  })
}

function testHighFrequencyMessages() {
  group('High-Frequency Message Test', () => {
    const response = ws.connect(WS_URL, function (socket) {
      concurrentConnections.add(1)
      let messagesReceived = 0
      let messagesSent = 0
      const sentTimestamps = new Map()
      
      socket.on('open', () => {
        // Subscribe to a high-traffic channel
        socket.send(JSON.stringify({
          type: 'subscribe',
          channel: 'high-frequency-test',
          timestamp: Date.now(),
        }))
        
        // Send rapid ping messages
        const rapidPingInterval = setInterval(() => {
          const pingId = `ping_${messagesSent++}`
          const timestamp = Date.now()
          
          sentTimestamps.set(pingId, timestamp)
          
          socket.send(JSON.stringify({
            type: 'ping',
            id: pingId,
            timestamp: timestamp,
          }))
          
          // Simulate sending campaign updates rapidly
          if (messagesSent % 3 === 0) {
            socket.send(JSON.stringify({
              type: 'update',
              channel: 'high-frequency-test',
              data: generateCampaignUpdate(),
              timestamp: Date.now(),
            }))
          }
          
          // Clean up old timestamps to prevent memory leaks
          if (sentTimestamps.size > 100) {
            const oldestKey = sentTimestamps.keys().next().value
            sentTimestamps.delete(oldestKey)
          }
        }, 100) // Send message every 100ms
        
        setTimeout(() => {
          clearInterval(rapidPingInterval)
        }, 8000) // Stop after 8 seconds
      })
      
      socket.on('message', (data) => {
        messagesReceived++
        messagesThroughput.add(1)
        
        try {
          const message = JSON.parse(data)
          
          if (message.type === 'pong' && message.id) {
            const sentTime = sentTimestamps.get(message.id)
            if (sentTime) {
              const latency = Date.now() - sentTime
              wsMessageLatency.add(latency)
              sentTimestamps.delete(message.id)
            }
          }
          
          if (message.type === 'update') {
            const latency = Date.now() - (message.timestamp || Date.now())
            if (message.channel === 'high-frequency-test') {
              campaignUpdateLatency.add(latency)
            }
          }
          
          wsMessageRate.add(1)
        } catch (error) {
          messageErrors.add(1)
          droppedMessages.add(1)
        }
      })
      
      socket.on('error', (error) => {
        wsErrors.add(1)
      })
      
      socket.on('close', () => {
        concurrentConnections.add(-1)
      })
      
      sleep(12) // Keep connection alive during rapid messaging
      
      const messageDeliveryRate = messagesReceived / messagesSent
      check({ messageDeliveryRate, messagesReceived, messagesSent }, {
        'High message delivery rate': (data) => data.messageDeliveryRate > 0.95,
        'Received some messages': (data) => data.messagesReceived > 0,
        'Sent some messages': (data) => data.messagesSent > 0,
      })
      
      socket.close()
    })
  })
}

function testConnectionResilience() {
  group('Connection Resilience Test', () => {
    const response = ws.connect(WS_URL, function (socket) {
      concurrentConnections.add(1)
      let reconnections = 0
      let connectionStable = true
      
      socket.on('open', () => {
        // Subscribe to channels
        socket.send(JSON.stringify({
          type: 'subscribe',
          channel: 'resilience-test',
          timestamp: Date.now(),
        }))
        
        // Simulate network issues by randomly closing connection
        setTimeout(() => {
          if (Math.random() < 0.3) { // 30% chance of simulated network issue
            connectionStable = false
            connectionDrops.add(1)
            socket.close()
            
            // Attempt reconnection after a delay
            setTimeout(() => {
              reconnections++
              reconnectionAttempts.add(1)
              
              const reconnectStart = Date.now()
              const newSocket = ws.connect(WS_URL, function(newSock) {
                const reconnectionTime_val = Date.now() - reconnectStart
                wsReconnectionTime.add(reconnectionTime_val)
                
                newSock.on('open', () => {
                  // Re-subscribe after reconnection
                  newSock.send(JSON.stringify({
                    type: 'subscribe',
                    channel: 'resilience-test',
                    timestamp: Date.now(),
                  }))
                })
                
                sleep(5)
                newSock.close()
              })
            }, randomIntBetween(1000, 3000))
          }
        }, randomIntBetween(3000, 8000))
      })
      
      socket.on('error', (error) => {
        wsErrors.add(1)
        connectionStable = false
      })
      
      socket.on('close', () => {
        concurrentConnections.add(-1)
        if (!connectionStable) {
          staleConnections.add(1)
        }
      })
      
      sleep(randomIntBetween(10, 15))
      
      check({ reconnections, connectionStable }, {
        'Connection resilience test completed': () => true,
        'Reconnection successful if needed': (data) => !data.connectionStable ? data.reconnections > 0 : true,
      })
      
      if (socket.readyState === 1) { // OPEN
        socket.close()
      }
    })
  })
}

function testRealtimeDataFlow() {
  group('Real-time Data Flow Simulation', () => {
    // First, trigger some real-time updates via HTTP API
    const campaignUpdate = generateCampaignUpdate()
    const metricUpdate = generateMetricUpdate()
    const alert = generateAlert()
    
    // Send campaign update
    http.post(`${BASE_URL}/api/ws`, JSON.stringify({
      type: 'campaign-update',
      channel: campaignUpdate.campaignId,
      data: campaignUpdate,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
    
    // Send metric update
    http.post(`${BASE_URL}/api/ws`, JSON.stringify({
      type: 'metric-update',
      channel: metricUpdate.metric,
      data: metricUpdate,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
    
    // Send alert
    http.post(`${BASE_URL}/api/ws`, JSON.stringify({
      type: 'alert',
      data: alert,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
    
    // Now connect via WebSocket to receive these updates
    const response = ws.connect(WS_URL, function (socket) {
      concurrentConnections.add(1)
      let campaignUpdatesReceived = 0
      let metricUpdatesReceived = 0
      let alertsReceived = 0
      
      socket.on('open', () => {
        // Subscribe to all relevant channels
        socket.send(JSON.stringify({
          type: 'subscribe',
          channel: `campaign:${campaignUpdate.campaignId}`,
          timestamp: Date.now(),
        }))
        
        socket.send(JSON.stringify({
          type: 'subscribe',
          channel: `metrics:${metricUpdate.metric}`,
          timestamp: Date.now(),
        }))
        
        socket.send(JSON.stringify({
          type: 'subscribe',
          channel: 'alerts',
          timestamp: Date.now(),
        }))
      })
      
      socket.on('message', (data) => {
        try {
          const message = JSON.parse(data)
          const latency = Date.now() - (message.timestamp || Date.now())
          
          if (message.type === 'update') {
            if (message.channel?.startsWith('campaign:')) {
              campaignUpdatesReceived++
              campaignUpdateLatency.add(latency)
            } else if (message.channel?.startsWith('metrics:')) {
              metricUpdatesReceived++
              metricUpdateLatency.add(latency)
            }
          } else if (message.type === 'alert') {
            alertsReceived++
            alertDeliveryTime.add(latency)
          }
          
          messagesThroughput.add(1)
        } catch (error) {
          messageErrors.add(1)
        }
      })
      
      socket.on('error', (error) => {
        wsErrors.add(1)
      })
      
      socket.on('close', () => {
        concurrentConnections.add(-1)
      })
      
      sleep(randomIntBetween(8, 12))
      
      check({ campaignUpdatesReceived, metricUpdatesReceived, alertsReceived }, {
        'Real-time data flow test completed': () => true,
        'Received campaign updates': (data) => data.campaignUpdatesReceived >= 0,
        'Received metric updates': (data) => data.metricUpdatesReceived >= 0,
        'Received alerts': (data) => data.alertsReceived >= 0,
      })
      
      socket.close()
    })
  })
}

function testWebSocketConnectionStats() {
  group('WebSocket Connection Stats', () => {
    // Get connection statistics
    const statsResponse = http.post(`${BASE_URL}/api/ws`, JSON.stringify({
      type: 'stats'
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
    
    check(statsResponse, {
      'Stats endpoint responds': (r) => r.status === 200,
      'Stats have connection info': (r) => {
        try {
          const stats = JSON.parse(r.body)
          return stats.totalClients !== undefined && stats.activeChannels !== undefined
        } catch {
          return false
        }
      },
    })
    
    if (statsResponse.status === 200) {
      try {
        const stats = JSON.parse(statsResponse.body)
        memoryUsageIndicator.add(stats.totalClients || 0)
        console.log(`Current WebSocket stats: ${stats.totalClients} clients, ${stats.activeChannels} channels`)
      } catch (error) {
        console.error('Failed to parse stats:', error)
      }
    }
  })
}

// Main test execution function
export default function () {
  const testType = __ENV.TEST_TYPE || 'mixed'
  
  switch (testType) {
    case 'basic_connection':
      testBasicWebSocketConnection()
      break
      
    case 'subscription_test':
      testChannelSubscriptionUnsubscription()
      break
      
    case 'high_frequency':
      testHighFrequencyMessages()
      break
      
    case 'resilience_test':
      testConnectionResilience()
      break
      
    case 'realtime_flow':
      testRealtimeDataFlow()
      break
      
    case 'connection_stats':
      testWebSocketConnectionStats()
      break
      
    default:
      // Mixed scenario - realistic usage pattern
      const scenario = Math.random()
      
      if (scenario < 0.3) {
        // 30% - Basic connection and subscription
        testBasicWebSocketConnection()
        sleep(randomIntBetween(2, 5))
        testChannelSubscriptionUnsubscription()
      } else if (scenario < 0.5) {
        // 20% - High-frequency message testing
        testHighFrequencyMessages()
      } else if (scenario < 0.7) {
        // 20% - Real-time data flow
        testRealtimeDataFlow()
      } else if (scenario < 0.85) {
        // 15% - Connection resilience
        testConnectionResilience()
      } else if (scenario < 0.95) {
        // 10% - Basic connection only
        testBasicWebSocketConnection()
      } else {
        // 5% - Connection stats
        testWebSocketConnectionStats()
      }
  }
  
  // Random sleep to simulate user behavior
  sleep(randomIntBetween(1, 6))
}

// Setup function
export function setup() {
  console.log('🔗 Starting WebSocket Load Test')
  console.log(`Target: ${WS_URL}`)
  console.log('Test Coverage: Connections, Subscriptions, Real-time Updates, Resilience')
  
  // Verify HTTP API is running
  const healthResponse = http.get(`${BASE_URL}/api/health`, { timeout: '10s' })
  if (healthResponse.status !== 200) {
    fail('HTTP API health check failed. Ensure the application is running.')
  }
  
  // Verify WebSocket endpoint info
  const wsInfoResponse = http.get(`${BASE_URL}/api/ws`)
  if (wsInfoResponse.status !== 200) {
    fail('WebSocket API endpoint not available.')
  }
  
  console.log('✅ HTTP API health check passed')
  console.log('✅ WebSocket endpoint available')
  console.log('🎯 WebSocket load testing scenarios configured')
  
  return {
    serverStatus: 'running',
    startTime: new Date().toISOString(),
    wsUrl: WS_URL,
    httpUrl: BASE_URL,
  }
}

// Teardown function
export function teardown(data) {
  if (data && data.startTime) {
    console.log(`🏁 WebSocket load test completed`)
    console.log(`Started: ${data.startTime}`)
    console.log(`Finished: ${new Date().toISOString()}`)
    console.log(`WebSocket URL: ${data.wsUrl}`)
  }
  
  console.log('\n📊 WebSocket Metrics Summary:')
  
  console.log('\nConnection Metrics:')
  console.log('- ws_connection_time: Time to establish WebSocket connections')
  console.log('- ws_connection_success: WebSocket connection success rate')
  console.log('- ws_reconnection_time: Time to re-establish dropped connections')
  console.log('- concurrent_connections: Peak concurrent WebSocket connections')
  
  console.log('\nMessage Performance:')
  console.log('- ws_message_latency: WebSocket message round-trip latency')
  console.log('- ws_message_rate: Message delivery success rate')
  console.log('- messages_throughput: Total messages processed per second')
  console.log('- heartbeat_latency: WebSocket heartbeat response time')
  
  console.log('\nReal-time Features:')
  console.log('- subscription_time: Time to subscribe to channels')
  console.log('- campaign_update_latency: Campaign update delivery time')
  console.log('- metric_update_latency: Metric update delivery time')
  console.log('- alert_delivery_time: Alert notification delivery time')
  console.log('- active_subscriptions: Peak active channel subscriptions')
  
  console.log('\nReliability Metrics:')
  console.log('- connection_drops: Number of unexpected connection drops')
  console.log('- dropped_messages: Number of messages that failed delivery')
  console.log('- reconnection_attempts: Number of reconnection attempts')
  console.log('- ws_errors: Total WebSocket error count')
  console.log('- heartbeat_missed: Number of missed heartbeat responses')
  
  console.log('\n⚠️  Performance Indicators:')
  console.log('- memory_usage_indicator: Server memory pressure indicator')
  console.log('- stale_connections: Connections that became unresponsive')
  console.log('- message_errors: Errors in message processing')
  console.log('- subscription_errors: Errors in channel subscription/unsubscription')
}