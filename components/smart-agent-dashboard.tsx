'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { clientSmartCoordinator } from '@/lib/agents/client-agent-coordinator';

interface AgentStatus {
  name: string;
  status: 'idle' | 'working' | 'completed' | 'failed' | 'helping';
  progress: number;
  currentTask?: any;
  tasks: any[];
  errors: string[];
  completedTasks: any[];
  capabilities: string[];
  workload: number;
  canHelp: boolean;
}

interface TaskStatus {
  id: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedTime: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedAgent?: string;
}

export default function SmartAgentDashboard() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  const [realTimeStatus, setRealTimeStatus] = useState<any>({});
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentReport, setDeploymentReport] = useState<any>(null);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(clientSmartCoordinator.getStatus());
      setTasks(clientSmartCoordinator.getTaskQueue());
      setRealTimeStatus(clientSmartCoordinator.getRealTimeStatus());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const deploySmartAgents = async () => {
    setIsDeploying(true);
    try {
      const report = await clientSmartCoordinator.deploySmartAgentArmy();
      setDeploymentReport(report);
    } catch (error) {
      console.error('Deployment failed:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'helping': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🚀 Smart Agent Army Dashboard</h1>
        <Button 
          onClick={deploySmartAgents} 
          disabled={isDeploying}
          className="bg-gradient-to-r from-blue-500 to-purple-600"
        >
          {isDeploying ? '🤖 Deploying...' : '🚀 Deploy Smart Agents'}
        </Button>
      </div>

      {/* Real-time Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{realTimeStatus.activeAgents || 0}</div>
            <p className="text-sm text-gray-600">Working Agents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{realTimeStatus.completedTasks || 0}</div>
            <p className="text-sm text-gray-600">Completed Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{realTimeStatus.pendingTasks || 0}</div>
            <p className="text-sm text-gray-600">Pending Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{realTimeStatus.efficiency?.toFixed(1) || 0}%</div>
            <p className="text-sm text-gray-600">Efficiency</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">🤖 Agents</TabsTrigger>
          <TabsTrigger value="tasks">📋 Tasks</TabsTrigger>
          <TabsTrigger value="coordination">🧠 Smart Coordination</TabsTrigger>
          <TabsTrigger value="report">📊 Report</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span>{agent.name}</span>
                    <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={agent.progress} className="h-2" />
                    <div className="text-xs text-gray-600">
                      Workload: {agent.workload}s | Can Help: {agent.canHelp ? '✅' : '❌'}
                    </div>
                    <div className="text-xs">
                      <strong>Capabilities:</strong> {agent.capabilities.join(', ')}
                    </div>
                    <div className="text-xs">
                      <strong>Completed:</strong> {agent.completedTasks.length} | 
                      <strong> Errors:</strong> {agent.errors.length}
                    </div>
                    {agent.currentTask && (
                      <div className="p-2 bg-blue-50 rounded text-xs">
                        <strong>Current:</strong> {agent.currentTask.description}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="space-y-2">
            {tasks.map((task) => (
              <Card key={task.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      <Badge variant="outline">{task.type}</Badge>
                      <span className="font-medium">{task.description}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Est. Time: {task.estimatedTime}s
                      {task.assignedAgent && ` | Assigned to: ${task.assignedAgent}`}
                    </div>
                  </div>
                  <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="coordination" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🧠 Smart Coordination Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Dynamic Task Distribution</h4>
                  <ul className="text-sm space-y-1">
                    <li>✅ Priority-based task assignment</li>
                    <li>✅ Capability-matching algorithm</li>
                    <li>✅ Workload balancing</li>
                    <li>✅ Dependency resolution</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Agent Helping System</h4>
                  <ul className="text-sm space-y-1">
                    <li>✅ Automatic task redistribution</li>
                    <li>✅ Overload detection</li>
                    <li>✅ Helper agent assignment</li>
                    <li>✅ Real-time coordination</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          {deploymentReport ? (
            <Card>
              <CardHeader>
                <CardTitle>📊 Deployment Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xl font-bold">{deploymentReport.totalTime.toFixed(2)}s</div>
                    <p className="text-sm text-gray-600">Total Time</p>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{deploymentReport.efficiency.toFixed(1)}%</div>
                    <p className="text-sm text-gray-600">Efficiency</p>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{deploymentReport.tasks.completed}</div>
                    <p className="text-sm text-gray-600">Tasks Completed</p>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{deploymentReport.performance.redistributions}</div>
                    <p className="text-sm text-gray-600">Redistributions</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">✅ Completed Tasks</h4>
                    <div className="space-y-1">
                      {deploymentReport.tasks.completedTasks.map((task: any) => (
                        <div key={task.id} className="text-sm p-2 bg-green-50 rounded">
                          {task.description} ({task.assignedAgent})
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {deploymentReport.tasks.failedTasks.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">❌ Failed Tasks</h4>
                      <div className="space-y-1">
                        {deploymentReport.tasks.failedTasks.map((task: any) => (
                          <div key={task.id} className="text-sm p-2 bg-red-50 rounded">
                            {task.description} ({task.assignedAgent})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600">Deploy agents to see the report</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}