import { NextRequest, NextResponse } from 'next/server';
import { EnhancedCSPBuilder, getSecurityHeaders } from './enhanced-csp';
import { CSRFProtection } from './csrf-protection';
import { XSSProtection } from './xss-protection';
import { AdvancedRateLimiter, rateLimiters } from './advanced-rate-limiter';
import { DDoSProtection } from './ddos-protection';
import { IntrusionDetectionSystem } from './intrusion-detection';
import { createValidationMiddleware, InputSanitizer } from './input-validation';

export interface SecurityConfig {
  csp: {
    enabled: boolean;
    strictMode: boolean;
    reportUri?: string;
  };
  csrf: {
    enabled: boolean;
    strictSameSite: boolean;
  };
  xss: {
    enabled: boolean;
    blockMode: boolean;
  };
  rateLimit: {
    enabled: boolean;
    profile: 'strict' | 'standard' | 'relaxed';
  };
  ddos: {
    enabled: boolean;
    emergencyMode: boolean;
  };
  ids: {
    enabled: boolean;
    threatIntelligence: boolean;
    behaviorAnalysis: boolean;
  };
  validation: {
    enabled: boolean;
    sanitizeInput: boolean;
    blockMalicious: boolean;
  };
  logging: {
    enabled: boolean;
    level: 'info' | 'warn' | 'error';
    includeHeaders: boolean;
  };
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  csp: {
    enabled: true,
    strictMode: true,
    reportUri: '/api/security/csp-report'
  },
  csrf: {
    enabled: true,
    strictSameSite: true
  },
  xss: {
    enabled: true,
    blockMode: true
  },
  rateLimit: {
    enabled: true,
    profile: 'standard'
  },
  ddos: {
    enabled: true,
    emergencyMode: false
  },
  ids: {
    enabled: true,
    threatIntelligence: true,
    behaviorAnalysis: true
  },
  validation: {
    enabled: true,
    sanitizeInput: true,
    blockMalicious: true
  },
  logging: {
    enabled: true,
    level: 'warn',
    includeHeaders: false
  }
};

export class SecurityMiddleware {
  private config: SecurityConfig;
  private cspBuilder: EnhancedCSPBuilder;
  private csrfProtection: CSRFProtection;
  private xssProtection: XSSProtection;
  private rateLimiter: AdvancedRateLimiter;
  private ddosProtection: DDoSProtection;
  private ids: IntrusionDetectionSystem;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
    
    // Initialize security components
    this.cspBuilder = new EnhancedCSPBuilder({
      development: process.env.NODE_ENV !== 'production',
      enableReporting: this.config.csp.enabled,
      reportUri: this.config.csp.reportUri
    });
    
