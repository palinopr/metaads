/**
 * Conflict Resolver
 * Resolves conflicts between different agent implementations
 */

import { featureManager, FeatureConfig } from './feature-manager';
import { integrationManager } from './integration-manager';

export interface ConflictRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: ConflictCondition[];
  resolution: ConflictResolution;
}

export interface ConflictCondition {
  type: 'feature_enabled' | 'component_status' | 'environment' | 'user_role' | 'custom';
  operator: 'equals' | 'not_equals' | 'includes' | 'excludes' | 'greater_than' | 'less_than';
  value: any;
  field?: string;
}

export interface ConflictResolution {
  action: 'disable_feature' | 'enable_feature' | 'redirect' | 'show_fallback' | 'merge_components' | 'prioritize_component';
  target: string;
  fallback?: string;
  parameters?: Record<string, any>;
}

export interface ConflictLog {
  id: string;
  timestamp: string;
  rule: string;
  description: string;
  resolution: string;
  affected: string[];
  success: boolean;
  error?: string;
}

export class ConflictResolver {
  private rules: Map<string, ConflictRule> = new Map();
  private conflictLog: ConflictLog[] = [];
  private isResolving: boolean = false;

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    const defaultRules: ConflictRule[] = [
      // Auth Conflicts
      {
        id: 'auth_oauth_multi_account_conflict',
        name: 'OAuth Multi-Account Conflict',
        description: 'Disable multi-account if OAuth is not working',
        priority: 100,
        conditions: [
          {
            type: 'component_status',
            operator: 'not_equals',
            value: 'online',
            field: 'auth_oauth'
          },
          {
            type: 'feature_enabled',
            operator: 'equals',
            value: true,
            field: 'auth_multi_account'
          }
        ],
        resolution: {
          action: 'disable_feature',
          target: 'auth_multi_account',
          fallback: 'auth_oauth_flow'
        }
      },

      // API Conflicts
      {
        id: 'meta_api_ai_conflict',
        name: 'Meta API AI Features Conflict',
        description: 'Disable AI features if Meta API is offline',
        priority: 90,
        conditions: [
          {
            type: 'component_status',
            operator: 'not_equals',
            value: 'online',
            field: 'api_meta'
          },
          {
            type: 'feature_enabled',
            operator: 'equals',
            value: true,
            field: 'ai_insights_basic'
          }
        ],
        resolution: {
          action: 'disable_feature',
          target: 'ai_insights_basic',
          fallback: 'ui_dashboard'
        }
      },

      // Pipeline Conflicts
      {
        id: 'realtime_batch_conflict',
        name: 'Real-time Batch Processing Conflict',
        description: 'Fall back to batch processing if real-time fails',
        priority: 80,
        conditions: [
          {
            type: 'component_status',
            operator: 'not_equals',
            value: 'online',
            field: 'pipeline_realtime'
          },
          {
            type: 'feature_enabled',
            operator: 'equals',
            value: true,
            field: 'pipeline_real_time'
          }
        ],
        resolution: {
          action: 'disable_feature',
          target: 'pipeline_real_time',
          fallback: 'pipeline_batch_processing'
        }
      },

      // UI Conflicts
      {
        id: 'responsive_desktop_conflict',
        name: 'Responsive Design Mobile Conflict',
        description: 'Prioritize mobile layout on small screens',
        priority: 70,
        conditions: [
          {
            type: 'custom',
            operator: 'less_than',
            value: 768,
            field: 'screen_width'
          }
        ],
        resolution: {
          action: 'prioritize_component',
          target: 'mobile_layout',
          parameters: { force_mobile: true }
        }
      },

      // Memory Conflicts
      {
        id: 'memory_performance_conflict',
        name: 'Memory Performance Conflict',
        description: 'Disable heavy features when memory usage is high',
        priority: 95,
        conditions: [
          {
            type: 'component_status',
            operator: 'less_than',
            value: 50,
            field: 'memory_manager.healthScore'
          }
        ],
        resolution: {
          action: 'disable_feature',
          target: 'ai_insights_advanced',
          fallback: 'ai_insights_basic'
        }
      },

      // Offline Conflicts
      {
        id: 'offline_api_conflict',
        name: 'Offline API Conflict',
        description: 'Enable offline mode when APIs are unavailable',
        priority: 85,
        conditions: [
          {
            type: 'component_status',
            operator: 'equals',
            value: 'offline',
            field: 'api_meta'
          },
          {
            type: 'component_status',
            operator: 'equals',
            value: 'offline',
            field: 'api_claude'
          }
        ],
        resolution: {
          action: 'enable_feature',
          target: 'offline_support',
          parameters: { reason: 'api_unavailable' }
        }
      },

      // Environment Conflicts
      {
        id: 'production_debug_conflict',
        name: 'Production Debug Conflict',
        description: 'Disable debug features in production',
        priority: 110,
        conditions: [
          {
            type: 'environment',
            operator: 'equals',
            value: 'production'
          }
        ],
        resolution: {
          action: 'disable_feature',
          target: 'debug_mode',
          parameters: { force: true }
        }
      },

      // Theme Conflicts
      {
        id: 'theme_accessibility_conflict',
        name: 'Theme Accessibility Conflict',
        description: 'Ensure high contrast in accessibility mode',
        priority: 60,
        conditions: [
          {
            type: 'feature_enabled',
            operator: 'equals',
            value: true,
            field: 'ui_accessibility'
          },
          {
            type: 'custom',
            operator: 'equals',
            value: true,
            field: 'prefers_high_contrast'
          }
        ],
        resolution: {
          action: 'prioritize_component',
          target: 'high_contrast_theme',
          parameters: { override_user_theme: true }
        }
      },

      // Data Conflicts
      {
        id: 'cache_consistency_conflict',
        name: 'Cache Consistency Conflict',
        description: 'Clear cache when data inconsistency detected',
        priority: 75,
        conditions: [
          {
            type: 'custom',
            operator: 'greater_than',
            value: 0.1,
            field: 'cache_miss_rate'
          }
        ],
        resolution: {
          action: 'merge_components',
          target: 'cache_refresh',
          parameters: { clear_all: true, rebuild: true }
        }
      },

      // Testing Conflicts
      {
        id: 'ab_test_overlap_conflict',
        name: 'A/B Test Overlap Conflict',
        description: 'Prevent overlapping A/B tests',
        priority: 65,
        conditions: [
          {
            type: 'custom',
            operator: 'greater_than',
            value: 1,
            field: 'active_ab_tests'
          }
        ],
        resolution: {
          action: 'prioritize_component',
          target: 'primary_ab_test',
          parameters: { disable_others: true }
        }
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  public async resolveConflicts(): Promise<ConflictLog[]> {
    if (this.isResolving) {
      console.warn('Conflict resolution already in progress');
      return [];
    }

    this.isResolving = true;
    const resolvedConflicts: ConflictLog[] = [];

    try {
      // Sort rules by priority (higher priority first)
      const sortedRules = Array.from(this.rules.values())
        .sort((a, b) => b.priority - a.priority);

      for (const rule of sortedRules) {
        const conflict = await this.checkRule(rule);
        if (conflict) {
          resolvedConflicts.push(conflict);
        }
      }

      // Log resolved conflicts
      this.conflictLog.push(...resolvedConflicts);
      this.pruneLog();

    } catch (error) {
      console.error('Error during conflict resolution:', error);
    } finally {
      this.isResolving = false;
    }

    return resolvedConflicts;
  }

  private async checkRule(rule: ConflictRule): Promise<ConflictLog | null> {
    try {
      // Check if all conditions are met
      const conditionsMet = await this.evaluateConditions(rule.conditions);
      
      if (!conditionsMet) {
        return null;
      }

      // Apply resolution
      const success = await this.applyResolution(rule.resolution);
      
      const log: ConflictLog = {
        id: `${rule.id}_${Date.now()}`,
        timestamp: new Date().toISOString(),
        rule: rule.id,
        description: rule.description,
        resolution: rule.resolution.action,
        affected: [rule.resolution.target],
        success
      };

      if (success) {
        console.log(`Resolved conflict: ${rule.description}`);
      } else {
        console.warn(`Failed to resolve conflict: ${rule.description}`);
      }

      return log;

    } catch (error) {
      return {
        id: `${rule.id}_${Date.now()}_error`,
        timestamp: new Date().toISOString(),
        rule: rule.id,
        description: rule.description,
        resolution: rule.resolution.action,
        affected: [rule.resolution.target],
        success: false,
        error: error.message
      };
    }
  }

  private async evaluateConditions(conditions: ConflictCondition[]): Promise<boolean> {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition);
      if (!result) {
        return false;
      }
    }
    return true;
  }

