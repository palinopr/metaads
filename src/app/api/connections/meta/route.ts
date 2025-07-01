import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { metaConnections } from "@/db/schema"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get Meta connection for the user
    const connections = await db
      .select({
        id: metaConnections.id,
        expires_at: metaConnections.expiresAt,
        created_at: metaConnections.createdAt
      })
      .from(metaConnections)
      .where(eq(metaConnections.userId, session.user.id))
      .limit(1)
    
    const connection = connections[0] || null
    
    return NextResponse.json({ connection })
  } catch (error) {
    console.error('Error fetching Meta connection:', error)
    
    // Provide more specific error message
    let errorMessage = 'Failed to fetch connection'
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes('column') || error.message.includes('relation')) {
        console.error('Database schema error in meta_connections:', error.message)
        errorMessage = 'Database schema error: ' + error.message
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
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
    await db
      .delete(metaConnections)
      .where(eq(metaConnections.userId, session.user.id))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting Meta connection:', error)
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    )
  }
}