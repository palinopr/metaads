"use client"

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  AlertCircle, 
  Home, 
  ArrowLeft, 
  Search,
  BarChart3,
  Bug,
  Settings
} from "lucide-react"

export default function NotFound() {
  const suggestedRoutes = [
    {
      href: "/",
      title: "Dashboard",
      description: "Main Meta Ads dashboard",
      icon: <Home className="h-5 w-5" />
    },
    {
      href: "/pattern-analysis",
      title: "Pattern Analysis",
      description: "AI-powered campaign insights",
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      href: "/dashboard",
      title: "Advanced Dashboard",
      description: "Detailed campaign management",
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      href: "/simple-dashboard",
      title: "Simple Dashboard",
      description: "Simplified campaign overview",
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      href: "/debug",
      title: "Debug Panel",
      description: "API debugging and testing",
      icon: <Bug className="h-5 w-5" />
    }
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Error Icon and Title */}
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">404</h1>
            <h2 className="text-2xl font-semibold text-foreground mt-2">Page Not Found</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved. 
              Let's get you back to the right place.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Suggested Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Suggested Pages
            </CardTitle>
            <CardDescription>
              Here are some pages you might be looking for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {suggestedRoutes.map((route) => (
                <Link key={route.href} href={route.href}>
                  <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                    <div className="p-2 rounded-md bg-primary/10">
                      {route.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">{route.title}</h3>
                      <p className="text-sm text-muted-foreground">{route.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground">
          <p>
            If you believe this is an error, please{" "}
            <Link href="/debug" className="text-primary hover:underline">
              check the debug panel
            </Link>{" "}
            or contact support.
          </p>
        </div>
      </div>
    </div>
  )
}