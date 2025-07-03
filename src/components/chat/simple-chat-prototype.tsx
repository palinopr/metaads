"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Sparkles } from "lucide-react"

interface ChatContext {
  business?: string
  location?: string
  budget?: string
  goal?: string
}

// Simplified conversation flow for MVP
const CONVERSATION_FLOW = {
  start: {
    message: "Hi! I'm here to help you get more customers. What do you sell? 🚀",
    suggestions: ["Real estate", "Insurance", "Home services", "Online products"],
    next: "location"
  },
  location: {
    message: (context: ChatContext) => `Great! ${context.business} is perfect for online ads. Where are your customers?`,
    suggestions: ["My city", "My state", "Nationwide", "Online only"],
    next: "budget"
  },
  budget: {
    message: "What's your monthly marketing budget? I'll make sure we start safe and scale what works.",
    suggestions: ["$500", "$1000", "$2000", "$5000+"],
    next: "goal"
  },
  goal: {
    message: "What matters most to you right now?",
    suggestions: ["More phone calls", "Website visitors", "Email sign-ups", "Online sales"],
    next: "preview"
  },
  preview: {
    message: (context: ChatContext) => generatePreview(context),
    suggestions: ["Looks good, let's go!", "Let me adjust something"],
    next: "launch"
  }
}

function generatePreview(context: ChatContext) {
  const dailyBudget = Math.floor(parseInt(context.budget || "0") / 30)
  return `Here's what I'll create for you:

📍 **Where**: ${context.location}
💰 **Daily Budget**: $${dailyBudget} (safe start)
🎯 **Goal**: ${context.goal}
👥 **Audience**: People interested in ${context.business}

I'll create 3 different ads to see what works best.
Ready to get your first customers?`
}

export function SimpleChatPrototype() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: CONVERSATION_FLOW.start.message }
  ])
  const [input, setInput] = useState("")
  const [context, setContext] = useState<ChatContext>({})
  const [currentStep, setCurrentStep] = useState("start")
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = async (text?: string) => {
    const userMessage = text || input
    if (!userMessage.trim()) return

    // Add user message
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setInput("")
    setIsTyping(true)

    // Update context based on step
    const newContext = { ...context }
    if (currentStep === "start") newContext.business = userMessage
    if (currentStep === "location") newContext.location = userMessage
    if (currentStep === "budget") newContext.budget = userMessage.replace(/\D/g, '')
    if (currentStep === "goal") newContext.goal = userMessage
    
    setContext(newContext)

    // Simulate AI thinking
    setTimeout(() => {
      const flow = CONVERSATION_FLOW as any
      const nextStep = flow[currentStep].next
      
      if (nextStep && flow[nextStep]) {
        const nextMessage = typeof flow[nextStep].message === 'function' 
          ? flow[nextStep].message(newContext)
          : flow[nextStep].message
          
        setMessages(prev => [...prev, { role: "assistant", content: nextMessage }])
        setCurrentStep(nextStep)
      } else if (currentStep === "preview" && userMessage.includes("go")) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: "🎉 Awesome! I'm creating your campaign now...\n\nYour ads will start running in about 10 minutes. I'll text you daily updates on how they're doing.\n\nRemember: The first few days are for learning what works. Real results usually start flowing after day 3-5. You've got this! 💪"
        }])
      }
      
      setIsTyping(false)
    }, 1000)
  }

  const currentSuggestions = (CONVERSATION_FLOW as any)[currentStep]?.suggestions || []

  return (
    <Card className="max-w-2xl mx-auto h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold">MetaAds Assistant</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          I'll help you create profitable ads in under 5 minutes
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-muted'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {currentSuggestions.length > 0 && !isTyping && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {currentSuggestions.map((suggestion: string) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => handleSend(suggestion)}
                className="text-xs"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            className="flex-1"
            disabled={isTyping}
          />
          <Button type="submit" size="icon" disabled={isTyping}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  )
}