"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bug, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Copy,
  Download 
} from 'lucide-react'
import { formatAccessToken, formatAdAccountId, MetaAPIClient } from '@/lib/meta-api-client'

interface DebugPanelProps {
  accessToken: string
  adAccountId: string
  isOpen: boolean
  onClose: () => void
}

interface LogEntry {
  timestamp: string
  type: 'info' | 'error' | 'success' | 'warning'
  message: string
  data?: any
}

export function DebugPanel({ accessToken, adAccountId, isOpen, onClose }: DebugPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isDebugging, setIsDebugging] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [accountInfo, setAccountInfo] = useState<any>(null)

  useEffect(() => {
    const debugEnabled = localStorage.getItem('debug') === 'true'
    setIsDebugging(debugEnabled)
  }, [])

  const addLog = (type: LogEntry['type'], message: string, data?: any) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    }])
  }

  const toggleDebug = (enabled: boolean) => {
    setIsDebugging(enabled)
    localStorage.setItem('debug', enabled.toString())
    addLog('info', `Debug mode ${enabled ? 'enabled' : 'disabled'}`)
  }

  const testConnection = async () => {
    setConnectionStatus('testing')
    setLogs([])
    
    try {
      // Log token format
      addLog('info', 'Checking token format...')
      const formattedToken = formatAccessToken(accessToken)
      const isBearer = formattedToken.startsWith('Bearer ')
      addLog(isBearer ? 'success' : 'warning', `Token format: ${isBearer ? 'Has Bearer prefix' : 'Added Bearer prefix'}`)

      // Log account ID format
      addLog('info', 'Checking account ID format...')
      const formattedAccountId = formatAdAccountId(adAccountId)
      const hasPrefix = formattedAccountId.startsWith('act_')
      addLog(hasPrefix ? 'success' : 'warning', `Account ID: ${formattedAccountId}`)

      // Test API connection
      addLog('info', 'Testing API connection...')
      const client = new MetaAPIClient(accessToken, adAccountId, true)
      const result = await client.testConnection()

      if (result.success) {
        setConnectionStatus('success')
        setAccountInfo(result.accountInfo)
        addLog('success', 'Connection successful!', result.accountInfo)
      } else {
        setConnectionStatus('error')
        addLog('error', 'Connection failed', result.error)
      }
    } catch (error) {
      setConnectionStatus('error')
      addLog('error', 'Unexpected error', error instanceof Error ? error.message : error)
    }
  }

  const copyLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
    ).join('\n\n')
    
    navigator.clipboard.writeText(logText)
    addLog('info', 'Logs copied to clipboard')
  }

  const downloadLogs = () => {
    const logData = {
      timestamp: new Date().toISOString(),
      accessToken: accessToken.substring(0, 20) + '...',
      adAccountId,
      logs,
      accountInfo
    }
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meta-ads-debug-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <Card className="fixed bottom-4 right-4 w-[600px] max-h-[600px] shadow-xl z-50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug Panel
        </CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor="debug-mode">Debug Mode</Label>
          <Switch
            id="debug-mode"
            checked={isDebugging}
            onCheckedChange={toggleDebug}
          />
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="connection" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="info">Account Info</TabsTrigger>
          </TabsList>
          
          <TabsContent value="connection" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Connection Status</span>
                <Badge variant={
                  connectionStatus === 'success' ? 'default' :
                  connectionStatus === 'error' ? 'destructive' :
                  connectionStatus === 'testing' ? 'secondary' : 'outline'
                }>
                  {connectionStatus === 'success' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {connectionStatus === 'error' && <XCircle className="h-3 w-3 mr-1" />}
                  {connectionStatus === 'testing' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                  {connectionStatus === 'idle' && <AlertCircle className="h-3 w-3 mr-1" />}
                  {connectionStatus}
                </Badge>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Access Token:</span>
                  <code className="bg-muted px-2 py-0.5 rounded text-xs">
                    {accessToken.substring(0, 20)}...
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account ID:</span>
                  <code className="bg-muted px-2 py-0.5 rounded text-xs">{adAccountId}</code>
                </div>
              </div>
              
              <Button 
                onClick={testConnection} 
                disabled={connectionStatus === 'testing'}
                className="w-full"
              >
                {connectionStatus === 'testing' ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="logs" className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                {logs.length} log entries
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyLogs}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                <Button size="sm" variant="outline" onClick={downloadLogs}>
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No logs yet. Test the connection to see logs.</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div key={index} className="text-xs space-y-1">
                      <div className="flex items-start gap-2">
                        {log.type === 'success' && <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />}
                        {log.type === 'error' && <XCircle className="h-3 w-3 text-red-500 mt-0.5" />}
                        {log.type === 'warning' && <AlertCircle className="h-3 w-3 text-yellow-500 mt-0.5" />}
                        {log.type === 'info' && <AlertCircle className="h-3 w-3 text-blue-500 mt-0.5" />}
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{log.message}</span>
                            <span className="text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {log.data && (
                            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="info">
            {accountInfo ? (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Account Information</h4>
                <pre className="p-4 bg-muted rounded text-xs overflow-x-auto">
                  {JSON.stringify(accountInfo, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Test the connection to see account information.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}