import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'
import { EventEmitter } from 'events'

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'update' | 'ping' | 'pong' | 'alert' | 'notification'
  channel?: string
  data?: any
  timestamp?: number
}

export interface ClientConnection {
  id: string
  ws: WebSocket
  subscriptions: Set<string>
  lastActivity: number
  metadata?: Record<string, any>
}

export class RealtimeServer extends EventEmitter {
  private wss: WebSocketServer | null = null
  private clients: Map<string, ClientConnection> = new Map()
  private channels: Map<string, Set<string>> = new Map()
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
  }

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server })

    this.wss.on('connection', (ws: WebSocket, request) => {
      const clientId = this.generateClientId()
      const client: ClientConnection = {
        id: clientId,
        ws,
        subscriptions: new Set(),
        lastActivity: Date.now(),
        metadata: {
          ip: request.socket.remoteAddress,
          userAgent: request.headers['user-agent']
        }
      }

      this.clients.set(clientId, client)
      console.log(`WebSocket client connected: ${clientId}`)

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'update',
        channel: 'system',
        data: {
          message: 'Connected to real-time server',
          clientId,
          timestamp: Date.now()
        }
      })

      // Handle messages from client
      ws.on('message', (message: Buffer) => {
        try {
          const data: WebSocketMessage = JSON.parse(message.toString())
          this.handleClientMessage(clientId, data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      })

      // Handle client disconnect
      ws.on('close', () => {
        this.handleClientDisconnect(clientId)
      })

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error)
      })
    })

    // Start heartbeat mechanism
    this.startHeartbeat()
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private handleClientMessage(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId)
    if (!client) return

    client.lastActivity = Date.now()

    switch (message.type) {
      case 'subscribe':
        if (message.channel) {
          this.subscribeClientToChannel(clientId, message.channel)
        }
        break

      case 'unsubscribe':
        if (message.channel) {
          this.unsubscribeClientFromChannel(clientId, message.channel)
        }
        break

      case 'ping':
        this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() })
        break

      default:
        this.emit('client-message', { clientId, message })
    }
  }

  private subscribeClientToChannel(clientId: string, channel: string) {
    const client = this.clients.get(clientId)
    if (!client) return

    client.subscriptions.add(channel)

    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set())
    }
    this.channels.get(channel)!.add(clientId)

    console.log(`Client ${clientId} subscribed to channel: ${channel}`)
    
    this.sendToClient(clientId, {
      type: 'update',
      channel: 'system',
      data: {
        message: `Subscribed to channel: ${channel}`,
        channel,
        timestamp: Date.now()
      }
    })
  }

  private unsubscribeClientFromChannel(clientId: string, channel: string) {
    const client = this.clients.get(clientId)
    if (!client) return

    client.subscriptions.delete(channel)

    const channelClients = this.channels.get(channel)
    if (channelClients) {
      channelClients.delete(clientId)
      if (channelClients.size === 0) {
        this.channels.delete(channel)
      }
    }

    console.log(`Client ${clientId} unsubscribed from channel: ${channel}`)
  }

  private handleClientDisconnect(clientId: string) {
    const client = this.clients.get(clientId)
    if (!client) return

    // Remove from all channels
    client.subscriptions.forEach(channel => {
      const channelClients = this.channels.get(channel)
      if (channelClients) {
        channelClients.delete(clientId)
        if (channelClients.size === 0) {
          this.channels.delete(channel)
        }
      }
    })

    this.clients.delete(clientId)
    console.log(`WebSocket client disconnected: ${clientId}`)
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now()
      const timeout = 60000 // 60 seconds

      this.clients.forEach((client, clientId) => {
        if (now - client.lastActivity > timeout) {
          console.log(`Disconnecting inactive client: ${clientId}`)
          client.ws.close()
          this.handleClientDisconnect(clientId)
        } else {
          // Send heartbeat ping
          this.sendToClient(clientId, { type: 'ping', timestamp: now })
        }
      })
    }, 30000) // Check every 30 seconds
  }

  // Public methods for sending data
  public broadcast(message: WebSocketMessage) {
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, message)
    })
  }

  public broadcastToChannel(channel: string, message: WebSocketMessage) {
    const channelClients = this.channels.get(channel)
    if (!channelClients) return

    const messageWithChannel = { ...message, channel }
    channelClients.forEach(clientId => {
      this.sendToClient(clientId, messageWithChannel)
    })
  }

  public sendToClient(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId)
    if (!client || client.ws.readyState !== WebSocket.OPEN) return

    try {
      client.ws.send(JSON.stringify({
        ...message,
        timestamp: message.timestamp || Date.now()
      }))
    } catch (error) {
      console.error(`Failed to send message to client ${clientId}:`, error)
    }
  }

  // Campaign-specific methods
  public notifyCampaignUpdate(campaignId: string, data: any) {
    this.broadcastToChannel(`campaign:${campaignId}`, {
      type: 'update',
      data: {
        campaignId,
        ...data
      }
    })
  }

  public notifyMetricUpdate(metric: string, data: any) {
    this.broadcastToChannel(`metrics:${metric}`, {
      type: 'update',
      data
    })
  }

  public sendAlert(alert: {
    type: 'budget' | 'performance' | 'error' | 'info'
    severity: 'low' | 'medium' | 'high' | 'critical'
    title: string
    message: string
    data?: any
  }) {
    this.broadcastToChannel('alerts', {
      type: 'alert',
      data: alert
    })
  }

  public getConnectionStats() {
    return {
      totalClients: this.clients.size,
      activeChannels: this.channels.size,
      channelStats: Array.from(this.channels.entries()).map(([channel, clients]) => ({
        channel,
        subscribers: clients.size
      }))
    }
  }

  public shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.clients.forEach((client) => {
      client.ws.close()
    })

    if (this.wss) {
      this.wss.close()
    }
  }
}

// Singleton instance
export const realtimeServer = new RealtimeServer()