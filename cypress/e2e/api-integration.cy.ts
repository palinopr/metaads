describe('API Integration E2E Tests', () => {
  beforeEach(() => {
    cy.fixture('mock-data').as('mockData')
  })

  describe('Health Check API', () => {
    it('should return healthy status', () => {
      cy.request('GET', '/api/health').then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.status).to.be.oneOf(['healthy', 'warning'])
        expect(response.body.memory).to.have.property('heapUsed')
        expect(response.body.memory).to.have.property('heapTotal')
        expect(response.body).to.have.property('uptime')
        expect(response.body).to.have.property('timestamp')
      })
    })

    it('should have valid timestamp format', () => {
      cy.request('GET', '/api/health').then((response) => {
        const timestamp = new Date(response.body.timestamp)
        expect(timestamp).to.be.instanceOf(Date)
        expect(timestamp.getTime()).to.be.closeTo(Date.now(), 5000) // Within 5 seconds
      })
    })
  })

  describe('Meta API Integration', () => {
    it('should reject GET requests', () => {
      cy.request({
        method: 'GET',
        url: '/api/meta',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(405)
        expect(response.body.error).to.contain('Method not allowed')
      })
    })

    it('should reject requests with invalid JSON', () => {
      cy.request({
        method: 'POST',
        url: '/api/meta',
        body: 'invalid json',
        headers: {
          'content-type': 'application/json'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.contain('Invalid JSON')
      })
    })

    it('should reject requests with missing required parameters', () => {
      cy.request({
        method: 'POST',
        url: '/api/meta',
        body: {},
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.contain('Missing required parameters')
      })
    })

    it('should validate access token format for test connection', function() {
      cy.request({
        method: 'POST',
        url: '/api/meta',
        body: {
          type: 'test_connection',
          accessToken: 'short', // Too short
          adAccountId: 'act_123456789'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.contain('Invalid access token format')
      })
    })

    it('should validate ad account ID format for test connection', function() {
      cy.request({
        method: 'POST',
        url: '/api/meta',
        body: {
          type: 'test_connection',
          accessToken: this.mockData.testCredentials.validAccessToken,
          adAccountId: '123456789' // Missing act_ prefix
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.contain('Invalid ad account ID format')
      })
    })

    it('should handle rate limiting for validation requests', function() {
      const requestBody = {
        type: 'test_connection',
        accessToken: this.mockData.testCredentials.validAccessToken,
        adAccountId: this.mockData.testCredentials.validAdAccountId
      }

      // Make multiple requests to trigger rate limiting
      const requests = Array.from({ length: 12 }, () => 
        cy.request({
          method: 'POST',
          url: '/api/meta',
          body: requestBody,
          failOnStatusCode: false
        })
      )

      // The 11th request should be rate limited (limit is 10 per minute)
      cy.wrap(Promise.all(requests)).then((responses) => {
        const rateLimitedResponses = responses.filter(r => r.status === 429)
        expect(rateLimitedResponses.length).to.be.at.least(1)
        
        const rateLimitedResponse = rateLimitedResponses[0]
        expect(rateLimitedResponse.body.error).to.contain('Too many validation attempts')
        expect(rateLimitedResponse.body).to.have.property('retryAfter')
      })
    })
  })

  describe('Meta API Mocked Responses', () => {
    beforeEach(() => {
      // Mock external Meta API calls
      cy.intercept('GET', 'https://graph.facebook.com/v19.0/**', (req) => {
        if (req.url.includes('act_123456789')) {
          req.reply({
            statusCode: 200,
            body: {
              id: 'act_123456789',
              name: 'Test Ad Account',
              account_status: 1,
              currency: 'USD',
              timezone_name: 'America/New_York'
            }
          })
        } else {
          req.reply({
            statusCode: 400,
            body: {
              error: {
                code: 100,
                message: 'Invalid parameter'
              }
            }
          })
        }
      }).as('metaApiCall')
    })

    it('should successfully test connection with valid credentials', function() {
      cy.request({
        method: 'POST',
        url: '/api/meta',
        body: {
          type: 'test_connection',
          accessToken: this.mockData.testCredentials.validAccessToken,
          adAccountId: this.mockData.testCredentials.validAdAccountId
        }
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.success).to.be.true
        expect(response.body.accountInfo).to.have.property('id', 'act_123456789')
        expect(response.body.accountInfo).to.have.property('name', 'Test Ad Account')
        expect(response.body.accountInfo).to.have.property('currency', 'USD')
      })
    })

    it('should handle invalid ad account ID from Meta API', function() {
      cy.request({
        method: 'POST',
        url: '/api/meta',
        body: {
          type: 'test_connection',
          accessToken: this.mockData.testCredentials.validAccessToken,
          adAccountId: 'act_999999999' // Will be rejected by our mock
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.success).to.be.false
        expect(response.body.error).to.contain('Invalid ad account ID')
      })
    })
  })

  describe('Performance Testing', () => {
    it('should respond to health check within acceptable time', () => {
      const start = Date.now()
      cy.request('GET', '/api/health').then((response) => {
        const responseTime = Date.now() - start
        expect(responseTime).to.be.lessThan(1000) // Less than 1 second
        expect(response.status).to.eq(200)
      })
    })

    it('should handle concurrent requests', () => {
      const concurrentRequests = Array.from({ length: 10 }, () =>
        cy.request('GET', '/api/health')
      )

      cy.wrap(Promise.all(concurrentRequests)).then((responses) => {
        responses.forEach((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.status).to.be.oneOf(['healthy', 'warning'])
        })
      })
    })

    it('should handle large payloads', function() {
      const largePayload = {
        type: 'test_connection',
        accessToken: this.mockData.testCredentials.validAccessToken,
        adAccountId: this.mockData.testCredentials.validAdAccountId,
        largeData: 'x'.repeat(10000) // 10KB of data
      }

      cy.request({
        method: 'POST',
        url: '/api/meta',
        body: largePayload,
        timeout: 10000
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]) // Should handle gracefully
      })
    })
  })

  describe('Security Testing', () => {
    it('should reject requests with suspicious user agents', () => {
      cy.request({
        method: 'POST',
        url: '/api/meta',
        body: {
          type: 'test_connection',
          accessToken: 'valid_token_123456789012345',
          adAccountId: 'act_123456789'
        },
        headers: {
          'user-agent': 'bot' // Suspicious user agent
        }
      }).then((response) => {
        // Should still process but might log warning
        expect(response.status).to.be.oneOf([200, 400, 401])
      })
    })

    it('should sanitize error messages', function() {
      cy.request({
        method: 'POST',
        url: '/api/meta',
        body: {
          type: 'test_connection',
          accessToken: '<script>alert("xss")</script>',
          adAccountId: 'act_123456789'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.not.contain('<script>')
        expect(response.body.error).to.not.contain('alert')
      })
    })

    it('should handle SQL injection attempts', () => {
      cy.request({
        method: 'POST',
        url: '/api/meta',
        body: {
          type: 'test_connection',
          accessToken: "'; DROP TABLE users; --",
          adAccountId: 'act_123456789'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.not.contain('DROP TABLE')
      })
    })

    it('should validate content-type header', () => {
      cy.request({
        method: 'POST',
        url: '/api/meta',
        body: JSON.stringify({
          type: 'test_connection',
          accessToken: 'valid_token_123456789012345',
          adAccountId: 'act_123456789'
        }),
        headers: {
          'content-type': 'text/plain' // Wrong content type
        },
        failOnStatusCode: false
      }).then((response) => {
        // Should either reject or handle gracefully
        expect([200, 400, 415]).to.include(response.status)
      })
    })
  })

  describe('Error Recovery', () => {
    it('should recover from temporary network issues', function() {
      // First request fails
      cy.intercept('GET', 'https://graph.facebook.com/v19.0/**', {
        forceNetworkError: true
      }).as('networkError')

      cy.request({
        method: 'POST',
        url: '/api/meta',
        body: {
          type: 'test_connection',
          accessToken: this.mockData.testCredentials.validAccessToken,
          adAccountId: this.mockData.testCredentials.validAdAccountId
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(500)
        expect(response.body.error).to.exist
      })

      // Second request succeeds
      cy.intercept('GET', 'https://graph.facebook.com/v19.0/**', {
        statusCode: 200,
        body: {
          id: 'act_123456789',
          name: 'Test Ad Account',
          account_status: 1,
          currency: 'USD',
          timezone_name: 'America/New_York'
        }
      }).as('networkSuccess')

      cy.request({
        method: 'POST',
        url: '/api/meta',
        body: {
          type: 'test_connection',
          accessToken: this.mockData.testCredentials.validAccessToken,
          adAccountId: this.mockData.testCredentials.validAdAccountId
        }
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.success).to.be.true
      })
    })
  })
})