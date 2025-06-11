"use client"

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Info,
  Clock
} from "lucide-react"

export default function ReportsPage() {
  const reportTypes = [
    {
      title: "Campaign Performance Report",
      description: "Detailed analysis of all campaign metrics and KPIs",
      icon: <TrendingUp className="h-6 w-6" />,
      status: "coming-soon"
    },
    {
      title: "Audience Insights Report",
      description: "Demographics and behavior analysis of your target audience",
      icon: <PieChart className="h-6 w-6" />,
      status: "coming-soon"
    },
    {
      title: "Creative Performance Report",
      description: "Analysis of ad creative performance and recommendations",
      icon: <BarChart3 className="h-6 w-6" />,
      status: "coming-soon"
    },
    {
      title: "ROI Analysis Report",
      description: "Return on investment analysis across all campaigns",
      icon: <FileText className="h-6 w-6" />,
      status: "coming-soon"
    }
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Reports
            </h1>
            <p className="text-muted-foreground">
              Generate detailed reports and export your Meta ads performance data
            </p>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            This is a placeholder reports page. Automated reporting features are currently under development.
          </AlertDescription>
        </Alert>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Export Data</h3>
                  <p className="text-sm text-muted-foreground">Download campaign data as CSV</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Schedule Reports</h3>
                  <p className="text-sm text-muted-foreground">Automated daily/weekly reports</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Report History</h3>
                  <p className="text-sm text-muted-foreground">View previously generated reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Available Report Types</CardTitle>
            <CardDescription>
              Choose from various report templates to analyze your campaign performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {reportTypes.map((report, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {report.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{report.title}</h3>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Coming Soon
                    </Badge>
                    <Button disabled variant="outline" size="sm">
                      Generate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Temporary Alternatives */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Current Data Access</CardTitle>
            <CardDescription>
              While automated reports are in development, you can access your data through these options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full sm:w-auto">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Dashboard
                </Button>
              </Link>
              <Link href="/pattern-analysis">
                <Button variant="outline" className="w-full sm:w-auto">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Pattern Analysis
                </Button>
              </Link>
              <Link href="/debug">
                <Button variant="outline" className="w-full sm:w-auto">
                  <FileText className="h-4 w-4 mr-2" />
                  Debug Panel
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              You can also export data directly from the Meta Ads Manager or use the debug panel to test API endpoints.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}