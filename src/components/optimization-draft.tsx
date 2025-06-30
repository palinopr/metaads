"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Brain,
  Zap,
  Target,
  DollarSign,
  Image,
  Users,
  TrendingUp,
  AlertCircle,
  Check,
  X
} from 'lucide-react'

interface OptimizationDraftProps {
  campaignId: string
  issues: string[]
  recommendations: string[]
  onApply: (selectedOptimizations: any[]) => void
  onCancel: () => void
}

export function OptimizationDraft({ 
  campaignId, 
  issues, 
  recommendations,
  onApply,
  onCancel
}: OptimizationDraftProps) {
  const [selectedOptimizations, setSelectedOptimizations] = useState<string[]>([])
  
  // Generate optimization actions based on issues
  const optimizations = generateOptimizations(issues, recommendations)
  
  const handleToggle = (optId: string) => {
    setSelectedOptimizations(prev => 
      prev.includes(optId) 
        ? prev.filter(id => id !== optId)
        : [...prev, optId]
    )
  }
  
  const handleApply = () => {
    const selected = optimizations.filter(opt => selectedOptimizations.includes(opt.id))
    onApply(selected)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Brain className="h-12 w-12 mx-auto text-primary" />
        <h2 className="text-2xl font-bold">AI Optimization Plan</h2>
        <p className="text-muted-foreground">
          Review and select the optimizations you want to apply
        </p>
      </div>

      <div className="grid gap-4">
        {optimizations.map((opt) => (
          <Card 
            key={opt.id}
            className={`cursor-pointer transition-all ${
              selectedOptimizations.includes(opt.id) 
                ? 'border-primary ring-2 ring-primary/20' 
                : ''
            }`}
            onClick={() => handleToggle(opt.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedOptimizations.includes(opt.id)}
                    onCheckedChange={() => handleToggle(opt.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {opt.icon}
                      {opt.title}
                    </CardTitle>
                    <CardDescription>{opt.description}</CardDescription>
                  </div>
                </div>
                <Badge variant={opt.impact === 'high' ? 'default' : 'secondary'}>
                  {opt.impact} impact
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium">What will change:</p>
                  <ul className="space-y-1">
                    {opt.changes.map((change: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Check className="h-3 w-3 text-green-500 mt-0.5" />
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {opt.preview && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-xs font-medium mb-1">Preview:</p>
                    <div className="text-sm font-mono">{opt.preview}</div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground">
                    Estimated improvement: <span className="font-medium text-green-600">+{opt.improvement}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Time to implement: <span className="font-medium">{opt.timeToImplement}</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Selected optimizations:</span>
              <span className="font-medium">{selectedOptimizations.length} of {optimizations.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total estimated improvement:</span>
              <span className="font-medium text-green-600">
                +{calculateTotalImprovement(optimizations, selectedOptimizations)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Implementation time:</span>
              <span className="font-medium">~5 minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button 
          onClick={handleApply}
          disabled={selectedOptimizations.length === 0}
          className="flex-1"
        >
          <Zap className="h-4 w-4 mr-2" />
          Apply {selectedOptimizations.length} Optimization{selectedOptimizations.length !== 1 ? 's' : ''}
        </Button>
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
      </div>
    </div>
  )
}

function generateOptimizations(issues: string[], recommendations: string[]): any[] {
  const optimizations = []
  
  if (issues.includes('Low click-through rate')) {
    optimizations.push({
      id: 'creative-refresh',
      title: 'Creative Refresh',
      icon: <Image className="h-5 w-5 text-blue-500" />,
      description: 'Generate new ad creatives with AI-powered hooks and compelling visuals',
      impact: 'high',
      improvement: '35% CTR',
      timeToImplement: '2 min',
      changes: [
        'Generate 5 new headline variations using power words',
        'Create urgency-based call-to-actions',
        'Add social proof elements to ad copy',
        'Test emoji usage in headlines'
      ],
      preview: 'New headline: "🔥 Last Chance: 50% Off Premium Collection - Only 48 Hours Left!"'
    })
  }
  
  if (issues.includes('Ad fatigue detected')) {
    optimizations.push({
      id: 'creative-rotation',
      title: 'Implement Creative Rotation',
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      description: 'Set up automatic creative rotation to combat ad fatigue',
      impact: 'high',
      improvement: '25% engagement',
      timeToImplement: '1 min',
      changes: [
        'Enable dynamic creative optimization',
        'Set frequency cap to 2 impressions per user per day',
        'Create 3 creative variants for A/B testing',
        'Schedule creative refresh every 7 days'
      ]
    })
  }
  
  if (issues.includes('High cost per click')) {
    optimizations.push({
      id: 'audience-optimization',
      title: 'Audience Refinement',
      icon: <Users className="h-5 w-5 text-purple-500" />,
      description: 'Narrow targeting to reach more qualified users and reduce CPC',
      impact: 'high',
      improvement: '40% lower CPC',
      timeToImplement: '3 min',
      changes: [
        'Add interest-based targeting: "Online shoppers", "Premium brands"',
        'Exclude low-performing demographics',
        'Create lookalike audience from top 10% customers',
        'Add value-based custom audiences'
      ],
      preview: 'New audience size: 1.2M (from 2.5M) - Higher quality'
    })
    
    optimizations.push({
      id: 'bid-strategy',
      title: 'Optimize Bidding Strategy',
      icon: <DollarSign className="h-5 w-5 text-yellow-500" />,
      description: 'Switch to cost cap bidding to control costs while maintaining volume',
      impact: 'medium',
      improvement: '20% lower CPC',
      timeToImplement: '1 min',
      changes: [
        'Switch from "Lowest Cost" to "Cost Cap" bidding',
        'Set cost cap at $1.50 (current avg: $2.50)',
        'Enable campaign budget optimization',
        'Adjust budget pacing to standard'
      ]
    })
  }
  
  if (issues.includes('Limited creative variations')) {
    optimizations.push({
      id: 'creative-expansion',
      title: 'Expand Creative Library',
      icon: <Zap className="h-5 w-5 text-orange-500" />,
      description: 'Generate multiple creative variations to improve performance',
      impact: 'medium',
      improvement: '30% better performance',
      timeToImplement: '5 min',
      changes: [
        'Generate 5 image variations with different angles',
        'Create 3 video ads from existing content',
        'Add carousel format with product highlights',
        'Test collection ads for better engagement'
      ]
    })
  }
  
  return optimizations
}

function calculateTotalImprovement(optimizations: any[], selected: string[]): number {
  const selectedOpts = optimizations.filter(opt => selected.includes(opt.id))
  const improvements = selectedOpts.map(opt => parseInt(opt.improvement))
  
  // Simple average for demo - in reality would be more complex
  return improvements.length > 0 
    ? Math.round(improvements.reduce((a, b) => a + b, 0) / improvements.length)
    : 0
}