/**
 * Rollback Manager
 * Handles rollback mechanisms for deployments and feature changes
 */

import { backupManager } from './backup-manager';
import { featureManager } from './feature-manager';
import { integrationManager } from './integration-manager';
import { migrationManager } from './migration-manager';

export interface RollbackTrigger {
  type: 'error_rate' | 'performance' | 'user_feedback' | 'manual' | 'health_check';
  threshold: number;
  timeWindow: number; // milliseconds
  enabled: boolean;
}

export interface RollbackPlan {
  id: string;
  name: string;
  description: string;
  triggers: RollbackTrigger[];
  actions: RollbackAction[];
  priority: number;
  createdAt: string;
  lastUsed?: string;
}

export interface RollbackAction {
  type: 'disable_feature' | 'restore_backup' | 'revert_migration' | 'switch_version' | 'clear_cache';
  target: string;
  parameters?: Record<string, any>;
  order: number;
}

export interface RollbackExecution {
  id: string;
  planId: string;
  trigger: string;
  startTime: string;
  endTime?: string;
  status: 'in_progress' | 'completed' | 'failed' | 'partial';
  actions: Array<{
    action: RollbackAction;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    error?: string;
    duration?: number;
  }>;
  metrics: {
    errorRate?: number;
    performanceScore?: number;
    healthScore?: number;
  };
}

export class RollbackManager {
  private rollbackPlans: Map<string, RollbackPlan> = new Map();
  private executionHistory: RollbackExecution[] = [];
  private monitoring: boolean = true;
  private monitoringInterval: NodeJS.Timer | null = null;

  constructor() {
    this.initializeDefaultPlans();
    this.startMonitoring();
  }

  private initializeDefaultPlans() {
    const defaultPlans: RollbackPlan[] = [
      // Critical System Failure Plan
      {
        id: 'critical_system_failure',
        name: 'Critical System Failure',
        description: 'Rollback plan for critical system failures',
        priority: 100,
        createdAt: new Date().toISOString(),
        triggers: [
          {
            type: 'error_rate',
            threshold: 0.1, // 10% error rate
            timeWindow: 300000, // 5 minutes
            enabled: true
          },
          {
            type: 'health_check',
            threshold: 30, // Health score below 30%
            timeWindow: 120000, // 2 minutes
            enabled: true
          }
        ],
        actions: [
          {
            type: 'disable_feature',
            target: 'ai_insights_advanced',
            order: 1
          },
          {
            type: 'disable_feature',
            target: 'pipeline_real_time',
            order: 2
          },
          {
            type: 'clear_cache',
            target: 'all',
            order: 3
          },
          {
            type: 'restore_backup',
            target: 'latest_stable',
            order: 4,
            parameters: {
              includeSystemConfig: true,
              includeFeatureFlags: true
            }
          }
        ]
      },

      // High Error Rate Plan
      {
        id: 'high_error_rate',
        name: 'High Error Rate Response',
        description: 'Rollback plan for high error rates',
        priority: 80,
        createdAt: new Date().toISOString(),
        triggers: [
          {
            type: 'error_rate',
            threshold: 0.05, // 5% error rate
            timeWindow: 600000, // 10 minutes
            enabled: true
          }
        ],
        actions: [
          {
            type: 'disable_feature',
            target: 'ai_insights_advanced',
            order: 1
          },
          {
            type: 'disable_feature',
            target: 'ai_creative_analysis',
            order: 2
          },
          {
            type: 'clear_cache',
            target: 'ai_cache',
            order: 3
          }
        ]
      },

      // Performance Degradation Plan
      {
        id: 'performance_degradation',
        name: 'Performance Degradation Response',
        description: 'Rollback plan for performance issues',
        priority: 60,
        createdAt: new Date().toISOString(),
        triggers: [
          {
            type: 'performance',
            threshold: 3000, // 3 second response time
            timeWindow: 900000, // 15 minutes
            enabled: true
          }
        ],
        actions: [
          {
            type: 'disable_feature',
            target: 'performance_memory_management',
            order: 1
          },
          {
            type: 'clear_cache',
            target: 'memory_cache',
            order: 2
          }
        ]
      },

      // API Failure Plan
      {
        id: 'api_failure',
        name: 'API Failure Response',
        description: 'Rollback plan for API failures',
        priority: 70,
        createdAt: new Date().toISOString(),
        triggers: [
          {
            type: 'health_check',
            threshold: 50, // API health below 50%
            timeWindow: 180000, // 3 minutes
            enabled: true
          }
        ],
        actions: [
          {
            type: 'disable_feature',
            target: 'pipeline_real_time',
            order: 1
          },
          {
            type: 'disable_feature',
            target: 'ai_insights_basic',
            order: 2
          },
          {
            type: 'switch_version',
            target: 'offline_mode',
            order: 3
          }
        ]
      },

      // Feature Rollback Plan
      {
        id: 'feature_rollback',
        name: 'Feature Rollback',
        description: 'Generic feature rollback plan',
        priority: 40,
        createdAt: new Date().toISOString(),
        triggers: [
          {
            type: 'user_feedback',
            threshold: 2.0, // Average rating below 2.0
            timeWindow: 3600000, // 1 hour
            enabled: false // Manual trigger only
          }
        ],
        actions: [
          {
            type: 'disable_feature',
            target: 'target_feature',
            order: 1
          },
          {
            type: 'restore_backup',
            target: 'pre_feature_backup',
            order: 2,
            parameters: {
              includeFeatureFlags: true
            }
          }
        ]
      }
    ];

    defaultPlans.forEach(plan => {
      this.rollbackPlans.set(plan.id, plan);
    });
  }

