import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Credentials test route working',
    timestamp: new Date().toISOString(),
    method: 'GET'
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Credentials test route working',
    timestamp: new Date().toISOString(),
    method: 'POST'
  })
}