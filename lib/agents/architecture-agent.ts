/**
 * Agent 1: Architecture Agent
 * Responsible for restructuring the codebase and implementing best practices
 */

import { BaseAgent, Task } from './base-agent';

export class ArchitectureAgent extends BaseAgent {
  constructor() {
    super('Architecture');
    this.tasks = this.getTasks();
  }

  getTasks(): Task[] {
    return [
      {
        id: 'arch-1',
        name: 'Create modular architecture',
        description: 'Implement proper separation of concerns',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'arch-2',
        name: 'Setup state management',
        description: 'Implement Zustand for global state',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'arch-3',
        name: 'Create service layer',
        description: 'Separate API calls from components',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'arch-4',
        name: 'Implement error boundaries',
        description: 'Add proper error handling throughout',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'arch-5',
        name: 'Setup dependency injection',
        description: 'Create IoC container for services',
        priority: 'medium',
        status: 'pending'
      }
    ];
  }

  async execute(): Promise<void> {
    this.log('Starting architecture restructuring...');
    
    for (const task of this.tasks) {
      await this.executeTask(task);
    }
  }

  protected async performTask(task: Task): Promise<void> {
    switch (task.id) {
      case 'arch-1':
        await this.createModularArchitecture();
        break;
      case 'arch-2':
        await this.setupStateManagement();
        break;
      case 'arch-3':
        await this.createServiceLayer();
        break;
      case 'arch-4':
        await this.implementErrorBoundaries();
        break;
      case 'arch-5':
        await this.setupDependencyInjection();
        break;
    }
  }

  private async createModularArchitecture() {
    // Create new directory structure
    const directories = [
      'lib/services',
      'lib/stores',
      'lib/hooks',
      'lib/utils',
      'lib/types',
      'lib/constants',
      'components/common',
      'components/features',
      'components/layouts'
    ];

    for (const dir of directories) {
      await this.ensureDirectory(dir);
    }

    // Create base types
    await this.writeFile('lib/types/index.ts', `
export interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED';
  objective: string;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roas: number;
  ctr: number;
  cpc: number;
  createdTime: string;
  updatedTime: string;
}

export interface AdSet {
  id: string;
  campaignId: string;
  name: string;
  status: string;
  targetingSpec: any;
  budget: number;
  bidStrategy: string;
}

export interface MetaAPIResponse<T> {
  data: T;
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

export interface DashboardState {
  campaigns: Campaign[];
  isLoading: boolean;
  error: string | null;
  filters: {
    dateRange: 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'all_time';
    status: string[];
    search: string;
  };
  selectedCampaigns: string[];
}
`);

    this.log('Modular architecture created');
  }

  private async setupStateManagement() {
    // Create Zustand store
    await this.writeFile('lib/stores/dashboard-store.ts', `
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Campaign, DashboardState } from '@/lib/types';

interface DashboardStore extends DashboardState {
  // Actions
  setCampaigns: (campaigns: Campaign[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDateRange: (range: DashboardState['filters']['dateRange']) => void;
  setStatusFilter: (statuses: string[]) => void;
  setSearchFilter: (search: string) => void;
  toggleCampaignSelection: (campaignId: string) => void;
  clearSelection: () => void;
  
  // Computed values
  getFilteredCampaigns: () => Campaign[];
  getSelectedCampaigns: () => Campaign[];
}

export const useDashboardStore = create<DashboardStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        campaigns: [],
        isLoading: false,
        error: null,
        filters: {
          dateRange: 'last_7d',
          status: [],
          search: ''
        },
        selectedCampaigns: [],

        // Actions
        setCampaigns: (campaigns) => set(state => {
          state.campaigns = campaigns;
        }),

        setLoading: (loading) => set(state => {
          state.isLoading = loading;
        }),

        setError: (error) => set(state => {
          state.error = error;
        }),

        setDateRange: (range) => set(state => {
          state.filters.dateRange = range;
        }),

        setStatusFilter: (statuses) => set(state => {
          state.filters.status = statuses;
        }),

        setSearchFilter: (search) => set(state => {
          state.filters.search = search;
        }),

        toggleCampaignSelection: (campaignId) => set(state => {
          const index = state.selectedCampaigns.indexOf(campaignId);
          if (index > -1) {
            state.selectedCampaigns.splice(index, 1);
          } else {
            state.selectedCampaigns.push(campaignId);
          }
        }),

        clearSelection: () => set(state => {
          state.selectedCampaigns = [];
        }),

        // Computed values
        getFilteredCampaigns: () => {
          const { campaigns, filters } = get();
          
          return campaigns.filter(campaign => {
            // Status filter
            if (filters.status.length > 0 && !filters.status.includes(campaign.status)) {
              return false;
            }
            
            // Search filter
            if (filters.search && !campaign.name.toLowerCase().includes(filters.search.toLowerCase())) {
              return false;
            }
            
            return true;
          });
        },

        getSelectedCampaigns: () => {
          const { campaigns, selectedCampaigns } = get();
          return campaigns.filter(c => selectedCampaigns.includes(c.id));
        }
      })),
      {
        name: 'dashboard-storage',
        partialize: (state) => ({ filters: state.filters })
      }
    )
  )
);
`);

    this.log('State management setup complete');
  }

