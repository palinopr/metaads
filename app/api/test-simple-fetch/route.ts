import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('fb_access_token')?.value
    const adAccountId = cookieStore.get('fb_selected_account')?.value
    
    if (!accessToken || !adAccountId) {
      return NextResponse.json({
        error: 'Missing credentials'
      }, { status: 401 })
    }
    
    // Try using Next.js server-side fetch
    const url = `https://graph.facebook.com/v19.0/${adAccountId}/campaigns?fields=id,name,status&limit=5&access_token=${accessToken}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add cache and next options for Railway
      cache: 'no-store',
      next: { revalidate: 0 }
    } as any)
    
    const data = await response.json()
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      campaignCount: data.data?.length || 0,
      firstCampaign: data.data?.[0] || null,
      error: data.error || null
    })
    
  } catch (error: any) {
    // Try alternative approach
    try {
      const https = await import('https')
      const { promisify } = await import('util')
      
      return new Promise((resolve) => {
        const cookieStore = cookies()
        const accessToken = cookieStore.get('fb_access_token')?.value
        const adAccountId = cookieStore.get('fb_selected_account')?.value
        
        const options = {
          hostname: 'graph.facebook.com',
          path: `/v19.0/${adAccountId}/campaigns?fields=id,name,status&limit=5&access_token=${accessToken}`,
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
        
        const req = https.request(options, (res) => {
          let data = ''
          res.on('data', (chunk) => { data += chunk })
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data)
              resolve(NextResponse.json({
                success: res.statusCode === 200,
                status: res.statusCode,
                campaignCount: parsed.data?.length || 0,
                firstCampaign: parsed.data?.[0] || null,
                method: 'https-module'
              }))
            } catch (e) {
              resolve(NextResponse.json({
                error: 'Parse error',
                method: 'https-module',
                rawData: data.substring(0, 100)
              }, { status: 500 }))
            }
          })
        })
        
        req.on('error', (error) => {
          resolve(NextResponse.json({
            error: error.message,
            method: 'https-module-failed'
          }, { status: 500 }))
        })
        
        req.end()
      })
    } catch (fallbackError: any) {
      return NextResponse.json({
        error: 'All fetch methods failed',
        originalError: error.message,
        fallbackError: fallbackError.message
      }, { status: 500 })
    }
  }
}