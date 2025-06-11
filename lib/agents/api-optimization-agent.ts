/**
 * Agent 3: API Optimization Agent
 * Optimizes API calls, implements rate limiting, and batch operations
 */

import { BaseAgent, Task } from './base-agent';

export class APIOptimizationAgent extends BaseAgent {
  constructor() {
    super('APIOptimization');
    this.tasks = this.getTasks();
  }

  getTasks(): Task[] {
    return [
      {
        id: 'api-1',
        name: 'Implement rate limiting',
        description: 'Prevent API rate limit errors',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'api-2',
        name: 'Create batch operations',
        description: 'Batch multiple API calls',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'api-3',
        name: 'Add request deduplication',
        description: 'Prevent duplicate API calls',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'api-4',
        name: 'Implement retry logic',
        description: 'Smart retry with exponential backoff',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'api-5',
        name: 'Create API monitoring',
        description: 'Track API performance and errors',
        priority: 'low',
        status: 'pending'
      }
    ];
  }

  async execute(): Promise<void> {
    this.log('Starting API optimization...');
    
    for (const task of this.tasks) {
      await this.executeTask(task);
    }
  }

  protected async performTask(task: Task): Promise<void> {
    switch (task.id) {
      case 'api-1':
        await this.implementRateLimiting();
        break;
      case 'api-2':
        await this.createBatchOperations();
        break;
      case 'api-3':
        await this.addRequestDeduplication();
        break;
      case 'api-4':
        await this.implementRetryLogic();
        break;
      case 'api-5':
        await this.createAPIMonitoring();
        break;
    }
  }

  private async implementRateLimiting() {
    await this.writeFile('lib/services/rate-limiter.ts', `
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  maxBurst?: number;
}

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
  queue: Array<() => void>;
}

export class RateLimiter {
  private buckets: Map<string, RateLimitBucket> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      maxBurst: config.maxRequests,
      ...config
    };
  }

  async acquire(key: string = 'default'): Promise<void> {
    const bucket = this.getBucket(key);
    this.refillTokens(bucket);

    if (bucket.tokens > 0) {
      bucket.tokens--;
      return;
    }

    // Wait for token to be available
    return new Promise<void>((resolve) => {
      bucket.queue.push(resolve);
      this.scheduleRefill(key);
    });
  }

  private getBucket(key: string): RateLimitBucket {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: this.config.maxBurst!,
        lastRefill: Date.now(),
        queue: []
      });
    }
    return this.buckets.get(key)!;
  }

  private refillTokens(bucket: RateLimitBucket) {
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(
      (timePassed / this.config.windowMs) * this.config.maxRequests
    );

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(
        bucket.tokens + tokensToAdd,
        this.config.maxBurst!
      );
      bucket.lastRefill = now;

      // Process queued requests
      while (bucket.tokens > 0 && bucket.queue.length > 0) {
        const resolve = bucket.queue.shift()!;
        bucket.tokens--;
        resolve();
      }
    }
  }

  private scheduleRefill(key: string) {
    const bucket = this.getBucket(key);
    const timeToNextToken = this.config.windowMs / this.config.maxRequests;

    setTimeout(() => {
      this.refillTokens(bucket);
      if (bucket.queue.length > 0) {
        this.scheduleRefill(key);
      }
    }, timeToNextToken);
  }

  reset(key?: string) {
    if (key) {
      this.buckets.delete(key);
    } else {
      this.buckets.clear();
    }
  }

  getStatus(key: string = 'default') {
    const bucket = this.getBucket(key);
    this.refillTokens(bucket);
    
    return {
      availableTokens: bucket.tokens,
      queuedRequests: bucket.queue.length,
      maxTokens: this.config.maxBurst!
    };
  }
}

// Meta API rate limiter (200 calls per hour)
export const metaRateLimiter = new RateLimiter({
  maxRequests: 200,
  windowMs: 60 * 60 * 1000, // 1 hour
  maxBurst: 50 // Allow burst of 50
});

// Enhanced Meta API client with rate limiting
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  limiter: RateLimiter = metaRateLimiter
): T {
  return (async (...args: Parameters<T>) => {
    await limiter.acquire();
    return fn(...args);
  }) as T;
}
`);

    this.log('Rate limiting implemented');
  }