    this.csrfProtection = new CSRFProtection({
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: this.config.csrf.strictSameSite ? 'strict' : 'lax',
        maxAge: 60 * 60 * 24 // 24 hours
      }
    });
    
    this.xssProtection = new XSSProtection({
      enabled: this.config.xss.enabled,
      blockMode: this.config.xss.blockMode,
      strictMode: true,
      sanitizeInput: true,
      sanitizeOutput: true
    });
    
    // Select rate limiter based on profile
    this.rateLimiter = this.getRateLimiterByProfile(this.config.rateLimit.profile);
    
    this.ddosProtection = new DDoSProtection({
      enabled: this.config.ddos.enabled,
      thresholds: {
        requestsPerSecond: this.config.ddos.emergencyMode ? 50 : 100,
        requestsPerMinute: this.config.ddos.emergencyMode ? 1500 : 3000,
        uniqueIPsPerMinute: 500,
        errorRatePercentage: 50,
        responseTimeMs: 5000
      }
    });
    
    this.ids = new IntrusionDetectionSystem({
      enabled: this.config.ids.enabled,
      threatIntelligence: {
        enabled: this.config.ids.threatIntelligence,
        sources: [],
        updateInterval: 24 * 60 * 60 * 1000
      },
      behaviorAnalysis: {
        enabled: this.config.ids.behaviorAnalysis,
        learningPeriod: 7 * 24 * 60 * 60 * 1000,
        sensitivityLevel: 'medium'
      }
    });
  }

  private getRateLimiterByProfile(profile: string): AdvancedRateLimiter {
    switch (profile) {
      case 'strict': return rateLimiters.auth;
      case 'relaxed': return rateLimiters.static;
      default: return rateLimiters.api;
    }
  }

  async processRequest(request: NextRequest): Promise<NextResponse | null> {
    const startTime = Date.now();
    const ip = this.getClientIP(request);
    const path = request.nextUrl.pathname;
    const method = request.method;
    const userAgent = request.headers.get('user-agent') || '';
    
    try {
      // 1. DDoS Protection (highest priority)
      if (this.config.ddos.enabled) {
        const ddosResponse = await this.ddosProtection.checkRequest(request);
        if (ddosResponse) {
          this.logSecurityEvent('ddos_block', { ip, path, method });
          return ddosResponse;
        }
      }
      
      // 2. Rate Limiting
      if (this.config.rateLimit.enabled) {
        const rateLimitResponse = await this.rateLimiter.limit(request);
        if (rateLimitResponse) {
          this.logSecurityEvent('rate_limit', { ip, path, method });
          return rateLimitResponse;
        }
      }
      
      // 3. Intrusion Detection
      if (this.config.ids.enabled) {
        const securityEvents = this.ids.analyzeRequest(request);
        const criticalEvents = securityEvents.filter(e => 
          e.severity === 'critical' && e.mitigation?.action === 'block'
        );
        
        if (criticalEvents.length > 0) {
          this.logSecurityEvent('ids_block', { 
            ip, 
            path, 
            method, 
            events: criticalEvents.map(e => e.type) 
          });
          return NextResponse.json(
            {
              error: 'Request blocked by security policy',
              code: 'SECURITY_BLOCKED'
            },
            { status: 403 }
          );
        }
      }
      
      // 4. XSS Protection
      if (this.config.xss.enabled) {
        const xssMiddleware = this.xssProtection.createMiddleware();
        const xssResponse = await xssMiddleware(request);
        if (xssResponse) {
          this.logSecurityEvent('xss_block', { ip, path, method });
          return xssResponse;
        }
      }
      
      // 5. Input Validation (for POST/PUT/PATCH requests)
      if (this.config.validation.enabled && ['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          const body = await request.clone().text();
          if (body) {
            const threats = InputSanitizer.detectThreats(body);
            const highSeverityThreats = threats.filter(t => t.severity === 'high');
            
            if (highSeverityThreats.length > 0 && this.config.validation.blockMalicious) {
              this.logSecurityEvent('input_validation_block', { 
                ip, 
                path, 
                method, 
                threats: highSeverityThreats.map(t => t.type) 
              });
              return NextResponse.json(
                {
                  error: 'Request contains potentially malicious content',
                  code: 'INPUT_VALIDATION_FAILED'
                },
                { status: 400 }
              );
            }
          }
        } catch (error) {
          // Unable to read body, continue
        }
      }
      
      return null; // Allow request to continue
      
    } catch (error) {
      console.error('Security middleware error:', error);
      return null; // Fail open for availability
    }
  }

  createSecureResponse(response: NextResponse, request: NextRequest): NextResponse {
    // Apply security headers
    const securityHeaders = getSecurityHeaders({
      development: process.env.NODE_ENV !== 'production',
      enableReporting: this.config.csp.enabled,
      reportUri: this.config.csp.reportUri
    });
    
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Add CSRF token for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method) && this.config.csrf.enabled) {
      const token = this.csrfProtection.generateToken();
      this.csrfProtection.setTokenCookie(response, token);
      response.headers.set('X-CSRF-Token', token);
    }
    
    // Add rate limit headers
    if (this.config.rateLimit.enabled) {
      const ip = this.getClientIP(request);
      const stats = this.rateLimiter.getStats(ip);
      response.headers.set('X-RateLimit-Remaining', String(stats.currentRequests));
    }
    
    return response;
  }

  validateCSRFToken(request: NextRequest): boolean {
    if (!this.config.csrf.enabled) return true;
    
    // Skip CSRF check for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }
    
    const requestToken = this.csrfProtection.getTokenFromRequest(request);
    const cookieToken = this.csrfProtection.getCookieToken(request);
    
    return this.csrfProtection.validateToken(requestToken || '', cookieToken || '');
  }

  sanitizeInput(input: any): any {
    if (!this.config.validation.sanitizeInput) return input;
    
    if (typeof input === 'string') {
      return InputSanitizer.sanitizeString(input);
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      Object.keys(input).forEach(key => {
        sanitized[key] = this.sanitizeInput(input[key]);
      });
      return sanitized;
    }
    
    return input;
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const real = request.headers.get('x-real-ip');
    const cloudflare = request.headers.get('cf-connecting-ip');
    
    return forwarded?.split(',')[0] || real || cloudflare || 'unknown';
  }

  private logSecurityEvent(type: string, data: any): void {
    if (!this.config.logging.enabled) return;
    
    const logLevel = this.config.logging.level;
    const logData = {
      timestamp: new Date().toISOString(),
      type,
      ...data
    };
    
    switch (logLevel) {
      case 'info':
        console.info('Security Event:', logData);
        break;
      case 'warn':
        console.warn('Security Event:', logData);
        break;
      case 'error':
        console.error('Security Event:', logData);
        break;
    }
  }

  // Public methods for monitoring
  getSecurityMetrics(): {
    rateLimiting: any;
    ddosProtection: any;
    threatDetection: any;
  } {
    return {
      rateLimiting: {
        topOffenders: this.rateLimiter.getTopOffenders(5)
      },
      ddosProtection: {
        currentMetrics: this.ddosProtection.getCurrentMetrics(),
        blockedIPs: this.ddosProtection.getBlockedIPs().length
      },
      threatDetection: {
        topThreats: this.ids.getTopThreats(5),
        recentEvents: this.ids.getEvents({ limit: 10 })
      }
    };
  }

  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update component configurations
    if (newConfig.ids) {
      this.ids.updateConfig(newConfig.ids);
    }
  }

  // Emergency security mode
  activateEmergencyMode(): void {
    console.warn('Activating emergency security mode');
    
    this.config = {
      ...this.config,
      rateLimit: { ...this.config.rateLimit, profile: 'strict' },
      ddos: { ...this.config.ddos, emergencyMode: true },
      validation: { ...this.config.validation, blockMalicious: true }
    };
    
    // Switch to strict rate limiter
    this.rateLimiter = rateLimiters.auth;
  }

  deactivateEmergencyMode(): void {
    console.info('Deactivating emergency security mode');
    
    this.config = {
      ...this.config,
      rateLimit: { ...this.config.rateLimit, profile: 'standard' },
      ddos: { ...this.config.ddos, emergencyMode: false }
    };
    
    // Switch back to standard rate limiter
    this.rateLimiter = rateLimiters.api;
  }
}

