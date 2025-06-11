/**
 * Agent 2: Data Pipeline Agent
 * Manages data flow, caching, and synchronization
 */

import { BaseAgent, Task } from './base-agent';

export class DataPipelineAgent extends BaseAgent {
  constructor() {
    super('DataPipeline');
    this.tasks = this.getTasks();
  }

  getTasks(): Task[] {
    return [
      {
        id: 'data-1',
        name: 'Implement caching layer',
        description: 'Setup Redis-like caching with IndexedDB',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'data-2',
        name: 'Create data synchronization',
        description: 'Background sync for campaign data',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'data-3',
        name: 'Setup queue system',
        description: 'Implement job queue for API calls',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'data-4',
        name: 'Build data transformation layer',
        description: 'Normalize and enrich API responses',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'data-5',
        name: 'Implement offline support',
        description: 'Enable offline data access',
        priority: 'low',
        status: 'pending'
      }
    ];
  }

  async execute(): Promise<void> {
    this.log('Starting data pipeline optimization...');
    
    for (const task of this.tasks) {
      await this.executeTask(task);
    }
  }

  protected async performTask(task: Task): Promise<void> {
    switch (task.id) {
      case 'data-1':
        await this.implementCaching();
        break;
      case 'data-2':
        await this.createDataSync();
        break;
      case 'data-3':
        await this.setupQueueSystem();
        break;
      case 'data-4':
        await this.buildTransformationLayer();
        break;
      case 'data-5':
        await this.implementOfflineSupport();
        break;
    }
  }

  private async implementCaching() {
    // Create cache service with IndexedDB
    await this.writeFile('lib/services/cache-service.ts', `
import Dexie, { Table } from 'dexie';

interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

class CacheDatabase extends Dexie {
  cache!: Table<CacheEntry>;

  constructor() {
    super('MetaAdsCache');
    this.version(1).stores({
      cache: 'key, timestamp, *tags'
    });
  }
}

export class CacheService {
  private db: CacheDatabase;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.db = new CacheDatabase();
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry && this.isValid(memEntry)) {
      return memEntry.value as T;
    }

    // Check IndexedDB
    const entry = await this.db.cache.get(key);
    if (!entry || !this.isValid(entry)) {
      return null;
    }

    // Store in memory cache
    this.memoryCache.set(key, entry);
    return entry.value as T;
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL, tags?: string[]) {
    const entry: CacheEntry = {
      key,
      value,
      timestamp: Date.now(),
      ttl,
      tags
    };

    // Store in both caches
    this.memoryCache.set(key, entry);
    await this.db.cache.put(entry);
  }

  async invalidate(key: string) {
    this.memoryCache.delete(key);
    await this.db.cache.delete(key);
  }

  async invalidateByTag(tag: string) {
    const entries = await this.db.cache.where('tags').equals(tag).toArray();
    
    for (const entry of entries) {
      this.memoryCache.delete(entry.key);
      await this.db.cache.delete(entry.key);
    }
  }

  async clear() {
    this.memoryCache.clear();
    await this.db.cache.clear();
  }

  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  // Cleanup expired entries
  async cleanup() {
    const now = Date.now();
    const expired = await this.db.cache
      .filter(entry => now - entry.timestamp >= entry.ttl)
      .toArray();

    for (const entry of expired) {
      await this.invalidate(entry.key);
    }
  }
}

export const cacheService = new CacheService();

// Run cleanup every minute
if (typeof window !== 'undefined') {
  setInterval(() => cacheService.cleanup(), 60000);
}
`);

    // Create React Query integration
    await this.writeFile('lib/hooks/use-cached-query.ts', `
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { cacheService } from '@/lib/services/cache-service';

interface CachedQueryOptions<T> extends UseQueryOptions<T> {
  cacheKey: string;
  cacheTTL?: number;
  tags?: string[];
}

export function useCachedQuery<T>({
  cacheKey,
  cacheTTL = 5 * 60 * 1000,
  tags,
  queryKey,
  queryFn,
  ...options
}: CachedQueryOptions<T>) {
  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      // Check cache first
      const cached = await cacheService.get<T>(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch fresh data
      const data = await queryFn!();
      
      // Store in cache
      await cacheService.set(cacheKey, data, cacheTTL, tags);
      
      return data;
    },
    ...options
  });
}
`);

    this.log('Caching layer implemented');
  }

