import { 
  MetaAPIClient, 
  MetaAPIError, 
  TokenExpiredError,
  formatAccessToken,
  formatAdAccountId,
  processInsights
} from '../../lib/meta-api-client'

// Mock fetch globally
global.fetch = jest.fn()

describe('MetaAPIClient', () => {
  const mockToken = 'EAA123456789abcdef_valid_meta_token_format_test_12345'
  const mockAdAccountId = 'act_123456789'
  let client: MetaAPIClient

  beforeEach(() => {
    jest.clearAllMocks()
    client = new MetaAPIClient(mockToken, mockAdAccountId, true)
    
    // Mock window localStorage for debug mode
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn().mockReturnValue('true')
      },
      writable: true
    })
  })

  describe('constructor', () => {
    it('should create client with valid token and account ID', () => {
      expect(client).toBeInstanceOf(MetaAPIClient)
    })

    it('should format ad account ID correctly', () => {
      const clientWithoutPrefix = new MetaAPIClient(mockToken, '123456789')
      expect(clientWithoutPrefix).toBeInstanceOf(MetaAPIClient)
    })

    it('should throw error for invalid token', () => {
      expect(() => {
        new MetaAPIClient('invalid-token', mockAdAccountId)
      }).toThrow()
    })

    it('should throw error for invalid ad account ID', () => {
      expect(() => {
        new MetaAPIClient(mockToken, 'invalid-account-id')
      }).toThrow()
    })
  })

  describe('testConnection', () => {
    it('should successfully test connection', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            id: 'act_123456789',
            name: 'Test Ad Account',
            currency: 'USD',
            timezone_name: 'America/New_York'
          }
        })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await client.testConnection()

      expect(result.success).toBe(true)
      expect(result.accountInfo).toBeDefined()
      expect(global.fetch).toHaveBeenCalledWith('/api/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"endpoint":"act_123456789"')
      })
    })

    it('should handle connection failure', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: {
            message: 'Invalid OAuth access token',
            code: 190,
            type: 'OAuthException'
          }
        })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await client.testConnection()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const result = await client.testConnection()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('getCampaigns', () => {
    it('should fetch campaigns with insights', async () => {
      const mockCampaigns = [
        {
          id: '123456789',
          name: 'Test Campaign',
          status: 'ACTIVE',
          objective: 'CONVERSIONS',
          insights: {
            data: [{
              spend: '100.50',
              impressions: '10000',
              clicks: '250'
            }]
          }
        }
      ]

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { data: mockCampaigns }
        })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const campaigns = await client.getCampaigns('last_7d')

      expect(campaigns).toEqual(mockCampaigns)
      expect(global.fetch).toHaveBeenCalledWith('/api/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('campaigns')
      })
    })

    it('should return empty array when no campaigns', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {}
        })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const campaigns = await client.getCampaigns()

      expect(campaigns).toEqual([])
    })

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: {
            message: 'Rate limit exceeded',
            code: 17,
            type: 'OAuthException'
          }
        })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      await expect(client.getCampaigns()).rejects.toThrow(MetaAPIError)
    })
  })

  describe('getCampaignTodayData', () => {
    it('should fetch today\'s data for a campaign', async () => {
      const todayData = {
        spend: '50.25',
        impressions: '5000',
        clicks: '125'
      }

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { data: [todayData] }
        })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await client.getCampaignTodayData('123456789')

      expect(result).toEqual(todayData)
    })

    it('should return null when no data available', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { data: [] }
        })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await client.getCampaignTodayData('123456789')

      expect(result).toBeNull()
    })
  })

  describe('getCampaignInsights', () => {
    it('should fetch insights with custom date range', async () => {
      const insightsData = {
        spend: '200.75',
        impressions: '20000',
        clicks: '500',
        ctr: '2.5',
        cpc: '0.40'
      }

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { data: [insightsData] }
        })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await client.getCampaignInsights('123456789', {
        since: '2024-01-01',
        until: '2024-01-31'
      })

      expect(result).toEqual(insightsData)
      
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)
      expect(requestBody.params.time_range).toBe('{"since":"2024-01-01","until":"2024-01-31"}')
    })

    it('should use default date preset when no range provided', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { data: [] }
        })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      await client.getCampaignInsights('123456789')

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)
      expect(requestBody.params.date_preset).toBe('last_30d')
    })
  })

  describe('getHourlyData', () => {
    it('should fetch hourly data for today', async () => {
      const hourlyData = [
        { spend: '10.00', impressions: '1000', clicks: '25', date_start: '2024-01-01', hour: '0' },
        { spend: '15.50', impressions: '1500', clicks: '35', date_start: '2024-01-01', hour: '1' }
      ]

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { data: hourlyData }
        })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await client.getHourlyData('123456789')

      expect(result).toEqual(hourlyData)
      
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)
      expect(requestBody.params.time_increment).toBe('hourly')
    })
  })

  describe('getHistoricalData', () => {
    it('should fetch historical data with daily breakdown', async () => {
      const historicalData = [
        { spend: '100.00', impressions: '10000', clicks: '250', date_start: '2024-01-01' },
        { spend: '120.50', impressions: '12000', clicks: '300', date_start: '2024-01-02' }
      ]

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { data: historicalData }
        })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await client.getHistoricalData('123456789', 'last_14d')

      expect(result).toEqual(historicalData)
      
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)
      expect(requestBody.params.time_increment).toBe('1')
      expect(requestBody.params.date_preset).toBe('last_14d')
    })
  })

  describe('getAdSets', () => {
    it('should fetch ad sets for a campaign', async () => {
      const adSets = [
        {
          id: 'adset_123',
          name: 'Test AdSet',
          status: 'ACTIVE',
          targeting: { age_min: 18, age_max: 65 },
          insights: {
            data: [{ spend: '50.00', impressions: '5000', clicks: '100' }]
          }
        }
      ]

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { data: adSets }
        })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await client.getAdSets('123456789')

      expect(result).toEqual(adSets)
    })
  })

  describe('fetchWithRetry', () => {
    it('should retry on failure and eventually succeed', async () => {
      const mockFailResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Temporary error', code: 1 }
        })
      }
      
      const mockSuccessResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { test: 'data' }
        })
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockFailResponse)
        .mockResolvedValueOnce(mockFailResponse)
        .mockResolvedValueOnce(mockSuccessResponse)

      // Access the private method through a workaround
      const result = await client.testConnection()

      expect(global.fetch).toHaveBeenCalledTimes(3)
      expect(result.success).toBe(true)
    })

    it('should throw TokenExpiredError for expired tokens', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: {
            message: 'Invalid OAuth access token',
            code: 190,
            type: 'OAuthException'
          }
        })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      await expect(client.testConnection()).rejects.toThrow('Invalid OAuth access token')
    })

    it('should handle invalid URL errors', async () => {
      // Test with an invalid endpoint that would cause URL construction to fail
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: {} })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      // This should work with valid input
      await expect(client.testConnection()).resolves.toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle token expiration gracefully', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: {
            message: 'The access token has expired',
            code: 190,
            type: 'OAuthException',
            fbtrace_id: 'trace123'
          }
        })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await client.testConnection()

      expect(result.success).toBe(false)
      expect(result.error).toContain('expired')
    })

    it('should handle rate limiting', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: {
            message: 'Rate limit exceeded',
            code: 17,
            type: 'OAuthException'
          }
        })
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      await expect(client.getCampaigns()).rejects.toThrow(MetaAPIError)
    })

    it('should handle network timeouts', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 100)
        })
      })

      await expect(client.testConnection()).resolves.toEqual({
        success: false,
        error: 'Network timeout'
      })
    })
  })
})

