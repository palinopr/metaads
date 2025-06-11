/**
 * Environment Manager
 * Manages environment-specific configurations and deployments
 */

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  name: Environment;
  displayName: string;
  apiBaseUrl: string;
  metaApiVersion: string;
  claudeApiVersion: string;
  enabledFeatures: string[];
  disabledFeatures: string[];
  debugMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  performanceMonitoring: boolean;
  errorReporting: boolean;
  analytics: boolean;
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal';
  rateLimits: {
    metaApi: number;
    claudeApi: number;
    userRequests: number;
  };
  security: {
    cspEnabled: boolean;
    httpsOnly: boolean;
    secureHeaders: boolean;
  };
  deployment: {
    strategy: 'rolling' | 'blue-green' | 'canary';
    healthChecks: boolean;
    rollbackThreshold: number;
  };
}

export class EnvironmentManager {
  private currentEnvironment: Environment;
  private configurations: Map<Environment, EnvironmentConfig> = new Map();

  constructor() {
    this.currentEnvironment = (process.env.NODE_ENV as Environment) || 'development';
    this.initializeConfigurations();
  }

  private initializeConfigurations() {
    // Development Configuration
    this.configurations.set('development', {
      name: 'development',
      displayName: 'Development',
      apiBaseUrl: 'http://localhost:3000/api',
      metaApiVersion: 'v18.0',
      claudeApiVersion: '2024-06-01',
      enabledFeatures: [
        'auth_oauth_flow',
        'auth_multi_account',
        'pipeline_batch_processing',
        'pipeline_real_time',
        'pipeline_caching',
        'ai_insights_basic',
        'ai_insights_advanced',
        'ai_creative_analysis',
        'performance_optimization',
        'ui_dark_mode',
        'ui_responsive_design',
        'ui_accessibility',
        'automation_reporting',
        'automation_alerts',
        'error_handling_enhanced',
        'error_analytics',
        'offline_support',
        'testing_ab_framework'
      ],
      disabledFeatures: [],
      debugMode: true,
      logLevel: 'debug',
      performanceMonitoring: true,
      errorReporting: true,
      analytics: false,
      cacheStrategy: 'minimal',
      rateLimits: {
        metaApi: 1000,
        claudeApi: 500,
        userRequests: 10000
      },
      security: {
        cspEnabled: false,
        httpsOnly: false,
        secureHeaders: false
      },
      deployment: {
        strategy: 'rolling',
        healthChecks: true,
        rollbackThreshold: 0.1
      }
    });

    // Staging Configuration
    this.configurations.set('staging', {
      name: 'staging',
      displayName: 'Staging',
      apiBaseUrl: 'https://staging.metaads-dashboard.com/api',
      metaApiVersion: 'v18.0',
      claudeApiVersion: '2024-06-01',
      enabledFeatures: [
        'auth_oauth_flow',
        'auth_multi_account',
        'auth_session_management',
        'pipeline_batch_processing',
        'pipeline_real_time',
        'pipeline_caching',
        'ai_insights_basic',
        'ai_insights_advanced',
        'ai_creative_analysis',
        'performance_optimization',
        'performance_memory_management',
        'ui_dark_mode',
        'ui_responsive_design',
        'ui_accessibility',
        'automation_reporting',
        'automation_alerts',
        'error_handling_enhanced',
        'error_analytics',
        'offline_support'
      ],
      disabledFeatures: [
        'testing_ab_framework' // Limited testing in staging
      ],
      debugMode: false,
      logLevel: 'info',
      performanceMonitoring: true,
      errorReporting: true,
      analytics: true,
      cacheStrategy: 'moderate',
      rateLimits: {
        metaApi: 5000,
        claudeApi: 2000,
        userRequests: 50000
      },
      security: {
        cspEnabled: true,
        httpsOnly: true,
        secureHeaders: true
      },
      deployment: {
        strategy: 'blue-green',
        healthChecks: true,
        rollbackThreshold: 0.05
      }
    });

    // Production Configuration
    this.configurations.set('production', {
      name: 'production',
      displayName: 'Production',
      apiBaseUrl: 'https://metaads-dashboard.com/api',
      metaApiVersion: 'v18.0',
      claudeApiVersion: '2024-06-01',
      enabledFeatures: [
        'auth_oauth_flow',
        'auth_multi_account',
        'auth_session_management',
        'pipeline_batch_processing',
        'pipeline_real_time',
        'pipeline_caching',
        'ai_insights_basic',
        'performance_optimization',
        'performance_memory_management',
        'ui_dark_mode',
        'ui_responsive_design',
        'ui_accessibility',
        'automation_reporting',
        'error_handling_enhanced',
        'offline_support'
      ],
      disabledFeatures: [
        'ai_insights_advanced', // Gradual rollout
        'ai_creative_analysis', // Gradual rollout
        'automation_alerts', // Gradual rollout
        'error_analytics', // Gradual rollout
        'testing_ab_framework' // Admin only
      ],
      debugMode: false,
      logLevel: 'warn',
      performanceMonitoring: true,
      errorReporting: true,
      analytics: true,
      cacheStrategy: 'aggressive',
      rateLimits: {
        metaApi: 10000,
        claudeApi: 5000,
        userRequests: 100000
      },
      security: {
        cspEnabled: true,
        httpsOnly: true,
        secureHeaders: true
      },
      deployment: {
        strategy: 'canary',
        healthChecks: true,
        rollbackThreshold: 0.02
      }
    });
  }