  private async createBatchOperations() {
    await this.writeFile('lib/services/batch-api.ts', `
import { metaRateLimiter } from './rate-limiter';

interface BatchRequest {
  id: string;
  method: string;
  relative_url: string;
  body?: string;
}

interface BatchResponse {
  code: number;
  headers: Array<{ name: string; value: string }>;
  body: string;
}

export class BatchAPI {
  private accessToken: string = '';
  private batchQueue: BatchRequest[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private maxBatchSize = 50;
  private batchDelayMs = 100;

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  async addToBatch(request: Omit<BatchRequest, 'id'>): Promise<any> {
    const id = \`req_\${Date.now()}_\${Math.random()}\`;
    const batchRequest: BatchRequest = { id, ...request };
    
    this.batchQueue.push(batchRequest);

    // Schedule batch execution
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.executeBatch(), this.batchDelayMs);
    }

    // Execute immediately if batch is full
    if (this.batchQueue.length >= this.maxBatchSize) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
      return this.executeBatch();
    }

    // Return promise that resolves when batch is executed
    return new Promise((resolve, reject) => {
      const checkResult = setInterval(() => {
        const result = this.getResult(id);
        if (result) {
          clearInterval(checkResult);
          if (result.error) {
            reject(result.error);
          } else {
            resolve(result.data);
          }
        }
      }, 50);
    });
  }

  private async executeBatch() {
    if (this.batchQueue.length === 0) return;

    const batch = this.batchQueue.splice(0, this.maxBatchSize);
    
    try {
      await metaRateLimiter.acquire();
      
      const response = await fetch('https://graph.facebook.com/v18.0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: this.accessToken,
          batch: batch
        })
      });

      if (!response.ok) {
        throw new Error(\`Batch request failed: \${response.statusText}\`);
      }

      const results: BatchResponse[] = await response.json();
      
      // Process results
      results.forEach((result, index) => {
        const request = batch[index];
        this.storeResult(request.id, {
          data: result.code === 200 ? JSON.parse(result.body) : null,
          error: result.code !== 200 ? { code: result.code, body: result.body } : null
        });
      });

    } catch (error) {
      // Mark all requests as failed
      batch.forEach(request => {
        this.storeResult(request.id, { error });
      });
    }

    // Continue processing if more requests
    if (this.batchQueue.length > 0) {
      this.batchTimeout = setTimeout(() => this.executeBatch(), this.batchDelayMs);
    }
  }

  private results = new Map<string, any>();

  private storeResult(id: string, result: any) {
    this.results.set(id, result);
    // Clean up old results
    setTimeout(() => this.results.delete(id), 60000);
  }

  private getResult(id: string) {
    return this.results.get(id);
  }
}

export const batchAPI = new BatchAPI();

// Helper function for batch operations
export async function batchGetCampaigns(campaignIds: string[]) {
  const promises = campaignIds.map(id => 
    batchAPI.addToBatch({
      method: 'GET',
      relative_url: \`/\${id}?fields=id,name,status,insights{spend,impressions,clicks,purchase_roas}\`
    })
  );

  return Promise.all(promises);
}
`);

    this.log('Batch operations created');
  }

  private async addRequestDeduplication() {
    await this.writeFile('lib/services/dedup-service.ts', `
interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

export class DeduplicationService {
  private pending = new Map<string, PendingRequest>();
  private ttl = 5000; // 5 seconds

  async dedupe<T>(
    key: string,
    factory: () => Promise<T>
  ): Promise<T> {
    // Clean expired entries
    this.cleanup();

    // Check if request is already pending
    const existing = this.pending.get(key);
    if (existing) {
      return existing.promise as Promise<T>;
    }

    // Create new request
    const promise = factory().finally(() => {
      // Remove from pending after completion
      setTimeout(() => this.pending.delete(key), 100);
    });

    this.pending.set(key, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, request] of this.pending.entries()) {
      if (now - request.timestamp > this.ttl) {
        this.pending.delete(key);
      }
    }
  }

  clear() {
    this.pending.clear();
  }

  getStats() {
    return {
      pendingRequests: this.pending.size,
      keys: Array.from(this.pending.keys())
    };
  }
}

export const dedupService = new DeduplicationService();

// Enhanced API client with deduplication
export function withDeduplication<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string
): T {
  return ((...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    return dedupService.dedupe(key, () => fn(...args));
  }) as T;
}
`);

    this.log('Request deduplication added');
  }

