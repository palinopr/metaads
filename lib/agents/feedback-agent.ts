/**
 * Agent 12: Feedback Agent
 * Collects user feedback and implements continuous improvement
 */

import { BaseAgent, Task } from './base-agent';

export class FeedbackAgent extends BaseAgent {
  constructor() {
    super('Feedback');
    this.tasks = this.getTasks();
  }

  getTasks(): Task[] {
    return [
      {
        id: 'feedback-1',
        name: 'Create feedback system',
        description: 'In-app feedback collection',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'feedback-2',
        name: 'Implement analytics tracking',
        description: 'User behavior analytics',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'feedback-3',
        name: 'Build feature request portal',
        description: 'User feature voting system',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'feedback-4',
        name: 'Create A/B testing framework',
        description: 'Feature experimentation',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'feedback-5',
        name: 'Setup user surveys',
        description: 'Periodic satisfaction surveys',
        priority: 'low',
        status: 'pending'
      }
    ];
  }

  async execute(): Promise<void> {
    this.log('Starting feedback system implementation...');
    
    for (const task of this.tasks) {
      await this.executeTask(task);
    }
  }

  protected async performTask(task: Task): Promise<void> {
    switch (task.id) {
      case 'feedback-1':
        await this.createFeedbackSystem();
        break;
      case 'feedback-2':
        await this.implementAnalyticsTracking();
        break;
      case 'feedback-3':
        await this.buildFeatureRequestPortal();
        break;
      case 'feedback-4':
        await this.createABTestingFramework();
        break;
      case 'feedback-5':
        await this.setupUserSurveys();
        break;
    }
  }