  private async createDataSync() {
    // Create sync service for background data updates
    await this.writeFile('lib/services/sync-service.ts', `
import { metaAPIService } from './meta-api-service';
import { cacheService } from './cache-service';
import { useDashboardStore } from '@/lib/stores/dashboard-store';

interface SyncJob {
  id: string;
  type: 'campaigns' | 'adsets' | 'insights';
  params: any;
  retries: number;
  lastAttempt?: Date;
}

export class SyncService {
  private syncQueue: SyncJob[] = [];
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  start(intervalMs: number = 30000) {
    if (this.syncInterval) {
      return;
    }

    this.syncInterval = setInterval(() => {
      this.processSyncQueue();
    }, intervalMs);

    // Initial sync
    this.queueSync('campaigns', {});
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  queueSync(type: SyncJob['type'], params: any = {}) {
    const job: SyncJob = {
      id: \`\${type}-\${Date.now()}\`,
      type,
      params,
      retries: 0
    };

    this.syncQueue.push(job);
    this.processSyncQueue();
  }

  private async processSyncQueue() {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    const job = this.syncQueue.shift()!;

    try {
      await this.performSync(job);
      this.notifyListeners({ type: 'success', job });
    } catch (error) {
      console.error('Sync failed:', error);
      
      if (job.retries < 3) {
        job.retries++;
        job.lastAttempt = new Date();
        this.syncQueue.push(job);
      }
      
      this.notifyListeners({ type: 'error', job, error });
    } finally {
      this.isSyncing = false;
      
      // Process next job if any
      if (this.syncQueue.length > 0) {
        setTimeout(() => this.processSyncQueue(), 1000);
      }
    }
  }

  private async performSync(job: SyncJob) {
    switch (job.type) {
      case 'campaigns':
        const campaigns = await metaAPIService.getCampaigns(job.params.dateRange);
        
        // Update store
        useDashboardStore.getState().setCampaigns(campaigns);
        
        // Update cache
        await cacheService.set(
          \`campaigns-\${job.params.dateRange || 'all'}\`,
          campaigns,
          10 * 60 * 1000, // 10 minutes
          ['campaigns']
        );
        break;

      case 'adsets':
        const adsets = await metaAPIService.getAdSets(job.params.campaignId);
        await cacheService.set(
          \`adsets-\${job.params.campaignId}\`,
          adsets,
          10 * 60 * 1000,
          ['adsets', \`campaign-\${job.params.campaignId}\`]
        );
        break;

      case 'insights':
        // Handle insights sync
        break;
    }
  }

  onStatusChange(listener: (status: SyncStatus) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(status: SyncStatus) {
    this.listeners.forEach(listener => listener(status));
  }
}

interface SyncStatus {
  type: 'success' | 'error';
  job: SyncJob;
  error?: any;
}

export const syncService = new SyncService();
`);

    this.log('Data synchronization created');
  }

