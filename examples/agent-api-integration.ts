// Agent API Integration Pattern - MetaAds Standard
// This example shows how to integrate Python AI agents with Next.js API routes

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { z } from "zod"
import { spawn } from "child_process"
import { v4 as uuidv4 } from "uuid"

// 1. Define request/response schemas
const agentRequestSchema = z.object({
  agentType: z.enum(["campaign-creator", "optimization", "reporting", "creative"]),
  action: z.string(),
  parameters: z.record(z.any()),
  sessionId: z.string().optional()
})

const agentResponseSchema = z.object({
  success: z.boolean(),
  response: z.any(),
  sessionId: z.string(),
  error: z.string().optional()
})

// 2. Agent execution function
async function executeAgent(
  agentType: string,
  action: string,
  parameters: Record<string, any>,
  sessionId: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Path to the Python agent script
    const agentPath = `${process.cwd()}/src/agents/${agentType}.py`
    
    // Spawn Python process
    const pythonProcess = spawn('python', [
      agentPath,
      '--action', action,
      '--params', JSON.stringify(parameters),
      '--session', sessionId
    ])

    let result = ''
    let error = ''

    // Collect output
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString()
    })

    // Handle completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Agent process exited with code ${code}: ${error}`))
      } else {
        try {
          const parsed = JSON.parse(result)
          resolve(parsed)
        } catch (e) {
          reject(new Error(`Failed to parse agent response: ${result}`))
        }
      }
    })

    // Timeout after 30 seconds
    setTimeout(() => {
      pythonProcess.kill()
      reject(new Error('Agent execution timeout'))
    }, 30000)
  })
}

// 3. Main API route handler
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate request
    const body = await req.json()
    const validatedData = agentRequestSchema.parse(body)

    // Generate session ID if not provided
    const sessionId = validatedData.sessionId || `${session.user.id}-${uuidv4()}`

    // Log agent request
    await db.insert(agentLogs).values({
      userId: session.user.id,
      agentType: validatedData.agentType,
      action: validatedData.action,
      parameters: validatedData.parameters,
      sessionId,
      createdAt: new Date()
    })

    // Execute agent
    const result = await executeAgent(
      validatedData.agentType,
      validatedData.action,
      validatedData.parameters,
      sessionId
    )

    // Validate response
    const validatedResponse = agentResponseSchema.parse(result)

    // Log successful execution
    await db.update(agentLogs)
      .set({
        response: validatedResponse.response,
        success: validatedResponse.success,
        completedAt: new Date()
      })
      .where(eq(agentLogs.sessionId, sessionId))

    return NextResponse.json(validatedResponse)

  } catch (error) {
    console.error('Agent API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Agent execution failed', message: error.message },
      { status: 500 }
    )
  }
}

// 4. Streaming response pattern for real-time agent updates
export async function* streamAgentResponse(
  agentType: string,
  action: string,
  parameters: Record<string, any>,
  sessionId: string
) {
  const agentPath = `${process.cwd()}/src/agents/${agentType}.py`
  
  const pythonProcess = spawn('python', [
    agentPath,
    '--action', action,
    '--params', JSON.stringify(parameters),
    '--session', sessionId,
    '--stream' // Enable streaming mode
  ])

  // Stream chunks as they arrive
  for await (const chunk of pythonProcess.stdout) {
    const text = chunk.toString()
    const lines = text.split('\n').filter(line => line.trim())
    
    for (const line of lines) {
      try {
        const data = JSON.parse(line)
        yield `data: ${JSON.stringify(data)}\n\n`
      } catch (e) {
        // Skip non-JSON lines
      }
    }
  }
}

// 5. Server-Sent Events endpoint for streaming
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const agentType = searchParams.get('agent')
  const action = searchParams.get('action')
  const sessionId = searchParams.get('session') || uuidv4()

  if (!agentType || !action) {
    return new Response("Missing parameters", { status: 400 })
  }

  // Create SSE response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamAgentResponse(
          agentType,
          action,
          {},
          sessionId
        )) {
          controller.enqueue(new TextEncoder().encode(chunk))
        }
      } catch (error) {
        controller.enqueue(
          new TextEncoder().encode(`data: {"error": "${error.message}"}\n\n`)
        )
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

// 6. Client-side usage example
/*
// In a React component:

const [response, setResponse] = useState(null)
const [loading, setLoading] = useState(false)

const callAgent = async () => {
  setLoading(true)
  try {
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentType: 'optimization',
        action: 'analyze',
        parameters: { campaignId: '123' }
      })
    })
    
    const data = await res.json()
    setResponse(data)
  } catch (error) {
    console.error('Agent error:', error)
  } finally {
    setLoading(false)
  }
}

// For streaming:
const streamAgent = () => {
  const eventSource = new EventSource(
    '/api/agents?agent=optimization&action=analyze&session=123'
  )
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)
    console.log('Agent update:', data)
  }
  
  eventSource.onerror = () => {
    eventSource.close()
  }
}
*/