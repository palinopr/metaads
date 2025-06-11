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
import { useMultiAccountStore } from '@/lib/multi-account-store'

export default function PortfolioContent() {
  const [activeTab, setActiveTab] = useState('overview')
  
  const {
    accounts,
    activeAccount,
    accountGroups,
    bulkOperations,
    getConsolidatedMetrics
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

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAccounts}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeAccounts} active, {metrics.pausedAccounts} paused
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalSpend.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg: ${metrics.avgSpendPerAccount.toLocaleString()}/account
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600">
              {metrics.avgROAS.toFixed(2)}x ROAS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalConversions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${metrics.avgCPA.toFixed(2)} CPA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgCTR.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              Avg CTR across portfolio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="reporting">
            <FileText className="h-4 w-4 mr-2" />
            Reporting
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <MultiAccountPortfolio />
        </TabsContent>

        <TabsContent value="reporting" className="space-y-4">
          <ConsolidatedReporting />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <CrossAccountAnalytics />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <AccountPermissionsManager />
        </TabsContent>
      </Tabs>

      {/* Status Bar */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span>System Status: Operational</span>
              </div>
              <div className="text-muted-foreground">
                Last Sync: {featureStats.lastSync}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{featureStats.totalAccounts} Accounts</Badge>
              <Badge variant="outline">{featureStats.activeGroups} Groups</Badge>
              {featureStats.pendingOperations > 0 && (
                <Badge variant="secondary">
                  {featureStats.pendingOperations} Pending Operations
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}