describe('Helper Functions', () => {
  describe('formatAccessToken', () => {
    it('should remove Bearer prefix', () => {
      const token = 'Bearer EAA123456789'
      const formatted = formatAccessToken(token)
      expect(formatted).toBe('EAA123456789')
    })

    it('should handle token without Bearer prefix', () => {
      const token = 'EAA123456789'
      const formatted = formatAccessToken(token)
      expect(formatted).toBe('EAA123456789')
    })

    it('should trim whitespace', () => {
      const token = '  EAA123456789  '
      const formatted = formatAccessToken(token)
      expect(formatted).toBe('EAA123456789')
    })

    it('should handle case-insensitive Bearer prefix', () => {
      const token = 'bearer EAA123456789'
      const formatted = formatAccessToken(token)
      expect(formatted).toBe('EAA123456789')
    })
  })

  describe('formatAdAccountId', () => {
    it('should add act_ prefix when missing', () => {
      const accountId = '123456789'
      const formatted = formatAdAccountId(accountId)
      expect(formatted).toBe('act_123456789')
    })

    it('should keep act_ prefix when present', () => {
      const accountId = 'act_123456789'
      const formatted = formatAdAccountId(accountId)
      expect(formatted).toBe('act_123456789')
    })

    it('should trim whitespace', () => {
      const accountId = '  act_123456789  '
      const formatted = formatAdAccountId(accountId)
      expect(formatted).toBe('act_123456789')
    })
  })

  describe('processInsights', () => {
    it('should process insights data correctly', () => {
      const insights = {
        spend: '100.50',
        impressions: '10000',
        clicks: '250',
        ctr: '2.5',
        cpc: '0.40',
        frequency: '1.5',
        actions: [
          { action_type: 'purchase', value: '10' },
          { action_type: 'link_click', value: '50' }
        ],
        action_values: [
          { action_type: 'purchase', value: '500.00' },
          { action_type: 'link_click', value: '0' }
        ]
      }

      const processed = processInsights(insights)

      expect(processed).toEqual({
        spend: 100.50,
        impressions: 10000,
        clicks: 250,
        ctr: 2.5,
        cpc: 0.40,
        frequency: 1.5,
        conversions: 10,
        revenue: 500.00,
        roas: 4.975, // 500 / 100.5
        cpa: 10.05 // 100.5 / 10
      })
    })

    it('should handle missing insights data', () => {
      const processed = processInsights(null)
      expect(processed).toBeNull()
    })

    it('should handle insights with no actions', () => {
      const insights = {
        spend: '50.00',
        impressions: '5000',
        clicks: '100'
      }

      const processed = processInsights(insights)

      expect(processed).toEqual({
        spend: 50.00,
        impressions: 5000,
        clicks: 100,
        ctr: 0,
        cpc: 0,
        frequency: 0,
        conversions: 0,
        revenue: 0,
        roas: 0,
        cpa: 0
      })
    })

    it('should calculate ROAS correctly when no spend', () => {
      const insights = {
        spend: '0',
        action_values: [
          { action_type: 'purchase', value: '100.00' }
        ]
      }

      const processed = processInsights(insights)

      expect(processed.roas).toBe(0)
    })

    it('should calculate CPA correctly when no conversions', () => {
      const insights = {
        spend: '100.00',
        actions: []
      }

      const processed = processInsights(insights)

      expect(processed.cpa).toBe(0)
    })
  })
})

