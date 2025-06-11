"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Zap, Brain, Target, TrendingUp, Layers, BarChart3, 
  Shield, Sparkles, Trophy, Rocket, DollarSign, Users,
  Clock, AlertCircle, CheckCircle, ArrowUp, ChevronRight,
  Bot, Lightbulb, LineChart, PieChart, Activity, Eye
} from "lucide-react"

export function PlatformEnhancements() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg border bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4">Meta Ads Platform Pro</h1>
          <p className="text-xl mb-6">Industry-Leading Ad Intelligence & Automation</p>
          <div className="flex flex-wrap gap-4">
            <Badge className="bg-white/20 text-white border-white/30">
              <Rocket className="w-4 h-4 mr-1" />
              Next-Gen Features
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30">
              <Brain className="w-4 h-4 mr-1" />
              AI-Powered
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30">
              <Shield className="w-4 h-4 mr-1" />
              Enterprise Ready
            </Badge>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Key Differentiators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Real-Time Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Automated campaign optimization with ML-powered decision making
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Auto-Bidding</span>
                <Badge variant="outline">Live</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Budget Reallocation</span>
                <Badge variant="outline">Live</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Creative Rotation</span>
                <Badge variant="outline">Live</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Creative Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              AI analyzes and optimizes creative performance automatically
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Element Analysis</span>
                <Badge variant="outline">AI</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Fatigue Prediction</span>
                <Badge variant="outline">AI</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>A/B Test Generation</span>
                <Badge variant="outline">AI</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Advanced Attribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Multi-touch attribution with 6 different models
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Data-Driven (Shapley)</span>
                <Badge variant="outline">New</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Incrementality Testing</span>
                <Badge variant="outline">New</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Cross-Channel</span>
                <Badge variant="outline">New</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>How We Compare to Competitors</CardTitle>
          <CardDescription>
            Features that make us the industry leader
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { feature: "Real-time ML Optimization", us: true, competitors: false },
              { feature: "Creative Intelligence AI", us: true, competitors: false },
              { feature: "Multi-Touch Attribution", us: true, competitors: "partial" },
              { feature: "Predictive Analytics", us: true, competitors: true },
              { feature: "Campaign Autopilot", us: true, competitors: false },
              { feature: "Voice Commands", us: true, competitors: false },
              { feature: "Incrementality Testing", us: true, competitors: false },
              { feature: "API Integrations", us: true, competitors: true },
              { feature: "Custom ML Models", us: true, competitors: false },
              { feature: "Performance Guarantees", us: true, competitors: false }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                <span className="font-medium">{item.feature}</span>
                <div className="flex gap-8">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Us</div>
                    {item.us ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Others</div>
                    {item.competitors === true ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : item.competitors === "partial" ? (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Features Showcase */}
      <Tabs defaultValue="optimization" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-Time Campaign Optimization Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Smart Rules Engine</AlertTitle>
                <AlertDescription>
                  Automatically optimizes campaigns based on customizable rules and ML predictions
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Scale Winners Rule</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    When ROAS {'>'}  3.0 for 72 hours → Increase budget by 20%
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Triggered 23 times this week</span>
                    <span className="text-green-600 font-medium">+$12,450 revenue</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Pause Underperformers</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    When ROAS {'<'} 0.5 for 7 days → Pause campaign
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Saved $3,200 in wasted spend</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Creative Intelligence System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Creative Scoring</h4>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Attention Score</span>
                      <span className="font-medium">87/100</span>
                    </div>
                    <Progress value={87} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span>Clarity Score</span>
                      <span className="font-medium">92/100</span>
                    </div>
                    <Progress value={92} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span>Emotion Score</span>
                      <span className="font-medium">78/100</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">AI Predictions</h4>
                  <div className="space-y-2">
                    <Alert className="py-2">
                      <TrendingUp className="h-4 w-4" />
                      <AlertDescription>
                        CTR: 2.8% (↑ 0.6% vs avg)
                      </AlertDescription>
                    </Alert>
                    <Alert className="py-2">
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Fatigue in: 14 days
                      </AlertDescription>
                    </Alert>
                    <Alert className="py-2">
                      <DollarSign className="h-4 w-4" />
                      <AlertDescription>
                        Est. ROAS: 3.2x
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>AI Recommendation</AlertTitle>
                <AlertDescription>
                  Test a variation with stronger CTA urgency. Expected +20% conversion rate.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Campaign Autopilot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <Rocket className="h-4 w-4" />
                <AlertTitle>Fully Automated Management</AlertTitle>
                <AlertDescription>
                  Set your goals and let AI handle the rest - bidding, budgets, creatives, and targeting
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-medium">Autopilot Active</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Managing 24 campaigns</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">+34%</div>
                    <div className="text-xs text-muted-foreground">ROAS Improvement</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">-28%</div>
                    <div className="text-xs text-muted-foreground">Cost Reduction</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">2.4x</div>
                    <div className="text-xs text-muted-foreground">Faster Optimization</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Recent Autopilot Actions</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Increased budget for "Summer Sale" by 25%</span>
                      <span className="text-muted-foreground">2 hrs ago</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Paused underperforming ad set in "Brand Awareness"</span>
                      <span className="text-muted-foreground">4 hrs ago</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Created lookalike audience for high-value customers</span>
                      <span className="text-muted-foreground">6 hrs ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Advanced Analytics & Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Multi-Touch Attribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Data-Driven Model</span>
                        <Badge>Primary</Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">First Touch</span>
                          <span>23%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mid Journey</span>
                          <span>41%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Touch</span>
                          <span>36%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Customer Journey Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Avg Touchpoints</span>
                        <span className="font-medium">4.7</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Days to Convert</span>
                        <span className="font-medium">12.3</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Cross-Device</span>
                        <span className="font-medium">68%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <Trophy className="h-4 w-4" />
                <AlertTitle>Competitive Advantage</AlertTitle>
                <AlertDescription>
                  Your campaigns are outperforming industry benchmarks by 42% on average
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ROI Impact */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Platform ROI Impact
          </CardTitle>
          <CardDescription>
            Measurable improvements from our advanced features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">+156%</div>
              <div className="text-sm text-muted-foreground">Average ROAS Lift</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">-43%</div>
              <div className="text-sm text-muted-foreground">Cost Per Acquisition</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">89%</div>
              <div className="text-sm text-muted-foreground">Time Saved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">3.2x</div>
              <div className="text-sm text-muted-foreground">Faster Scaling</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}