  private async createFeedbackSystem() {
    // Feedback widget component
    await this.writeFile('components/feedback/feedback-widget.tsx', `
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, ThumbsUp, ThumbsDown, Bug, Lightbulb, HelpCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export interface FeedbackData {
  type: 'bug' | 'feature' | 'improvement' | 'praise' | 'question';
  rating?: number;
  message: string;
  metadata?: {
    page: string;
    userAgent: string;
    timestamp: string;
    sessionId: string;
  };
}

interface FeedbackWidgetProps {
  className?: string;
  onSubmit?: (feedback: FeedbackData) => void;
}

export function FeedbackWidget({ className, onSubmit }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackData['type']>('improvement');
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackTypes = [
    { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500' },
    { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-blue-500' },
    { value: 'improvement', label: 'Improvement', icon: MessageSquare, color: 'text-yellow-500' },
    { value: 'praise', label: 'Praise', icon: ThumbsUp, color: 'text-green-500' },
    { value: 'question', label: 'Question', icon: HelpCircle, color: 'text-purple-500' },
  ];

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: 'Please enter your feedback',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        type,
        rating: type === 'praise' || type === 'bug' ? rating : undefined,
        message,
        metadata: {
          page: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          sessionId: getSessionId(),
        },
      };

      // Submit feedback
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      toast({
        title: 'Thank you for your feedback!',
        description: 'We appreciate your input and will review it soon.',
      });

      // Call custom handler if provided
      onSubmit?.(feedbackData);

      // Reset form
      setMessage('');
      setRating(0);
      setIsOpen(false);

    } catch (error) {
      toast({
        title: 'Failed to submit feedback',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn('fixed bottom-4 right-4 z-50', className)}
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Feedback Type */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              What type of feedback do you have?
            </Label>
            <RadioGroup value={type} onValueChange={(value) => setType(value as FeedbackData['type'])}>
              <div className="grid grid-cols-2 gap-3">
                {feedbackTypes.map((feedbackType) => {
                  const Icon = feedbackType.icon;
                  return (
                    <Label
                      key={feedbackType.value}
                      htmlFor={feedbackType.value}
                      className={cn(
                        'flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors',
                        type === feedbackType.value && 'border-primary bg-primary/5'
                      )}
                    >
                      <RadioGroupItem value={feedbackType.value} id={feedbackType.value} />
                      <Icon className={cn('h-4 w-4', feedbackType.color)} />
                      <span className="text-sm">{feedbackType.label}</span>
                    </Label>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Rating for specific types */}
          {(type === 'praise' || type === 'bug') && (
            <div>
              <Label className="text-base font-semibold mb-3 block">
                {type === 'praise' ? 'How satisfied are you?' : 'How severe is this issue?'}
              </Label>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setRating(value)}
                    className={cn(
                      'w-10 h-10 rounded-full border-2 transition-all',
                      rating >= value
                        ? type === 'praise'
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-red-500 border-red-500 text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Message */}
          <div>
            <Label htmlFor="feedback-message" className="text-base font-semibold mb-3 block">
              Tell us more
            </Label>
            <Textarea
              id="feedback-message"
              placeholder={getPlaceholder(type)}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
            className="w-full"
          >
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getPlaceholder(type: FeedbackData['type']): string {
  switch (type) {
    case 'bug':
      return 'Please describe the issue you encountered. Include steps to reproduce if possible.';
    case 'feature':
      return 'What feature would you like to see? How would it help you?';
    case 'improvement':
      return 'What could we improve? How would this make your experience better?';
    case 'praise':
      return 'What do you love about the dashboard? Your feedback motivates us!';
    case 'question':
      return 'What would you like to know? We\'re here to help!';
  }
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('session-id');
  if (!sessionId) {
    sessionId = \`session-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
    sessionStorage.setItem('session-id', sessionId);
  }
  return sessionId;
}
`);

    // Feedback API endpoint
    await this.writeFile('app/api/feedback/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { headers } from 'next/headers';

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'praise', 'question']),
  rating: z.number().min(1).max(5).optional(),
  message: z.string().min(1).max(1000),
  metadata: z.object({
    page: z.string(),
    userAgent: z.string(),
    timestamp: z.string(),
    sessionId: z.string(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const feedback = feedbackSchema.parse(body);
    
    // Get user context
    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || 'unknown';
    const userId = await getUserIdFromSession(request);
    
    // Enrich feedback data
    const enrichedFeedback = {
      ...feedback,
      id: generateFeedbackId(),
      userId,
      ipAddress,
      createdAt: new Date(),
      status: 'new',
      priority: calculatePriority(feedback),
    };
    
    // Store feedback
    await storeFeedback(enrichedFeedback);
    
    // Send notifications for critical feedback
    if (feedback.type === 'bug' && feedback.rating && feedback.rating >= 4) {
      await sendCriticalFeedbackAlert(enrichedFeedback);
    }
    
    // Track analytics
    await trackFeedbackAnalytics(feedback);
    
    return NextResponse.json({ 
      success: true, 
      id: enrichedFeedback.id,
      message: 'Thank you for your feedback!' 
    });
    
  } catch (error) {
    console.error('Feedback submission error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid feedback data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Fetch feedback with filters
    const feedback = await getFeedback({
      type,
      status,
      limit,
      offset,
    });
    
    return NextResponse.json({
      success: true,
      data: feedback,
      pagination: {
        limit,
        offset,
        total: await getFeedbackCount({ type, status }),
      },
    });
    
  } catch (error) {
    console.error('Feedback fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

// Helper functions
function generateFeedbackId(): string {
  return \`feedback-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
}

function calculatePriority(feedback: any): 'low' | 'medium' | 'high' | 'critical' {
  if (feedback.type === 'bug') {
    if (feedback.rating >= 4) return 'critical';
    if (feedback.rating >= 3) return 'high';
    return 'medium';
  }
  
  if (feedback.type === 'feature') return 'medium';
  if (feedback.type === 'question') return 'high';
  
  return 'low';
}

async function storeFeedback(feedback: any) {
  // Store in database
  // For demo, using in-memory storage
  const feedbackStore = globalThis.feedbackStore || [];
  feedbackStore.push(feedback);
  globalThis.feedbackStore = feedbackStore;
}

async function getFeedback(filters: any) {
  const feedbackStore = globalThis.feedbackStore || [];
  
  let filtered = feedbackStore;
  
  if (filters.type) {
    filtered = filtered.filter(f => f.type === filters.type);
  }
  
  if (filters.status) {
    filtered = filtered.filter(f => f.status === filters.status);
  }
  
  return filtered.slice(filters.offset, filters.offset + filters.limit);
}

async function getFeedbackCount(filters: any): Promise<number> {
  const feedbackStore = globalThis.feedbackStore || [];
  
  let filtered = feedbackStore;
  
  if (filters.type) {
    filtered = filtered.filter(f => f.type === filters.type);
  }
  
  if (filters.status) {
    filtered = filtered.filter(f => f.status === filters.status);
  }
  
  return filtered.length;
}

async function getUserIdFromSession(request: NextRequest): Promise<string | null> {
  // Extract user ID from session/JWT
  // For demo, returning null
  return null;
}

async function sendCriticalFeedbackAlert(feedback: any) {
  // Send alert to team (Slack, email, etc.)
  console.log('Critical feedback received:', feedback);
}

async function trackFeedbackAnalytics(feedback: any) {
  // Track in analytics system
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'feedback_submitted', {
      feedback_type: feedback.type,
      feedback_rating: feedback.rating,
    });
  }
}
`);

    // Feedback dashboard
    await this.writeFile('components/feedback/feedback-dashboard.tsx', `
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Bug, Lightbulb, MessageSquare, ThumbsUp, HelpCircle, TrendingUp, Users, Clock } from 'lucide-react';

interface FeedbackItem {
  id: string;
  type: 'bug' | 'feature' | 'improvement' | 'praise' | 'question';
  rating?: number;
  message: string;
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  userId?: string;
  metadata?: any;
}

export function FeedbackDashboard() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: 'all', status: 'all' });
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchFeedback();
  }, [filter]);

  const fetchFeedback = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.type !== 'all') params.append('type', filter.type);
      if (filter.status !== 'all') params.append('status', filter.status);
      
      const response = await fetch(\`/api/feedback?\${params}\`);
      const data = await response.json();
      
      setFeedback(data.data);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="h-4 w-4" />;
      case 'feature': return <Lightbulb className="h-4 w-4" />;
      case 'improvement': return <MessageSquare className="h-4 w-4" />;
      case 'praise': return <ThumbsUp className="h-4 w-4" />;
      case 'question': return <HelpCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'in-progress': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'secondary';
      default: return 'default';
    }
  };

  // Calculate statistics
  const stats = {
    total: feedback.length,
    byType: feedback.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byStatus: feedback.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    avgRating: feedback
      .filter(f => f.rating)
      .reduce((sum, f) => sum + f.rating!, 0) / feedback.filter(f => f.rating).length || 0,
    criticalBugs: feedback.filter(f => f.type === 'bug' && f.priority === 'critical').length,
  };

  // Prepare chart data
  const typeChartData = Object.entries(stats.byType).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
  }));

  const statusChartData = Object.entries(stats.byStatus).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
    value: count,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Bugs</CardTitle>
            <Bug className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.criticalBugs}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              Based on praise feedback
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground">
              Average time to first response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Feedback by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => \`\${name} \${(percent * 100).toFixed(0)}%\`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeChartData.map((entry, index) => (
                    <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedback Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>Manage and respond to user feedback</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filter.type} onValueChange={(value) => setFilter({ ...filter, type: value })}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bug">Bugs</SelectItem>
                  <SelectItem value="feature">Features</SelectItem>
                  <SelectItem value="improvement">Improvements</SelectItem>
                  <SelectItem value="praise">Praise</SelectItem>
                  <SelectItem value="question">Questions</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value })}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                    <Badge variant={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                    {item.rating && (
                      <div className="flex items-center text-sm">
                        <span className="mr-1">Rating:</span>
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < item.rating! ? 'text-yellow-500' : 'text-gray-300'}>
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm">{item.message}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    {item.metadata?.page && <span>Page: {item.metadata.page}</span>}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button size="sm" variant="outline">
                    Respond
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
`);

    this.log('Feedback system created');
  }

  private async implementAnalyticsTracking() {
    // Analytics service
    await this.writeFile('lib/analytics/analytics-service.ts', `
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
}

export interface PageViewEvent {
  path: string;
  title: string;
  referrer?: string;
  duration?: number;
}

export class AnalyticsService {
  private queue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private isInitialized = false;
  private pageStartTime: number = Date.now();

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  initialize(config?: { userId?: string; debug?: boolean }) {
    if (this.isInitialized) return;

    this.userId = config?.userId;
    this.isInitialized = true;

    // Initialize third-party analytics
    this.initializeGoogleAnalytics();
    this.initializePostHog();
    this.initializeMixpanel();

    // Track page views automatically
    if (typeof window !== 'undefined') {
      this.trackPageView();
      this.setupRouteTracking();
      this.setupEngagementTracking();
    }
  }

  // Track custom events
  track(name: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    // Add to queue
    this.queue.push(event);

    // Send to analytics providers
    this.sendToProviders(event);

    // Batch send to our backend
    this.batchSend();
  }

  // Track page views
  trackPageView(overrides?: Partial<PageViewEvent>) {
    const pageView: PageViewEvent = {
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      ...overrides,
    };

    this.track('page_view', pageView);
  }

  // Track user identification
  identify(userId: string, traits?: Record<string, any>) {
    this.userId = userId;

    // Update third-party services
    if (window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        user_id: userId,
      });
    }

    if (window.posthog) {
      window.posthog.identify(userId, traits);
    }

    if (window.mixpanel) {
      window.mixpanel.identify(userId);
      if (traits) {
        window.mixpanel.people.set(traits);
      }
    }

    this.track('user_identified', { userId, traits });
  }

  // Track timing metrics
  trackTiming(category: string, variable: string, value: number, label?: string) {
    this.track('timing', {
      category,
      variable,
      value,
      label,
    });

    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        event_category: category,
        name: variable,
        value,
        event_label: label,
      });
    }
  }

  // Track errors
  trackError(error: Error, context?: Record<string, any>) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      context,
    });
  }

  // Track campaign interactions
  trackCampaignInteraction(action: string, campaignId: string, details?: Record<string, any>) {
    this.track(\`campaign_\${action}\`, {
      campaignId,
      action,
      ...details,
    });
  }

  // Track feature usage
  trackFeatureUsage(feature: string, action: string, details?: Record<string, any>) {
    this.track('feature_usage', {
      feature,
      action,
      ...details,
    });
  }

  // Track conversion funnel
  trackFunnelStep(funnel: string, step: string, stepNumber: number, details?: Record<string, any>) {
    this.track('funnel_step', {
      funnel,
      step,
      stepNumber,
      ...details,
    });
  }

  // Private methods
  private sendToProviders(event: AnalyticsEvent) {
    // Google Analytics
    if (window.gtag) {
      window.gtag('event', event.name, {
        event_category: 'custom',
        event_label: JSON.stringify(event.properties),
        value: event.properties?.value,
      });
    }

    // PostHog
    if (window.posthog) {
      window.posthog.capture(event.name, event.properties);
    }

    // Mixpanel
    if (window.mixpanel) {
      window.mixpanel.track(event.name, event.properties);
    }
  }

  private async batchSend() {
    if (this.queue.length === 0) return;

    // Send in batches of 20
    if (this.queue.length >= 20) {
      const batch = this.queue.splice(0, 20);
      await this.sendBatch(batch);
    }
  }

  private async sendBatch(events: AnalyticsEvent[]) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      console.error('Failed to send analytics batch:', error);
      // Re-add to queue for retry
      this.queue.unshift(...events);
    }
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'server';

    let sessionId = sessionStorage.getItem('analytics-session-id');
    if (!sessionId) {
      sessionId = \`session-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
      sessionStorage.setItem('analytics-session-id', sessionId);
    }
    return sessionId;
  }

  private initializeGoogleAnalytics() {
    if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) return;

    const script = document.createElement('script');
    script.src = \`https://www.googletagmanager.com/gtag/js?id=\${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}\`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
  }

  private initializePostHog() {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    const script = document.createElement('script');
    script.innerHTML = \`
      !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
      posthog.init('\${process.env.NEXT_PUBLIC_POSTHOG_KEY}',{api_host:'\${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'}'})
    \`;
    document.head.appendChild(script);
  }

  private initializeMixpanel() {
    if (!process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) return;

    const script = document.createElement('script');
    script.innerHTML = \`
      (function(c,a){if(!a.__SV){var b=window;try{var d,m,j,k=b.location,f=k.hash;d=function(a,b){return(m=a.match(RegExp(b+"=([^&]*)")))?m[1]:null};f&&d(f,"state")&&(j=JSON.parse(decodeURIComponent(d(f,"state"))),"mpeditor"===j.action&&(b.sessionStorage.setItem("_mpcehash",f),history.replaceState(j.desiredHash||"",c.title,k.pathname+k.search)))}catch(n){}var l,h;window.mixpanel=a;a._i=[];a.init=function(b,d,g){function c(b,i){var a=i.split(".");2==a.length&&(b=b[a[0]],i=a[1]);b[i]=function(){b.push([i].concat(Array.prototype.slice.call(arguments,0)))}}var e=a;"undefined"!==typeof g?e=a[g]=[]:g="mixpanel";e.people=e.people||[];e.toString=function(b){var a="mixpanel";"mixpanel"!==g&&(a+="."+g);b||(a+=" (stub)");return a};e.people.toString=function(){return e.toString(1)+".people (stub)"};l="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");
      for(h=0;h<l.length;h++)c(e,l[h]);var f="set set_once union unset remove delete".split(" ");e.get_group=function(){function a(c){b[c]=function(){call2_args=arguments;call2=[c].concat(Array.prototype.slice.call(call2_args,0));e.push([d,call2])}}for(var b={},d=["get_group"].concat(Array.prototype.slice.call(arguments,0)),c=0;c<f.length;c++)a(f[c]);return b};a._i.push([b,d,g])};a.__SV=1.2;b=c.createElement("script");b.type="text/javascript";b.async=!0;b.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?
      MIXPANEL_CUSTOM_LIB_URL:"file:"===c.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\/\\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";d=c.getElementsByTagName("script")[0];d.parentNode.insertBefore(b,d)}})(document,window.mixpanel||[]);
      mixpanel.init('\${process.env.NEXT_PUBLIC_MIXPANEL_TOKEN}');
    \`;
    document.head.appendChild(script);
  }

  private setupRouteTracking() {
    // Track route changes for SPAs
    if (typeof window !== 'undefined') {
      let lastPath = window.location.pathname;

      // Track browser back/forward
      window.addEventListener('popstate', () => {
        const newPath = window.location.pathname;
        if (newPath !== lastPath) {
          this.trackPageView();
          lastPath = newPath;
        }
      });

      // Override pushState and replaceState
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = function(...args) {
        originalPushState.apply(history, args);
        setTimeout(() => {
          const newPath = window.location.pathname;
          if (newPath !== lastPath) {
            analyticsService.trackPageView();
            lastPath = newPath;
          }
        }, 0);
      };

      history.replaceState = function(...args) {
        originalReplaceState.apply(history, args);
        setTimeout(() => {
          const newPath = window.location.pathname;
          if (newPath !== lastPath) {
            analyticsService.trackPageView();
            lastPath = newPath;
          }
        }, 0);
      };
    }
  }

  private setupEngagementTracking() {
    // Track time on page
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Date.now() - this.pageStartTime;
      this.trackTiming('engagement', 'time_on_page', timeOnPage, window.location.pathname);
    });

    // Track scroll depth
    let maxScroll = 0;
    let ticking = false;

    const updateScrollDepth = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
      
      if (scrollDepth > maxScroll) {
        maxScroll = scrollDepth;
        
        // Track milestones
        const milestones = [25, 50, 75, 90, 100];
        milestones.forEach(milestone => {
          if (maxScroll >= milestone && maxScroll - scrollDepth < milestone) {
            this.track('scroll_depth', {
              depth: milestone,
              path: window.location.pathname,
            });
          }
        });
      }
      
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDepth);
        ticking = true;
      }
    });

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const clickData = {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        text: target.innerText?.substring(0, 50),
        href: (target as HTMLAnchorElement).href,
        path: window.location.pathname,
      };

      // Only track meaningful clicks
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.onclick) {
        this.track('element_click', clickData);
      }
    });
  }
}

// Global analytics instance
export const analyticsService = new AnalyticsService();

// React hook for analytics
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    analyticsService.trackPageView({ path: pathname });
  }, [pathname]);

  return {
    track: analyticsService.track.bind(analyticsService),
    trackTiming: analyticsService.trackTiming.bind(analyticsService),
    trackError: analyticsService.trackError.bind(analyticsService),
    trackCampaignInteraction: analyticsService.trackCampaignInteraction.bind(analyticsService),
    trackFeatureUsage: analyticsService.trackFeatureUsage.bind(analyticsService),
    identify: analyticsService.identify.bind(analyticsService),
  };
}

// Type declarations for window
declare global {
  interface Window {
    gtag: any;
    dataLayer: any[];
    posthog: any;
    mixpanel: any;
  }
}
`);

    this.log('Analytics tracking implemented');
  }

  private async buildFeatureRequestPortal() {
    await this.writeFile('components/feedback/feature-request-portal.tsx', `
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThumbsUp, MessageSquare, TrendingUp, Plus, Search, Filter } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: 'dashboard' | 'analytics' | 'api' | 'performance' | 'other';
  status: 'under-review' | 'planned' | 'in-progress' | 'completed' | 'declined';
  votes: number;
  comments: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  hasVoted?: boolean;
}

export function FeatureRequestPortal() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [filter, setFilter] = useState({ category: 'all', status: 'all', sort: 'votes' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  useEffect(() => {
    fetchFeatureRequests();
  }, [filter]);

  const fetchFeatureRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.category !== 'all') params.append('category', filter.category);
      if (filter.status !== 'all') params.append('status', filter.status);
      params.append('sort', filter.sort);
      
      const response = await fetch(\`/api/feature-requests?\${params}\`);
      const data = await response.json();
      
      setRequests(data.requests);
    } catch (error) {
      console.error('Failed to fetch feature requests:', error);
    }
  };

  const handleVote = async (requestId: string) => {
    try {
      const response = await fetch(\`/api/feature-requests/\${requestId}/vote\`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to vote');

      // Update local state
      setRequests(requests.map(req => 
        req.id === requestId 
          ? { ...req, votes: req.hasVoted ? req.votes - 1 : req.votes + 1, hasVoted: !req.hasVoted }
          : req
      ));

      toast({
        title: 'Vote recorded',
        description: 'Thank you for your feedback!',
      });
    } catch (error) {
      toast({
        title: 'Failed to vote',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to submit');

      toast({
        title: 'Feature request submitted',
        description: 'Your request has been added to the board.',
      });

      setShowSubmitDialog(false);
      fetchFeatureRequests();
    } catch (error) {
      toast({
        title: 'Failed to submit',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'planned': return 'default';
      case 'declined': return 'destructive';
      default: return 'secondary';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dashboard': return '📊';
      case 'analytics': return '📈';
      case 'api': return '🔌';
      case 'performance': return '⚡';
      default: return '💡';
    }
  };

  const filteredRequests = requests.filter(req => 
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Feature Requests</h2>
          <p className="text-muted-foreground">Vote for features you'd like to see</p>
        </div>
        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Submit Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Feature Request</DialogTitle>
            </DialogHeader>
            <FeatureRequestForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Tabs value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value })}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="under-review">Under Review</TabsTrigger>
                <TabsTrigger value="planned">Planned</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>

            <select
              value={filter.sort}
              onChange={(e) => setFilter({ ...filter, sort: e.target.value })}
              className="px-3 py-2 border rounded-md"
            >
              <option value="votes">Most Voted</option>
              <option value="recent">Most Recent</option>
              <option value="comments">Most Discussed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Feature Requests */}
      <div className="grid gap-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex gap-4">
                {/* Vote Section */}
                <div className="flex flex-col items-center">
                  <Button
                    variant={request.hasVoted ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => handleVote(request.id)}
                    className="mb-2"
                  >
                    <ThumbsUp className={\`h-4 w-4 \${request.hasVoted ? 'fill-current' : ''}\`} />
                  </Button>
                  <span className="text-lg font-semibold">{request.votes}</span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span>{getCategoryIcon(request.category)}</span>
                        {request.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getStatusColor(request.status)}>
                          {request.status.replace('-', ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          by {request.author.name} • {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{request.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <button className="flex items-center gap-1 hover:text-primary">
                      <MessageSquare className="h-4 w-4" />
                      {request.comments} comments
                    </button>
                    
                    {request.status === 'planned' && (
                      <span className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        Coming soon
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No feature requests found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FeatureRequestForm({ onSubmit, isSubmitting }: any) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'dashboard',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief title for your feature request"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          required
        >
          <option value="dashboard">Dashboard</option>
          <option value="analytics">Analytics</option>
          <option value="api">API</option>
          <option value="performance">Performance</option>
          <option value="other">Other</option>
        </select>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe your feature request in detail..."
          rows={5}
          required
        />
      </div>
      
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting...' : 'Submit Request'}
      </Button>
    </form>
  );
}
`);

    this.log('Feature request portal built');
  }

  private async createABTestingFramework() {
    await this.writeFile('lib/experiments/ab-testing.ts', `
export interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: Variant[];
  targeting: TargetingRules;
  allocation: number; // Percentage of users
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: Date;
  endDate?: Date;
  metrics: string[];
}

export interface Variant {
  id: string;
  name: string;
  weight: number; // Percentage allocation
  config: Record<string, any>;
  isControl?: boolean;
}

export interface TargetingRules {
  segments?: string[];
  userProperties?: Record<string, any>;
  customRules?: ((user: any) => boolean)[];
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  userId: string;
  timestamp: Date;
  metrics: Record<string, any>;
}

export class ABTestingService {
  private experiments: Map<string, Experiment> = new Map();
  private assignments: Map<string, Map<string, string>> = new Map(); // userId -> experimentId -> variantId
  private results: ExperimentResult[] = [];

  constructor() {
    this.loadExperiments();
  }

  // Get variant for user
  getVariant(experimentId: string, userId: string): Variant | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check if user is already assigned
    const userAssignments = this.assignments.get(userId);
    if (userAssignments?.has(experimentId)) {
      const variantId = userAssignments.get(experimentId)!;
      return experiment.variants.find(v => v.id === variantId) || null;
    }

    // Check if user qualifies for experiment
    if (!this.isUserEligible(userId, experiment)) {
      return null;
    }

    // Assign variant
    const variant = this.assignVariant(userId, experiment);
    this.trackAssignment(userId, experimentId, variant.id);

    return variant;
  }

  // Track experiment metric
  trackMetric(experimentId: string, userId: string, metric: string, value: any) {
    const userAssignments = this.assignments.get(userId);
    const variantId = userAssignments?.get(experimentId);
    
    if (!variantId) return;

    const result: ExperimentResult = {
      experimentId,
      variantId,
      userId,
      timestamp: new Date(),
      metrics: { [metric]: value }
    };

    this.results.push(result);
    this.sendResults([result]);
  }

  // Check if feature is enabled for user
  isFeatureEnabled(featureKey: string, userId: string, defaultValue = false): boolean {
    // Check all experiments that affect this feature
    const relevantExperiments = Array.from(this.experiments.values()).filter(
      exp => exp.status === 'running' && exp.variants.some(v => v.config[featureKey] !== undefined)
    );

    for (const experiment of relevantExperiments) {
      const variant = this.getVariant(experiment.id, userId);
      if (variant && variant.config[featureKey] !== undefined) {
        return variant.config[featureKey];
      }
    }

    return defaultValue;
  }

  // Get feature value for user
  getFeatureValue<T>(featureKey: string, userId: string, defaultValue: T): T {
    const relevantExperiments = Array.from(this.experiments.values()).filter(
      exp => exp.status === 'running' && exp.variants.some(v => v.config[featureKey] !== undefined)
    );

    for (const experiment of relevantExperiments) {
      const variant = this.getVariant(experiment.id, userId);
      if (variant && variant.config[featureKey] !== undefined) {
        return variant.config[featureKey];
      }
    }

    return defaultValue;
  }

  // Create new experiment
  createExperiment(experiment: Omit<Experiment, 'id'>): Experiment {
    const newExperiment: Experiment = {
      ...experiment,
      id: this.generateExperimentId(),
    };

    this.experiments.set(newExperiment.id, newExperiment);
    this.saveExperiments();

    return newExperiment;
  }

  // Start experiment
  startExperiment(experimentId: string) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    experiment.status = 'running';
    experiment.startDate = new Date();
    this.saveExperiments();
  }

  // Stop experiment
  stopExperiment(experimentId: string) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    experiment.status = 'completed';
    experiment.endDate = new Date();
    this.saveExperiments();
  }

  // Get experiment results
  getResults(experimentId: string): any {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    const experimentResults = this.results.filter(r => r.experimentId === experimentId);
    
    // Calculate statistics per variant
    const variantStats = new Map<string, any>();

    experiment.variants.forEach(variant => {
      const variantResults = experimentResults.filter(r => r.variantId === variant.id);
      
      variantStats.set(variant.id, {
        variant,
        sampleSize: variantResults.length,
        metrics: this.calculateMetrics(variantResults, experiment.metrics),
        confidence: this.calculateConfidence(variantResults, experiment.variants[0].id === variant.id)
      });
    });

    return {
      experiment,
      results: variantStats,
      winner: this.determineWinner(variantStats),
      isSignificant: this.isStatisticallySignificant(variantStats)
    };
  }

  // Private methods
  private isUserEligible(userId: string, experiment: Experiment): boolean {
    // Check allocation percentage
    const hash = this.hashUserId(userId);
    if (hash % 100 >= experiment.allocation) {
      return false;
    }

    // Check targeting rules
    if (experiment.targeting.customRules) {
      const user = this.getUser(userId);
      return experiment.targeting.customRules.every(rule => rule(user));
    }

    return true;
  }

  private assignVariant(userId: string, experiment: Experiment): Variant {
    const hash = this.hashUserId(userId + experiment.id);
    const random = (hash % 100) / 100;

    let cumulativeWeight = 0;
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight / 100;
      if (random < cumulativeWeight) {
        return variant;
      }
    }

    return experiment.variants[0]; // Fallback to first variant
  }

  private trackAssignment(userId: string, experimentId: string, variantId: string) {
    if (!this.assignments.has(userId)) {
      this.assignments.set(userId, new Map());
    }
    this.assignments.get(userId)!.set(experimentId, variantId);

    // Persist assignment
    this.saveAssignment(userId, experimentId, variantId);
  }

  private calculateMetrics(results: ExperimentResult[], metricNames: string[]): Record<string, any> {
    const metrics: Record<string, any> = {};

    metricNames.forEach(metric => {
      const values = results
        .map(r => r.metrics[metric])
        .filter(v => v !== undefined);

      metrics[metric] = {
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        average: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });

    return metrics;
  }

  private calculateConfidence(results: ExperimentResult[], isControl: boolean): number {
    // Simplified confidence calculation
    // In production, use proper statistical tests (t-test, chi-square, etc.)
    const sampleSize = results.length;
    if (sampleSize < 30) return 0;
    if (sampleSize < 100) return 0.8;
    return 0.95;
  }

  private determineWinner(variantStats: Map<string, any>): string | null {
    // Simple winner determination based on primary metric
    // In production, use proper statistical significance testing
    let winner: string | null = null;
    let bestValue = -Infinity;

    variantStats.forEach((stats, variantId) => {
      const primaryMetric = Object.values(stats.metrics)[0] as any;
      if (primaryMetric.average > bestValue) {
        bestValue = primaryMetric.average;
        winner = variantId;
      }
    });

    return winner;
  }

  private isStatisticallySignificant(variantStats: Map<string, any>): boolean {
    // Simplified significance check
    // In production, use proper p-value calculation
    const confidences = Array.from(variantStats.values()).map(s => s.confidence);
    return confidences.every(c => c >= 0.95);
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private generateExperimentId(): string {
    return \`exp-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
  }

  private getUser(userId: string): any {
    // Fetch user data from your user service
    return { id: userId };
  }

  private loadExperiments() {
    // Load experiments from storage/API
    const savedExperiments = localStorage.getItem('ab-experiments');
    if (savedExperiments) {
      const experiments = JSON.parse(savedExperiments);
      experiments.forEach((exp: Experiment) => {
        this.experiments.set(exp.id, exp);
      });
    }
  }

  private saveExperiments() {
    const experiments = Array.from(this.experiments.values());
    localStorage.setItem('ab-experiments', JSON.stringify(experiments));
  }

  private saveAssignment(userId: string, experimentId: string, variantId: string) {
    // Save to backend/storage
    fetch('/api/experiments/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, experimentId, variantId })
    }).catch(console.error);
  }

  private async sendResults(results: ExperimentResult[]) {
    // Send results to analytics backend
    try {
      await fetch('/api/experiments/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results })
      });
    } catch (error) {
      console.error('Failed to send experiment results:', error);
    }
  }
}

// Global instance
export const abTesting = new ABTestingService();

// React hooks
import { useEffect, useState } from 'react';

export function useExperiment(experimentId: string): Variant | null {
  const [variant, setVariant] = useState<Variant | null>(null);
  const userId = getUserId(); // Implement based on your auth system

  useEffect(() => {
    const assignedVariant = abTesting.getVariant(experimentId, userId);
    setVariant(assignedVariant);
  }, [experimentId, userId]);

  return variant;
}

export function useFeatureFlag(featureKey: string, defaultValue = false): boolean {
  const [enabled, setEnabled] = useState(defaultValue);
  const userId = getUserId();

  useEffect(() => {
    const isEnabled = abTesting.isFeatureEnabled(featureKey, userId, defaultValue);
    setEnabled(isEnabled);
  }, [featureKey, userId, defaultValue]);

  return enabled;
}

export function useFeatureValue<T>(featureKey: string, defaultValue: T): T {
  const [value, setValue] = useState(defaultValue);
  const userId = getUserId();

  useEffect(() => {
    const featureValue = abTesting.getFeatureValue(featureKey, userId, defaultValue);
    setValue(featureValue);
  }, [featureKey, userId, defaultValue]);

  return value;
}

function getUserId(): string {
  // Implement based on your auth system
  return 'user-123';
}
`);

    this.log('A/B testing framework created');
  }

  private async setupUserSurveys() {
    await this.writeFile('components/feedback/user-survey.tsx', `
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  frequency: 'once' | 'weekly' | 'monthly' | 'quarterly';
  targetAudience?: {
    minUsageDays?: number;
    userSegments?: string[];
    customCriteria?: (user: any) => boolean;
  };
}

export interface Question {
  id: string;
  type: 'rating' | 'single-choice' | 'multiple-choice' | 'text' | 'nps';
  question: string;
  required?: boolean;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  labels?: { min: string; max: string };
}

interface SurveyWidgetProps {
  survey: Survey;
  onComplete?: (responses: Record<string, any>) => void;
  onDismiss?: () => void;
}

export function SurveyWidget({ survey, onComplete, onDismiss }: SurveyWidgetProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = ((currentQuestion + 1) / survey.questions.length) * 100;
  const question = survey.questions[currentQuestion];
  const isLastQuestion = currentQuestion === survey.questions.length - 1;

  const handleResponse = (value: any) => {
    setResponses({ ...responses, [question.id]: value });
  };

  const handleNext = () => {
    if (question.required && !responses[question.id]) {
      toast({
        title: 'Please answer the question',
        variant: 'destructive',
      });
      return;
    }

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const surveyResponse = {
        surveyId: survey.id,
        responses,
        completedAt: new Date(),
        metadata: {
          timeSpent: Date.now() - startTime,
          userAgent: navigator.userAgent,
          page: window.location.pathname,
        },
      };

      await fetch('/api/surveys/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyResponse),
      });

      toast({
        title: 'Thank you!',
        description: 'Your feedback helps us improve.',
      });

      onComplete?.(responses);
      
      // Mark survey as completed
      markSurveyCompleted(survey.id);
      
    } catch (error) {
      toast({
        title: 'Failed to submit survey',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    switch (question.type) {
      case 'rating':
        return (
          <RatingQuestion
            question={question}
            value={responses[question.id]}
            onChange={handleResponse}
          />
        );
      
      case 'single-choice':
        return (
          <SingleChoiceQuestion
            question={question}
            value={responses[question.id]}
            onChange={handleResponse}
          />
        );
      
      case 'text':
        return (
          <TextQuestion
            question={question}
            value={responses[question.id]}
            onChange={handleResponse}
          />
        );
      
      case 'nps':
        return (
          <NPSQuestion
            question={question}
            value={responses[question.id]}
            onChange={handleResponse}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{survey.title}</CardTitle>
            <CardDescription>{survey.description}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      
      <CardContent>
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">{question.question}</h3>
          {renderQuestion()}
        </div>
        
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {isLastQuestion ? (
              isSubmitting ? 'Submitting...' : 'Submit'
            ) : (
              <>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Question Components
function RatingQuestion({ question, value, onChange }: any) {
  const min = question.minValue || 1;
  const max = question.maxValue || 5;
  const ratings = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <div>
      <div className="flex justify-between mb-2 text-sm text-muted-foreground">
        {question.labels && (
          <>
            <span>{question.labels.min}</span>
            <span>{question.labels.max}</span>
          </>
        )}
      </div>
      <div className="flex justify-center gap-2">
        {ratings.map((rating) => (
          <button
            key={rating}
            onClick={() => onChange(rating)}
            className={\`w-12 h-12 rounded-lg border-2 transition-all \${
              value === rating
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-gray-300 hover:border-gray-400'
            }\`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}

function SingleChoiceQuestion({ question, value, onChange }: any) {
  return (
    <RadioGroup value={value} onValueChange={onChange}>
      <div className="space-y-2">
        {question.options?.map((option: string) => (
          <Label
            key={option}
            htmlFor={option}
            className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent"
          >
            <RadioGroupItem value={option} id={option} />
            <span>{option}</span>
          </Label>
        ))}
      </div>
    </RadioGroup>
  );
}

function TextQuestion({ question, value, onChange }: any) {
  return (
    <Textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer here..."
      rows={4}
    />
  );
}

function NPSQuestion({ question, value, onChange }: any) {
  const scores = Array.from({ length: 11 }, (_, i) => i);

  return (
    <div>
      <div className="flex justify-between mb-2 text-sm text-muted-foreground">
        <span>Not likely</span>
        <span>Very likely</span>
      </div>
      <div className="grid grid-cols-11 gap-1">
        {scores.map((score) => (
          <button
            key={score}
            onClick={() => onChange(score)}
            className={\`p-2 text-sm rounded border transition-all \${
              value === score
                ? score <= 6
                  ? 'bg-red-500 border-red-500 text-white'
                  : score <= 8
                  ? 'bg-yellow-500 border-yellow-500 text-white'
                  : 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-gray-400'
            }\`}
          >
            {score}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>Detractors (0-6)</span>
        <span>Passives (7-8)</span>
        <span>Promoters (9-10)</span>
      </div>
    </div>
  );
}

// Survey Manager
export class SurveyManager {
  private static instance: SurveyManager;
  private surveys: Survey[] = [];
  private completedSurveys: Set<string> = new Set();

  static getInstance(): SurveyManager {
    if (!SurveyManager.instance) {
      SurveyManager.instance = new SurveyManager();
    }
    return SurveyManager.instance;
  }

  constructor() {
    this.loadCompletedSurveys();
    this.loadSurveys();
  }

  async checkForSurveys(user?: any): Promise<Survey | null> {
    // Find eligible surveys
    const eligibleSurveys = this.surveys.filter(survey => {
      // Check if already completed
      if (this.completedSurveys.has(survey.id)) {
        const lastCompleted = this.getLastCompletedDate(survey.id);
        if (!this.shouldShowAgain(survey, lastCompleted)) {
          return false;
        }
      }

      // Check targeting criteria
      if (survey.targetAudience) {
        if (survey.targetAudience.customCriteria && !survey.targetAudience.customCriteria(user)) {
          return false;
        }
      }

      return true;
    });

    return eligibleSurveys[0] || null;
  }

  private shouldShowAgain(survey: Survey, lastCompleted: Date): boolean {
    const daysSinceCompleted = (Date.now() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24);

    switch (survey.frequency) {
      case 'once':
        return false;
      case 'weekly':
        return daysSinceCompleted >= 7;
      case 'monthly':
        return daysSinceCompleted >= 30;
      case 'quarterly':
        return daysSinceCompleted >= 90;
      default:
        return false;
    }
  }

  private loadSurveys() {
    // Default surveys
    this.surveys = [
      {
        id: 'nps-survey',
        title: 'How likely are you to recommend us?',
        description: 'Your feedback helps us improve',
        frequency: 'quarterly',
        questions: [
          {
            id: 'nps',
            type: 'nps',
            question: 'How likely are you to recommend Meta Ads Dashboard to a colleague?',
            required: true,
          },
          {
            id: 'feedback',
            type: 'text',
            question: 'What could we do to improve your experience?',
            required: false,
          },
        ],
      },
      {
        id: 'feature-satisfaction',
        title: 'Feature Satisfaction Survey',
        description: 'Help us understand what works for you',
        frequency: 'monthly',
        questions: [
          {
            id: 'most-used',
            type: 'single-choice',
            question: 'Which feature do you use most?',
            options: ['Campaign Overview', 'AI Insights', 'Predictive Analytics', 'Reporting'],
            required: true,
          },
          {
            id: 'satisfaction',
            type: 'rating',
            question: 'How satisfied are you with this feature?',
            minValue: 1,
            maxValue: 5,
            labels: { min: 'Very Unsatisfied', max: 'Very Satisfied' },
            required: true,
          },
        ],
      },
    ];
  }

  private loadCompletedSurveys() {
    const completed = localStorage.getItem('completed-surveys');
    if (completed) {
      this.completedSurveys = new Set(JSON.parse(completed));
    }
  }

  private getLastCompletedDate(surveyId: string): Date {
    const dateStr = localStorage.getItem(\`survey-completed-\${surveyId}\`);
    return dateStr ? new Date(dateStr) : new Date(0);
  }
}

const startTime = Date.now();

function markSurveyCompleted(surveyId: string) {
  const completed = JSON.parse(localStorage.getItem('completed-surveys') || '[]');
  completed.push(surveyId);
  localStorage.setItem('completed-surveys', JSON.stringify(completed));
  localStorage.setItem(\`survey-completed-\${surveyId}\`, new Date().toISOString());
}
`);

    this.log('User surveys setup complete');
  }
}