  public getCurrentEnvironment(): Environment {
    return this.currentEnvironment;
  }

  public getConfiguration(environment?: Environment): EnvironmentConfig {
    const env = environment || this.currentEnvironment;
    const config = this.configurations.get(env);
    if (!config) {
      throw new Error(`Configuration not found for environment: ${env}`);
    }
    return config;
  }

  public getAllConfigurations(): Record<Environment, EnvironmentConfig> {
    const configs: Record<Environment, EnvironmentConfig> = {} as any;
    this.configurations.forEach((config, env) => {
      configs[env] = config;
    });
    return configs;
  }

  public isFeatureEnabledInEnvironment(featureId: string, environment?: Environment): boolean {
    const config = this.getConfiguration(environment);
    return config.enabledFeatures.includes(featureId) && !config.disabledFeatures.includes(featureId);
  }

  public getEnvironmentFeatures(environment?: Environment): { enabled: string[]; disabled: string[] } {
    const config = this.getConfiguration(environment);
    return {
      enabled: config.enabledFeatures,
      disabled: config.disabledFeatures
    };
  }

  public updateConfiguration(environment: Environment, updates: Partial<EnvironmentConfig>): void {
    const current = this.getConfiguration(environment);
    const updated = { ...current, ...updates };
    this.configurations.set(environment, updated);
  }

  public enableFeatureInEnvironment(featureId: string, environment?: Environment): void {
    const env = environment || this.currentEnvironment;
    const config = this.getConfiguration(env);
    
    // Add to enabled features if not already there
    if (!config.enabledFeatures.includes(featureId)) {
      config.enabledFeatures.push(featureId);
    }
    
    // Remove from disabled features if present
    const disabledIndex = config.disabledFeatures.indexOf(featureId);
    if (disabledIndex > -1) {
      config.disabledFeatures.splice(disabledIndex, 1);
    }
    
    this.configurations.set(env, config);
  }

  public disableFeatureInEnvironment(featureId: string, environment?: Environment): void {
    const env = environment || this.currentEnvironment;
    const config = this.getConfiguration(env);
    
    // Add to disabled features if not already there
    if (!config.disabledFeatures.includes(featureId)) {
      config.disabledFeatures.push(featureId);
    }
    
    // Remove from enabled features if present
    const enabledIndex = config.enabledFeatures.indexOf(featureId);
    if (enabledIndex > -1) {
      config.enabledFeatures.splice(enabledIndex, 1);
    }
    
    this.configurations.set(env, config);
  }

