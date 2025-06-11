'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Building2, BarChart3, Settings, FileText, Shield, 
  TrendingUp, Users, Target, DollarSign, Activity
} from 'lucide-react'

import { MultiAccountPortfolio } from '@/components/multi-account-portfolio'
import { ConsolidatedReporting } from '@/components/consolidated-reporting'
import { CrossAccountAnalytics } from '@/components/cross-account-analytics'
import { AccountPermissionsManager } from '@/components/account-permissions-manager'
// import { useMultiAccountStore } from '@/lib/multi-account-store'

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  
  const {
    accounts,
    getConsolidatedMetrics,
    accountGroups,
    bulkOperations
  } = useMultiAccountStore()

  const metrics = getConsolidatedMetrics()
  
  // Demo data for showcasing features
  const featureStats = {
    totalAccounts: accounts.length,
    activeGroups: accountGroups.length,
    pendingOperations: bulkOperations.filter(op => op.status === 'processing').length,
    lastSync: new Date().toLocaleString()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Multi-Account Portfolio Manager</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Comprehensive agency and enterprise-level account management
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Portfolio Value</p>
            <p className="text-2xl font-bold text-green-600">
              ${metrics.totalRevenue.toLocaleString()}
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {metrics.activeAccounts} Active
          </Badge>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Accounts</p>
                <p className="text-xl font-bold">{featureStats.totalAccounts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Account Groups</p>
                <p className="text-xl font-bold">{featureStats.activeGroups}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Operations</p>
                <p className="text-xl font-bold">{featureStats.pendingOperations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg ROAS</p>
                <p className="text-xl font-bold">{metrics.averageRoas.toFixed(2)}x</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Multi-Account Management Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">✅ Multi-Account Switching</h4>
              <p className="text-sm text-muted-foreground">
                Seamlessly switch between accounts with unified dashboard view
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">✅ Account Grouping & Labels</h4>
              <p className="text-sm text-muted-foreground">
                Organize accounts by client, industry, or custom categories
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">✅ Cross-Account Analytics</h4>
              <p className="text-sm text-muted-foreground">
                Advanced analytics with correlations and predictive insights
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">✅ Bulk Operations</h4>
              <p className="text-sm text-muted-foreground">
                Pause, resume, or update multiple accounts simultaneously
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">✅ Permission Management</h4>
              <p className="text-sm text-muted-foreground">
                Granular access control with role-based permissions
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">✅ Consolidated Reporting</h4>
              <p className="text-sm text-muted-foreground">
                Generate comprehensive reports across all accounts
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">✅ Account-Level Budgeting</h4>
              <p className="text-sm text-muted-foreground">
                Set and monitor budgets with automated alerts
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">✅ Performance Comparison</h4>
              <p className="text-sm text-muted-foreground">
                Compare accounts side-by-side with visual analytics
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">✅ Portfolio Tracking</h4>
              <p className="text-sm text-muted-foreground">
                Track overall portfolio performance and trends
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Feature Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Portfolio Dashboard
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Cross-Account Analytics
          </TabsTrigger>
          <TabsTrigger value="reporting" className="gap-2">
            <FileText className="h-4 w-4" />
            Consolidated Reports
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <MultiAccountPortfolio />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <CrossAccountAnalytics />
        </TabsContent>

        <TabsContent value="reporting" className="space-y-6">
          <ConsolidatedReporting />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <AccountPermissionsManager />
        </TabsContent>
      </Tabs>

      {/* Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">🎯 Key Features Implemented:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Multi-account switching with centralized state management</li>
              <li>Account aggregation views with filtering and grouping</li>
              <li>Cross-account analytics with correlation analysis</li>
              <li>Account-level permissions with role-based access control</li>
              <li>Portfolio performance tracking with real-time metrics</li>
              <li>Bulk operations across multiple accounts</li>
              <li>Account grouping and labeling for organization</li>
              <li>Consolidated reporting with export capabilities</li>
              <li>Account comparison features with visual charts</li>
              <li>Account-level budgeting with automated alerts</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">🔧 Technical Architecture:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Zustand store for multi-account state management</li>
              <li>Persistent storage with localStorage integration</li>
              <li>Optimized Meta API client with caching and rate limiting</li>
              <li>Real-time synchronization across accounts</li>
              <li>Comprehensive permissions system</li>
              <li>Advanced analytics with predictive insights</li>
              <li>Responsive UI with dark/light theme support</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">🚀 Enterprise Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Agency-level account management</li>
              <li>Client isolation and data security</li>
              <li>Audit logs and access tracking</li>
              <li>Automated reporting and alerts</li>
              <li>Performance benchmarking</li>
              <li>Cost optimization recommendations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}