'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Sparkles,
  Wand2,
  RefreshCw,
  Copy,
  Download,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Palette,
  Type,
  Image,
  Video,
  Camera,
  Layers,
  Target,
  Users,
  Clock,
  Star,
  TrendingUp,
  Brain,
  Lightbulb,
  Zap,
  ChevronRight,
  Magic,
  Settings,
  Filter,
  Shuffle,
  Save,
  Share2,
  Play,
  Edit3
} from 'lucide-react'
import { cn } from "@/lib/utils"

interface GenerationParams {
  industry: string
  audience: string
  objective: string
  tone: string
  style: string
  colorScheme: string
  format: string
  creativity: number
  brandGuidelines?: string
}

interface GeneratedCreative {
  id: string
  type: 'headline' | 'body' | 'cta' | 'concept' | 'layout' | 'color'
  content: string
  confidence: number
  reasoning: string
  variants?: string[]
  preview?: string
  tags: string[]
}

interface CreativeGenerationProps {
  campaignId?: string
  existingCreatives?: any[]
  onGeneratedCreativeSelect?: (creative: GeneratedCreative) => void
}

export function CreativeGenerationSuggestions({
  campaignId,
  existingCreatives = [],
  onGeneratedCreativeSelect
}: CreativeGenerationProps) {
  const [activeTab, setActiveTab] = useState('generate')
  const [isGenerating, setIsGenerating] = useState(false)
  const [params, setParams] = useState<GenerationParams>({
    industry: 'technology',
    audience: 'young-professionals',
    objective: 'conversions',
    tone: 'professional',
    style: 'modern',
    colorScheme: 'brand',
    format: 'image',
    creativity: 50
  })
  const [generatedCreatives, setGeneratedCreatives] = useState<GeneratedCreative[]>([])
  const [selectedCreatives, setSelectedCreatives] = useState<Set<string>>(new Set())

  const generateCreatives = async () => {
    setIsGenerating(true)
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const generated: GeneratedCreative[] = [
      {
        id: '1',
        type: 'headline',
        content: 'Transform Your Workflow in 30 Days',
        confidence: 92,
        reasoning: 'Numbers and transformation words perform 40% better for tech audiences',
        variants: [
          'Revolutionize Your Workflow Today',
          '30-Day Complete Workflow Transformation',
          'From Chaos to Efficiency in 30 Days'
        ],
        tags: ['transformation', 'efficiency', 'timeframe']
      },
      {
        id: '2',
        type: 'body',
        content: 'Join 50,000+ professionals who have streamlined their daily tasks with our AI-powered platform. Save 3 hours per day and focus on what matters most.',
        confidence: 88,
        reasoning: 'Social proof + specific benefits resonate with young professionals',
        variants: [
          'Discover why 50,000+ professionals trust our platform to optimize their workflow and reclaim their time.',
          'Stop wasting time on repetitive tasks. Our AI handles the busy work while you focus on strategic growth.'
        ],
        tags: ['social-proof', 'benefits', 'productivity']
      },
      {
        id: '3',
        type: 'cta',
        content: 'Start Free Trial',
        confidence: 85,
        reasoning: 'Low-friction CTAs increase conversion rates by 25%',
        variants: [
          'Try It Free Today',
          'Get Started Now',
          'Claim Your Free Trial',
          'Start Transforming Today'
        ],
        tags: ['free', 'trial', 'action']
      },
      {
        id: '4',
        type: 'concept',
        content: 'Split-screen showing chaotic vs. organized workspace with productivity metrics overlay',
        confidence: 90,
        reasoning: 'Before/after visuals increase engagement by 67% in productivity software',
        tags: ['before-after', 'productivity', 'visual-contrast']
      },
      {
        id: '5',
        type: 'color',
        content: 'Primary: Deep Blue (#1e40af), Secondary: Vibrant Green (#10b981), Accent: Orange (#f59e0b)',
        confidence: 78,
        reasoning: 'Blue conveys trust, green suggests growth, orange adds energy for CTAs',
        tags: ['trust', 'growth', 'energy']
      }
    ]
    
    setGeneratedCreatives(generated)
    setIsGenerating(false)
  }

  const regenerateSpecific = (type: string) => {
    // Regenerate specific element type
    console.log(`Regenerating ${type}`)
  }

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedCreatives)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedCreatives(newSelection)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'headline': return Type
      case 'body': return Type
      case 'cta': return Zap
      case 'concept': return Lightbulb
      case 'layout': return Layers
      case 'color': return Palette
      default: return Sparkles
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'headline': return 'bg-blue-50 text-blue-700'
      case 'body': return 'bg-green-50 text-green-700'
      case 'cta': return 'bg-orange-50 text-orange-700'
      case 'concept': return 'bg-purple-50 text-purple-700'
      case 'layout': return 'bg-pink-50 text-pink-700'
      case 'color': return 'bg-yellow-50 text-yellow-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  const CreativeCard = ({ creative }: { creative: GeneratedCreative }) => {
    const Icon = getTypeIcon(creative.type)
    const isSelected = selectedCreatives.has(creative.id)
    
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          isSelected && "ring-2 ring-blue-500"
        )}
        onClick={() => toggleSelection(creative.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg", getTypeColor(creative.type))}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <Badge variant="outline" className="text-xs capitalize">
                  {creative.type}
                </Badge>
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-muted-foreground">{creative.confidence}% confidence</span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                regenerateSpecific(creative.type)
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm">{creative.content}</p>
            
            <p className="text-xs text-muted-foreground">{creative.reasoning}</p>
            
            {creative.variants && creative.variants.length > 0 && (
              <div>
                <Label className="text-xs">Variants:</Label>
                <div className="space-y-1 mt-1">
                  {creative.variants.slice(0, 2).map((variant, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground pl-2 border-l-2 border-gray-200">
                      {variant}
                    </p>
                  ))}
                  {creative.variants.length > 2 && (
                    <Button variant="ghost" size="sm" className="text-xs h-6 p-0">
                      +{creative.variants.length - 2} more variants
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex gap-1 flex-wrap">
              {creative.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Creative Generation
          </CardTitle>
          <CardDescription>
            Generate optimized creative elements using advanced AI models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-6 mt-6">
              {/* Generation Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Industry</Label>
                    <Select value={params.industry} onValueChange={(value) => setParams({...params, industry: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Target Audience</Label>
                    <Select value={params.audience} onValueChange={(value) => setParams({...params, audience: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="young-professionals">Young Professionals (25-35)</SelectItem>
                        <SelectItem value="middle-aged">Middle-aged (35-50)</SelectItem>
                        <SelectItem value="seniors">Seniors (50+)</SelectItem>
                        <SelectItem value="students">Students</SelectItem>
                        <SelectItem value="parents">Parents</SelectItem>
                        <SelectItem value="entrepreneurs">Entrepreneurs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Campaign Objective</Label>
                    <Select value={params.objective} onValueChange={(value) => setParams({...params, objective: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="awareness">Brand Awareness</SelectItem>
                        <SelectItem value="traffic">Website Traffic</SelectItem>
                        <SelectItem value="conversions">Conversions</SelectItem>
                        <SelectItem value="leads">Lead Generation</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="app-installs">App Installs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Brand Tone</Label>
                    <Select value={params.tone} onValueChange={(value) => setParams({...params, tone: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="authoritative">Authoritative</SelectItem>
                        <SelectItem value="playful">Playful</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="inspirational">Inspirational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Visual Style</Label>
                    <Select value={params.style} onValueChange={(value) => setParams({...params, style: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="minimalist">Minimalist</SelectItem>
                        <SelectItem value="vibrant">Vibrant</SelectItem>
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="elegant">Elegant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Creative Format</Label>
                    <Select value={params.format} onValueChange={(value) => setParams({...params, format: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Single Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="carousel">Carousel</SelectItem>
                        <SelectItem value="collection">Collection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Creativity Level: {params.creativity}%</Label>
                    <Slider
                      value={[params.creativity]}
                      onValueChange={(value) => setParams({...params, creativity: value[0]})}
                      min={0}
                      max={100}
                      step={10}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Conservative</span>
                      <span>Experimental</span>
                    </div>
                  </div>

                  <div>
                    <Label>Brand Guidelines (Optional)</Label>
                    <Textarea
                      placeholder="Describe your brand voice, colors, style preferences..."
                      value={params.brandGuidelines || ''}
                      onChange={(e) => setParams({...params, brandGuidelines: e.target.value})}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={generateCreatives}
                  disabled={isGenerating}
                  size="lg"
                  className="min-w-48"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Creatives
                    </>
                  )}
                </Button>
              </div>

              {/* Generated Results */}
              {generatedCreatives.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Generated Creatives</h3>
                    <div className="flex gap-2">
                      {selectedCreatives.size > 0 && (
                        <Button variant="outline" size="sm">
                          <Save className="h-4 w-4 mr-1" />
                          Save Selected ({selectedCreatives.size})
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={generateCreatives}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Regenerate All
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedCreatives.map(creative => (
                      <CreativeCard key={creative.id} creative={creative} />
                    ))}
                  </div>

                  {selectedCreatives.size > 0 && (
                    <Card className="bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Ready to Use</h4>
                            <p className="text-sm text-muted-foreground">
                              {selectedCreatives.size} elements selected for your campaign
                            </p>
                          </div>
                          <Button onClick={() => console.log('Creating campaign...')}>
                            <Play className="h-4 w-4 mr-2" />
                            Create Campaign
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-6">
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No generation history yet</p>
                <p className="text-sm text-muted-foreground">Generated creatives will appear here</p>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: 'E-commerce Product Launch',
                    description: 'High-converting templates for product launches',
                    elements: ['Headline', 'Description', 'CTA', 'Visual concept'],
                    performance: '25% higher CTR'
                  },
                  {
                    name: 'SaaS Free Trial',
                    description: 'Proven templates for software trials',
                    elements: ['Value prop', 'Social proof', 'CTA', 'Benefits'],
                    performance: '40% more signups'
                  },
                  {
                    name: 'Local Business',
                    description: 'Location-based service promotions',
                    elements: ['Local appeal', 'Reviews', 'Contact', 'Offers'],
                    performance: '30% more calls'
                  }
                ].map((template, idx) => (
                  <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Includes:</Label>
                          <div className="flex gap-1 flex-wrap mt-1">
                            {template.elements.map(element => (
                              <Badge key={element} variant="outline" className="text-xs">
                                {element}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {template.performance}
                          </Badge>
                          <Button size="sm" variant="outline">
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}