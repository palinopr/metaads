import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage - will need to be updated with new token
let workingCredentials = {
  accessToken: '',
  adAccountId: 'act_787610255314938'
}

export async function GET(request: NextRequest) {
  try {
    // Check if we have valid credentials
    if (!workingCredentials.accessToken) {
      return NextResponse.json({
        success: false,
        error: 'No credentials stored on server',
        needsSetup: true
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      credentials: {
        accessToken: workingCredentials.accessToken,
        adAccountId: workingCredentials.adAccountId,
        source: 'server'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to load credentials' },
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
    
    // Update the working credentials
    workingCredentials.accessToken = accessToken
    workingCredentials.adAccountId = adAccountId
    
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
  // Clear credentials
  workingCredentials.accessToken = ''
  workingCredentials.adAccountId = ''
  
  return NextResponse.json({
    success: true,
    message: 'Credentials cleared'
  })
}