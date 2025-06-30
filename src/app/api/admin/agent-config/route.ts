import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { AgentConfigStore } from "@/lib/agent-config-store"

// Get singleton instance of agent config store
const configStore = AgentConfigStore.getInstance()

// Check if user is admin
async function isAdmin(email: string): Promise<boolean> {
  // Hardcoded admin check for now
  return email === "jaime@outletmedia.net"
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const isUserAdmin = await isAdmin(session.user.email)
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    // Get agent ID from query params
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("id")

    if (agentId) {
      const agent = await configStore.get(agentId)
      if (!agent) {
        return NextResponse.json(
          { error: "Agent not found" },
          { status: 404 }
        )
      }
      return NextResponse.json(agent)
    }

    // Return all agents
    const agents = await configStore.getAll()
    return NextResponse.json(agents)
  } catch (error) {
    console.error("Error fetching agent config:", error)
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const isUserAdmin = await isAdmin(session.user.email)
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    const newAgent = await configStore.create({
      id: body.id || `agent-${Date.now()}`,
      name: body.name || "New Agent",
      description: body.description || "",
      model: body.model || "gpt-4",
      temperature: body.temperature || 0.7,
      maxTokens: body.maxTokens || 2000,
      systemPrompt: body.systemPrompt || "",
      tools: body.tools || [],
      enabled: body.enabled !== false,
    })

    return NextResponse.json(newAgent, { status: 201 })
  } catch (error) {
    console.error("Error creating agent config:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const isUserAdmin = await isAdmin(session.user.email)
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      )
    }

    const existingAgent = await configStore.get(body.id)
    if (!existingAgent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      )
    }

    const updatedAgent = await configStore.update(body.id, {
      name: body.name,
      description: body.description,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      systemPrompt: body.systemPrompt,
      tools: body.tools,
      enabled: body.enabled,
    })

    return NextResponse.json(updatedAgent)
  } catch (error) {
    console.error("Error updating agent config:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const isUserAdmin = await isAdmin(session.user.email)
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("id")
    
    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      )
    }

    await configStore.delete(agentId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting agent config:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}