  private startMonitoring() {
    if (this.monitoring && !this.monitoringInterval) {
      this.monitoringInterval = setInterval(() => {
        this.checkTriggers();
      }, 30000); // Check every 30 seconds
    }
  }

  private async checkTriggers() {
    if (!this.monitoring) return;

    try {
      const metrics = await this.getCurrentMetrics();
      
      // Check each rollback plan
      for (const [planId, plan] of this.rollbackPlans) {
        for (const trigger of plan.triggers) {
          if (!trigger.enabled) continue;

          const shouldTrigger = await this.evaluateTrigger(trigger, metrics);
          if (shouldTrigger) {
            console.warn(`Rollback trigger activated: ${planId} - ${trigger.type}`);
            await this.executeRollback(planId, `${trigger.type}_trigger`);
            break; // Only execute one rollback per check
          }
        }
      }
    } catch (error) {
      console.error('Error checking rollback triggers:', error);
    }
  }

  private async getCurrentMetrics() {
    const integrationStatus = integrationManager.getStatus();
    
    // Calculate error rate (simplified)
    const errorRate = this.calculateErrorRate();
    
    // Calculate performance score (simplified)
    const performanceScore = this.calculatePerformanceScore();
    
    // Get health score from integration manager
    const healthScore = this.calculateHealthScore(integrationStatus);

    return {
      errorRate,
      performanceScore,
      healthScore,
      timestamp: Date.now()
    };
  }

  private calculateErrorRate(): number {
    // This would be implemented based on actual error tracking
    // For now, return a mock value
    return Math.random() * 0.02; // 0-2% error rate
  }

  private calculatePerformanceScore(): number {
    // This would be implemented based on actual performance metrics
    // Return response time in milliseconds
    return Math.random() * 2000 + 500; // 500-2500ms
  }

  private calculateHealthScore(integrationStatus: any): number {
    if (!integrationStatus || !integrationStatus.components) {
      return 0;
    }

    const healthScores = integrationStatus.components.map((c: any) => c.healthScore || 0);
    return healthScores.reduce((sum: number, score: number) => sum + score, 0) / healthScores.length;
  }

  private async evaluateTrigger(trigger: RollbackTrigger, metrics: any): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - trigger.timeWindow;

