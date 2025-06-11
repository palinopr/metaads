import { LRUCache } from 'lru-cache';
import { NextRequest, NextResponse } from 'next/server';

interface TrafficMetrics {
  requestsPerSecond: number;
  uniqueIPs: number;
  averageResponseTime: number;
  errorRate: number;
  suspiciousRequests: number;
  timestamp: number;
}

interface AttackPattern {
  type: 'volumetric' | 'application' | 'protocol' | 'distributed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  indicators: string[];
  mitigationSuggestions: string[];
}

interface DDoSConfig {
  enabled: boolean;
  thresholds: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    uniqueIPsPerMinute: number;
    errorRatePercentage: number;
    responseTimeMs: number;
  };
  blockDuration: number;
  whitelistedIPs: string[];
  enablePatternDetection: boolean;
  enableTrafficAnalysis: boolean;
  alertWebhook?: string;
}

const DEFAULT_CONFIG: DDoSConfig = {
  enabled: true,
  thresholds: {
    requestsPerSecond: 100,
    requestsPerMinute: 3000,
    uniqueIPsPerMinute: 500,
    errorRatePercentage: 50,
    responseTimeMs: 5000
  },
  blockDuration: 15 * 60 * 1000, // 15 minutes
  whitelistedIPs: [],
  enablePatternDetection: true,
  enableTrafficAnalysis: true
};

export class DDoSProtection {
  private config: DDoSConfig;
  private trafficMetrics: LRUCache<number, TrafficMetrics>;
  private blockedIPs: LRUCache<string, number>;
  private requestLog: LRUCache<number, Array<{
    ip: string;
    path: string;
    userAgent: string;
    timestamp: number;
    responseTime?: number;
    status?: number;
  }>>;
  private patterns: Map<string, AttackPattern>;

  constructor(config: Partial<DDoSConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Traffic metrics cache (last 60 seconds)
    this.trafficMetrics = new LRUCache({
      max: 60,
      ttl: 60 * 1000
    });
    
    // Blocked IPs cache
    this.blockedIPs = new LRUCache({
      max: 10000,
      ttl: this.config.blockDuration
    });
    
    // Request log cache (last 5 minutes of requests)
    this.requestLog = new LRUCache({
      max: 300,
      ttl: 5 * 60 * 1000
    });
    
    this.initializeAttackPatterns();
    this.startMetricsCollection();
  }

