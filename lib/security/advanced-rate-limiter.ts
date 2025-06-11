import { LRUCache } from 'lru-cache';
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  lastRequest: number;
  requests: Array<{
    timestamp: number;
    path: string;
    userAgent: string;
    status?: number;
  }>;
}

interface SuspiciousActivity {
  rapidRequests: boolean;
  pathScanning: boolean;
  userAgentRotation: boolean;
  suspiciousPatterns: string[];
  riskScore: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  burstLimit: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator: (req: NextRequest) => string;
  whitelist: string[];
  blacklist: string[];
  enablePatternDetection: boolean;
  enableGeolocation: boolean;
  suspiciousThreshold: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  burstLimit: 10, // Max requests per minute
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req: NextRequest) => {
    const forwarded = req.headers.get('x-forwarded-for');
    const real = req.headers.get('x-real-ip');
    const cloudflare = req.headers.get('cf-connecting-ip');
    return forwarded?.split(',')[0] || real || cloudflare || 'unknown';
  },
  whitelist: [],
  blacklist: [],
  enablePatternDetection: true,
  enableGeolocation: false,
  suspiciousThreshold: 0.7
};

export class AdvancedRateLimiter {
  private cache: LRUCache<string, RateLimitEntry>;
  private suspiciousIPs: LRUCache<string, SuspiciousActivity>;
  private config: RateLimitConfig;
  private patterns: Map<string, RegExp[]>;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.cache = new LRUCache({
      max: 10000,
      ttl: this.config.windowMs
    });
    
