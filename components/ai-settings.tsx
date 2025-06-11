"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Brain, Key, Eye, EyeOff, CheckCircle, 
  AlertCircle, Sparkles
} from 'lucide-react'

export function AISettings() {
  const [claudeApiKey, setClaudeApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [useAIPredictions, setUseAIPredictions] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    const savedKey = localStorage.getItem('claudeApiKey')
    const savedUseAI = localStorage.getItem('useAIPredictions') === 'true'
    
    if (savedKey) {
      setClaudeApiKey(savedKey)
      setIsSaved(true)
    }
    setUseAIPredictions(savedUseAI)
  }, [])

  const handleSave = () => {
    if (claudeApiKey) {
      localStorage.setItem('claudeApiKey', claudeApiKey)
      localStorage.setItem('useAIPredictions', useAIPredictions.toString())
      setIsSaved(true)
      
      // Reload to apply changes
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  const handleClear = () => {
    localStorage.removeItem('claudeApiKey')
    localStorage.removeItem('useAIPredictions')
    setClaudeApiKey('')
    setUseAIPredictions(false)
    setIsSaved(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Prediction Settings
        </CardTitle>
        <CardDescription>
          Configure Claude AI for advanced predictions and insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="claude-key">Claude API Key (Optional)</Label>
          <div className="relative">
            <Input
              id="claude-key"
              type={showKey ? "text" : "password"}
              value={claudeApiKey}
              onChange={(e) => setClaudeApiKey(e.target.value)}
              placeholder="sk-ant-api..."
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Get your API key from{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              console.anthropic.com
            </a>
          </p>
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="use-ai" className="flex items-center gap-2 cursor-pointer">
              <Sparkles className="h-4 w-4" />
              Use AI-Powered Predictions
            </Label>
            <p className="text-sm text-muted-foreground">
              Get more accurate predictions using Claude AI
            </p>
          </div>
          <Switch
            id="use-ai"
            checked={useAIPredictions}
            onCheckedChange={setUseAIPredictions}
            disabled={!claudeApiKey}
          />
        </div>

        {!claudeApiKey && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Using Simple Predictions</strong><br />
              Add a Claude API key to unlock:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Machine learning-based forecasts</li>
                <li>Anomaly detection with explanations</li>
                <li>Custom optimization recommendations</li>
                <li>Competitor analysis insights</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {claudeApiKey && isSaved && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              AI predictions are active! Claude will analyze your campaign data for more accurate forecasts.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!claudeApiKey || isSaved}>
            Save Settings
          </Button>
          {claudeApiKey && (
            <Button variant="outline" onClick={handleClear}>
              Clear API Key
            </Button>
          )}
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">AI Features Status:</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Predictive Analytics</span>
              <Badge variant={claudeApiKey ? "default" : "secondary"}>
                {claudeApiKey ? "AI-Powered" : "Basic"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Anomaly Detection</span>
              <Badge variant={claudeApiKey ? "default" : "secondary"}>
                {claudeApiKey ? "AI-Powered" : "Rule-Based"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Recommendations</span>
              <Badge variant={claudeApiKey ? "default" : "secondary"}>
                {claudeApiKey ? "Personalized" : "Generic"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}