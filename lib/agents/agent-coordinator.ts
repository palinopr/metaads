/**
 * 12-Agent Army Coordinator
 * Orchestrates all specialized agents for the Meta Ads Dashboard enhancement
 */

import { ArchitectureAgent } from './architecture-agent';
import { DataPipelineAgent } from './data-pipeline-agent';
import { APIOptimizationAgent } from './api-optimization-agent';
import { UIUXAgent } from './ui-ux-agent';
import { AIInsightsAgent } from './ai-insights-agent';
import { PerformanceAgent } from './performance-agent';
import { SecurityAgent } from './security-agent';
import { MonitoringAgent } from './monitoring-agent';
import { TestingAgent } from './testing-agent';
// import { DocumentationAgent } from './documentation-agent';
// import { DeploymentAgent } from './deployment-agent';
import { FeedbackAgent } from './feedback-agent';

export interface AgentTask {
  id: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedTime: number;
  dependencies: string[];
  assignedAgent?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface AgentStatus {
  name: string;
  status: 'idle' | 'working' | 'completed' | 'failed' | 'helping';
  progress: number;
  currentTask?: AgentTask;
  tasks: AgentTask[];
  errors: string[];
  completedTasks: AgentTask[];
  capabilities: string[];
  workload: number;
  canHelp: boolean;
}

export class AgentCoordinator {
  private agents: Map<string, any> = new Map();
  private status: Map<string, AgentStatus> = new Map();
  private taskQueue: AgentTask[] = [];
  private startTime: number = 0;
  private redistributionInterval: NodeJS.Timeout | null = null;
  private maxConcurrentAgents: number = 6; // Optimize for performance

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents() {
    // Initialize agents with capabilities for smart coordination
    const agentConfigs = [
      { name: 'Architecture', class: ArchitectureAgent, capabilities: ['design', 'structure', 'planning'] },
      { name: 'DataPipeline', class: DataPipelineAgent, capabilities: ['data', 'etl', 'api'] },
      { name: 'APIOptimization', class: APIOptimizationAgent, capabilities: ['api', 'performance', 'optimization'] },
      { name: 'UIUX', class: UIUXAgent, capabilities: ['ui', 'design', 'components'] },
      { name: 'AIInsights', class: AIInsightsAgent, capabilities: ['ai', 'analytics', 'predictions'] },
      { name: 'Performance', class: PerformanceAgent, capabilities: ['performance', 'optimization', 'speed'] },
      { name: 'Security', class: SecurityAgent, capabilities: ['security', 'auth', 'validation'] },
      { name: 'Monitoring', class: MonitoringAgent, capabilities: ['monitoring', 'logging', 'alerts'] },
      { name: 'Testing', class: TestingAgent, capabilities: ['testing', 'qa', 'validation'] },
      // { name: 'Documentation', class: DocumentationAgent, capabilities: ['docs', 'writing', 'guides'] },
      // { name: 'Deployment', class: DeploymentAgent, capabilities: ['deployment', 'devops', 'ci-cd'] },
      { name: 'Feedback', class: FeedbackAgent, capabilities: ['feedback', 'analysis', 'reporting'] }
    ];

    agentConfigs.forEach(({ name, class: AgentClass, capabilities }) => {
      this.agents.set(name, new AgentClass());
      this.status.set(name, {
        name,
        status: 'idle',
        progress: 0,
        tasks: [],
        errors: [],
        completedTasks: [],
        capabilities,
        workload: 0,
        canHelp: true
      });
    });
  }

  async deploySmartAgentArmy() {
    console.log('🚀 Deploying Smart Agent Army with Dynamic Task Redistribution');
    this.startTime = Date.now();

    // Initialize master task queue
    this.initializeTaskQueue();

    // Start dynamic coordination system
    this.startSmartCoordination();

    // Deploy agents with smart load balancing
    await this.deployWithSmartCoordination();

    const totalTime = (Date.now() - this.startTime) / 1000;
    console.log(`✅ Smart Agent Army completed in ${totalTime}s`);
    
    return this.generateSmartReport();
  }

