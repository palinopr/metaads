import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

// Detailed logging helper
function log(stage: string, data: any) {
  console.log(`[ADMIN DEBUG - ${new Date().toISOString()}] ${stage}:`, JSON.stringify(data, null, 2))
}

export async function GET(request: NextRequest) {
  log("Request received", {
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
  })
  
  try {
    const session = await getServerSession(authOptions)
    log("Session retrieved", session)
    
    if (!session?.user?.email) {
      log("No session or email", { session })
      return NextResponse.json({ 
        error: "Not authenticated",
        debug: {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasEmail: !!session?.user?.email,
        }
      }, { status: 401 })
    }
    
    // Get current admin configuration
    const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS
    const adminEmails = adminEmailsEnv?.split(",").map(e => e.trim()) || ["jaime@outletmedia.com"]
    const currentEmail = session.user.email
    
    log("Admin check details", {
      currentEmail,
      adminEmailsEnv,
      adminEmails,
      isInList: adminEmails.includes(currentEmail),
    })
    
    // Check various email formats
    const emailChecks = {
      exact: adminEmails.includes(currentEmail),
      lowercase: adminEmails.some(ae => ae.toLowerCase() === currentEmail.toLowerCase()),
      trimmed: adminEmails.some(ae => ae.trim() === currentEmail.trim()),
      withoutSpaces: adminEmails.some(ae => ae.replace(/\s/g, '') === currentEmail.replace(/\s/g, '')),
    }
    
    log("Email comparison results", emailChecks)
    
    // Get user from database
    const dbUser = await db.select().from(users).where(eq(users.email, currentEmail)).then(r => r[0])
    log("Database user", dbUser ? { id: dbUser.id, email: dbUser.email } : "Not found")
    
    const response = {
      currentUser: {
        email: currentEmail,
        sessionUser: session.user,
        dbUser: dbUser ? { id: dbUser.id, email: dbUser.email, name: dbUser.name } : null,
      },
      adminConfig: {
        envVar: adminEmailsEnv,
        parsedEmails: adminEmails,
        isAdmin: emailChecks.exact,
      },
      emailChecks,
      debug: {
        emailLength: currentEmail.length,
        adminEmailLengths: adminEmails.map(e => ({ email: e, length: e.length })),
        charCodes: {
          current: currentEmail.split('').map(c => c.charCodeAt(0)),
          admin: adminEmails[0]?.split('').map(c => c.charCodeAt(0)),
        },
      },
      suggestions: [],
    }
    
    // Add suggestions if not admin
    if (!emailChecks.exact) {
      if (currentEmail === "jaime@outletmedia.net" && adminEmails.includes("jaime@outletmedia.com")) {
        response.suggestions.push("Your email ends with .net but the admin email ends with .com")
      }
      response.suggestions.push(`Update NEXT_PUBLIC_ADMIN_EMAILS to include: ${currentEmail}`)
    }
    
    log("Final response", response)
    
    return NextResponse.json(response)
  } catch (error) {
    log("Error occurred", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}

// Override admin status temporarily (for testing only)
export async function POST(request: NextRequest) {
  log("Override request received", {
    url: request.url,
  })
  
  try {
    const body = await request.json()
    const { action, email, duration = 3600000 } = body // Default 1 hour
    
    log("Override request body", body)
    
    if (action === "grant-temporary-admin") {
      // In a real implementation, you would store this in a temporary cache or database
      // For now, we'll return instructions on how to update the environment variable
      
      const currentAdmins = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || []
      const newAdminList = [...new Set([...currentAdmins, email])].join(",")
      
      const response = {
        success: true,
        message: "To grant admin access, update the environment variable",
        current: process.env.NEXT_PUBLIC_ADMIN_EMAILS,
        suggested: newAdminList,
        instructions: [
          "1. Update NEXT_PUBLIC_ADMIN_EMAILS in your .env file",
          `2. Set it to: ${newAdminList}`,
          "3. Restart your development server",
          "For production, update the environment variable in your hosting platform",
        ],
        temporaryWorkaround: {
          description: "For immediate testing, you can modify the admin check logic",
          locations: [
            "/src/app/dashboard/debug-admin/page.tsx",
            "/src/app/dashboard/admin/layout.tsx",
          ],
          suggestion: `Change the admin check to include "${email}" directly in the code`,
        },
      }
      
      log("Override response", response)
      
      return NextResponse.json(response)
    }
    
    return NextResponse.json({ 
      error: "Invalid action",
      validActions: ["grant-temporary-admin"],
    }, { status: 400 })
    
  } catch (error) {
    log("Override error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}