  private initializeAttackPatterns(): void {
    this.patterns = new Map([
      ['http_flood', {
        type: 'volumetric',
        severity: 'high',
        confidence: 0.9,
        description: 'HTTP flood attack detected',
        indicators: ['high_request_rate', 'single_endpoint'],
        mitigationSuggestions: ['Rate limiting', 'IP blocking', 'CAPTCHA']
      }],
      ['slowloris', {
        type: 'application',
        severity: 'medium',
        confidence: 0.8,
        description: 'Slowloris attack pattern detected',
        indicators: ['slow_connections', 'partial_requests'],
        mitigationSuggestions: ['Connection timeout', 'Request timeout']
      }],
      ['distributed_flood', {
        type: 'distributed',
        severity: 'critical',
        confidence: 0.95,
        description: 'Distributed flood attack from multiple IPs',
        indicators: ['multiple_ips', 'coordinated_timing', 'similar_patterns'],
        mitigationSuggestions: ['Geographic blocking', 'Challenge-response', 'Traffic shaping']
      }],
      ['application_layer', {
        type: 'application',
        severity: 'high',
        confidence: 0.85,
        description: 'Application layer attack targeting specific endpoints',
        indicators: ['targeted_endpoints', 'resource_exhaustion'],
        mitigationSuggestions: ['Endpoint rate limiting', 'Resource monitoring', 'Request validation']
      }]
    ]);
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.collectMetrics();
    }, 1000); // Collect metrics every second
  }

  private collectMetrics(): void {
    const now = Date.now();
    const currentSecond = Math.floor(now / 1000);
    
    // Get requests from the last second
    const recentRequests = this.getRecentRequests(1000);
    
    // Calculate metrics
    const requestsPerSecond = recentRequests.length;
    const uniqueIPs = new Set(recentRequests.map(r => r.ip)).size;
    const responseTimes = recentRequests
      .filter(r => r.responseTime)
      .map(r => r.responseTime!);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
    const errorRequests = recentRequests.filter(r => r.status && r.status >= 400);
    const errorRate = recentRequests.length > 0 
      ? (errorRequests.length / recentRequests.length) * 100 
      : 0;
    
    const metrics: TrafficMetrics = {
      requestsPerSecond,
      uniqueIPs,
      averageResponseTime,
      errorRate,
      suspiciousRequests: this.countSuspiciousRequests(recentRequests),
      timestamp: now
    };
    
    this.trafficMetrics.set(currentSecond, metrics);
    
    // Analyze for attacks
    if (this.config.enablePatternDetection) {
      this.analyzeTrafficPatterns();
    }
  }

  private getRecentRequests(timeWindow: number): Array<{
    ip: string;
    path: string;
    userAgent: string;
    timestamp: number;
    responseTime?: number;
    status?: number;
  }> {
    const now = Date.now();
    const allRequests: Array<{
      ip: string;
      path: string;
      userAgent: string;
      timestamp: number;
      responseTime?: number;
      status?: number;
    }> = [];
    
    for (const [, requests] of this.requestLog.entries()) {
      allRequests.push(...requests.filter(r => now - r.timestamp <= timeWindow));
    }
    
    return allRequests;
  }

  private countSuspiciousRequests(requests: Array<{
    ip: string;
    path: string;
    userAgent: string;
    timestamp: number;
    responseTime?: number;
    status?: number;
  }>): number {
    let suspicious = 0;
    
    // Count requests with suspicious patterns
    requests.forEach(request => {
      // Check for bot-like user agents
      if (!request.userAgent || 
          request.userAgent.length < 10 || 
          /curl|wget|bot|spider|scraper/i.test(request.userAgent)) {
        suspicious++;
      }
      
      // Check for suspicious paths
      if (/\/(admin|wp-admin|phpmyadmin|\.env|\.git)/.test(request.path)) {
        suspicious++;
      }
      
      // Check for error responses (might indicate probing)
      if (request.status && request.status >= 400) {
        suspicious++;
      }
    });
    
    return suspicious;
  }

  private analyzeTrafficPatterns(): void {
    const recentMetrics = Array.from(this.trafficMetrics.values())
      .slice(-60); // Last 60 seconds
    
    if (recentMetrics.length < 10) return; // Need enough data
    
    const avgRPS = recentMetrics.reduce((sum, m) => sum + m.requestsPerSecond, 0) / recentMetrics.length;
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / recentMetrics.length;
    const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length;
    
    // Detect attack patterns
    const attacks: AttackPattern[] = [];
    
    // HTTP Flood Detection
    if (avgRPS > this.config.thresholds.requestsPerSecond) {
      const confidence = Math.min(0.95, avgRPS / this.config.thresholds.requestsPerSecond * 0.5);
      attacks.push({
        ...this.patterns.get('http_flood')!,
        confidence
      });
    }
    
    // Distributed Attack Detection
    const uniqueIPsInWindow = recentMetrics.reduce((sum, m) => sum + m.uniqueIPs, 0);
    if (uniqueIPsInWindow > this.config.thresholds.uniqueIPsPerMinute && 
        avgRPS > this.config.thresholds.requestsPerSecond * 0.5) {
      attacks.push({
        ...this.patterns.get('distributed_flood')!,
        confidence: 0.9
      });
    }
    
    // Slowloris Detection
    if (avgResponseTime > this.config.thresholds.responseTimeMs && 
        avgRPS < this.config.thresholds.requestsPerSecond * 0.3) {
      attacks.push({
        ...this.patterns.get('slowloris')!,
        confidence: 0.7
      });
    }
    
    // Application Layer Attack
    if (avgErrorRate > this.config.thresholds.errorRatePercentage) {
      attacks.push({
        ...this.patterns.get('application_layer')!,
        confidence: avgErrorRate / 100
      });
    }
    
    // Handle detected attacks
    attacks.forEach(attack => {
      if (attack.confidence > 0.8) {
        this.handleAttack(attack);
      }
    });
  }

  private async handleAttack(attack: AttackPattern): Promise<void> {
    console.warn('DDoS Attack Detected:', attack);
    
    // Send alert
    if (this.config.alertWebhook) {
      try {
        await fetch(this.config.alertWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ddos_attack',
            attack,
            timestamp: new Date().toISOString(),
            metrics: this.getCurrentMetrics()
          })
        });
      } catch (error) {
        console.error('Failed to send DDoS alert:', error);
      }
    }
    
    // Auto-mitigation based on attack type
    if (attack.severity === 'critical' || attack.confidence > 0.9) {
      await this.activateEmergencyMode();
    }
  }

  private async activateEmergencyMode(): Promise<void> {
    console.warn('Activating DDoS emergency mode');
    
    // Implement emergency measures
    // - Reduce rate limits
    // - Block suspicious IPs
    // - Enable CAPTCHA
    // - Notify administrators
    
    const emergencyConfig = {
      ...this.config,
      thresholds: {
        ...this.config.thresholds,
        requestsPerSecond: Math.floor(this.config.thresholds.requestsPerSecond * 0.5),
        requestsPerMinute: Math.floor(this.config.thresholds.requestsPerMinute * 0.5)
      }
    };
    
    // Apply emergency config
    this.config = emergencyConfig;
    
    // Set auto-recovery
    setTimeout(() => {
      this.deactivateEmergencyMode();
    }, 30 * 60 * 1000); // 30 minutes
  }

  private deactivateEmergencyMode(): void {
    console.info('Deactivating DDoS emergency mode');
    this.config = { ...DEFAULT_CONFIG, ...this.config };
  }

  async checkRequest(request: NextRequest): Promise<NextResponse | null> {
    if (!this.config.enabled) return null;
    
    const ip = this.getClientIP(request);
    const now = Date.now();
    const path = request.nextUrl.pathname;
    const userAgent = request.headers.get('user-agent') || '';
    
    // Check if IP is whitelisted
    if (this.config.whitelistedIPs.includes(ip)) {
      return null;
    }
    
    // Check if IP is blocked
    if (this.blockedIPs.has(ip)) {
      return this.createBlockedResponse();
    }
    
    // Log the request
    this.logRequest({
      ip,
      path,
      userAgent,
      timestamp: now
    });
    
    // Check rate limits
    const recentRequests = this.getRecentRequests(60 * 1000); // Last minute
    const ipRequests = recentRequests.filter(r => r.ip === ip);
    
    if (ipRequests.length > this.config.thresholds.requestsPerMinute / 60) {
      this.blockIP(ip, 'Rate limit exceeded');
      return this.createBlockedResponse();
    }
    
    // Check for suspicious patterns
    if (this.isSuspiciousRequest(request, ipRequests)) {
      this.blockIP(ip, 'Suspicious activity detected');
      return this.createBlockedResponse();
    }
    
    return null;
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const real = request.headers.get('x-real-ip');
    const cloudflare = request.headers.get('cf-connecting-ip');
    
    return forwarded?.split(',')[0] || real || cloudflare || 'unknown';
  }

  private logRequest(request: {
    ip: string;
    path: string;
    userAgent: string;
    timestamp: number;
  }): void {
    const currentSecond = Math.floor(request.timestamp / 1000);
    const existing = this.requestLog.get(currentSecond) || [];
    existing.push(request);
    this.requestLog.set(currentSecond, existing);
  }

  private isSuspiciousRequest(
    request: NextRequest, 
    recentRequests: Array<any>
  ): boolean {
    const userAgent = request.headers.get('user-agent') || '';
    const path = request.nextUrl.pathname;
    
    // Check for bot-like behavior
    if (!userAgent || userAgent.length < 10) {
      return true;
    }
    
    // Check for scanner patterns
    if (/\/(admin|wp-admin|phpmyadmin|\.env|\.git|config)/.test(path)) {
      return true;
    }
    
    // Check for rapid identical requests
    const identicalRequests = recentRequests.filter(r => 
      r.path === path && r.userAgent === userAgent
    );
    
    if (identicalRequests.length > 50) { // More than 50 identical requests
      return true;
    }
    
    return false;
  }

  private blockIP(ip: string, reason: string): void {
    this.blockedIPs.set(ip, Date.now());
    console.warn(`Blocked IP ${ip}: ${reason}`);
  }

  private createBlockedResponse(): NextResponse {
    return NextResponse.json(
      {
        error: 'Request blocked due to suspicious activity',
        code: 'DDOS_PROTECTION'
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(this.config.blockDuration / 1000)),
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  }

  // Public methods for monitoring
  getCurrentMetrics(): TrafficMetrics | null {
    const currentSecond = Math.floor(Date.now() / 1000);
    return this.trafficMetrics.get(currentSecond) || null;
  }

  getHistoricalMetrics(seconds: number = 60): TrafficMetrics[] {
    const now = Math.floor(Date.now() / 1000);
    const metrics: TrafficMetrics[] = [];
    
    for (let i = seconds - 1; i >= 0; i--) {
      const metric = this.trafficMetrics.get(now - i);
      if (metric) {
        metrics.push(metric);
      }
    }
    
    return metrics;
  }

  getBlockedIPs(): Array<{ ip: string; blockedAt: Date; reason?: string }> {
    const blocked: Array<{ ip: string; blockedAt: Date; reason?: string }> = [];
    
    for (const [ip, timestamp] of this.blockedIPs.entries()) {
      blocked.push({
        ip,
        blockedAt: new Date(timestamp)
      });
    }
    
    return blocked;
  }

  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    console.info(`Unblocked IP: ${ip}`);
  }

  addWhitelistIP(ip: string): void {
    if (!this.config.whitelistedIPs.includes(ip)) {
      this.config.whitelistedIPs.push(ip);
    }
  }

  removeWhitelistIP(ip: string): void {
    const index = this.config.whitelistedIPs.indexOf(ip);
    if (index > -1) {
      this.config.whitelistedIPs.splice(index, 1);
    }
  }
}

