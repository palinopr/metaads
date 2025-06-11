/**
 * Integration Manager
 * Coordinates all agent implementations and ensures seamless integration
 */

import { featureManager, FeatureManager } from './feature-manager';
import { agentCoordinator } from '@/lib/agents/agent-coordinator';

export interface IntegrationConfig {
  environment: 'development' | 'staging' | 'production';
  version: string;
  rolloutStrategy: 'immediate' | 'gradual' | 'canary';
  rollbackThreshold: number; // Error rate threshold for automatic rollback
  healthCheckInterval: number; // In milliseconds
  featureFlagsEnabled: boolean;
  monitoringEnabled: boolean;
  debugMode: boolean;
}

export interface IntegrationStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: ComponentStatus[];
  lastUpdate: string;
  uptime: number;
  version: string;
}

export interface ComponentStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  healthScore: number; // 0-100
  lastCheck: string;
  errors: string[];
  dependencies: string[];
  metrics: Record<string, number>;
}

export class IntegrationManager {
  private config: IntegrationConfig;
  private components: Map<string, ComponentStatus> = new Map();
  private healthCheckInterval: NodeJS.Timer | null = null;
  private errorRates: Map<string, number[]> = new Map();
  private startTime: number = Date.now();

  constructor(config?: Partial<IntegrationConfig>) {
    this.config = {
      environment: (process.env.NODE_ENV as any) || 'development',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      rolloutStrategy: 'gradual',
      rollbackThreshold: 0.05, // 5% error rate
      healthCheckInterval: 30000, // 30 seconds
      featureFlagsEnabled: true,
      monitoringEnabled: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...config
    };

    this.initializeComponents();
    this.startHealthChecks();
  }

  private initializeComponents() {
    const components = [
      // Authentication Components
      {
        name: 'auth_oauth',
        dependencies: [],
        checkHealth: () => this.checkAuthHealth()
      },
      {
        name: 'auth_session',
        dependencies: ['auth_oauth'],
        checkHealth: () => this.checkSessionHealth()
      },
      {
        name: 'auth_multi_account',
        dependencies: ['auth_oauth'],
        checkHealth: () => this.checkMultiAccountHealth()
      },

      // Data Pipeline Components
      {
        name: 'pipeline_batch',
        dependencies: ['auth_oauth'],
        checkHealth: () => this.checkBatchPipelineHealth()
      },
      {
        name: 'pipeline_realtime',
        dependencies: ['pipeline_batch'],
        checkHealth: () => this.checkRealtimePipelineHealth()
      },
      {
        name: 'pipeline_cache',
        dependencies: [],
        checkHealth: () => this.checkCacheHealth()
      },

      // API Components
      {
        name: 'api_meta',
        dependencies: ['auth_oauth', 'pipeline_cache'],
        checkHealth: () => this.checkMetaAPIHealth()
      },
      {
        name: 'api_claude',
        dependencies: [],
        checkHealth: () => this.checkClaudeAPIHealth()
      },

      // AI Components
      {
        name: 'ai_insights',
        dependencies: ['api_meta', 'api_claude'],
        checkHealth: () => this.checkAIInsightsHealth()
      },
      {
        name: 'ai_predictions',
        dependencies: ['ai_insights'],
        checkHealth: () => this.checkAIPredictionsHealth()
      },

      // UI Components
      {
        name: 'ui_dashboard',
        dependencies: ['api_meta'],
        checkHealth: () => this.checkDashboardHealth()
      },
      {
        name: 'ui_themes',
        dependencies: [],
        checkHealth: () => this.checkThemeHealth()
      },

      // Performance Components
      {
        name: 'performance_optimizer',
        dependencies: [],
        checkHealth: () => this.checkPerformanceHealth()
      },
      {
        name: 'memory_manager',
        dependencies: ['performance_optimizer'],
        checkHealth: () => this.checkMemoryHealth()
      },

      // Error Handling Components
      {
        name: 'error_boundary',
        dependencies: [],
        checkHealth: () => this.checkErrorBoundaryHealth()
      },
      {
        name: 'error_analytics',
        dependencies: ['error_boundary'],
        checkHealth: () => this.checkErrorAnalyticsHealth()
      },

      // Offline Components
      {
        name: 'offline_cache',
        dependencies: ['pipeline_cache'],
        checkHealth: () => this.checkOfflineCacheHealth()
      },
      {
        name: 'service_worker',
        dependencies: ['offline_cache'],
        checkHealth: () => this.checkServiceWorkerHealth()
      }
    ];

    components.forEach(comp => {
      this.components.set(comp.name, {
        name: comp.name,
        status: 'offline',
        healthScore: 0,
        lastCheck: new Date().toISOString(),
        errors: [],
        dependencies: comp.dependencies,
        metrics: {}
      });
    });
  }

