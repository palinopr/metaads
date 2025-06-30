import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Check if user is admin
async function isAdmin(email: string): Promise<boolean> {
  return email === "jaime@outletmedia.net"
}

// This endpoint helps manage Vercel environment variables
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    if (!await isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }
    
    const body = await request.json()
    const { provider, apiKey } = body
    
    const envVarName = provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY"
    
    // Store in process.env for immediate use (only affects current deployment)
    process.env[envVarName] = apiKey
    
    // Return instructions for permanent storage
    return NextResponse.json({
      success: true,
      message: "API key set for current session. For permanent storage, use Vercel dashboard or CLI.",
      currentSessionSet: true,
      envVarName,
      masked: `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`,
      instructions: {
        cli: `vercel env add ${envVarName} production`,
        dashboard: "Go to Vercel Dashboard > Settings > Environment Variables",
      }
    })
    
  } catch (error) {
    console.error("Error managing environment variable:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}