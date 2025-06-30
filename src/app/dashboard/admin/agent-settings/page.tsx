"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Bot, Settings, Plus, Save, Trash2 } from "lucide-react"

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

export default function AdminAgentSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [agents, setAgents] = useState<AgentConfig[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newToolName, setNewToolName] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in")
    } else if (status === "authenticated") {
      fetchAgents()
    }
  }, [status, router])

  const fetchAgents = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/agent-config")
      
      if (response.status === 403) {
        setError("You don't have permission to access admin settings")
        return
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch agents")
      }

      const data = await response.json()
      setAgents(data)
      if (data.length > 0 && !selectedAgent) {
        setSelectedAgent(data[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAgent = async () => {
    if (!selectedAgent) return

    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch("/api/admin/agent-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedAgent),
      })

      if (!response.ok) {
        throw new Error("Failed to save agent configuration")
      }

      const updatedAgent = await response.json()
      setAgents(agents.map(a => a.id === updatedAgent.id ? updatedAgent : a))
      setSelectedAgent(updatedAgent)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/agent-config?id=${agentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete agent")
      }

      setAgents(agents.filter(a => a.id !== agentId))
      if (selectedAgent?.id === agentId) {
        setSelectedAgent(agents[0] || null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete agent")
    }
  }

  const handleAddTool = () => {
    if (!selectedAgent || !newToolName.trim()) return

    setSelectedAgent({
      ...selectedAgent,
      tools: [...selectedAgent.tools, newToolName.trim()]
    })
    setNewToolName("")
  }

  const handleRemoveTool = (toolIndex: number) => {
    if (!selectedAgent) return

    setSelectedAgent({
      ...selectedAgent,
      tools: selectedAgent.tools.filter((_, index) => index !== toolIndex)
    })
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-10">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="py-10">
            <div className="flex items-center justify-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Agent Configuration</h1>
        <p className="text-gray-500 mt-2">Manage AI agent settings and configurations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Agent List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedAgent?.id === agent.id
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-gray-500">{agent.model}</div>
                    <Badge
                      variant={agent.enabled ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {agent.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Details */}
        <div className="lg:col-span-3">
          {selectedAgent ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      {selectedAgent.name}
                    </CardTitle>
                    <CardDescription>
                      Configure agent settings and behavior
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveAgent}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteAgent(selectedAgent.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="model">Model Settings</TabsTrigger>
                    <TabsTrigger value="tools">Tools</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4">
                    <div>
                      <Label htmlFor="agent-id">Agent ID</Label>
                      <Input
                        id="agent-id"
                        value={selectedAgent.id}
                        disabled
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="agent-name">Name</Label>
                      <Input
                        id="agent-name"
                        value={selectedAgent.name}
                        onChange={(e) =>
                          setSelectedAgent({ ...selectedAgent, name: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="agent-description">Description</Label>
                      <Textarea
                        id="agent-description"
                        value={selectedAgent.description}
                        onChange={(e) =>
                          setSelectedAgent({ ...selectedAgent, description: e.target.value })
                        }
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="agent-enabled"
                        checked={selectedAgent.enabled}
                        onChange={(e) =>
                          setSelectedAgent({ ...selectedAgent, enabled: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="agent-enabled" className="cursor-pointer">
                        Enable this agent
                      </Label>
                    </div>
                  </TabsContent>

                  <TabsContent value="model" className="space-y-4">
                    <div>
                      <Label htmlFor="model">Model</Label>
                      <Select
                        value={selectedAgent.model}
                        onValueChange={(value) =>
                          setSelectedAgent({ ...selectedAgent, model: value })
                        }
                      >
                        <SelectTrigger id="model" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          <SelectItem value="claude-3">Claude 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="temperature">
                        Temperature: {selectedAgent.temperature}
                      </Label>
                      <input
                        type="range"
                        id="temperature"
                        min="0"
                        max="2"
                        step="0.1"
                        value={selectedAgent.temperature}
                        onChange={(e) =>
                          setSelectedAgent({
                            ...selectedAgent,
                            temperature: parseFloat(e.target.value),
                          })
                        }
                        className="w-full mt-1"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Controls randomness: 0 is focused, 2 is more creative
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="max-tokens">Max Tokens</Label>
                      <Input
                        id="max-tokens"
                        type="number"
                        value={selectedAgent.maxTokens}
                        onChange={(e) =>
                          setSelectedAgent({
                            ...selectedAgent,
                            maxTokens: parseInt(e.target.value) || 0,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="system-prompt">System Prompt</Label>
                      <Textarea
                        id="system-prompt"
                        value={selectedAgent.systemPrompt}
                        onChange={(e) =>
                          setSelectedAgent({ ...selectedAgent, systemPrompt: e.target.value })
                        }
                        className="mt-1"
                        rows={6}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="tools" className="space-y-4">
                    <div>
                      <Label>Available Tools</Label>
                      <div className="mt-2 space-y-2">
                        {selectedAgent.tools.map((tool, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <span className="font-mono text-sm">{tool}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTool(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add new tool..."
                        value={newToolName}
                        onChange={(e) => setNewToolName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleAddTool()}
                      />
                      <Button onClick={handleAddTool}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Tool
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 pt-6 border-t text-sm text-gray-500">
                  <p>Created: {new Date(selectedAgent.createdAt).toLocaleString()}</p>
                  <p>Last updated: {new Date(selectedAgent.updatedAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10">
                <div className="text-center text-gray-500">
                  Select an agent to view and edit its configuration
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}