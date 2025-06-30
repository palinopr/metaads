import fs from 'fs/promises'
import path from 'path'

// Store configurations in a JSON file
const CONFIG_FILE = path.join(process.cwd(), 'agent-configs.json')

export interface AgentConfig {
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

// Default agent configuration
const defaultAgent: AgentConfig = {
  id: "campaign-creator",
  name: "Campaign Creator Agent",
  description: "AI agent for creating and managing ad campaigns",
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: "You are a helpful AI assistant specialized in creating Facebook ad campaigns. Provide clear, actionable advice and creative solutions.",
  tools: ["campaign-creator", "audience-targeting", "ad-copy-generator"],
  enabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

export class AgentConfigStore {
  private static instance: AgentConfigStore
  private configs: Map<string, AgentConfig> = new Map()
  private initialized = false

  private constructor() {}

  static getInstance(): AgentConfigStore {
    if (!AgentConfigStore.instance) {
      AgentConfigStore.instance = new AgentConfigStore()
    }
    return AgentConfigStore.instance
  }

  async initialize() {
    if (this.initialized) return
    
    try {
      // Try to read existing config file
      const data = await fs.readFile(CONFIG_FILE, 'utf-8')
      const configs = JSON.parse(data) as Record<string, AgentConfig>
      
      // Load configs into map
      Object.entries(configs).forEach(([id, config]) => {
        this.configs.set(id, config)
      })
    } catch (error) {
      // If file doesn't exist or is invalid, use default
      console.log('No existing config file, using defaults')
      this.configs.set(defaultAgent.id, defaultAgent)
      await this.save()
    }
    
    this.initialized = true
  }

  async getAll(): Promise<AgentConfig[]> {
    await this.initialize()
    return Array.from(this.configs.values())
  }

  async get(id: string): Promise<AgentConfig | null> {
    await this.initialize()
    return this.configs.get(id) || null
  }

  async update(id: string, updates: Partial<AgentConfig>): Promise<AgentConfig> {
    await this.initialize()
    
    const existing = this.configs.get(id)
    if (!existing) {
      throw new Error(`Agent ${id} not found`)
    }

    const updated = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    }

    this.configs.set(id, updated)
    await this.save()
    
    return updated
  }

  async create(config: Omit<AgentConfig, 'createdAt' | 'updatedAt'>): Promise<AgentConfig> {
    await this.initialize()
    
    const newConfig: AgentConfig = {
      ...config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.configs.set(newConfig.id, newConfig)
    await this.save()
    
    return newConfig
  }

  async delete(id: string): Promise<void> {
    await this.initialize()
    
    if (!this.configs.has(id)) {
      throw new Error(`Agent ${id} not found`)
    }

    this.configs.delete(id)
    await this.save()
  }

  private async save() {
    const data = Object.fromEntries(this.configs.entries())
    await fs.writeFile(CONFIG_FILE, JSON.stringify(data, null, 2))
  }
}