  private async implementRetryLogic() {
    await this.writeFile('lib/services/retry-service.ts', `
interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

export class RetryService {
  private defaultOptions: Required<RetryOptions> = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryCondition: (error) => {
      // Retry on network errors or 5xx status codes
      return !error.response || error.response.status >= 500;
    },
    onRetry: (error, attempt) => {
      console.warn(\`Retry attempt \${attempt}:\`, error.message);
    }
  };

  async retry<T>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: any;
    
    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === opts.maxAttempts || !opts.retryCondition(error)) {
          throw error;
        }
        
        opts.onRetry(error, attempt);
        
        const delay = Math.min(
          opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
          opts.maxDelay
        );
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const retryService = new RetryService();

// Decorator for automatic retry
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  options?: RetryOptions
): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: Parameters<T>) {
      return retryService.retry(
        () => originalMethod.apply(this, args),
        options
      );
    };
    
    return descriptor;
  };
}

// Meta API specific retry logic
export const metaAPIRetry = (fn: () => Promise<any>) => {
  return retryService.retry(fn, {
    maxAttempts: 3,
    retryCondition: (error) => {
      // Retry on rate limits, timeouts, and server errors
      if (error.code === 'RATE_LIMIT') return true;
      if (error.code === 'TIMEOUT') return true;
      if (error.response?.status >= 500) return true;
      if (error.response?.status === 429) return true;
      return false;
    },
    onRetry: (error, attempt) => {
      console.log(\`Meta API retry \${attempt}: \${error.message}\`);
    }
  });
};
`);

    this.log('Retry logic implemented');
  }

  private async createAPIMonitoring() {
    await this.writeFile('lib/services/api-monitor.ts', `
interface APIMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: Date;
  error?: string;
}

interface APIStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorRate: number;
  requestsPerMinute: number;
  slowestEndpoints: Array<{ endpoint: string; avgTime: number }>;
  errorsByEndpoint: Record<string, number>;
}

export class APIMonitor {
  private metrics: APIMetric[] = [];
  private maxMetrics = 1000;
  private listeners = new Set<(stats: APIStats) => void>();

  recordRequest(
    endpoint: string,
    method: string,
    startTime: number,
    status: number,
    error?: string
  ) {
    const metric: APIMetric = {
      endpoint,
      method,
      duration: Date.now() - startTime,
      status,
      timestamp: new Date(),
      error
    };

    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    this.notifyListeners();
  }

  getStats(windowMinutes: number = 60): APIStats {
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        requestsPerMinute: 0,
        slowestEndpoints: [],
        errorsByEndpoint: {}
      };
    }

    const successful = recentMetrics.filter(m => m.status >= 200 && m.status < 300);
    const failed = recentMetrics.filter(m => m.status >= 400 || m.error);
    
    // Calculate average response time
    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const avgResponseTime = totalDuration / recentMetrics.length;

    // Find slowest endpoints
    const endpointTimes = new Map<string, number[]>();
    recentMetrics.forEach(m => {
      if (!endpointTimes.has(m.endpoint)) {
        endpointTimes.set(m.endpoint, []);
      }
      endpointTimes.get(m.endpoint)!.push(m.duration);
    });

    const slowestEndpoints = Array.from(endpointTimes.entries())
      .map(([endpoint, times]) => ({
        endpoint,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);

    // Count errors by endpoint
    const errorsByEndpoint: Record<string, number> = {};
    failed.forEach(m => {
      errorsByEndpoint[m.endpoint] = (errorsByEndpoint[m.endpoint] || 0) + 1;
    });

    return {
      totalRequests: recentMetrics.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      averageResponseTime: Math.round(avgResponseTime),
      errorRate: (failed.length / recentMetrics.length) * 100,
      requestsPerMinute: recentMetrics.length / windowMinutes,
      slowestEndpoints,
      errorsByEndpoint
    };
  }

  // Middleware for automatic monitoring
  createMiddleware() {
    return (request: Request, next: (req: Request) => Promise<Response>) => {
      const startTime = Date.now();
      const endpoint = new URL(request.url).pathname;
      const method = request.method;

      return next(request)
        .then(response => {
          this.recordRequest(endpoint, method, startTime, response.status);
          return response;
        })
        .catch(error => {
          this.recordRequest(endpoint, method, startTime, 0, error.message);
          throw error;
        });
    };
  }

  onStatsUpdate(listener: (stats: APIStats) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const stats = this.getStats();
    this.listeners.forEach(listener => listener(stats));
  }

  clearMetrics() {
    this.metrics = [];
    this.notifyListeners();
  }
}

export const apiMonitor = new APIMonitor();
`);

    this.log('API monitoring created');
  }
}