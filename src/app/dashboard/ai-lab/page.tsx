"use client"

import { AICampaignBuilder } from '@/components/ai-campaign-builder'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Sparkles, Zap, BarChart, Target, Code, Database } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function AILabPage() {
  const handleCampaignCreate = (campaign: any) => {
    console.log('Creating campaign:', campaign)
    // TODO: Implement actual campaign creation
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Brain className="h-10 w-10 text-primary" />
          AI Lab
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Experience the future of Meta Ads with our intelligent AI system that thinks, learns, and optimizes like a human expert
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <Sparkles className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Intelligent Analysis</CardTitle>
            <CardDescription>
              AI analyzes your business, market trends, and competitor strategies to create winning campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>• Pattern recognition from millions of campaigns</li>
              <li>• Real-time market intelligence</li>
              <li>• Predictive performance modeling</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Zap className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Autonomous Optimization</CardTitle>
            <CardDescription>
              Self-learning system that continuously improves campaign performance without human intervention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>• Auto-adjusts budgets based on ROI</li>
              <li>• Dynamic creative optimization</li>
              <li>• Audience refinement in real-time</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <BarChart className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Advanced Analytics</CardTitle>
            <CardDescription>
              Deep insights with actionable recommendations powered by machine learning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>• Conversion path analysis</li>
              <li>• Multi-touch attribution</li>
              <li>• Predictive LTV modeling</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Technical Details */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              How It Works - Like Cursor for Meta Ads
            </CardTitle>
            <Badge variant="outline">Beta</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Database className="h-4 w-4" />
                Intelligent Memory System
              </h3>
              <p className="text-sm text-muted-foreground">
                Our AI remembers past campaigns, learning from successes and failures to make better decisions. 
                It maintains both short-term context (current session) and long-term memory (historical data).
              </p>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Multi-Agent Architecture
              </h3>
              <p className="text-sm text-muted-foreground">
                Specialized AI agents work together: Campaign Agent for strategy, Creative Agent for ads, 
                Analytics Agent for insights, and Optimization Agent for performance.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Key Capabilities</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <Badge variant="secondary">Tool Usage</Badge>
              <Badge variant="secondary">Code Generation</Badge>
              <Badge variant="secondary">Data Analysis</Badge>
              <Badge variant="secondary">API Integration</Badge>
              <Badge variant="secondary">ML Predictions</Badge>
              <Badge variant="secondary">A/B Testing</Badge>
              <Badge variant="secondary">Auto-Scaling</Badge>
              <Badge variant="secondary">ROI Forecasting</Badge>
            </div>
          </div>

          <div className="mt-6 p-4 border rounded-lg bg-primary/5">
            <p className="text-sm">
              <strong>Like Cursor IDE:</strong> Our AI doesn't just suggest—it understands context, 
              writes campaign configurations, analyzes performance data, and executes optimizations autonomously. 
              It's your AI pair programmer for Meta Ads.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Campaign Builder */}
      <AICampaignBuilder onCampaignCreate={handleCampaignCreate} />
    </div>
  )
}