  private async setupQueueSystem() {
    // Create job queue for API calls
    await this.writeFile('lib/services/queue-service.ts', `
interface Job {
  id: string;
  type: string;
  data: any;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export class QueueService {
  private queue: Job[] = [];
  private processing = false;
  private concurrency = 3;
  private activeJobs = 0;

  async add(type: string, data: any, options: Partial<Job> = {}) {
    const job: Job = {
      id: \`\${type}-\${Date.now()}-\${Math.random()}\`,
      type,
      data,
      priority: options.priority || 0,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: new Date(),
      ...options
    };

    this.queue.push(job);
    this.queue.sort((a, b) => b.priority - a.priority);
    
    this.process();
    return job.id;
  }

  private async process() {
    if (this.processing || this.activeJobs >= this.concurrency) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.activeJobs < this.concurrency) {
      const job = this.queue.shift()!;
      this.activeJobs++;

      this.processJob(job).finally(() => {
        this.activeJobs--;
        if (this.queue.length > 0) {
          this.process();
        }
      });
    }

    this.processing = false;
  }

  private async processJob(job: Job) {
    job.processedAt = new Date();
    job.attempts++;

    try {
      // Process based on job type
      switch (job.type) {
        case 'fetch-campaigns':
          await this.fetchCampaigns(job.data);
          break;
        case 'update-campaign':
          await this.updateCampaign(job.data);
          break;
        case 'batch-insights':
          await this.batchInsights(job.data);
          break;
        default:
          throw new Error(\`Unknown job type: \${job.type}\`);
      }

      job.completedAt = new Date();
    } catch (error: any) {
      job.error = error.message;
      
      if (job.attempts < job.maxAttempts) {
        // Retry with exponential backoff
        const delay = Math.pow(2, job.attempts) * 1000;
        setTimeout(() => {
          this.queue.push(job);
          this.process();
        }, delay);
      }
    }
  }

  private async fetchCampaigns(data: any) {
    // Implementation for fetching campaigns
    const { metaAPIService } = await import('./meta-api-service');
    return metaAPIService.getCampaigns(data.dateRange);
  }

  private async updateCampaign(data: any) {
    // Implementation for updating campaign
  }

  private async batchInsights(data: any) {
    // Implementation for batch insights
  }

  getQueueStatus() {
    return {
      pending: this.queue.length,
      active: this.activeJobs,
      total: this.queue.length + this.activeJobs
    };
  }
}

export const queueService = new QueueService();
`);

    this.log('Queue system setup complete');
  }

  private async buildTransformationLayer() {
    // Create data transformation utilities
    await this.writeFile('lib/services/transform-service.ts', `
import type { Campaign } from '@/lib/types';

export class TransformService {
  // Transform raw Meta API response to our Campaign type
  transformCampaign(raw: any): Campaign {
    const insights = raw.insights?.data?.[0] || {};
    
    return {
      id: raw.id,
      name: raw.name,
      status: raw.status,
      objective: raw.objective,
      budget: this.extractBudget(raw),
      spend: parseFloat(insights.spend || '0'),
      impressions: parseInt(insights.impressions || '0'),
      clicks: parseInt(insights.clicks || '0'),
      conversions: parseInt(insights.conversions || '0'),
      revenue: this.calculateRevenue(insights),
      roas: parseFloat(insights.purchase_roas || '0'),
      ctr: parseFloat(insights.ctr || '0'),
      cpc: parseFloat(insights.cpc || '0'),
      createdTime: raw.created_time,
      updatedTime: raw.updated_time || raw.created_time
    };
  }

  // Batch transform campaigns
  transformCampaigns(rawCampaigns: any[]): Campaign[] {
    return rawCampaigns.map(raw => this.transformCampaign(raw));
  }

  // Enrich campaign with calculated metrics
  enrichCampaign(campaign: Campaign): Campaign & { metrics: any } {
    return {
      ...campaign,
      metrics: {
        costPerConversion: campaign.conversions > 0 
          ? campaign.spend / campaign.conversions 
          : 0,
        conversionRate: campaign.clicks > 0 
          ? (campaign.conversions / campaign.clicks) * 100 
          : 0,
        frequencyCap: campaign.impressions > 0 && campaign.clicks > 0
          ? campaign.impressions / campaign.clicks
          : 0,
        budgetUtilization: campaign.budget > 0 
          ? (campaign.spend / campaign.budget) * 100 
          : 0,
        profitMargin: campaign.revenue > 0 
          ? ((campaign.revenue - campaign.spend) / campaign.revenue) * 100 
          : 0
      }
    };
  }

  // Aggregate metrics across campaigns
  aggregateMetrics(campaigns: Campaign[]) {
    return campaigns.reduce((acc, campaign) => {
      return {
        totalSpend: acc.totalSpend + campaign.spend,
        totalRevenue: acc.totalRevenue + campaign.revenue,
        totalImpressions: acc.totalImpressions + campaign.impressions,
        totalClicks: acc.totalClicks + campaign.clicks,
        totalConversions: acc.totalConversions + campaign.conversions,
        avgRoas: campaigns.length > 0 
          ? campaigns.reduce((sum, c) => sum + c.roas, 0) / campaigns.length 
          : 0,
        avgCtr: campaigns.length > 0 
          ? campaigns.reduce((sum, c) => sum + c.ctr, 0) / campaigns.length 
          : 0,
        avgCpc: campaigns.length > 0 
          ? campaigns.reduce((sum, c) => sum + c.cpc, 0) / campaigns.length 
          : 0
      };
    }, {
      totalSpend: 0,
      totalRevenue: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      avgRoas: 0,
      avgCtr: 0,
      avgCpc: 0
    });
  }

  private extractBudget(raw: any): number {
    return parseFloat(
      raw.daily_budget || 
      raw.lifetime_budget || 
      raw.budget_remaining || 
      '0'
    );
  }

  private calculateRevenue(insights: any): number {
    const spend = parseFloat(insights.spend || '0');
    const roas = parseFloat(insights.purchase_roas || '0');
    return spend * roas;
  }
}

export const transformService = new TransformService();
`);

    this.log('Transformation layer built');
  }

