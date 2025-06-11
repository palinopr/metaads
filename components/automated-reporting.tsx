'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { 
  FileText, 
  Send, 
  Calendar, 
  Users, 
  Download, 
  Clock, 
  Mail, 
  Settings2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Eye,
  Trash2,
  Copy,
  Edit,
  FileDown,
  Globe,
  Bell,
  Zap
} from 'lucide-react'
import { ReportExporter, ReportData, formatters } from '@/lib/report-exporter'
import { notificationManager } from '@/lib/notification-manager'
import { format } from 'date-fns'
import { toast } from "@/components/ui/use-toast"

interface Report {
  id: string
  name: string
  type: 'performance' | 'insights' | 'forecast' | 'comparison'
  frequency: 'daily' | 'weekly' | 'monthly'
  recipients: string[]
  template: string
  enabled: boolean
  lastSent: string
  nextSend: string
  metrics: string[]
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  content: string
  metrics: string[]
}

export function AutomatedReporting() {
  const [reports, setReports] = useState<Report[]>([])
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('reports')

  const defaultTemplates: ReportTemplate[] = [
    {
      id: 'performance',
      name: 'Performance Summary',
      description: 'Weekly overview of campaign performance with key metrics',
      content: `# Campaign Performance Report - Week of {{date}}

## Executive Summary
- Total Revenue: {{totalRevenue}}
- Total Spend: {{totalSpend}}
- ROAS: {{avgROAS}}
- Active Campaigns: {{activeCampaigns}}

## Top Performers
{{topCampaigns}}

## Areas for Improvement
{{insights}}

## Recommendations
{{recommendations}}`,
      metrics: ['revenue', 'spend', 'roas', 'conversions', 'ctr', 'cpc']
    },
    {
      id: 'insights',
      name: 'AI Insights Report',
      description: 'Weekly AI-generated insights and optimization opportunities',
      content: `# AI Insights Report - {{date}}

## Key Insights
{{aiInsights}}

## Optimization Opportunities
{{opportunities}}

## Predicted Performance
{{predictions}}

## Action Items
{{actionItems}}`,
      metrics: ['insights', 'opportunities', 'predictions', 'anomalies']
    },
    {
      id: 'forecast',
      name: 'Performance Forecast',
      description: 'Monthly forecast and budget recommendations',
      content: `# Performance Forecast - {{date}}

## 30-Day Projection
- Projected Revenue: {{projectedRevenue}}
- Projected Spend: {{projectedSpend}}
- Expected ROAS: {{projectedROAS}}

## Budget Recommendations
{{budgetRecommendations}}

## Risk Assessment
{{riskAssessment}}`,
      metrics: ['projectedRevenue', 'projectedSpend', 'projectedROAS', 'confidence']
    }
  ]

  const [newReport, setNewReport] = useState({
    name: '',
    type: 'performance' as Report['type'],
    frequency: 'weekly' as Report['frequency'],
    recipients: [''],
    template: 'performance',
    enabled: true,
    metrics: ['revenue', 'spend', 'roas']
  })

  useEffect(() => {
    setTemplates(defaultTemplates)
    
    // Load saved reports
    const savedReports = localStorage.getItem('automated-reports')
    if (savedReports) {
      setReports(JSON.parse(savedReports))
    } else {
      // Create sample reports
      const sampleReports: Report[] = [
        {
          id: '1',
          name: 'Weekly Performance Summary',
          type: 'performance',
          frequency: 'weekly',
          recipients: ['manager@company.com'],
          template: 'performance',
          enabled: true,
          lastSent: '2024-05-30',
          nextSend: '2024-06-06',
          metrics: ['revenue', 'spend', 'roas', 'conversions']
        },
        {
          id: '2',
          name: 'Monthly AI Insights',
          type: 'insights',
          frequency: 'monthly',
          recipients: ['team@company.com', 'ceo@company.com'],
          template: 'insights',
          enabled: true,
          lastSent: '2024-05-01',
          nextSend: '2024-06-01',
          metrics: ['insights', 'opportunities', 'predictions']
        }
      ]
      setReports(sampleReports)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('automated-reports', JSON.stringify(reports))
  }, [reports])

  const createReport = () => {
    const report: Report = {
      id: Date.now().toString(),
      ...newReport,
      lastSent: 'Never',
      nextSend: getNextSendDate(newReport.frequency)
    }
    setReports([...reports, report])
    setNewReport({
      name: '',
      type: 'performance',
      frequency: 'weekly',
      recipients: [''],
      template: 'performance',
      enabled: true,
      metrics: ['revenue', 'spend', 'roas']
    })
    setIsCreating(false)
  }

  const getNextSendDate = (frequency: string) => {
    const now = new Date()
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString().split('T')[0]
      default:
        return now.toISOString().split('T')[0]
    }
  }

  const toggleReportEnabled = (id: string) => {
    setReports(reports.map(report => 
      report.id === id ? { ...report, enabled: !report.enabled } : report
    ))
  }

  const deleteReport = (id: string) => {
    setReports(reports.filter(report => report.id !== id))
  }

  const sendNow = async (id: string) => {
    const report = reports.find(r => r.id === id)
    if (!report) return
    
    try {
      // Generate report data
      const reportData = await generateReportData(report)
      
      // Send notifications
      await notificationManager.sendNotification(
        `Report: ${report.name}`,
        `Your ${report.name} report has been generated and sent to ${report.recipients.length} recipients.`,
        'info'
      )
      
      // Update report status
      const today = new Date().toISOString().split('T')[0]
      setReports(reports.map(r => 
        r.id === id ? { 
          ...r, 
          lastSent: today,
          nextSend: getNextSendDate(r.frequency)
        } : r
      ))
      
      toast({
        title: "Report sent",
        description: `${report.name} has been sent to all recipients.`
      })
    } catch (error) {
      toast({
        title: "Error sending report",
        description: "Failed to generate or send the report.",
        variant: "destructive"
      })
    }
  }
  
  const generateReportData = async (report: Report): Promise<ReportData> => {
    // This would fetch real data from your API
    const mockData = {
      totalRevenue: '$125,432',
      totalSpend: '$32,145',
      avgROAS: '3.89',
      activeCampaigns: '12',
      topCampaigns: 'Campaign A, Campaign B, Campaign C',
      insights: 'Performance is trending upward with a 15% increase in ROAS',
      recommendations: 'Consider increasing budget for top performers',
      opportunities: 'Scale winning ad sets by 20%',
      predictions: 'Expected 25% growth in next 30 days',
      actionItems: 'Review underperforming campaigns',
      projectedRevenue: '$156,789',
      projectedSpend: '$40,234',
      projectedROAS: '3.90',
      budgetRecommendations: 'Increase daily budget by $500',
      riskAssessment: 'Low risk - performance stable'
    }
    
    const template = templates.find(t => t.id === report.template)
    const content = template?.content.replace(/{{(\w+)}}/g, (match, key) => 
      mockData[key as keyof typeof mockData] || match
    ) || ''
    
    return {
      title: report.name,
      subtitle: `Generated for ${report.recipients.join(', ')}`,
      date: new Date(),
      sections: [
        {
          title: 'Report Content',
          type: 'text',
          data: content
        },
        {
          title: 'Performance Metrics',
          type: 'table',
          data: [
            { metric: 'Revenue', value: '$125,432', change: '+15%' },
            { metric: 'Spend', value: '$32,145', change: '+10%' },
            { metric: 'ROAS', value: '3.89', change: '+5%' },
            { metric: 'Conversions', value: '1,234', change: '+20%' }
          ],
          columns: [
            { key: 'metric', label: 'Metric' },
            { key: 'value', label: 'Value' },
            { key: 'change', label: 'Change' }
          ]
        }
      ]
    }
  }
  
  const exportReport = async (report: Report, format: 'pdf' | 'excel' | 'csv') => {
    try {
      const reportData = await generateReportData(report)
      const blob = await ReportExporter.exportReport(reportData, { format })
      const filename = `${report.name.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.${format}`
      ReportExporter.downloadFile(blob, filename)
      
      toast({
        title: "Report exported",
        description: `${report.name} has been exported as ${format.toUpperCase()}.`
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export the report.",
        variant: "destructive"
      })
    }
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-green-100 text-green-800'
      case 'weekly': return 'bg-blue-100 text-blue-800'
      case 'monthly': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <BarChart3 className="h-4 w-4" />
      case 'insights': return <TrendingUp className="h-4 w-4" />
      case 'forecast': return <Calendar className="h-4 w-4" />
      case 'comparison': return <BarChart3 className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Automated Reporting
          </h2>
          <p className="text-muted-foreground">Schedule and manage automated campaign reports</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <FileText className="h-4 w-4" />
          Create Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="reports">Active Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Report Name</Label>
                    <Input
                      placeholder="Weekly Performance Report"
                      value={newReport.name}
                      onChange={(e) => setNewReport({...newReport, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select value={newReport.type} onValueChange={(value: any) => setNewReport({...newReport, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance">Performance Summary</SelectItem>
                        <SelectItem value="insights">AI Insights</SelectItem>
                        <SelectItem value="forecast">Performance Forecast</SelectItem>
                        <SelectItem value="comparison">Campaign Comparison</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select value={newReport.frequency} onValueChange={(value: any) => setNewReport({...newReport, frequency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Template</Label>
                    <Select value={newReport.template} onValueChange={(value) => setNewReport({...newReport, template: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Recipients (one per line)</Label>
                  <Textarea
                    placeholder="manager@company.com&#10;team@company.com"
                    value={newReport.recipients.join('\n')}
                    onChange={(e) => setNewReport({...newReport, recipients: e.target.value.split('\n').filter(email => email.trim())})}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={createReport}>Create Report</Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(report.type)}
                        <h3 className="text-lg font-semibold">{report.name}</h3>
                        <Badge className={getFrequencyColor(report.frequency)}>
                          {report.frequency}
                        </Badge>
                        {report.enabled ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Paused
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Recipients</p>
                          <p className="font-medium">{report.recipients.length} people</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Sent</p>
                          <p className="font-medium">{report.lastSent}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Next Send</p>
                          <p className="font-medium">{report.nextSend}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Template</p>
                          <p className="font-medium">{templates.find(t => t.id === report.template)?.name || report.template}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {report.metrics.map(metric => (
                          <Badge key={metric} variant="outline" className="text-xs">
                            {metric}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={report.enabled}
                        onCheckedChange={() => toggleReportEnabled(report.id)}
                      />
                      <Button size="sm" variant="outline" onClick={() => sendNow(report.id)}>
                        <Send className="h-3 w-3 mr-1" />
                        Send Now
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSelectedReport(report)}>
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Select onValueChange={(format: any) => exportReport(report, format)}>
                        <SelectTrigger className="w-24">
                          <FileDown className="h-3 w-3 mr-1" />
                          Export
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteReport(report.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {template.metrics.map(metric => (
                      <Badge key={metric} variant="outline" className="text-xs">
                        {metric}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="bg-muted p-3 rounded text-sm font-mono text-xs max-h-32 overflow-y-auto">
                    {template.content.substring(0, 200)}...
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Report Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select defaultValue="America/New_York">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Business Days Only</Label>
                    <Switch defaultChecked />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Upcoming Reports</h4>
                  {reports.filter(r => r.enabled).sort((a, b) => 
                    new Date(a.nextSend).getTime() - new Date(b.nextSend).getTime()
                  ).slice(0, 5).map(report => (
                    <div key={report.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.frequency} • {report.recipients.length} recipients
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{report.nextSend}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(report.nextSend).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send reports via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Slack Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send report summaries to Slack</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>In-App Notifications</Label>
                    <p className="text-sm text-muted-foreground">Show notifications in dashboard</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Automation Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Trigger Reports from Rules</Label>
                    <p className="text-sm text-muted-foreground">Allow automation rules to generate reports</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Rule Context</Label>
                    <p className="text-sm text-muted-foreground">Add automation context to reports</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Frequency</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Send Time</Label>
                  <Input type="time" defaultValue="09:00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Default Recipients</Label>
                <Textarea placeholder="manager@company.com&#10;team@company.com" />
              </div>
              <Button>Save Defaults</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedReport && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Report Preview: {selectedReport.name}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setSelectedReport(null)}>
              Close Preview
            </Button>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded font-mono text-sm whitespace-pre-wrap">
              {templates.find(t => t.id === selectedReport.template)?.content || 'Template not found'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}