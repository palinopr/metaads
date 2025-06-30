import { NextResponse } from 'next/server'

export async function GET() {
  // Debug Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  
  let urlValid = false
  let urlError = null
  
  if (supabaseUrl) {
    try {
      new URL(supabaseUrl)
      urlValid = true
    } catch (e) {
      urlError = e instanceof Error ? e.message : String(e)
    }
  }
  
  return NextResponse.json({
    supabaseUrl: supabaseUrl || "NOT_SET",
    urlValid,
    urlError,
    hasAnonKey,
    hasServiceKey,
    urlFormat: supabaseUrl ? {
      length: supabaseUrl.length,
      startsWithHttps: supabaseUrl.startsWith('https://'),
      endsWithSupabaseCo: supabaseUrl.endsWith('.supabase.co'),
      includesWhitespace: /\s/.test(supabaseUrl),
    } : null,
    timestamp: new Date().toISOString()
  })
}