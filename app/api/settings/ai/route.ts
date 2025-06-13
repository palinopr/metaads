import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { anthropicApiKey, customInstructions, enableAdvancedAnalysis } = await request.json()

    // In a production app, you might want to store these settings in a database
    // For now, we'll just validate the data and return success
    // The client will handle localStorage storage

    if (!anthropicApiKey) {
      return NextResponse.json({
        error: 'API key is required',
        success: false
      }, { status: 400 })
    }

    // Here you could:
    // 1. Store settings in database with user ID
    // 2. Encrypt the API key before storing
    // 3. Set up user preferences

    return NextResponse.json({
      success: true,
      message: 'AI settings saved successfully'
    })

  } catch (error: any) {
    console.error('Save AI settings error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to save AI settings',
      success: false
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // In production, you would fetch user settings from database
    // For now, return empty settings (client will load from localStorage)
    
    return NextResponse.json({
      settings: {
        hasApiKey: false, // We don't want to return the actual key
        enableAdvancedAnalysis: true,
        customInstructions: ''
      },
      success: true
    })

  } catch (error: any) {
    console.error('Get AI settings error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to get AI settings',
      success: false
    }, { status: 500 })
  }
}