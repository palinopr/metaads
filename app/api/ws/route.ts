import { NextRequest } from 'next/server'
import { WebSocketServer } from 'ws'
import { IncomingMessage } from 'http'
import { Socket } from 'net'

// Store WebSocket server instance
let wss: WebSocketServer | null = null

// Initialize WebSocket server
function initWebSocketServer() {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true })

    wss.on('connection', (ws, request) => {
      console.log('New WebSocket connection established')

      // Send initial connection message
      ws.send(JSON.stringify({
        type: 'system_alert',
        data: { message: 'Connected to real-time updates' },
        timestamp: new Date().toISOString()
      }))

      // Handle incoming messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString())
          console.log('Received message:', message)
          
          // Echo message back for now (you can add more logic here)
          ws.send(JSON.stringify({
            type: 'system_alert',
            data: { echo: message },
            timestamp: new Date().toISOString()
          }))
        } catch (error) {
          console.error('Failed to parse message:', error)
        }
      })

      ws.on('close', () => {
        console.log('WebSocket connection closed')
      })

      ws.on('error', (error) => {
        console.error('WebSocket error:', error)
      })

      // Simulate real-time updates (remove in production)
      const interval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          // Send random performance update
          const updates = [
            {
              type: 'spend_update',
              data: {
                campaignId: 'demo_campaign',
                spend: Math.random() * 100,
                timestamp: new Date().toISOString()
              }
            },
            {
              type: 'conversion',
              data: {
                campaignId: 'demo_campaign',
                value: Math.random() * 500,
                timestamp: new Date().toISOString()
              }
            },
            {
              type: 'performance_alert',
              data: {
                campaignId: 'demo_campaign',
                alert: 'High CTR detected',
                value: (Math.random() * 5).toFixed(2) + '%',
                timestamp: new Date().toISOString()
              }
            }
          ]

          const randomUpdate = updates[Math.floor(Math.random() * updates.length)]
          ws.send(JSON.stringify({
            ...randomUpdate,
            timestamp: new Date().toISOString()
          }))
        }
      }, 10000) // Send update every 10 seconds

      ws.on('close', () => {
        clearInterval(interval)
      })
    })
  }
  return wss
}

export async function GET(request: NextRequest) {
  // This is a workaround for WebSocket upgrade in Next.js App Router
  // In production, you might want to use a separate WebSocket server
  
  return new Response('WebSocket endpoint', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

// Export WebSocket upgrade handler for custom server
export function handleUpgrade(
  request: IncomingMessage,
  socket: Socket,
  head: Buffer
) {
  const wss = initWebSocketServer()
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request)
  })
}