import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    AI_PROVIDER: process.env.AI_PROVIDER || 'openai',
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
}