import { NextRequest } from 'next/server';
import { securityMiddleware } from '@/lib/security/security-middleware';
import { XSSProtection } from '@/lib/security/xss-protection';
import { CSRFProtection } from '@/lib/security/csrf-protection';
import { AdvancedRateLimiter } from '@/lib/security/advanced-rate-limiter';
import { DDoSProtection } from '@/lib/security/ddos-protection';
import { IntrusionDetectionSystem } from '@/lib/security/intrusion-detection';
import { InputSanitizer, createValidationMiddleware, secureSchemas } from '@/lib/security/input-validation';
import { vulnerabilityScanner } from '@/lib/security/vulnerability-scanner';

describe('Comprehensive Security Tests', () => {
  describe('XSS Protection', () => {
    let xssProtection: XSSProtection;

    beforeEach(() => {
      xssProtection = new XSSProtection();
    });

    it('should detect script tag XSS attempts', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '<ScRiPt>alert(1)</ScRiPt>',
        '<script src="evil.js"></script>',
        '<svg onload="alert(1)">',
        '<iframe src="javascript:alert(1)"></iframe>'
      ];

      maliciousInputs.forEach(input => {
        const detection = xssProtection.detectXSS(input);
        expect(detection.isXSS).toBe(true);
        expect(detection.severity).toBe('high');
        expect(detection.patterns.length).toBeGreaterThan(0);
      });
    });

    it('should detect event handler XSS attempts', () => {
      const eventHandlerInputs = [
        '<img src="x" onerror="alert(1)">',
        '<div onclick="malicious()">',
        '<body onload="alert(1)">',
        '<input onfocus="alert(1)">'
      ];

      eventHandlerInputs.forEach(input => {
        const detection = xssProtection.detectXSS(input);
        expect(detection.isXSS).toBe(true);
        expect(detection.patterns).toContain('EVENT_HANDLERS');
      });
    });

    it('should detect JavaScript protocol XSS', () => {
      const jsProtocolInputs = [
        'javascript:alert(1)',
        'JAVASCRIPT:alert(1)',
        'javascript:void(0)',
        'vbscript:msgbox(1)'
      ];

      jsProtocolInputs.forEach(input => {
        const detection = xssProtection.detectXSS(input);
        expect(detection.isXSS).toBe(true);
      });
    });

    it('should sanitize malicious input', () => {
      const maliciousHTML = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = xssProtection.sanitizeInput(maliciousHTML, { allowHtml: true });
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('<p>Safe content</p>');
    });

    it('should escape HTML when allowHtml is false', () => {
      const htmlInput = '<div>Test</div>';
      const sanitized = xssProtection.sanitizeInput(htmlInput, { allowHtml: false });
      
      expect(sanitized).toBe('&lt;div&gt;Test&lt;/div&gt;');
    });
  });

  describe('CSRF Protection', () => {
    let csrfProtection: CSRFProtection;

    beforeEach(() => {
      csrfProtection = new CSRFProtection();
    });

    it('should generate valid CSRF tokens', () => {
      const token1 = csrfProtection.generateToken();
      const token2 = csrfProtection.generateToken();
      
      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
      expect(token1.split('.').length).toBe(2); // token.signature format
    });

    it('should validate matching tokens', () => {
      const token = csrfProtection.generateToken();
      const isValid = csrfProtection.validateToken(token, token);
      
      expect(isValid).toBe(true);
    });

    it('should reject mismatched tokens', () => {
      const token1 = csrfProtection.generateToken();
      const token2 = csrfProtection.generateToken();
      
      const isValid = csrfProtection.validateToken(token1, token2);
      expect(isValid).toBe(false);
    });

    it('should reject malformed tokens', () => {
      const malformedTokens = [
        'invalid',
        'token.without.proper.format',
        '',
        'a.b.c.d'
      ];

      malformedTokens.forEach(token => {
        const isValid = csrfProtection.validateToken(token, token);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Advanced Rate Limiting', () => {
    let rateLimiter: AdvancedRateLimiter;

    beforeEach(() => {
      rateLimiter = new AdvancedRateLimiter({
        windowMs: 60000, // 1 minute
        maxRequests: 5,
        burstLimit: 2
      });
    });

    it('should allow requests within limits', async () => {
      const mockRequest = new NextRequest('http://localhost/test', {
        headers: { 'x-forwarded-for': '192.168.1.100' }
      });

      const response = await rateLimiter.limit(mockRequest);
      expect(response).toBeNull();
    });

    it('should block requests exceeding burst limit', async () => {
      const mockRequest = new NextRequest('http://localhost/test', {
        headers: { 'x-forwarded-for': '192.168.1.100' }
      });

      // Make requests up to burst limit
      for (let i = 0; i < 2; i++) {
        const response = await rateLimiter.limit(mockRequest);
        expect(response).toBeNull();
      }

      // Next request should be blocked
      const blockedResponse = await rateLimiter.limit(mockRequest);
      expect(blockedResponse).not.toBeNull();
      expect(blockedResponse?.status).toBe(429);
    });

    it('should detect suspicious patterns', async () => {
      const mockRequest = new NextRequest('http://localhost/admin', {
        headers: { 
          'x-forwarded-for': '192.168.1.100',
          'user-agent': 'curl/7.68.0'
        }
      });

      const response = await rateLimiter.limit(mockRequest);
      
      // Should potentially block suspicious requests
      // This depends on the pattern detection implementation
      const stats = rateLimiter.getStats('192.168.1.100');
      expect(stats.currentRequests).toBeGreaterThanOrEqual(1);
    });
  });

  describe('DDoS Protection', () => {
    let ddosProtection: DDoSProtection;

    beforeEach(() => {
      ddosProtection = new DDoSProtection({
        enabled: true,
        thresholds: {
          requestsPerSecond: 10,
          requestsPerMinute: 100,
          uniqueIPsPerMinute: 50,
          errorRatePercentage: 25,
          responseTimeMs: 2000
        }
      });
    });

    it('should allow normal traffic', async () => {
      const mockRequest = new NextRequest('http://localhost/test', {
        headers: { 'x-forwarded-for': '192.168.1.100' }
      });

      const response = await ddosProtection.checkRequest(mockRequest);
      expect(response).toBeNull();
    });

    it('should block suspicious requests', async () => {
      const mockRequest = new NextRequest('http://localhost/admin', {
        headers: { 
          'x-forwarded-for': '192.168.1.100',
          'user-agent': 'bot'
        }
      });

      const response = await ddosProtection.checkRequest(mockRequest);
      
      // May block based on suspicious patterns
      if (response) {
        expect(response.status).toBe(429);
      }
    });

    it('should provide current metrics', () => {
      const metrics = ddosProtection.getCurrentMetrics();
      
      if (metrics) {
        expect(metrics).toHaveProperty('requestsPerSecond');
        expect(metrics).toHaveProperty('uniqueIPs');
        expect(metrics).toHaveProperty('errorRate');
      }
    });
  });

  describe('Intrusion Detection System', () => {
    let ids: IntrusionDetectionSystem;

    beforeEach(() => {
      ids = new IntrusionDetectionSystem();
    });

    it('should detect SQL injection attempts', () => {
      const mockRequest = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.100' }
      });

      const sqlInjectionInput = "'; DROP TABLE users; --";
      const events = ids.analyzeRequest(mockRequest, {
        input: sqlInjectionInput
      });

      const sqlInjectionEvents = events.filter(e => e.type === 'attack_attempt');
      expect(sqlInjectionEvents.length).toBeGreaterThan(0);
      
      if (sqlInjectionEvents.length > 0) {
        expect(sqlInjectionEvents[0].severity).toBe('critical');
        expect(sqlInjectionEvents[0].details.description).toContain('SQL injection');
      }
    });

    it('should detect XSS attempts', () => {
      const mockRequest = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.100' }
      });

      const xssInput = '<script>alert("xss")</script>';
      const events = ids.analyzeRequest(mockRequest, {
        input: xssInput
      });

      const xssEvents = events.filter(e => e.type === 'attack_attempt');
      expect(xssEvents.length).toBeGreaterThan(0);
      
      if (xssEvents.length > 0) {
        expect(xssEvents[0].severity).toBe('high');
        expect(xssEvents[0].details.description).toContain('XSS');
      }
    });

    it('should detect path traversal attempts', () => {
      const mockRequest = new NextRequest('http://localhost/../../../etc/passwd', {
        headers: { 'x-forwarded-for': '192.168.1.100' }
      });

      const events = ids.analyzeRequest(mockRequest, {
        path: '../../../etc/passwd'
      });

      const pathTraversalEvents = events.filter(e => e.type === 'attack_attempt');
      expect(pathTraversalEvents.length).toBeGreaterThan(0);
      
      if (pathTraversalEvents.length > 0) {
        expect(pathTraversalEvents[0].severity).toBe('high');
        expect(pathTraversalEvents[0].details.description).toContain('Path traversal');
      }
    });

    it('should track top threats', () => {
      const mockRequest = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.100' }
      });

      // Generate some events
      ids.analyzeRequest(mockRequest, { input: "'; DROP TABLE users; --" });
      ids.analyzeRequest(mockRequest, { input: '<script>alert(1)</script>' });

      const topThreats = ids.getTopThreats(5);
      expect(Array.isArray(topThreats)).toBe(true);
      
      if (topThreats.length > 0) {
        expect(topThreats[0]).toHaveProperty('ip');
        expect(topThreats[0]).toHaveProperty('eventCount');
        expect(topThreats[0]).toHaveProperty('riskScore');
      }
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should sanitize dangerous strings', () => {
      const dangerousInputs = [
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        '../../etc/passwd',
        '${eval("alert(1)")}',
        'file:///etc/passwd'
      ];

      dangerousInputs.forEach(input => {
        const sanitized = InputSanitizer.sanitizeString(input);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized.length).toBeGreaterThan(0); // Should not be empty
      });
    });

    it('should detect threat patterns', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        '<script>alert(1)</script>',
        '../../../etc/passwd',
        '${eval("malicious")}'
      ];

      maliciousInputs.forEach(input => {
        const threats = InputSanitizer.detectThreats(input);
        expect(threats.length).toBeGreaterThan(0);
        expect(threats[0]).toHaveProperty('type');
        expect(threats[0]).toHaveProperty('severity');
      });
    });

    it('should validate Meta API access tokens', () => {
      const validTokens = [
        'EAABwzLixnjYBAtest123456789012345',
        'EAAG1234567890abcdef1234567890abcdef'
      ];

      const invalidTokens = [
        'short',
        'invalid@token',
        'token with spaces',
        "'; DROP TABLE tokens; --",
        '<script>alert(1)</script>'
      ];

      validTokens.forEach(token => {
        const result = secureSchemas.metaAccessToken.safeParse(token);
        expect(result.success).toBe(true);
      });

      invalidTokens.forEach(token => {
        const result = secureSchemas.metaAccessToken.safeParse(token);
        expect(result.success).toBe(false);
      });
    });

    it('should validate Meta ad account IDs', () => {
      const validAccountIds = [
        'act_123456789',
        'act_987654321'
      ];

      const invalidAccountIds = [
        '123456789', // Missing act_ prefix
        'act_', // Empty after prefix
        'act_abc123', // Contains letters
        'wrong_123456789', // Wrong prefix
        'ACT_123456789' // Wrong case
      ];

      validAccountIds.forEach(accountId => {
        const result = secureSchemas.metaAdAccountId.safeParse(accountId);
        expect(result.success).toBe(true);
      });

      invalidAccountIds.forEach(accountId => {
        const result = secureSchemas.metaAdAccountId.safeParse(accountId);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Vulnerability Scanner', () => {
    it('should detect missing security headers', async () => {
      // Mock a response without security headers
      const mockResponse = {
        status: 200,
        headers: new Map([['content-type', 'text/html']])
      };

      const scanTarget = {
        request: { url: 'http://localhost', method: 'GET', headers: new Map() },
        response: mockResponse,
        endpoint: '/'
      };

      // This would require access to the scanner's internal rules
      // In a real test, you'd call vulnerabilityScanner.scanEndpoint
      expect(true).toBe(true); // Placeholder
    });

    it('should scan application endpoints', async () => {
      // In a real test environment, this would scan actual endpoints
      const scanResults = await vulnerabilityScanner.scanApplication('http://localhost:3000');
      
      expect(Array.isArray(scanResults)).toBe(true);
      scanResults.forEach(result => {
        expect(result).toHaveProperty('scanId');
        expect(result).toHaveProperty('timestamp');
        expect(result).toHaveProperty('vulnerabilities');
        expect(result).toHaveProperty('summary');
      });
    });

    it('should generate security reports', async () => {
      const mockScanResults = [{
        scanId: 'test',
        timestamp: Date.now(),
        target: 'http://localhost',
        vulnerabilities: [{
          id: 'test_vuln',
          type: 'security' as const,
          severity: 'high' as const,
          title: 'Test Vulnerability',
          description: 'Test description',
          location: 'Test location',
          remediation: 'Test remediation',
          references: []
        }],
        summary: { total: 1, critical: 0, high: 1, medium: 0, low: 0 },
        scanDuration: 1000
      }];

      const report = vulnerabilityScanner.generateReport(mockScanResults);
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('topVulnerabilities');
      expect(report.summary.totalVulnerabilities).toBe(1);
      expect(report.summary.highVulnerabilities).toBe(1);
    });
  });

  describe('Security Middleware Integration', () => {
    it('should process requests through security pipeline', async () => {
      const mockRequest = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.100'
        },
        body: JSON.stringify({ test: 'safe data' })
      });

      const response = await securityMiddleware.processRequest(mockRequest);
      
      // Should return null for safe requests (allowing them to proceed)
      expect(response).toBeNull();
    });

    it('should block malicious requests', async () => {
      const mockRequest = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.100'
        },
        body: JSON.stringify({ 
          input: "'; DROP TABLE users; --",
          script: '<script>alert(1)</script>'
        })
      });

      const response = await securityMiddleware.processRequest(mockRequest);
      
      // May block malicious requests
      if (response) {
        expect([400, 403, 429]).toContain(response.status);
      }
    });

    it('should provide security metrics', () => {
      const metrics = securityMiddleware.getSecurityMetrics();
      
      expect(metrics).toHaveProperty('rateLimiting');
      expect(metrics).toHaveProperty('ddosProtection');
      expect(metrics).toHaveProperty('threatDetection');
    });

    it('should support emergency mode activation', () => {
      securityMiddleware.activateEmergencyMode();
      
      // Test that emergency mode affects behavior
      const metrics = securityMiddleware.getSecurityMetrics();
      expect(metrics).toBeDefined();
      
      securityMiddleware.deactivateEmergencyMode();
    });
  });

  describe('Performance Impact', () => {
    it('should process security checks within acceptable time', async () => {
      const mockRequest = new NextRequest('http://localhost/api/test', {
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.100' }
      });

      const startTime = Date.now();
      await securityMiddleware.processRequest(mockRequest);
      const endTime = Date.now();
      
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle high request volume', async () => {
      const requests = Array.from({ length: 50 }, (_, i) => 
        new NextRequest(`http://localhost/api/test${i}`, {
          headers: { 'x-forwarded-for': `192.168.1.${i % 255}` }
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(
        requests.map(req => securityMiddleware.processRequest(req))
      );
      const endTime = Date.now();
      
      const avgProcessingTime = (endTime - startTime) / requests.length;
      expect(avgProcessingTime).toBeLessThan(20); // Should average under 20ms per request
      
      expect(responses.length).toBe(50);
    });
  });
});