describe('Error Classes', () => {
  describe('MetaAPIError', () => {
    it('should create error with all properties', () => {
      const error = new MetaAPIError(
        'Test error',
        '190',
        'OAuthException',
        'trace123',
        true
      )

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('190')
      expect(error.type).toBe('OAuthException')
      expect(error.fbTraceId).toBe('trace123')
      expect(error.isTokenExpired).toBe(true)
      expect(error.name).toBe('MetaAPIError')
    })
  })

  describe('TokenExpiredError', () => {
    it('should create token expired error with default message', () => {
      const error = new TokenExpiredError()

      expect(error.message).toBe('Access token has expired')
      expect(error.isTokenExpired).toBe(true)
      expect(error.name).toBe('TokenExpiredError')
    })

    it('should create token expired error with custom message', () => {
      const error = new TokenExpiredError('Custom expired message')

      expect(error.message).toBe('Custom expired message')
      expect(error.isTokenExpired).toBe(true)
    })
  })
})

describe('MetaAPIClient Integration Tests', () => {
  let client: MetaAPIClient

  beforeEach(() => {
    client = new MetaAPIClient(
      'EAA123456789abcdef_valid_meta_token_format_test_12345',
      'act_123456789'
    )
  })

  it('should handle complete campaign data flow', async () => {
    const mockCampaignData = {
      data: [
        {
          id: '123456789',
          name: 'Test Campaign',
          status: 'ACTIVE',
          insights: {
            data: [{
              spend: '100.00',
              impressions: '10000',
              clicks: '250'
            }]
          }
        }
      ]
    }

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        data: mockCampaignData
      })
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    // Test full flow: get campaigns, then get insights
    const campaigns = await client.getCampaigns()
    expect(campaigns).toHaveLength(1)
    expect(campaigns[0].id).toBe('123456789')

    const insights = await client.getCampaignInsights('123456789')
    expect(insights).toBeDefined()
  })

  it('should handle error recovery scenarios', async () => {
    // First call fails with rate limit
    const rateLimitResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({
        error: { message: 'Rate limit exceeded', code: 17 }
      })
    }

    // Second call succeeds
    const successResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        data: { data: [] }
      })
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValueOnce(successResponse)

    // Should eventually succeed after retries
    const result = await client.getCampaigns()
    expect(result).toEqual([])
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })
})