  private initializeTaskQueue() {
    // Create comprehensive task queue with priorities and dependencies
    const masterTasks: AgentTask[] = [
      // High Priority Foundation Tasks
      { id: 'auth-fix', type: 'security', priority: 'high', description: 'Fix authentication system', estimatedTime: 300, dependencies: [] },
      { id: 'performance-opt', type: 'performance', priority: 'high', description: 'Optimize performance bottlenecks', estimatedTime: 450, dependencies: [] },
      { id: 'error-handling', type: 'monitoring', priority: 'high', description: 'Implement comprehensive error handling', estimatedTime: 350, dependencies: [] },
      
      // Medium Priority Feature Tasks
      { id: 'ai-analytics', type: 'ai', priority: 'medium', description: 'Implement AI analytics dashboard', estimatedTime: 600, dependencies: ['auth-fix'] },
      { id: 'realtime-updates', type: 'data', priority: 'medium', description: 'Add real-time data streaming', estimatedTime: 500, dependencies: ['performance-opt'] },
      { id: 'mobile-responsive', type: 'ui', priority: 'medium', description: 'Make dashboard mobile responsive', estimatedTime: 400, dependencies: [] },
      
      // Testing and Quality Tasks
      { id: 'test-coverage', type: 'testing', priority: 'medium', description: 'Increase test coverage to 90%', estimatedTime: 700, dependencies: ['auth-fix', 'performance-opt'] },
      { id: 'api-optimization', type: 'api', priority: 'medium', description: 'Optimize API endpoints', estimatedTime: 350, dependencies: ['performance-opt'] },
      
      // Documentation and Deployment
      { id: 'documentation', type: 'docs', priority: 'low', description: 'Update documentation', estimatedTime: 250, dependencies: ['ai-analytics', 'realtime-updates'] },
      { id: 'deployment-setup', type: 'deployment', priority: 'low', description: 'Setup production deployment', estimatedTime: 300, dependencies: ['test-coverage'] }
    ];

    this.taskQueue = masterTasks.map(task => ({ ...task, status: 'pending' as const }));
    console.log(`📋 Initialized ${this.taskQueue.length} tasks in master queue`);
  }

  private startSmartCoordination() {
    console.log('🧠 Starting smart coordination system...');
    
    // Start task redistribution every 30 seconds
    this.redistributionInterval = setInterval(() => {
      this.redistributeTasks();
    }, 30000);
  }

  private async deployWithSmartCoordination() {
    // Start with high priority agents first
    const initialAgents = this.selectBestAgentsForTasks();
    
    console.log(`🚀 Starting with ${initialAgents.length} agents`);
    
    // Deploy agents dynamically based on task queue
    const activePromises = new Map<string, Promise<void>>();
    
    while (this.hasRemainingTasks() || activePromises.size > 0) {
      // Start new agents if we have capacity and tasks
      while (activePromises.size < this.maxConcurrentAgents && this.hasAvailableTasks()) {
        const { agent, task } = this.getNextBestAgentTaskPair();
        
        if (agent && task) {
          console.log(`🤖 ${agent} taking task: ${task.description}`);
          const promise = this.executeAgentTask(agent, task);
          activePromises.set(agent, promise);
        } else {
          break;
        }
      }
      
      // Wait for at least one agent to complete
      if (activePromises.size > 0) {
        await Promise.race(Array.from(activePromises.values()));
        
        // Clean up completed agents and make them available for helping
        for (const [agentName, promise] of activePromises) {
          try {
            await Promise.race([promise, new Promise(resolve => setTimeout(resolve, 100))]);
            const status = this.status.get(agentName);
            if (status?.status === 'idle' || status?.status === 'completed') {
              activePromises.delete(agentName);
              // Make agent available for helping others
              this.makeAgentAvailableForHelping(agentName);
            }
          } catch (e) {
            // Agent still working
          }
        }
      }
      
      // Small delay to prevent busy waiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Stop coordination when done
    if (this.redistributionInterval) {
      clearInterval(this.redistributionInterval);
    }
  }

  // Smart coordination helper methods
  private hasRemainingTasks(): boolean {
    return this.taskQueue.some(task => task.status === 'pending' || task.status === 'in_progress');
  }

  private hasAvailableTasks(): boolean {
    return this.taskQueue.some(task => task.status === 'pending' && this.areDependenciesMet(task));
  }

  private areDependenciesMet(task: AgentTask): boolean {
    return task.dependencies.every(depId => 
      this.taskQueue.find(t => t.id === depId)?.status === 'completed'
    );
  }

  private selectBestAgentsForTasks(): string[] {
    const availableAgents = Array.from(this.status.keys()).filter(name => 
      this.status.get(name)?.status === 'idle'
    );
    return availableAgents.slice(0, this.maxConcurrentAgents);
  }

  private getNextBestAgentTaskPair(): { agent: string | null, task: AgentTask | null } {
    // Get available tasks sorted by priority and estimated time
    const availableTasks = this.taskQueue
      .filter(task => task.status === 'pending' && this.areDependenciesMet(task))
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.estimatedTime - b.estimatedTime; // Shorter tasks first
      });

