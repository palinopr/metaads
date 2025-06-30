"use client"

import { useState, useEffect } from 'react'
import { AICampaignBuilder } from '@/components/ai-campaign-builder'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Sparkles, Zap, BarChart, Target, Code, Database, Import, Play, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function AILabPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)

  useEffect(() => {
    fetchCampaigns()
    
    // Check if campaign is passed as query parameter
    const searchParams = new URLSearchParams(window.location.search)
    const campaignId = searchParams.get('campaign')
    if (campaignId) {
      setSelectedCampaign(campaignId)
    }
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    }
  }

  const analyzeCampaign = async () => {
    if (!selectedCampaign) return
    
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/ai/analyze-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: selectedCampaign })
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalysisResults(data)
      } else {
        console.error('Analysis failed:', await response.text())
        // Show some feedback to user
        alert('Failed to analyze campaign. Please try again.')
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      alert('Error analyzing campaign. Please check your connection.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCampaignCreate = async (campaign: any) => {
    console.log('Creating campaign:', campaign)
    
    // Create actual campaign
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `AI Campaign - ${new Date().toLocaleDateString()}`,
          objective: campaign.strategy.primaryObjective,
          budget: campaign.strategy.recommendedBudget.daily,
          duration: campaign.strategy.duration.days,
          audiences: campaign.strategy.audiences,
          creatives: campaign.creatives,
          aiGenerated: true
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        router.push(`/dashboard/campaigns/${data.campaignId}`)
      }
    } catch (error) {
      console.error('Failed to create campaign:', error)
    }
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

      {/* Campaign Analysis Section */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analyze Existing Campaign
            </CardTitle>
            <Badge>Quick Start</Badge>
          </div>
          <CardDescription>
            Import and analyze your existing campaigns to get AI-powered optimization suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a campaign to analyze" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.length === 0 ? (
                  <SelectItem value="none" disabled>No campaigns found</SelectItem>
                ) : (
                  campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name} - ${campaign.budget_settings?.daily_budget || 0}/day
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button 
              onClick={analyzeCampaign} 
              disabled={!selectedCampaign || isAnalyzing}
              className="gap-2"
            >
              <Brain className="h-4 w-4" />
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>
          
          {isAnalyzing && (
            <div className="mt-6 p-8 bg-muted rounded-lg text-center">
              <Brain className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
              <p className="text-lg font-medium">Analyzing Campaign...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Our AI is examining performance data and identifying optimization opportunities
              </p>
            </div>
          )}
          
          {analysisResults && !isAnalyzing && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  AI Analysis Results
                </h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground">Performance</p>
                    <p className="text-2xl font-bold text-primary">{analysisResults.score}/10</p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground">Potential</p>
                    <p className="text-2xl font-bold text-green-600">+{analysisResults.potential}%</p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground">Issues</p>
                    <p className="text-2xl font-bold text-orange-600">{analysisResults.issues?.length || 0}</p>
                  </div>
                </div>
                
                {analysisResults.issues && analysisResults.issues.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium mb-2">Key Issues Detected:</h5>
                    <ul className="space-y-1">
                      {analysisResults.issues.map((issue: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-orange-500 mt-1">•</span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysisResults.recommendations && analysisResults.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium mb-2">AI Recommendations:</h5>
                    <ul className="space-y-1">
                      {analysisResults.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-green-500 mt-1">→</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => {
                    // TODO: Implement optimization
                    alert('Optimization feature coming soon!')
                  }} 
                  className="flex-1"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Apply AI Optimizations
                </Button>
                <Button 
                  onClick={() => setAnalysisResults(null)} 
                  variant="outline"
                >
                  Clear Results
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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