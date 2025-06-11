'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-picker-with-range"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Download, FileText, Calendar, Filter, TrendingUp, DollarSign,
  Target, Users, BarChart3, PieChart, Activity, AlertCircle
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ScatterChart, Scatter
} from 'recharts'
import { useMultiAccountStore } from '@/lib/multi-account-store'
import { DateRange } from 'react-day-picker'
import { addDays, format } from 'date-fns'

interface ReportMetrics {
  totalSpend: number
  totalRevenue: number
  totalConversions: number
  totalImpressions: number
  totalClicks: number
  averageRoas: number
  averageCtr: number
  averageCpc: number
  accountPerformance: {
    accountId: string
    name: string
    spend: number
    revenue: number
    conversions: number
    roas: number
  }[]
  dailyTrends: {
    date: string
    spend: number
    revenue: number
    conversions: number
  }[]
  campaignTypeBreakdown: {
    type: string
    count: number
    spend: number
    revenue: number
  }[]
}

export function ConsolidatedReporting() {
  const {
    accounts,
    accountGroups,
    getAccountsByGroup,
    getConsolidatedMetrics
  } = useMultiAccountStore()

  const [reportType, setReportType] = useState<'portfolio' | 'comparison' | 'trend'>('portfolio')
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date()
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportProgress, setReportProgress] = useState(0)

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const selectAllAccounts = () => {
    setSelectedAccounts(accounts.map(acc => acc.id))
  }

  const clearSelection = () => {
    setSelectedAccounts([])
    setSelectedGroups([])
  }

  const generateReport = async () => {
    setIsGenerating(true)
    setReportProgress(0)

    // Simulate report generation with progress
    for (let i = 0; i <= 100; i += 10) {
      setReportProgress(i)
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    setIsGenerating(false)
    // In a real implementation, this would generate and download the report
  }

  // Get accounts based on selection
  const getSelectedAccounts = () => {
    const accountsFromGroups = selectedGroups.flatMap(groupId =>
      getAccountsByGroup(groupId).map(acc => acc.id)
    )
    const allSelectedIds = [...new Set([...selectedAccounts, ...accountsFromGroups])]
    return accounts.filter(acc => allSelectedIds.includes(acc.id))
  }

  const selectedAccountsData = getSelectedAccounts()
  const hasSelection = selectedAccountsData.length > 0

  // Calculate metrics for selected accounts
  const calculateMetrics = (): ReportMetrics => {
    const accounts = hasSelection ? selectedAccountsData : accounts
    
    const totalSpend = accounts.reduce((sum, acc) => sum + (acc.metrics?.spend || 0), 0)
    const totalRevenue = accounts.reduce((sum, acc) => sum + (acc.metrics?.revenue || 0), 0)
    const totalConversions = accounts.reduce((sum, acc) => sum + (acc.metrics?.conversions || 0), 0)
    const totalImpressions = accounts.reduce((sum, acc) => sum + (acc.metrics?.impressions || 0), 0)
    const totalClicks = accounts.reduce((sum, acc) => sum + (acc.metrics?.clicks || 0), 0)

    return {
      totalSpend,
      totalRevenue,
      totalConversions,
      totalImpressions,
      totalClicks,
      averageRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      averageCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      averageCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      accountPerformance: accounts.map(acc => ({
        accountId: acc.id,
        name: acc.name,
        spend: acc.metrics?.spend || 0,
        revenue: acc.metrics?.revenue || 0,
        conversions: acc.metrics?.conversions || 0,
        roas: acc.metrics?.roas || 0
      })),
      dailyTrends: generateDailyTrends(),
      campaignTypeBreakdown: generateCampaignTypeBreakdown()
    }
  }

  // Generate sample daily trends data
  const generateDailyTrends = () => {
    const days = 30
    const trends = []
    for (let i = 0; i < days; i++) {
      trends.push({
        date: format(addDays(new Date(), -days + i), 'MMM dd'),
        spend: Math.floor(Math.random() * 5000) + 1000,
        revenue: Math.floor(Math.random() * 15000) + 3000,
        conversions: Math.floor(Math.random() * 100) + 20
      })
    }
    return trends
  }

  // Generate sample campaign type breakdown
  const generateCampaignTypeBreakdown = () => {
    return [
      { type: 'Conversion', count: 45, spend: 25000, revenue: 75000 },
      { type: 'Traffic', count: 30, spend: 15000, revenue: 35000 },
      { type: 'Awareness', count: 20, spend: 10000, revenue: 18000 },
      { type: 'Engagement', count: 15, spend: 8000, revenue: 22000 }
    ]
  }

  const metrics = calculateMetrics()

  const pieData = metrics.accountPerformance.map((acc, index) => ({
    name: acc.name,
    value: acc.revenue,
    fill: `hsl(${index * 137.5 % 360}, 70%, 50%)`
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Consolidated Reporting</h2>
          <p className="text-muted-foreground">Generate comprehensive reports across multiple accounts</p>
        </div>
        <Button
          onClick={generateReport}
          disabled={isGenerating}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {isGenerating && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Generating report...</span>
                <span className="text-sm text-muted-foreground">{reportProgress}%</span>
              </div>
              <Progress value={reportProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portfolio">Portfolio Overview</SelectItem>
                  <SelectItem value="comparison">Account Comparison</SelectItem>
                  <SelectItem value="trend">Trend Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Date Range</Label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            
            <div>
              <Label>Export Format</Label>
              <Select defaultValue="pdf">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  <SelectItem value="csv">CSV Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Select Accounts</Label>
            <div className="mt-2 space-y-2">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAllAccounts}>
                  Select All
                </Button>
                <Button size="sm" variant="outline" onClick={clearSelection}>
                  Clear Selection
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {accounts.map(account => (
                  <div key={account.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={account.id}
                      checked={selectedAccounts.includes(account.id)}
                      onCheckedChange={() => handleAccountToggle(account.id)}
                    />
                    <Label
                      htmlFor={account.id}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {account.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {accountGroups.length > 0 && (
            <div>
              <Label>Select Groups</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {accountGroups.map(group => (
                  <Badge
                    key={group.id}
                    variant={selectedGroups.includes(group.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleGroupToggle(group.id)}
                  >
                    {group.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="preview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="preview">Report Preview</TabsTrigger>
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="charts">Visual Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Report Period</h4>
                  <p className="text-sm text-muted-foreground">
                    {dateRange?.from && format(dateRange.from, 'MMM dd, yyyy')} - 
                    {dateRange?.to && format(dateRange.to, 'MMM dd, yyyy')}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Accounts Included</h4>
                  <p className="text-sm text-muted-foreground">
                    {hasSelection ? `${selectedAccountsData.length} accounts selected` : 'All accounts'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spend</p>
                    <p className="text-xl font-bold">${metrics.totalSpend.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-xl font-bold">${metrics.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overall ROAS</p>
                    <p className="text-xl font-bold">{metrics.averageRoas.toFixed(2)}x</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Conversions</p>
                    <p className="text-xl font-bold">{metrics.totalConversions.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Average CTR</p>
                    <p className="text-2xl font-bold">{metrics.averageCtr.toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Average CPC</p>
                    <p className="text-2xl font-bold">${metrics.averageCpc.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Account Performance Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Account</th>
                      <th className="text-right p-2">Spend</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">ROAS</th>
                      <th className="text-right p-2">Conversions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.accountPerformance.map(acc => (
                      <tr key={acc.accountId} className="border-b">
                        <td className="p-2">{acc.name}</td>
                        <td className="text-right p-2">${acc.spend.toLocaleString()}</td>
                        <td className="text-right p-2">${acc.revenue.toLocaleString()}</td>
                        <td className="text-right p-2">{acc.roas.toFixed(2)}x</td>
                        <td className="text-right p-2">{acc.conversions.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" />
                    <Line type="monotone" dataKey="spend" stroke="#ef4444" name="Spend" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Campaign Type Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.campaignTypeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="spend" fill="#ef4444" name="Spend" />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}