    this.suspiciousIPs = new LRUCache({
      max: 5000,
      ttl: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    this.patterns = new Map([
      ['scan_patterns', [
        /\/(admin|wp-admin|administrator|phpmyadmin|wp-login)/i,
        /\.(php|asp|aspx|jsp|cgi)$/i,
        /\/(config|backup|database|sql|dump)/i,
        /\/(test|dev|staging|debug)/i
      ]],
      ['exploit_patterns', [
        /\/(etc\/passwd|proc\/|var\/log)/i,
        /\.\.\//,
        /%2e%2e%2f/i,
        /select.*from|union.*select|drop.*table/i
      ]],
      ['bot_patterns', [
        /curl|wget|python|scrapy|bot|crawler/i,
        /^Mozilla\/5\.0 \(compatible;/,
        /^$/
      ]]
    ]);
  }

  async limit(request: NextRequest): Promise<NextResponse | null> {
    const key = this.config.keyGenerator(request);
    const now = Date.now();
    const path = request.nextUrl.pathname;
    const userAgent = request.headers.get('user-agent') || '';
    
    // Check whitelist
    if (this.isWhitelisted(key)) {
      return null;
    }
    
    // Check blacklist
    if (this.isBlacklisted(key)) {
      return this.createBlockResponse('IP blacklisted', 403);
    }
    
    // Get or create rate limit entry
    let entry = this.cache.get(key) || {
      count: 0,
      firstRequest: now,
      lastRequest: now,
      requests: []
    };
    
    // Clean old requests outside window
    entry.requests = entry.requests.filter(
      req => now - req.timestamp <= this.config.windowMs
    );
    
    // Add current request
    entry.requests.push({
      timestamp: now,
      path,
      userAgent
    });
    
    entry.count = entry.requests.length;
    entry.lastRequest = now;
    
    // Update cache
    this.cache.set(key, entry);
    
    // Check burst limit (requests per minute)
    const recentRequests = entry.requests.filter(
      req => now - req.timestamp <= 60 * 1000
    ).length;
    
    if (recentRequests > this.config.burstLimit) {
      await this.recordSuspiciousActivity(key, 'burst_limit_exceeded', request);
      return this.createBlockResponse('Too many requests per minute', 429);
    }
    
    // Check overall rate limit
    if (entry.count > this.config.maxRequests) {
      await this.recordSuspiciousActivity(key, 'rate_limit_exceeded', request);
      return this.createBlockResponse('Rate limit exceeded', 429);
    }
    
    // Pattern detection
    if (this.config.enablePatternDetection) {
      const suspiciousActivity = await this.detectSuspiciousActivity(key, entry, request);
      if (suspiciousActivity.riskScore > this.config.suspiciousThreshold) {
        return this.createBlockResponse('Suspicious activity detected', 403);
      }
    }
    
    return null;
  }
  
  private isWhitelisted(ip: string): boolean {
    return this.config.whitelist.some(whitelistEntry => {
      if (whitelistEntry.includes('/')) {
        // CIDR notation
        return this.isIPInCIDR(ip, whitelistEntry);
      }
      return ip === whitelistEntry;
    });
  }
  
  private isBlacklisted(ip: string): boolean {
    return this.config.blacklist.some(blacklistEntry => {
      if (blacklistEntry.includes('/')) {
        return this.isIPInCIDR(ip, blacklistEntry);
      }
      return ip === blacklistEntry;
    });
  }
  
  private isIPInCIDR(ip: string, cidr: string): boolean {
    // Simple CIDR check - in production, use a proper IP library
    try {
      const [network, prefixLength] = cidr.split('/');
      const networkParts = network.split('.').map(Number);
      const ipParts = ip.split('.').map(Number);
      const prefix = parseInt(prefixLength);
      
      if (networkParts.length !== 4 || ipParts.length !== 4) {
        return false;
      }
      
      // Convert to 32-bit integers
      const networkInt = (networkParts[0] << 24) + (networkParts[1] << 16) + (networkParts[2] << 8) + networkParts[3];
      const ipInt = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
      
      const mask = (-1 << (32 - prefix)) >>> 0;
      return (networkInt & mask) === (ipInt & mask);
    } catch {
      return false;
    }
  }
  
  private async detectSuspiciousActivity(
    key: string, 
    entry: RateLimitEntry, 
    request: NextRequest
  ): Promise<SuspiciousActivity> {
    const now = Date.now();
    const recentRequests = entry.requests.filter(req => now - req.timestamp <= 5 * 60 * 1000); // Last 5 minutes
    
    let riskScore = 0;
    const suspiciousPatterns: string[] = [];
    
    // Check for rapid requests
    const rapidRequests = recentRequests.length > 50; // More than 50 requests in 5 minutes
    if (rapidRequests) {
      riskScore += 0.3;
      suspiciousPatterns.push('rapid_requests');
    }
    
    // Check for path scanning
    const uniquePaths = new Set(recentRequests.map(req => req.path));
    const pathScanning = uniquePaths.size > 20; // More than 20 different paths
    if (pathScanning) {
      riskScore += 0.4;
      suspiciousPatterns.push('path_scanning');
    }
    
    // Check for user agent rotation
    const uniqueUserAgents = new Set(recentRequests.map(req => req.userAgent));
    const userAgentRotation = uniqueUserAgents.size > 5; // More than 5 different user agents
    if (userAgentRotation) {
      riskScore += 0.3;
      suspiciousPatterns.push('user_agent_rotation');
    }
    
    // Check for suspicious patterns in paths
    const currentPath = request.nextUrl.pathname;
    for (const [patternType, patterns] of this.patterns.entries()) {
      if (patterns.some(pattern => pattern.test(currentPath))) {
        riskScore += 0.5;
        suspiciousPatterns.push(`${patternType}:${currentPath}`);
      }
    }
    
    // Check for suspicious user agent
    const userAgent = request.headers.get('user-agent') || '';
    if (this.patterns.get('bot_patterns')?.some(pattern => pattern.test(userAgent))) {
      riskScore += 0.2;
      suspiciousPatterns.push('suspicious_user_agent');
    }
    
    // Check for missing or suspicious headers
    const acceptHeader = request.headers.get('accept');
    const acceptLanguageHeader = request.headers.get('accept-language');
    if (!acceptHeader || !acceptLanguageHeader) {
      riskScore += 0.1;
      suspiciousPatterns.push('missing_headers');
    }
    
    const activity: SuspiciousActivity = {
      rapidRequests,
      pathScanning,
      userAgentRotation,
      suspiciousPatterns,
      riskScore
    };
    
    // Store suspicious activity
    this.suspiciousIPs.set(key, activity);
    
    return activity;
  }
  
  private async recordSuspiciousActivity(
    ip: string, 
    type: string, 
    request: NextRequest
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip,
      type,
      path: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent'),
      method: request.method,
      headers: Object.fromEntries(request.headers.entries())
    };
    
    console.warn('Suspicious activity detected:', logEntry);
    
    // Send to monitoring system
    try {
      await fetch('/api/security/suspicious-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.error('Failed to report suspicious activity:', error);
    }
  }
  
  private createBlockResponse(message: string, status: number): NextResponse {
    return NextResponse.json(
      {
        error: message,
        code: 'RATE_LIMITED',
        retryAfter: Math.ceil(this.config.windowMs / 1000)
      },
      {
        status,
        headers: {
          'Retry-After': String(Math.ceil(this.config.windowMs / 1000)),
          'X-RateLimit-Limit': String(this.config.maxRequests),
          'X-RateLimit-Window': String(this.config.windowMs),
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  }
  
  // Add IP to whitelist
  addToWhitelist(ip: string): void {
    if (!this.config.whitelist.includes(ip)) {
      this.config.whitelist.push(ip);
    }
  }
  
  // Add IP to blacklist
  addToBlacklist(ip: string): void {
    if (!this.config.blacklist.includes(ip)) {
      this.config.blacklist.push(ip);
    }
  }
  
  // Get statistics for an IP
  getStats(ip: string): {
    currentRequests: number;
    lastRequest: Date | null;
    suspicious: boolean;
    activity?: SuspiciousActivity;
  } {
    const entry = this.cache.get(ip);
    const suspiciousActivity = this.suspiciousIPs.get(ip);
    
    return {
      currentRequests: entry?.count || 0,
      lastRequest: entry ? new Date(entry.lastRequest) : null,
      suspicious: suspiciousActivity ? suspiciousActivity.riskScore > this.config.suspiciousThreshold : false,
      activity: suspiciousActivity
    };
  }
  
  // Reset rate limit for an IP
  reset(ip: string): void {
    this.cache.delete(ip);
    this.suspiciousIPs.delete(ip);
  }
  
  // Get top offenders
  getTopOffenders(limit: number = 10): Array<{
    ip: string;
    requests: number;
    riskScore: number;
    lastSeen: Date;
  }> {
    const offenders: Array<{
      ip: string;
      requests: number;
      riskScore: number;
      lastSeen: Date;
    }> = [];
    
    for (const [ip, entry] of this.cache.entries()) {
      const activity = this.suspiciousIPs.get(ip);
      offenders.push({
        ip,
        requests: entry.count,
        riskScore: activity?.riskScore || 0,
        lastSeen: new Date(entry.lastRequest)
      });
    }
    
    return offenders
      .sort((a, b) => b.riskScore - a.riskScore || b.requests - a.requests)
      .slice(0, limit);
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // Strict limit for authentication endpoints
  auth: new AdvancedRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    burstLimit: 2,
    enablePatternDetection: true,
    suspiciousThreshold: 0.5
  }),
  
  // Standard API rate limiter
  api: new AdvancedRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    burstLimit: 10,
    enablePatternDetection: true
  }),
  
  // Relaxed limit for static content
  static: new AdvancedRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 500,
    burstLimit: 50,
    enablePatternDetection: false
  }),
  
