'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { 
  FlaskConical,
  Copy,
  Plus,
  Play,
  Pause,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Users,
  Target,
  Zap,
  AlertTriangle,
  Trophy,
  Clock,
  Edit3,
  Trash2,
  ChevronRight
} from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { CreativeIntelligence, CreativeTest, CreativeVariation } from '@/lib/creative-intelligence'

interface ABTestingProps {
  campaignId: string
  creatives: Array<{
    id: string
    name: string
    type: 'image' | 'video' | 'carousel'
    status: 'active' | 'paused'
    metrics: {
      impressions: number
      clicks: number
      conversions: number
      ctr: number
      conversionRate: number
    }
  }>
  onTestCreated?: (test: CreativeTest) => void
}

export function CreativeABTesting({ campaignId, creatives, onTestCreated }: ABTestingProps) {
  const [activeTab, setActiveTab] = useState('create')
  const [selectedCreative, setSelectedCreative] = useState<string>('')
  const [testName, setTestName] = useState('')
  const [testDuration, setTestDuration] = useState([14])
  const [variations, setVariations] = useState<Array<{
    name: string
    changes: string
    hypothesis: string
    traffic: number
  }>>([])
  const [activeTests, setActiveTests] = useState<CreativeTest[]>([])
  const [completedTests, setCompletedTests] = useState<CreativeTest[]>([])

  // Initialize with sample data
  useEffect(() => {
    // In production, fetch from API
    setActiveTests([
      {
        id: 'test_1',
        originalCreativeId: 'creative_1',
        variations: [
          {
            id: 'var_1',
            changes: [{ type: 'headline', content: 'New Headline' }],
            hypothesis: 'Shorter headline will increase CTR',
            traffic: 50
          },
          {
            id: 'var_2',
            changes: [{ type: 'cta', content: 'Shop Now' }],
            hypothesis: 'Urgency in CTA will boost conversions',
            traffic: 50
          }
        ],
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'running'
      }
    ])
  }, [])

  const addVariation = () => {
    setVariations([...variations, {
      name: `Variation ${variations.length + 1}`,
      changes: '',
      hypothesis: '',
      traffic: Math.floor(100 / (variations.length + 2))
    }])
  }

  const removeVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index))
  }

  const updateVariation = (index: number, field: string, value: any) => {
    const updated = [...variations]
    updated[index] = { ...updated[index], [field]: value }
    setVariations(updated)
  }

  const balanceTraffic = () => {
    const equalTraffic = Math.floor(100 / (variations.length + 1))
    const updated = variations.map(v => ({ ...v, traffic: equalTraffic }))
    setVariations(updated)
  }

  const createTest = async () => {
    if (!selectedCreative || !testName || variations.length === 0) {
      return
    }

    const test: CreativeTest = {
      id: `test_${Date.now()}`,
      originalCreativeId: selectedCreative,
      variations: variations.map((v, idx) => ({
        id: `var_${idx}_${Date.now()}`,
        changes: [{ type: 'element_change' as any, content: v.changes }],
        hypothesis: v.hypothesis,
        traffic: v.traffic
      })),
      startDate: new Date(),
      endDate: new Date(Date.now() + testDuration[0] * 24 * 60 * 60 * 1000),
      status: 'planned'
    }

    // In production, create via API
    setActiveTests([...activeTests, test])
    onTestCreated?.(test)
    
    // Reset form
    setTestName('')
    setVariations([])
    setSelectedCreative('')
    setActiveTab('active')
  }

  const getTestProgress = (test: CreativeTest) => {
    if (!test.endDate) return 0
    const total = test.endDate.getTime() - test.startDate.getTime()
    const elapsed = Date.now() - test.startDate.getTime()
    return Math.min(100, (elapsed / total) * 100)
  }

  const formatTimeRemaining = (test: CreativeTest) => {
    if (!test.endDate) return 'Ongoing'
    const remaining = test.endDate.getTime() - Date.now()
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000))
    return days > 0 ? `${days} days remaining` : 'Ending soon'
  }

  const renderTestResults = (test: CreativeTest) => {
    // Sample data - in production would come from API
    const results = [
      { name: 'Original', ctr: 1.5, conversions: 45, uplift: 0, color: '#94a3b8' },
      { name: 'Variation A', ctr: 1.8, conversions: 54, uplift: 20, color: '#3b82f6' },
      { name: 'Variation B', ctr: 2.1, conversions: 63, uplift: 40, color: '#10b981' }
    ]

    const winner = results.reduce((prev, current) => 
      current.conversions > prev.conversions ? current : prev
    )

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {results.map((result, idx) => (
            <Card key={idx} className={result === winner ? 'border-green-500' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{result.name}</CardTitle>
                  {result === winner && <Trophy className="h-4 w-4 text-yellow-500" />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">CTR</p>
                    <p className="text-lg font-bold">{result.ctr}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Conversions</p>
                    <p className="text-lg font-bold">{result.conversions}</p>
                  </div>
                  {result.uplift > 0 && (
                    <Badge className="bg-green-100 text-green-800">
                      +{result.uplift}% uplift
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={[
                { day: 'Day 1', original: 1.5, varA: 1.6, varB: 1.7 },
                { day: 'Day 3', original: 1.5, varA: 1.7, varB: 1.9 },
                { day: 'Day 5', original: 1.5, varA: 1.8, varB: 2.0 },
                { day: 'Day 7', original: 1.5, varA: 1.8, varB: 2.1 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="original" stroke="#94a3b8" />
                <Line type="monotone" dataKey="varA" stroke="#3b82f6" />
                <Line type="monotone" dataKey="varB" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Creative A/B Testing Framework
          </CardTitle>
          <CardDescription>
            Test creative variations to optimize performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="create">Create Test</TabsTrigger>
              <TabsTrigger value="active">Active Tests</TabsTrigger>
              <TabsTrigger value="completed">Completed Tests</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6 mt-6">
              {/* Test Configuration */}
              <div className="space-y-4">
                <div>
                  <Label>Test Name</Label>
                  <Input 
                    placeholder="e.g., Headline Optimization Test"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Select Creative</Label>
                  <Select value={selectedCreative} onValueChange={setSelectedCreative}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a creative to test" />
                    </SelectTrigger>
                    <SelectContent>
                      {creatives.map(creative => (
                        <SelectItem key={creative.id} value={creative.id}>
                          {creative.name} ({creative.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Test Duration: {testDuration[0]} days</Label>
                  <Slider 
                    value={testDuration}
                    onValueChange={setTestDuration}
                    min={7}
                    max={30}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Variations */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Test Variations</Label>
                  <Button onClick={addVariation} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Variation
                  </Button>
                </div>

                <div className="space-y-4">
                  {variations.map((variation, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Input 
                              placeholder="Variation name"
                              value={variation.name}
                              onChange={(e) => updateVariation(idx, 'name', e.target.value)}
                              className="max-w-xs"
                            />
                            <Button 
                              onClick={() => removeVariation(idx)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div>
                            <Label className="text-xs">Changes</Label>
                            <Textarea 
                              placeholder="Describe what will be changed (e.g., Headline text, CTA color, Image)"
                              value={variation.changes}
                              onChange={(e) => updateVariation(idx, 'changes', e.target.value)}
                              className="mt-1"
                              rows={2}
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Hypothesis</Label>
                            <Textarea 
                              placeholder="Why do you think this change will improve performance?"
                              value={variation.hypothesis}
                              onChange={(e) => updateVariation(idx, 'hypothesis', e.target.value)}
                              className="mt-1"
                              rows={2}
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Traffic Split: {variation.traffic}%</Label>
                            </div>
                            <Slider 
                              value={[variation.traffic]}
                              onValueChange={(value) => updateVariation(idx, 'traffic', value[0])}
                              min={0}
                              max={100}
                              step={5}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {variations.length > 0 && (
                  <div className="flex gap-2">
                    <Button onClick={balanceTraffic} variant="outline" size="sm">
                      Balance Traffic Equally
                    </Button>
                    <p className="text-sm text-muted-foreground flex items-center">
                      Original: {100 - variations.reduce((sum, v) => sum + v.traffic, 0)}%
                    </p>
                  </div>
                )}
              </div>

              {/* Create Test Button */}
              <div className="flex justify-end gap-2">
                <Button 
                  onClick={createTest}
                  disabled={!selectedCreative || !testName || variations.length === 0}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Test
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="active" className="space-y-4 mt-6">
              {activeTests.length > 0 ? (
                activeTests.map(test => (
                  <Card key={test.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Test #{test.id.slice(-6)}
                        </CardTitle>
                        <Badge className="bg-blue-100 text-blue-800">
                          {test.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Started {test.startDate.toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{formatTimeRemaining(test)}</span>
                        </div>
                        <Progress value={getTestProgress(test)} />
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Variations</p>
                          <p className="text-xl font-bold">{test.variations.length + 1}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Impressions</p>
                          <p className="text-xl font-bold">12.5K</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Confidence</p>
                          <p className="text-xl font-bold">87%</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          View Results
                        </Button>
                        <Button size="sm" variant="outline">
                          <Pause className="h-4 w-4 mr-1" />
                          Pause Test
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No active tests</p>
                  <Button 
                    onClick={() => setActiveTab('create')} 
                    variant="outline"
                    className="mt-4"
                  >
                    Create Your First Test
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-6 mt-6">
              {/* Sample completed test */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Headline Optimization Test
                      </CardTitle>
                      <CardDescription>
                        Completed on {new Date().toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <Trophy className="h-3 w-3 mr-1" />
                      Winner Found
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {renderTestResults({
                    id: 'test_completed',
                    originalCreativeId: 'creative_1',
                    variations: [],
                    startDate: new Date(),
                    status: 'completed'
                  })}
                  
                  <Alert className="mt-4">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Test Conclusion</AlertTitle>
                    <AlertDescription>
                      Variation B performed best with a 40% uplift in conversions. 
                      The urgency-based headline significantly outperformed the original.
                      Statistical significance: 95% confidence.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2 mt-4">
                    <Button size="sm">
                      <Zap className="h-4 w-4 mr-1" />
                      Apply Winner
                    </Button>
                    <Button size="sm" variant="outline">
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicate Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}