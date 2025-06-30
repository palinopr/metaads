import { NextResponse } from "next/server"
import { db } from "@/db/drizzle"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export async function GET() {
  console.log("[TEST-ENV] Endpoint called")
  
  const results = {
    environment: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT SET",
      NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DIRECT_URL_EXISTS: !!process.env.DIRECT_URL,
      NODE_ENV: process.env.NODE_ENV,
    },
    database: {
      connection: "PENDING",
      adminUser: null as any,
      passwordTest: null as any,
    },
    timestamp: new Date().toISOString()
  }
  
  try {
    // Test database connection
    console.log("[TEST-ENV] Testing database connection...")
    const testQuery = await db.select().from(users).where(eq(users.email, "admin@metaads.com"))
    results.database.connection = "SUCCESS"
    
    if (testQuery.length > 0) {
      const admin = testQuery[0]
      results.database.adminUser = {
        found: true,
        id: admin.id,
        email: admin.email,
        hasPassword: !!admin.password,
        passwordLength: admin.password?.length || 0
      }
      
      // Test password
      if (admin.password) {
        const isValid = await bcrypt.compare("Admin123!", admin.password)
        results.database.passwordTest = {
          tested: true,
          valid: isValid
        }
      }
    } else {
      results.database.adminUser = { found: false }
    }
  } catch (error: any) {
    console.error("[TEST-ENV] Database error:", error)
    results.database.connection = "FAILED"
    results.database.error = error.message
  }
  
  console.log("[TEST-ENV] Results:", JSON.stringify(results, null, 2))
  
  return NextResponse.json(results)
}