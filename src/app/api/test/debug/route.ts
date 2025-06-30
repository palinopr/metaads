import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { users, sessions, accounts } from "@/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

// Enable CORS for external testing
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions)
    
    // Get environment variables
    const envVars = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "Set (hidden)" : "Not set",
      DATABASE_URL: process.env.DATABASE_URL ? "Set (hidden)" : "Not set",
      NEXT_PUBLIC_ADMIN_EMAILS: process.env.NEXT_PUBLIC_ADMIN_EMAILS,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    }
    
    // Get admin emails configuration
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || ["jaime@outletmedia.com"]
    const isAdmin = session?.user?.email && adminEmails.includes(session.user.email)
    
    // Get all users from database
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      hasPassword: users.password,
    }).from(users)
    
    // Get all sessions
    const allSessions = await db.select().from(sessions)
    
    // Get all accounts
    const allAccounts = await db.select({
      userId: accounts.userId,
      provider: accounts.provider,
      type: accounts.type,
    }).from(accounts)
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      session: {
        exists: !!session,
        user: session?.user || null,
        expires: session?.expires || null,
      },
      adminCheck: {
        currentUserEmail: session?.user?.email || null,
        adminEmails: adminEmails,
        isAdmin: isAdmin,
        emailComparison: session?.user?.email ? {
          userEmail: session.user.email,
          adminEmail: adminEmails[0],
          exactMatch: session.user.email === adminEmails[0],
          lowercaseMatch: session.user.email.toLowerCase() === adminEmails[0].toLowerCase(),
        } : null,
      },
      environment: envVars,
      database: {
        users: allUsers.map(u => ({
          ...u,
          hasPassword: !!u.hasPassword,
        })),
        sessionsCount: allSessions.length,
        accountsCount: allAccounts.length,
        accounts: allAccounts,
      },
      headers: {
        host: request.headers.get('host'),
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        origin: request.headers.get('origin'),
      },
      cookies: {
        nextAuthSessionToken: request.cookies.get('next-auth.session-token')?.value ? 'Present' : 'Not present',
        nextAuthCsrfToken: request.cookies.get('next-auth.csrf-token')?.value ? 'Present' : 'Not present',
      },
    }
    
    return NextResponse.json(debugInfo, { 
      headers: corsHeaders,
      status: 200 
    })
  } catch (error) {
    console.error("[DEBUG API] Error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { 
      headers: corsHeaders,
      status: 500 
    })
  }
}

// Test endpoint with authentication bypass
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, password, forceAdmin } = body
    
    if (action === "create-test-session") {
      // Create a test session without authentication
      // WARNING: This should only be used in development/testing
      if (process.env.NODE_ENV === "production" && !body.confirmProduction) {
        return NextResponse.json({ 
          error: "Test sessions cannot be created in production without confirmation" 
        }, { 
          headers: corsHeaders,
          status: 403 
        })
      }
      
      // Find or create user
      let user = await db.select().from(users).where(eq(users.email, email)).then(r => r[0])
      
      if (!user && password) {
        // Create new user
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = await db.insert(users).values({
          email: email,
          password: hashedPassword,
          name: email.split('@')[0],
          emailVerified: new Date(),
        }).returning()
        user = newUser[0]
      }
      
      if (!user) {
        return NextResponse.json({ 
          error: "User not found and no password provided to create one" 
        }, { 
          headers: corsHeaders,
          status: 404 
        })
      }
      
      // Create a mock session token
      const sessionToken = `test-session-${Date.now()}-${Math.random().toString(36).substring(7)}`
      
      // Insert session into database
      await db.insert(sessions).values({
        sessionToken: sessionToken,
        userId: user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      })
      
      return NextResponse.json({ 
        success: true,
        sessionToken: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        instructions: "Use this session token in the 'next-auth.session-token' cookie",
      }, { 
        headers: corsHeaders,
        status: 200 
      })
    }
    
    if (action === "update-admin-emails") {
      // This would need to update the environment variable
      // In a real scenario, you'd update a configuration file or database setting
      return NextResponse.json({ 
        message: "To update admin emails, set NEXT_PUBLIC_ADMIN_EMAILS environment variable",
        currentValue: process.env.NEXT_PUBLIC_ADMIN_EMAILS,
        suggestedValue: email,
      }, { 
        headers: corsHeaders,
        status: 200 
      })
    }
    
    if (action === "test-admin-check") {
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || ["jaime@outletmedia.com"]
      const testEmail = email || "jaime@outletmedia.net"
      
      return NextResponse.json({
        testEmail: testEmail,
        adminEmails: adminEmails,
        isAdmin: adminEmails.includes(testEmail),
        checks: {
          exactMatch: adminEmails.some(ae => ae === testEmail),
          caseInsensitiveMatch: adminEmails.some(ae => ae.toLowerCase() === testEmail.toLowerCase()),
          trimmedMatch: adminEmails.some(ae => ae.trim() === testEmail.trim()),
        },
        suggestion: !adminEmails.includes(testEmail) ? 
          `Add "${testEmail}" to NEXT_PUBLIC_ADMIN_EMAILS environment variable` : 
          "User is already an admin",
      }, { 
        headers: corsHeaders,
        status: 200 
      })
    }
    
    return NextResponse.json({ 
      error: "Invalid action",
      availableActions: ["create-test-session", "update-admin-emails", "test-admin-check"],
    }, { 
      headers: corsHeaders,
      status: 400 
    })
    
  } catch (error) {
    console.error("[DEBUG API POST] Error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { 
      headers: corsHeaders,
      status: 500 
    })
  }
}