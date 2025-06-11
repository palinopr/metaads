import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { accessToken, adAccountId } = await request.json()

    if (!accessToken || !adAccountId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required credentials' 
        },
        { status: 400 }
      )
    }

    // Basic format validation
    const token = accessToken.trim()
    const accountId = adAccountId.trim()

    if (token.length < 50) {
      return NextResponse.json({
        success: false,
        error: 'Access token appears to be too short (Meta tokens are typically 100+ characters)'
      })
    }

    if (!accountId.startsWith('act_')) {
      return NextResponse.json({
        success: false,
        error: 'Ad account ID must start with "act_" followed by numbers'
      })
    }

    const numericPart = accountId.substring(4)
    if (!/^\d+$/.test(numericPart)) {
      return NextResponse.json({
        success: false,
        error: 'Ad account ID must be in format "act_" followed by numbers only'
      })
    }

    // Test the Meta API connection with timeout
    const testUrl = `https://graph.facebook.com/v18.0/${accountId}?fields=name,account_id,currency,timezone_name&access_token=${token}`
    
    try {
      // Add timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Meta Ads Dashboard/1.0'
        }
      })

      clearTimeout(timeoutId)
      const data = await response.json()

      if (response.ok) {
        return NextResponse.json({
          success: true,
          accountInfo: {
            name: data.name || 'Unknown Account',
            id: data.account_id || accountId,
            currency: data.currency || 'Unknown',
            timezone: data.timezone_name || 'Unknown'
          },
          message: 'Successfully connected to Meta API'
        })
      } else {
        // Handle Meta API errors with detailed mapping
        let errorMessage = 'Failed to connect to Meta API'
        let helpText = ''
        
        if (data.error) {
          const errorCode = data.error.code
          const errorMessage_raw = data.error.message || ''
          
          switch (errorCode) {
            case 190:
              errorMessage = 'Invalid OAuth access token'
              helpText = 'Your token is malformed or invalid. Generate a new token from Meta Business Manager.'
              break
            case 100:
              errorMessage = 'Invalid ad account ID'
              helpText = 'Make sure your account ID starts with "act_" followed by numbers only.'
              break
            case 200:
              errorMessage = 'Insufficient permissions'
              helpText = 'Your token lacks required permissions. Ensure it has ads_management and ads_read permissions.'
              break
            case 210:
              errorMessage = 'User not authorized'
              helpText = 'You don\'t have access to this ad account. Check your Business Manager permissions.'
              break
            case 102:
              errorMessage = 'Session expired'
              helpText = 'Your access token has expired. Please generate a new one (tokens expire after 60 days).'
              break
            default:
              if (errorMessage_raw.toLowerCase().includes('expired')) {
                errorMessage = 'Access token expired'
                helpText = 'Generate a new token from Meta Business Manager (tokens expire after 60 days).'
              } else if (errorMessage_raw.toLowerCase().includes('permission')) {
                errorMessage = 'Permission denied'
                helpText = 'Your token lacks required permissions. Ensure it has ads_management and ads_read permissions.'
              } else if (errorMessage_raw.toLowerCase().includes('oauth')) {
                errorMessage = 'OAuth token error'
                helpText = 'Token format is invalid. Generate a new token from Meta Business Manager.'
              } else {
                errorMessage = errorMessage_raw || 'Unknown API error'
                helpText = 'Check your credentials and try again.'
              }
          }
        }

        return NextResponse.json({
          success: false,
          error: errorMessage,
          helpText: helpText,
          details: {
            code: data.error?.code,
            message: data.error?.message,
            type: data.error?.type
          }
        })
      }
    } catch (fetchError: any) {
      console.error('Meta API fetch error:', fetchError)
      
      let errorMessage = 'Network error connecting to Meta API'
      let helpText = 'Please check your internet connection and try again.'
      
      if (fetchError.name === 'AbortError') {
        errorMessage = 'Request timeout'
        helpText = 'The request took too long. This may indicate network issues or server problems.'
      } else if (fetchError.message?.includes('fetch')) {
        errorMessage = 'Network connection failed'
        helpText = 'Unable to reach Meta API. Check your internet connection.'
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        helpText: helpText
      })
    }
  } catch (error) {
    console.error('Test Meta API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}