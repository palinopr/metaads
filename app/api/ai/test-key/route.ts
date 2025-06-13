import { NextResponse } from "next/server"
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({
        error: 'API key is required',
        success: false
      }, { status: 400 })
    }

    // Test the API key with a simple request
    const anthropic = new Anthropic({
      apiKey: apiKey,
    })

    // Make a minimal test request
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 10,
      messages: [{
        role: "user",
        content: "Hello"
      }]
    })

    if (response.content && response.content.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'API key is valid and working',
        model: 'claude-3-opus-20240229'
      })
    } else {
      return NextResponse.json({
        error: 'Invalid response from Anthropic API',
        success: false
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('API key test error:', error)
    
    if (error.message?.includes('Invalid API Key')) {
      return NextResponse.json({
        error: 'Invalid API key. Please check your Anthropic API key.',
        success: false
      }, { status: 401 })
    }

    if (error.message?.includes('insufficient_quota')) {
      return NextResponse.json({
        error: 'API key is valid but has insufficient quota/credits.',
        success: false
      }, { status: 402 })
    }

    return NextResponse.json({
      error: error.message || 'Failed to validate API key',
      success: false
    }, { status: 500 })
  }
}