// Global security middleware instance
export const securityMiddleware = new SecurityMiddleware();

// Middleware wrapper function
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: Partial<SecurityConfig>
) {
  const middleware = config ? new SecurityMiddleware(config) : securityMiddleware;
  
  return async (request: NextRequest): Promise<NextResponse> => {
    // Process security checks
    const securityResponse = await middleware.processRequest(request);
    if (securityResponse) {
      return securityResponse;
    }
    
    // Validate CSRF token
    if (!middleware.validateCSRFToken(request)) {
      return NextResponse.json(
        {
          error: 'CSRF token validation failed',
          code: 'CSRF_INVALID'
        },
        { status: 403 }
      );
    }
    
    // Process the request
    const response = await handler(request);
    
    // Apply security headers and policies
    return middleware.createSecureResponse(response, request);
  };
}

// Security configuration presets
export const SECURITY_PRESETS = {
  DEVELOPMENT: {
    csp: { enabled: true, strictMode: false },
    csrf: { enabled: false, strictSameSite: false },
    rateLimit: { enabled: false, profile: 'relaxed' as const },
    ddos: { enabled: false, emergencyMode: false },
    validation: { enabled: true, blockMalicious: false }
  } as Partial<SecurityConfig>,
  
  PRODUCTION: {
    csp: { enabled: true, strictMode: true },
    csrf: { enabled: true, strictSameSite: true },
    rateLimit: { enabled: true, profile: 'standard' as const },
    ddos: { enabled: true, emergencyMode: false },
    validation: { enabled: true, blockMalicious: true }
  } as Partial<SecurityConfig>,
  
  HIGH_SECURITY: {
    csp: { enabled: true, strictMode: true },
    csrf: { enabled: true, strictSameSite: true },
    rateLimit: { enabled: true, profile: 'strict' as const },
    ddos: { enabled: true, emergencyMode: false },
    ids: { enabled: true, threatIntelligence: true, behaviorAnalysis: true },
    validation: { enabled: true, blockMalicious: true }
  } as Partial<SecurityConfig>
};