  private async implementOfflineSupport() {
    // Create offline data manager
    await this.writeFile('lib/services/offline-service.ts', `
import { cacheService } from './cache-service';
import type { Campaign } from '@/lib/types';

export class OfflineService {
  private isOnline = true;
  private pendingSync: any[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.syncPendingData();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  async getCampaigns(): Promise<Campaign[]> {
    if (this.isOnline) {
      try {
        // Try to fetch fresh data
        const { metaAPIService } = await import('./meta-api-service');
        const campaigns = await metaAPIService.getCampaigns();
        
        // Cache for offline use
        await cacheService.set('offline-campaigns', campaigns, Infinity);
        
        return campaigns;
      } catch (error) {
        console.warn('Failed to fetch online, falling back to cache');
      }
    }

    // Return cached data
    const cached = await cacheService.get<Campaign[]>('offline-campaigns');
    return cached || [];
  }

  async queueUpdate(type: string, data: any) {
    const update = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: new Date()
    };

    this.pendingSync.push(update);
    
    // Store pending updates
    await cacheService.set('offline-pending', this.pendingSync, Infinity);

    if (this.isOnline) {
      this.syncPendingData();
    }
  }

  private async syncPendingData() {
    if (this.pendingSync.length === 0) {
      return;
    }

    const updates = [...this.pendingSync];
    this.pendingSync = [];

    for (const update of updates) {
      try {
        await this.processPendingUpdate(update);
      } catch (error) {
        console.error('Failed to sync update:', error);
        this.pendingSync.push(update);
      }
    }

    // Update cache
    await cacheService.set('offline-pending', this.pendingSync, Infinity);
  }

  private async processPendingUpdate(update: any) {
    // Process different types of updates
    switch (update.type) {
      case 'campaign-status':
        // Update campaign status
        break;
      case 'budget-change':
        // Update budget
        break;
      default:
        console.warn('Unknown update type:', update.type);
    }
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      pendingUpdates: this.pendingSync.length
    };
  }
}

export const offlineService = new OfflineService();
`);

    this.log('Offline support implemented');
  }
}