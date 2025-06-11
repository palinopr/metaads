'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useWebSocketChannel } from '@/hooks/use-websocket'
import { 
  Users, 
  MessageCircle, 
  Eye, 
  Edit,
  Share,
  Clock,
  Activity,
  Send,
  Plus,
  Settings,
  Bell,
  Video,
  Phone
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollaborationUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'manager' | 'analyst' | 'viewer'
  status: 'online' | 'away' | 'offline'
  lastSeen: Date
  currentActivity?: {
    type: 'viewing' | 'editing' | 'analyzing'
    target: string
    timestamp: Date
  }
}

interface CollaborationMessage {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  type: 'text' | 'system' | 'mention' | 'reaction'
  timestamp: Date
  campaignId?: string
  mentions?: string[]
  reactions?: Record<string, string[]> // emoji -> user IDs
  attachments?: CollaborationAttachment[]
}

interface CollaborationAttachment {
  id: string
  name: string
  type: 'image' | 'document' | 'link' | 'report'
  url: string
  size?: number
}

interface LiveActivity {
  id: string
  userId: string
  userName: string
  action: 'joined' | 'left' | 'viewed_campaign' | 'edited_campaign' | 'created_report' | 'shared_insight'
  target?: string
  timestamp: Date
  data?: Record<string, any>
}

interface CollaborationSession {
  id: string
  campaignId?: string
  name: string
  participants: CollaborationUser[]
  messages: CollaborationMessage[]
  activities: LiveActivity[]
  createdAt: Date
  updatedAt: Date
}