  private startHealthChecks() {
    if (this.config.monitoringEnabled && !this.healthCheckInterval) {
      this.healthCheckInterval = setInterval(() => {
        this.performHealthChecks();
      }, this.config.healthCheckInterval);

      // Initial health check
      this.performHealthChecks();
    }
  }

  private async performHealthChecks() {
    const promises = Array.from(this.components.keys()).map(name => 
      this.checkComponentHealth(name)
    );

    await Promise.allSettled(promises);
    this.updateOverallStatus();
  }

  private async checkComponentHealth(componentName: string) {
    const component = this.components.get(componentName);
    if (!component) return;

    try {
      const healthResult = await this.getComponentHealthCheck(componentName)();
      
      component.status = healthResult.status;
      component.healthScore = healthResult.healthScore;
      component.lastCheck = new Date().toISOString();
      component.metrics = { ...component.metrics, ...healthResult.metrics };
      
      // Clear errors if healthy
      if (healthResult.status === 'online') {
        component.errors = [];
      }

      this.recordMetrics(componentName, healthResult.healthScore);

    } catch (error) {
      component.status = 'offline';
      component.healthScore = 0;
      component.errors.push(`Health check failed: ${error.message}`);
      component.lastCheck = new Date().toISOString();
      
      this.recordError(componentName, error.message);
    }
  }

  private getComponentHealthCheck(componentName: string) {
    const healthChecks: Record<string, () => Promise<any>> = {
      auth_oauth: () => this.checkAuthHealth(),
      auth_session: () => this.checkSessionHealth(),
      auth_multi_account: () => this.checkMultiAccountHealth(),
      pipeline_batch: () => this.checkBatchPipelineHealth(),
      pipeline_realtime: () => this.checkRealtimePipelineHealth(),
      pipeline_cache: () => this.checkCacheHealth(),
      api_meta: () => this.checkMetaAPIHealth(),
      api_claude: () => this.checkClaudeAPIHealth(),
      ai_insights: () => this.checkAIInsightsHealth(),
      ai_predictions: () => this.checkAIPredictionsHealth(),
      ui_dashboard: () => this.checkDashboardHealth(),
      ui_themes: () => this.checkThemeHealth(),
      performance_optimizer: () => this.checkPerformanceHealth(),
      memory_manager: () => this.checkMemoryHealth(),
      error_boundary: () => this.checkErrorBoundaryHealth(),
      error_analytics: () => this.checkErrorAnalyticsHealth(),
      offline_cache: () => this.checkOfflineCacheHealth(),
      service_worker: () => this.checkServiceWorkerHealth()
    };

    return healthChecks[componentName] || (() => Promise.resolve({ 
      status: 'online', 
      healthScore: 100, 
      metrics: {} 
    }));
  }

