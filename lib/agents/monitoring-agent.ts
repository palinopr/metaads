/**
 * Agent 8: Monitoring Agent
 * Implements comprehensive monitoring and alerting
 */

import { BaseAgent, Task } from './base-agent';

export class MonitoringAgent extends BaseAgent {
  constructor() {
    super('Monitoring');
    this.tasks = this.getTasks();
  }

  getTasks(): Task[] {
    return [
      {
        id: 'mon-1',
        name: 'Setup error tracking',
        description: 'Implement Sentry integration',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'mon-2',
        name: 'Create health checks',
        description: 'API and service health monitoring',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'mon-3',
        name: 'Add metrics collection',
        description: 'Business and technical metrics',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'mon-4',
        name: 'Implement alerting',
        description: 'Real-time alerts for critical issues',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'mon-5',
        name: 'Create dashboards',
        description: 'Monitoring dashboards and visualizations',
        priority: 'low',
        status: 'pending'
      }
    ];
  }

  async execute(): Promise<void> {
    this.log('Starting monitoring setup...');
    
    for (const task of this.tasks) {
      await this.executeTask(task);
    }
  }

  protected async performTask(task: Task): Promise<void> {
    switch (task.id) {
      case 'mon-1':
        await this.setupErrorTracking();
        break;
      case 'mon-2':
        await this.createHealthChecks();
        break;
      case 'mon-3':
        await this.addMetricsCollection();
        break;
      case 'mon-4':
        await this.implementAlerting();
        break;
      case 'mon-5':
        await this.createDashboards();
        break;
    }
  }

  private async setupErrorTracking() {
    await this.writeFile('lib/monitoring/error-tracking.ts', `
import * as Sentry from '@sentry/nextjs';

export interface ErrorContext {
  userId?: string;
  campaignId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export class ErrorTracker {
  private initialized = false;

  initialize() {
    if (this.initialized || !process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return;
    }

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === 'development',
      
      beforeSend(event, hint) {
        // Filter out non-error events in production
        if (process.env.NODE_ENV === 'production' && !hint.originalException) {
          return null;
        }

        // Sanitize sensitive data
        if (event.request?.cookies) {
          event.request.cookies = '[REDACTED]';
        }

        return event;
      },

      integrations: [
        new Sentry.BrowserTracing({
          tracingOrigins: ['localhost', /^https:\\/\\/yourapp\\.com/],
          routingInstrumentation: Sentry.nextRouterInstrumentation,
        }),
      ],
    });

    this.initialized = true;
  }

  captureException(error: Error, context?: ErrorContext) {
    console.error('Error captured:', error);

    if (!this.initialized) {
      return;
    }

    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('custom', context);
        if (context.userId) {
          scope.setUser({ id: context.userId });
        }
        if (context.metadata) {
          Object.entries(context.metadata).forEach(([key, value]) => {
            scope.setTag(key, String(value));
          });
        }
      }

      Sentry.captureException(error);
    });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!this.initialized) {
      console.log(\`[\${level.toUpperCase()}] \${message}\`);
      return;
    }

    Sentry.captureMessage(message, level);
  }

  setUser(user: { id: string; email?: string; username?: string }) {
    if (this.initialized) {
      Sentry.setUser(user);
    }
  }

  clearUser() {
    if (this.initialized) {
      Sentry.setUser(null);
    }
  }

  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: 'debug' | 'info' | 'warning' | 'error';
    data?: Record<string, any>;
  }) {
    if (this.initialized) {
      Sentry.addBreadcrumb(breadcrumb);
    }
  }

  startTransaction(name: string, op: string) {
    if (!this.initialized) {
      return null;
    }

    return Sentry.startTransaction({ name, op });
  }

  // React Error Boundary integration
  createErrorBoundary() {
    return Sentry.ErrorBoundary;
  }

  // Performance monitoring
  measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const transaction = this.startTransaction(operation, 'function');
    
    return fn()
      .then(result => {
        transaction?.setStatus('ok');
        return result;
      })
      .catch(error => {
        transaction?.setStatus('internal_error');
        throw error;
      })
      .finally(() => {
        transaction?.finish();
      });
  }
}

export const errorTracker = new ErrorTracker();

// React hook for error tracking
import { useEffect } from 'react';

export function useErrorTracking(componentName: string) {
  useEffect(() => {
    errorTracker.addBreadcrumb({
      message: \`Component mounted: \${componentName}\`,
      category: 'component',
      level: 'info'
    });

    return () => {
      errorTracker.addBreadcrumb({
        message: \`Component unmounted: \${componentName}\`,
        category: 'component',
        level: 'info'
      });
    };
  }, [componentName]);

  return {
    trackError: (error: Error, context?: ErrorContext) => {
      errorTracker.captureException(error, {
        ...context,
        component: componentName
      });
    },
    trackEvent: (event: string, data?: Record<string, any>) => {
      errorTracker.addBreadcrumb({
        message: event,
        category: 'user-action',
        data: { ...data, component: componentName }
      });
    }
  };
}

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.captureException(
      new Error(\`Unhandled promise rejection: \${event.reason}\`),
      { action: 'unhandledrejection' }
    );
  });

  window.addEventListener('error', (event) => {
    errorTracker.captureException(
      event.error || new Error(event.message),
      { action: 'global-error' }
    );
  });
}
`);

    this.log('Error tracking setup complete');
  }

