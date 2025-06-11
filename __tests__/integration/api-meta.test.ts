import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/meta/route'

// Mock the Meta API client modules
jest.mock('@/lib/meta-api-client', () => ({
  MetaAPIClient: jest.fn().mockImplementation(() => ({
    getCampaigns: jest.fn(),
    getHistoricalData: jest.fn(),
    getHourlyData: jest.fn(),
  })),
}))

jest.mock('@/lib/meta-api-adsets', () => ({
  AdSetAndAdAPI: jest.fn().mockImplementation(() => ({
    getAdSetsForCampaign: jest.fn(),
  })),
}))

jest.mock('@/lib/server-protection', () => ({
  safeJsonParse: jest.fn((response) => response.json()),
  withTimeout: jest.fn((promise) => promise),
}))

// Mock fetch globally
global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

beforeEach(() => {
  jest.clearAllMocks()
  jest.clearAllTimers()
  jest.useFakeTimers()
})

afterEach(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
  jest.restoreAllMocks()
})

describe('/api/meta POST', () => {
  describe('Rate Limiting', () => {
    it('should allow requests within rate limits', async () => {
      const requestBody = {
        type: 'test_connection',
        accessToken: 'valid_token_123456789012345',
        adAccountId: 'act_123456789',
      }

      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'act_123456789',
          name: 'Test Account',
          account_status: 1,
          currency: 'USD',
          timezone_name: 'America/New_York',
        }),
      } as Response)

      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should enforce rate limits for validation requests', async () => {
      const requestBody = {
        type: 'test_connection',
        accessToken: 'valid_token_123456789012345',
        adAccountId: 'act_123456789',
      }

      // Make 11 requests (limit is 10 per minute)
      const requests = Array.from({ length: 11 }, (_, i) =>
        new NextRequest('http://localhost:3000/api/meta', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': '127.0.0.1',
          },
        })
      )

      // Mock successful API response for the first 10 requests
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'act_123456789',
          name: 'Test Account',
          account_status: 1,
          currency: 'USD',
          timezone_name: 'America/New_York',
        }),
      } as Response)

      // Execute first 10 requests
      for (let i = 0; i < 10; i++) {
        const response = await POST(requests[i])
        expect(response.status).toBe(200)
      }

      // 11th request should be rate limited
      const rateLimitedResponse = await POST(requests[10])
      const rateLimitedData = await rateLimitedResponse.json()

      expect(rateLimitedResponse.status).toBe(429)
      expect(rateLimitedData.success).toBe(false)
      expect(rateLimitedData.error).toContain('Too many validation attempts')
    })
  })

  describe('Test Connection', () => {
    it('should successfully test connection with valid credentials', async () => {
      const requestBody = {
        type: 'test_connection',
        accessToken: 'valid_token_123456789012345',
        adAccountId: 'act_123456789',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'act_123456789',
          name: 'Test Account',
          account_status: 1,
          currency: 'USD',
          timezone_name: 'America/New_York',
        }),
      } as Response)

      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.accountInfo).toEqual({
        id: 'act_123456789',
        name: 'Test Account',
        status: 1,
        currency: 'USD',
        timezone: 'America/New_York',
      })
    })

    it('should reject invalid access token format', async () => {
      const requestBody = {
        type: 'test_connection',
        accessToken: 'short', // Too short
        adAccountId: 'act_123456789',
      }

      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid access token format')
    })

    it('should reject invalid ad account ID format', async () => {
      const requestBody = {
        type: 'test_connection',
        accessToken: 'valid_token_123456789012345',
        adAccountId: '123456789', // Missing act_ prefix
      }

      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid ad account ID format')
    })

    it('should handle OAuth errors from Meta API', async () => {
      const requestBody = {
        type: 'test_connection',
        accessToken: 'invalid_token_123456789012345',
        adAccountId: 'act_123456789',
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: {
            code: 190,
            message: 'Invalid OAuth access token',
          },
        }),
      } as Response)

      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid OAuth access token')
    })

    it('should handle invalid ad account ID from Meta API', async () => {
      const requestBody = {
        type: 'test_connection',
        accessToken: 'valid_token_123456789012345',
        adAccountId: 'act_999999999',
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: {
            code: 100,
            message: 'Invalid parameter',
          },
        }),
      } as Response)

      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid ad account ID')
    })
  })

  describe('Overview Request', () => {
    it('should successfully fetch campaigns overview', async () => {
      const { MetaAPIClient } = require('@/lib/meta-api-client')
      const { AdSetAndAdAPI } = require('@/lib/meta-api-adsets')

      const mockCampaigns = [
        {
          id: 'campaign_1',
          name: 'Test Campaign 1',
          insights: {
            data: [{
              spend: '100.50',
              impressions: '10000',
              clicks: '500',
              ctr: '5.0',
              cpc: '0.20',
              actions: [{ action_type: 'purchase', value: '10' }],
              action_values: [{ action_type: 'purchase', value: '1000.00' }],
            }],
          },
        },
      ]

      const mockAdSets = [
        { id: 'adset_1', name: 'Test AdSet 1' },
      ]

      const mockGetCampaigns = jest.fn().mockResolvedValue(mockCampaigns)
      const mockGetAdSetsForCampaign = jest.fn().mockResolvedValue(mockAdSets)

      MetaAPIClient.mockImplementation(() => ({
        getCampaigns: mockGetCampaigns,
      }))

      AdSetAndAdAPI.mockImplementation(() => ({
        getAdSetsForCampaign: mockGetAdSetsForCampaign,
      }))

      const requestBody = {
        type: 'overview',
        accessToken: 'valid_token_123456789012345',
        adAccountId: 'act_123456789',
        datePreset: 'last_30d',
      }

      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.campaigns).toHaveLength(1)
      expect(data.campaigns[0]).toMatchObject({
        id: 'campaign_1',
        name: 'Test Campaign 1',
        spend: 100.5,
        impressions: 10000,
        clicks: 500,
        conversions: 10,
        revenue: 1000,
        roas: expect.closeTo(9.95, 2), // 1000 / 100.5
        adsets: mockAdSets,
        adsets_count: 1,
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON in request body')
    })

    it('should handle missing required parameters', async () => {
      const requestBody = {
        // Missing type, accessToken, etc.
      }

      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required parameters')
    })

    it('should handle network timeouts', async () => {
      const requestBody = {
        type: 'test_connection',
        accessToken: 'valid_token_123456789012345',
        adAccountId: 'act_123456789',
      }

      // Mock a timeout error
      mockFetch.mockRejectedValueOnce(new Error('timeout'))

      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('timeout')
    })
  })

  describe('IP Address Extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const requestBody = {
        type: 'test_connection',
        accessToken: 'valid_token_123456789012345',
        adAccountId: 'act_123456789',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'act_123456789',
          name: 'Test Account',
          account_status: 1,
          currency: 'USD',
          timezone_name: 'America/New_York',
        }),
      } as Response)

      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
      // The function should use the first IP in the forwarded list
    })

    it('should extract IP from x-real-ip header when x-forwarded-for is not present', async () => {
      const requestBody = {
        type: 'test_connection',
        accessToken: 'valid_token_123456789012345',
        adAccountId: 'act_123456789',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'act_123456789',
          name: 'Test Account',
          account_status: 1,
          currency: 'USD',
          timezone_name: 'America/New_York',
        }),
      } as Response)

      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json',
          'x-real-ip': '192.168.1.1',
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })
  })
})

describe('/api/meta GET', () => {
  it('should return method not allowed for GET requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/meta')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(405)
    expect(data.error).toBe('Method not allowed. Use POST.')
  })
})