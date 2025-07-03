import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { eq, and } from "drizzle-orm"
import { metaAdAccounts } from "@/db/schema"
import { isInternalUUID } from "@/lib/meta/account-utils"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { account_id } = await request.json()
    
    if (!account_id) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 })
    }
    
    // Validate that the account_id is an internal UUID
    if (!isInternalUUID(account_id)) {
      return NextResponse.json({ 
        error: "Invalid account ID format. Please use the internal account ID.",
        details: "Expected UUID format, received: " + account_id
      }, { status: 400 })
    }
    
    // First, unselect all accounts for this user
    await db
      .update(metaAdAccounts)
      .set({ isSelected: false })
      .where(eq(metaAdAccounts.userId, session.user.id))
    
    // Then select the chosen account using internal UUID only
    const result = await db
      .update(metaAdAccounts)
      .set({ 
        isSelected: true,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(metaAdAccounts.userId, session.user.id),
          eq(metaAdAccounts.id, account_id)
        )
      )
      .returning({
        id: metaAdAccounts.id,
        accountId: metaAdAccounts.accountId,
        name: metaAdAccounts.name
      })
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true,
      account: result[0]
    })
  } catch (error) {
    console.error('Error selecting Meta ad account:', error)
    
    // Provide more detailed error message
    let errorMessage = 'Failed to select ad account'
    if (error instanceof Error) {
      errorMessage = error.message
      // Log the full error for debugging
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack
      })
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}