  private async createHealthChecks() {
    await this.writeFile('lib/monitoring/health-checks.ts', `
export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  duration: number;
  details?: Record<string, any>;
  error?: string;
}

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheckResult[];
  timestamp: Date;
}

export class HealthChecker {
  private checks: Map<string, () => Promise<HealthCheckResult>> = new Map();
  private cache: Map<string, { result: HealthCheckResult; expires: number }> = new Map();
  private cacheTTL = 30000; // 30 seconds

  register(name: string, check: () => Promise<HealthCheckResult>) {
    this.checks.set(name, check);
  }

  async checkHealth(useCache = true): Promise<HealthStatus> {
    const results: HealthCheckResult[] = [];
    const now = Date.now();

    for (const [name, check] of this.checks.entries()) {
      // Check cache
      const cached = this.cache.get(name);
      if (useCache && cached && cached.expires > now) {
        results.push(cached.result);
        continue;
      }

      // Run health check
      const startTime = Date.now();
      try {
        const result = await this.withTimeout(check(), 5000);
        result.duration = Date.now() - startTime;
        results.push(result);

        // Cache result
        this.cache.set(name, {
          result,
          expires: now + this.cacheTTL
        });
      } catch (error) {
        const result: HealthCheckResult = {
          service: name,
          status: 'unhealthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          error: error.message
        };
        results.push(result);
      }
    }

    // Determine overall status
    const hasUnhealthy = results.some(r => r.status === 'unhealthy');
    const hasDegraded = results.some(r => r.status === 'degraded');
    
    let overall: HealthStatus['overall'];
    if (hasUnhealthy) {
      overall = 'unhealthy';
    } else if (hasDegraded) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      checks: results,
      timestamp: new Date()
    };
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), ms)
      )
    ]);
  }

  // Built-in health checks
  static createDatabaseCheck(db: any): () => Promise<HealthCheckResult> {
    return async () => {
      const startTime = Date.now();
      try {
        await db.query('SELECT 1');
        return {
          service: 'database',
          status: 'healthy',
          timestamp: new Date(),
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          service: 'database',
          status: 'unhealthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          error: error.message
        };
      }
    };
  }

  static createAPICheck(url: string): () => Promise<HealthCheckResult> {
    return async () => {
      const startTime = Date.now();
      try {
        const response = await fetch(url);
        const status = response.ok ? 'healthy' : 'degraded';
        
        return {
          service: \`api:\${new URL(url).pathname}\`,
          status,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          details: {
            statusCode: response.status,
            statusText: response.statusText
          }
        };
      } catch (error) {
        return {
          service: \`api:\${new URL(url).pathname}\`,
          status: 'unhealthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          error: error.message
        };
      }
    };
  }

  static createRedisCheck(redis: any): () => Promise<HealthCheckResult> {
    return async () => {
      const startTime = Date.now();
      try {
        await redis.ping();
        return {
          service: 'redis',
          status: 'healthy',
          timestamp: new Date(),
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          service: 'redis',
          status: 'unhealthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          error: error.message
        };
      }
    };
  }

  static createDiskSpaceCheck(threshold = 0.9): () => Promise<HealthCheckResult> {
    return async () => {
      const startTime = Date.now();
      try {
        // This would use a system library to check disk space
        const usage = 0.7; // Mock value
        
        return {
          service: 'disk-space',
          status: usage > threshold ? 'degraded' : 'healthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          details: {
            usage: \`\${(usage * 100).toFixed(1)}%\`,
            threshold: \`\${(threshold * 100).toFixed(1)}%\`
          }
        };
      } catch (error) {
        return {
          service: 'disk-space',
          status: 'unhealthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          error: error.message
        };
      }
    };
  }

  static createMemoryCheck(threshold = 0.9): () => Promise<HealthCheckResult> {
    return async () => {
      const startTime = Date.now();
      try {
        const usage = process.memoryUsage();
        const totalMemory = require('os').totalmem();
        const usagePercent = usage.heapUsed / totalMemory;
        
        return {
          service: 'memory',
          status: usagePercent > threshold ? 'degraded' : 'healthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          details: {
            heapUsed: \`\${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB\`,
            heapTotal: \`\${(usage.heapTotal / 1024 / 1024).toFixed(2)}MB\`,
            usage: \`\${(usagePercent * 100).toFixed(1)}%\`
          }
        };
      } catch (error) {
        return {
          service: 'memory',
          status: 'unhealthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          error: error.message
        };
      }
    };
  }
}

// Global health checker instance
export const healthChecker = new HealthChecker();

// Register default checks
healthChecker.register('memory', HealthChecker.createMemoryCheck());
healthChecker.register('meta-api', HealthChecker.createAPICheck('https://graph.facebook.com/v18.0/me'));

// Health check API endpoint
export async function handleHealthCheck(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const detailed = searchParams.get('detailed') === 'true';
  
  const health = await healthChecker.checkHealth();
  
  const status = health.overall === 'healthy' ? 200 : 
                 health.overall === 'degraded' ? 206 : 503;

  const body = detailed ? health : {
    status: health.overall,
    timestamp: health.timestamp
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}
`);

    this.log('Health checks created');
  }