  private async createServiceLayer() {
    // Create base service class
    await this.writeFile('lib/services/base-service.ts', `
export abstract class BaseService {
  protected baseUrl: string;
  protected headers: HeadersInit;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.baseUrl + endpoint;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }

      return await response.json();
    } catch (error) {
      console.error('Service request failed:', error);
      throw error;
    }
  }

  protected handleError(error: any): never {
    console.error('Service error:', error);
    throw error;
  }
}
`);

    // Create Meta API service
    await this.writeFile('lib/services/meta-api-service.ts', `
import { BaseService } from './base-service';
import type { Campaign, AdSet, MetaAPIResponse } from '@/lib/types';

export class MetaAPIService extends BaseService {
  private accessToken: string;
  private accountId: string;

  constructor() {
    super('https://graph.facebook.com/v18.0');
    this.accessToken = '';
    this.accountId = '';
  }

  setCredentials(accessToken: string, accountId: string) {
    this.accessToken = accessToken;
    this.accountId = accountId;
  }

  async getCampaigns(dateRange?: string): Promise<Campaign[]> {
    if (!this.accessToken || !this.accountId) {
      throw new Error('Meta API credentials not set');
    }

    const params = new URLSearchParams({
      access_token: this.accessToken,
      fields: 'id,name,status,objective,daily_budget,lifetime_budget,insights{spend,impressions,clicks,conversions,purchase_roas,ctr,cpc}',
      limit: '100'
    });

    if (dateRange) {
      params.append('date_preset', dateRange);
    }

    const response = await this.request<MetaAPIResponse<Campaign[]>>(
      \`/\${this.accountId}/campaigns?\${params}\`
    );

    return this.processCampaigns(response.data);
  }

  async getAdSets(campaignId: string): Promise<AdSet[]> {
    const params = new URLSearchParams({
      access_token: this.accessToken,
      fields: 'id,name,status,targeting,daily_budget,bid_strategy',
      limit: '50'
    });

    const response = await this.request<MetaAPIResponse<AdSet[]>>(
      \`/\${campaignId}/adsets?\${params}\`
    );

    return response.data;
  }

  private processCampaigns(campaigns: any[]): Campaign[] {
    return campaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      objective: campaign.objective,
      budget: campaign.daily_budget || campaign.lifetime_budget || 0,
      spend: campaign.insights?.data?.[0]?.spend || 0,
      impressions: campaign.insights?.data?.[0]?.impressions || 0,
      clicks: campaign.insights?.data?.[0]?.clicks || 0,
      conversions: campaign.insights?.data?.[0]?.conversions || 0,
      revenue: campaign.insights?.data?.[0]?.purchase_roas 
        ? campaign.insights?.data?.[0]?.spend * campaign.insights?.data?.[0]?.purchase_roas
        : 0,
      roas: campaign.insights?.data?.[0]?.purchase_roas || 0,
      ctr: campaign.insights?.data?.[0]?.ctr || 0,
      cpc: campaign.insights?.data?.[0]?.cpc || 0,
      createdTime: campaign.created_time,
      updatedTime: campaign.updated_time
    }));
  }
}

// Export singleton instance
export const metaAPIService = new MetaAPIService();
`);

    this.log('Service layer created');
  }

  private async implementErrorBoundaries() {
    // Create enhanced error boundary
    await this.writeFile('components/common/error-boundary.tsx', `
'use client';

import React, { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
    this.setState({ errorInfo });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error tracking service
    if (typeof window !== 'undefined') {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.toString(),
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString()
        })
      }).catch(console.error);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              <p className="mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                <pre className="text-xs bg-black/10 p-2 rounded overflow-auto max-h-40 mb-4">
                  {this.state.error.stack}
                </pre>
              )}
              <div className="flex gap-2">
                <Button onClick={this.handleReset} size="sm">
                  Try again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Reload page
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components
export function useErrorHandler() {
  return (error: Error) => {
    console.error('Error caught by hook:', error);
    throw error; // Re-throw to be caught by boundary
  };
}
`);

    this.log('Error boundaries implemented');
  }

  private async setupDependencyInjection() {
    // Create simple IoC container
    await this.writeFile('lib/services/container.ts', `
type Constructor<T = {}> = new (...args: any[]) => T;
type Factory<T> = () => T;

class Container {
  private services = new Map<string, any>();
  private factories = new Map<string, Factory<any>>();
  private singletons = new Map<string, any>();

  register<T>(token: string, factory: Factory<T>, options?: { singleton?: boolean }) {
    this.factories.set(token, factory);
    
    if (options?.singleton) {
      // Pre-create singleton
      this.singletons.set(token, factory());
    }
  }

  registerClass<T>(token: string, constructor: Constructor<T>, options?: { singleton?: boolean }) {
    this.register(token, () => new constructor(), options);
  }

  get<T>(token: string): T {
    // Check if singleton exists
    if (this.singletons.has(token)) {
      return this.singletons.get(token);
    }

    // Check if factory exists
    const factory = this.factories.get(token);
    if (!factory) {
      throw new Error(\`Service '\${token}' not registered\`);
    }

    return factory();
  }

  has(token: string): boolean {
    return this.factories.has(token) || this.singletons.has(token);
  }

  clear() {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }
}

export const container = new Container();

// Register services
import { MetaAPIService } from './meta-api-service';
import { CacheService } from './cache-service';
import { LoggingService } from './logging-service';

container.registerClass('MetaAPIService', MetaAPIService, { singleton: true });
container.registerClass('CacheService', CacheService, { singleton: true });
container.registerClass('LoggingService', LoggingService, { singleton: true });

// Helper hook
import { useMemo } from 'react';

export function useService<T>(token: string): T {
  return useMemo(() => container.get<T>(token), [token]);
}
`);

    this.log('Dependency injection setup complete');
  }
}