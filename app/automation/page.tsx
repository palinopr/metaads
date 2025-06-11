"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AutomationRules } from "@/components/automation-rules"
import { AutomatedReporting } from "@/components/automated-reporting"
import { ReportBuilder } from "@/components/report-builder"
import { NotificationPreferences } from "@/components/notification-preferences"
import { BudgetAlerts } from "@/components/budget-alerts"
import { 
  ArrowLeft,
  Zap,
  FileText,
  Bell,
  Settings,
  BarChart3,
  DollarSign
} from "lucide-react"

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState('rules')

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="h-8 w-8" />
              Automation & Reporting
            </h1>
            <p className="text-muted-foreground">
              Automate your campaigns and generate intelligent reports
            </p>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="rules" className="gap-2">
              <Zap className="h-4 w-4" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="budget" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Budget Alerts
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="builder" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="mt-6">
            <AutomationRules />
          </TabsContent>

          <TabsContent value="budget" className="mt-6">
            <BudgetAlerts />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <AutomatedReporting />
          </TabsContent>

          <TabsContent value="builder" className="mt-6">
            <ReportBuilder />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <NotificationPreferences />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}