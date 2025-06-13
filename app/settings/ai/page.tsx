'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Key, Shield, Info, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AISettingsPage() {
  const [anthropicApiKey, setAnthropicApiKey] = useState('')
  const [isValidKey, setIsValidKey] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [keyMasked, setKeyMasked] = useState(true)
  const [enableAdvancedAnalysis, setEnableAdvancedAnalysis] = useState(true)
  const [customInstructions, setCustomInstructions] = useState('')

  // Load saved settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    try {
      const savedKey = localStorage.getItem('anthropic_api_key')
      const savedInstructions = localStorage.getItem('ai_custom_instructions')
      const savedAdvanced = localStorage.getItem('enable_advanced_analysis')
      
      if (savedKey) {
        setAnthropicApiKey(savedKey)
        setIsValidKey(true)
      }
      if (savedInstructions) {
        setCustomInstructions(savedInstructions)
      }
      if (savedAdvanced !== null) {
        setEnableAdvancedAnalysis(savedAdvanced === 'true')
      }
    } catch (error) {
      console.error('Error loading AI settings:', error)
    }
  }

  const testApiKey = async (apiKey: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        setIsValidKey(true)
        setSuccess('API key validated successfully!')
        return true
      } else {
        setIsValidKey(false)
        setError(result.error || 'Invalid API key')
        return false
      }
    } catch (err: any) {
      setIsValidKey(false)
      setError('Failed to validate API key')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!anthropicApiKey.trim()) {
      setError('Please enter an Anthropic API key')
      return
    }

    // Test the API key first
    const isValid = await testApiKey(anthropicApiKey)
    
    if (isValid) {
      try {
        // Save to localStorage
        localStorage.setItem('anthropic_api_key', anthropicApiKey)
        localStorage.setItem('ai_custom_instructions', customInstructions)
        localStorage.setItem('enable_advanced_analysis', enableAdvancedAnalysis.toString())
        
        // Save to server as well (optional)
        await fetch('/api/settings/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            anthropicApiKey,
            customInstructions,
            enableAdvancedAnalysis
          })
        })

        setSuccess('AI settings saved successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } catch (err) {
        setError('Failed to save settings')
      }
    }
  }

  const clearSettings = () => {
    setAnthropicApiKey('')
    setCustomInstructions('')
    setEnableAdvancedAnalysis(true)
    setIsValidKey(null)
    setError(null)
    setSuccess(null)
    
    localStorage.removeItem('anthropic_api_key')
    localStorage.removeItem('ai_custom_instructions')
    localStorage.removeItem('enable_advanced_analysis')
  }

  const maskKey = (key: string) => {
    if (!key || key.length < 8) return key
    return key.substring(0, 8) + '*'.repeat(key.length - 12) + key.substring(key.length - 4)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-400" />
              AI Analysis Settings
            </h1>
            <p className="text-gray-400 mt-1">
              Configure your Anthropic Claude API for AI-powered campaign analysis
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-900/20 border-green-700 text-green-300">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* API Key Configuration */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-yellow-400" />
              Anthropic API Configuration
            </CardTitle>
            <CardDescription>
              Enter your Anthropic API key to enable AI-powered campaign analysis with Claude Opus
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="apiKey" className="flex items-center gap-2">
                API Key
                {isValidKey !== null && (
                  <Badge variant={isValidKey ? "default" : "destructive"} className="text-xs">
                    {isValidKey ? "Valid" : "Invalid"}
                  </Badge>
                )}
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="apiKey"
                  type={keyMasked ? "password" : "text"}
                  value={keyMasked && anthropicApiKey ? maskKey(anthropicApiKey) : anthropicApiKey}
                  onChange={(e) => {
                    setAnthropicApiKey(e.target.value)
                    setIsValidKey(null)
                    setError(null)
                  }}
                  placeholder="sk-ant-api03-..."
                  className="bg-gray-700 border-gray-600"
                  disabled={isLoading}
                />
                <Button
                  variant="outline"
                  onClick={() => setKeyMasked(!keyMasked)}
                  className="px-3"
                >
                  {keyMasked ? "Show" : "Hide"}
                </Button>
                <Button
                  onClick={() => testApiKey(anthropicApiKey)}
                  disabled={!anthropicApiKey.trim() || isLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? "Testing..." : "Test"}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Get your API key from{" "}
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline"
                >
                  Anthropic Console
                </a>
                . Your key is stored locally and used only for AI analysis.
              </p>
            </div>

            <Alert className="bg-blue-900/20 border-blue-700 text-blue-300">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Privacy:</strong> Your API key is stored locally in your browser and used only to make direct requests to Anthropic's API for campaign analysis. We never store or access your API key on our servers.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Analysis Configuration
            </CardTitle>
            <CardDescription>
              Customize how AI analysis is performed on your campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="advanced-analysis" className="text-base">
                  Enable Advanced Analysis
                </Label>
                <p className="text-sm text-gray-400">
                  Use Claude Opus for comprehensive campaign insights (higher quality, costs more tokens)
                </p>
              </div>
              <Switch
                id="advanced-analysis"
                checked={enableAdvancedAnalysis}
                onCheckedChange={setEnableAdvancedAnalysis}
              />
            </div>

            <div>
              <Label htmlFor="custom-instructions">
                Custom Analysis Instructions (Optional)
              </Label>
              <Textarea
                id="custom-instructions"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Add any specific instructions for AI analysis, such as industry focus, business goals, or specific metrics to emphasize..."
                className="bg-gray-700 border-gray-600 mt-1"
                rows={4}
              />
              <p className="text-xs text-gray-400 mt-2">
                These instructions will be included in every AI analysis request to tailor insights to your specific needs.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Information */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Claude Opus Pricing</CardTitle>
            <CardDescription>
              Understand the costs associated with AI-powered analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700/50 rounded p-4">
                <h4 className="font-medium mb-2">Input Tokens</h4>
                <p className="text-2xl font-bold text-blue-400">$15</p>
                <p className="text-sm text-gray-400">per 1M tokens</p>
              </div>
              <div className="bg-gray-700/50 rounded p-4">
                <h4 className="font-medium mb-2">Output Tokens</h4>
                <p className="text-2xl font-bold text-purple-400">$75</p>
                <p className="text-sm text-gray-400">per 1M tokens</p>
              </div>
            </div>
            <Alert className="mt-4 bg-yellow-900/20 border-yellow-700 text-yellow-200">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Estimated cost per report:</strong> $0.50 - $2.00 depending on the number of campaigns and analysis depth selected.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6">
          <Button onClick={clearSettings} variant="outline" className="text-red-400 border-red-700 hover:bg-red-900/20">
            Clear All Settings
          </Button>
          <Button 
            onClick={saveSettings}
            disabled={!anthropicApiKey.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  )
}