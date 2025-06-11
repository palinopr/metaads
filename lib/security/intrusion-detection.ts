import { LRUCache } from 'lru-cache';
import { NextRequest } from 'next/server';

interface SecurityEvent {
  id: string;
  timestamp: number;
  type: 'auth_failure' | 'suspicious_activity' | 'attack_attempt' | 'policy_violation' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: {
    ip: string;
    userAgent: string;
    country?: string;
    asn?: string;
  };
  target: {
    endpoint: string;
    method: string;
    parameters?: Record<string, any>;
  };
  details: {
    description: string;
    indicators: string[];
    confidence: number;
    riskScore: number;
  };
  mitigation?: {
    action: 'block' | 'throttle' | 'monitor' | 'alert';
    duration?: number;
    reason: string;
  };
}

interface ThreatIntelligence {
  ip: string;
  reputation: 'good' | 'suspicious' | 'malicious' | 'unknown';
  categories: string[];
  lastSeen: number;
  confidence: number;
  sources: string[];
}

interface BehaviorProfile {
  ip: string;
  patterns: {
    typicalPaths: string[];
    requestFrequency: number;
    userAgents: string[];
    timePatterns: number[];
    sessionDuration: number;
  };
  riskScore: number;
  lastUpdated: number;
}

interface IDSConfig {
  enabled: boolean;
  threatIntelligence: {
    enabled: boolean;
    sources: string[];
    updateInterval: number;
  };
  behaviorAnalysis: {
    enabled: boolean;
    learningPeriod: number;
    sensitivityLevel: 'low' | 'medium' | 'high';
  };
  alerting: {
    webhookUrl?: string;
    emailRecipients?: string[];
    slackWebhook?: string;
  };
  retention: {
    events: number; // days
    profiles: number; // days
  };
}

const DEFAULT_CONFIG: IDSConfig = {
  enabled: true,
  threatIntelligence: {
    enabled: true,
    sources: [],
    updateInterval: 24 * 60 * 60 * 1000 // 24 hours
  },
  behaviorAnalysis: {
    enabled: true,
    learningPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
    sensitivityLevel: 'medium'
  },
  alerting: {},
  retention: {
    events: 30,
    profiles: 90
  }
};

export class IntrusionDetectionSystem {
  private config: IDSConfig;
  private events: LRUCache<string, SecurityEvent>;
  private threatIntel: Map<string, ThreatIntelligence>;
  private behaviorProfiles: Map<string, BehaviorProfile>;
  private rules: Map<string, (event: any) => SecurityEvent | null>;
  private alertQueue: SecurityEvent[];

  constructor(config: Partial<IDSConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.events = new LRUCache({
      max: 10000,
      ttl: this.config.retention.events * 24 * 60 * 60 * 1000
    });
    
    this.threatIntel = new Map();
    this.behaviorProfiles = new Map();
    this.rules = new Map();
    this.alertQueue = [];
    
    this.initializeDetectionRules();
    this.startThreatIntelligenceUpdater();
    this.startAlertProcessor();
  }

