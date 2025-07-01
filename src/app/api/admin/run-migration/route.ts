import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { sql } from "drizzle-orm"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Add refresh_token column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE "meta_connections" 
      ADD COLUMN IF NOT EXISTS "refresh_token" text
    `)
    
    return NextResponse.json({ 
      success: true,
      message: "Migration completed successfully"
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}