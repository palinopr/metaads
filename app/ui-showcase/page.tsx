"use client"

import { Card, CardContent, CardHeader, CardTitle, CardGrid } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SimpleInteractiveButton, SimplePulseIndicator, haptics } from "@/components/ui/simple-micro-interactions"
import { Skeleton, SkeletonCard, SkeletonChart } from "@/components/ui/loading-skeleton"
import { ModeToggle } from "@/components/mode-toggle"
import Header from "@/components/header"
import { EnhancedDashboardPreview } from "@/components/enhanced-dashboard-preview"
import { 
  Sparkles, 
  Palette, 
  Smartphone, 
  Accessibility, 
  Zap, 
  Layers,
  Monitor,
  Star,
  Heart,
  Lightbulb
} from "lucide-react"
import { useState } from "react"

export default function UIShowcase() {
  const [showLoading, setShowLoading] = useState(false)

  const showcaseFeatures = [
    {
      icon: Palette,
      title: "Enhanced Design System",
      description: "Meta brand colors, semantic tokens, and comprehensive theming",
      color: "text-blue-600"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Responsive",
      description: "Fluid layouts that work perfectly on any device",
      color: "text-green-600"
    },
    {
      icon: Accessibility,
      title: "WCAG AA Compliance",
      description: "Full accessibility support with keyboard navigation",
      color: "text-purple-600"
    },
    {
      icon: Zap,
      title: "Micro-Interactions",
      description: "Haptic feedback and smooth animations throughout",
      color: "text-orange-600"
    },
    {
      icon: Layers,
      title: "Progressive Enhancement",
      description: "Adaptive performance based on device capabilities",
      color: "text-indigo-600"
    },
    {
      icon: Monitor,
      title: "Loading States",
      description: "Beautiful skeleton screens for better UX",
      color: "text-pink-600"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-responsive py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 fade-in">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="heading-responsive font-bold gradient-text">
              UI/UX Showcase
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the complete transformation of the Meta Ads Dashboard with 
            modern design patterns, accessibility features, and smooth interactions.
          </p>
        </div>

        {/* Theme Toggle Demo */}
        <Card className="mb-8 fade-in" style={{ animationDelay: "0.1s" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Theme System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Switch between light, dark, and system themes
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Current: Dynamic
                  </span>
                  <SimplePulseIndicator size="sm" color="green" />
                </div>
              </div>
              <ModeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Enhanced Features</h2>
          <CardGrid cols={3} gap="md">
            {showcaseFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card 
                  key={feature.title} 
                  variant="interactive" 
                  hover
                  className="fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-background ${feature.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </CardGrid>
        </div>

        {/* Interactive Buttons Demo */}
        <Card className="mb-8 fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Interactive Components
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Haptic Feedback Buttons</h4>
                <div className="flex flex-wrap gap-3">
                  <SimpleInteractiveButton 
                    onClick={() => haptics.light()}
                    variant="default"
                  >
                    Light Haptic
                  </SimpleInteractiveButton>
                  <SimpleInteractiveButton 
                    onClick={() => haptics.medium()}
                    variant="secondary"
                  >
                    Medium Haptic
                  </SimpleInteractiveButton>
                  <SimpleInteractiveButton 
                    onClick={() => haptics.heavy()}
                    variant="outline"
                  >
                    Heavy Haptic
                  </SimpleInteractiveButton>
                  <SimpleInteractiveButton 
                    onClick={() => haptics.success()}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Success
                  </SimpleInteractiveButton>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Card Variants</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card variant="default">
                    <CardContent className="p-4 text-center">
                      <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
                      <p className="text-sm">Default Card</p>
                    </CardContent>
                  </Card>
                  <Card variant="elevated">
                    <CardContent className="p-4 text-center">
                      <Lightbulb className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                      <p className="text-sm">Elevated Card</p>
                    </CardContent>
                  </Card>
                  <Card variant="glass">
                    <CardContent className="p-4 text-center">
                      <Sparkles className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                      <p className="text-sm">Glass Card</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading States Demo */}
        <Card className="mb-8 fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Loading States & Skeletons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Button 
                onClick={() => setShowLoading(!showLoading)}
                variant={showLoading ? "destructive" : "default"}
              >
                {showLoading ? "Hide" : "Show"} Loading Demo
              </Button>
              <span className="text-sm text-muted-foreground">
                Toggle to see skeleton loading states
              </span>
            </div>
            
            {showLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SkeletonCard showAvatar={true} lines={3} />
                  <SkeletonCard showAvatar={false} lines={4} />
                </div>
                <SkeletonChart type="bar" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card variant="interactive">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Star className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Sample Content</CardTitle>
                          <p className="text-sm text-muted-foreground">Loaded state</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">This is what the content looks like when fully loaded.</p>
                    </CardContent>
                  </Card>
                  
                  <Card variant="interactive">
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <p className="text-sm text-muted-foreground">Interactive Chart Area</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dashboard Preview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Enhanced Dashboard Preview</h2>
          <EnhancedDashboardPreview loading={showLoading} />
        </div>

        {/* Installation Guide */}
        <Card className="fade-in">
          <CardHeader>
            <CardTitle>🚀 Installation Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">For Full Animation Features:</h4>
                <div className="bg-muted/50 rounded-lg p-4">
                  <code className="text-sm">npm install framer-motion</code>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">What's Included:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✅ Enhanced design system with Meta brand colors</li>
                  <li>✅ Mobile-first responsive layouts</li>
                  <li>✅ Dark/light theme system</li>
                  <li>✅ WCAG AA accessibility compliance</li>
                  <li>✅ Smooth animations and micro-interactions</li>
                  <li>✅ Progressive enhancement features</li>
                  <li>✅ Loading states and skeleton screens</li>
                  <li>✅ Haptic feedback for mobile devices</li>
                </ul>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">
                  See <code>UI_UX_ENHANCEMENT_GUIDE.md</code> for complete documentation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}