  private initializeDetectionRules(): void {
    // Authentication anomalies
    this.rules.set('auth_brute_force', (data) => {
      const { ip, attempts, timeWindow } = data;
      if (attempts > 10 && timeWindow < 5 * 60 * 1000) { // 10 attempts in 5 minutes
        return {
          id: this.generateEventId(),
          timestamp: Date.now(),
          type: 'auth_failure',
          severity: 'high',
          source: { ip, userAgent: data.userAgent || 'unknown' },
          target: { endpoint: '/auth', method: 'POST' },
          details: {
            description: 'Brute force authentication attack detected',
            indicators: ['multiple_failed_logins', 'short_time_window'],
            confidence: 0.9,
            riskScore: 85
          },
          mitigation: {
            action: 'block',
            duration: 60 * 60 * 1000, // 1 hour
            reason: 'Brute force attack prevention'
          }
        } as SecurityEvent;
      }
      return null;
    });

    // SQL injection detection
    this.rules.set('sql_injection', (data) => {
      const { input, endpoint } = data;
      const sqlPatterns = [
        /('|(\-\-)|(;)|(\||\|)|(\*|\*))/,
        /(union|select|insert|drop|delete|update|create|alter)/i,
        /(exec|execute|sp_|xp_)/i
      ];
      
      const detected = sqlPatterns.some(pattern => pattern.test(input));
      if (detected) {
        return {
          id: this.generateEventId(),
          timestamp: Date.now(),
          type: 'attack_attempt',
          severity: 'critical',
          source: { ip: data.ip, userAgent: data.userAgent },
          target: { endpoint, method: data.method },
          details: {
            description: 'SQL injection attempt detected',
            indicators: ['malicious_sql_patterns', 'input_validation_bypass'],
            confidence: 0.95,
            riskScore: 95
          },
          mitigation: {
            action: 'block',
            duration: 24 * 60 * 60 * 1000, // 24 hours
            reason: 'SQL injection attack prevention'
          }
        } as SecurityEvent;
      }
      return null;
    });

    // XSS detection
    this.rules.set('xss_attempt', (data) => {
      const { input } = data;
      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe[^>]*>/i
      ];
      
      const detected = xssPatterns.some(pattern => pattern.test(input));
      if (detected) {
        return {
          id: this.generateEventId(),
          timestamp: Date.now(),
          type: 'attack_attempt',
          severity: 'high',
          source: { ip: data.ip, userAgent: data.userAgent },
          target: { endpoint: data.endpoint, method: data.method },
          details: {
            description: 'Cross-site scripting (XSS) attempt detected',
            indicators: ['malicious_javascript', 'script_injection'],
            confidence: 0.9,
            riskScore: 80
          },
          mitigation: {
            action: 'block',
            duration: 6 * 60 * 60 * 1000, // 6 hours
            reason: 'XSS attack prevention'
          }
        } as SecurityEvent;
      }
      return null;
    });

    // Path traversal detection
    this.rules.set('path_traversal', (data) => {
      const { path } = data;
      const traversalPatterns = [
        /\.\.\//,
        /%2e%2e%2f/i,
        /\\.\.\\|\/\.\.\/|\.\.\\/,
        /(etc\/passwd|proc\/|var\/log)/i
      ];
      
      const detected = traversalPatterns.some(pattern => pattern.test(path));
      if (detected) {
        return {
          id: this.generateEventId(),
          timestamp: Date.now(),
          type: 'attack_attempt',
          severity: 'high',
          source: { ip: data.ip, userAgent: data.userAgent },
          target: { endpoint: path, method: data.method },
          details: {
            description: 'Path traversal attempt detected',
            indicators: ['directory_traversal', 'file_access_attempt'],
            confidence: 0.85,
            riskScore: 75
          },
          mitigation: {
            action: 'block',
            duration: 12 * 60 * 60 * 1000, // 12 hours
            reason: 'Path traversal attack prevention'
          }
        } as SecurityEvent;
      }
      return null;
    });

    // Behavioral anomaly detection
    this.rules.set('behavior_anomaly', (data) => {
      const { ip, currentBehavior } = data;
      const profile = this.behaviorProfiles.get(ip);
      
      if (!profile) return null;
      
      let anomalyScore = 0;
      const indicators: string[] = [];
      
      // Check request frequency anomaly
      if (currentBehavior?.requestFrequency && profile?.patterns?.requestFrequency && 
          currentBehavior.requestFrequency > profile.patterns.requestFrequency * 5) {
        anomalyScore += 30;
        indicators.push('unusual_request_frequency');
      }
      
      // Check path anomaly
      if (currentBehavior?.paths && profile?.patterns?.typicalPaths) {
        const newPaths = currentBehavior.paths.filter(
          (path: string) => !profile.patterns.typicalPaths.includes(path)
        );
        if (newPaths.length > 10) {
          anomalyScore += 25;
          indicators.push('unusual_path_access');
        }
      }
      
      // Check user agent change
      if (currentBehavior?.userAgent && profile?.patterns?.userAgents && 
          !profile.patterns.userAgents.includes(currentBehavior.userAgent)) {
        anomalyScore += 20;
        indicators.push('user_agent_change');
      }
      
      // Check time pattern anomaly
      const currentHour = new Date().getHours();
      if (profile?.patterns?.timePatterns && !profile.patterns.timePatterns.includes(currentHour)) {
        anomalyScore += 15;
        indicators.push('unusual_time_access');
      }
      
      if (anomalyScore > 50) {
        return {
          id: this.generateEventId(),
          timestamp: Date.now(),
          type: 'anomaly',
          severity: anomalyScore > 80 ? 'high' : 'medium',
          source: { ip, userAgent: currentBehavior.userAgent },
          target: { endpoint: 'multiple', method: 'various' },
          details: {
            description: 'Behavioral anomaly detected',
            indicators,
            confidence: Math.min(0.95, anomalyScore / 100),
            riskScore: anomalyScore
          },
          mitigation: {
            action: anomalyScore > 80 ? 'throttle' : 'monitor',
            duration: 30 * 60 * 1000, // 30 minutes
            reason: 'Unusual behavior pattern'
          }
        } as SecurityEvent;
      }
      
      return null;
    });
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startThreatIntelligenceUpdater(): void {
    if (!this.config.threatIntelligence.enabled) return;
    
    setInterval(() => {
      this.updateThreatIntelligence();
    }, this.config.threatIntelligence.updateInterval);
  }

  private async updateThreatIntelligence(): Promise<void> {
    // In a real implementation, this would fetch from threat intelligence feeds
    // For now, we'll simulate with some known malicious IPs
    const knownMaliciousIPs = [
      '192.168.1.100', // Example
      '10.0.0.1' // Example
    ];
    
    knownMaliciousIPs.forEach(ip => {
      this.threatIntel.set(ip, {
        ip,
        reputation: 'malicious',
        categories: ['botnet', 'scanner'],
        lastSeen: Date.now(),
        confidence: 0.9,
        sources: ['internal_detection']
      });
    });
  }

  private startAlertProcessor(): void {
    setInterval(() => {
      this.processAlertQueue();
    }, 5000); // Process alerts every 5 seconds
  }

  private async processAlertQueue(): Promise<void> {
    while (this.alertQueue.length > 0) {
      const event = this.alertQueue.shift()!;
      await this.sendAlert(event);
    }
  }

  private async sendAlert(event: SecurityEvent): Promise<void> {
    const alertData = {
      timestamp: new Date(event.timestamp).toISOString(),
      severity: event.severity,
      type: event.type,
      description: event.details.description,
      source: event.source,
      target: event.target,
      riskScore: event.details.riskScore,
      mitigation: event.mitigation
    };

    // Send to webhook
    if (this.config.alerting.webhookUrl) {
      try {
        await fetch(this.config.alerting.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alertData)
        });
      } catch (error) {
        console.error('Failed to send webhook alert:', error);
      }
    }