  // Health check implementations
  private async checkAuthHealth() {
    try {
      const hasCredentials = typeof window !== 'undefined' && 
        localStorage.getItem('metaads_credentials');
      return {
        status: 'online' as const,
        healthScore: hasCredentials ? 100 : 80,
        metrics: { hasCredentials: hasCredentials ? 1 : 0 }
      };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private async checkSessionHealth() {
    try {
      // Check if session is valid
      const sessionValid = typeof window !== 'undefined' && 
        Date.now() < (parseInt(localStorage.getItem('session_expires') || '0') || 0);
      return {
        status: sessionValid ? 'online' as const : 'degraded' as const,
        healthScore: sessionValid ? 100 : 50,
        metrics: { sessionValid: sessionValid ? 1 : 0 }
      };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private async checkMultiAccountHealth() {
    try {
      return {
        status: 'online' as const,
        healthScore: featureManager.isFeatureEnabled('auth_multi_account') ? 100 : 0,
        metrics: { enabled: featureManager.isFeatureEnabled('auth_multi_account') ? 1 : 0 }
      };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private async checkBatchPipelineHealth() {
    try {
      // Check if batch processing is working
      const response = await fetch('/api/health', { method: 'HEAD' });
      return {
        status: response.ok ? 'online' as const : 'degraded' as const,
        healthScore: response.ok ? 100 : 30,
        metrics: { apiHealthy: response.ok ? 1 : 0 }
      };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private async checkRealtimePipelineHealth() {
    try {
      return {
        status: 'online' as const,
        healthScore: featureManager.isFeatureEnabled('pipeline_real_time') ? 100 : 0,
        metrics: { enabled: featureManager.isFeatureEnabled('pipeline_real_time') ? 1 : 0 }
      };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private async checkCacheHealth() {
    try {
      // Check if caching is working
      const cacheSupported = typeof window !== 'undefined' && 'caches' in window;
      return {
        status: cacheSupported ? 'online' as const : 'degraded' as const,
        healthScore: cacheSupported ? 100 : 60,
        metrics: { cacheSupported: cacheSupported ? 1 : 0 }
      };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private async checkMetaAPIHealth() {
    try {
      const response = await fetch('/api/meta', { method: 'HEAD' });
      return {
        status: response.ok ? 'online' as const : 'degraded' as const,
        healthScore: response.ok ? 100 : 20,
        metrics: { 
          apiHealthy: response.ok ? 1 : 0,
          responseTime: Date.now() // Simplified
        }
      };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private async checkClaudeAPIHealth() {
    try {
      return {
        status: 'online' as const,
        healthScore: featureManager.isFeatureEnabled('ai_insights_basic') ? 100 : 0,
        metrics: { enabled: featureManager.isFeatureEnabled('ai_insights_basic') ? 1 : 0 }
      };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private async checkAIInsightsHealth() {
    try {
      return {
        status: 'online' as const,
        healthScore: featureManager.isFeatureEnabled('ai_insights_basic') ? 100 : 0,
        metrics: { enabled: featureManager.isFeatureEnabled('ai_insights_basic') ? 1 : 0 }
      };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private async checkAIPredictionsHealth() {
    try {
      return {
        status: 'online' as const,
        healthScore: featureManager.isFeatureEnabled('ai_insights_advanced') ? 100 : 0,
        metrics: { enabled: featureManager.isFeatureEnabled('ai_insights_advanced') ? 1 : 0 }
      };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private async checkDashboardHealth() {
    try {
      return {
        status: 'online' as const,
        healthScore: 100,
        metrics: { loaded: 1 }
      };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private async checkThemeHealth() {
    try {
      const hasTheme = typeof window !== 'undefined' && 
        document.documentElement.classList.contains('dark') ||
        document.documentElement.classList.contains('light');
      return {
        status: 'online' as const,
        healthScore: hasTheme ? 100 : 80,
        metrics: { themeActive: hasTheme ? 1 : 0 }
      };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private async checkPerformanceHealth() {
    try {
      const perfSupported = typeof window !== 'undefined' && 'performance' in window;
      return {
        status: perfSupported ? 'online' as const : 'degraded' as const,
        healthScore: perfSupported ? 100 : 70,
        metrics: { performanceSupported: perfSupported ? 1 : 0 }
      };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private async checkMemoryHealth() {
    try {
      if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
        const memory = (window.performance as any).memory;
        const memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
        return {
          status: memoryUsage < 0.9 ? 'online' as const : 'degraded' as const,
          healthScore: Math.max(0, 100 - (memoryUsage * 100)),
          metrics: { 
            memoryUsage,
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize
          }
        };
      }
      return { status: 'online' as const, healthScore: 100, metrics: {} };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private async checkErrorBoundaryHealth() {
    try {
      return {
        status: 'online' as const,
        healthScore: 100,
        metrics: { active: 1 }
      };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private async checkErrorAnalyticsHealth() {
    try {
      return {
        status: 'online' as const,
        healthScore: featureManager.isFeatureEnabled('error_analytics') ? 100 : 0,
        metrics: { enabled: featureManager.isFeatureEnabled('error_analytics') ? 1 : 0 }
      };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private async checkOfflineCacheHealth() {
    try {
      const offlineSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;
      return {
        status: offlineSupported ? 'online' as const : 'degraded' as const,
        healthScore: offlineSupported ? 100 : 50,
        metrics: { offlineSupported: offlineSupported ? 1 : 0 }
      };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private async checkServiceWorkerHealth() {
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return {
          status: registration ? 'online' as const : 'degraded' as const,
          healthScore: registration ? 100 : 60,
          metrics: { registered: registration ? 1 : 0 }
        };
      }
      return { status: 'degraded' as const, healthScore: 60, metrics: {} };
    } catch {
      return { status: 'offline' as const, healthScore: 0, metrics: {} };
    }
  }

  private recordMetrics(componentName: string, healthScore: number) {
    // Record metrics for monitoring
    if (this.config.monitoringEnabled) {
      console.debug(`Component ${componentName} health: ${healthScore}`);
    }
  }

  private recordError(componentName: string, error: string) {
    const errors = this.errorRates.get(componentName) || [];
    errors.push(Date.now());
    
    // Keep only errors from the last hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentErrors = errors.filter(timestamp => timestamp > oneHourAgo);
    this.errorRates.set(componentName, recentErrors);

    // Check for rollback threshold
    const errorRate = recentErrors.length / 60; // Errors per minute
    if (errorRate > this.config.rollbackThreshold * 60) {
      this.handleCriticalError(componentName, errorRate);
    }
  }

  private handleCriticalError(componentName: string, errorRate: number) {
    console.error(`Critical error rate detected in ${componentName}: ${errorRate} errors/min`);
    
    // Disable problematic features
    const relatedFeatures = this.getRelatedFeatures(componentName);
    relatedFeatures.forEach(featureId => {
      featureManager.disableFeature(featureId);
      console.warn(`Disabled feature ${featureId} due to critical errors in ${componentName}`);
    });
  }

  private getRelatedFeatures(componentName: string): string[] {
    const featureMap: Record<string, string[]> = {
      'ai_insights': ['ai_insights_basic', 'ai_insights_advanced'],
      'api_meta': ['pipeline_batch_processing', 'pipeline_real_time'],
      'auth_oauth': ['auth_oauth_flow', 'auth_multi_account'],
      'pipeline_realtime': ['pipeline_real_time', 'automation_alerts'],
      // Add more mappings as needed
    };

    return featureMap[componentName] || [];
  }

  private updateOverallStatus() {
    const components = Array.from(this.components.values());
    const healthScores = components.map(c => c.healthScore);
    const averageHealth = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (averageHealth >= 80) {
      overall = 'healthy';
    } else if (averageHealth >= 50) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    // Update status in storage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('integration_status', JSON.stringify({
        overall,
        averageHealth,
        lastUpdate: new Date().toISOString()
      }));
    }
  }

  public getStatus(): IntegrationStatus {
    const components = Array.from(this.components.values());
    const healthScores = components.map(c => c.healthScore);
    const averageHealth = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (averageHealth >= 80) {
      overall = 'healthy';
    } else if (averageHealth >= 50) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      components,
      lastUpdate: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: this.config.version
    };
  }

  public getComponentStatus(componentName: string): ComponentStatus | null {
    return this.components.get(componentName) || null;
  }

  public async restart() {
    console.log('Restarting Integration Manager...');
    
    // Stop health checks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Reset components
    this.components.clear();
    this.errorRates.clear();
    
    // Reinitialize
    this.initializeComponents();
    this.startHealthChecks();
    
    console.log('Integration Manager restarted');
  }

  public destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.components.clear();
    this.errorRates.clear();
  }
}

// Singleton instance
export const integrationManager = new IntegrationManager();