  // Strict limit for expensive operations
  expensive: new AdvancedRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    burstLimit: 2,
    enablePatternDetection: true,
    suspiciousThreshold: 0.3
  })
};

// Middleware wrapper
export function withAdvancedRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limiter: AdvancedRateLimiter = rateLimiters.api
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const limitResponse = await limiter.limit(request);
    
    if (limitResponse) {
      return limitResponse;
    }
    
    const response = await handler(request);
    
    // Add rate limit headers to successful responses
    const ip = limiter['config'].keyGenerator(request);
    const stats = limiter.getStats(ip);
    
    response.headers.set('X-RateLimit-Limit', String(limiter['config'].maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(Math.max(0, limiter['config'].maxRequests - stats.currentRequests)));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000) + Math.ceil(limiter['config'].windowMs / 1000)));
    
    return response;
  };
}

// Geolocation-based rate limiting (placeholder for future implementation)
export class GeolocationRateLimiter extends AdvancedRateLimiter {
  private geoLimits: Map<string, { limit: number; window: number }> = new Map([
    ['US', { limit: 1000, window: 60 * 60 * 1000 }], // 1000 requests per hour
    ['CN', { limit: 100, window: 60 * 60 * 1000 }],  // 100 requests per hour
    ['RU', { limit: 100, window: 60 * 60 * 1000 }],  // 100 requests per hour
    ['default', { limit: 500, window: 60 * 60 * 1000 }] // Default limit
  ]);
  
  async limit(request: NextRequest): Promise<NextResponse | null> {
    // First apply standard rate limiting
    const standardLimit = await super.limit(request);
    if (standardLimit) return standardLimit;
    
    // Then apply geolocation-based limits
    const country = this.getCountryFromRequest(request);
    const geoLimit = this.geoLimits.get(country) || this.geoLimits.get('default')!;
    
    // Implement geolocation-specific logic here
    // This would require integration with a geolocation service
    
    return null;
  }
  
  private getCountryFromRequest(request: NextRequest): string {
    // Try Cloudflare header first
    const cfCountry = request.headers.get('cf-ipcountry');
    if (cfCountry) return cfCountry;
    
    // Try other CDN headers
    const xCountry = request.headers.get('x-country-code');
    if (xCountry) return xCountry;
    
    return 'unknown';
  }
}