    // Send to Slack
    if (this.config.alerting.slackWebhook) {
      const slackMessage = {
        text: `🚨 Security Alert: ${event.details.description}`,
        attachments: [{
          color: this.getSeverityColor(event.severity),
          fields: [
            { title: 'Severity', value: event.severity.toUpperCase(), short: true },
            { title: 'Source IP', value: event.source.ip, short: true },
            { title: 'Risk Score', value: event.details.riskScore.toString(), short: true },
            { title: 'Target', value: `${event.target.method} ${event.target.endpoint}`, short: true }
          ],
          timestamp: event.timestamp / 1000
        }]
      };

      try {
        await fetch(this.config.alerting.slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        });
      } catch (error) {
        console.error('Failed to send Slack alert:', error);
      }
    }

    console.warn('Security Event:', alertData);
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return '#ffcc00';
      case 'low': return 'good';
      default: return '#cccccc';
    }
  }

  // Public methods
  analyzeRequest(request: NextRequest, additionalData: any = {}): SecurityEvent[] {
    if (!this.config.enabled) return [];
    
    const events: SecurityEvent[] = [];
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const path = request.nextUrl.pathname;
    const method = request.method;
    
    // Check threat intelligence
    const threatInfo = this.threatIntel.get(ip);
    if (threatInfo && threatInfo.reputation === 'malicious') {
      events.push({
        id: this.generateEventId(),
        timestamp: Date.now(),
        type: 'suspicious_activity',
        severity: 'high',
        source: { ip, userAgent },
        target: { endpoint: path, method },
        details: {
          description: 'Request from known malicious IP',
          indicators: ['threat_intelligence_match'],
          confidence: threatInfo.confidence,
          riskScore: 90
        },
        mitigation: {
          action: 'block',
          duration: 24 * 60 * 60 * 1000,
          reason: 'Known malicious IP'
        }
      });
    }
    
    // Run detection rules
    const ruleData = {
      ip,
      userAgent,
      path,
      method,
      endpoint: path,
      ...additionalData
    };
    
    for (const [ruleName, rule] of this.rules.entries()) {
      try {
        const event = rule(ruleData);
        if (event) {
          events.push(event);
        }
      } catch (error) {
        console.error(`Error in detection rule ${ruleName}:`, error);
      }
    }
    
    // Store events and queue alerts
    events.forEach(event => {
      this.events.set(event.id, event);
      if (event.severity === 'high' || event.severity === 'critical') {
        this.alertQueue.push(event);
      }
    });
    
    // Update behavior profile
    if (this.config.behaviorAnalysis.enabled) {
      this.updateBehaviorProfile(ip, {
        path,
        userAgent,
        timestamp: Date.now(),
        method
      });
    }
    
    return events;
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const real = request.headers.get('x-real-ip');
    const cloudflare = request.headers.get('cf-connecting-ip');
    
    return forwarded?.split(',')[0] || real || cloudflare || 'unknown';
  }

  private updateBehaviorProfile(ip: string, activity: {
    path: string;
    userAgent: string;
    timestamp: number;
    method: string;
  }): void {
    let profile = this.behaviorProfiles.get(ip);
    
    if (!profile) {
      profile = {
        ip,
        patterns: {
          typicalPaths: [activity.path],
          requestFrequency: 1,
          userAgents: [activity.userAgent],
          timePatterns: [new Date(activity.timestamp).getHours()],
          sessionDuration: 0
        },
        riskScore: 0,
        lastUpdated: activity.timestamp
      };
    } else {
      // Update patterns
      if (!profile.patterns.typicalPaths.includes(activity.path)) {
        profile.patterns.typicalPaths.push(activity.path);
        // Keep only last 50 paths
        if (profile.patterns.typicalPaths.length > 50) {
          profile.patterns.typicalPaths = profile.patterns.typicalPaths.slice(-50);
        }
      }
      
      if (!profile.patterns.userAgents.includes(activity.userAgent)) {
        profile.patterns.userAgents.push(activity.userAgent);
        // Keep only last 5 user agents
        if (profile.patterns.userAgents.length > 5) {
          profile.patterns.userAgents = profile.patterns.userAgents.slice(-5);
        }
      }
      
      const hour = new Date(activity.timestamp).getHours();
      if (!profile.patterns.timePatterns.includes(hour)) {
        profile.patterns.timePatterns.push(hour);
      }
      
      // Update request frequency (requests per hour)
      const timeDiff = activity.timestamp - profile.lastUpdated;
      if (timeDiff > 0) {
        profile.patterns.requestFrequency = (profile.patterns.requestFrequency + (60 * 60 * 1000 / timeDiff)) / 2;
      }
      
      profile.lastUpdated = activity.timestamp;
    }
    
    this.behaviorProfiles.set(ip, profile);
  }

  // Query methods
  getEvents(filter: {
    severity?: string;
    type?: string;
    ip?: string;
    timeRange?: { start: number; end: number };
    limit?: number;
  } = {}): SecurityEvent[] {
    const events: SecurityEvent[] = [];
    
    for (const [, event] of this.events.entries()) {
      // Apply filters
      if (filter.severity && event.severity !== filter.severity) continue;
      if (filter.type && event.type !== filter.type) continue;
      if (filter.ip && event.source.ip !== filter.ip) continue;
      if (filter.timeRange) {
        if (event.timestamp < filter.timeRange.start || event.timestamp > filter.timeRange.end) {
          continue;
        }
      }
      
      events.push(event);
    }
    
    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit
    if (filter.limit) {
      return events.slice(0, filter.limit);
    }
    
    return events;
  }

  getTopThreats(limit: number = 10): Array<{
    ip: string;
    eventCount: number;
    maxSeverity: string;
    riskScore: number;
    lastSeen: Date;
  }> {
    const threatMap = new Map<string, {
      count: number;
      maxSeverity: string;
      riskScore: number;
      lastSeen: number;
    }>();
    
    for (const [, event] of this.events.entries()) {
      const ip = event.source.ip;
      const existing = threatMap.get(ip) || {
        count: 0,
        maxSeverity: 'low',
        riskScore: 0,
        lastSeen: 0
      };
      
      existing.count++;
      existing.riskScore = Math.max(existing.riskScore, event.details.riskScore);
      existing.lastSeen = Math.max(existing.lastSeen, event.timestamp);
      
      const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
      if (severityOrder[event.severity as keyof typeof severityOrder] > 
          severityOrder[existing.maxSeverity as keyof typeof severityOrder]) {
        existing.maxSeverity = event.severity;
      }
      
      threatMap.set(ip, existing);
    }
    
    return Array.from(threatMap.entries())
      .map(([ip, data]) => ({
        ip,
        eventCount: data.count,
        maxSeverity: data.maxSeverity,
        riskScore: data.riskScore,
        lastSeen: new Date(data.lastSeen)
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, limit);
  }

  getBehaviorProfile(ip: string): BehaviorProfile | null {
    return this.behaviorProfiles.get(ip) || null;
  }

  addThreatIntelligence(intel: ThreatIntelligence): void {
    this.threatIntel.set(intel.ip, intel);
  }

  // Configuration updates
  updateConfig(newConfig: Partial<IDSConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Global IDS instance
export const intrusionDetectionSystem = new IntrusionDetectionSystem();

// Middleware wrapper
export function withIntrusionDetection(
  handler: (req: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    // Analyze request before processing
    const events = intrusionDetectionSystem.analyzeRequest(request);
    
    // Check if any critical events require immediate blocking
    const criticalEvents = events.filter(e => 
      e.severity === 'critical' && e.mitigation?.action === 'block'
    );
    
    if (criticalEvents.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Request blocked by security policy',
          code: 'SECURITY_BLOCKED',
          eventId: criticalEvents[0].id
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Process request normally
    return handler(request);
  };
}