  private async addMetricsCollection() {
    await this.writeFile('lib/monitoring/metrics.ts', `
export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

export interface MetricOptions {
  tags?: Record<string, string>;
  buckets?: number[]; // For histograms
  percentiles?: number[]; // For summaries
}

export class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;
  private flushIntervalMs = 60000; // 1 minute

  constructor() {
    this.startFlushInterval();
  }

  private startFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  increment(name: string, value = 1, tags?: Record<string, string>) {
    const key = this.getKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
    
    this.recordMetric({
      name,
      value: current + value,
      timestamp: new Date(),
      tags,
      type: 'counter'
    });
  }

  decrement(name: string, value = 1, tags?: Record<string, string>) {
    this.increment(name, -value, tags);
  }

  gauge(name: string, value: number, tags?: Record<string, string>) {
    const key = this.getKey(name, tags);
    this.gauges.set(key, value);
    
    this.recordMetric({
      name,
      value,
      timestamp: new Date(),
      tags,
      type: 'gauge'
    });
  }

  histogram(name: string, value: number, tags?: Record<string, string>) {
    const key = this.getKey(name, tags);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
    
    this.recordMetric({
      name,
      value,
      timestamp: new Date(),
      tags,
      type: 'histogram'
    });
  }

  timing(name: string, duration: number, tags?: Record<string, string>) {
    this.histogram(\`\${name}.duration\`, duration, tags);
  }

  // Measure async operation duration
  async measure<T>(
    name: string,
    operation: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      this.timing(name, Date.now() - startTime, { ...tags, status: 'success' });
      return result;
    } catch (error) {
      this.timing(name, Date.now() - startTime, { ...tags, status: 'error' });
      throw error;
    }
  }

  // Get summary statistics for histograms
  getSummary(name: string, tags?: Record<string, string>): {
    count: number;
    min: number;
    max: number;
    mean: number;
    median: number;
    p95: number;
    p99: number;
  } | null {
    const key = this.getKey(name, tags);
    const values = this.histograms.get(key);
    
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count,
      min: sorted[0],
      max: sorted[count - 1],
      mean: sum / count,
      median: sorted[Math.floor(count / 2)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)]
    };
  }

  private getKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }

    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => \`\${k}:\${v}\`)
      .join(',');

    return \`\${name}{\${tagStr}}\`;
  }

  private recordMetric(metric: Metric) {
    const metrics = this.metrics.get(metric.name) || [];
    metrics.push(metric);
    
    // Keep only last 1000 metrics per name
    if (metrics.length > 1000) {
      metrics.shift();
    }
    
    this.metrics.set(metric.name, metrics);
  }

  async flush() {
    const allMetrics = Array.from(this.metrics.entries()).flatMap(([_, metrics]) => metrics);
    
    if (allMetrics.length === 0) {
      return;
    }

    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: allMetrics })
      });

      // Clear sent metrics
      this.metrics.clear();
    } catch (error) {
      console.error('Failed to flush metrics:', error);
    }
  }

  getMetrics(): Map<string, Metric[]> {
    return new Map(this.metrics);
  }

  reset() {
    this.metrics.clear();
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}

// Global metrics instance
export const metrics = new MetricsCollector();

// Common business metrics
export const businessMetrics = {
  campaignCreated: (campaignId: string) => {
    metrics.increment('campaigns.created', 1, { campaignId });
  },

  campaignUpdated: (campaignId: string, field: string) => {
    metrics.increment('campaigns.updated', 1, { campaignId, field });
  },

  apiCall: (endpoint: string, method: string, status: number, duration: number) => {
    metrics.increment('api.calls', 1, { endpoint, method, status: status.toString() });
    metrics.timing('api.duration', duration, { endpoint, method });
  },

  revenue: (amount: number, campaignId: string, source: string) => {
    metrics.increment('revenue.total', amount, { campaignId, source });
    metrics.gauge('revenue.current', amount, { campaignId });
  },

  error: (type: string, severity: 'low' | 'medium' | 'high' | 'critical') => {
    metrics.increment('errors', 1, { type, severity });
  },

  userAction: (action: string, component: string) => {
    metrics.increment('user.actions', 1, { action, component });
  }
};

// React hook for metrics
import { useCallback } from 'react';

export function useMetrics(component: string) {
  const track = useCallback((action: string, value?: number, tags?: Record<string, string>) => {
    metrics.increment(\`ui.\${action}\`, value || 1, { component, ...tags });
  }, [component]);

  const trackTiming = useCallback((action: string, duration: number, tags?: Record<string, string>) => {
    metrics.timing(\`ui.\${action}\`, duration, { component, ...tags });
  }, [component]);

  const trackError = useCallback((error: string, severity: string) => {
    businessMetrics.error(error, severity as any);
  }, []);

  return { track, trackTiming, trackError };
}
`);

    this.log('Metrics collection added');
  }

