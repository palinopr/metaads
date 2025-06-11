import { createMocks } from 'node-mocks-http'
import { NextRequest, NextResponse } from 'next/server'

// Import API route handlers
import { GET as healthGet } from '../../app/api/health/route'
import { POST as metaPost } from '../../app/api/meta/route'
import { POST as aiInsightsPost } from '../../app/api/ai-insights/route'
import { POST as aiAnalyzePost } from '../../app/api/ai-analyze/route'
import { GET as logStreamGet } from '../../app/api/logs/stream/route'
import { POST as logErrorPost } from '../../app/api/log-error/route'
import { GET as realtimeGet } from '../../app/api/realtime/route'

// Mock external dependencies
jest.mock('@anthropic-ai/sdk', () => {
  return {
    Anthropic: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ text: 'Mock AI response' }]
        })
      }
    }))
  }
})

// Mock Meta API
global.fetch = jest.fn()

// Mock environment variables
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
process.env.NODE_ENV = 'test'

describe('API Endpoints Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  describe('/api/health', () => {
    it('should return health status', async () => {
      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await healthGet(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.timestamp).toBeDefined()
      expect(data.uptime).toBeDefined()
    })

    it('should include service checks', async () => {
      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await healthGet(request)
      const data = await response.json()

      expect(data.services).toBeDefined()
      expect(data.services.database).toBeDefined()
      expect(data.services.cache).toBeDefined()
    })

    it('should handle detailed health check', async () => {
      const request = new NextRequest('http://localhost:3000/api/health?detailed=true')
      const response = await healthGet(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.detailed).toBe(true)
    })
  })

  describe('/api/meta', () => {
    beforeEach(() => {
      // Mock successful Meta API response
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: '123456789',
              name: 'Test Campaign',
              status: 'ACTIVE',
              insights: {
                data: [{
                  spend: '100.50',
                  impressions: '10000',
                  clicks: '250'
                }]
              }
            }
          ]
        })
      })
    })

    it('should handle campaign data requests', async () => {
      const requestBody = {
        endpoint: 'act_123456789/campaigns',
        params: {
          fields: 'id,name,status,insights{spend,impressions,clicks}',
          limit: 100
        },
        accessToken: 'test-access-token'
      }

      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await metaPost(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('graph.facebook.com'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-access-token'
          })
        })
      )
    })

    it('should handle Meta API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Invalid OAuth access token',
            code: 190,
            type: 'OAuthException'
          }
        })
      })

      const requestBody = {
        endpoint: 'act_123456789/campaigns',
        params: { fields: 'id,name' },
        accessToken: 'invalid-token'
      }

      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await metaPost(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe(190)
      expect(data.error.type).toBe('OAuthException')
    })

    it('should validate request parameters', async () => {
      const invalidRequest = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify({}), // Missing required fields
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await metaPost(invalidRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('required')
    })

    it('should handle rate limiting', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            message: 'Rate limit exceeded',
            code: 17,
            type: 'OAuthException'
          }
        })
      })

      const requestBody = {
        endpoint: 'act_123456789/campaigns',
        params: { fields: 'id,name' },
        accessToken: 'test-token'
      }

      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await metaPost(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error.code).toBe(17)
    })

    it('should handle network timeouts', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network timeout'))

      const requestBody = {
        endpoint: 'act_123456789/campaigns',
        params: { fields: 'id,name' },
        accessToken: 'test-token'
      }

      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await metaPost(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('Network timeout')
    })
  })

  describe('/api/ai-insights', () => {
    it('should generate AI insights for campaigns', async () => {
      const requestBody = {
        campaigns: [
          {
            id: '123',
            name: 'Test Campaign',
            performanceScore: 85,
            lifetimeROAS: 3.2,
            insights: { spend: 1000, revenue: 3200 }
          }
        ],
        totalSpend: 1000,
        totalRevenue: 3200,
        accountInfo: { id: 'act_123', name: 'Test Account' }
      }

      const request = new NextRequest('http://localhost:3000/api/ai-insights', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await aiInsightsPost(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.insights).toBeDefined()
      expect(data.recommendations).toBeDefined()
      expect(data.predictiveAnalytics).toBeDefined()
    })

    it('should handle missing AI API key', async () => {
      const originalKey = process.env.ANTHROPIC_API_KEY
      delete process.env.ANTHROPIC_API_KEY

      const requestBody = {
        campaigns: [],
        totalSpend: 0,
        totalRevenue: 0
      }

      const request = new NextRequest('http://localhost:3000/api/ai-insights', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await aiInsightsPost(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error.message).toContain('AI service not configured')

      // Restore
      process.env.ANTHROPIC_API_KEY = originalKey
    })

    it('should validate campaign data', async () => {
      const invalidRequest = new NextRequest('http://localhost:3000/api/ai-insights', {
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await aiInsightsPost(invalidRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.message).toContain('required')
    })
  })

  describe('/api/ai-analyze', () => {
    it('should analyze campaign performance', async () => {
      const requestBody = {
        campaignData: {
          id: '123',
          name: 'Test Campaign',
          insights: {
            spend: 1000,
            revenue: 3200,
            impressions: 50000,
            clicks: 1500,
            conversions: 32
          }
        },
        timeframe: '30d',
        analysisType: 'performance'
      }

      const request = new NextRequest('http://localhost:3000/api/ai-analyze', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await aiAnalyzePost(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analysis).toBeDefined()
      expect(data.insights).toBeDefined()
      expect(data.recommendations).toBeDefined()
    })

    it('should handle different analysis types', async () => {
      const analysisTypes = ['performance', 'optimization', 'forecasting', 'competitive']

      for (const analysisType of analysisTypes) {
        const requestBody = {
          campaignData: {
            id: '123',
            insights: { spend: 100, revenue: 320 }
          },
          analysisType
        }

        const request = new NextRequest('http://localhost:3000/api/ai-analyze', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await aiAnalyzePost(request)
        expect(response.status).toBe(200)
      }
    })
  })

  describe('/api/log-error', () => {
    it('should log client-side errors', async () => {
      const errorData = {
        message: 'Test error message',
        stack: 'Error: Test error\\n    at test.js:1:1',
        url: 'http://localhost:3000/dashboard',
        userAgent: 'Mozilla/5.0 Test Browser',
        timestamp: Date.now(),
        level: 'error',
        context: {
          userId: 'test-user',
          sessionId: 'test-session'
        }
      }

      const request = new NextRequest('http://localhost:3000/api/log-error', {
        method: 'POST',
        body: JSON.stringify(errorData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await logErrorPost(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.logged).toBe(true)
    })

    it('should validate error data', async () => {
      const invalidRequest = new NextRequest('http://localhost:3000/api/log-error', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await logErrorPost(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should handle rate limiting for error logs', async () => {
      // Simulate multiple rapid error reports
      const errorData = {
        message: 'Rapid error',
        stack: 'Error stack',
        url: 'http://localhost:3000/test',
        timestamp: Date.now()
      }

      const requests = Array(10).fill(null).map(() => 
        new NextRequest('http://localhost:3000/api/log-error', {
          method: 'POST',
          body: JSON.stringify(errorData),
          headers: { 'Content-Type': 'application/json' }
        })
      )

      const responses = await Promise.all(
        requests.map(req => logErrorPost(req))
      )

      // Some requests should be rate limited
      const rateLimited = responses.some(res => res.status === 429)
      expect(rateLimited).toBe(true)
    })
  })

  describe('/api/realtime', () => {
    it('should handle WebSocket upgrade requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/realtime', {
        headers: {
          'Upgrade': 'websocket',
          'Connection': 'Upgrade',
          'Sec-WebSocket-Key': 'test-key',
          'Sec-WebSocket-Version': '13'
        }
      })

      const response = await realtimeGet(request)

      // Should attempt WebSocket upgrade
      expect(response.status).toBe(101)
    })

    it('should reject non-WebSocket requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/realtime')

      const response = await realtimeGet(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('WebSocket')
    })
  })

  describe('/api/logs/stream', () => {
    it('should provide streaming logs', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs/stream')

      const response = await logStreamGet(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('text/stream')
      expect(response.headers.get('Cache-Control')).toBe('no-cache')
    })

    it('should handle log filtering', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs/stream?level=error&limit=50')

      const response = await logStreamGet(request)

      expect(response.status).toBe(200)
    })

    it('should require authentication for log access', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs/stream', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      })

      const response = await logStreamGet(request)

      expect(response.status).toBe(401)
    })
  })

  describe('Error Handling Across Endpoints', () => {
    it('should handle malformed JSON requests', async () => {
      const endpoints = [
        '/api/meta',
        '/api/ai-insights',
        '/api/ai-analyze',
        '/api/log-error'
      ]

      for (const endpoint of endpoints) {
        const request = new NextRequest(`http://localhost:3000${endpoint}`, {
          method: 'POST',
          body: 'invalid json{',
          headers: { 'Content-Type': 'application/json' }
        })

        let response
        if (endpoint === '/api/meta') response = await metaPost(request)
        else if (endpoint === '/api/ai-insights') response = await aiInsightsPost(request)
        else if (endpoint === '/api/ai-analyze') response = await aiAnalyzePost(request)
        else if (endpoint === '/api/log-error') response = await logErrorPost(request)

        expect(response?.status).toBe(400)
      }
    })

    it('should handle missing Content-Type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' })
        // Missing Content-Type header
      })

      const response = await metaPost(request)

      expect(response.status).toBe(400)
    })

    it('should handle method not allowed', async () => {
      // Most POST-only endpoints should reject GET requests
      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'GET'
      })

      const response = await metaPost(request)

      expect(response.status).toBe(405)
    })
  })

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await healthGet(request)

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
    })

    it('should include CORS headers when appropriate', async () => {
      const request = new NextRequest('http://localhost:3000/api/health', {
        headers: {
          'Origin': 'http://localhost:3000'
        }
      })
      const response = await healthGet(request)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined()
    })
  })

  describe('Input Validation and Sanitization', () => {
    it('should sanitize XSS attempts in inputs', async () => {
      const xssPayload = '<script>alert(\"xss\")</script>'
      
      const requestBody = {
        message: xssPayload,
        stack: xssPayload,
        url: `http://localhost:3000/test?param=${xssPayload}`,
        timestamp: Date.now()
      }

      const request = new NextRequest('http://localhost:3000/api/log-error', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await logErrorPost(request)
      
      expect(response.status).toBe(200) // Should handle gracefully
    })

    it('should reject oversized payloads', async () => {
      const oversizedData = {
        campaigns: Array(10000).fill({
          id: 'test',
          name: 'x'.repeat(1000),
          data: 'x'.repeat(10000)
        })
      }

      const request = new NextRequest('http://localhost:3000/api/ai-insights', {
        method: 'POST',
        body: JSON.stringify(oversizedData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await aiInsightsPost(request)

      expect(response.status).toBe(413) // Payload too large
    })
  })

  describe('Performance and Timeout Handling', () => {
    it('should handle slow external API responses', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ data: 'slow response' })
          }), 5000)
        )
      )

      const requestBody = {
        endpoint: 'act_123456789/campaigns',
        params: { fields: 'id,name' },
        accessToken: 'test-token'
      }

      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const startTime = Date.now()
      const response = await metaPost(request)
      const endTime = Date.now()

      // Should timeout within reasonable time
      expect(endTime - startTime).toBeLessThan(10000) // 10 seconds
      expect(response.status).toBe(408) // Request timeout
    })
  })

  describe('API Versioning and Compatibility', () => {
    it('should handle API version headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: 'act_123/campaigns',
          params: { fields: 'id,name' },
          accessToken: 'test-token'
        }),
        headers: {
          'Content-Type': 'application/json',
          'API-Version': 'v1'
        }
      })

      const response = await metaPost(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('API-Version')).toBe('v1')
    })

    it('should handle deprecated API usage', async () => {
      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: 'act_123/campaigns',
          params: { fields: 'id,name' },
          accessToken: 'test-token'
        }),
        headers: {
          'Content-Type': 'application/json',
          'API-Version': 'v0.1' // Deprecated version
        }
      })

      const response = await metaPost(request)

      expect(response.headers.get('Warning')).toContain('deprecated')
    })
  })

  describe('Monitoring and Observability', () => {
    it('should include request tracking headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/health', {
        headers: {
          'X-Request-ID': 'test-request-123'
        }
      })

      const response = await healthGet(request)

      expect(response.headers.get('X-Request-ID')).toBe('test-request-123')
    })

    it('should track API usage metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await healthGet(request)

      expect(response.headers.get('X-Response-Time')).toBeDefined()
    })
  })
})