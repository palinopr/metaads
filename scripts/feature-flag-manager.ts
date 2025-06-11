#!/usr/bin/env ts-node

/**
 * Feature Flag Management System for Meta Ads Dashboard
 * Provides gradual rollouts, A/B testing, and feature toggles
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  rolloutStrategy: 'all' | 'percentage' | 'userIds' | 'canary';
  rolloutPercentage?: number;
  targetUserIds?: string[];
  canaryGroups?: string[];
  conditions?: FeatureFlagCondition[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    environment: string;
    version: string;
  };
  analytics?: {
    conversions: number;
    impressions: number;
    conversionRate: number;
  };
}

interface FeatureFlagCondition {
  type: 'userAttribute' | 'segment' | 'time' | 'geography';
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'in';
  value: any;
  attribute?: string;
}

interface RolloutPlan {
  name: string;
  targetFlag: string;
  phases: RolloutPhase[];
  rollbackConditions: RollbackCondition[];
}

interface RolloutPhase {
  name: string;
  percentage: number;
  duration: string;
  successCriteria: SuccessCriteria[];
}

interface RollbackCondition {
  metric: string;
  threshold: number;
  operator: 'greater' | 'less';
}

interface SuccessCriteria {
  metric: string;
  threshold: number;
  operator: 'greater' | 'less';
}

class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private rolloutPlans: Map<string, RolloutPlan> = new Map();
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || join(process.cwd(), 'feature-flags.json');
    this.loadFlags();
  }

  /**
   * Load feature flags from configuration file
   */
  private loadFlags(): void {
    try {
      const config = JSON.parse(readFileSync(this.configPath, 'utf8'));
      
      if (config.flags) {
        config.flags.forEach((flag: FeatureFlag) => {
          this.flags.set(flag.name, flag);
        });
      }

      if (config.rolloutPlans) {
        config.rolloutPlans.forEach((plan: RolloutPlan) => {
          this.rolloutPlans.set(plan.name, plan);
        });
      }
    } catch (error) {
      console.warn('No existing feature flags configuration found, starting fresh');
    }
  }

  /**
   * Save feature flags to configuration file
   */
  private saveFlags(): void {
    const config = {
      flags: Array.from(this.flags.values()),
      rolloutPlans: Array.from(this.rolloutPlans.values()),
      lastUpdated: new Date().toISOString()
    };

    writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Create a new feature flag
   */
  createFlag(
    name: string,
    description: string,
    environment: string = 'development',
    createdBy: string = 'system'
  ): FeatureFlag {
    const flag: FeatureFlag = {
      name,
      description,
      enabled: false,
      rolloutStrategy: 'all',
      conditions: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy,
        environment,
        version: '1.0.0'
      }
    };

    this.flags.set(name, flag);
    this.saveFlags();
    
    console.log(`✅ Created feature flag: ${name}`);
    return flag;
  }

  /**
   * Update a feature flag
   */
  updateFlag(name: string, updates: Partial<FeatureFlag>): FeatureFlag | null {
    const flag = this.flags.get(name);
    if (!flag) {
      console.error(`❌ Feature flag not found: ${name}`);
      return null;
    }

    const updatedFlag = {
      ...flag,
      ...updates,
      metadata: {
        ...flag.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    this.flags.set(name, updatedFlag);
    this.saveFlags();
    
    console.log(`✅ Updated feature flag: ${name}`);
    return updatedFlag;
  }

  /**
   * Enable a feature flag
   */
  enableFlag(name: string): boolean {
    const result = this.updateFlag(name, { enabled: true });
    return result !== null;
  }

  /**
   * Disable a feature flag
   */
  disableFlag(name: string): boolean {
    const result = this.updateFlag(name, { enabled: false });
    return result !== null;
  }

  /**
   * Delete a feature flag
   */
  deleteFlag(name: string): boolean {
    if (this.flags.has(name)) {
      this.flags.delete(name);
      this.saveFlags();
      console.log(`✅ Deleted feature flag: ${name}`);
      return true;
    }
    
    console.error(`❌ Feature flag not found: ${name}`);
    return false;
  }

  /**
   * Get a feature flag
   */
  getFlag(name: string): FeatureFlag | null {
    return this.flags.get(name) || null;
  }

  /**
   * List all feature flags
   */
  listFlags(environment?: string): FeatureFlag[] {
    const allFlags = Array.from(this.flags.values());
    
    if (environment) {
      return allFlags.filter(flag => flag.metadata.environment === environment);
    }
    
    return allFlags;
  }

  /**
   * Evaluate if a feature flag is enabled for a given context
   */
  isEnabled(
    flagName: string,
    context: {
      userId?: string;
      userAttributes?: Record<string, any>;
      segment?: string;
      geography?: string;
    } = {}
  ): boolean {
    const flag = this.flags.get(flagName);
    if (!flag || !flag.enabled) {
      return false;
    }

    // Check conditions first
    if (flag.conditions && flag.conditions.length > 0) {
      const conditionsMet = flag.conditions.every(condition => 
        this.evaluateCondition(condition, context)
      );
      if (!conditionsMet) {
        return false;
      }
    }

    // Apply rollout strategy
    switch (flag.rolloutStrategy) {
      case 'all':
        return true;

      case 'percentage':
        if (flag.rolloutPercentage && context.userId) {
          return this.hashUserId(context.userId) < flag.rolloutPercentage;
        }
        return false;

      case 'userIds':
        if (flag.targetUserIds && context.userId) {
          return flag.targetUserIds.includes(context.userId);
        }
        return false;

      case 'canary':
        if (flag.canaryGroups && context.segment) {
          return flag.canaryGroups.includes(context.segment);
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(
    condition: FeatureFlagCondition,
    context: any
  ): boolean {
    let value: any;

    switch (condition.type) {
      case 'userAttribute':
        value = context.userAttributes?.[condition.attribute || ''];
        break;
      case 'segment':
        value = context.segment;
        break;
      case 'geography':
        value = context.geography;
        break;
      case 'time':
        value = new Date().getTime();
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'greater':
        return Number(value) > Number(condition.value);
      case 'less':
        return Number(value) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      default:
        return false;
    }
  }

  /**
   * Hash user ID for percentage rollouts
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }

  /**
   * Create a gradual rollout plan
   */
  createRolloutPlan(
    name: string,
    targetFlag: string,
    phases: RolloutPhase[],
    rollbackConditions: RollbackCondition[]
  ): RolloutPlan {
    const plan: RolloutPlan = {
      name,
      targetFlag,
      phases,
      rollbackConditions
    };

    this.rolloutPlans.set(name, plan);
    this.saveFlags();
    
    console.log(`✅ Created rollout plan: ${name}`);
    return plan;
  }

  /**
   * Execute a rollout plan phase
   */
  executeRolloutPhase(planName: string, phaseIndex: number): boolean {
    const plan = this.rolloutPlans.get(planName);
    if (!plan) {
      console.error(`❌ Rollout plan not found: ${planName}`);
      return false;
    }

    const phase = plan.phases[phaseIndex];
    if (!phase) {
      console.error(`❌ Phase ${phaseIndex} not found in plan: ${planName}`);
      return false;
    }

    // Update the target flag's rollout percentage
    const result = this.updateFlag(plan.targetFlag, {
      rolloutStrategy: 'percentage',
      rolloutPercentage: phase.percentage
    });

    if (result) {
      console.log(`✅ Executed phase ${phaseIndex} of rollout plan: ${planName}`);
      console.log(`   Rollout percentage: ${phase.percentage}%`);
      return true;
    }

    return false;
  }

  /**
   * Rollback a feature flag
   */
  rollbackFlag(flagName: string): boolean {
    return this.updateFlag(flagName, {
      enabled: false,
      rolloutStrategy: 'all',
      rolloutPercentage: 0
    }) !== null;
  }

  /**
   * Export flags for deployment
   */
  exportFlags(environment: string): Record<string, any> {
    const envFlags = this.listFlags(environment);
    const exported: Record<string, any> = {};

    envFlags.forEach(flag => {
      exported[flag.name] = {
        enabled: flag.enabled,
        rolloutStrategy: flag.rolloutStrategy,
        rolloutPercentage: flag.rolloutPercentage,
        conditions: flag.conditions
      };
    });

    return exported;
  }

  /**
   * Import flags from external source
   */
  importFlags(flags: FeatureFlag[]): void {
    flags.forEach(flag => {
      this.flags.set(flag.name, flag);
    });
    this.saveFlags();
    console.log(`✅ Imported ${flags.length} feature flags`);
  }

  /**
   * Generate metrics report
   */
  generateMetricsReport(): any {
    const flags = Array.from(this.flags.values());
    
    return {
      totalFlags: flags.length,
      enabledFlags: flags.filter(f => f.enabled).length,
      disabledFlags: flags.filter(f => !f.enabled).length,
      rolloutStrategies: {
        all: flags.filter(f => f.rolloutStrategy === 'all').length,
        percentage: flags.filter(f => f.rolloutStrategy === 'percentage').length,
        userIds: flags.filter(f => f.rolloutStrategy === 'userIds').length,
        canary: flags.filter(f => f.rolloutStrategy === 'canary').length
      },
      environments: flags.reduce((acc, flag) => {
        acc[flag.metadata.environment] = (acc[flag.metadata.environment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const manager = new FeatureFlagManager();

  switch (command) {
    case 'create':
      if (args.length < 3) {
        console.error('Usage: create <name> <description> [environment] [createdBy]');
        process.exit(1);
      }
      manager.createFlag(args[1], args[2], args[3], args[4]);
      break;

    case 'enable':
      if (args.length < 2) {
        console.error('Usage: enable <name>');
        process.exit(1);
      }
      manager.enableFlag(args[1]);
      break;

    case 'disable':
      if (args.length < 2) {
        console.error('Usage: disable <name>');
        process.exit(1);
      }
      manager.disableFlag(args[1]);
      break;

    case 'delete':
      if (args.length < 2) {
        console.error('Usage: delete <name>');
        process.exit(1);
      }
      manager.deleteFlag(args[1]);
      break;

    case 'list':
      const flags = manager.listFlags(args[1]);
      console.table(flags.map(f => ({
        name: f.name,
        enabled: f.enabled,
        strategy: f.rolloutStrategy,
        environment: f.metadata.environment
      })));
      break;

    case 'rollout':
      if (args.length < 3) {
        console.error('Usage: rollout <flagName> <percentage>');
        process.exit(1);
      }
      manager.updateFlag(args[1], {
        rolloutStrategy: 'percentage',
        rolloutPercentage: parseInt(args[2])
      });
      break;

    case 'export':
      if (args.length < 2) {
        console.error('Usage: export <environment>');
        process.exit(1);
      }
      const exported = manager.exportFlags(args[1]);
      console.log(JSON.stringify(exported, null, 2));
      break;

    case 'metrics':
      const metrics = manager.generateMetricsReport();
      console.log('Feature Flag Metrics:');
      console.table(metrics);
      break;

    case 'test':
      if (args.length < 2) {
        console.error('Usage: test <flagName> [userId] [userAttributes]');
        process.exit(1);
      }
      
      const context: any = {};
      if (args[2]) context.userId = args[2];
      if (args[3]) {
        try {
          context.userAttributes = JSON.parse(args[3]);
        } catch (e) {
          console.error('Invalid JSON for user attributes');
          process.exit(1);
        }
      }
      
      const isEnabled = manager.isEnabled(args[1], context);
      console.log(`Flag "${args[1]}" is ${isEnabled ? 'ENABLED' : 'DISABLED'} for context:`, context);
      break;

    default:
      console.log(`
Feature Flag Manager - Meta Ads Dashboard

Commands:
  create <name> <description> [environment] [createdBy]  - Create a new feature flag
  enable <name>                                         - Enable a feature flag
  disable <name>                                        - Disable a feature flag
  delete <name>                                         - Delete a feature flag
  list [environment]                                    - List feature flags
  rollout <flagName> <percentage>                       - Set percentage rollout
  export <environment>                                  - Export flags for deployment
  metrics                                              - Show metrics report
  test <flagName> [userId] [userAttributes]            - Test flag evaluation

Examples:
  npm run feature-flags create "new-dashboard" "New dashboard UI" "staging" "developer"
  npm run feature-flags enable "new-dashboard"
  npm run feature-flags rollout "new-dashboard" 25
  npm run feature-flags test "new-dashboard" "user123" '{"premium": true}'
      `);
      break;
  }
}

if (require.main === module) {
  main();
}

export { FeatureFlagManager, FeatureFlag, RolloutPlan };