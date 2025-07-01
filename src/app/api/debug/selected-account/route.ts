import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { eq, and, sql } from "drizzle-orm"
import { metaAdAccounts, metaConnections } from "@/db/schema"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get all accounts for this user
    const accounts = await db
      .select({
        id: metaAdAccounts.id,
        accountId: metaAdAccounts.accountId,
        name: metaAdAccounts.name,
        isSelected: metaAdAccounts.isSelected,
        userId: metaAdAccounts.userId,
        connectionId: metaAdAccounts.connectionId,
        createdAt: metaAdAccounts.createdAt,
        updatedAt: metaAdAccounts.updatedAt
      })
      .from(metaAdAccounts)
      .where(eq(metaAdAccounts.userId, session.user.id))
    
    // Get the selected account
    const selectedAccount = accounts.find(acc => acc.isSelected)
    
    // Get connection info
    let connectionInfo = null
    if (selectedAccount) {
      const connections = await db
        .select({
          id: metaConnections.id,
          hasAccessToken: sql`CASE WHEN access_token IS NOT NULL THEN true ELSE false END`,
          expiresAt: metaConnections.expiresAt
        })
        .from(metaConnections)
        .where(eq(metaConnections.id, selectedAccount.connectionId))
        .limit(1)
      
      connectionInfo = connections[0]
    }
    
    return NextResponse.json({
      userId: session.user.id,
      totalAccounts: accounts.length,
      accounts: accounts.map(acc => ({
        id: acc.id,
        accountId: acc.accountId,
        name: acc.name,
        isSelected: acc.isSelected,
        createdAt: acc.createdAt,
        updatedAt: acc.updatedAt
      })),
      selectedAccount: selectedAccount ? {
        id: selectedAccount.id,
        accountId: selectedAccount.accountId,
        name: selectedAccount.name,
        connectionId: selectedAccount.connectionId
      } : null,
      connectionInfo
    })
  } catch (error) {
    console.error('Debug selected account error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get debug info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}