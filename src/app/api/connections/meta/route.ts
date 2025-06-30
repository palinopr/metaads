import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { sql } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get Meta connection for the user
    const result = await db.execute(sql`
      SELECT 
        id,
        meta_user_id,
        name,
        email,
        expires_at,
        created_at
      FROM meta_connections
      WHERE user_id = ${session.user.id}
      LIMIT 1
    `)
    
    const connection = result.rows[0] || null
    
    return NextResponse.json({ connection })
  } catch (error) {
    console.error('Error fetching Meta connection:', error)
    return NextResponse.json(
      { error: 'Failed to fetch connection' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Delete Meta connection and related data
    await db.execute(sql`
      DELETE FROM meta_connections
      WHERE user_id = ${session.user.id}
    `)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting Meta connection:', error)
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    )
  }
}