// Global DDoS protection instance
export const ddosProtection = new DDoSProtection();

// Middleware wrapper
export function withDDoSProtection(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const blockResponse = await ddosProtection.checkRequest(request);
    
    if (blockResponse) {
      return blockResponse;
    }
    
    const startTime = Date.now();
    const response = await handler(request);
    const responseTime = Date.now() - startTime;
    
    // Log response metrics
    const ip = ddosProtection['getClientIP'](request);
    const currentSecond = Math.floor(Date.now() / 1000);
    const existing = ddosProtection['requestLog'].get(currentSecond) || [];
    
    // Update the request with response information
    const requestEntry = existing.find(r => 
      r.ip === ip && 
      r.timestamp > startTime - 1000
    );
    
    if (requestEntry) {
      requestEntry.responseTime = responseTime;
      requestEntry.status = response.status;
    }
    
    return response;
  };
}

// Traffic analysis utilities
export class TrafficAnalyzer {
  static analyzeTrafficPatterns(metrics: TrafficMetrics[]): {
    trend: 'increasing' | 'decreasing' | 'stable';
    anomalies: Array<{ metric: string; value: number; threshold: number }>;
    recommendations: string[];
  } {
    if (metrics.length < 2) {
      return { trend: 'stable', anomalies: [], recommendations: [] };
    }
    
    const latest = metrics[metrics.length - 1];
    const previous = metrics[metrics.length - 2];
    
    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    const rpsChange = (latest.requestsPerSecond - previous.requestsPerSecond) / previous.requestsPerSecond;
    
    if (rpsChange > 0.2) trend = 'increasing';
    else if (rpsChange < -0.2) trend = 'decreasing';
    
    // Detect anomalies
    const anomalies: Array<{ metric: string; value: number; threshold: number }> = [];
    
    if (latest.requestsPerSecond > 200) {
      anomalies.push({ metric: 'requestsPerSecond', value: latest.requestsPerSecond, threshold: 200 });
    }
    
    if (latest.errorRate > 30) {
      anomalies.push({ metric: 'errorRate', value: latest.errorRate, threshold: 30 });
    }
    
    if (latest.averageResponseTime > 3000) {
      anomalies.push({ metric: 'averageResponseTime', value: latest.averageResponseTime, threshold: 3000 });
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (trend === 'increasing' && latest.requestsPerSecond > 150) {
      recommendations.push('Consider enabling rate limiting');
    }
    
    if (latest.errorRate > 20) {
      recommendations.push('Investigate application errors');
    }
    
    if (latest.averageResponseTime > 2000) {
      recommendations.push('Check application performance');
    }
    
    return { trend, anomalies, recommendations };
  }
}
