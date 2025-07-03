// API Route Pattern - MetaAds Standard
// This example shows the standard pattern for protected API routes in MetaAds

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { z } from "zod"

// 1. Define validation schema using Zod
const requestSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["SALES", "TRAFFIC", "AWARENESS"]),
  budget: z.number().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional()
})

// 2. Export async functions for each HTTP method
export async function GET(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Database query
    const results = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, session.user.id))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(campaigns.createdAt))

    return NextResponse.json({ 
      success: true, 
      data: results,
      pagination: { limit, offset }
    })

  } catch (error) {
    console.error('GET /api/campaigns error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Validate request body
    const body = await req.json()
    const validatedData = requestSchema.parse(body)

    // 3. Check user permissions/limits
    const userAccount = await getUserSelectedAccount(session.user.id)
    if (!userAccount) {
      return NextResponse.json(
        { error: 'No Meta ad account connected' },
        { status: 400 }
      )
    }

    // 4. Database operation with transaction if needed
    const result = await db.transaction(async (tx) => {
      const [campaign] = await tx
        .insert(campaigns)
        .values({
          userId: session.user.id,
          adAccountId: userAccount.id,
          ...validatedData,
          status: 'DRAFT',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning()

      // Log the action
      await tx.insert(activityLogs).values({
        userId: session.user.id,
        action: 'campaign_created',
        entityId: campaign.id,
        entityType: 'campaign'
      })

      return campaign
    })

    // 5. Return success response
    return NextResponse.json({ 
      success: true, 
      data: result 
    })

  } catch (error) {
    // 6. Handle different error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error instanceof MetaAPIError) {
      return NextResponse.json(
        { error: 'Meta API error', message: error.message },
        { status: 503 }
      )
    }
    
    console.error('POST /api/campaigns error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify ownership
    const [existing] = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.id, params.id),
          eq(campaigns.userId, session.user.id)
        )
      )

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Update logic here...
    
  } catch (error) {
    // Error handling...
  }
}

// Helper functions
async function getUserSelectedAccount(userId: string) {
  const [account] = await db
    .select()
    .from(metaAdAccounts)
    .where(
      and(
        eq(metaAdAccounts.userId, userId),
        eq(metaAdAccounts.isSelected, true)
      )
    )
    .limit(1)
  
  return account
}