/**
 * Integration Status Dashboard
 * Provides comprehensive view of system integration status
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIntegration, useSystemHealth } from '@/components/integration-provider';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  RefreshCw, 
  Settings, 
  Database,
  Shield,
  Zap,
  BarChart3,
  Users,
  Clock
} from 'lucide-react';

interface ComponentHealthProps {
  component: {
    name: string;
    status: 'online' | 'offline' | 'degraded';
    healthScore: number;
    lastCheck: string;
    errors: string[];
    dependencies: string[];
    metrics: Record<string, number>;
  };
}

function ComponentHealth({ component }: ComponentHealthProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'offline': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'offline': return <XCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{component.name}</CardTitle>
          <div className={`flex items-center gap-1 ${getStatusColor(component.status)}`}>
            {getStatusIcon(component.status)}
            <span className="text-xs capitalize">{component.status}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Health Score</span>
            <span>{component.healthScore}%</span>
          </div>
          <Progress value={component.healthScore} className="h-1" />
        </div>
        
        {component.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {component.errors[0]}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="text-xs text-muted-foreground">
          Last check: {new Date(component.lastCheck).toLocaleTimeString()}
        </div>
        
        {Object.keys(component.metrics).length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium">Metrics</div>
            {Object.entries(component.metrics).slice(0, 2).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span>{key}</span>
                <span>{typeof value === 'number' ? value.toFixed(2) : value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FeatureStatusProps {
  features: Array<{
    id: string;
    name: string;
    enabled: boolean;
    rolloutPercentage: number;
    dependencies: string[];
  }>;
}

function FeatureStatus({ features }: FeatureStatusProps) {
  return (
    <div className="space-y-2">
      {features.map((feature) => (
        <Card key={feature.id}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium text-sm">{feature.name}</div>
                <div className="text-xs text-muted-foreground">
                  Rollout: {feature.rolloutPercentage}%
                </div>
              </div>
              <Badge variant={feature.enabled ? 'default' : 'secondary'}>
                {feature.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            {feature.rolloutPercentage < 100 && feature.enabled && (
              <Progress value={feature.rolloutPercentage} className="h-1 mt-2" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function IntegrationStatusDashboard() {
  const {
    integrationStatus,
    refreshStatus,
    getFeatureStats,
    getConflictStats
  } = useIntegration();
  
  const { systemHealth } = useSystemHealth();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [featureStats, setFeatureStats] = useState<any>(null);
  const [conflictStats, setConflictStats] = useState<any>(null);

  useEffect(() => {
    setFeatureStats(getFeatureStats());
    setConflictStats(getConflictStats());
  }, [getFeatureStats, getConflictStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshStatus();
      setFeatureStats(getFeatureStats());
      setConflictStats(getConflictStats());
    } finally {
      setIsRefreshing(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'unhealthy': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'degraded': return <AlertTriangle className="h-5 w-5" />;
      case 'unhealthy': return <XCircle className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integration Status</h1>
          <p className="text-muted-foreground">
            Monitor system health and integration status
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={getHealthColor(systemHealth)}>
                {getHealthIcon(systemHealth)}
              </div>
              <div>
                <div className="font-medium">System Health</div>
                <div className={`text-sm capitalize ${getHealthColor(systemHealth)}`}>
                  {systemHealth}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium">Components</div>
                <div className="text-sm text-muted-foreground">
                  {integrationStatus?.components.length || 0} registered
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="font-medium">Features</div>
                <div className="text-sm text-muted-foreground">
                  {featureStats?.enabled || 0} enabled
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">Conflicts</div>
                <div className="text-sm text-muted-foreground">
                  {conflictStats?.recentConflicts || 0} recent
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status */}
      <Tabs defaultValue="components" className="space-y-4">
        <TabsList>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrationStatus?.components.map((component) => (
              <ComponentHealth key={component.name} component={component} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Feature Statistics</CardTitle>
                <CardDescription>Overview of feature flags and rollouts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {featureStats?.enabled || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Enabled</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-500">
                      {featureStats?.disabled || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Disabled</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Rollout Features</span>
                    <span>{featureStats?.rolloutFeatures || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Environment</span>
                    <span className="capitalize">{featureStats?.environment}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>Current user feature access</CardDescription>
              </CardHeader>
              <CardContent>
                {featureStats?.userProfile ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>User ID</span>
                      <span className="font-mono text-xs">
                        {featureStats.userProfile.id.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Roles</span>
                      <span>{featureStats.userProfile.roles.join(', ')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Segment</span>
                      <span>{featureStats.userProfile.segment}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Enrolled Features</span>
                      <span>{featureStats.userProfile.enrolledFeatures}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No user profile configured
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conflict Resolution</CardTitle>
                <CardDescription>Automatic conflict resolution statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      {conflictStats?.recentConflicts || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Recent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {conflictStats?.successRate?.toFixed(1) || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Rules</span>
                    <span>{conflictStats?.totalRules || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Successful</span>
                    <span className="text-green-500">
                      {conflictStats?.successfulResolutions || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Failed</span>
                    <span className="text-red-500">
                      {conflictStats?.failedResolutions || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Active Rules</CardTitle>
                <CardDescription>Frequently triggered conflict rules</CardDescription>
              </CardHeader>
              <CardContent>
                {conflictStats?.mostActiveRules?.length > 0 ? (
                  <div className="space-y-2">
                    {conflictStats.mostActiveRules.map((rule: any, index: number) => (
                      <div key={rule.ruleId} className="flex justify-between text-sm">
                        <span className="truncate">{rule.ruleId.replace(/_/g, ' ')}</span>
                        <Badge variant="outline">{rule.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No active conflicts
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {integrationStatus?.uptime ? 
                    `${Math.floor(integrationStatus.uptime / 60000)}m` : 
                    'N/A'
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  Since last restart
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Version
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {integrationStatus?.version || 'Unknown'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Current deployment
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Components
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {integrationStatus?.components.filter(c => c.status === 'online').length || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Online components
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}