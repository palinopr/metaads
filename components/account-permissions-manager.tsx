'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Shield, Users, Settings, Lock, Unlock, Eye, EyeOff,
  Plus, Minus, AlertTriangle, CheckCircle, UserPlus,
  Key, Edit, Trash2, Copy, Calendar
} from 'lucide-react'
import { useMultiAccountStore, AccountPermission } from '@/lib/multi-account-store'

interface UserRole {
  id: string
  name: string
  description: string
  permissions: AccountPermission
  accounts: string[]
  createdAt: string
  updatedAt: string
}

interface PermissionTemplate {
  id: string
  name: string
  description: string
  permissions: AccountPermission
}

interface AccessLog {
  id: string
  userId: string
  userEmail: string
  accountId: string
  action: string
  timestamp: string
  success: boolean
  details?: string
}

const permissionTemplates: PermissionTemplate[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access to all features',
    permissions: {
      canView: true,
      canEdit: true,
      canDelete: true,
      canManageBudget: true,
      canRunAds: true,
      canExport: true
    }
  },
  {
    id: 'manager',
    name: 'Account Manager',
    description: 'Can manage campaigns and budgets',
    permissions: {
      canView: true,
      canEdit: true,
      canDelete: false,
      canManageBudget: true,
      canRunAds: true,
      canExport: true
    }
  },
  {
    id: 'analyst',
    name: 'Data Analyst',
    description: 'View and export data only',
    permissions: {
      canView: true,
      canEdit: false,
      canDelete: false,
      canManageBudget: false,
      canRunAds: false,
      canExport: true
    }
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access',
    permissions: {
      canView: true,
      canEdit: false,
      canDelete: false,
      canManageBudget: false,
      canRunAds: false,
      canExport: false
    }
  }
]

