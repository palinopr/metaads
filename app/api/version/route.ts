import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    version: '0.1.1',
    timestamp: '2025-06-12T14:50:00Z',
    message: 'Dashboard v4 with validation bypass'
  })
}