    switch (trigger.type) {
      case 'error_rate':
        return metrics.errorRate > trigger.threshold;

      case 'performance':
        return metrics.performanceScore > trigger.threshold;

      case 'health_check':
        return metrics.healthScore < trigger.threshold;

      case 'user_feedback':
        // This would check user feedback metrics
        return false; // Not implemented for automatic triggering

      case 'manual':
        return false; // Manual triggers don't auto-execute

      default:
        return false;
    }
  }

  public async executeRollback(planId: string, triggerReason: string): Promise<string> {
    const plan = this.rollbackPlans.get(planId);
    if (!plan) {
      throw new Error(`Rollback plan not found: ${planId}`);
    }

    const executionId = `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const execution: RollbackExecution = {
      id: executionId,
      planId,
      trigger: triggerReason,
      startTime: new Date().toISOString(),
      status: 'in_progress',
      actions: plan.actions.map(action => ({
        action,
        status: 'pending'
      })),
      metrics: await this.getCurrentMetrics()
    };

    this.executionHistory.push(execution);

    try {
      console.log(`Starting rollback execution: ${plan.name}`);
      
      // Create emergency backup before rollback
      const backupId = await backupManager.createBackup({
        name: `Emergency backup before rollback ${executionId}`,
        description: `Backup created before executing rollback: ${plan.name}`,
        type: 'pre-deployment',
        tags: ['emergency', 'pre-rollback']
      });

      // Sort actions by order
      const sortedActions = [...plan.actions].sort((a, b) => a.order - b.order);

      // Execute actions sequentially
      for (let i = 0; i < sortedActions.length; i++) {
        const actionExecution = execution.actions[i];
        actionExecution.status = 'in_progress';
        
        const startTime = Date.now();
        
        try {
          await this.executeAction(sortedActions[i]);
          actionExecution.status = 'completed';
          actionExecution.duration = Date.now() - startTime;
          
          console.log(`Completed rollback action: ${sortedActions[i].type} - ${sortedActions[i].target}`);
          
        } catch (error) {
          actionExecution.status = 'failed';
          actionExecution.error = error.message;
          actionExecution.duration = Date.now() - startTime;
          
          console.error(`Failed rollback action: ${sortedActions[i].type} - ${sortedActions[i].target}`, error);
          
          // Continue with other actions unless it's critical
          if (plan.priority >= 90) {
            execution.status = 'failed';
            execution.endTime = new Date().toISOString();
            throw error;
          }
        }
      }

      // Check if all actions completed
      const failedActions = execution.actions.filter(a => a.status === 'failed');
      if (failedActions.length === 0) {
        execution.status = 'completed';
      } else if (failedActions.length < execution.actions.length) {
        execution.status = 'partial';
      } else {
        execution.status = 'failed';
      }

      execution.endTime = new Date().toISOString();
      
      // Update plan last used
      plan.lastUsed = new Date().toISOString();
      
      console.log(`Rollback execution ${execution.status}: ${plan.name}`);
      
      return executionId;

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date().toISOString();
      
      console.error(`Rollback execution failed: ${plan.name}`, error);
      throw error;
    }
  }

  private async executeAction(action: RollbackAction): Promise<void> {
    switch (action.type) {
      case 'disable_feature':
        const disabled = featureManager.disableFeature(action.target);
        if (!disabled) {
          throw new Error(`Failed to disable feature: ${action.target}`);
        }
        break;

      case 'restore_backup':
        if (action.target === 'latest_stable') {
          const backups = backupManager.getBackups();
          const stableBackup = backups.find(b => b.type === 'automatic' || b.type === 'manual');
          if (stableBackup) {
            await backupManager.restoreBackup(stableBackup.id, action.parameters);
          } else {
            throw new Error('No stable backup found');
          }
        } else {
          await backupManager.restoreBackup(action.target, action.parameters);
        }
        break;

      case 'revert_migration':
        const success = await migrationManager.rollbackMigration(action.target);
        if (!success) {
          throw new Error(`Failed to revert migration: ${action.target}`);
        }
        break;

      case 'switch_version':
        if (action.target === 'offline_mode') {
          featureManager.enableFeature('offline_support');
          featureManager.disableFeature('pipeline_real_time');
        }
        // Other version switches would be implemented here
        break;

      case 'clear_cache':
        await this.clearCache(action.target);
        break;

      default:
        throw new Error(`Unknown rollback action type: ${action.type}`);
    }
  }

  private async clearCache(target: string): Promise<void> {
    if (typeof window !== 'undefined') {
      if (target === 'all' || target === 'browser_cache') {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        } catch (error) {
          console.warn('Failed to clear browser cache:', error);
        }
      }

      // Clear localStorage items based on target
      const storagePatterns: Record<string, string[]> = {
        ai_cache: ['ai_', 'claude_', 'insights_'],
        memory_cache: ['performance_', 'memory_'],
        all: [''] // Empty string matches all keys
      };

      const patterns = storagePatterns[target] || [];
      patterns.forEach(pattern => {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (pattern === '' || key.includes(pattern))) {
            localStorage.removeItem(key);
          }
        }
      });
    }
  }

  public addRollbackPlan(plan: Omit<RollbackPlan, 'id' | 'createdAt'>): string {
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullPlan: RollbackPlan = {
      ...plan,
      id: planId,
      createdAt: new Date().toISOString()
    };

    this.rollbackPlans.set(planId, fullPlan);
    return planId;
  }

  public updateRollbackPlan(planId: string, updates: Partial<RollbackPlan>): boolean {
    const plan = this.rollbackPlans.get(planId);
    if (!plan) {
      return false;
    }

    const updatedPlan = { ...plan, ...updates };
    this.rollbackPlans.set(planId, updatedPlan);
    return true;
  }

  public deleteRollbackPlan(planId: string): boolean {
    return this.rollbackPlans.delete(planId);
  }

  public getRollbackPlans(): RollbackPlan[] {
    return Array.from(this.rollbackPlans.values())
      .sort((a, b) => b.priority - a.priority);
  }

  public getRollbackPlan(planId: string): RollbackPlan | null {
    return this.rollbackPlans.get(planId) || null;
  }

  public getExecutionHistory(): RollbackExecution[] {
    return [...this.executionHistory]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  public getExecution(executionId: string): RollbackExecution | null {
    return this.executionHistory.find(e => e.id === executionId) || null;
  }

  public enableMonitoring(): void {
    this.monitoring = true;
    this.startMonitoring();
  }

  public disableMonitoring(): void {
    this.monitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  public getStats() {
    const executions = this.getExecutionHistory();
    const recentExecutions = executions.filter(e => 
      Date.now() - new Date(e.startTime).getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    const statusCounts = executions.reduce((counts, exec) => {
      counts[exec.status] = (counts[exec.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return {
      totalPlans: this.rollbackPlans.size,
      totalExecutions: executions.length,
      recentExecutions: recentExecutions.length,
      successRate: executions.length > 0 ? 
        ((statusCounts.completed || 0) + (statusCounts.partial || 0)) / executions.length * 100 : 100,
      monitoringEnabled: this.monitoring,
      statusBreakdown: statusCounts,
      mostUsedPlans: this.getMostUsedPlans()
    };
  }

  private getMostUsedPlans(): Array<{ planId: string; name: string; usageCount: number }> {
    const usageCounts: Record<string, number> = {};
    
    this.executionHistory.forEach(exec => {
      usageCounts[exec.planId] = (usageCounts[exec.planId] || 0) + 1;
    });

    return Object.entries(usageCounts)
      .map(([planId, count]) => {
        const plan = this.rollbackPlans.get(planId);
        return {
          planId,
          name: plan?.name || 'Unknown',
          usageCount: count
        };
      })
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);
  }

  public destroy() {
    this.disableMonitoring();
    this.rollbackPlans.clear();
    this.executionHistory = [];
  }
}

// Singleton instance
export const rollbackManager = new RollbackManager();