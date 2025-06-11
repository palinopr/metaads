'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  PlusCircle, Building2, TrendingUp, DollarSign, Target, BarChart3, Users,
  Settings, Filter, Download, Upload, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Folder, Tag, Shield, Zap, ArrowUpDown, Eye, EyeOff
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { useMultiAccountStore, Account, AccountGroup, BulkOperation, AccountPermission } from '@/lib/multi-account-store'

export function MultiAccountPortfolio() {
  const {
    accounts,
    selectedAccountId,
    accountGroups,
    bulkOperations,
    isLoading,
    isSyncing,
    error,
    viewMode,
    comparisonAccountIds,
    addAccount,
    updateAccount,
    removeAccount,
    switchAccount,
    createGroup,
    updateGroup,
    deleteGroup,
    addAccountToGroup,
    removeAccountFromGroup,
    addLabel,
    removeLabel,
    updateAccountBudget,
    setBudgetAlert,
    updatePermissions,
    executeBulkOperation,
    syncAllAccounts,
    syncAccount,
    setComparisonAccounts,
    clearComparison,
    getAccountById,
    getAccountsByGroup,
    getAccountsByLabel,
    getConsolidatedMetrics,
    getAccountComparison,
    clearError,
    setViewMode
  } = useMultiAccountStore()

  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showGroupDialog, setShowGroupDialog] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [filterLabel, setFilterLabel] = useState<string>('all')
  const [showPermissions, setShowPermissions] = useState<string | null>(null)
  
  const [newAccount, setNewAccount] = useState({
    name: '',
    accountId: '',
    accessToken: '',
    permissions: {
      canView: true,
      canEdit: true,
      canDelete: false,
      canManageBudget: true,
      canRunAds: true,
      canExport: true
    } as AccountPermission,
    groups: [] as string[],
    labels: [] as string[]
  })
  
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  })

  const consolidatedMetrics = getConsolidatedMetrics()
  
  // Filter accounts based on selected group and label
  const filteredAccounts = accounts.filter(account => {
    if (filterGroup !== 'all' && !account.groups.includes(filterGroup)) return false
    if (filterLabel !== 'all' && !account.labels.includes(filterLabel)) return false
    return true
  })
  
  // Get unique labels from all accounts
  const allLabels = Array.from(new Set(accounts.flatMap(acc => acc.labels)))

  const handleAddAccount = async () => {
    if (newAccount.name && newAccount.accountId && newAccount.accessToken) {
      await addAccount({
        name: newAccount.name,
        accountId: newAccount.accountId,
        accessToken: newAccount.accessToken,
        status: 'active',
        permissions: newAccount.permissions,
        groups: newAccount.groups,
        labels: newAccount.labels
      })
      setNewAccount({
        name: '',
        accountId: '',
        accessToken: '',
        permissions: {
          canView: true,
          canEdit: true,
          canDelete: false,
          canManageBudget: true,
          canRunAds: true,
          canExport: true
        },
        groups: [],
        labels: []
      })
      setShowAddAccount(false)
    }
  }
  
  const handleCreateGroup = () => {
    if (newGroup.name) {
      createGroup(newGroup)
      setNewGroup({ name: '', description: '', color: '#3b82f6' })
      setShowGroupDialog(false)
    }
  }
  
  const handleBulkAction = async (type: BulkOperation['type']) => {
    if (selectedAccounts.length > 0) {
      await executeBulkOperation({
        type,
        accountIds: selectedAccounts
      })
      setSelectedAccounts([])
      setShowBulkActions(false)
    }
  }
  
  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }
  
  const selectAllAccounts = () => {
    setSelectedAccounts(filteredAccounts.map(acc => acc.id))
  }
  
  const clearSelection = () => {
    setSelectedAccounts([])
  }

  const chartData = filteredAccounts.map(acc => ({
    name: acc.name,
    spend: acc.metrics?.spend || 0,
    revenue: acc.metrics?.revenue || 0,
    roas: acc.metrics?.roas || 0,
    campaigns: acc.metrics?.campaigns || 0,
    ctr: acc.metrics?.ctr || 0,
    cpc: acc.metrics?.cpc || 0
  }))

  const pieData = filteredAccounts.map((acc, index) => ({
    name: acc.name,
    value: acc.metrics?.revenue || 0,
    fill: `hsl(${index * 137.5 % 360}, 70%, 50%)`
  }))
  
  const comparisonData = getAccountComparison().map(({ accountId, metrics }) => {
    const account = getAccountById(accountId)
    return {
      name: account?.name || '',
      roas: metrics?.roas || 0,
      ctr: metrics?.ctr || 0,
      cpc: metrics?.cpc || 0,
      conversions: metrics?.conversions || 0
    }
  })

  // Initialize API clients for accounts on mount
  useEffect(() => {
    accounts.forEach(account => {
      if (!account.apiClient) {
        updateAccount(account.id, {
          apiClient: new (require('@/lib/meta-api-optimized').OptimizedMetaAPI)({
            accessToken: account.accessToken,
            adAccountId: account.accountId
          })
        })
      }
    })
  }, [])
  
  // Auto-sync accounts every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      syncAllAccounts()
    }, 30 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Multi-Account Portfolio Manager</h2>
          <p className="text-muted-foreground">Manage and optimize multiple Meta ad accounts with advanced analytics</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={syncAllAccounts}
            disabled={isSyncing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync All
          </Button>
          <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Folder className="h-4 w-4" />
                Groups
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Account Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Group Name</Label>
                  <Input
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                    placeholder="e.g., E-commerce Clients"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={newGroup.color}
                    onChange={(e) => setNewGroup({...newGroup, color: e.target.value})}
                  />
                </div>
                <Button onClick={handleCreateGroup} className="w-full">
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => setShowAddAccount(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button size="sm" variant="outline" onClick={clearError} className="ml-auto">
            Dismiss
          </Button>
        </Alert>
      )}

      {showAddAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Account Name</Label>
                <Input
                  placeholder="e.g., Main Business Account"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Ad Account ID</Label>
                <Input
                  placeholder="act_123456789"
                  value={newAccount.accountId}
                  onChange={(e) => setNewAccount({...newAccount, accountId: e.target.value})}
                />
              </div>
              <div>
                <Label>Access Token</Label>
                <Input
                  placeholder="Your Meta access token"
                  type="password"
                  value={newAccount.accessToken}
                  onChange={(e) => setNewAccount({...newAccount, accessToken: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label>Groups</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {accountGroups.map(group => (
                  <Badge
                    key={group.id}
                    variant={newAccount.groups.includes(group.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setNewAccount({
                        ...newAccount,
                        groups: newAccount.groups.includes(group.id)
                          ? newAccount.groups.filter(g => g !== group.id)
                          : [...newAccount.groups, group.id]
                      })
                    }}
                  >
                    {group.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <Label>Permissions</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="canEdit" className="text-sm font-normal">Can Edit Campaigns</Label>
                  <Switch
                    id="canEdit"
                    checked={newAccount.permissions.canEdit}
                    onCheckedChange={(checked) => setNewAccount({
                      ...newAccount,
                      permissions: { ...newAccount.permissions, canEdit: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="canManageBudget" className="text-sm font-normal">Can Manage Budget</Label>
                  <Switch
                    id="canManageBudget"
                    checked={newAccount.permissions.canManageBudget}
                    onCheckedChange={(checked) => setNewAccount({
                      ...newAccount,
                      permissions: { ...newAccount.permissions, canManageBudget: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="canRunAds" className="text-sm font-normal">Can Run Ads</Label>
                  <Switch
                    id="canRunAds"
                    checked={newAccount.permissions.canRunAds}
                    onCheckedChange={(checked) => setNewAccount({
                      ...newAccount,
                      permissions: { ...newAccount.permissions, canRunAds: checked }
                    })}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleAddAccount} className="flex-1">Add Account</Button>
              <Button variant="outline" onClick={() => setShowAddAccount(false)} className="flex-1">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Bulk Actions */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select value={filterGroup} onValueChange={setFilterGroup}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {accountGroups.map(group => (
              <SelectItem key={group.id} value={group.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterLabel} onValueChange={setFilterLabel}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by label" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Labels</SelectItem>
            {allLabels.map(label => (
              <SelectItem key={label} value={label}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedAccounts.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="secondary">
              {selectedAccounts.length} selected
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBulkActions(true)}
            >
              <Zap className="h-4 w-4 mr-1" />
              Bulk Actions
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Actions Dialog */}
      <Dialog open={showBulkActions} onOpenChange={setShowBulkActions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => handleBulkAction('pause')}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Pause Campaigns
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => handleBulkAction('resume')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Resume Campaigns
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => handleBulkAction('budget_update')}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Update Budgets
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => handleBulkAction('export')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="comparison">Compare</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">${consolidatedMetrics.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Average ROAS</p>
                    <p className="text-2xl font-bold">{consolidatedMetrics.averageRoas.toFixed(2)}x</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active Accounts</p>
                    <p className="text-2xl font-bold">{consolidatedMetrics.activeAccounts}/{consolidatedMetrics.totalAccounts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Campaigns</p>
                    <p className="text-2xl font-bold">{consolidatedMetrics.totalCampaigns}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg CTR</p>
                    <p className="text-2xl font-bold">{consolidatedMetrics.averageCtr.toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Budget Alerts */}
          {consolidatedMetrics.budgetAlerts.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold">Budget Alerts:</p>
                <ul className="list-disc list-inside mt-2">
                  {consolidatedMetrics.budgetAlerts.map(alert => (
                    <li key={alert.accountId}>
                      {alert.name}: {alert.alert?.type} - {alert.alert?.threshold}% threshold
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue vs Spend by Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'revenue' || name === 'spend' ? `$${Number(value).toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : name === 'spend' ? 'Spend' : name
                    ]} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" />
                    <Bar dataKey="spend" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
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
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* Top and Bottom Performers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {consolidatedMetrics.topPerformers.map((account, index) => (
                    <div key={account.accountId} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{account.name}</span>
                      </div>
                      <Badge variant="default" className="bg-green-500">
                        {account.roas.toFixed(2)}x ROAS
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Need Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {consolidatedMetrics.underperformers.map((account, index) => (
                    <div key={account.accountId} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{account.name}</span>
                      </div>
                      <Badge variant="destructive">
                        {account.roas.toFixed(2)}x ROAS
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          {/* Select All / Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0}
                onCheckedChange={(checked) => checked ? selectAllAccounts() : clearSelection()}
              />
              <Label className="text-sm font-normal">Select All</Label>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredAccounts.length} of {accounts.length} accounts
            </div>
          </div>
          
          {filteredAccounts.map((account) => (
            <Card key={account.id} className={selectedAccounts.includes(account.id) ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Checkbox
                    checked={selectedAccounts.includes(account.id)}
                    onCheckedChange={() => toggleAccountSelection(account.id)}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold">{account.name}</h3>
                          <Badge variant={account.status === 'active' ? 'default' : account.status === 'error' ? 'destructive' : 'secondary'}>
                            {account.status}
                          </Badge>
                          {account.groups.map(groupId => {
                            const group = accountGroups.find(g => g.id === groupId)
                            return group ? (
                              <Badge
                                key={groupId}
                                variant="outline"
                                style={{ borderColor: group.color, color: group.color }}
                              >
                                {group.name}
                              </Badge>
                            ) : null
                          })}
                          {account.labels.map(label => (
                            <Badge key={label} variant="secondary">
                              <Tag className="h-3 w-3 mr-1" />
                              {label}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">Account ID: {account.accountId}</p>
                        {account.lastError && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertDescription>{account.lastError}</AlertDescription>
                          </Alert>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Campaigns</p>
                            <p className="text-xl font-bold">{account.metrics?.campaigns || 0}</p>
                            <p className="text-xs text-muted-foreground">{account.metrics?.activeCampaigns || 0} active</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Spend</p>
                            <p className="text-xl font-bold">${(account.metrics?.spend || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Revenue</p>
                            <p className="text-xl font-bold">${(account.metrics?.revenue || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">ROAS</p>
                            <p className="text-xl font-bold">{(account.metrics?.roas || 0).toFixed(2)}x</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">CTR</p>
                            <p className="text-xl font-bold">{(account.metrics?.ctr || 0).toFixed(2)}%</p>
                          </div>
                        </div>
                        {account.budget && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Budget Usage</span>
                              <span className="text-sm font-medium">
                                ${account.budget.spent.toLocaleString()} / ${(account.budget.daily || account.budget.lifetime || 0).toLocaleString()}
                              </span>
                            </div>
                            <Progress
                              value={(account.budget.spent / (account.budget.daily || account.budget.lifetime || 1)) * 100}
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => switchAccount(account.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => syncAccount(account.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Sync
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowPermissions(account.id)}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Permissions
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeAccount(account.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          {/* Account Selection for Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Select Accounts to Compare</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {accounts.map(account => (
                  <Badge
                    key={account.id}
                    variant={comparisonAccountIds.includes(account.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (comparisonAccountIds.includes(account.id)) {
                        setComparisonAccounts(comparisonAccountIds.filter(id => id !== account.id))
                      } else {
                        setComparisonAccounts([...comparisonAccountIds, account.id])
                      }
                    }}
                  >
                    {account.name}
                  </Badge>
                ))}
              </div>
              {comparisonAccountIds.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearComparison}
                  className="mt-4"
                >
                  Clear Selection
                </Button>
              )}
            </CardContent>
          </Card>
          
          {comparisonAccountIds.length > 1 && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>ROAS & CTR Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="roas" fill="#10b981" name="ROAS" />
                        <Bar yAxisId="right" dataKey="ctr" fill="#3b82f6" name="CTR %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Radar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={comparisonData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="name" />
                        <PolarRadiusAxis />
                        <Radar name="ROAS" dataKey="roas" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                        <Radar name="CTR" dataKey="ctr" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                        <Radar name="CPC" dataKey="cpc" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Comparison Table</CardTitle>
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
                          <th className="text-right p-2">CTR</th>
                          <th className="text-right p-2">CPC</th>
                          <th className="text-right p-2">Conversions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonAccountIds.map(accountId => {
                          const account = getAccountById(accountId)
                          if (!account) return null
                          return (
                            <tr key={account.id} className="border-b">
                              <td className="p-2 font-medium">{account.name}</td>
                              <td className="text-right p-2">${(account.metrics?.spend || 0).toLocaleString()}</td>
                              <td className="text-right p-2">${(account.metrics?.revenue || 0).toLocaleString()}</td>
                              <td className="text-right p-2">{(account.metrics?.roas || 0).toFixed(2)}x</td>
                              <td className="text-right p-2">{(account.metrics?.ctr || 0).toFixed(2)}%</td>
                              <td className="text-right p-2">${(account.metrics?.cpc || 0).toFixed(2)}</td>
                              <td className="text-right p-2">{(account.metrics?.conversions || 0).toLocaleString()}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="roas" stroke="#10b981" name="ROAS" />
                    <Line type="monotone" dataKey="ctr" stroke="#3b82f6" name="CTR" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Cost Efficiency Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cpc" fill="#ef4444" name="CPC" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Account Groups Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accountGroups.map(group => {
                  const groupAccounts = getAccountsByGroup(group.id)
                  const groupMetrics = {
                    totalSpend: groupAccounts.reduce((sum, acc) => sum + (acc.metrics?.spend || 0), 0),
                    totalRevenue: groupAccounts.reduce((sum, acc) => sum + (acc.metrics?.revenue || 0), 0),
                    averageRoas: groupAccounts.length > 0 
                      ? groupAccounts.reduce((sum, acc) => sum + (acc.metrics?.roas || 0), 0) / groupAccounts.length 
                      : 0
                  }
                  
                  return (
                    <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <div>
                          <h4 className="font-semibold">{group.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {groupAccounts.length} accounts • {group.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Spend</p>
                          <p className="font-semibold">${groupMetrics.totalSpend.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Revenue</p>
                          <p className="font-semibold">${groupMetrics.totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Avg ROAS</p>
                          <p className="font-semibold">{groupMetrics.averageRoas.toFixed(2)}x</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="operations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Operations History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bulkOperations.slice(-10).reverse().map(operation => (
                  <div key={operation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={operation.status === 'completed' ? 'default' : operation.status === 'failed' ? 'destructive' : 'secondary'}>
                          {operation.status}
                        </Badge>
                        <span className="font-medium">{operation.type.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {operation.accountIds.length} accounts • {new Date(operation.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {operation.status === 'processing' && (
                        <div className="flex items-center gap-2">
                          <Progress value={operation.progress} className="w-24" />
                          <span className="text-sm">{operation.progress.toFixed(0)}%</span>
                        </div>
                      )}
                      {operation.results && (
                        <div className="text-sm">
                          <span className="text-green-600">
                            {Object.values(operation.results).filter(r => r.success).length} succeeded
                          </span>
                          {Object.values(operation.results).filter(r => !r.success).length > 0 && (
                            <span className="text-red-600 ml-2">
                              {Object.values(operation.results).filter(r => !r.success).length} failed
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  className="h-auto flex-col gap-2 p-4"
                  variant="outline"
                  onClick={() => syncAllAccounts()}
                >
                  <RefreshCw className="h-6 w-6" />
                  <span>Sync All Accounts</span>
                </Button>
                <Button
                  className="h-auto flex-col gap-2 p-4"
                  variant="outline"
                  onClick={() => setShowBulkActions(true)}
                >
                  <Zap className="h-6 w-6" />
                  <span>Bulk Operations</span>
                </Button>
                <Button
                  className="h-auto flex-col gap-2 p-4"
                  variant="outline"
                >
                  <Download className="h-6 w-6" />
                  <span>Export All Data</span>
                </Button>
                <Button
                  className="h-auto flex-col gap-2 p-4"
                  variant="outline"
                >
                  <Upload className="h-6 w-6" />
                  <span>Import Accounts</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Permissions Dialog */}
      <Dialog open={!!showPermissions} onOpenChange={() => setShowPermissions(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account Permissions</DialogTitle>
          </DialogHeader>
          {showPermissions && (() => {
            const account = getAccountById(showPermissions)
            if (!account) return null
            
            return (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">{account.name}</h4>
                  <p className="text-sm text-muted-foreground">Configure permissions for this account</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="perm-view" className="text-sm font-normal">View Account Data</Label>
                    <Switch
                      id="perm-view"
                      checked={account.permissions.canView}
                      onCheckedChange={(checked) => updatePermissions(account.id, { canView: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="perm-edit" className="text-sm font-normal">Edit Campaigns</Label>
                    <Switch
                      id="perm-edit"
                      checked={account.permissions.canEdit}
                      onCheckedChange={(checked) => updatePermissions(account.id, { canEdit: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="perm-delete" className="text-sm font-normal">Delete Campaigns</Label>
                    <Switch
                      id="perm-delete"
                      checked={account.permissions.canDelete}
                      onCheckedChange={(checked) => updatePermissions(account.id, { canDelete: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="perm-budget" className="text-sm font-normal">Manage Budget</Label>
                    <Switch
                      id="perm-budget"
                      checked={account.permissions.canManageBudget}
                      onCheckedChange={(checked) => updatePermissions(account.id, { canManageBudget: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="perm-ads" className="text-sm font-normal">Run Ads</Label>
                    <Switch
                      id="perm-ads"
                      checked={account.permissions.canRunAds}
                      onCheckedChange={(checked) => updatePermissions(account.id, { canRunAds: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="perm-export" className="text-sm font-normal">Export Data</Label>
                    <Switch
                      id="perm-export"
                      checked={account.permissions.canExport}
                      onCheckedChange={(checked) => updatePermissions(account.id, { canExport: checked })}
                    />
                  </div>
                </div>
                
                <Button onClick={() => setShowPermissions(null)} className="w-full">
                  Done
                </Button>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}