  private async evaluateCondition(condition: ConflictCondition): Promise<boolean> {
    let actualValue: any;

    switch (condition.type) {
      case 'feature_enabled':
        actualValue = featureManager.isFeatureEnabled(condition.field!);
        break;

      case 'component_status':
        if (condition.field?.includes('.')) {
          // Handle nested properties like 'memory_manager.healthScore'
          const [componentName, property] = condition.field.split('.');
          const component = integrationManager.getComponentStatus(componentName);
          if (component && property in component) {
            actualValue = (component as any)[property];
          } else {
            actualValue = null;
          }
        } else {
          const component = integrationManager.getComponentStatus(condition.field!);
          actualValue = component?.status;
        }
        break;

      case 'environment':
        actualValue = process.env.NODE_ENV;
        break;

      case 'user_role':
        // This would come from user context
        actualValue = this.getCurrentUserRoles();
        break;

      case 'custom':
        actualValue = await this.evaluateCustomCondition(condition.field!);
        break;

      default:
        return false;
    }

    return this.compareValues(actualValue, condition.operator, condition.value);
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'not_equals':
        return actual !== expected;
      case 'includes':
        return Array.isArray(actual) && actual.includes(expected);
      case 'excludes':
        return Array.isArray(actual) && !actual.includes(expected);
      case 'greater_than':
        return typeof actual === 'number' && actual > expected;
      case 'less_than':
        return typeof actual === 'number' && actual < expected;
      default:
        return false;
    }
  }

  private async evaluateCustomCondition(field: string): Promise<any> {
    switch (field) {
      case 'screen_width':
        return typeof window !== 'undefined' ? window.innerWidth : 1920;
      
      case 'prefers_high_contrast':
        return typeof window !== 'undefined' ? 
          window.matchMedia('(prefers-contrast: high)').matches : false;
      
      case 'cache_miss_rate':
        // This would be implemented based on cache metrics
        return 0.05; // Placeholder
      
      case 'active_ab_tests':
        // This would check how many A/B tests are currently running
        return 1; // Placeholder
      
      default:
        return null;
    }
  }

  private getCurrentUserRoles(): string[] {
    // This would come from authentication context
    return ['user']; // Placeholder
  }

  private async applyResolution(resolution: ConflictResolution): Promise<boolean> {
    try {
      switch (resolution.action) {
        case 'disable_feature':
          return featureManager.disableFeature(resolution.target);

        case 'enable_feature':
          return featureManager.enableFeature(resolution.target);

        case 'redirect':
          if (typeof window !== 'undefined') {
            window.location.href = resolution.target;
            return true;
          }
          return false;

        case 'show_fallback':
          // This would update UI state to show fallback component
          console.log(`Showing fallback for ${resolution.target}: ${resolution.fallback}`);
          return true;

        case 'merge_components':
          // This would merge conflicting components
          console.log(`Merging components for ${resolution.target}`);
          return true;

        case 'prioritize_component':
          // This would prioritize one component over others
          console.log(`Prioritizing component ${resolution.target}`);
          return true;

        default:
          return false;
      }
    } catch (error) {
      console.error(`Failed to apply resolution ${resolution.action}:`, error);
      return false;
    }
  }

  public addRule(rule: ConflictRule): void {
    this.rules.set(rule.id, rule);
  }

  public removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  public getRule(ruleId: string): ConflictRule | null {
    return this.rules.get(ruleId) || null;
  }

  public getAllRules(): ConflictRule[] {
    return Array.from(this.rules.values());
  }

  public getConflictLog(): ConflictLog[] {
    return [...this.conflictLog];
  }

  public clearLog(): void {
    this.conflictLog = [];
  }

  private pruneLog(): void {
    // Keep only last 100 entries
    if (this.conflictLog.length > 100) {
      this.conflictLog = this.conflictLog.slice(-100);
    }

    // Remove entries older than 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.conflictLog = this.conflictLog.filter(log => 
      new Date(log.timestamp).getTime() > oneDayAgo
    );
  }

  public getStats() {
    const recentConflicts = this.conflictLog.filter(log => 
      Date.now() - new Date(log.timestamp).getTime() < (60 * 60 * 1000) // Last hour
    );

    const successfulResolutions = recentConflicts.filter(log => log.success);
    const failedResolutions = recentConflicts.filter(log => !log.success);

    return {
      totalRules: this.rules.size,
      recentConflicts: recentConflicts.length,
      successfulResolutions: successfulResolutions.length,
      failedResolutions: failedResolutions.length,
      successRate: recentConflicts.length > 0 ? 
        (successfulResolutions.length / recentConflicts.length) * 100 : 100,
      mostActiveRules: this.getMostActiveRules()
    };
  }

  private getMostActiveRules(): Array<{ ruleId: string; count: number }> {
    const ruleCounts: Record<string, number> = {};
    
    this.conflictLog.forEach(log => {
      ruleCounts[log.rule] = (ruleCounts[log.rule] || 0) + 1;
    });

    return Object.entries(ruleCounts)
      .map(([ruleId, count]) => ({ ruleId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // Automatic conflict resolution
  public startAutoResolution(intervalMs: number = 60000): void {
    setInterval(async () => {
      await this.resolveConflicts();
    }, intervalMs);
  }
}

// Singleton instance
export const conflictResolver = new ConflictResolver();