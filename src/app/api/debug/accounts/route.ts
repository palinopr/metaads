import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { metaAdAccounts, metaConnections, campaigns } from "@/db/schema"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get all ad accounts for the user
    const accounts = await db
      .select({
        id: metaAdAccounts.id,
        accountId: metaAdAccounts.accountId,
        name: metaAdAccounts.name,
        isSelected: metaAdAccounts.isSelected,
        connectionId: metaAdAccounts.connectionId,
        currency: metaAdAccounts.currency,
        timezone: metaAdAccounts.timezone,
        createdAt: metaAdAccounts.createdAt,
        updatedAt: metaAdAccounts.updatedAt
      })
      .from(metaAdAccounts)
      .where(eq(metaAdAccounts.userId, session.user.id))
    
    // Get Meta connections
    const connections = await db
      .select({
        id: metaConnections.id,
        hasToken: sql`CASE WHEN access_token IS NOT NULL THEN true ELSE false END`,
        expiresAt: metaConnections.expiresAt,
        createdAt: metaConnections.createdAt,
        updatedAt: metaConnections.updatedAt
      })
      .from(metaConnections)
      .where(eq(metaConnections.userId, session.user.id))
    
    // Get selected account details
    const selectedAccount = accounts.find(acc => acc.isSelected)
    
    // If there's a selected account, get campaign count
    let campaignCount = 0
    if (selectedAccount) {
      const campaignResult = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(campaigns)
        .where(eq(campaigns.adAccountId, selectedAccount.id))
      
      campaignCount = campaignResult[0]?.count || 0
    }
    
    return NextResponse.json({
      debug: {
        userId: session.user.id,
        accountsCount: accounts.length,
        accounts: accounts.map(acc => ({
          id: acc.id,
          accountId: acc.accountId,
          name: acc.name,
          isSelected: acc.isSelected,
          connectionId: acc.connectionId,
          isValidMetaId: acc.accountId && /^\d+$/.test(acc.accountId),
          createdAt: acc.createdAt,
          updatedAt: acc.updatedAt
        })),
        connectionsCount: connections.length,
        connections: connections.map(conn => ({
          id: conn.id,
          hasToken: conn.hasToken,
          expiresAt: conn.expiresAt,
          createdAt: conn.createdAt,
          updatedAt: conn.updatedAt
        })),
        selectedAccount: selectedAccount ? {
          id: selectedAccount.id,
          accountId: selectedAccount.accountId,
          name: selectedAccount.name,
          connectionId: selectedAccount.connectionId,
          campaignCount: campaignCount
        } : null,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Debug endpoint error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}