  public getApiConfiguration() {
    const config = this.getConfiguration();
    return {
      baseUrl: config.apiBaseUrl,
      metaApiVersion: config.metaApiVersion,
      claudeApiVersion: config.claudeApiVersion,
      rateLimits: config.rateLimits
    };
  }

  public getSecurityConfiguration() {
    const config = this.getConfiguration();
    return config.security;
  }

  public getDeploymentConfiguration() {
    const config = this.getConfiguration();
    return config.deployment;
  }

  public getCacheConfiguration() {
    const config = this.getConfiguration();
    return {
      strategy: config.cacheStrategy,
      ttl: this.getCacheTTL(config.cacheStrategy),
      maxSize: this.getCacheMaxSize(config.cacheStrategy)
    };
  }

  private getCacheTTL(strategy: string): number {
    switch (strategy) {
      case 'aggressive': return 3600000; // 1 hour
      case 'moderate': return 1800000; // 30 minutes
      case 'minimal': return 300000; // 5 minutes
      default: return 1800000;
    }
  }

  private getCacheMaxSize(strategy: string): number {
    switch (strategy) {
      case 'aggressive': return 100 * 1024 * 1024; // 100MB
      case 'moderate': return 50 * 1024 * 1024; // 50MB
      case 'minimal': return 10 * 1024 * 1024; // 10MB
      default: return 50 * 1024 * 1024;
    }
  }

  public isProduction(): boolean {
    return this.currentEnvironment === 'production';
  }

  public isDevelopment(): boolean {
    return this.currentEnvironment === 'development';
  }

  public isStaging(): boolean {
    return this.currentEnvironment === 'staging';
  }

  public shouldEnableFeature(featureId: string): boolean {
    const config = this.getConfiguration();
    
    // Check if explicitly disabled
    if (config.disabledFeatures.includes(featureId)) {
      return false;
    }
    
    // Check if explicitly enabled
    if (config.enabledFeatures.includes(featureId)) {
      return true;
    }
    
    // Default behavior based on environment
    if (this.isDevelopment()) {
      return true; // Enable all features in development
    } else if (this.isStaging()) {
      return featureId.includes('basic') || featureId.includes('ui_') || featureId.includes('auth_');
    } else {
      return featureId.includes('basic') || featureId.includes('ui_');
    }
  }

  public validateEnvironment(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.getConfiguration();

    // Validate required environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_META_APP_ID',
      'META_APP_SECRET',
      'ANTHROPIC_API_KEY'
    ];

    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        errors.push(`Missing required environment variable: ${envVar}`);
      }
    });

    // Validate configuration consistency
    if (config.security.httpsOnly && config.apiBaseUrl.startsWith('http://')) {
      errors.push('HTTPS required but API base URL is HTTP');
    }

    if (config.debugMode && this.isProduction()) {
      errors.push('Debug mode should not be enabled in production');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  public exportConfiguration(): string {
    const configs = this.getAllConfigurations();
    return JSON.stringify(configs, null, 2);
  }

  public importConfiguration(configJson: string): void {
    try {
      const configs = JSON.parse(configJson);
      Object.entries(configs).forEach(([env, config]) => {
        this.configurations.set(env as Environment, config as EnvironmentConfig);
      });
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error.message}`);
    }
  }

  public getEnvironmentStats() {
    const config = this.getConfiguration();
    return {
      environment: this.currentEnvironment,
      displayName: config.displayName,
      featuresEnabled: config.enabledFeatures.length,
      featuresDisabled: config.disabledFeatures.length,
      debugMode: config.debugMode,
      logLevel: config.logLevel,
      cacheStrategy: config.cacheStrategy,
      securityEnabled: config.security.cspEnabled && config.security.httpsOnly,
      rateLimits: config.rateLimits
    };
  }
}

// Singleton instance
export const environmentManager = new EnvironmentManager();