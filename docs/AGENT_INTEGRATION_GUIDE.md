# Agent Integration Guide

## Quick Start

### 1. Add the Agent Chat to Your Campaigns Page

```tsx
// In src/app/dashboard/campaigns/page.tsx
import { AgentChat } from '@/components/agent-chat'

export default function CampaignsPage() {
  return (
    <div>
      {/* Your existing campaigns content */}
      
      {/* Add the AI Assistant */}
      <AgentChat agentType="campaign" />
    </div>
  )
}
```

### 2. Environment Variables

Add these to your `.env.local`:

```env
# AI Model API Keys
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key  # Optional, fallback

# For Python agent service (if using separate service)
AGENT_SERVICE_URL=http://localhost:8000  # Or your deployed service
```

### 3. Install Dependencies

For the JavaScript/TypeScript implementation:

```bash
npm install @langchain/core @langchain/anthropic @langchain/openai
```

For the Python agent service:

```bash
pip install langchain langchain-anthropic langchain-openai langgraph
```

## Implementation Options

### Option 1: Full JavaScript Implementation (Recommended for Quick Start)

```typescript
// src/lib/agents/campaign-agent.ts
import { ChatAnthropic } from '@langchain/anthropic'
import { DynamicTool } from '@langchain/core/tools'
import { AgentExecutor, createReactAgent } from 'langchain/agents'

export async function createCampaignAgent() {
  const model = new ChatAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    modelName: 'claude-3-sonnet-20240229'
  })

  const tools = [
    new DynamicTool({
      name: 'analyze_objective',
      description: 'Analyze business objective and recommend campaign settings',
      func: async (objective: string) => {
        // Your implementation
        return JSON.stringify({ 
          recommendation: 'CONVERSIONS',
          budget: { min: 50, max: 500 }
        })
      }
    }),
    // Add more tools...
  ]

  return createReactAgent({ llm: model, tools })
}
```

### Option 2: Python Microservice (For Advanced Features)

1. Create a FastAPI service:

```python
# agent_service/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from campaign_creator import CampaignCreationAgent

app = FastAPI()
agent = CampaignCreationAgent()

class ChatRequest(BaseModel):
    message: str
    thread_id: str
    context: dict = {}

@app.post("/chat")
async def chat(request: ChatRequest):
    response = await agent.create_campaign_conversation(
        request.message,
        request.thread_id
    )
    return response
```

2. Update your Next.js API route to call the Python service:

```typescript
// src/app/api/agent/campaign/route.ts
export async function POST(req: NextRequest) {
  const body = await req.json()
  
  const response = await fetch(`${process.env.AGENT_SERVICE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  
  return NextResponse.json(await response.json())
}
```

## Advanced Features

### 1. Streaming Responses

```typescript
// For real-time streaming responses
import { StreamingTextResponse } from 'ai'

export async function POST(req: NextRequest) {
  const stream = await agent.stream(input)
  return new StreamingTextResponse(stream)
}
```

### 2. Human-in-the-Loop Approval

```tsx
// Component for approval workflows
export function CampaignApproval({ campaign, onApprove, onReject }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Campaign</CardTitle>
      </CardHeader>
      <CardContent>
        <pre>{JSON.stringify(campaign, null, 2)}</pre>
      </CardContent>
      <CardFooter>
        <Button onClick={onApprove}>Approve & Launch</Button>
        <Button variant="outline" onClick={onReject}>Request Changes</Button>
      </CardFooter>
    </Card>
  )
}
```

### 3. Multi-Agent Coordination

```typescript
// Example of multiple agents working together
const agents = {
  campaignCreator: createCampaignAgent(),
  optimizer: createOptimizationAgent(),
  reporter: createReportingAgent()
}

// Route to appropriate agent based on intent
const routeToAgent = (message: string) => {
  if (message.includes('create')) return agents.campaignCreator
  if (message.includes('optimize')) return agents.optimizer
  if (message.includes('report')) return agents.reporter
  return agents.campaignCreator
}
```

## Testing the Agent

### 1. Test Conversations

```typescript
// src/app/dashboard/test-agent/page.tsx
'use client'

import { AgentChat } from '@/components/agent-chat'

export default function TestAgentPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test AI Agent</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>• "Create a campaign for my e-commerce store"</li>
              <li>• "I want to target fitness enthusiasts"</li>
              <li>• "My budget is $100 per day"</li>
              <li>• "Suggest ad creatives"</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Expected Behaviors</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>✓ Asks clarifying questions</li>
              <li>✓ Provides recommendations</li>
              <li>✓ Explains reasoning</li>
              <li>✓ Offers quick actions</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <AgentChat defaultOpen={true} />
    </div>
  )
}
```

### 2. Monitor Agent Performance

```typescript
// Add analytics to track agent effectiveness
const trackAgentInteraction = async (event: string, data: any) => {
  await fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      event: `agent_${event}`,
      data,
      timestamp: new Date()
    })
  })
}
```

## Production Deployment

### 1. Using Vercel AI SDK

```bash
npm install ai @ai-sdk/anthropic
```

### 2. Deploy Python Agent (if using)

Using Modal.com:
```python
# modal_app.py
import modal

stub = modal.Stub("campaign-agent")

@stub.function()
def create_campaign(message: str):
    from campaign_creator import CampaignCreationAgent
    agent = CampaignCreationAgent()
    return agent.create_campaign_conversation(message)
```

### 3. Security Considerations

- Rate limit API calls
- Validate all agent outputs before executing
- Log all agent actions for audit
- Implement approval workflows for sensitive actions

## Next Steps

1. Start with the TypeScript implementation for quick testing
2. Add more specialized tools for your use case
3. Implement streaming for better UX
4. Add memory/context persistence with Redis
5. Deploy the Python service for advanced features
6. Monitor usage and optimize prompts based on user feedback