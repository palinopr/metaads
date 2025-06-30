import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `Missing Supabase environment variables. URL: ${supabaseUrl ? 'Set' : 'Not set'}, Anon Key: ${supabaseAnonKey ? 'Set' : 'Not set'}`
    )
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch (error) {
    throw new Error(`Invalid Supabase URL: ${supabaseUrl}`)
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}