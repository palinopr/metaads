"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Target, 
  DollarSign,
  BarChart,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface AICampaignBuilderProps {
  onCampaignCreate: (campaign: any) => void
}

export function AICampaignBuilder({ onCampaignCreate }: AICampaignBuilderProps) {
  const [stage, setStage] = useState<'analysis' | 'strategy' | 'creative' | 'review'>('analysis')
  const [businessInfo, setBusinessInfo] = useState<any>(null)
  const [strategy, setStrategy] = useState<any>(null)
  const [creatives, setCreatives] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const analyzeBusiness = async () => {
    setIsProcessing(true)
    
    // Simulate AI analysis
    setTimeout(() => {
      setBusinessInfo({
        industry: 'E-commerce',
        productType: 'Fashion Accessories',
        targetMarket: 'Young professionals',
        competitiveLandscape: 'Moderate competition',
        uniqueValue: 'Sustainable materials, modern design'
      })
      setStage('strategy')
      setIsProcessing(false)
    }, 2000)
  }

  const generateStrategy = async () => {
    setIsProcessing(true)
    
    const response = await fetch('/api/ai/generate-strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessInfo })
    })
    
    const data = await response.json()
    setStrategy(data.strategy)
    setPredictions(data.predictions)
    setStage('creative')
    setIsProcessing(false)
  }

  const generateCreatives = async () => {
    setIsProcessing(true)
    
    const response = await fetch('/api/ai/generate-creatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategy, count: 5 })
    })
    
    const data = await response.json()
    setCreatives(data.creatives)
    setStage('review')
    setIsProcessing(false)
  }

  const launchCampaign = async () => {
    const campaign = {
      businessInfo,
      strategy,
      creatives: creatives.filter(c => c.selected),
      predictions
    }
    
    onCampaignCreate(campaign)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Campaign Builder</h1>
        </div>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Powered by GPT-4
        </Badge>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Campaign Creation Progress</span>
              <span>{stage === 'analysis' ? '25%' : stage === 'strategy' ? '50%' : stage === 'creative' ? '75%' : '90%'}</span>
            </div>
            <Progress 
              value={stage === 'analysis' ? 25 : stage === 'strategy' ? 50 : stage === 'creative' ? 75 : 90} 
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className={stage === 'analysis' ? 'text-primary font-medium' : ''}>Business Analysis</span>
              <span className={stage === 'strategy' ? 'text-primary font-medium' : ''}>Strategy Generation</span>
              <span className={stage === 'creative' ? 'text-primary font-medium' : ''}>Creative Development</span>
              <span className={stage === 'review' ? 'text-primary font-medium' : ''}>Review & Launch</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={stage} onValueChange={(v: any) => setStage(v)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis" disabled={!businessInfo}>
            <Brain className="h-4 w-4 mr-2" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="strategy" disabled={!strategy}>
            <Target className="h-4 w-4 mr-2" />
            Strategy
          </TabsTrigger>
          <TabsTrigger value="creative" disabled={!creatives.length}>
            <Sparkles className="h-4 w-4 mr-2" />
            Creative
          </TabsTrigger>
          <TabsTrigger value="review" disabled={!creatives.length}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Intelligence Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {!businessInfo ? (
                <div className="text-center py-8 space-y-4">
                  <Brain className="h-16 w-16 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Our AI will analyze your business and market to create the perfect campaign strategy
                  </p>
                  <Button onClick={analyzeBusiness} disabled={isProcessing}>
                    {isProcessing ? 'Analyzing...' : 'Start AI Analysis'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(businessInfo).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-muted-foreground">{value as string}</span>
                    </div>
                  ))}
                  <Button onClick={() => setStage('strategy')} className="w-full">
                    Generate Strategy <TrendingUp className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategy" className="space-y-4">
          {strategy ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>AI-Generated Campaign Strategy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Objective */}
                  <div>
                    <h3 className="font-semibold mb-2">Primary Objective</h3>
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="font-medium">{strategy.primaryObjective}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{strategy.reasoning}</p>
                  </div>

                  {/* Budget */}
                  <div>
                    <h3 className="font-semibold mb-2">Recommended Budget</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-sm text-muted-foreground">Daily</span>
                        </div>
                        <p className="text-2xl font-bold">${strategy.recommendedBudget?.daily || 100}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-sm text-muted-foreground">Total</span>
                        </div>
                        <p className="text-2xl font-bold">${strategy.recommendedBudget?.total || 3000}</p>
                      </div>
                    </div>
                  </div>

                  {/* Audiences */}
                  <div>
                    <h3 className="font-semibold mb-2">Target Audiences</h3>
                    <div className="space-y-2">
                      {strategy.audiences?.map((audience: any, i: number) => (
                        <div key={i} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{audience.name}</span>
                            <Badge variant={audience.priority === 'primary' ? 'default' : 'secondary'}>
                              {audience.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{audience.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {audience.demographics.ageMin}-{audience.demographics.ageMax} years
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              ~{(audience.estimatedSize / 1000).toFixed(0)}K people
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={generateStrategy} disabled={isProcessing} className="w-full">
                    {isProcessing ? 'Generating...' : 'Continue to Creative'}
                  </Button>
                </CardContent>
              </Card>

              {/* Predictions */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Predictions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <BarChart className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Expected CTR</p>
                      <p className="text-2xl font-bold">{predictions?.ctr || '2.5'}%</p>
                    </div>
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Expected ROAS</p>
                      <p className="text-2xl font-bold">{predictions?.roas || '3.2'}x</p>
                    </div>
                    <div className="text-center">
                      <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Conversions</p>
                      <p className="text-2xl font-bold">{predictions?.conversions || '450'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Button onClick={generateStrategy} disabled={isProcessing}>
                  {isProcessing ? 'Generating Strategy...' : 'Generate AI Strategy'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="creative" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Creatives</CardTitle>
            </CardHeader>
            <CardContent>
              {creatives.length === 0 ? (
                <div className="text-center py-8">
                  <Button onClick={generateCreatives} disabled={isProcessing}>
                    {isProcessing ? 'Generating Creatives...' : 'Generate Ad Creatives'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {creatives.map((creative, i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold">{creative.headline}</h4>
                          <p className="text-sm text-muted-foreground">{creative.primaryText}</p>
                        </div>
                        <Button
                          variant={creative.selected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const updated = [...creatives]
                            updated[i].selected = !updated[i].selected
                            setCreatives(updated)
                          }}
                        >
                          {creative.selected ? 'Selected' : 'Select'}
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{creative.format}</Badge>
                        <Badge variant="outline">{creative.emotionalTone}</Badge>
                        <Badge variant="outline">{creative.cta}</Badge>
                      </div>
                    </div>
                  ))}
                  <Button 
                    onClick={() => setStage('review')} 
                    className="w-full"
                    disabled={!creatives.some(c => c.selected)}
                  >
                    Review Campaign
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Campaign Ready to Launch</span>
                </div>
                
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-semibold">Summary</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Objective: {strategy?.primaryObjective}</li>
                    <li>• Budget: ${strategy?.recommendedBudget?.daily}/day</li>
                    <li>• Duration: {strategy?.duration?.days} days</li>
                    <li>• Audiences: {strategy?.audiences?.length} targeted segments</li>
                    <li>• Creatives: {creatives.filter(c => c.selected).length} ad variations</li>
                  </ul>
                </div>

                <div className="p-4 border-2 border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">AI Recommendations</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Monitor performance daily for the first week</li>
                    <li>• Be ready to increase budget if ROAS exceeds 3.0</li>
                    <li>• Prepare additional creatives to prevent ad fatigue</li>
                    <li>• Consider A/B testing landing pages</li>
                  </ul>
                </div>

                <Button onClick={launchCampaign} className="w-full" size="lg">
                  <Zap className="h-5 w-5 mr-2" />
                  Launch AI-Optimized Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}