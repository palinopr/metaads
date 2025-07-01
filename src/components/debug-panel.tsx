"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchDebugData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/accounts')
      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      console.error('Failed to fetch debug data:', error)
      setDebugData({ error: 'Failed to fetch debug data' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && !debugData) {
      fetchDebugData()
    }
  }, [isOpen])

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-lg">
      <Card className="shadow-lg">
        <CardHeader 
          className="cursor-pointer flex flex-row items-center justify-between py-3"
          onClick={() => setIsOpen(!isOpen)}
        >
          <CardTitle className="text-sm">Debug Panel</CardTitle>
          <div className="flex items-center gap-2">
            {isOpen && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  fetchDebugData()
                }}
                disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </div>
        </CardHeader>
        {isOpen && (
          <CardContent className="max-h-96 overflow-y-auto text-xs font-mono">
            {loading ? (
              <div>Loading debug data...</div>
            ) : debugData ? (
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            ) : (
              <div>No debug data available</div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}