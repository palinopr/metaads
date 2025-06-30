import { NextResponse } from "next/server"
import { db } from "@/db/drizzle"
import { sql } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const healthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      environment: {
        status: "unknown",
        details: {} as Record<string, boolean>
      },
      database: {
        status: "unknown",
        message: ""
      },
      supabase: {
        status: "unknown",
        message: ""
      },
      nextAuth: {
        status: "unknown",
        message: ""
      }
    }
  }

  // Check environment variables
  const requiredEnvVars = [
    "DATABASE_URL",
    "DIRECT_URL",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "FACEBOOK_APP_ID",
    "FACEBOOK_APP_SECRET",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
  ]

  const envStatus = requiredEnvVars.reduce((acc, varName) => {
    acc[varName] = !!process.env[varName]
    return acc
  }, {} as Record<string, boolean>)

  healthCheck.checks.environment.details = envStatus
  healthCheck.checks.environment.status = Object.values(envStatus).every(v => v) ? "healthy" : "unhealthy"

  // Check database connection
  try {
    const result = await db.execute(sql`SELECT 1`)
    healthCheck.checks.database.status = "healthy"
    healthCheck.checks.database.message = "Database connection successful"
  } catch (error) {
    healthCheck.checks.database.status = "unhealthy"
    healthCheck.checks.database.message = error instanceof Error ? error.message : "Database connection failed"
    healthCheck.status = "unhealthy"
  }

  // Check Supabase connection
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("user").select("count").limit(1)
    
    if (error && error.code !== "PGRST116") { // PGRST116 = table doesn't exist yet
      throw error
    }
    
    healthCheck.checks.supabase.status = "healthy"
    healthCheck.checks.supabase.message = "Supabase connection successful"
  } catch (error) {
    healthCheck.checks.supabase.status = "unhealthy"
    healthCheck.checks.supabase.message = error instanceof Error ? error.message : "Supabase connection failed"
    healthCheck.status = "unhealthy"
  }

  // Check NextAuth configuration
  try {
    const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET
    const hasNextAuthUrl = !!process.env.NEXTAUTH_URL
    const hasFacebookCreds = !!process.env.FACEBOOK_APP_ID && !!process.env.FACEBOOK_APP_SECRET

    if (hasNextAuthSecret && hasNextAuthUrl && hasFacebookCreds) {
      healthCheck.checks.nextAuth.status = "healthy"
      healthCheck.checks.nextAuth.message = "NextAuth configured correctly"
    } else {
      healthCheck.checks.nextAuth.status = "unhealthy"
      healthCheck.checks.nextAuth.message = "Missing NextAuth configuration"
      healthCheck.status = "unhealthy"
    }
  } catch (error) {
    healthCheck.checks.nextAuth.status = "unhealthy"
    healthCheck.checks.nextAuth.message = "NextAuth configuration check failed"
    healthCheck.status = "unhealthy"
  }

  // Set overall status
  if (healthCheck.status !== "unhealthy") {
    const allHealthy = Object.values(healthCheck.checks).every(check => check.status === "healthy")
    healthCheck.status = allHealthy ? "healthy" : "degraded"
  }

  return NextResponse.json(healthCheck, { 
    status: healthCheck.status === "healthy" ? 200 : 503 
  })
}