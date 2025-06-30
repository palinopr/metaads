"use client"

import { AgentChat } from "@/components/agent-chat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  MessageSquare, 
  Sparkles, 
  Target, 
  DollarSign, 
  Users,
  Lightbulb,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

export default function TestAgentPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="h1 mb-2">AI Agent Testing</h1>
        <p className="text-muted-foreground">
          Test the AI campaign assistant and explore its capabilities
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Setup Required:</strong> Add your Anthropic or OpenAI API key to <code className="text-sm bg-muted px-1 py-0.5 rounded">.env.local</code> to enable the AI assistant.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Test Conversations
            </CardTitle>
            <CardDescription>
              Try these example prompts to see how the AI responds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Badge variant="outline" className="mb-1">Campaign Creation</Badge>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• "I want to create a campaign for my e-commerce store"</li>
                <li>• "Help me promote my new fitness app"</li>
                <li>• "I need to increase sales for my online course"</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Badge variant="outline" className="mb-1">Audience Targeting</Badge>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• "Who should I target for a luxury watch brand?"</li>
                <li>• "I want to reach young professionals interested in fitness"</li>
                <li>• "Help me find my ideal customer audience"</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Badge variant="outline" className="mb-1">Budget Planning</Badge>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• "What budget do I need for 10,000 clicks?"</li>
                <li>• "I have $500, how should I allocate it?"</li>
                <li>• "Calculate ROI for a $100/day campaign"</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Capabilities
            </CardTitle>
            <CardDescription>
              What the campaign assistant can do for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Campaign Strategy</p>
                <p className="text-sm text-muted-foreground">
                  Recommends objectives, optimization goals, and bidding strategies
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Audience Building</p>
                <p className="text-sm text-muted-foreground">
                  Suggests demographics, interests, behaviors, and custom audiences
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Budget Optimization</p>
                <p className="text-sm text-muted-foreground">
                  Calculates optimal budgets and forecasts expected results
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Creative Ideas</p>
                <p className="text-sm text-muted-foreground">
                  Generates ad copy, headlines, and creative suggestions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Expected Behaviors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <p className="font-medium text-sm">Conversational</p>
              <p className="text-sm text-muted-foreground">
                Asks clarifying questions to understand your needs
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">Specific</p>
              <p className="text-sm text-muted-foreground">
                Provides detailed recommendations with reasoning
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">Actionable</p>
              <p className="text-sm text-muted-foreground">
                Offers quick actions and next steps
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Chat Component */}
      <AgentChat defaultOpen={true} agentType="campaign" />
    </div>
  )
}