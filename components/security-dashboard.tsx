"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Activity, Lock, Eye, Users } from 'lucide-react';

interface SecurityMetrics {
  rateLimiting: {
    topOffenders: Array<{
      ip: string;
      requests: number;
      riskScore: number;
      lastSeen: Date;
    }>;
  };
  ddosProtection: {
    currentMetrics: {
      requestsPerSecond: number;
      uniqueIPs: number;
      averageResponseTime: number;
      errorRate: number;
      suspiciousRequests: number;
      timestamp: number;
    } | null;
    blockedIPs: number;
  };
  threatDetection: {
    topThreats: Array<{
      ip: string;
      eventCount: number;
      maxSeverity: string;
      riskScore: number;
      lastSeen: Date;
    }>;
    recentEvents: Array<{
      id: string;
      timestamp: number;
      type: string;
      severity: string;
      source: { ip: string; userAgent: string };
      target: { endpoint: string; method: string };
      details: {
        description: string;
        riskScore: number;
      };
    }>;
  };
}

export function SecurityDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // In a real implementation, this would fetch from an API endpoint
  const fetchSecurityMetrics = async () => {
    try {
      setLoading(true);
      
      // Simulate API call - in production, this would be a real endpoint
      // const response = await fetch('/api/security/metrics');
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockMetrics: SecurityMetrics = {
        rateLimiting: {
          topOffenders: [
            {
              ip: '192.168.1.100',
              requests: 150,
              riskScore: 75,
              lastSeen: new Date(Date.now() - 5 * 60 * 1000)
            },
            {
              ip: '10.0.0.50',
              requests: 89,
              riskScore: 45,
              lastSeen: new Date(Date.now() - 10 * 60 * 1000)
            }
          ]
        },
        ddosProtection: {
          currentMetrics: {
            requestsPerSecond: 45,
            uniqueIPs: 25,
            averageResponseTime: 250,
            errorRate: 2.5,
            suspiciousRequests: 3,
            timestamp: Date.now()
          },
          blockedIPs: 12
        },
        threatDetection: {
          topThreats: [
            {
              ip: '203.0.113.45',
              eventCount: 8,
              maxSeverity: 'high',
              riskScore: 85,
              lastSeen: new Date(Date.now() - 2 * 60 * 1000)
            }
          ],
          recentEvents: [
            {
              id: 'evt_1234',
              timestamp: Date.now() - 3 * 60 * 1000,
              type: 'suspicious_activity',
              severity: 'medium',
              source: { ip: '192.168.1.100', userAgent: 'curl/7.68.0' },
              target: { endpoint: '/api/meta-test', method: 'POST' },
              details: {
                description: 'Suspicious user agent detected',
                riskScore: 65
              }
            }
          ]
        }
      };
      
      setMetrics(mockMetrics);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to fetch security metrics');
      console.error('Error fetching security metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityMetrics();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchSecurityMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 font-bold';
    if (score >= 60) return 'text-orange-600 font-semibold';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading security metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!metrics) return null;

  const currentMetrics = metrics.ddosProtection.currentMetrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchSecurityMetrics} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests/Second</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMetrics?.requestsPerSecond || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Current traffic rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.ddosProtection.blockedIPs}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently blocked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMetrics?.errorRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Current error rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMetrics?.uniqueIPs || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active this minute
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="threats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="threats">Threat Detection</TabsTrigger>
          <TabsTrigger value="ratelimit">Rate Limiting</TabsTrigger>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
        </TabsList>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Threats</CardTitle>
              <CardDescription>
                IP addresses with highest risk scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.threatDetection.topThreats.length > 0 ? (
                  metrics.threatDetection.topThreats.map((threat, index) => (
                    <div key={threat.ip} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <div>
                          <div className="font-medium">{threat.ip}</div>
                          <div className="text-sm text-muted-foreground">
                            {threat.eventCount} events • Last seen: {threat.lastSeen.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getSeverityColor(threat.maxSeverity)}>
                          {threat.maxSeverity}
                        </Badge>
                        <span className={`text-sm ${getRiskScoreColor(threat.riskScore)}`}>
                          Risk: {threat.riskScore}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No active threats detected
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratelimit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limit Violations</CardTitle>
              <CardDescription>
                IPs exceeding request limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.rateLimiting.topOffenders.length > 0 ? (
                  metrics.rateLimiting.topOffenders.map((offender, index) => (
                    <div key={offender.ip} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <div>
                          <div className="font-medium">{offender.ip}</div>
                          <div className="text-sm text-muted-foreground">
                            {offender.requests} requests • Last seen: {offender.lastSeen.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${getRiskScoreColor(offender.riskScore)}`}>
                          Risk: {offender.riskScore}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No rate limit violations
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Latest security incidents and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.threatDetection.recentEvents.length > 0 ? (
                  metrics.threatDetection.recentEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                          <span className="font-medium">{event.type.replace('_', ' ')}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{event.details.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Source: {event.source.ip}</span>
                        <span>Target: {event.target.method} {event.target.endpoint}</span>
                        <span className={getRiskScoreColor(event.details.riskScore)}>
                          Risk: {event.details.riskScore}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No recent security events
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