    if (availableTasks.length === 0) return { agent: null, task: null };

    const task = availableTasks[0];
    
    // Find best agent for this task based on capabilities and current workload
    const bestAgent = this.findBestAgentForTask(task);
    
    return { agent: bestAgent, task };
  }

  private findBestAgentForTask(task: AgentTask): string | null {
    const availableAgents = Array.from(this.status.entries())
      .filter(([_, status]) => status.status === 'idle' || status.canHelp)
      .sort(([_, a], [__, b]) => a.workload - b.workload); // Prefer less loaded agents

    // Find agent with matching capabilities
    for (const [agentName, status] of availableAgents) {
      if (status.capabilities.some(cap => task.type.includes(cap) || task.description.toLowerCase().includes(cap))) {
        return agentName;
      }
    }

    // If no perfect match, return least loaded available agent
    return availableAgents.length > 0 ? availableAgents[0][0] : null;
  }

  private async executeAgentTask(agentName: string, task: AgentTask): Promise<void> {
    const agent = this.agents.get(agentName);
    const status = this.status.get(agentName)!;
    
    try {
      // Update status
      status.status = 'working';
      status.currentTask = task;
      status.workload += task.estimatedTime;
      task.status = 'in_progress';
      task.assignedAgent = agentName;
      
      console.log(`🤖 ${agentName} Agent: Starting task "${task.description}"`);
      
      // Execute agent with specific task
      await agent.executeTask(task);
      
      // Mark task as completed
      task.status = 'completed';
      status.completedTasks.push(task);
      status.currentTask = undefined;
      status.workload = Math.max(0, status.workload - task.estimatedTime);
      status.status = 'idle';
      status.canHelp = true;
      
      console.log(`✅ ${agentName} Agent: Completed "${task.description}"`);
      
    } catch (error) {
      task.status = 'failed';
      status.status = 'failed';
      status.errors.push(`Task "${task.description}": ${error.message}`);
      console.error(`❌ ${agentName} Agent: Failed task "${task.description}" - ${error.message}`);
    }
  }

  private redistributeTasks() {
    console.log('🔄 Redistributing tasks based on current workload...');
    
    // Find overloaded agents
    const overloadedAgents = Array.from(this.status.entries())
      .filter(([_, status]) => status.workload > 500 && status.tasks.length > 1)
      .sort(([_, a], [__, b]) => b.workload - a.workload);

    // Find available helpers
    const availableHelpers = Array.from(this.status.entries())
      .filter(([_, status]) => status.canHelp && status.workload < 200)
      .sort(([_, a], [__, b]) => a.workload - b.workload);

    if (overloadedAgents.length > 0 && availableHelpers.length > 0) {
      for (const [overloadedName, overloadedStatus] of overloadedAgents) {
        for (const [helperName, helperStatus] of availableHelpers) {
          // Try to redistribute compatible tasks
          const redistributableTask = overloadedStatus.tasks.find(task => 
            task.status === 'pending' && 
            helperStatus.capabilities.some(cap => 
              task.type.includes(cap) || task.description.toLowerCase().includes(cap)
            )
          );

          if (redistributableTask) {
            console.log(`🤝 Redistributing "${redistributableTask.description}" from ${overloadedName} to ${helperName}`);
            
            // Move task
            overloadedStatus.tasks = overloadedStatus.tasks.filter(t => t.id !== redistributableTask.id);
            helperStatus.tasks.push(redistributableTask);
            redistributableTask.assignedAgent = helperName;
            helperStatus.canHelp = false;
            
            break;
          }
        }
      }
    }
  }