  private async implementAlerting() {
    await this.writeFile('lib/monitoring/alerting.ts', `
export interface Alert {
  id: string;
  name: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  condition: AlertCondition;
  actions: AlertAction[];
  cooldown: number; // Minutes before re-alerting
  enabled: boolean;
}

export interface AlertCondition {
  type: 'threshold' | 'anomaly' | 'pattern' | 'absence';
  metric?: string;
  operator?: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold?: number;
  window?: number; // Minutes
  pattern?: RegExp;
}

export interface AlertAction {
  type: 'email' | 'slack' | 'webhook' | 'log';
  config: Record<string, any>;
}

export interface AlertEvent {
  alertId: string;
  timestamp: Date;
  severity: Alert['severity'];
  message: string;
  context: Record<string, any>;
  resolved: boolean;
}

export class AlertManager {
  private alerts: Map<string, Alert> = new Map();
  private activeAlerts: Map<string, AlertEvent> = new Map();
  private alertHistory: AlertEvent[] = [];
  private lastAlertTime: Map<string, number> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupDefaultAlerts();
    this.startMonitoring();
  }

  private setupDefaultAlerts() {
    // High error rate alert
    this.addAlert({
      id: 'high-error-rate',
      name: 'High Error Rate',
      severity: 'error',
      condition: {
        type: 'threshold',
        metric: 'errors',
        operator: '>',
        threshold: 10,
        window: 5
      },
      actions: [
        { type: 'log', config: {} },
        { type: 'email', config: { to: 'admin@example.com' } }
      ],
      cooldown: 30,
      enabled: true
    });

    // API response time alert
    this.addAlert({
      id: 'slow-api',
      name: 'Slow API Response',
      severity: 'warning',
      condition: {
        type: 'threshold',
        metric: 'api.duration.p95',
        operator: '>',
        threshold: 3000,
        window: 10
      },
      actions: [
        { type: 'log', config: {} }
      ],
      cooldown: 15,
      enabled: true
    });

    // Service health alert
    this.addAlert({
      id: 'service-unhealthy',
      name: 'Service Unhealthy',
      severity: 'critical',
      condition: {
        type: 'pattern',
        pattern: /unhealthy/,
        metric: 'health.status'
      },
      actions: [
        { type: 'log', config: {} },
        { type: 'slack', config: { channel: '#alerts' } }
      ],
      cooldown: 5,
      enabled: true
    });
  }

  addAlert(alert: Alert) {
    this.alerts.set(alert.id, alert);
  }

  removeAlert(id: string) {
    this.alerts.delete(id);
  }

  enableAlert(id: string) {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.enabled = true;
    }
  }

  disableAlert(id: string) {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.enabled = false;
    }
  }

  private startMonitoring() {
    this.checkInterval = setInterval(() => {
      this.checkAlerts();
    }, 60000); // Check every minute
  }

  private async checkAlerts() {
    for (const alert of this.alerts.values()) {
      if (!alert.enabled) continue;

      try {
        const shouldAlert = await this.evaluateCondition(alert.condition);
        
        if (shouldAlert) {
          this.triggerAlert(alert);
        } else {
          this.resolveAlert(alert.id);
        }
      } catch (error) {
        console.error(\`Error checking alert \${alert.id}:\`, error);
      }
    }
  }

  private async evaluateCondition(condition: AlertCondition): Promise<boolean> {
    switch (condition.type) {
      case 'threshold':
        return this.evaluateThreshold(condition);
      
      case 'anomaly':
        return this.evaluateAnomaly(condition);
      
      case 'pattern':
        return this.evaluatePattern(condition);
      
      case 'absence':
        return this.evaluateAbsence(condition);
      
      default:
        return false;
    }
  }

  private async evaluateThreshold(condition: AlertCondition): Promise<boolean> {
    // Get metric value (this would integrate with your metrics system)
    const value = await this.getMetricValue(condition.metric!, condition.window);
    
    switch (condition.operator) {
      case '>': return value > condition.threshold!;
      case '<': return value < condition.threshold!;
      case '>=': return value >= condition.threshold!;
      case '<=': return value <= condition.threshold!;
      case '==': return value === condition.threshold!;
      case '!=': return value !== condition.threshold!;
      default: return false;
    }
  }

  private async evaluateAnomaly(condition: AlertCondition): Promise<boolean> {
    // Implement anomaly detection logic
    return false;
  }

  private async evaluatePattern(condition: AlertCondition): Promise<boolean> {
    // Get recent logs or events
    const events = await this.getRecentEvents(condition.window || 5);
    return events.some(event => condition.pattern!.test(event));
  }

  private async evaluateAbsence(condition: AlertCondition): Promise<boolean> {
    // Check if expected event hasn't occurred
    const lastEvent = await this.getLastEventTime(condition.metric!);
    const minutesSinceLastEvent = (Date.now() - lastEvent) / 60000;
    return minutesSinceLastEvent > (condition.window || 60);
  }

  private triggerAlert(alert: Alert) {
    // Check cooldown
    const lastAlert = this.lastAlertTime.get(alert.id) || 0;
    const minutesSinceLastAlert = (Date.now() - lastAlert) / 60000;
    
    if (minutesSinceLastAlert < alert.cooldown) {
      return;
    }

    // Create alert event
    const event: AlertEvent = {
      alertId: alert.id,
      timestamp: new Date(),
      severity: alert.severity,
      message: \`Alert: \${alert.name}\`,
      context: {},
      resolved: false
    };

    // Store alert
    this.activeAlerts.set(alert.id, event);
    this.alertHistory.push(event);
    this.lastAlertTime.set(alert.id, Date.now());

    // Execute actions
    alert.actions.forEach(action => this.executeAction(action, event));
  }

  private resolveAlert(alertId: string) {
    const activeAlert = this.activeAlerts.get(alertId);
    if (activeAlert) {
      activeAlert.resolved = true;
      this.activeAlerts.delete(alertId);
      
      // Notify resolution
      const alert = this.alerts.get(alertId);
      if (alert) {
        const resolutionEvent = {
          ...activeAlert,
          message: \`Resolved: \${alert.name}\`,
          resolved: true
        };
        
        alert.actions.forEach(action => 
          this.executeAction(action, resolutionEvent)
        );
      }
    }
  }

  private async executeAction(action: AlertAction, event: AlertEvent) {
    try {
      switch (action.type) {
        case 'log':
          console.log(\`[ALERT] \${event.severity.toUpperCase()}: \${event.message}\`);
          break;
          
        case 'email':
          await this.sendEmail(action.config, event);
          break;
          
        case 'slack':
          await this.sendSlack(action.config, event);
          break;
          
        case 'webhook':
          await this.sendWebhook(action.config, event);
          break;
      }
    } catch (error) {
      console.error(\`Failed to execute alert action \${action.type}:\`, error);
    }
  }

  private async sendEmail(config: any, event: AlertEvent) {
    // Implement email sending
    await fetch('/api/alerts/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: config.to,
        subject: \`[\${event.severity.toUpperCase()}] \${event.message}\`,
        body: JSON.stringify(event, null, 2)
      })
    });
  }

  private async sendSlack(config: any, event: AlertEvent) {
    // Implement Slack webhook
    const color = {
      info: '#36a64f',
      warning: '#ff9900',
      error: '#ff0000',
      critical: '#990000'
    }[event.severity];

    await fetch(config.webhookUrl || process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: config.channel,
        attachments: [{
          color,
          title: event.message,
          fields: [
            { title: 'Severity', value: event.severity, short: true },
            { title: 'Time', value: event.timestamp.toISOString(), short: true }
          ],
          footer: 'Alert System',
          ts: Math.floor(event.timestamp.getTime() / 1000)
        }]
      })
    });
  }

  private async sendWebhook(config: any, event: AlertEvent) {
    await fetch(config.url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify(event)
    });
  }

  // Placeholder methods - these would integrate with your actual systems
  private async getMetricValue(metric: string, window?: number): Promise<number> {
    // Implement metric fetching
    return 0;
  }

  private async getRecentEvents(minutes: number): Promise<string[]> {
    // Implement event fetching
    return [];
  }

  private async getLastEventTime(metric: string): Promise<number> {
    // Implement last event time fetching
    return Date.now();
  }

  getActiveAlerts(): AlertEvent[] {
    return Array.from(this.activeAlerts.values());
  }

  getAlertHistory(limit = 100): AlertEvent[] {
    return this.alertHistory.slice(-limit);
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const alertManager = new AlertManager();
`);

    this.log('Alerting system implemented');
  }

