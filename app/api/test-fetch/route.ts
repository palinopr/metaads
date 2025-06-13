import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[]
  }
  
  // Test 1: Basic HTTPS fetch
  try {
    const response = await fetch('https://api.github.com')
    results.tests.push({
      test: 'GitHub API',
      success: true,
      status: response.status
    })
  } catch (error: any) {
    results.tests.push({
      test: 'GitHub API',
      success: false,
      error: error.message
    })
  }
  
  // Test 2: Facebook Graph API (no auth)
  try {
    const response = await fetch('https://graph.facebook.com/v19.0/')
    const data = await response.text()
    results.tests.push({
      test: 'Facebook Graph API',
      success: true,
      status: response.status,
      response: data.substring(0, 100)
    })
  } catch (error: any) {
    results.tests.push({
      test: 'Facebook Graph API',
      success: false,
      error: error.message
    })
  }
  
  // Test 3: DNS resolution
  try {
    const dns = await import('dns')
    const { promisify } = await import('util')
    const resolve4 = promisify(dns.resolve4)
    const addresses = await resolve4('graph.facebook.com')
    results.tests.push({
      test: 'DNS Resolution',
      success: true,
      addresses: addresses
    })
  } catch (error: any) {
    results.tests.push({
      test: 'DNS Resolution',
      success: false,
      error: error.message
    })
  }
  
  return NextResponse.json(results)
}