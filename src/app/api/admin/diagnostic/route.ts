import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Check if user is admin
async function isAdmin(email: string): Promise<boolean> {
  return email === "jaime@outletmedia.net"
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Public endpoint for diagnostics
    const diagnostics = {
      timestamp: new Date().toISOString(),
      session: {
        authenticated: !!session,
        email: session?.user?.email || null,
        isAdmin: session?.user?.email === "jaime@outletmedia.net",
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        adminEmails: process.env.ADMIN_EMAILS,
        nextPublicAdminEmails: process.env.NEXT_PUBLIC_ADMIN_EMAILS,
      },
      deployment: {
        vercelEnv: process.env.VERCEL_ENV,
        vercelUrl: process.env.VERCEL_URL,
        gitCommit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
      },
      paths: {
        currentPath: request.nextUrl.pathname,
        origin: request.nextUrl.origin,
      },
    }
    
    return NextResponse.json(diagnostics, {
      headers: {
        'Cache-Control': 'no-store',
      }
    })
  } catch (error) {
    console.error("Diagnostic error:", error)
    return NextResponse.json(
      { error: "Diagnostic failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// POST endpoint to check specific page content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || !await isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    
    const body = await request.json()
    const { action, path } = body
    
    if (action === "check-page") {
      // Return information about what should be on the page
      if (path === "/dashboard/admin/agent-settings") {
        return NextResponse.json({
          page: "agent-settings",
          expectedTabs: ["general", "model", "tools", "api-keys"],
          tabCount: 4,
          apiKeysTabContent: {
            fields: ["OpenAI API Key", "Anthropic API Key"],
            currentStatus: {
              openai: process.env.OPENAI_API_KEY ? `Configured (${process.env.OPENAI_API_KEY.slice(0, 7)}...)` : "Not configured",
              anthropic: process.env.ANTHROPIC_API_KEY ? `Configured (${process.env.ANTHROPIC_API_KEY.slice(0, 7)}...)` : "Not configured",
            }
          },
          lastDeployment: {
            commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
            message: process.env.VERCEL_GIT_COMMIT_MESSAGE,
          }
        })
      }
    }
    
    return NextResponse.json({ 
      error: "Unknown action",
      validActions: ["check-page"]
    }, { status: 400 })
    
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}