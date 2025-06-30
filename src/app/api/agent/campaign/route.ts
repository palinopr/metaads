import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { streamText, generateText } from 'ai'

// Choose which AI provider to use
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai' // 'anthropic' or 'openai'

interface AgentRequest {
  message: string
  threadId?: string
  context?: {
    accountId?: string
    previousCampaigns?: any[]
    chatHistory?: Array<{ role: string; content: string }>
  }
}

const SYSTEM_PROMPT = `You are an expert Meta Ads campaign creation assistant. Your role is to help users create effective advertising campaigns.

Your capabilities:
- Analyze business objectives and recommend optimal campaign settings
- Suggest precise audience targeting based on business type and goals  
- Calculate appropriate budgets with expected results
- Generate creative ad copy and content ideas
- Guide users step-by-step through the campaign creation process

Guidelines:
- Be conversational and friendly, but professional
- Ask clarifying questions to understand their needs better
- Provide specific, actionable recommendations with reasoning
- Format responses with clear structure using bullet points and sections
- Include emojis sparingly for friendliness (max 2-3 per response)
- Keep responses concise but informative

When suggesting campaign settings, always include:
- Campaign objective (with Meta's exact objective names)
- Target audience details (demographics, interests, behaviors)
- Budget recommendations (daily and total)
- Expected results (impressions, clicks, conversions)
- Creative suggestions

Current Meta campaign objectives:
- OUTCOME_AWARENESS (Brand awareness, Reach)
- OUTCOME_TRAFFIC (Traffic, Landing page views) 
- OUTCOME_ENGAGEMENT (Engagement, Messages, Video views)
- OUTCOME_LEADS (Lead generation, Calls)
- OUTCOME_APP_PROMOTION (App installs, App events)
- OUTCOME_SALES (Conversions, Catalog sales)`

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body: AgentRequest = await req.json()
    const { message, threadId = `thread_${Date.now()}`, context } = body

    // Build conversation history
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...(context?.chatHistory || []).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ]

    // Select AI model based on provider
    const model = AI_PROVIDER === 'openai' 
      ? openai('gpt-4-turbo-preview')
      : anthropic('claude-3-sonnet-20240229')

    // Check if client accepts streaming
    const acceptsStream = req.headers.get('accept')?.includes('text/event-stream')

    if (acceptsStream) {
      // Stream the response
      const result = await streamText({
        model,
        messages,
        temperature: 0.7,
        maxTokens: 1000,
      })

      return result.toTextStreamResponse()
    } else {
      // Non-streaming response
      const result = await generateText({
        model,
        messages,
        temperature: 0.7,
        maxTokens: 1000,
      })

      // Extract any structured data from the response
      const response = result.text
      const suggestedActions = extractSuggestedActions(response)

      return Response.json({
        success: true,
        message: response,
        threadId,
        suggestedActions,
        requiresApproval: false,
        usage: result.usage
      })
    }

  } catch (error) {
    console.error('Agent error:', error)
    
    // Provide helpful error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isApiKeyError = errorMessage.includes('API key') || errorMessage.includes('authentication')
    
    if (isApiKeyError) {
      return Response.json({
        success: false,
        error: 'AI service not configured. Please add your API key.',
        message: `To use the AI assistant, please add your ${AI_PROVIDER === 'openai' ? 'OpenAI' : 'Anthropic'} API key to your environment variables.`,
        helpLink: AI_PROVIDER === 'openai' 
          ? 'https://platform.openai.com/api-keys'
          : 'https://console.anthropic.com/settings/keys'
      }, { status: 500 })
    }
    
    return Response.json({
      success: false,
      error: 'Failed to process your request',
      message: 'I encountered an error. Please try again or contact support if the issue persists.'
    }, { status: 500 })
  }
}

function extractSuggestedActions(response: string): any[] {
  const actions = []
  
  // Detect if response mentions specific campaign objectives
  if (response.toLowerCase().includes('objective')) {
    if (response.includes('OUTCOME_SALES') || response.includes('conversions')) {
      actions.push({
        type: 'quick_reply',
        label: 'Yes, I want to drive sales',
        action: 'confirm_sales_objective'
      })
    }
    if (response.includes('OUTCOME_TRAFFIC') || response.includes('traffic')) {
      actions.push({
        type: 'quick_reply',
        label: 'I want more website traffic',
        action: 'confirm_traffic_objective'
      })
    }
  }
  
  // Detect if asking about budget
  if (response.toLowerCase().includes('budget')) {
    actions.push(
      {
        type: 'quick_reply',
        label: '$50/day',
        action: 'set_budget_50'
      },
      {
        type: 'quick_reply',
        label: '$100/day',
        action: 'set_budget_100'
      },
      {
        type: 'quick_reply',
        label: 'Custom budget',
        action: 'set_budget_custom'
      }
    )
  }
  
  // Detect if discussing audience
  if (response.toLowerCase().includes('audience') || response.toLowerCase().includes('target')) {
    actions.push({
      type: 'quick_reply',
      label: 'Help me define my audience',
      action: 'define_audience'
    })
  }
  
  return actions
}