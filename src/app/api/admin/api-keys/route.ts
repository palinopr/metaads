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
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    if (!await isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }
    
    // Return masked API keys
    const apiKeys = {
      openai: process.env.OPENAI_API_KEY ? 
        `sk-...${process.env.OPENAI_API_KEY.slice(-4)}` : null,
      anthropic: process.env.ANTHROPIC_API_KEY ?
        `sk-ant-...${process.env.ANTHROPIC_API_KEY.slice(-4)}` : null,
    }
    
    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error("Error fetching API keys:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

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
    
    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Provider and API key are required" },
        { status: 400 }
      )
    }
    
    // Validate provider
    if (!["openai", "anthropic"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      )
    }
    
    // Set the environment variable for the current process
    const envVarName = provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY"
    process.env[envVarName] = apiKey
    
    // Also call the Vercel env endpoint
    try {
      const vercelResponse = await fetch(`${request.nextUrl.origin}/api/admin/vercel-env`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Forward the session cookie
          "Cookie": request.headers.get("cookie") || "",
        },
        body: JSON.stringify({ provider, apiKey }),
      })
      
      const vercelData = await vercelResponse.json()
      
      return NextResponse.json({
        success: true,
        message: "API key saved successfully!",
        currentSessionSet: true,
        provider,
        masked: `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`,
        instructions: vercelData.instructions,
      })
    } catch (error) {
      // Even if Vercel endpoint fails, we've set it for current session
      return NextResponse.json({
        success: true,
        message: "API key set for current session.",
        currentSessionSet: true,
        provider,
        masked: `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`,
        note: "For permanent storage, add to Vercel environment variables.",
      })
    }
    
  } catch (error) {
    console.error("Error saving API key:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}