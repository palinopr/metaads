#!/usr/bin/env tsx

/**
 * Smart Agent Army Deployment Script
 * Deploys all agents with the new smart coordination system
 */

import { smartCoordinator } from '../lib/agents/agent-coordinator';

async function deploySmartAgentArmy() {
  console.log('🚀 DEPLOYING SMART AGENT ARMY WITH FULL AUTONOMY');
  console.log('=' .repeat(60));
  
  try {
    // Start the smart deployment
    const startTime = Date.now();
    const report = await smartCoordinator.deploySmartAgentArmy();
    
    console.log('\n📊 DEPLOYMENT COMPLETE - FINAL REPORT');
    console.log('=' .repeat(60));
    console.log(`Total Time: ${report.totalTime.toFixed(2)}s`);
    console.log(`Estimated Time: ${report.estimatedTime}s`);
    console.log(`Efficiency: ${report.efficiency.toFixed(1)}%`);
    console.log(`Tasks Completed: ${report.tasks.completed}/${report.tasks.total}`);
    console.log(`Tasks Per Second: ${report.performance.tasksPerSecond.toFixed(2)}`);
    console.log(`Redistributions: ${report.performance.redistributions}`);
    
    // Show agent status
    console.log('\n🤖 AGENT STATUS SUMMARY');
    console.log('-' .repeat(40));
    report.agents.forEach(agent => {
      const statusEmoji = agent.status === 'completed' ? '✅' : 
                         agent.status === 'working' ? '⚡' : 
                         agent.status === 'failed' ? '❌' : '⏸️';
      console.log(`${statusEmoji} ${agent.name}: ${agent.completedTasks.length} tasks, ${agent.errors.length} errors`);
    });
    
    // Show completed tasks
    if (report.tasks.completedTasks.length > 0) {
      console.log('\n✅ COMPLETED TASKS');
      console.log('-' .repeat(40));
      report.tasks.completedTasks.forEach(task => {
        console.log(`• ${task.description} (${task.assignedAgent})`);
      });
    }
    
    // Show failed tasks
    if (report.tasks.failedTasks.length > 0) {
      console.log('\n❌ FAILED TASKS');
      console.log('-' .repeat(40));
      report.tasks.failedTasks.forEach(task => {
        console.log(`• ${task.description} (${task.assignedAgent})`);
      });
    }
    
    console.log('\n🎉 SMART AGENT ARMY DEPLOYMENT SUCCESSFUL!');
    
    return report;
    
  } catch (error) {
    console.error('💥 DEPLOYMENT FAILED:', error);
    smartCoordinator.emergencyStop();
    throw error;
  }
}

// Real-time monitoring during deployment
function startRealTimeMonitoring() {
  const interval = setInterval(() => {
    const status = smartCoordinator.getRealTimeStatus();
    
    console.log(`📊 Live Status: ${status.activeAgents} working, ${status.idleAgents} idle, ${status.pendingTasks} pending, ${status.completedTasks} done (${status.efficiency.toFixed(1)}% efficiency)`);
    
    if (status.activeAgents === 0 && status.pendingTasks === 0) {
      clearInterval(interval);
    }
  }, 10000); // Update every 10 seconds
  
  return interval;
}

// Execute if run directly
if (require.main === module) {
  console.log('Starting real-time monitoring...');
  const monitoringInterval = startRealTimeMonitoring();
  
  deploySmartAgentArmy()
    .then(report => {
      clearInterval(monitoringInterval);
      console.log('\n🏁 All agents completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      clearInterval(monitoringInterval);
      console.error('\n💥 Deployment failed:', error.message);
      process.exit(1);
    });
}

export { deploySmartAgentArmy };