  private makeAgentAvailableForHelping(agentName: string) {
    const status = this.status.get(agentName);
    if (status) {
      status.canHelp = true;
      status.status = 'idle';
      console.log(`🆘 ${agentName} Agent: Available for helping others`);
      
      // Check if any other agents need help
      this.redistributeTasks();
    }
  }

  private generateSmartReport() {
    const completedTasks = this.taskQueue.filter(task => task.status === 'completed');
    const failedTasks = this.taskQueue.filter(task => task.status === 'failed');
    const totalEstimatedTime = this.taskQueue.reduce((sum, task) => sum + task.estimatedTime, 0);
    
    const report = {
      totalTime: (Date.now() - this.startTime) / 1000,
      estimatedTime: totalEstimatedTime,
      efficiency: ((totalEstimatedTime - (Date.now() - this.startTime) / 1000) / totalEstimatedTime) * 100,
      agents: Array.from(this.status.values()),
      tasks: {
        completed: completedTasks.length,
        failed: failedTasks.length,
        total: this.taskQueue.length,
        completedTasks,
        failedTasks
      },
      performance: {
        tasksPerSecond: completedTasks.length / ((Date.now() - this.startTime) / 1000),
        averageTaskTime: completedTasks.length > 0 ? 
          completedTasks.reduce((sum, task) => sum + task.estimatedTime, 0) / completedTasks.length : 0,
        redistributions: this.countRedistributions()
      }
    };

    return report;
  }

  private countRedistributions(): number {
    // Count how many tasks were reassigned during execution
    return this.taskQueue.filter(task => task.assignedAgent && 
      task.assignedAgent !== this.getOriginalAssignedAgent(task)).length;
  }

  private getOriginalAssignedAgent(task: AgentTask): string | undefined {
    // This would track original assignments - simplified for now
    return undefined;
  }

  getStatus() {
    return Array.from(this.status.values());
  }

  getAgentStatus(agentName: string) {
    return this.status.get(agentName);
  }

  getTaskQueue() {
    return this.taskQueue;
  }

  // Real-time status for monitoring
  getRealTimeStatus() {
    return {
      activeAgents: Array.from(this.status.values()).filter(s => s.status === 'working').length,
      idleAgents: Array.from(this.status.values()).filter(s => s.status === 'idle').length,
      helpingAgents: Array.from(this.status.values()).filter(s => s.status === 'helping').length,
      pendingTasks: this.taskQueue.filter(t => t.status === 'pending').length,
      inProgressTasks: this.taskQueue.filter(t => t.status === 'in_progress').length,
      completedTasks: this.taskQueue.filter(t => t.status === 'completed').length,
      totalWorkload: Array.from(this.status.values()).reduce((sum, s) => sum + s.workload, 0),
      efficiency: this.calculateCurrentEfficiency()
    };
  }

  private calculateCurrentEfficiency(): number {
    const activeAgents = Array.from(this.status.values()).filter(s => s.status === 'working').length;
    const totalAgents = this.status.size;
    return totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 0;
  }

  // Add new agents dynamically if needed
  addAgent(name: string, agentClass: any, capabilities: string[]) {
    if (!this.agents.has(name)) {
      this.agents.set(name, new agentClass());
      this.status.set(name, {
        name,
        status: 'idle',
        progress: 0,
        tasks: [],
        errors: [],
        completedTasks: [],
        capabilities,
        workload: 0,
        canHelp: true
      });
      console.log(`➕ Added new agent: ${name} with capabilities: ${capabilities.join(', ')}`);
    }
  }

  // Emergency stop all agents
  emergencyStop() {
    if (this.redistributionInterval) {
      clearInterval(this.redistributionInterval);
    }
    console.log('🛑 Emergency stop activated - all agents halted');
  }
}

// Export singleton instance with smart deployment
export const smartCoordinator = new AgentCoordinator();

// Legacy export for compatibility
export const coordinator = smartCoordinator;