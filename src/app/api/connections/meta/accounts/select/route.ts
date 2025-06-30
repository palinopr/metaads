import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { sql } from "drizzle-orm"

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
    
    // First, unselect all accounts for this user
    await db.execute(sql`
      UPDATE meta_ad_accounts
      SET is_selected = false
      WHERE user_id = ${session.user.id}
    `)
    
    // Then select the chosen account
    const result = await db.execute(sql`
      UPDATE meta_ad_accounts
      SET 
        is_selected = true,
        updated_at = ${new Date()}
      WHERE 
        user_id = ${session.user.id}
        AND account_id = ${account_id}
      RETURNING account_id, name
    `)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true,
      account: result.rows[0]
    })
  } catch (error) {
    console.error('Error selecting Meta ad account:', error)
    return NextResponse.json(
      { error: 'Failed to select ad account' },
      { status: 500 }
    )
  }
}