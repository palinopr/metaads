import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

// Agent configuration interface
interface AgentConfig {
  id: string
  name: string
  description: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  tools: string[]
  enabled: boolean
  createdAt: string
  updatedAt: string
}

// In-memory storage for agent configurations (in production, this should be in database)
const agentConfigs: Map<string, AgentConfig> = new Map()

// Initialize with default agent configuration
const defaultAgent: AgentConfig = {
  id: "campaign-creator",
  name: "Campaign Creator Agent",
  description: "AI agent for creating and managing ad campaigns",
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: "You are an expert marketing agent that helps create effective ad campaigns.",
  tools: ["campaign_analysis", "audience_targeting", "budget_optimization"],
  enabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

agentConfigs.set(defaultAgent.id, defaultAgent)

// Check if user is admin (in production, add role field to users table)
async function isAdmin(email: string): Promise<boolean> {
  // Direct check for admin access
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
      const agent = agentConfigs.get(agentId)
      if (!agent) {
        return NextResponse.json(
          { error: "Agent not found" },
          { status: 404 }
        )
      }
      return NextResponse.json(agent)
    }

    // Return all agents
    const agents = Array.from(agentConfigs.values())
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
    
    // Validate required fields
    if (!body.id || !body.name) {
      return NextResponse.json(
        { error: "Missing required fields: id, name" },
        { status: 400 }
      )
    }

    // Create new agent configuration
    const newAgent: AgentConfig = {
      id: body.id,
      name: body.name,
      description: body.description || "",
      model: body.model || "gpt-4",
      temperature: body.temperature || 0.7,
      maxTokens: body.maxTokens || 2000,
      systemPrompt: body.systemPrompt || "",
      tools: body.tools || [],
      enabled: body.enabled !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    agentConfigs.set(newAgent.id, newAgent)

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

    const existingAgent = agentConfigs.get(body.id)
    if (!existingAgent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      )
    }

    // Update agent configuration
    const updatedAgent: AgentConfig = {
      ...existingAgent,
      name: body.name || existingAgent.name,
      description: body.description !== undefined ? body.description : existingAgent.description,
      model: body.model || existingAgent.model,
      temperature: body.temperature !== undefined ? body.temperature : existingAgent.temperature,
      maxTokens: body.maxTokens !== undefined ? body.maxTokens : existingAgent.maxTokens,
      systemPrompt: body.systemPrompt !== undefined ? body.systemPrompt : existingAgent.systemPrompt,
      tools: body.tools || existingAgent.tools,
      enabled: body.enabled !== undefined ? body.enabled : existingAgent.enabled,
      updatedAt: new Date().toISOString()
    }

    agentConfigs.set(body.id, updatedAgent)

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

    if (!agentConfigs.has(agentId)) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      )
    }

    agentConfigs.delete(agentId)

    return NextResponse.json(
      { message: "Agent deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting agent config:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}