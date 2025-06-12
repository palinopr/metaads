import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage with your working credentials
const workingCredentials = {
  accessToken: 'EAATKZBg465ucBO7LlPXw5pZBVFKX4edsRkiVh9Lm68YUJUMkBR2UUvlbYG4rZCwkbf6mrl2BmJroBgkThXsoqhJwfe1tYkvj8t7O550TOJ56r5AnZBJGuqR0ZApBG02aUflSmg34G9rewZBlqEgBw5l8OW7vDLUUHpBYYpgRCbaZBWrTB0SlFlOZCdxZCrZAYJRUmR6CEBMqKMx3ZAfHDPeA0ec1Td6frnuQD1y',
  adAccountId: 'act_787610255314938'
}

export async function GET(request: NextRequest) {
  try {
    // Always return the working credentials
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