  private async createDashboards() {
    await this.writeFile('components/monitoring/dashboard.tsx', `
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, 
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { healthChecker } from '@/lib/monitoring/health-checks';
import { metrics } from '@/lib/monitoring/metrics';
import { alertManager } from '@/lib/monitoring/alerting';
import { performanceMonitor } from '@/lib/performance/monitoring';

export function MonitoringDashboard() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [businessMetrics, setBusinessMetrics] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      // Update health status
      const health = await healthChecker.checkHealth();
      setHealthStatus(health);

      // Update alerts
      setActiveAlerts(alertManager.getActiveAlerts());

      // Update performance metrics
      const perfMetrics = performanceMonitor.getMetrics();
      const perfScore = performanceMonitor.calculateScore();
      setPerformanceMetrics({ ...perfMetrics, score: perfScore });

      // Update business metrics
      const metricsData = metrics.getMetrics();
      setBusinessMetrics(processMetricsData(metricsData));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <Badge variant={getHealthVariant(healthStatus?.overall)}>
          {healthStatus?.overall || 'Loading...'}
        </Badge>
      </div>

      {/* Alerts Section */}
      {activeAlerts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeAlerts.map(alert => (
                <div key={alert.alertId} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                  <span className="font-medium">{alert.message}</span>
                  <Badge variant="destructive">{alert.severity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="business">Business Metrics</TabsTrigger>
          <TabsTrigger value="technical">Technical Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <HealthDashboard status={healthStatus} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceDashboard metrics={performanceMetrics} />
        </TabsContent>

        <TabsContent value="business">
          <BusinessMetricsDashboard metrics={businessMetrics} />
        </TabsContent>

        <TabsContent value="technical">
          <TechnicalMetricsDashboard metrics={businessMetrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HealthDashboard({ status }) {
  if (!status) return <div>Loading...</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {status.checks.map(check => (
        <Card key={check.service}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {check.service}
              <Badge variant={getHealthVariant(check.status)}>
                {check.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Response time: {check.duration}ms
            </p>
            {check.error && (
              <p className="text-sm text-destructive mt-2">{check.error}</p>
            )}
            {check.details && (
              <div className="mt-2 space-y-1">
                {Object.entries(check.details).map(([key, value]) => (
                  <p key={key} className="text-sm">
                    <span className="font-medium">{key}:</span> {value}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PerformanceDashboard({ metrics }) {
  if (!metrics) return <div>Loading...</div>;

  const webVitals = [
    { name: 'FCP', value: metrics.fcp, good: 1800, poor: 3000 },
    { name: 'LCP', value: metrics.lcp, good: 2500, poor: 4000 },
    { name: 'FID', value: metrics.fid, good: 100, poor: 300 },
    { name: 'CLS', value: metrics.cls, good: 0.1, poor: 0.25 },
    { name: 'TTFB', value: metrics.ttfb, good: 800, poor: 1800 },
    { name: 'INP', value: metrics.inp, good: 200, poor: 500 }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Score</CardTitle>
          <CardDescription>Overall performance health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{metrics.score}/100</span>
              <Badge variant={metrics.score > 90 ? 'success' : metrics.score > 70 ? 'warning' : 'destructive'}>
                {metrics.score > 90 ? 'Good' : metrics.score > 70 ? 'Needs Improvement' : 'Poor'}
              </Badge>
            </div>
            <Progress value={metrics.score} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {webVitals.map(vital => (
          <Card key={vital.name}>
            <CardHeader>
              <CardTitle>{vital.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {vital.value ? \`\${vital.value}ms\` : 'N/A'}
              </p>
              <Badge variant={
                !vital.value ? 'outline' :
                vital.value <= vital.good ? 'success' :
                vital.value <= vital.poor ? 'warning' : 'destructive'
              }>
                {!vital.value ? 'Pending' :
                 vital.value <= vital.good ? 'Good' :
                 vital.value <= vital.poor ? 'Needs Improvement' : 'Poor'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BusinessMetricsDashboard({ metrics }) {
  if (!metrics) return <div>Loading...</div>;

  // Mock data for demonstration
  const revenueData = [
    { date: '2024-01-01', revenue: 12000 },
    { date: '2024-01-02', revenue: 15000 },
    { date: '2024-01-03', revenue: 13500 },
    { date: '2024-01-04', revenue: 18000 },
    { date: '2024-01-05', revenue: 22000 },
  ];

  const campaignMetrics = [
    { name: 'Active', value: 45, fill: '#10b981' },
    { name: 'Paused', value: 12, fill: '#f59e0b' },
    { name: 'Ended', value: 8, fill: '#6b7280' },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={campaignMetrics}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => \`\${name} \${(percent * 100).toFixed(0)}%\`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {campaignMetrics.map((entry, index) => (
                  <Cell key={\`cell-\${index}\`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function TechnicalMetricsDashboard({ metrics }) {
  if (!metrics) return <div>Loading...</div>;

  // Mock data
  const apiMetrics = [
    { endpoint: '/api/campaigns', calls: 1250, avgDuration: 245, errorRate: 0.02 },
    { endpoint: '/api/meta', calls: 890, avgDuration: 520, errorRate: 0.05 },
    { endpoint: '/api/analytics', calls: 450, avgDuration: 180, errorRate: 0.01 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiMetrics.map(api => (
              <div key={api.endpoint} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{api.endpoint}</span>
                  <span className="text-sm text-muted-foreground">{api.calls} calls</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Avg Duration: </span>
                    <span className="font-medium">{api.avgDuration}ms</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Error Rate: </span>
                    <span className="font-medium">{(api.errorRate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getHealthVariant(status) {
  switch (status) {
    case 'healthy': return 'success';
    case 'degraded': return 'warning';
    case 'unhealthy': return 'destructive';
    default: return 'outline';
  }
}

function processMetricsData(metricsMap) {
  // Process raw metrics into dashboard-friendly format
  // This is a placeholder implementation
  return {};
}
`);

    this.log('Monitoring dashboards created');
  }
}