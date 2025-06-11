import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage
const credentialStore = new Map<string, any>()

export async function GET(request: NextRequest) {
  try {
    // Check environment variables first
    const envToken = process.env.META_ACCESS_TOKEN
    const envAccountId = process.env.META_AD_ACCOUNT_ID
    
    if (envToken && envAccountId) {
      return NextResponse.json({
        success: true,
        credentials: {
          accessToken: envToken,
          adAccountId: envAccountId,
          source: 'environment'
        }
      })
    }
    
    // Return empty credentials
    return NextResponse.json({
      success: false,
      message: 'No credentials found'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load credentials', details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken, adAccountId } = body
    
    if (!accessToken || !adAccountId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Store in memory (will be lost on restart)
    credentialStore.set('default', {
      accessToken,
      adAccountId,
      createdAt: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: true,
      message: 'Credentials saved successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save credentials', details: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  credentialStore.clear()
  return NextResponse.json({
    success: true,
    message: 'Credentials cleared'
  })
}