export function LiveCollaboration() {
  const [currentUser] = useState<CollaborationUser>({
    id: 'current-user',
    name: 'You',
    email: 'user@example.com',
    role: 'manager',
    status: 'online',
    lastSeen: new Date()
  })
  
  const [activeUsers, setActiveUsers] = useState<Map<string, CollaborationUser>>(new Map())
  const [messages, setMessages] = useState<CollaborationMessage[]>([])
  const [activities, setActivities] = useState<LiveActivity[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState<Map<string, boolean>>(new Map())

  // Subscribe to collaboration updates
  const { isConnected } = useWebSocketChannel('collaboration', useCallback((data: any) => {
    handleCollaborationUpdate(data)
  }, []))

  const handleCollaborationUpdate = (data: any) => {
    switch (data.type) {
      case 'user_joined':
        setActiveUsers(prev => {
          const updated = new Map(prev)
          updated.set(data.user.id, { ...data.user, status: 'online' })
          return updated
        })
        addActivity({
          userId: data.user.id,
          userName: data.user.name,
          action: 'joined',
          timestamp: new Date()
        })
        break

      case 'user_left':
        setActiveUsers(prev => {
          const updated = new Map(prev)
          const user = updated.get(data.userId)
          if (user) {
            updated.set(data.userId, { ...user, status: 'offline' })
          }
          return updated
        })
        addActivity({
          userId: data.userId,
          userName: data.userName,
          action: 'left',
          timestamp: new Date()
        })
        break

      case 'user_activity':
        setActiveUsers(prev => {
          const updated = new Map(prev)
          const user = updated.get(data.userId)
          if (user) {
            updated.set(data.userId, {
              ...user,
              currentActivity: data.activity,
              lastSeen: new Date()
            })
          }
          return updated
        })
        break

      case 'new_message':
        addMessage(data.message)
        break

      case 'typing_start':
        setIsTyping(prev => {
          const updated = new Map(prev)
          updated.set(data.userId, true)
          return updated
        })
        setTimeout(() => {
          setIsTyping(prev => {
            const updated = new Map(prev)
            updated.delete(data.userId)
            return updated
          })
        }, 3000)
        break

      case 'typing_stop':
        setIsTyping(prev => {
          const updated = new Map(prev)
          updated.delete(data.userId)
          return updated
        })
        break
    }
  }

  const addMessage = (message: CollaborationMessage) => {
    setMessages(prev => {
      const updated = [...prev, message].slice(-100) // Keep last 100 messages
      return updated
    })
  }

  const addActivity = (activity: Omit<LiveActivity, 'id'>) => {
    const fullActivity: LiveActivity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    setActivities(prev => {
      const updated = [fullActivity, ...prev].slice(0, 50) // Keep last 50 activities
      return updated
    })
  }

  const sendMessage = () => {
    if (!newMessage.trim()) return

    const message: CollaborationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: newMessage,
      type: 'text',
      timestamp: new Date(),
      campaignId: selectedCampaign || undefined
    }

    // In a real implementation, this would send via WebSocket
    addMessage(message)
    setNewMessage('')
  }

  const handleTyping = (text: string) => {
    setNewMessage(text)
    
    // Send typing indicator
    // In a real implementation, this would send via WebSocket
    if (text.length > 0) {
      // Send typing start
    } else {
      // Send typing stop
    }
  }

  const formatLastSeen = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const getStatusColor = (status: CollaborationUser['status']): string => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
    }
  }

  const getRoleColor = (role: CollaborationUser['role']): string => {
    switch (role) {
      case 'admin': return 'destructive'
      case 'manager': return 'default'
      case 'analyst': return 'secondary'
      case 'viewer': return 'outline'
    }
  }

  const getActivityIcon = (action: LiveActivity['action']) => {
    switch (action) {
      case 'joined': return <Users className="h-4 w-4 text-green-500" />
      case 'left': return <Users className="h-4 w-4 text-gray-500" />
      case 'viewed_campaign': return <Eye className="h-4 w-4 text-blue-500" />
      case 'edited_campaign': return <Edit className="h-4 w-4 text-orange-500" />
      case 'created_report': return <Share className="h-4 w-4 text-purple-500" />
      case 'shared_insight': return <MessageCircle className="h-4 w-4 text-indigo-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const onlineUsers = Array.from(activeUsers.values()).filter(u => u.status === 'online')
  const typingUsers = Array.from(isTyping.keys()).filter(id => id !== currentUser.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Collaboration</h2>
          <p className="text-muted-foreground">Real-time team collaboration and communication</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? 'Live' : 'Disconnected'}
          </Badge>
          <Button variant="outline" size="sm">
            <Video className="h-4 w-4 mr-2" />
            Start Call
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
            <p className="text-xs text-muted-foreground">
              In current session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
            <p className="text-xs text-muted-foreground">
              Recent actions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Typing</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typingUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Users typing now
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Users Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
            <CardDescription>Team members currently online</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {Array.from(activeUsers.values()).map(user => (
                  <div key={user.id} className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        'absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background',
                        getStatusColor(user.status)
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <Badge variant={getRoleColor(user.role)} className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{user.status}</span>
                        {user.status !== 'online' && (
                          <span>• {formatLastSeen(user.lastSeen)}</span>
                        )}
                      </div>
                      
                      {user.currentActivity && (
                        <div className="flex items-center space-x-1 text-xs text-blue-600">
                          <Activity className="h-3 w-3" />
                          <span>{user.currentActivity.type} {user.currentActivity.target}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Live Chat */}
        <Card>
          <CardHeader>
            <CardTitle>Team Chat</CardTitle>
            <CardDescription>Real-time messaging</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px] p-4">
              <div className="space-y-3">
                {messages.map(message => (
                  <div key={message.id} className="flex space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={message.userAvatar} alt={message.userName} />
                      <AvatarFallback className="text-xs">{message.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{message.userName}</span>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{message.content}</p>
                    </div>
                  </div>
                ))}
                
                {typingUsers.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="flex space-x-1">
                      <div className="h-1 w-1 bg-current rounded-full animate-bounce" />
                      <div className="h-1 w-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="h-1 w-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span>
                      {typingUsers.length === 1 
                        ? `Someone is typing...`
                        : `${typingUsers.length} people are typing...`
                      }
                    </span>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <Separator />
            
            <div className="p-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button size="sm" onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Live team actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {activities.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    {getActivityIcon(activity.action)}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.userName}</span>
                        <span className="text-muted-foreground ml-1">
                          {activity.action.replace('_', ' ')}
                          {activity.target && ` ${activity.target}`}
                        </span>
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatLastSeen(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Collaboration Tools</CardTitle>
          <CardDescription>Quick access to team collaboration features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col">
              <Share className="h-6 w-6 mb-2" />
              Share Screen
            </Button>
            
            <Button variant="outline" className="h-20 flex-col">
              <MessageCircle className="h-6 w-6 mb-2" />
              Group Chat
            </Button>
            
            <Button variant="outline" className="h-20 flex-col">
              <Bell className="h-6 w-6 mb-2" />
              Set Alerts
            </Button>
            
            <Button variant="outline" className="h-20 flex-col">
              <Settings className="h-6 w-6 mb-2" />
              Team Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}