export function AccountPermissionsManager() {
  const {
    accounts,
    updatePermissions,
    updateAccount
  } = useMultiAccountStore()

  const [userRoles, setUserRoles] = useState<UserRole[]>([
    {
      id: '1',
      name: 'John Doe',
      description: 'Marketing Manager',
      permissions: permissionTemplates[1].permissions,
      accounts: accounts.slice(0, 3).map(acc => acc.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Jane Smith',
      description: 'Data Analyst',
      permissions: permissionTemplates[2].permissions,
      accounts: accounts.map(acc => acc.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ])

  const [accessLogs] = useState<AccessLog[]>([
    {
      id: '1',
      userId: '1',
      userEmail: 'john@company.com',
      accountId: accounts[0]?.id || '',
      action: 'Campaign Updated',
      timestamp: new Date().toISOString(),
      success: true
    },
    {
      id: '2',
      userId: '2',
      userEmail: 'jane@company.com',
      accountId: accounts[1]?.id || '',
      action: 'Data Export',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      success: true
    },
    {
      id: '3',
      userId: '1',
      userEmail: 'john@company.com',
      accountId: accounts[0]?.id || '',
      action: 'Budget Update Failed',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      success: false,
      details: 'Insufficient permissions'
    }
  ])

  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [showAddRole, setShowAddRole] = useState(false)
  const [showBulkUpdate, setShowBulkUpdate] = useState(false)
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: permissionTemplates[3].permissions,
    accounts: [] as string[]
  })

  const handleTemplateApply = (accountId: string, templateId: string) => {
    const template = permissionTemplates.find(t => t.id === templateId)
    if (template) {
      updatePermissions(accountId, template.permissions)
    }
  }

  const handleBulkPermissionUpdate = (permissions: Partial<AccountPermission>) => {
    accounts.forEach(account => {
      updatePermissions(account.id, permissions)
    })
    setShowBulkUpdate(false)
  }

  const addUserRole = () => {
    if (newRole.name) {
      const role: UserRole = {
        id: Date.now().toString(),
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions,
        accounts: newRole.accounts,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setUserRoles([...userRoles, role])
      setNewRole({
        name: '',
        description: '',
        permissions: permissionTemplates[3].permissions,
        accounts: []
      })
      setShowAddRole(false)
    }
  }

  const updateUserRole = (roleId: string, updates: Partial<UserRole>) => {
    setUserRoles(roles =>
      roles.map(role =>
        role.id === roleId
          ? { ...role, ...updates, updatedAt: new Date().toISOString() }
          : role
      )
    )
  }

  const deleteUserRole = (roleId: string) => {
    setUserRoles(roles => roles.filter(role => role.id !== roleId))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Permission Management</h2>
          <p className="text-muted-foreground">Manage account access and user permissions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkUpdate(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Bulk Update
          </Button>
          <Button
            onClick={() => setShowAddRole(true)}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add User Role
          </Button>
        </div>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Account Permissions</TabsTrigger>
          <TabsTrigger value="roles">User Roles</TabsTrigger>
          <TabsTrigger value="templates">Permission Templates</TabsTrigger>
          <TabsTrigger value="logs">Access Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account-Level Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accounts.map(account => (
                  <div key={account.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold">{account.name}</h4>
                        <p className="text-sm text-muted-foreground">ID: {account.accountId}</p>
                      </div>
                      <div className="flex gap-2">
                        <Select onValueChange={(templateId) => handleTemplateApply(account.id, templateId)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Apply template" />
                          </SelectTrigger>
                          <SelectContent>
                            {permissionTemplates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`view-${account.id}`} className="text-sm font-normal">
                          View Data
                        </Label>
                        <Switch
                          id={`view-${account.id}`}
                          checked={account.permissions.canView}
                          onCheckedChange={(checked) => 
                            updatePermissions(account.id, { canView: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`edit-${account.id}`} className="text-sm font-normal">
                          Edit Campaigns
                        </Label>
                        <Switch
                          id={`edit-${account.id}`}
                          checked={account.permissions.canEdit}
                          onCheckedChange={(checked) => 
                            updatePermissions(account.id, { canEdit: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`delete-${account.id}`} className="text-sm font-normal">
                          Delete Campaigns
                        </Label>
                        <Switch
                          id={`delete-${account.id}`}
                          checked={account.permissions.canDelete}
                          onCheckedChange={(checked) => 
                            updatePermissions(account.id, { canDelete: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`budget-${account.id}`} className="text-sm font-normal">
                          Manage Budget
                        </Label>
                        <Switch
                          id={`budget-${account.id}`}
                          checked={account.permissions.canManageBudget}
                          onCheckedChange={(checked) => 
                            updatePermissions(account.id, { canManageBudget: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`ads-${account.id}`} className="text-sm font-normal">
                          Run Ads
                        </Label>
                        <Switch
                          id={`ads-${account.id}`}
                          checked={account.permissions.canRunAds}
                          onCheckedChange={(checked) => 
                            updatePermissions(account.id, { canRunAds: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`export-${account.id}`} className="text-sm font-normal">
                          Export Data
                        </Label>
                        <Switch
                          id={`export-${account.id}`}
                          checked={account.permissions.canExport}
                          onCheckedChange={(checked) => 
                            updatePermissions(account.id, { canExport: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4">
            {userRoles.map(role => (
              <Card key={role.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{role.name}</h4>
                        <Badge variant="outline">
                          {role.accounts.length} accounts
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.canView && <Badge variant="secondary">View</Badge>}
                          {role.permissions.canEdit && <Badge variant="secondary">Edit</Badge>}
                          {role.permissions.canDelete && <Badge variant="destructive">Delete</Badge>}
                          {role.permissions.canManageBudget && <Badge variant="secondary">Budget</Badge>}
                          {role.permissions.canRunAds && <Badge variant="secondary">Run Ads</Badge>}
                          {role.permissions.canExport && <Badge variant="secondary">Export</Badge>}
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(role.createdAt).toLocaleDateString()}
                          {role.updatedAt !== role.createdAt && (
                            <span> • Updated: {new Date(role.updatedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteUserRole(role.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {permissionTemplates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    {template.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {template.permissions.canView && <Badge variant="secondary">View</Badge>}
                      {template.permissions.canEdit && <Badge variant="secondary">Edit</Badge>}
                      {template.permissions.canDelete && <Badge variant="destructive">Delete</Badge>}
                      {template.permissions.canManageBudget && <Badge variant="secondary">Budget</Badge>}
                      {template.permissions.canRunAds && <Badge variant="secondary">Run Ads</Badge>}
                      {template.permissions.canExport && <Badge variant="secondary">Export</Badge>}
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <Select onValueChange={(accountId) => handleTemplateApply(accountId, template.id)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Apply to account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        accounts.forEach(account => {
                          updatePermissions(account.id, template.permissions)
                        })
                      }}
                    >
                      Apply to All Accounts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Access Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accessLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.userEmail}</span>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm">{log.action}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {accounts.find(acc => acc.id === log.accountId)?.name || 'Unknown Account'}
                          {log.details && <span> • {log.details}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Role Dialog */}
      <Dialog open={showAddRole} onOpenChange={setShowAddRole}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add User Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newRole.name}
                  onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                  placeholder="User name"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                  placeholder="Role description"
                />
              </div>
            </div>
            
            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">View Data</Label>
                  <Switch
                    checked={newRole.permissions.canView}
                    onCheckedChange={(checked) => 
                      setNewRole({
                        ...newRole,
                        permissions: { ...newRole.permissions, canView: checked }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">Edit Campaigns</Label>
                  <Switch
                    checked={newRole.permissions.canEdit}
                    onCheckedChange={(checked) => 
                      setNewRole({
                        ...newRole,
                        permissions: { ...newRole.permissions, canEdit: checked }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">Delete Campaigns</Label>
                  <Switch
                    checked={newRole.permissions.canDelete}
                    onCheckedChange={(checked) => 
                      setNewRole({
                        ...newRole,
                        permissions: { ...newRole.permissions, canDelete: checked }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">Manage Budget</Label>
                  <Switch
                    checked={newRole.permissions.canManageBudget}
                    onCheckedChange={(checked) => 
                      setNewRole({
                        ...newRole,
                        permissions: { ...newRole.permissions, canManageBudget: checked }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">Run Ads</Label>
                  <Switch
                    checked={newRole.permissions.canRunAds}
                    onCheckedChange={(checked) => 
                      setNewRole({
                        ...newRole,
                        permissions: { ...newRole.permissions, canRunAds: checked }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">Export Data</Label>
                  <Switch
                    checked={newRole.permissions.canExport}
                    onCheckedChange={(checked) => 
                      setNewRole({
                        ...newRole,
                        permissions: { ...newRole.permissions, canExport: checked }
                      })
                    }
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label>Account Access</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {accounts.map(account => (
                  <div key={account.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={account.id}
                      checked={newRole.accounts.includes(account.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewRole({
                            ...newRole,
                            accounts: [...newRole.accounts, account.id]
                          })
                        } else {
                          setNewRole({
                            ...newRole,
                            accounts: newRole.accounts.filter(id => id !== account.id)
                          })
                        }
                      }}
                    />
                    <Label htmlFor={account.id} className="text-sm">
                      {account.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={addUserRole} className="flex-1">Add Role</Button>
              <Button variant="outline" onClick={() => setShowAddRole(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={showBulkUpdate} onOpenChange={setShowBulkUpdate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Permission Update</DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will update permissions for ALL accounts. Use with caution.
            </AlertDescription>
          </Alert>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => handleBulkPermissionUpdate({ canView: true, canEdit: false, canDelete: false, canManageBudget: false, canRunAds: false, canExport: false })}
              >
                Set All to View Only
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkPermissionUpdate({ canView: true, canEdit: true, canDelete: false, canManageBudget: true, canRunAds: true, canExport: true })}
              >
                Set All to Manager
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkPermissionUpdate({ canView: true, canEdit: true, canDelete: true, canManageBudget: true, canRunAds: true, canExport: true })}
              >
                Set All to Admin
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleBulkPermissionUpdate({ canView: false, canEdit: false, canDelete: false, canManageBudget: false, canRunAds: false, canExport: false })}
              >
                Revoke All Access
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}